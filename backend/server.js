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

        // Step 1: Create base schema (users, roles, etc.)
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

        // Step 2: Create default admin user
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

        // Step 3: Drop and recreate categories/products tables fresh
        await pool.query('DROP TABLE IF EXISTS products CASCADE');
        await pool.query('DROP TABLE IF EXISTS categories CASCADE');
        console.log('Dropped old tables');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                type VARCHAR(50) NOT NULL,
                parent_category VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                unit VARCHAR(20) DEFAULT 'kg',
                stock_quantity INTEGER DEFAULT 0,
                origin_country VARCHAR(100),
                is_organic BOOLEAN DEFAULT false,
                is_available BOOLEAN DEFAULT true,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available)');
        console.log('Created categories and products tables');

        // Insert all 8 categories
        await pool.query(`
            INSERT INTO categories (name, type, parent_category, description) VALUES
            ('Indian Fruits', 'indian', 'fruits', 'Fresh fruits from India'),
            ('International Fruits', 'international', 'fruits', 'Imported fruits from around the world'),
            ('Exotic Fruits', 'exotic', 'fruits', 'Rare and exotic fruits'),
            ('Indian Vegetables', 'indian', 'vegetables', 'Fresh vegetables from India'),
            ('International Vegetables', 'international', 'vegetables', 'Imported vegetables from around the world'),
            ('Exotic Vegetables', 'exotic', 'vegetables', 'Rare and exotic vegetables'),
            ('Indian Dry Fruits', 'indian', 'dry_fruits', 'Premium dry fruits from India'),
            ('International Dry Fruits', 'international', 'dry_fruits', 'Imported dry fruits from around the world')
            ON CONFLICT (name) DO NOTHING
        `);
        console.log('8 categories seeded');

        // ========== Indian Fruits (10) ==========
        await pool.query(`
            INSERT INTO products (category_id, name, description, price, unit, stock_quantity, origin_country, is_organic, image_url) VALUES
            ((SELECT id FROM categories WHERE name = 'Indian Fruits'), 'Alphonso Mango (Hapus)', 'Premium Alphonso mangoes from Ratnagiri, Maharashtra - the king of fruits', 350.00, 'kg', 500, 'India', true, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Fruits'), 'Banana (Robusta)', 'Fresh and sweet Robusta bananas, perfect for smoothies and snacking', 45.00, 'kg', 800, 'India', true, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Fruits'), 'Papaya (Red Lady)', 'Ripe Red Lady papaya, rich in antioxidants and enzymes', 60.00, 'kg', 400, 'India', false, 'https://images.unsplash.com/photo-1526435012633-4ac1be22f299?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Fruits'), 'Guava (Allahabad)', 'Sweet and crunchy Allahabad guava, rich in Vitamin C', 80.00, 'kg', 350, 'India', true, 'https://images.unsplash.com/photo-1596591868231-05e882a39b1f?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Fruits'), 'Pomegranate (Bhagwa)', 'Premium Bhagwa pomegranate with deep red arils', 180.00, 'kg', 400, 'India', true, 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Fruits'), 'Sweet Lime (Mosambi)', 'Juicy sweet lime, perfect for fresh juice', 70.00, 'kg', 500, 'India', false, 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Fruits'), 'Watermelon (Sharbati)', 'Sweet Sharbati watermelon, ideal for summer hydration', 35.00, 'kg', 600, 'India', false, 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Fruits'), 'Grapes (Thompson)', 'Seedless Thompson grapes, sweet and crisp', 120.00, 'kg', 350, 'India', true, 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Fruits'), 'Pineapple (Queen)', 'Sweet Queen variety pineapple from Kerala', 50.00, 'piece', 300, 'India', false, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Fruits'), 'Custard Apple (Sitaphal)', 'Creamy and sweet custard apple from Maharashtra', 200.00, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400')
            ON CONFLICT (name) DO UPDATE SET
                description = EXCLUDED.description, price = EXCLUDED.price, unit = EXCLUDED.unit,
                stock_quantity = EXCLUDED.stock_quantity, origin_country = EXCLUDED.origin_country,
                is_organic = EXCLUDED.is_organic, image_url = EXCLUDED.image_url
        `);
        console.log('Indian Fruits seeded');

        // ========== International Fruits (10) ==========
        await pool.query(`
            INSERT INTO products (category_id, name, description, price, unit, stock_quantity, origin_country, is_organic, image_url) VALUES
            ((SELECT id FROM categories WHERE name = 'International Fruits'), 'Apple (Shimla)', 'Crisp Shimla apples from Himachal Pradesh orchards', 250.00, 'kg', 600, 'Himachal', false, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Fruits'), 'Kiwi (Zespri)', 'Premium Zespri green kiwifruit from New Zealand', 350.00, 'kg', 250, 'New Zealand', true, 'https://images.unsplash.com/photo-1585059895524-72359e06138a?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Fruits'), 'Avocado (Hass)', 'Creamy Hass avocados, perfect for guacamole and toast', 400.00, 'kg', 200, 'Mexico', true, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Fruits'), 'Dragon Fruit (Red)', 'Vibrant red dragon fruit with sweet white flesh', 350.00, 'kg', 150, 'Vietnam', true, 'https://images.unsplash.com/photo-1527325687032-427c14f7d1c0?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Fruits'), 'Cherry (NZ Lapin)', 'Sweet Lapin cherries from New Zealand orchards', 800.00, 'box', 100, 'New Zealand', true, 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Fruits'), 'Blueberry (Organic)', 'Fresh organic blueberries, packed with antioxidants', 600.00, 'box', 120, 'USA', true, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Fruits'), 'Strawberry (Camarosa)', 'Sweet Camarosa strawberries from Mahabaleshwar', 300.00, 'kg', 200, 'Mahabaleshwar', true, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Fruits'), 'Plum (Red)', 'Sweet and juicy red plums, great for snacking', 250.00, 'kg', 180, 'USA', false, 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Fruits'), 'Fig (Anjeer)', 'Premium dried figs from Turkey, naturally sweet', 500.00, 'kg', 150, 'Turkey', true, 'https://images.unsplash.com/photo-1585059895524-72359e06138a?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Fruits'), 'Pears (Packham)', 'Juicy Packham pears from South Africa', 200.00, 'kg', 300, 'South Africa', false, 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=400')
            ON CONFLICT (name) DO UPDATE SET
                description = EXCLUDED.description, price = EXCLUDED.price, unit = EXCLUDED.unit,
                stock_quantity = EXCLUDED.stock_quantity, origin_country = EXCLUDED.origin_country,
                is_organic = EXCLUDED.is_organic, image_url = EXCLUDED.image_url
        `);
        console.log('International Fruits seeded');

        // ========== Exotic Fruits (8) ==========
        await pool.query(`
            INSERT INTO products (category_id, name, description, price, unit, stock_quantity, origin_country, is_organic, image_url) VALUES
            ((SELECT id FROM categories WHERE name = 'Exotic Fruits'), 'Rambutan', 'Exotic hairy fruit from Malaysia with sweet translucent flesh', 400.00, 'kg', 100, 'Malaysia', true, 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Fruits'), 'Mangosteen', 'Queen of fruits from Thailand, sweet and tangy', 600.00, 'kg', 80, 'Thailand', true, 'https://images.unsplash.com/photo-1527325687032-427c14f7d1c0?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Fruits'), 'Passion Fruit', 'Tropical passion fruit from Brazil, aromatic and tangy', 300.00, 'kg', 120, 'Brazil', true, 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Fruits'), 'Lychee (Rose)', 'Fragrant rose lychees from Bihar, juicy and sweet', 250.00, 'kg', 200, 'Bihar', true, 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Fruits'), 'Jackfruit (Varikka)', 'Crisp Varikka jackfruit from Kerala, naturally sweet', 80.00, 'kg', 150, 'Kerala', false, 'https://images.unsplash.com/photo-1568702846914-96b305d2ead1?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Fruits'), 'Sapodilla (Chikoo)', 'Sweet and grainy chikoo from Maharashtra orchards', 150.00, 'kg', 200, 'Maharashtra', true, 'https://images.unsplash.com/photo-1526435012633-4ac1be22f299?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Fruits'), 'Star Fruit (Carambola)', 'Beautiful star-shaped fruit from Goa, tangy and crisp', 200.00, 'kg', 100, 'Goa', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Fruits'), 'Mulberry', 'Sweet dark mulberries from Himachal Pradesh hills', 350.00, 'kg', 80, 'Himachal', true, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400')
            ON CONFLICT (name) DO UPDATE SET
                description = EXCLUDED.description, price = EXCLUDED.price, unit = EXCLUDED.unit,
                stock_quantity = EXCLUDED.stock_quantity, origin_country = EXCLUDED.origin_country,
                is_organic = EXCLUDED.is_organic, image_url = EXCLUDED.image_url
        `);
        console.log('Exotic Fruits seeded');

        // ========== Indian Vegetables (10) ==========
        await pool.query(`
            INSERT INTO products (category_id, name, description, price, unit, stock_quantity, origin_country, is_organic, image_url) VALUES
            ((SELECT id FROM categories WHERE name = 'Indian Vegetables'), 'Potato (Kufri Jyoti)', 'Premium Kufri Jyoti potatoes, versatile cooking staple', 35.00, 'kg', 1200, 'India', false, 'https://images.unsplash.com/photo-1518977676601-b53f82ber0a?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Vegetables'), 'Tomato (Hybrid)', 'Fresh hybrid tomatoes, juicy and full of flavour', 45.00, 'kg', 1000, 'India', true, 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Vegetables'), 'Onion (Nashik Red)', 'Premium Nashik red onions, pungent and flavourful', 30.00, 'kg', 1500, 'India', false, 'https://images.unsplash.com/photo-1618512496248-a07fe8398f9d?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Vegetables'), 'Spinach (Palak)', 'Fresh spinach bunches, rich in iron and vitamins', 25.00, 'bunch', 500, 'India', true, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Vegetables'), 'Cauliflower (Pusa)', 'Fresh Pusa variety cauliflower, white and compact', 60.00, 'kg', 400, 'India', false, 'https://images.unsplash.com/photo-1568702846914-96b305d2ead1?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Vegetables'), 'Bitter Gourd (Karela)', 'Organic bitter gourd, known for health benefits', 80.00, 'kg', 300, 'India', true, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Vegetables'), 'Bottle Gourd (Lauki)', 'Fresh bottle gourd, light and easy to cook', 40.00, 'kg', 400, 'India', false, 'https://images.unsplash.com/photo-1587411768515-eeac0647deed?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Vegetables'), 'Ridge Gourd (Turai)', 'Tender ridge gourd, perfect for curries', 50.00, 'kg', 350, 'India', true, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Vegetables'), 'Drumstick (Moringa)', 'Fresh moringa drumsticks from South India', 100.00, 'kg', 250, 'South India', true, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Vegetables'), 'Okra (Bhindi)', 'Tender green okra, ideal for stir-fries and curries', 60.00, 'kg', 500, 'India', false, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400')
            ON CONFLICT (name) DO UPDATE SET
                description = EXCLUDED.description, price = EXCLUDED.price, unit = EXCLUDED.unit,
                stock_quantity = EXCLUDED.stock_quantity, origin_country = EXCLUDED.origin_country,
                is_organic = EXCLUDED.is_organic, image_url = EXCLUDED.image_url
        `);
        console.log('Indian Vegetables seeded');

        // ========== International Vegetables (8) ==========
        await pool.query(`
            INSERT INTO products (category_id, name, description, price, unit, stock_quantity, origin_country, is_organic, image_url) VALUES
            ((SELECT id FROM categories WHERE name = 'International Vegetables'), 'Broccoli (Green)', 'Fresh organic broccoli florets, packed with nutrients', 120.00, 'kg', 250, 'India', true, 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Vegetables'), 'Zucchini (Green)', 'Italian green zucchini, tender and versatile', 100.00, 'kg', 200, 'Italy', true, 'https://images.unsplash.com/photo-1563281746-48b9dba2ddb4?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Vegetables'), 'Sweet Corn', 'Fresh sweet corn on the cob, juicy and tender', 80.00, 'piece', 400, 'USA', false, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Vegetables'), 'Bell Pepper (Red)', 'Vibrant red bell peppers, sweet and crunchy', 150.00, 'kg', 300, 'Netherlands', true, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Vegetables'), 'Cherry Tomato', 'Sweet cherry tomatoes on the vine, perfect for salads', 200.00, 'box', 250, 'Netherlands', true, 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Vegetables'), 'Lettuce (Iceberg)', 'Crisp iceberg lettuce, fresh and crunchy', 80.00, 'piece', 300, 'India', true, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Vegetables'), 'Mushroom (Button)', 'Fresh white button mushrooms, versatile for cooking', 150.00, 'kg', 200, 'India', false, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Vegetables'), 'Cabbage (Green)', 'Fresh green cabbage, crisp and mild flavoured', 35.00, 'kg', 600, 'India', false, 'https://images.unsplash.com/photo-1594282486756-7e4b1c2f2b6e?w=400')
            ON CONFLICT (name) DO UPDATE SET
                description = EXCLUDED.description, price = EXCLUDED.price, unit = EXCLUDED.unit,
                stock_quantity = EXCLUDED.stock_quantity, origin_country = EXCLUDED.origin_country,
                is_organic = EXCLUDED.is_organic, image_url = EXCLUDED.image_url
        `);
        console.log('International Vegetables seeded');

        // ========== Exotic Vegetables (8) ==========
        await pool.query(`
            INSERT INTO products (category_id, name, description, price, unit, stock_quantity, origin_country, is_organic, image_url) VALUES
            ((SELECT id FROM categories WHERE name = 'Exotic Vegetables'), 'Asparagus', 'Tender asparagus spears, gourmet cooking essential', 200.00, 'bunch', 100, 'India', true, 'https://images.unsplash.com/photo-1515471209610-dae159334820?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Vegetables'), 'Baby Corn', 'Crisp baby corn, perfect for stir-fries and salads', 120.00, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Vegetables'), 'Celery', 'Fresh celery bunches, crunchy and aromatic', 60.00, 'bunch', 150, 'India', true, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Vegetables'), 'Red Cabbage', 'Vibrant red cabbage, rich in antioxidants', 80.00, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1594282486756-7e4b1c2f2b6e?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Vegetables'), 'Zucchini (Yellow)', 'Bright yellow zucchini, mild and tender', 120.00, 'kg', 150, 'India', true, 'https://images.unsplash.com/photo-1563281746-48b9dba2ddb4?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Vegetables'), 'Kale', 'Nutrient-dense curly kale, superfood green', 100.00, 'bunch', 100, 'India', true, 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Vegetables'), 'Leeks', 'Fresh leeks, mild onion flavour for soups and stews', 150.00, 'bunch', 80, 'India', true, 'https://images.unsplash.com/photo-1563281746-48b9dba2ddb4?w=400'),
            ((SELECT id FROM categories WHERE name = 'Exotic Vegetables'), 'Turnip', 'Fresh organic turnips, earthy and slightly sweet', 50.00, 'kg', 200, 'India', true, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400')
            ON CONFLICT (name) DO UPDATE SET
                description = EXCLUDED.description, price = EXCLUDED.price, unit = EXCLUDED.unit,
                stock_quantity = EXCLUDED.stock_quantity, origin_country = EXCLUDED.origin_country,
                is_organic = EXCLUDED.is_organic, image_url = EXCLUDED.image_url
        `);
        console.log('Exotic Vegetables seeded');

        // ========== Indian Dry Fruits (10) ==========
        await pool.query(`
            INSERT INTO products (category_id, name, description, price, unit, stock_quantity, origin_country, is_organic, image_url) VALUES
            ((SELECT id FROM categories WHERE name = 'Indian Dry Fruits'), 'Almond (Mamra)', 'Premium Mamra almonds from Kashmir, rich and crunchy', 1200.00, 'kg', 300, 'Kashmir', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Dry Fruits'), 'Cashew (W240)', 'Premium W240 grade cashews from Goa', 1400.00, 'kg', 250, 'Goa', true, 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Dry Fruits'), 'Pistachio (Iranian)', 'Premium Iranian pistachios, flavourful and green', 1600.00, 'kg', 200, 'Iran', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Dry Fruits'), 'Raisin (Kishmish)', 'Sweet golden kishmish from Maharashtra vineyards', 400.00, 'kg', 400, 'Maharashtra', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Dry Fruits'), 'Walnut (Akhrot)', 'Premium Kashmiri walnuts, brain-shaped superfood', 1000.00, 'kg', 200, 'Kashmir', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Dry Fruits'), 'Figs (Anjeer)', 'Premium dried figs from Indian orchards', 800.00, 'kg', 150, 'India', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Dry Fruits'), 'Makhana (Fox Nut)', 'Premium fox nuts from Bihar, light and nutritious', 1200.00, 'kg', 300, 'Bihar', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Dry Fruits'), 'Dried Cranberries', 'Sweet dried cranberries, perfect for trail mix', 600.00, 'kg', 150, 'India', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Dry Fruits'), 'Flax Seeds (Alsi)', 'Organic flax seeds, rich in Omega-3 fatty acids', 200.00, 'kg', 400, 'India', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'),
            ((SELECT id FROM categories WHERE name = 'Indian Dry Fruits'), 'Chia Seeds', 'Premium chia seeds, high in fibre and protein', 350.00, 'kg', 300, 'India', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400')
            ON CONFLICT (name) DO UPDATE SET
                description = EXCLUDED.description, price = EXCLUDED.price, unit = EXCLUDED.unit,
                stock_quantity = EXCLUDED.stock_quantity, origin_country = EXCLUDED.origin_country,
                is_organic = EXCLUDED.is_organic, image_url = EXCLUDED.image_url
        `);
        console.log('Indian Dry Fruits seeded');

        // ========== International Dry Fruits (10) ==========
        await pool.query(`
            INSERT INTO products (category_id, name, description, price, unit, stock_quantity, origin_country, is_organic, image_url) VALUES
            ((SELECT id FROM categories WHERE name = 'International Dry Fruits'), 'Dates (Medjool)', 'Premium Medjool dates from Iran, caramel-sweet', 800.00, 'kg', 300, 'Iran', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Dry Fruits'), 'Hazelnut', 'Premium Turkish hazelnuts, rich and buttery', 1500.00, 'kg', 120, 'Turkey', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Dry Fruits'), 'Brazil Nut', 'Giant Brazil nuts from the Amazon, selenium-rich', 1800.00, 'kg', 100, 'Brazil', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Dry Fruits'), 'Macadamia', 'Premium Australian macadamias, creamy and rich', 2000.00, 'kg', 80, 'Australia', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Dry Fruits'), 'Pecan', 'Premium US pecans, sweet and buttery', 1600.00, 'kg', 100, 'USA', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Dry Fruits'), 'Pine Nuts (Chilgoza)', 'Premium chilgoza pine nuts from Himachal', 2500.00, 'kg', 80, 'Himachal', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Dry Fruits'), 'Dried Apricots', 'Sweet dried apricots from Turkey, tangy and chewy', 700.00, 'kg', 200, 'Turkey', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Dry Fruits'), 'Dried Mango', 'Sun-dried mango slices from Thailand, naturally sweet', 500.00, 'kg', 150, 'Thailand', true, 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Dry Fruits'), 'Sunflower Seeds', 'Roasted sunflower seeds, healthy and crunchy snack', 300.00, 'kg', 300, 'India', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400'),
            ((SELECT id FROM categories WHERE name = 'International Dry Fruits'), 'Pumpkin Seeds', 'Organic pumpkin seeds, packed with magnesium', 400.00, 'kg', 250, 'India', true, 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400')
            ON CONFLICT (name) DO UPDATE SET
                description = EXCLUDED.description, price = EXCLUDED.price, unit = EXCLUDED.unit,
                stock_quantity = EXCLUDED.stock_quantity, origin_country = EXCLUDED.origin_country,
                is_organic = EXCLUDED.is_organic, image_url = EXCLUDED.image_url
        `);
        console.log('International Dry Fruits seeded');

        // Orders and delivery tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255),
                customer_phone VARCHAR(20),
                delivery_address TEXT NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50) DEFAULT 'cod',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id),
                product_name VARCHAR(255) NOT NULL,
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                unit VARCHAR(20) DEFAULT 'kg'
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS delivery_tracking (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL,
                location VARCHAR(255),
                notes TEXT,
                estimated_delivery TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Orders and delivery tables created');

        console.log('Database initialized with 76 products across 8 categories');
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
