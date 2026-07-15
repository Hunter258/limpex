const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Railway provides DATABASE_URL automatically
// Or use individual env vars
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: process.env.PGPORT || process.env.DB_PORT || 5432,
    database: process.env.PGDATABASE || process.env.DB_NAME || 'railway',
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'password',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = pool;
