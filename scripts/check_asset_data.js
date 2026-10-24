const db = require('../API/app/config/utill/connection');

async function checkAssetData() {
  const [prodAssets] = await db.query("SELECT id, code, name, type, cost, price, serial_no FROM aura_products WHERE type = 'asset'");
  console.log('Products with type = asset:', prodAssets.length);
  if (prodAssets.length > 0) {
    console.log(prodAssets);
  }

  const [evals] = await db.query("SELECT * FROM aura_asset_evaluation");
  console.log('Asset evaluation records:', evals.length);
  if (evals.length > 0) {
    console.log(evals.slice(0, 3));
  }

  const [maint] = await db.query("SELECT * FROM aura_maintenance");
  console.log('Maintenance records:', maint.length);
}

checkAssetData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
