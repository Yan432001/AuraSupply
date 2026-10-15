const { db } = require('../API/app/config/utill/helper');

async function checkTables() {
  const tables = [
    'aura_products',
    'aura_categories',
    'aura_brands',
    'aura_companies',
    'aura_users',
    'aura_shop_settings',
    'aura_theme_settings',
    'aura_theme_banners',
    'aura_theme_posts',
    'aura_theme_reviews',
    'aura_warehouses_products',
    'aura_currencies'
  ];

  for (const t of tables) {
    const [rows] = await db.query(`SHOW TABLES LIKE '${t}'`);
    if (rows.length > 0) {
      const [cnt] = await db.query(`SELECT COUNT(*) as c FROM \`${t}\``);
      console.log(`✓ ${t} exists (${cnt[0].c} rows)`);
    } else {
      console.log(`✗ ${t} DOES NOT EXIST`);
    }
  }

  // Check aura_shop_settings columns
  const [shopSettingsTable] = await db.query("SHOW TABLES LIKE 'aura_shop_settings'");
  if (shopSettingsTable.length > 0) {
    const [cols] = await db.query('DESCRIBE aura_shop_settings');
    console.log('aura_shop_settings columns:', cols.map(c => c.Field).join(', '));
    const [settingsRows] = await db.query('SELECT * FROM aura_shop_settings LIMIT 1');
    console.log('aura_shop_settings row:', settingsRows[0]);
  }
}
checkTables().catch(console.error);
