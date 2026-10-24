const axios = require('axios');
const BASE_URL = 'http://127.0.0.1:3000';

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING PASSWORD COMPLEXITY & USERNAME UPDATE TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, extra = '') {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testEmail = `test_cust_${timestamp}@auraglobal.com`;
  const testUsername = `user_${timestamp}`;
  const validPassword = `Test@Pass1234!`;
  const newValidPassword = `New#SecurePass99$`;

  // 1. Password Complexity on Registration
  console.log('\n--- 1. Testing Password Complexity on Registration ---');
  try {
    // Missing uppercase
    const res1 = await axios.post(`${BASE_URL}/api/web/auth/register`, {
      name: 'Test User',
      phone: '012999888',
      username: `${testUsername}_no_up`,
      email: `no_up_${testEmail}`,
      password: 'password123!'
    }, { validateStatus: () => true });
    const code1 = res1.data?.errors?.[0]?.code || res1.data?.code;
    assert(res1.status === 400 && code1 === 'PASSWORD_COMPLEXITY_FAILED', 'Registration rejects password without uppercase (A-Z)');

    // Missing numbers
    const res2 = await axios.post(`${BASE_URL}/api/web/auth/register`, {
      name: 'Test User',
      phone: '012999888',
      username: `${testUsername}_no_num`,
      email: `no_num_${testEmail}`,
      password: 'PasswordNoNum!'
    }, { validateStatus: () => true });
    const code2 = res2.data?.errors?.[0]?.code || res2.data?.code;
    assert(res2.status === 400 && code2 === 'PASSWORD_COMPLEXITY_FAILED', 'Registration rejects password without numbers (0-9)');

    // Missing symbols
    const res3 = await axios.post(`${BASE_URL}/api/web/auth/register`, {
      name: 'Test User',
      phone: '012999888',
      username: `${testUsername}_no_sym`,
      email: `no_sym_${testEmail}`,
      password: 'PasswordNoSymbols123'
    }, { validateStatus: () => true });
    const code3 = res3.data?.errors?.[0]?.code || res3.data?.code;
    assert(res3.status === 400 && code3 === 'PASSWORD_COMPLEXITY_FAILED', 'Registration rejects password without symbols (!@#$)');

    // Too short (< 8 chars)
    const res4 = await axios.post(`${BASE_URL}/api/web/auth/register`, {
      name: 'Test User',
      phone: '012999888',
      username: `${testUsername}_short`,
      email: `short_${testEmail}`,
      password: 'P@1s'
    }, { validateStatus: () => true });
    const code4 = res4.data?.errors?.[0]?.code || res4.data?.code;
    assert(res4.status === 400 && code4 === 'PASSWORD_COMPLEXITY_FAILED', 'Registration rejects password shorter than 8 characters');

    // Valid password with Uppercase, Lowercase, Number, Symbol, min 8 chars
    const res5 = await axios.post(`${BASE_URL}/api/web/auth/register`, {
      name: 'Test User',
      phone: '012999888',
      username: testUsername,
      email: testEmail,
      password: validPassword
    }, { validateStatus: () => true });
    assert(res5.status === 201 && res5.data.success, 'Registration succeeds with compliant password');
  } catch (err) {
    console.error('Registration test error:', err.message);
  }

  // 2. Login with created credentials
  console.log('\n--- 2. Customer Login ---');
  let webToken = null;
  try {
    const loginRes = await axios.post(`${BASE_URL}/api/web/auth/login`, {
      username: testUsername,
      password: validPassword
    }, { validateStatus: () => true });
    webToken = loginRes.data?.data?.token;
    assert(loginRes.status === 200 && Boolean(webToken), 'Customer login succeeds with compliant credentials', `status: ${loginRes.status}`);
  } catch (err) {
    console.error('Login error:', err.message);
  }

  // 3. Update Username & Profile Data
  console.log('\n--- 3. Customer Profile & Username Update ---');
  const updatedUsername = `cust_upd_${timestamp}`;
  try {
    // Try updating to an invalid username format
    const badUserRes = await axios.put(`${BASE_URL}/api/web/auth/profile`, {
      username: 'a!' // invalid chars and too short
    }, {
      headers: { Authorization: `Bearer ${webToken}` },
      validateStatus: () => true
    });
    assert(badUserRes.status === 400, 'Rejects invalid username format (< 3 chars or bad characters)');

    // Update to valid new username
    const updateRes = await axios.put(`${BASE_URL}/api/web/auth/profile`, {
      username: updatedUsername,
      name: 'Updated Test User',
      phone: '0987654321',
      company: 'Test Supply Co'
    }, {
      headers: { Authorization: `Bearer ${webToken}` },
      validateStatus: () => true
    });
    assert(updateRes.status === 200 && updateRes.data.success, 'Successfully updates username and profile information');

    // Fetch profile and check updated username
    const getProfileRes = await axios.get(`${BASE_URL}/api/web/auth/profile`, {
      headers: { Authorization: `Bearer ${webToken}` },
      validateStatus: () => true
    });
    const profile = getProfileRes.data?.data?.user || getProfileRes.data?.data?.profile || getProfileRes.data?.data;
    assert(profile && profile.username === updatedUsername, `Profile reflects updated username: ${profile?.username}`);

    // Try duplicate username
    const dupRes = await axios.put(`${BASE_URL}/api/web/auth/profile`, {
      username: 'admin' // already taken by admin
    }, {
      headers: { Authorization: `Bearer ${webToken}` },
      validateStatus: () => true
    });
    assert(dupRes.status === 409, 'Rejects taken username with HTTP 409 Conflict');
  } catch (err) {
    console.error('Profile update error:', err.message);
  }

  // 4. Change Password with Complexity Verification
  console.log('\n--- 4. Customer Change Password Complexity ---');
  try {
    // Weak password rejected
    const weakPassRes = await axios.post(`${BASE_URL}/api/web/auth/change-password`, {
      current_password: validPassword,
      new_password: 'onlylowercase123'
    }, {
      headers: { Authorization: `Bearer ${webToken}` },
      validateStatus: () => true
    });
    const weakCode = weakPassRes.data?.errors?.[0]?.code || weakPassRes.data?.code;
    assert(weakPassRes.status === 400 && weakCode === 'PASSWORD_COMPLEXITY_FAILED', 'Change password rejects weak password missing uppercase & symbols');

    // Strong password accepted
    const strongPassRes = await axios.post(`${BASE_URL}/api/web/auth/change-password`, {
      current_password: validPassword,
      new_password: newValidPassword
    }, {
      headers: { Authorization: `Bearer ${webToken}` },
      validateStatus: () => true
    });
    assert(strongPassRes.status === 200 && strongPassRes.data.success, 'Change password succeeds with compliant password');

    // Test login with updated username and new password
    const reLoginRes = await axios.post(`${BASE_URL}/api/web/auth/login`, {
      username: updatedUsername,
      password: newValidPassword
    }, { validateStatus: () => true });
    assert(reLoginRes.status === 200 && reLoginRes.data?.data?.token, 'Login succeeds using updated username and new password');
  } catch (err) {
    console.error('Change password error:', err.message);
  }

  // 5. Admin Profile & Password Complexity Controls
  console.log('\n--- 5. Admin Profile & Password Complexity Controls ---');
  try {
    const adminLoginRes = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
      username: 'admin',
      password: 'admin'
    }, { validateStatus: () => true });
    const adminToken = adminLoginRes.data?.token || adminLoginRes.data?.data?.token;
    assert(adminLoginRes.status === 200 && Boolean(adminToken), 'Admin login succeeds');

    // Admin change password with weak password
    const adminWeakPassRes = await axios.post(`${BASE_URL}/api/admin/auth/change-password`, {
      current_password: 'admin',
      new_password: 'simplepassword'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });
    const adminWeakCode = adminWeakPassRes.data?.errors?.[0]?.code || adminWeakPassRes.data?.code;
    assert(adminWeakPassRes.status === 400 && adminWeakCode === 'PASSWORD_COMPLEXITY_FAILED', 'Admin change password rejects weak password');

    // Admin profile update with valid username check
    const adminProfileRes = await axios.get(`${BASE_URL}/api/admin/auth/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      validateStatus: () => true
    });
    assert(adminProfileRes.status === 200 && adminProfileRes.data?.data?.username === 'admin', 'Admin profile query returns correct username');
  } catch (err) {
    console.error('Admin test error:', err.message);
  }

  console.log('\n===============================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runTests();
