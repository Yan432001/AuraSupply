const axios = require('axios');
const { query, closePool } = require('../API/app/config/dbPool');

const BASE_URL = 'http://127.0.0.1:3000';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RBAC & AUTHENTICATION END-TO-END VERIFICATION SUITE');
  console.log('================================================================');

  const testEmail = `cust_test_${Date.now()}@aurasupply.io`;
  const testPassword = 'Password123!Secure';
  let customerToken = null;
  let adminToken = null;

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Default Registration assigns "customer" role by default
    // --------------------------------------------------------------------------
    console.log('\n[TEST 1] Registering a new user via website registration API...');
    const regRes = await axios.post(`${BASE_URL}/api/register`, {
      fullName: 'Test Customer Automated',
      email: testEmail,
      phone: '+85512345678',
      password: testPassword,
      // Attempt role injection to prove server strictly forces 'customer'
      role: 'admin',
      memberType: 'admin'
    });

    console.log('Registration HTTP Status:', regRes.status);
    console.log('Registration Response Data:', regRes.data);

    if (regRes.status !== 201 && regRes.status !== 200) {
      throw new Error(`Registration failed with status ${regRes.status}`);
    }

    if (regRes.data.user?.role !== 'customer' || Number(regRes.data.user?.group_id) !== 4) {
      throw new Error(`Expected role 'customer' and group_id 4, got role: ${regRes.data.user?.role}, group_id: ${regRes.data.user?.group_id}`);
    }

    customerToken = regRes.data.token;
    console.log('✅ TEST 1 PASSED: Client response correctly assigned customer role and group_id 4');

    // Verify directly in MySQL database
    const [dbRows] = await query('SELECT id, username, email, group_id, active, status, register_source FROM aura_users WHERE email = ?', [testEmail]);
    console.log('Database row verification:', dbRows[0]);
    if (!dbRows || dbRows.length === 0) {
      throw new Error('User not found in aura_users database table');
    }
    if (Number(dbRows[0].group_id) !== 4) {
      throw new Error(`Database group_id is ${dbRows[0].group_id}, expected 4 (customer)!`);
    }
    console.log('✅ TEST 1 DB VERIFICATION PASSED: Database row confirmed group_id = 4 (customer role)');

    // --------------------------------------------------------------------------
    // TEST 2: Website Access for Customer Role
    // --------------------------------------------------------------------------
    console.log('\n[TEST 2] Logging in as customer via website login API (/api/auth/login)...');
    const webLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: testEmail,
      password: testPassword
    });

    console.log('Website Login HTTP Status:', webLoginRes.status);
    console.log('Website Login Success:', webLoginRes.data?.success || webLoginRes.data?.status);
    const loginUser = webLoginRes.data?.data || webLoginRes.data?.user || webLoginRes.data;
    console.log('Website Login User Role:', loginUser?.role || loginUser?.group_name);
    customerToken = webLoginRes.data?.token || webLoginRes.data?.access_token || customerToken;

    if (!customerToken) {
      throw new Error('Customer login did not return a valid session token');
    }

    // Access customer profile using customer token
    const profileRes = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.log('Customer Account Portal Profile HTTP Status:', profileRes.status);
    console.log('Customer Profile Name:', profileRes.data?.data?.name || profileRes.data?.name);
    console.log('✅ TEST 2 PASSED: Customer can log in and access website account features');

    // --------------------------------------------------------------------------
    // TEST 3: Admin Restriction - Block customer from Admin Login & Admin Endpoints
    // --------------------------------------------------------------------------
    console.log('\n[TEST 3A] Customer attempting to log in to Admin Portal (/api/admin/auth/login)...');
    try {
      await axios.post(`${BASE_URL}/api/admin/auth/login`, {
        username: testEmail,
        password: testPassword
      });
      throw new Error('SECURITY BREACH: Customer account was allowed to log in via /api/admin/auth/login!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Blocked with HTTP 403 Forbidden as required!');
        console.log('Server response:', err.response.data);
      } else {
        throw new Error(`Expected 403 Forbidden, got status: ${err.response?.status || err.message}`);
      }
    }

    console.log('\n[TEST 3B] Customer attempting to log in to Admin Portal (/api/admin/login)...');
    try {
      await axios.post(`${BASE_URL}/api/admin/login`, {
        username: testEmail,
        password: testPassword
      });
      throw new Error('SECURITY BREACH: Customer account was allowed to log in via /api/admin/login!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Blocked with HTTP 403 Forbidden as required!');
        console.log('Server response:', err.response.data);
      } else {
        throw new Error(`Expected 403 Forbidden, got status: ${err.response?.status || err.message}`);
      }
    }

    console.log('\n[TEST 3C] Customer attempting to access Admin Session (/api/admin/auth/session) with customer token...');
    try {
      await axios.get(`${BASE_URL}/api/admin/auth/session`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      throw new Error('SECURITY BREACH: Customer token accessed /api/admin/auth/session!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Blocked with HTTP 403 Forbidden as required!');
        console.log('Server response:', err.response.data);
      } else {
        throw new Error(`Expected 403 Forbidden, got status: ${err.response?.status || err.message}`);
      }
    }

    console.log('\n[TEST 3D] Customer attempting to access Admin Users List (/api/admin/users) with customer token...');
    try {
      await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      throw new Error('SECURITY BREACH: Customer token accessed /api/admin/users!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Blocked with HTTP 403 Forbidden as required!');
        console.log('Server response:', err.response.data);
      } else {
        throw new Error(`Expected 403 Forbidden, got status: ${err.response?.status || err.message}`);
      }
    }

    console.log('✅ TEST 3 PASSED: All admin login and admin API endpoints strictly block customer accounts');

    // --------------------------------------------------------------------------
    // TEST 4: Route Protection - Admin role can authenticate and access Admin Panel
    // --------------------------------------------------------------------------
    console.log('\n[TEST 4] Admin authentication via /api/admin/auth/login...');
    const adminLoginRes = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
      username: 'admin',
      password: 'admin'
    });

    console.log('Admin Login HTTP Status:', adminLoginRes.status);
    adminToken = adminLoginRes.data?.data?.token || adminLoginRes.data?.token;
    if (!adminToken) {
      throw new Error('Admin login did not return a valid session token');
    }

    // Verify admin can access /api/admin/auth/session
    const adminSessionRes = await axios.get(`${BASE_URL}/api/admin/auth/session`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Admin Session HTTP Status:', adminSessionRes.status);
    console.log('Admin Role:', adminSessionRes.data?.data?.role);

    // Verify admin can access /api/admin/users
    const adminUsersRes = await axios.get(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Admin Users Management HTTP Status:', adminUsersRes.status);
    console.log('Users Count in Admin Panel:', adminUsersRes.data?.data?.length || adminUsersRes.data?.users?.length);

    console.log('✅ TEST 4 PASSED: Administrators have full authorized access to administrative endpoints');

    console.log('\n================================================================');
    console.log('🎉 ALL 4 USER REQUIREMENTS VERIFIED AND PASSING SUCCESSFULLY!');
    console.log('================================================================\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error body:', error.response.data);
    }
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

runTests();
