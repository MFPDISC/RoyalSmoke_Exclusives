const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const ghlService = require('../services/ghlService');
const twilioService = require('../services/twilioService');
const uberDirectService = require('../services/uberDirectService');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

/**
 * Create payment session
 * Called from frontend when customer clicks "Pay Now"
 */
router.post('/create-payment', (req, res) => {
    const { orderId, amount, customerName, customerEmail, customerPhone, items } = req.body;

    try {
        // Get order details from database
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Create GHL payment
        const payment = ghlService.createPayment({
            orderId,
            amount,
            customerName,
            customerEmail,
            customerPhone,
            items
        });

        if (!payment) {
            return res.status(500).json({ error: 'GHL not configured' });
        }

        res.json({
            success: true,
            paymentUrl: payment.url,
            paymentData: payment.data
        });
    } catch (error) {
        console.error('[PAYFAST] Create payment error:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

/**
 * GHL Webhook (Instant Payment Notification)
 * GHL calls this when invoice status changes
 */
router.post('/notify', async (req, res) => {
    console.log('[GHL] Webhook received:', req.body);

    try {
        // Check if it's invoice paid event
        if (req.body.event !== 'invoice.paid') {
            console.log('[GHL] Ignoring non-payment event:', req.body.event);
            return res.status(200).send('Ignored');
        }

        const invoice = req.body.data.invoice;
        const title = invoice.title || '';
        const orderIdMatch = title.match(/RoyalSmoke Order (\d+)/);

        if (!orderIdMatch) {
            console.error('[GHL] Could not parse order ID from title:', title);
            return res.status(400).send('Invalid order ID');
        }

        const orderId = orderIdMatch[1];
        const paymentId = invoice.id;

        // Update order status in database
        const updateResult = db.prepare(`
            UPDATE orders 
            SET status = 'paid', 
                payment_ref = ?
            WHERE id = ?
        `).run(paymentId, orderId);

        if (updateResult.changes === 0) {
            console.error('[GHL] Order not found:', orderId);
            return res.status(404).send('Order not found');
        }

        console.log(`[GHL] Order ${orderId} marked as paid`);

        // Get order and customer details
        const order = db.prepare(`
            SELECT o.*, u.phone, u.name, u.address, u.latitude, u.longitude
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `).get(orderId);

        // Send SMS confirmation
        twilioService.sendOrderConfirmation(
            order.phone,
            orderId,
            order.total_amount, // Assuming total_amount is the amount
            '30-45 min'
        );

        // Request Uber delivery if location available
        if (order.latitude && order.longitude) {
            // Find store assigned to this order
            const storeOrder = db.prepare(`
                SELECT s.* FROM store_orders so
                JOIN stores s ON so.store_id = s.id
                WHERE so.order_id = ?
                LIMIT 1
            `).get(orderId);

            if (storeOrder && storeOrder.latitude && storeOrder.longitude) {
                console.log(`[UBER] Requesting delivery for paid order ${orderId}`);
                
                const delivery = await uberDirectService.createDelivery(
                    {
                        address: `${storeOrder.address}, ${storeOrder.city}`,
                        latitude: storeOrder.latitude,
                        longitude: storeOrder.longitude,
                        phone: storeOrder.phone,
                        name: storeOrder.name
                    },
                    {
                        address: order.address,
                        latitude: order.latitude,
                        longitude: order.longitude,
                        phone: order.phone,
                        name: order.name
                    },
                    {
                        order_id: orderId,
                        pickup_notes: `RoyalSmoke Order #${orderId} - Premium cigars`,
                        dropoff_notes: `Order #${orderId} - ID check required (18+)`
                    }
                );

                if (delivery.success) {
                    // Update order with Uber delivery info
                    db.prepare(`
                        UPDATE orders SET 
                            uber_request_id = ?,
                            uber_status = ?,
                            uber_tracking_url = ?
                        WHERE id = ?
                    `).run(delivery.id, delivery.status, delivery.tracking_url, orderId);

                    console.log(`[UBER] Delivery created: ${delivery.id}`);
                }
            }
        }

        // Respond to GHL
        res.status(200).send('OK');
    } catch (error) {
        console.error('[GHL] Webhook processing error:', error);
        res.status(500).send('Error processing webhook');
    }
});

/**
 * Payment success return URL
 * Customer is redirected here after successful payment
 */
router.get('/success', (req, res) => {
    const verification = payfastService.verifyPaymentReturn(req.query);
    
    // Redirect to frontend with success message
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-confirmation?orderId=${verification.orderId}`);
});

/**
 * Payment cancelled return URL
 * Customer is redirected here if they cancel payment
 */
router.get('/cancel', (req, res) => {
    // Redirect to frontend with cancellation message
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-cancelled`);
});

module.exports = router;
