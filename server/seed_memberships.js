const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const ghlService = require('./services/ghlService');

const dbPath = path.resolve(__dirname, '../database/royalsmoke.db');
const db = new Database(dbPath);

const membershipPlans = [
    {
        name: 'Member Access - Annual VIP',
        description: 'Tier 1: 10% storewide discount (up to R1,000/month) + box pricing on 6+ singles + R99 shipping credit + 24h early access to new drops. Billed annually (2 months free vs monthly).',
        price_zar: 1490, // R149/month x 10 months
        category: 'Membership',
        image_url: 'https://images.unsplash.com/photo-1556742400-b5b7c256b589?w=800',
        stock_qty: 999,
        is_subscription: 1
    },
    {
        name: 'Reserve Club - Annual VIP',
        description: 'Tier 2: 1 free best-seller cigar/month + 15% storewide discount + R99 shipping credit + 48h early access + Reserve Token. Billed annually (2 months free vs monthly).',
        price_zar: 7490, // R749/month x 10 months
        category: 'Membership',
        image_url: 'https://images.unsplash.com/photo-1583225214464-9296029427aa?w=800',
        stock_qty: 999,
        is_subscription: 1
    },
    {
        name: 'Founders Black - Annual VIP',
        description: 'Tier 3: 2 free best-seller cigars/month + 20% storewide discount + free same-day dispatch priority + concierge sourcing + Founder-only drops + Founders Coin. Billed annually (2 months free vs monthly).',
        price_zar: 14990, // R1,499/month x 10 months
        category: 'Membership',
        image_url: 'https://images.unsplash.com/photo-1594534168065-e2e0c9e0eb1b?w=800',
        stock_qty: 200, // Limited to 200 members
        is_subscription: 1
    }
];

async function seedMembershipProducts() {
    console.log('🎯 Starting membership products seed...\n');

    for (const plan of membershipPlans) {
        console.log(`📦 Processing: ${plan.name}`);

        // Check if product already exists
        const existing = db.prepare('SELECT * FROM products WHERE name = ?').get(plan.name);

        let productId;
        if (existing) {
            console.log(`   ↪ Already exists (ID: ${existing.id}), updating...`);
            db.prepare(`
                UPDATE products 
                SET description = ?, price_zar = ?, category = ?, image_url = ?, stock_qty = ?
                WHERE id = ?
            `).run(plan.description, plan.price_zar, plan.category, plan.image_url, plan.stock_qty, existing.id);
            productId = existing.id;
        } else {
            console.log(`   ↪ Creating new product...`);
            const result = db.prepare(`
                INSERT INTO products (name, description, price_zar, category, image_url, stock_qty)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(plan.name, plan.description, plan.price_zar, plan.category, plan.image_url, plan.stock_qty);
            productId = result.lastInsertRowid;
            console.log(`   ✅ Created with ID: ${productId}`);
        }

        // Sync to GHL
        console.log(`   🔄 Syncing to GHL...`);
        try {
            const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
            const ghlResult = await ghlService.syncProductToGHL(product);

            if (ghlResult) {
                db.prepare('UPDATE products SET ghl_product_id = ?, ghl_price_id = ? WHERE id = ?')
                    .run(ghlResult.ghlProductId, ghlResult.ghlPriceId, productId);
                console.log(`   ✅ Synced to GHL (Product: ${ghlResult.ghlProductId}, Price: ${ghlResult.ghlPriceId})`);
            } else {
                console.log(`   ⚠️ GHL sync returned null`);
            }
        } catch (err) {
            console.error(`   ❌ GHL sync failed:`, err.message);
        }

        console.log('');
    }

    console.log('✅ Membership products seeding complete!\n');

    // Display summary
    const allMemberships = db.prepare("SELECT * FROM products WHERE category = 'Membership' ORDER BY price_zar ASC").all();
    console.log('📊 Current Membership Products:');
    console.table(allMemberships.map(p => ({
        ID: p.id,
        Name: p.name,
        Price: `R${p.price_zar}`,
        Stock: p.stock_qty,
        GHL_Product: p.ghl_product_id ? '✓' : '✗',
        GHL_Price: p.ghl_price_id ? '✓' : '✗'
    })));

    db.close();
}

seedMembershipProducts().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
