-- =====================================================================
-- AURA  |  Access-control migration  (MySQL 8 / 9, WampServer + phpMyAdmin)
-- File:  aura_access_control_migration.sql
-- Built from: aura_v1_db(2).sql  (466 tables, prefix aura_)
--
-- RESULT AFTER THIS SCRIPT
--   aura_users          = EVERY person/login: owner, admin, staff, customer,
--                         supplier, driver ...   (role = group_id)
--   aura_groups         = roles + where each role may log in / register
--   aura_group_permissions = permission control per group (normalised)
--   aura_user_permissions  = optional per-user allow/deny override
--   aura_companies      = ONLY biller / store / shop / branch records
--   aura_user_billers   = which user may work in which branch/store/shop
-- =====================================================================

USE aura_v1_db;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES   = 0;

-- =====================================================================
-- STEP 1  |  BACKUP COPIES INSIDE THE DATABASE  (rollback source)
-- =====================================================================
CREATE TABLE IF NOT EXISTS aura_users_bak_20261015       AS SELECT * FROM aura_users;
CREATE TABLE IF NOT EXISTS aura_groups_bak_20261015      AS SELECT * FROM aura_groups;
CREATE TABLE IF NOT EXISTS aura_permissions_bak_20261015 AS SELECT * FROM aura_permissions;
CREATE TABLE IF NOT EXISTS aura_companies_bak_20261015   AS SELECT * FROM aura_companies;
CREATE TABLE IF NOT EXISTS aura_user_logins_bak_20261015 AS SELECT * FROM aura_user_logins;


-- =====================================================================
-- STEP 2  |  aura_groups  -> roles with login / register rules
-- =====================================================================
ALTER TABLE aura_groups
  MODIFY `name`        VARCHAR(50)  NOT NULL,
  MODIFY `description` VARCHAR(150) NOT NULL,
  ADD COLUMN IF NOT EXISTS `level`              TINYINT UNSIGNED NOT NULL DEFAULT 50  COMMENT '1 = owner (bypasses permission checks), bigger = less power',
  ADD COLUMN IF NOT EXISTS `allow_admin_login`  TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'may sign in at /admins',
  ADD COLUMN IF NOT EXISTS `allow_web_login`    TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'may sign in on the public website',
  ADD COLUMN IF NOT EXISTS `allow_web_register` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'may self-register on the public website',
  ADD COLUMN IF NOT EXISTS `requires_approval`  TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'self-registered users stay pending until an admin approves',
  ADD COLUMN IF NOT EXISTS `is_system`          TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = built-in role, do not delete',
  ADD COLUMN IF NOT EXISTS `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `updated_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- unique key uq_groups_name if not exists
SET @exist_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_groups' AND INDEX_NAME = 'uq_groups_name');
SET @sql := IF(@exist_idx = 0, 'ALTER TABLE aura_groups ADD UNIQUE KEY uq_groups_name (name)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- new roles for shop / store controllers (ids 30+ so they do NOT inherit old orphan rows 19-25 in aura_permissions)
INSERT IGNORE INTO aura_groups (id, `name`, `description`, `status`) VALUES
  (30, 'shop',  'Shop Manager',  1),
  (31, 'store', 'Store Manager', 1);

UPDATE aura_groups SET level =  1, allow_admin_login = 1, is_system = 1 WHERE `name` = 'owner';
UPDATE aura_groups SET level =  2, allow_admin_login = 1, is_system = 1 WHERE `name` = 'admin';
UPDATE aura_groups SET level = 10, allow_admin_login = 1, is_system = 1 WHERE `name` = 'branch';
UPDATE aura_groups SET level = 12, allow_admin_login = 1               WHERE `name` IN ('shop','store');
UPDATE aura_groups SET level = 20, allow_admin_login = 1               WHERE `name` IN ('account','stock');
UPDATE aura_groups SET level = 30, allow_admin_login = 1               WHERE `name` IN ('cashier','salesman');
UPDATE aura_groups SET level = 40, allow_admin_login = 1               WHERE `name` IN ('employee','audit');
UPDATE aura_groups SET level = 60                                      WHERE `name` = 'driver';
UPDATE aura_groups SET level = 90, allow_web_login = 1, allow_web_register = 1, is_system = 1 WHERE `name` = 'customer';
UPDATE aura_groups SET level = 90, allow_web_login = 1, allow_web_register = 1, requires_approval = 1, is_system = 1 WHERE `name` = 'supplier';


-- =====================================================================
-- STEP 3  |  aura_users  -> one table for every role
-- =====================================================================
-- 3.1 make e-mails safe to be UNIQUE (empty -> placeholder, duplicates -> placeholder)
UPDATE aura_users SET email = CONCAT(username, '@no-email.local') WHERE TRIM(COALESCE(email, '')) = '';
UPDATE aura_users u
JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(email)) ORDER BY id) AS rn FROM aura_users) d ON d.id = u.id
SET u.email = CONCAT(u.username, '+dup', u.id, '@no-email.local')
WHERE d.rn > 1;

-- 3.2 new columns
ALTER TABLE aura_users
  MODIFY `group_id` MEDIUMINT UNSIGNED NOT NULL,
  MODIFY `avatar`   VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `status`              ENUM('pending','active','suspended','blocked') NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS `register_source`     ENUM('admin','website','import','api') NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS `email_verified_at`   DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `approved_by`         INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `approved_at`         DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `last_login_at`       DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `failed_login_count`  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `locked_until`        DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `password_algo`       VARCHAR(20) NOT NULL DEFAULT 'legacy' COMMENT 'legacy | bcrypt | argon2id',
  ADD COLUMN IF NOT EXISTS `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `theme`               VARCHAR(10) NOT NULL DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS `legacy_company_id`   INT NULL COMMENT 'old aura_companies.id this person came from',
  ADD COLUMN IF NOT EXISTS `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `deleted_at`          DATETIME NULL;

-- indexes
SET @exist_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_users' AND INDEX_NAME = 'idx_users_status');
SET @sql := IF(@exist_idx = 0, 'ALTER TABLE aura_users ADD KEY idx_users_status (status, deleted_at)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_users' AND INDEX_NAME = 'idx_users_phone');
SET @sql := IF(@exist_idx = 0, 'ALTER TABLE aura_users ADD KEY idx_users_phone (phone)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE aura_users
SET status     = IF(COALESCE(active, 0) = 1, 'active', 'suspended'),
    created_at = IF(created_on > 0, FROM_UNIXTIME(created_on), NOW());

-- current staff passwords that start with $2 are bcrypt
UPDATE aura_users SET password_algo = 'bcrypt' WHERE `password` LIKE '$2%';

-- foreign key to aura_groups
SET @exist_fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_users' AND CONSTRAINT_NAME = 'fk_users_group');
SET @sql := IF(@exist_fk = 0, 'ALTER TABLE aura_users ADD CONSTRAINT fk_users_group FOREIGN KEY (group_id) REFERENCES aura_groups (id) ON UPDATE CASCADE ON DELETE RESTRICT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- =====================================================================
-- STEP 4  |  aura_companies  -> ONLY biller / store / shop / branch
-- =====================================================================
ALTER TABLE aura_companies
  ADD COLUMN IF NOT EXISTS `company_type` ENUM('biller','branch','store','shop','warehouse','other') NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS `manager_user_id` INT UNSIGNED NULL COMMENT 'main controller of this branch/store/shop (aura_users.id)',
  ADD COLUMN IF NOT EXISTS `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL;

SET @exist_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_companies' AND INDEX_NAME = 'idx_companies_type');
SET @sql := IF(@exist_idx = 0, 'ALTER TABLE aura_companies ADD KEY idx_companies_type (company_type, status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE aura_companies SET company_type = 'branch' WHERE group_name = 'biller';
UPDATE aura_companies SET status = IF(COALESCE(is_active, 1) = 1, 'active', 'inactive');


-- =====================================================================
-- STEP 5  |  NEW TABLES
-- =====================================================================
CREATE TABLE IF NOT EXISTS aura_user_billers (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `biller_id`  INT NOT NULL COMMENT 'aura_companies.id (company_type branch/store/shop)',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_biller` (`user_id`, `biller_id`),
  KEY `idx_biller` (`biller_id`),
  CONSTRAINT `fk_ub_user`   FOREIGN KEY (`user_id`)   REFERENCES aura_users (`id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_ub_biller` FOREIGN KEY (`biller_id`) REFERENCES aura_companies (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_permission_keys (
  `permission_key` VARCHAR(100) NOT NULL,
  `module`         VARCHAR(60)  NOT NULL,
  `action`         VARCHAR(80)  NOT NULL,
  `area`           ENUM('admin','website') NOT NULL DEFAULT 'admin',
  `label`          VARCHAR(150) DEFAULT NULL,
  `is_active`      TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`permission_key`),
  KEY `idx_pk_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_group_permissions (
  `group_id`       MEDIUMINT UNSIGNED NOT NULL,
  `permission_key` VARCHAR(100) NOT NULL,
  `allowed`        TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`, `permission_key`),
  KEY `idx_gp_key` (`permission_key`),
  CONSTRAINT `fk_gp_group` FOREIGN KEY (`group_id`)       REFERENCES aura_groups (`id`)                  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_gp_key`   FOREIGN KEY (`permission_key`) REFERENCES aura_permission_keys (`permission_key`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_user_permissions (
  `user_id`        INT UNSIGNED NOT NULL,
  `permission_key` VARCHAR(100) NOT NULL,
  `effect`         ENUM('allow','deny') NOT NULL,
  `created_by`     INT UNSIGNED NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `permission_key`),
  CONSTRAINT `fk_up_user` FOREIGN KEY (`user_id`)        REFERENCES aura_users (`id`)                       ON DELETE CASCADE,
  CONSTRAINT `fk_up_key`  FOREIGN KEY (`permission_key`) REFERENCES aura_permission_keys (`permission_key`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_user_tokens (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `type`       ENUM('refresh','remember','password_reset','email_verify') NOT NULL,
  `area`       ENUM('admin','website') NOT NULL DEFAULT 'admin',
  `token_hash` CHAR(64) NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at`    DATETIME NULL,
  `revoked_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token_hash` (`token_hash`),
  KEY `idx_token_user` (`user_id`, `type`),
  KEY `idx_token_exp`  (`expires_at`),
  CONSTRAINT `fk_tok_user` FOREIGN KEY (`user_id`) REFERENCES aura_users (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_user_profiles (
  `user_id`             INT UNSIGNED NOT NULL,
  `name_kh`             VARCHAR(100) DEFAULT NULL,
  `company_kh`          VARCHAR(100) DEFAULT NULL,
  `contact_person`      VARCHAR(250) DEFAULT NULL,
  `business_type`       VARCHAR(250) DEFAULT NULL,
  `vat_no`              VARCHAR(100) DEFAULT NULL,
  `gst_no`              VARCHAR(100) DEFAULT NULL,
  `address`             VARCHAR(255) DEFAULT NULL,
  `address_kh`          VARCHAR(300) DEFAULT NULL,
  `village`             VARCHAR(250) DEFAULT NULL,
  `commune`             VARCHAR(250) DEFAULT NULL,
  `street_no`           VARCHAR(250) DEFAULT NULL,
  `city`                VARCHAR(55)  DEFAULT NULL,
  `state`               VARCHAR(55)  DEFAULT NULL,
  `postal_code`         VARCHAR(8)   DEFAULT NULL,
  `country_id`          INT DEFAULT NULL,
  `country`             VARCHAR(100) DEFAULT NULL,
  `latitude`            VARCHAR(250) DEFAULT NULL,
  `longitude`           VARCHAR(250) DEFAULT NULL,
  `customer_group_id`   INT DEFAULT NULL,
  `customer_group_name` VARCHAR(100) DEFAULT NULL,
  `price_group_id`      INT DEFAULT NULL,
  `price_group_name`    VARCHAR(50)  DEFAULT NULL,
  `payment_term`        INT DEFAULT 0,
  `credit_limit`        DECIMAL(11,2) DEFAULT NULL,
  `deposit_amount`      DECIMAL(25,2) NOT NULL DEFAULT 0.00,
  `deposit_amount_usd`  DECIMAL(25,4) NOT NULL DEFAULT 0,
  `deposit_amount_khr`  DECIMAL(25,4) NOT NULL DEFAULT 0,
  `deposit_amount_thb`  DECIMAL(25,4) NOT NULL DEFAULT 0,
  `level_id`            INT DEFAULT NULL,
  `member_expiry`       DATE DEFAULT NULL,
  `source`              VARCHAR(200) DEFAULT NULL,
  `logo`                VARCHAR(255) DEFAULT NULL,
  `attachment`          VARCHAR(255) DEFAULT NULL,
  `telegram_chat_id`    VARCHAR(100) DEFAULT NULL,
  `cf1` VARCHAR(100) DEFAULT NULL, `cf2` VARCHAR(100) DEFAULT NULL, `cf3` VARCHAR(100) DEFAULT NULL,
  `cf4` VARCHAR(100) DEFAULT NULL, `cf5` VARCHAR(100) DEFAULT NULL, `cf6` VARCHAR(100) DEFAULT NULL,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  KEY `idx_prof_cgroup` (`customer_group_id`),
  CONSTRAINT `fk_prof_user` FOREIGN KEY (`user_id`) REFERENCES aura_users (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aura_company_user_map (
  `old_company_id` INT NOT NULL,
  `new_user_id`    INT UNSIGNED NOT NULL,
  `group_name`     VARCHAR(20) NOT NULL,
  `moved_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`old_company_id`),
  UNIQUE KEY `uq_map_user` (`new_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- STEP 6  |  LOGIN LOGS: record where (admin / website) and success
-- =====================================================================
ALTER TABLE aura_user_logins
  ADD COLUMN IF NOT EXISTS `area`       ENUM('admin','website') NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS `success`    TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `user_agent` VARCHAR(255) DEFAULT NULL;

ALTER TABLE aura_login_attempts
  ADD COLUMN IF NOT EXISTS `area` ENUM('admin','website') NOT NULL DEFAULT 'admin';

SET @exist_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_user_logins' AND INDEX_NAME = 'idx_ul_user_time');
SET @sql := IF(@exist_idx = 0, 'ALTER TABLE aura_user_logins ADD KEY idx_ul_user_time (user_id, time)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_login_attempts' AND INDEX_NAME = 'idx_la_login_time');
SET @sql := IF(@exist_idx = 0, 'ALTER TABLE aura_login_attempts ADD KEY idx_la_login_time (login, time)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- =====================================================================
-- STEP 7  |  PERMISSION CONTROL: unpivot the wide aura_permissions table
-- =====================================================================
DROP PROCEDURE IF EXISTS sp_aura_import_permissions;
DELIMITER $$
CREATE PROCEDURE sp_aura_import_permissions()
BEGIN
  DECLARE v_col  VARCHAR(64);
  DECLARE v_done INT DEFAULT 0;
  DECLARE cur CURSOR FOR
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'aura_permissions'
      AND COLUMN_NAME NOT IN ('id', 'group_id')
    ORDER BY ORDINAL_POSITION;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  OPEN cur;
  rd: LOOP
    FETCH cur INTO v_col;
    IF v_done = 1 THEN LEAVE rd; END IF;

    INSERT IGNORE INTO aura_permission_keys (permission_key, module, action, label)
    VALUES (v_col,
            SUBSTRING_INDEX(v_col, '-', 1),
            IF(LOCATE('-', v_col) > 0, SUBSTRING(v_col, LOCATE('-', v_col) + 1), 'access'),
            REPLACE(REPLACE(v_col, '-', ' / '), '_', ' '));

    SET @sql = CONCAT(
      'INSERT IGNORE INTO aura_group_permissions (group_id, permission_key, allowed) ',
      'SELECT p.group_id, ', QUOTE(v_col), ', MAX(IF(COALESCE(p.`', v_col, '`, 0) <> 0, 1, 0)) ',
      'FROM aura_permissions p JOIN aura_groups g ON g.id = p.group_id GROUP BY p.group_id');
    PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;
  END LOOP;
  CLOSE cur;
END $$

DROP FUNCTION IF EXISTS aura_user_can $$
CREATE FUNCTION aura_user_can(p_user_id INT UNSIGNED, p_key VARCHAR(100))
RETURNS TINYINT(1)
READS SQL DATA
BEGIN
  DECLARE v_group   INT DEFAULT NULL;
  DECLARE v_status  VARCHAR(20) DEFAULT NULL;
  DECLARE v_level   INT DEFAULT NULL;
  DECLARE v_effect  VARCHAR(10) DEFAULT NULL;
  DECLARE v_allowed TINYINT DEFAULT NULL;

  SELECT group_id, status INTO v_group, v_status
    FROM aura_users WHERE id = p_user_id AND deleted_at IS NULL;
  IF v_group IS NULL OR v_status <> 'active' THEN RETURN 0; END IF;

  SELECT effect INTO v_effect FROM aura_user_permissions
    WHERE user_id = p_user_id AND permission_key = p_key;
  IF v_effect = 'deny'  THEN RETURN 0; END IF;
  IF v_effect = 'allow' THEN RETURN 1; END IF;

  SELECT level INTO v_level FROM aura_groups WHERE id = v_group;
  IF v_level = 1 THEN RETURN 1; END IF;            -- owner bypass

  SELECT allowed INTO v_allowed FROM aura_group_permissions
    WHERE group_id = v_group AND permission_key = p_key;
  RETURN COALESCE(v_allowed, 0);
END $$

DELIMITER ;

CALL sp_aura_import_permissions();

-- new roles start with the same rights as 'branch'
INSERT IGNORE INTO aura_group_permissions (group_id, permission_key, allowed)
SELECT 30, permission_key, allowed FROM aura_group_permissions WHERE group_id = 3;
INSERT IGNORE INTO aura_group_permissions (group_id, permission_key, allowed)
SELECT 31, permission_key, allowed FROM aura_group_permissions WHERE group_id = 3;

-- website permission keys
INSERT INTO aura_permission_keys (permission_key, module, action, area, label) VALUES
  ('web.catalog.view',   'web', 'catalog.view',   'website', 'Browse products'),
  ('web.cart.use',       'web', 'cart.use',       'website', 'Use cart'),
  ('web.rfq.create',     'web', 'rfq.create',     'website', 'Send quote request'),
  ('web.orders.view',    'web', 'orders.view',    'website', 'See own orders'),
  ('web.profile.edit',   'web', 'profile.edit',   'website', 'Edit own profile'),
  ('web.products.manage','web', 'products.manage','website', 'Supplier: manage own products'),
  ('web.orders.fulfil',  'web', 'orders.fulfil',  'website', 'Supplier: process orders')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO aura_group_permissions (group_id, permission_key, allowed) VALUES
  (4,'web.catalog.view',1),(4,'web.cart.use',1),(4,'web.rfq.create',1),(4,'web.orders.view',1),(4,'web.profile.edit',1),
  (5,'web.catalog.view',1),(5,'web.products.manage',1),(5,'web.orders.fulfil',1),(5,'web.orders.view',1),(5,'web.profile.edit',1)
ON DUPLICATE KEY UPDATE allowed = VALUES(allowed);


-- =====================================================================
-- STEP 8  |  USER <-> BRANCH links
-- =====================================================================
INSERT IGNORE INTO aura_user_billers (user_id, biller_id, is_default)
SELECT u.id, c.id, 1
FROM aura_users u
JOIN aura_companies c ON c.id = u.biller_id AND c.company_type IN ('branch','store','shop','biller');

INSERT IGNORE INTO aura_user_billers (user_id, biller_id, is_default)
SELECT u.id, c.id, 0
FROM aura_users u
JOIN JSON_TABLE(CONCAT('[', REPLACE(u.multi_biller, ' ', ''), ']'), '$[*]' COLUMNS (b INT PATH '$')) jt
JOIN aura_companies c ON c.id = jt.b AND c.company_type IN ('branch','store','shop','biller')
WHERE u.multi_biller REGEXP '^[0-9, ]+$';


-- =====================================================================
-- STEP 9  |  MOVE customers / suppliers / drivers  aura_companies -> aura_users
-- =====================================================================
INSERT INTO aura_users
  (id, group_id, emp_id, first_name, username, `password`, gender, company, phone, email,
   biller_id, warehouse_id, active, created_on, `position`, user_type, award_points, zone_id,
   save_point, basic_salary, commission, `status`, register_source, password_algo, legacy_company_id)
SELECT
  100000 + c.id,
  CASE c.group_name WHEN 'customer' THEN 4 WHEN 'supplier' THEN 5 ELSE 18 END,
  0,
  LEFT(c.name, 50),
  CONCAT(CASE c.group_name WHEN 'customer' THEN 'cus' WHEN 'supplier' THEN 'sup' ELSE 'drv' END, c.id),
  '!',                                   -- unusable hash: person must use "forgot password" before first login
  LEFT(c.gender, 20),
  LEFT(c.company, 100),
  LEFT(c.phone, 20),
  IF(NULLIF(TRIM(c.email), '') IS NOT NULL AND c.rn = 1
       AND NOT EXISTS (SELECT 1 FROM aura_users x WHERE LOWER(x.email) = LOWER(TRIM(c.email))),
     LEFT(TRIM(c.email), 100),
     CONCAT(CASE c.group_name WHEN 'customer' THEN 'cus' WHEN 'supplier' THEN 'sup' ELSE 'drv' END, c.id, '@no-email.local')),
  NULL,
  '1',
  COALESCE(c.is_active, 1),
  UNIX_TIMESTAMP(COALESCE(c.`date`, NOW())),
  0,
  c.group_name,
  COALESCE(c.award_points, 0),
  c.zone_id,
  COALESCE(c.save_point, 0),
  0, 0,
  IF(COALESCE(c.is_active, 1) = 1, 'active', 'suspended'),
  'import',
  'legacy',
  c.id
FROM (
  SELECT c0.*, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(c0.email)) ORDER BY c0.id) AS rn
  FROM aura_companies c0
  WHERE c0.group_name IN ('customer', 'supplier', 'driver')
) c
WHERE NOT EXISTS (SELECT 1 FROM aura_users u WHERE u.legacy_company_id = c.id);

INSERT IGNORE INTO aura_company_user_map (old_company_id, new_user_id, group_name)
SELECT u.legacy_company_id, u.id, u.user_type FROM aura_users u WHERE u.legacy_company_id IS NOT NULL;

INSERT INTO aura_user_profiles
  (user_id, name_kh, company_kh, contact_person, business_type, vat_no, gst_no, address, address_kh,
   village, commune, street_no, city, state, postal_code, country_id, country, latitude, longitude,
   customer_group_id, customer_group_name, price_group_id, price_group_name, payment_term, credit_limit,
   deposit_amount, deposit_amount_usd, deposit_amount_khr, deposit_amount_thb, level_id, member_expiry,
   source, logo, attachment, telegram_chat_id, cf1, cf2, cf3, cf4, cf5, cf6)
SELECT
  u.id, c.name_kh, c.company_kh, c.contact_person, c.business_type, c.vat_no, c.gst_no, c.address, c.address_kh,
  c.village, c.commune, c.street_no, c.city, c.state, c.postal_code, c.country_id, c.country, c.latitude, c.longitude,
  c.customer_group_id, c.customer_group_name, c.price_group_id, c.price_group_name, c.payment_term, c.credit_limit,
  c.deposit_amount, c.deposit_amount_usd, c.deposit_amount_khr, c.deposit_amount_thb, c.level_id, c.member_expiry,
  c.source, c.logo, c.attachment, c.telegram_chat_id, c.cf1, c.cf2, c.cf3, c.cf4, c.cf5, c.cf6
FROM aura_companies c
JOIN aura_users u ON u.legacy_company_id = c.id
WHERE NOT EXISTS (SELECT 1 FROM aura_user_profiles p WHERE p.user_id = u.id);


-- =====================================================================
-- STEP 11 |  COMPATIBILITY VIEWS
-- =====================================================================
CREATE OR REPLACE VIEW aura_v_customers AS
SELECT u.id, u.legacy_company_id AS old_company_id, u.username, u.company, u.first_name AS `name`, u.phone, u.email,
       u.award_points, u.zone_id, u.status, u.created_at,
       p.name_kh, p.company_kh, p.vat_no, p.address, p.city, p.customer_group_id, p.price_group_id,
       p.payment_term, p.credit_limit, p.deposit_amount
FROM aura_users u LEFT JOIN aura_user_profiles p ON p.user_id = u.id
WHERE u.group_id = 4 AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW aura_v_suppliers AS
SELECT u.id, u.legacy_company_id AS old_company_id, u.username, u.company, u.first_name AS `name`, u.phone, u.email,
       u.zone_id, u.status, u.created_at,
       p.name_kh, p.company_kh, p.vat_no, p.address, p.city, p.payment_term
FROM aura_users u LEFT JOIN aura_user_profiles p ON p.user_id = u.id
WHERE u.group_id = 5 AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW aura_v_billers AS
SELECT id, code, `name`, company_type, phone, email, address, logo, manager_user_id, status
FROM aura_companies
WHERE company_type IN ('branch','store','shop','biller') AND deleted_at IS NULL;

SET FOREIGN_KEY_CHECKS = 1;
