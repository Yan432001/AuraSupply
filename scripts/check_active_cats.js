const { db } = require('../API/app/config/utill/helper');

async function checkActiveCategories() {
  const [rows] = await db.query(`
    SELECT p.category_id, c.name, COUNT(*) as product_count
    FROM aura_products p
    LEFT JOIN aura_categories c ON c.id = p.category_id
    GROUP BY p.category_id, c.name
    ORDER BY product_count DESC
  `);
  console.log('Categories with products:', rows);
  process.exit(0);
}

checkActiveCategories();
