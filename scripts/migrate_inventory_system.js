const { db } = require('../API/app/config/utill/helper');

async function migrate() {
  console.log('===============================================================');
  console.log('🚀 RUNNING AURA INVENTORY & VARIANT SYSTEM MIGRATION');
  console.log('===============================================================');

  try {
    // 1. Create aura_attributes table
    console.log('\n[1/6] Creating / checking aura_attributes table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS aura_attributes (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_attribute_code (code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ aura_attributes table ready');

    // 2. Create aura_attribute_values table
    console.log('\n[2/6] Creating / checking aura_attribute_values table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS aura_attribute_values (
        id INT NOT NULL AUTO_INCREMENT,
        attribute_id INT NOT NULL,
        value VARCHAR(100) NOT NULL,
        color_code VARCHAR(25) DEFAULT NULL,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_attr_val (attribute_id, value),
        KEY idx_attribute_id (attribute_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ aura_attribute_values table ready');

    // 3. Create aura_product_variant_values table
    console.log('\n[3/6] Creating / checking aura_product_variant_values table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS aura_product_variant_values (
        id INT NOT NULL AUTO_INCREMENT,
        product_id INT NOT NULL,
        variant_id INT NOT NULL,
        attribute_id INT NOT NULL,
        attribute_value_id INT NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_var_attr (variant_id, attribute_id),
        KEY idx_product_id (product_id),
        KEY idx_variant_id (variant_id),
        KEY idx_attribute_id (attribute_id),
        KEY idx_attr_val_id (attribute_value_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ aura_product_variant_values table ready');

    // 4. Upgrade aura_product_variants table with new columns if not present
    console.log('\n[4/6] Upgrading aura_product_variants table columns...');
    const [cols] = await db.query('DESCRIBE aura_product_variants');
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('sku')) {
      await db.query('ALTER TABLE aura_product_variants ADD COLUMN sku VARCHAR(100) NULL AFTER name');
      await db.query('ALTER TABLE aura_product_variants ADD INDEX idx_variant_sku (sku)');
      console.log('  + Added sku column and index to aura_product_variants');
    }
    if (!colNames.includes('barcode')) {
      await db.query('ALTER TABLE aura_product_variants ADD COLUMN barcode VARCHAR(100) NULL AFTER sku');
      await db.query('ALTER TABLE aura_product_variants ADD INDEX idx_variant_barcode (barcode)');
      console.log('  + Added barcode column and index to aura_product_variants');
    }
    if (!colNames.includes('image')) {
      await db.query('ALTER TABLE aura_product_variants ADD COLUMN image VARCHAR(255) NULL AFTER barcode');
      console.log('  + Added image column to aura_product_variants');
    }
    if (!colNames.includes('attributes')) {
      await db.query('ALTER TABLE aura_product_variants ADD COLUMN attributes TEXT NULL AFTER image');
      console.log('  + Added attributes column to aura_product_variants');
    }
    if (!colNames.includes('status')) {
      await db.query('ALTER TABLE aura_product_variants ADD COLUMN status TINYINT(1) DEFAULT 1 AFTER attributes');
      console.log('  + Added status column to aura_product_variants');
    }
    if (!colNames.includes('created_at')) {
      await db.query('ALTER TABLE aura_product_variants ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
      console.log('  + Added created_at column to aura_product_variants');
    }
    if (!colNames.includes('updated_at')) {
      await db.query('ALTER TABLE aura_product_variants ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      console.log('  + Added updated_at column to aura_product_variants');
    }
    console.log('✅ aura_product_variants table columns verified');

    // 5. Ensure unique key on aura_warehouses_products_variants (option_id, warehouse_id)
    console.log('\n[5/6] Checking aura_warehouses_products_variants unique key...');
    const [whpvIndexes] = await db.query('SHOW INDEX FROM aura_warehouses_products_variants');
    const indexNames = whpvIndexes.map(i => i.Key_name);
    if (!indexNames.includes('uk_option_warehouse')) {
      try {
        await db.query('ALTER TABLE aura_warehouses_products_variants ADD UNIQUE KEY uk_option_warehouse (option_id, warehouse_id)');
        console.log('  + Added uk_option_warehouse unique constraint');
      } catch (e) {
        console.log('  (Unique key already exists or duplicate records present:', e.message, ')');
      }
    }
    console.log('✅ aura_warehouses_products_variants verified');

    // 6. Seed Default Reusable Attributes & Values
    console.log('\n[6/6] Seeding default attributes & values (Color, Size, Material)...');
    const defaultAttributes = [
      {
        name: 'Color',
        code: 'color',
        values: [
          { value: 'Red', color_code: '#ef4444' },
          { value: 'Blue', color_code: '#3b82f6' },
          { value: 'Black', color_code: '#1e293b' },
          { value: 'White', color_code: '#ffffff' },
          { value: 'Green', color_code: '#10b981' }
        ]
      },
      {
        name: 'Size',
        code: 'size',
        values: [
          { value: 'Small (S)', color_code: null },
          { value: 'Medium (M)', color_code: null },
          { value: 'Large (L)', color_code: null },
          { value: 'XL', color_code: null },
          { value: 'Size 40', color_code: null },
          { value: 'Size 41', color_code: null },
          { value: 'Size 42', color_code: null }
        ]
      },
      {
        name: 'Material',
        code: 'material',
        values: [
          { value: 'Cotton', color_code: null },
          { value: 'Leather', color_code: null },
          { value: 'Polyester', color_code: null },
          { value: 'Stainless Steel', color_code: null }
        ]
      }
    ];

    for (const attr of defaultAttributes) {
      const [existing] = await db.query('SELECT id FROM aura_attributes WHERE code = ? LIMIT 1', [attr.code]);
      let attrId;
      if (existing && existing.length > 0) {
        attrId = existing[0].id;
      } else {
        const [res] = await db.query('INSERT INTO aura_attributes (name, code) VALUES (?, ?)', [attr.name, attr.code]);
        attrId = res.insertId;
        console.log(`  + Seeded attribute: ${attr.name}`);
      }

      for (let i = 0; i < attr.values.length; i++) {
        const v = attr.values[i];
        await db.query(`
          INSERT INTO aura_attribute_values (attribute_id, value, color_code, sort_order)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE color_code = VALUES(color_code), sort_order = VALUES(sort_order)
        `, [attrId, v.value, v.color_code, i]);
      }
    }
    console.log('✅ Default attributes and values seeded successfully');

    console.log('\n===============================================================');
    console.log('🎉 INVENTORY SYSTEM DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('===============================================================');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
