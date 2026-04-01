const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/royalsmoke.db');
const db = new Database(dbPath);

console.log('Seeding Cannabis products with units...');

const insert = db.prepare(`
    INSERT INTO products (name, description, price_zar, stock_qty, category, image_url, unit) 
    VALUES (@name, @description, @price_zar, @stock_qty, @category, @image_url, @unit)
`);

const products = [
    {
        name: 'Greendoor Indica',
        description: 'Premium local indoor-grown Indica. Relaxing, smooth, and perfect for evening use.',
        price_zar: 55.00,
        stock_qty: 1000,
        category: 'Flower',
        image_url: null,
        unit: 'per g'
    },
    {
        name: 'Primo Haze',
        description: 'Top-shelf export quality Sativa. Energetic, potent, and crystal-rich.',
        price_zar: 120.00,
        stock_qty: 500,
        category: 'Flower',
        image_url: null,
        unit: 'per g'
    },
    {
        name: 'Royal Vapes - Gold 1g',
        description: '95% Pure THC Distillate with organic terpenes. Discrete and powerful.',
        price_zar: 500.00,
        stock_qty: 200,
        category: 'Vapes',
        image_url: null,
        unit: 'each'
    },
    {
        name: 'Greendoor PreRoll',
        description: 'Hand-rolled Greendoor flower. Smooth and consistent.',
        price_zar: 50.00,
        stock_qty: 300,
        category: 'PreRolls',
        image_url: null,
        unit: 'each'
    },
    {
        name: 'Indoor PreRoll',
        description: 'Pure indoor-grown flower. High potency and exceptional flavor.',
        price_zar: 90.00,
        stock_qty: 300,
        category: 'PreRolls',
        image_url: null,
        unit: 'each'
    },
    {
        name: '5x Greendoor PreRolls',
        description: 'Bulk pack of Greendoor PR. Excellent daily value.',
        price_zar: 240.00,
        stock_qty: 100,
        category: 'PreRolls',
        image_url: null,
        unit: 'pack'
    },
    {
        name: '5x Primo Prerolls',
        description: 'Premium bulk pack of Primo PR. The ultimate connoisseur bundle.',
        price_zar: 400.00,
        stock_qty: 100,
        category: 'PreRolls',
        image_url: null,
        unit: 'pack'
    }
];

const deleteOld = db.prepare("DELETE FROM products WHERE category IN ('Flower', 'Vapes', 'PreRolls', 'Cannabis')");
deleteOld.run();

for (const p of products) {
    insert.run(p);
}

console.log(`Successfully seeded ${products.length} Cannabis products with updated PreRoll pricing.`);
db.close();
