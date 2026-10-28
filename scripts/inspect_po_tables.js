const db = require('../API/app/config/dbPool');

async function main() {
  const [tables] = await db.query("SHOW TABLES LIKE '%purchase%'");
  console.log('Tables found:');
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [cols] = await db.query(`DESCRIBE \`${tableName}\``);
    console.log(`\n--- ${tableName} ---`);
    console.log(cols.map(c => `${c.Field} (${c.Type}, Null:${c.Null}, Default:${c.Default})`).join(', '));
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

