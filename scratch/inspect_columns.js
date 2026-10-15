const { db } = require('../API/app/config/utill/helper');

async function main() {
  const tables = [
    'aura_theme_settings',
    'aura_theme_banners',
    'aura_theme_reviews',
    'aura_theme_newsletter',
    'aura_theme_contact_messages',
    'aura_theme_posts',
    'aura_products',
    'aura_categories',
    'aura_brands',
    'aura_shop_settings',
    'aura_pages',
    'aura_menu'
  ];

  for (const t of tables) {
    try {
      const [cols] = await db.query(`DESCRIBE \`${t}\``);
      console.log(`\n=== Table: ${t} ===`);
      console.log(cols.map(c => `${c.Field} (${c.Type}, Null:${c.Null}, Key:${c.Key}, Default:${c.Default})`).join('\n'));
      const [sample] = await db.query(`SELECT * FROM \`${t}\` LIMIT 2`);
      if (sample.length) {
        console.log(`Sample row 1:`, JSON.stringify(sample[0]));
      } else {
        console.log(`Table is empty.`);
      }
    } catch (e) {
      console.log(`Error on ${t}: ${e.message}`);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
