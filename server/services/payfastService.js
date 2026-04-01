const crypto = require('crypto');
const axios = require('axios');

/**
 * PayFast Payment Gateway Integration for RoyalSmoke
 * 
 * Features:
 * - Credit/Debit card payments
 * - Apple Pay (automatic on Safari/iOS)
 * - EFT, SnapScan, Zapper
 * - Instant Payment Notifications (IPN)
 * - Secure signature validation
 * 
 * Documentation: https://developers.payfast.co.za
 */

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';
const PAYFAST_SANDBOX = process.env.PAYFAST_SANDBOX === 'true';

const PAYFAST_HOST = PAYFAST_SANDBOX 
    ? 'sandbox.payfast.co.za' 
    : 'www.payfast.co.za';

const PAYFAST_URL = `https://${PAYFAST_HOST}/eng/process`;

/**
 * Generate MD5 signature for PayFast
 */
const generateSignature = (data, passphrase = '') => {
    // Create parameter string
    let pfOutput = '';
    for (let key in data) {
        if (data.hasOwnProperty(key) && key !== 'signature') {
            pfOutput += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, '+')}&`;
        }
    }
    
    // Remove last ampersand
    pfOutput = pfOutput.slice(0, -1);
    
    // Add passphrase if set
    if (passphrase) {
        pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
    }
    
    // Generate MD5 hash
    return crypto.createHash('md5').update(pfOutput).digest('hex');
};

/**
 * Create payment data for PayFast
 */
const createPayment = (orderData) => {
    if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
        console.log('[PAYFAST] Credentials not configured');
        return null;
    }

    const {
        orderId,
        amount,
        customerName,
        customerEmail,
        customerPhone,
        items = []
    } = orderData;

    // PayFast payment data
    const paymentData = {
        // Merchant details
        merchant_id: PAYFAST_MERCHANT_ID,
        merchant_key: PAYFAST_MERCHANT_KEY,
        
        // Buyer details
        name_first: customerName.split(' ')[0] || customerName,
        name_last: customerName.split(' ').slice(1).join(' ') || customerName,
        email_address: customerEmail || `${customerPhone}@royalsmoke.co.za`,
        cell_number: customerPhone.replace(/\+/g, ''),
        
        // Transaction details
        m_payment_id: orderId.toString(),
        amount: parseFloat(amount).toFixed(2),
        item_name: 'RoyalSmoke Premium Cigars',
        item_description: items.length > 0 
            ? items.map(i => `${i.name} x${i.quantity}`).join(', ')
            : 'Premium Cigar Delivery',
        
        // URLs
        return_url: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/payfast/success`,
        cancel_url: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/payfast/cancel`,
        notify_url: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/payfast/notify`,
        
        // Email confirmation
        email_confirmation: 1,
        confirmation_address: customerEmail || `${customerPhone}@royalsmoke.co.za`
    };

    // Generate signature
    paymentData.signature = generateSignature(paymentData, PAYFAST_PASSPHRASE);

    return {
        url: PAYFAST_URL,
        data: paymentData
    };
};

/**
 * Validate PayFast IPN (Instant Payment Notification)
 */
const validateIPN = async (ipnData) => {
    // 1. Check signature
    const signature = ipnData.signature;
    delete ipnData.signature;
    
    const calculatedSignature = generateSignature(ipnData, PAYFAST_PASSPHRASE);
    
    if (signature !== calculatedSignature) {
        console.error('[PAYFAST] Invalid signature');
        return { valid: false, reason: 'Invalid signature' };
    }

    // 2. Verify payment status
    if (ipnData.payment_status !== 'COMPLETE') {
        console.log(`[PAYFAST] Payment not complete: ${ipnData.payment_status}`);
        return { valid: false, reason: 'Payment not complete' };
    }

    // 3. Verify amounts match (optional but recommended)
    // You should check ipnData.amount_gross matches your order amount

    // 4. Verify with PayFast server (recommended for production)
    if (!PAYFAST_SANDBOX) {
        try {
            const response = await axios.post(
                `https://${PAYFAST_HOST}/eng/query/validate`,
                new URLSearchParams(ipnData).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data !== 'VALID') {
                console.error('[PAYFAST] Server validation failed');
                return { valid: false, reason: 'Server validation failed' };
            }
        } catch (error) {
            console.error('[PAYFAST] Validation request failed:', error.message);
            return { valid: false, reason: 'Validation request failed' };
        }
    }

    console.log(`[PAYFAST] Payment validated for order ${ipnData.m_payment_id}`);
    
    return {
        valid: true,
        orderId: ipnData.m_payment_id,
        amount: ipnData.amount_gross,
        paymentId: ipnData.pf_payment_id,
        paymentStatus: ipnData.payment_status
    };
};

/**
 * Check if payment was successful (for return URL)
 */
const verifyPaymentReturn = (queryParams) => {
    // PayFast doesn't send signature on return URL
    // Use IPN for actual verification
    // This is just for user feedback
    
    return {
        success: true,
        orderId: queryParams.m_payment_id || null,
        message: 'Payment received. Confirming...'
    };
};

/**
 * Generate payment form HTML (for frontend)
 */
const generatePaymentForm = (paymentData) => {
    let formHtml = `<form action="${paymentData.url}" method="POST" id="payfast-form">`;
    
    for (let key in paymentData.data) {
        formHtml += `<input type="hidden" name="${key}" value="${paymentData.data[key]}">`;
    }
    
    formHtml += `<button type="submit">Pay with PayFast</button></form>`;
    formHtml += `<script>document.getElementById('payfast-form').submit();</script>`;
    
    return formHtml;
};

module.exports = {
    createPayment,
    validateIPN,
    verifyPaymentReturn,
    generatePaymentForm,
    PAYFAST_URL,
    PAYFAST_HOST
};
