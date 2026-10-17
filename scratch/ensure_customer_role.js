const { query, closePool } = require('../API/app/config/dbPool');

async function main() {
  try {
    const [result] = await query(`
      INSERT INTO user_groups (code, name, description, level, is_system, status)
      VALUES ('CUSTOMER', 'Customer / Buyer', 'E-commerce buyer and website customer', 90, 1, 'active')
      ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), level = VALUES(level)
    `);
    console.log('Ensure customer role result:', result.affectedRows);

    const [rows] = await query("SELECT id, code, name, level FROM user_groups WHERE code = 'CUSTOMER'");
    console.log('Customer role in user_groups:', rows);
  } catch (err) {
    console.error('Error ensuring customer role:', err);
  } finally {
    await closePool();
  }
}

main();
