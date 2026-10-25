const { db } = require('../API/app/config/utill/helper');

async function inspectColumns() {
  const [cols] = await db.query("DESCRIBE aura_users");
  console.log('Columns in aura_users:', cols.map(c => `${c.Field} (${c.Type})`));
  process.exit(0);
}

inspectColumns();
