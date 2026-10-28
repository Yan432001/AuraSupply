const path = require('path');
const db = require(path.join(__dirname, '../API/app/config/dbPool'));

async function inspect() {
  const [tables] = await db.query("SHOW TABLES LIKE '%reward%'");
  console.log('Tables matching reward:', tables);

  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [cols] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
    console.log(`Columns of ${tableName}:`, cols.map(c => ({ Field: c.Field, Type: c.Type })));
    const [sample] = await db.query(`SELECT * FROM ${tableName} LIMIT 2`);
    console.log(`Sample rows of ${tableName}:`, sample);
  }

  // Also check if customer points exist in aura_companies
  const [compCols] = await db.query("SHOW COLUMNS FROM aura_companies");
  console.log('aura_companies point columns:', compCols.filter(c => c.Field.includes('point')).map(c => c.Field));

  // Check if points exist in aura_products
  const [prodCols] = await db.query("SHOW COLUMNS FROM aura_products");
  console.log('aura_products point columns:', prodCols.filter(c => c.Field.includes('point')).map(c => c.Field));

  process.exit(0);
}
inspect().catch(e => { console.error(e); process.exit(1); });
