const db = require('../API/app/config/utill/connection');

async function inspectAccounting() {
  console.log('=== INSPECTING ACCOUNTING DATABASE TABLES ===\n');
  
  const [allTables] = await db.query('SHOW TABLES');
  const tableNames = allTables.map(r => Object.values(r)[0]);
  
  const accTables = tableNames.filter(t => 
    t.includes('account') || 
    t.includes('gl') || 
    t.includes('journal') || 
    t.includes('ledger') || 
    t.includes('payment') || 
    t.includes('cash') || 
    t.includes('bank')
  );
  
  console.log('Matching accounting tables in aura_v1_db:');
  console.log(accTables);

  for (const t of accTables) {
    const [cols] = await db.query(`DESCRIBE ${t}`);
    console.log(`\n--- Table: ${t} (${cols.length} columns) ---`);
    console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
  }
}

inspectAccounting().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
