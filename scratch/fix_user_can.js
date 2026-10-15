const mysql = require('mysql2/promise');

async function fix() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '43200111',
    database: 'aura_v1_db'
  });

  await conn.query('DROP FUNCTION IF EXISTS aura_user_can');
  await conn.query(`
    CREATE FUNCTION aura_user_can(p_user_id INT UNSIGNED, p_key VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
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

  const [res] = await conn.query('SELECT aura_user_can(1, "sales-add") AS owner_can_sales, aura_user_can(1, "system_settings") AS owner_can_settings');
  console.log('aura_user_can test for user 1 (owner):', res[0]);

  // Test staff user
  const [res2] = await conn.query('SELECT aura_user_can(26, "sales-add") AS staff_can_sales, aura_user_can(26, "system_settings") AS staff_can_settings');
  console.log('aura_user_can test for user 26:', res2[0]);

  const [counts] = await conn.query(`
    SELECT 
      (SELECT COUNT(*) FROM aura_users) AS total_users,
      (SELECT COUNT(*) FROM aura_permission_keys) AS permission_keys,
      (SELECT COUNT(*) FROM aura_group_permissions WHERE allowed = 1) AS allowed_group_perms,
      (SELECT COUNT(*) FROM aura_user_billers) AS user_billers,
      (SELECT COUNT(*) FROM aura_user_profiles) AS user_profiles
  `);
  console.log('Verification counts:', counts[0]);

  // Check roles in aura_groups
  const [roles] = await conn.query('SELECT id, name, level, allow_admin_login, allow_web_login, allow_web_register, requires_approval FROM aura_groups ORDER BY level, id');
  console.log('Groups after migration:', roles);

  await conn.end();
}

fix().catch(err => {
  console.error('Fix error:', err);
  process.exit(1);
});
