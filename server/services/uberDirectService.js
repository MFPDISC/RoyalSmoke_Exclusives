const axios = require('axios');

/**
 * Uber Direct API - Production-Ready Delivery Service
 * 
 * Why Uber Direct vs Rides API:
 * ✓ Purpose-built for package delivery (not passengers)
 * ✓ Better ETA accuracy and tracking
 * ✓ Delivery-specific features (package size, proof of delivery)
 * ✓ Multi-stop route optimization
 * ✓ Real-time webhooks for status updates
 * ✓ Global availability (190+ cities worldwide)
 * ✓ Lower costs for delivery vs rides
 * 
 * Documentation: https://developer.uber.com/docs/deliveries
 */

const UBER_API_BASE = process.env.UBER_SANDBOX === 'true' 
    ? 'https://api-sandbox.uber.com/v1' 
    : 'https://api.uber.com/v1';

const UBER_CUSTOMER_ID = process.env.UBER_CUSTOMER_ID;
const UBER_CLIENT_ID = process.env.UBER_CLIENT_ID;
const UBER_CLIENT_SECRET = process.env.UBER_CLIENT_SECRET;

// OAuth token cache
let accessToken = null;
let tokenExpiry = null;

/**
 * Get OAuth access token (auto-refreshes when expired)
 */
const getAccessToken = async () => {
    if (!UBER_CLIENT_ID || !UBER_CLIENT_SECRET) {
        console.log('[UBER DIRECT] Credentials not configured');
        return null;
    }

    // Return cached token if still valid
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    try {
        const response = await axios.post('https://login.uber.com/oauth/v2/token', {
            client_id: UBER_CLIENT_ID,
            client_secret: UBER_CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: 'eats.deliveries'
        });

        accessToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min early
        
        console.log('[UBER DIRECT] Access token obtained');
        return accessToken;
    } catch (error) {
        console.error('[UBER DIRECT] Token error:', error.response?.data || error.message);
        return null;
    }
};

/**
 * Get delivery quote (pricing estimate)
 */
const getDeliveryQuote = async (pickup, dropoff, packageDetails = {}) => {
    const token = await getAccessToken();
    if (!token) return null;

    try {
        const response = await axios.post(`${UBER_API_BASE}/customers/${UBER_CUSTOMER_ID}/delivery_quotes`, {
            pickup_address: pickup.address,
            pickup_latitude: pickup.latitude,
            pickup_longitude: pickup.longitude,
            pickup_phone_number: pickup.phone,
            pickup_name: pickup.name,
            dropoff_address: dropoff.address,
            dropoff_latitude: dropoff.latitude,
            dropoff_longitude: dropoff.longitude,
            dropoff_phone_number: dropoff.phone,
            dropoff_name: dropoff.name,
            manifest_items: packageDetails.items || [{
                name: 'Cigar Delivery',
                quantity: 1,
                size: 'small'
            }]
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            id: response.data.id,
            fee: response.data.fee,
            currency: response.data.currency_code,
            expires_at: response.data.expires_at,
            pickup_eta: response.data.pickup_eta,
            dropoff_eta: response.data.dropoff_eta,
            duration: response.data.dropoff_eta - response.data.pickup_eta
        };
    } catch (error) {
        console.error('[UBER DIRECT] Quote error:', error.response?.data || error.message);
        return null;
    }
};

/**
 * Create delivery (using quote or direct)
 */
const createDelivery = async (pickup, dropoff, options = {}) => {
    const token = await getAccessToken();
    if (!token) {
        console.log('[UBER DIRECT] Cannot create delivery - no token');
        return { success: false, message: 'Uber Direct not configured' };
    }

    try {
        const deliveryData = {
            pickup_address: pickup.address,
            pickup_latitude: pickup.latitude,
            pickup_longitude: pickup.longitude,
            pickup_phone_number: pickup.phone,
            pickup_name: pickup.name || 'RoyalSmoke Store',
            pickup_notes: options.pickup_notes || 'Premium cigar delivery pickup',
            
            dropoff_address: dropoff.address,
            dropoff_latitude: dropoff.latitude,
            dropoff_longitude: dropoff.longitude,
            dropoff_phone_number: dropoff.phone,
            dropoff_name: dropoff.name,
            dropoff_notes: options.dropoff_notes || 'ID check required (18+). Premium cigars.',
            
            manifest_items: options.items || [{
                name: 'Premium Cigars',
                quantity: options.quantity || 1,
                size: 'small',
                price: options.price || 0
            }],
            
            // Optional: Use quote ID for guaranteed pricing
            ...(options.quote_id && { quote_id: options.quote_id }),
            
            // Delivery preferences
            dropoff_verification: {
                signature_required: true, // For age verification
                picture_required: false
            },
            
            // External reference for tracking
            external_id: options.order_id ? `ROYAL-${options.order_id}` : undefined
        };

        const response = await axios.post(
            `${UBER_API_BASE}/customers/${UBER_CUSTOMER_ID}/deliveries`,
            deliveryData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const delivery = response.data;
        
        console.log(`[UBER DIRECT] Delivery created: ${delivery.id}`);
        
        return {
            success: true,
            id: delivery.id,
            status: delivery.status,
            tracking_url: delivery.tracking_url,
            courier: delivery.courier ? {
                name: delivery.courier.name,
                phone: delivery.courier.phone_number,
                vehicle: delivery.courier.vehicle_type,
                img_url: delivery.courier.img_href
            } : null,
            pickup_eta: delivery.pickup_eta,
            dropoff_eta: delivery.dropoff_eta,
            fee: delivery.fee,
            currency: delivery.currency_code
        };
    } catch (error) {
        console.error('[UBER DIRECT] Create delivery error:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || error.message,
            errors: error.response?.data?.errors
        };
    }
};

/**
 * Get delivery status
 */
const getDeliveryStatus = async (deliveryId) => {
    const token = await getAccessToken();
    if (!token) return null;

    try {
        const response = await axios.get(
            `${UBER_API_BASE}/customers/${UBER_CUSTOMER_ID}/deliveries/${deliveryId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const delivery = response.data;
        
        return {
            id: delivery.id,
            status: delivery.status,
            tracking_url: delivery.tracking_url,
            courier: delivery.courier ? {
                name: delivery.courier.name,
                phone: delivery.courier.phone_number,
                location: delivery.courier.location,
                vehicle: delivery.courier.vehicle_type,
                img_url: delivery.courier.img_href
            } : null,
            pickup_eta: delivery.pickup_eta,
            dropoff_eta: delivery.dropoff_eta,
            pickup: delivery.pickup,
            dropoff: delivery.dropoff,
            complete: delivery.status === 'delivered'
        };
    } catch (error) {
        console.error('[UBER DIRECT] Status error:', error.response?.data || error.message);
        return null;
    }
};

/**
 * Cancel delivery
 */
const cancelDelivery = async (deliveryId) => {
    const token = await getAccessToken();
    if (!token) return { success: false };

    try {
        await axios.post(
            `${UBER_API_BASE}/customers/${UBER_CUSTOMER_ID}/deliveries/${deliveryId}/cancel`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`[UBER DIRECT] Delivery ${deliveryId} canceled`);
        return { success: true };
    } catch (error) {
        console.error('[UBER DIRECT] Cancel error:', error.response?.data || error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Batch create multiple deliveries (for efficiency)
 * Useful when multiple orders from same store
 */
const createBatchDeliveries = async (deliveries) => {
    const token = await getAccessToken();
    if (!token) return { success: false, results: [] };

    try {
        const results = await Promise.all(
            deliveries.map(delivery => createDelivery(delivery.pickup, delivery.dropoff, delivery.options))
        );
        
        return {
            success: true,
            results: results,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        };
    } catch (error) {
        console.error('[UBER DIRECT] Batch error:', error.message);
        return { success: false, results: [] };
    }
};

/**
 * Webhook handler for delivery status updates
 * Call this from your webhook endpoint
 */
const handleWebhook = (webhookData) => {
    const { event_type, delivery_id, status, courier, eta } = webhookData;
    
    console.log(`[UBER DIRECT] Webhook: ${event_type} for delivery ${delivery_id}`);
    
    // Return structured data for database update
    return {
        delivery_id,
        event: event_type,
        status,
        courier_name: courier?.name,
        courier_phone: courier?.phone_number,
        courier_location: courier?.location,
        eta,
        timestamp: new Date().toISOString()
    };
};

/**
 * Get delivery proof (after completion)
 */
const getDeliveryProof = async (deliveryId) => {
    const token = await getAccessToken();
    if (!token) return null;

    try {
        const response = await axios.get(
            `${UBER_API_BASE}/customers/${UBER_CUSTOMER_ID}/deliveries/${deliveryId}/proof`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            signature_url: response.data.signature_url,
            photo_url: response.data.photo_url,
            delivered_at: response.data.delivered_at
        };
    } catch (error) {
        console.error('[UBER DIRECT] Proof error:', error.response?.data || error.message);
        return null;
    }
};

module.exports = {
    getDeliveryQuote,
    createDelivery,
    getDeliveryStatus,
    cancelDelivery,
    createBatchDeliveries,
    handleWebhook,
    getDeliveryProof
};
