-- migrations/20261024_barcode_label_system.sql
-- Barcode Label System Migration (Up)

-- 1. Ensure aura_products has required fields: sku, barcode, barcode_type, sale_price, brand_id, created_at, updated_at
-- (We use safe dynamic procedures or IF NOT EXISTS checks)

-- Add sku column if not exists
SET @exist_sku := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_products' AND COLUMN_NAME = 'sku');
SET @sql_sku := IF(@exist_sku = 0, 'ALTER TABLE aura_products ADD COLUMN sku VARCHAR(100) NULL AFTER item_code', 'SELECT "sku already exists"');
PREPARE stmt FROM @sql_sku;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add barcode column if not exists
SET @exist_barcode := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_products' AND COLUMN_NAME = 'barcode');
SET @sql_barcode := IF(@exist_barcode = 0, 'ALTER TABLE aura_products ADD COLUMN barcode VARCHAR(100) NULL AFTER code', 'SELECT "barcode already exists"');
PREPARE stmt FROM @sql_barcode;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add barcode_type column if not exists
SET @exist_barcode_type := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_products' AND COLUMN_NAME = 'barcode_type');
SET @sql_barcode_type := IF(@exist_barcode_type = 0, 'ALTER TABLE aura_products ADD COLUMN barcode_type VARCHAR(50) DEFAULT "CODE128" AFTER barcode_symbology', 'SELECT "barcode_type already exists"');
PREPARE stmt FROM @sql_barcode_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add sale_price column if not exists
SET @exist_sale_price := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_products' AND COLUMN_NAME = 'sale_price');
SET @sql_sale_price := IF(@exist_sale_price = 0, 'ALTER TABLE aura_products ADD COLUMN sale_price DECIMAL(25,4) NULL AFTER promo_price', 'SELECT "sale_price already exists"');
PREPARE stmt FROM @sql_sale_price;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add brand_id column if not exists
SET @exist_brand_id := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_products' AND COLUMN_NAME = 'brand_id');
SET @sql_brand_id := IF(@exist_brand_id = 0, 'ALTER TABLE aura_products ADD COLUMN brand_id INT NULL AFTER brand', 'SELECT "brand_id already exists"');
PREPARE stmt FROM @sql_brand_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add created_at column if not exists
SET @exist_created_at := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_products' AND COLUMN_NAME = 'created_at');
SET @sql_created_at := IF(@exist_created_at = 0, 'ALTER TABLE aura_products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'SELECT "created_at already exists"');
PREPARE stmt FROM @sql_created_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add updated_at column if not exists
SET @exist_updated_at := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_products' AND COLUMN_NAME = 'updated_at');
SET @sql_updated_at := IF(@exist_updated_at = 0, 'ALTER TABLE aura_products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT "updated_at already exists"');
PREPARE stmt FROM @sql_updated_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on barcode if not exists
SET @exist_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_products' AND INDEX_NAME = 'idx_aura_products_barcode');
SET @sql_idx := IF(@exist_idx = 0, 'CREATE INDEX idx_aura_products_barcode ON aura_products (barcode)', 'SELECT "idx already exists"');
PREPARE stmt FROM @sql_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill data from existing columns
UPDATE aura_products SET barcode = code WHERE barcode IS NULL OR barcode = '';
UPDATE aura_products SET sku = COALESCE(item_code, code) WHERE sku IS NULL OR sku = '';
UPDATE aura_products SET barcode_type = UPPER(COALESCE(barcode_symbology, 'CODE128')) WHERE barcode_type IS NULL OR barcode_type = '';
UPDATE aura_products SET sale_price = promo_price WHERE sale_price IS NULL AND promo_price IS NOT NULL;
UPDATE aura_products SET brand_id = brand WHERE brand_id IS NULL AND brand IS NOT NULL;

-- 2. Create table barcode_print_logs
CREATE TABLE IF NOT EXISTS `barcode_print_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `label_size` VARCHAR(50) NOT NULL DEFAULT '50x30',
  `barcode_type` VARCHAR(50) NOT NULL DEFAULT 'CODE128',
  `template` VARCHAR(100) NOT NULL DEFAULT 'standard',
  `printed_by` INT NOT NULL DEFAULT 1,
  `printed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bpl_product_id` (`product_id`),
  INDEX `idx_bpl_printed_at` (`printed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create table barcode_label_templates
CREATE TABLE IF NOT EXISTS `barcode_label_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `width_mm` DECIMAL(8,2) NOT NULL DEFAULT 50.00,
  `height_mm` DECIMAL(8,2) NOT NULL DEFAULT 30.00,
  `columns` INT NOT NULL DEFAULT 1,
  `show_name` TINYINT(1) NOT NULL DEFAULT 1,
  `show_price` TINYINT(1) NOT NULL DEFAULT 1,
  `show_sku` TINYINT(1) NOT NULL DEFAULT 1,
  `show_barcode_text` TINYINT(1) NOT NULL DEFAULT 1,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_blt_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Seed initial templates
INSERT INTO `barcode_label_templates` (`name`, `width_mm`, `height_mm`, `columns`, `show_name`, `show_price`, `show_sku`, `show_barcode_text`, `is_default`)
SELECT * FROM (
  SELECT '50x30mm Thermal Roll (Standard)' AS name, 50.00 AS width_mm, 30.00 AS height_mm, 1 AS columns, 1 AS show_name, 1 AS show_price, 1 AS show_sku, 1 AS show_barcode_text, 1 AS is_default
  UNION ALL
  SELECT '40x25mm Compact Roll', 40.00, 25.00, 1, 1, 1, 0, 1, 0
  UNION ALL
  SELECT '24 per Sheet (A4 3x8, 70x37mm)', 70.00, 37.00, 3, 1, 1, 1, 1, 0
  UNION ALL
  SELECT '40 per Sheet (A4 4x10, 48.5x25.4mm)', 48.50, 25.40, 4, 1, 1, 0, 1, 0
  UNION ALL
  SELECT 'Shelf Edge Tag (95x38mm)', 95.00, 38.00, 2, 1, 1, 1, 1, 0
  UNION ALL
  SELECT 'Jewellery Butterfly Tag (80x25mm)', 80.00, 25.00, 1, 1, 1, 1, 0, 0
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM `barcode_label_templates` LIMIT 1);

-- 5. Create a view products if not exists
CREATE OR REPLACE VIEW `products` AS SELECT * FROM `aura_products`;
