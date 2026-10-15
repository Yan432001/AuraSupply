const bcrypt = require('bcryptjs');
const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');
const { logAuditTrail, getUserAllowedPermissions, getUserAllowedBranches } = require('../../services/accessControl.service');

/**
 * GET /api/admin/users
 * List users joined with aura_groups and their assigned branches
 */
exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const role = req.query.role && req.query.role !== 'all' ? req.query.role.trim() : null;
    const status = req.query.status && req.query.status !== 'all' ? req.query.status.trim() : null;
    const branchId = req.query.branch_id ? parseInt(req.query.branch_id) : null;

    let whereSql = 'WHERE u.deleted_at IS NULL';
    const params = [];

    if (search) {
      whereSql += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.phone LIKE ? OR u.company LIKE ?)';
      params.push(search, search, search, search, search, search);
    }

    if (role) {
      whereSql += ' AND (g.name = ? OR u.group_id = ?)';
      params.push(role, parseInt(role) || 0);
    }

    if (status) {
      whereSql += ' AND u.status = ?';
      params.push(status);
    }

    if (branchId) {
      whereSql += ' AND EXISTS (SELECT 1 FROM aura_user_billers ub WHERE ub.user_id = u.id AND ub.biller_id = ?)';
      params.push(branchId);
    }

    // Branch scoping: if user is not level 1/2, restrict to their assigned branches
    if (!req.isUnrestrictedBranch && req.branchIds && req.branchIds.length > 0) {
      whereSql += ' AND EXISTS (SELECT 1 FROM aura_user_billers ub WHERE ub.user_id = u.id AND ub.biller_id IN (?))';
      params.push(req.branchIds);
    }

    const [countRows] = await db.query(`
      SELECT COUNT(*) AS total
      FROM aura_users u
      JOIN aura_groups g ON g.id = u.group_id
      ${whereSql}
    `, params);
    const total = countRows?.[0]?.total || 0;

    const [users] = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.company,
             u.group_id, g.name AS role, g.description AS role_description, g.level,
             u.status, u.active, u.theme, u.avatar, u.register_source,
             u.failed_login_count, u.locked_until, u.created_at, u.updated_at, u.last_login_at
      FROM aura_users u
      JOIN aura_groups g ON g.id = u.group_id
      ${whereSql}
      ORDER BY u.id DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Attach branches for each user in list
    const userIds = users.map(u => u.id);
    let billerMap = {};
    if (userIds.length > 0) {
      const [billers] = await db.query(`
        SELECT ub.user_id, ub.biller_id, ub.is_default, c.name AS branch_name, c.company_type
        FROM aura_user_billers ub
        JOIN aura_companies c ON c.id = ub.biller_id
        WHERE ub.user_id IN (?)
      `, [userIds]);

      for (const b of billers) {
        if (!billerMap[b.user_id]) billerMap[b.user_id] = [];
        billerMap[b.user_id].push({
          id: b.biller_id,
          name: b.branch_name,
          company_type: b.company_type,
          is_default: b.is_default === 1
        });
      }
    }

    const formatted = users.map(u => ({
      ...u,
      branches: billerMap[u.id] || []
    }));

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
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.company,
             u.group_id, g.name AS role, g.description AS role_description, g.level,
             u.status, u.active, u.theme, u.avatar, u.register_source,
             u.created_at, u.updated_at, u.last_login_at
      FROM aura_users u
      JOIN aura_groups g ON g.id = u.group_id
      WHERE u.id = ? AND u.deleted_at IS NULL
      LIMIT 1
    `, [id]);

    if (!rows || rows.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    const user = rows[0];
    const [permissions, branches] = await Promise.all([
      getUserAllowedPermissions(user.id, user.group_id, user.level),
      getUserAllowedBranches(user.id, user.level)
    ]);

    return sendSuccess(res, {
      ...user,
      permissions,
      branches
    });
  } catch (err) {
    return sendError(res, 'Failed to retrieve user', 500, err.message);
  }
};

/**
 * POST /api/admin/users
 * Create user with role (group_id), bcrypt password, and branch assignments
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
      company,
      group_id,
      role,
      status = 'active',
      branch_ids = [],
      default_branch_id = null
    } = req.body;

    if (!username || !password || !email) {
      return sendError(res, 'Username, password, and email are required', 400);
    }

    // Determine target group_id
    let targetGroupId = parseInt(group_id);
    if (!targetGroupId && role) {
      const [grp] = await db.query('SELECT id FROM aura_groups WHERE LOWER(name) = ? LIMIT 1', [role.toLowerCase()]);
      if (grp && grp.length > 0) targetGroupId = grp[0].id;
    }
    if (!targetGroupId) targetGroupId = 8; // Default employee (level 40)

    // Check unique username and email
    const [dup] = await db.query(
      'SELECT id FROM aura_users WHERE (username = ? OR email = ?) AND deleted_at IS NULL LIMIT 1',
      [username.trim(), email.trim()]
    );
    if (dup && dup.length > 0) {
      return sendError(res, 'A user with that username or email already exists', 409);
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(`
      INSERT INTO aura_users (
        username, password, password_algo, email, first_name, last_name, phone, company,
        group_id, status, active, register_source, created_at
      ) VALUES (?, ?, 'bcrypt', ?, ?, ?, ?, ?, ?, ?, ?, 'admin', NOW())
    `, [
      username.trim(),
      hash,
      email.trim(),
      first_name || '',
      last_name || '',
      phone || null,
      company || null,
      targetGroupId,
      status,
      status === 'active' ? 1 : 0
    ]);

    const newId = result.insertId;

    // Assign branches in aura_user_billers
    if (Array.isArray(branch_ids) && branch_ids.length > 0) {
      for (const bId of branch_ids) {
        const isDefault = Number(bId) === Number(default_branch_id) ? 1 : 0;
        await db.query(`
          INSERT IGNORE INTO aura_user_billers (user_id, biller_id, is_default, created_at)
          VALUES (?, ?, ?, NOW())
        `, [newId, bId, isDefault]);
      }
    }

    await logAuditTrail({
      userId: req.user.id,
      tableName: 'aura_users',
      action: 'create_user',
      recordId: newId,
      newValues: { username, email, group_id: targetGroupId, status },
      ipAddress: req.ip
    });

    return sendSuccess(res, { id: newId, username, email }, 'User created successfully', null, 201);
  } catch (err) {
    console.error('[AdminUsers create error]', err);
    return sendError(res, 'Failed to create user', 500, err.message);
  }
};

/**
 * PUT /api/admin/users/:id
 * Update user details, role (group_id), status, and branches
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      company,
      group_id,
      role,
      status,
      password,
      branch_ids,
      default_branch_id
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
    if (company !== undefined) { updates.push('company = ?'); params.push(company); }
    if (group_id !== undefined) { updates.push('group_id = ?'); params.push(parseInt(group_id)); }
    else if (role !== undefined) {
      const [grp] = await db.query('SELECT id FROM aura_groups WHERE LOWER(name) = ? LIMIT 1', [role.toLowerCase()]);
      if (grp && grp.length > 0) { updates.push('group_id = ?'); params.push(grp[0].id); }
    }

    if (status !== undefined) {
      updates.push('status = ?', 'active = ?');
      params.push(status, status === 'active' ? 1 : 0);
    }

    if (password && password.trim().length > 0) {
      const hash = await bcrypt.hash(password.trim(), 10);
      updates.push('password = ?', "password_algo = 'bcrypt'");
      params.push(hash);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(id);
      await db.query(`UPDATE aura_users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Update branches if provided
    if (Array.isArray(branch_ids)) {
      await db.query('DELETE FROM aura_user_billers WHERE user_id = ?', [id]);
      for (const bId of branch_ids) {
        const isDefault = Number(bId) === Number(default_branch_id) ? 1 : 0;
        await db.query(`
          INSERT IGNORE INTO aura_user_billers (user_id, biller_id, is_default, created_at)
          VALUES (?, ?, ?, NOW())
        `, [id, bId, isDefault]);
      }
    }

    await logAuditTrail({
      userId: req.user.id,
      tableName: 'aura_users',
      action: 'update_user',
      recordId: id,
      oldValues: { group_id: oldUser.group_id, status: oldUser.status, email: oldUser.email },
      newValues: { group_id, status, email },
      ipAddress: req.ip
    });

    return sendSuccess(res, { id: parseInt(id) }, 'User updated successfully');
  } catch (err) {
    console.error('[AdminUsers update error]', err);
    return sendError(res, 'Failed to update user', 500, err.message);
  }
};

/**
 * PUT /api/admin/users/:id/status
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const newStatus = status === 'active' || status === 1 ? 'active' : 'suspended';
    const activeBit = newStatus === 'active' ? 1 : 0;

    await db.query(
      'UPDATE aura_users SET status = ?, active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, activeBit, id]
    );

    await logAuditTrail({
      userId: req.user.id,
      tableName: 'aura_users',
      action: 'toggle_user_status',
      recordId: id,
      newValues: { status: newStatus },
      ipAddress: req.ip
    });

    return sendSuccess(res, { id: parseInt(id), status: newStatus }, `User status set to ${newStatus}`);
  } catch (err) {
    return sendError(res, 'Failed to toggle user status', 500, err.message);
  }
};

/**
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === 1) {
      return sendError(res, 'Root owner account cannot be deleted', 400);
    }

    await db.query(
      'UPDATE aura_users SET deleted_at = NOW(), status = "suspended", active = 0 WHERE id = ?',
      [id]
    );

    await logAuditTrail({
      userId: req.user.id,
      tableName: 'aura_users',
      action: 'delete_user',
      recordId: id,
      ipAddress: req.ip
    });

    return sendSuccess(res, { id: parseInt(id) }, 'User successfully deleted');
  } catch (err) {
    return sendError(res, 'Failed to delete user', 500, err.message);
  }
};
