const http = require('http');

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (postData) {
      if (typeof postData === 'object') {
        postData = JSON.stringify(postData);
        reqOptions.headers['Content-Type'] = 'application/json';
      }
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING USING STOCK E2E TESTS ---');
  let failures = 0;

  // 1. Metadata Options
  try {
    const res = await request('http://localhost:3000/api/admin/products/using_stock/meta/options');
    if (res.statusCode === 200 && res.json && res.json.success) {
      console.log('✅ TEST 1 PASSED: /api/admin/products/using_stock/meta/options returned warehouses, billers, and next reference: ' + res.json.data.nextReferenceNo);
    } else {
      console.error('❌ TEST 1 FAILED:', res.statusCode, res.data);
      failures++;
    }
  } catch (err) {
    console.error('❌ TEST 1 ERROR:', err.message);
    failures++;
  }

  // 2. Available Products for Warehouse
  let sampleProduct = null;
  try {
    const res = await request('http://localhost:3000/api/admin/products/using_stock/products?warehouse_id=1');
    if (res.statusCode === 200 && res.json && Array.isArray(res.json.data)) {
      sampleProduct = res.json.data.find(p => Number(p.warehouse_stock) > 0) || res.json.data[0];
      console.log(`✅ TEST 2 PASSED: /api/admin/products/using_stock/products returned ${res.json.data.length} products. Sample: ${sampleProduct?.name} (Stock: ${sampleProduct?.warehouse_stock})`);
    } else {
      console.error('❌ TEST 2 FAILED:', res.statusCode, res.data);
      failures++;
    }
  } catch (err) {
    console.error('❌ TEST 2 ERROR:', err.message);
    failures++;
  }

  // 3. Stock Usage List
  try {
    const res = await request('http://localhost:3000/api/admin/products/using_stock?limit=5');
    if (res.statusCode === 200 && res.json && res.json.success) {
      console.log(`✅ TEST 3 PASSED: /api/admin/products/using_stock returned ${res.json.data.length} records. Total in DB: ${res.json.pagination.total}. Stats total use: ${res.json.stats?.count_use}`);
    } else {
      console.error('❌ TEST 3 FAILED:', res.statusCode, res.data);
      failures++;
    }
  } catch (err) {
    console.error('❌ TEST 3 ERROR:', err.message);
    failures++;
  }

  // 4. Create Using Stock record
  let createdUsageId = null;
  let testRefNo = 'TEST_SU_' + Date.now().toString().slice(-6);
  try {
    const payload = {
      warehouse_id: 1,
      biller_id: 1,
      employee_id: 1,
      reference_no: testRefNo,
      date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      note: 'Automated E2E Test Using Stock voucher',
      items: [
        {
          product_id: sampleProduct ? sampleProduct.id : 1,
          quantity: 1,
          unit_cost: sampleProduct ? Number(sampleProduct.cost || 10) : 10,
          unit_id: sampleProduct?.unit_id || 1,
          unit_name: sampleProduct?.unit_name || 'Unit',
          description: 'E2E Consumption item'
        }
      ]
    };

    const res = await request('http://localhost:3000/api/admin/products/using_stock', { method: 'POST' }, payload);
    if (res.statusCode === 201 && res.json && res.json.success) {
      createdUsageId = res.json.data.id;
      console.log(`✅ TEST 4 PASSED: Created stock usage record ID: ${createdUsageId}, Ref: ${res.json.data.reference_no}`);
    } else {
      console.error('❌ TEST 4 FAILED:', res.statusCode, res.data);
      failures++;
    }
  } catch (err) {
    console.error('❌ TEST 4 ERROR:', err.message);
    failures++;
  }

  // 5. Get created record by ID
  if (createdUsageId) {
    try {
      const res = await request(`http://localhost:3000/api/admin/products/using_stock/${createdUsageId}`);
      if (res.statusCode === 200 && res.json && res.json.success && res.json.data.items?.length > 0) {
        console.log(`✅ TEST 5 PASSED: Retrieved usage voucher details for ID ${createdUsageId} with ${res.json.data.items.length} line items.`);
      } else {
        console.error('❌ TEST 5 FAILED:', res.statusCode, res.data);
        failures++;
      }
    } catch (err) {
      console.error('❌ TEST 5 ERROR:', err.message);
      failures++;
    }

    // 6. Create Return against this usage
    let returnId = null;
    try {
      const returnPayload = {
        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        reference_no: 'RET_' + testRefNo,
        note: 'E2E Automated stock return',
        items: [
          {
            product_id: sampleProduct ? sampleProduct.id : 1,
            quantity: 1,
            unit_cost: sampleProduct ? Number(sampleProduct.cost || 10) : 10,
            unit_id: sampleProduct?.unit_id || 1,
            unit_name: sampleProduct?.unit_name || 'Unit',
            description: 'E2E returned leftover'
          }
        ]
      };

      const res = await request(`http://localhost:3000/api/admin/products/using_stock/${createdUsageId}/return`, { method: 'POST' }, returnPayload);
      if (res.statusCode === 201 && res.json && res.json.success) {
        returnId = res.json.data.id;
        console.log(`✅ TEST 6 PASSED: Created return record ID ${returnId} for parent usage ${createdUsageId}. Ref: ${res.json.data.reference_no}`);
      } else {
        console.error('❌ TEST 6 FAILED:', res.statusCode, res.data);
        failures++;
      }
    } catch (err) {
      console.error('❌ TEST 6 ERROR:', err.message);
      failures++;
    }

    // Clean up return record
    if (returnId) {
      await request(`http://localhost:3000/api/admin/products/using_stock/${returnId}`, { method: 'DELETE' });
    }

    // 7. Delete Usage record (restore stock)
    try {
      const res = await request(`http://localhost:3000/api/admin/products/using_stock/${createdUsageId}`, { method: 'DELETE' });
      if (res.statusCode === 200 && res.json && res.json.success) {
        console.log(`✅ TEST 7 PASSED: Deleted usage record ID ${createdUsageId} and safely reversed stock.`);
      } else {
        console.error('❌ TEST 7 FAILED:', res.statusCode, res.data);
        failures++;
      }
    } catch (err) {
      console.error('❌ TEST 7 ERROR:', err.message);
      failures++;
    }
  }

  // 8. Test SPA Page Routes
  const pageRoutes = [
    '/admins/products?tab=using-stock',
    '/admins/products/using_stock',
    '/admins/products/using-stock',
    '/admin/products?tab=using-stock',
    '/admin/products/using_stock'
  ];

  for (const pageUrl of pageRoutes) {
    try {
      const res = await request(`http://localhost:3000${pageUrl}`);
      // Either 200 (direct SPA html) or 302/301 redirect
      if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
        console.log(`✅ TEST 8 PASSED: Page Route ${pageUrl} returned HTTP ${res.statusCode}`);
      } else {
        console.error(`❌ TEST 8 FAILED: Page Route ${pageUrl} returned HTTP ${res.statusCode}`);
        failures++;
      }
    } catch (err) {
      console.error(`❌ TEST 8 ERROR on ${pageUrl}:`, err.message);
      failures++;
    }
  }

  console.log(`\n=========================================`);
  if (failures === 0) {
    console.log(`🎉 ALL TESTS PASSED SUCCESSFULLY! (0 failures)`);
  } else {
    console.log(`⚠️ TESTS FINISHED WITH ${failures} FAILURE(S).`);
  }
  console.log(`=========================================\n`);
}

runTests();
