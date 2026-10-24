const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../API/app/config/utill/connection');
const { access_token_key } = require('../API/app/config/utill/helper');
const sessionService = require('../API/app/services/session.service');

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';

async function testVariantCheckout() {
  console.log('--- Testing POS Variant-specific checkout & stock ledger ---');

  const token = jwt.sign({ id: 1, role: 'owner', isAdmin: true, warehouse_id: 1, biller_id: 1 }, JWT_SECRET, { expiresIn: '1h' });
  await sessionService.registerSession({ userId: 1, token, area: 'admin', userAgent: 'Variant-Test', ipAddress: '127.0.0.1' });
  const authHeaders = { Authorization: `Bearer ${token}`, Cookie: `admin_token=${token}` };

  // Check variant stock before checkout
  const [vBefore] = await db.query(
    'SELECT pv.id, pv.name, pv.price, wpv.quantity as warehouse_qty FROM aura_product_variants pv JOIN aura_warehouses_products_variants wpv ON pv.id = wpv.option_id WHERE pv.id = 7 AND wpv.warehouse_id = 1'
  );
  const variant = vBefore[0];
  console.log(`Initial Variant Stock for "${variant.name}" (ID 7): ${variant.warehouse_qty}`);

  const payload = {
    warehouse_id: 1,
    customer_id: 1,
    biller_id: 1,
    order_discount_amount: 0,
    order_tax_amount: 0,
    shipping: 0,
    note: 'Variant Sale Test',
    items: [
      {
        id: 531,
        product_id: 531,
        code: 'TSHIRT-1792836995870-RED-S',
        product_code: 'TSHIRT-1792836995870-RED-S',
        name: 'Aura Organic T-Shirt (Red / Small)',
        product_name: 'Aura Organic T-Shirt (Red / Small)',
        variant_name: 'Red / Small',
        option_id: 7,
        unit_price: 25,
        net_unit_price: 25,
        quantity: 1,
        item_tax: 0,
        item_discount: 0,
        subtotal: 25
      }
    ],
    payment: {
      paid_by: 'Cash',
      amount: 25,
      given_amount: 50,
      change: 25
    }
  };

  const res = await axios.post(`${BASE_URL}/api/admin/pos/sales/checkout`, payload, { headers: authHeaders });
  const inv = res.data.invoice;
  console.log(`Sale successfully created! Invoice: ${inv.reference_no}, Grand Total: $${inv.grand_total}`);

  // Check item record
  const [items] = await db.query('SELECT option_id, product_name, quantity, unit_price FROM aura_sale_items WHERE sale_id = ?', [inv.sale_id]);
  console.log(`Saved Item: option_id=${items[0].option_id}, name="${items[0].product_name}", qty=${items[0].quantity}`);

  // Check variant stock after checkout
  const [vAfter] = await db.query(
    'SELECT wpv.quantity as warehouse_qty FROM aura_warehouses_products_variants wpv WHERE wpv.option_id = 7 AND wpv.warehouse_id = 1'
  );
  console.log(`Final Variant Stock: ${vAfter[0].warehouse_qty} (Change: ${parseFloat(variant.warehouse_qty) - parseFloat(vAfter[0].warehouse_qty)})`);

  // Check stock movement
  const [move] = await db.query(
    'SELECT product_id, option_id, quantity, transaction FROM aura_stock_movement WHERE transaction_id = ? AND transaction = "POS"',
    [inv.sale_id]
  );
  console.log(`Stock Movement: prod_id=${move[0].product_id}, option_id=${move[0].option_id}, qty=${move[0].quantity}, trans=${move[0].transaction}`);

  if (items[0].option_id === 7 && parseFloat(move[0].quantity) === -1) {
    console.log(' Variant Checkout and Stock Ledger Test PASSED successfully!');
  } else {
    throw new Error('Variant checkout verification failed!');
  }
}

testVariantCheckout().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => process.exit(0));
