const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const ghlService = require('../services/ghlService');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath); // Add verbose: console.log for debugging if needed

// Helper to sync product after DB change
const triggerGHLSync = async (productId) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
        if (product) {
            const result = await ghlService.syncProductToGHL(product);
            if (result) {
                db.prepare('UPDATE products SET ghl_product_id = ?, ghl_price_id = ? WHERE id = ?')
                    .run(result.ghlProductId, result.ghlPriceId, productId);
                console.log(`[SYNC] Product ${productId} synced to GHL`);
            }
        }
    } catch (err) {
        console.error('[SYNC] Failed to sync product:', err);
    }
};

// GET all products (from approved store submissions)
router.get('/', (req, res) => {
    // ... existing GET implementation ...
    try {
        const stmt = db.prepare(`
            SELECT 
                sp.id,
                sp.product_name as name,
                sp.description,
                sp.category,
                sp.image_url,
                sp.stock_qty,
                sp.admin_final_price as price_zar,
                s.name as store_name,
                s.city as store_location
            FROM store_products sp
            JOIN stores s ON sp.store_id = s.id
            WHERE sp.admin_approved = 1 
                AND sp.stock_qty > 0
                AND s.is_active = 1
                AND s.is_approved = 1
            ORDER BY sp.created_at DESC
        `);
        const products = stmt.all();

        // Apply image fallbacks if needed
        const imageFallbackByKey = {
            cohiba: 'https://source.unsplash.com/G--72W5J-Y8/800x600',
            montecristo: 'https://source.unsplash.com/V7HDlas8fRk/800x600',
            romeo: 'https://source.unsplash.com/dHOH6saXfCQ/800x600',
            julieta: 'https://source.unsplash.com/dHOH6saXfCQ/800x600',
            partagas: 'https://source.unsplash.com/PDmYb-Q1OLU/800x600',
            combo: 'https://source.unsplash.com/wyAMbXYLzI4/800x600',
            christmas: 'https://source.unsplash.com/wyAMbXYLzI4/800x600',
            cigar: 'https://source.unsplash.com/9tRTJwxSoKI/800x600'
        };

        const withFallbacks = products.map((p) => {
            const img = (p.image_url || '').toLowerCase();
            const needsFallback = !p.image_url || img.includes('placehold.co');
            if (!needsFallback) return p;

            const name = (p.name || '').toLowerCase();
            const key = Object.keys(imageFallbackByKey).find((k) => name.includes(k));
            return {
                ...p,
                image_url: key ? imageFallbackByKey[key] : imageFallbackByKey.cigar
            };
        });

        res.json(withFallbacks);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET product by id
router.get('/:id', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
        const product = stmt.get(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// UPDATE stock (Admin)
router.post('/:id/stock', (req, res) => {
    const { stock_qty } = req.body;
    try {
        const stmt = db.prepare('UPDATE products SET stock_qty = ? WHERE id = ?');
        const result = stmt.run(stock_qty, req.params.id);
        if (result.changes > 0) {
            // Also trigger sync to update GHL stock/info
            triggerGHLSync(req.params.id);
            res.json({ message: 'Stock updated', id: req.params.id, stock_qty });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// UPDATE Full Product (Admin)
router.put('/:id', (req, res) => {
    const { name, description, price_zar, stock_qty, category, image_url } = req.body;
    try {
        const stmt = db.prepare(`
            UPDATE products 
            SET name = ?, description = ?, price_zar = ?, stock_qty = ?, category = ?, image_url = ?
            WHERE id = ?
        `);
        const result = stmt.run(name, description, price_zar, stock_qty, category, image_url, req.params.id);

        if (result.changes > 0) {
            triggerGHLSync(req.params.id);
            res.json({ message: 'Product updated' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Update failed' });
    }
});

// CREATE new product (Admin)
router.post('/', (req, res) => {
    const { name, description, price_zar, stock_qty, category, image_url } = req.body;
    if (!name || !price_zar || stock_qty === undefined) {
        return res.status(400).json({ error: 'Missing required fields: name, price_zar, stock_qty' });
    }
    try {
        const stmt = db.prepare('INSERT INTO products (name, description, price_zar, stock_qty, category, image_url) VALUES (?, ?, ?, ?, ?, ?)');
        const result = stmt.run(name, description || '', price_zar, stock_qty, category || 'Cubans', image_url || '');
        const newId = result.lastInsertRowid;

        // Sync to GHL
        triggerGHLSync(newId);

        res.status(201).json({ message: 'Product created', id: newId });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE product (Admin)
router.delete('/:id', (req, res) => {
    try {
        const stmt = db.prepare('UPDATE products SET is_active = 0 WHERE id = ?');
        const result = stmt.run(req.params.id);
        if (result.changes > 0) {
            res.json({ message: 'Product deleted' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
