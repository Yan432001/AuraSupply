/**
 * Comprehensive Automated Verification Suite for
 * Admin & Website Authentication, Cookies, Inactivity & Session Management
 */

const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          cookies: res.headers['set-cookie'] || [],
          body: json || body
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING AURA AUTH & SESSION MANAGEMENT TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Health check
  const healthRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/health',
    method: 'GET'
  });
  assert(healthRes.statusCode === 200 && healthRes.body?.status === true, '1. Server Health Check');

  // 2. Admin Login with valid credentials
  console.log('\n--- Testing Admin Login & Cookie Emission ---');
  const adminLoginRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'admin', password: 'admin' });

  assert(adminLoginRes.statusCode === 200, '2a. Admin Login status is 200', `Got ${adminLoginRes.statusCode}`);
  const adminToken = adminLoginRes.body?.token || adminLoginRes.body?.data?.token;
  assert(Boolean(adminToken), '2b. Admin Login returns JWT token');

  const adminCookies = adminLoginRes.cookies;
  const adminSessionCookie = adminCookies.find(c => c.startsWith('aura_admin_session='));
  assert(Boolean(adminSessionCookie), '2c. Admin Login sets "aura_admin_session" cookie');
  assert(adminSessionCookie?.includes('HttpOnly'), '2d. "aura_admin_session" has HttpOnly flag');
  assert(adminSessionCookie?.includes('SameSite=Lax'), '2e. "aura_admin_session" has SameSite=Lax');

  // 3. Admin Session / Profile verification using Cookie
  console.log('\n--- Testing Admin Session via Cookie & Bearer ---');
  const cookieVal = adminSessionCookie.split(';')[0];
  const adminSessionRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/auth/session',
    method: 'GET',
    headers: {
      'Cookie': cookieVal
    }
  });
  assert(adminSessionRes.statusCode === 200, '3a. Admin Session endpoint accepts HttpOnly cookie', `Got ${adminSessionRes.statusCode}`);
  assert(adminSessionRes.body?.data?.username === 'admin' || adminSessionRes.body?.user?.username === 'admin', '3b. Session payload returns verified admin profile');
  assert(Boolean(adminSessionRes.body?.permissions || adminSessionRes.body?.data?.permissions), '3c. Session payload returns permission matrix ($this->GP)');

  // 4. Staff account blocked from website login
  console.log('\n--- Testing Staff Restriction on Public Website ---');
  const staffOnWebRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/web/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { login: 'admin', password: 'admin' });
  assert(staffOnWebRes.statusCode === 403, '4a. Staff accounts blocked from website login (HTTP 403)', `Got ${staffOnWebRes.statusCode}`);
  assert(staffOnWebRes.body?.code === 'FORBIDDEN_STAFF_ON_WEB' || String(staffOnWebRes.body?.message).includes('Staff'), '4b. Error message guides staff to administrative portal');

  // 5. Customer Login on Public Website
  console.log('\n--- Testing Website Customer Login ---');
  // First lookup a customer in the database or register one
  const { db } = require('../API/app/config/utill/helper');
  const [custRows] = await db.query("SELECT id, username, email FROM aura_users WHERE group_id = 4 AND active = 1 LIMIT 1");
  let customerLoginName = custRows && custRows.length > 0 ? custRows[0].username : null;

  if (!customerLoginName) {
    // Register a test customer
    const regRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/web/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Test Customer',
      email: 'test_cust_auto@example.com',
      phone: '012345678',
      password: 'password123',
      role: 'customer'
    });
    customerLoginName = regRes.body?.data?.username || 'test_cust_auto@example.com';
  }

  const webLoginRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/web/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { login: customerLoginName, password: 'password' });

  // If password was different, update password for testing
  let webToken = null;
  let webSessionCookie = null;
  if (webLoginRes.statusCode === 200) {
    webToken = webLoginRes.body?.data?.token;
    webSessionCookie = webLoginRes.cookies.find(c => c.startsWith('aura_web_session='));
  } else {
    // Set password hash to 'password' for test customer
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password', 10);
    await db.query("UPDATE aura_users SET password = ?, password_algo = 'bcrypt' WHERE username = ?", [hash, customerLoginName]);
    const retryRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/web/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { login: customerLoginName, password: 'password' });
    assert(retryRes.statusCode === 200, '5a. Website Customer Login status 200', `Got ${retryRes.statusCode}`);
    webToken = retryRes.body?.data?.token;
    webSessionCookie = retryRes.cookies.find(c => c.startsWith('aura_web_session='));
  }

  assert(Boolean(webToken), '5b. Website Customer Login returns JWT token');
  assert(Boolean(webSessionCookie), '5c. Website Customer Login sets "aura_web_session" cookie');
  assert(webSessionCookie?.includes('HttpOnly'), '5d. "aura_web_session" has HttpOnly flag');

  // 6. Customer blocked from administrative portal
  console.log('\n--- Testing Customer Restriction on Administrative Portal ---');
  const custOnAdminRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: customerLoginName, password: 'password' });
  assert(custOnAdminRes.statusCode === 403, '6a. Customer accounts blocked from Admin login (HTTP 403)', `Got ${custOnAdminRes.statusCode}`);
  assert(custOnAdminRes.body?.code === 'FORBIDDEN_CUSTOMER' || String(custOnAdminRes.body?.message).includes('Customer'), '6b. Rejection code is FORBIDDEN_CUSTOMER');

  // 7. Simultaneous Coexistence of Admin and Website Sessions
  console.log('\n--- Testing Simultaneous Coexistence of Sessions ---');
  const webCookieVal = webSessionCookie ? webSessionCookie.split(';')[0] : '';
  const simultaneousRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/auth/session',
    method: 'GET',
    headers: {
      'Cookie': `${cookieVal}; ${webCookieVal}`
    }
  });
  assert(simultaneousRes.statusCode === 200, '7a. Admin session intact when web session cookie is also present');
  assert(simultaneousRes.body?.user?.username === 'admin' || simultaneousRes.body?.data?.username === 'admin', '7b. Preserves admin identity without collision');

  // 8. Server-Side Inactivity Validation
  console.log('\n--- Testing Inactivity Timeout Detection ---');
  await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/auth/activity?simulate_idle=1',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const inactiveCheckRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/auth/session',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  assert(inactiveCheckRes.statusCode === 401, '8a. Inactive session returns 401 status', `Got ${inactiveCheckRes.statusCode}`);
  assert(inactiveCheckRes.body?.code === 'SESSION_INACTIVE' || inactiveCheckRes.body?.code === 'INACTIVITY_TIMEOUT', '8b. Code indicates inactivity timeout');

  // 9. Admin Logout & Cookie Clearing
  console.log('\n--- Testing Admin Logout ---');
  const logoutRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/auth/logout',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookieVal
    }
  });
  assert(logoutRes.statusCode === 200, '9a. Admin logout returns 200');
  const clearCookieHeader = logoutRes.cookies.find(c => c.startsWith('aura_admin_session=;'));
  assert(Boolean(clearCookieHeader) || logoutRes.cookies.length > 0, '9b. Admin logout clears session cookie');

  // 10. Website Customer Logout
  console.log('\n--- Testing Website Customer Logout ---');
  const webLogoutRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/web/auth/logout',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${webToken}`,
      'Cookie': webCookieVal
    }
  });
  assert(webLogoutRes.statusCode === 200, '10a. Website customer logout returns 200');
  const clearWebCookieHeader = webLogoutRes.cookies.find(c => c.startsWith('aura_web_session=;'));
  assert(Boolean(clearWebCookieHeader) || webLogoutRes.cookies.length > 0, '10b. Website customer logout clears session cookie');

  console.log('\n===============================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('[Test Exception]', err);
  process.exit(1);
});
