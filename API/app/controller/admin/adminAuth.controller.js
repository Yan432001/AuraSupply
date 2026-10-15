const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db, access_token_key } = require('../../config/utill/helper');
const { sendSuccess, sendError } = require('../../config/utill/response');
const tokenService = require('../../services/token.service');
const accessControlService = require('../../services/accessControl.service');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';
const ACCESS_TOKEN_EXPIRY = '2h'; // Short access token

/**
 * POST /api/admin/auth/login
 * Administrative Authentication
 *
 * Enforces:
 *   - Accept username or email + password
 *   - Verify bcrypt ($2b$ hashes) or legacy sha1 with auto-upgrade
 *   - Allow ONLY if: status='active', deleted_at IS NULL, locked_until is empty or past,
 *     and aura_groups.allow_admin_login = 1
 *   - Wrong password: failed_login_count + 1; lock 15 min after 5 tries; log to aura_login_attempts (area='admin')
 *   - Success: reset counter, set last_login_at, write aura_user_logins (area='admin', success=1),
 *     issue short access token + refresh token (store SHA-256 in aura_user_tokens)
 *   - Return: user, group, allowed permission keys (array), allowed branches (aura_user_billers)
 */
exports.login = async (req, res) => {
  try {
    const { username, password, remember_me = false } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (!username || !password) {
      return sendError(res, 'Username or email and password are required', 400);
    }

    const cleanLogin = username.trim().toLowerCase();

    // Query aura_users joined with aura_groups
    const [users] = await db.query(`
      SELECT u.id, u.username, u.email, u.password, u.password_algo, u.group_id,
             u.status, u.active, u.first_name, u.last_name, u.phone, u.avatar, u.theme,
             u.failed_login_count, u.locked_until, u.deleted_at,
             g.name AS group_name, g.description AS group_description, g.level AS group_level,
             g.allow_admin_login, g.allow_web_login
      FROM aura_users u
      JOIN aura_groups g ON g.id = u.group_id
      WHERE (LOWER(u.username) = ? OR LOWER(u.email) = ?) AND u.deleted_at IS NULL
      LIMIT 1
    `, [cleanLogin, cleanLogin]);

    if (!users || users.length === 0) {
      await db.query(`
        INSERT INTO aura_login_attempts (login, ip_address, area, time)
        VALUES (?, ?, 'admin', NOW())
      `, [cleanLogin, ipAddress]);
      return sendError(res, 'Invalid credentials', 401);
    }

    const user = users[0];

    // Check account lockout (15 minutes after 5 failed tries)
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return sendError(
        res,
        `Account temporarily locked due to too many failed attempts. Please try again in ${remainingMinutes} minute(s).`,
        423
      );
    }

    // Check admin portal privilege (aura_groups.allow_admin_login = 1)
    if (Number(user.allow_admin_login) !== 1) {
      return sendError(res, 'Access denied: Your account role does not have administrative permissions.', 403);
    }

    // Check user account status
    if (user.status !== 'active') {
      if (user.status === 'pending') {
        return sendError(res, 'Account is pending approval by an administrator.', 403);
      }
      return sendError(res, `Account is ${user.status}. Please contact system support.`, 403);
    }

    // Check migrated accounts with password '!'
    if (user.password === '!') {
      return sendError(
        res,
        'Your account was migrated from the legacy system. Please use "Forgot Password" to set your password.',
        400,
        { requiresPasswordReset: true }
      );
    }

    // Password Verification (bcrypt with legacy sha1 fallback & auto-upgrade)
    let passwordMatches = false;
    let needsUpgradeToBcrypt = false;

    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      // Legacy SHA1 check
      const sha1Hash = crypto.createHash('sha1').update(password).digest('hex');
      if (sha1Hash === user.password) {
        passwordMatches = true;
        needsUpgradeToBcrypt = true;
      }
    }

    // Handle Wrong Password
    if (!passwordMatches) {
      const newFailedCount = (user.failed_login_count || 0) + 1;
      let lockUntilSql = 'NULL';
      let isNowLocked = false;

      if (newFailedCount >= 5) {
        lockUntilSql = 'DATE_ADD(NOW(), INTERVAL 15 MINUTE)';
        isNowLocked = true;
      }

      await db.query(`
        UPDATE aura_users
        SET failed_login_count = ?, locked_until = ${lockUntilSql}
        WHERE id = ?
      `, [newFailedCount, user.id]);

      await db.query(`
        INSERT INTO aura_login_attempts (login, ip_address, area, time)
        VALUES (?, ?, 'admin', NOW())
      `, [cleanLogin, ipAddress]);

      if (isNowLocked) {
        return sendError(res, 'Too many failed login attempts. Account locked for 15 minutes.', 423);
      }

      const attemptsRemaining = 5 - newFailedCount;
      return sendError(res, `Invalid credentials. ${attemptsRemaining} attempt(s) remaining before temporary lockout.`, 401);
    }

    // Auto-upgrade legacy hash to modern bcrypt if needed
    if (needsUpgradeToBcrypt) {
      const newBcryptHash = await bcrypt.hash(password, 10);
      await db.query(`
        UPDATE aura_users
        SET password = ?, password_algo = 'bcrypt'
        WHERE id = ?
      `, [newBcryptHash, user.id]);
    }

    // Successful login -> Reset lockout counter and update login telemetry
    await db.query(`
      UPDATE aura_users
      SET failed_login_count = 0,
          locked_until = NULL,
          last_login_at = NOW(),
          last_login_ip = ?
      WHERE id = ?
    `, [ipAddress, user.id]);

    // Record login in aura_user_logins (area='admin', success=1)
    await db.query(`
      INSERT INTO aura_user_logins (user_id, area, success, ip_address, user_agent, time)
      VALUES (?, 'admin', 1, ?, ?, NOW())
    `, [user.id, ipAddress, userAgent]);

    // Issue JWT short access token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      group_id: user.group_id,
      role: user.group_name,
      level: user.group_level,
      area: 'admin'
    };
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

    // Issue refresh token (stored as SHA-256 only in aura_user_tokens)
    const refreshExpirySeconds = remember_me ? 30 * 24 * 3600 : 7 * 24 * 3600;
    const refreshTokenRecord = await tokenService.issueToken({
      userId: user.id,
      type: 'refresh',
      area: 'admin',
      expiresInSeconds: refreshExpirySeconds,
      ipAddress,
      userAgent
    });

    // If remember me requested, issue dedicated remember token
    let rememberToken = null;
    if (remember_me) {
      const rem = await tokenService.issueToken({
        userId: user.id,
        type: 'remember',
        area: 'admin',
        expiresInSeconds: 30 * 24 * 3600,
        ipAddress,
        userAgent
      });
      rememberToken = rem.plainToken;
    }

    // Fetch allowed permission keys (array) and allowed branches
    const [allowedPermissions, allowedBranches] = await Promise.all([
      accessControlService.getUserAllowedPermissions(user.id, user.group_id, user.group_level),
      accessControlService.getUserAllowedBranches(user.id, user.group_level)
    ]);

    // Build standard response payload
    const responseData = {
      token: accessToken,
      refreshToken: refreshTokenRecord.plainToken,
      rememberToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        avatar: user.avatar,
        theme: user.theme || 'light'
      },
      group: {
        id: user.group_id,
        name: user.group_name,
        description: user.group_description,
        level: user.group_level,
        allow_admin_login: user.allow_admin_login,
        allow_web_login: user.allow_web_login
      },
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
 * Revoke refresh token and terminate session
 */
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await tokenService.revokeToken(refreshToken);
    }
    if (req.user?.id) {
      await tokenService.revokeAllUserTokens(req.user.id, 'refresh');
    }
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    return sendError(res, 'Failed to logout', 500, err.message);
  }
};

/**
 * POST /api/admin/auth/refresh
 * Exchange refresh token for fresh access token
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

    // Fetch user and group
    const [users] = await db.query(`
      SELECT u.id, u.username, u.email, u.group_id, u.status,
             g.name AS group_name, g.level AS group_level, g.allow_admin_login
      FROM aura_users u
      JOIN aura_groups g ON g.id = u.group_id
      WHERE u.id = ? AND u.deleted_at IS NULL AND u.status = 'active'
      LIMIT 1
    `, [tokenRow.user_id]);

    if (!users || users.length === 0 || Number(users[0].allow_admin_login) !== 1) {
      return sendError(res, 'User account not eligible for token refresh', 403);
    }

    const user = users[0];
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        group_id: user.group_id,
        role: user.group_name,
        level: user.group_level,
        area: 'admin'
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    return sendSuccess(res, {
      token: newAccessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY
    }, 'Access token renewed');
  } catch (err) {
    return sendError(res, 'Token refresh failed', 500, err.message);
  }
};

/**
 * GET /api/admin/auth/profile
 * Get authenticated user profile with live permissions & branch scopes
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone,
             u.avatar, u.theme, u.group_id, u.status, u.created_at, u.last_login_at,
             g.name AS group_name, g.description AS group_description, g.level AS group_level,
             g.allow_admin_login, g.allow_web_login
      FROM aura_users u
      JOIN aura_groups g ON g.id = u.group_id
      WHERE u.id = ? AND u.deleted_at IS NULL
      LIMIT 1
    `, [userId]);

    if (!users || users.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    const user = users[0];
    const [permissions, branches] = await Promise.all([
      accessControlService.getUserAllowedPermissions(user.id, user.group_id, user.group_level),
      accessControlService.getUserAllowedBranches(user.id, user.group_level)
    ]);

    return sendSuccess(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        avatar: user.avatar,
        theme: user.theme,
        last_login_at: user.last_login_at
      },
      group: {
        id: user.group_id,
        name: user.group_name,
        description: user.group_description,
        level: user.group_level,
        allow_admin_login: user.allow_admin_login
      },
      permissions,
      branches
    });
  } catch (err) {
    return sendError(res, 'Failed to fetch user profile', 500, err.message);
  }
};

/**
 * POST /api/admin/auth/forgot-password
 * Issue one-use 1-hour password reset token stored as SHA-256
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Registered email address is required', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const [users] = await db.query(
      'SELECT id, username, email FROM aura_users WHERE LOWER(email) = ? AND deleted_at IS NULL LIMIT 1',
      [cleanEmail]
    );

    if (!users || users.length === 0) {
      // Return generic success to prevent email enumeration
      return sendSuccess(res, null, 'If that email is registered, password reset instructions have been generated.');
    }

    const user = users[0];
    const { plainToken, expiresAt } = await tokenService.issueToken({
      userId: user.id,
      type: 'password_reset',
      area: 'admin',
      expiresInSeconds: 3600, // 1 hour validity
      ipAddress: req.ip
    });

    return sendSuccess(res, {
      resetToken: plainToken,
      expiresAt,
      message: 'Password reset token generated. In production, this is emailed to the user.'
    }, 'Password reset instructions generated');
  } catch (err) {
    return sendError(res, 'Failed to process forgot password request', 500, err.message);
  }
};

/**
 * POST /api/admin/auth/reset-password
 * Consume password reset token and update password with bcrypt
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return sendError(res, 'Token and new password are required', 400);
    }

    if (new_password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    const tokenRow = await tokenService.validateToken(token, 'password_reset');
    if (!tokenRow) {
      return sendError(res, 'Password reset token is invalid, expired, or already used', 400);
    }

    const hash = await bcrypt.hash(new_password, 10);

    // Update password, reset lockout and failure counts
    await db.query(`
      UPDATE aura_users
      SET password = ?,
          password_algo = 'bcrypt',
          failed_login_count = 0,
          locked_until = NULL,
          updated_at = NOW()
      WHERE id = ?
    `, [hash, tokenRow.user_id]);

    // Mark token as used
    await tokenService.markTokenUsed(tokenRow.id);

    // Invalidate any other active sessions
    await tokenService.revokeAllUserTokens(tokenRow.user_id);

    return sendSuccess(res, null, 'Password successfully reset. You may now log in with your new credentials.');
  } catch (err) {
    return sendError(res, 'Failed to reset password', 500, err.message);
  }
};
