const crypto = require('crypto');
const authConfig = require('../config/auth.config');
const { db } = require('../config/utill/helper');

/**
 * In-memory fast activity cache:
 * Map of sessionKey -> { userId, area, lastActivity: number, expiresAt: number }
 */
const activityCache = new Map();

// Helper to hash token for fast lookups
function hashToken(plainToken) {
  if (!plainToken) return '';
  return crypto.createHash('sha256').update(plainToken).digest('hex');
}

/**
 * Register or update active session in memory and DB
 */
async function registerSession({ userId, token, area = 'admin', remember = false, ipAddress = '', userAgent = '' }) {
  const tokenHash = hashToken(token);
  const now = Date.now();
  const maxAgeSeconds = remember ? authConfig.session.rememberExpiration : authConfig.session.sessExpiration;
  const expiresAt = new Date(now + maxAgeSeconds * 1000);

  // Store in memory activity tracker
  activityCache.set(tokenHash, {
    userId,
    area,
    lastActivity: now,
    expiresAt: expiresAt.getTime(),
    remember
  });

  // Persist session to database (aura_user_sessions)
  try {
    await db.query(`
      INSERT INTO aura_user_sessions (
        user_id, session_token, ip_address, user_agent, expires_at, created_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        expires_at = VALUES(expires_at),
        last_seen_at = NOW(),
        revoked_at = NULL
    `, [userId, tokenHash, ipAddress, userAgent, expiresAt]);
  } catch (err) {
    console.warn('[SessionService] Warning persisting session to aura_user_sessions:', err.message);
  }
}

/**
 * Validate inactivity timeout for an active session (Requirement 5)
 * @returns {{ valid: boolean, reason?: string, idleSeconds?: number }}
 */
async function validateInactivity(token) {
  if (!token) {
    return { valid: false, reason: 'NO_TOKEN' };
  }

  const tokenHash = hashToken(token);
  const now = Date.now();
  const session = activityCache.get(tokenHash);

  const timeoutMs = authConfig.session.inactivityTimeout * 1000;

  if (session) {
    const idleMs = now - session.lastActivity;
    if (idleMs > timeoutMs) {
      // Inactive beyond configured idle window -> Expire session
      activityCache.delete(tokenHash);
      await revokeSession(token);
      return {
        valid: false,
        reason: 'INACTIVITY_TIMEOUT',
        idleSeconds: Math.floor(idleMs / 1000),
        message: 'Session has expired due to inactivity. Please log in again.'
      };
    }

    // Refresh last activity
    session.lastActivity = now;
    return { valid: true, idleSeconds: Math.floor(idleMs / 1000) };
  }

  // Not in memory cache -> Check aura_user_sessions table
  try {
    const [rows] = await db.query(`
      SELECT id, user_id, expires_at, revoked_at, last_seen_at
      FROM aura_user_sessions
      WHERE session_token = ?
      LIMIT 1
    `, [tokenHash]);

    if (!rows || rows.length === 0) {
      // Session not tracked or already deleted
      return { valid: true, idleSeconds: 0 };
    }

    const dbSession = rows[0];
    if (dbSession.revoked_at) {
      return { valid: false, reason: 'REVOKED', message: 'Session has been revoked.' };
    }

    if (new Date(dbSession.expires_at) < new Date()) {
      return { valid: false, reason: 'EXPIRED', message: 'Session token has expired.' };
    }

    const lastSeenTime = dbSession.last_seen_at ? new Date(dbSession.last_seen_at).getTime() : now;
    const idleMs = now - lastSeenTime;

    if (idleMs > timeoutMs) {
      await revokeSession(token);
      return {
        valid: false,
        reason: 'INACTIVITY_TIMEOUT',
        idleSeconds: Math.floor(idleMs / 1000),
        message: 'Session has expired due to inactivity. Please log in again.'
      };
    }

    // Rehydrate into memory cache
    activityCache.set(tokenHash, {
      userId: dbSession.user_id,
      area: 'admin',
      lastActivity: now,
      expiresAt: new Date(dbSession.expires_at).getTime()
    });

    return { valid: true, idleSeconds: Math.floor(idleMs / 1000) };
  } catch (err) {
    console.warn('[SessionService] Inactivity check error:', err.message);
    return { valid: true, idleSeconds: 0 };
  }
}

/**
 * Touch activity to keep session alive during user interaction
 */
function touchActivity(token) {
  if (!token) return;
  const tokenHash = hashToken(token);
  const session = activityCache.get(tokenHash);
  if (session) {
    session.lastActivity = Date.now();
  }
}

/**
 * Revoke session completely (on logout or expiration)
 */
async function revokeSession(token) {
  if (!token) return;
  const tokenHash = hashToken(token);
  activityCache.delete(tokenHash);

  try {
    await db.query(`
      UPDATE aura_user_sessions
      SET revoked_at = NOW()
      WHERE session_token = ?
    `, [tokenHash]);
  } catch (err) {
    console.warn('[SessionService] Revoke DB session warning:', err.message);
  }
}

/**
 * Set HttpOnly, Secure, SameSite Cookie on Express Response (Requirement 6)
 */
function setSessionCookie(res, area, token, remember = false) {
  const isProd = authConfig.session.cookieSecure;
  const cookieName = area === 'admin'
    ? authConfig.session.adminCookieName
    : authConfig.session.webCookieName;

  const maxAge = (remember
    ? authConfig.session.rememberExpiration
    : authConfig.session.sessExpiration) * 1000;

  const cookieOptions = {
    httpOnly: authConfig.session.cookieHttpOnly,
    secure: isProd,
    sameSite: authConfig.session.cookieSameSite,
    path: authConfig.session.cookiePath,
    maxAge
  };

  if (authConfig.session.cookieDomain) {
    cookieOptions.domain = authConfig.session.cookieDomain;
  }

  res.cookie(cookieName, token, cookieOptions);
}

/**
 * Clear Session Cookie on Express Response
 */
function clearSessionCookie(res, area) {
  const cookieName = area === 'admin'
    ? authConfig.session.adminCookieName
    : authConfig.session.webCookieName;

  const cookieOptions = {
    httpOnly: authConfig.session.cookieHttpOnly,
    secure: authConfig.session.cookieSecure,
    sameSite: authConfig.session.cookieSameSite,
    path: authConfig.session.cookiePath
  };

  if (authConfig.session.cookieDomain) {
    cookieOptions.domain = authConfig.session.cookieDomain;
  }

  res.clearCookie(cookieName, cookieOptions);
}

/**
 * For test automation: simulate idle timeout
 */
function expireSessionForTesting(token) {
  if (!token) return;
  const tokenHash = hashToken(token);
  const session = activityCache.get(tokenHash);
  if (session) {
    session.lastActivity = Date.now() - (authConfig.session.inactivityTimeout + 60) * 1000;
  }
}

module.exports = {
  registerSession,
  validateInactivity,
  touchActivity,
  revokeSession,
  setSessionCookie,
  clearSessionCookie,
  hashToken,
  expireSessionForTesting
};
