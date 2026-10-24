const { db } = require('../API/app/config/utill/helper');

async function inspectItems() {
  const [desc] = await db.execute("DESCRIBE aura_purchase_items");
  console.log('aura_purchase_items columns:');
  console.table(desc.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key, Default: c.Default })));
  
  const [sampleItems] = await db.execute("SELECT * FROM aura_purchase_items LIMIT 3");
  console.log('Sample purchase item:', sampleItems[0]);

  const [samplePayments] = await db.execute("SELECT * FROM aura_payments WHERE purchase_id IS NOT NULL LIMIT 3");
  console.log('Sample purchase payment:', samplePayments[0]);

  process.exit(0);
}
inspectItems();
