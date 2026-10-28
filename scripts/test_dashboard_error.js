const axios = require('axios');
const jwt = require('jsonwebtoken');
const { access_token_key } = require('../API/app/config/utill/helper');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';

async function testDashboardAuth() {
  try {
    // Try to login as admin
    let token = null;
    try {
      const loginRes = await axios.post('http://localhost:3000/api/admin/login', {
        username: 'admin',
        password: 'password'
      });
      token = loginRes.data?.data?.token || loginRes.data?.token;
      console.log('Login success, got token');
    } catch (loginErr) {
      console.log('Login failed, creating direct JWT:', loginErr.response?.data?.message || loginErr.message);
      token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    }

    const res = await axios.get('http://localhost:3000/api/admin/dashboard?range=month', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Success! Status:', res.status);
    console.log('Data:', res.data);
  } catch (err) {
    console.error('Request failed with status:', err.response?.status);
    console.error('Error response data:', err.response?.data);
    console.error('Error message:', err.message);
  }
}

testDashboardAuth();
