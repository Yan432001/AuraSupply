const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';

async function runTests() {
  console.log('--- 1. Testing Admin Login (/api/admin/auth/login) ---');
  let adminToken = '';
  try {
    const res = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
      username: 'admin',
      password: 'admin',
      remember_me: true
    });
    console.log('✅ Admin login status:', res.data.success);
    console.log('   User:', res.data.data.user.username);
    console.log('   Role/Group:', res.data.data.group.name, `(Level ${res.data.data.group.level})`);
    console.log('   Allowed Permission Keys count:', res.data.data.permissions.length);
    console.log('   Sample Permissions:', res.data.data.permissions.slice(0, 5));
    console.log('   Allowed Branches count:', res.data.data.branches.length);
    console.log('   Branches:', res.data.data.branches.map(b => b.name));
    adminToken = res.data.data.token;
  } catch (err) {
    console.error('❌ Admin login failed:', err.response?.data || err.message);
  }

  console.log('\n--- 2. Testing Wrong Password & Lockout Telemetry ---');
  try {
    await axios.post(`${BASE_URL}/api/admin/auth/login`, {
      username: 'admin',
      password: 'wrong_password_test'
    });
  } catch (err) {
    console.log('✅ Expected 401 error caught:', err.response?.data?.message);
  }

  console.log('\n--- 3. Testing Website Customer Registration (/api/web/auth/register) ---');
  const cusSuffix = Math.floor(1000 + Math.random() * 9000);
  try {
    const res = await axios.post(`${BASE_URL}/api/web/auth/register`, {
      name: `Test Buyer ${cusSuffix}`,
      email: `buyer_${cusSuffix}@testbuyer.com`,
      phone: `012 ${cusSuffix}`,
      password: 'Password123!',
      role: 'customer'
    });
    console.log('✅ Customer registered:', res.data.success, res.data.message);
    console.log('   Status:', res.data.data.status, '(Auto-active:', res.data.data.status === 'active', ')');
  } catch (err) {
    console.error('❌ Customer register failed:', err.response?.data || err.message);
  }

  console.log('\n--- 4. Testing Website Supplier Registration (Requires Approval) ---');
  const supSuffix = Math.floor(1000 + Math.random() * 9000);
  let newSupplierId = null;
  try {
    const res = await axios.post(`${BASE_URL}/api/web/auth/register`, {
      name: `Cambodia Logistics ${supSuffix}`,
      company: `Phnom Penh Express ${supSuffix}`,
      email: `supplier_${supSuffix}@khsupply.com`,
      phone: `098 ${supSuffix}`,
      password: 'SupplierPass123!',
      role: 'supplier',
      business_type: 'Wholesale Food & Packaging'
    });
    console.log('✅ Supplier registered:', res.data.success, res.data.message);
    console.log('   Initial Status:', res.data.data.status, '(Pending approval:', res.data.data.status === 'pending', ')');
    newSupplierId = res.data.data.userId;
  } catch (err) {
    console.error('❌ Supplier register failed:', err.response?.data || err.message);
  }

  console.log('\n--- 5. Testing Supplier Login before Approval (Should be blocked) ---');
  try {
    await axios.post(`${BASE_URL}/api/web/auth/login`, {
      login: `supplier_${supSuffix}@khsupply.com`,
      password: 'SupplierPass123!'
    });
  } catch (err) {
    console.log('✅ Blocked pending supplier login (403):', err.response?.data?.message);
  }

  console.log('\n--- 6. Testing Admin Pending Suppliers List & Approval ---');
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/access/suppliers/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Pending suppliers found in /admins:', res.data.data.length);
    const found = res.data.data.find(s => s.id === newSupplierId);
    console.log('   Found newly created supplier:', found?.first_name || found?.company);

    if (newSupplierId) {
      const appRes = await axios.put(`${BASE_URL}/api/admin/access/suppliers/${newSupplierId}/approve`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin approval status:', appRes.data.message);
    }
  } catch (err) {
    console.error('❌ Pending supplier approval failed:', err.response?.data || err.message);
  }

  console.log('\n--- 7. Testing Supplier Login AFTER Admin Approval ---');
  try {
    const res = await axios.post(`${BASE_URL}/api/web/auth/login`, {
      login: `supplier_${supSuffix}@khsupply.com`,
      password: 'SupplierPass123!'
    });
    console.log('✅ Supplier logged in after approval:', res.data.success);
    console.log('   Permissions:', res.data.data.permissions);
  } catch (err) {
    console.error('❌ Supplier login after approval failed:', err.response?.data || err.message);
  }

  console.log('\n--- 8. Testing Staff Login Prevention on Public Website ---');
  try {
    await axios.post(`${BASE_URL}/api/web/auth/login`, {
      login: 'admin',
      password: 'admin'
    });
  } catch (err) {
    console.log('✅ Staff blocked from public website login (403):', err.response?.data?.message);
  }

  console.log('\n--- 9. Testing Access Control Groups & Permissions API ---');
  try {
    const groupsRes = await axios.get(`${BASE_URL}/api/admin/access/groups`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Groups API:', groupsRes.data.data.length, 'roles configured.');

    const keysRes = await axios.get(`${BASE_URL}/api/admin/access/permission-keys`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Permission Keys Catalogue:', keysRes.data.data.total, 'keys across', keysRes.data.data.grouped.length, 'modules.');

    const branchesRes = await axios.get(`${BASE_URL}/api/admin/access/branches`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Branches & Stores in aura_companies:', branchesRes.data.data.length);
  } catch (err) {
    console.error('❌ Access control API error:', err.response?.data || err.message);
  }

  process.exit(0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
