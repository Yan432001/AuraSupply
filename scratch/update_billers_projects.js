const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // 1. Ensure all billers have group_id = NULL and group_name = 'biller' as requested by user
  await c.query("UPDATE aura_companies SET group_id = NULL WHERE group_name = 'biller'");
  console.log("Updated aura_companies: SET group_id = NULL WHERE group_name = 'biller'");

  const [billers] = await c.query("SELECT id, name, company, group_id, group_name FROM aura_companies WHERE group_name = 'biller' ORDER BY id ASC");
  console.log(`Total billers (stores): ${billers.length}`);
  console.table(billers);

  // 2. Check existing projects
  const [projects] = await c.query(`
    SELECT p.project_id, p.project_name, p.project_code, p.biller_id, c.name as biller_name, p.status 
    FROM aura_projects p
    LEFT JOIN aura_companies c ON c.id = p.biller_id
  `);
  console.log(`Total projects: ${projects.length}`);
  console.table(projects);

  await c.end();
}

check().catch(console.error);
