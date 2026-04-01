const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const twilioService = require('../services/twilioService');
const ghlService = require('../services/ghlService');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

/**
 * Customer Login
 * Supports phone + password (preferred) and phone + PIN (fallback)
 */
router.post('/login', async (req, res) => {
    const { identifier, password, pin } = req.body;

    if (!identifier) {
        return res.status(400).json({ error: 'Phone or Email required' });
    }
    if (!password && !pin) {
        return res.status(400).json({ error: 'Password or PIN required' });
    }

    try {
        // Support login via either phone or email
        const customer = db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(identifier, identifier);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found. Please place an order first.' });
        }

        if (password) {
            const ok = await bcrypt.compare(String(password), customer.password_hash);
            if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

            const { password_hash, pin_hash, ...customerData } = customer;
            return res.json({ success: true, customer: customerData, message: 'Login successful' });
        }

        const pinToCheck = customer.pin_hash || customer.password_hash;
        const ok = await bcrypt.compare(String(pin), pinToCheck);
        if (!ok) return res.status(401).json({ error: 'Invalid PIN' });

        const { password_hash, pin_hash, ...customerData } = customer;
        return res.json({
            success: true,
            customer: customerData,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('[AUTH] Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/request-pin', async (req, res) => {
    const { name, phone, email, identifier } = req.body;
    const target = identifier || phone;

    if (!target) {
        return res.status(400).json({ error: 'Phone or Email required' });
    }

    try {
        const pin = Math.floor(100 + Math.random() * 900).toString();
        const pinHash = await bcrypt.hash(pin, 10);

        const existing = db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(target, target);
        if (existing) {
            db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(pinHash, existing.id);
            // Use their existing phone for Twilio
            twilioService.sendPIN(existing.phone, pin, existing.name || 'Customer');
        } else {
            // Only allow new registrations via phone for now (to ensure we can send PIN)
            if (target.includes('@')) {
                return res.status(400).json({ error: 'Please register with a phone number first to receive your PIN.' });
            }

            const phoneForNew = target;
            // Create new customer - sync to GHL
            const ghlContactId = await ghlService.syncCustomerToGHL({
                name: name || 'Customer',
                email: email || null,
                phone: phoneForNew
            });

            const stmt = db.prepare(`
                INSERT INTO users (name, phone, password_hash, pin_hash, email, is_18_plus, ghl_contact_id)
                VALUES (?, ?, ?, ?, ?, 1, ?)
            `);
            stmt.run(name || 'Customer', phoneForNew, pinHash, pinHash, email || null, ghlContactId);

            twilioService.sendPIN(phoneForNew, pin, name || 'Customer');
        }
        res.json({ success: true });
    } catch (error) {
        console.error('[AUTH] Request PIN error:', error);
        res.status(500).json({ error: 'Failed to send PIN' });
    }
});

router.post('/set-password', async (req, res) => {
    const { phone, pin, password } = req.body;

    if (!phone || !pin || !password) {
        return res.status(400).json({ error: 'Phone, PIN and password required' });
    }

    try {
        const customer = db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(phone, phone);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const pinToCheck = customer.pin_hash || customer.password_hash;
        const ok = await bcrypt.compare(String(pin), pinToCheck);
        if (!ok) return res.status(401).json({ error: 'Invalid PIN' });

        const passwordHash = await bcrypt.hash(String(password), 10);
        db.prepare('UPDATE users SET password_hash = ?, password_set_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(passwordHash, customer.id);

        const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(customer.id);
        const { password_hash, pin_hash, ...customerData } = updated;
        res.json({ success: true, customer: customerData });
    } catch (error) {
        console.error('[AUTH] Set password error:', error);
        res.status(500).json({ error: 'Failed to set password' });
    }
});

router.post('/change-password', async (req, res) => {
    const { phone, currentPassword, newPassword } = req.body;

    if (!phone || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Phone, current password, and new password required' });
    }

    try {
        const customer = db.prepare('SELECT * FROM users WHERE phone = ? OR email = ?').get(phone, phone);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const ok = await bcrypt.compare(String(currentPassword), customer.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const passwordHash = await bcrypt.hash(String(newPassword), 10);
        db.prepare('UPDATE users SET password_hash = ?, password_set_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(passwordHash, customer.id);

        res.json({ success: true });
    } catch (error) {
        console.error('[AUTH] Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

/**
 * Check if customer exists by phone
 * Used to determine if customer should login or register
 */
router.post('/check-customer', (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: 'Phone required' });
    }

    try {
        const customer = db.prepare('SELECT id, name, phone, email FROM users WHERE phone = ?').get(phone);

        res.json({
            exists: !!customer,
            customer: customer || null
        });
    } catch (error) {
        console.error('[AUTH] Check customer error:', error);
        res.status(500).json({ error: 'Failed to check customer' });
    }
});

/**
 * Get customer orders history
 */
router.get('/orders/:customerId', (req, res) => {
    try {
        const orders = db.prepare(`
            SELECT * FROM orders 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `).all(req.params.customerId);

        res.json(orders);
    } catch (error) {
        console.error('[AUTH] Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

module.exports = router;
