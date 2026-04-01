const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../database/royalsmoke.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

console.log('Initializing database at', dbPath);

const schema = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT,
    address TEXT,
    postal_code TEXT,
    is_18_plus INTEGER CHECK(is_18_plus IN (0, 1)),
    marketing_opt_in INTEGER CHECK(marketing_opt_in IN (0, 1)),
    is_vip INTEGER DEFAULT 0 CHECK(is_vip IN (0, 1)),
    vip_joined_at DATETIME,
    last_free_cigar_month TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price_zar REAL NOT NULL,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    image_url TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'paid', 'packing', 'dispatched', 'delivered')) DEFAULT 'pending',
    total_amount REAL NOT NULL,
    delivery_fee REAL NOT NULL,
    uber_request_id TEXT,
    uber_tracking_url TEXT,
    uber_driver_name TEXT,
    uber_driver_phone TEXT,
    uber_vehicle_info TEXT,
    uber_eta INTEGER,
    uber_status TEXT,
    payment_ref TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS financials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_year TEXT NOT NULL, -- Format: YYYY-MM
    total_revenue REAL DEFAULT 0,
    fixed_costs REAL DEFAULT 16000,
    net_profit REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT,
    latitude REAL,
    longitude REAL,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    is_approved INTEGER DEFAULT 0 CHECK(is_approved IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS store_orders (
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
    FOREIGN KEY(product_id) REFERENCES products(id)
);
`;

db.exec(schema);

console.log('Database initialized successfully.');

// Seed some initial products if empty
const productCount = db.prepare('SELECT count(*) as count FROM products').get();

if (productCount.count === 0) {
    console.log('Seeding initial products...');
    const insert = db.prepare('INSERT INTO products (name, description, price_zar, stock_qty, category, image_url) VALUES (@name, @description, @price_zar, @stock_qty, @category, @image_url)');
    const products = [
        {
            name: 'Cohiba Robusto',
            description: 'Rich and classic Cuban. A perfect Robusto with notes of vanilla and cocoa.',
            price_zar: 850.00,
            stock_qty: 10,
            category: 'Cubans',
            image_url: 'https://images.unsplash.com/photo-1574279606130-09958dc756f7?w=800&q=80'
        },
        {
            name: 'Montecristo No. 2',
            description: 'The legendary torpedo. Full-bodied with spicy and woody flavors.',
            price_zar: 920.00,
            stock_qty: 5,
            category: 'Cubans',
            image_url: 'https://images.unsplash.com/photo-1627807773228-76785e576067?w=800&q=80'
        },
        {
            name: 'Romeo y Julieta Wide Churchill',
            description: 'Smooth and aromatic. Famous for its balanced, medium-bodied profile.',
            price_zar: 780.00,
            stock_qty: 15,
            category: 'Cubans',
            image_url: 'https://images.unsplash.com/photo-1614763605373-587425d73552?w=800&q=80'
        },
        {
            name: 'Partagas Serie D No. 4',
            description: 'Full bodied power. Earthy and robust, a true connoisseur\'s choice.',
            price_zar: 650.00,
            stock_qty: 20,
            category: 'Cubans',
            image_url: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=800&q=80'
        },
        {
            name: 'Christmas Combo Special',
            description: '3x Mystery Sticks + Cutter. The perfect gift set for the holidays.',
            price_zar: 1200.00,
            stock_qty: 50,
            category: 'Combos',
            image_url: 'https://images.unsplash.com/photo-1560707303-4e9803d166e9?w=800&q=80'
        }
    ];

    const insertMany = db.transaction((products) => {
        for (const product of products) insert.run(product);
    });

    insertMany(products);
    console.log('Seeding complete.');
}

// Force update images for existing products to ensure they match the improved lookalikes
console.log('Updating product images...');
const updateStmt = db.prepare('UPDATE products SET image_url = ? WHERE name = ?');
const updates = [
    { name: 'Cohiba Robusto', url: 'https://images.unsplash.com/photo-1574279606130-09958dc756f7?w=800&q=80' },
    { name: 'Montecristo No. 2', url: 'https://images.unsplash.com/photo-1627807773228-76785e576067?w=800&q=80' },
    { name: 'Romeo y Julieta Wide Churchill', url: 'https://images.unsplash.com/photo-1614763605373-587425d73552?w=800&q=80' },
    { name: 'Partagas Serie D No. 4', url: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=800&q=80' },
    { name: 'Christmas Combo Special', url: 'https://images.unsplash.com/photo-1560707303-4e9803d166e9?w=800&q=80' }
];

const runUpdates = db.transaction((items) => {
    for (const item of items) updateStmt.run(item.url, item.name);
});
runUpdates(updates);
console.log('Product images updated.');

db.close();
