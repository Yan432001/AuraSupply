const { db, access_token_key } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const permissionsUtil = require("../../config/utill/permissions");
const accessControlService = require("../../services/accessControl.service");

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || "AURA_ERP_SECRET_TOKEN_2026";
const ACCESS_TOKEN_EXPIRY = "7d";

/**
 * GET /api/admin/auth/profile or GET /api/admin/auth/session
 * Return current authenticated session, role flags, and permissions ($this->GP)
 */
exports.profile = async (req, res) => {
  try {
    const userId = req.user_id || req.user?.id || req.profile?.id;
    if (!userId) {
      return res.status(401).json({ success: false, status: false, message: "Unauthenticated" });
    }

    const sql = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.gender,
             u.group_id, u.active, u.biller_id, u.warehouse_id, u.company_id, u.avatar,
             u.view_right, u.edit_right, u.show_cost, u.show_price,
             g.name AS role, g.name AS group_name, g.description AS role_description, g.level AS group_level,
             g.allow_admin_login, g.allow_web_login
      FROM aura_users u
      LEFT JOIN aura_groups g ON u.group_id = g.id
      WHERE u.id = ? AND u.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [userId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, status: false, message: "User not found" });
    }

    const user = rows[0];
    const roleName = (user.role || user.group_name || '').toLowerCase();

    // Block customer accounts from accessing administrative session/profile endpoints
    if (req.originalUrl && req.originalUrl.includes('/admin')) {
      if (roleName === 'customer' || Number(user.group_id) === 4 || Number(user.allow_admin_login) === 0) {
        return res.status(403).json({
          success: false,
          status: false,
          error: 'FORBIDDEN',
          code: 'FORBIDDEN_CUSTOMER',
          message: 'Access denied: Customer accounts are strictly prohibited from accessing administrative endpoints.'
        });
      }
    }

    const isOwner = Number(user.group_id) === 1 || Number(user.group_level) === 1 || roleName === 'owner';
    const isAdmin = Number(user.group_id) === 2 || Number(user.group_level) === 2 || roleName === 'admin';

    // Retrieve group permissions ($this->GP)
    const GP = await permissionsUtil.getGroupPermissions(user.group_id);
    const allowedBranches = await accessControlService.getUserAllowedBranches(user.id, user.group_level);

    const permissionKeys = isOwner || isAdmin
      ? await permissionsUtil.getPermissionKeys()
      : Object.entries(GP).filter(([k, v]) => k !== 'group_id' && v == 1).map(([k]) => k);

    const sessionUser = {
      id: user.id,
      user_id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      phone: user.phone,
      gender: user.gender,
      avatar: user.avatar,
      group_id: user.group_id,
      role: user.role || 'admin',
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
      Store: roleName === 'store',
      Supplier: roleName === 'supplier',
      Customer: roleName === 'customer',
      Salesman: roleName === 'salesman' || roleName === 'sale-agents',
      isOwner,
      isAdmin,
      GP: isOwner || isAdmin ? { all: 1 } : GP,
      permissions: permissionKeys,
      branches: allowedBranches
    };

    res.json({
      success: true,
      status: true,
      data: sessionUser,
      profile: sessionUser,
      user: sessionUser,
      GP,
      permissions: permissionKeys,
      branches: allowedBranches
    });
  } catch (err) {
    logError("profile.controller", err, res);
  }
};

/**
 * POST /api/admin/auth/login, POST /api/admin/login, POST /api/auth/login
 * Administrative Login & Session Creation
 * (Cloned from CodeIgniter 3 AURA_v1 Auth::login & Auth_model)
 */
exports.login = async (req, res) => {
  try {
    const { username, password, remember = false, remember_me = false } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        status: false,
        message: "Username/email and password are required",
        error: { message: "Username and password are required" }
      });
    }

    const cleanLogin = username.trim().toLowerCase();

    // Query aura_users joined with aura_groups
    const query = `
      SELECT u.*, 
             g.name AS role, g.name AS group_name, g.description AS role_description, g.level AS group_level,
             g.allow_admin_login, g.allow_web_login
      FROM aura_users u
      LEFT JOIN aura_groups g ON u.group_id = g.id
      WHERE (LOWER(u.username) = ? OR LOWER(u.email) = ?) AND u.deleted_at IS NULL
      LIMIT 1
    `;
    const [data] = await db.query(query, [cleanLogin, cleanLogin]);

    if (!data || data.length === 0) {
      // Record failed attempt
      try {
        await db.query(
          "INSERT INTO aura_login_attempts (login, ip_address, area, time) VALUES (?, ?, 'admin', UNIX_TIMESTAMP())",
          [cleanLogin, ipAddress]
        );
      } catch (_) {}

      return res.status(401).json({
        success: false,
        status: false,
        message: "Invalid username or password",
        error: { message: "Invalid username or password" }
      });
    }

    const user = data[0];

    // Check account status
    if (user.active === 0 || (user.status && user.status !== 'active')) {
      return res.status(403).json({
        success: false,
        status: false,
        message: "Account has been deactivated. Please contact administrator.",
        error: { message: "Account has been deactivated" }
      });
    }

    // Admin Login Restriction: Strictly block customer accounts from administrative login
    const roleName = (user.role || user.group_name || '').toLowerCase();
    const isCustomer = roleName === 'customer' || Number(user.group_id) === 4 || Number(user.allow_admin_login) === 0;
    const isAdminRoute = req.originalUrl && (req.originalUrl.includes('/admin') || req.baseUrl.includes('/admin'));

    if (isAdminRoute && isCustomer) {
      return res.status(403).json({
        success: false,
        status: false,
        error: 'FORBIDDEN',
        code: 'FORBIDDEN_CUSTOMER',
        message: 'Access denied: Customer accounts are not permitted to log into the administrative portal.'
      });
    }

    // Verify password with Bcrypt and legacy Ion Auth SHA1 auto-upgrade
    let isMatch = false;
    let needsUpgrade = false;

    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'))) {
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch (_) {
        isMatch = false;
      }
    } else if (user.password && user.password.length === 40) {
      // Legacy Ion Auth SHA1 algorithm ($salt . substr(sha1($salt . $password), 0, -10))
      const salt = user.password.substring(0, 10);
      const shaPart = crypto.createHash('sha1').update(salt + password).digest('hex');
      const candidate = salt + shaPart.substring(0, shaPart.length - 10);
      if (candidate === user.password) {
        isMatch = true;
        needsUpgrade = true;
      } else if (user.salt && crypto.createHash('sha1').update(password + user.salt).digest('hex') === user.password) {
        isMatch = true;
        needsUpgrade = true;
      } else if (crypto.createHash('sha1').update(password).digest('hex') === user.password) {
        isMatch = true;
        needsUpgrade = true;
      }
    } else if (crypto.createHash('md5').update(password).digest('hex') === user.password || user.password === password) {
      // Plain text or MD5 fallback, upgrade immediately
      isMatch = true;
      needsUpgrade = true;
    }

    if (!isMatch) {
      try {
        await db.query(
          "INSERT INTO aura_login_attempts (login, ip_address, area, time) VALUES (?, ?, 'admin', UNIX_TIMESTAMP())",
          [cleanLogin, ipAddress]
        );
      } catch (_) {}

      return res.status(401).json({
        success: false,
        status: false,
        message: "Invalid username or password",
        error: { message: "Invalid username or password" }
      });
    }

    // Transparently upgrade legacy hash to modern bcrypt
    if (needsUpgrade) {
      try {
        const modernHash = await bcrypt.hash(password, 10);
        await db.query("UPDATE aura_users SET password = ?, password_algo = 'bcrypt' WHERE id = ?", [modernHash, user.id]);
      } catch (_) {}
    }

    // Update last login telemetry
    try {
      const nowTs = Math.floor(Date.now() / 1000);
      await db.query(
        "UPDATE aura_users SET last_login = ?, last_login_at = NOW(), last_login_ip = ? WHERE id = ?",
        [nowTs, ipAddress, user.id]
      );
      await db.query(
        "INSERT INTO aura_user_logins (user_id, login, area, success, ip_address, user_agent, time) VALUES (?, ?, 'admin', 1, ?, ?, NOW())",
        [user.id, user.username, ipAddress, userAgent]
      );
    } catch (_) {}

    // Group & Permissions ($this->GP in CodeIgniter 3)
    const isOwner = Number(user.group_id) === 1 || Number(user.group_level) === 1 || roleName === 'owner';
    const isAdmin = Number(user.group_id) === 2 || Number(user.group_level) === 2 || roleName === 'admin';
    const isStore = roleName === 'store';
    const isSupplier = roleName === 'supplier';
    const isSalesman = roleName === 'salesman' || roleName === 'sale-agents';

    // Retrieve group permissions from aura_permissions
    const GP = await permissionsUtil.getGroupPermissions(user.group_id);
    const allowedBranches = await accessControlService.getUserAllowedBranches(user.id, user.group_level);

    const permissionKeys = isOwner || isAdmin
      ? await permissionsUtil.getPermissionKeys()
      : Object.entries(GP).filter(([k, v]) => k !== 'group_id' && v == 1).map(([k]) => k);

    // Complete session data cloned from CodeIgniter 3 Auth_model
    const sanitizedUser = {
      id: user.id,
      user_id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      phone: user.phone,
      gender: user.gender,
      avatar: user.avatar,
      group_id: user.group_id,
      role: user.role || 'admin',
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
      isOwner,
      isAdmin,
      GP: isOwner || isAdmin ? { all: 1 } : GP,
      permissions: permissionKeys,
      branches: allowedBranches
    };

    const groupData = {
      id: user.group_id,
      name: user.group_name || 'admin',
      description: user.role_description,
      level: user.group_level,
      allow_admin_login: user.allow_admin_login,
      allow_web_login: user.allow_web_login
    };

    // Issue JWT access token (optimized compact payload)
    const tokenPayload = {
      id: user.id,
      user_id: user.id,
      username: user.username,
      email: user.email,
      group_id: user.group_id,
      role: user.role || user.group_name || 'admin',
      level: user.group_level,
      area: isCustomer ? 'website' : 'admin',
      data: {
        profile: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role || user.group_name || 'admin',
          group_id: user.group_id
        }
      }
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

    // Response structure formatted for all frontend consumers:
    // Supports both direct root properties AND nested data: { token, user, group, permissions, branches }
    const responsePayload = {
      token: accessToken,
      accessToken,
      access_token: accessToken,
      user: sanitizedUser,
      profile: sanitizedUser,
      group: groupData,
      GP,
      permissions: permissionKeys,
      branches: allowedBranches
    };

    res.json({
      success: true,
      status: true,
      message: `Welcome back, ${user.first_name || user.username}!`,
      token: accessToken,
      access_token: accessToken,
      data: responsePayload,
      user: sanitizedUser,
      profile: sanitizedUser,
      group: groupData,
      GP,
      permissions: permissionKeys,
      branches: allowedBranches
    });
  } catch (err) {
    logError("login.controller", err, res);
  }
};

/**
 * POST /api/admin/auth/logout, POST /api/admin/logout
 * Administrative Logout & Session Termination
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user_id || req.user?.id;
    if (userId) {
      try {
        await db.query("DELETE FROM aura_user_tokens WHERE user_id = ?", [userId]);
      } catch (_) {}
    }

    res.json({
      success: true,
      status: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    logError("logout.controller", err, res);
  }
};

/**
 * Authentication middleware for routes
 */
exports.token_key_login = () => {
  return (req, res, next) => {
    const authorization = req.headers.authorization;
    let token = null;

    if (authorization && authorization.startsWith("Bearer ")) {
      token = authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        status: false,
        message: "Unauthorized: Missing authentication token"
      });
    }

    jwt.verify(token, JWT_SECRET, (error, decoded) => {
      if (error) {
        return res.status(401).json({
          success: false,
          status: false,
          message: "Unauthorized: Invalid or expired token",
          error: error.message
        });
      }

      const decodedUser = decoded.data?.profile || decoded;
      const role = (decodedUser.role || decodedUser.group_name || '').toLowerCase();
      const isCustomer = role === 'customer' || Number(decodedUser.group_id) === 4;

      if (req.originalUrl && req.originalUrl.includes('/admin') && isCustomer) {
        return res.status(403).json({
          success: false,
          status: false,
          error: 'FORBIDDEN',
          code: 'FORBIDDEN_CUSTOMER',
          message: 'Access denied: Customer accounts are strictly prohibited from accessing administrative endpoints.'
        });
      }

      req.user_id = decoded.id || decoded.user_id || decoded.data?.profile?.id;
      req.user = decodedUser;
      next();
    });
  };
};

/**
 * POST /api/admin/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { username, password, email, first_name, last_name, phone, group_id = 2 } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ success: false, message: "Username, email, and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO aura_users (username, password, email, first_name, last_name, phone, group_id, active, created_on)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, UNIX_TIMESTAMP())
    `;
    const [result] = await db.query(sql, [username, hashedPassword, email, first_name, last_name, phone, group_id]);

    res.json({
      success: true,
      status: true,
      message: "User registered successfully",
      userId: result.insertId
    });
  } catch (err) {
    logError("register.controller", err, res);
  }
};
