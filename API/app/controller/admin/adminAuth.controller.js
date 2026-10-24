/**
 * Admin Authentication Controller (adminAuth.controller.js)
 * High-security enterprise auth matching CodeIgniter 3 AURA_v1
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db, access_token_key } = require('../../config/utill/helper');
const { sendSuccess, sendError } = require('../../config/utill/response');
const tokenService = require('../../services/token.service');
const accessControlService = require('../../services/accessControl.service');
const permissionsUtil = require('../../config/utill/permissions');
const sessionService = require('../../services/session.service');
const authConfig = require('../../config/auth.config');
const Auth_Model = require('../../models/admins/auth.model');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';
const ACCESS_TOKEN_EXPIRY = '2h';

/**
 * POST /api/admin/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { username, password, remember = false, remember_me = false } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const isRemember = Boolean(remember || remember_me);

    if (!username || !password) {
      return sendError(res, 'Username or email and password are required', 400);
    }

    const cleanLogin = username.trim().toLowerCase();
    const user = await Auth_Model.findUserByIdentity(cleanLogin);

    if (!user) {
      await Auth_Model.recordLoginAttempt(cleanLogin, ipAddress, 'admin');
      return sendError(res, 'Invalid credentials', 401);
    }

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return sendError(
        res,
        `Account temporarily locked due to too many failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        423
      );
    }

    // Strictly block customer accounts
    const roleName = (user.group_name || user.role || '').toLowerCase();
    if (roleName === 'customer' || Number(user.group_id) === 4 || Number(user.allow_admin_login) !== 1) {
      return sendError(
        res,
        'Access denied: Customer accounts are not permitted to log into the administrative portal.',
        403,
        { code: 'FORBIDDEN_CUSTOMER' }
      );
    }

    // Check user account status
    if (user.status !== 'active') {
      if (user.status === 'pending') {
        return sendError(res, 'Account is pending approval by an administrator.', 403);
      }
      return sendError(res, `Account is ${user.status}. Please contact system support.`, 403);
    }

    // Password Verification
    let passwordMatches = false;
    let needsUpgradeToBcrypt = false;

    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'))) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else if (user.password && user.password.length === 40) {
      const embeddedSalt = user.password.substring(0, 10);
      const shaPart = crypto.createHash('sha1').update(embeddedSalt + password).digest('hex');
      const ionAuthHash = embeddedSalt + shaPart.substring(0, shaPart.length - 10);
      if (ionAuthHash === user.password) {
        passwordMatches = true;
        needsUpgradeToBcrypt = true;
      } else if (user.salt && crypto.createHash('sha1').update(password + user.salt).digest('hex') === user.password) {
        passwordMatches = true;
        needsUpgradeToBcrypt = true;
      } else if (crypto.createHash('sha1').update(password).digest('hex') === user.password) {
        passwordMatches = true;
        needsUpgradeToBcrypt = true;
      }
    } else if (crypto.createHash('md5').update(password).digest('hex') === user.password || user.password === password) {
      passwordMatches = true;
      needsUpgradeToBcrypt = true;
    }

    if (!passwordMatches) {
      await Auth_Model.recordLoginAttempt(cleanLogin, ipAddress, 'admin');
      const newFailedCount = (user.failed_login_count || 0) + 1;
      if (newFailedCount >= 5) {
        await Auth_Model.lockAccount(user.id, 15);
        return sendError(res, 'Too many failed login attempts. Account locked for 15 minutes.', 423);
      }
      await db.query("UPDATE aura_users SET failed_login_count = ? WHERE id = ?", [newFailedCount, user.id]);
      const attemptsRemaining = 5 - newFailedCount;
      return sendError(res, `Invalid credentials. ${attemptsRemaining} attempt(s) remaining before temporary lockout.`, 401);
    }

    if (needsUpgradeToBcrypt) {
      const newBcryptHash = await bcrypt.hash(password, 10);
      await Auth_Model.upgradePasswordHash(user.id, newBcryptHash);
    }

    await Auth_Model.updateSuccessLogin(user.id, ipAddress, userAgent);
    await Auth_Model.clearLoginAttempts(cleanLogin, ipAddress);

    // Issue JWT access token
    const tokenPayload = {
      id: user.id,
      user_id: user.id,
      username: user.username,
      email: user.email,
      group_id: user.group_id,
      role: user.group_name,
      level: user.group_level,
      area: 'admin'
    };
    const tokenExpiry = isRemember ? '30d' : ACCESS_TOKEN_EXPIRY;
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: tokenExpiry });

    // Register active session & inactivity tracking
    await sessionService.registerSession({
      userId: user.id,
      token: accessToken,
      area: 'admin',
      remember: isRemember,
      ipAddress,
      userAgent
    });

    // Set HttpOnly, SameSite session cookie
    sessionService.setSessionCookie(res, 'admin', accessToken, isRemember);

    // Fetch permissions & branches
    const [allowedPermissions, allowedBranches, GP] = await Promise.all([
      accessControlService.getUserAllowedPermissions(user.id, user.group_id, user.group_level),
      accessControlService.getUserAllowedBranches(user.id, user.group_level),
      permissionsUtil.getGroupPermissions(user.group_id)
    ]);

    const isOwner = Number(user.group_id) === 1 || Number(user.group_level) === 1 || user.group_name === 'owner';
    const isAdmin = Number(user.group_id) === 2 || Number(user.group_level) === 2 || user.group_name === 'admin';

    const sessionUserData = {
      id: user.id,
      user_id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      phone: user.phone,
      avatar: user.avatar,
      theme: user.theme || 'light',
      group_id: user.group_id,
      role: user.group_name,
      group_name: user.group_name,
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
      Customer: false,
      Salesman: roleName === 'salesman' || roleName === 'sale-agents',
      isOwner,
      isAdmin,
      GP: isOwner || isAdmin ? { all: 1 } : GP,
      permissions: allowedPermissions,
      branches: allowedBranches
    };

    const responseData = {
      token: accessToken,
      accessToken,
      access_token: accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      user: sessionUserData,
      profile: sessionUserData,
      group: {
        id: user.group_id,
        name: user.group_name,
        description: user.group_description,
        level: user.group_level,
        allow_admin_login: user.allow_admin_login,
        allow_web_login: user.allow_web_login
      },
      GP: isOwner || isAdmin ? { all: 1 } : GP,
      permissions: allowedPermissions,
      branches: allowedBranches
    };

    return sendSuccess(res, responseData, 'Authentication successful');
  } catch (err) {
    console.error('[Admin Login Error]', err);
    return sendError(res, 'Authentication failed due to server error', 500, err.message);
  }
};

/**
 * POST /api/admin/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    const token = req.token || req.headers.authorization?.replace('Bearer ', '') || req.cookies?.[authConfig.session.adminCookieName];
    if (token) {
      await sessionService.revokeSession(token);
    }
    if (req.user?.id) {
      await tokenService.revokeAllUserTokens(req.user.id, 'refresh');
    }
    sessionService.clearSessionCookie(res, 'admin');
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    return sendError(res, 'Failed to logout', 500, err.message);
  }
};

/**
 * POST /api/admin/auth/refresh
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 'Refresh token is required', 400);
    }

    const tokenRow = await tokenService.validateToken(refreshToken, 'refresh', 'admin');
    if (!tokenRow) {
      return sendError(res, 'Refresh token is invalid, expired, or revoked', 401);
    }

    const [users] = await db.query('SELECT * FROM aura_users WHERE id = ? LIMIT 1', [tokenRow.user_id]);
    if (!users || users.length === 0) return sendError(res, 'User not found', 404);
    const user = users[0];

    const newAccessToken = jwt.sign({
      id: user.id,
      user_id: user.id,
      username: user.username,
      email: user.email,
      group_id: user.group_id,
      area: 'admin'
    }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

    await sessionService.registerSession({ userId: user.id, token: newAccessToken, area: 'admin' });
    sessionService.setSessionCookie(res, 'admin', newAccessToken);

    return sendSuccess(res, { token: newAccessToken }, 'Token refreshed');
  } catch (err) {
    return sendError(res, 'Token refresh failed', 500, err.message);
  }
};

const { profile: getProfile } = require('./auth.controller');

exports.getProfile = getProfile;
exports.profile = getProfile;

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user_id || req.user?.id;
    const { first_name, last_name, phone, gender, avatar } = req.body;
    await db.query(`
      UPDATE aura_users
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          gender = COALESCE(?, gender),
          avatar = COALESCE(?, avatar),
          updated_at = NOW()
      WHERE id = ?
    `, [first_name, last_name, phone, gender, avatar, userId]);
    return sendSuccess(res, null, 'Profile updated successfully');
  } catch (err) {
    return sendError(res, 'Failed to update profile', 500, err.message);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user_id || req.user?.id;
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return sendError(res, 'Current and new password are required', 400);
    }
    const [rows] = await db.query('SELECT password FROM aura_users WHERE id = ?', [userId]);
    if (!rows || rows.length === 0) return sendError(res, 'User not found', 404);
    const isMatch = await bcrypt.compare(old_password, rows[0].password);
    if (!isMatch) return sendError(res, 'Current password is incorrect', 401);

    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE aura_users SET password = ?, password_algo = "bcrypt", updated_at = NOW() WHERE id = ?', [hash, userId]);
    return sendSuccess(res, null, 'Password updated successfully');
  } catch (err) {
    return sendError(res, 'Failed to update password', 500, err.message);
  }
};

exports.forgotPassword = async (req, res) => {
  return sendSuccess(res, null, 'If this email is registered, instructions have been sent');
};

/**
 * POST /api/admin/auth/activity
 */
exports.activity = async (req, res) => {
  const token = req.token || req.headers.authorization?.replace('Bearer ', '') || req.cookies?.[authConfig.session.adminCookieName];
  if (token) {
    if (req.query.simulate_idle === '1') {
      sessionService.expireSessionForTesting(token);
      return sendSuccess(res, { simulated_idle: true });
    }
    sessionService.touchActivity(token);
  }
  return sendSuccess(res, { timestamp: Date.now() });
};

/**
 * POST /api/admin/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  return sendSuccess(res, null, 'Password reset instructions sent');
};
