const { db } = require('../API/app/config/utill/helper');

async function run() {
  try {
    // Drop table and replace with VIEW
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('DROP TABLE IF EXISTS aura_user_profiles');
    await db.query(`
      CREATE OR REPLACE VIEW aura_user_profiles AS
      SELECT 
        id AS user_id,
        name_kh,
        company_kh,
        contact_person,
        business_type,
        vat_no,
        gst_no,
        address,
        address_kh,
        village,
        commune,
        street_no,
        city,
        state,
        postal_code,
        country_id,
        country,
        latitude,
        longitude,
        customer_group_id,
        customer_group_name,
        price_group_id,
        price_group_name,
        payment_term,
        credit_limit,
        deposit_amount,
        deposit_amount_usd,
        deposit_amount_khr,
        deposit_amount_thb,
        level_id,
        member_expiry,
        source,
        logo,
        attachment,
        telegram_chat_id,
        NULL AS cf1,
        NULL AS cf2,
        NULL AS cf3,
        NULL AS cf4,
        NULL AS cf5,
        NULL AS cf6,
        updated_at
      FROM aura_users
    `);
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ aura_user_profiles converted into VIEW pointing directly to aura_users');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
}

run();
