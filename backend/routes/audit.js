const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get audit logs
router.get('/', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
    try {
        const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT al.*, u.email, u.first_name, u.last_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (userId) {
            query += ` AND al.user_id = $${paramIndex++}`;
            params.push(userId);
        }
        if (action) {
            query += ` AND al.action = $${paramIndex++}`;
            params.push(action);
        }
        if (startDate) {
            query += ` AND al.created_at >= $${paramIndex++}`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND al.created_at <= $${paramIndex++}`;
            params.push(endDate);
        }

        query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        const countResult = await pool.query('SELECT COUNT(*) FROM audit_logs');

        res.json({
            logs: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get audit log by ID
router.get('/:id', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT al.*, u.email, u.first_name, u.last_name
             FROM audit_logs al
             LEFT JOIN users u ON al.user_id = u.id
             WHERE al.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Audit log not found' });
        }

        res.json({ log: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// Create audit log entry (internal use)
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { action, entityType, entityId, oldValues, newValues } = req.body;

        await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [req.user.id, action, entityType, entityId, oldValues, newValues, req.ip, req.get('user-agent')]
        );

        res.status(201).json({ message: 'Audit log created' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
