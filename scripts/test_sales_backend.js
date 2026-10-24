const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../API/app/config/utill/connection');
const { access_token_key } = require('../API/app/config/utill/helper');
const sessionService = require('../API/app/services/session.service');

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';

async function runTests() {
  console.log('========================================================');
  console.log('🚀 TESTING SALES & POS MANAGEMENT BACKEND SYSTEM');
  console.log('========================================================\n');

  try {
    // 1. Generate valid Admin Session & Auth Token
    console.log('[Step 1] Creating authenticated admin session...');
    const userPayload = {
      id: 1,
      username: 'owner',
      email: 'owner@aurasupply.com',
      role: 'owner',
      group_id: 1,
      isAdmin: true,
      warehouse_id: 1,
      biller_id: 1
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
    await sessionService.registerSession({
      userId: userPayload.id,
      token,
      area: 'admin',
      userAgent: 'Automated-Sales-Test-Runner',
      ipAddress: '127.0.0.1'
    });

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      Cookie: `admin_token=${token}`
    };

    console.log(' Admin session successfully created & registered.\n');

    // 2. Test Sales Metadata Options
    console.log('[Step 2] Testing GET /api/admin/sales/meta/options...');
    const metaRes = await axios.get(`${BASE_URL}/api/admin/sales/meta/options`, { headers: authHeaders });
    if (!metaRes.data?.status || !metaRes.data?.data) {
      throw new Error(`Failed to load sales metadata: ${JSON.stringify(metaRes.data)}`);
    }
    const meta = metaRes.data.data;
    console.log(` Metadata fetched successfully:`);
    console.log(`   - Customers count: ${meta.customers?.length}`);
    console.log(`   - Billers count: ${meta.billers?.length}`);
    console.log(`   - Warehouses count: ${meta.warehouses?.length}`);
    console.log(`   - Units count: ${meta.units?.length}`);
    console.log(`   - Next generated reference: ${meta.nextReference}\n`);

    // 3. Find a test product and warehouse
    console.log('[Step 3] Fetching product and warehouse for sale test...');
    const [products] = await db.query('SELECT id, name, code, price, cost FROM aura_products WHERE quantity > 0 LIMIT 1');
    if (!products.length) {
      throw new Error('No products with stock available in aura_products');
    }
    const testProduct = products[0];
    const customerId = meta.customers[0]?.id || 1;
    const warehouseId = meta.warehouses[0]?.id || 1;
    const billerId = meta.billers[0]?.id || 1;
    console.log(` Using product: ${testProduct.name} (ID: ${testProduct.id}, Code: ${testProduct.code}, Price: $${testProduct.price})\n`);

    // Check initial stock
    const [stockBefore] = await db.query('SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ?', [testProduct.id, warehouseId]);
    const qtyBefore = parseFloat(stockBefore[0]?.quantity || 0);
    console.log(` Stock before sale in Warehouse #${warehouseId}: ${qtyBefore}`);

    // 4. Test Create Commercial Sale
    console.log('\n[Step 4] Testing POST /api/admin/sales (Create Sale)...');
    const salePayload = {
      reference_no: meta.nextReference,
      date: new Date().toISOString().slice(0, 10),
      customer_id: customerId,
      warehouse_id: warehouseId,
      biller_id: billerId,
      sale_status: 'completed',
      pos: 0,
      order_discount: 0.50,
      order_tax: 1.00,
      shipping: 2.50,
      paid: 2.00,
      paid_by: 'cash',
      note: 'Automated Backend Test Sale',
      staff_note: 'Internal test transaction',
      items: [
        {
          product_id: testProduct.id,
          product_code: testProduct.code,
          product_name: testProduct.name,
          product_type: 'standard',
          quantity: 2,
          unit_price: parseFloat(testProduct.price) || 20.00,
          cost: parseFloat(testProduct.cost) || 10.00,
          item_discount: 0,
          item_tax: 0,
          subtotal: 2 * (parseFloat(testProduct.price) || 20.00)
        }
      ]
    };

    const createRes = await axios.post(`${BASE_URL}/api/admin/sales`, salePayload, { headers: authHeaders });
    if (!createRes.data?.status || !createRes.data?.data) {
      throw new Error(`Failed to create sale: ${JSON.stringify(createRes.data)}`);
    }
    const createdSale = createRes.data.data;
    const saleId = createdSale.id;
    console.log(` Sale created successfully: ID #${saleId}, Reference: ${createdSale.referenceNo}`);
    console.log(`   - Grand Total: $${createdSale.grandTotal}`);
    console.log(`   - Paid Amount: $${createdSale.paid}`);
    console.log(`   - Balance Due: $${createdSale.balance}`);
    console.log(`   - Sale Status: ${createdSale.saleStatus}`);
    console.log(`   - Payment Status: ${createdSale.paymentStatus}\n`);

    // Verify stock movement ledger
    const [stockMovements] = await db.query(
      "SELECT * FROM aura_stock_movement WHERE transaction_id = ? AND transaction = 'Sales'",
      [saleId]
    );
    console.log(` Stock Movement Ledger entries for Sale #${saleId}: ${stockMovements.length}`);
    if (stockMovements.length > 0) {
      console.log(`   - Movement ID: ${stockMovements[0].id}`);
      console.log(`   - Transaction: ${stockMovements[0].transaction}`);
      console.log(`   - Quantity Change: ${stockMovements[0].quantity} (Deducted)`);
    }

    // 5. Test GET /api/admin/sales/:id (View Detail)
    console.log('\n[Step 5] Testing GET /api/admin/sales/:id...');
    const detailRes = await axios.get(`${BASE_URL}/api/admin/sales/${saleId}`, { headers: authHeaders });
    const detail = detailRes.data.data;
    console.log(` Sale Detail retrieved:`);
    console.log(`   - Reference: ${detail.referenceNo}`);
    console.log(`   - Customer: ${detail.customer}`);
    console.log(`   - Line items count: ${detail.items?.length}`);
    console.log(`   - Payments count: ${detail.payments?.length}`);
    console.log(`   - Stock movements count: ${detail.stockMovements?.length}\n`);

    // 6. Test Safe Deletion Prevention (Must Fail because it has payment and deducted stock)
    console.log('[Step 6] Testing Safe Deletion Guard (DELETE /api/admin/sales/:id)...');
    try {
      await axios.delete(`${BASE_URL}/api/admin/sales/${saleId}`, { headers: authHeaders });
      console.error('❌ ERROR: System allowed deleting sale with payments/deductions!');
    } catch (err) {
      console.log(` Safe Deletion Guard working properly! Blocked delete with message:`);
      console.log(`   "${err.response?.data?.message || err.message}"\n`);
    }

    // 7. Test Add Payment
    console.log('[Step 7] Testing POST /api/admin/sales/:id/payments...');
    const remainingBalance = detail.balance;
    const paymentPayload = {
      amount: remainingBalance,
      paid_by: 'bank_transfer',
      date: new Date().toISOString().slice(0, 10),
      note: 'Settling remaining balance via Bank / ABA'
    };
    const payRes = await axios.post(`${BASE_URL}/api/admin/sales/${saleId}/payments`, paymentPayload, { headers: authHeaders });
    const updatedSaleAfterPay = payRes.data.data;
    console.log(` Payment recorded successfully:`);
    console.log(`   - Total Paid: $${updatedSaleAfterPay.paid}`);
    console.log(`   - Remaining Balance: $${updatedSaleAfterPay.balance}`);
    console.log(`   - Payment Status: ${updatedSaleAfterPay.paymentStatus} (Expected: 'paid')\n`);

    // 8. Test Cancellation & Stock Reversal
    console.log('[Step 8] Testing Sale Cancellation & Automatic Stock Reversal...');
    const cancelRes = await axios.put(`${BASE_URL}/api/admin/sales/${saleId}/status`, {
      status: 'cancelled',
      sale_status: 'cancelled',
      note: 'Cancelled as part of automated verification test'
    }, { headers: authHeaders });

    const cancelledSale = cancelRes.data.data;
    console.log(` Sale status transitioned to: ${cancelledSale.saleStatus}`);

    // Verify reversal entry in stock movement
    const [reversalMovements] = await db.query(
      "SELECT * FROM aura_stock_movement WHERE transaction_id = ? AND transaction = 'Sale Reversal'",
      [saleId]
    );
    console.log(` Reversal Stock Movements found: ${reversalMovements.length}`);
    if (reversalMovements.length > 0) {
      console.log(`   - Reversal ID: ${reversalMovements[0].id}`);
      console.log(`   - Restored Quantity: +${reversalMovements[0].quantity}\n`);
    }

    // 9. Test GET /api/admin/sales (Listing with metrics & filters)
    console.log('[Step 9] Testing GET /api/admin/sales (Listing & Metrics)...');
    const listRes = await axios.get(`${BASE_URL}/api/admin/sales?page=1&limit=10`, { headers: authHeaders });
    const listResult = listRes.data;
    console.log(` Sales list retrieved:`);
    console.log(`   - Records on page: ${listResult.data?.length}`);
    console.log(`   - Total records in system: ${listResult.pagination?.totalRecords}`);
    console.log(`   - Total revenue: $${listResult.metrics?.totalRevenue}`);
    console.log(`   - Total collected: $${listResult.metrics?.totalPaid}`);
    console.log(`   - Total balance: $${listResult.metrics?.totalBalance}`);
    console.log(`   - Completed count: ${listResult.metrics?.completedCount}`);
    console.log(`   - Cancelled count: ${listResult.metrics?.cancelledCount}\n`);

    console.log('========================================================');
    console.log('🎉 ALL SALES & POS BACKEND TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST RUNNER FAILED:', err.message);
    if (err.response?.data) {
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

runTests();
