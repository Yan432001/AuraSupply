const { db } = require('../API/app/config/utill/helper');
const fs = require('fs');

function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'` + String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + `'`;
}

async function run() {
  console.log('Fetching all 5,474 rows from MySQL aura_language...');
  const [rows] = await db.query('SELECT id, code, khmer, english, chinese, thai, vietnamese FROM aura_language ORDER BY id ASC');
  console.log(`Fetched ${rows.length} rows.`);

  // Build the SQL block
  const lines = [];
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `aura_language`');
  lines.push('-- --------------------------------------------------------');
  lines.push('');
  lines.push('DROP TABLE IF EXISTS `aura_language`;');
  lines.push('CREATE TABLE IF NOT EXISTS `aura_language` (');
  lines.push('  `id` int NOT NULL AUTO_INCREMENT,');
  lines.push('  `code` varchar(150) COLLATE utf8mb4_bin NOT NULL,');
  lines.push('  `khmer` text DEFAULT NULL,');
  lines.push('  `english` text DEFAULT NULL,');
  lines.push('  `chinese` text DEFAULT NULL,');
  lines.push('  `thai` text DEFAULT NULL,');
  lines.push('  `vietnamese` text DEFAULT NULL,');
  lines.push('  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,');
  lines.push('  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,');
  lines.push('  PRIMARY KEY (`id`),');
  lines.push('  UNIQUE KEY `code` (`code`)');
  lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
  lines.push('');
  lines.push('-- Dumping data for table `aura_language`');
  lines.push('');

  const CHUNK_SIZE = 50;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const valueTuples = chunk.map((r, idx) => {
      const isLast = idx === chunk.length - 1;
      return `(${r.id}, ${escapeSqlString(r.code)}, ${escapeSqlString(r.khmer)}, ${escapeSqlString(r.english)}, ${escapeSqlString(r.chinese)}, ${escapeSqlString(r.thai)}, ${escapeSqlString(r.vietnamese)})` + (isLast ? ';' : ',');
    });
    lines.push(`INSERT INTO \`aura_language\` (\`id\`, \`code\`, \`khmer\`, \`english\`, \`chinese\`, \`thai\`, \`vietnamese\`) VALUES\n` + valueTuples.join('\n'));
    lines.push('');
  }

  const newSqlBlock = lines.join('\n');

  console.log('Reading aura_v1_db.sql...');
  const sqlContent = fs.readFileSync('aura_v1_db.sql', 'utf8');

  const startMarker = '-- --------------------------------------------------------\n-- Table structure for table `aura_language`';
  const startMarkerCRLF = '-- --------------------------------------------------------\r\n-- Table structure for table `aura_language`';
  const endMarker = '-- Table structure for table `aura_leads`';

  let startIndex = sqlContent.indexOf(startMarker);
  if (startIndex === -1) {
    startIndex = sqlContent.indexOf(startMarkerCRLF);
  }
  const endIndex = sqlContent.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error(`Markers not found: start=${startIndex}, end=${endIndex}`);
    process.exit(1);
  }

  console.log(`Replacing lines between ${startIndex} and ${endIndex}...`);
  const updatedSql = sqlContent.substring(0, startIndex) + newSqlBlock + '\n\n--\n' + sqlContent.substring(endIndex);
  fs.writeFileSync('aura_v1_db.sql', updatedSql, 'utf8');
  console.log(`Successfully updated aura_v1_db.sql with ${rows.length} clean Unicode rows.`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
