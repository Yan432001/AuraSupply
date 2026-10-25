const { pool } = require('../API/app/config/dbPool');

async function check() {
  const [rows] = await pool.query('SELECT wp.*, p.name FROM aura_warehouses_products wp JOIN aura_products p ON p.id = wp.product_id WHERE wp.warehouse_id = 1 AND wp.quantity > 0');
  console.log('Products in warehouse 1 with quantity > 0:', rows);
  await pool.end();
}

check();
