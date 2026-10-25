const StockCountsModel = require('../API/app/models/admins/stockCounts.model');

async function testCombinations() {
  const { db } = require('../API/app/config/utill/helper');
  const [categories] = await db.query('SELECT id, name FROM aura_categories');
  console.log('Categories count:', categories.length);
  const [brands] = await db.query('SELECT id, name FROM aura_brands');
  console.log('Brands count:', brands.length);

  // Test warehouse 8 with full
  try {
    await StockCountsModel.createStockCount({ warehouse_id: 8, type: 'full' });
    console.log('Warehouse 8 FULL: SUCCESS');
  } catch (err) {
    console.log('Warehouse 8 FULL: FAILED ->', err.message);
  }

  // Test partial with a category that might have no products
  for (const cat of categories) {
    try {
      const res = await StockCountsModel.createStockCount({ warehouse_id: 1, type: 'partial', categories: [cat.id] });
      console.log(`Cat ${cat.id} (${cat.name}): SUCCESS (${res.products_count} prods)`);
    } catch (err) {
      console.log(`Cat ${cat.id} (${cat.name}): FAILED -> ${err.message}`);
    }
  }

  process.exit(0);
}

testCombinations();
