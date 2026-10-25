const { db } = require('../API/app/config/utill/helper');

async function dropViews() {
  console.log('Dropping non-prefixed user views...');
  await db.query("DROP VIEW IF EXISTS users");
  console.log('Dropped VIEW users');
  await db.query("DROP VIEW IF EXISTS user_groups");
  console.log('Dropped VIEW user_groups');
  await db.query("DROP VIEW IF EXISTS user_group_mappings");
  console.log('Dropped VIEW user_group_mappings');

  const [views] = await db.query(
    `SELECT TABLE_NAME, TABLE_TYPE 
     FROM information_schema.TABLES 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'VIEW'`
  );
  console.log('Remaining views:', views.map(v => v.TABLE_NAME));
  process.exit(0);
}

dropViews().catch(err => {
  console.error(err);
  process.exit(1);
});
