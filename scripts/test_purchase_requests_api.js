const axios = require('axios');
const pool = require('../API/app/config/dbPool');

const BASE_URL = 'http://127.0.0.1:3000/api/admin/purchase_requests';

async function runTests() {
  console.log('--- STARTING PURCHASE REQUESTS API TESTS ---');

  // Test 1: Metadata options
  console.log('\n[1] Testing GET /meta/options...');
  const metaRes = await axios.get(`${BASE_URL}/meta/options`);
  if (!metaRes.data.success || !metaRes.data.data.departments || !metaRes.data.data.warehouses) {
    throw new Error('Meta options failed: ' + JSON.stringify(metaRes.data));
  }
  console.log('✓ Metadata options received:');
  console.log('  Next Ref:', metaRes.data.data.nextReference);
  console.log('  Departments count:', metaRes.data.data.departments.length);
  console.log('  Warehouses count:', metaRes.data.data.warehouses.length);
  console.log('  Suppliers count:', metaRes.data.data.suppliers.length);

  const warehouse = metaRes.data.data.warehouses[0];
  const department = metaRes.data.data.departments[0];
  const supplier = metaRes.data.data.suppliers[0];

  // Test 2: Search products with QOH
  console.log('\n[2] Testing GET /products...');
  const prodRes = await axios.get(`${BASE_URL}/products?warehouse_id=${warehouse.id}&term=Vital`);
  if (!prodRes.data.success || prodRes.data.data.length === 0) {
    throw new Error('Product search failed: ' + JSON.stringify(prodRes.data));
  }
  const sampleProd = prodRes.data.data[0];
  console.log('✓ Search products success, found:', sampleProd.product_name, `(ID: ${sampleProd.product_id}, QOH: ${sampleProd.qoh}, Cost: ${sampleProd.unit_cost})`);

  // Test 3: Create Purchase Request (Pending)
  console.log('\n[3] Testing POST / (Create pending purchase request)...');
  const payload = {
    warehouse_id: warehouse.id,
    department_id: department.id,
    supplier_id: supplier.id,
    purpose: 'Urgent restocking for branch sales event',
    required_date_text: 'Within 7 business days',
    status: 'pending',
    note: 'Automated integration test purchase requisition note',
    items: [
      {
        product_id: sampleProd.product_id,
        product_code: sampleProd.product_code,
        product_name: sampleProd.product_name,
        quantity: 50,
        unit_cost: sampleProd.unit_cost || 0.7,
        product_unit_id: sampleProd.product_unit_id,
        product_unit_code: sampleProd.product_unit_code,
        qoh: sampleProd.qoh,
        description: 'Quality inspected unit batch'
      }
    ]
  };

  const createRes = await axios.post(`${BASE_URL}`, payload);
  if (!createRes.data.success || !createRes.data.data.id) {
    throw new Error('Create purchase request failed: ' + JSON.stringify(createRes.data));
  }
  const prId = createRes.data.data.id;
  const refNo = createRes.data.data.reference_no;
  console.log(`✓ Purchase request created successfully! ID: ${prId}, Ref: ${refNo}`);

  // Test 4: Get by ID
  console.log('\n[4] Testing GET /:id...');
  const detailRes = await axios.get(`${BASE_URL}/${prId}`);
  if (!detailRes.data.success || !detailRes.data.data.items || detailRes.data.data.items.length === 0) {
    throw new Error('Get request details failed: ' + JSON.stringify(detailRes.data));
  }
  console.log('✓ Purchase request retrieved:');
  console.log('  Department:', detailRes.data.data.department_name);
  console.log('  Warehouse:', detailRes.data.data.warehouse_name);
  console.log('  Status:', detailRes.data.data.status);
  console.log('  Items Count:', detailRes.data.data.items.length);
  console.log('  Total Qty:', detailRes.data.data.total_qty);

  // Test 5: List with Filters and Metrics
  console.log('\n[5] Testing GET / (List & Metrics)...');
  const listRes = await axios.get(`${BASE_URL}?search=${refNo}`);
  if (!listRes.data.success || listRes.data.data.data.length === 0) {
    throw new Error('List failed: ' + JSON.stringify(listRes.data));
  }
  console.log('✓ Found request in list, Total in database:', listRes.data.data.pagination.total);
  console.log('  Metrics:', listRes.data.data.metrics);

  // Test 6: Approve Purchase Request
  console.log('\n[6] Testing POST /:id/approve...');
  const approveRes = await axios.post(`${BASE_URL}/${prId}/approve`);
  if (!approveRes.data.success || approveRes.data.data.status !== 'approved') {
    throw new Error('Approve failed: ' + JSON.stringify(approveRes.data));
  }
  const [checkApproved] = await pool.query('SELECT status, approved_by, approved_date FROM aura_purchases_request WHERE id = ?', [prId]);
  console.log(`✓ Request approved! Status in DB: ${checkApproved[0].status}, Approved Date: ${checkApproved[0].approved_date}`);

  // Test 7: Unapprove (Revert to Pending)
  console.log('\n[7] Testing POST /:id/unapprove...');
  const unapproveRes = await axios.post(`${BASE_URL}/${prId}/unapprove`);
  if (!unapproveRes.data.success || unapproveRes.data.data.status !== 'pending') {
    throw new Error('Unapprove failed: ' + JSON.stringify(unapproveRes.data));
  }
  const [checkPending] = await pool.query('SELECT status, approved_by FROM aura_purchases_request WHERE id = ?', [prId]);
  console.log(`✓ Request unapproved! Status in DB: ${checkPending[0].status}, Approved By: ${checkPending[0].approved_by}`);

  // Test 8: Reject Purchase Request
  console.log('\n[8] Testing POST /:id/reject...');
  const rejectRes = await axios.post(`${BASE_URL}/${prId}/reject`, { reason: 'Budget exceeded for Q4' });
  if (!rejectRes.data.success || rejectRes.data.data.status !== 'rejected') {
    throw new Error('Reject failed: ' + JSON.stringify(rejectRes.data));
  }
  const [checkRejected] = await pool.query('SELECT status, rejected_by, rejected_date, note FROM aura_purchases_request WHERE id = ?', [prId]);
  console.log(`✓ Request rejected! Status in DB: ${checkRejected[0].status}, Note: ${checkRejected[0].note}`);

  // Test 9: Update Purchase Request
  console.log('\n[9] Testing PUT /:id (Update note and requested items)...');
  const updateRes = await axios.put(`${BASE_URL}/${prId}`, {
    ...payload,
    purpose: 'Revised purpose: essential stock for next month',
    status: 'pending',
    items: [
      {
        product_id: sampleProd.product_id,
        product_code: sampleProd.product_code,
        product_name: sampleProd.product_name,
        quantity: 25, // Changed from 50 to 25
        unit_cost: sampleProd.unit_cost || 0.7,
        product_unit_id: sampleProd.product_unit_id,
        product_unit_code: sampleProd.product_unit_code,
        qoh: sampleProd.qoh,
      }
    ]
  });
  if (!updateRes.data.success) {
    throw new Error('Update failed: ' + JSON.stringify(updateRes.data));
  }
  const [checkUpdated] = await pool.query('SELECT total_qty, purpose FROM aura_purchases_request WHERE id = ?', [prId]);
  console.log(`✓ Request updated! New Total Qty: ${checkUpdated[0].total_qty}, Purpose: ${checkUpdated[0].purpose}`);

  // Test 10: Delete Purchase Request
  console.log('\n[10] Testing DELETE /:id...');
  const deleteRes = await axios.delete(`${BASE_URL}/${prId}`);
  if (!deleteRes.data.success) {
    throw new Error('Delete failed: ' + JSON.stringify(deleteRes.data));
  }
  const [checkDeleted] = await pool.query('SELECT id FROM aura_purchases_request WHERE id = ?', [prId]);
  const [checkItemsDeleted] = await pool.query('SELECT id FROM aura_purchase_request_items WHERE purchase_id = ?', [prId]);
  console.log(`✓ Request deleted! Remaining in DB: ${checkDeleted.length}, Items remaining: ${checkItemsDeleted.length}`);

  console.log('\n========================================================');
  console.log('🎉 ALL PURCHASE REQUESTS BACKEND TESTS PASSED CLEANLY! 🎉');
  console.log('========================================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ PURCHASE REQUESTS TEST FAILED:', err.response?.data || err.message || err);
  process.exit(1);
});
