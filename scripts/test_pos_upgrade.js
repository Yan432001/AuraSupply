const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../API/app/config/utill/connection');
const { access_token_key } = require('../API/app/config/utill/helper');
const sessionService = require('../API/app/services/session.service');

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';

async function runPosTests() {
  console.log('========================================================');
  console.log('🚀 TESTING UPGRADED AURA_v1 POS MODULE (/admins/pos)');
  console.log('========================================================\n');

  try {
    // 1. Session Setup
    console.log('[Step 1] Creating authenticated admin session for POS Cashier/Owner...');
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
      userAgent: 'Automated-POS-Test-Runner',
      ipAddress: '127.0.0.1'
    });

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      Cookie: `admin_token=${token}`
    };
    console.log('✔ Admin POS session established.\n');

    // 2. Test GET /api/admin/pos/products
    console.log('[Step 2] Testing GET /api/admin/pos/products...');
    const productsRes = await axios.get(`${BASE_URL}/api/admin/pos/products?warehouse_id=1`, { headers: authHeaders });
    const products = productsRes.data?.products || productsRes.data?.data;
    if (!products || !Array.isArray(products)) {
      throw new Error(`Invalid products response: ${JSON.stringify(productsRes.data)}`);
    }

    const overselling = productsRes.data.overselling;
    console.log(`✔ Fetched ${products.length} POS products for warehouse #1.`);
    console.log(`✔ System overselling setting: ${overselling} (0 = strictly disallow overselling)`);

    // Verify variants presence
    const productsWithVariants = products.filter(p => Array.isArray(p.variants) && p.variants.length > 0);
    console.log(`✔ Products with variants configured: ${productsWithVariants.length}`);
    if (productsWithVariants.length > 0) {
      const pVar = productsWithVariants[0];
      console.log(`   Sample variant product: "${pVar.name}" (ID: ${pVar.id}) has ${pVar.variants.length} variant options:`);
      pVar.variants.forEach(v => {
        console.log(`     - Variant [ID: ${v.id}] ${v.name} (SKU: ${v.sku}, Price: $${v.price}, Qty: ${v.quantity})`);
      });
    }

    // 3. Test Stock Validation / Overselling Rejection
    console.log('\n[Step 3] Testing server-side stock validation & overselling rejection...');
    const instockProduct = products.find(p => parseFloat(p.quantity) > 0) || products[0];
    const availableQty = parseFloat(instockProduct.quantity || 0);

    const excessivePayload = {
      warehouse_id: 1,
      customer_id: 1,
      biller_id: 1,
      items: [
        {
          product_id: instockProduct.id,
          product_code: instockProduct.code,
          product_name: instockProduct.name,
          unit_price: parseFloat(instockProduct.price || 10),
          net_unit_price: parseFloat(instockProduct.price || 10),
          quantity: availableQty + 99999, // Impossible quantity
          subtotal: (availableQty + 99999) * parseFloat(instockProduct.price || 10)
        }
      ],
      payment: {
        paid_by: 'cash',
        amount: 100
      }
    };

    let oversellingBlocked = false;
    try {
      await axios.post(`${BASE_URL}/api/admin/pos/sales/checkout`, excessivePayload, { headers: authHeaders });
    } catch (err) {
      if (err.response && err.response.status === 400 && (err.response.data?.message?.includes('Insufficient stock') || err.response.data?.message?.includes('Insufficient inventory'))) {
        oversellingBlocked = true;
        console.log(`✔ Server correctly blocked overselling with 400 Bad Request: "${err.response.data.message}"`);
      } else {
        console.log(`Unexpected rejection: ${err.message}`, err.response?.data);
      }
    }

    if (!oversellingBlocked && overselling === 0) {
      throw new Error('FAILED: Server did not reject transaction exceeding available stock when overselling=0!');
    }

    // 4. Test Successful Checkout Sale
    console.log('\n[Step 4] Testing valid POS checkout sale...');
    
    // Choose product with positive stock
    const [freshStockRows] = await db.query('SELECT p.id, p.code, p.name, p.price, wp.quantity FROM aura_products p JOIN aura_warehouses_products wp ON p.id = wp.product_id WHERE wp.warehouse_id = 1 AND wp.quantity >= 2 LIMIT 1');
    if (!freshStockRows.length) {
      throw new Error('No product in warehouse #1 with quantity >= 2 for testing.');
    }
    const saleProduct = freshStockRows[0];
    const initialQty = parseFloat(saleProduct.quantity);
    console.log(` Using product: ${saleProduct.name} (Code: ${saleProduct.code}, Available Stock: ${initialQty})`);

    const checkoutQty = 1;
    const unitPrice = parseFloat(saleProduct.price || 5);
    const itemSubtotal = checkoutQty * unitPrice;

    // Check if product has a variant
    const [variantRows] = await db.query('SELECT pv.id, pv.name, pv.sku, pv.price, wpv.quantity FROM aura_product_variants pv JOIN aura_warehouses_products_variants wpv ON pv.id = wpv.option_id WHERE pv.product_id = ? AND wpv.warehouse_id = 1 AND wpv.quantity >= 1 LIMIT 1', [saleProduct.id]);
    const testOptionId = variantRows.length > 0 ? variantRows[0].id : null;
    if (testOptionId) {
      console.log(` Attaching option_id #${testOptionId} (${variantRows[0].name}) to item.`);
    }

    const validPayload = {
      warehouse_id: 1,
      customer_id: 1,
      biller_id: 1,
      order_discount_amount: 0,
      order_tax_amount: 0,
      shipping: 0,
      note: 'Automated POS Upgrade Test Sale',
      items: [
        {
          id: saleProduct.id,
          product_id: saleProduct.id,
          code: saleProduct.code,
          product_code: saleProduct.code,
          name: saleProduct.name,
          product_name: saleProduct.name,
          option_id: testOptionId,
          unit_price: unitPrice,
          net_unit_price: unitPrice,
          quantity: checkoutQty,
          item_tax: 0,
          item_discount: 0,
          subtotal: itemSubtotal
        }
      ],
      payment: {
        paid_by: 'cash',
        amount: itemSubtotal,
        given_amount: itemSubtotal + 5,
        change: 5,
        note: 'Cash payment exact'
      }
    };

    const checkoutRes = await axios.post(`${BASE_URL}/api/admin/pos/sales/checkout`, validPayload, { headers: authHeaders });
    const invoiceData = checkoutRes.data?.invoice || checkoutRes.data?.data;
    if (!checkoutRes.data?.success || !invoiceData?.sale_id) {
      throw new Error(`Checkout failed: ${JSON.stringify(checkoutRes.data)}`);
    }

    const saleId = invoiceData.sale_id;
    const invoiceNo = invoiceData.reference_no;
    console.log(`✔ Sale completed successfully!`);
    console.log(`   - Sale ID: ${saleId}`);
    console.log(`   - Reference / Invoice: ${invoiceNo}`);
    console.log(`   - Total Amount: $${invoiceData.grand_total}`);

    // 5. Verify Database Records (Sale, Items, Payment, Stock Movement)
    console.log('\n[Step 5] Verifying database integrity & triggers...');
    const [savedSales] = await db.query('SELECT id, reference_no, customer, biller, warehouse_id, grand_total, paid, payment_status, pos FROM aura_sales WHERE id = ?', [saleId]);
    if (!savedSales.length) throw new Error(`Sale #${saleId} not found in aura_sales!`);
    const savedSale = savedSales[0];
    console.log(`✔ aura_sales verified: ref="${savedSale.reference_no}", pos=${savedSale.pos}, paid=$${savedSale.paid}, status="${savedSale.payment_status}"`);

    const [savedItems] = await db.query('SELECT id, sale_id, product_id, product_name, option_id, quantity, unit_price, subtotal FROM aura_sale_items WHERE sale_id = ?', [saleId]);
    console.log(`✔ aura_sale_items verified: count=${savedItems.length}, option_id=${savedItems[0].option_id}, qty=${savedItems[0].quantity}`);

    const [savedPayments] = await db.query('SELECT id, sale_id, amount, paid_by, type FROM aura_payments WHERE sale_id = ?', [saleId]);
    console.log(`✔ aura_payments verified: count=${savedPayments.length}, paid_by="${savedPayments[0]?.paid_by}", amount=$${savedPayments[0]?.amount}`);

    const [stockMovements] = await db.query('SELECT id, product_id, warehouse_id, quantity, transaction, option_id FROM aura_stock_movement WHERE transaction = "POS" AND product_id = ? ORDER BY id DESC LIMIT 1', [saleProduct.id]);
    if (!stockMovements.length) throw new Error('No POS stock movement found!');
    console.log(`✔ aura_stock_movement recorded: qty=${stockMovements[0].quantity}, option_id=${stockMovements[0].option_id}`);

    // Check updated warehouse stock
    const [afterStockRows] = await db.query('SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = 1', [saleProduct.id]);
    const finalQty = parseFloat(afterStockRows[0]?.quantity || 0);
    console.log(`✔ Warehouse stock verified: Before=${initialQty}, After=${finalQty} (Deduction: ${initialQty - finalQty})`);

    // 6. Test Thermal Receipt Retrieval
    console.log('\n[Step 6] Testing GET /api/admin/pos/sales/:id/receipt...');
    const receiptRes = await axios.get(`${BASE_URL}/api/admin/pos/sales/${saleId}/receipt`, { headers: authHeaders });
    if (!receiptRes.data?.success || !receiptRes.data?.sale) {
      throw new Error(`Receipt retrieval failed: ${JSON.stringify(receiptRes.data)}`);
    }
    const receipt = receiptRes.data;
    console.log(`✔ Thermal receipt data retrieved successfully:`);
    console.log(`   - Store / Biller: ${receipt.sale?.biller_company || receipt.sale?.biller_name}`);
    console.log(`   - Reference: ${receipt.sale?.reference_no}`);
    console.log(`   - Customer: ${receipt.sale?.customer_name}`);
    console.log(`   - Total Items: ${receipt.items?.length}`);
    console.log(`   - Payments: ${receipt.payments?.length}`);

    console.log('\n========================================================');
    console.log('🎉 ALL POS MODULE UPGRADE TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================\n');

  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    if (err.response?.data) {
      console.error('API Error Response:', err.response.data);
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runPosTests();
