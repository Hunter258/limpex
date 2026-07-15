const pool = require('../config/database');

const analyticsTracker = async (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', async () => {
        try {
            const duration = Date.now() - start;
            const containerId = process.env.HOSTNAME || process.env.RAILWAY_SERVICE_NAME || 'local';
            
            await pool.query(
                `INSERT INTO analytics 
                (endpoint, method, status_code, request_duration_ms, source_ip, user_agent, user_id, container_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    req.originalUrl,
                    req.method,
                    res.statusCode,
                    duration,
                    req.ip || req.connection?.remoteAddress || 'unknown',
                    req.get('user-agent') || 'unknown',
                    req.user?.id || null,
                    containerId
                ]
            );
        } catch (error) {
            // Silently ignore analytics errors to not break the app
            console.error('Analytics tracking skipped:', error.message);
        }
    });
    
    next();
};

module.exports = { analyticsTracker };
