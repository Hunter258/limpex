const pool = require('../config/database');

const analyticsTracker = async (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', async () => {
        try {
            const duration = Date.now() - start;
            const containerId = process.env.HOSTNAME || 'local';
            
            await pool.query(
                `INSERT INTO analytics 
                (endpoint, method, status_code, request_duration_ms, source_ip, user_agent, user_id, container_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    req.originalUrl,
                    req.method,
                    res.statusCode,
                    duration,
                    req.ip || req.connection.remoteAddress,
                    req.get('user-agent'),
                    req.user?.id || null,
                    containerId
                ]
            );
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    });
    
    next();
};

module.exports = { analyticsTracker };
