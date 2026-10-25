const { db } = require('../API/app/config/utill/helper');

async function checkViews() {
  const [views] = await db.query(`
    SELECT TABLE_NAME, VIEW_DEFINITION 
    FROM information_schema.VIEWS 
    WHERE TABLE_SCHEMA = DATABASE()
  `);
  console.log('Views definitions:');
  for (const v of views) {
    console.log(`- ${v.TABLE_NAME}`);
  }
  process.exit(0);
}

checkViews();
