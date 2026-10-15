const mysql = require('mysql2/promise');

async function checkBillers() {
  const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '43200111', database: 'aura_v1_db' });
  
  const [billerCompanies] = await conn.query("SELECT id, name, company_type, group_name FROM aura_companies WHERE group_name = 'biller' OR company_type IN ('branch','store','shop','biller')");
  console.log('Branches/Stores/Shops in aura_companies:', billerCompanies);

  const [staffUsers] = await conn.query("SELECT id, username, group_id, biller_id, multi_biller FROM aura_users WHERE group_id IN (1, 2, 3, 6, 8, 13, 14, 15, 17, 30, 31)");
  console.log('Staff users count:', staffUsers.length);
  console.log('Staff sample:', staffUsers.slice(0, 10));

  // If billerCompanies has rows, let's see why user_billers was 0
  if (billerCompanies.length > 0) {
    const defaultBillerId = billerCompanies[0].id;
    console.log('Setting default branch/biller ID:', defaultBillerId);
    for (const u of staffUsers) {
      const bId = u.biller_id && billerCompanies.some(b => b.id === u.biller_id) ? u.biller_id : defaultBillerId;
      await conn.query("INSERT IGNORE INTO aura_user_billers (user_id, biller_id, is_default) VALUES (?, ?, 1)", [u.id, bId]);
    }
    const [ubCount] = await conn.query("SELECT COUNT(*) as cnt FROM aura_user_billers");
    console.log('Updated aura_user_billers count:', ubCount[0].cnt);
  } else {
    console.log('No biller companies found. Creating default branch/biller...');
    const [ins] = await conn.query("INSERT INTO aura_companies (group_name, company_type, name, code, is_active, status) VALUES ('biller', 'branch', 'Main Central Branch', 'MAIN-01', 1, 'active')");
    const newBillerId = ins.insertId;
    console.log('Created Main Central Branch with ID:', newBillerId);
    for (const u of staffUsers) {
      await conn.query("INSERT IGNORE INTO aura_user_billers (user_id, biller_id, is_default) VALUES (?, ?, 1)", [u.id, newBillerId]);
    }
    const [ubCount] = await conn.query("SELECT COUNT(*) as cnt FROM aura_user_billers");
    console.log('Updated aura_user_billers count:', ubCount[0].cnt);
  }

  await conn.end();
}

checkBillers().catch(console.error);
