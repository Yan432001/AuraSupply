const db = require('../API/app/config/dbPool');

async function migrate() {
  console.log('--- Starting Purchase Orders DB Migration ---');

  // Helper to add column if not exists
  async function addColumnIfNotExists(table, column, definition) {
    const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}'`);
    if (cols.length === 0) {
      console.log(`Adding column ${column} to ${table}...`);
      await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`Column ${column} added to ${table}.`);
    } else {
      console.log(`Column ${column} already exists in ${table}.`);
    }
  }

  // 1. Alter aura_purchases_order to allow NULL / reasonable defaults
  console.log('Adjusting aura_purchases_order column constraints...');
  try {
    await db.query(`ALTER TABLE aura_purchases_order MODIFY COLUMN project_id INT NULL DEFAULT 0`);
    await db.query(`ALTER TABLE aura_purchases_order MODIFY COLUMN biller_id INT NULL DEFAULT 1`);
    await db.query(`ALTER TABLE aura_purchases_order MODIFY COLUMN note VARCHAR(1000) NULL DEFAULT ''`);
    await db.query(`ALTER TABLE aura_purchases_order MODIFY COLUMN reference_no_tax VARCHAR(100) NULL DEFAULT ''`);
    await db.query(`ALTER TABLE aura_purchases_order MODIFY COLUMN deadline DATE NULL DEFAULT NULL`);
    await db.query(`ALTER TABLE aura_purchases_order MODIFY COLUMN due_date DATE NULL DEFAULT NULL`);
    await db.query(`ALTER TABLE aura_purchases_order MODIFY COLUMN approved_date DATETIME NULL DEFAULT NULL`);
  } catch (err) {
    console.error('Error modifying column constraints on aura_purchases_order:', err.message);
  }

  // Add missing columns to aura_purchases_order
  await addColumnIfNotExists('aura_purchases_order', 'rejected_date', 'DATETIME NULL DEFAULT NULL');
  await addColumnIfNotExists('aura_purchases_order', 'reject_reason', 'TEXT NULL DEFAULT NULL');
  await addColumnIfNotExists('aura_purchases_order', 'total_qty', 'DECIMAL(15,4) NULL DEFAULT 0');
  await addColumnIfNotExists('aura_purchases_order', 'purchase_request_id', 'INT NULL DEFAULT NULL');
  await addColumnIfNotExists('aura_purchases_order', 'required_date', 'DATETIME NULL DEFAULT NULL');
  await addColumnIfNotExists('aura_purchases_order', 'required_date_text', 'VARCHAR(100) NULL DEFAULT NULL');

  // 2. Alter aura_purchase_order_items column constraints
  console.log('Adjusting aura_purchase_order_items column constraints...');
  try {
    await db.query(`ALTER TABLE aura_purchase_order_items MODIFY COLUMN date DATE NULL DEFAULT NULL`);
    await db.query(`ALTER TABLE aura_purchase_order_items MODIFY COLUMN status VARCHAR(50) NULL DEFAULT 'pending'`);
    await db.query(`ALTER TABLE aura_purchase_order_items MODIFY COLUMN quantity_po INT NULL DEFAULT 0`);
    await db.query(`ALTER TABLE aura_purchase_order_items MODIFY COLUMN qoh DECIMAL(15,4) NULL DEFAULT 0`);
  } catch (err) {
    console.error('Error modifying column constraints on aura_purchase_order_items:', err.message);
  }

  await addColumnIfNotExists('aura_purchase_order_items', 'item_discount', 'DECIMAL(25,4) NULL DEFAULT 0');
  await addColumnIfNotExists('aura_purchase_order_items', 'discount', 'VARCHAR(20) NULL DEFAULT "0"');
  await addColumnIfNotExists('aura_purchase_order_items', 'pri_id', 'INT NULL DEFAULT NULL');
  await addColumnIfNotExists('aura_purchase_order_items', 'remarks', 'VARCHAR(500) NULL DEFAULT NULL');

  // Backfill total_qty for existing records in aura_purchases_order
  console.log('Backfilling total_qty on existing aura_purchases_order...');
  await db.query(`
    UPDATE aura_purchases_order po
    SET total_qty = COALESCE((
      SELECT SUM(quantity) 
      FROM aura_purchase_order_items poi 
      WHERE poi.purchase_id = po.id
    ), 0)
    WHERE total_qty = 0 OR total_qty IS NULL
  `);

  console.log('--- Migration Finished Successfully ---');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
