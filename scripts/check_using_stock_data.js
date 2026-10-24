const pool = require('../API/app/config/dbPool.js');

async function checkDetails() {
  try {
    const [headerRows] = await pool.query(`
      SELECT us.*, b.name AS biller_name, b.company AS biller_company, w.name AS warehouse_name, u.username AS employee_name
      FROM aura_enter_using_stock us
      LEFT JOIN aura_companies b ON b.id = us.biller_id
      LEFT JOIN aura_warehouses w ON w.id = us.warehouse_id
      LEFT JOIN aura_users u ON u.id = us.employee_id
      ORDER BY us.id DESC
      LIMIT 10
    `);
    console.log('Sample Using Stock Headers:\n', JSON.stringify(headerRows, null, 2));

    const [items] = await pool.query(`
      SELECT usi.*, p.name AS orig_product_name, p.code AS orig_product_code
      FROM aura_enter_using_stock_items usi
      LEFT JOIN aura_products p ON p.id = usi.product_id
      LIMIT 10
    `);
    console.log('Sample Using Stock Items:\n', JSON.stringify(items, null, 2));

  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}

checkDetails();
