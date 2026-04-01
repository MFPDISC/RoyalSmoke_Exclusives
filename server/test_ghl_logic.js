process.env.GHL_API_KEY = 'mock_key';
process.env.GHL_LOCATION_ID = 'mock_location';

const ghlService = require('./services/ghlService');
const axios = require('axios');

// Mock Axios
jest = { fn: () => { } }; // Fake jest if needed, but we'll specific mock axios methods
axios.post = async (url, data) => {
    console.log(`[MOCK] POST ${url}`);
    if (url.includes('/contacts/') && !url.includes('/invoices') && !url.includes('/tags')) {
        // Create Contact
        if (data.email === 'duplicate@example.com') {
            const err = new Error('Request failed with status code 422');
            err.response = { status: 422, data: { message: 'Contact already exists' } };
            throw err;
        }
        return { data: { contact: { id: 'mock_contact_id_123' } } };
    }
    if (url.includes('/tags')) {
        console.log(`[MOCK] Adding Tags: ${data.tags}`);
        return { data: {} };
    }
    return { data: {} };
};

axios.get = async (url) => {
    console.log(`[MOCK] GET ${url}`);
    if (url.includes('duplicate@example.com') || url.includes('duplicate%40example.com')) {
        return { data: { contacts: [{ id: 'existing_id_456', email: 'duplicate@example.com' }] } };
    }
    return { data: { contacts: [] } };
};

axios.put = async (url, data) => {
    console.log(`[MOCK] PUT ${url} with data:`, JSON.stringify(data));
    return { data: {} };
};

async function testLogic() {
    console.log('--- TEST 1: New Customer Sync ---');
    const newId = await ghlService.syncCustomerToGHL({
        name: 'New User',
        email: 'new@example.com',
        phone: '123'
    });
    console.log('New ID:', newId);
    if (newId === 'mock_contact_id_123') console.log('PASS: New contact created');
    else console.error('FAIL: Expected mock_contact_id_123');

    console.log('\n--- TEST 2: Duplicate Customer Sync (Lookup) ---');
    const existingId = await ghlService.syncCustomerToGHL({
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        phone: '123'
    });
    console.log('Existing ID:', existingId);
    if (existingId === 'existing_id_456') console.log('PASS: Existing contact found via lookup');
    else console.error('FAIL: Expected existing_id_456');

    console.log('\n--- TEST 3: Order Sync ---');
    const customer = { ghl_contact_id: 'existing_id_456', order_count: 2 };
    const order = { id: 999, status: 'paid', total_amount: 500 };

    const syncResult = await ghlService.syncOrderToGHL(order, customer);
    if (syncResult) console.log('PASS: Order synced');
    else console.error('FAIL: Order sync failed');
}

// Intercept require to mock axios if possible, but since we require ghlService which requires axios, 
// we need to mock axios BEFORE ghlService uses it? 
// In CommonJS, require returns the same object. So if we modify axios properties, it affects ghlService.
testLogic();
