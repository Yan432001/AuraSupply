const db = require('../../config/utill/connection');
const { logError } = require('../../config/utill/logErr');

/**
 * GET /api/admin/system-settings
 * Retrieve full system settings from aura_settings and aura_pos_settings
 * along with available lookups (warehouses, billers, currencies, tax rates, customer groups)
 */
exports.getSystemSettings = async (req, res) => {
  try {
    const [settingsRows] = await db.query('SELECT * FROM aura_settings WHERE setting_id = 1 LIMIT 1');
    const settings = settingsRows[0] || {};

    const [posRows] = await db.query('SELECT * FROM aura_pos_settings WHERE pos_id = 1 LIMIT 1');
    const posSettings = posRows[0] || {};

    // Fetch relational master data for selectors
    const [warehouses] = await db.query('SELECT id, code, name FROM aura_warehouses ORDER BY name ASC');
    const [billers] = await db.query("SELECT id, name, company FROM aura_companies WHERE group_name = 'biller' ORDER BY name ASC");
    const [currencies] = await db.query('SELECT id, code, name, symbol, rate FROM aura_currencies ORDER BY code ASC');
    const [taxRates] = await db.query('SELECT id, name, code, rate, type FROM aura_tax_rates ORDER BY name ASC');
    const [customerGroups] = await db.query('SELECT id, name, percent FROM aura_customer_groups ORDER BY name ASC');
    const [priceGroups] = await db.query('SELECT id, name FROM aura_price_groups ORDER BY name ASC');
    const [units] = await db.query('SELECT id, code, name FROM aura_units WHERE base_unit IS NULL OR base_unit = 0 ORDER BY name ASC');

    res.json({
      status: true,
      data: {
        settings,
        posSettings,
        lookups: {
          warehouses,
          billers,
          currencies,
          taxRates,
          customerGroups,
          priceGroups,
          units
        }
      }
    });
  } catch (err) {
    logError('systemSettings.controller.getSystemSettings', err, res);
  }
};

/**
 * PUT /api/admin/system-settings
 * Update settings across all tabs/fieldsets in aura_settings and aura_pos_settings
 */
exports.updateSystemSettings = async (req, res) => {
  try {
    const { settings = {}, posSettings = {} } = req.body;

    // Remove setting_id or pos_id to prevent primary key alteration
    delete settings.setting_id;
    delete posSettings.pos_id;

    // Filter to valid columns that exist on aura_settings
    const [settingCols] = await db.query('DESCRIBE aura_settings');
    const validSettingCols = new Set(settingCols.map(c => c.Field));

    const updateFields = [];
    const updateValues = [];

    for (const [key, val] of Object.entries(settings)) {
      if (validSettingCols.has(key)) {
        updateFields.push(`\`${key}\` = ?`);
        updateValues.push(val === undefined ? null : val);
      }
    }

    if (updateFields.length > 0) {
      await db.query(`
        UPDATE aura_settings SET ${updateFields.join(', ')}
        WHERE setting_id = 1
      `, updateValues);
    }

    // Filter to valid columns on aura_pos_settings
    if (Object.keys(posSettings).length > 0) {
      const [posCols] = await db.query('DESCRIBE aura_pos_settings');
      const validPosCols = new Set(posCols.map(c => c.Field));

      const posUpdateFields = [];
      const posUpdateValues = [];

      for (const [key, val] of Object.entries(posSettings)) {
        if (validPosCols.has(key)) {
          posUpdateFields.push(`\`${key}\` = ?`);
          posUpdateValues.push(val === undefined ? null : val);
        }
      }

      if (posUpdateFields.length > 0) {
        await db.query(`
          UPDATE aura_pos_settings SET ${posUpdateFields.join(', ')}
          WHERE pos_id = 1
        `, posUpdateValues);
      }
    }

    res.json({
      status: true,
      message: 'System settings updated successfully'
    });
  } catch (err) {
    logError('systemSettings.controller.updateSystemSettings', err, res);
  }
};

/**
 * POST /api/admin/system-settings/reset-prefixes
 * Reset ERP document prefixes to standard AURA conventions
 */
exports.resetPrefixes = async (req, res) => {
  try {
    const defaultPrefixes = {
      sales_prefix: 'SALE',
      sales_order_prefix: 'SO',
      sales_tax_prefix: 'ST',
      quote_prefix: 'QUOTE',
      purchase_prefix: 'PO',
      purchase_order_prefix: 'PUR',
      purchase_request_prefix: 'PR',
      transfer_prefix: 'TR',
      delivery_prefix: 'DO',
      payment_prefix: 'PAY',
      ppayment_prefix: 'PPAY',
      return_prefix: 'RET',
      returnp_prefix: 'RETP',
      expense_prefix: 'EXP',
      qa_prefix: 'QA'
    };

    const fields = Object.keys(defaultPrefixes).map(k => `\`${k}\` = ?`).join(', ');
    const values = Object.values(defaultPrefixes);

    await db.query(`UPDATE aura_settings SET ${fields} WHERE setting_id = 1`, values);

    res.json({
      status: true,
      message: 'Prefixes reset to ERP default conventions successfully',
      data: defaultPrefixes
    });
  } catch (err) {
    logError('systemSettings.controller.resetPrefixes', err, res);
  }
};
