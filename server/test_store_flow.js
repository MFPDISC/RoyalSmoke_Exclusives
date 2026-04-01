const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function testStoreFlow() {
    try {
        console.log('1. Registering a new store...');
        const newStore = {
            name: 'Test Store ' + Date.now(),
            owner_name: 'Test Owner',
            email: `teststore${Date.now()}@example.com`,
            phone: '1234567890',
            password: 'password123',
            address: '123 Test St',
            city: 'Test City',
            postal_code: '1234'
        };

        const regRes = await axios.post(`${API_URL}/stores/register`, newStore);
        console.log('Response:', regRes.status, regRes.data);

        console.log('2. Fetching all stores (Admin view)...');
        const listRes = await axios.get(`${API_URL}/stores`);
        console.log('Stores found:', listRes.data.length);

        const found = listRes.data.find(s => s.email === newStore.email);
        if (found) {
            console.log('SUCCESS: Store found in the list:', found);
        } else {
            console.error('FAILURE: Store NOT found in the list.');
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testStoreFlow();
