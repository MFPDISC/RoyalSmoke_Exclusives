const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

// Register new store (become a distributor)
router.post('/register', async (req, res) => {
    const { name, owner_name, email, phone, password, address, city, postal_code, latitude, longitude } = req.body;

    if (!name || !owner_name || !email || !phone || !password || !address || !city) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);
        const stmt = db.prepare(`
            INSERT INTO stores (name, owner_name, email, phone, password_hash, address, city, postal_code, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(name, owner_name, email, phone, password_hash, address, city, postal_code || null, latitude || null, longitude || null);

        res.status(201).json({ message: 'Store registered. Awaiting approval.', storeId: result.lastInsertRowid });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Store login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const store = db.prepare('SELECT * FROM stores WHERE email = ?').get(email);
        if (!store) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, store.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        if (!store.is_approved) return res.status(403).json({ error: 'Store not yet approved' });

        const { password_hash, ...storeData } = store;
        res.json({ message: 'Login successful', store: storeData });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get store's inventory (submitted products)
router.get('/:storeId/inventory', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT 
                id,
                product_name,
                description,
                category,
                image_url,
                stock_qty,
                store_cost_price,
                admin_approved,
                admin_profit_margin,
                admin_final_price,
                created_at,
                last_updated
            FROM store_products
            WHERE store_id = ?
            ORDER BY created_at DESC
        `);
        res.json(stmt.all(req.params.storeId));
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Add/Update product in store inventory (Product Submission)
router.post('/:storeId/inventory', (req, res) => {
    const { product_name, description, category, image_url, store_cost_price, stock_qty } = req.body;
    const store_id = req.params.storeId;

    if (!product_name || store_cost_price === undefined || stock_qty === undefined) {
        return res.status(400).json({ error: 'Missing required fields: product_name, store_cost_price, stock_qty' });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO store_products (
                store_id, product_name, description, category, image_url, 
                store_cost_price, stock_qty, last_updated
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        const result = stmt.run(
            store_id,
            product_name,
            description || null,
            category || 'Premium Cigars',
            image_url || null,
            store_cost_price,
            stock_qty
        );
        res.json({
            message: 'Product submitted for admin approval',
            product_id: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to submit product' });
    }
});

// Update stock quantity for a submitted product
router.patch('/:storeId/inventory/:productId/stock', (req, res) => {
    const { stock_qty } = req.body;
    try {
        const stmt = db.prepare(`
            UPDATE store_products 
            SET stock_qty = ?, last_updated = CURRENT_TIMESTAMP 
            WHERE store_id = ? AND id = ?
        `);
        const result = stmt.run(stock_qty, req.params.storeId, req.params.productId);
        result.changes > 0 ? res.json({ message: 'Stock updated' }) : res.status(404).json({ error: 'Product not found' });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// Get orders assigned to store
router.get('/:storeId/orders', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT so.*, o.status as order_status, o.created_at as order_date,
                   p.name as product_name, u.name as customer_name, u.address as delivery_address
            FROM store_orders so
            JOIN orders o ON so.order_id = o.id
            JOIN products p ON so.product_id = p.id
            JOIN users u ON o.user_id = u.id
            WHERE so.store_id = ?
            ORDER BY so.created_at DESC
        `);
        res.json(stmt.all(req.params.storeId));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get store dashboard stats
router.get('/:storeId/stats', (req, res) => {
    const storeId = req.params.storeId;
    try {
        const sold = db.prepare(`SELECT COALESCE(SUM(quantity), 0) as total_sold FROM store_orders WHERE store_id = ? AND status != 'pending'`).get(storeId);
        const pending = db.prepare(`SELECT COALESCE(SUM(store_price * quantity), 0) as pending_payout FROM store_orders WHERE store_id = ? AND payout_status = 'pending' AND status IN ('delivered', 'dispatched')`).get(storeId);
        const paid = db.prepare(`SELECT COALESCE(SUM(store_price * quantity), 0) as total_paid FROM store_orders WHERE store_id = ? AND payout_status = 'paid'`).get(storeId);
        const inventory = db.prepare(`SELECT COALESCE(SUM(store_price * stock_qty), 0) as inventory_value, COALESCE(SUM(stock_qty), 0) as total_stock FROM store_products WHERE store_id = ?`).get(storeId);

        res.json({
            total_items_sold: sold.total_sold,
            pending_payout: pending.pending_payout,
            total_earned: paid.total_paid,
            inventory_value: inventory.inventory_value,
            total_stock: inventory.total_stock
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get all stores (admin)
router.get('/', (req, res) => {
    try {
        const stmt = db.prepare(`SELECT id, name, owner_name, email, phone, address, city, postal_code, latitude, longitude, is_active, is_approved, created_at FROM stores ORDER BY created_at DESC`);
        res.json(stmt.all());
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
});

// Approve store (admin)
router.patch('/:storeId/approve', (req, res) => {
    try {
        const result = db.prepare('UPDATE stores SET is_approved = 1 WHERE id = ?').run(req.params.storeId);
        result.changes > 0 ? res.json({ message: 'Store approved' }) : res.status(404).json({ error: 'Store not found' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve store' });
    }
});

// Toggle store active status (admin)
router.patch('/:storeId/toggle-active', (req, res) => {
    try {
        const result = db.prepare('UPDATE stores SET is_active = NOT is_active WHERE id = ?').run(req.params.storeId);
        result.changes > 0 ? res.json({ message: 'Store status toggled' }) : res.status(404).json({ error: 'Store not found' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle store' });
    }
});

// Find nearest store with product in stock
router.get('/nearest', (req, res) => {
    const { lat, lng, product_id } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Latitude and longitude required' });

    try {
        let query = `
            SELECT s.*, sp.stock_qty, sp.store_price,
                   (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
            FROM stores s
            JOIN store_products sp ON s.id = sp.store_id
            WHERE s.is_active = 1 AND s.is_approved = 1 AND sp.stock_qty > 0
        `;
        const params = [lat, lng, lat];
        if (product_id) { query += ' AND sp.product_id = ?'; params.push(product_id); }
        query += ' ORDER BY distance ASC LIMIT 5';

        res.json(db.prepare(query).all(...params));
    } catch (error) {
        res.status(500).json({ error: 'Failed to find stores' });
    }
});

// Mark store order as paid out (admin)
router.patch('/orders/:orderId/payout', (req, res) => {
    try {
        const result = db.prepare(`UPDATE store_orders SET payout_status = 'paid' WHERE id = ?`).run(req.params.orderId);
        result.changes > 0 ? res.json({ message: 'Payout complete' }) : res.status(404).json({ error: 'Order not found' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update payout' });
    }
});

module.exports = router;
