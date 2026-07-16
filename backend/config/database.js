const { Pool } = require('pg');
const logger = require('./logger');

const dbUrl = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl && process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX) || 15,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', { error: err.message, stack: err.stack });
});

const getPoolStats = () => ({
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    max: pool.options.max,
    min: pool.options.min,
});

module.exports = pool;
module.exports.getPoolStats = getPoolStats;
