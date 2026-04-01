const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

// GET Financials
router.get('/', (req, res) => {
    try {
        // For MVP, calculate dynamically from orders if not using aggregated table yet, 
        // or just read from financials table.
        // Let's do a dynamic calculation for "Live" status.

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        // aggregate revenue
        const revenueStmt = db.prepare(`
            SELECT SUM(total_amount) as total_revenue 
            FROM orders 
            WHERE status != 'pending' AND strftime('%Y-%m', created_at) = ?
        `);
        const result = revenueStmt.get(currentMonth);
        const totalRevenue = result.total_revenue || 0;

        const fixedCosts = 16000;
        // Cost of Goods Sold (COGS) - ideally tracked per product, but for now we might need an estimate 
        // or query products linked to orders.
        // For MVP, let's assume COGS is approx 60% of revenue or we need a cogs field in products. 
        // The prompt says: (Total Revenue - Cost of Goods - R16,000) = Net Profit.
        // We don't have COGS in the schema explicitly per order item. 
        // Let's assume a margin or simple calculation for now, or just send revenue and fixed stats.

        // Actually the prompt schema has "Financials Table".
        // Let's use that but update it on the fly or return current status.

        const netProfit = totalRevenue - fixedCosts; // Simplified without COGS for now as it's missing from schema.

        res.json({
            month: currentMonth,
            total_revenue: totalRevenue,
            fixed_costs: fixedCosts,
            net_profit: netProfit, // Note: COGS missing
            target: 16000
        });

    } catch (error) {
        console.error('Error fetching financials:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
