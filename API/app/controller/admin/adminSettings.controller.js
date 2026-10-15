const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError } = require('../../config/utill/response');
const { logActivity } = require('../../services/auditLogger.service');

/**
 * GET /api/admin/settings
 * Retrieve site settings and enterprise organization profile
 */
exports.getSettings = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM aura_site_settings ORDER BY id ASC LIMIT 1');
    if (!rows || rows.length === 0) {
      return sendSuccess(res, {
        site_name: 'Aura Supply B2B',
        company_name: 'Aura Global Sourcing Co., Ltd.',
        vat_no: 'K002-902100456',
        default_currency: 'USD',
        currency_symbol: '$'
      });
    }
    return sendSuccess(res, rows[0]);
  } catch (err) {
    console.error('[AdminSettings error]', err);
    return sendError(res, 'Failed to fetch settings', 500, err.message);
  }
};

/**
 * PUT /api/admin/settings
 * Update branding, contact information, and currency
 */
exports.updateSettings = async (req, res) => {
  try {
    const {
      site_name,
      company_name,
      company_name_kh,
      tagline,
      address,
      address_kh,
      city,
      country,
      phone,
      email,
      vat_no,
      default_currency,
      currency_symbol,
      timezone,
      invoice_footer
    } = req.body;

    const [existing] = await db.query('SELECT * FROM aura_site_settings WHERE id = 1 LIMIT 1');
    const oldSettings = existing?.[0] || {};

    await db.query(`
      UPDATE aura_site_settings SET
        site_name = COALESCE(?, site_name),
        company_name = COALESCE(?, company_name),
        company_name_kh = COALESCE(?, company_name_kh),
        tagline = COALESCE(?, tagline),
        address = COALESCE(?, address),
        address_kh = COALESCE(?, address_kh),
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        vat_no = COALESCE(?, vat_no),
        default_currency = COALESCE(?, default_currency),
        currency_symbol = COALESCE(?, currency_symbol),
        timezone = COALESCE(?, timezone),
        invoice_footer = COALESCE(?, invoice_footer),
        updated_at = NOW()
      WHERE id = 1
    `, [
      site_name, company_name, company_name_kh, tagline,
      address, address_kh, city, country, phone, email, vat_no,
      default_currency, currency_symbol, timezone, invoice_footer
    ]);

    await logActivity({
      req,
      action: 'update_settings',
      tableName: 'aura_site_settings',
      recordId: '1',
      oldValues: { site_name: oldSettings.site_name, company_name: oldSettings.company_name },
      newValues: { site_name, company_name, vat_no }
    });

    return sendSuccess(res, null, 'Site settings updated successfully');
  } catch (err) {
    return sendError(res, 'Failed to update settings', 500, err.message);
  }
};
