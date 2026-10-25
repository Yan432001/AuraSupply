const { db } = require('../API/app/config/utill/helper');

async function checkStockCountsSchema() {
  try {
    const [countsCols] = await db.query("DESCRIBE aura_stock_counts");
    console.log('aura_stock_counts columns:');
    countsCols.forEach(c => console.log(`  ${c.Field}: ${c.Type} ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'}`));
  } catch (err) {
    console.error('aura_stock_counts error:', err.message);
  }

  try {
    const [itemsCols] = await db.query("DESCRIBE aura_stock_count_items");
    console.log('aura_stock_count_items columns:');
    itemsCols.forEach(c => console.log(`  ${c.Field}: ${c.Type} ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'}`));
  } catch (err) {
    console.error('aura_stock_count_items error:', err.message);
  }
  process.exit(0);
}

checkStockCountsSchema();
