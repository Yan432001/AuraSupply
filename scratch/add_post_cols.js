const { db } = require('../API/app/config/utill/helper');

async function main() {
  const calls = [
    `CALL aura_add_column('aura_theme_posts', 'category', 'VARCHAR(100) NULL DEFAULT "General"')`,
    `CALL aura_add_column('aura_theme_posts', 'badge', 'VARCHAR(50) NULL')`,
    `CALL aura_add_column('aura_theme_posts', 'duration', 'VARCHAR(50) NULL')`,
    `CALL aura_add_column('aura_theme_posts', 'author', 'VARCHAR(100) NULL DEFAULT "Aura Editorial"')`,
    `CALL aura_add_column('aura_theme_posts', 'views', 'INT NOT NULL DEFAULT 0')`
  ];

  for (const c of calls) {
    await db.query(c);
    console.log('Executed:', c);
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
