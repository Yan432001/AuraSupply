const db = require('../API/app/config/dbPool');

async function main() {
  const [cols] = await db.query("SHOW COLUMNS FROM aura_purchase_request_items LIKE 'po_quantity'");
  if (cols.length === 0) {
    console.log('Adding po_quantity to aura_purchase_request_items...');
    await db.query("ALTER TABLE aura_purchase_request_items ADD COLUMN po_quantity DECIMAL(15,4) NULL DEFAULT 0");
    console.log('Added po_quantity.');
  } else {
    console.log('po_quantity already exists.');
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
