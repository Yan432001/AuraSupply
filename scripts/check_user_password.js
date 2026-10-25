const { db } = require('../API/app/config/utill/helper');
const bcrypt = require('bcryptjs');

async function check() {
  const [rows] = await db.query("SELECT id, username, email, password, password_algo, salt, failed_login_count, locked_until FROM aura_users WHERE email = 'heanyan1@gmail.com' OR username = 'sbcsolutions'");
  console.log('aura_users:', rows);

  if (rows.length > 0) {
    const isSbcPass = await bcrypt.compare('Sbc@12345', rows[0].password);
    console.log('Does Sbc@12345 match current hash in aura_users?', isSbcPass);
  }

  try {
    const [bak] = await db.query("SELECT * FROM aura_users_bak_20261015 WHERE email = 'heanyan1@gmail.com' OR username = 'sbcsolutions'");
    console.log('aura_users_bak_20261015:', bak);
  } catch(e) {
    console.log('aura_users_bak_20261015 error:', e.message);
  }

  process.exit();
}

check();
