const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/royalsmoke.db');
console.log('Database path:', dbPath);

const db = new Database(dbPath, { verbose: console.log });

console.log('\n=== Testing Stores Table ===\n');

// Check if table exists
const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='stores'").get();
console.log('Stores table exists:', tableCheck ? 'YES' : 'NO');

if (tableCheck) {
    // Get all stores
    const stores = db.prepare('SELECT * FROM stores').all();
    console.log('\nTotal stores:', stores.length);
    console.log('\nStores data:');
    console.log(JSON.stringify(stores, null, 2));
}

db.close();
