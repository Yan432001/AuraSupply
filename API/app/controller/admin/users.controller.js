/**
 * AURA USERS CONTROLLER
 * =====================
 * Centralized User Management & Role Administration
 * Sole Source of Truth: aura_users & aura_groups
 * (aura_companies is NEVER consulted for authorization or roles)
 */

const { db } = require('../../config/utill/helper');
const bcrypt = require('bcryptjs');

/**
 * GET /api/admin/users
 * List users with pagination, search, and role/group filters
 */
exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const groupId = req.query.group_id ? parseInt(req.query.group_id) : null;
    const active = req.query.active !== undefined && req.query.active !== '' ? parseInt(req.query.active) : null;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.phone LIKE ?)';
      params.push(search, search, search, search, search);
    }

    if (groupId) {
      whereClause += ' AND u.group_id = ?';
      params.push(groupId);
    }

    if (active !== null) {
      whereClause += ' AND u.active = ?';
      params.push(active);
    }

    // Count total records
    const countSql = `SELECT COUNT(*) AS total FROM aura_users u ${whereClause}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows?.[0]?.total || 0;

    // Fetch user records
    const sql = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.gender,
             u.group_id, u.active, u.biller_id, u.warehouse_id, u.created_on, u.last_login,
             g.name AS role, g.description AS role_description
      FROM aura_users u
      LEFT JOIN aura_groups g ON u.group_id = g.id
      ${whereClause}
      ORDER BY u.id DESC
      LIMIT ? OFFSET ?
    `;
    const [users] = await db.query(sql, [...params, limit, offset]);

    res.json({
      success: true,
      data: users || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('[Users Controller] Error listing users:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve users', error: err.message });
  }
};

/**
 * GET /api/admin/users/:id
 * Retrieve a single user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.gender,
             u.group_id, u.active, u.biller_id, u.warehouse_id, u.created_on, u.last_login,
             g.name AS role, g.description AS role_description
      FROM aura_users u
      LEFT JOIN aura_groups g ON u.group_id = g.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Users Controller] Error fetching user:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve user', error: err.message });
  }
};

/**
 * POST /api/admin/users
 * Create a new user with hashed password
 */
exports.createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      gender,
      group_id = 3,
      biller_id = 1,
      warehouse_id = '1',
      active = 1
    } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and email are required fields.'
      });
    }

    // Check for existing username or email
    const [existing] = await db.query(
      'SELECT id FROM aura_users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists in the system.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdOn = Math.floor(Date.now() / 1000);

    const insertSql = `
      INSERT INTO aura_users (
        username, email, password, first_name, last_name, phone, gender,
        group_id, biller_id, warehouse_id, active, created_on, emp_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    const [result] = await db.query(insertSql, [
      username.trim(),
      email.trim(),
      hashedPassword,
      first_name || '',
      last_name || '',
      phone || '',
      gender || 'male',
      parseInt(group_id),
      parseInt(biller_id) || 1,
      String(warehouse_id || '1'),
      active ? 1 : 0,
      createdOn
    ]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      id: result.insertId
    });
  } catch (err) {
    console.error('[Users Controller] Error creating user:', err);
    res.status(500).json({ success: false, message: 'Failed to create user', error: err.message });
  }
};

/**
 * PUT /api/admin/users/:id
 * Update user details
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      first_name,
      last_name,
      phone,
      gender,
      group_id,
      biller_id,
      warehouse_id,
      password
    } = req.body;

    // Check user exists
    const [existing] = await db.query('SELECT id, group_id FROM aura_users WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent non-owners from modifying owner privileges
    if (existing[0].group_id === 1 && req.user.group_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Only the Enterprise Owner can modify owner accounts.'
      });
    }

    const updates = [];
    const params = [];

    if (email) {
      updates.push('email = ?');
      params.push(email.trim());
    }
    if (first_name !== undefined) {
      updates.push('first_name = ?');
      params.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push('last_name = ?');
      params.push(last_name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (gender !== undefined) {
      updates.push('gender = ?');
      params.push(gender);
    }
    if (group_id !== undefined) {
      // Prevent non-owners from promoting to owner
      if (parseInt(group_id) === 1 && req.user.group_id !== 1) {
        return res.status(403).json({ success: false, message: 'Cannot grant owner role.' });
      }
      updates.push('group_id = ?');
      params.push(parseInt(group_id));
    }
    if (biller_id !== undefined) {
      updates.push('biller_id = ?');
      params.push(parseInt(biller_id));
    }
    if (warehouse_id !== undefined) {
      updates.push('warehouse_id = ?');
      params.push(String(warehouse_id));
    }
    if (password && password.trim().length >= 4) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: 'No changes provided' });
    }

    const sql = `UPDATE aura_users SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);
    await db.query(sql, params);

    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    console.error('[Users Controller] Error updating user:', err);
    res.status(500).json({ success: false, message: 'Failed to update user', error: err.message });
  }
};

/**
 * PUT /api/admin/users/:id/status
 * Toggle active / deactivated status
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    // Check user exists
    const [existing] = await db.query('SELECT id, group_id, active FROM aura_users WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cannot deactivate oneself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
    }

    const newStatus = active !== undefined ? (active ? 1 : 0) : (existing[0].active ? 0 : 1);
    await db.query('UPDATE aura_users SET active = ? WHERE id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: `User account ${newStatus ? 'activated' : 'deactivated'} successfully.`,
      active: newStatus
    });
  } catch (err) {
    console.error('[Users Controller] Error toggling user status:', err);
    res.status(500).json({ success: false, message: 'Failed to change status', error: err.message });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete user account
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    const [existing] = await db.query('SELECT id, group_id FROM aura_users WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (existing[0].group_id === 1 && req.user.group_id !== 1) {
      return res.status(403).json({ success: false, message: 'Cannot delete an owner account.' });
    }

    await db.query('DELETE FROM aura_users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('[Users Controller] Error deleting user:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user', error: err.message });
  }
};

/**
 * GET /api/admin/roles
 * List available roles from aura_groups
 */
exports.getRoles = async (req, res) => {
  try {
    const sql = 'SELECT id, name, description FROM aura_groups ORDER BY id ASC';
    const [roles] = await db.query(sql);
    res.json({ success: true, data: roles || [] });
  } catch (err) {
    console.error('[Users Controller] Error fetching roles:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch roles', error: err.message });
  }
};
