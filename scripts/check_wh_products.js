const { db } = require('../API/app/config/utill/helper');

async function checkWarehouseProducts() {
  const [warehouses] = await db.query('SELECT id, name, code FROM aura_warehouses');
  console.log('Warehouses:', warehouses);

  for (const w of warehouses) {
    const [wpCount] = await db.query('SELECT COUNT(*) as count FROM aura_warehouses_products WHERE warehouse_id = ?', [w.id]);
    const [smCount] = await db.query('SELECT COUNT(*) as count FROM aura_stock_movement WHERE warehouse_id = ?', [w.id]);
    console.log(`Warehouse id ${w.id} (${w.name}): aura_warehouses_products = ${wpCount[0].count}, aura_stock_movement = ${smCount[0].count}`);
  }

  const [totalProducts] = await db.query('SELECT COUNT(*) as count, type FROM aura_products GROUP BY type');
  console.log('Products by type:', totalProducts);

  process.exit(0);
}

checkWarehouseProducts();
