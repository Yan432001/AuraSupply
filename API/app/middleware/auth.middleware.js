/**
 * AURA CENTRALIZED AUTH & AUTHORIZATION MIDDLEWARE
 * ===============================================
 * Sole Source of Truth: aura_users & aura_groups
 * (aura_companies is NEVER consulted for authorization)
 */

const jwt = require('jsonwebtoken');
const { db, access_token_key } = require('../config/utill/helper');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'ERTGGGEDSFDRE#5R###@';

/**
 * Authenticate JWT Token and hydrate user from aura_users
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No bearer token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token.'
      });
    }

    const userId = decoded?.data?.profile?.id || decoded?.id || decoded?.data?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authentication token payload.'
      });
    }

    // Sole Source of Truth: query aura_users JOIN aura_groups
    const sql = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.group_id, u.active,
             u.biller_id, u.warehouse_id, g.name AS role, g.description AS role_description,
             g.level, g.allow_admin_login, g.allow_web_login
      FROM aura_users u
      LEFT JOIN aura_groups g ON u.group_id = g.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [userId]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const user = rows[0];
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Contact administration.'
      });
    }

    // Strict Admin Protection: Customers are strictly blocked from /api/admin/* endpoints
    const isAdminEndpoint = req.originalUrl && (req.originalUrl.includes('/api/admin') || req.baseUrl.includes('/api/admin'));
    const userRole = (user.role || '').toLowerCase();
    const isCustomer = userRole === 'customer' || Number(user.group_id) === 4 || Number(user.allow_admin_login) === 0;

    if (isAdminEndpoint && isCustomer) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        code: 'FORBIDDEN_CUSTOMER',
        message: 'Access denied: Customer accounts are strictly prohibited from accessing administrative endpoints.'
      });
    }

    // Attach verified user and role to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      group_id: user.group_id,
      role: user.role || 'staff',
      role_description: user.role_description,
      level: user.level,
      allow_admin_login: user.allow_admin_login,
      allow_web_login: user.allow_web_login,
      biller_id: user.biller_id,
      warehouse_id: user.warehouse_id
    };
    req.user_id = user.id;
    req.role = user.role || 'staff';
    req.group_id = user.group_id;

    next();
  } catch (err) {
    console.error('[Auth Middleware] Verification exception:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization verification.'
    });
  }
};

/**
 * Require specific role(s) — 'owner' always passes
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const userRole = (req.user.role || '').toLowerCase();

    // Owner role (group 1) has root super-admin bypass
    if (userRole === 'owner' || req.user.group_id === 1) {
      return next();
    }

    const flattenedRoles = allowedRoles.flat().map(r => r.toLowerCase());
    if (flattenedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role '${userRole}' does not have sufficient privilege for this operation.`
    });
  };
};

/**
 * Require specific granular permission key from aura_permissions
 */
const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    // Super-admin / owner bypass
    if (req.user.role === 'owner' || req.user.group_id === 1) {
      return next();
    }

    try {
      const sanitizedKey = permissionKey.replace(/[^a-zA-Z0-9_\-]/g, '');
      const sql = `SELECT \`${sanitizedKey}\` FROM aura_permissions WHERE group_id = ? LIMIT 1`;
      const [rows] = await db.query(sql, [req.user.group_id]);

      if (rows && rows.length > 0 && rows[0][sanitizedKey] == 1) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: '${permissionKey}'.`
      });
    } catch (err) {
      console.warn(`[Permission Check] Permission key '${permissionKey}' check skipped or failed:`, err.message);
      // Fallback to role check for standard admin
      if (['admin', 'branch', 'manager'].includes(req.user.role)) {
        return next();
      }
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }
  };
};

/**
 * Require Administrative Access (Strictly blocks customer accounts)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  const role = (req.user.role || '').toLowerCase();
  const groupId = Number(req.user.group_id);
  const allowAdminLogin = req.user.allow_admin_login !== undefined ? Number(req.user.allow_admin_login) : null;

  if (role === 'customer' || groupId === 4 || allowAdminLogin === 0) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      code: 'FORBIDDEN_CUSTOMER',
      message: 'Access denied: Customer accounts are strictly prohibited from accessing administrative endpoints.'
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireRole,
  requirePermission,
  requireAdmin
};
