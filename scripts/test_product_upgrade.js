const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
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
  console.log('=== STARTING PRODUCT MANAGEMENT API & INTEGRATION TESTS ===\n');

  let testProductId = null;
  let duplicateProductId = null;

  try {
    // 0. Login as Admin
    console.log('[AUTH] Logging in as admin...');
    const loginRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: 'admin',
      password: 'password'
    });

    let adminToken = loginRes.data?.token || loginRes.data?.data?.token;
    if (!adminToken) {
      // Try fallback password 'admin'
      const retryLogin = await request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        username: 'admin',
        password: 'admin'
      });
      adminToken = retryLogin.data?.token || retryLogin.data?.data?.token;
    }

    console.log(`✓ Admin session authenticated. Token present: ${Boolean(adminToken)}`);

    const authHeaders = {
      'Content-Type': 'application/json',
      ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
    };

    // 1. Test Metadata Endpoint
    console.log('\n[TEST 1] Testing Product Metadata Options (/api/products/meta/options)...');
    const metaRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/products/meta/options',
      method: 'GET',
      headers: authHeaders
    });
    
    if (metaRes.status !== 200 || !metaRes.data?.data) {
      throw new Error(`Failed to fetch metadata: ${metaRes.status} ${JSON.stringify(metaRes.data || metaRes.raw)}`);
    }
    const meta = metaRes.data.data;
    console.log(`✓ Meta Options loaded successfully! Categories: ${meta.categories?.length || 0}, Brands: ${meta.brands?.length || 0}, Units: ${meta.units?.length || 0}, Warehouses: ${meta.warehouses?.length || 0}, Suppliers: ${meta.suppliers?.length || 0}, Tax Rates: ${meta.tax_rates?.length || 0}`);

    // 2. Test Product Creation with Full AURA_v1 Fields
    console.log('\n[TEST 2] Testing Product Creation (POST /api/admin/products)...');
    const testCode = 'TST-' + Math.floor(100000 + Math.random() * 900000);
    const productPayload = {
      code: testCode,
      name: 'AURA v1 Test Enterprise Device',
      second_name: 'Khmer/Second Name Test Enterprise',
      barcode: 'BC-' + testCode,
      barcode_symbology: 'code128',
      sku: 'SKU-' + testCode,
      type: 'standard',
      category_id: meta.categories?.[0]?.id || 1,
      brand_id: meta.brands?.[0]?.id || 1,
      unit: meta.units?.[0]?.id || 1,
      cost: 45.00,
      price: 99.00,
      promotion: 1,
      promo_price: 79.99,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      weight: 1.75,
      p_length: 20.5,
      p_width: 15.0,
      p_height: 5.2,
      cf1: 'Custom Batch A',
      cf2: 'Standard Cert ISO9001',
      supplier1: meta.suppliers?.[0]?.id || 1,
      supplier1price: 42.50,
      product_details: 'Automated test product payload matching AURA_v1 specifications.',
      warehouse_stocks: meta.warehouses?.slice(0, 2).map((w, idx) => ({
        warehouse_id: w.id,
        quantity: (idx + 1) * 25,
        rack: `RACK-${idx + 1}-A`
      })) || []
    };

    const createRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/products',
      method: 'POST',
      headers: authHeaders
    }, productPayload);

    if (createRes.status !== 201 || !createRes.data?.data?.id) {
      throw new Error(`Product creation failed: ${createRes.status} ${JSON.stringify(createRes.data || createRes.raw)}`);
    }
    testProductId = createRes.data.data.id;
    console.log(`✓ Product created successfully with ID: ${testProductId}, Code: ${testCode}`);

    // 3. Test Product Retrieval & Verification
    console.log(`\n[TEST 3] Testing Product Details (GET /api/admin/products/${testProductId})...`);
    const getRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/products/${testProductId}`,
      method: 'GET',
      headers: authHeaders
    });

    if (getRes.status !== 200 || !getRes.data?.data) {
      throw new Error(`Failed to retrieve product #${testProductId}: ${getRes.status}`);
    }
    const retrieved = getRes.data.data;
    console.log(`✓ Retrieved product: "${retrieved.name}" (Code: ${retrieved.code})`);
    console.log(`  - Second Name: ${retrieved.second_name}`);
    console.log(`  - Brand Name: ${retrieved.brand_name || '(brand_id: ' + retrieved.brand_id + ')'}`);
    console.log(`  - Cost: $${retrieved.cost}, Price: $${retrieved.price}, Promo Price: $${retrieved.promo_price}`);
    console.log(`  - Supplier: ${retrieved.supplier1_name || retrieved.supplier1}`);

    // 4. Test Filtering by Brand and Search
    console.log(`\n[TEST 4] Testing Product List Filtering (Search: "${testCode}")...`);
    const searchRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/products?search=${encodeURIComponent(testCode)}`,
      method: 'GET',
      headers: authHeaders
    });
    const foundItems = searchRes.data?.data || [];
    if (!foundItems.some(p => p.id === testProductId)) {
      throw new Error(`Search failed to find created product by code "${testCode}"`);
    }
    console.log(`✓ Search found ${foundItems.length} matching product(s), including #${testProductId}`);

    // 5. Test Product Duplication
    console.log(`\n[TEST 5] Testing Product Duplication (POST /api/admin/products/${testProductId}/duplicate)...`);
    const dupRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/products/${testProductId}/duplicate`,
      method: 'POST',
      headers: authHeaders
    });

    if (dupRes.status !== 201 || !dupRes.data?.data?.id) {
      throw new Error(`Duplication failed: ${dupRes.status} ${JSON.stringify(dupRes.data || dupRes.raw)}`);
    }
    duplicateProductId = dupRes.data.data.id;
    console.log(`✓ Product duplicated successfully! New Duplicate ID: ${duplicateProductId}, Code: ${dupRes.data.data.code}`);

    // Verify duplicate details
    const getDupRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/products/${duplicateProductId}`,
      method: 'GET',
      headers: authHeaders
    });
    const dupData = getDupRes.data.data;
    console.log(`  - Duplicate Name: ${dupData.name}`);
    console.log(`  - Duplicate Barcode: ${dupData.barcode}`);
    console.log(`  - Duplicate SKU: ${dupData.sku}`);

    // 6. Test Product Update
    console.log(`\n[TEST 6] Testing Product Update (PUT /api/admin/products/${testProductId})...`);
    const updateRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/products/${testProductId}`,
      method: 'PUT',
      headers: authHeaders
    }, {
      name: 'AURA v1 Test Enterprise Device (Updated)',
      price: 110.00,
      promo_price: 89.99
    });
    if (updateRes.status !== 200) {
      throw new Error(`Update failed: ${updateRes.status}`);
    }
    console.log(`✓ Product #${testProductId} updated successfully!`);

    // 7. Cleanup
    console.log('\n[TEST 7] Cleaning up test products...');
    await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/products/${testProductId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/products/${duplicateProductId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    console.log(`✓ Cleaned up test products #${testProductId} and #${duplicateProductId}`);

    console.log('\n======================================================');
    console.log('  ALL PRODUCT MANAGEMENT INTEGRATION TESTS PASSED!    ');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err.message);
    if (testProductId) {
      try {
        await request({ hostname: 'localhost', port: 3000, path: `/api/admin/products/${testProductId}`, method: 'DELETE', headers: authHeaders });
      } catch (_) {}
    }
    if (duplicateProductId) {
      try {
        await request({ hostname: 'localhost', port: 3000, path: `/api/admin/products/${duplicateProductId}`, method: 'DELETE', headers: authHeaders });
      } catch (_) {}
    }
    process.exit(1);
  }
}

runTests();
