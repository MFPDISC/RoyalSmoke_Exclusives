/**
 * Uber Demo/Sandbox Service for Testing
 * 
 * This creates mock deliveries for testing without real Uber API credentials
 * Generates realistic tracking URLs that open in Uber app
 */

const crypto = require('crypto');

/**
 * Create a demo delivery (no API credentials needed)
 */
const createDemoDelivery = (pickup, dropoff, options = {}) => {
    // Generate fake but realistic delivery ID
    const deliveryId = `demo_${crypto.randomBytes(8).toString('hex')}`;
    
    // Generate tracking URL that opens Uber app
    // Format: uber://track?delivery_id=xxx or web fallback
    const trackingUrl = `https://m.uber.com/looking?delivery_id=${deliveryId}`;
    
    // Simulate Uber app deep link (opens Uber app if installed)
    const uberAppLink = `uber://track?delivery_id=${deliveryId}`;
    
    console.log(`[UBER DEMO] Demo delivery created: ${deliveryId}`);
    console.log(`[UBER DEMO] Tracking URL: ${trackingUrl}`);
    console.log(`[UBER DEMO] App Deep Link: ${uberAppLink}`);
    
    return {
        success: true,
        id: deliveryId,
        status: 'pending',
        tracking_url: trackingUrl,
        app_deep_link: uberAppLink,
        courier: {
            name: 'Demo Driver (John Smith)',
            phone: '+27 82 123 4567',
            vehicle: 'Toyota Corolla - ABC 123 GP',
            img_url: 'https://i.pravatar.cc/150?img=12'
        },
        pickup_eta: 15, // minutes
        dropoff_eta: 35, // minutes
        fee: 55.00,
        currency: 'ZAR',
        demo: true,
        message: 'This is a DEMO delivery for testing. No real Uber driver dispatched.'
    };
};

/**
 * Get demo delivery status (simulates tracking)
 */
const getDemoDeliveryStatus = (deliveryId) => {
    // Simulate different statuses based on time
    const statuses = ['pending', 'accepted', 'arriving', 'picked_up', 'delivering', 'delivered'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
        id: deliveryId,
        status: randomStatus,
        tracking_url: `https://m.uber.com/looking?delivery_id=${deliveryId}`,
        app_deep_link: `uber://track?delivery_id=${deliveryId}`,
        courier: {
            name: 'Demo Driver (John Smith)',
            phone: '+27 82 123 4567',
            location: {
                latitude: -25.7479 + (Math.random() - 0.5) * 0.01,
                longitude: 28.2293 + (Math.random() - 0.5) * 0.01
            },
            vehicle: 'Toyota Corolla - ABC 123 GP',
            img_url: 'https://i.pravatar.cc/150?img=12'
        },
        pickup_eta: Math.floor(Math.random() * 20) + 5,
        dropoff_eta: Math.floor(Math.random() * 30) + 20,
        complete: randomStatus === 'delivered',
        demo: true
    };
};

/**
 * Generate shareable tracking link
 * This link works on mobile and desktop
 * - Mobile with Uber app: Opens in app
 * - Mobile without app: Opens in mobile browser
 * - Desktop: Opens in browser
 */
const generateTrackingLink = (deliveryId) => {
    return {
        // Web URL (works everywhere)
        web_url: `https://m.uber.com/looking?delivery_id=${deliveryId}`,
        
        // Deep link (opens Uber app if installed)
        app_deep_link: `uber://track?delivery_id=${deliveryId}`,
        
        // Universal link (smart redirect)
        universal_link: `https://m.uber.com/ul/?action=track&delivery_id=${deliveryId}`,
        
        // SMS-friendly short link
        short_link: `https://ubr.to/${deliveryId.slice(-8)}`,
        
        // QR code URL (for scanning)
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://m.uber.com/looking?delivery_id=${deliveryId}`)}`
    };
};

module.exports = {
    createDemoDelivery,
    getDemoDeliveryStatus,
    generateTrackingLink
};
