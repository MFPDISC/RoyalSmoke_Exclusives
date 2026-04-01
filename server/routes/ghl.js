const express = require('express');
const router = express.Router();
const axios = require('axios');
const ghlService = require('../services/ghlService');

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';

/**
 * POST /api/ghl/webhook
 * Receives webhooks from GHL for automation triggers
 */
router.post('/webhook', async (req, res) => {
    const { type, contactId, customData } = req.body;

    console.log('[GHL Webhook]', { type, contactId, customData });

    try {
        // Handle different webhook types
        switch (type) {
            case 'cart_abandoned':
                console.log('Cart abandoned:', customData);
                break;

            case 'membership_renewed':
                console.log('Membership renewed:', customData);
                break;

            case 'order_completed':
                console.log('Order completed:', customData);
                break;

            default:
                console.log('Unknown webhook type:', type);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * POST /api/ghl/cart-abandonment
 * Send cart abandonment event to GHL
 */
router.post('/cart-abandonment', async (req, res) => {
    const { contactId, cartItems, cartTotal } = req.body;

    if (!contactId) {
        return res.status(400).json({ error: 'Contact ID required' });
    }

    try {
        // Use GHL service to send abandonment webhook
        await ghlService.sendAbandonedCartWebhook(contactId, {
            total: cartTotal || 0,
            itemCount: cartItems?.length || 0,
            items: cartItems || []
        });

        console.log(`[Cart Abandonment] Tagged contact ${contactId}`);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Cart abandonment tracking failed:', error);
        res.status(500).json({ error: 'Failed to track cart abandonment' });
    }
});

module.exports = router;
