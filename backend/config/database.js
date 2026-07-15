const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
console.log('Database URL present:', !!dbUrl);
console.log('Database URL starts with:', dbUrl ? dbUrl.substring(0, 30) + '...' : 'N/A');

const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = pool;
