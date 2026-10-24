// scripts/test_barcode_system.js
const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== STARTING BARCODE LABEL SYSTEM TESTS ===\n');

  try {
    // 1. Settings & Paper Styles
    console.log('1. Testing GET /api/admin/products/barcode/settings...');
    const settingsRes = await get('/api/admin/products/barcode/settings');
    console.log(`Status: ${settingsRes.status}`);
    const settingsPayload = settingsRes.data?.data;
    if (settingsPayload) {
      console.log(`Site Name: ${settingsPayload.site_name}`);
      console.log(`Paper Styles Count: ${settingsPayload.paper_styles?.length}`);
      console.log(`Currencies: ${settingsPayload.currencies?.map(c => `${c.code}(${c.rate})`).join(', ')}`);
    } else {
      console.error('Failed settings response:', settingsRes);
    }
    console.log('\n----------------------------------------\n');

    // 2. Suggestions Search
    console.log('2. Testing GET /api/admin/products/barcode/suggestions?term=shirt...');
    const sugRes = await get('/api/admin/products/barcode/suggestions?term=shirt');
    console.log(`Status: ${sugRes.status}, Found: ${sugRes.data?.data?.length || 0} products`);
    if (sugRes.data?.data?.[0]) {
      const p = sugRes.data.data[0];
      console.log(`Sample product: ${p.name} (code: ${p.code}, variants: ${p.variants?.length || 0})`);
    }
    console.log('\n----------------------------------------\n');

    // 3. Single Product Lookup
    console.log('3. Testing GET /api/admin/products/barcode/product/529...');
    const prodRes = await get('/api/admin/products/barcode/product/529');
    console.log(`Status: ${prodRes.status}`);
    if (prodRes.data?.data) {
      console.log(`Product: ${prodRes.data.data.name} (price: $${prodRes.data.data.price})`);
      console.log(`Variants:`, prodRes.data.data.variants?.map(v => `${v.name} ($${v.price})`));
    }
    console.log('\n----------------------------------------\n');

    // 4. Transfer Import
    console.log('4. Testing GET /api/admin/products/barcode/transfer/1...');
    const trRes = await get('/api/admin/products/barcode/transfer/1');
    console.log(`Status: ${trRes.status}, Items: ${trRes.data?.data?.length || 0}`);
    console.log('\n----------------------------------------\n');

    // 5. Purchase Import
    console.log('5. Testing GET /api/admin/products/barcode/purchase/1...');
    const purRes = await get('/api/admin/products/barcode/purchase/1');
    console.log(`Status: ${purRes.status}, Items: ${purRes.data?.data?.length || 0}`);
    console.log('\n----------------------------------------\n');

    // 6. Test Web Page
    console.log('6. Testing GET /admins/products?action=barcode (HTML serving)...');
    const htmlRes = await get('/admins/products?action=barcode');
    console.log(`Status: ${htmlRes.status}, Content Length: ${htmlRes.raw?.length || 0}`);

    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Test error:', err);
  }
}

runTests();
