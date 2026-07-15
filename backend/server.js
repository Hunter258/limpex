const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const pool = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all in development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database tables
const initDatabase = async () => {
    try {
        console.log('Initializing database...');
        
        const schemaPath = path.join(__dirname, '../database/migrations/001_initial_schema.sql');
        const productsPath = path.join(__dirname, '../database/migrations/002_products_schema.sql');
        
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await pool.query(schema);
            console.log('Main schema created');
        }
        
        if (fs.existsSync(productsPath)) {
            const productsSchema = fs.readFileSync(productsPath, 'utf8');
            await pool.query(productsSchema);
            console.log('Products schema created');
        }
        
        // Create default admin user
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash('Admin@123', salt);
        
        await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role_id)
             VALUES ($1, $2, $3, $4, 1)
             ON CONFLICT (email) DO NOTHING`,
            ['admin@limpex.com', passwordHash, 'Admin', 'User']
        );
        console.log('Default admin user ready');
        
    } catch (error) {
        console.error('Database init error:', error.message);
    }
};

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(JSON.stringify({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`
        }));
    });
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        
        const result = await pool.query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.email = $1 AND u.is_active = true`,
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });
        
        res.json({
            message: 'Login exitoso',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role_name
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email ya registrado' });
        }
        
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role_id) 
             VALUES ($1, $2, $3, $4, 4) 
             RETURNING id, email, first_name, last_name`,
            [email, passwordHash, firstName || null, lastName || null]
        );
        
        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });
        
        res.status(201).json({
            message: 'Registro exitoso',
            user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

app.get('/api/auth/profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        const result = await pool.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name
             FROM users u JOIN roles r ON u.role_id = r.id
             WHERE u.id = $1`,
            [decoded.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        
        const user = result.rows[0];
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role_name
            }
        });
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

// Products routes
app.get('/api/products', async (req, res) => {
    try {
        const { category, type, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT p.*, c.name as category_name, c.type as category_type, c.parent_category
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.is_available = true
        `;
        const params = [];
        let paramIndex = 1;
        
        if (category) {
            query += ` AND c.parent_category = $${paramIndex++}`;
            params.push(category);
        }
        if (type) {
            query += ` AND c.type = $${paramIndex++}`;
            params.push(type);
        }
        if (search) {
            query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        query += ` ORDER BY p.name LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        const countResult = await pool.query('SELECT COUNT(*) FROM products WHERE is_available = true');
        
        res.json({
            products: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        console.error('Products error:', error);
        res.json({ products: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } });
    }
});

app.get('/api/products/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY parent_category, type');
        res.json({ categories: result.rows });
    } catch (error) {
        res.json({ categories: [] });
    }
});

// Users routes (admin only)
app.get('/api/users', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'No autorizado' });
        
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        const userCheck = await pool.query('SELECT role_id FROM users WHERE id = $1', [decoded.userId]);
        if (userCheck.rows[0]?.role_id > 2) {
            return res.status(403).json({ error: 'Sin permisos' });
        }
        
        const result = await pool.query(`
            SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name, 
                   u.is_active, u.last_login, u.created_at
            FROM users u JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `);
        
        res.json({ users: result.rows });
    } catch (error) {
        res.json({ users: [] });
    }
});

// Serve static files in production
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start server
const start = async () => {
    await initDatabase();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

start();
