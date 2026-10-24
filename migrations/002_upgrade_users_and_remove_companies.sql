-- ============================================================================
-- MIGRATION: 002_upgrade_users_and_remove_companies.sql
-- PROJECT: Aura Supply B2B ERP
-- OBJECTIVE:
--   1. Centralize all authentication, role, and permission governance into `aura_users`.
--   2. Decouple from `aura_companies` for all authorization logic.
--   3. Create `aura_site_settings` to store company & branding details.
--   4. Create `aura_module_settings`, `aura_sub_module_settings`, `aura_license`,
--      `aura_activity_logs`, and `aura_user_sessions`.
--   5. Seed initial modules, sub-modules, license, site settings, and default admin.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. UPGRADE `aura_users` TABLE
-- ----------------------------------------------------------------------------
-- Add new modern ERP authorization columns
ALTER TABLE `aura_users`
  ADD COLUMN `role` VARCHAR(50) NOT NULL DEFAULT 'staff' AFTER `group_id`,
  ADD COLUMN `level` TINYINT UNSIGNED NOT NULL DEFAULT 3 AFTER `role`,
  ADD COLUMN `permissions` JSON NULL AFTER `level`,
  ADD COLUMN `status` ENUM('active', 'inactive', 'suspended', 'pending') NOT NULL DEFAULT 'active' AFTER `active`,
  ADD COLUMN `theme` VARCHAR(20) NOT NULL DEFAULT 'light' AFTER `language`,
  ADD COLUMN `last_login_at` DATETIME NULL AFTER `last_login`,
  ADD COLUMN `last_login_ip` VARCHAR(45) NULL AFTER `last_ip_address`,
  ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `created_on`,
  ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL;

-- Populate `role` and `level` from legacy `group_id` mappings
UPDATE `aura_users` SET
  `role` = CASE 
    WHEN `group_id` = 1 THEN 'owner'
    WHEN `group_id` = 2 THEN 'admin'
    WHEN `group_id` = 3 THEN 'manager'
    WHEN `group_id` = 4 THEN 'buyer'
    WHEN `group_id` = 5 THEN 'supplier'
    WHEN `group_id` = 6 THEN 'salesman'
    WHEN `group_id` = 13 THEN 'audit'
    WHEN `group_id` = 14 THEN 'account'
    WHEN `group_id` = 15 THEN 'cashier'
    WHEN `group_id` = 17 THEN 'stock'
    ELSE 'staff'
  END,
  `level` = CASE
    WHEN `group_id` = 1 THEN 1
    WHEN `group_id` = 2 THEN 2
    WHEN `group_id` = 3 THEN 2
    WHEN `group_id` = 5 THEN 4
    WHEN `group_id` = 4 THEN 5
    ELSE 3
  END,
  `status` = CASE
    WHEN `active` = 1 THEN 'active'
    ELSE 'inactive'
  END;

-- Add performance indexes to `aura_users`
CREATE INDEX `idx_users_role` ON `aura_users` (`role`);
CREATE INDEX `idx_users_status` ON `aura_users` (`status`);
CREATE INDEX `idx_users_level` ON `aura_users` (`level`);
CREATE INDEX `idx_users_deleted_at` ON `aura_users` (`deleted_at`);

-- ----------------------------------------------------------------------------
-- 2. CREATE `aura_site_settings` TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `aura_site_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `site_name` VARCHAR(150) NOT NULL DEFAULT 'Aura Supply B2B',
  `company_name` VARCHAR(255) NOT NULL DEFAULT 'Aura Global Sourcing Co., Ltd.',
  `company_name_kh` VARCHAR(255) NULL,
  `tagline` VARCHAR(255) DEFAULT 'Commercial B2B Supply & Sourcing Network',
  `logo_url` VARCHAR(255) DEFAULT '/logos/aura-logo.svg',
  `logo_white_url` VARCHAR(255) DEFAULT '/logos/aura-logo-white.svg',
  `favicon_url` VARCHAR(255) DEFAULT '/aura.ico',
  `address` VARCHAR(255) DEFAULT 'Building 45, Norodom Blvd, Daun Penh, Phnom Penh, Cambodia',
  `address_kh` VARCHAR(300) DEFAULT 'អគារ ៤៥ មហាវិថីព្រះនរោត្តម ដូនពេញ ភ្នំពេញ កម្ពុជា',
  `city` VARCHAR(100) DEFAULT 'Phnom Penh',
  `country` VARCHAR(100) DEFAULT 'Cambodia',
  `phone` VARCHAR(50) DEFAULT '+855 23 999 888',
  `email` VARCHAR(100) DEFAULT 'support@aurasupply.com',
  `vat_no` VARCHAR(100) DEFAULT 'K002-902100456',
  `default_currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `currency_symbol` VARCHAR(5) NOT NULL DEFAULT '$',
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Phnom_Penh',
  `date_format` VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD',
  `invoice_footer` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default site settings if table is empty
INSERT INTO `aura_site_settings` (`id`, `site_name`, `company_name`, `vat_no`, `default_currency`, `currency_symbol`)
SELECT 1, 'Aura Supply B2B', 'Aura Global Sourcing Co., Ltd.', 'K002-902100456', 'USD', '$'
WHERE NOT EXISTS (SELECT 1 FROM `aura_site_settings` WHERE `id` = 1);

-- ----------------------------------------------------------------------------
-- 3. CREATE `aura_module_settings` TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `aura_module_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `module_key` VARCHAR(50) NOT NULL UNIQUE,
  `label` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'Core Operations',
  `icon_key` VARCHAR(50) NOT NULL DEFAULT 'appstore',
  `accent_color` VARCHAR(20) NOT NULL DEFAULT '#2563eb',
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_module_cat` (`category`),
  INDEX `idx_module_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. CREATE `aura_sub_module_settings` TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `aura_sub_module_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `module_key` VARCHAR(50) NOT NULL,
  `sub_module_key` VARCHAR(50) NOT NULL UNIQUE,
  `label` VARCHAR(100) NOT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sub_mod_key` (`module_key`),
  CONSTRAINT `fk_sub_mod_parent` FOREIGN KEY (`module_key`) REFERENCES `aura_module_settings` (`module_key`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. CREATE `aura_license` TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `aura_license` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `license_key` VARCHAR(255) NOT NULL UNIQUE,
  `license_name` VARCHAR(100) NOT NULL,
  `domain` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'expired', 'trial', 'invalid') NOT NULL DEFAULT 'active',
  `environment` ENUM('production', 'uat', 'development') NOT NULL DEFAULT 'production',
  `issued_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  `last_verified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `max_users` INT NOT NULL DEFAULT 50,
  `max_branches` INT NOT NULL DEFAULT 10,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. CREATE `aura_activity_logs` TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `aura_activity_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `username` VARCHAR(100) NULL,
  `role` VARCHAR(50) NULL,
  `action` VARCHAR(50) NOT NULL COMMENT 'create, update, delete, login, logout, export, approve',
  `table_name` VARCHAR(64) NOT NULL,
  `record_id` VARCHAR(64) NULL,
  `old_values` JSON NULL,
  `new_values` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_log_user` (`user_id`),
  INDEX `idx_log_action` (`action`),
  INDEX `idx_log_table` (`table_name`),
  INDEX `idx_log_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. CREATE `aura_user_sessions` TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `aura_user_sessions` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `expires_at` DATETIME NOT NULL,
  `last_active_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_session_user` (`user_id`),
  INDEX `idx_session_expires` (`expires_at`),
  INDEX `idx_session_token` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
