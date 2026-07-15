const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get analytics dashboard data
router.get('/dashboard', authenticate, authorize('super_admin', 'admin', 'editor'), async (req, res, next) => {
    try {
        const { period = '7d' } = req.query;
        
        let interval;
        switch (period) {
            case '24h': interval = "24 hours"; break;
            case '7d': interval = "7 days"; break;
            case '30d': interval = "30 days"; break;
            default: interval = "7 days";
        }

        const [requestStats, topEndpoints, responseTimes, userActivity, sourceStats] = await Promise.all([
            pool.query(`
                SELECT 
                    COUNT(*) as total_requests,
                    COUNT(DISTINCT user_id) as unique_users,
                    AVG(request_duration_ms)::integer as avg_response_time,
                    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
                FROM analytics
                WHERE created_at > NOW() - $1::interval
            `, [interval]),
            pool.query(`
                SELECT endpoint, COUNT(*) as count, AVG(request_duration_ms)::integer as avg_time
                FROM analytics
                WHERE created_at > NOW() - $1::interval
                GROUP BY endpoint
                ORDER BY count DESC
                LIMIT 10
            `, [interval]),
            pool.query(`
                SELECT 
                    DATE_TRUNC('hour', created_at) as hour,
                    AVG(request_duration_ms)::integer as avg_time
                FROM analytics
                WHERE created_at > NOW() - $1::interval
                GROUP BY hour
                ORDER BY hour
            `, [interval]),
            pool.query(`
                SELECT 
                    DATE_TRUNC('day', created_at) as day,
                    COUNT(*) as requests,
                    COUNT(DISTINCT user_id) as users
                FROM analytics
                WHERE created_at > NOW() - $1::interval
                GROUP BY day
                ORDER BY day
            `, [interval]),
            pool.query(`
                SELECT container_id, COUNT(*) as count
                FROM analytics
                WHERE created_at > NOW() - $1::interval
                GROUP BY container_id
                ORDER BY count DESC
            `, [interval])
        ]);

        res.json({
            stats: requestStats.rows[0],
            topEndpoints: topEndpoints.rows,
            responseTimes: responseTimes.rows,
            userActivity: userActivity.rows,
            sourceStats: sourceStats.rows
        });
    } catch (error) {
        next(error);
    }
});

// Get request timeline
router.get('/timeline', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                endpoint,
                method,
                status_code,
                request_duration_ms,
                source_ip,
                created_at
            FROM analytics
            ORDER BY created_at DESC
            LIMIT 100
        `);

        res.json({ timeline: result.rows });
    } catch (error) {
        next(error);
    }
});

// Get container tracking stats
router.get('/containers', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                container_id,
                COUNT(*) as total_requests,
                AVG(request_duration_ms)::integer as avg_response_time,
                MIN(created_at) as first_seen,
                MAX(created_at) as last_seen
            FROM analytics
            GROUP BY container_id
            ORDER BY total_requests DESC
        `);

        res.json({ containers: result.rows });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
