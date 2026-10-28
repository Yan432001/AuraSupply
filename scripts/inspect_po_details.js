const db = require('../API/app/config/dbPool');

async function main() {
  const tables = ['aura_purchases_order', 'aura_purchase_order_items'];
  for (const tableName of tables) {
    try {
      const [cols] = await db.query(`DESCRIBE \`${tableName}\``);
      console.log(`\n=================== ${tableName} ===================`);
      cols.forEach(c => {
        console.log(`  ${c.Field}: ${c.Type} | Null: ${c.Null} | Default: ${c.Default}`);
      });
      const [count] = await db.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
      console.log(`Total rows in ${tableName}: ${count[0].cnt}`);
    } catch (e) {
      console.log(`Error reading ${tableName}: ${e.message}`);
    }
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
