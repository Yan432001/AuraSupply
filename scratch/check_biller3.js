const { db } = require('../API/app/config/utill/helper');

async function main() {
  const [sales] = await db.query('SELECT COUNT(*) as cnt FROM aura_sales WHERE biller_id = 3');
  console.log('sales with biller 3:', sales[0].cnt);
  const [so] = await db.query('SELECT COUNT(*) as cnt FROM aura_sales_order WHERE biller_id = 3');
  console.log('sales_order with biller 3:', so[0].cnt);
  const [prods] = await db.query('SELECT COUNT(*) as cnt FROM aura_products WHERE biller_id = 3');
  console.log('products with biller 3:', prods[0].cnt);
  process.exit(0);
}

main();
