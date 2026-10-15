const { db } = require('c:/AuraSupply/API/app/config/utill/helper');

async function check() {
  const [tables] = await db.query('SHOW TABLES LIKE "aura_%"');
  const tNames = tables.map(t => Object.values(t)[0]);
  console.log('Tables matching permissions/billers/tokens/profiles/groups:');
  console.log(tNames.filter(t => 
    t.includes('permission') || 
    t.includes('biller') || 
    t.includes('token') || 
    t.includes('profile') || 
    t.includes('group') ||
    t.includes('company_user_map')
  ));

  // Check columns of aura_users
  const [userCols] = await db.query('DESCRIBE aura_users');
  console.log('aura_users relevant columns:', userCols.map(c => c.Field).filter(f => 
    ['group_id', 'status', 'locked_until', 'failed_login_count', 'password_algo', 'approved_by', 'legacy_company_id', 'register_source', 'email_verified_at', 'theme'].includes(f)
  ));

  // Check columns of aura_groups
  const [groupCols] = await db.query('DESCRIBE aura_groups');
  console.log('aura_groups columns:', groupCols.map(c => c.Field));

  // Check function aura_user_can
  try {
    const [funcRes] = await db.query('SELECT aura_user_can(1, "sales-add") AS can_sales_add');
    console.log('aura_user_can test for user 1:', funcRes[0]);
  } catch(e) {
    console.log('aura_user_can function status:', e.message);
  }

  // Check groups count
  const [groups] = await db.query('SELECT id, name, level, allow_admin_login, allow_web_login, allow_web_register, requires_approval FROM aura_groups ORDER BY level, id');
  console.log('aura_groups records:', groups);

  // Check permission keys count
  try {
    const [pkCount] = await db.query('SELECT COUNT(*) as count FROM aura_permission_keys');
    console.log('aura_permission_keys count:', pkCount[0].count);
  } catch(e) {
    console.log('aura_permission_keys error:', e.message);
  }

  // Check group permissions count
  try {
    const [gpCount] = await db.query('SELECT COUNT(*) as count FROM aura_group_permissions');
    console.log('aura_group_permissions count:', gpCount[0].count);
  } catch(e) {
    console.log('aura_group_permissions error:', e.message);
  }

  // Check user billers count
  try {
    const [ubCount] = await db.query('SELECT COUNT(*) as count FROM aura_user_billers');
    console.log('aura_user_billers count:', ubCount[0].count);
  } catch(e) {
    console.log('aura_user_billers error:', e.message);
  }

  // Check users count and roles
  const [uSummary] = await db.query(`
    SELECT g.name AS role_name, u.status, COUNT(*) as cnt 
    FROM aura_users u 
    JOIN aura_groups g ON g.id = u.group_id 
    GROUP BY g.name, u.status
  `);
  console.log('Users summary by group & status:', uSummary);

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
