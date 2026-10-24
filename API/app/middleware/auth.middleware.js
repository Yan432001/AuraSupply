/**
 * AURA CENTRALIZED AUTH & SESSION VERIFICATION MIDDLEWARE
 * ========================================================
 * Ported from CodeIgniter 3 AURA_v1 MY_Controller & MY_Shop_Controller
 * Supports both Bearer Token Header and Secure HttpOnly Cookies
 * Enforces Server-Side Inactivity Tracking & Automatic Expiration
 */

const jwt = require('jsonwebtoken');
const { db, access_token_key } = require('../config/utill/helper');
const sessionService = require('../services/session.service');
const authConfig = require('../config/auth.config');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';

/**
 * Helper to extract token from Request (Bearer header OR HttpOnly cookies)
 */
function extractToken(req, preferredArea = null) {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  // 2. HttpOnly Cookie extraction based on area
  if (req.cookies) {
    if (preferredArea === 'admin') {
      if (req.cookies[authConfig.session.adminCookieName]) {
        return req.cookies[authConfig.session.adminCookieName];
      }
    } else if (preferredArea === 'web') {
      if (req.cookies[authConfig.session.webCookieName]) {
        return req.cookies[authConfig.session.webCookieName];
      }
    }

    // Fallback cookies
    if (req.cookies[authConfig.session.adminCookieName]) return req.cookies[authConfig.session.adminCookieName];
    if (req.cookies[authConfig.session.webCookieName]) return req.cookies[authConfig.session.webCookieName];
    if (req.cookies['token']) return req.cookies['token'];
  }

  return null;
}

/**
 * Admin Session Verification Middleware
 * Modeled on CodeIgniter 3 AURA_v1 (admin/Auth.php & MY_Controller)
 */
const verifyAdminSession = async (req, res, next) => {
  try {
    const isSilent = req.query.silent === '1' || req.headers['x-session-check'] === '1';
    const token = extractToken(req, 'admin');

    if (!token) {
      if (isSilent) {
        return res.json({ success: false, status: false, authenticated: false, message: 'Unauthenticated', data: null });
      }
      return res.status(401).json({
        success: false,
        status: false,
        code: 'UNAUTHENTICATED',
        message: 'Administrative authentication required. No session token provided.'
      });
    }

    // 1. Server-side Inactivity Check (Requirement 5)
    const inactivity = await sessionService.validateInactivity(token);
    if (!inactivity.valid) {
      sessionService.clearSessionCookie(res, 'admin');
      if (isSilent) {
        return res.json({ success: false, status: false, authenticated: false, code: inactivity.reason, message: inactivity.message, data: null });
      }
      return res.status(401).json({
        success: false,
        status: false,
        code: inactivity.reason || 'SESSION_INACTIVE',
        message: inactivity.message || 'Session expired due to inactivity. Please log in again.'
      });
    }

    // 2. JWT Verification
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      sessionService.clearSessionCookie(res, 'admin');
      if (isSilent) {
        return res.json({ success: false, status: false, authenticated: false, message: 'Invalid or expired session token.', data: null });
      }
      return res.status(401).json({
        success: false,
        status: false,
        code: 'TOKEN_EXPIRED',
        message: 'Invalid or expired session token.'
      });
    }

    const userId = decoded?.data?.profile?.id || decoded?.id || decoded?.user_id || decoded?.data?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authentication token payload.'
      });
    }

    // 3. User & Group verification from database
    const sql = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.group_id, u.active,
             u.biller_id, u.warehouse_id, u.company_id, u.view_right, u.edit_right, u.show_cost, u.show_price,
             g.name AS role, g.name AS group_name, g.description AS role_description,
             g.level, g.allow_admin_login, g.allow_web_login
      FROM aura_users u
      LEFT JOIN aura_groups g ON u.group_id = g.id
      WHERE u.id = ? AND u.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [userId]);

    if (!rows || rows.length === 0) {
      sessionService.clearSessionCookie(res, 'admin');
      return res.status(401).json({
        success: false,
        message: 'User account not found or removed.'
      });
    }

    const user = rows[0];
    if (!user.active) {
      sessionService.clearSessionCookie(res, 'admin');
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact administration.'
      });
    }

    // 4. Strict Admin Protection: Block customer accounts
    const userRole = (user.role || user.group_name || '').toLowerCase();
    const isCustomer = userRole === 'customer' || Number(user.group_id) === 4 || Number(user.allow_admin_login) === 0;

    if (isCustomer) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        code: 'FORBIDDEN_CUSTOMER',
        message: 'Access denied: Customer accounts are strictly prohibited from accessing administrative endpoints.'
      });
    }

    // Attach verified user and session details
    req.user = user;
    req.user_id = user.id;
    req.role = user.role || 'admin';
    req.group_id = user.group_id;
    req.token = token;

    next();
  } catch (err) {
    console.error('[Admin Auth Middleware] Exception:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization verification.'
    });
  }
};

/**
 * Website Customer Session Verification Middleware
 * Modeled on CodeIgniter 3 AURA_v1 MY_Shop_Controller
 */
const verifyWebSession = async (req, res, next) => {
  try {
    const isSilent = req.query.silent === '1' || req.headers['x-session-check'] === '1';
    const token = extractToken(req, 'web');

    if (!token) {
      if (isSilent) {
        return res.json({ success: false, status: false, authenticated: false, message: 'Unauthenticated', data: null });
      }
      return res.status(401).json({
        success: false,
        status: false,
        code: 'UNAUTHENTICATED',
        message: 'Authentication required. No session token provided.'
      });
    }

    // Inactivity Check
    const inactivity = await sessionService.validateInactivity(token);
    if (!inactivity.valid) {
      sessionService.clearSessionCookie(res, 'web');
      if (isSilent) {
        return res.json({ success: false, status: false, authenticated: false, code: inactivity.reason, message: inactivity.message, data: null });
      }
      return res.status(401).json({
        success: false,
        status: false,
        code: inactivity.reason || 'SESSION_INACTIVE',
        message: inactivity.message || 'Session expired due to inactivity. Please log in again.'
      });
    }

    // JWT Verification
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      sessionService.clearSessionCookie(res, 'web');
      if (isSilent) {
        return res.json({ success: false, status: false, authenticated: false, message: 'Invalid or expired session token.', data: null });
      }
      return res.status(401).json({
        success: false,
        status: false,
        code: 'TOKEN_EXPIRED',
        message: 'Invalid or expired session token.'
      });
    }

    const userId = decoded?.id || decoded?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Malformed token payload.' });
    }

    const sql = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.company, u.phone, u.group_id, u.status, u.active,
             g.name AS role, g.level, g.allow_web_login, g.allow_admin_login
      FROM aura_users u
      LEFT JOIN aura_groups g ON u.group_id = g.id
      WHERE u.id = ? AND u.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [userId]);

    if (!rows || rows.length === 0) {
      sessionService.clearSessionCookie(res, 'web');
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    const user = rows[0];
    if (user.status !== 'active' || user.active === 0) {
      sessionService.clearSessionCookie(res, 'web');
      return res.status(403).json({ success: false, message: 'Account is not active.' });
    }

    req.user = user;
    req.user_id = user.id;
    req.token = token;

    next();
  } catch (err) {
    console.error('[Web Auth Middleware] Exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * General authenticate middleware (intelligently delegates to admin or web based on URL)
 */
const authenticate = async (req, res, next) => {
  const isAdminPath = req.originalUrl && (req.originalUrl.includes('/admin') || req.baseUrl.includes('/admin'));
  if (isAdminPath) {
    return verifyAdminSession(req, res, next);
  }
  return verifyWebSession(req, res, next);
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
      console.warn(`[Permission Check] Permission key '${permissionKey}' fallback:`, err.message);
      if (['admin', 'branch', 'manager'].includes(req.user.role)) {
        return next();
      }
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }
  };
};

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
  extractToken,
  authenticate,
  verifyAdminSession,
  verifyWebSession,
  requireRole,
  requirePermission,
  requireAdmin
};
