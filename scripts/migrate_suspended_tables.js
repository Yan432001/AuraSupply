const { pool } = require('../API/app/config/dbPool');

async function migrate() {
  console.log('--- Migrating aura_suspended_bills & aura_suspended_items ---');
  try {
    // 1. Modify bill_status in aura_suspended_bills to VARCHAR(50) DEFAULT 'open'
    await pool.query(`
      ALTER TABLE aura_suspended_bills 
      MODIFY COLUMN bill_status VARCHAR(50) DEFAULT 'open'
    `);
    console.log('✓ Modified aura_suspended_bills.bill_status to VARCHAR(50) DEFAULT "open"');

    // 2. Modify original_price in aura_suspended_bills to have DEFAULT 0.00
    await pool.query(`
      ALTER TABLE aura_suspended_bills 
      MODIFY COLUMN original_price DECIMAL(25,2) NULL DEFAULT 0.00
    `);
    console.log('✓ Modified aura_suspended_bills.original_price to DECIMAL(25,2) NULL DEFAULT 0.00');

    // 3. Modify aura_suspended_items columns to have safe defaults
    await pool.query(`
      ALTER TABLE aura_suspended_items 
      MODIFY COLUMN net_unit_price DECIMAL(25,2) NULL DEFAULT 0.00,
      MODIFY COLUMN unit_quantity DECIMAL(15,2) NULL DEFAULT 1.00,
      MODIFY COLUMN original_price DECIMAL(25,2) NULL DEFAULT 0.00,
      MODIFY COLUMN real_unit_price DECIMAL(25,2) NULL DEFAULT 0.00,
      MODIFY COLUMN subtotal DECIMAL(25,2) NULL DEFAULT 0.00
    `);
    console.log('✓ Modified aura_suspended_items numeric columns to have NULL DEFAULT 0.00');

    console.log('\nMigration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
