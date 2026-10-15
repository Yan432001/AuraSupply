const { db } = require('c:/AuraSupply/API/app/config/utill/helper');

async function test() {
  const [admins] = await db.query(`
    SELECT u.id, u.username, u.email, u.password, u.password_algo, u.group_id, g.name AS group_name, g.level, g.allow_admin_login, u.status
    FROM aura_users u
    JOIN aura_groups g ON g.id = u.group_id
    WHERE g.allow_admin_login = 1
    LIMIT 10
  `);
  console.log('Admin users in database:');
  admins.forEach(a => {
    console.log(`ID: ${a.id}, User: ${a.username}, Email: ${a.email}, Group: ${a.group_name} (L${a.level}), Status: ${a.status}, Algo: ${a.password_algo}, Pass: ${a.password.slice(0, 10)}...`);
  });
  process.exit(0);
}
test().catch(console.error);
