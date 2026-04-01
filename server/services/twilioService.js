const twilio = require('twilio');

/**
 * Twilio Integration for RoyalSmoke
 * - SMS for customer PINs and order notifications
 * - Outbound calls for delivery updates
 * - Inbound AI agent for order taking (future)
 * 
 * Setup:
 * 1. Get credentials from https://console.twilio.com
 * 2. Add to .env:
 *    TWILIO_ACCOUNT_SID=your_account_sid
 *    TWILIO_AUTH_TOKEN=your_auth_token
 *    TWILIO_PHONE_NUMBER=your_twilio_number
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
} else {
    console.log('[TWILIO] Credentials not configured');
}

/**
 * Send SMS message
 */
const sendSMS = async (to, message) => {
    if (!client) {
        console.log('[TWILIO] SMS not sent - credentials not configured');
        console.log(`[TWILIO] Would send to ${to}: ${message}`);
        return { success: false, message: 'Twilio not configured' };
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: to
        });

        console.log(`[TWILIO] SMS sent to ${to}: ${result.sid}`);
        return { success: true, sid: result.sid };
    } catch (error) {
        console.error('[TWILIO] SMS failed:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Send customer PIN via SMS
 */
const sendPIN = async (phone, pin, customerName) => {
    const message = `Welcome to RoyalSmoke, ${customerName}! Your login PIN is: ${pin}\n\nUse this PIN for future orders. Keep it safe!\n\n18+ Only | Premium Cigar Delivery`;
    return await sendSMS(phone, message);
};

/**
 * Send order confirmation SMS
 */
const sendOrderConfirmation = async (phone, orderId, total, eta) => {
    const message = `RoyalSmoke Order #${orderId} confirmed!\n\nTotal: R${total}\nETA: ${eta || 'TBD'}\n\nTrack your delivery at royalsmoke.co.za\n\nID check required (18+)`;
    return await sendSMS(phone, message);
};

/**
 * Send delivery status update SMS
 */
const sendDeliveryUpdate = async (phone, orderId, status, driverName, eta) => {
    let message = `RoyalSmoke Order #${orderId} Update:\n\n`;
    
    switch(status) {
        case 'dispatched':
            message += `Your order is on the way!${driverName ? `\nDriver: ${driverName}` : ''}${eta ? `\nETA: ${eta} min` : ''}`;
            break;
        case 'arriving':
            message += `Driver arriving soon!${driverName ? `\nDriver: ${driverName}` : ''}\n\nPlease have ID ready (18+)`;
            break;
        case 'delivered':
            message += `Order delivered! Enjoy your premium cigars.\n\nThank you for choosing RoyalSmoke!`;
            break;
        default:
            message += `Status: ${status}`;
    }
    
    return await sendSMS(phone, message);
};

/**
 * Make outbound call
 */
const makeCall = async (to, message) => {
    if (!client) {
        console.log('[TWILIO] Call not made - credentials not configured');
        console.log(`[TWILIO] Would call ${to}: ${message}`);
        return { success: false, message: 'Twilio not configured' };
    }

    try {
        // Use TwiML to speak the message
        const twimlUrl = `http://twimlets.com/message?Message=${encodeURIComponent(message)}`;
        
        const call = await client.calls.create({
            url: twimlUrl,
            to: to,
            from: twilioPhoneNumber
        });

        console.log(`[TWILIO] Call initiated to ${to}: ${call.sid}`);
        return { success: true, sid: call.sid, status: call.status };
    } catch (error) {
        console.error('[TWILIO] Call failed:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Call customer about delivery arrival
 */
const callDeliveryArrival = async (phone, orderId, driverName) => {
    const message = `Hello, this is RoyalSmoke. Your order number ${orderId} is arriving now with driver ${driverName}. Please have your ID ready for age verification. Thank you!`;
    return await makeCall(phone, message);
};

/**
 * Setup inbound webhook for AI agent (future implementation)
 * This will handle incoming calls where customers can place orders via voice
 */
const setupInboundWebhook = (app) => {
    // Webhook endpoint for incoming calls
    app.post('/api/twilio/voice', (req, res) => {
        const twiml = new twilio.twiml.VoiceResponse();
        
        // Welcome message
        twiml.say({
            voice: 'alice',
            language: 'en-ZA'
        }, 'Welcome to RoyalSmoke, South Africa\'s premium cigar delivery service.');
        
        // Gather input for order
        const gather = twiml.gather({
            input: 'speech',
            action: '/api/twilio/process-order',
            method: 'POST',
            timeout: 5,
            speechTimeout: 'auto'
        });
        
        gather.say({
            voice: 'alice',
            language: 'en-ZA'
        }, 'To place an order, please tell me what you would like to order.');
        
        // If no input, repeat
        twiml.say({
            voice: 'alice',
            language: 'en-ZA'
        }, 'I didn\'t hear anything. Please call back when you\'re ready to order.');
        
        res.type('text/xml');
        res.send(twiml.toString());
    });

    // Process order from speech input (to be implemented with AI)
    app.post('/api/twilio/process-order', (req, res) => {
        const twiml = new twilio.twiml.VoiceResponse();
        const speechResult = req.body.SpeechResult;
        
        console.log('[TWILIO] Customer said:', speechResult);
        
        // TODO: Integrate with AI/NLP to process order
        // For now, acknowledge and redirect to human
        twiml.say({
            voice: 'alice',
            language: 'en-ZA'
        }, 'Thank you for your order. One of our team members will call you back shortly to confirm. Goodbye!');
        
        res.type('text/xml');
        res.send(twiml.toString());
    });

    console.log('[TWILIO] Inbound voice webhooks configured at /api/twilio/voice');
};

module.exports = {
    sendSMS,
    sendPIN,
    sendOrderConfirmation,
    sendDeliveryUpdate,
    makeCall,
    callDeliveryArrival,
    setupInboundWebhook
};
