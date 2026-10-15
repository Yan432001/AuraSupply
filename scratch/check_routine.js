const { db } = require('../API/app/config/utill/helper');

async function main() {
  try {
    const [rows] = await db.query(`
      SELECT ROUTINE_NAME 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = 'aura_v1_db' AND ROUTINE_NAME = 'aura_add_column'
    `);
    console.log('aura_add_column routine check:', rows);
  } catch (e) {
    console.log('Error checking routine:', e.message);
  }
  process.exit(0);
}

main();
