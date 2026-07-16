const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl && process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client:', err.message);
});

module.exports = pool;
