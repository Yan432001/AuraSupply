const db = require('../API/app/config/utill/connection');

async function inspectAssets() {
  console.log('=== INSPECTING ASSET DATABASE TABLES ===\n');
  
  const [allTables] = await db.query('SHOW TABLES');
  const tableNames = allTables.map(r => Object.values(r)[0]);
  
  const assetTables = tableNames.filter(t => 
    t.includes('asset') || 
    t.includes('deprec') || 
    t.includes('maintenance') ||
    t.includes('fixed')
  );
  
  console.log('Matching asset tables in aura_v1_db:');
  console.log(assetTables);

  for (const t of assetTables) {
    const [cols] = await db.query(`DESCRIBE ${t}`);
    console.log(`\n--- Table: ${t} (${cols.length} columns) ---`);
    console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
  }
}

inspectAssets().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
