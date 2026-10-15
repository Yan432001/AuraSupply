const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aura_v1_db',
  });

  console.log('\n============================================================');
  console.log('       AURA ERP & THEME - REAL DATABASE TABLE INSPECTION    ');
  console.log('============================================================\n');

  // 1. PRODUCTS
  const [products] = await pool.query(
    'SELECT id, name, code, price, category_id, brand, featured, slug FROM aura_products ORDER BY id DESC LIMIT 5'
  );
  console.log('1. TABLE: aura_products (Total: ' + (await pool.query('SELECT COUNT(*) as c FROM aura_products'))[0][0].c + ' rows)');
  console.table(products);

  // 2. CATEGORIES
  const [categories] = await pool.query(
    'SELECT id, code, name, slug FROM aura_categories LIMIT 5'
  );
  console.log('2. TABLE: aura_categories (Total: ' + (await pool.query('SELECT COUNT(*) as c FROM aura_categories'))[0][0].c + ' rows)');
  console.table(categories);

  // 3. SHOPS / BILLERS
  const [shops] = await pool.query(
    "SELECT id, name, company, phone, email, group_name FROM aura_companies WHERE group_name = 'biller' LIMIT 5"
  );
  console.log('3. TABLE: aura_companies (Billers/Shops: ' + (await pool.query("SELECT COUNT(*) as c FROM aura_companies WHERE group_name = 'biller'"))[0][0].c + ' rows)');
  console.table(shops);

  // 4. BANNERS
  const [banners] = await pool.query(
    'SELECT id, title, subtitle, image, status, badge, coupon_code FROM aura_theme_banners LIMIT 5'
  );
  console.log('4. TABLE: aura_theme_banners (Total: ' + (await pool.query('SELECT COUNT(*) as c FROM aura_theme_banners'))[0][0].c + ' rows)');
  console.table(banners);

  // 5. REVIEWS
  const [reviews] = await pool.query(
    'SELECT id, product_id, name, rating, comment FROM aura_theme_reviews LIMIT 5'
  );
  console.log('5. TABLE: aura_theme_reviews (Total: ' + (await pool.query('SELECT COUNT(*) as c FROM aura_theme_reviews'))[0][0].c + ' rows)');
  console.table(reviews);

  // 6. BLOG POSTS
  const [posts] = await pool.query(
    'SELECT id, title, category, author, status FROM aura_theme_posts LIMIT 5'
  );
  console.log('6. TABLE: aura_theme_posts (Total: ' + (await pool.query('SELECT COUNT(*) as c FROM aura_theme_posts'))[0][0].c + ' rows)');
  console.table(posts);

  await pool.end();
}

main().catch(err => {
  console.error('Error running inspection:', err);
  process.exit(1);
});
