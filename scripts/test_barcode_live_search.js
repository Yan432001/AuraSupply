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

async function testLiveSearch() {
  console.log('=== TESTING BARCODE CATALOG LIVE SEARCH API ===\n');

  try {
    // 1. Test search with term "Coat"
    console.log('[TEST 1] Searching for "Coat"...');
    const resCoat = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/products/barcode/list?search=Coat&page=1&limit=10',
      method: 'GET'
    });
    console.log(`Status: ${resCoat.status}, Total results: ${resCoat.data?.pagination?.total || 0}`);
    if (resCoat.data?.data?.length > 0) {
      console.log('First matched product:', resCoat.data.data[0].name, '| SKU:', resCoat.data.data[0].code, '| Barcode:', resCoat.data.data[0].barcode);
    }

    // 2. Test search with term "EDU-UNI-LAW01" (SKU search)
    console.log('\n[TEST 2] Searching by SKU "EDU-UNI-LAW01"...');
    const resSku = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/products/barcode/list?search=EDU-UNI-LAW01&page=1&limit=10',
      method: 'GET'
    });
    console.log(`Status: ${resSku.status}, Total results: ${resSku.data?.pagination?.total || 0}`);
    if (resSku.data?.data?.length > 0) {
      console.log('First matched product:', resSku.data.data[0].name, '| SKU:', resSku.data.data[0].code);
    }

    // 3. Test empty search (all products list)
    console.log('\n[TEST 3] Fetching with empty search...');
    const resEmpty = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/products/barcode/list?page=1&limit=10',
      method: 'GET'
    });
    console.log(`Status: ${resEmpty.status}, Total catalog products: ${resEmpty.data?.pagination?.total || 0}`);

    console.log('\n✓ Live search API tests completed successfully!');
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testLiveSearch();
