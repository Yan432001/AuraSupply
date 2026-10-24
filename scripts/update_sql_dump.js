const fs = require('fs');

function updateSqlDump() {
  console.log('Updating aura_v1_db.sql schema...');
  let content = fs.readFileSync('aura_v1_db.sql', 'utf8');

  const newVariantTable = `CREATE TABLE IF NOT EXISTS \`aura_product_variants\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`product_id\` int NOT NULL,
  \`name\` varchar(55) NOT NULL,
  \`sku\` varchar(100) DEFAULT NULL,
  \`barcode\` varchar(100) DEFAULT NULL,
  \`image\` varchar(255) DEFAULT NULL,
  \`attributes\` text DEFAULT NULL,
  \`cost\` decimal(25,2) DEFAULT NULL,
  \`price\` decimal(25,2) DEFAULT NULL,
  \`quantity\` decimal(15,2) DEFAULT NULL,
  \`qty_unit\` decimal(11,3) DEFAULT '0.000',
  \`status\` tinyint(1) DEFAULT '1',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`unique_product_id_name\` (\`product_id\`,\`name\`),
  KEY \`idx_variant_sku\` (\`sku\`),
  KEY \`idx_variant_barcode\` (\`barcode\`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;`;

  if (content.includes('`aura_product_variants`')) {
    content = content.replace(/CREATE TABLE IF NOT EXISTS \`aura_product_variants\`[^\;]+\;/, newVariantTable);
    console.log('✅ Replaced aura_product_variants definition in SQL dump');
  }

  if (!content.includes('`aura_attributes`')) {
    const extraTables = `
-- ==============================================================================
-- AURA INVENTORY & VARIANT SYSTEM EXTENSIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS \`aura_attributes\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`name\` varchar(100) NOT NULL,
  \`code\` varchar(50) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_attribute_code\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`aura_attribute_values\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`attribute_id\` int NOT NULL,
  \`value\` varchar(100) NOT NULL,
  \`color_code\` varchar(25) DEFAULT NULL,
  \`sort_order\` int DEFAULT '0',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_attr_val\` (\`attribute_id\`, \`value\`),
  KEY \`idx_attribute_id\` (\`attribute_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`aura_product_variant_values\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`product_id\` int NOT NULL,
  \`variant_id\` int NOT NULL,
  \`attribute_id\` int NOT NULL,
  \`attribute_value_id\` int NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_var_attr\` (\`variant_id\`, \`attribute_id\`),
  KEY \`idx_product_id\` (\`product_id\`),
  KEY \`idx_variant_id\` (\`variant_id\`),
  KEY \`idx_attribute_id\` (\`attribute_id\`),
  KEY \`idx_attr_val_id\` (\`attribute_value_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`aura_attributes\` (\`id\`, \`name\`, \`code\`) VALUES
(1, 'Color', 'color'),
(2, 'Size', 'size'),
(3, 'Material', 'material')
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);

INSERT INTO \`aura_attribute_values\` (\`attribute_id\`, \`value\`, \`color_code\`, \`sort_order\`) VALUES
(1, 'Red', '#ef4444', 0),
(1, 'Blue', '#3b82f6', 1),
(1, 'Black', '#1e293b', 2),
(1, 'White', '#ffffff', 3),
(1, 'Green', '#10b981', 4),
(2, 'Small (S)', NULL, 0),
(2, 'Medium (M)', NULL, 1),
(2, 'Large (L)', NULL, 2),
(2, 'XL', NULL, 3),
(2, 'Size 40', NULL, 4),
(2, 'Size 41', NULL, 5),
(2, 'Size 42', NULL, 6),
(3, 'Cotton', NULL, 0),
(3, 'Leather', NULL, 1),
(3, 'Polyester', NULL, 2),
(3, 'Stainless Steel', NULL, 3)
ON DUPLICATE KEY UPDATE \`color_code\` = VALUES(\`color_code\`), \`sort_order\` = VALUES(\`sort_order\`);
`;
    content += extraTables;
    console.log('✅ Appended aura_attributes & aura_attribute_values to aura_v1_db.sql');
  }

  fs.writeFileSync('aura_v1_db.sql', content, 'utf8');
  console.log('✅ aura_v1_db.sql saved successfully.');
}

updateSqlDump();
