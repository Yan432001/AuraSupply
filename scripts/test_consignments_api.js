const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';

async function testConsignmentsAPI() {
  console.log('Testing Consignments Backend API...');

  // 1. Meta options
  const metaRes = await axios.get(`${BASE_URL}/api/admin/consignments/meta/options`);
  console.log('1. Meta options status:', metaRes.status, 'Next Ref:', metaRes.data.data.nextReference);
  console.log('   Warehouses:', metaRes.data.data.warehouses?.length, 'Customers:', metaRes.data.data.customers?.length);

  // 2. Products search
  const warehouseId = metaRes.data.data.warehouses[0].id;
  const customerId = metaRes.data.data.customers[0].id;

  const prodRes = await axios.get(`${BASE_URL}/api/admin/consignments/products?warehouse_id=${warehouseId}&term=a`);
  console.log('2. Products search status:', prodRes.status, 'Found:', prodRes.data.data?.length);

  const testProduct = prodRes.data.data.find(p => parseFloat(p.current_warehouse_stock) >= 5) || prodRes.data.data[0];
  console.log('   Selected test product:', testProduct.product_name, 'Stock:', testProduct.current_warehouse_stock);

  // 3. List
  const listRes = await axios.get(`${BASE_URL}/api/admin/consignments`);
  console.log('3. List status:', listRes.status, 'Total records:', listRes.data.data.pagination.total);

  // 4. Create Consignment
  const payload = {
    date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    warehouse_id: warehouseId,
    customer_id: customerId,
    destination: 'Branch Consignee Store #1',
    valid_day: 30,
    status: 'dispatched',
    note: 'Automated test consignment dispatch',
    items: [
      {
        product_id: testProduct.product_id,
        product_code: testProduct.product_code,
        product_name: testProduct.product_name,
        product_unit_id: testProduct.product_unit_id,
        product_unit_code: testProduct.product_unit_code,
        unit_price: 25,
        unit_cost: 15,
        quantity: 3,
        batch_no: 'CSM-BATCH-001',
        expiry: '2027-12-31'
      }
    ]
  };

  const createRes = await axios.post(`${BASE_URL}/api/admin/consignments`, payload);
  console.log('4. Create status:', createRes.status, 'Created ID:', createRes.data.data.id, 'Ref:', createRes.data.data.reference_no);
  const createdId = createRes.data.data.id;

  // 5. Get by ID
  const detailRes = await axios.get(`${BASE_URL}/api/admin/consignments/${createdId}`);
  console.log('5. Detail status:', detailRes.status, 'Customer:', detailRes.data.data.customer, 'Items count:', detailRes.data.data.items?.length);
  const consignmentItemId = detailRes.data.data.items[0].id;

  // 6. Update
  const updatePayload = {
    ...detailRes.data.data,
    note: 'Updated consignment note',
    items: [
      {
        ...detailRes.data.data.items[0],
        quantity: 2
      }
    ]
  };
  const updateRes = await axios.put(`${BASE_URL}/api/admin/consignments/${createdId}`, updatePayload);
  console.log('6. Update status:', updateRes.status);

  // 7. Record partial sales
  const salesPayload = {
    items: [
      {
        consignment_item_id: consignmentItemId,
        sale_quantity: 1
      }
    ]
  };
  const salesRes = await axios.post(`${BASE_URL}/api/admin/consignments/${createdId}/sales`, salesPayload);
  console.log('7. Sales record status:', salesRes.status);

  // 8. Record return
  const returnPayload = {
    date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    note: 'Customer returned 1 unsold unit',
    items: [
      {
        consignment_item_id: consignmentItemId,
        return_quantity: 1
      }
    ]
  };
  const returnRes = await axios.post(`${BASE_URL}/api/admin/consignments/${createdId}/returns`, returnPayload);
  console.log('8. Return record status:', returnRes.status, 'Return ID:', returnRes.data.data.return_id);

  // Verify status after full reconciliation
  const afterReconcile = await axios.get(`${BASE_URL}/api/admin/consignments/${createdId}`);
  console.log('   Status after sales (1) and return (1) of total 2:', afterReconcile.data.data.status);

  // 9. Delete
  const deleteRes = await axios.delete(`${BASE_URL}/api/admin/consignments/${createdId}`);
  console.log('9. Delete status:', deleteRes.status, 'Deleted:', deleteRes.data.data.deleted);

  console.log('All Consignments backend API tests PASSED successfully!');
}

testConsignmentsAPI().catch(err => {
  console.error('API Test Error:', err.response?.data || err.message);
  process.exit(1);
});
