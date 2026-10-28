const db = require('../API/app/config/dbPool');

async function main() {
  const [cols] = await db.query("DESCRIBE aura_purchase_request_items");
  console.log('aura_purchase_request_items cols:', cols.map(c => `${c.Field} (${c.Type})`).join(', '));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
