const bcrypt = require('bcryptjs');
const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');
const { logActivity } = require('../../services/auditLogger.service');

// Default permission schema for modules
const DEFAULT_PERMISSIONS = {
  inventory: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
  purchases: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  sales: { view: true, create: true, edit: false, delete: false, approve: false, export: true },
  crm: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
  accounts: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  hr: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  attendance: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
  payroll: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  expenses: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  reports: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
  settings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  notifications: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
  calendar: { view: true, create: true, edit: false, delete: false, approve: false, export: false },
  modules: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
  cms: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
};

/**
 * GET /api/admin/users
 * List users with search, role filter, status filter, and pagination
 */
exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const role = req.query.role && req.query.role !== 'all' ? req.query.role.trim() : null;
    const status = req.query.status && req.query.status !== 'all' ? req.query.status.trim() : null;

    let whereSql = 'WHERE deleted_at IS NULL';
    const params = [];

    if (search) {
      whereSql += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?)';
      params.push(search, search, search, search, search);
    }

    if (role) {
      whereSql += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      whereSql += ' AND status = ?';
      params.push(status);
    }

    // Count total matching
    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM aura_users ${whereSql}`, params);
    const total = countRows?.[0]?.total || 0;

    // Fetch user records
    const sql = `
      SELECT id, username, email, first_name, last_name, phone, gender,
             role, level, status, active, theme, language, avatar,
             biller_id, warehouse_id, permissions, created_at, updated_at, last_login_at
      FROM aura_users
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    const [users] = await db.query(sql, [...params, limit, offset]);

    // Parse JSON permissions safely
    const formatted = users.map(u => {
      let perms = {};
      if (u.permissions) {
        try {
          perms = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions;
        } catch (_) {}
      }
      return { ...u, permissions: perms };
    });

    return sendPaginated(res, formatted, total, page, limit);
  } catch (err) {
    console.error('[AdminUsers list error]', err);
    return sendError(res, 'Failed to fetch users', 500, err.message);
  }
};

/**
 * GET /api/admin/users/:id
 */
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT id, username, email, first_name, last_name, phone, gender,
             role, level, status, active, theme, language, avatar,
             biller_id, warehouse_id, permissions, created_at, updated_at, last_login_at
      FROM aura_users
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `, [id]);

    if (!rows || rows.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    const user = rows[0];
    if (user.permissions) {
      try {
        user.permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
      } catch (_) {}
    }

    return sendSuccess(res, user);
  } catch (err) {
    return sendError(res, 'Failed to retrieve user', 500, err.message);
  }
};

/**
 * POST /api/admin/users
 * Create a new user with hashed password & role assignment
 */
exports.createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      first_name,
      last_name,
      phone,
      role = 'staff',
      level,
      permissions,
      status = 'active',
      biller_id = null,
      warehouse_id = null
    } = req.body;

    if (!username || !password || !email) {
      return sendError(res, 'Username, password, and email are required', 400);
    }

    // Check unique username and email
    const [dup] = await db.query(
      'SELECT id FROM aura_users WHERE (username = ? OR email = ?) AND deleted_at IS NULL LIMIT 1',
      [username.trim(), email.trim()]
    );
    if (dup && dup.length > 0) {
      return sendError(res, 'A user with that username or email already exists', 409);
    }

    // Calculate level based on role if not provided
    const userRole = role.toLowerCase();
    const userLevel = level || (
      userRole === 'owner' ? 1 :
      userRole === 'admin' ? 2 :
      userRole === 'manager' ? 2 :
      userRole === 'supplier' ? 4 :
      userRole === 'buyer' ? 5 : 3
    );

    const hash = await bcrypt.hash(password, 10);
    const permsJson = permissions ? JSON.stringify(permissions) : JSON.stringify(DEFAULT_PERMISSIONS);

    const sql = `
      INSERT INTO aura_users (
        username, password, email, first_name, last_name, phone,
        role, level, permissions, status, active, biller_id, warehouse_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.query(sql, [
      username.trim(),
      hash,
      email.trim(),
      first_name || '',
      last_name || '',
      phone || null,
      userRole,
      userLevel,
      permsJson,
      status,
      status === 'active' ? 1 : 0,
      biller_id,
      warehouse_id
    ]);

    const newId = result.insertId;

    await logActivity({
      req,
      action: 'create',
      tableName: 'aura_users',
      recordId: newId,
      newValues: { username, email, role: userRole, level: userLevel, status }
    });

    return sendSuccess(res, { id: newId, username, email, role: userRole }, 'User created successfully', null, 201);
  } catch (err) {
    console.error('[AdminUsers create error]', err);
    return sendError(res, 'Failed to create user', 500, err.message);
  }
};

/**
 * PUT /api/admin/users/:id
 * Update user details, role, and permissions
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      role,
      level,
      permissions,
      status,
      password,
      biller_id,
      warehouse_id
    } = req.body;

    const [existing] = await db.query(
      'SELECT * FROM aura_users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [id]
    );
    if (!existing || existing.length === 0) {
      return sendError(res, 'User not found', 404);
    }
    const oldUser = existing[0];

    const updates = [];
    const params = [];

    if (first_name !== undefined) { updates.push('first_name = ?'); params.push(first_name); }
    if (last_name !== undefined) { updates.push('last_name = ?'); params.push(last_name); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email.trim()); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (role !== undefined) { updates.push('role = ?'); params.push(role.toLowerCase()); }
    if (level !== undefined) { updates.push('level = ?'); params.push(level); }
    if (status !== undefined) {
      updates.push('status = ?', 'active = ?');
      params.push(status, status === 'active' ? 1 : 0);
    }
    if (permissions !== undefined) {
      updates.push('permissions = ?');
      params.push(typeof permissions === 'string' ? permissions : JSON.stringify(permissions));
    }
    if (password && password.trim().length > 0) {
      const hash = await bcrypt.hash(password.trim(), 10);
      updates.push('password = ?');
      params.push(hash);
    }
    if (biller_id !== undefined) { updates.push('biller_id = ?'); params.push(biller_id); }
    if (warehouse_id !== undefined) { updates.push('warehouse_id = ?'); params.push(warehouse_id); }

    if (updates.length === 0) {
      return sendSuccess(res, null, 'No modifications requested');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const updateSql = `UPDATE aura_users SET ${updates.join(', ')} WHERE id = ?`;
    await db.query(updateSql, params);

    await logActivity({
      req,
      action: 'update',
      tableName: 'aura_users',
      recordId: id,
      oldValues: { role: oldUser.role, status: oldUser.status, email: oldUser.email },
      newValues: { role, status, email }
    });

    return sendSuccess(res, { id: parseInt(id) }, 'User updated successfully');
  } catch (err) {
    console.error('[AdminUsers update error]', err);
    return sendError(res, 'Failed to update user', 500, err.message);
  }
};

/**
 * PUT /api/admin/users/:id/status
 * Quick toggle status ('active' / 'inactive' / 'suspended')
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const newStatus = status === 'active' || status === 1 ? 'active' : 'inactive';
    const activeBit = newStatus === 'active' ? 1 : 0;

    await db.query(
      'UPDATE aura_users SET status = ?, active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, activeBit, id]
    );

    await logActivity({
      req,
      action: 'status_change',
      tableName: 'aura_users',
      recordId: id,
      newValues: { status: newStatus }
    });

    return sendSuccess(res, { id: parseInt(id), status: newStatus }, `User status updated to ${newStatus}`);
  } catch (err) {
    return sendError(res, 'Failed to toggle user status', 500, err.message);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Soft delete user
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting primary root owner
    if (parseInt(id) === 1 || parseInt(id) === 999) {
      return sendError(res, 'Root system owner account cannot be deleted', 400);
    }

    await db.query('UPDATE aura_users SET deleted_at = NOW(), status = "inactive", active = 0 WHERE id = ?', [id]);

    await logActivity({
      req,
      action: 'delete',
      tableName: 'aura_users',
      recordId: id
    });

    return sendSuccess(res, { id: parseInt(id) }, 'User successfully deleted');
  } catch (err) {
    return sendError(res, 'Failed to delete user', 500, err.message);
  }
};

/**
 * GET /api/admin/users/roles
 * List system roles and permission template
 */
exports.getRoles = async (req, res) => {
  const roles = [
    { key: 'owner', label: 'Enterprise Owner', level: 1, badge: 'purple', description: 'Full root access to all modules, financial ledgers, and settings.' },
    { key: 'admin', label: 'Administrator', level: 2, badge: 'blue', description: 'Full operational administration across catalog, sales, users, and reports.' },
    { key: 'manager', label: 'Store Manager', level: 2, badge: 'cyan', description: 'Store operations, inventory counts, and order fulfillment.' },
    { key: 'salesman', label: 'Commercial Sourcing Agent', level: 3, badge: 'green', description: 'Quotations, buyer orders, and wholesale catalog browsing.' },
    { key: 'staff', label: 'Operations Staff', level: 3, badge: 'default', description: 'Standard day-to-day transaction processing.' },
    { key: 'cashier', label: 'POS Cashier', level: 3, badge: 'gold', description: 'POS register checkout and dining table billing.' },
    { key: 'stock', label: 'Warehouse Controller', level: 3, badge: 'geekblue', description: 'Stock receiving, transfers, and warehouse inventory.' },
    { key: 'account', label: 'Senior Accountant', level: 3, badge: 'magenta', description: 'Ledger entries, payments reconciliation, and tax declarations.' },
    { key: 'audit', label: 'Tax & Compliance Auditor', level: 3, badge: 'orange', description: 'Read-only access to audit logs and tax ledgers.' },
    { key: 'supplier', label: 'Verified Supplier', level: 4, badge: 'volcano', description: 'Supplier portal access, PO confirmations, and catalog listings.' },
    { key: 'buyer', label: 'Commercial Buyer', level: 5, badge: 'lime', description: 'B2B ordering portal, wholesale pricing, and invoice payments.' }
  ];

  return sendSuccess(res, {
    roles,
    permissionTemplate: DEFAULT_PERMISSIONS
  });
};

/**
 * GET /api/admin/users/:id/activity
 * Get activity history for a specific user
 */
exports.getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const [logs] = await db.query(`
      SELECT id, action, table_name, record_id, old_values, new_values, ip_address, created_at
      FROM aura_activity_logs
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 50
    `, [id]);

    return sendSuccess(res, logs);
  } catch (err) {
    return sendError(res, 'Failed to fetch user activity', 500, err.message);
  }
};
