const db = require('../API/app/config/dbPool');

async function main() {
  const [cols1] = await db.query("DESCRIBE aura_projects");
  console.log('aura_projects cols:', cols1.map(c => c.Field).join(', '));
  const [cols2] = await db.query("DESCRIBE aura_tax_rates");
  console.log('aura_tax_rates cols:', cols2.map(c => c.Field).join(', '));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
