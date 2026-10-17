/**
 * HIGH-VOLUME ERP ITEMS & RBAC ROUTES
 * ===================================
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const itemsController = require('../controllers/items.controller');
const { checkPermission } = require('../middleware/rbac.middleware');
const { query } = require('../config/dbPool');

const JWT_SECRET = process.env.JWT_SECRET || 'AURA_ERP_SECRET_TOKEN_2026';

/**
 * Lightweight Auth Hydrator Middleware
 * Populates req.user from JWT bearer token, session, or internal auth.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.id || decoded?.user_id || decoded?.data?.profile?.id || decoded?.data?.id;
      } catch {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Invalid or expired token.'
        });
      }
    } else if (req.session && req.session.user_id) {
      userId = req.session.user_id;
    } else if (process.env.NODE_ENV !== 'production' && req.headers['x-user-id']) {
      userId = req.headers['x-user-id'];
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required. No bearer token provided.'
      });
    }

    // Hydrate user core identity from `users`
    const [rows] = await query(
      'SELECT id, uuid, username, email, first_name, last_name, status, is_system_admin FROM users WHERE id = :id AND deleted_at IS NULL LIMIT 1',
      { id: userId }
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User account not found.'
      });
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'User account is inactive or suspended.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Items Route Auth Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication processing error.'
    });
  }
}

// ==========================================
// ITEM ENDPOINTS PROTECTED BY RBAC
// ==========================================

// GET /api/items — Paginated Item Catalog (Sub-50ms)
router.get(
  '/api/items',
  authenticate,
  checkPermission('INVENTORY', 'view'),
  itemsController.getItems
);

// PUT /api/items/:id — Transactional Row-Locked Update
router.put(
  '/api/items/:id',
  authenticate,
  checkPermission('INVENTORY', 'update'),
  itemsController.updateItem
);

// ==========================================
// RBAC & USER GROUP CONFIGURATION ENDPOINTS
// ==========================================

const { getUserEffectivePermissions, invalidateUserPermissionCache, clearAllPermissionCaches } = require('../middleware/rbac.middleware');

// GET /api/auth/me/permissions — Fetch current user's effective permissions
router.get('/api/auth/me/permissions', authenticate, async (req, res) => {
  try {
    const isSuperAdmin = req.user.is_system_admin === 1 || Number(req.user.level) === 1 || Number(req.user.group_id) === 1;
    const permissions = await getUserEffectivePermissions(req.user.id);
    return res.json({
      success: true,
      data: {
        userId: req.user.id,
        username: req.user.username,
        isSuperAdmin,
        permissions
      }
    });
  } catch (err) {
    console.error('[me/permissions error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/erp-modules — List all active ERP modules
router.get('/api/erp-modules', authenticate, async (req, res) => {
  try {
    const [modules] = await query('SELECT * FROM erp_modules WHERE is_active = 1 ORDER BY display_order ASC');
    return res.json({ success: true, data: modules });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/user-groups — List all roles with member counts
router.get('/api/user-groups', authenticate, async (req, res) => {
  try {
    const [groups] = await query(`
      SELECT g.*, COUNT(ugm.user_id) AS member_count
      FROM user_groups g
      LEFT JOIN user_group_mappings ugm ON ugm.group_id = g.id
      GROUP BY g.id
      ORDER BY g.level ASC
    `);
    return res.json({ success: true, data: groups });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/user-groups/:id/permissions — Get permission matrix for a role
router.get('/api/user-groups/:id/permissions', authenticate, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const [matrix] = await query(`
      SELECT 
        m.id AS module_id, m.code AS module_code, m.name AS module_name, m.category,
        COALESCE(p.can_view, 0) AS can_view,
        COALESCE(p.can_create, 0) AS can_create,
        COALESCE(p.can_update, 0) AS can_update,
        COALESCE(p.can_delete, 0) AS can_delete,
        COALESCE(p.can_export, 0) AS can_export,
        COALESCE(p.can_approve, 0) AS can_approve
      FROM erp_modules m
      LEFT JOIN permissions p ON p.module_id = m.id AND p.group_id = ?
      WHERE m.is_active = 1
      ORDER BY m.display_order ASC
    `, [groupId]);

    return res.json({ success: true, data: matrix });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/user-groups/:id/permissions — Update permissions matrix for a role
router.put('/api/user-groups/:id/permissions', authenticate, checkPermission('SETTINGS', 'update'), async (req, res) => {
  const { withTransaction } = require('../config/dbPool');
  try {
    const groupId = parseInt(req.params.id, 10);
    const { permissions } = req.body; // array of { module_id, can_view, can_create, can_update, can_delete, can_export, can_approve }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, error: 'Expected permissions array.' });
    }

    await withTransaction(async (conn) => {
      for (const p of permissions) {
        await conn.query(`
          INSERT INTO permissions (group_id, module_id, can_view, can_create, can_update, can_delete, can_export, can_approve, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            can_view = VALUES(can_view),
            can_create = VALUES(can_create),
            can_update = VALUES(can_update),
            can_delete = VALUES(can_delete),
            can_export = VALUES(can_export),
            can_approve = VALUES(can_approve),
            updated_by = VALUES(updated_by),
            updated_at = NOW()
        `, [
          groupId,
          p.module_id,
          p.can_view ? 1 : 0,
          p.can_create ? 1 : 0,
          p.can_update ? 1 : 0,
          p.can_delete ? 1 : 0,
          p.can_export ? 1 : 0,
          p.can_approve ? 1 : 0,
          req.user.id
        ]);
      }
    });

    // Invalidate entire cache so changes are immediate
    clearAllPermissionCaches();

    return res.json({ success: true, message: 'Permissions updated successfully.' });
  } catch (err) {
    console.error('[Update Permissions Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/user-groups/:id/users — Get users assigned to role
router.get('/api/user-groups/:id/users', authenticate, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const [users] = await query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.status, ugm.is_primary, ugm.assigned_at
      FROM users u
      JOIN user_group_mappings ugm ON ugm.user_id = u.id
      WHERE ugm.group_id = ? AND u.deleted_at IS NULL
      ORDER BY ugm.is_primary DESC, u.username ASC
    `, [groupId]);
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/user-groups/:id/users — Assign user to role
router.post('/api/user-groups/:id/users', authenticate, checkPermission('SETTINGS', 'update'), async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const { user_id, is_primary = 1 } = req.body;

    await query(`
      INSERT INTO user_group_mappings (user_id, group_id, is_primary, assigned_by, assigned_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE is_primary = VALUES(is_primary)
    `, [user_id, groupId, is_primary ? 1 : 0, req.user.id]);

    invalidateUserPermissionCache(user_id);
    return res.json({ success: true, message: 'User assigned to group successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/user-groups/:id/users/:userId — Remove user from role
router.delete('/api/user-groups/:id/users/:userId', authenticate, checkPermission('SETTINGS', 'delete'), async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const userId = parseInt(req.params.userId, 10);

    await query('DELETE FROM user_group_mappings WHERE user_id = ? AND group_id = ?', [userId, groupId]);
    invalidateUserPermissionCache(userId);
    return res.json({ success: true, message: 'User removed from group.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/search — Search users to assign to group
router.get('/api/users/search', authenticate, async (req, res) => {
  try {
    const term = req.query.q ? `%${req.query.q}%` : '%';
    const [users] = await query(`
      SELECT id, username, email, first_name, last_name, status
      FROM users
      WHERE deleted_at IS NULL AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
      ORDER BY username ASC
      LIMIT 20
    `, [term, term, term, term]);
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
