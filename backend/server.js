const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const pool = require('./config/database');
const { createRazorpayOrder, verifyRazorpayPayment } = require('./services/payment');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('./services/email');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is required');
    process.exit(1);
}

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'https://limpex-production.up.railway.app'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.includes('.up.railway.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, please try again after 15 minutes.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const result = await pool.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.role_id, u.is_active, r.name as role_name
             FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1 AND u.is_active = true`,
            [decoded.userId]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }
        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (roles.length > 0 && !roles.includes(req.user.role_name)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '').trim();
};

const validateEmail = (email) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePhone = (phone) => {
    if (!phone) return true;
    return /^[+]?[\d\s\-()]{7,15}$/.test(phone);
};

const initDatabase = async () => {
    try {
        console.log('Initializing database...');
        const schemaPath = path.join(__dirname, '../database/migrations/001_initial_schema.sql');
        if (fs.existsSync(schemaPath)) {
            try {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                await pool.query(schema);
                console.log('Main schema created');
            } catch (e) {
                console.log('Schema migration note:', e.message);
            }
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', salt);
        await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role_id)
             VALUES ($1, $2, $3, $4, 1) ON CONFLICT (email) DO NOTHING`,
            [process.env.ADMIN_EMAIL || 'admin@limpex.com', passwordHash, 'Admin', 'User']
        );
        console.log('Default admin user ready');

        await seedCategoriesAndProducts();
        await createAdditionalTables();
        console.log('Database initialization complete');
    } catch (error) {
        console.error('Database init error:', error.message);
    }
};

const createAdditionalTables = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY, user_id UUID REFERENCES users(id),
            customer_name VARCHAR(255) NOT NULL, customer_email VARCHAR(255),
            customer_phone VARCHAR(20), delivery_address TEXT NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL, status VARCHAR(50) DEFAULT 'pending',
            payment_method VARCHAR(50) DEFAULT 'cod', payment_id VARCHAR(255),
            delivery_estimate VARCHAR(100), notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id), product_name VARCHAR(255) NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0), price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
            unit VARCHAR(20) DEFAULT 'kg'
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS delivery_tracking (
            id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
            status VARCHAR(50) NOT NULL, location VARCHAR(255), notes TEXT,
            estimated_delivery TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_estimate VARCHAR(100)`);
        await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255)`);
        await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID`);
    } catch (e) {
        console.log('Additional tables note:', e.message);
    }
};

const seedCategoriesAndProducts = async () => {
    try {
        const check = await pool.query('SELECT COUNT(*) FROM products');
        if (parseInt(check.rows[0].count) > 0) {
            console.log('Products already seeded, skipping');
            return;
        }
    } catch (e) {
        console.log('Products table empty or missing, seeding...');
    }

    try {
        await pool.query('DROP TABLE IF EXISTS products CASCADE');
        await pool.query('DROP TABLE IF EXISTS categories CASCADE');

        await pool.query(`CREATE TABLE categories (
            id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL,
            type VARCHAR(50) NOT NULL, parent_category VARCHAR(50) NOT NULL,
            description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await pool.query(`CREATE TABLE products (
            id SERIAL PRIMARY KEY,
            category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL UNIQUE, description TEXT,
            price DECIMAL(10,2) NOT NULL CHECK (price >= 0), unit VARCHAR(20) DEFAULT 'kg',
            stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
            origin_country VARCHAR(100),
            is_organic BOOLEAN DEFAULT false, is_available BOOLEAN DEFAULT true,
            image_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await pool.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_products_organic ON products(is_organic)');

        await pool.query(`CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ language 'plpgsql'`);

        await pool.query(`DROP TRIGGER IF EXISTS update_products_updated_at ON products`);
        await pool.query(`CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);

        await pool.query(`CREATE OR REPLACE FUNCTION update_orders_updated_at()
        RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ language 'plpgsql'`);

        await pool.query(`DROP TRIGGER IF EXISTS update_orders_updated_at ON orders`);
        await pool.query(`CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
            FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at()`);

        console.log('Tables created, seeding categories...');

        const cats = [
            ['Indian Fruits', 'indian', 'fruits', 'Fresh fruits from India'],
            ['International Fruits', 'international', 'fruits', 'Imported fruits from around the world'],
            ['Exotic Fruits', 'exotic', 'fruits', 'Rare and exotic fruits'],
            ['Indian Vegetables', 'indian', 'vegetables', 'Fresh vegetables from India'],
            ['International Vegetables', 'international', 'vegetables', 'Imported vegetables from around the world'],
            ['Exotic Vegetables', 'exotic', 'vegetables', 'Rare and exotic vegetables'],
            ['Indian Dry Fruits', 'indian', 'dry_fruits', 'Premium dry fruits from India'],
            ['International Dry Fruits', 'international', 'dry_fruits', 'Imported dry fruits from around the world']
        ];

        for (const c of cats) {
            await pool.query('INSERT INTO categories (name, type, parent_category, description) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', c);
        }
        console.log('8 categories seeded');

        const catMap = {};
        const catRows = await pool.query('SELECT id, name FROM categories');
        catRows.rows.forEach(r => { catMap[r.name] = r.id; });

        const products = [
            [catMap['Indian Fruits'], 'Alphonso Mango (Hapus)', 'Premium Alphonso mangoes from Ratnagiri', 350, 'kg', 500, 'India', true, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400'],
            [catMap['Indian Fruits'], 'Banana (Robusta)', 'Fresh sweet Robusta bananas', 45, 'kg', 800, 'India', true, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'],
            [catMap['Indian Fruits'], 'Papaya (Red Lady)', 'Ripe Red Lady papaya', 60, 'kg', 400, 'India', false, 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400'],
            [catMap['Indian Fruits'], 'Guava (Allahabad)', 'Sweet crunchy Allahabad guava', 80, 'kg', 350, 'India', true, 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400'],
            [catMap['Indian Fruits'], 'Pomegranate (Bhagwa)', 'Premium Bhagwa pomegranate', 180, 'kg', 400, 'India', true, 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400'],
            [catMap['Indian Fruits'], 'Sweet Lime (Mosambi)', 'Juicy sweet lime for fresh juice', 70, 'kg', 500, 'India', false, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400'],
            [catMap['Indian Fruits'], 'Watermelon (Sharbati)', 'Sweet Sharbati watermelon', 35, 'kg', 600, 'India', false, 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400'],
            [catMap['Indian Fruits'], 'Grapes (Thompson)', 'Seedless Thompson grapes', 120, 'kg', 350, 'India', true, 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400'],
            [catMap['Indian Fruits'], 'Pineapple (Queen)', 'Sweet Queen pineapple from Kerala', 50, 'piece', 300, 'India', false, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400'],
            [catMap['Indian Fruits'], 'Custard Apple (Sitaphal)', 'Creamy sweet custard apple', 200, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'],

            [catMap['International Fruits'], 'Apple (Shimla)', 'Crisp Shimla apples from Himachal', 250, 'kg', 600, 'Himachal', false, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400'],
            [catMap['International Fruits'], 'Kiwi (Zespri)', 'Premium Zespri green kiwifruit', 350, 'kg', 250, 'New Zealand', true, 'https://images.unsplash.com/photo-1482012792084-a0c3725f289f?w=400'],
            [catMap['International Fruits'], 'Avocado (Hass)', 'Creamy Hass avocados', 400, 'kg', 200, 'Mexico', true, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400'],
            [catMap['International Fruits'], 'Dragon Fruit (Red)', 'Vibrant red dragon fruit', 350, 'kg', 150, 'Vietnam', true, 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=400'],
            [catMap['International Fruits'], 'Cherry (NZ Lapin)', 'Sweet Lapin cherries from NZ', 800, 'box', 100, 'New Zealand', true, 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'],
            [catMap['International Fruits'], 'Blueberry (Organic)', 'Fresh organic blueberries', 600, 'box', 120, 'USA', true, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400'],
            [catMap['International Fruits'], 'Strawberry (Camarosa)', 'Sweet Camarosa strawberries', 300, 'kg', 200, 'Mahabaleshwar', true, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400'],
            [catMap['International Fruits'], 'Plum (Red)', 'Sweet juicy red plums', 250, 'kg', 180, 'USA', false, 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400'],
            [catMap['International Fruits'], 'Fig (Anjeer)', 'Premium dried figs from Turkey', 500, 'kg', 150, 'Turkey', true, 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400'],
            [catMap['International Fruits'], 'Pears (Packham)', 'Juicy Packham pears', 200, 'kg', 300, 'South Africa', false, 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=400'],

            [catMap['Exotic Fruits'], 'Rambutan', 'Exotic hairy fruit from Malaysia', 400, 'kg', 100, 'Malaysia', true, 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'],
            [catMap['Exotic Fruits'], 'Mangosteen', 'Queen of fruits from Thailand', 600, 'kg', 80, 'Thailand', true, 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400'],
            [catMap['Exotic Fruits'], 'Passion Fruit', 'Tropical passion fruit from Brazil', 300, 'kg', 120, 'Brazil', true, 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'],
            [catMap['Exotic Fruits'], 'Lychee (Rose)', 'Fragrant rose lychees from Bihar', 250, 'kg', 200, 'Bihar', true, 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400'],
            [catMap['Exotic Fruits'], 'Jackfruit (Varikka)', 'Crisp Varikka jackfruit from Kerala', 80, 'kg', 150, 'Kerala', false, 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400'],
            [catMap['Exotic Fruits'], 'Sapodilla (Chikoo)', 'Sweet grainy chikoo', 150, 'kg', 200, 'Maharashtra', true, 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400'],
            [catMap['Exotic Fruits'], 'Star Fruit (Carambola)', 'Beautiful star-shaped fruit from Goa', 200, 'kg', 100, 'Goa', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
            [catMap['Exotic Fruits'], 'Mulberry', 'Sweet dark mulberries from Himachal', 350, 'kg', 80, 'Himachal', true, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400'],

            [catMap['Indian Vegetables'], 'Potato (Kufri Jyoti)', 'Premium Kufri Jyoti potatoes', 35, 'kg', 1200, 'India', false, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400'],
            [catMap['Indian Vegetables'], 'Tomato (Hybrid)', 'Fresh hybrid tomatoes', 45, 'kg', 1000, 'India', true, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'],
            [catMap['Indian Vegetables'], 'Onion (Nashik Red)', 'Premium Nashik red onions', 30, 'kg', 1500, 'India', false, 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400'],
            [catMap['Indian Vegetables'], 'Spinach (Palak)', 'Fresh spinach rich in iron', 25, 'bunch', 500, 'India', true, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'],
            [catMap['Indian Vegetables'], 'Cauliflower (Pusa)', 'Fresh Pusa variety cauliflower', 60, 'kg', 400, 'India', false, 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400'],
            [catMap['Indian Vegetables'], 'Bitter Gourd (Karela)', 'Organic bitter gourd', 80, 'kg', 300, 'India', true, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],
            [catMap['Indian Vegetables'], 'Bottle Gourd (Lauki)', 'Fresh bottle gourd', 40, 'kg', 400, 'India', false, 'https://images.unsplash.com/photo-1587411768515-eeac0647deed?w=400'],
            [catMap['Indian Vegetables'], 'Ridge Gourd (Turai)', 'Tender ridge gourd', 50, 'kg', 350, 'India', true, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],
            [catMap['Indian Vegetables'], 'Drumstick (Moringa)', 'Fresh moringa drumsticks', 100, 'kg', 250, 'South India', true, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'],
            [catMap['Indian Vegetables'], 'Okra (Bhindi)', 'Tender green okra', 60, 'kg', 500, 'India', false, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],

            [catMap['International Vegetables'], 'Broccoli (Green)', 'Fresh organic broccoli florets', 120, 'kg', 250, 'India', true, 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400'],
            [catMap['International Vegetables'], 'Zucchini (Green)', 'Italian green zucchini', 100, 'kg', 200, 'Italy', true, 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400'],
            [catMap['International Vegetables'], 'Sweet Corn', 'Fresh sweet corn on the cob', 80, 'piece', 400, 'USA', false, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400'],
            [catMap['International Vegetables'], 'Bell Pepper (Red)', 'Vibrant red bell peppers', 150, 'kg', 300, 'Netherlands', true, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400'],
            [catMap['International Vegetables'], 'Cherry Tomato', 'Sweet cherry tomatoes on vine', 200, 'box', 250, 'Netherlands', true, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'],
            [catMap['International Vegetables'], 'Lettuce (Iceberg)', 'Crisp iceberg lettuce', 80, 'piece', 300, 'India', true, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400'],
            [catMap['International Vegetables'], 'Mushroom (Button)', 'Fresh white button mushrooms', 150, 'kg', 200, 'India', false, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'],
            [catMap['International Vegetables'], 'Cabbage (Green)', 'Fresh green cabbage', 35, 'kg', 600, 'India', false, 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400'],

            [catMap['Exotic Vegetables'], 'Asparagus', 'Tender asparagus spears', 200, 'bunch', 100, 'India', true, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400'],
            [catMap['Exotic Vegetables'], 'Baby Corn', 'Crisp baby corn', 120, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400'],
            [catMap['Exotic Vegetables'], 'Celery', 'Fresh celery bunches', 60, 'bunch', 150, 'India', true, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400'],
            [catMap['Exotic Vegetables'], 'Red Cabbage', 'Vibrant red cabbage', 80, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400'],
            [catMap['Exotic Vegetables'], 'Zucchini (Yellow)', 'Bright yellow zucchini', 120, 'kg', 150, 'India', true, 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400'],
            [catMap['Exotic Vegetables'], 'Kale', 'Nutrient-dense curly kale', 100, 'bunch', 100, 'India', true, 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=400'],
            [catMap['Exotic Vegetables'], 'Leeks', 'Fresh leeks for soups and stews', 150, 'bunch', 80, 'India', true, 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400'],
            [catMap['Exotic Vegetables'], 'Turnip', 'Fresh organic turnips', 50, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],

            [catMap['Indian Dry Fruits'], 'Almond (Mamra)', 'Premium Mamra almonds from Kashmir', 1200, 'kg', 300, 'Kashmir', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
            [catMap['Indian Dry Fruits'], 'Cashew (W240)', 'Premium W240 cashews from Goa', 1400, 'kg', 250, 'Goa', true, 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400'],
            [catMap['Indian Dry Fruits'], 'Pistachio (Iranian)', 'Premium Iranian pistachios', 1600, 'kg', 200, 'Iran', true, 'https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?w=400'],
            [catMap['Indian Dry Fruits'], 'Raisin (Kishmish)', 'Sweet golden kishmish', 400, 'kg', 400, 'Maharashtra', true, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400'],
            [catMap['Indian Dry Fruits'], 'Walnut (Akhrot)', 'Premium Kashmiri walnuts', 1000, 'kg', 200, 'Kashmir', true, 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400'],
            [catMap['Indian Dry Fruits'], 'Figs (Anjeer)', 'Premium dried figs', 800, 'kg', 150, 'India', true, 'https://images.unsplash.com/photo-1610448721566-47369c768e70?w=400'],
            [catMap['Indian Dry Fruits'], 'Makhana (Fox Nut)', 'Premium fox nuts from Bihar', 1200, 'kg', 300, 'Bihar', true, 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400'],
            [catMap['Indian Dry Fruits'], 'Dried Cranberries', 'Sweet dried cranberries', 600, 'kg', 150, 'India', true, 'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=400'],
            [catMap['Indian Dry Fruits'], 'Flax Seeds (Alsi)', 'Organic flax seeds rich in Omega-3', 200, 'kg', 400, 'India', true, 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400'],
            [catMap['Indian Dry Fruits'], 'Chia Seeds', 'Premium chia seeds', 350, 'kg', 300, 'India', true, 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=400'],

            [catMap['International Dry Fruits'], 'Dates (Medjool)', 'Premium Medjool dates from Iran', 800, 'kg', 300, 'Iran', true, 'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=400'],
            [catMap['International Dry Fruits'], 'Hazelnut', 'Premium Turkish hazelnuts', 1500, 'kg', 120, 'Turkey', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
            [catMap['International Dry Fruits'], 'Brazil Nut', 'Giant Brazil nuts from Amazon', 1800, 'kg', 100, 'Brazil', true, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400'],
            [catMap['International Dry Fruits'], 'Macadamia', 'Premium Australian macadamias', 2000, 'kg', 80, 'Australia', true, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400'],
            [catMap['International Dry Fruits'], 'Pecan', 'Premium US pecans', 1600, 'kg', 100, 'USA', true, 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400'],
            [catMap['International Dry Fruits'], 'Pine Nuts (Chilgoza)', 'Premium chilgoza pine nuts', 2500, 'kg', 80, 'Himachal', true, 'https://images.unsplash.com/photo-1610448721566-47369c768e70?w=400'],
            [catMap['International Dry Fruits'], 'Dried Apricots', 'Sweet dried apricots from Turkey', 700, 'kg', 200, 'Turkey', true, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400'],
            [catMap['International Dry Fruits'], 'Dried Mango', 'Sun-dried mango from Thailand', 500, 'kg', 150, 'Thailand', true, 'https://images.unsplash.com/photo-1563746098251-d35aef196e83?w=400'],
            [catMap['International Dry Fruits'], 'Sunflower Seeds', 'Roasted sunflower seeds', 300, 'kg', 300, 'India', true, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400'],
            [catMap['International Dry Fruits'], 'Pumpkin Seeds', 'Organic pumpkin seeds', 400, 'kg', 250, 'India', true, 'https://images.unsplash.com/photo-1563746098251-d35aef196e83?w=400']
        ];

        let seeded = 0;
        for (const p of products) {
            try {
                await pool.query(
                    'INSERT INTO products (category_id, name, description, price, unit, stock_quantity, origin_country, is_organic, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (name) DO NOTHING',
                    p
                );
                seeded++;
            } catch (e) {
                console.error('Seed product failed:', p[1], e.message);
            }
        }
        console.log(`Seeded ${seeded} of ${products.length} products`);

        console.log('Updating product image URLs...');
        const imageUpdates = [
            ['Alphonso Mango (Hapus)', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400'],
            ['Banana (Robusta)', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'],
            ['Papaya (Red Lady)', 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400'],
            ['Guava (Allahabad)', 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400'],
            ['Pomegranate (Bhagwa)', 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400'],
            ['Sweet Lime (Mosambi)', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400'],
            ['Watermelon (Sharbati)', 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400'],
            ['Grapes (Thompson)', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400'],
            ['Pineapple (Queen)', 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400'],
            ['Custard Apple (Sitaphal)', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'],
            ['Apple (Shimla)', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400'],
            ['Kiwi (Zespri)', 'https://images.unsplash.com/photo-1482012792084-a0c3725f289f?w=400'],
            ['Avocado (Hass)', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400'],
            ['Dragon Fruit (Red)', 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=400'],
            ['Cherry (NZ Lapin)', 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'],
            ['Blueberry (Organic)', 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400'],
            ['Strawberry (Camarosa)', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400'],
            ['Plum (Red)', 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400'],
            ['Fig (Anjeer)', 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400'],
            ['Pears (Packham)', 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=400'],
            ['Rambutan', 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'],
            ['Mangosteen', 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400'],
            ['Passion Fruit', 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'],
            ['Lychee (Rose)', 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400'],
            ['Jackfruit (Varikka)', 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400'],
            ['Sapodilla (Chikoo)', 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400'],
            ['Star Fruit (Carambola)', 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
            ['Mulberry', 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400'],
            ['Potato (Kufri Jyoti)', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400'],
            ['Tomato (Hybrid)', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'],
            ['Onion (Nashik Red)', 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400'],
            ['Spinach (Palak)', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'],
            ['Cauliflower (Pusa)', 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400'],
            ['Bitter Gourd (Karela)', 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],
            ['Bottle Gourd (Lauki)', 'https://images.unsplash.com/photo-1587411768515-eeac0647deed?w=400'],
            ['Ridge Gourd (Turai)', 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],
            ['Drumstick (Moringa)', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'],
            ['Okra (Bhindi)', 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],
            ['Broccoli (Green)', 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400'],
            ['Zucchini (Green)', 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400'],
            ['Sweet Corn', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400'],
            ['Bell Pepper (Red)', 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400'],
            ['Cherry Tomato', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'],
            ['Lettuce (Iceberg)', 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400'],
            ['Mushroom (Button)', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'],
            ['Cabbage (Green)', 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400'],
            ['Asparagus', 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400'],
            ['Baby Corn', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400'],
            ['Celery', 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400'],
            ['Red Cabbage', 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400'],
            ['Zucchini (Yellow)', 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400'],
            ['Kale', 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=400'],
            ['Leeks', 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400'],
            ['Turnip', 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],
            ['Almond (Mamra)', 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
            ['Cashew (W240)', 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400'],
            ['Pistachio (Iranian)', 'https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?w=400'],
            ['Raisin (Kishmish)', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400'],
            ['Walnut (Akhrot)', 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400'],
            ['Figs (Anjeer)', 'https://images.unsplash.com/photo-1610448721566-47369c768e70?w=400'],
            ['Makhana (Fox Nut)', 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400'],
            ['Dried Cranberries', 'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=400'],
            ['Flax Seeds (Alsi)', 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400'],
            ['Chia Seeds', 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=400'],
            ['Dates (Medjool)', 'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=400'],
            ['Hazelnut', 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
            ['Brazil Nut', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400'],
            ['Macadamia', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400'],
            ['Pecan', 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400'],
            ['Pine Nuts (Chilgoza)', 'https://images.unsplash.com/photo-1610448721566-47369c768e70?w=400'],
            ['Dried Apricots', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400'],
            ['Dried Mango', 'https://images.unsplash.com/photo-1563746098251-d35aef196e83?w=400'],
            ['Sunflower Seeds', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400'],
            ['Pumpkin Seeds', 'https://images.unsplash.com/photo-1563746098251-d35aef196e83?w=400']
        ];
        let updated = 0;
        for (const [name, url] of imageUpdates) {
            try {
                const r = await pool.query('UPDATE products SET image_url = $1 WHERE name = $2', [url, name]);
                if (r.rowCount > 0) updated++;
            } catch (e) { /* skip */ }
        }
        console.log(`Updated ${updated} product image URLs`);
    } catch (error) {
        console.error('Product seeding error:', error.message);
    }
};

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.originalUrl !== '/api/health') {
            console.log(JSON.stringify({
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}ms`
            }));
        }
    });
    next();
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.post('/api/auth/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const result = await pool.query(
            `SELECT u.*, r.name as role_name
             FROM users u JOIN roles r ON u.role_id = r.id
             WHERE u.email = $1 AND u.is_active = true`,
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role_name
            },
            token,
            refreshToken
        });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/register', async (req, res, next) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role_id)
             VALUES ($1, $2, $3, $4, 4)
             RETURNING id, email, first_name, last_name`,
            [email.toLowerCase().trim(), passwordHash, sanitizeString(firstName) || null, sanitizeString(lastName) || null]
        );

        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Registration successful',
            user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: 'user' },
            token,
            refreshToken
        });
    } catch (error) {
        next(error);
    }
});

app.get('/api/auth/profile', authenticate, (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            email: req.user.email,
            firstName: req.user.first_name,
            lastName: req.user.last_name,
            role: req.user.role_name
        }
    });
});

app.get('/api/products', async (req, res, next) => {
    try {
        const { category, type, search, organic, sort = 'name', page = 1, limit = 20 } = req.query;
        const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
        const offset = (Math.max(parseInt(page) || 1, 1) - 1) * safeLimit;

        let query = `
            SELECT p.*, c.name as category_name, c.type as category_type, c.parent_category
            FROM products p JOIN categories c ON p.category_id = c.id
            WHERE p.is_available = true
        `;
        let countQuery = `SELECT COUNT(*) FROM products p JOIN categories c ON p.category_id = c.id WHERE p.is_available = true`;
        const params = [];
        const countParams = [];
        let paramIndex = 1;
        let countParamIndex = 1;

        if (category) {
            query += ` AND c.parent_category = $${paramIndex++}`;
            params.push(sanitizeString(category));
            countQuery += ` AND c.parent_category = $${countParamIndex++}`;
            countParams.push(sanitizeString(category));
        }
        if (type) {
            query += ` AND c.type = $${paramIndex++}`;
            params.push(sanitizeString(type));
            countQuery += ` AND c.type = $${countParamIndex++}`;
            countParams.push(sanitizeString(type));
        }
        if (organic === 'true') {
            query += ` AND p.is_organic = true`;
            countQuery += ` AND p.is_organic = true`;
        }
        if (search) {
            query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            params.push(`%${sanitizeString(search)}%`);
            countQuery += ` AND (p.name ILIKE $${countParamIndex} OR p.description ILIKE $${countParamIndex})`;
            countParams.push(`%${sanitizeString(search)}%`);
            paramIndex++;
            countParamIndex++;
        }

        const sortOptions = {
            name: 'p.name ASC',
            price_asc: 'p.price ASC',
            price_desc: 'p.price DESC',
            newest: 'p.created_at DESC'
        };
        query += ` ORDER BY ${sortOptions[sort] || 'p.name ASC'}`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(safeLimit, offset);

        const [result, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, countParams)
        ]);

        res.json({
            products: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page) || 1,
                limit: safeLimit,
                pages: Math.ceil(parseInt(countResult.rows[0].count) / safeLimit)
            }
        });
    } catch (error) {
        next(error);
    }
});

app.get('/api/products/categories', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY parent_category, type');
        res.json({ categories: result.rows });
    } catch (error) {
        next(error);
    }
});

app.get('/api/users', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
    try {
        const { search, role, page = 1, limit = 50 } = req.query;
        const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const offset = (Math.max(parseInt(page) || 1, 1) - 1) * safeLimit;

        let query = `
            SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name,
                   u.is_active, u.last_login, u.created_at
            FROM users u JOIN roles r ON u.role_id = r.id WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND (u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
            params.push(`%${sanitizeString(search)}%`);
            paramIndex++;
        }
        if (role) {
            query += ` AND r.name = $${paramIndex++}`;
            params.push(sanitizeString(role));
        }

        query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(safeLimit, offset);

        const result = await pool.query(query, params);
        res.json({ users: result.rows });
    } catch (error) {
        next(error);
    }
});

app.post('/api/orders', async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { customerName, customerEmail, customerPhone, deliveryAddress, items, notes, paymentMethod, payment_id } = req.body;

        if (!customerName || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Name, delivery address, and at least one item are required' });
        }

        if (customerEmail && !validateEmail(customerEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (customerPhone && !validatePhone(customerPhone)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }
        if (deliveryAddress.length < 10) {
            return res.status(400).json({ error: 'Please provide a complete delivery address' });
        }
        if (items.length > 50) {
            return res.status(400).json({ error: 'Maximum 50 items per order' });
        }

        await client.query('BEGIN');

        let totalAmount = 0;
        const validatedItems = [];

        for (const item of items) {
            if (!item.name || !item.quantity || !item.price) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Each item must have name, quantity, and price' });
            }
            const qty = parseInt(item.quantity);
            const price = parseFloat(item.price);
            if (isNaN(qty) || qty <= 0 || qty > 100) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Invalid quantity for ${item.name}` });
            }
            if (isNaN(price) || price <= 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Invalid price for ${item.name}` });
            }

            if (item.productId) {
                const productCheck = await client.query(
                    'SELECT id, price, stock_quantity, name FROM products WHERE id = $1',
                    [item.productId]
                );
                if (productCheck.rows.length > 0) {
                    const product = productCheck.rows[0];
                    if (product.stock_quantity < qty) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}` });
                    }
                    totalAmount += product.price * qty;
                    validatedItems.push({
                        productId: product.id,
                        name: product.name,
                        quantity: qty,
                        price: product.price,
                        unit: item.unit || 'kg'
                    });
                    await client.query(
                        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                        [qty, product.id]
                    );
                    continue;
                }
            }

            totalAmount += price * qty;
            validatedItems.push({
                productId: null,
                name: sanitizeString(item.name),
                quantity: qty,
                price: price,
                unit: item.unit || 'kg'
            });
        }

        const estimatedDelivery = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        const deliveryEstimate = estimatedDelivery.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

        const orderResult = await client.query(
            `INSERT INTO orders (customer_name, customer_email, customer_phone, delivery_address, total_amount, notes, payment_method, payment_id, delivery_estimate)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [sanitizeString(customerName), customerEmail || null, customerPhone || null, sanitizeString(deliveryAddress),
             totalAmount, sanitizeString(notes) || null, paymentMethod || 'cod', payment_id || null, deliveryEstimate]
        );

        const order = orderResult.rows[0];

        for (const item of validatedItems) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, unit) VALUES ($1, $2, $3, $4, $5, $6)`,
                [order.id, item.productId, item.name, item.quantity, item.price, item.unit]
            );
        }

        await client.query(
            `INSERT INTO delivery_tracking (order_id, status, notes, estimated_delivery) VALUES ($1, 'confirmed', 'Order placed successfully', $2)`,
            [order.id, estimatedDelivery]
        );

        await client.query('COMMIT');

        sendOrderConfirmation(order, validatedItems).catch(e => console.error('Order email failed:', e.message));

        res.status(201).json({ message: 'Order placed successfully', order: { ...order, totalAmount } });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

app.get('/api/orders/track/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id);
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const [itemsResult, trackingResult] = await Promise.all([
            pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]),
            pool.query('SELECT * FROM delivery_tracking WHERE order_id = $1 ORDER BY created_at DESC', [orderId])
        ]);

        res.json({
            order: orderResult.rows[0],
            items: itemsResult.rows,
            tracking: trackingResult.rows
        });
    } catch (error) {
        next(error);
    }
});

app.get('/api/orders', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;
        const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const offset = (Math.max(parseInt(page) || 1, 1) - 1) * safeLimit;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            whereClause += ` AND o.status = $${paramIndex++}`;
            params.push(sanitizeString(status));
        }
        if (search) {
            whereClause += ` AND (o.customer_name ILIKE $${paramIndex} OR o.customer_email ILIKE $${paramIndex} OR o.customer_phone ILIKE $${paramIndex} OR CAST(o.id AS TEXT) LIKE $${paramIndex})`;
            params.push(`%${sanitizeString(search)}%`);
            paramIndex++;
        }

        const result = await pool.query(`
            SELECT o.*,
                   (SELECT json_agg(json_build_object('product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price, 'unit', oi.unit))
                    FROM order_items oi WHERE oi.order_id = o.id) as items,
                   (SELECT json_build_object('status', dt.status, 'location', dt.location, 'estimated_delivery', dt.estimated_delivery, 'created_at', dt.created_at)
                    FROM delivery_tracking dt WHERE dt.order_id = o.id ORDER BY dt.created_at DESC LIMIT 1) as latest_tracking
            FROM orders o ${whereClause}
            ORDER BY o.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `, [...params, safeLimit, offset]);

        res.json({ orders: result.rows });
    } catch (error) {
        next(error);
    }
});

app.put('/api/orders/:id/status', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, location, notes } = req.body;
        const orderId = parseInt(id);
        if (isNaN(orderId)) {
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        await pool.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, orderId]);
        await pool.query(
            'INSERT INTO delivery_tracking (order_id, status, location, notes) VALUES ($1, $2, $3, $4)',
            [orderId, status, sanitizeString(location) || null, sanitizeString(notes) || null]
        );

        const orderResult = await pool.query('SELECT customer_name, customer_email, total_amount FROM orders WHERE id = $1', [orderId]);
        if (orderResult.rows.length > 0 && orderResult.rows[0].customer_email) {
            sendOrderStatusUpdate({ ...orderResult.rows[0], id: orderId }, status).catch(e => console.error('Status email failed:', e.message));
        }

        res.json({ message: 'Order status updated' });
    } catch (error) {
        next(error);
    }
});

app.delete('/api/orders/:id', authenticate, authorize('super_admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const orderId = parseInt(id);
        if (isNaN(orderId)) {
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        const order = await pool.query('SELECT status FROM orders WHERE id = $1', [orderId]);
        if (order.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await pool.query('DELETE FROM orders WHERE id = $1', [orderId]);
        res.json({ message: 'Order deleted' });
    } catch (error) {
        next(error);
    }
});

app.get('/api/payments/config', (req, res) => {
    res.json({
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
        configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    });
});

app.post('/api/payments/create-order', authenticate, async (req, res, next) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({ error: 'Online payment is not configured. Please use Cash on Delivery.', configured: false });
        }
        const order = await createRazorpayOrder(amount, `user_${req.user.id}_${Date.now()}`);
        res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (error) {
        next(error);
    }
});

app.post('/api/payments/verify', authenticate, async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment verification fields' });
        }
        const isValid = verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
            return res.status(400).json({ error: 'Payment verification failed' });
        }
        res.json({ verified: true, paymentId: razorpay_payment_id });
    } catch (error) {
        next(error);
    }
});

app.post('/api/contact', async (req, res, next) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (message.length > 2000) {
            return res.status(400).json({ error: 'Message must be under 2000 characters' });
        }
        res.json({ message: 'Thank you for your message. We will get back to you within 24 hours.' });
    } catch (error) {
        next(error);
    }
});

app.use(express.static(path.join(__dirname, '../frontend/build'), {
    maxAge: '1d',
    etag: true
}));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.use((err, req, res, next) => {
    const message = err?.message || err?.toString() || 'Unknown error';
    console.error('Unhandled error:', message, err?.stack || '');
    if (message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'Origin not allowed by CORS' });
    }
    res.status(err?.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : message
    });
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initDatabase();
});

const gracefulShutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(() => {
        pool.end().then(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    });
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});
