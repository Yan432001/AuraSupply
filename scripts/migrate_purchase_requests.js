const pool = require('../API/app/config/dbPool');

async function migrate() {
  console.log('Running Purchase Requests database migration...');

  const [cols] = await pool.query('SHOW COLUMNS FROM aura_purchases_request');
  const existingCols = new Set(cols.map(c => c.Field));

  if (!existingCols.has('purpose')) {
    await pool.query('ALTER TABLE aura_purchases_request ADD COLUMN purpose VARCHAR(255) NULL AFTER note');
    console.log('Added purpose to aura_purchases_request');
  }

  if (!existingCols.has('required_date_text')) {
    await pool.query('ALTER TABLE aura_purchases_request ADD COLUMN required_date_text VARCHAR(100) NULL AFTER required_date');
    console.log('Added required_date_text to aura_purchases_request');
  }

  if (!existingCols.has('department_id')) {
    await pool.query('ALTER TABLE aura_purchases_request ADD COLUMN department_id INT NULL AFTER warehouse_id');
    console.log('Added department_id to aura_purchases_request');
  }

  if (!existingCols.has('department')) {
    await pool.query('ALTER TABLE aura_purchases_request ADD COLUMN department VARCHAR(100) NULL AFTER department_id');
    console.log('Added department to aura_purchases_request');
  }

  if (!existingCols.has('rejected_date')) {
    await pool.query('ALTER TABLE aura_purchases_request ADD COLUMN rejected_date DATETIME NULL AFTER approved_date');
    console.log('Added rejected_date to aura_purchases_request');
  }

  if (!existingCols.has('total_qty')) {
    await pool.query('ALTER TABLE aura_purchases_request ADD COLUMN total_qty DECIMAL(15,4) NOT NULL DEFAULT 0 AFTER total');
    console.log('Added total_qty to aura_purchases_request');
  }

  // Populate total_qty for existing records if 0
  await pool.query(`
    UPDATE aura_purchases_request pr
    SET total_qty = (
      SELECT COALESCE(SUM(pri.quantity), 0)
      FROM aura_purchase_request_items pri
      WHERE pri.purchase_id = pr.id
    )
    WHERE total_qty = 0 OR total_qty IS NULL
  `);
  console.log('Updated total_qty for existing purchase request records.');

  console.log('Purchase requests migration completed successfully.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
