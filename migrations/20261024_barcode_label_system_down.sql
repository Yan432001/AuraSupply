-- migrations/20261024_barcode_label_system_down.sql
-- Barcode Label System Migration (Down / Rollback)

DROP VIEW IF EXISTS `products`;
DROP TABLE IF EXISTS `barcode_label_templates`;
DROP TABLE IF EXISTS `barcode_print_logs`;

-- (Columns added to aura_products are preserved or can be dropped if strictly necessary)
-- ALTER TABLE `aura_products` DROP COLUMN IF EXISTS `sku`;
-- ALTER TABLE `aura_products` DROP COLUMN IF EXISTS `barcode`;
-- ALTER TABLE `aura_products` DROP COLUMN IF EXISTS `barcode_type`;
-- ALTER TABLE `aura_products` DROP COLUMN IF EXISTS `sale_price`;
-- ALTER TABLE `aura_products` DROP COLUMN IF EXISTS `brand_id`;
