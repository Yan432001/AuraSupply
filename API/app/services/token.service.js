const crypto = require('crypto');
const { db } = require('../config/utill/helper');

/**
 * Hash a plain token using SHA-256 for secure database storage
 * Only the SHA-256 hash is stored in aura_user_tokens
 */
function hashToken(plainToken) {
  return crypto.createHash('sha256').update(plainToken).digest('hex');
}

/**
 * Generate a cryptographically secure random token string
 */
function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Issue and persist a token in aura_user_tokens
 * @param {Object} params
 * @param {number} params.userId
 * @param {'refresh'|'remember'|'password_reset'|'email_verify'} params.type
 * @param {'admin'|'website'} params.area
 * @param {number} params.expiresInSeconds
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @returns {Promise<{ plainToken: string, expiresAt: Date }>}
 */
async function issueToken({
  userId,
  type,
  area = 'admin',
  expiresInSeconds = 7 * 24 * 3600, // Default 7 days
  ipAddress = null,
  userAgent = null
}) {
  const plainToken = generateRandomToken(32);
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  await db.query(`
    INSERT INTO aura_user_tokens (
      user_id, type, area, token_hash, ip_address, user_agent, expires_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `, [userId, type, area, tokenHash, ipAddress, userAgent, expiresAt]);

  return { plainToken, expiresAt };
}

/**
 * Validate a plain token against its SHA-256 hash in aura_user_tokens
 * @param {string} plainToken
 * @param {'refresh'|'remember'|'password_reset'|'email_verify'} type
 * @param {'admin'|'website'} [area]
 * @returns {Promise<Object|null>} user token record or null
 */
async function validateToken(plainToken, type, area = null) {
  if (!plainToken) return null;
  const tokenHash = hashToken(plainToken);

  let sql = `
    SELECT id, user_id, type, area, expires_at, used_at, revoked_at
    FROM aura_user_tokens
    WHERE token_hash = ? AND type = ? AND revoked_at IS NULL AND used_at IS NULL AND expires_at > NOW()
    LIMIT 1
  `;
  const params = [tokenHash, type];

  if (area) {
    sql = sql.replace('LIMIT 1', 'AND area = ? LIMIT 1');
    params.push(area);
  }

  const [rows] = await db.query(sql, params);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

/**
 * Mark a token as used (e.g. for one-time password reset or email verification)
 */
async function markTokenUsed(tokenId) {
  await db.query('UPDATE aura_user_tokens SET used_at = NOW() WHERE id = ?', [tokenId]);
}

/**
 * Revoke a token (e.g. upon logout)
 */
async function revokeToken(plainToken) {
  if (!plainToken) return;
  const tokenHash = hashToken(plainToken);
  await db.query('UPDATE aura_user_tokens SET revoked_at = NOW() WHERE token_hash = ?', [tokenHash]);
}

/**
 * Revoke all tokens of a specific type for a user (e.g. logout all sessions or password reset)
 */
async function revokeAllUserTokens(userId, type = null) {
  if (type) {
    await db.query('UPDATE aura_user_tokens SET revoked_at = NOW() WHERE user_id = ? AND type = ? AND revoked_at IS NULL', [userId, type]);
  } else {
    await db.query('UPDATE aura_user_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [userId]);
  }
}

module.exports = {
  hashToken,
  generateRandomToken,
  issueToken,
  validateToken,
  markTokenUsed,
  revokeToken,
  revokeAllUserTokens
};
