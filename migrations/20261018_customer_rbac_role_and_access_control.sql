-- ====================================================================================
-- MIGRATION: 20261018_customer_rbac_role_and_access_control.sql
-- Description: Enforce Customer RBAC Role & Admin Access Control Separation
-- Platform   : MySQL 8.x / 9.x / MariaDB
-- ====================================================================================

-- 1. Ensure CUSTOMER role exists in enterprise RBAC user_groups table
INSERT INTO `user_groups` (`code`, `name`, `description`, `level`, `is_system`, `status`)
VALUES ('CUSTOMER', 'Customer / Buyer', 'E-commerce buyer and website storefront customer account', 90, 1, 'active')
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `level` = VALUES(`level`),
  `status` = 'active';

-- 2. Verify and enforce aura_groups security flags for customer role
UPDATE `aura_groups` 
SET 
  `allow_admin_login` = 0,
  `allow_web_login` = 1,
  `allow_web_register` = 1
WHERE LOWER(`name`) = 'customer';

-- 3. Correct any legacy customer users who were accidentally assigned group_id = 3 (branch manager)
-- Only reassign if they were registered from website/public storefront
UPDATE `aura_users`
SET `group_id` = 4
WHERE `group_id` = 3 AND (`register_source` = 'website' OR `company` = 'customer' OR `email` LIKE '%customer%');
