const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

// Ensure id_number column exists
try {
    const cols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
    if (!cols.includes('id_number')) {
        db.exec('ALTER TABLE users ADD COLUMN id_number TEXT');
    }
    if (!cols.includes('delivery_address')) {
        db.exec('ALTER TABLE users ADD COLUMN delivery_address TEXT');
    }
    if (!cols.includes('is_member')) {
        db.exec('ALTER TABLE users ADD COLUMN is_member INTEGER DEFAULT 0');
    }
    if (!cols.includes('member_joined_at')) {
        db.exec('ALTER TABLE users ADD COLUMN member_joined_at DATETIME');
    }
} catch (e) {
    console.error('[MEMBERS] Migration error:', e.message);
}

// Public: Submit membership signup
router.post('/signup', async (req, res) => {
    const { name, phone, email, delivery_address, id_number } = req.body;

    if (!name || !phone || !email || !delivery_address || !id_number) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const existing = db.prepare('SELECT id FROM users WHERE phone = ? OR email = ?').get(phone, email);
        if (existing) {
            // Update their record to mark as member
            db.prepare(`
                UPDATE users SET
                    name = ?, email = ?, delivery_address = ?, id_number = ?,
                    is_member = 1, member_joined_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(name, email, delivery_address, id_number, existing.id);
            return res.json({ success: true, message: 'Membership updated successfully' });
        }

        const placeholderHash = await bcrypt.hash(phone + Date.now(), 10);
        db.prepare(`
            INSERT INTO users (name, phone, email, address, delivery_address, id_number, password_hash, is_18_plus, is_member, member_joined_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, CURRENT_TIMESTAMP)
        `).run(name, phone, email, delivery_address, delivery_address, id_number, placeholderHash);

        res.json({ success: true, message: 'Membership application received!' });
    } catch (error) {
        console.error('[MEMBERS] Signup error:', error);
        res.status(500).json({ error: 'Signup failed. Please try again.' });
    }
});

// Admin: Get all members (protected by password header)
router.get('/admin/list', (req, res) => {
    const adminPass = req.headers['x-admin-password'];
    if (adminPass !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const members = db.prepare(`
            SELECT id, name, phone, email, delivery_address, id_number, is_member, member_joined_at, created_at
            FROM users
            WHERE is_member = 1
            ORDER BY member_joined_at DESC
        `).all();
        res.json(members);
    } catch (error) {
        console.error('[MEMBERS] Admin list error:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

// Admin: Verify password
router.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        return res.json({ success: true });
    }
    res.status(401).json({ error: 'Incorrect password' });
});

module.exports = router;
