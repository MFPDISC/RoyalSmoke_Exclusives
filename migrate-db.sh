#!/bin/bash

# Migrate store_products table to new schema
echo "🔧 Migrating store_products table..."

SERVER="root@104.248.92.92"

ssh "$SERVER" << 'ENDSSH'

cd /var/www/royalsmoke/server

echo "📊 Backing up database..."
cp ../database/royalsmoke.db ../database/royalsmoke.db.backup

echo "🔄 Migrating store_products table..."
sqlite3 ../database/royalsmoke.db << 'EOSQL'

-- Drop old table
DROP TABLE IF EXISTS store_products;
DROP TABLE IF EXISTS store_orders;

-- Create new store_products with correct schema
CREATE TABLE store_products (
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

-- Recreate store_orders to match
CREATE TABLE store_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    store_price REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payout_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(store_id) REFERENCES stores(id),
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES store_products(id)
);

EOSQL

echo "✅ Migration complete!"
echo ""
echo "📋 Verifying new schema:"
sqlite3 ../database/royalsmoke.db "PRAGMA table_info(store_products);"

echo ""
echo "🔄 Restarting API..."
pm2 restart royalsmoke-api

echo ""
echo "✅ All done! Stores can now submit products."

ENDSSH

echo ""
echo "Migration complete! Now:"
echo "1. Go to https://royalsmokecigars.online/admin - check Stores tab ✅"
echo "2. Approve a store"
echo "3. That store can submit products from /store"
