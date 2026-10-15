const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db, access_token_key } = require('../../config/utill/helper');
const { sendSuccess, sendError } = require('../../config/utill/response');
const { logActivity } = require('../../services/auditLogger.service');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';
const TOKEN_EXPIRY = '24h';
const REFRESH_EXPIRY_DAYS = 7;

/**
 * POST /api/admin/auth/login
 * User login with Bcrypt / SHA1 fallback, JWT issuance, and session recording
 */
exports.login = async (req, res) => {
  try {
    const { username, password, remember_me } = req.body;
    if (!username || !password) {
      return sendError(res, 'Username and password are required', 400);
    }

    const query = `
      SELECT id, username, email, password, first_name, last_name, phone,
             role, level, permissions, status, active, theme, language, avatar,
             biller_id, warehouse_id
      FROM aura_users
      WHERE (username = ? OR email = ?) AND deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await db.query(query, [username.trim(), username.trim()]);

    if (!rows || rows.length === 0) {
      return sendError(res, 'Invalid credentials. User does not exist.', 401);
    }

    const user = rows[0];

    // Check account status
    if (user.status !== 'active' && user.active !== 1) {
      return sendError(res, 'Account is currently deactivated or suspended. Please contact admin.', 403);
    }

    // Password verification (Dual-algorithm: modern Bcrypt + legacy Ion Auth SHA1)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (_) {
      isMatch = false;
    }

    if (!isMatch && user.password && user.password.length === 40) {
      const salt = user.password.substring(0, 10);
      const candidate = salt + crypto.createHash('sha1').update(salt + password).digest('hex').substring(0, 30);
      if (candidate === user.password) {
        isMatch = true;
        // Transparently upgrade legacy SHA1 hash to modern bcrypt
        const modernHash = await bcrypt.hash(password, 10);
        await db.query('UPDATE aura_users SET password = ? WHERE id = ?', [modernHash, user.id]);
      }
    }

    if (!isMatch) {
      return sendError(res, 'Invalid credentials. Incorrect password.', 401);
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

    // Generate JWT access token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      level: user.level
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Record session in aura_user_sessions
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (remember_me ? 30 : REFRESH_EXPIRY_DAYS));

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] || '').slice(0, 255);

    await db.query(`
      INSERT INTO aura_user_sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [sessionId, user.id, refreshTokenHash, String(ip).slice(0, 45), userAgent, expiresAt]);

    // Update user last login
    await db.query(`
      UPDATE aura_users
      SET last_login_at = NOW(), last_login_ip = ?
      WHERE id = ?
    `, [String(ip).slice(0, 45), user.id]);

    // Log audit activity
    req.user = user;
    await logActivity({
      req,
      action: 'login',
      tableName: 'aura_users',
      recordId: user.id,
      newValues: { ip, userAgent }
    });

    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role,
      level: user.level,
      permissions: parsedPerms,
      theme: user.theme || 'light',
      language: user.language || 'english',
      avatar: user.avatar,
      biller_id: user.biller_id,
      warehouse_id: user.warehouse_id
    };

    return sendSuccess(res, {
      token: accessToken,
      refreshToken,
      user: userProfile,
      profile: userProfile
    }, 'Authentication successful');
  } catch (err) {
    console.error('[AdminAuth Login Error]', err);
    return sendError(res, 'Internal server error during authentication', 500, err.message);
  }
};

/**
 * POST /api/admin/auth/logout
 * Terminate user session
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.user_id;
    if (userId) {
      await db.query('DELETE FROM aura_user_sessions WHERE user_id = ?', [userId]);
      await logActivity({
        req,
        action: 'logout',
        tableName: 'aura_users',
        recordId: userId
      });
    }
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    return sendError(res, 'Failed to log out', 500, err.message);
  }
};

/**
 * POST /api/admin/auth/refresh
 * Refresh access token using refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 'Refresh token required', 400);
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const [sessions] = await db.query(`
      SELECT s.*, u.username, u.email, u.role, u.level, u.status
      FROM aura_user_sessions s
      JOIN aura_users u ON s.user_id = u.id
      WHERE s.token_hash = ? AND s.expires_at > NOW() AND u.deleted_at IS NULL
      LIMIT 1
    `, [tokenHash]);

    if (!sessions || sessions.length === 0) {
      return sendError(res, 'Invalid or expired refresh token', 401);
    }

    const session = sessions[0];
    const newAccessToken = jwt.sign({
      id: session.user_id,
      username: session.username,
      email: session.email,
      role: session.role,
      level: session.level
    }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return sendSuccess(res, { token: newAccessToken }, 'Token refreshed successfully');
  } catch (err) {
    return sendError(res, 'Failed to refresh token', 500, err.message);
  }
};

/**
 * GET /api/admin/auth/profile
 * Get authenticated user profile & permissions
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthenticated', 401);
    }

    const [rows] = await db.query(`
      SELECT id, username, email, first_name, last_name, phone,
             role, level, permissions, status, theme, language, avatar,
             biller_id, warehouse_id, last_login_at
      FROM aura_users
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `, [userId]);

    if (!rows || rows.length === 0) {
      return sendError(res, 'User not found', 404);
    }

    const user = rows[0];
    let parsedPerms = {};
    if (user.permissions) {
      try {
        parsedPerms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
      } catch (_) {
        parsedPerms = {};
      }
    }
    user.permissions = parsedPerms;

    return sendSuccess(res, user, 'Profile retrieved');
  } catch (err) {
    return sendError(res, 'Failed to retrieve profile', 500, err.message);
  }
};

/**
 * POST /api/admin/auth/forgot-password
 * Send or generate password reset verification code
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Email address is required', 400);
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const [rows] = await db.query('SELECT id, username FROM aura_users WHERE email = ? LIMIT 1', [email.trim()]);

    if (rows && rows.length > 0) {
      await db.query(`
        UPDATE aura_users
        SET forgotten_password_code = ?, forgotten_password_time = UNIX_TIMESTAMP()
        WHERE id = ?
      `, [resetCode, rows[0].id]);
    }

    // Always return success to prevent email enumeration
    return sendSuccess(res, { resetCode }, 'Password reset instructions sent (Code simulation for local testing: ' + resetCode + ')');
  } catch (err) {
    return sendError(res, 'Failed to process password reset', 500, err.message);
  }
};

/**
 * POST /api/admin/auth/reset-password
 * Reset user password with code
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) {
      return sendError(res, 'Email, reset code, and new password are required', 400);
    }

    const [rows] = await db.query(`
      SELECT id FROM aura_users
      WHERE email = ? AND forgotten_password_code = ?
      LIMIT 1
    `, [email.trim(), code.trim()]);

    if (!rows || rows.length === 0) {
      return sendError(res, 'Invalid reset code or email address', 400);
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await db.query(`
      UPDATE aura_users
      SET password = ?, forgotten_password_code = NULL, forgotten_password_time = NULL
      WHERE id = ?
    `, [newHash, rows[0].id]);

    return sendSuccess(res, null, 'Password successfully reset. You may now sign in.');
  } catch (err) {
    return sendError(res, 'Failed to reset password', 500, err.message);
  }
};
