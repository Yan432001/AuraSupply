const db = require('../API/app/config/dbPool');

async function main() {
  const [p] = await db.query("SHOW TABLES LIKE '%project%'");
  console.log('Project tables:', p);
  const [t] = await db.query("SHOW TABLES LIKE '%tax%'");
  console.log('Tax tables:', t);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
