const pool = require('../API/app/config/dbPool.js');

async function inspect() {
  try {
    const [tables] = await pool.query('SHOW TABLES LIKE "%using_stock%"');
    console.log('Tables matching %using_stock%:', tables);

    const [allStockTables] = await pool.query('SHOW TABLES LIKE "%stock%"');
    console.log('All tables matching %stock%:', allStockTables);

    for (const t of tables) {
      const tableName = Object.values(t)[0];
      const [columns] = await pool.query(`DESCRIBE \`${tableName}\``);
      console.log(`\nColumns for ${tableName}:`);
      console.log(columns.map(c => `${c.Field} (${c.Type}) ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'}`).join('\n'));
      
      const [count] = await pool.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      console.log(`Total rows in ${tableName}:`, count[0].count);
      if (count[0].count > 0) {
        const [samples] = await pool.query(`SELECT * FROM \`${tableName}\` LIMIT 2`);
        console.log(`Sample row from ${tableName}:`, samples);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

inspect();
