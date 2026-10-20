const { pool } = require('./API/app/config/dbPool');
(async () => {
  const [billers] = await pool.query("SELECT id, name, company, theme_color, logo_url, logo, vat_no FROM aura_companies WHERE group_name = 'biller'");
  console.table(billers);
  process.exit(0);
})();
