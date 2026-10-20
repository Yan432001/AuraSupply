const { pool } = require('./API/app/config/dbPool');
(async () => {
  const [cols] = await pool.query('SHOW COLUMNS FROM aura_companies');
  console.table(cols.map(x => ({ Field: x.Field, Type: x.Type })));
  const [billers] = await pool.query("SELECT id, name, company, logo FROM aura_companies WHERE group_name = 'biller' LIMIT 5");
  console.log('Sample billers:', billers);
  process.exit(0);
})();
