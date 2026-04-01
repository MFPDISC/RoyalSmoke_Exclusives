const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const uberService = require('../services/uberService');
const uberDemoService = require('../services/uberDemoService');
const twilioService = require('../services/twilioService');
const ghlService = require('../services/ghlService');
const emailService = require('../services/emailService');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

// Generate 3-digit PIN
const generatePIN = () => {
    return Math.floor(100 + Math.random() * 900).toString();
};

// Find or create customer by phone number
const findOrCreateCustomer = async (customer) => {
    const existing = db.prepare('SELECT * FROM users WHERE phone = ?').get(customer.phone);

    if (existing) {
        // ALWAYS update address and DOB if provided
        const updates = [];
        const params = [];

        if (customer.address) {
            updates.push('address = ?');
            params.push(customer.address);
        }
        if (customer.postal_code) {
            updates.push('postal_code = ?');
            params.push(customer.postal_code);
        }
        if (customer.dob) {
            updates.push('date_of_birth = ?');
            params.push(customer.dob);
        }
        if (customer.email && !existing.email) {
            updates.push('email = ?');
            params.push(customer.email);
        }

        if (updates.length > 0) {
            params.push(existing.id);
            db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        }

        return { user: { ...existing, ...customer }, isNew: false, pin: null };
    }

    // Create new customer with 3-digit PIN
    const pin = generatePIN();
    const password_hash = await bcrypt.hash(pin, 10);
    const pin_hash = password_hash;

    // Sync to GHL first to get Contact ID
    const ghlContactId = await ghlService.syncCustomerToGHL({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        postal_code: customer.postal_code
    });

    const stmt = db.prepare(`
        INSERT INTO users (name, phone, password_hash, pin_hash, email, address, postal_code, date_of_birth, is_18_plus, ghl_contact_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const result = stmt.run(
        customer.name,
        customer.phone,
        password_hash,
        pin_hash,
        customer.email || null,
        customer.address,
        customer.postal_code,
        customer.dob || null, // Save DOB
        ghlContactId
    );

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

    // Send PIN via SMS
    twilioService.sendPIN(customer.phone, pin, customer.name);

    return { user: newUser, isNew: true, pin };
};

// Find nearest store with stock for a product
const findNearestStoreWithStock = (productId, quantity, lat, lng) => {
    if (!lat || !lng) {
        // Fallback: just find any store with stock
        return db.prepare(`
            SELECT s.*, sp.stock_qty, sp.store_price
            FROM stores s
            JOIN store_products sp ON s.id = sp.store_id
            WHERE s.is_active = 1 AND s.is_approved = 1 
            AND sp.product_id = ? AND sp.stock_qty >= ?
            LIMIT 1
        `).get(productId, quantity);
    }

    // Use Haversine formula to find nearest store
    return db.prepare(`
        SELECT s.*, sp.stock_qty, sp.store_price,
               (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
        FROM stores s
        JOIN store_products sp ON s.id = sp.store_id
        WHERE s.is_active = 1 AND s.is_approved = 1 
        AND sp.product_id = ? AND sp.stock_qty >= ?
        ORDER BY distance ASC
        LIMIT 1
    `).get(lat, lng, lat, productId, quantity);
};

// Create Order with store fulfillment
router.post('/', async (req, res) => {
    const { customer, total_amount, items, delivery_fee, latitude, longitude } = req.body;

    // items should be array of { product_id, quantity, price }

    try {
        // 1. Find or create customer
        const { user, isNew, pin } = await findOrCreateCustomer(customer);
        const user_id = user.id;

        // Check if VIP and eligible for free monthly cigar
        const currentMonth = new Date().toISOString().slice(0, 7);
        const isVipEligible = user.is_vip && user.last_free_cigar_month !== currentMonth;

        // Reset monthly discount tracking if it's a new month
        if (user.discount_reset_month !== currentMonth) {
            db.prepare('UPDATE users SET discount_used_this_month = 0, discount_reset_month = ? WHERE id = ?')
                .run(currentMonth, user_id);
            user.discount_used_this_month = 0;
            user.discount_reset_month = currentMonth;
        }

        if (isVipEligible) {
            // Add free cigar to items
            items.push({
                product_id: 'vip-free-cigar',
                quantity: 1,
                price: 0
            });

            // Mark as claimed
            db.prepare('UPDATE users SET last_free_cigar_month = ? WHERE id = ?').run(currentMonth, user_id);
            console.log(`[VIP] Free cigar added for user ${user_id}`);
        }

        // TODO: Send SMS with PIN to customer.phone if isNew
        // For now, we'll log it and return it in response (remove in production)
        if (isNew) {
            console.log(`[NEW CUSTOMER] ${customer.phone} - PIN: ${pin}`);
        }

        const createOrder = db.transaction(() => {
            const storeAssignments = [];
            const virtualAssignments = [];

            // 1. Find stores for each item
            for (const item of items) {
                const rawProductId = item.product_id;
                const numericProductId = Number(rawProductId);
                const isNumericProductId = Number.isFinite(numericProductId) && String(rawProductId).match(/^\d+$/);

                if (!isNumericProductId) {
                    virtualAssignments.push({ ...item, store_id: null, store_price: null, retail_price: item.price || 0 });
                    continue;
                }

                const store = findNearestStoreWithStock(numericProductId, item.quantity, latitude, longitude);

                if (!store) {
                    // Fallback to main inventory
                    const product = db.prepare('SELECT stock_qty, price_zar FROM products WHERE id = ?').get(numericProductId);
                    if (!product || product.stock_qty < item.quantity) {
                        throw new Error(`Insufficient stock for product ${rawProductId}`);
                    }
                    storeAssignments.push({ ...item, product_id: numericProductId, store_id: null, store_price: null, retail_price: product.price_zar });
                } else {
                    storeAssignments.push({
                        ...item,
                        product_id: numericProductId,
                        store_id: store.id,
                        store_price: store.store_price,
                        retail_price: item.price || store.store_price * 1.3 // 30% markup default
                    });
                }
            }

            // 2. Create Order
            const stmt = db.prepare('INSERT INTO orders (user_id, total_amount, delivery_fee, status) VALUES (?, ?, ?, ?)');
            const info = stmt.run(user_id, total_amount, delivery_fee, 'pending');
            const orderId = info.lastInsertRowid;

            // 3. Create store_orders and deduct stock
            const insertStoreOrder = db.prepare(`
            INSERT INTO store_orders (order_id, store_id, product_id, quantity, store_price, retail_price, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `);
            const updateStoreStock = db.prepare('UPDATE store_products SET stock_qty = stock_qty - ? WHERE store_id = ? AND product_id = ?');
            const updateMainStock = db.prepare('UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?');

            let totalVipSavings = 0;

            for (const assignment of storeAssignments) {
                if (assignment.retail_price > assignment.price) {
                    totalVipSavings += (assignment.retail_price - assignment.price) * assignment.quantity;
                }

                if (assignment.store_id) {
                    // Deduct from partner store
                    insertStoreOrder.run(orderId, assignment.store_id, assignment.product_id, assignment.quantity, assignment.store_price, assignment.retail_price);
                    updateStoreStock.run(assignment.quantity, assignment.store_id, assignment.product_id);
                } else {
                    // Deduct from main inventory
                    updateMainStock.run(assignment.quantity, assignment.product_id);
                }
            }

            // Update user's monthly discount usage
            if (totalVipSavings > 0) {
                db.prepare('UPDATE users SET discount_used_this_month = discount_used_this_month + ? WHERE id = ?')
                    .run(totalVipSavings, user_id);
                console.log(`[VIP] Discount tracked: R${totalVipSavings.toFixed(2)} for user ${user_id}`);
            }

            return { orderId, storeAssignments, virtualAssignments, totalVipSavings };
        });

        const result = createOrder();

        // Send to GHL (async, don't wait)
        ghlService.syncOrderToGHL({
            id: result.orderId,
            status: 'pending',
            total_amount: total_amount
        }, user).catch(err => console.error('[GHL] Order sync failed:', err.message));

        // Send order confirmation webhook to GHL for SMS automation
        if (user.ghl_contact_id) {
            ghlService.sendOrderConfirmationWebhook(user.ghl_contact_id, {
                orderId: result.orderId,
                total: total_amount,
                eta: '30-45 min'
            }).catch(err => console.error('[GHL] Order confirmation webhook failed:', err.message));
        }

        // Send email notification (async)
        const emailOrder = {
            id: result.orderId,
            total_amount: total_amount,
            delivery_fee: delivery_fee,
            items: items.map(idx => {
                const p = db.prepare('SELECT name FROM products WHERE id = ?').get(idx.product_id);
                return { ...idx, name: p ? p.name : idx.product_id };
            })
        };
        emailService.sendOrderNotification(emailOrder, customer).catch(err => console.error('[EMAIL] Order sync failed:', err.message));

        // Send order confirmation SMS
        twilioService.sendOrderConfirmation(
            customer.phone,
            result.orderId,
            total_amount,
            '30-45 min'
        );

        // Request Uber delivery (DEMO MODE for testing)
        let uberInfo = null;
        const primaryStore = result.storeAssignments.find(a => a.store_id);

        // Use DEMO service for now (no API credentials needed)
        if (latitude && longitude) {
            console.log(`[UBER] Creating DEMO delivery for testing`);

            const demoDelivery = uberDemoService.createDemoDelivery(
                {
                    address: primaryStore ? 'RoyalSmoke Store, Pretoria' : 'Main Warehouse',
                    latitude: -25.7479,
                    longitude: 28.2293,
                    phone: '+27 82 000 0000',
                    name: 'RoyalSmoke Store'
                },
                {
                    address: customer.address,
                    latitude: latitude,
                    longitude: longitude,
                    phone: customer.phone,
                    name: customer.name
                },
                {
                    order_id: result.orderId
                }
            );

            if (demoDelivery.success) {
                uberInfo = demoDelivery;

                // Generate all tracking links
                const trackingLinks = uberDemoService.generateTrackingLink(demoDelivery.id);

                // Update order with Uber demo info
                db.prepare(`
                    UPDATE orders SET 
                        uber_request_id = ?,
                        uber_status = ?,
                        uber_tracking_url = ?,
                        uber_driver_name = ?,
                        uber_driver_phone = ?,
                        uber_vehicle_info = ?,
                        uber_eta = ?
                    WHERE id = ?
                `).run(
                    demoDelivery.id,
                    demoDelivery.status,
                    trackingLinks.universal_link,
                    demoDelivery.courier?.name || null,
                    demoDelivery.courier?.phone || null,
                    demoDelivery.courier?.vehicle || null,
                    demoDelivery.dropoff_eta || null,
                    result.orderId
                );

                console.log(`[UBER DEMO] Delivery created: ${demoDelivery.id}`);
                console.log(`[UBER DEMO] Track here: ${trackingLinks.universal_link}`);
                console.log(`[UBER DEMO] Open in app: ${trackingLinks.app_deep_link}`);
            }
        }

        res.json({
            message: 'Order created',
            orderId: result.orderId,
            status: 'pending',
            isNewCustomer: isNew,
            uber: uberInfo ? {
                request_id: uberInfo.id,
                status: uberInfo.status,
                eta: uberInfo.dropoff_eta,
                tracking_url: uberInfo.tracking_url,
                app_deep_link: uberInfo.app_deep_link,
                driver: uberInfo.courier,
                demo: uberInfo.demo || false
            } : null,
            fulfillment: result.storeAssignments.map(a => ({
                product_id: a.product_id,
                store_id: a.store_id,
                source: a.store_id ? 'partner_store' : 'main_inventory'
            }))
        });
    } catch (error) {
        console.error('Order failed:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get all orders (admin)
router.get('/', (req, res) => {
    try {
        const orders = db.prepare(`
            SELECT o.*, u.name as customer_name, u.phone as customer_phone, u.address as customer_address
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `).all();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'paid', 'packing', 'dispatched', 'delivered'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const order = db.prepare('SELECT o.*, u.phone, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?').get(req.params.orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.orderId);

        // Also update store_orders status
        if (['dispatched', 'delivered'].includes(status)) {
            db.prepare('UPDATE store_orders SET status = ? WHERE order_id = ?').run(status, req.params.orderId);
        }

        // Send SMS notifications for status changes
        if (status === 'dispatched') {
            twilioService.sendDeliveryUpdate(
                order.phone,
                req.params.orderId,
                'dispatched',
                order.uber_driver_name,
                order.uber_eta
            );
        } else if (status === 'delivered') {
            twilioService.sendDeliveryUpdate(
                order.phone,
                req.params.orderId,
                'delivered'
            );
        }

        result.changes > 0 ? res.json({ message: 'Status updated' }) : res.status(404).json({ error: 'Order not found' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Get all customers (admin)
router.get('/customers', (req, res) => {
    try {
        const customers = db.prepare(`
            SELECT u.id, u.name, u.phone, u.email, u.address, u.postal_code, u.created_at,
                   COUNT(o.id) as order_count,
                   COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `).all();
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Get Uber ride status for an order
router.get('/:orderId/uber-status', async (req, res) => {
    try {
        const order = db.prepare('SELECT uber_request_id FROM orders WHERE id = ?').get(req.params.orderId);

        if (!order || !order.uber_request_id) {
            return res.status(404).json({ error: 'No Uber delivery for this order' });
        }

        const status = await uberService.getRideStatus(order.uber_request_id);

        if (status) {
            // Update order with latest Uber info
            db.prepare(`
                UPDATE orders SET 
                    uber_status = ?,
                    uber_driver_name = ?,
                    uber_driver_phone = ?,
                    uber_vehicle_info = ?,
                    uber_eta = ?
                WHERE id = ?
            `).run(
                status.status,
                status.driver?.name || null,
                status.driver?.phone_number || null,
                status.vehicle ? `${status.vehicle.make} ${status.vehicle.model} - ${status.vehicle.license_plate}` : null,
                status.eta || null,
                req.params.orderId
            );

            res.json(status);
        } else {
            res.status(404).json({ error: 'Could not fetch Uber status' });
        }
    } catch (error) {
        console.error('Error fetching Uber status:', error);
        res.status(500).json({ error: 'Failed to fetch Uber status' });
    }
});

// Get Uber price estimate (for admin to set delivery fees)
router.post('/uber-estimate', async (req, res) => {
    const { start_lat, start_lng, end_lat, end_lng } = req.body;

    try {
        const estimates = await uberService.getPriceEstimate(start_lat, start_lng, end_lat, end_lng);
        res.json(estimates || []);
    } catch (error) {
        console.error('Error getting Uber estimate:', error);
        res.status(500).json({ error: 'Failed to get estimate' });
    }
});

// Public Order Status Tracking
router.get('/:orderId/public', async (req, res) => {
    try {
        const order = db.prepare(`
            SELECT 
                o.id, o.status, o.total_amount, o.delivery_fee, o.created_at,
                o.uber_status, o.uber_tracking_url, o.uber_driver_name, o.uber_eta,
                u.name as customer_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `).get(req.params.orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('[PUBLIC ORDER] Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch order status' });
    }
});

module.exports = router;
