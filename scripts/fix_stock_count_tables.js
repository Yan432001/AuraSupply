const { db } = require('../API/app/config/utill/helper');

async function fixTables() {
  console.log('Altering aura_stock_count_items and aura_stock_counts...');
  await db.query(`ALTER TABLE aura_stock_count_items MODIFY COLUMN counted DECIMAL(15,2) NULL DEFAULT NULL`);
  console.log('Modified aura_stock_count_items.counted to NULL DEFAULT NULL');

  await db.query(`ALTER TABLE aura_stock_counts MODIFY COLUMN initial_file VARCHAR(255) NULL DEFAULT ''`);
  console.log('Modified aura_stock_counts.initial_file to NULL DEFAULT ""');

  const [cols] = await db.query("SHOW COLUMNS FROM aura_stock_count_items LIKE 'counted'");
  console.log('New counted col:', cols);

  process.exit(0);
}

fixTables().catch(err => {
  console.error(err);
  process.exit(1);
});
