const { db } = require('../API/app/config/utill/helper');

async function run() {
  try {
    const [views] = await db.query(
      `SELECT TABLE_NAME, TABLE_TYPE 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'VIEW'`
    );
    console.log('Current Views in aura_v1_db:', views.map(v => v.TABLE_NAME));

    // Check if users view exists
    const usersView = views.find(v => v.TABLE_NAME.toLowerCase() === 'users');
    console.log('Is "users" a view?', !!usersView);

    // Check user-related tables
    const [tables] = await db.query(
      `SELECT TABLE_NAME 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE '%user%'`
    );
    console.log('User-related tables/views:', tables.map(t => t.TABLE_NAME));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
