const { pool } = require('./API/app/config/dbPool');
(async () => {
  const [cols] = await pool.query("SHOW COLUMNS FROM aura_companies LIKE '%color%'");
  console.log('Color columns in aura_companies:', cols);
  const [salesCols] = await pool.query("SHOW COLUMNS FROM aura_sales LIKE '%biller%'");
  console.log('Biller columns in aura_sales:', salesCols);
  process.exit(0);
})();
