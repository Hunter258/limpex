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
    const bcrypt = require('bcryptjs');
    
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
            await pool.query('DROP TABLE IF EXISTS order_items CASCADE');
            await pool.query('DROP TABLE IF EXISTS delivery_tracking CASCADE');
            await pool.query('DROP TABLE IF EXISTS orders CASCADE');
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
                price DECIMAL(10,2) NOT NULL, unit VARCHAR(20) DEFAULT 'kg',
                stock_quantity INTEGER DEFAULT 0, origin_country VARCHAR(100),
                is_organic BOOLEAN DEFAULT false, is_available BOOLEAN DEFAULT true,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            await pool.query('CREATE INDEX idx_products_category ON products(category_id)');
            await pool.query('CREATE INDEX idx_products_available ON products(is_available)');

            await pool.query(`CREATE TABLE orders (
                id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id),
                customer_name VARCHAR(255) NOT NULL, customer_email VARCHAR(255),
                customer_phone VARCHAR(20), delivery_address TEXT NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL, status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50) DEFAULT 'cod', payment_id VARCHAR(255),
                notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            await pool.query(`CREATE TABLE order_items (
                id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id), product_name VARCHAR(255) NOT NULL,
                quantity INTEGER NOT NULL, price DECIMAL(10,2) NOT NULL, unit VARCHAR(20) DEFAULT 'kg'
            )`);

            await pool.query(`CREATE TABLE delivery_tracking (
                id SERIAL PRIMARY KEY, order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL, location VARCHAR(255), notes TEXT,
                estimated_delivery TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

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
                [catMap['Indian Fruits'], 'Papaya (Red Lady)', 'Ripe Red Lady papaya', 60, 'kg', 400, 'India', false, 'https://images.unsplash.com/photo-1526435012633-4ac1be22f299?w=400'],
                [catMap['Indian Fruits'], 'Guava (Allahabad)', 'Sweet crunchy Allahabad guava', 80, 'kg', 350, 'India', true, 'https://images.unsplash.com/photo-1596591868231-05e882a39b1f?w=400'],
                [catMap['Indian Fruits'], 'Pomegranate (Bhagwa)', 'Premium Bhagwa pomegranate', 180, 'kg', 400, 'India', true, 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400'],
                [catMap['Indian Fruits'], 'Sweet Lime (Mosambi)', 'Juicy sweet lime for fresh juice', 70, 'kg', 500, 'India', false, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400'],
                [catMap['Indian Fruits'], 'Watermelon (Sharbati)', 'Sweet Sharbati watermelon', 35, 'kg', 600, 'India', false, 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400'],
                [catMap['Indian Fruits'], 'Grapes (Thompson)', 'Seedless Thompson grapes', 120, 'kg', 350, 'India', true, 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400'],
                [catMap['Indian Fruits'], 'Pineapple (Queen)', 'Sweet Queen pineapple from Kerala', 50, 'piece', 300, 'India', false, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400'],
                [catMap['Indian Fruits'], 'Custard Apple (Sitaphal)', 'Creamy sweet custard apple', 200, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'],

                [catMap['International Fruits'], 'Apple (Shimla)', 'Crisp Shimla apples from Himachal', 250, 'kg', 600, 'Himachal', false, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400'],
                [catMap['International Fruits'], 'Kiwi (Zespri)', 'Premium Zespri green kiwifruit', 350, 'kg', 250, 'New Zealand', true, 'https://images.unsplash.com/photo-1585059895524-72359e06138a?w=400'],
                [catMap['International Fruits'], 'Avocado (Hass)', 'Creamy Hass avocados', 400, 'kg', 200, 'Mexico', true, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400'],
                [catMap['International Fruits'], 'Dragon Fruit (Red)', 'Vibrant red dragon fruit', 350, 'kg', 150, 'Vietnam', true, 'https://images.unsplash.com/photo-1527325687032-427c14f7d1c0?w=400'],
                [catMap['International Fruits'], 'Cherry (NZ Lapin)', 'Sweet Lapin cherries from NZ', 800, 'box', 100, 'New Zealand', true, 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'],
                [catMap['International Fruits'], 'Blueberry (Organic)', 'Fresh organic blueberries', 600, 'box', 120, 'USA', true, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400'],
                [catMap['International Fruits'], 'Strawberry (Camarosa)', 'Sweet Camarosa strawberries', 300, 'kg', 200, 'Mahabaleshwar', true, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400'],
                [catMap['International Fruits'], 'Plum (Red)', 'Sweet juicy red plums', 250, 'kg', 180, 'USA', false, 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400'],
                [catMap['International Fruits'], 'Fig (Anjeer)', 'Premium dried figs from Turkey', 500, 'kg', 150, 'Turkey', true, 'https://images.unsplash.com/photo-1585059895524-72359e06138a?w=400'],
                [catMap['International Fruits'], 'Pears (Packham)', 'Juicy Packham pears', 200, 'kg', 300, 'South Africa', false, 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=400'],

                [catMap['Exotic Fruits'], 'Rambutan', 'Exotic hairy fruit from Malaysia', 400, 'kg', 100, 'Malaysia', true, 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'],
                [catMap['Exotic Fruits'], 'Mangosteen', 'Queen of fruits from Thailand', 600, 'kg', 80, 'Thailand', true, 'https://images.unsplash.com/photo-1527325687032-427c14f7d1c0?w=400'],
                [catMap['Exotic Fruits'], 'Passion Fruit', 'Tropical passion fruit from Brazil', 300, 'kg', 120, 'Brazil', true, 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'],
                [catMap['Exotic Fruits'], 'Lychee (Rose)', 'Fragrant rose lychees from Bihar', 250, 'kg', 200, 'Bihar', true, 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400'],
                [catMap['Exotic Fruits'], 'Jackfruit (Varikka)', 'Crisp Varikka jackfruit from Kerala', 80, 'kg', 150, 'Kerala', false, 'https://images.unsplash.com/photo-1568702846914-96b305d2ead1?w=400'],
                [catMap['Exotic Fruits'], 'Sapodilla (Chikoo)', 'Sweet grainy chikoo', 150, 'kg', 200, 'Maharashtra', true, 'https://images.unsplash.com/photo-1526435012633-4ac1be22f299?w=400'],
                [catMap['Exotic Fruits'], 'Star Fruit (Carambola)', 'Beautiful star-shaped fruit from Goa', 200, 'kg', 100, 'Goa', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
                [catMap['Exotic Fruits'], 'Mulberry', 'Sweet dark mulberries from Himachal', 350, 'kg', 80, 'Himachal', true, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400'],

                [catMap['Indian Vegetables'], 'Potato (Kufri Jyoti)', 'Premium Kufri Jyoti potatoes', 35, 'kg', 1200, 'India', false, 'https://images.unsplash.com/photo-1518977676601-b53f82d49098?w=400'],
                [catMap['Indian Vegetables'], 'Tomato (Hybrid)', 'Fresh hybrid tomatoes', 45, 'kg', 1000, 'India', true, 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400'],
                [catMap['Indian Vegetables'], 'Onion (Nashik Red)', 'Premium Nashik red onions', 30, 'kg', 1500, 'India', false, 'https://images.unsplash.com/photo-1618512496248-a07fe8398f9d?w=400'],
                [catMap['Indian Vegetables'], 'Spinach (Palak)', 'Fresh spinach rich in iron', 25, 'bunch', 500, 'India', true, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'],
                [catMap['Indian Vegetables'], 'Cauliflower (Pusa)', 'Fresh Pusa variety cauliflower', 60, 'kg', 400, 'India', false, 'https://images.unsplash.com/photo-1568702846914-96b305d2ead1?w=400'],
                [catMap['Indian Vegetables'], 'Bitter Gourd (Karela)', 'Organic bitter gourd', 80, 'kg', 300, 'India', true, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],
                [catMap['Indian Vegetables'], 'Bottle Gourd (Lauki)', 'Fresh bottle gourd', 40, 'kg', 400, 'India', false, 'https://images.unsplash.com/photo-1587411768515-eeac0647deed?w=400'],
                [catMap['Indian Vegetables'], 'Ridge Gourd (Turai)', 'Tender ridge gourd', 50, 'kg', 350, 'India', true, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],
                [catMap['Indian Vegetables'], 'Drumstick (Moringa)', 'Fresh moringa drumsticks', 100, 'kg', 250, 'South India', true, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'],
                [catMap['Indian Vegetables'], 'Okra (Bhindi)', 'Tender green okra', 60, 'kg', 500, 'India', false, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],

                [catMap['International Vegetables'], 'Broccoli (Green)', 'Fresh organic broccoli florets', 120, 'kg', 250, 'India', true, 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400'],
                [catMap['International Vegetables'], 'Zucchini (Green)', 'Italian green zucchini', 100, 'kg', 200, 'Italy', true, 'https://images.unsplash.com/photo-1563281746-48b9dba2ddb4?w=400'],
                [catMap['International Vegetables'], 'Sweet Corn', 'Fresh sweet corn on the cob', 80, 'piece', 400, 'USA', false, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400'],
                [catMap['International Vegetables'], 'Bell Pepper (Red)', 'Vibrant red bell peppers', 150, 'kg', 300, 'Netherlands', true, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400'],
                [catMap['International Vegetables'], 'Cherry Tomato', 'Sweet cherry tomatoes on vine', 200, 'box', 250, 'Netherlands', true, 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400'],
                [catMap['International Vegetables'], 'Lettuce (Iceberg)', 'Crisp iceberg lettuce', 80, 'piece', 300, 'India', true, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400'],
                [catMap['International Vegetables'], 'Mushroom (Button)', 'Fresh white button mushrooms', 150, 'kg', 200, 'India', false, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'],
                [catMap['International Vegetables'], 'Cabbage (Green)', 'Fresh green cabbage', 35, 'kg', 600, 'India', false, 'https://images.unsplash.com/photo-1594282486756-7e4b1c2f2b6e?w=400'],

                [catMap['Exotic Vegetables'], 'Asparagus', 'Tender asparagus spears', 200, 'bunch', 100, 'India', true, 'https://images.unsplash.com/photo-1515471209610-dae159334820?w=400'],
                [catMap['Exotic Vegetables'], 'Baby Corn', 'Crisp baby corn', 120, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400'],
                [catMap['Exotic Vegetables'], 'Celery', 'Fresh celery bunches', 60, 'bunch', 150, 'India', true, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400'],
                [catMap['Exotic Vegetables'], 'Red Cabbage', 'Vibrant red cabbage', 80, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1594282486756-7e4b1c2f2b6e?w=400'],
                [catMap['Exotic Vegetables'], 'Zucchini (Yellow)', 'Bright yellow zucchini', 120, 'kg', 150, 'India', true, 'https://images.unsplash.com/photo-1563281746-48b9dba2ddb4?w=400'],
                [catMap['Exotic Vegetables'], 'Kale', 'Nutrient-dense curly kale', 100, 'bunch', 100, 'India', true, 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=400'],
                [catMap['Exotic Vegetables'], 'Leeks', 'Fresh leeks for soups and stews', 150, 'bunch', 80, 'India', true, 'https://images.unsplash.com/photo-1563281746-48b9dba2ddb4?w=400'],
                [catMap['Exotic Vegetables'], 'Turnip', 'Fresh organic turnips', 50, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],

                [catMap['Indian Dry Fruits'], 'Almond (Mamra)', 'Premium Mamra almonds from Kashmir', 1200, 'kg', 300, 'Kashmir', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
                [catMap['Indian Dry Fruits'], 'Cashew (W240)', 'Premium W240 cashews from Goa', 1400, 'kg', 250, 'Goa', true, 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400'],
                [catMap['Indian Dry Fruits'], 'Pistachio (Iranian)', 'Premium Iranian pistachios', 1600, 'kg', 200, 'Iran', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
                [catMap['Indian Dry Fruits'], 'Raisin (Kishmish)', 'Sweet golden kishmish', 400, 'kg', 400, 'Maharashtra', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
                [catMap['Indian Dry Fruits'], 'Walnut (Akhrot)', 'Premium Kashmiri walnuts', 1000, 'kg', 200, 'Kashmir', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
                [catMap['Indian Dry Fruits'], 'Figs (Anjeer)', 'Premium dried figs', 800, 'kg', 150, 'India', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
                [catMap['Indian Dry Fruits'], 'Makhana (Fox Nut)', 'Premium fox nuts from Bihar', 1200, 'kg', 300, 'Bihar', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
                [catMap['Indian Dry Fruits'], 'Dried Cranberries', 'Sweet dried cranberries', 600, 'kg', 150, 'India', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
                [catMap['Indian Dry Fruits'], 'Flax Seeds (Alsi)', 'Organic flax seeds rich in Omega-3', 200, 'kg', 400, 'India', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
                [catMap['Indian Dry Fruits'], 'Chia Seeds', 'Premium chia seeds', 350, 'kg', 300, 'India', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],

                [catMap['International Dry Fruits'], 'Dates (Medjool)', 'Premium Medjool dates from Iran', 800, 'kg', 300, 'Iran', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
                [catMap['International Dry Fruits'], 'Hazelnut', 'Premium Turkish hazelnuts', 1500, 'kg', 120, 'Turkey', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
                [catMap['International Dry Fruits'], 'Brazil Nut', 'Giant Brazil nuts from Amazon', 1800, 'kg', 100, 'Brazil', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
                [catMap['International Dry Fruits'], 'Macadamia', 'Premium Australian macadamias', 2000, 'kg', 80, 'Australia', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
                [catMap['International Dry Fruits'], 'Pecan', 'Premium US pecans', 1600, 'kg', 100, 'USA', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
                [catMap['International Dry Fruits'], 'Pine Nuts (Chilgoza)', 'Premium chilgoza pine nuts', 2500, 'kg', 80, 'Himachal', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
                [catMap['International Dry Fruits'], 'Dried Apricots', 'Sweet dried apricots from Turkey', 700, 'kg', 200, 'Turkey', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
                [catMap['International Dry Fruits'], 'Dried Mango', 'Sun-dried mango from Thailand', 500, 'kg', 150, 'Thailand', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'],
                [catMap['International Dry Fruits'], 'Sunflower Seeds', 'Roasted sunflower seeds', 300, 'kg', 300, 'India', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'],
                [catMap['International Dry Fruits'], 'Pumpkin Seeds', 'Organic pumpkin seeds', 400, 'kg', 250, 'India', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400']
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
        } catch (error) {
            console.error('Product seeding error:', error.message);
        }
    };

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
        const passwordHash = await bcrypt.hash('Admin@123', salt);
        await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role_id)
             VALUES ($1, $2, $3, $4, 1) ON CONFLICT (email) DO NOTHING`,
            ['admin@limpex.com', passwordHash, 'Admin', 'User']
        );
        console.log('Default admin user ready');

        await seedCategoriesAndProducts();
        console.log('Database initialization complete');
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

// Order API endpoints

// Create order (public)
app.post('/api/orders', async (req, res) => {
    try {
        const { customerName, customerEmail, customerPhone, deliveryAddress, items, notes, paymentMethod } = req.body;
        
        if (!customerName || !deliveryAddress || !items || items.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const orderResult = await pool.query(
            `INSERT INTO orders (customer_name, customer_email, customer_phone, delivery_address, total_amount, notes, payment_method)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [customerName, customerEmail || null, customerPhone || null, deliveryAddress, totalAmount, notes || null, paymentMethod || 'cod']
        );
        
        const order = orderResult.rows[0];
        
        for (const item of items) {
            await pool.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, unit)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [order.id, item.productId || null, item.name, item.quantity, item.price, item.unit || 'kg']
            );
        }
        
        // Create initial tracking
        const estimatedDelivery = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days
        await pool.query(
            `INSERT INTO delivery_tracking (order_id, status, notes, estimated_delivery)
             VALUES ($1, 'confirmed', 'Order placed successfully', $2)`,
            [order.id, estimatedDelivery]
        );
        
        res.status(201).json({ message: 'Order placed successfully', order });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Track order by ID (public)
app.get('/api/orders/track/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const orderResult = await pool.query(
            `SELECT * FROM orders WHERE id = $1`, [id]
        );
        
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const itemsResult = await pool.query(
            `SELECT * FROM order_items WHERE order_id = $1`, [id]
        );
        
        const trackingResult = await pool.query(
            `SELECT * FROM delivery_tracking WHERE order_id = $1 ORDER BY created_at DESC`, [id]
        );
        
        res.json({
            order: orderResult.rows[0],
            items: itemsResult.rows,
            tracking: trackingResult.rows
        });
    } catch (error) {
        console.error('Track order error:', error);
        res.status(500).json({ error: 'Failed to track order' });
    }
});

// Get all orders (admin)
app.get('/api/orders', async (req, res) => {
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
            SELECT o.*, 
                   (SELECT json_agg(json_build_object('product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price, 'unit', oi.unit))
                    FROM order_items oi WHERE oi.order_id = o.id) as items,
                   (SELECT json_build_object('status', dt.status, 'location', dt.location, 'estimated_delivery', dt.estimated_delivery, 'created_at', dt.created_at)
                    FROM delivery_tracking dt WHERE dt.order_id = o.id ORDER BY dt.created_at DESC LIMIT 1) as latest_tracking
            FROM orders o
            ORDER BY o.created_at DESC
        `);
        
        res.json({ orders: result.rows });
    } catch (error) {
        console.error('Get orders error:', error);
        res.json({ orders: [] });
    }
});

// Update order status (admin)
app.put('/api/orders/:id/status', async (req, res) => {
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
        
        const { id } = req.params;
        const { status, location, notes } = req.body;
        
        await pool.query(
            `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [status, id]
        );
        
        await pool.query(
            `INSERT INTO delivery_tracking (order_id, status, location, notes) VALUES ($1, $2, $3, $4)`,
            [id, status, location || null, notes || null]
        );
        
        res.json({ message: 'Order status updated' });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Delete order (admin)
app.delete('/api/orders/:id', async (req, res) => {
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
        
        const { id } = req.params;
        await pool.query('DELETE FROM orders WHERE id = $1', [id]);
        res.json({ message: 'Order deleted' });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// Serve static files in production
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start server - listen FIRST, then init database
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initDatabase();
});
