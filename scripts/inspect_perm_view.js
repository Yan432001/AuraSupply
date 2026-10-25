const { db } = require('../API/app/config/utill/helper');

async function inspectPermView() {
  const [vPerm] = await db.query("SHOW CREATE VIEW v_user_effective_permissions");
  console.log('v_user_effective_permissions:', vPerm);
  process.exit(0);
}

inspectPermView();
