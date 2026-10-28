const { pool } = require('../API/app/config/dbPool');

(async () => {
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE '%purchase%'");
    console.log('Tables matching purchase:', tables.map(r => Object.values(r)[0]));
    
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [cols] = await pool.query(`DESCRIBE \`${tableName}\``);
      console.log(`\n--- ${tableName} ---`);
      console.log(cols.map(c => `${c.Field} (${c.Type}, Null:${c.Null}, Default:${c.Default})`).join('\n'));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
})();
