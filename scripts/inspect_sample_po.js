const db = require('../API/app/config/dbPool');

async function main() {
  const [orders] = await db.query(`SELECT * FROM aura_purchases_order ORDER BY id DESC LIMIT 3`);
  console.log('Sample aura_purchases_order:', JSON.stringify(orders, null, 2));

  if (orders.length > 0) {
    const [items] = await db.query(`SELECT * FROM aura_purchase_order_items WHERE purchase_id = ?`, [orders[0].id]);
    console.log('Sample aura_purchase_order_items:', JSON.stringify(items, null, 2));
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
