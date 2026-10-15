const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '43200111',
    database: 'aura_v1_db',
    multipleStatements: true
  });

  console.log('Connected to MySQL 9.1.0 (aura_v1_db). Starting access control migration...');

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('SET SQL_SAFE_UPDATES = 0');

  // Helper to check if column exists
  async function hasColumn(table, column) {
    const [rows] = await conn.query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = "aura_v1_db" AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [table, column]
    );
    return rows[0].cnt > 0;
  }

  // Helper to check if index exists
  async function hasIndex(table, indexName) {
    const [rows] = await conn.query(
      'SELECT COUNT(*) as cnt FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = "aura_v1_db" AND TABLE_NAME = ? AND INDEX_NAME = ?',
      [table, indexName]
    );
    return rows[0].cnt > 0;
  }

  // Helper to check if table exists
  async function hasTable(table) {
    const [rows] = await conn.query(
      'SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = "aura_v1_db" AND TABLE_NAME = ?',
      [table]
    );
    return rows[0].cnt > 0;
  }

  // STEP 1: Backups
  console.log('STEP 1: Backups...');
  if (!await hasTable('aura_users_bak_20261015')) await conn.query('CREATE TABLE aura_users_bak_20261015 AS SELECT * FROM aura_users');
  if (!await hasTable('aura_groups_bak_20261015')) await conn.query('CREATE TABLE aura_groups_bak_20261015 AS SELECT * FROM aura_groups');
  if (!await hasTable('aura_permissions_bak_20261015')) await conn.query('CREATE TABLE aura_permissions_bak_20261015 AS SELECT * FROM aura_permissions');
  if (!await hasTable('aura_companies_bak_20261015')) await conn.query('CREATE TABLE aura_companies_bak_20261015 AS SELECT * FROM aura_companies');
  if (!await hasTable('aura_user_logins_bak_20261015')) await conn.query('CREATE TABLE aura_user_logins_bak_20261015 AS SELECT * FROM aura_user_logins');

  // STEP 2: aura_groups
  console.log('STEP 2: Upgrading aura_groups...');
  await conn.query('ALTER TABLE aura_groups MODIFY `name` VARCHAR(50) NOT NULL, MODIFY `description` VARCHAR(150) NOT NULL');
  if (!await hasColumn('aura_groups', 'level')) await conn.query('ALTER TABLE aura_groups ADD COLUMN `level` TINYINT UNSIGNED NOT NULL DEFAULT 50 COMMENT "1 = owner, bigger = less power"');
  if (!await hasColumn('aura_groups', 'allow_admin_login')) await conn.query('ALTER TABLE aura_groups ADD COLUMN `allow_admin_login` TINYINT(1) NOT NULL DEFAULT 0');
  if (!await hasColumn('aura_groups', 'allow_web_login')) await conn.query('ALTER TABLE aura_groups ADD COLUMN `allow_web_login` TINYINT(1) NOT NULL DEFAULT 0');
  if (!await hasColumn('aura_groups', 'allow_web_register')) await conn.query('ALTER TABLE aura_groups ADD COLUMN `allow_web_register` TINYINT(1) NOT NULL DEFAULT 0');
  if (!await hasColumn('aura_groups', 'requires_approval')) await conn.query('ALTER TABLE aura_groups ADD COLUMN `requires_approval` TINYINT(1) NOT NULL DEFAULT 0');
  if (!await hasColumn('aura_groups', 'is_system')) await conn.query('ALTER TABLE aura_groups ADD COLUMN `is_system` TINYINT(1) NOT NULL DEFAULT 0');
  if (!await hasColumn('aura_groups', 'created_at')) await conn.query('ALTER TABLE aura_groups ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
  if (!await hasColumn('aura_groups', 'updated_at')) await conn.query('ALTER TABLE aura_groups ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  if (!await hasIndex('aura_groups', 'uq_groups_name')) await conn.query('ALTER TABLE aura_groups ADD UNIQUE KEY `uq_groups_name` (`name`)');

  await conn.query(`
    INSERT IGNORE INTO aura_groups (id, name, description, status) VALUES
      (30, 'shop', 'Shop Manager', 1),
      (31, 'store', 'Store Manager', 1)
  `);

  await conn.query("UPDATE aura_groups SET level = 1, allow_admin_login = 1, is_system = 1 WHERE `name` = 'owner'");
  await conn.query("UPDATE aura_groups SET level = 2, allow_admin_login = 1, is_system = 1 WHERE `name` = 'admin'");
  await conn.query("UPDATE aura_groups SET level = 10, allow_admin_login = 1, is_system = 1 WHERE `name` = 'branch'");
  await conn.query("UPDATE aura_groups SET level = 12, allow_admin_login = 1 WHERE `name` IN ('shop','store')");
  await conn.query("UPDATE aura_groups SET level = 20, allow_admin_login = 1 WHERE `name` IN ('account','stock')");
  await conn.query("UPDATE aura_groups SET level = 30, allow_admin_login = 1 WHERE `name` IN ('cashier','salesman')");
  await conn.query("UPDATE aura_groups SET level = 40, allow_admin_login = 1 WHERE `name` IN ('employee','audit')");
  await conn.query("UPDATE aura_groups SET level = 60 WHERE `name` = 'driver'");
  await conn.query("UPDATE aura_groups SET level = 90, allow_web_login = 1, allow_web_register = 1, is_system = 1 WHERE `name` = 'customer'");
  await conn.query("UPDATE aura_groups SET level = 90, allow_web_login = 1, allow_web_register = 1, requires_approval = 1, is_system = 1 WHERE `name` = 'supplier'");

  // STEP 3: aura_users
  console.log('STEP 3: Upgrading aura_users...');
  await conn.query("UPDATE aura_users SET email = CONCAT(username, '@no-email.local') WHERE TRIM(COALESCE(email, '')) = ''");
  await conn.query(`
    UPDATE aura_users u
    JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(email)) ORDER BY id) AS rn FROM aura_users) d ON d.id = u.id
    SET u.email = CONCAT(u.username, '+dup', u.id, '@no-email.local')
    WHERE d.rn > 1
  `);

  await conn.query('ALTER TABLE aura_users MODIFY `group_id` MEDIUMINT UNSIGNED NOT NULL, MODIFY `avatar` VARCHAR(255) DEFAULT NULL');
  if (!await hasColumn('aura_users', 'status')) await conn.query('ALTER TABLE aura_users ADD COLUMN `status` ENUM("pending","active","suspended","blocked") NOT NULL DEFAULT "active"');
  if (!await hasColumn('aura_users', 'register_source')) await conn.query('ALTER TABLE aura_users ADD COLUMN `register_source` ENUM("admin","website","import","api") NOT NULL DEFAULT "admin"');
  if (!await hasColumn('aura_users', 'email_verified_at')) await conn.query('ALTER TABLE aura_users ADD COLUMN `email_verified_at` DATETIME NULL');
  if (!await hasColumn('aura_users', 'approved_by')) await conn.query('ALTER TABLE aura_users ADD COLUMN `approved_by` INT UNSIGNED NULL');
  if (!await hasColumn('aura_users', 'approved_at')) await conn.query('ALTER TABLE aura_users ADD COLUMN `approved_at` DATETIME NULL');
  if (!await hasColumn('aura_users', 'last_login_at')) await conn.query('ALTER TABLE aura_users ADD COLUMN `last_login_at` DATETIME NULL');
  if (!await hasColumn('aura_users', 'failed_login_count')) await conn.query('ALTER TABLE aura_users ADD COLUMN `failed_login_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0');
  if (!await hasColumn('aura_users', 'locked_until')) await conn.query('ALTER TABLE aura_users ADD COLUMN `locked_until` DATETIME NULL');
  if (!await hasColumn('aura_users', 'password_algo')) await conn.query('ALTER TABLE aura_users ADD COLUMN `password_algo` VARCHAR(20) NOT NULL DEFAULT "legacy" COMMENT "legacy | bcrypt | argon2id"');
  if (!await hasColumn('aura_users', 'must_change_password')) await conn.query('ALTER TABLE aura_users ADD COLUMN `must_change_password` TINYINT(1) NOT NULL DEFAULT 0');
  if (!await hasColumn('aura_users', 'theme')) await conn.query('ALTER TABLE aura_users ADD COLUMN `theme` VARCHAR(10) NOT NULL DEFAULT "light"');
  if (!await hasColumn('aura_users', 'legacy_company_id')) await conn.query('ALTER TABLE aura_users ADD COLUMN `legacy_company_id` INT NULL COMMENT "old aura_companies.id this person came from"');
  if (!await hasColumn('aura_users', 'created_at')) await conn.query('ALTER TABLE aura_users ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');
  if (!await hasColumn('aura_users', 'updated_at')) await conn.query('ALTER TABLE aura_users ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  if (!await hasColumn('aura_users', 'deleted_at')) await conn.query('ALTER TABLE aura_users ADD COLUMN `deleted_at` DATETIME NULL');

  if (!await hasIndex('aura_users', 'idx_users_status')) await conn.query('ALTER TABLE aura_users ADD KEY `idx_users_status` (`status`, `deleted_at`)');
  if (!await hasIndex('aura_users', 'idx_users_phone')) await conn.query('ALTER TABLE aura_users ADD KEY `idx_users_phone` (`phone`)');

  await conn.query("UPDATE aura_users SET status = IF(COALESCE(active, 0) = 1, 'active', 'suspended'), created_at = IF(created_on > 0, FROM_UNIXTIME(created_on), NOW())");
  await conn.query("UPDATE aura_users SET password_algo = 'bcrypt' WHERE `password` LIKE '$2%'");

  // STEP 4: aura_companies -> ONLY biller / store / shop / branch
  console.log('STEP 4: Upgrading aura_companies...');
  if (!await hasColumn('aura_companies', 'company_type')) await conn.query('ALTER TABLE aura_companies ADD COLUMN `company_type` ENUM("biller","branch","store","shop","warehouse","other") NOT NULL DEFAULT "other"');
  if (!await hasColumn('aura_companies', 'manager_user_id')) await conn.query('ALTER TABLE aura_companies ADD COLUMN `manager_user_id` INT UNSIGNED NULL');
  if (!await hasColumn('aura_companies', 'status')) await conn.query('ALTER TABLE aura_companies ADD COLUMN `status` ENUM("active","inactive") NOT NULL DEFAULT "active"');
  if (!await hasColumn('aura_companies', 'updated_at')) await conn.query('ALTER TABLE aura_companies ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  if (!await hasColumn('aura_companies', 'deleted_at')) await conn.query('ALTER TABLE aura_companies ADD COLUMN `deleted_at` DATETIME NULL');
  if (!await hasIndex('aura_companies', 'idx_companies_type')) await conn.query('ALTER TABLE aura_companies ADD KEY `idx_companies_type` (`company_type`, `status`)');

  await conn.query("UPDATE aura_companies SET company_type = 'branch' WHERE group_name = 'biller'");
  await conn.query("UPDATE aura_companies SET status = IF(COALESCE(is_active, 1) = 1, 'active', 'inactive')");

  // STEP 5: New Tables
  console.log('STEP 5: Creating normalized access-control tables...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS aura_user_billers (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      biller_id INT NOT NULL COMMENT 'aura_companies.id',
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_biller (user_id, biller_id),
      KEY idx_biller (biller_id),
      CONSTRAINT fk_ub_user FOREIGN KEY (user_id) REFERENCES aura_users (id) ON DELETE CASCADE,
      CONSTRAINT fk_ub_biller FOREIGN KEY (biller_id) REFERENCES aura_companies (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS aura_permission_keys (
      permission_key VARCHAR(100) NOT NULL,
      module VARCHAR(60) NOT NULL,
      action VARCHAR(80) NOT NULL,
      area ENUM('admin','website') NOT NULL DEFAULT 'admin',
      label VARCHAR(150) DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      PRIMARY KEY (permission_key),
      KEY idx_pk_module (module)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS aura_group_permissions (
      group_id MEDIUMINT UNSIGNED NOT NULL,
      permission_key VARCHAR(100) NOT NULL,
      allowed TINYINT(1) NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (group_id, permission_key),
      KEY idx_gp_key (permission_key),
      CONSTRAINT fk_gp_group FOREIGN KEY (group_id) REFERENCES aura_groups (id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_gp_key FOREIGN KEY (permission_key) REFERENCES aura_permission_keys (permission_key) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS aura_user_permissions (
      user_id INT UNSIGNED NOT NULL,
      permission_key VARCHAR(100) NOT NULL,
      effect ENUM('allow','deny') NOT NULL,
      created_by INT UNSIGNED NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, permission_key),
      CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES aura_users (id) ON DELETE CASCADE,
      CONSTRAINT fk_up_key FOREIGN KEY (permission_key) REFERENCES aura_permission_keys (permission_key) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS aura_user_tokens (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      type ENUM('refresh','remember','password_reset','email_verify') NOT NULL,
      area ENUM('admin','website') NOT NULL DEFAULT 'admin',
      token_hash CHAR(64) NOT NULL,
      ip_address VARCHAR(45) DEFAULT NULL,
      user_agent VARCHAR(255) DEFAULT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      revoked_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_token_hash (token_hash),
      KEY idx_token_user (user_id, type),
      KEY idx_token_exp (expires_at),
      CONSTRAINT fk_tok_user FOREIGN KEY (user_id) REFERENCES aura_users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS aura_user_profiles (
      user_id INT UNSIGNED NOT NULL,
      name_kh VARCHAR(100) DEFAULT NULL,
      company_kh VARCHAR(100) DEFAULT NULL,
      contact_person VARCHAR(250) DEFAULT NULL,
      business_type VARCHAR(250) DEFAULT NULL,
      vat_no VARCHAR(100) DEFAULT NULL,
      gst_no VARCHAR(100) DEFAULT NULL,
      address VARCHAR(255) DEFAULT NULL,
      address_kh VARCHAR(300) DEFAULT NULL,
      village VARCHAR(250) DEFAULT NULL,
      commune VARCHAR(250) DEFAULT NULL,
      street_no VARCHAR(250) DEFAULT NULL,
      city VARCHAR(55) DEFAULT NULL,
      state VARCHAR(55) DEFAULT NULL,
      postal_code VARCHAR(8) DEFAULT NULL,
      country_id INT DEFAULT NULL,
      country VARCHAR(100) DEFAULT NULL,
      latitude VARCHAR(250) DEFAULT NULL,
      longitude VARCHAR(250) DEFAULT NULL,
      customer_group_id INT DEFAULT NULL,
      customer_group_name VARCHAR(100) DEFAULT NULL,
      price_group_id INT DEFAULT NULL,
      price_group_name VARCHAR(50) DEFAULT NULL,
      payment_term INT DEFAULT 0,
      credit_limit DECIMAL(11,2) DEFAULT NULL,
      deposit_amount DECIMAL(25,2) NOT NULL DEFAULT 0.00,
      deposit_amount_usd DECIMAL(25,4) NOT NULL DEFAULT 0,
      deposit_amount_khr DECIMAL(25,4) NOT NULL DEFAULT 0,
      deposit_amount_thb DECIMAL(25,4) NOT NULL DEFAULT 0,
      level_id INT DEFAULT NULL,
      member_expiry DATE DEFAULT NULL,
      source VARCHAR(200) DEFAULT NULL,
      logo VARCHAR(255) DEFAULT NULL,
      attachment VARCHAR(255) DEFAULT NULL,
      telegram_chat_id VARCHAR(100) DEFAULT NULL,
      cf1 VARCHAR(100) DEFAULT NULL, cf2 VARCHAR(100) DEFAULT NULL, cf3 VARCHAR(100) DEFAULT NULL,
      cf4 VARCHAR(100) DEFAULT NULL, cf5 VARCHAR(100) DEFAULT NULL, cf6 VARCHAR(100) DEFAULT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id),
      KEY idx_prof_cgroup (customer_group_id),
      CONSTRAINT fk_prof_user FOREIGN KEY (user_id) REFERENCES aura_users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS aura_company_user_map (
      old_company_id INT NOT NULL,
      new_user_id INT UNSIGNED NOT NULL,
      group_name VARCHAR(20) NOT NULL,
      moved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (old_company_id),
      UNIQUE KEY uq_map_user (new_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // STEP 6: Login logs
  console.log('STEP 6: Upgrading login logs...');
  if (!await hasColumn('aura_user_logins', 'area')) await conn.query('ALTER TABLE aura_user_logins ADD COLUMN `area` ENUM("admin","website") NOT NULL DEFAULT "admin"');
  if (!await hasColumn('aura_user_logins', 'success')) await conn.query('ALTER TABLE aura_user_logins ADD COLUMN `success` TINYINT(1) NOT NULL DEFAULT 1');
  if (!await hasColumn('aura_user_logins', 'user_agent')) await conn.query('ALTER TABLE aura_user_logins ADD COLUMN `user_agent` VARCHAR(255) DEFAULT NULL');
  if (!await hasColumn('aura_login_attempts', 'area')) await conn.query('ALTER TABLE aura_login_attempts ADD COLUMN `area` ENUM("admin","website") NOT NULL DEFAULT "admin"');

  if (!await hasIndex('aura_user_logins', 'idx_ul_user_time')) await conn.query('ALTER TABLE aura_user_logins ADD KEY `idx_ul_user_time` (`user_id`, `time`)');
  if (!await hasIndex('aura_login_attempts', 'idx_la_login_time')) await conn.query('ALTER TABLE aura_login_attempts ADD KEY `idx_la_login_time` (`login`, `time`)');

  // STEP 7: Unpivot wide aura_permissions
  console.log('STEP 7: Populating aura_permission_keys and aura_group_permissions from aura_permissions...');
  const [cols] = await conn.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = "aura_v1_db" AND TABLE_NAME = "aura_permissions"
      AND COLUMN_NAME NOT IN ("id", "group_id")
    ORDER BY ORDINAL_POSITION
  `);

  console.log(`Found ${cols.length} permission columns to unpivot.`);
  for (const c of cols) {
    const colName = c.COLUMN_NAME;
    const parts = colName.split('-');
    const module = parts[0];
    const action = parts.length > 1 ? parts.slice(1).join('-') : 'access';
    const label = colName.replace(/-/g, ' / ').replace(/_/g, ' ');

    await conn.query(`
      INSERT IGNORE INTO aura_permission_keys (permission_key, module, action, label)
      VALUES (?, ?, ?, ?)
    `, [colName, module, action, label]);

    await conn.query(`
      INSERT IGNORE INTO aura_group_permissions (group_id, permission_key, allowed)
      SELECT p.group_id, ?, MAX(IF(COALESCE(p.\`${colName}\`, 0) <> 0, 1, 0))
      FROM aura_permissions p JOIN aura_groups g ON g.id = p.group_id GROUP BY p.group_id
    `, [colName]);
  }

  // Clone rights to shop & store
  await conn.query(`
    INSERT IGNORE INTO aura_group_permissions (group_id, permission_key, allowed)
    SELECT 30, permission_key, allowed FROM aura_group_permissions WHERE group_id = 3
  `);
  await conn.query(`
    INSERT IGNORE INTO aura_group_permissions (group_id, permission_key, allowed)
    SELECT 31, permission_key, allowed FROM aura_group_permissions WHERE group_id = 3
  `);

  // Website permission keys
  await conn.query(`
    INSERT INTO aura_permission_keys (permission_key, module, action, area, label) VALUES
      ('web.catalog.view',   'web', 'catalog.view',   'website', 'Browse products'),
      ('web.cart.use',       'web', 'cart.use',       'website', 'Use cart'),
      ('web.rfq.create',     'web', 'rfq.create',     'website', 'Send quote request'),
      ('web.orders.view',    'web', 'orders.view',    'website', 'See own orders'),
      ('web.profile.edit',   'web', 'profile.edit',   'website', 'Edit own profile'),
      ('web.products.manage','web', 'products.manage','website', 'Supplier: manage own products'),
      ('web.orders.fulfil',  'web', 'orders.fulfil',  'website', 'Supplier: process orders')
    ON DUPLICATE KEY UPDATE label = VALUES(label)
  `);

  await conn.query(`
    INSERT INTO aura_group_permissions (group_id, permission_key, allowed) VALUES
      (4,'web.catalog.view',1),(4,'web.cart.use',1),(4,'web.rfq.create',1),(4,'web.orders.view',1),(4,'web.profile.edit',1),
      (5,'web.catalog.view',1),(5,'web.products.manage',1),(5,'web.orders.fulfil',1),(5,'web.orders.view',1),(5,'web.profile.edit',1)
    ON DUPLICATE KEY UPDATE allowed = VALUES(allowed)
  `);

  // Create aura_user_can function
  console.log('Creating aura_user_can SQL function...');
  await conn.query('DROP FUNCTION IF EXISTS aura_user_can');
  await conn.query(`
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
      IF v_level = 1 THEN RETURN 1; END IF;

      SELECT allowed INTO v_allowed FROM aura_group_permissions
        WHERE group_id = v_group AND permission_key = p_key;
      RETURN COALESCE(v_allowed, 0);
    END
  `);

  // STEP 8: aura_user_billers
  console.log('STEP 8: Linking aura_user_billers...');
  await conn.query(`
    INSERT IGNORE INTO aura_user_billers (user_id, biller_id, is_default)
    SELECT u.id, c.id, 1
    FROM aura_users u
    JOIN aura_companies c ON c.id = u.biller_id AND c.company_type IN ('branch','store','shop','biller')
  `);

  // STEP 9: Migrate customers/suppliers/drivers
  console.log('STEP 9: Migrating customers/suppliers/drivers from aura_companies...');
  await conn.query(`
    INSERT INTO aura_users
      (id, group_id, emp_id, first_name, username, \`password\`, gender, company, phone, email,
       biller_id, warehouse_id, active, created_on, \`position\`, user_type, award_points, zone_id,
       save_point, basic_salary, commission, \`status\`, register_source, password_algo, legacy_company_id)
    SELECT
      100000 + c.id,
      CASE c.group_name WHEN 'customer' THEN 4 WHEN 'supplier' THEN 5 ELSE 18 END,
      0,
      LEFT(c.name, 50),
      CONCAT(CASE c.group_name WHEN 'customer' THEN 'cus' WHEN 'supplier' THEN 'sup' ELSE 'drv' END, c.id),
      '!',
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
      UNIX_TIMESTAMP(COALESCE(c.\`date\`, NOW())),
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
    WHERE NOT EXISTS (SELECT 1 FROM aura_users u WHERE u.legacy_company_id = c.id)
  `);

  await conn.query(`
    INSERT IGNORE INTO aura_company_user_map (old_company_id, new_user_id, group_name)
    SELECT u.legacy_company_id, u.id, u.user_type FROM aura_users u WHERE u.legacy_company_id IS NOT NULL
  `);

  await conn.query(`
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
    WHERE NOT EXISTS (SELECT 1 FROM aura_user_profiles p WHERE p.user_id = u.id)
  `);

  // STEP 11: Views
  console.log('STEP 11: Creating compatibility views...');
  await conn.query(`
    CREATE OR REPLACE VIEW aura_v_customers AS
    SELECT u.id, u.legacy_company_id AS old_company_id, u.username, u.company, u.first_name AS \`name\`, u.phone, u.email,
           u.award_points, u.zone_id, u.status, u.created_at,
           p.name_kh, p.company_kh, p.vat_no, p.address, p.city, p.customer_group_id, p.price_group_id,
           p.payment_term, p.credit_limit, p.deposit_amount
    FROM aura_users u LEFT JOIN aura_user_profiles p ON p.user_id = u.id
    WHERE u.group_id = 4 AND u.deleted_at IS NULL
  `);

  await conn.query(`
    CREATE OR REPLACE VIEW aura_v_suppliers AS
    SELECT u.id, u.legacy_company_id AS old_company_id, u.username, u.company, u.first_name AS \`name\`, u.phone, u.email,
           u.zone_id, u.status, u.created_at,
           p.name_kh, p.company_kh, p.vat_no, p.address, p.city, p.payment_term
    FROM aura_users u LEFT JOIN aura_user_profiles p ON p.user_id = u.id
    WHERE u.group_id = 5 AND u.deleted_at IS NULL
  `);

  await conn.query(`
    CREATE OR REPLACE VIEW aura_v_billers AS
    SELECT id, code, \`name\`, company_type, phone, email, address, logo, manager_user_id, status
    FROM aura_companies
    WHERE company_type IN ('branch','store','shop','biller') AND deleted_at IS NULL
  `);

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✅ Access-control migration completed successfully!');

  // Verify
  const [testCan] = await conn.query('SELECT aura_user_can(1, "sales-add") AS owner_can_sales, aura_user_can(1, "system_settings") AS owner_can_settings');
  console.log('Test aura_user_can:', testCan[0]);

  const [counts] = await conn.query(`
    SELECT 
      (SELECT COUNT(*) FROM aura_users) AS total_users,
      (SELECT COUNT(*) FROM aura_permission_keys) AS permission_keys,
      (SELECT COUNT(*) FROM aura_group_permissions WHERE allowed = 1) AS allowed_group_perms,
      (SELECT COUNT(*) FROM aura_user_billers) AS user_billers,
      (SELECT COUNT(*) FROM aura_user_profiles) AS user_profiles
  `);
  console.log('Verification counts:', counts[0]);

  await conn.end();
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
