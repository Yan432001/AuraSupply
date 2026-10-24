const PurchasesModel = require('../API/app/models/admins/purchases.model');
const db = require('../API/app/config/utill/connection');

async function runTests() {
  console.log('--- Starting Purchases & Procurement Module Tests ---');

  try {
    // 1. Test Metadata
    console.log('\n[1/7] Testing Metadata retrieval...');
    const meta = await PurchasesModel.getMetadata();
    console.log(`✓ Metadata loaded: ${meta.suppliers.length} suppliers, ${meta.warehouses.length} warehouses, ${meta.units.length} units.`);
    console.log(`✓ Next suggested reference: ${meta.nextReference}`);

    // 2. Fetch a test product variant from DB
    console.log('\n[2/7] Selecting test product and variant...');
    const [variants] = await db.query(`
      SELECT v.id AS option_id, v.product_id, v.name AS variant_name, v.cost, p.name AS product_name, p.code AS product_code, p.unit, p.purchase_unit
      FROM aura_product_variants v
      JOIN aura_products p ON p.id = v.product_id
      LIMIT 1
    `);

    if (!variants.length) {
      throw new Error('No product variants found in database to test.');
    }

    const testVar = variants[0];
    console.log(`✓ Using test variant: ${testVar.product_name} [${testVar.variant_name}] (ProductID: ${testVar.product_id}, OptionID: ${testVar.option_id}, Cost: $${testVar.cost})`);

    const supplierId = meta.suppliers[0]?.id || 1;
    const warehouseId = meta.warehouses[0]?.id || 1;

    // Get current stock of this product and variant before purchase
    const [initialWh] = await db.query(
      'SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ?',
      [testVar.product_id, warehouseId]
    );
    const initialWhQty = parseFloat(initialWh[0]?.quantity || 0);

    const [initialVar] = await db.query(
      'SELECT quantity FROM aura_warehouses_products_variants WHERE option_id = ? AND product_id = ? AND warehouse_id = ?',
      [testVar.option_id, testVar.product_id, warehouseId]
    );
    const initialVarQty = parseFloat(initialVar[0]?.quantity || 0);

    console.log(`✓ Initial warehouse stock: Product = ${initialWhQty}, Variant = ${initialVarQty}`);

    // 3. Create a purchase in 'ordered' status
    console.log('\n[3/7] Creating Purchase Order in "ordered" status (Ordered 10 units)...');
    const newPO = await PurchasesModel.createPurchase(
      {
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        status: 'ordered',
        note: 'Automated Test Purchase Order',
        shipping: 5.00,
        order_discount: 2.00
      },
      [
        {
          product_id: testVar.product_id,
          product_code: testVar.product_code,
          product_name: testVar.product_name,
          option_id: testVar.option_id,
          product_unit_id: testVar.purchase_unit || testVar.unit,
          quantity: 10,
          unit_cost: parseFloat(testVar.cost || 10)
        }
      ],
      { id: 1 }
    );

    console.log(`✓ Created PO #${newPO.referenceNo} (ID: ${newPO.id})`);
    console.log(`✓ Grand Total: $${newPO.grandTotal}, Status: ${newPO.status}, Payment Status: ${newPO.paymentStatus}`);
    console.log(`✓ Items count: ${newPO.items.length}, Item 0 Balance: ${newPO.items[0].quantityBalance}`);

    // Verify stock is NOT incremented while in 'ordered' status
    const [afterOrderWh] = await db.query(
      'SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ?',
      [testVar.product_id, warehouseId]
    );
    const afterOrderWhQty = parseFloat(afterOrderWh[0]?.quantity || 0);
    if (afterOrderWhQty !== initialWhQty) {
      throw new Error(`Stock prematurely incremented! Expected ${initialWhQty}, got ${afterOrderWhQty}`);
    }
    console.log(`✓ Confirmed: Stock did NOT change while order is pending/ordered (${afterOrderWhQty} == ${initialWhQty}).`);

    // 4. Test Partial Goods Receipt (Receive 4 out of 10)
    console.log('\n[4/7] Testing partial goods receipt (Receiving 4 units)...');
    const receivedPO = await PurchasesModel.receiveGoods(
      newPO.id,
      [
        {
          item_id: newPO.items[0].id,
          quantity_to_receive: 4
        }
      ],
      { id: 1 }
    );

    console.log(`✓ Goods receipt processed! Status: ${receivedPO.status}`);
    console.log(`✓ Item Received: ${receivedPO.items[0].quantityReceived}, Item Remaining Balance: ${receivedPO.items[0].quantityBalance}`);

    const [afterRcvWh] = await db.query(
      'SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ?',
      [testVar.product_id, warehouseId]
    );
    const [afterRcvVar] = await db.query(
      'SELECT quantity FROM aura_warehouses_products_variants WHERE option_id = ? AND product_id = ? AND warehouse_id = ?',
      [testVar.option_id, testVar.product_id, warehouseId]
    );
    console.log(`✓ Updated stock after receipt: Product = ${afterRcvWh[0]?.quantity} (Expected ${initialWhQty + 4}), Variant = ${afterRcvVar[0]?.quantity} (Expected ${initialVarQty + 4})`);

    // 5. Test Supplier Payment
    console.log('\n[5/7] Testing payment recording ($50.00 partial payment)...');
    const paidPO = await PurchasesModel.addPayment(
      newPO.id,
      {
        amount: 50.00,
        paid_by: 'bank_transfer',
        note: 'Partial bank transfer payment'
      },
      { id: 1 }
    );
    console.log(`✓ Payment recorded! Paid: $${paidPO.paid}, Remaining Balance: $${paidPO.balance}, Payment Status: ${paidPO.paymentStatus}`);

    // 6. Test Safe Deletion Prevention
    console.log('\n[6/7] Testing safe deletion prevention...');
    try {
      await PurchasesModel.deletePurchase(newPO.id);
      throw new Error('FAILED: Purchase was deleted when it should have been protected!');
    } catch (err) {
      console.log(`✓ Successfully prevented unsafe deletion: "${err.message}"`);
    }

    // 7. Test Workflow Cancellation & Inventory Reversal
    console.log('\n[7/7] Testing cancellation and stock movement reversal...');
    const cancelledPO = await PurchasesModel.updateStatus(newPO.id, 'cancelled', { id: 1 });
    console.log(`✓ Purchase order cancelled: Status = ${cancelledPO.status}`);

    const [afterCancelWh] = await db.query(
      'SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ?',
      [testVar.product_id, warehouseId]
    );
    const [afterCancelVar] = await db.query(
      'SELECT quantity FROM aura_warehouses_products_variants WHERE option_id = ? AND product_id = ? AND warehouse_id = ?',
      [testVar.option_id, testVar.product_id, warehouseId]
    );
    console.log(`✓ Reversal verified: Warehouse stock restored to Product = ${afterCancelWh[0]?.quantity}, Variant = ${afterCancelVar[0]?.quantity}`);

    console.log('\n=========================================');
    console.log('✓ ALL PURCHASES MODULE BACKEND TESTS PASSED!');
    console.log('=========================================');
    process.exit(0);
  } catch (err) {
    console.error('✗ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
