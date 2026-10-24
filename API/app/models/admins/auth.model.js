const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");

/**
 * Admin Authentication Model
 * Ported from CodeIgniter 3 AURA_v1 (bpas/models/admin/Auth_model.php)
 */
class Auth_Model {
  /**
   * Find user by username or email with joined group permissions
   */
  static async findUserByIdentity(identity) {
    try {
      const cleanIdentity = identity.trim().toLowerCase();
      const sql = `
        SELECT u.*, 
               g.name AS role, g.name AS group_name, g.description AS role_description, g.level AS group_level,
               g.allow_admin_login, g.allow_web_login
        FROM aura_users u
        LEFT JOIN aura_groups g ON u.group_id = g.id
        WHERE (LOWER(u.username) = ? OR LOWER(u.email) = ?) AND u.deleted_at IS NULL
        LIMIT 1
      `;
      const [rows] = await db.query(sql, [cleanIdentity, cleanIdentity]);
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
      logError("Auth_Model.findUserByIdentity", err, null);
      throw err;
    }
  }

  /**
   * Find user by ID
   */
  static async findUserById(userId) {
    try {
      const sql = `
        SELECT u.*, 
               g.name AS role, g.name AS group_name, g.description AS role_description, g.level AS group_level,
               g.allow_admin_login, g.allow_web_login
        FROM aura_users u
        LEFT JOIN aura_groups g ON u.group_id = g.id
        WHERE u.id = ? AND u.deleted_at IS NULL
        LIMIT 1
      `;
      const [rows] = await db.query(sql, [userId]);
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
      logError("Auth_Model.findUserById", err, null);
      throw err;
    }
  }

  /**
   * Record a failed login attempt in aura_login_attempts
   */
  static async recordLoginAttempt(login, ipAddress, area = 'admin') {
    try {
      const sql = `
        INSERT INTO aura_login_attempts (login, ip_address, area, time)
        VALUES (?, ?, ?, UNIX_TIMESTAMP())
      `;
      await db.query(sql, [login.trim().toLowerCase(), ipAddress, area]);
    } catch (err) {
      logError("Auth_Model.recordLoginAttempt", err, null);
    }
  }

  /**
   * Count failed login attempts within window
   */
  static async countLoginAttempts(login, ipAddress, windowSeconds = 900) {
    try {
      const sinceTimestamp = Math.floor(Date.now() / 1000) - windowSeconds;
      const sql = `
        SELECT COUNT(*) AS total
        FROM aura_login_attempts
        WHERE (login = ? OR ip_address = ?) AND time >= ?
      `;
      const [rows] = await db.query(sql, [login.trim().toLowerCase(), ipAddress, sinceTimestamp]);
      return rows && rows[0] ? rows[0].total : 0;
    } catch (err) {
      logError("Auth_Model.countLoginAttempts", err, null);
      return 0;
    }
  }

  /**
   * Clear failed login attempts after successful authentication
   */
  static async clearLoginAttempts(login, ipAddress) {
    try {
      const sql = `
        DELETE FROM aura_login_attempts
        WHERE login = ? OR ip_address = ?
      `;
      await db.query(sql, [login.trim().toLowerCase(), ipAddress]);
    } catch (err) {
      logError("Auth_Model.clearLoginAttempts", err, null);
    }
  }

  /**
   * Temporarily lock user account due to excessive failed attempts
   */
  static async lockAccount(userId, lockMinutes = 15) {
    try {
      const sql = `
        UPDATE aura_users
        SET failed_login_count = failed_login_count + 1,
            locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
        WHERE id = ?
      `;
      await db.query(sql, [lockMinutes, userId]);
    } catch (err) {
      logError("Auth_Model.lockAccount", err, null);
    }
  }

  /**
   * Reset failed attempt counter and update last login telemetry
   */
  static async updateSuccessLogin(userId, ipAddress, userAgent = '') {
    try {
      const nowTs = Math.floor(Date.now() / 1000);
      const sqlUser = `
        UPDATE aura_users
        SET failed_login_count = 0,
            locked_until = NULL,
            last_login = ?,
            last_login_at = NOW(),
            last_login_ip = ?,
            last_ip_address = ?
        WHERE id = ?
      `;
      await db.query(sqlUser, [nowTs, ipAddress, ipAddress, userId]);

      const sqlLogin = `
        INSERT INTO aura_user_logins (user_id, login, area, success, ip_address, user_agent, time)
        VALUES (?, (SELECT username FROM aura_users WHERE id = ?), 'admin', 1, ?, ?, NOW())
      `;
      await db.query(sqlLogin, [userId, userId, ipAddress, userAgent]);
    } catch (err) {
      logError("Auth_Model.updateSuccessLogin", err, null);
    }
  }

  /**
   * Upgrade legacy SHA1/MD5 password hash to modern bcrypt
   */
  static async upgradePasswordHash(userId, bcryptHash) {
    try {
      const sql = `
        UPDATE aura_users
        SET password = ?,
            password_algo = 'bcrypt'
        WHERE id = ?
      `;
      await db.query(sql, [bcryptHash, userId]);
    } catch (err) {
      logError("Auth_Model.upgradePasswordHash", err, null);
    }
  }
}

module.exports = Auth_Model;
