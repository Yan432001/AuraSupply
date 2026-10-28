const axios = require('axios');
const { pool } = require('../API/app/config/dbPool');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING PURCHASE ORDERS BACKEND API TESTS ===\n');
  let createdPoId = null;
  let testProduct = null;
  let initialQoh = 0;

  try {
    // 1. Test Metadata Options
    console.log('Test 1: GET /api/admin/purchase_orders/meta/options');
    const metaRes = await axios.get(`${BASE_URL}/api/admin/purchase_orders/meta/options`);
    if (!metaRes.data?.success) throw new Error('Failed to get metadata options');
    console.log('  -> Success! Next Ref:', metaRes.data.data.nextReference);
    console.log('  -> Warehouses count:', metaRes.data.data.warehouses?.length);
    console.log('  -> Suppliers count:', metaRes.data.data.suppliers?.length);
    console.log('  -> Approved PRs ready for PO:', metaRes.data.data.approvedPurchaseRequests?.length);

    const warehouseId = metaRes.data.data.warehouses[0]?.id || 1;
    const supplierId = metaRes.data.data.suppliers[0]?.id || 1;

    // 2. Test Product Search
    console.log('\nTest 2: GET /api/admin/purchase_orders/products');
    const prodRes = await axios.get(`${BASE_URL}/api/admin/purchase_orders/products`, {
      params: { warehouse_id: warehouseId, term: '', limit: 5 }
    });
    if (!prodRes.data?.success || prodRes.data.data.length === 0) {
      throw new Error('Failed to search products or no products found');
    }
    testProduct = prodRes.data.data[0];
    const prodId = testProduct.id || testProduct.product_id;
    const prodCode = testProduct.code || testProduct.product_code;
    const prodName = testProduct.name || testProduct.product_name;
    const prodCost = parseFloat(testProduct.cost || testProduct.unit_cost || 10);
    initialQoh = parseFloat(testProduct.qoh || 0);
    console.log(`  -> Found product: [${prodCode}] ${prodName} (ID: ${prodId}), QOH: ${initialQoh}, Cost: ${prodCost}`);

    // Check actual DB stock of this product before PO creation
    const [dbStockBefore] = await pool.query(
      'SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ?',
      [prodId, warehouseId]
    );
    const dbQtyBefore = dbStockBefore[0]?.quantity !== undefined ? parseFloat(dbStockBefore[0].quantity) : 0;
    console.log(`  -> Confirmed DB Stock in warehouse ${warehouseId} before PO: ${dbQtyBefore}`);

    // 3. Test Approved Purchase Requests
    console.log('\nTest 3: GET /api/admin/purchase_orders/purchase_requests');
    const prRes = await axios.get(`${BASE_URL}/api/admin/purchase_orders/purchase_requests`);
    console.log('  -> Approved PRs available:', prRes.data?.data?.length || 0);

    // 4. Test Create Standalone Purchase Order
    console.log('\nTest 4: POST /api/admin/purchase_orders (Create Standalone)');
    const createPayload = {
      date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      warehouse_id: warehouseId,
      supplier_id: supplierId,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      payment_term: 30,
      note: 'Automated test purchase order - verification of stock isolation',
      shipping: 15.00,
      order_discount: 5.00,
      order_tax: 2.50,
      items: [
        {
          product_id: prodId,
          product_code: prodCode,
          product_name: prodName,
          quantity: 10,
          unit_cost: prodCost,
          product_unit_id: testProduct.product_unit_id || testProduct.unit_id || null,
          product_unit_code: testProduct.product_unit_code || 'Unit',
          discount: '0',
          item_discount: 0,
          item_tax: 0,
          qoh: initialQoh,
          remarks: 'Line item 1 for testing'
        }
      ]
    };

    const createRes = await axios.post(`${BASE_URL}/api/admin/purchase_orders`, createPayload);
    if (!createRes.data?.success) throw new Error('Create PO failed');
    createdPoId = createRes.data.data.id;
    console.log(`  -> Created PO #${createdPoId}, Ref: ${createRes.data.data.reference_no}, Grand Total: ${createRes.data.data.grand_total}`);

    // 5. CRUCIAL CHECK: Verify stock DID NOT CHANGE after PO creation
    const [dbStockAfterCreate] = await pool.query(
      'SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ?',
      [prodId, warehouseId]
    );
    const dbQtyAfterCreate = dbStockAfterCreate[0]?.quantity !== undefined ? parseFloat(dbStockAfterCreate[0].quantity) : 0;
    if (dbQtyAfterCreate !== dbQtyBefore) {
      throw new Error(`CRITICAL VIOLATION: Stock changed from ${dbQtyBefore} to ${dbQtyAfterCreate} after PO creation!`);
    }
    console.log(`  -> Stock verified unchanged after PO creation: ${dbQtyAfterCreate} == ${dbQtyBefore} (CORRECT: PO does NOT increase stock)`);

    // 6. Test GET Purchase Order by ID
    console.log(`\nTest 5: GET /api/admin/purchase_orders/${createdPoId}`);
    const getRes = await axios.get(`${BASE_URL}/api/admin/purchase_orders/${createdPoId}`);
    if (!getRes.data?.success) throw new Error('Failed to get PO by ID');
    const poData = getRes.data.data;
    console.log(`  -> Retrieved PO #${poData.id}, Status: ${poData.status}, Supplier: ${poData.supplier_company || poData.supplier}, Items: ${poData.items?.length}`);

    // 7. Test Update Purchase Order
    console.log(`\nTest 6: PUT /api/admin/purchase_orders/${createdPoId}`);
    const updatePayload = {
      ...createPayload,
      note: 'Updated automated test purchase order',
      shipping: 20.00,
      items: [
        {
          product_id: prodId,
          product_code: prodCode,
          product_name: prodName,
          quantity: 12,
          unit_cost: prodCost,
          product_unit_id: testProduct.product_unit_id || testProduct.unit_id || null,
          product_unit_code: testProduct.product_unit_code || 'Unit',
          discount: '0',
          item_discount: 0,
          item_tax: 0,
          qoh: initialQoh,
          remarks: 'Updated line item quantity to 12'
        }
      ]
    };
    const updateRes = await axios.put(`${BASE_URL}/api/admin/purchase_orders/${createdPoId}`, updatePayload);
    if (!updateRes.data?.success) throw new Error('Failed to update PO');
    console.log(`  -> Updated successfully! New total qty: ${updateRes.data.data.total_qty}, Grand Total: ${updateRes.data.data.grand_total}`);

    // 8. Test Approve Purchase Order
    console.log(`\nTest 7: POST /api/admin/purchase_orders/${createdPoId}/approve`);
    const approveRes = await axios.post(`${BASE_URL}/api/admin/purchase_orders/${createdPoId}/approve`);
    if (!approveRes.data?.success) throw new Error('Failed to approve PO');
    console.log('  -> PO approved successfully!');

    // CRUCIAL CHECK: Verify stock DID NOT CHANGE after PO approval
    const [dbStockAfterApprove] = await pool.query(
      'SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ?',
      [prodId, warehouseId]
    );
    const dbQtyAfterApprove = dbStockAfterApprove[0]?.quantity !== undefined ? parseFloat(dbStockAfterApprove[0].quantity) : 0;
    if (dbQtyAfterApprove !== dbQtyBefore) {
      throw new Error(`CRITICAL VIOLATION: Stock changed from ${dbQtyBefore} to ${dbQtyAfterApprove} after PO approval!`);
    }
    console.log(`  -> Stock verified unchanged after PO approval: ${dbQtyAfterApprove} == ${dbQtyBefore} (CORRECT: PO approval does NOT increase stock)`);

    // 9. Test Unapprove Purchase Order
    console.log(`\nTest 8: POST /api/admin/purchase_orders/${createdPoId}/unapprove`);
    const unapproveRes = await axios.post(`${BASE_URL}/api/admin/purchase_orders/${createdPoId}/unapprove`);
    if (!unapproveRes.data?.success) throw new Error('Failed to unapprove PO');
    console.log('  -> PO unapproved (reverted to pending) successfully!');

    // 10. Test Reject Purchase Order
    console.log(`\nTest 9: POST /api/admin/purchase_orders/${createdPoId}/reject`);
    const rejectRes = await axios.post(`${BASE_URL}/api/admin/purchase_orders/${createdPoId}/reject`, {
      reason: 'Rejected during automated verification test'
    });
    if (!rejectRes.data?.success) throw new Error('Failed to reject PO');
    console.log('  -> PO rejected with reason successfully!');

    // 11. Test List Purchase Orders with pagination & KPIs
    console.log('\nTest 10: GET /api/admin/purchase_orders (List & KPIs)');
    const listRes = await axios.get(`${BASE_URL}/api/admin/purchase_orders`, {
      params: { page: 1, limit: 10, search: 'automated' }
    });
    if (!listRes.data?.success) throw new Error('Failed to list POs');
    console.log(`  -> List count for search 'automated': ${listRes.data.data.data?.length}`);
    console.log('  -> KPIs:', listRes.data.data.kpis);

    // 12. Test Delete Purchase Order
    console.log(`\nTest 11: DELETE /api/admin/purchase_orders/${createdPoId}`);
    const deleteRes = await axios.delete(`${BASE_URL}/api/admin/purchase_orders/${createdPoId}`);
    if (!deleteRes.data?.success) throw new Error('Failed to delete PO');
    console.log('  -> PO deleted successfully!');

    // Final stock check
    const [dbStockFinal] = await pool.query(
      'SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ?',
      [prodId, warehouseId]
    );
    const dbQtyFinal = dbStockFinal[0]?.quantity !== undefined ? parseFloat(dbStockFinal[0].quantity) : 0;
    console.log(`  -> Final stock check: ${dbQtyFinal} == ${dbQtyBefore}`);

    console.log('\n====================================================');
    console.log('🎉 ALL 11 PURCHASE ORDERS BACKEND TESTS PASSED!');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.response?.data || err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runTests();
