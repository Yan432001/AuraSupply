const pool = require('../API/app/config/dbPool');

async function runDirectMigration() {
  console.log('--- DIRECT BARCODE MIGRATION START ---');

  // Helper to check if column exists
  async function hasColumn(table, column) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    return rows[0].count > 0;
  }

  // Helper to check if index exists
  async function hasIndex(table, indexName) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count FROM information_schema.STATISTICS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
      [table, indexName]
    );
    return rows[0].count > 0;
  }

  // 1. Column alterations on aura_products
  console.log('1. Checking & updating aura_products columns...');
  if (!await hasColumn('aura_products', 'sku')) {
    await pool.query('ALTER TABLE aura_products ADD COLUMN sku VARCHAR(100) NULL AFTER item_code');
    console.log('  + Added column `sku`');
  }
  if (!await hasColumn('aura_products', 'barcode')) {
    await pool.query('ALTER TABLE aura_products ADD COLUMN barcode VARCHAR(100) NULL AFTER code');
    console.log('  + Added column `barcode`');
  }
  if (!await hasColumn('aura_products', 'barcode_type')) {
    await pool.query('ALTER TABLE aura_products ADD COLUMN barcode_type VARCHAR(50) DEFAULT "CODE128" AFTER barcode_symbology');
    console.log('  + Added column `barcode_type`');
  }
  if (!await hasColumn('aura_products', 'sale_price')) {
    await pool.query('ALTER TABLE aura_products ADD COLUMN sale_price DECIMAL(25,4) NULL AFTER promo_price');
    console.log('  + Added column `sale_price`');
  }
  if (!await hasColumn('aura_products', 'brand_id')) {
    await pool.query('ALTER TABLE aura_products ADD COLUMN brand_id INT NULL AFTER brand');
    console.log('  + Added column `brand_id`');
  }
  if (!await hasColumn('aura_products', 'created_at')) {
    await pool.query('ALTER TABLE aura_products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    console.log('  + Added column `created_at`');
  }
  if (!await hasColumn('aura_products', 'updated_at')) {
    await pool.query('ALTER TABLE aura_products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    console.log('  + Added column `updated_at`');
  }

  if (!await hasIndex('aura_products', 'idx_aura_products_barcode')) {
    try {
      await pool.query('CREATE INDEX idx_aura_products_barcode ON aura_products (barcode)');
      console.log('  + Created index on `barcode`');
    } catch (e) {
      console.warn('  - Index note:', e.message);
    }
  }

  // 2. Data backfill / synchronization
  console.log('2. Synchronizing existing data to new columns...');
  await pool.query('UPDATE aura_products SET barcode = code WHERE barcode IS NULL OR barcode = ""');
  await pool.query('UPDATE aura_products SET sku = COALESCE(item_code, code) WHERE sku IS NULL OR sku = ""');
  await pool.query('UPDATE aura_products SET barcode_type = UPPER(COALESCE(barcode_symbology, "CODE128")) WHERE barcode_type IS NULL OR barcode_type = ""');
  await pool.query('UPDATE aura_products SET sale_price = promo_price WHERE sale_price IS NULL AND promo_price IS NOT NULL');
  await pool.query('UPDATE aura_products SET brand_id = brand WHERE brand_id IS NULL AND brand IS NOT NULL');
  console.log('  + Data synchronized successfully');

  // 3. Create table barcode_print_logs
  console.log('3. Creating table `barcode_print_logs`...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`barcode_print_logs\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`product_id\` INT NOT NULL,
      \`quantity\` INT NOT NULL DEFAULT 1,
      \`label_size\` VARCHAR(50) NOT NULL DEFAULT '50x30',
      \`barcode_type\` VARCHAR(50) NOT NULL DEFAULT 'CODE128',
      \`template\` VARCHAR(100) NOT NULL DEFAULT 'standard',
      \`printed_by\` INT NOT NULL DEFAULT 1,
      \`printed_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_bpl_product_id\` (\`product_id\`),
      INDEX \`idx_bpl_printed_at\` (\`printed_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  + `barcode_print_logs` created / verified');

  // 4. Create table barcode_label_templates
  console.log('4. Creating table `barcode_label_templates`...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`barcode_label_templates\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(100) NOT NULL,
      \`width_mm\` DECIMAL(8,2) NOT NULL DEFAULT 50.00,
      \`height_mm\` DECIMAL(8,2) NOT NULL DEFAULT 30.00,
      \`columns\` INT NOT NULL DEFAULT 1,
      \`show_name\` TINYINT(1) NOT NULL DEFAULT 1,
      \`show_price\` TINYINT(1) NOT NULL DEFAULT 1,
      \`show_sku\` TINYINT(1) NOT NULL DEFAULT 1,
      \`show_barcode_text\` TINYINT(1) NOT NULL DEFAULT 1,
      \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_blt_is_default\` (\`is_default\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  + `barcode_label_templates` created / verified');

  // 5. Seed templates if empty
  const [existingTemplates] = await pool.query('SELECT COUNT(*) as count FROM barcode_label_templates');
  if (existingTemplates[0].count === 0) {
    console.log('5. Seeding default barcode label templates...');
    await pool.query(`
      INSERT INTO \`barcode_label_templates\` (\`name\`, \`width_mm\`, \`height_mm\`, \`columns\`, \`show_name\`, \`show_price\`, \`show_sku\`, \`show_barcode_text\`, \`is_default\`)
      VALUES
      ('50x30mm Thermal Roll (Standard)', 50.00, 30.00, 1, 1, 1, 1, 1, 1),
      ('40x25mm Compact Roll', 40.00, 25.00, 1, 1, 1, 0, 1, 0),
      ('24 per Sheet (A4 3x8, 70x37mm)', 70.00, 37.00, 3, 1, 1, 1, 1, 0),
      ('40 per Sheet (A4 4x10, 48.5x25.4mm)', 48.50, 25.40, 4, 1, 1, 0, 1, 0),
      ('Shelf Edge Tag (95x38mm)', 95.00, 38.00, 2, 1, 1, 1, 1, 0),
      ('Jewellery Butterfly Tag (80x25mm)', 80.00, 25.00, 1, 1, 1, 1, 0, 0)
    `);
    console.log('  + Templates seeded');
  }

  // 6. Create view `products`
  console.log('6. Creating view `products` pointing to `aura_products`...');
  await pool.query('CREATE OR REPLACE VIEW `products` AS SELECT * FROM `aura_products`');
  console.log('  + View `products` ready');

  // Verification summary
  const [logs] = await pool.query('SELECT COUNT(*) AS count FROM barcode_print_logs');
  const [templates] = await pool.query('SELECT id, name, width_mm, height_mm, is_default FROM barcode_label_templates');
  const [sampleProds] = await pool.query('SELECT id, name, sku, barcode, barcode_type, price, sale_price FROM products LIMIT 2');

  console.log('\n--- VERIFICATION RESULT ---');
  console.log('Log count:', logs[0].count);
  console.log('Templates count:', templates.length);
  console.log('Sample products from view:', sampleProds);
  console.log('--- DIRECT BARCODE MIGRATION COMPLETED SUCCESSFULLY ---');
}

runDirectMigration().catch(console.error);
