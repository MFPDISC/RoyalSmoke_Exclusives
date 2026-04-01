const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/royalsmoke.db');
const db = new Database(dbPath);

try {
    console.log('Clearing stores...');
    db.prepare('DELETE FROM stores').run();

    console.log('Clearing customers (users)...');
    // Assuming 'users' is the customers table based on previous file reads, or 'customers'
    // Let's check stores.js: "JOIN users u ON o.user_id = u.id"
    db.prepare('DELETE FROM users').run();

    console.log('Database cleared successfully.');
} catch (error) {
    console.error('Error clearing database:', error.message);
}
