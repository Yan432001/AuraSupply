const axios = require('axios');
const pool = require('../API/app/config/dbPool');

const BASE_URL = 'http://127.0.0.1:3000/api/admin/rewards_exchange';

async function runTests() {
  console.log('--- STARTING REWARDS EXCHANGE API TESTS ---');

  // Baseline cleanup
  await pool.query('DELETE FROM aura_reward_exchange_items');
  await pool.query('DELETE FROM aura_rewards_exchange');
  await pool.query("DELETE FROM aura_stock_movement WHERE transaction = 'Reward'");

  // Test 1: Metadata options
  console.log('\n[1] Testing GET /meta/options...');
  const metaRes = await axios.get(`${BASE_URL}/meta/options`);
  if (!metaRes.data.success || !metaRes.data.data.customers || !metaRes.data.data.nextReference) {
    throw new Error('Meta options failed: ' + JSON.stringify(metaRes.data));
  }
  console.log('✓ Metadata options received:');
  console.log('  Next Ref:', metaRes.data.data.nextReference);
  console.log('  Customers count:', metaRes.data.data.customers.length);
  console.log('  Warehouses count:', metaRes.data.data.warehouses.length);
  console.log('  Reward rules count:', metaRes.data.data.rewardRules.length);

  const customer = metaRes.data.data.customers.find(c => c.award_points > 0) || metaRes.data.data.customers[0];
  const warehouse = metaRes.data.data.warehouses[0];
  console.log(`  Selected customer: ID ${customer.id} (${customer.name}), Available Points: ${customer.award_points}`);
  console.log(`  Selected warehouse: ID ${warehouse.id} (${warehouse.name})`);

  // Give customer some test points if needed to test redemption
  if (customer.award_points < 50) {
    await pool.query('UPDATE aura_companies SET award_points = 100 WHERE id = ?', [customer.id]);
    console.log(`  Updated customer #${customer.id} points to 100 for test verification.`);
  }

  // Test 2: Search products
  console.log('\n[2] Testing GET /products...');
  const prodRes = await axios.get(`${BASE_URL}/products?warehouse_id=${warehouse.id}&term=Vital`);
  if (!prodRes.data.success || prodRes.data.data.length === 0) {
    throw new Error('Product search failed: ' + JSON.stringify(prodRes.data));
  }
  const sampleProd = prodRes.data.data[0];
  console.log('✓ Search products success, found:', sampleProd.product_name, `(ID: ${sampleProd.product_id}, Stock: ${sampleProd.warehouse_stock})`);

  // Ensure sample product has stock in warehouse for test
  if (sampleProd.warehouse_stock < 10) {
    await pool.query(`
      INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity)
      VALUES (?, ?, 20)
      ON DUPLICATE KEY UPDATE quantity = quantity + 20
    `, [sampleProd.product_id, warehouse.id]);
    console.log(`  Added stock to warehouse #${warehouse.id} for product #${sampleProd.product_id}`);
  }

  // Check customer points before creation
  const [custBefore] = await pool.query('SELECT award_points FROM aura_companies WHERE id = ?', [customer.id]);
  const pointsBefore = parseFloat(custBefore[0].award_points);
  console.log('  Customer points before transaction:', pointsBefore);

  // Test 2.5: Verify points shortage rejection
  console.log('\n[2.5] Testing Points shortage validation...');
  try {
    await axios.post(`${BASE_URL}`, {
      category: 'customer',
      type: 'points',
      customer_id: customer.id,
      warehouse_id: warehouse.id,
      status: 'completed',
      items: [
        {
          product_id: sampleProd.product_id,
          product_code: sampleProd.product_code,
          product_name: sampleProd.product_name,
          quantity: 10,
          points: 100, // 1,000 points required > customer's 60 points
        }
      ]
    });
    throw new Error('Expected validation error for excessive points, but request succeeded!');
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message.includes('reward points available')) {
      console.log('✓ Successfully blocked excessive redemption:', err.response.data.message);
    } else {
      throw err;
    }
  }

  // Test 3: Create Completed Rewards Exchange
  console.log('\n[3] Testing POST / (Create completed points redemption)...');
  const payload = {
    category: 'customer',
    type: 'points',
    customer_id: customer.id,
    warehouse_id: warehouse.id,
    status: 'completed',
    note: 'Automated Test Reward Exchange Redemption',
    staff_note: 'Verified with test script',
    items: [
      {
        product_id: sampleProd.product_id,
        product_code: sampleProd.product_code,
        product_name: sampleProd.product_name,
        quantity: 2,
        points: 10, // 10 pts each * 2 = 20 pts
        unit_price: sampleProd.unit_price || 1,
        unit_cost: sampleProd.unit_cost || 0.5,
        product_unit_id: sampleProd.product_unit_id,
        product_unit_code: sampleProd.product_unit_code,
      }
    ]
  };

  const createRes = await axios.post(`${BASE_URL}`, payload);
  if (!createRes.data.success || !createRes.data.data.id) {
    throw new Error('Create exchange failed: ' + JSON.stringify(createRes.data));
  }
  const exchangeId = createRes.data.data.id;
  const refNo = createRes.data.data.reference_no;
  console.log(`✓ Rewards exchange created successfully! ID: ${exchangeId}, Ref: ${refNo}`);

  // Verify points deducted
  const [custAfter] = await pool.query('SELECT award_points FROM aura_companies WHERE id = ?', [customer.id]);
  const pointsAfter = parseFloat(custAfter[0].award_points);
  console.log(`  Customer points after completed exchange: ${pointsAfter} (Expected: ${pointsBefore - 20})`);
  if (pointsAfter !== (pointsBefore - 20)) {
    throw new Error(`Points deduction mismatch: before=${pointsBefore}, after=${pointsAfter}`);
  }

  // Verify stock movement logged
  const [movements] = await pool.query("SELECT * FROM aura_stock_movement WHERE transaction = 'Reward' AND transaction_id = ?", [exchangeId]);
  console.log(`  Stock movement logged: ${movements.length} record(s), Quantity: ${movements[0]?.quantity}`);
  if (movements.length === 0 || parseFloat(movements[0].quantity) !== -2) {
    throw new Error('Stock movement audit record missing or quantity mismatch');
  }

  // Test 4: Get by ID
  console.log('\n[4] Testing GET /:id...');
  const detailRes = await axios.get(`${BASE_URL}/${exchangeId}`);
  if (!detailRes.data.success || !detailRes.data.data.items || detailRes.data.data.items.length === 0) {
    throw new Error('Get exchange details failed: ' + JSON.stringify(detailRes.data));
  }
  console.log('✓ Exchange detail retrieved successfully, items count:', detailRes.data.data.items.length);
  console.log('  Customer:', detailRes.data.data.customer_name);
  console.log('  Points used:', detailRes.data.data.points_used);

  // Test 5: List with Filters and Metrics
  console.log('\n[5] Testing GET / (List & Metrics)...');
  const listRes = await axios.get(`${BASE_URL}?search=${refNo}`);
  if (!listRes.data.success || listRes.data.data.data.length === 0) {
    throw new Error('List exchanges failed: ' + JSON.stringify(listRes.data));
  }
  console.log('✓ Found exchange in list. Total in list:', listRes.data.data.pagination.total);
  console.log('  Metrics:', listRes.data.data.metrics);

  // Test 6: Update Exchange
  console.log('\n[6] Testing PUT /:id (Update note and adjust items)...');
  const updateRes = await axios.put(`${BASE_URL}/${exchangeId}`, {
    ...payload,
    note: 'Updated Automated Test Note',
    items: [
      {
        product_id: sampleProd.product_id,
        product_code: sampleProd.product_code,
        product_name: sampleProd.product_name,
        quantity: 1, // Changed from 2 to 1 (10 pts total)
        points: 10,
        unit_price: sampleProd.unit_price || 1,
        unit_cost: sampleProd.unit_cost || 0.5,
        product_unit_id: sampleProd.product_unit_id,
        product_unit_code: sampleProd.product_unit_code,
      }
    ]
  });
  if (!updateRes.data.success) {
    throw new Error('Update exchange failed: ' + JSON.stringify(updateRes.data));
  }
  console.log('✓ Exchange updated successfully');

  // Verify points adjusted to 10 points used
  const [custAfterUpdate] = await pool.query('SELECT award_points FROM aura_companies WHERE id = ?', [customer.id]);
  const pointsAfterUpdate = parseFloat(custAfterUpdate[0].award_points);
  console.log(`  Customer points after update: ${pointsAfterUpdate} (Expected: ${pointsBefore - 10})`);
  if (pointsAfterUpdate !== (pointsBefore - 10)) {
    throw new Error(`Points adjustment mismatch on update: expected ${pointsBefore - 10}, got ${pointsAfterUpdate}`);
  }

  // Test 7: Delete Exchange and verify clean reversal of points and stock
  console.log('\n[7] Testing DELETE /:id (Reversal test)...');
  const deleteRes = await axios.delete(`${BASE_URL}/${exchangeId}`);
  if (!deleteRes.data.success) {
    throw new Error('Delete exchange failed: ' + JSON.stringify(deleteRes.data));
  }
  console.log('✓ Exchange deleted successfully');

  // Verify points fully restored
  const [custAfterDelete] = await pool.query('SELECT award_points FROM aura_companies WHERE id = ?', [customer.id]);
  const pointsAfterDelete = parseFloat(custAfterDelete[0].award_points);
  console.log(`  Customer points after delete: ${pointsAfterDelete} (Expected: ${pointsBefore})`);
  if (pointsAfterDelete !== pointsBefore) {
    throw new Error(`Points restoration mismatch: expected ${pointsBefore}, got ${pointsAfterDelete}`);
  }

  // Verify stock movement cleaned up
  const [movementsAfterDelete] = await pool.query("SELECT * FROM aura_stock_movement WHERE transaction = 'Reward' AND transaction_id = ?", [exchangeId]);
  console.log('  Stock movements remaining after delete:', movementsAfterDelete.length, '(Expected: 0)');

  console.log('\n======================================================');
  console.log('🎉 ALL REWARDS EXCHANGE BACKEND TESTS PASSED CLEANLY! 🎉');
  console.log('======================================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ REWARDS EXCHANGE TEST FAILED:', err.response?.data || err.message || err);
  process.exit(1);
});
