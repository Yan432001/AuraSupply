const { db } = require('../API/app/config/utill/helper');

async function checkCat211() {
  const [products] = await db.query('SELECT id, code, name FROM aura_products WHERE category_id = 211');
  console.log('Cat 211 products:', products);
  for (const p of products) {
    const [variants] = await db.query('SELECT * FROM aura_product_variants WHERE product_id = ?', [p.id]);
    console.log(`Variants for ${p.name} (id ${p.id}):`, variants);
  }
  process.exit(0);
}

checkCat211();
