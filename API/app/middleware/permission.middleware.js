const jwt = require('jsonwebtoken');
const { db, access_token_key } = require('../config/utill/helper');
const { sendError } = require('../config/utill/response');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';

/**
 * 1. Authenticate JWT Bearer Token strictly against `aura_users`
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. No bearer token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return sendError(res, 'Session token expired or invalid. Please sign in again.', 401);
    }

    const userId = decoded?.id || decoded?.data?.profile?.id || decoded?.data?.id;
    if (!userId) {
      return sendError(res, 'Malformed token credentials.', 401);
    }

    // Query aura_users directly - Single Source of Truth
    const [rows] = await db.query(`
      SELECT id, username, email, first_name, last_name, phone, role, level,
             permissions, status, active, theme, language, avatar, biller_id, warehouse_id
      FROM aura_users
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `, [userId]);

    if (!rows || rows.length === 0) {
      return sendError(res, 'User account not found.', 401);
    }

    const user = rows[0];
    if (user.status !== 'active' && user.active !== 1) {
      return sendError(res, 'Account is inactive or suspended. Contact administrator.', 403);
    }

    // Parse JSON permissions
    let parsedPerms = {};
    if (user.permissions) {
      try {
        parsedPerms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
      } catch (_) {
        parsedPerms = {};
      }
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role || 'staff',
      level: user.level || 3,
      permissions: parsedPerms,
      theme: user.theme || 'light',
      language: user.language || 'english',
      biller_id: user.biller_id,
      warehouse_id: user.warehouse_id
    };
    req.user_id = user.id;
    req.role = user.role;

    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    return sendError(res, 'Authorization verification failed', 500);
  }
};

/**
 * 2. Check if an ERP Module is enabled in `aura_module_settings`
 */
const checkModuleEnabled = (moduleKey) => {
  return async (req, res, next) => {
    try {
      const [rows] = await db.query(
        'SELECT is_enabled FROM aura_module_settings WHERE module_key = ? LIMIT 1',
        [moduleKey]
      );

      // If module row exists and is explicitly disabled
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

    // Super-admin bypass
    if (req.user.role === 'owner' || req.user.level === 1) {
      return next();
    }

    const flatRoles = allowedRoles.flat().map(r => r.toLowerCase());
    if (flatRoles.includes((req.user.role || '').toLowerCase())) {
      return next();
    }

    return sendError(res, `Access denied. Role '${req.user.role}' is not authorized for this resource.`, 403);
  };
};

/**
 * 4. Enforce Granular Permission Check on module and action (e.g., 'inventory', 'create')
 */
const requirePermission = (moduleKey, action = 'view') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    // Super-admin / owner bypass
    if (req.user.role === 'owner' || req.user.level === 1) {
      return next();
    }

    const perms = req.user.permissions || {};
    const modPerms = perms[moduleKey];

    if (modPerms && (modPerms[action] === true || modPerms['all'] === true)) {
      return next();
    }

    // Role-level fallback for managers
    if (req.user.role === 'admin' && ['view', 'create', 'edit'].includes(action)) {
      return next();
    }

    return sendError(
      res,
      `Permission denied. You do not possess '${action}' access for module '${moduleKey}'.`,
      403
    );
  };
};

module.exports = {
  authenticate,
  checkModuleEnabled,
  requireRole,
  requirePermission
};
