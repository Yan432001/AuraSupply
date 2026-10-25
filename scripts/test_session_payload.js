const axios = require('axios');

async function testSession() {
  console.log('Testing session payload for heanyan1@gmail.com...');
  const resLogin = await axios.post('http://localhost:3000/api/admin/auth/login', {
    username: 'heanyan1@gmail.com',
    password: 'Sbc@12345'
  });

  const data = resLogin.data;
  console.log('Login Response keys:', Object.keys(data));
  console.log('Login data.user keys:', Object.keys(data.data?.user || data.user || {}));
  console.log('Session User Object:', JSON.stringify(data.data?.user || data.user, null, 2));

  const token = data.token || data.access_token || data.data?.token;

  console.log('\nTesting /api/admin/auth/session (profile) endpoint...');
  const resProfile = await axios.get('http://localhost:3000/api/admin/auth/session', {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('Profile Response keys:', Object.keys(resProfile.data));
  console.log('Profile User Object:', JSON.stringify(resProfile.data.user || resProfile.data.data, null, 2));
}

testSession().catch(err => {
  console.error('Error:', err.response?.data || err.message);
  process.exit(1);
});
