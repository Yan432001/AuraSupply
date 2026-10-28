const axios = require('axios');
const { pool } = require('../API/app/config/dbPool');

const BASE_URL = 'http://localhost:3000';

async function runSuspendTests() {
  console.log('=== STARTING POS SUSPEND / HOLD BILL SUITE ===\n');

  try {
    // 1. Create a held bill
    console.log('Test 1: POST /api/admin/pos/suspend (Create new held bill)');
    const createRes = await axios.post(`${BASE_URL}/api/admin/pos/suspend`, {
      customer_id: 2,
      customer: 'Walk-in Customer',
      table_id: 1,
      table_name: 'Table T1',
      sub_bill_name: 'Group A',
      suspend_note: 'Table T1 (Group A)',
      items: [
        {
          id: 227,
          code: 'PRD-CLO-04',
          name: '13.5oz Japanese Selvedge Raw Denim Jeans',
          quantity: 2,
          unit_price: 35.50,
          price: 35.50,
          unit_code: 'pcs'
        },
        {
          id: 228,
          code: 'PRD-SNK-01',
          name: 'Classic White Leather Sneakers',
          quantity: 1,
          unit_price: 60.00,
          price: 60.00,
          unit_code: 'pair'
        }
      ],
      total: 131.00,
      biller_id: 1,
      warehouse_id: 1,
      user_id: 1,
    });

    if (!createRes.data?.success) throw new Error('Failed to suspend bill');
    const suspendId = createRes.data.suspend_id;
    console.log(`  -> Success! Suspend ID: ${suspendId}, Ref: ${createRes.data.reference}`);

    // Verify database record
    const [dbBill] = await pool.query('SELECT * FROM aura_suspended_bills WHERE id = ?', [suspendId]);
    console.log('  -> DB Bill:', {
      id: dbBill[0]?.id,
      customer: dbBill[0]?.customer,
      count: dbBill[0]?.count,
      total: dbBill[0]?.total,
      bill_status: dbBill[0]?.bill_status
    });

    const [dbItems] = await pool.query('SELECT * FROM aura_suspended_items WHERE suspend_id = ?', [suspendId]);
    console.log(`  -> DB Items count: ${dbItems.length}`);
    for (const item of dbItems) {
      console.log(`     - [${item.product_code}] ${item.product_name}: Qty ${item.quantity} x $${item.unit_price} = $${item.subtotal}`);
    }

    // 2. Fetch suspended bills list
    console.log('\nTest 2: GET /api/admin/pos/suspended');
    const listRes = await axios.get(`${BASE_URL}/api/admin/pos/suspended`);
    if (!listRes.data?.success) throw new Error('Failed to get suspended bills');
    console.log(`  -> Suspended bills count: ${listRes.data.data?.length}`);
    const found = (listRes.data.data || []).find(b => b.id === suspendId);
    if (!found) throw new Error(`Created bill #${suspendId} not found in suspended bills list!`);
    console.log(`  -> Found created bill in list: #${found.id} - ${found.customer} - $${found.total}`);

    // 3. Update existing suspended bill (e.g. add more items to existing table bill)
    console.log(`\nTest 3: POST /api/admin/pos/suspend (Update existing bill #${suspendId})`);
    const updateRes = await axios.post(`${BASE_URL}/api/admin/pos/suspend`, {
      suspended_bill_id: suspendId,
      customer_id: 2,
      customer: 'Walk-in Customer (VIP)',
      table_id: 1,
      table_name: 'Table T1',
      sub_bill_name: 'Group A',
      suspend_note: 'Table T1 (Group A)',
      items: [
        {
          id: 227,
          code: 'PRD-CLO-04',
          name: '13.5oz Japanese Selvedge Raw Denim Jeans',
          quantity: 3,
          unit_price: 35.50,
          price: 35.50,
          unit_code: 'pcs'
        }
      ],
      total: 106.50,
      biller_id: 1,
      warehouse_id: 1,
      user_id: 1,
    });
    if (!updateRes.data?.success) throw new Error('Failed to update suspended bill');
    console.log('  -> Updated successfully!');

    const [dbItemsUpdated] = await pool.query('SELECT * FROM aura_suspended_items WHERE suspend_id = ?', [suspendId]);
    console.log(`  -> DB Items count after update: ${dbItemsUpdated.length}, total: ${dbItemsUpdated[0]?.subtotal}`);

    // 4. Delete / release suspended bill
    console.log(`\nTest 4: DELETE /api/admin/pos/suspended/${suspendId}`);
    const delRes = await axios.delete(`${BASE_URL}/api/admin/pos/suspended/${suspendId}`);
    if (!delRes.data?.success) throw new Error('Failed to delete suspended bill');
    console.log('  -> Deleted successfully!');

    // Verify deletion
    const [dbCheck] = await pool.query('SELECT COUNT(*) as c FROM aura_suspended_bills WHERE id = ?', [suspendId]);
    console.log(`  -> Verification count in DB: ${dbCheck[0]?.c} (Expected: 0)`);

    console.log('\n====================================================');
    console.log('🎉 ALL POS SUSPEND / HOLD TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.response?.data || err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runSuspendTests();
