-- ==============================================================================
-- AURA INVENTORY & VARIANT SYSTEM MIGRATION SCRIPT
-- Safe, non-destructive upgrade for existing AURA_v1 databases
-- ==============================================================================

-- 1. Create Reusable Product Attributes Table
CREATE TABLE IF NOT EXISTS `aura_attributes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_attribute_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create Reusable Attribute Values Table
CREATE TABLE IF NOT EXISTS `aura_attribute_values` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attribute_id` int NOT NULL,
  `value` varchar(100) NOT NULL,
  `color_code` varchar(25) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_attr_val` (`attribute_id`, `value`),
  KEY `idx_attribute_id` (`attribute_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create Product Variant Attribute Values Junction Table
CREATE TABLE IF NOT EXISTS `aura_product_variant_values` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `variant_id` int NOT NULL,
  `attribute_id` int NOT NULL,
  `attribute_value_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_var_attr` (`variant_id`, `attribute_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_variant_id` (`variant_id`),
  KEY `idx_attribute_id` (`attribute_id`),
  KEY `idx_attr_val_id` (`attribute_value_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Extend aura_product_variants Table with SKU, Barcode, Image, Attributes JSON, Status & Timestamps
-- (Uses stored procedure or safe checks to prevent duplicate column addition)
DROP PROCEDURE IF EXISTS upgrade_aura_product_variants;
DELIMITER $$
CREATE PROCEDURE upgrade_aura_product_variants()
BEGIN
  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_product_variants' AND COLUMN_NAME = 'sku') THEN
    ALTER TABLE `aura_product_variants` ADD COLUMN `sku` varchar(100) NULL AFTER `name`;
    ALTER TABLE `aura_product_variants` ADD INDEX `idx_variant_sku` (`sku`);
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_product_variants' AND COLUMN_NAME = 'barcode') THEN
    ALTER TABLE `aura_product_variants` ADD COLUMN `barcode` varchar(100) NULL AFTER `sku`;
    ALTER TABLE `aura_product_variants` ADD INDEX `idx_variant_barcode` (`barcode`);
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_product_variants' AND COLUMN_NAME = 'image') THEN
    ALTER TABLE `aura_product_variants` ADD COLUMN `image` varchar(255) NULL AFTER `barcode`;
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_product_variants' AND COLUMN_NAME = 'attributes') THEN
    ALTER TABLE `aura_product_variants` ADD COLUMN `attributes` text NULL AFTER `image`;
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_product_variants' AND COLUMN_NAME = 'status') THEN
    ALTER TABLE `aura_product_variants` ADD COLUMN `status` tinyint(1) DEFAULT 1 AFTER `attributes`;
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_product_variants' AND COLUMN_NAME = 'created_at') THEN
    ALTER TABLE `aura_product_variants` ADD COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_product_variants' AND COLUMN_NAME = 'updated_at') THEN
    ALTER TABLE `aura_product_variants` ADD COLUMN `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
  END IF;
END$$
DELIMITER ;
CALL upgrade_aura_product_variants();
DROP PROCEDURE IF EXISTS upgrade_aura_product_variants;

-- 5. Seed Core Standard Attributes & Attribute Values
INSERT INTO `aura_attributes` (`id`, `name`, `code`) VALUES
(1, 'Color', 'color'),
(2, 'Size', 'size'),
(3, 'Material', 'material')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `aura_attribute_values` (`attribute_id`, `value`, `color_code`, `sort_order`) VALUES
(1, 'Red', '#ef4444', 0),
(1, 'Blue', '#3b82f6', 1),
(1, 'Black', '#1e293b', 2),
(1, 'White', '#ffffff', 3),
(1, 'Green', '#10b981', 4),
(2, 'Small (S)', NULL, 0),
(2, 'Medium (M)', NULL, 1),
(2, 'Large (L)', NULL, 2),
(2, 'XL', NULL, 3),
(2, 'Size 40', NULL, 4),
(2, 'Size 41', NULL, 5),
(2, 'Size 42', NULL, 6),
(3, 'Cotton', NULL, 0),
(3, 'Leather', NULL, 1),
(3, 'Polyester', NULL, 2),
(3, 'Stainless Steel', NULL, 3)
ON DUPLICATE KEY UPDATE `color_code` = VALUES(`color_code`), `sort_order` = VALUES(`sort_order`);
