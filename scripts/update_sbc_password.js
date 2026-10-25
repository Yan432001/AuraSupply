const { db } = require('../API/app/config/utill/helper');
const bcrypt = require('bcryptjs');

async function updatePassword() {
  const newHash = await bcrypt.hash('Sbc@12345', 10);
  console.log('Generated hash for Sbc@12345:', newHash);

  // Update sbcsolutions (id 1)
  const [res1] = await db.query(
    "UPDATE aura_users SET password = ?, password_hash = ?, failed_login_count = 0, locked_until = NULL WHERE id = 1 OR username = 'sbcsolutions' OR email = 'heanyan1@gmail.com'",
    [newHash, newHash]
  );
  console.log('Updated sbcsolutions rows:', res1.affectedRows);

  // Unlock all locked users just in case
  await db.query("UPDATE aura_users SET failed_login_count = 0, locked_until = NULL WHERE failed_login_count > 0 OR locked_until IS NOT NULL");
  console.log('All locked accounts reset.');

  // Verify
  const [user] = await db.query("SELECT id, username, email, password, failed_login_count, locked_until FROM aura_users WHERE id = 1");
  console.log('User 1:', user[0]);
  const isMatch = await bcrypt.compare('Sbc@12345', user[0].password);
  console.log('Password verification for Sbc@12345:', isMatch);

  process.exit();
}

updatePassword();
