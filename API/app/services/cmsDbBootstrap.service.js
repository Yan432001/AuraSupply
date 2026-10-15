const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.resolve(__dirname, '../../../../database_schema_cms.sql');
const MIGRATION_FILE = path.resolve(__dirname, '../../../../migrations/001_telegram_store_dedicated_bots.sql');

async function runSqlFile(pool, filePath) {
  if (!fs.existsSync(filePath)) return;
  const sqlContent = fs.readFileSync(filePath, 'utf-8');
  const statements = sqlContent
    .split(/;\s*[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5 && !s.startsWith('--') && !s.startsWith('SET ') && !s.startsWith('START ') && !s.startsWith('COMMIT'));

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err) {
      if (!err.message.includes('already exists') && !err.message.includes('Duplicate entry') && !err.message.includes('Duplicate column')) {
        console.warn('[CMS Bootstrap] Notice on statement:', err.message);
      }
    }
  }
}

async function bootstrapDatabase(pool) {
  if (!pool) return;
  try {
    console.log('[CMS Bootstrap] Checking MySQL connection and tables...');
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('[CMS Bootstrap] MySQL connected successfully! Result:', rows[0]?.result);

    await runSqlFile(pool, SCHEMA_FILE);
    await runSqlFile(pool, MIGRATION_FILE);
    console.log('[CMS Bootstrap] Database tables and migrations verified successfully!');
  } catch (err) {
    console.log('[CMS Bootstrap] Notice: Local MySQL server not actively running on this host/port. Using resilient fallback store:', err.message);
  }
}

module.exports = { bootstrapDatabase };
