const db = require('../API/app/config/utill/connection');

async function migrateAssetSystem() {
  console.log('=== STARTING ASSET MANAGEMENT SYSTEM MIGRATION ===\n');

  // 1. Asset Categories Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`aura_asset_categories\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`code\` varchar(50) NOT NULL,
      \`name\` varchar(100) NOT NULL,
      \`description\` text DEFAULT NULL,
      \`useful_life_months\` int DEFAULT '60',
      \`depreciation_rate\` decimal(10,2) DEFAULT '20.00',
      \`status\` tinyint(1) DEFAULT '1',
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_asset_category_code\` (\`code\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✔ Verified aura_asset_categories table.');

  // Seed standard categories if empty
  const [catRows] = await db.query('SELECT COUNT(*) as count FROM aura_asset_categories');
  if (catRows[0].count === 0) {
    await db.query(`
      INSERT INTO \`aura_asset_categories\` (code, name, description, useful_life_months, depreciation_rate) VALUES
      ('IT-EQ', 'IT & Computer Equipment', 'Laptops, desktops, monitors, servers and networking hardware', 36, 33.33),
      ('FURN', 'Office Furniture & Fixtures', 'Desks, ergonomic chairs, conference tables and storage cabinets', 60, 20.00),
      ('VEH', 'Vehicles & Fleet', 'Company utility vehicles, delivery vans, and motorbikes', 60, 20.00),
      ('MACH', 'Plant, Machinery & Tools', 'Espresso machines, generators, industrial grinders and tools', 84, 14.28),
      ('ELEC', 'Electrical & Appliances', 'Air conditioning units, refrigerators, and security systems', 48, 25.00);
    `);
    console.log('✔ Seeded 5 standard asset categories.');
  }

  // 2. Asset Register Table (Fixed Assets)
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`aura_assets\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`asset_code\` varchar(50) NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`category_id\` int DEFAULT NULL,
      \`brand\` varchar(100) DEFAULT NULL,
      \`model\` varchar(100) DEFAULT NULL,
      \`serial_number\` varchar(100) DEFAULT NULL,
      \`barcode\` varchar(100) DEFAULT NULL,
      \`purchase_date\` date DEFAULT NULL,
      \`purchase_cost\` decimal(25,4) DEFAULT '0.0000',
      \`residual_value\` decimal(25,4) DEFAULT '0.0000',
      \`useful_life_months\` int DEFAULT '60',
      \`depreciation_method\` varchar(50) DEFAULT 'straight_line',
      \`accumulated_depreciation\` decimal(25,4) DEFAULT '0.0000',
      \`current_value\` decimal(25,4) DEFAULT '0.0000',
      \`supplier_id\` int DEFAULT NULL,
      \`warehouse_id\` int DEFAULT NULL,
      \`location_name\` varchar(255) DEFAULT 'Headquarters Main Office',
      \`department_name\` varchar(255) DEFAULT 'Administration',
      \`assigned_to\` int DEFAULT NULL,
      \`assigned_date\` date DEFAULT NULL,
      \`warranty_start\` date DEFAULT NULL,
      \`warranty_end\` date DEFAULT NULL,
      \`condition\` varchar(50) DEFAULT 'good',
      \`status\` varchar(50) DEFAULT 'available',
      \`image\` varchar(255) DEFAULT NULL,
      \`note\` text DEFAULT NULL,
      \`biller_id\` int DEFAULT '1',
      \`created_by\` int DEFAULT '1',
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_asset_code\` (\`asset_code\`),
      KEY \`idx_asset_category\` (\`category_id\`),
      KEY \`idx_asset_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✔ Verified aura_assets table.');

  // 3. Asset Assignments Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`aura_asset_assignments\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`asset_id\` int NOT NULL,
      \`employee_id\` int DEFAULT NULL,
      \`employee_name\` varchar(255) NOT NULL,
      \`department_name\` varchar(255) DEFAULT NULL,
      \`assigned_date\` date NOT NULL,
      \`expected_return_date\` date DEFAULT NULL,
      \`returned_date\` date DEFAULT NULL,
      \`condition_out\` varchar(50) DEFAULT 'good',
      \`condition_in\` varchar(50) DEFAULT NULL,
      \`note\` text DEFAULT NULL,
      \`status\` varchar(50) DEFAULT 'active',
      \`created_by\` int DEFAULT '1',
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_assign_asset\` (\`asset_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✔ Verified aura_asset_assignments table.');

  // 4. Asset Transfers Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`aura_asset_transfers\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`asset_id\` int NOT NULL,
      \`reference_no\` varchar(50) NOT NULL,
      \`transfer_date\` date NOT NULL,
      \`from_location\` varchar(255) DEFAULT NULL,
      \`to_location\` varchar(255) NOT NULL,
      \`from_department\` varchar(255) DEFAULT NULL,
      \`to_department\` varchar(255) DEFAULT NULL,
      \`from_employee\` varchar(255) DEFAULT NULL,
      \`to_employee\` varchar(255) DEFAULT NULL,
      \`reason\` text DEFAULT NULL,
      \`status\` varchar(50) DEFAULT 'completed',
      \`created_by\` int DEFAULT '1',
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_transfer_ref\` (\`reference_no\`),
      KEY \`idx_transfer_asset\` (\`asset_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✔ Verified aura_asset_transfers table.');

  // 5. Asset Maintenances Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`aura_asset_maintenances\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`asset_id\` int NOT NULL,
      \`reference_no\` varchar(50) NOT NULL,
      \`maintenance_type\` varchar(50) DEFAULT 'preventive',
      \`title\` varchar(255) NOT NULL,
      \`description\` text DEFAULT NULL,
      \`priority\` varchar(20) DEFAULT 'medium',
      \`scheduled_date\` date NOT NULL,
      \`completed_date\` date DEFAULT NULL,
      \`technician\` varchar(255) DEFAULT NULL,
      \`service_provider\` varchar(255) DEFAULT NULL,
      \`cost\` decimal(25,4) DEFAULT '0.0000',
      \`parts_replaced\` text DEFAULT NULL,
      \`status\` varchar(50) DEFAULT 'pending',
      \`created_by\` int DEFAULT '1',
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_maint_ref\` (\`reference_no\`),
      KEY \`idx_maint_asset\` (\`asset_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✔ Verified aura_asset_maintenances table.');

  // 6. Asset Disposals Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`aura_asset_disposals\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`asset_id\` int NOT NULL,
      \`reference_no\` varchar(50) NOT NULL,
      \`disposal_date\` date NOT NULL,
      \`disposal_method\` varchar(50) NOT NULL,
      \`sale_amount\` decimal(25,4) DEFAULT '0.0000',
      \`book_value_at_disposal\` decimal(25,4) DEFAULT '0.0000',
      \`gain_loss\` decimal(25,4) DEFAULT '0.0000',
      \`buyer_name\` varchar(255) DEFAULT NULL,
      \`reason\` text DEFAULT NULL,
      \`approved_by\` int DEFAULT NULL,
      \`created_by\` int DEFAULT '1',
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_disposal_ref\` (\`reference_no\`),
      KEY \`idx_disposal_asset\` (\`asset_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✔ Verified aura_asset_disposals table.');

  // 7. Seed sample assets if table is empty
  const [assetCount] = await db.query('SELECT COUNT(*) as count FROM aura_assets');
  if (assetCount[0].count === 0) {
    const today = new Date().toISOString().slice(0, 10);
    await db.query(`
      INSERT INTO \`aura_assets\` 
      (asset_code, name, category_id, brand, model, serial_number, barcode, purchase_date, purchase_cost, residual_value, useful_life_months, accumulated_depreciation, current_value, location_name, department_name, \`condition\`, status, note, warranty_start, warranty_end)
      VALUES
      ('AST-2026-0001', 'MacBook Pro 16" M3 Max', 1, 'Apple', 'A2991', 'C02G4589MD6R', '884600998811', '2025-01-15', 3499.00, 500.00, 36, 624.80, 2874.20, 'Floor 3 - Engineering Lab', 'IT / Software', 'excellent', 'assigned', 'Assigned to Lead Architect', '2025-01-15', '2028-01-15'),
      ('AST-2026-0002', 'Dell PowerEdge R750xs Server', 1, 'Dell', 'R750xs', 'SN-DELL-883921', '884600998812', '2024-06-10', 5850.00, 800.00, 48, 1683.33, 4166.67, 'Central Server Room', 'Infrastructure', 'good', 'available', 'Primary cloud replica server', '2024-06-10', '2027-06-10'),
      ('AST-2026-0003', 'La Marzocco Linea PB 2-Group Espresso Machine', 4, 'La Marzocco', 'Linea PB', 'LM-ESPR-9921', '884600998813', '2024-03-20', 14500.00, 2000.00, 84, 2380.95, 12119.05, 'SBC Flagship Coffee Bar', 'Store Operations', 'good', 'available', 'Dual boiler commercial espresso unit', '2024-03-20', '2026-03-20'),
      ('AST-2026-0004', 'Herman Miller Aeron Ergonomic Task Chairs (Set of 6)', 2, 'Herman Miller', 'Aeron B', 'HM-CHAIR-SET6', '884600998814', '2025-02-01', 7200.00, 1000.00, 60, 206.67, 6993.33, 'Executive Boardroom', 'Management', 'excellent', 'available', 'Graphite frame executive seating', '2025-02-01', '2037-02-01'),
      ('AST-2026-0005', 'Toyota HiAce Delivery Van', 3, 'Toyota', 'HiAce 2024', 'VIN-TOY-8849201', '884600998815', '2024-08-15', 38000.00, 8000.00, 60, 6000.00, 32000.00, 'Central Logistics Bay', 'Supply Chain', 'good', 'assigned', 'Temperature-controlled delivery vehicle', '2024-08-15', '2027-08-15');
    `);

    // Seed sample assignment
    await db.query(`
      INSERT INTO \`aura_asset_assignments\` 
      (asset_id, employee_id, employee_name, department_name, assigned_date, condition_out, note, status)
      VALUES 
      (1, 1, 'John Smith (Lead Architect)', 'IT / Software', '2025-01-16', 'excellent', 'Hardware kit handed over in box with charger', 'active'),
      (5, 2, 'Sok Dara (Logistics Lead)', 'Supply Chain', '2024-08-16', 'good', 'Vehicle keys & registration documents delivered', 'active');
    `);

    // Seed sample maintenance
    await db.query(`
      INSERT INTO \`aura_asset_maintenances\`
      (asset_id, reference_no, maintenance_type, title, description, priority, scheduled_date, technician, cost, status)
      VALUES
      (3, 'MNT-2026-0001', 'preventive', 'Quarterly Espresso Grouphead & Valve Descaling', 'Clean flowmeters, inspect gaskets, descale boiler', 'high', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Kiri (Coffee Tech Service)', 120.00, 'pending'),
      (5, 'MNT-2026-0002', 'preventive', '10,000 KM Engine Oil & Filter Change', 'Full synthetic oil change, brake inspection', 'medium', DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'Toyota Service Center', 85.00, 'pending');
    `);

    console.log('✔ Seeded 5 initial assets, 2 assignments, and 2 maintenance schedules.');
  }

  console.log('\n=================================================');
  console.log('🎉 ASSET MANAGEMENT SYSTEM MIGRATION COMPLETE!');
  console.log('=================================================\n');
}

migrateAssetSystem().then(() => process.exit(0)).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
