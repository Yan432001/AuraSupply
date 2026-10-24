const { pool } = require('../API/app/config/dbPool');

async function inspect() {
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE '%adjust%'");
    console.log('Matching tables:', tables);

    for (const t of tables) {
      const tName = Object.values(t)[0];
      const [cols] = await pool.query('DESCRIBE ' + tName);
      console.log(`\n=== Table: ${tName} ===`);
      cols.forEach(c => console.log(`  ${c.Field.padEnd(20)} ${c.Type.padEnd(20)} Null:${c.Null} Key:${c.Key} Default:${c.Default}`));
      const [count] = await pool.query('SELECT COUNT(*) as c FROM ' + tName);
      console.log('Record Count:', count[0].c);
      const [sample] = await pool.query('SELECT * FROM ' + tName + ' LIMIT 2');
      console.log('Sample rows:', JSON.stringify(sample, null, 2));
    }
  } catch (e) {
    console.error('Inspection error:', e);
  } finally {
    await pool.end();
  }
}

inspect();
