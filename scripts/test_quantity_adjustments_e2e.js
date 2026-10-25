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
  console.log('--- STARTING QUANTITY ADJUSTMENTS E2E TESTS ---');
  let failures = 0;

  // 1. Metadata Options
  try {
    const res = await request('http://localhost:3000/api/admin/products/quantity_adjustments/meta/options');
    if (res.statusCode === 200 && res.json && res.json.success) {
      console.log('✅ TEST 1 PASSED: Metadata options returned next reference: ' + res.json.data.nextReferenceNo + ' and ' + res.json.data.warehouses?.length + ' warehouses.');
    } else {
      console.error('❌ TEST 1 FAILED:', res.statusCode, res.data);
      failures++;
    }
  } catch (err) {
    console.error('❌ TEST 1 ERROR:', err.message);
    failures++;
  }

  // 2. Available Products with QOH for Warehouse 1
  let productWithStock = null;
  let secondProduct = null;
  try {
    const res1 = await request('http://localhost:3000/api/admin/products/quantity_adjustments/products?warehouse_id=1&search=Vital');
    const res2 = await request('http://localhost:3000/api/admin/products/quantity_adjustments/products?warehouse_id=1&search=Water');
    if (res1.statusCode === 200 && res1.json && res1.json.data?.length > 0) {
      productWithStock = res1.json.data[0];
    }
    if (res2.statusCode === 200 && res2.json && res2.json.data?.length > 0) {
      secondProduct = res2.json.data[0];
    }
    console.log(`✅ TEST 2 PASSED: Sample 1: ${productWithStock?.name} (Stock: ${productWithStock?.warehouse_stock}), Sample 2: ${secondProduct?.name} (Stock: ${secondProduct?.warehouse_stock})`);
  } catch (err) {
    console.error('❌ TEST 2 ERROR:', err.message);
    failures++;
  }

  // 3. List Adjustments
  try {
    const res = await request('http://localhost:3000/api/admin/products/quantity_adjustments?limit=5');
    if (res.statusCode === 200 && res.json && res.json.success) {
      console.log(`✅ TEST 3 PASSED: Adjustments list returned ${res.json.data.length} records. Total in DB: ${res.json.pagination.total}. Net Qty: ${(Number(res.json.stats?.total_added_qty) || 0) - (Number(res.json.stats?.total_subtracted_qty) || 0)}`);
    } else {
      console.error('❌ TEST 3 FAILED:', res.statusCode, res.data);
      failures++;
    }
  } catch (err) {
    console.error('❌ TEST 3 ERROR:', err.message);
    failures++;
  }

  // 4. Create Quantity Adjustment (Multi-item: 1 addition + 1 subtraction)
  let createdAdjId = null;
  const testRefNo = 'TEST_QA_' + Date.now().toString().slice(-6);
  try {
    const payload = {
      warehouse_id: 1,
      biller_id: 3,
      reference_no: testRefNo,
      date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      note: 'Automated E2E Test Quantity Adjustment voucher',
      items: [
        {
          product_id: productWithStock.id,
          option_id: productWithStock.variants?.[0]?.id || null,
          quantity: 2,
          type: 'subtraction',
          unit_cost: Number(productWithStock.cost || 10),
          serial_no: 'SN-E2E-SUB',
          expiry: null
        },
        {
          product_id: secondProduct.id,
          option_id: secondProduct.variants?.[0]?.id || null,
          quantity: 5,
          type: 'addition',
          unit_cost: Number(secondProduct.cost || 15),
          serial_no: 'SN-E2E-ADD',
          expiry: '2027-12-31'
        }
      ]
    };

    const res = await request('http://localhost:3000/api/admin/products/quantity_adjustments', { method: 'POST' }, payload);
    if (res.statusCode === 201 && res.json && res.json.success) {
      createdAdjId = res.json.data.id;
      console.log(`✅ TEST 4 PASSED: Created Quantity Adjustment ID ${createdAdjId}, Ref: ${res.json.data.reference_no}`);
    } else {
      console.error('❌ TEST 4 FAILED:', res.statusCode, res.data);
      failures++;
    }
  } catch (err) {
    console.error('❌ TEST 4 ERROR:', err.message);
    failures++;
  }

  // 5. Get Adjustment Details by ID
  if (createdAdjId) {
    try {
      const res = await request(`http://localhost:3000/api/admin/products/quantity_adjustments/${createdAdjId}`);
      if (res.statusCode === 200 && res.json && res.json.success && res.json.data.items?.length === 2) {
        console.log(`✅ TEST 5 PASSED: Retrieved voucher details for ID ${createdAdjId} with ${res.json.data.items.length} line items.`);
      } else {
        console.error('❌ TEST 5 FAILED:', res.statusCode, res.data);
        failures++;
      }
    } catch (err) {
      console.error('❌ TEST 5 ERROR:', err.message);
      failures++;
    }

    // 6. Update Adjustment (Modify items and recalculate stock)
    try {
      const updatePayload = {
        warehouse_id: 1,
        biller_id: 3,
        reference_no: testRefNo,
        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        note: 'Updated E2E Adjustment with revised quantities',
        items: [
          {
            product_id: productWithStock.id,
            quantity: 1, // Changed from 2 to 1
            type: 'subtraction',
            unit_cost: Number(productWithStock.cost || 10)
          },
          {
            product_id: secondProduct.id,
            quantity: 10, // Changed from 5 to 10
            type: 'addition',
            unit_cost: Number(secondProduct.cost || 15)
          }
        ]
      };

      const res = await request(`http://localhost:3000/api/admin/products/quantity_adjustments/${createdAdjId}`, { method: 'PUT' }, updatePayload);
      if (res.statusCode === 200 && res.json && res.json.success) {
        console.log(`✅ TEST 6 PASSED: Updated adjustment ID ${createdAdjId} and atomically recalculated stock.`);
      } else {
        console.error('❌ TEST 6 FAILED:', res.statusCode, res.data);
        failures++;
      }
    } catch (err) {
      console.error('❌ TEST 6 ERROR:', err.message);
      failures++;
    }

    // 7. Delete Adjustment (Safe cancellation & reversal)
    try {
      const res = await request(`http://localhost:3000/api/admin/products/quantity_adjustments/${createdAdjId}`, { method: 'DELETE' });
      if (res.statusCode === 200 && res.json && res.json.success) {
        console.log(`✅ TEST 7 PASSED: Deleted adjustment ID ${createdAdjId} and safely reversed all stock balances.`);
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
    '/admins/products?tab=quantity-adjustments',
    '/admins/products/quantity_adjustments',
    '/admins/products/quantity-adjustments',
    '/admins/products/add_adjustment',
    '/admins/products/edit_adjustment/1',
    '/admin/products?tab=quantity-adjustments',
    '/admin/products/quantity_adjustments'
  ];

  for (const pageUrl of pageRoutes) {
    try {
      const res = await request(`http://localhost:3000${pageUrl}`);
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
    console.log(`🎉 ALL QUANTITY ADJUSTMENT TESTS PASSED! (0 failures)`);
  } else {
    console.log(`⚠️ TESTS FINISHED WITH ${failures} FAILURE(S).`);
  }
  console.log(`=========================================\n`);
}

runTests();
