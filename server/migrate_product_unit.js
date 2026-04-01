const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/royalsmoke.db');
const db = new Database(dbPath);

console.log('Adding unit column to products table...');

try {
    db.prepare('ALTER TABLE products ADD COLUMN unit TEXT').run();
    console.log('Column added successfully.');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log('Column already exists.');
    } else {
        console.log('Error adding column:', err.message);
    }
}

db.close();
