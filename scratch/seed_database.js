const fs = require('fs');
const path = require('path');
const { db } = require('../API/app/config/utill/helper');
const rawSimpleData = require('../data/simpleData');
const simpleData = rawSimpleData.default || rawSimpleData;

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

async function main() {
  console.log('[Seed] Starting database seeding from simpleData...');
  const sqlStatements = [];
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- Migration: seed_test_data.sql');
  sqlStatements.push('-- Description: Minimal & Comprehensive Seed Data for AuraTheme');
  sqlStatements.push('-- ============================================================================\n');

  // Store ID mapping: simpleData store id -> aura_companies id
  const storeIdToCompanyId = {};

  // 1. SEED STORES / BILLERS in aura_companies
  console.log(`[Seed] Processing ${simpleData.stores.length} stores...`);
  for (const store of simpleData.stores) {
    const isSbcStore = store.slug === 'sbc-store' || store.id === 1;

    let companyId;
    if (isSbcStore) {
      // Company 3 is the flagship biller
      companyId = 3;
      await db.query(`
        UPDATE aura_companies SET
          name = ?, company = ?, slug = ?, store_slug = ?, address = ?, phone = ?, email = ?,
          logo = ?, banner = ?, theme_color = ?, tagline = ?, rating = ?, operating_hours = ?,
          group_name = 'biller', is_active = 1, status = 1
        WHERE id = 3
      `, [
        store.name, store.company || store.name, store.slug, store.slug, store.address, store.phone, store.email,
        store.logo, store.banner, store.theme_color, store.tagline, store.rating || 4.90,
        store.operating_hours || '6:30 AM - 8:30 PM'
      ]);

      sqlStatements.push(`UPDATE \`aura_companies\` SET name = ${escapeSql(store.name)}, company = ${escapeSql(store.company || store.name)}, slug = ${escapeSql(store.slug)}, store_slug = ${escapeSql(store.slug)}, address = ${escapeSql(store.address)}, phone = ${escapeSql(store.phone)}, email = ${escapeSql(store.email)}, logo = ${escapeSql(store.logo)}, banner = ${escapeSql(store.banner)}, theme_color = ${escapeSql(store.theme_color)}, tagline = ${escapeSql(store.tagline)}, rating = ${escapeSql(store.rating || 4.90)}, operating_hours = ${escapeSql(store.operating_hours || '6:30 AM - 8:30 PM')}, group_name = 'biller', is_active = 1, status = 1 WHERE id = 3;`);
    } else {
      const [existing] = await db.query('SELECT id FROM aura_companies WHERE slug = ? OR store_slug = ? LIMIT 1', [store.slug, store.slug]);
      const code = `STORE-${store.slug.toUpperCase().slice(0, 8)}`;

      if (existing.length === 0) {
        const [res] = await db.query(`
          INSERT INTO aura_companies (
            group_id, group_name, code, name, company, slug, store_slug,
            address, phone, email, city, country, logo, banner, theme_color,
            currency_code, currency_symbol, tagline, rating, reviews_count,
            operating_hours, is_active, status, created_by
          ) VALUES (3, 'biller', ?, ?, ?, ?, ?, ?, ?, ?, 'Phnom Penh', 'Cambodia', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1)
        `, [
          code, store.name, store.company || store.name, store.slug, store.slug,
          store.address, store.phone, store.email, store.logo, store.banner, store.theme_color,
          store.currency_code || 'USD', store.currency_symbol || '$', store.tagline,
          store.rating || 4.80, 120, store.operating_hours || '8:00 AM - 9:00 PM'
        ]);
        companyId = res.insertId;
      } else {
        companyId = existing[0].id;
        await db.query(`
          UPDATE aura_companies SET
            name = ?, company = ?, slug = ?, store_slug = ?, address = ?, phone = ?, email = ?,
            logo = ?, banner = ?, theme_color = ?, tagline = ?, rating = ?, operating_hours = ?,
            group_name = 'biller', is_active = 1, status = 1
          WHERE id = ?
        `, [
          store.name, store.company || store.name, store.slug, store.slug, store.address, store.phone, store.email,
          store.logo, store.banner, store.theme_color, store.tagline, store.rating || 4.80,
          store.operating_hours || '8:00 AM - 9:00 PM', companyId
        ]);
      }

      sqlStatements.push(`INSERT INTO \`aura_companies\` (group_id, group_name, code, name, company, slug, store_slug, address, phone, email, city, country, logo, banner, theme_color, currency_code, currency_symbol, tagline, rating, reviews_count, operating_hours, is_active, status) VALUES (3, 'biller', ${escapeSql(code)}, ${escapeSql(store.name)}, ${escapeSql(store.company || store.name)}, ${escapeSql(store.slug)}, ${escapeSql(store.slug)}, ${escapeSql(store.address)}, ${escapeSql(store.phone)}, ${escapeSql(store.email)}, 'Phnom Penh', 'Cambodia', ${escapeSql(store.logo)}, ${escapeSql(store.banner)}, ${escapeSql(store.theme_color)}, ${escapeSql(store.currency_code || 'USD')}, ${escapeSql(store.currency_symbol || '$')}, ${escapeSql(store.tagline)}, ${escapeSql(store.rating || 4.80)}, 120, ${escapeSql(store.operating_hours || '8:00 AM - 9:00 PM')}, 1, 1) ON DUPLICATE KEY UPDATE name = VALUES(name), company = VALUES(company), logo = VALUES(logo), banner = VALUES(banner), theme_color = VALUES(theme_color), tagline = VALUES(tagline);`);
    }

    storeIdToCompanyId[store.id] = companyId;
    console.log(`  -> Store ${store.id} ("${store.slug}") linked to company id ${companyId}`);
  }

  // 2. SEED CATEGORIES in aura_categories
  console.log(`[Seed] Processing ${simpleData.categories.length} categories...`);
  for (const cat of simpleData.categories) {
    const code = cat.slug || `CAT-${cat.id}`;
    const [exist] = await db.query('SELECT id FROM aura_categories WHERE slug = ? LIMIT 1', [cat.slug]);

    let catId;
    if (exist.length === 0) {
      const [res] = await db.query(`
        INSERT INTO aura_categories (
          code, name, slug, description, order_number, status
        ) VALUES (?, ?, ?, ?, ?, 'show')
      `, [code, cat.name, cat.slug, cat.description || '', cat.order || cat.id]);
      catId = res.insertId;
    } else {
      catId = exist[0].id;
      await db.query(`
        UPDATE aura_categories SET
          name = ?, description = ?, status = 'show'
        WHERE id = ?
      `, [cat.name, cat.description || '', catId]);
    }

    sqlStatements.push(`INSERT INTO \`aura_categories\` (code, name, slug, description, order_number, status) VALUES (${escapeSql(code)}, ${escapeSql(cat.name)}, ${escapeSql(cat.slug)}, ${escapeSql(cat.description || '')}, ${escapeSql(cat.order || cat.id)}, 'show') ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);`);
  }

  // 3. SEED PRODUCTS in aura_products & aura_warehouses_products
  console.log(`[Seed] Processing ${simpleData.products.length} products...`);
  for (const prod of simpleData.products) {
    const slug = prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const code = prod.code || `PRD-${String(prod.id).padStart(4, '0')}`;
    const price = prod.price || 0;
    const rating = prod.rating || 5.0;
    const reviewsCount = prod.reviews_count || 12;
    const moq = prod.moq || 1;
    const featured = prod.featured ? 1 : 0;
    const details = prod.details || prod.name;
    const billerId = storeIdToCompanyId[prod.biller_id] || 3;
    const catId = prod.category_id || 1;

    const [exist] = await db.query('SELECT id FROM aura_products WHERE slug = ? OR code = ? LIMIT 1', [slug, code]);

    let prodId;
    if (exist.length === 0) {
      const [res] = await db.query(`
        INSERT INTO aura_products (
          code, name, slug, price, cost, currency, image, category_id, biller_id,
          unit, purchase_unit, sale_unit, quantity, details, product_details, type,
          status, featured, rating, reviews_count, moq, track_quantity
        ) VALUES (?, ?, ?, ?, 0, 'USD', ?, ?, ?, 1, 1, 1, 100, ?, ?, 'standard', 1, ?, ?, ?, ?, 1)
      `, [
        code, prod.name, slug, price, prod.image, catId, billerId,
        details, details, featured, rating, reviewsCount, moq
      ]);
      prodId = res.insertId;
    } else {
      prodId = exist[0].id;
      await db.query(`
        UPDATE aura_products SET
          name = ?, price = ?, image = ?, category_id = ?, biller_id = ?,
          details = ?, product_details = ?, featured = ?, rating = ?, reviews_count = ?,
          moq = ?, status = 1, quantity = 100
        WHERE id = ?
      `, [
        prod.name, price, prod.image, catId, billerId,
        details, details, featured, rating, reviewsCount, moq, prodId
      ]);
    }

    // Ensure warehouse stock in warehouse 1
    const [whExist] = await db.query('SELECT id FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = 1 LIMIT 1', [prodId]);
    if (whExist.length === 0) {
      await db.query(`
        INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost, qty_alert)
        VALUES (?, 1, 100, 0, 5)
      `, [prodId]);
    } else {
      await db.query(`
        UPDATE aura_warehouses_products SET quantity = 100 WHERE product_id = ? AND warehouse_id = 1
      `, [prodId]);
    }

    sqlStatements.push(`INSERT INTO \`aura_products\` (code, name, slug, price, cost, currency, image, category_id, biller_id, unit, purchase_unit, sale_unit, quantity, details, product_details, type, status, featured, rating, reviews_count, moq, track_quantity) VALUES (${escapeSql(code)}, ${escapeSql(prod.name)}, ${escapeSql(slug)}, ${escapeSql(price)}, 0, 'USD', ${escapeSql(prod.image)}, ${escapeSql(catId)}, ${escapeSql(billerId)}, 1, 1, 1, 100, ${escapeSql(details)}, ${escapeSql(details)}, 'standard', 1, ${escapeSql(featured)}, ${escapeSql(rating)}, ${escapeSql(reviewsCount)}, ${escapeSql(moq)}, 1) ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price), image = VALUES(image), category_id = VALUES(category_id), biller_id = VALUES(biller_id), details = VALUES(details), featured = VALUES(featured), rating = VALUES(rating), reviews_count = VALUES(reviews_count), moq = VALUES(moq);`);
    sqlStatements.push(`INSERT INTO \`aura_warehouses_products\` (product_id, warehouse_id, quantity, avg_cost, qty_alert) VALUES (${escapeSql(prodId)}, 1, 100, 0, 5) ON DUPLICATE KEY UPDATE quantity = 100;`);
  }

  // 4. SEED PROMOTIONAL BANNERS in aura_theme_banners
  console.log('[Seed] Seeding promotional banners...');
  const banners = [
    {
      id: 1,
      biller_id: 3,
      position: 'home_promo',
      title: 'Spanish Iced Latte & Almond Croissant',
      subtitle: 'Signature single-origin espresso with sweetened milk paired with flaky 84% butter pastry.',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      link_url: '/shop/sbc-store',
      button_text: 'Claim 25% Off Deal',
      badge: 'DAILY FLASH DEAL • 25% OFF',
      badge_color: '#ef4444',
      badge_bg: 'rgba(239, 68, 68, 0.95)',
      coupon_code: 'AURACOFFEE25',
      original_price: 12.25,
      promo_price: 8.99,
      savings: 'Save $3.26',
      valid_until: 'Today only until 3:00 PM',
      accent_color: '#2F6FED',
      sort_order: 1,
      status: 1
    },
    {
      id: 2,
      biller_id: storeIdToCompanyId[2] || 3,
      position: 'home_promo',
      title: 'Golden Viennoiserie & Sourdough Box',
      subtitle: 'Warm Normandy butter croissants, pain au chocolat, and rustic country sourdough loaves.',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      link_url: '/shop/aura-bakery',
      button_text: 'Claim Bakery Deal',
      badge: 'WEEKEND SPECIAL • BUY 1 GET 1 50% OFF',
      badge_color: '#f59e0b',
      badge_bg: 'rgba(245, 158, 11, 0.95)',
      coupon_code: 'BAKERY50',
      original_price: 18.50,
      promo_price: 12.75,
      savings: 'Save $5.75',
      valid_until: 'Fresh morning bake',
      accent_color: '#FF7A3D',
      sort_order: 2,
      status: 1
    },
    {
      id: 3,
      biller_id: storeIdToCompanyId[3] || 3,
      position: 'home_promo',
      title: 'Kyoto Uji Matcha Latte & Mochi Waffle',
      subtitle: 'First-harvest ceremonial matcha stone-ground in Uji, whisked fresh with oat milk.',
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
      link_url: '/shop/aura-lounge',
      button_text: 'Explore Matcha Deal',
      badge: 'CEREMONIAL SPECIAL • 20% OFF',
      badge_color: '#10b981',
      badge_bg: 'rgba(16, 185, 129, 0.95)',
      coupon_code: 'MATCHA20',
      original_price: 14.00,
      promo_price: 10.50,
      savings: 'Save $3.50',
      valid_until: 'Available daily 11am-8pm',
      accent_color: '#10b981',
      sort_order: 3,
      status: 1
    },
    {
      id: 4,
      biller_id: storeIdToCompanyId[4] || 3,
      position: 'home_promo',
      title: 'Wagyu Truffle Burger & Hand-Cut Fries',
      subtitle: 'Aged gruyère cheese, black truffle aioli, and caramelized balsamic onion jam on brioche.',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
      link_url: '/shop/aura-bistro',
      button_text: 'Order Bistro Combo',
      badge: "CHEF'S SPECIAL • $5 DISCOUNT",
      badge_color: '#8b5cf6',
      badge_bg: 'rgba(139, 92, 246, 0.95)',
      coupon_code: 'BISTROVIP',
      original_price: 19.50,
      promo_price: 14.50,
      savings: 'Save $5.00',
      valid_until: 'Dinner & lunch service',
      accent_color: '#8b5cf6',
      sort_order: 4,
      status: 1
    }
  ];

  for (const b of banners) {
    const [exist] = await db.query('SELECT id FROM aura_theme_banners WHERE id = ? LIMIT 1', [b.id]);
    if (exist.length === 0) {
      await db.query(`
        INSERT INTO aura_theme_banners (
          id, biller_id, position, title, subtitle, image, link_url, button_text,
          sort_order, badge, badge_color, badge_bg, coupon_code, original_price,
          promo_price, savings, valid_until, accent_color, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        b.id, b.biller_id, b.position, b.title, b.subtitle, b.image, b.link_url, b.button_text,
        b.sort_order, b.badge, b.badge_color, b.badge_bg, b.coupon_code, b.original_price,
        b.promo_price, b.savings, b.valid_until, b.accent_color
      ]);
    } else {
      await db.query(`
        UPDATE aura_theme_banners SET
          biller_id = ?, title = ?, subtitle = ?, image = ?, link_url = ?, button_text = ?,
          badge = ?, badge_color = ?, badge_bg = ?, coupon_code = ?,
          original_price = ?, promo_price = ?, savings = ?, valid_until = ?,
          accent_color = ?, status = 1
        WHERE id = ?
      `, [
        b.biller_id, b.title, b.subtitle, b.image, b.link_url, b.button_text,
        b.badge, b.badge_color, b.badge_bg, b.coupon_code,
        b.original_price, b.promo_price, b.savings, b.valid_until,
        b.accent_color, b.id
      ]);
    }

    sqlStatements.push(`INSERT INTO \`aura_theme_banners\` (id, biller_id, position, title, subtitle, image, link_url, button_text, sort_order, badge, badge_color, badge_bg, coupon_code, original_price, promo_price, savings, valid_until, accent_color, status) VALUES (${escapeSql(b.id)}, ${escapeSql(b.biller_id)}, ${escapeSql(b.position)}, ${escapeSql(b.title)}, ${escapeSql(b.subtitle)}, ${escapeSql(b.image)}, ${escapeSql(b.link_url)}, ${escapeSql(b.button_text)}, ${escapeSql(b.sort_order)}, ${escapeSql(b.badge)}, ${escapeSql(b.badge_color)}, ${escapeSql(b.badge_bg)}, ${escapeSql(b.coupon_code)}, ${escapeSql(b.original_price)}, ${escapeSql(b.promo_price)}, ${escapeSql(b.savings)}, ${escapeSql(b.valid_until)}, ${escapeSql(b.accent_color)}, 1) ON DUPLICATE KEY UPDATE title = VALUES(title), subtitle = VALUES(subtitle), image = VALUES(image), promo_price = VALUES(promo_price), coupon_code = VALUES(coupon_code);`);
  }

  // 5. SEED KNOWLEDGE BASE POSTS in aura_theme_posts
  console.log('[Seed] Seeding knowledge base articles in aura_theme_posts...');
  const posts = [
    {
      id: 1,
      title: 'B2B Procurement & Contract Sourcing',
      slug: 'b2b-procurement-contract-sourcing',
      category: 'Core Program',
      badge: 'Core Program',
      duration: '8 Modules • 4 Hours',
      excerpt: 'Master wholesale RFQs, volume tier pricing structures, payment escrow terms, and commercial dispute resolution.',
      body: 'Complete procurement guide for corporate supply managers. Covers verified factory audits, container freight logistics, proforma invoices, and payment escrow mechanisms.',
      author: 'Aura Trade Council'
    },
    {
      id: 2,
      title: 'Multi-Store Setup & Telegram E-Menu Dispatch',
      slug: 'multi-store-setup-telegram-emenu',
      category: 'E-Menu System',
      badge: 'E-Menu System',
      duration: '6 Modules • 2.5 Hours',
      excerpt: 'Step-by-step tutorial on @BotFather integration, table QR code setup, menu category tagging, and automated kitchen routing.',
      body: 'Deploy your Telegram Mini App contactless ordering in under 48 hours. Includes table QR generator, staff channel routing, and instant receipt printing setup.',
      author: 'Hospitality Tech Lead'
    },
    {
      id: 3,
      title: 'Factory Audits & ISO/HACCP Quality Compliance',
      slug: 'factory-audits-quality-compliance',
      category: 'Compliance',
      badge: 'Compliance',
      duration: '5 Modules • 3 Hours',
      excerpt: 'Guidelines for food safety certifications, direct-trade farm lot traceability, electronics warranty standards, and packaging integrity.',
      body: 'Comprehensive guide to international food safety and manufacturing standards, batch traceability, and pre-shipment quality inspection protocols.',
      author: 'Quality Assurance Board'
    },
    {
      id: 4,
      title: 'Cross-Border Freight & Customs IncoTerms',
      slug: 'cross-border-freight-customs-incoterms',
      category: 'Logistics',
      badge: 'Logistics',
      duration: '7 Modules • 3.5 Hours',
      excerpt: 'Understanding FOB vs CIF terms, overland transit between Cambodia and Thailand, port handling, and import tax clearance.',
      body: 'Practical guide to regional overland and port transit across Cambodia, Thailand, and Vietnam. Learn customs declarations, tax rates, and delivery logistics.',
      author: 'Regional Freight Directorate'
    },
    {
      id: 5,
      title: 'The Art of Pour-Over Coffee in Southeast Asia',
      slug: 'art-of-pour-over-coffee',
      category: 'Brewing Guide',
      badge: 'Brewing Guide',
      duration: '15 min read',
      excerpt: 'Discover the precise grind sizes, water temperatures, and filter techniques that bring out highland floral notes.',
      body: 'Exploring single-origin Arabica extraction methods, water chemistry, and bloom techniques that highlight natural floral and honey flavors.',
      author: 'Chantha Keo'
    }
  ];

  for (const p of posts) {
    const [exist] = await db.query('SELECT id FROM aura_theme_posts WHERE id = ? OR slug = ? LIMIT 1', [p.id, p.slug]);
    if (exist.length === 0) {
      await db.query(`
        INSERT INTO aura_theme_posts (
          id, biller_id, title, slug, category, badge, duration, excerpt, body, author, status
        ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
      `, [p.id, p.title, p.slug, p.category, p.badge, p.duration, p.excerpt, p.body, p.author]);
    } else {
      await db.query(`
        UPDATE aura_theme_posts SET
          title = ?, slug = ?, category = ?, badge = ?, duration = ?, excerpt = ?, body = ?, author = ?, status = 'published'
        WHERE id = ? OR slug = ?
      `, [p.title, p.slug, p.category, p.badge, p.duration, p.excerpt, p.body, p.author, p.id, p.slug]);
    }

    sqlStatements.push(`INSERT INTO \`aura_theme_posts\` (id, biller_id, title, slug, category, badge, duration, excerpt, body, author, status) VALUES (${escapeSql(p.id)}, 1, ${escapeSql(p.title)}, ${escapeSql(p.slug)}, ${escapeSql(p.category)}, ${escapeSql(p.badge)}, ${escapeSql(p.duration)}, ${escapeSql(p.excerpt)}, ${escapeSql(p.body)}, ${escapeSql(p.author)}, 'published') ON DUPLICATE KEY UPDATE title = VALUES(title), excerpt = VALUES(excerpt), body = VALUES(body);`);
  }

  // 6. SEED REVIEWS in aura_theme_reviews
  console.log('[Seed] Seeding sample customer reviews in aura_theme_reviews...');
  const [firstProds] = await db.query('SELECT id, name FROM aura_products LIMIT 6');
  const reviewTemplates = [
    { rating: 5.0, name: 'Sophea Sok', title: 'Outstanding Quality & Freshness', comment: 'Exceptional grade and direct-trade quality. Delivered fast in airtight packaging.' },
    { rating: 5.0, name: 'Jean-Luc Moreau', title: 'Top-tier Artisan Craftsmanship', comment: 'Flawless taste and consistent texture. One of the best we have procured for our business.' },
    { rating: 4.8, name: 'Vireak Chan', title: 'Highly Recommended for Commercial Supply', comment: 'Our customers love this product. Solid profit margin and dependable delivery schedule.' },
    { rating: 5.0, name: 'Dara Heng', title: 'Pure Excellence', comment: 'Smooth, vibrant and completely as described. Excellent customer service from the supplier.' },
    { rating: 4.9, name: 'Elena Rostova', title: 'Impressive Packaging & Flavor', comment: 'Carefully packaged with clear batch details and certifications. Will reorder wholesale.' },
    { rating: 4.8, name: 'Piseth Lim', title: 'Great Value for Bulk Orders', comment: 'Tier discounts made this a no-brainer for our monthly inventory replenishment.' }
  ];

  for (let i = 0; i < firstProds.length; i++) {
    const prod = firstProds[i];
    const rev = reviewTemplates[i % reviewTemplates.length];
    const [exist] = await db.query('SELECT id FROM aura_theme_reviews WHERE product_id = ? AND name = ? LIMIT 1', [prod.id, rev.name]);
    if (exist.length === 0) {
      await db.query(`
        INSERT INTO aura_theme_reviews (product_id, customer_id, name, rating, title, comment, status)
        VALUES (?, 1, ?, ?, ?, ?, 1)
      `, [prod.id, rev.name, rev.rating, rev.title, rev.comment]);
    }

    sqlStatements.push(`INSERT INTO \`aura_theme_reviews\` (product_id, customer_id, name, rating, title, comment, status) VALUES (${escapeSql(prod.id)}, 1, ${escapeSql(rev.name)}, ${escapeSql(rev.rating)}, ${escapeSql(rev.title)}, ${escapeSql(rev.comment)}, 1);`);
  }

  // 7. SEED STORE SETTINGS in aura_shop_settings & aura_theme_settings
  console.log('[Seed] Seeding storefront settings in aura_shop_settings & aura_theme_settings...');
  await db.query(`
    UPDATE aura_shop_settings SET
      shop_name = 'Aura Supply & Hospitality',
      description = 'B2B Wholesale Procurement, Direct-Trade Sourcing & Telegram E-Menu Platform',
      phone = '+855 12 345 678',
      email = 'procurement@auraglobal.com',
      facebook = 'https://facebook.com/aurasupply',
      twitter = 'https://twitter.com/aurasupply',
      instagram = 'https://instagram.com/aurasupply'
    WHERE id = 1
  `);

  const themeSettings = [
    { key: 'site_name', value: 'Aura Supply' },
    { key: 'site_tagline', value: 'B2B Wholesale Procurement & E-Menu Platform' },
    { key: 'contact_phone', value: '+855 12 345 678' },
    { key: 'contact_email', value: 'procurement@auraglobal.com' },
    { key: 'contact_address', value: 'No. 128 Norodom Blvd, Daun Penh, Phnom Penh' },
    { key: 'theme_primary_color', value: '#2F6FED' },
    { key: 'theme_accent_color', value: '#FF7A3D' },
    { key: 'currency_default', value: 'USD' }
  ];

  for (const s of themeSettings) {
    await db.query(`
      INSERT INTO aura_theme_settings (biller_id, setting_key, setting_value)
      VALUES (1, ?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [s.key, s.value]);

    sqlStatements.push(`INSERT INTO \`aura_theme_settings\` (biller_id, setting_key, setting_value) VALUES (1, ${escapeSql(s.key)}, ${escapeSql(s.value)}) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);`);
  }

  // 8. WRITE migrations/seed_test_data.sql
  const outPath = path.resolve(__dirname, '../migrations/seed_test_data.sql');
  fs.writeFileSync(outPath, sqlStatements.join('\n\n'), 'utf8');
  console.log(`[Seed] Successfully wrote ${sqlStatements.length} seed queries to ${outPath}!`);
  console.log('[Seed] Database seeding completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
