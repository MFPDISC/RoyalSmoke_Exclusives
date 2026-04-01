const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../database/royalsmoke.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

console.log('Updating RoyalSmoke database schema...');

// Check if store_products table exists and needs migration
const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='store_products'").get();

if (tableInfo) {
    console.log('Migrating store_products table to new schema...');

    // Create new table with updated schema
    db.exec(`
        CREATE TABLE IF NOT EXISTS store_products_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'Premium Cigars',
            image_url TEXT,
            stock_qty INTEGER NOT NULL DEFAULT 0,
            store_cost_price REAL NOT NULL,
            admin_approved INTEGER DEFAULT 0 CHECK(admin_approved IN (0, 1)),
            admin_profit_margin REAL,
            admin_final_price REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(store_id) REFERENCES stores(id)
        );
    `);

    console.log('New store_products table created successfully.');
    console.log('To complete migration, you can:');
    console.log('1. Backup current data if needed');
    console.log('2. Drop old table: DROP TABLE store_products;');
    console.log('3. Rename new table: ALTER TABLE store_products_new RENAME TO store_products;');
} else {
    // Table doesn't exist, create it fresh
    db.exec(`
        CREATE TABLE IF NOT EXISTS store_products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'Premium Cigars',
            image_url TEXT,
            stock_qty INTEGER NOT NULL DEFAULT 0,
            store_cost_price REAL NOT NULL,
            admin_approved INTEGER DEFAULT 0 CHECK(admin_approved IN (0, 1)),
            admin_profit_margin REAL,
            admin_final_price REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(store_id) REFERENCES stores(id)
        );
    `);
    console.log('store_products table created successfully.');
}

console.log('Database schema update complete.');

db.close();
