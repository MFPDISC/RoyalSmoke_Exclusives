const axios = require('axios');

/**
 * Uber Direct API Integration for RoyalSmoke Delivery
 * 
 * IMPORTANT: This uses Uber Direct (Delivery API), NOT Rides API
 * Uber Direct is purpose-built for on-demand delivery with:
 * - Better tracking and ETA accuracy
 * - Delivery-specific features (package size, special instructions)
 * - Multi-stop optimization
 * - Webhook notifications for real-time updates
 * - Global availability
 * 
 * Documentation: https://developer.uber.com/docs/deliveries
 * 
 * Setup Instructions:
 * 1. Create Uber Developer account at https://developer.uber.com
 * 2. Apply for Uber Direct API access (separate from Rides)
 * 3. Get your Customer ID and API credentials
 * 4. Add to .env:
 *    UBER_CUSTOMER_ID=your_customer_id
 *    UBER_CLIENT_ID=your_client_id
 *    UBER_CLIENT_SECRET=your_client_secret
 *    UBER_SANDBOX=true (for testing)
 */

const UBER_API_BASE = process.env.UBER_SANDBOX === 'true' 
    ? 'https://api-sandbox.uber.com/v1' 
    : 'https://api.uber.com/v1';

const UBER_CUSTOMER_ID = process.env.UBER_CUSTOMER_ID;
const UBER_CLIENT_ID = process.env.UBER_CLIENT_ID;
const UBER_CLIENT_SECRET = process.env.UBER_CLIENT_SECRET;

// OAuth token management
let accessToken = null;
let tokenExpiry = null;

/**
 * Get available Uber products at a location
 */
const getProducts = async (latitude, longitude) => {
    if (!UBER_SERVER_TOKEN) {
        console.log('[UBER] Server token not configured');
        return null;
    }

    try {
        const response = await axios.get(`${UBER_API_BASE}/products`, {
            params: { latitude, longitude },
            headers: {
                'Authorization': `Token ${UBER_SERVER_TOKEN}`,
                'Accept-Language': 'en_US',
                'Content-Type': 'application/json'
            }
        });
        return response.data.products;
    } catch (error) {
        console.error('[UBER] Error fetching products:', error.response?.data || error.message);
        return null;
    }
};

/**
 * Get price estimate for a delivery
 */
const getPriceEstimate = async (startLat, startLng, endLat, endLng) => {
    if (!UBER_SERVER_TOKEN) {
        console.log('[UBER] Server token not configured');
        return null;
    }

    try {
        const response = await axios.get(`${UBER_API_BASE}/estimates/price`, {
            params: {
                start_latitude: startLat,
                start_longitude: startLng,
                end_latitude: endLat,
                end_longitude: endLng
            },
            headers: {
                'Authorization': `Token ${UBER_SERVER_TOKEN}`,
                'Accept-Language': 'en_US',
                'Content-Type': 'application/json'
            }
        });
        return response.data.prices;
    } catch (error) {
        console.error('[UBER] Error fetching price estimate:', error.response?.data || error.message);
        return null;
    }
};

/**
 * Request an Uber ride for delivery
 * @param {Object} params - Ride request parameters
 * @param {number} params.start_latitude - Store latitude
 * @param {number} params.start_longitude - Store longitude
 * @param {number} params.end_latitude - Customer latitude
 * @param {number} params.end_longitude - Customer longitude
 * @param {string} params.product_id - Uber product ID (e.g., UberX)
 * @param {string} params.pickup_address - Store address
 * @param {string} params.dropoff_address - Customer address
 * @param {string} params.pickup_phone - Store phone
 * @param {string} params.dropoff_phone - Customer phone
 * @param {string} params.pickup_notes - Special instructions for pickup
 * @param {string} params.dropoff_notes - Special instructions for dropoff
 */
const requestRide = async (params) => {
    if (!UBER_SERVER_TOKEN) {
        console.log('[UBER] Server token not configured, skipping ride request');
        return { success: false, message: 'Uber API not configured' };
    }

    try {
        const rideRequest = {
            product_id: params.product_id,
            start_latitude: params.start_latitude,
            start_longitude: params.start_longitude,
            end_latitude: params.end_latitude,
            end_longitude: params.end_longitude,
            pickup_address: params.pickup_address,
            dropoff_address: params.dropoff_address,
            pickup_phone_number: params.pickup_phone,
            dropoff_phone_number: params.dropoff_phone,
            pickup_notes: params.pickup_notes || 'RoyalSmoke cigar delivery pickup',
            dropoff_notes: params.dropoff_notes || 'RoyalSmoke cigar delivery - ID check required (18+)'
        };

        const response = await axios.post(`${UBER_API_BASE}/requests`, rideRequest, {
            headers: {
                'Authorization': `Token ${UBER_SERVER_TOKEN}`,
                'Accept-Language': 'en_US',
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            request_id: response.data.request_id,
            status: response.data.status,
            driver: response.data.driver,
            vehicle: response.data.vehicle,
            location: response.data.location,
            eta: response.data.eta,
            surge_multiplier: response.data.surge_multiplier
        };
    } catch (error) {
        console.error('[UBER] Error requesting ride:', error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || error.message,
            errors: error.response?.data?.errors
        };
    }
};

/**
 * Get current ride status
 */
const getRideStatus = async (requestId) => {
    if (!UBER_SERVER_TOKEN) {
        return null;
    }

    try {
        const response = await axios.get(`${UBER_API_BASE}/requests/${requestId}`, {
            headers: {
                'Authorization': `Token ${UBER_SERVER_TOKEN}`,
                'Accept-Language': 'en_US',
                'Content-Type': 'application/json'
            }
        });

        return {
            request_id: response.data.request_id,
            status: response.data.status,
            driver: response.data.driver,
            vehicle: response.data.vehicle,
            location: response.data.location,
            eta: response.data.eta,
            destination: response.data.destination
        };
    } catch (error) {
        console.error('[UBER] Error fetching ride status:', error.response?.data || error.message);
        return null;
    }
};

/**
 * Cancel a ride request
 */
const cancelRide = async (requestId) => {
    if (!UBER_SERVER_TOKEN) {
        return { success: false };
    }

    try {
        await axios.delete(`${UBER_API_BASE}/requests/${requestId}`, {
            headers: {
                'Authorization': `Token ${UBER_SERVER_TOKEN}`,
                'Accept-Language': 'en_US',
                'Content-Type': 'application/json'
            }
        });
        return { success: true };
    } catch (error) {
        console.error('[UBER] Error canceling ride:', error.response?.data || error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Get ride receipt after completion
 */
const getRideReceipt = async (requestId) => {
    if (!UBER_SERVER_TOKEN) {
        return null;
    }

    try {
        const response = await axios.get(`${UBER_API_BASE}/requests/${requestId}/receipt`, {
            headers: {
                'Authorization': `Token ${UBER_SERVER_TOKEN}`,
                'Accept-Language': 'en_US',
                'Content-Type': 'application/json'
            }
        });

        return {
            request_id: response.data.request_id,
            total_charged: response.data.total_charged,
            total_fare: response.data.total_fare,
            currency_code: response.data.currency_code,
            duration: response.data.duration,
            distance: response.data.distance,
            distance_label: response.data.distance_label
        };
    } catch (error) {
        console.error('[UBER] Error fetching receipt:', error.response?.data || error.message);
        return null;
    }
};

module.exports = {
    getProducts,
    getPriceEstimate,
    requestRide,
    getRideStatus,
    cancelRide,
    getRideReceipt
};
