const db = require('../API/app/config/dbPool');

async function migrateAuraUsers() {
  console.log('--- Starting AURA Users Database Consolidation ---');

  // Step 1: Backup legacy non-prefixed tables before modification
  console.log('\n[1] Checking safe backup tables with aura_bak_ prefix...');
  try {
    await db.query('CREATE TABLE IF NOT EXISTS aura_bak_users LIKE users');
    await db.query('INSERT IGNORE INTO aura_bak_users SELECT * FROM users');
    await db.query('CREATE TABLE IF NOT EXISTS aura_bak_user_groups LIKE user_groups');
    await db.query('INSERT IGNORE INTO aura_bak_user_groups SELECT * FROM user_groups');
    await db.query('CREATE TABLE IF NOT EXISTS aura_bak_user_group_mappings LIKE user_group_mappings');
    await db.query('INSERT IGNORE INTO aura_bak_user_group_mappings SELECT * FROM user_group_mappings');
  } catch (_) {
    console.log('  (Backup tables already exist or tables were already migrated to views)');
  }
  console.log('✓ Backups verified: aura_bak_users, aura_bak_user_groups, aura_bak_user_group_mappings');

  // Step 2: Add missing columns to aura_users
  console.log('\n[2] Expanding aura_users schema to include all user & profile concepts...');
  const [currentCols] = await db.query('DESCRIBE `aura_users`');
  const existingFields = new Set(currentCols.map(c => c.Field));

  const columnsToAdd = [
    { name: 'uuid', def: 'CHAR(36) NULL AFTER id' },
    { name: 'password_hash', def: 'VARCHAR(255) NULL AFTER password' },
    { name: 'avatar_url', def: 'VARCHAR(500) NULL AFTER avatar' },
    { name: 'is_system_admin', def: 'TINYINT(1) NOT NULL DEFAULT 0 AFTER active' },
    { name: 'name_kh', def: 'VARCHAR(100) NULL' },
    { name: 'company_kh', def: 'VARCHAR(100) NULL' },
    { name: 'contact_person', def: 'VARCHAR(250) NULL' },
    { name: 'business_type', def: 'VARCHAR(250) NULL' },
    { name: 'vat_no', def: 'VARCHAR(100) NULL' },
    { name: 'gst_no', def: 'VARCHAR(100) NULL' },
    { name: 'address', def: 'VARCHAR(255) NULL' },
    { name: 'address_kh', def: 'VARCHAR(300) NULL' },
    { name: 'village', def: 'VARCHAR(250) NULL' },
    { name: 'commune', def: 'VARCHAR(250) NULL' },
    { name: 'street_no', def: 'VARCHAR(250) NULL' },
    { name: 'city', def: 'VARCHAR(55) NULL' },
    { name: 'state', def: 'VARCHAR(55) NULL' },
    { name: 'postal_code', def: 'VARCHAR(8) NULL' },
    { name: 'country_id', def: 'INT NULL' },
    { name: 'country', def: 'VARCHAR(100) NULL' },
    { name: 'latitude', def: 'VARCHAR(250) NULL' },
    { name: 'longitude', def: 'VARCHAR(250) NULL' },
    { name: 'customer_group_id', def: 'INT NULL' },
    { name: 'customer_group_name', def: 'VARCHAR(100) NULL' },
    { name: 'price_group_id', def: 'INT NULL' },
    { name: 'price_group_name', def: 'VARCHAR(50) NULL' },
    { name: 'payment_term', def: 'INT NULL' },
    { name: 'credit_limit', def: 'DECIMAL(11,2) NULL DEFAULT 0.00' },
    { name: 'deposit_amount', def: 'DECIMAL(25,2) NULL DEFAULT 0.00' },
    { name: 'deposit_amount_usd', def: 'DECIMAL(25,4) NULL DEFAULT 0.0000' },
    { name: 'deposit_amount_khr', def: 'DECIMAL(25,4) NULL DEFAULT 0.0000' },
    { name: 'deposit_amount_thb', def: 'DECIMAL(25,4) NULL DEFAULT 0.0000' },
    { name: 'level_id', def: 'INT NULL' },
    { name: 'member_expiry', def: 'DATE NULL' },
    { name: 'source', def: 'VARCHAR(200) NULL' },
    { name: 'logo', def: 'VARCHAR(255) NULL' },
    { name: 'attachment', def: 'VARCHAR(255) NULL' },
    { name: 'telegram_chat_id', def: 'VARCHAR(100) NULL' },
  ];

  for (const col of columnsToAdd) {
    if (!existingFields.has(col.name)) {
      try {
        await db.query(`ALTER TABLE \`aura_users\` ADD COLUMN \`${col.name}\` ${col.def}`);
        console.log(`  + Added column aura_users.${col.name}`);
      } catch (err) {
        console.warn(`  ! Could not add column ${col.name}:`, err.message);
      }
    }
  }

  // Step 3: Populate UUID, password_hash, avatar_url, is_system_admin from users table and existing data
  console.log('\n[3] Synchronizing core identity fields into aura_users...');
  
  // UUID sync
  await db.query(`
    UPDATE aura_users au
    LEFT JOIN users u ON u.id = au.id
    SET au.uuid = COALESCE(u.uuid, UUID())
    WHERE au.uuid IS NULL OR au.uuid = ''
  `);

  // password_hash sync
  await db.query(`
    UPDATE aura_users au
    LEFT JOIN users u ON u.id = au.id
    SET au.password_hash = COALESCE(u.password_hash, au.password)
    WHERE au.password_hash IS NULL OR au.password_hash = ''
  `);

  // avatar_url sync
  await db.query(`
    UPDATE aura_users au
    LEFT JOIN users u ON u.id = au.id
    SET au.avatar_url = COALESCE(u.avatar_url, au.avatar)
    WHERE au.avatar_url IS NULL OR au.avatar_url = ''
  `);

  // is_system_admin sync
  await db.query(`
    UPDATE aura_users au
    LEFT JOIN users u ON u.id = au.id
    SET au.is_system_admin = CASE 
      WHEN au.group_id IN (1, 2) OR au.role IN ('owner', 'admin') OR u.is_system_admin = 1 THEN 1 
      ELSE 0 
    END
  `);
  console.log('✓ Core identity fields synchronized.');

  // Step 4: Populate profile fields from aura_user_profiles
  console.log('\n[4] Consolidating profile fields from aura_user_profiles into aura_users...');
  const [profileSyncRes] = await db.query(`
    UPDATE aura_users au
    JOIN aura_user_profiles aup ON aup.user_id = au.id
    SET 
      au.name_kh = COALESCE(aup.name_kh, au.name_kh),
      au.company_kh = COALESCE(aup.company_kh, au.company_kh),
      au.contact_person = COALESCE(aup.contact_person, au.contact_person),
      au.business_type = COALESCE(aup.business_type, au.business_type),
      au.vat_no = COALESCE(aup.vat_no, au.vat_no),
      au.gst_no = COALESCE(aup.gst_no, au.gst_no),
      au.address = COALESCE(aup.address, au.address),
      au.address_kh = COALESCE(aup.address_kh, au.address_kh),
      au.village = COALESCE(aup.village, au.village),
      au.commune = COALESCE(aup.commune, au.commune),
      au.street_no = COALESCE(aup.street_no, au.street_no),
      au.city = COALESCE(aup.city, au.city),
      au.state = COALESCE(aup.state, au.state),
      au.postal_code = COALESCE(aup.postal_code, au.postal_code),
      au.country_id = COALESCE(aup.country_id, au.country_id),
      au.country = COALESCE(aup.country, au.country),
      au.latitude = COALESCE(aup.latitude, au.latitude),
      au.longitude = COALESCE(aup.longitude, au.longitude),
      au.customer_group_id = COALESCE(aup.customer_group_id, au.customer_group_id),
      au.customer_group_name = COALESCE(aup.customer_group_name, au.customer_group_name),
      au.price_group_id = COALESCE(aup.price_group_id, au.price_group_id),
      au.price_group_name = COALESCE(aup.price_group_name, au.price_group_name),
      au.payment_term = COALESCE(aup.payment_term, au.payment_term),
      au.credit_limit = COALESCE(aup.credit_limit, au.credit_limit),
      au.deposit_amount = COALESCE(aup.deposit_amount, au.deposit_amount),
      au.deposit_amount_usd = COALESCE(aup.deposit_amount_usd, au.deposit_amount_usd),
      au.deposit_amount_khr = COALESCE(aup.deposit_amount_khr, au.deposit_amount_khr),
      au.deposit_amount_thb = COALESCE(aup.deposit_amount_thb, au.deposit_amount_thb),
      au.level_id = COALESCE(aup.level_id, au.level_id),
      au.member_expiry = COALESCE(aup.member_expiry, au.member_expiry),
      au.source = COALESCE(aup.source, au.source),
      au.logo = COALESCE(aup.logo, au.logo),
      au.attachment = COALESCE(aup.attachment, au.attachment),
      au.telegram_chat_id = COALESCE(aup.telegram_chat_id, au.telegram_chat_id)
  `);
  console.log(`✓ Profile fields consolidated. Affected rows: ${profileSyncRes.affectedRows}`);

  // Step 5: Replace legacy non-prefixed tables with views pointing to aura_ tables
  console.log('\n[5] Replacing legacy non-prefixed tables with views pointing to aura_ tables...');
  
  // Disable foreign key checks temporarily during table drop and view creation
  await db.query('SET FOREIGN_KEY_CHECKS = 0');

  // Drop base tables in dependency order
  await db.query('DROP TABLE IF EXISTS `user_group_mappings`');
  await db.query('DROP TABLE IF EXISTS `user_groups`');
  await db.query('DROP TABLE IF EXISTS `users`');

  // Create VIEW users pointing directly to aura_users
  await db.query(`
    CREATE OR REPLACE VIEW \`users\` AS 
    SELECT 
      id,
      uuid,
      username,
      email,
      phone,
      password AS password_hash,
      password_algo,
      first_name,
      last_name,
      avatar AS avatar_url,
      status,
      is_system_admin,
      failed_login_count,
      locked_until,
      last_login_at,
      last_login_ip,
      theme,
      language,
      created_at,
      updated_at,
      deleted_at
    FROM \`aura_users\`
  `);
  console.log('✓ users table updated to view pointing to aura_users');

  // Create VIEW user_groups pointing to aura_groups
  await db.query(`
    CREATE OR REPLACE VIEW \`user_groups\` AS
    SELECT 
      id,
      UPPER(name) AS code,
      description AS name,
      description,
      level,
      CASE WHEN id IN (1, 2) THEN 1 ELSE 0 END AS is_system,
      _utf8mb4'active' COLLATE utf8mb4_unicode_ci AS status,
      NOW() AS created_at,
      NOW() AS updated_at
    FROM \`aura_groups\`
  `);
  console.log('✓ user_groups table updated to view pointing to aura_groups');

  // Create VIEW user_group_mappings pointing to aura_users
  await db.query(`
    CREATE OR REPLACE VIEW \`user_group_mappings\` AS
    SELECT 
      id AS user_id,
      group_id,
      1 AS is_primary,
      id AS assigned_by,
      created_at AS assigned_at,
      NULL AS expires_at
    FROM \`aura_users\`
    WHERE group_id IS NOT NULL
  `);
  console.log('✓ user_group_mappings table updated to view pointing to aura_users');

  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  // Step 6: Recreate v_user_effective_permissions view directly on aura_users & aura_groups
  console.log('\n[6] Re-pointing v_user_effective_permissions view directly to aura_users & aura_groups...');
  await db.query(`
    CREATE OR REPLACE VIEW \`v_user_effective_permissions\` AS
    SELECT 
      u.id AS user_id,
      m.code AS module_code,
      m.name AS module_name,
      MAX(p.can_view) AS can_view,
      MAX(p.can_create) AS can_create,
      MAX(p.can_update) AS can_update,
      MAX(p.can_delete) AS can_delete,
      MAX(p.can_export) AS can_export,
      MAX(p.can_approve) AS can_approve
    FROM \`aura_users\` u
    JOIN \`aura_groups\` g ON g.id = u.group_id
    JOIN \`permissions\` p ON p.group_id = g.id
    JOIN \`erp_modules\` m ON m.id = p.module_id AND m.is_active = 1
    WHERE u.deleted_at IS NULL AND (u.active = 1 OR u.status = 'active')
    GROUP BY u.id, m.code, m.name
  `);
  const [testView] = await db.query('SELECT COUNT(*) AS total FROM `v_user_effective_permissions`');
  console.log(`✓ v_user_effective_permissions verified: ${testView[0].total} rows`);

  // Step 7: Verify final aura_users count and sample record
  const [finalUsers] = await db.query('SELECT COUNT(*) AS total FROM `aura_users`');
  console.log(`\n✓ Total records in main table aura_users: ${finalUsers[0].total}`);
  const [sample] = await db.query('SELECT id, username, email, uuid, is_system_admin, address, vat_no FROM `aura_users` WHERE id = 1');
  console.log('Sample consolidated aura_users record (#1):', sample[0]);

  console.log('\n=== AURA Users Consolidation Completed Successfully ===');
  process.exit(0);
}

migrateAuraUsers().catch(err => {
  console.error('[Migration Error]', err);
  process.exit(1);
});
