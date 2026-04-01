require('dotenv').config({ path: '../.env' });
const ghlService = require('./services/ghlService');

async function testSync() {
    console.log('Testing GHL Sync...');
    const testUser = {
        name: 'Antigravity Test User',
        email: 'ag_test_' + Date.now() + '@example.com',
        phone: '+1555' + Math.floor(1000000 + Math.random() * 9000000), // Use fictitious US number or compliant format
        address: '123 Test St, Pretoria'
    };

    // Note: ensure we use a phone number format GHL accepts.

    console.log('Test User:', testUser);

    if (!process.env.GHL_API_KEY) {
        console.error('ERROR: GHL_API_KEY not found in environment');
        return;
    }

    try {
        // Test Customer Sync
        console.log('Syncing customer...');
        const contactId = await ghlService.syncCustomerToGHL(testUser);

        if (contactId) {
            console.log('SUCCESS: Synced customer, ID:', contactId);

            // Test Duplicate Check (should return same ID)
            console.log('Testing duplicate check...');
            const duplicateId = await ghlService.syncCustomerToGHL(testUser);

            if (duplicateId === contactId) {
                console.log('SUCCESS: Duplicate check returned same ID');
            } else {
                console.warn(`WARNING: Duplicate ID mismatch. Orig: ${contactId}, New: ${duplicateId}`);
            }

        } else {
            console.error('FAILED: Could not sync customer');
        }
    } catch (err) {
        console.error('EXCEPTION:', err);
    }
}

testSync();
