const { db } = require('../API/app/config/utill/helper');

async function main() {
  const tables = [
    'aura_cart',
    'aura_wishlist',
    'aura_sales_order',
    'aura_sale_order_items',
    'aura_sales',
    'aura_sale_items',
    'aura_coupon',
    'aura_promotions',
    'aura_currencies',
    'aura_product_photos',
    'aura_product_prices',
    'aura_product_units',
    'aura_warehouses_products'
  ];

  for (const t of tables) {
    try {
      const [cols] = await db.query(`DESCRIBE \`${t}\``);
      console.log(`\nTable ${t}:`, cols.map(c => c.Field).join(', '));
      const [rows] = await db.query(`SELECT COUNT(*) as count FROM \`${t}\``);
      console.log(`Count: ${rows[0].count}`);
    } catch (e) {
      console.log(`Error on ${t}: ${e.message}`);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
