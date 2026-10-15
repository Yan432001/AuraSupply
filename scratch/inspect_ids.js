const { db } = require('../API/app/config/utill/helper');

async function main() {
  const [pStats] = await db.query('SELECT MIN(id) as min_id, MAX(id) as max_id, COUNT(*) as cnt FROM aura_products');
  console.log('aura_products stats:', pStats[0]);

  const [pSample] = await db.query('SELECT id, code, name, category_id, biller_id, price FROM aura_products LIMIT 5');
  console.log('aura_products sample:', pSample);

  const [cBillers] = await db.query('SELECT id, name, slug, company FROM aura_companies WHERE group_name = "biller"');
  console.log('biller companies:', cBillers);

  const [cAll] = await db.query('SELECT id, name, group_name FROM aura_companies LIMIT 10');
  console.log('first 10 companies:', cAll);

  const [catStats] = await db.query('SELECT MIN(id) as min_id, MAX(id) as max_id, COUNT(*) as cnt FROM aura_categories');
  console.log('aura_categories stats:', catStats[0]);

  const [catSample] = await db.query('SELECT id, code, name, slug FROM aura_categories LIMIT 5');
  console.log('aura_categories sample:', catSample);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
