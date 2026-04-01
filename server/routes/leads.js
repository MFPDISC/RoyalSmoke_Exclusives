const express = require('express');
const router = express.Router();
const db = require('../db');
const ghlService = require('../services/ghlService');

/**
 * POST /api/leads
 * Capture lead from popup and create in GHL with discount code
 */
router.post('/', async (req, res) => {
    const { phone, email, name } = req.body;

    if (!phone || !email) {
        return res.status(400).json({ error: 'Phone and email are required' });
    }

    try {
        // Check if lead already exists
        const existing = db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(phone, email);

        if (existing) {
            // Generate code anyway for existing users
            const discountCode = `ROYALFIRST-${phone.slice(-4)}`;
            return res.status(200).json({
                message: 'Welcome back!',
                code: discountCode,
                existing: true
            });
        }

        // Generate unique discount code
        const discountCode = `ROYALFIRST-${phone.slice(-4)}`;

        // Create contact in GHL with tag "New Leads - No Purchase"
        const ghlContactId = await ghlService.syncCustomerToGHL({
            name: name || 'Lead',
            email,
            phone,
            tags: ['New Leads - No Purchase', 'Lead Magnet - R150']
        });

        // Store lead in database (optional - for tracking)
        try {
            const stmt = db.prepare(`
                INSERT INTO users (name, phone, email, ghl_contact_id, is_18_plus)
                VALUES (?, ?, ?, ?, 1)
            `);
            stmt.run(name || 'Lead', phone, email, ghlContactId);
        } catch (dbErr) {
            console.error('DB insert failed (non-fatal):', dbErr.message);
        }

        res.status(201).json({
            message: 'Discount code generated!',
            code: discountCode,
            ghl_contact_id: ghlContactId
        });

    } catch (error) {
        console.error('Lead capture error:', error);
        res.status(500).json({ error: 'Failed to capture lead' });
    }
});

module.exports = router;
