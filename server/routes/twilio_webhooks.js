const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const Database = require('better-sqlite3');
const path = require('path');
const twilioService = require('../services/twilioService');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

// POST /voice - Incoming Call Handler
router.post('/voice', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();

    // Greet the caller
    twiml.say({
        voice: 'alice',
        language: 'en-ZA'
    }, 'Welcome to Royal Smoke. South Africa\'s premium cigar delivery service.');

    // Gather speech input
    const gather = twiml.gather({
        input: 'speech',
        action: '/api/twilio/voice/search',
        method: 'POST',
        timeout: 4,
        speechTimeout: 'auto',
        hints: 'cohiba, montecristo, romeo, partagas, cigars'
    });

    gather.say({
        voice: 'alice',
        language: 'en-ZA'
    }, 'Please tell me which cigar you are looking for.');

    // If no input received
    twiml.say({ voice: 'alice' }, 'I didn\'t hear anything. Please call back to check our stock.');

    res.type('text/xml');
    res.send(twiml.toString());
});

// POST /voice/search - Process Speech & Check Stock
router.post('/voice/search', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    const speechResult = req.body.SpeechResult || '';

    console.log(`[Twilio Voice] Customer asked for: ${speechResult}`);

    try {
        // Search in store_products (approved ones)
        // Fuzzy search for partial match
        const products = db.prepare(`
            SELECT product_name, store_price, stock_qty 
            FROM store_products 
            WHERE admin_approved = 1 
            AND product_name LIKE ? 
            ORDER BY stock_qty DESC 
            LIMIT 1
        `).get(`%${speechResult}%`);

        if (products && products.stock_qty > 0) {
            // Found product
            twiml.say({
                voice: 'alice',
                language: 'en-ZA'
            }, `Yes, we have ${products.product_name} in stock. The price is ${products.store_price.toFixed(0)} rand.`);

            const gather = twiml.gather({
                input: 'speech',
                action: '/api/twilio/voice/payment',
                method: 'POST',
                timeout: 3
            });

            gather.say({
                voice: 'alice',
                language: 'en-ZA'
            }, 'Would you like me to send a payment link to your phone? Say yes or no.');
        } else {
            // Not found
            twiml.say({
                voice: 'alice',
                language: 'en-ZA'
            }, `I'm sorry, I couldn't find matches for ${speechResult} in stock right now.`);

            // Redirect back to main menu
            twiml.redirect('/api/twilio/voice');
        }
    } catch (error) {
        console.error('[Twilio Voice] DB Error:', error);
        twiml.say({ voice: 'alice' }, 'Sorry, I had trouble checking the stock. Please try again later.');
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

// POST /voice/payment - Send SMS
router.post('/voice/payment', async (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    const speechResult = (req.body.SpeechResult || '').toLowerCase();
    const callerPhone = req.body.From;

    if (speechResult.includes('yes') || speechResult.includes('yeah') || speechResult.includes('sure')) {

        // Send SMS
        await twilioService.sendSMS(
            callerPhone,
            "RoyalSmoke: Here is your link to order: https://www.royalsmokecigars.online/cart"
        );

        twiml.say({
            voice: 'alice',
            language: 'en-ZA'
        }, 'Great. I have sent the link to your phone. Happy smoking!');
    } else {
        twiml.say({
            voice: 'alice',
            language: 'en-ZA'
        }, 'No problem. Call us anytime.');
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

// Handle incoming SMS (Legacy/Chat)
router.post('/sms', async (req, res) => {
    const { From, Body } = req.body;
    console.log(`[Twilio SMS] From ${From}: ${Body}`);
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
});

module.exports = router;
