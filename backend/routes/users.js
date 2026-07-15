const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name, 
                   u.is_active, u.last_login, u.created_at
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1
            ORDER BY u.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(query, [`%${search}%`, limit, offset]);
        const countResult = await pool.query('SELECT COUNT(*) FROM users');

        res.json({
            users: result.rows,
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

// Get user by ID
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user.role_name !== 'super_admin' && req.user.role_name !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name, 
                    u.is_active, u.last_login, u.created_at
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// Update user role (Super Admin only)
router.put('/:id/role', authenticate, authorize('super_admin'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { roleId } = req.body;

        const roleCheck = await pool.query('SELECT id FROM roles WHERE id = $1', [roleId]);
        if (roleCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        await pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [roleId, id]);

        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        next(error);
    }
});

// Deactivate user (Admin only)
router.put('/:id/deactivate', authenticate, authorize('super_admin', 'admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user.id === id) {
            return res.status(400).json({ error: 'Cannot deactivate your own account' });
        }

        await pool.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
        await pool.query('DELETE FROM sessions WHERE user_id = $1', [id]);

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        next(error);
    }
});

// Delete user (Super Admin only)
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user.id === id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
