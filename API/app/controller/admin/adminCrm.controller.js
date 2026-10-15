const bcrypt = require('bcryptjs');
const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');
const { logActivity } = require('../../services/auditLogger.service');

/**
 * GET /api/admin/customers
 * List commercial buyers solely from `aura_users WHERE role = 'buyer'`
 */
exports.listBuyers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;

    let whereSql = "WHERE role = 'buyer' AND deleted_at IS NULL";
    const params = [];

    if (search) {
      whereSql += ' AND (username LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(search, search, search, search, search);
    }

    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM aura_users ${whereSql}`, params);
    const total = countRows?.[0]?.total || 0;

    const sql = `
      SELECT id, username, first_name, last_name, email, phone, gender,
             role, level, status, active, created_at, last_login_at
      FROM aura_users
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    const [buyers] = await db.query(sql, [...params, limit, offset]);

    return sendPaginated(res, buyers || [], total, page, limit);
  } catch (err) {
    console.error('[AdminCrm listBuyers error]', err);
    return sendError(res, 'Failed to fetch commercial buyers', 500, err.message);
  }
};

/**
 * GET /api/admin/suppliers
 * List verified suppliers solely from `aura_users WHERE role = 'supplier'`
 */
exports.listSuppliers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;

    let whereSql = "WHERE role = 'supplier' AND deleted_at IS NULL";
    const params = [];

    if (search) {
      whereSql += ' AND (username LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(search, search, search, search, search);
    }

    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM aura_users ${whereSql}`, params);
    const total = countRows?.[0]?.total || 0;

    const sql = `
      SELECT id, username, first_name, last_name, email, phone, gender,
             role, level, status, active, created_at, last_login_at
      FROM aura_users
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    const [suppliers] = await db.query(sql, [...params, limit, offset]);

    return sendPaginated(res, suppliers || [], total, page, limit);
  } catch (err) {
    return sendError(res, 'Failed to fetch suppliers', 500, err.message);
  }
};

/**
 * POST /api/admin/customers
 * Create a new commercial buyer in `aura_users`
 */
exports.createBuyer = async (req, res) => {
  try {
    const { name, username, email, phone, password } = req.body;
    if (!name && !username) {
      return sendError(res, 'Buyer name or username is required', 400);
    }

    const autoUsername = (username || name).toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25) + '_' + Date.now().toString().slice(-4);
    const autoEmail = email || `${autoUsername}@buyer.aurasupply.biz`;
    const defaultPass = password || 'AuraBuyer@2026';
    const hash = await bcrypt.hash(defaultPass, 10);

    const parts = (name || 'Commercial Buyer').split(' ');
    const firstName = parts[0] || 'Buyer';
    const lastName = parts.slice(1).join(' ') || '';

    const sql = `
      INSERT INTO aura_users (
        username, password, email, first_name, last_name, phone,
        role, level, status, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'buyer', 5, 'active', 1, NOW())
    `;

    const [result] = await db.query(sql, [autoUsername, hash, autoEmail, firstName, lastName, phone || null]);

    await logActivity({
      req,
      action: 'create_buyer',
      tableName: 'aura_users',
      recordId: result.insertId,
      newValues: { username: autoUsername, role: 'buyer' }
    });

    return sendSuccess(res, { id: result.insertId, username: autoUsername }, 'Buyer created successfully in users directory', null, 201);
  } catch (err) {
    return sendError(res, 'Failed to create buyer', 500, err.message);
  }
};

/**
 * POST /api/admin/suppliers
 * Create a new verified supplier in `aura_users`
 */
exports.createSupplier = async (req, res) => {
  try {
    const { name, username, email, phone, password } = req.body;
    if (!name && !username) {
      return sendError(res, 'Supplier name or username is required', 400);
    }

    const autoUsername = (username || name).toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25) + '_' + Date.now().toString().slice(-4);
    const autoEmail = email || `${autoUsername}@supplier.aurasupply.biz`;
    const defaultPass = password || 'AuraSupplier@2026';
    const hash = await bcrypt.hash(defaultPass, 10);

    const parts = (name || 'Verified Supplier').split(' ');
    const firstName = parts[0] || 'Supplier';
    const lastName = parts.slice(1).join(' ') || '';

    const sql = `
      INSERT INTO aura_users (
        username, password, email, first_name, last_name, phone,
        role, level, status, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'supplier', 4, 'active', 1, NOW())
    `;

    const [result] = await db.query(sql, [autoUsername, hash, autoEmail, firstName, lastName, phone || null]);

    await logActivity({
      req,
      action: 'create_supplier',
      tableName: 'aura_users',
      recordId: result.insertId,
      newValues: { username: autoUsername, role: 'supplier' }
    });

    return sendSuccess(res, { id: result.insertId, username: autoUsername }, 'Supplier created successfully in users directory', null, 201);
  } catch (err) {
    return sendError(res, 'Failed to create supplier', 500, err.message);
  }
};
