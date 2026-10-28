const { pool } = require('../API/app/config/dbPool');

async function fixLicenseTable() {
  console.log('--- Creating aura_license table ---');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`aura_license\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`license_key\` VARCHAR(255) DEFAULT 'AURA-ENTERPRISE-2026',
        \`status\` VARCHAR(50) DEFAULT 'active',
        \`expires_at\` DATE DEFAULT '2030-12-31',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [rows] = await pool.query('SELECT COUNT(*) as c FROM aura_license');
    if (rows[0].c === 0) {
      await pool.query(`
        INSERT INTO aura_license (license_key, status, expires_at)
        VALUES ('AURA-ENTERPRISE-2026', 'active', '2030-12-31')
      `);
      console.log('Inserted default active enterprise license');
    }
    console.log('✓ aura_license table ready!');
  } catch (err) {
    console.error('Error creating aura_license:', err.message);
  } finally {
    await pool.end();
  }
}

fixLicenseTable();
