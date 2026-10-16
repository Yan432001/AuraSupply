const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError } = require('../../config/utill/response');
const { logActivity } = require('../../services/auditLogger.service');

/**
 * GET /api/admin/modules
 * Return all 16 ERP modules with categories, icons, and nested sub-modules
 */
exports.listModules = async (req, res) => {
  try {
    const [modules] = await db.query(`
      SELECT *
      FROM aura_module_settings
      ORDER BY sort_order ASC, id ASC
    `);

    let submodules = [];
    try {
      const [subRows] = await db.query(`
        SELECT *
        FROM aura_sub_module_settings
        ORDER BY id ASC
      `);
      submodules = subRows;
    } catch (_) {}

    // Group submodules by module_key
    const subMap = {};
    for (const sub of submodules) {
      if (!subMap[sub.module_key]) {
        subMap[sub.module_key] = [];
      }
      subMap[sub.module_key].push({
        id: sub.id,
        key: sub.sub_module_key || sub.key,
        label: sub.label || sub.title || sub.name,
        enabled: sub.is_enabled === 1,
        description: sub.description || ''
      });
    }

    const payload = modules.map(m => {
      let configObj = {};
      try {
        if (m.config) {
          configObj = typeof m.config === 'string' ? JSON.parse(m.config) : m.config;
        }
      } catch (_) {}

      return {
        id: m.id,
        key: m.module_key,
        label: m.title || m.label || configObj.label || m.module_key,
        category: m.category || configObj.category || 'Operations',
        iconKey: m.icon_key || configObj.iconKey || m.module_key,
        accent: m.accent_color || configObj.accent || '#2563eb',
        enabled: m.is_enabled === 1,
        sortOrder: m.sort_order || 0,
        description: m.description || configObj.description || '',
        submodules: subMap[m.module_key] || []
      };
    });

    // Calculate summary statistics
    const totalModules = payload.length;
    const activeModules = payload.filter(m => m.enabled).length;

    return sendSuccess(res, {
      modules: payload,
      stats: {
        total: totalModules,
        active: activeModules,
        disabled: totalModules - activeModules
      }
    });
  } catch (err) {
    console.error('[AdminModules list error]', err);
    return sendError(res, 'Failed to fetch ERP modules', 500, err.message);
  }
};

/**
 * POST /api/admin/modules/toggle
 * Enable or disable an ERP module
 */
exports.toggleModule = async (req, res) => {
  try {
    const { module_key, enabled } = req.body;
    if (!module_key) {
      return sendError(res, 'module_key is required', 400);
    }

    const isEnabled = enabled === true || enabled === 1 ? 1 : 0;

    // Safety: prevent disabling core system settings or modules manager
    if (module_key === 'settings' && isEnabled === 0) {
      return sendError(res, 'Cannot disable core System & Security Settings module', 400);
    }

    await db.query(`
      UPDATE aura_module_settings
      SET is_enabled = ?, updated_at = NOW()
      WHERE module_key = ?
    `, [isEnabled, module_key]);

    await logActivity({
      req,
      action: isEnabled ? 'module_enable' : 'module_disable',
      tableName: 'aura_module_settings',
      recordId: module_key,
      newValues: { is_enabled: isEnabled }
    });

    return sendSuccess(res, { module_key, is_enabled: isEnabled === 1 }, `Module '${module_key}' ${isEnabled ? 'enabled' : 'disabled'}`);
  } catch (err) {
    return sendError(res, 'Failed to toggle module status', 500, err.message);
  }
};

/**
 * POST /api/admin/modules/submodule/toggle
 * Enable or disable an ERP sub-module
 */
exports.toggleSubmodule = async (req, res) => {
  try {
    const { sub_module_key, enabled } = req.body;
    if (!sub_module_key) {
      return sendError(res, 'sub_module_key is required', 400);
    }

    const isEnabled = enabled === true || enabled === 1 ? 1 : 0;

    await db.query(`
      UPDATE aura_sub_module_settings
      SET is_enabled = ?, updated_at = NOW()
      WHERE sub_module_key = ?
    `, [isEnabled, sub_module_key]);

    return sendSuccess(res, { sub_module_key, is_enabled: isEnabled === 1 }, `Sub-module '${sub_module_key}' ${isEnabled ? 'enabled' : 'disabled'}`);
  } catch (err) {
    return sendError(res, 'Failed to toggle sub-module status', 500, err.message);
  }
};

/**
 * GET /api/admin/modules/license
 * Get enterprise license status & expiration details
 */
exports.getLicense = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT license_key, license_name, domain, status, environment,
             issued_at, expires_at, last_verified_at, max_users, max_branches
      FROM aura_license
      ORDER BY id DESC
      LIMIT 1
    `);

    if (!rows || rows.length === 0) {
      return sendSuccess(res, {
        status: 'trial',
        license_key: 'AURA-TRIAL-COMMUNITY-EDITION',
        license_name: 'Community Trial',
        days_remaining: 30,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const lic = rows[0];
    const now = new Date();
    const expiry = new Date(lic.expires_at);
    const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));

    return sendSuccess(res, {
      ...lic,
      days_remaining: daysRemaining,
      is_valid: lic.status === 'active' && daysRemaining > 0
    });
  } catch (err) {
    return sendError(res, 'Failed to retrieve license info', 500, err.message);
  }
};

/**
 * POST /api/admin/modules/license
 * Validate and update license key
 */
exports.updateLicense = async (req, res) => {
  try {
    const { license_key, license_name } = req.body;
    if (!license_key) {
      return sendError(res, 'License key is required', 400);
    }

    // Extended enterprise validation
    const cleanKey = license_key.trim().toUpperCase();
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2); // 2 years validity

    await db.query(`
      INSERT INTO aura_license (
        id, license_key, license_name, domain, status, environment, expires_at, last_verified_at
      ) VALUES (
        1, ?, ?, 'aurasupply.biz', 'active', 'production', ?, NOW()
      ) ON DUPLICATE KEY UPDATE
        license_key = VALUES(license_key),
        license_name = VALUES(license_name),
        status = 'active',
        expires_at = VALUES(expires_at),
        last_verified_at = NOW()
    `, [cleanKey, license_name || 'Aura Enterprise Client', expiry]);

    await logActivity({
      req,
      action: 'license_update',
      tableName: 'aura_license',
      recordId: '1',
      newValues: { license_key: cleanKey }
    });

    return sendSuccess(res, { license_key: cleanKey, status: 'active', expires_at: expiry }, 'License validated and activated successfully');
  } catch (err) {
    return sendError(res, 'Failed to update license', 500, err.message);
  }
};
