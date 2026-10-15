const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function exportSql() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  let sql = '-- ==========================================================================\n';
  sql += '-- 003_alibaba_b2b_products_stores.sql\n';
  sql += '-- High-demand B2B Alibaba wholesale products, verified suppliers, and categories\n';
  sql += '-- ==========================================================================\n\n';

  // Categories
  const [cats] = await pool.query('SELECT id, code, name, slug, description FROM aura_categories WHERE id >= 201 AND id <= 205');
  sql += '-- 1. B2B Alibaba Categories\n';
  for (const c of cats) {
    sql += `INSERT INTO aura_categories (id, code, name, slug, description) VALUES (${c.id}, ${pool.escape(c.code)}, ${pool.escape(c.name)}, ${pool.escape(c.slug)}, ${pool.escape(c.description)}) ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug);\n`;
  }
  sql += '\n';

  // Stores
  const [comps] = await pool.query('SELECT id, name, company, city, phone, email, slug, rating, logo, banner, address FROM aura_companies WHERE id >= 301 AND id <= 305');
  sql += '-- 2. B2B Alibaba Verified Suppliers & Stores\n';
  for (const s of comps) {
    sql += `INSERT INTO aura_companies (id, group_id, group_name, name, company, city, phone, email, slug, rating, logo, banner, address, is_active) VALUES (${s.id}, 1, 'biller', ${pool.escape(s.name)}, ${pool.escape(s.company)}, ${pool.escape(s.city)}, ${pool.escape(s.phone)}, ${pool.escape(s.email)}, ${pool.escape(s.slug)}, ${s.rating}, ${pool.escape(s.logo)}, ${pool.escape(s.banner)}, ${pool.escape(s.address)}, 1) ON DUPLICATE KEY UPDATE name=VALUES(name), company=VALUES(company);\n`;
  }
  sql += '\n';

  // Products
  const [prods] = await pool.query('SELECT id, code, name, price, cost, category_id, biller_id, image, slug, brand, featured FROM aura_products WHERE id >= 401 AND id <= 430');
  sql += '-- 3. B2B Alibaba Wholesale Products & Stocks\n';
  for (const p of prods) {
    sql += `INSERT INTO aura_products (id, code, name, price, cost, category_id, biller_id, image, slug, brand, featured) VALUES (${p.id}, ${pool.escape(p.code)}, ${pool.escape(p.name)}, ${p.price}, ${p.cost}, ${p.category_id}, ${p.biller_id}, ${pool.escape(p.image)}, ${pool.escape(p.slug)}, ${pool.escape(p.brand)}, ${p.featured}) ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price);\n`;
    sql += `INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost) VALUES (${p.id}, 1, 50, ${p.cost}) ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);\n`;
  }
  sql += '\n';

  // Banners
  const [bans] = await pool.query('SELECT id, position, title, subtitle, image, badge, coupon_code, status FROM aura_theme_banners WHERE id IN (5, 6)');
  sql += '-- 4. Promo Banners\n';
  for (const b of bans) {
    sql += `INSERT INTO aura_theme_banners (id, position, title, subtitle, image, badge, coupon_code, status) VALUES (${b.id}, ${pool.escape(b.position)}, ${pool.escape(b.title)}, ${pool.escape(b.subtitle)}, ${pool.escape(b.image)}, ${pool.escape(b.badge)}, ${pool.escape(b.coupon_code)}, ${b.status}) ON DUPLICATE KEY UPDATE title=VALUES(title);\n`;
  }

  fs.writeFileSync('./migrations/003_alibaba_b2b_products_stores.sql', sql);
  console.log('Successfully generated migrations/003_alibaba_b2b_products_stores.sql');
  await pool.end();
}

exportSql().catch(console.error);
