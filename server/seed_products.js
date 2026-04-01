const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/royalsmoke.db');
const db = new Database(dbPath);

console.log('Seeding demo products with default icon...');

const insert = db.prepare(`
    INSERT INTO products (name, description, price_zar, stock_qty, category, image_url) 
    VALUES (@name, @description, @price_zar, @stock_qty, @category, @image_url)
`);

// Path to the new SVG icon
const DEFAULT_ICON = '/cigar-placeholder.svg';

const products = [
    {
        name: 'Cohiba Robusto',
        description: 'Rich and classic Cuban. A perfect Robusto with notes of vanilla and cocoa.',
        price_zar: 850.00,
        stock_qty: 10,
        category: 'Cubans',
        image_url: DEFAULT_ICON
    },
    {
        name: 'Montecristo No. 2',
        description: 'The legendary torpedo. Full-bodied with spicy and woody flavors.',
        price_zar: 920.00,
        stock_qty: 5,
        category: 'Cubans',
        image_url: DEFAULT_ICON
    },
    {
        name: 'Romeo y Julieta Wide Churchill',
        description: 'Smooth and aromatic. Famous for its balanced, medium-bodied profile.',
        price_zar: 780.00,
        stock_qty: 15,
        category: 'Cubans',
        image_url: DEFAULT_ICON
    },
    {
        name: 'Partagas Serie D No. 4',
        description: 'Full bodied power. Earthy and robust, a true connoisseur\'s choice.',
        price_zar: 650.00,
        stock_qty: 20,
        category: 'Cubans',
        image_url: DEFAULT_ICON
    },
    {
        name: 'Hoyo de Monterrey Epicure No. 2',
        description: 'Light, delicate, and aromatic. A perfect morning smoke.',
        price_zar: 720.00,
        stock_qty: 12,
        category: 'Cubans',
        image_url: DEFAULT_ICON
    },
    {
        name: 'Davidoff Signature 2000',
        description: 'Dominican elegance. Creamy coffee and wood notes.',
        price_zar: 680.00,
        stock_qty: 8,
        category: 'Non-Cubans',
        image_url: DEFAULT_ICON
    },
    {
        name: 'Christmas Combo Special',
        description: '3x Mystery Sticks + Cutter. The perfect gift set.',
        price_zar: 1200.00,
        stock_qty: 50,
        category: 'Combos',
        image_url: DEFAULT_ICON
    },
    {
        name: 'Xikar Cutter',
        description: 'Premium stainless steel double guillotine cutter.',
        price_zar: 1450.00,
        stock_qty: 5,
        category: 'Accessories',
        image_url: DEFAULT_ICON
    }
];

// Update all products to use the icon
const updateAllImages = db.prepare('UPDATE products SET image_url = ?');
const info = updateAllImages.run(DEFAULT_ICON);

console.log(`Updated ${info.changes} products to use default icon.`);

db.close();
