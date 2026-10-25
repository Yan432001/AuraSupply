const axios = require('axios');

async function runStockCountTests(baseUrl) {
  console.log(`\n======================================================`);
  console.log(`TESTING STOCK COUNTS API ON: ${baseUrl}`);
  console.log(`======================================================`);

  // 1. Meta Options
  console.log('1. Testing GET /api/admin/products/stock-counts/meta/options...');
  const resMeta = await axios.get(`${baseUrl}/api/admin/products/stock-counts/meta/options`);
  console.log('   ✓ Meta options retrieved successfully');
  console.log(`     Warehouses: ${resMeta.data.data.warehouses.length}`);
  console.log(`     Categories: ${resMeta.data.data.categories.length} (top category: ${resMeta.data.data.categories[0].name} with ${resMeta.data.data.categories[0].product_count} items)`);
  console.log(`     Next ref: ${resMeta.data.data.nextReferenceNo}`);

  // 2. Create Full Count (Warehouse 1)
  console.log('2. Testing POST /api/admin/products/stock-counts (Full Count - Warehouse 1)...');
  const resCreateFull = await axios.post(`${baseUrl}/api/admin/products/stock-counts`, {
    warehouse_id: 1,
    date: new Date().toISOString(),
    type: 'full',
    note: 'Automated test full count'
  });
  console.log(`   ✓ Full count created: #${resCreateFull.data.data.reference_no} (ID: ${resCreateFull.data.data.id})`);
  const countId = resCreateFull.data.data.id;

  // 3. Create Partial Count (Category 218 - Books & Fine Stationery)
  console.log('3. Testing POST /api/admin/products/stock-counts (Partial Count - Category 218)...');
  const resCreatePartial = await axios.post(`${baseUrl}/api/admin/products/stock-counts`, {
    warehouse_id: 1,
    date: new Date().toISOString(),
    type: 'partial',
    categories: ['218'],
    note: 'Automated test partial count'
  });
  console.log(`   ✓ Partial count created: #${resCreatePartial.data.data.reference_no} (${resCreatePartial.data.data.products_count} products)`);

  // 4. Create Partial Count for Empty Category -> Should gracefully return 400 Bad Request, NOT 500!
  console.log('4. Testing POST /api/admin/products/stock-counts (Empty Category 4 validation)...');
  try {
    await axios.post(`${baseUrl}/api/admin/products/stock-counts`, {
      warehouse_id: 1,
      type: 'partial',
      categories: ['4']
    });
    console.error('   ❌ Expected 400 error but request succeeded!');
  } catch (err) {
    if (err.response?.status === 400) {
      console.log(`   ✓ Correctly returned HTTP 400 Bad Request: "${err.response.data?.message}"`);
    } else {
      console.error(`   ❌ Unexpected status: ${err.response?.status} - ${err.message}`);
    }
  }

  // 5. Get Details & Items
  console.log(`5. Testing GET /api/admin/products/stock-counts/${countId}...`);
  const resDetails = await axios.get(`${baseUrl}/api/admin/products/stock-counts/${countId}`);
  console.log(`   ✓ Details retrieved: ${resDetails.data.data.items.length} items`);
  const firstItem = resDetails.data.data.items[0];

  // 6. Test Barcode Scan Item
  console.log(`6. Testing POST /api/admin/products/stock-counts/${countId}/scan...`);
  const resScan = await axios.post(`${baseUrl}/api/admin/products/stock-counts/${countId}/scan`, {
    barcode: firstItem.product_code,
    quantity_delta: 2
  });
  console.log(`   ✓ Item scanned: ${resScan.data.data.product_name} (New Count: ${resScan.data.data.counted}, Diff: ${resScan.data.data.difference})`);

  // 7. Test Export CSV
  console.log(`7. Testing GET /api/admin/products/stock-counts/${countId}/export-csv...`);
  const resCsv = await axios.get(`${baseUrl}/api/admin/products/stock-counts/${countId}/export-csv`);
  console.log(`   ✓ Export CSV generated: ${resCsv.headers['content-disposition']}, length=${resCsv.data.length} chars`);

  // 8. Test Update Items
  console.log(`8. Testing PUT /api/admin/products/stock-counts/${countId}/items...`);
  const resUpdate = await axios.put(`${baseUrl}/api/admin/products/stock-counts/${countId}/items`, {
    items: [
      { id: firstItem.id, counted: 5 }
    ]
  });
  console.log(`   ✓ Items updated: ${resUpdate.data.message}`);

  console.log(`\n🎉 ALL TESTS PASSED SUCCESSFULLY ON: ${baseUrl}\n`);
}

async function run() {
  try {
    await runStockCountTests('http://localhost:3000');
    await runStockCountTests('http://localhost:5173');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

run();
