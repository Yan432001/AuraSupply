const { db } = require('../API/app/config/utill/helper');

async function main() {
  const [rows] = await db.query('SELECT id, name, slug, store_slug, group_name FROM aura_companies WHERE store_slug IS NOT NULL OR slug IS NOT NULL');
  console.log('Companies with slug or store_slug:', rows);
  process.exit(0);
}

main();
