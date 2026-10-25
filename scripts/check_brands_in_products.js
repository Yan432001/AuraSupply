const { db } = require('../API/app/config/utill/helper');

async function checkBrandsInProducts() {
  const [cols] = await db.query("SHOW COLUMNS FROM aura_products LIKE '%brand%'");
  console.log('Brand columns:', cols);

  const [sample] = await db.query("SELECT id, name, category_id, brand, brand_id FROM aura_products LIMIT 10");
  console.log('Sample products:', sample);

  process.exit(0);
}

checkBrandsInProducts();
