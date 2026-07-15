-- Products table for Surya Fresh Mart
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'indian' or 'international'
    parent_category VARCHAR(50) NOT NULL, -- 'fruits', 'vegetables', 'dry_fruits'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
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
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);

-- Insert categories
INSERT INTO categories (name, type, parent_category, description) VALUES
('Indian Fruits', 'indian', 'fruits', 'Fresh fruits from India'),
('International Fruits', 'international', 'fruits', 'Imported fruits from around the world'),
('Indian Vegetables', 'indian', 'vegetables', 'Fresh vegetables from India'),
('International Vegetables', 'international', 'vegetables', 'Imported vegetables from around the world'),
('Indian Dry Fruits', 'indian', 'dry_fruits', 'Premium dry fruits from India'),
('International Dry Fruits', 'international', 'dry_fruits', 'Imported dry fruits from around the world')
ON CONFLICT (name) DO NOTHING;
