const jwt = require('jsonwebtoken');
const { db, access_token_key } = require('../config/utill/helper');
const { sendError } = require('../config/utill/response');
const permissionsUtil = require('../config/utill/permissions');
const accessControlService = require('../services/accessControl.service');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';

/**
 * 1. Base Controller Authenticate Middleware
 * Cloned directly from CodeIgniter 3 (AURA_v1 MY_Controller::__construct):
 *   - Verifies session token
 *   - Defines $this->loggedIn, $this->Owner, $this->Admin, $this->Store, $this->GP
 *   - Injects complete session context into req.user & req.GP
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    const isSilent = req.query.silent === '1' || req.headers['x-session-check'] === '1';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.id || decoded?.user_id || decoded?.data?.profile?.id || decoded?.data?.id;
      } catch (err) {
        if (isSilent) {
          return res.json({ success: false, authenticated: false, message: 'Session token expired or invalid.', data: null });
        }
        return sendError(res, 'Session token expired or invalid. Please sign in again.', 401);
      }
    } else if (req.session && req.session.user_id) {
      userId = req.session.user_id;
    } else if (req.query.dev === '1') {
      // Dev explicit bypass when requested via ?dev=1
      userId = 1;
    } else {
      if (isSilent) {
        return res.json({ success: false, authenticated: false, message: 'Authentication required. No bearer token provided.', data: null });
      }
      return sendError(res, 'Authentication required. No bearer token provided.', 401);
    }

    if (!userId) {
      if (isSilent) {
        return res.json({ success: false, authenticated: false, message: 'Malformed credentials.', data: null });
      }
      return sendError(res, 'Malformed credentials.', 401);
    }

    // Query aura_users joined with aura_groups
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone,
             u.group_id, u.active, u.status, u.theme, u.avatar, u.gender,
             u.biller_id, u.warehouse_id, u.company_id, u.view_right, u.edit_right,
             u.show_cost, u.show_price,
             g.name AS group_name, g.description AS group_description, g.level AS group_level,
             g.allow_admin_login, g.allow_web_login
      FROM aura_users u
      LEFT JOIN aura_groups g ON g.id = u.group_id
      WHERE u.id = ? AND u.deleted_at IS NULL
      LIMIT 1
    `, [userId]);

    if (!rows || rows.length === 0) {
      if (isSilent) {
        return res.json({ success: false, authenticated: false, message: 'User account not found or deactivated.', data: null });
      }
      return sendError(res, 'User account not found or deactivated.', 401);
    }

    const user = rows[0];
    if (user.active === 0 || (user.status && user.status !== 'active')) {
      return sendError(res, 'Account is currently inactive or deactivated. Access denied.', 403);
    }

    // Role flags matching CodeIgniter 3 MY_Controller
    const roleName = (user.group_name || '').toLowerCase();
    const isCustomer = roleName === 'customer' || Number(user.group_id) === 4 || Number(user.allow_admin_login) === 0;

    // Strict Admin Protection: Customers are strictly blocked from /api/admin/* endpoints
    const isAdminEndpoint = req.originalUrl && (req.originalUrl.includes('/api/admin') || req.baseUrl.includes('/api/admin'));
    if (isAdminEndpoint && isCustomer) {
      return sendError(
        res,
        'Access denied: Customer accounts are strictly prohibited from accessing administrative endpoints.',
        403,
        { code: 'FORBIDDEN_CUSTOMER' }
      );
    }

    const isOwner = Number(user.group_id) === 1 || Number(user.group_level) === 1 || roleName === 'owner';
    const isAdmin = Number(user.group_id) === 2 || Number(user.group_level) === 2 || roleName === 'admin';
    const isStore = roleName === 'store';
    const isSupplier = roleName === 'supplier';
    const isSalesman = roleName === 'salesman' || roleName === 'sale-agents' || roleName === 'saleman';

    // Group Permissions ($this->GP in CodeIgniter 3)
    let GP = {};
    if (isOwner || isAdmin) {
      // Owner and Admin have access to everything
      // Create proxy where any queried key returns 1
      GP = new Proxy({}, {
        get: (target, prop) => (typeof prop === 'string' && prop !== 'then' ? 1 : target[prop])
      });
    } else {
      // Load actual permissions row from aura_permissions for this group_id
      GP = await permissionsUtil.getGroupPermissions(user.group_id);
    }

    // Allowed branches
    const allowedBranches = await accessControlService.getUserAllowedBranches(user.id, user.group_level);

    // Attach to request object (matching CodeIgniter 3 MY_Controller)
    req.loggedIn = true;
    req.Owner = isOwner;
    req.Admin = isAdmin;
    req.Store = isStore;
    req.Supplier = isSupplier;
    req.Customer = isCustomer;
    req.Salesman = isSalesman;
    req.GP = GP;
    req.user_id = user.id;

    req.user = {
      id: user.id,
      user_id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      avatar: user.avatar,
      gender: user.gender,
      group_id: user.group_id,
      role: user.group_name || 'admin',
      group_name: user.group_name || 'admin',
      level: user.group_level,
      warehouse_id: user.warehouse_id,
      biller_id: user.biller_id,
      company_id: user.company_id,
      view_right: user.view_right,
      edit_right: user.edit_right,
      show_cost: user.show_cost,
      show_price: user.show_price,
      Owner: isOwner,
      Admin: isAdmin,
      Store: isStore,
      Supplier: isSupplier,
      Customer: isCustomer,
      Salesman: isSalesman,
      GP: isOwner || isAdmin ? { all: 1 } : GP
    };

    // Permission check helper on req
    req.can = (permissionKey) => {
      if (req.Owner || req.Admin) return true;
      if (req.GP && req.GP[permissionKey] == 1) return true;
      return false;
    };

    req.branches = allowedBranches;
    req.branchIds = allowedBranches.map(b => b.id);

    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    return sendError(res, 'Authorization verification failed', 500);
  }
};

/**
 * 2. Granular Server-Side Permission Check
 * Modeled on CodeIgniter 3 controller permission checks:
 *   if (!$this->Owner && !$this->Admin && !$this->GP['products-cost'])
 */
const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    // Owner and Admin bypass checks automatically
    if (req.Owner || req.Admin || req.user.level === 1 || req.user.role === 'owner') {
      return next();
    }

    // Check in req.GP (aura_permissions)
    if (req.GP && (req.GP[permissionKey] == 1 || req.GP[permissionKey] === true)) {
      return next();
    }

    // Fallback SQL check
    const hasPerm = await permissionsUtil.hasPermission(req.user.id, permissionKey);
    if (hasPerm) {
      return next();
    }

    return sendError(res, `Access denied: Missing required permission '${permissionKey}'`, 403);
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
    if (req.Owner || req.user.role === 'owner' || req.user.level === 1) {
      return next();
    }

    const flatRoles = allowedRoles.flat().map(r => String(r).toLowerCase());
    if (flatRoles.includes((req.user.role || '').toLowerCase())) {
      return next();
    }

    return sendError(res, `Access denied. Requires one of roles: [${flatRoles.join(', ')}]`, 403);
  };
};

/**
 * 4. Check if an ERP Module is enabled in aura_module_settings
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
      next();
    }
  };
};

/**
 * 5. Branch Scope Filter
 */
const branchScopeFilter = (req, res, next) => {
  if (req.user && (req.Owner || req.Admin || req.user.level === 1 || req.user.role === 'owner' || req.user.role === 'admin')) {
    req.isUnrestrictedBranch = true;
  } else {
    req.isUnrestrictedBranch = false;
  }
  next();
};

/**
 * 6. Require Administrative Role Guard
 * Strictly blocks any account with the 'customer' role or without admin login capability
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required', 401);
  }

  const role = (req.user.role || req.user.group_name || '').toLowerCase();
  const groupId = Number(req.user.group_id);
  const allowAdminLogin = req.user.allow_admin_login !== undefined ? Number(req.user.allow_admin_login) : null;

  if (role === 'customer' || groupId === 4 || allowAdminLogin === 0 || req.Customer) {
    return sendError(
      res,
      'Access denied: Customer accounts are strictly prohibited from accessing administrative endpoints.',
      403,
      { code: 'FORBIDDEN_CUSTOMER' }
    );
  }

  next();
};

module.exports = {
  authenticate,
  requirePermission,
  requireRole,
  requireAdmin,
  checkModuleEnabled,
  branchScopeFilter
};
