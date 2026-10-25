-- Migration: Cost Adjustments Module & Valuation History
-- Aligned with AURA_v1 architectural conventions and schema standards

CREATE TABLE IF NOT EXISTS `aura_cost_adjustments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reference_no` VARCHAR(55) NOT NULL UNIQUE,
  `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `warehouse_id` INT NULL,
  `biller_id` INT NULL,
  `note` TEXT NULL,
  `reason` VARCHAR(255) NULL,
  `status` VARCHAR(55) NOT NULL DEFAULT 'completed',
  `total_items` INT DEFAULT 0,
  `total_cost_difference` DECIMAL(25,4) DEFAULT 0.0000,
  `total_valuation_change` DECIMAL(25,4) DEFAULT 0.0000,
  `created_by` INT NOT NULL,
  `updated_by` INT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ref` (`reference_no`),
  INDEX `idx_wh` (`warehouse_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `aura_cost_adjustment_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cost_adjustment_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_code` VARCHAR(55) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `option_id` INT NULL,
  `warehouse_id` INT NULL,
  `on_hand_quantity` DECIMAL(15,4) DEFAULT 0.0000,
  `old_cost` DECIMAL(25,4) NOT NULL,
  `new_cost` DECIMAL(25,4) NOT NULL,
  `cost_difference` DECIMAL(25,4) NOT NULL,
  `valuation_difference` DECIMAL(25,4) NOT NULL,
  `adjustment_type` VARCHAR(20) DEFAULT 'amount',
  `adjustment_value` DECIMAL(15,4) DEFAULT 0,
  `note` VARCHAR(255) NULL,
  INDEX `idx_cost_adj_id` (`cost_adjustment_id`),
  INDEX `idx_prod_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `aura_cost_adjustment_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cost_adjustment_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `old_cost` DECIMAL(25,4) NOT NULL,
  `new_cost` DECIMAL(25,4) NOT NULL,
  `actor_id` INT NULL,
  `actor_name` VARCHAR(150) NULL,
  `note` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ca_id` (`cost_adjustment_id`),
  INDEX `idx_p_id` (`product_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
