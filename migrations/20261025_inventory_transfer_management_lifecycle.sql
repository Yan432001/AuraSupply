-- Migration: Inventory Transfer Management Lifecycle & Enhancements
-- Aligned with AURA_v1 Transfer Management architecture

-- 1. Enhance aura_transfers with lifecycle timestamps, audit actors, and quantity tracking
ALTER TABLE `aura_transfers`
  ADD COLUMN IF NOT EXISTS `approved_by` INT NULL AFTER `accepted_by`,
  ADD COLUMN IF NOT EXISTS `approved_at` DATETIME NULL AFTER `approved_by`,
  ADD COLUMN IF NOT EXISTS `dispatched_by` INT NULL AFTER `approved_at`,
  ADD COLUMN IF NOT EXISTS `dispatched_at` DATETIME NULL AFTER `dispatched_by`,
  ADD COLUMN IF NOT EXISTS `received_by` INT NULL AFTER `dispatched_at`,
  ADD COLUMN IF NOT EXISTS `received_at` DATETIME NULL AFTER `received_by`,
  ADD COLUMN IF NOT EXISTS `cancelled_by` INT NULL AFTER `received_at`,
  ADD COLUMN IF NOT EXISTS `cancelled_at` DATETIME NULL AFTER `cancelled_by`,
  ADD COLUMN IF NOT EXISTS `cancel_reason` VARCHAR(255) NULL AFTER `cancelled_at`,
  ADD COLUMN IF NOT EXISTS `in_transit_quantity` DECIMAL(15,4) DEFAULT 0.0000 AFTER `cancel_reason`,
  ADD COLUMN IF NOT EXISTS `received_quantity` DECIMAL(15,4) DEFAULT 0.0000 AFTER `in_transit_quantity`;

-- 2. Enhance aura_transfer_items with discrepancy and receipt tracking
ALTER TABLE `aura_transfer_items`
  ADD COLUMN IF NOT EXISTS `received_quantity` DECIMAL(15,4) DEFAULT 0.0000 AFTER `quantity_balance`,
  ADD COLUMN IF NOT EXISTS `damaged_quantity` DECIMAL(15,4) DEFAULT 0.0000 AFTER `received_quantity`,
  ADD COLUMN IF NOT EXISTS `shortage_quantity` DECIMAL(15,4) DEFAULT 0.0000 AFTER `damaged_quantity`;

-- 3. Create aura_transfer_history for immutable audit trail
CREATE TABLE IF NOT EXISTS `aura_transfer_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transfer_id` INT NOT NULL,
  `action` VARCHAR(50) NOT NULL COMMENT 'created, approved, rejected, dispatched, received, partially_received, cancelled, returned',
  `from_status` VARCHAR(50) NULL,
  `to_status` VARCHAR(50) NOT NULL,
  `actor_id` INT NULL,
  `actor_name` VARCHAR(150) NULL,
  `note` TEXT NULL,
  `data_payload` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_transfer_id` (`transfer_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
