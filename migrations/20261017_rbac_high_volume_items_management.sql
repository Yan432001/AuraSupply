-- ====================================================================================
-- ENTERPRISE ERP DATABASE ARCHITECTURE: RBAC & HIGH-VOLUME ITEMS MANAGEMENT
-- Architecture Level : Senior Database Architect
-- Engine             : InnoDB (Row-Level Locking, ACID Compliant, MVCC Optimized)
-- Default Charset    : utf8mb4 (Full Unicode / Emoji / Multi-language Support)
-- Default Collation  : utf8mb4_unicode_ci (Universal MySQL 8.x / 9.x / MariaDB)
-- Target Platform    : MySQL / MariaDB via phpMyAdmin SQL Console & Node.js Backend
-- ====================================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;

-- ====================================================================================
-- SECTION 1: ERP MODULE REGISTRY (erp_modules)
-- Represents distinct ERP business domains for role-based permission scoping.
-- ====================================================================================
CREATE TABLE IF NOT EXISTS `erp_modules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL COMMENT 'Machine code: INVENTORY, SALES, PURCHASES, ACCOUNTING, etc.',
  `name` VARCHAR(100) NOT NULL COMMENT 'Display name of module',
  `category` ENUM('core', 'operations', 'finance', 'commercial', 'administration') NOT NULL DEFAULT 'operations',
  `description` VARCHAR(255) DEFAULT NULL,
  `route_path` VARCHAR(150) DEFAULT NULL COMMENT 'Frontend SPA route path (e.g., /admins/inventory)',
  `icon` VARCHAR(100) DEFAULT NULL COMMENT 'UI icon identifier (FontAwesome / Lucide)',
  `display_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = active module, 0 = disabled',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_erp_modules_code` (`code`),
  KEY `idx_erp_modules_active_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ====================================================================================
-- SECTION 2: USER GROUPS / ROLES (user_groups)
-- Role definitions with hierarchy levels and system protection flags.
-- ====================================================================================
CREATE TABLE IF NOT EXISTS `user_groups` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL COMMENT 'Unique code: SUPER_ADMIN, ADMIN, MANAGER, CASHIER, WAREHOUSE, etc.',
  `name` VARCHAR(100) NOT NULL COMMENT 'Human readable role name',
  `description` TEXT DEFAULT NULL,
  `level` SMALLINT UNSIGNED NOT NULL DEFAULT 50 COMMENT '1 = Superadmin (bypasses checks), 10 = Manager, 30 = Staff',
  `is_system` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = system role protected against accidental deletion',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_groups_code` (`code`),
  KEY `idx_user_groups_status_level` (`status`, `level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ====================================================================================
-- SECTION 3: USERS (users)
-- Master user identity table with audit trails, auth security, and soft deletes.
-- ====================================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL COMMENT 'UUIDv4 for API endpoints & external microservices',
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `password_algo` VARCHAR(30) NOT NULL DEFAULT 'bcrypt' COMMENT 'bcrypt, argon2id, legacy',
  `first_name` VARCHAR(100) DEFAULT NULL,
  `last_name` VARCHAR(100) DEFAULT NULL,
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  `is_system_admin` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = superuser override',
  `failed_login_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` DATETIME DEFAULT NULL,
  `last_login_at` DATETIME DEFAULT NULL,
  `last_login_ip` VARCHAR(45) DEFAULT NULL,
  `theme` VARCHAR(30) NOT NULL DEFAULT 'light',
  `language` VARCHAR(10) NOT NULL DEFAULT 'en',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_uuid` (`uuid`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_status_lookup` (`deleted_at`, `status`, `id`),
  KEY `idx_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ====================================================================================
-- SECTION 4: USER GROUP MAPPINGS (user_group_mappings)
-- Many-to-Many junction enabling multiple role assignments and temporary delegations.
-- ====================================================================================
CREATE TABLE IF NOT EXISTS `user_group_mappings` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `group_id` INT UNSIGNED NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = default primary role for UX',
  `assigned_by` BIGINT UNSIGNED DEFAULT NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME DEFAULT NULL COMMENT 'NULL = permanent, or expiration timestamp for temporary roles',
  PRIMARY KEY (`user_id`, `group_id`),
  KEY `idx_ugm_reverse` (`group_id`, `user_id`),
  KEY `idx_ugm_expiry_check` (`user_id`, `expires_at`),
  CONSTRAINT `fk_ugm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ugm_group` FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ====================================================================================
-- SECTION 5: PERMISSIONS (permissions)
-- Granular CRUD + Export + Approve rights mapped per group and ERP module.
-- Features covering composite index for zero-cost sub-millisecond RBAC lookups.
-- ====================================================================================
CREATE TABLE IF NOT EXISTS `permissions` (
  `group_id` INT UNSIGNED NOT NULL,
  `module_id` INT UNSIGNED NOT NULL,
  `can_view` TINYINT(1) NOT NULL DEFAULT 0,
  `can_create` TINYINT(1) NOT NULL DEFAULT 0,
  `can_update` TINYINT(1) NOT NULL DEFAULT 0,
  `can_delete` TINYINT(1) NOT NULL DEFAULT 0,
  `can_export` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Restricts large CSV / Excel data exports',
  `can_approve` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Financial & inventory approval workflow right',
  `updated_by` BIGINT UNSIGNED DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`, `module_id`),
  KEY `idx_perm_module_lookup` (`module_id`, `group_id`),
  KEY `idx_perm_covering` (`group_id`, `module_id`, `can_view`, `can_create`, `can_update`, `can_delete`),
  CONSTRAINT `fk_perm_group` FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_perm_module` FOREIGN KEY (`module_id`) REFERENCES `erp_modules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ====================================================================================
-- SECTION 6: HIGH-VOLUME ITEMS TABLE (items)
-- Architected for millions of inventory items under high transactional concurrency.
-- Features:
--   - B-Tree composite index (is_deleted, status, category_id, id DESC) for 0-filesort pagination
--   - Instant SKU uniqueness and Barcode scanning index
--   - Composite index for automated low-stock / reorder triggers
--   - Fulltext inverted index for lightning-fast catalog search
--   - Row-level locking via InnoDB (SELECT ... FOR UPDATE)
-- ====================================================================================
CREATE TABLE IF NOT EXISTS `items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL COMMENT 'Public item UUID for APIs & microservices',
  `sku` VARCHAR(60) NOT NULL COMMENT 'Stock Keeping Unit / Master Item Code',
  `barcode` VARCHAR(60) DEFAULT NULL COMMENT 'UPC, EAN-13, GS1, Code128',
  `barcode_symbology` VARCHAR(30) NOT NULL DEFAULT 'code128',
  `name` VARCHAR(255) NOT NULL COMMENT 'Item descriptive name',
  `second_name` VARCHAR(255) DEFAULT NULL COMMENT 'Alternative language or vendor title',
  `item_type` ENUM('standard', 'service', 'combo', 'digital', 'raw_material') NOT NULL DEFAULT 'standard',
  `category_id` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Reference to category',
  `brand_id` INT UNSIGNED DEFAULT NULL COMMENT 'Reference to brand',
  `unit_id` INT UNSIGNED DEFAULT NULL COMMENT 'Reference to measurement unit',
  `cost_price` DECIMAL(15, 4) NOT NULL DEFAULT 0.0000 COMMENT 'Base purchase cost price',
  `selling_price` DECIMAL(15, 4) NOT NULL DEFAULT 0.0000 COMMENT 'Standard retail/wholesale price',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `quantity_on_hand` DECIMAL(15, 4) NOT NULL DEFAULT 0.0000 COMMENT 'Physical on-hand inventory quantity',
  `alert_quantity` DECIMAL(15, 4) NOT NULL DEFAULT 5.0000 COMMENT 'Reorder threshold trigger',
  `track_inventory` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = stock tracked, 0 = non-stock / service',
  `status` ENUM('active', 'inactive', 'draft', 'discontinued') NOT NULL DEFAULT 'active',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = normal, 1 = soft deleted',
  `tax_rate` DECIMAL(6, 3) NOT NULL DEFAULT 0.000,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `created_by` BIGINT UNSIGNED DEFAULT NULL,
  `updated_by` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_items_uuid` (`uuid`),
  UNIQUE KEY `uq_items_sku` (`sku`),
  KEY `idx_items_barcode` (`barcode`),
  KEY `idx_items_filter_sort` (`is_deleted`, `status`, `category_id`, `id` DESC),
  KEY `idx_items_cat_brand` (`category_id`, `brand_id`, `status`, `is_deleted`),
  KEY `idx_items_stock_alert` (`is_deleted`, `track_inventory`, `quantity_on_hand`, `alert_quantity`),
  KEY `idx_items_created` (`created_at` DESC),
  FULLTEXT KEY `ft_items_search` (`sku`, `barcode`, `name`),
  CONSTRAINT `fk_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_items_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ====================================================================================
-- SECTION 7: HIGH-PERFORMANCE RBAC HELPER VIEWS
-- Evaluates multi-role union permissions in sub-millisecond latency.
-- ====================================================================================
CREATE OR REPLACE VIEW `v_user_effective_permissions` AS
SELECT 
  ugm.user_id,
  m.code             AS module_code,
  m.name             AS module_name,
  MAX(p.can_view)    AS can_view,
  MAX(p.can_create)  AS can_create,
  MAX(p.can_update)  AS can_update,
  MAX(p.can_delete)  AS can_delete,
  MAX(p.can_export)  AS can_export,
  MAX(p.can_approve) AS can_approve
FROM `user_group_mappings` ugm
JOIN `user_groups` g ON g.id = ugm.group_id AND g.status = 'active'
JOIN `permissions` p ON p.group_id = g.id
JOIN `erp_modules` m ON m.id = p.module_id AND m.is_active = 1
WHERE (ugm.expires_at IS NULL OR ugm.expires_at > NOW())
GROUP BY ugm.user_id, m.code, m.name;

CREATE OR REPLACE VIEW `v_items_reorder_alerts` AS
SELECT 
  id,
  uuid,
  sku,
  barcode,
  name,
  category_id,
  quantity_on_hand,
  alert_quantity,
  (alert_quantity - quantity_on_hand) AS shortage_qty,
  cost_price,
  selling_price
FROM `items`
WHERE is_deleted = 0
  AND status = 'active'
  AND track_inventory = 1
  AND quantity_on_hand <= alert_quantity;

-- ====================================================================================
-- SECTION 8: INITIAL SEED DATA (Idempotent: Safe to run multiple times)
-- ====================================================================================

-- 8.1 Seed ERP Modules
INSERT INTO `erp_modules` (`id`, `code`, `name`, `category`, `description`, `route_path`, `icon`, `display_order`, `is_active`) VALUES
  (1,  'INVENTORY',   'Inventory & Warehousing', 'operations',     'Product catalog, warehouses, transfers, stock alerts', '/admins/inventory',   'fa-warehouse',       1, 1),
  (2,  'SALES',       'Sales & Invoicing',       'commercial',     'Sales orders, customer invoices, delivery notes',       '/admins/sales',       'fa-receipt',         2, 1),
  (3,  'PURCHASES',   'Procurement & POs',       'commercial',     'Supplier purchase orders, GRN, billings',               '/admins/purchases',   'fa-truck',           3, 1),
  (4,  'POS',         'Point of Sale',           'commercial',     'Retail register, cashier checkout, barcodes',           '/admins/pos',         'fa-cash-register',   4, 1),
  (5,  'ACCOUNTING',  'General Accounting',      'finance',        'GL, journal vouchers, balance sheet, P&L',              '/admins/accounting',  'fa-file-invoice',    5, 1),
  (6,  'HR',          'Human Resources',         'administration', 'Employee directory, attendance, payroll',              '/admins/hr',          'fa-users',           6, 1),
  (7,  'CRM',         'Customer Relations',      'commercial',     'Customer leads, loyalty cards, communications',         '/admins/crm',         'fa-address-card',    7, 1),
  (8,  'REPORTS',     'Analytics & Reports',     'core',           'Financial statements, inventory valuation, sales KPIs', '/admins/reports',     'fa-chart-pie',       8, 1),
  (9,  'SETTINGS',    'System Administration',   'administration', 'Company branches, tax rates, audit logs, RBAC',        '/admins/settings',    'fa-sliders',         9, 1)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `category` = VALUES(`category`),
  `route_path` = VALUES(`route_path`),
  `icon` = VALUES(`icon`);

-- 8.2 Seed Core ERP User Groups (Roles)
INSERT INTO `user_groups` (`id`, `code`, `name`, `description`, `level`, `is_system`, `status`) VALUES
  (1, 'SUPER_ADMIN',        'Super Administrator', 'Full unconstrained platform control',             1,  1, 'active'),
  (2, 'ADMIN',              'Administrator',       'Administrative operations and user management',   2,  1, 'active'),
  (3, 'BRANCH_MANAGER',     'Branch Manager',      'Operational store and staff control',            10, 1, 'active'),
  (4, 'ACCOUNTANT',         'Chief Accountant',    'Financial entries, general ledger, and taxation', 20, 0, 'active'),
  (5, 'WAREHOUSE_OPERATOR', 'Warehouse Operator',  'Inventory stock counts, receiving, transfers',    25, 0, 'active'),
  (6, 'CASHIER',            'Point of Sale Cashier','POS billing, receipts, cash drawer',            30, 0, 'active'),
  (7, 'SALES_REP',          'Sales Representative','Quotes, customer orders, lead tracking',          35, 0, 'active')
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `level` = VALUES(`level`),
  `is_system` = VALUES(`is_system`);

-- 8.3 Seed Full Access for SUPER_ADMIN & ADMIN across all modules
INSERT INTO `permissions` (`group_id`, `module_id`, `can_view`, `can_create`, `can_update`, `can_delete`, `can_export`, `can_approve`)
SELECT g.id, m.id, 1, 1, 1, 1, 1, 1
FROM `user_groups` g
CROSS JOIN `erp_modules` m
WHERE g.code IN ('SUPER_ADMIN', 'ADMIN')
ON DUPLICATE KEY UPDATE
  `can_view` = 1, `can_create` = 1, `can_update` = 1, `can_delete` = 1, `can_export` = 1, `can_approve` = 1;

-- 8.4 Seed Role-Specific Permissions Matrix
-- Branch Manager: View, Create, Update, Export on operational modules; Approval rights on Sales/Purchases
INSERT INTO `permissions` (`group_id`, `module_id`, `can_view`, `can_create`, `can_update`, `can_delete`, `can_export`, `can_approve`)
SELECT g.id, m.id, 1, 1, 1, 0, 1, 1
FROM `user_groups` g
JOIN `erp_modules` m ON m.code IN ('INVENTORY', 'SALES', 'PURCHASES', 'POS', 'REPORTS')
WHERE g.code = 'BRANCH_MANAGER'
ON DUPLICATE KEY UPDATE `can_view` = 1, `can_create` = 1, `can_update` = 1, `can_export` = 1, `can_approve` = 1;

-- Accountant: Full financial & sales access, export rights
INSERT INTO `permissions` (`group_id`, `module_id`, `can_view`, `can_create`, `can_update`, `can_delete`, `can_export`, `can_approve`)
SELECT g.id, m.id, 1, 1, 1, 0, 1, 1
FROM `user_groups` g
JOIN `erp_modules` m ON m.code IN ('ACCOUNTING', 'SALES', 'PURCHASES', 'REPORTS')
WHERE g.code = 'ACCOUNTANT'
ON DUPLICATE KEY UPDATE `can_view` = 1, `can_create` = 1, `can_update` = 1, `can_export` = 1, `can_approve` = 1;

-- Warehouse Operator: Inventory receiving, counts, view & update
INSERT INTO `permissions` (`group_id`, `module_id`, `can_view`, `can_create`, `can_update`, `can_delete`, `can_export`, `can_approve`)
SELECT g.id, m.id, 1, 1, 1, 0, 0, 0
FROM `user_groups` g
JOIN `erp_modules` m ON m.code IN ('INVENTORY', 'PURCHASES')
WHERE g.code = 'WAREHOUSE_OPERATOR'
ON DUPLICATE KEY UPDATE `can_view` = 1, `can_create` = 1, `can_update` = 1;

-- Cashier: POS operations and sales view
INSERT INTO `permissions` (`group_id`, `module_id`, `can_view`, `can_create`, `can_update`, `can_delete`, `can_export`, `can_approve`)
SELECT g.id, m.id, 1, 1, 0, 0, 0, 0
FROM `user_groups` g
JOIN `erp_modules` m ON m.code IN ('POS', 'SALES')
WHERE g.code = 'CASHIER'
ON DUPLICATE KEY UPDATE `can_view` = 1, `can_create` = 1;

-- 8.5 Seed Initial Super Administrator User (Password: Sbc@12345)
INSERT INTO `users` (
  `id`, `uuid`, `username`, `email`, `phone`, `password_hash`, `password_algo`,
  `first_name`, `last_name`, `status`, `is_system_admin`, `theme`, `language`
) VALUES (
  1,
  'a0000000-0000-4000-8000-000000000001',
  'admin',
  'admin@aurasupply.com',
  '+85512345678',
  '$2a$10$/nm2CgS0DsFlTcYm.a3kZO.WwIwBqRhm7UaAJcXZiYWK3qufMOfUS',
  'bcrypt',
  'System',
  'Administrator',
  'active',
  1,
  'light',
  'en'
) ON DUPLICATE KEY UPDATE 
  `status` = 'active',
  `is_system_admin` = 1;

-- 8.6 Seed User to Super Administrator Mapping
INSERT INTO `user_group_mappings` (`user_id`, `group_id`, `is_primary`, `assigned_by`, `assigned_at`)
VALUES (1, 1, 1, 1, NOW())
ON DUPLICATE KEY UPDATE `is_primary` = 1;

-- 8.7 Seed High-Volume Sample Items
INSERT INTO `items` (
  `id`, `uuid`, `sku`, `barcode`, `barcode_symbology`, `name`, `second_name`,
  `item_type`, `category_id`, `cost_price`, `selling_price`, `quantity_on_hand`,
  `alert_quantity`, `track_inventory`, `status`, `is_deleted`
) VALUES
  (1, 'b0000000-0001-4000-8000-000000000001', 'SKU-COF-001', '8846002481691', 'code128', 'Premium Arabica Whole Bean Coffee 1kg', 'កាហ្វេអារ៉ាប៊ីកាគ្រាប់ 1kg', 'standard', 1, 12.5000, 22.0000, 150.0000, 20.0000, 1, 'active', 0),
  (2, 'b0000000-0002-4000-8000-000000000002', 'SKU-BEV-002', '8846002481692', 'code128', 'Natural Mineral Water 500ml (24-Pack)',  'ទឹកបរិសុទ្ធធម្មជាតិ 500ml',   'standard', 1, 4.2000,  7.5000,  840.0000, 100.0000, 1, 'active', 0),
  (3, 'b0000000-0003-4000-8000-000000000003', 'SKU-LAT-003', '8846002481693', 'code128', 'Signature Spanish Iced Latte 16oz',     'ស្ប៉ានីស ឡាតេទឹកកក 16oz',    'standard', 1, 0.9500,  4.2500,  300.0000, 30.0000,  1, 'active', 0),
  (4, 'b0000000-0004-4000-8000-000000000004', 'SKU-SRV-004', '8846002481694', 'code128', 'Standard Espresso Machine Maintenance',  'សេវាកម្មថែទាំម៉ាស៊ីនកាហ្វេ',   'service',  1, 0.0000,  45.0000, 0.0000,    0.0000,   0, 'active', 0)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `selling_price` = VALUES(`selling_price`);

-- ====================================================================================
-- SECTION 9: NON-DESTRUCTIVE BACKWARD-COMPATIBILITY DATA SYNC (From aura_ tables)
-- If legacy aura_ tables exist, sync existing users and products into modern architecture
-- ====================================================================================

-- 9.1 Sync existing users from aura_users (if present and not yet in users)
INSERT IGNORE INTO `users` (
  `id`, `uuid`, `username`, `email`, `phone`, `password_hash`, `password_algo`,
  `first_name`, `last_name`, `status`, `theme`, `language`, `created_at`, `updated_at`
)
SELECT 
  au.id,
  UUID(),
  au.username,
  IF(au.email IS NULL OR au.email = '', CONCAT(au.username, '@local.aura'), au.email),
  au.phone,
  au.password,
  IF(au.password LIKE '$2%', 'bcrypt', 'legacy'),
  au.first_name,
  au.last_name,
  IF(au.active = 1, 'active', 'inactive'),
  IF(au.theme IS NOT NULL AND au.theme != '', au.theme, 'light'),
  IF(au.language IS NOT NULL AND au.language != '', au.language, 'en'),
  IF(au.created_on > 0, FROM_UNIXTIME(au.created_on), NOW()),
  COALESCE(au.updated_at, NOW())
FROM `aura_users` au
WHERE au.id NOT IN (SELECT id FROM `users`);

-- 9.2 Sync legacy group memberships to user_group_mappings
INSERT IGNORE INTO `user_group_mappings` (`user_id`, `group_id`, `is_primary`, `assigned_at`)
SELECT 
  u.id,
  CASE 
    WHEN au.group_id = 1 THEN 1 -- Super Admin
    WHEN au.group_id = 2 THEN 2 -- Admin
    WHEN au.group_id = 3 THEN 3 -- Branch Manager
    WHEN au.group_id = 14 THEN 4 -- Accountant
    WHEN au.group_id = 17 THEN 5 -- Warehouse / Stock
    WHEN au.group_id = 15 THEN 6 -- Cashier
    WHEN au.group_id = 6  THEN 7 -- Salesman
    ELSE 2
  END,
  1,
  NOW()
FROM `users` u
JOIN `aura_users` au ON au.id = u.id;

-- 9.3 Sync catalog products from aura_products into items (if aura_products exists)
INSERT IGNORE INTO `items` (
  `id`, `uuid`, `sku`, `barcode`, `barcode_symbology`, `name`, `second_name`,
  `item_type`, `category_id`, `cost_price`, `selling_price`, `quantity_on_hand`,
  `alert_quantity`, `track_inventory`, `status`, `is_deleted`
)
SELECT 
  ap.id,
  UUID(),
  IF(ap.code IS NOT NULL AND ap.code != '', ap.code, CONCAT('SKU-', ap.id)),
  ap.code,
  COALESCE(ap.barcode_symbology, 'code128'),
  ap.name,
  ap.second_name,
  IF(ap.type = 'service', 'service', 'standard'),
  COALESCE(ap.category_id, 1),
  COALESCE(ap.cost, 0.0000),
  COALESCE(ap.price, 0.0000),
  COALESCE(ap.quantity, 0.0000),
  COALESCE(ap.alert_quantity, 5.0000),
  COALESCE(ap.track_quantity, 1),
  IF(ap.status = 1, 'active', 'inactive'),
  0
FROM `aura_products` ap
WHERE ap.id NOT IN (SELECT id FROM `items`);

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================================
-- END OF MIGRATION: DDL SCRIPT READY FOR phpMyAdmin SQL TAB
-- ====================================================================================
