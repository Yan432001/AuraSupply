const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');
const { logAuditTrail } = require('../../services/accessControl.service');

// ==============================================================================
// 1. GROUPS & ROLE MANAGEMENT
// ==============================================================================

/**
 * GET /api/admin/access/groups
 * List all user roles with login/register switches and level
 */
exports.getGroups = async (req, res) => {
  try {
    const [groups] = await db.query(`
      SELECT g.id, g.name, g.description, g.level,
             g.allow_admin_login, g.allow_web_login, g.allow_web_register,
             g.requires_approval, g.is_system, g.created_at, g.updated_at,
             COUNT(u.id) AS user_count
      FROM aura_groups g
      LEFT JOIN aura_users u ON u.group_id = g.id AND u.deleted_at IS NULL
      GROUP BY g.id
      ORDER BY g.level ASC, g.id ASC
    `);

    return sendSuccess(res, groups);
  } catch (err) {
    return sendError(res, 'Failed to fetch user groups', 500, err.message);
  }
};

/**
 * PUT /api/admin/access/groups/:id
 * Update group settings (login switches, approval rules, level)
 */
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      level,
      allow_admin_login,
      allow_web_login,
      allow_web_register,
      requires_approval
    } = req.body;

    const [existing] = await db.query('SELECT * FROM aura_groups WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      return sendError(res, 'Group not found', 404);
    }

    const updates = [];
    const params = [];

    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (level !== undefined) { updates.push('level = ?'); params.push(level); }
    if (allow_admin_login !== undefined) { updates.push('allow_admin_login = ?'); params.push(allow_admin_login ? 1 : 0); }
    if (allow_web_login !== undefined) { updates.push('allow_web_login = ?'); params.push(allow_web_login ? 1 : 0); }
    if (allow_web_register !== undefined) { updates.push('allow_web_register = ?'); params.push(allow_web_register ? 1 : 0); }
    if (requires_approval !== undefined) { updates.push('requires_approval = ?'); params.push(requires_approval ? 1 : 0); }

    if (updates.length > 0) {
      params.push(id);
      await db.query(`UPDATE aura_groups SET ${updates.join(', ')} WHERE id = ?`, params);

      await logAuditTrail({
        userId: req.user.id,
        tableName: 'aura_groups',
        action: 'update_group_policy',
        recordId: id,
        newValues: req.body,
        ipAddress: req.ip
      });
    }

    return sendSuccess(res, null, 'Group updated successfully');
  } catch (err) {
    return sendError(res, 'Failed to update group', 500, err.message);
  }
};

// ==============================================================================
// 2. PERMISSION KEYS CATALOG & GROUP PERMISSION MATRIX
// ==============================================================================

/**
 * GET /api/admin/access/permission-keys
 * Returns catalogue of all permission keys grouped by module & area
 */
exports.getPermissionKeys = async (req, res) => {
  try {
    const [keys] = await db.query(`
      SELECT permission_key, module, action, area, label
      FROM aura_permission_keys
      WHERE is_active = 1
      ORDER BY area ASC, module ASC, permission_key ASC
    `);

    // Group keys by module for UI display
    const moduleMap = {};
    for (const k of keys) {
      const mod = k.module || 'general';
      if (!moduleMap[mod]) {
        moduleMap[mod] = {
          module: mod,
          area: k.area,
          keys: []
        };
      }
      moduleMap[mod].keys.push(k);
    }

    return sendSuccess(res, {
      total: keys.length,
      keys,
      grouped: Object.values(moduleMap)
    });
  } catch (err) {
    return sendError(res, 'Failed to fetch permission keys catalogue', 500, err.message);
  }
};

/**
 * GET /api/admin/access/groups/:id/permissions
 * Get allowed permission keys for a specific group
 */
exports.getGroupPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT permission_key FROM aura_group_permissions WHERE group_id = ? AND allowed = 1',
      [id]
    );

    const allowedKeys = rows.map(r => r.permission_key);
    return sendSuccess(res, allowedKeys);
  } catch (err) {
    return sendError(res, 'Failed to fetch group permissions', 500, err.message);
  }
};

/**
 * PUT /api/admin/access/groups/:id/permissions
 * Bulk update permission matrix for a group
 */
exports.updateGroupPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { allowedKeys = [] } = req.body;

    if (!Array.isArray(allowedKeys)) {
      return sendError(res, 'allowedKeys must be an array of permission keys', 400);
    }

    // Safety: owner cannot have permissions modified
    if (parseInt(id) === 1) {
      return sendError(res, 'Root Owner group permissions are hardwired and bypass all checks.', 400);
    }

    // 1. Reset all allowed = 0 for this group
    await db.query('UPDATE aura_group_permissions SET allowed = 0 WHERE group_id = ?', [id]);

    // 2. Set allowed = 1 for selected keys
    if (allowedKeys.length > 0) {
      await db.query(
        'UPDATE aura_group_permissions SET allowed = 1 WHERE group_id = ? AND permission_key IN (?)',
        [id, allowedKeys]
      );
    }

    await logAuditTrail({
      userId: req.user.id,
      tableName: 'aura_group_permissions',
      action: 'update_group_matrix',
      recordId: id,
      newValues: { totalAllowed: allowedKeys.length },
      ipAddress: req.ip
    });

    return sendSuccess(res, { allowedCount: allowedKeys.length }, 'Group permissions matrix saved successfully');
  } catch (err) {
    return sendError(res, 'Failed to save group permissions', 500, err.message);
  }
};

// ==============================================================================
// 3. PER-USER PERMISSION OVERRIDES (aura_user_permissions)
// ==============================================================================

/**
 * GET /api/admin/access/users/:id/overrides
 */
exports.getUserOverrides = async (req, res) => {
  try {
    const { id } = req.params;
    const [overrides] = await db.query(`
      SELECT up.permission_key, up.effect, up.created_at, pk.module, pk.label
      FROM aura_user_permissions up
      JOIN aura_permission_keys pk ON pk.permission_key = up.permission_key
      WHERE up.user_id = ?
    `, [id]);

    return sendSuccess(res, overrides);
  } catch (err) {
    return sendError(res, 'Failed to fetch user overrides', 500, err.message);
  }
};

/**
 * PUT /api/admin/access/users/:id/overrides
 * Save per-user allow/deny overrides (deny always wins)
 */
exports.updateUserOverrides = async (req, res) => {
  try {
    const { id } = req.params;
    const { overrides = [] } = req.body; // Array of { permission_key, effect: 'allow'|'deny' }

    await db.query('DELETE FROM aura_user_permissions WHERE user_id = ?', [id]);

    for (const ov of overrides) {
      if (ov.permission_key && (ov.effect === 'allow' || ov.effect === 'deny')) {
        await db.query(`
          INSERT INTO aura_user_permissions (user_id, permission_key, effect, created_by, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [id, ov.permission_key, ov.effect, req.user.id]);
      }
    }

    await logAuditTrail({
      userId: req.user.id,
      tableName: 'aura_user_permissions',
      action: 'update_user_overrides',
      recordId: id,
      newValues: overrides,
      ipAddress: req.ip
    });

    return sendSuccess(res, null, 'User permission overrides updated');
  } catch (err) {
    return sendError(res, 'Failed to save user overrides', 500, err.message);
  }
};

// ==============================================================================
// 4. USER BRANCH ASSIGNMENT (aura_user_billers)
// ==============================================================================

/**
 * GET /api/admin/access/users/:id/branches
 */
exports.getUserBranches = async (req, res) => {
  try {
    const { id } = req.params;
    const [branches] = await db.query(`
      SELECT c.id, c.name, c.code, c.company_type, c.status, ub.is_default
      FROM aura_user_billers ub
      JOIN aura_companies c ON c.id = ub.biller_id
      WHERE ub.user_id = ? AND c.deleted_at IS NULL
      ORDER BY ub.is_default DESC, c.id ASC
    `, [id]);

    return sendSuccess(res, branches);
  } catch (err) {
    return sendError(res, 'Failed to fetch user branches', 500, err.message);
  }
};

/**
 * PUT /api/admin/access/users/:id/branches
 * Assign user to one or more branches / stores / shops
 */
exports.updateUserBranches = async (req, res) => {
  try {
    const { id } = req.params;
    const { branchIds = [], defaultBranchId = null } = req.body;

    await db.query('DELETE FROM aura_user_billers WHERE user_id = ?', [id]);

    for (const bId of branchIds) {
      const isDefault = Number(bId) === Number(defaultBranchId) ? 1 : 0;
      await db.query(`
        INSERT INTO aura_user_billers (user_id, biller_id, is_default, created_at)
        VALUES (?, ?, ?, NOW())
      `, [id, bId, isDefault]);
    }

    await logAuditTrail({
      userId: req.user.id,
      tableName: 'aura_user_billers',
      action: 'assign_branches',
      recordId: id,
      newValues: { branchIds, defaultBranchId },
      ipAddress: req.ip
    });

    return sendSuccess(res, null, 'User branch assignments saved');
  } catch (err) {
    return sendError(res, 'Failed to assign branches to user', 500, err.message);
  }
};

// ==============================================================================
// 5. BRANCHES / STORES / SHOPS (aura_companies by company_type)
// ==============================================================================

/**
 * GET /api/admin/access/branches
 * List all branch / store / shop records
 */
exports.getBranches = async (req, res) => {
  try {
    const [branches] = await db.query(`
      SELECT c.id, c.code, c.name, c.company, c.company_type, c.phone, c.email, c.address,
             c.warehouse_id, w.name AS warehouse_name, w.code AS warehouse_code,
             c.status, c.manager_user_id, c.updated_at,
             u.username AS manager_username,
             u.first_name AS manager_name
      FROM aura_companies c
      LEFT JOIN aura_users u ON u.id = c.manager_user_id
      LEFT JOIN aura_warehouses w ON w.id = c.warehouse_id
      WHERE (c.company_type IN ('branch','store','shop','warehouse','biller') OR c.group_name = 'biller')
        AND c.deleted_at IS NULL
      ORDER BY c.id ASC
    `);

    return sendSuccess(res, branches);
  } catch (err) {
    return sendError(res, 'Failed to fetch branches', 500, err.message);
  }
};

/**
 * POST /api/admin/access/branches
 * Create a new branch / store / shop record
 */
exports.createBranch = async (req, res) => {
  try {
    const {
      name,
      code,
      company,
      company_type = 'branch',
      phone,
      email,
      address,
      warehouse_id,
      manager_user_id
    } = req.body;

    if (!name || !code) {
      return sendError(res, 'Name and Code are required', 400);
    }

    const [result] = await db.query(`
      INSERT INTO aura_companies (
        group_name, company_type, name, company, code, phone, email, address,
        warehouse_id, manager_user_id, status, is_active, updated_at
      ) VALUES ('biller', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, NOW())
    `, [company_type, name.trim(), company || name.trim(), code.trim(), phone, email, address, warehouse_id || null, manager_user_id || null]);

    const newId = result.insertId;

    await logAuditTrail({
      userId: req.user.id,
      tableName: 'aura_companies',
      action: 'create_branch',
      recordId: newId,
      newValues: { name, code, company_type, warehouse_id },
      ipAddress: req.ip
    });

    return sendSuccess(res, { id: newId }, 'Branch/Store created successfully', null, 201);
  } catch (err) {
    return sendError(res, 'Failed to create branch', 500, err.message);
  }
};

/**
 * PUT /api/admin/access/branches/:id
 * Update branch details
 */
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, company, company_type, phone, email, address, warehouse_id, manager_user_id, status } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()); }
    if (code !== undefined) { updates.push('code = ?'); params.push(code.trim()); }
    if (company !== undefined) { updates.push('company = ?'); params.push(company); }
    if (company_type !== undefined) { updates.push('company_type = ?'); params.push(company_type); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (warehouse_id !== undefined) { updates.push('warehouse_id = ?'); params.push(warehouse_id || null); }
    if (manager_user_id !== undefined) { updates.push('manager_user_id = ?'); params.push(manager_user_id || null); }
    if (status !== undefined) {
      updates.push('status = ?', 'is_active = ?');
      params.push(status, status === 'active' ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(id);
      await db.query(`UPDATE aura_companies SET ${updates.join(', ')} WHERE id = ?`, params);

      await logAuditTrail({
        userId: req.user.id,
        tableName: 'aura_companies',
        action: 'update_branch',
        recordId: id,
        newValues: req.body,
        ipAddress: req.ip
      });
    }

    return sendSuccess(res, null, 'Branch/Store updated successfully');
  } catch (err) {
    return sendError(res, 'Failed to update branch', 500, err.message);
  }
};

// ==============================================================================
// 6. PENDING SUPPLIER APPROVALS
// ==============================================================================

/**
 * GET /api/admin/access/suppliers/pending
 * List all suppliers awaiting admin approval (status = 'pending')
 */
exports.getPendingSuppliers = async (req, res) => {
  try {
    const [suppliers] = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.company, u.phone,
             u.status, u.register_source, u.created_at,
             p.company_kh, p.contact_person, p.business_type, p.vat_no,
             p.address, p.city, p.attachment, p.telegram_chat_id
      FROM aura_users u
      JOIN aura_groups g ON g.id = u.group_id
      LEFT JOIN aura_user_profiles p ON p.user_id = u.id
      WHERE g.name = 'supplier' AND u.status = 'pending' AND u.deleted_at IS NULL
      ORDER BY u.id DESC
    `);

    return sendSuccess(res, suppliers);
  } catch (err) {
    return sendError(res, 'Failed to fetch pending suppliers', 500, err.message);
  }
};

/**
 * PUT /api/admin/access/suppliers/:id/approve
 * Approve supplier account -> status = 'active', set approved_by and approved_at
 */
exports.approveSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`
      UPDATE aura_users
      SET status = 'active',
          active = 1,
          approved_by = ?,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `, [req.user.id, id]);

    await logAuditTrail({
      userId: req.user.id,
      tableName: 'aura_users',
      action: 'approve_supplier',
      recordId: id,
      newValues: { status: 'active', approved_by: req.user.id },
      ipAddress: req.ip
    });

    return sendSuccess(res, { id: parseInt(id) }, 'Supplier account approved and activated.');
  } catch (err) {
    return sendError(res, 'Failed to approve supplier', 500, err.message);
  }
};

/**
 * PUT /api/admin/access/suppliers/:id/reject
 * Reject supplier account
 */
exports.rejectSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`
      UPDATE aura_users
      SET status = 'suspended',
          active = 0,
          updated_at = NOW()
      WHERE id = ?
    `, [id]);

    await logAuditTrail({
      userId: req.user.id,
      tableName: 'aura_users',
      action: 'reject_supplier',
      recordId: id,
      newValues: { status: 'suspended' },
      ipAddress: req.ip
    });

    return sendSuccess(res, { id: parseInt(id) }, 'Supplier account rejected.');
  } catch (err) {
    return sendError(res, 'Failed to reject supplier', 500, err.message);
  }
};

// ==============================================================================
// 7. LOGIN HISTORY & AUDIT TRAILS
// ==============================================================================

/**
 * GET /api/admin/access/logs/logins
 * List login events from aura_user_logins with area filter
 */
exports.getLoginHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const area = req.query.area && req.query.area !== 'all' ? req.query.area : null;

    let whereSql = 'WHERE 1=1';
    const params = [];

    if (area) {
      whereSql += ' AND l.area = ?';
      params.push(area);
    }

    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM aura_user_logins l ${whereSql}`, params);
    const total = countRows?.[0]?.total || 0;

    const [logs] = await db.query(`
      SELECT l.id, l.user_id, l.area, l.success, l.ip_address, l.user_agent, l.time,
             u.username, u.email, g.name AS role_name
      FROM aura_user_logins l
      LEFT JOIN aura_users u ON u.id = l.user_id
      LEFT JOIN aura_groups g ON g.id = u.group_id
      ${whereSql}
      ORDER BY l.id DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return sendPaginated(res, logs, total, page, limit);
  } catch (err) {
    return sendError(res, 'Failed to fetch login history', 500, err.message);
  }
};

/**
 * GET /api/admin/access/logs/audit-trails
 * List immutable change events from aura_user_audit_trails
 */
exports.getAuditTrails = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const [countRows] = await db.query('SELECT COUNT(*) AS total FROM aura_user_audit_trails');
    const total = countRows?.[0]?.total || 0;

    const [logs] = await db.query(`
      SELECT a.id, a.user_id, a.table_name, a.event AS action, a.event, a.old_values, a.new_values,
             a.ip_address, a.created_at,
             u.username, u.first_name
      FROM aura_user_audit_trails a
      LEFT JOIN aura_users u ON u.id = a.user_id
      ORDER BY a.id DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return sendPaginated(res, logs, total, page, limit);
  } catch (err) {
    return sendError(res, 'Failed to fetch audit trails', 500, err.message);
  }
};
