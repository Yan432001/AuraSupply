const fs = require('fs');
const path = require('path');
const { db } = require('../API/app/config/utill/helper');

async function runMigration() {
  const file = path.resolve(__dirname, '../migrations/001_auratheme_support.sql');
  const sql = fs.readFileSync(file, 'utf8');

  // Split on DELIMITER statements or standard semicolons
  // First, handle the procedure separately
  try {
    await db.query(`DROP PROCEDURE IF EXISTS \`aura_add_column\``);
    await db.query(`
      CREATE PROCEDURE \`aura_add_column\`(
        IN t VARCHAR(64),
        IN c VARCHAR(64),
        IN def VARCHAR(255)
      )
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = t AND COLUMN_NAME = c
        ) THEN
          SET @s = CONCAT('ALTER TABLE \`', t, '\` ADD COLUMN \`', c, '\` ', def);
          PREPARE st FROM @s;
          EXECUTE st;
          DEALLOCATE PREPARE st;
        END IF;
      END
    `);
    console.log('Stored procedure aura_add_column verified!');
  } catch (err) {
    console.warn('Procedure error:', err.message);
  }

  // Next, run table creates
  const tables = [
    `CREATE TABLE IF NOT EXISTS \`aura_theme_settings\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`biller_id\` INT NULL DEFAULT 1,
      \`setting_key\` VARCHAR(100) NOT NULL,
      \`setting_value\` LONGTEXT NULL,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`idx_theme_setting_key_biller\` (\`setting_key\`, \`biller_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`aura_theme_banners\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`biller_id\` INT NULL DEFAULT 1,
      \`position\` VARCHAR(50) NOT NULL DEFAULT 'home_slider',
      \`title\` VARCHAR(255) NOT NULL,
      \`subtitle\` VARCHAR(255) NULL,
      \`image\` VARCHAR(500) NOT NULL,
      \`link_url\` VARCHAR(255) NULL,
      \`button_text\` VARCHAR(50) NULL DEFAULT 'Shop Now',
      \`sort_order\` INT NOT NULL DEFAULT 0,
      \`badge\` VARCHAR(100) NULL,
      \`badge_color\` VARCHAR(30) NULL,
      \`badge_bg\` VARCHAR(60) NULL,
      \`coupon_code\` VARCHAR(50) NULL,
      \`original_price\` DECIMAL(15, 2) NULL,
      \`promo_price\` DECIMAL(15, 2) NULL,
      \`savings\` VARCHAR(50) NULL,
      \`valid_until\` VARCHAR(100) NULL,
      \`accent_color\` VARCHAR(30) NULL,
      \`overlay_gradient\` VARCHAR(255) NULL,
      \`start_date\` DATETIME NULL,
      \`end_date\` DATETIME NULL,
      \`status\` TINYINT(1) NOT NULL DEFAULT 1,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_theme_banner_pos_status\` (\`position\`, \`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`aura_theme_reviews\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`product_id\` INT NOT NULL,
      \`customer_id\` INT NULL,
      \`name\` VARCHAR(100) NOT NULL,
      \`rating\` DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
      \`title\` VARCHAR(255) NULL,
      \`comment\` TEXT NOT NULL,
      \`status\` TINYINT(1) NOT NULL DEFAULT 1,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_theme_reviews_prod_status\` (\`product_id\`, \`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`aura_theme_newsletter\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`email\` VARCHAR(191) NOT NULL,
      \`status\` TINYINT(1) NOT NULL DEFAULT 1,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`idx_theme_newsletter_email\` (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`aura_theme_contact_messages\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`name\` VARCHAR(100) NOT NULL,
      \`email\` VARCHAR(191) NOT NULL,
      \`phone\` VARCHAR(50) NULL,
      \`subject\` VARCHAR(255) NULL,
      \`message\` TEXT NOT NULL,
      \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_theme_contact_created\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`aura_theme_posts\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`biller_id\` INT NULL DEFAULT 1,
      \`title\` VARCHAR(255) NOT NULL,
      \`slug\` VARCHAR(191) NOT NULL,
      \`category\` VARCHAR(100) NULL DEFAULT 'General',
      \`author\` VARCHAR(100) NULL DEFAULT 'Aura Editorial',
      \`excerpt\` TEXT NULL,
      \`body\` LONGTEXT NOT NULL,
      \`image\` VARCHAR(500) NULL,
      \`views\` INT NOT NULL DEFAULT 0,
      \`badge\` VARCHAR(50) NULL,
      \`duration\` VARCHAR(50) NULL,
      \`status\` VARCHAR(20) NOT NULL DEFAULT 'published',
      \`published_at\` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`idx_theme_posts_slug\` (\`slug\`),
      KEY \`idx_theme_posts_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  ];

  for (const sql of tables) {
    try {
      await db.query(sql);
      console.log('Executed table create successfully.');
    } catch (e) {
      console.warn('Table create notice:', e.message);
    }
  }

  // Next, run column additions
  const calls = [
    `CALL aura_add_column('aura_theme_banners', 'badge', 'VARCHAR(100) NULL')`,
    `CALL aura_add_column('aura_theme_banners', 'badge_color', 'VARCHAR(30) NULL')`,
    `CALL aura_add_column('aura_theme_banners', 'badge_bg', 'VARCHAR(60) NULL')`,
    `CALL aura_add_column('aura_theme_banners', 'coupon_code', 'VARCHAR(50) NULL')`,
    `CALL aura_add_column('aura_theme_banners', 'original_price', 'DECIMAL(15, 2) NULL')`,
    `CALL aura_add_column('aura_theme_banners', 'promo_price', 'DECIMAL(15, 2) NULL')`,
    `CALL aura_add_column('aura_theme_banners', 'savings', 'VARCHAR(50) NULL')`,
    `CALL aura_add_column('aura_theme_banners', 'valid_until', 'VARCHAR(100) NULL')`,
    `CALL aura_add_column('aura_theme_banners', 'accent_color', 'VARCHAR(30) NULL')`,
    `CALL aura_add_column('aura_theme_banners', 'overlay_gradient', 'VARCHAR(255) NULL')`,

    `CALL aura_add_column('aura_products', 'rating', 'DECIMAL(3, 2) NOT NULL DEFAULT 5.00')`,
    `CALL aura_add_column('aura_products', 'reviews_count', 'INT NOT NULL DEFAULT 0')`,
    `CALL aura_add_column('aura_products', 'moq', 'INT NOT NULL DEFAULT 1')`,
    `CALL aura_add_column('aura_products', 'featured', 'TINYINT(1) NOT NULL DEFAULT 0')`,
    `CALL aura_add_column('aura_products', 'slug', 'VARCHAR(191) NULL')`,

    `CALL aura_add_column('aura_companies', 'tagline', 'VARCHAR(255) NULL')`,
    `CALL aura_add_column('aura_companies', 'rating', 'DECIMAL(3, 2) NOT NULL DEFAULT 4.90')`,
    `CALL aura_add_column('aura_companies', 'reviews_count', 'INT NOT NULL DEFAULT 120')`,
    `CALL aura_add_column('aura_companies', 'operating_hours', 'VARCHAR(100) NULL')`,
    `CALL aura_add_column('aura_companies', 'slug', 'VARCHAR(100) NULL')`,
    `CALL aura_add_column('aura_companies', 'logo', 'VARCHAR(500) NULL')`,
    `CALL aura_add_column('aura_companies', 'banner', 'VARCHAR(500) NULL')`,
    `CALL aura_add_column('aura_companies', 'theme_color', 'VARCHAR(30) NULL')`
  ];

  for (const c of calls) {
    try {
      await db.query(c);
      console.log('Executed:', c);
    } catch (e) {
      console.warn('Call notice:', c, e.message);
    }
  }

  console.log('Migration 001_auratheme_support.sql executed successfully!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Fatal error running migration:', err);
  process.exit(1);
});
