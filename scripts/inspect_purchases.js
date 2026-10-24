const { db } = require('../API/app/config/utill/helper');

async function inspect() {
  try {
    const [tables] = await db.execute("SHOW TABLES LIKE '%purchase%'");
    console.log('Purchase tables:', tables);

    const [descPurchases] = await db.execute("DESCRIBE aura_purchases");
    console.log('aura_purchases schema:');
    console.table(descPurchases.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key, Default: c.Default })));

    const [descItems] = await db.execute("DESCRIBE aura_purchase_items");
    console.log('aura_purchase_items schema:');
    console.table(descItems.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key, Default: c.Default })));

    const [descPayments] = await db.execute("DESCRIBE aura_payments");
    console.log('aura_payments schema:');
    console.table(descPayments.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key, Default: c.Default })));

    const [samplePurchases] = await db.execute("SELECT * FROM aura_purchases LIMIT 3");
    console.log('Sample purchases count:', samplePurchases.length);
    if (samplePurchases.length > 0) {
      console.log('Sample purchase row:', samplePurchases[0]);
    }

    const [suppliers] = await db.execute("SELECT id, name, company, email, phone FROM aura_companies WHERE group_name = 'supplier' LIMIT 5");
    console.log('Suppliers sample:', suppliers);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

inspect();
