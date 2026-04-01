const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

// Update product (for stores to edit pending products)
router.put('/:storeId/inventory/:productId', (req, res) => {
    const { product_name, description, category, image_url, store_cost_price, stock_qty } = req.body;

    try {
        // Only allow editing if not yet approved
        const product = db.prepare('SELECT admin_approved FROM store_products WHERE id = ? AND store_id = ?')
            .get(req.params.productId, req.params.storeId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.admin_approved) {
            return res.status(400).json({ error: 'Cannot edit approved products. Update stock instead.' });
        }

        const stmt = db.prepare(`
            UPDATE store_products 
            SET product_name = ?, description = ?, category = ?, image_url = ?, 
                store_cost_price = ?, stock_qty = ?, last_updated = CURRENT_TIMESTAMP
            WHERE id = ? AND store_id = ?
        `);

        stmt.run(product_name, description, category, image_url, store_cost_price, stock_qty, req.params.productId, req.params.storeId);
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product (for stores to remove pending products)
router.delete('/:storeId/inventory/:productId', (req, res) => {
    try {
        // Only allow deleting if not yet approved
        const product = db.prepare('SELECT admin_approved FROM store_products WHERE id = ? AND store_id = ?')
            .get(req.params.productId, req.params.storeId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.admin_approved) {
            return res.status(400).json({ error: 'Cannot delete approved products' });
        }

        const stmt = db.prepare('DELETE FROM store_products WHERE id = ? AND store_id = ?');
        stmt.run(req.params.productId, req.params.storeId);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
