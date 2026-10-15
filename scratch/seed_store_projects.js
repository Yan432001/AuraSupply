const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedStoreProjects() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const projectsToSeed = [
    // Biller 3: Aura Specialty Coffee
    { biller_id: 3, name: 'Direct Trade Highland Sourcing 2026', code: 'PRJ-ASC-01', status: 'active' },
    { biller_id: 3, name: 'Cafe Roastery & Cold Brew Bar Rollout', code: 'PRJ-ASC-02', status: 'active' },

    // Biller 251: Aura Artisan Bakery
    { biller_id: 251, name: 'Normandy Pastry Production Line', code: 'PRJ-AAB-01', status: 'active' },
    { biller_id: 251, name: 'Sourdough Wholesale Supply', code: 'PRJ-AAB-02', status: 'active' },

    // Biller 252: Aura Botanical Lounge
    { biller_id: 252, name: 'Ceremonial Matcha Bar Expansion', code: 'PRJ-ABL-01', status: 'active' },

    // Biller 253: Aura French Bistro
    { biller_id: 253, name: 'Gourmet Dining & Cellar Supply', code: 'PRJ-AFB-01', status: 'active' },

    // Biller 254: Aura Automation Tech
    { biller_id: 254, name: 'Smart Hospitality Automation Systems', code: 'PRJ-AAT-01', status: 'active' },

    // Biller 255: Nexus Mobile & Gadgets
    { biller_id: 255, name: 'Flagship Mobile Tech Sourcing', code: 'PRJ-NEX-01', status: 'active' },

    // Biller 256: Apex PC & Workstation Hub
    { biller_id: 256, name: 'Enterprise Workstation Deployments', code: 'PRJ-APC-01', status: 'active' },

    // Biller 257: Velour Minimalist Apparel
    { biller_id: 257, name: 'Organic Cotton & Uniforms Project', code: 'PRJ-VEL-01', status: 'active' },

    // Biller 258: Verdant Organic Market
    { biller_id: 258, name: 'Fresh Farm Produce Distribution', code: 'PRJ-VRD-01', status: 'active' },

    // Biller 301: Guangzhou Apex Machinery
    { biller_id: 301, name: 'Commercial Espresso Machines Q4 Batch', code: 'PRJ-APX-01', status: 'active' },
    { biller_id: 301, name: 'Modular Blast Chillers Assembly', code: 'PRJ-APX-02', status: 'active' },

    // Biller 302: Zhejiang EcoPack Factory
    { biller_id: 302, name: 'Biodegradable Sugarcane Packaging Line', code: 'PRJ-ECO-01', status: 'active' },
    { biller_id: 302, name: 'Ripple Cup Automation Production', code: 'PRJ-ECO-02', status: 'active' },

    // Biller 303: Highland Coffee & Tea Directorate
    { biller_id: 303, name: 'Yirgacheffe Green Bean Harvest Contract', code: 'PRJ-HCT-01', status: 'active' },
    { biller_id: 303, name: 'Kyoto Matcha Stone-Grinding Sourcing', code: 'PRJ-HCT-02', status: 'active' },

    // Biller 304: MasterCraft Commercial Furniture
    { biller_id: 304, name: 'Hospitality Oak Dining Suites Production', code: 'PRJ-MCF-01', status: 'active' },
    { biller_id: 304, name: 'Modular Leatherette Booths Project', code: 'PRJ-MCF-02', status: 'active' },

    // Biller 305: Sunmi Cloud POS Hardware
    { biller_id: 305, name: 'Dual-Screen Android POS Terminals Assembly', code: 'PRJ-SNM-01', status: 'active' },
    { biller_id: 305, name: 'Smart Restaurant Pager Buzzers Line', code: 'PRJ-SNM-02', status: 'active' }
  ];

  for (const p of projectsToSeed) {
    const [exist] = await pool.query('SELECT project_id FROM aura_projects WHERE project_code = ?', [p.code]);
    if (exist.length === 0) {
      await pool.query(
        `INSERT INTO aura_projects (biller_id, project_name, project_code, status, approve_status, date)
         VALUES (?, ?, ?, ?, 'approved', NOW())`,
        [p.biller_id, p.name, p.code, p.status]
      );
    }
  }

  // Update existing products with their store's project_id
  const [projs] = await pool.query('SELECT project_id, biller_id FROM aura_projects');
  for (const pr of projs) {
    await pool.query('UPDATE aura_products SET project_id = ? WHERE biller_id = ? AND (project_id IS NULL OR project_id = 0)', [pr.project_id, pr.biller_id]);
  }

  const [count] = await pool.query('SELECT COUNT(*) as c FROM aura_projects');
  console.log(`Total projects in aura_projects now: ${count[0].c}`);

  await pool.end();
}

seedStoreProjects().catch(console.error);
