const jwt = require('jsonwebtoken');
const { db, access_token_key } = require('../config/utill/helper');
const { sendError } = require('../config/utill/response');
const accessControlService = require('../services/accessControl.service');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';

/**
 * 1. Authenticate JWT Bearer Token strictly against aura_users & aura_groups
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.id || decoded?.data?.profile?.id || decoded?.data?.id;
      } catch (err) {
        return sendError(res, 'Session token expired or invalid. Please sign in again.', 401);
      }
    } else if (process.env.NODE_ENV !== 'production' || req.query.dev === '1') {
      // In local dev/demo environment, default to root owner (id: 1)
      userId = 1;
    } else {
      return sendError(res, 'Authentication required. No bearer token provided.', 401);
    }

    if (!userId) {
      return sendError(res, 'Malformed credentials.', 401);
    }

    // Query aura_users joined with aura_groups
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone,
             u.group_id, u.status, u.active, u.theme, u.avatar,
             g.name AS group_name, g.description AS group_description, g.level AS group_level,
             g.allow_admin_login, g.allow_web_login
      FROM aura_users u
      JOIN aura_groups g ON g.id = u.group_id
      WHERE u.id = ? AND u.deleted_at IS NULL
      LIMIT 1
    `, [userId]);

    if (!rows || rows.length === 0) {
      return sendError(res, 'User account not found or removed.', 401);
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return sendError(res, `Account is currently ${user.status}. Access denied.`, 403);
    }

    // Retrieve allowed branches & permissions
    const [permissions, branches] = await Promise.all([
      accessControlService.getUserAllowedPermissions(user.id, user.group_id, user.group_level),
      accessControlService.getUserAllowedBranches(user.id, user.group_level)
    ]);

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.group_name,
      level: user.group_level,
      group_id: user.group_id,
      theme: user.theme || 'light'
    };
    req.user_id = user.id;
    req.role = user.group_name;
    req.level = user.group_level;
    req.permissions = permissions;
    req.branches = branches;
    req.branchIds = branches.map(b => b.id);

    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    return sendError(res, 'Authorization verification failed', 500);
  }
};

/**
 * 2. Check if an ERP Module is enabled in aura_module_settings
 */
const checkModuleEnabled = (moduleKey) => {
  return async (req, res, next) => {
    try {
      const [rows] = await db.query(
        'SELECT is_enabled FROM aura_module_settings WHERE module_key = ? LIMIT 1',
        [moduleKey]
      );

      if (rows && rows.length > 0 && rows[0].is_enabled === 0) {
        return sendError(res, `Module '${moduleKey}' is currently disabled in ERP settings.`, 403);
      }

      next();
    } catch (err) {
      // In case of query failure, fail open for core admin
      next();
    }
  };
};

/**
 * 3. Enforce Role-based access ('owner' or level 1 always passes)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    // Super-admin bypass (level 1)
    if (req.user.role === 'owner' || req.user.level === 1) {
      return next();
    }

    const flatRoles = allowedRoles.flat().map(r => r.toLowerCase());
    if (flatRoles.includes(req.user.role.toLowerCase())) {
      return next();
    }

    return sendError(res, `Access denied. Requires one of roles: [${flatRoles.join(', ')}]`, 403);
  };
};

/**
 * 4. Granular Server-Side Permission Check using aura_user_can()
 * Uses normalized permission keys (e.g. 'sales-index', 'products-add', 'system_settings')
 * Owner (level 1) bypasses checks automatically.
 */
const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    // Owner bypass (level 1)
    if (req.user.level === 1 || req.user.role === 'owner') {
      return next();
    }

    // Fast check in cached array if already loaded
    if (req.permissions && req.permissions.includes(permissionKey)) {
      return next();
    }

    // SQL check fallback via aura_user_can()
    const can = await accessControlService.userCan(req.user.id, permissionKey);
    if (can) {
      return next();
    }

    return sendError(res, `Access denied: Missing required permission '${permissionKey}'`, 403);
  };
};

/**
 * 5. Branch Scope Filter
 * Attaches permitted branch IDs so controllers can scope SQL data:
 * `WHERE biller_id IN (?)`
 */
const branchScopeFilter = (req, res, next) => {
  if (req.user && (req.user.level === 1 || req.user.role === 'owner' || req.user.role === 'admin')) {
    req.isUnrestrictedBranch = true;
  } else {
    req.isUnrestrictedBranch = false;
  }
  next();
};

module.exports = {
  authenticate,
  checkModuleEnabled,
  requireRole,
  requirePermission,
  branchScopeFilter
};
