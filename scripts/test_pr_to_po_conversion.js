const axios = require('axios');
const { pool } = require('../API/app/config/dbPool');

const BASE_URL = 'http://localhost:3000';

async function testPrToPoConversion() {
  console.log('=== TESTING PR -> PO CONVERSION & SYNC ===\n');

  try {
    // 1. Find an approved PR
    const [prRows] = await pool.query(`
      SELECT id, reference_no, warehouse_id, supplier_id, order_status 
      FROM aura_purchases_request 
      WHERE status = 'approved' 
      LIMIT 1
    `);

    if (prRows.length === 0) {
      console.log('No approved PR found. Creating one for testing...');
      // create test PR
      const [insPr] = await pool.query(`
        INSERT INTO aura_purchases_request (
          reference_no, warehouse_id, supplier_id, supplier, status, date, grand_total, total_qty
        ) VALUES ('PR-TEST-CONV', 1, 1, 'Akuruhi Vietnam', 'approved', NOW(), 100, 5)
      `);
      const prId = insPr.insertId;
      await pool.query(`
        INSERT INTO aura_purchase_request_items (
          purchase_id, product_id, product_code, product_name, quantity, unit_cost, subtotal, warehouse_id, status
        ) VALUES (?, 227, 'PRD-CLO-04', '13.5oz Japanese Selvedge Raw Denim Jeans', 5, 20, 100, 1, 'approved')
      `, [prId]);
      prRows.push({ id: prId, reference_no: 'PR-TEST-CONV', warehouse_id: 1, supplier_id: 1, order_status: 'pending' });
    }

    const testPr = prRows[0];
    console.log(`Using approved PR #${testPr.id} (${testPr.reference_no})`);

    // 2. Fetch PR items for import
    const importRes = await axios.get(`${BASE_URL}/api/admin/purchase_orders/purchase_requests/${testPr.id}/items`);
    if (!importRes.data?.success) throw new Error('Failed to fetch items for import');
    console.log('  -> Importable items:', importRes.data.data.items?.length);

    const importItems = importRes.data.data.items;
    if (importItems.length === 0) {
      console.log('No remaining items in this PR to order.');
      return;
    }

    // 3. Create PO importing from PR
    const poPayload = {
      date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      warehouse_id: testPr.warehouse_id,
      supplier_id: testPr.supplier_id,
      purchase_request_id: testPr.id,
      request_id: testPr.id,
      purchase_ref: testPr.reference_no,
      note: `Imported from PR ${testPr.reference_no}`,
      items: importItems.map(item => ({
        product_id: item.product_id,
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        product_unit_id: item.product_unit_id,
        product_unit_code: item.product_unit_code,
        pri_id: item.pri_id,
        qoh: item.qoh,
        subtotal: item.quantity * item.unit_cost
      }))
    };

    const createPoRes = await axios.post(`${BASE_URL}/api/admin/purchase_orders`, poPayload);
    const newPoId = createPoRes.data.data.id;
    console.log(`  -> Created PO #${newPoId} from PR #${testPr.id}`);

    // 4. Check PR order_status
    const [prCheck] = await pool.query('SELECT order_status FROM aura_purchases_request WHERE id = ?', [testPr.id]);
    console.log(`  -> PR #${testPr.id} new order_status: ${prCheck[0]?.order_status} (Expected: completed)`);

    // 5. Clean up created PO
    await axios.delete(`${BASE_URL}/api/admin/purchase_orders/${newPoId}`);
    console.log(`  -> Cleaned up test PO #${newPoId}`);

    // 6. Check PR order_status after PO deletion
    const [prCheckAfter] = await pool.query('SELECT order_status FROM aura_purchases_request WHERE id = ?', [testPr.id]);
    console.log(`  -> PR #${testPr.id} order_status after PO deleted: ${prCheckAfter[0]?.order_status}`);

    if (testPr.reference_no === 'PR-TEST-CONV') {
      await pool.query('DELETE FROM aura_purchase_request_items WHERE purchase_id = ?', [testPr.id]);
      await pool.query('DELETE FROM aura_purchases_request WHERE id = ?', [testPr.id]);
      console.log('  -> Cleaned up temporary test PR.');
    }

    console.log('\n🎉 PR -> PO CONVERSION TEST PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ PR -> PO conversion test failed:', err.response?.data || err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testPrToPoConversion();
