const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all categories
router.get('/categories', async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY parent_category, type');
        res.json({ categories: result.rows });
    } catch (error) {
        next(error);
    }
});

// Get products with filters
router.get('/', async (req, res, next) => {
    try {
        const { category, type, search, organic, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, c.name as category_name, c.type as category_type, c.parent_category
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.is_available = true
        `;
        const params = [];
        let paramIndex = 1;

        if (category) {
            query += ` AND c.parent_category = $${paramIndex++}`;
            params.push(category);
        }
        if (type) {
            query += ` AND c.type = $${paramIndex++}`;
            params.push(type);
        }
        if (search) {
            query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (organic === 'true') {
            query += ` AND p.is_organic = true`;
        }

        query += ` ORDER BY p.name LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        const countResult = await pool.query('SELECT COUNT(*) FROM products WHERE is_available = true');

        res.json({
            products: result.rows,
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

// Get product by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT p.*, c.name as category_name, c.type as category_type, c.parent_category
             FROM products p
             JOIN categories c ON p.category_id = c.id
             WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
