const pool = require('../API/app/config/dbPool');

async function migrate() {
  console.log('Running rewards exchange migration...');

  // 1. aura_rewards_exchange columns
  const [colsExchange] = await pool.query('SHOW COLUMNS FROM aura_rewards_exchange');
  const existingExchangeCols = new Set(colsExchange.map(c => c.Field));

  if (!existingExchangeCols.has('customer_id')) {
    await pool.query('ALTER TABLE aura_rewards_exchange ADD COLUMN customer_id INT NULL AFTER company_id');
    console.log('Added customer_id to aura_rewards_exchange');
  }
  if (!existingExchangeCols.has('customer')) {
    await pool.query('ALTER TABLE aura_rewards_exchange ADD COLUMN customer VARCHAR(100) NULL AFTER company');
    console.log('Added customer to aura_rewards_exchange');
  }
  if (!existingExchangeCols.has('points_used')) {
    await pool.query('ALTER TABLE aura_rewards_exchange ADD COLUMN points_used DOUBLE NOT NULL DEFAULT 0 AFTER grand_total');
    console.log('Added points_used to aura_rewards_exchange');
  }
  if (!existingExchangeCols.has('total_qty')) {
    await pool.query('ALTER TABLE aura_rewards_exchange ADD COLUMN total_qty DOUBLE NOT NULL DEFAULT 0 AFTER points_used');
    console.log('Added total_qty to aura_rewards_exchange');
  }

  // 2. aura_reward_exchange_items columns
  const [colsItems] = await pool.query('SHOW COLUMNS FROM aura_reward_exchange_items');
  const existingItemCols = new Set(colsItems.map(c => c.Field));

  if (!existingItemCols.has('points')) {
    await pool.query('ALTER TABLE aura_reward_exchange_items ADD COLUMN points DOUBLE NOT NULL DEFAULT 0 AFTER subtotal');
    console.log('Added points to aura_reward_exchange_items');
  }
  if (!existingItemCols.has('total_points')) {
    await pool.query('ALTER TABLE aura_reward_exchange_items ADD COLUMN total_points DOUBLE NOT NULL DEFAULT 0 AFTER points');
    console.log('Added total_points to aura_reward_exchange_items');
  }
  if (!existingItemCols.has('product_id')) {
    await pool.query('ALTER TABLE aura_reward_exchange_items ADD COLUMN product_id INT NULL AFTER exchange_product_id');
    console.log('Added product_id to aura_reward_exchange_items');
  }
  if (!existingItemCols.has('product_code')) {
    await pool.query('ALTER TABLE aura_reward_exchange_items ADD COLUMN product_code VARCHAR(100) NULL AFTER exchange_product_code');
    console.log('Added product_code to aura_reward_exchange_items');
  }
  if (!existingItemCols.has('product_name')) {
    await pool.query('ALTER TABLE aura_reward_exchange_items ADD COLUMN product_name VARCHAR(255) NULL AFTER exchange_product_name');
    console.log('Added product_name to aura_reward_exchange_items');
  }
  if (!existingItemCols.has('quantity')) {
    await pool.query('ALTER TABLE aura_reward_exchange_items ADD COLUMN quantity DECIMAL(15,4) NOT NULL DEFAULT 0 AFTER exchange_quantity');
    console.log('Added quantity to aura_reward_exchange_items');
  }

  console.log('Migration completed successfully.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
