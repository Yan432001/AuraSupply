const pool = require('../API/app/config/dbPool');

async function check() {
  const [tables] = await pool.query("SHOW TABLES LIKE '%department%'");
  console.log('Department tables:', tables);

  const [users] = await pool.query("SELECT id, username, first_name, last_name, email FROM aura_users LIMIT 5");
  console.log('Sample users:', users);

  const [suppliers] = await pool.query("SELECT id, name, company FROM aura_companies WHERE group_name = 'supplier' LIMIT 5");
  console.log('Sample suppliers:', suppliers);

  process.exit(0);
}
check().catch(console.error);
