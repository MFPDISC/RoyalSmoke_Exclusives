const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const pricingService = require('../services/pricingService');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

/**
 * STORE: Upload products manually (one by one)
 */
router.post('/store/:storeId/products', (req, res) => {
    const { storeId } = req.params;
    const { product_name, stock_qty, store_cost_price } = req.body;

    if (!product_name || !store_cost_price) {
        return res.status(400).json({ error: 'Product name and cost price required' });
    }

    try {
        const result = db.prepare(`
            INSERT INTO store_products (store_id, product_name, stock_qty, store_cost_price)
            VALUES (?, ?, ?, ?)
        `).run(storeId, product_name, stock_qty || 0, store_cost_price);

        res.json({
            success: true,
            product_id: result.lastInsertRowid,
            message: 'Product added. Awaiting admin approval.'
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

/**
 * STORE: Upload products via CSV
 * Accepts any CSV format with columns: name, price, quantity (flexible column names)
 */
router.post('/store/:storeId/products/csv', upload.single('csv'), async (req, res) => {
    const { storeId } = req.params;
    const filePath = req.file.path;

    const products = [];
    const errors = [];

    try {
        // Read and parse CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    // Flexible column name matching
                    const name = row.name || row.Name || row.product || row.Product || row.product_name || row['Product Name'];
                    const price = row.price || row.Price || row.cost || row.Cost || row.cost_price || row['Cost Price'];
                    const quantity = row.quantity || row.Quantity || row.qty || row.Qty || row.stock || row.Stock || 0;

                    if (name && price) {
                        products.push({
                            product_name: name.trim(),
                            store_cost_price: parseFloat(price),
                            stock_qty: parseInt(quantity) || 0
                        });
                    } else {
                        errors.push(`Skipped row: ${JSON.stringify(row)} (missing name or price)`);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Insert all products
        const insertStmt = db.prepare(`
            INSERT INTO store_products (store_id, product_name, stock_qty, store_cost_price)
            VALUES (?, ?, ?, ?)
        `);

        const insertMany = db.transaction((products) => {
            for (const product of products) {
                insertStmt.run(storeId, product.product_name, product.stock_qty, product.store_cost_price);
            }
        });

        insertMany(products);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            imported: products.length,
            errors: errors.length,
            error_details: errors,
            message: `${products.length} products imported. Awaiting admin approval.`
        });
    } catch (error) {
        console.error('CSV upload error:', error);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: 'Failed to process CSV' });
    }
});

/**
 * STORE: Get own products
 */
router.get('/store/:storeId/products', (req, res) => {
    const { storeId } = req.params;

    try {
        const products = db.prepare(`
            SELECT * FROM store_products 
            WHERE store_id = ?
            ORDER BY created_at DESC
        `).all(storeId);

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * ADMIN: Get all pending products (not approved)
 */
router.get('/admin/products/pending', (req, res) => {
    try {
        const products = db.prepare(`
            SELECT sp.*, s.name as store_name, s.city as store_city
            FROM store_products sp
            JOIN stores s ON sp.store_id = s.id
            WHERE sp.admin_approved = 0
            ORDER BY sp.created_at DESC
        `).all();

        // Add pricing suggestions
        const withSuggestions = products.map(p => ({
            ...p,
            suggested_margin: pricingService.suggestProfitMargin(p.store_cost_price),
            preview_price: pricingService.calculateCustomerPrice(p.store_cost_price, pricingService.suggestProfitMargin(p.store_cost_price))
        }));

        res.json(withSuggestions);
    } catch (error) {
        console.error('Error fetching pending products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * ADMIN: Get all approved products
 */
router.get('/admin/products/approved', (req, res) => {
    try {
        const products = db.prepare(`
            SELECT sp.*, s.name as store_name, s.city as store_city
            FROM store_products sp
            JOIN stores s ON sp.store_id = s.id
            WHERE sp.admin_approved = 1
            ORDER BY sp.created_at DESC
        `).all();

        res.json(products);
    } catch (error) {
        console.error('Error fetching approved products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * ADMIN: Set profit margin and approve product
 */
router.patch('/admin/products/:productId/approve', (req, res) => {
    const { productId } = req.params;
    const { profit_margin } = req.body;

    if (!profit_margin) {
        return res.status(400).json({ error: 'Profit margin required' });
    }

    try {
        // Get product
        const product = db.prepare('SELECT * FROM store_products WHERE id = ?').get(productId);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Calculate final price
        const finalPrice = pricingService.calculateCustomerPrice(product.store_cost_price, profit_margin);
        const breakdown = pricingService.getProfitBreakdown(product.store_cost_price, profit_margin);

        // Update product
        db.prepare(`
            UPDATE store_products 
            SET admin_approved = 1,
                admin_profit_margin = ?,
                admin_final_price = ?
            WHERE id = ?
        `).run(profit_margin, finalPrice, productId);

        res.json({
            success: true,
            product_id: productId,
            final_price: finalPrice,
            breakdown
        });
    } catch (error) {
        console.error('Error approving product:', error);
        res.status(500).json({ error: 'Failed to approve product' });
    }
});

/**
 * ADMIN: Update pricing for approved product
 */
router.patch('/admin/products/:productId/pricing', (req, res) => {
    const { productId } = req.params;
    const { profit_margin } = req.body;

    try {
        const product = db.prepare('SELECT * FROM store_products WHERE id = ?').get(productId);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const finalPrice = pricingService.calculateCustomerPrice(product.store_cost_price, profit_margin);
        const breakdown = pricingService.getProfitBreakdown(product.store_cost_price, profit_margin);

        db.prepare(`
            UPDATE store_products 
            SET admin_profit_margin = ?,
                admin_final_price = ?
            WHERE id = ?
        `).run(profit_margin, finalPrice, productId);

        res.json({
            success: true,
            final_price: finalPrice,
            breakdown
        });
    } catch (error) {
        console.error('Error updating pricing:', error);
        res.status(500).json({ error: 'Failed to update pricing' });
    }
});

/**
 * ADMIN: Batch approve products with same margin
 */
router.post('/admin/products/batch-approve', (req, res) => {
    const { product_ids, profit_margin } = req.body;

    if (!product_ids || !Array.isArray(product_ids) || !profit_margin) {
        return res.status(400).json({ error: 'Product IDs array and profit margin required' });
    }

    try {
        const results = [];

        const updateStmt = db.prepare(`
            UPDATE store_products 
            SET admin_approved = 1,
                admin_profit_margin = ?,
                admin_final_price = ?
            WHERE id = ?
        `);

        const batchUpdate = db.transaction((productIds, margin) => {
            for (const id of productIds) {
                const product = db.prepare('SELECT * FROM store_products WHERE id = ?').get(id);
                if (product) {
                    const finalPrice = pricingService.calculateCustomerPrice(product.store_cost_price, margin);
                    updateStmt.run(margin, finalPrice, id);
                    results.push({ id, final_price: finalPrice });
                }
            }
        });

        batchUpdate(product_ids, profit_margin);

        res.json({
            success: true,
            approved: results.length,
            products: results
        });
    } catch (error) {
        console.error('Error batch approving:', error);
        res.status(500).json({ error: 'Failed to batch approve' });
    }
});

/**
 * CUSTOMER: Get all approved products (what customers see)
 */
router.get('/products', (req, res) => {
    try {
        const products = db.prepare(`
            SELECT 
                sp.id,
                sp.product_name as name,
                sp.admin_final_price as price_zar,
                sp.stock_qty,
                s.name as store_name,
                s.city as store_city,
                'Premium Cigars' as category,
                'https://placehold.co/400x300?text=Cigar' as image_url
            FROM store_products sp
            JOIN stores s ON sp.store_id = s.id
            WHERE sp.admin_approved = 1 AND sp.stock_qty > 0
            ORDER BY sp.admin_final_price DESC
        `).all();

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

module.exports = router;
