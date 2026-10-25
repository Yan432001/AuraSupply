const { db } = require('../API/app/config/utill/helper');

async function inspectDef() {
  const [vUsers] = await db.query("SHOW CREATE VIEW users");
  console.log('users view:', vUsers);
  const [vProducts] = await db.query("SHOW CREATE VIEW products");
  console.log('products view:', vProducts);
  process.exit(0);
}

inspectDef();
