const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Database = require('better-sqlite3');
const ghlService = require('../services/ghlService');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

async function bulkSync() {
    console.log('Starting bulk product sync...');

    // Get all products that haven't been synced or need update
    const products = db.prepare('SELECT * FROM products').all();

    console.log(`Found ${products.length} products to check.`);

    let synced = 0;
    let failed = 0;

    for (const p of products) {
        console.log(`Syncing ${p.name}...`);
        try {
            const result = await ghlService.syncProductToGHL(p);
            if (result) {
                db.prepare('UPDATE products SET ghl_product_id = ?, ghl_price_id = ? WHERE id = ?')
                    .run(result.ghlProductId, result.ghlPriceId, p.id);
                synced++;
            } else {
                failed++;
            }
        } catch (err) {
            console.error(`Failed to sync ${p.name}:`, err.message);
            failed++;
        }

        // Small delay to be nice to API
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\nSync complete! Success: ${synced}, Failed: ${failed}`);
}

bulkSync();
