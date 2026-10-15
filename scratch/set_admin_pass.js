const bcrypt = require('bcryptjs');
const { db } = require('c:/AuraSupply/API/app/config/utill/helper');

async function setAdmin() {
  const hash = await bcrypt.hash('admin', 10);
  await db.query(
    'UPDATE aura_users SET password = ?, password_algo = "bcrypt", status = "active", failed_login_count = 0, locked_until = NULL WHERE id IN (1, 28)',
    [hash]
  );
  console.log('Successfully set password "admin" for user 1 and user 28');
  process.exit(0);
}

setAdmin().catch(console.error);
