const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [tables] = await c.query("SHOW TABLES LIKE '%project%'");
  console.log('PROJECT TABLES:', tables);

  const [billers] = await c.query("SELECT id, group_id, group_name, name, company FROM aura_companies WHERE group_name = 'biller' LIMIT 10");
  console.log('BILLERS in aura_companies (sample 10):');
  console.table(billers);

  const [groupIds] = await c.query("SELECT DISTINCT group_id, group_name FROM aura_companies");
  console.log('DISTINCT group_id, group_name in aura_companies:');
  console.table(groupIds);

  // Check if aura_projects exists
  const [hasProjects] = await c.query("SHOW TABLES LIKE 'aura_projects'");
  if (hasProjects.length > 0) {
    const [projCols] = await c.query("DESCRIBE aura_projects");
    console.log('aura_projects columns:', projCols.map(p => p.Field));
    const [projData] = await c.query("SELECT * FROM aura_projects LIMIT 10");
    console.log('aura_projects rows:');
    console.table(projData);
  } else {
    console.log('Table aura_projects does not exist');
  }

  // Check aura_products biller_id and project_id columns
  const [prodCols] = await c.query("DESCRIBE aura_products");
  const projectColsInProducts = prodCols.filter(f => f.Field.includes('project') || f.Field.includes('biller'));
  console.log('aura_products biller/project columns:', projectColsInProducts);

  await c.end();
}

check().catch(console.error);
