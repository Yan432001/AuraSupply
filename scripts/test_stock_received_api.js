const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000';

async function testStockReceivedAPI() {
  console.log('Testing Stock Received Backend API...');

  // 1. Meta options
  const metaRes = await axios.get(`${BASE_URL}/api/admin/stock_received/meta/options`);
  console.log('1. Meta options status:', metaRes.status, 'Next Ref:', metaRes.data.data.nextReference);
  console.log('   Warehouses:', metaRes.data.data.warehouses?.length, 'Suppliers:', metaRes.data.data.suppliers?.length);

  // 2. Purchases details for #117
  const poRes = await axios.get(`${BASE_URL}/api/admin/stock_received/purchases/117`);
  console.log('2. PO #117 status:', poRes.status, 'Items:', poRes.data.data.items?.length);

  // 3. Products search
  const prodRes = await axios.get(`${BASE_URL}/api/admin/stock_received/products?warehouse_id=1&term=a`);
  console.log('3. Products search status:', prodRes.status, 'Found:', prodRes.data.data?.length);

  // 4. List stock received
  const listRes = await axios.get(`${BASE_URL}/api/admin/stock_received`);
  console.log('4. List status:', listRes.status, 'Total records:', listRes.data.data.pagination.total);

  // 5. Create test stock received
  const warehouseId = metaRes.data.data.warehouses[0].id;
  const supplierId = metaRes.data.data.suppliers[0].id;
  const testItem = prodRes.data.data[0];

  const payload = {
    date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    warehouse_id: warehouseId,
    supplier_id: supplierId,
    status: 'completed',
    note: 'Automated test stock received note',
    items: [
      {
        product_id: testItem.product_id,
        product_code: testItem.product_code,
        product_name: testItem.product_name,
        product_unit_id: testItem.product_unit_id,
        product_unit_code: testItem.product_unit_code,
        unit_cost: 15,
        quantity: 5,
        quantity_ordered: 5,
        quantity_rejected: 0,
        batch_no: 'BATCH-TEST-001',
        expiry: '2027-12-31'
      }
    ]
  };

  const createRes = await axios.post(`${BASE_URL}/api/admin/stock_received`, payload);
  console.log('5. Create status:', createRes.status, 'Created ID:', createRes.data.data.id, 'Ref:', createRes.data.data.reference_no);
  const createdId = createRes.data.data.id;

  // 6. Get by ID
  const detailRes = await axios.get(`${BASE_URL}/api/admin/stock_received/${createdId}`);
  console.log('6. Detail status:', detailRes.status, 'Ref in record:', detailRes.data.data.re_reference_no, 'Items:', detailRes.data.data.items?.length);

  // 7. Update
  const updatePayload = {
    ...detailRes.data.data,
    note: 'Updated test note',
    items: [
      {
        ...detailRes.data.data.items[0],
        quantity: 8
      }
    ]
  };
  const updateRes = await axios.put(`${BASE_URL}/api/admin/stock_received/${createdId}`, updatePayload);
  console.log('7. Update status:', updateRes.status);

  // 8. Delete / Revert
  const deleteRes = await axios.delete(`${BASE_URL}/api/admin/stock_received/${createdId}`);
  console.log('8. Delete status:', deleteRes.status, 'Deleted:', deleteRes.data.data.deleted);

  console.log('All backend API tests PASSED successfully!');
}

testStockReceivedAPI().catch(err => {
  console.error('API Test Error:', err.response?.data || err.message);
  process.exit(1);
});
