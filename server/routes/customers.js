const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const ghlService = require('../services/ghlService');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

// GET all customers (admin view)
router.get('/', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT 
                u.id, u.name, u.phone, u.email, u.address, u.ghl_contact_id,
                COUNT(o.id) as order_count,
                SUM(o.total_amount) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.customer_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        const customers = stmt.all();
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// CREATE new customer (Admin Dashboard)
router.post('/', async (req, res) => {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and Phone are required' });
    }

    try {
        // Check if exists
        const existing = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
        if (existing) {
            return res.status(409).json({ error: 'Customer with this phone already exists' });
        }

        // Generate dummy pin/pass for manual creation
        const pin = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit
        const hash = await bcrypt.hash(pin, 10);

        // Sync to GHL first to get ID
        const ghlContactId = await ghlService.syncCustomerToGHL({
            name,
            email,
            phone,
            address
        });

        const stmt = db.prepare(`
            INSERT INTO users (name, phone, email, address, password_hash, pin_hash, is_18_plus, ghl_contact_id)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        `);

        const result = stmt.run(name, phone, email || null, address || null, hash, hash, ghlContactId);

        res.status(201).json({
            message: 'Customer created',
            id: result.lastInsertRowid,
            ghl_contact_id: ghlContactId
        });

    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

module.exports = router;
