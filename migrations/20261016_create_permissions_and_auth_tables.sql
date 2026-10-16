-- ==============================================================================
-- AuraSupply: RBAC Permissions & Authentication Tables Migration
-- Cloned from AURA_v1 (CodeIgniter 3) Permission Architecture
-- Compatible with MySQL 5.7, 8.0, 9.1+
-- ==============================================================================

-- 1. Groups / Roles Table
CREATE TABLE IF NOT EXISTS `aura_groups` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_group_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Insert Default Roles if not existing
INSERT INTO `aura_groups` (`id`, `name`, `description`) VALUES
(1, 'owner', 'Owner / Super Admin'),
(2, 'admin', 'Administrator'),
(3, 'manager', 'Branch Manager'),
(4, 'cashier', 'Cashier'),
(5, 'stock_controller', 'Inventory & Stock Controller'),
(6, 'salesperson', 'Sales Representative')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- 3. Core Permissions Table
-- Cloned structure from AURA_v1 with module-action columns (0 = denied, 1 = granted)
CREATE TABLE IF NOT EXISTS `aura_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` mediumint(8) unsigned NOT NULL,
  -- Products Module
  `products-index` tinyint(1) NOT NULL DEFAULT '0',
  `products-add` tinyint(1) NOT NULL DEFAULT '0',
  `products-edit` tinyint(1) NOT NULL DEFAULT '0',
  `products-delete` tinyint(1) NOT NULL DEFAULT '0',
  `products-cost` tinyint(1) NOT NULL DEFAULT '0',
  `products-price` tinyint(1) NOT NULL DEFAULT '0',
  `products-import` tinyint(1) NOT NULL DEFAULT '0',
  `products-export` tinyint(1) NOT NULL DEFAULT '0',
  `products-adjustments` tinyint(1) NOT NULL DEFAULT '0',
  -- Sales Module
  `sales-index` tinyint(1) NOT NULL DEFAULT '0',
  `sales-add` tinyint(1) NOT NULL DEFAULT '0',
  `sales-edit` tinyint(1) NOT NULL DEFAULT '0',
  `sales-delete` tinyint(1) NOT NULL DEFAULT '0',
  `sales-export` tinyint(1) NOT NULL DEFAULT '0',
  `sales-payments` tinyint(1) NOT NULL DEFAULT '0',
  `sales-deliveries` tinyint(1) NOT NULL DEFAULT '0',
  -- Purchases Module
  `purchases-index` tinyint(1) NOT NULL DEFAULT '0',
  `purchases-add` tinyint(1) NOT NULL DEFAULT '0',
  `purchases-edit` tinyint(1) NOT NULL DEFAULT '0',
  `purchases-delete` tinyint(1) NOT NULL DEFAULT '0',
  `purchases-payments` tinyint(1) NOT NULL DEFAULT '0',
  -- Quotes Module
  `quotes-index` tinyint(1) NOT NULL DEFAULT '0',
  `quotes-add` tinyint(1) NOT NULL DEFAULT '0',
  `quotes-edit` tinyint(1) NOT NULL DEFAULT '0',
  `quotes-delete` tinyint(1) NOT NULL DEFAULT '0',
  -- Customers & Suppliers
  `customers-index` tinyint(1) NOT NULL DEFAULT '0',
  `customers-add` tinyint(1) NOT NULL DEFAULT '0',
  `customers-edit` tinyint(1) NOT NULL DEFAULT '0',
  `customers-delete` tinyint(1) NOT NULL DEFAULT '0',
  `suppliers-index` tinyint(1) NOT NULL DEFAULT '0',
  `suppliers-add` tinyint(1) NOT NULL DEFAULT '0',
  `suppliers-edit` tinyint(1) NOT NULL DEFAULT '0',
  `suppliers-delete` tinyint(1) NOT NULL DEFAULT '0',
  -- User & Permission Administration
  `users-index` tinyint(1) NOT NULL DEFAULT '0',
  `users-add` tinyint(1) NOT NULL DEFAULT '0',
  `users-edit` tinyint(1) NOT NULL DEFAULT '0',
  `users-delete` tinyint(1) NOT NULL DEFAULT '0',
  `system_settings-index` tinyint(1) NOT NULL DEFAULT '0',
  `group_permissions-index` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_permissions_group` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Seed Permissions for Default Roles
-- Group 1 (Owner): All 1s
INSERT INTO `aura_permissions` (
  `group_id`,
  `products-index`, `products-add`, `products-edit`, `products-delete`, `products-cost`, `products-price`, `products-import`, `products-export`, `products-adjustments`,
  `sales-index`, `sales-add`, `sales-edit`, `sales-delete`, `sales-export`, `sales-payments`, `sales-deliveries`,
  `purchases-index`, `purchases-add`, `purchases-edit`, `purchases-delete`, `purchases-payments`,
  `quotes-index`, `quotes-add`, `quotes-edit`, `quotes-delete`,
  `customers-index`, `customers-add`, `customers-edit`, `customers-delete`,
  `suppliers-index`, `suppliers-add`, `suppliers-edit`, `suppliers-delete`,
  `users-index`, `users-add`, `users-edit`, `users-delete`,
  `system_settings-index`, `group_permissions-index`
) VALUES (
  1,
  1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1,
  1, 1, 1, 1,
  1, 1, 1, 1,
  1, 1, 1, 1,
  1, 1, 1, 1,
  1, 1
) ON DUPLICATE KEY UPDATE `products-index` = 1, `group_permissions-index` = 1;

-- Group 2 (Admin): All operational permissions
INSERT INTO `aura_permissions` (
  `group_id`,
  `products-index`, `products-add`, `products-edit`, `products-delete`, `products-cost`, `products-price`, `products-import`, `products-export`, `products-adjustments`,
  `sales-index`, `sales-add`, `sales-edit`, `sales-delete`, `sales-export`, `sales-payments`, `sales-deliveries`,
  `purchases-index`, `purchases-add`, `purchases-edit`, `purchases-delete`, `purchases-payments`,
  `quotes-index`, `quotes-add`, `quotes-edit`, `quotes-delete`,
  `customers-index`, `customers-add`, `customers-edit`, `customers-delete`,
  `suppliers-index`, `suppliers-add`, `suppliers-edit`, `suppliers-delete`,
  `users-index`, `users-add`, `users-edit`, `users-delete`,
  `system_settings-index`, `group_permissions-index`
) VALUES (
  2,
  1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1,
  1, 1, 1, 1,
  1, 1, 1, 1,
  1, 1, 1, 1,
  1, 1, 1, 1,
  1, 1
) ON DUPLICATE KEY UPDATE `products-index` = 1, `group_permissions-index` = 1;

-- Group 3 (Manager): Catalog & sales operations, no sensitive deletions
INSERT INTO `aura_permissions` (
  `group_id`,
  `products-index`, `products-add`, `products-edit`, `products-delete`, `products-cost`, `products-price`, `products-import`, `products-export`, `products-adjustments`,
  `sales-index`, `sales-add`, `sales-edit`, `sales-delete`, `sales-export`, `sales-payments`, `sales-deliveries`,
  `purchases-index`, `purchases-add`, `purchases-edit`, `purchases-delete`, `purchases-payments`,
  `quotes-index`, `quotes-add`, `quotes-edit`, `quotes-delete`,
  `customers-index`, `customers-add`, `customers-edit`, `customers-delete`,
  `suppliers-index`, `suppliers-add`, `suppliers-edit`, `suppliers-delete`,
  `users-index`, `users-add`, `users-edit`, `users-delete`,
  `system_settings-index`, `group_permissions-index`
) VALUES (
  3,
  1, 1, 1, 0, 1, 1, 1, 1, 1,
  1, 1, 1, 0, 1, 1, 1,
  1, 1, 1, 0, 1,
  1, 1, 1, 0,
  1, 1, 1, 0,
  1, 1, 1, 0,
  1, 0, 0, 0,
  0, 0
) ON DUPLICATE KEY UPDATE `products-index` = 1;

-- Group 4 (Cashier): POS, view/add sales, view/add customers
INSERT INTO `aura_permissions` (
  `group_id`,
  `products-index`, `products-add`, `products-edit`, `products-delete`, `products-cost`, `products-price`, `products-import`, `products-export`, `products-adjustments`,
  `sales-index`, `sales-add`, `sales-edit`, `sales-delete`, `sales-export`, `sales-payments`, `sales-deliveries`,
  `purchases-index`, `purchases-add`, `purchases-edit`, `purchases-delete`, `purchases-payments`,
  `quotes-index`, `quotes-add`, `quotes-edit`, `quotes-delete`,
  `customers-index`, `customers-add`, `customers-edit`, `customers-delete`,
  `suppliers-index`, `suppliers-add`, `suppliers-edit`, `suppliers-delete`,
  `users-index`, `users-add`, `users-edit`, `users-delete`,
  `system_settings-index`, `group_permissions-index`
) VALUES (
  4,
  1, 0, 0, 0, 0, 1, 0, 0, 0,
  1, 1, 0, 0, 0, 1, 0,
  0, 0, 0, 0, 0,
  1, 1, 0, 0,
  1, 1, 0, 0,
  0, 0, 0, 0,
  0, 0, 0, 0,
  0, 0
) ON DUPLICATE KEY UPDATE `products-index` = 1;

-- 5. Seed / Ensure Default Admin and Test Accounts
-- Username: admin, Password: admin123, group_id: 1 (Owner), active: 1, status: 'active'
UPDATE `aura_users`
SET `password` = '$2y$10$m3m8ocGFJ4mw2vFxRuNNG.dAJ6Wl/jUYoRqX3cLWdNVAGCjG7M71u',
    `active` = 1,
    `status` = 'active',
    `group_id` = 1
WHERE `username` = 'admin';

-- Test Manager account: admin2 / admin123 (group_id: 3)
UPDATE `aura_users`
SET `password` = '$2y$10$m3m8ocGFJ4mw2vFxRuNNG.dAJ6Wl/jUYoRqX3cLWdNVAGCjG7M71u',
    `active` = 1,
    `status` = 'active',
    `group_id` = 3
WHERE `username` = 'admin2';
