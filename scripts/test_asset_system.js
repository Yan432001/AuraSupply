const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function get(path) {
  return request({
    hostname: 'localhost',
    port: 3000,
    path,
    method: 'GET'
  });
}

function post(path, body) {
  return request({
    hostname: 'localhost',
    port: 3000,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, body);
}

function put(path, body) {
  return request({
    hostname: 'localhost',
    port: 3000,
    path,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    }
  }, body);
}

function del(path) {
  return request({
    hostname: 'localhost',
    port: 3000,
    path,
    method: 'DELETE'
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING END-TO-END ASSET MANAGEMENT INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✖ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Dashboard Metrics
    const dash = await get('/api/admin/assets/dashboard');
    assert(dash.status === 200 && dash.body.status === true, 'Dashboard metrics endpoint responds 200');
    assert(dash.body.data?.summary?.total_assets >= 5, `Dashboard aggregates asset totals (found ${dash.body.data?.summary?.total_assets})`);
    assert(dash.body.data?.byCategory?.length > 0, 'Dashboard returns categories distribution');

    // 2. Next Asset Code
    const codeRes = await get('/api/admin/assets/next-code');
    assert(codeRes.status === 200 && codeRes.body.data?.asset_code?.startsWith('AST-'), `Generated asset code: ${codeRes.body.data?.asset_code}`);
    const testCode = codeRes.body.data?.asset_code;

    // 3. Create Category
    const catRes = await post('/api/admin/assets/categories', {
      name: 'Test Test Lab Equipment',
      code: `CAT-TEST-${Date.now().toString().slice(-4)}`,
      useful_life_months: 48,
      depreciation_rate: 25.0,
      description: 'Automated test category'
    });
    assert(catRes.status === 201 && catRes.body.data?.id, `Category created with ID ${catRes.body.data?.id}`);
    const testCatId = catRes.body.data?.id;

    // 4. Create Asset
    const createRes = await post('/api/admin/assets', {
      asset_code: testCode,
      name: 'Automated Test Precision Server',
      category_id: testCatId,
      brand: 'Cisco',
      model: 'UCS-C220-M5',
      serial_number: `SN-TEST-${Date.now()}`,
      barcode: `BC-TEST-${Date.now()}`,
      purchase_date: '2024-01-01',
      purchase_cost: 4000.00,
      residual_value: 400.00,
      useful_life_months: 36,
      location_name: 'Test Rack A',
      department_name: 'R&D',
      condition: 'new',
      status: 'available',
      note: 'Created by automated integration test'
    });
    assert(createRes.status === 201 && createRes.body.data?.id, `Asset created with ID ${createRes.body.data?.id}`);
    const testAssetId = createRes.body.data?.id;

    // 5. Read Asset by ID
    const getRes = await get(`/api/admin/assets/${testAssetId}`);
    assert(getRes.status === 200 && getRes.body.data?.asset_code === testCode, 'Get asset by ID returned correct record');

    // 6. Update Asset
    const updateRes = await put(`/api/admin/assets/${testAssetId}`, {
      location_name: 'Test Rack B',
      condition: 'excellent'
    });
    assert(updateRes.status === 200 && updateRes.body.status === true, 'Asset updated successfully');

    // 7. Assign Asset to Employee
    const assignRes = await post('/api/admin/assets/assignments', {
      asset_id: testAssetId,
      employee_name: 'Test Engineer',
      department_name: 'R&D',
      assigned_date: '2025-01-10',
      condition_out: 'excellent',
      note: 'Integration test checkout'
    });
    assert(assignRes.status === 201 && assignRes.body.data?.id, `Asset checked out with assignment ID ${assignRes.body.data?.id}`);
    const testAssignmentId = assignRes.body.data?.id;

    // Verify Asset status is 'assigned'
    const afterAssign = await get(`/api/admin/assets/${testAssetId}`);
    assert(afterAssign.body.data?.status === 'assigned', 'Asset status transitioned to "assigned"');

    // 8. Return Asset
    const returnRes = await post('/api/admin/assets/assignments/return', {
      assignment_id: testAssignmentId,
      returned_date: '2025-02-15',
      condition_in: 'good',
      return_note: 'Returned in good operating order'
    });
    assert(returnRes.status === 200 && returnRes.body.status === true, 'Asset returned successfully');

    // Verify Asset status is 'available'
    const afterReturn = await get(`/api/admin/assets/${testAssetId}`);
    assert(afterReturn.body.data?.status === 'available', 'Asset status transitioned back to "available"');

    // 9. Transfer Asset
    const transRes = await post('/api/admin/assets/transfers', {
      asset_id: testAssetId,
      to_location: 'Branch 2 - Data Center',
      to_department: 'Infrastructure',
      reason: 'Server reallocation'
    });
    assert(transRes.status === 201 && transRes.body.data?.reference_no, `Transfer logged: ${transRes.body.data?.reference_no}`);

    // Verify Asset location updated
    const afterTrans = await get(`/api/admin/assets/${testAssetId}`);
    assert(afterTrans.body.data?.location_name === 'Branch 2 - Data Center', 'Asset location updated to destination facility');

    // 10. Schedule Maintenance
    const maintRes = await post('/api/admin/assets/maintenances', {
      asset_id: testAssetId,
      title: 'Annual BIOS & Firmware Patching',
      maintenance_type: 'preventive',
      priority: 'high',
      scheduled_date: '2026-03-01',
      technician: 'Cisco Field Tech',
      cost: 150.00
    });
    assert(maintRes.status === 201 && maintRes.body.data?.reference_no, `Maintenance scheduled: ${maintRes.body.data?.reference_no}`);
    const testMaintId = maintRes.body.data?.id;

    // 11. Complete Maintenance
    const updateMaintRes = await put(`/api/admin/assets/maintenances/${testMaintId}`, {
      status: 'completed',
      cost: 160.00,
      parts_replaced: 'CMOS battery'
    });
    assert(updateMaintRes.status === 200 && updateMaintRes.body.status === true, 'Maintenance work order completed');

    // 12. Depreciation Calculation & Schedule
    const deprRes = await get('/api/admin/assets/depreciation');
    assert(deprRes.status === 200 && deprRes.body.data?.schedule?.length > 0, `Depreciation calculated for ${deprRes.body.data?.schedule?.length} assets`);
    assert(deprRes.body.data?.totals?.total_net_book_value > 0, `Total net book value: $${deprRes.body.data?.totals?.total_net_book_value}`);

    // 13. Run Depreciation Batch
    const runDeprRes = await post('/api/admin/assets/depreciation/run', {
      target_date: '2026-01-01'
    });
    assert(runDeprRes.status === 200 && runDeprRes.body.data?.assets_updated > 0, `Batch depreciation executed for ${runDeprRes.body.data?.assets_updated} assets`);

    // 14. Retire / Dispose Asset
    const dispRes = await post('/api/admin/assets/disposals', {
      asset_id: testAssetId,
      disposal_method: 'sale',
      sale_amount: 1500.00,
      buyer_name: 'Secondary Reseller Corp',
      reason: 'Server upgrade replacement'
    });
    assert(dispRes.status === 201 && dispRes.body.data?.reference_no, `Asset disposed: Ref ${dispRes.body.data?.reference_no}`);

    // Verify Asset status is 'disposed' and current_value is 0
    const afterDisp = await get(`/api/admin/assets/${testAssetId}`);
    assert(afterDisp.body.data?.status === 'disposed' && parseFloat(afterDisp.body.data?.current_value) === 0, 'Asset status is "disposed" with zero remaining book value');

    // 15. Reports Endpoint
    const repCat = await get('/api/admin/assets/reports?type=by_category');
    assert(repCat.status === 200 && repCat.body.data?.data?.length > 0, 'Reports: Category valuation schedule generated');

    const repLoc = await get('/api/admin/assets/reports?type=by_location');
    assert(repLoc.status === 200 && repLoc.body.data?.data?.length > 0, 'Reports: Location distribution generated');

    const repMaint = await get('/api/admin/assets/reports?type=maintenance_costs');
    assert(repMaint.status === 200 && repMaint.body.data?.data?.length > 0, 'Reports: Maintenance expense analysis generated');

    const repDisp = await get('/api/admin/assets/reports?type=disposals');
    assert(repDisp.status === 200 && repDisp.body.data?.data?.length > 0, 'Reports: Disposals and gain/loss log generated');

    // 16. Clean up test asset
    const delAssetRes = await del(`/api/admin/assets/${testAssetId}?force=true`);
    assert(delAssetRes.status === 200 && delAssetRes.body.status === true, 'Test asset hard deleted successfully');

    // 17. Clean up test category
    const delCatRes = await del(`/api/admin/assets/categories/${testCatId}`);
    assert(delCatRes.status === 200 && delCatRes.body.status === true, 'Test category deleted successfully');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
