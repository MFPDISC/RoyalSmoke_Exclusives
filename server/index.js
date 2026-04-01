const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Import Routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const financialRoutes = require('./routes/financials');
const storeRoutes = require('./routes/stores');
const payfastRoutes = require('./routes/payfast');
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const vipRoutes = require('./routes/vip');
const storeProductRoutes = require('./routes/store_products');
const twilioWebhooks = require('./routes/twilio_webhooks');
const twilioService = require('./services/twilioService'); // Ensure service is loaded
const leadsRoutes = require('./routes/leads');
const ghlRoutes = require('./routes/ghl');

const app = express();
const PORT = process.env.PORT || 5001;
const dbPath = path.resolve(__dirname, '../database/royalsmoke.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // For Twilio webhooks

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/financials', financialRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/stores', storeProductRoutes);
app.use('/api/payfast', payfastRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/ghl', ghlRoutes);

// Database Connection
const db = new Database(dbPath, { verbose: console.log });

const ensureUserColumns = () => {
    const cols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
    const addCol = (name, def) => {
        if (!cols.includes(name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} ${def}`);
    };

    addCol('pin_hash', 'TEXT');
    addCol('password_set_at', 'DATETIME');
    addCol('vip_tier', 'TEXT');
    addCol('cigars_claimed_this_month', 'INTEGER DEFAULT 0');

    db.exec('UPDATE users SET pin_hash = password_hash WHERE pin_hash IS NULL');
    db.exec('UPDATE users SET cigars_claimed_this_month = 0 WHERE cigars_claimed_this_month IS NULL');
};

const ensureProductColumns = () => {
    try {
        const cols = db.prepare("PRAGMA table_info(products)").all().map(c => c.name);
        const addCol = (name, def) => {
            if (!cols.includes(name)) {
                console.log(`Adding column ${name} to products...`);
                db.exec(`ALTER TABLE products ADD COLUMN ${name} ${def}`);
            }
        };

        addCol('ghl_product_id', 'TEXT');
        addCol('ghl_price_id', 'TEXT');
    } catch (err) {
        console.error('Error migrating products table:', err.message);
    }
};

ensureUserColumns();
ensureProductColumns();

// Basic Route
app.get('/', (req, res) => {
    res.send('RoyalSmoke API Verified');
});

// Setup Twilio inbound voice webhooks
app.use('/api/twilio', twilioWebhooks);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Twilio webhooks ready at http://localhost:${PORT}/api/twilio/voice`);
});
