const { db } = require('../API/app/config/utill/helper');

async function main() {
  const [tables] = await db.query("SHOW TABLES LIKE 'aura_%'");
  const names = tables.map(t => Object.values(t)[0]);
  console.log('Total aura_ tables in DB:', names.length);

  const filters = ['product', 'categor', 'brand', 'shop', 'cart', 'order', 'sale', 'banner', 'theme', 'review', 'news', 'post', 'setting', 'currenc', 'unit', 'tax'];
  const matched = names.filter(n => filters.some(f => n.toLowerCase().includes(f)));
  console.log('Matched tables count:', matched.length);
  console.log('Matched tables:', matched.sort());

  // Check counts of key tables
  const testTables = [
    'aura_products',
    'aura_categories',
    'aura_brands',
    'aura_units',
    'aura_currencies',
    'aura_shop_settings',
    'aura_settings',
    'aura_cart',
    'aura_wishlist',
    'aura_sales',
    'aura_sale_items',
    'aura_sales_order',
    'aura_sale_order_items',
    'aura_theme_settings',
    'aura_theme_banners',
    'aura_theme_reviews',
    'aura_theme_newsletter',
    'aura_theme_contact_messages',
    'aura_theme_posts',
    'aura_pages',
    'aura_menu'
  ];

  console.log('\n--- Key Tables Check ---');
  for (const t of testTables) {
    if (names.includes(t)) {
      try {
        const [cnt] = await db.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
        console.log(`[EXISTS] ${t}: ${cnt[0].cnt} rows`);
      } catch (err) {
        console.log(`[ERROR] ${t}: ${err.message}`);
      }
    } else {
      console.log(`[MISSING] ${t}`);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
