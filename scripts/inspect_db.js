const pool = require('../API/app/config/dbPool.js');

async function inspect() {
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE '%product%'");
    console.log('Product Tables:', tables);

    const [prodCols] = await pool.query("DESCRIBE aura_products");
    console.log('\naura_products columns:');
    prodCols.forEach(c => console.log(`  ${c.Field} (${c.Type}) - Key: ${c.Key}, Null: ${c.Null}, Default: ${c.Default}`));

    // Check if products table exists separately
    const [hasProductsTable] = await pool.query("SHOW TABLES LIKE 'products'");
    console.log('\nHas plain `products` table?', hasProductsTable);

    // Check if barcode_print_logs or barcode_label_templates exist
    const [barcodeTables] = await pool.query("SHOW TABLES LIKE '%barcode%'");
    console.log('\nBarcode Tables:', barcodeTables);

  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    pool.end();
  }
}

inspect();
