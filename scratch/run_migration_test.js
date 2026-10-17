const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function testMigration() {
  const sqlFile = path.join(__dirname, '../migrations/20261017_rbac_high_volume_items_management.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('[Migration Test] Connecting to MySQL...');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '43200111',
    database: 'aura_v1_db',
    multipleStatements: true
  });

  console.log('[Migration Test] Executing DDL migration script...');
  const startTime = Date.now();
  await conn.query(sql);
  const duration = Date.now() - startTime;
  console.log(`[Migration Test] Success! Migration completed in ${duration}ms`);

  // Verify created tables
  const targetTables = ['erp_modules', 'user_groups', 'users', 'user_group_mappings', 'permissions', 'items'];
  for (const table of targetTables) {
    const [rows] = await conn.query(`SELECT COUNT(*) as count FROM \`${table}\``);
    console.log(`- Table [${table}]: ${rows[0].count} rows`);
  }

  // Verify views
  const [viewPerms] = await conn.query('SELECT * FROM `v_user_effective_permissions` LIMIT 3');
  console.log('[Migration Test] View v_user_effective_permissions sample:', viewPerms);

  // Verify EXPLAIN plan for high-volume items queries
  console.log('\n[Architecture Benchmark] Testing EXPLAIN query plan on items table...');
  const [explainFilterSort] = await conn.query(`
    EXPLAIN SELECT id, sku, name, selling_price, quantity_on_hand
    FROM items
    WHERE is_deleted = 0 AND status = 'active' AND category_id = 1
    ORDER BY id DESC
    LIMIT 50
  `);
  console.log('EXPLAIN (Filter & Sort Pagination):');
  console.table(explainFilterSort);

  const [explainPermLookup] = await conn.query(`
    EXPLAIN SELECT can_view, can_create, can_update, can_delete, can_export, can_approve
    FROM permissions
    WHERE group_id = 1 AND module_id = 1
  `);
  console.log('EXPLAIN (Sub-millisecond RBAC Permission Lookup):');
  console.table(explainPermLookup);

  await conn.end();
}

testMigration().catch(err => {
  console.error('[Migration Test Error]:', err);
  process.exit(1);
});
