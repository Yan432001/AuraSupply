const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(`http://localhost:3000${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runSuite() {
  console.log('===========================================================');
  console.log('       BARCODE LABEL SYSTEM FULL VERIFICATION SUITE         ');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`[PASS] ${name} ${extra ? `(${extra})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Settings
    const sRes = await request('GET', '/api/admin/products/barcode/settings');
    assert('1. Barcode Settings Endpoint', sRes.status === 200);
    assert('   - Paper Styles Count', sRes.data?.data?.paper_styles?.length === 15, `${sRes.data?.data?.paper_styles?.length} styles`);
    assert('   - Currencies List', sRes.data?.data?.currencies?.length >= 3);
    assert('   - Categories Available', sRes.data?.data?.categories?.length > 0, `${sRes.data?.data?.categories?.length} categories`);
    assert('   - Brands Available', sRes.data?.data?.brands?.length > 0, `${sRes.data?.data?.brands?.length} brands`);

    // 2. Product List & Query Intercept
    const lRes = await request('GET', '/api/admin/products/barcode/list?limit=5');
    assert('2. Barcode Products List Endpoint', lRes.status === 200 && lRes.data?.data?.length > 0);
    const prod = lRes.data?.data?.[0];
    assert('   - Product Schema Check', prod && prod.id && prod.name && prod.barcode_type !== undefined, `Product #${prod?.id}: ${prod?.name}`);

    // 3. Action=barcode query intercept
    const actRes = await request('GET', '/api/admin/products?action=barcode&limit=2');
    assert('3. Action=barcode Query Intercept', actRes.status === 200);

    // 4. Templates
    const tRes = await request('GET', '/api/admin/products/barcode/templates');
    assert('4. Barcode Templates Endpoint', tRes.status === 200 && tRes.data?.data?.length >= 6);

    // 5. Preview
    const prevRes = await request('POST', '/api/admin/products/barcode/preview', {
      items: [{ product_id: prod.id, quantity: 3 }],
      label_size: '50x30',
      template: 'standard',
      barcode_type: 'CODE128',
      display_options: { site_name: true, price: true }
    });
    assert('5. Barcode Label Preview Endpoint', prevRes.status === 200 && prevRes.data?.data?.total_labels === 3);

    // 6. Generate Barcode (Single)
    const genRes = await request('POST', '/api/admin/products/barcode/generate', {
      product_ids: [prod.id],
      barcode_type: 'CODE128',
      prefix: 'AUR'
    });
    assert('6. Barcode Auto-Generation Endpoint', genRes.status === 200 && genRes.data?.data?.[0]?.success);

    // 7. Print & Audit Logging
    const printRes = await request('POST', '/api/admin/products/barcode/print', {
      items: [{ product_id: prod.id, quantity: 3 }],
      label_size: '50x30',
      template: 'standard',
      barcode_type: 'CODE128'
    });
    assert('7. Barcode Print & Audit Logging Endpoint', printRes.status === 200 && printRes.data?.logged === 1);

    // 8. Print Logs History
    const logsRes = await request('GET', '/api/admin/products/barcode/logs');
    assert('8. Barcode Audit History Endpoint', logsRes.status === 200 && logsRes.data?.data?.length > 0);
    const recentLog = logsRes.data?.data?.[0];
    assert('   - Log Detail Verification', recentLog && recentLog.product && recentLog.quantity > 0, `Logged product: ${recentLog?.product?.name}`);

    // 9. Web Route Serving
    const webRes = await request('GET', '/admins/products?action=barcode');
    assert('9. Web Route /admins/products?action=barcode', webRes.status === 200);

    console.log('\n===========================================================');
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===========================================================');
  } catch (err) {
    console.error('Test Suite Exception:', err);
  }
}

runSuite().catch(console.error);
