/**
 * LOGIN TRACKER MODEL
 * ==================
 * Manages failed login attempt tracking and brute-force protection
 * 
 * Features:
 * - Track failed attempts by IP address
 * - Auto-block account after 3 failed attempts
 * - 5-minute block duration with auto-unlock
 * - Countdown timer for locked accounts
 * - Automatic cleanup of expired blocks
 */

const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");

// Configuration
const MAX_LOGIN_ATTEMPTS = 3;
const BLOCK_DURATION_MINUTES = 5;

/**
 * GET LOGIN ATTEMPTS
 * ==================
 * Retrieves the login attempt record for a specific IP
 * 
 * @param {string} ip - Client IP address 
 * @returns {Promise<Array>} - Array with attempt records
 */
exports.getLoginAttempts = async (ip) => {
    try {
        const sql = `
            SELECT id, ip_address, login, time
            FROM aura_login_attempts
            WHERE ip_address = INET_ATON(:ip)
            ORDER BY time DESC
            LIMIT 1
        `;
        const [rows] = await db.query(sql, { ip });
        return rows;
    } catch (err) {
        console.error("Error getting login attempts:", err);
        return [];
    }
};

/**
 * CREATE LOGIN ATTEMPT
 * ====================
 * Creates a new login attempt record for an IP
 * 
 * @param {string} ip - Client IP address
 * @param {string} login - Login type/identifier
 * @returns {Promise<object>} - Result object with insertId
 */
exports.createLoginAttempt = async (ip, login = "failed") => {
    try {
        const sql = `
            INSERT INTO aura_login_attempts 
            (ip_address, login, time)
            VALUES (INET_ATON(:ip), :login, NOW())
        `;
        const [result] = await db.query(sql, { ip, login });
        return result;
    } catch (err) {
        console.error("Error creating login attempt:", err);
        throw err;
    }
};

/**
 * COUNT RECENT ATTEMPTS
 * ====================
 * Counts failed attempts from an IP within the block duration
 * 
 * @param {string} ip - Client IP address
 * @returns {Promise<number>} - Number of recent attempts
 */
exports.countRecentAttempts = async (ip) => {
    try {
        const timeAgo = new Date(Date.now() - BLOCK_DURATION_MINUTES * 60 * 1000);
        
        const sql = `
            SELECT COUNT(*) as attempt_count
            FROM aura_login_attempts
            WHERE ip_address = INET_ATON(:ip)
            AND time > :timeAgo
        `;
        const [rows] = await db.query(sql, { 
            ip, 
            timeAgo: timeAgo.toISOString().slice(0, 19).replace('T', ' ')
        });
        
        return rows[0].attempt_count;
    } catch (err) {
        console.error("Error counting recent attempts:", err);
        return 0;
    }
};

/**
 * IS BLOCKED
 * ==========
 * Checks if an IP is currently blocked based on attempt count
 * 
 * @param {string} ip - Client IP address
 * @returns {Promise<boolean>} - true if blocked, false if not blocked
 */
exports.isBlocked = async (ip) => {
    try {
        const attemptCount = await exports.countRecentAttempts(ip);
        return attemptCount >= MAX_LOGIN_ATTEMPTS;
    } catch (err) {
        console.error("Error checking if blocked:", err);
        return false;
    }
};

/**
 * GET REMAINING BLOCK TIME
 * ========================
 * Calculates and returns the remaining block time with countdown
 * 
 * @param {string} ip - Client IP address
 * @returns {Promise<object|null>} - Object with timing information
 */
exports.getRemainingBlockTime = async (ip) => {
    try {
        const sql = `
            SELECT MIN(time) as first_attempt_time
            FROM aura_login_attempts
            WHERE ip_address = INET_ATON(:ip)
            ORDER BY time DESC
            LIMIT :maxAttempts
        `;
        const [rows] = await db.query(sql, { 
            ip, 
            maxAttempts: MAX_LOGIN_ATTEMPTS 
        });
        
        if (rows.length === 0 || !rows[0].first_attempt_time) {
            return null;
        }

        const firstAttempt = new Date(rows[0].first_attempt_time);
        const blockUntil = new Date(firstAttempt.getTime() + BLOCK_DURATION_MINUTES * 60 * 1000);
        const now = new Date();
        
        if (blockUntil <= now) {
            return null; // Block has expired
        }

        // Calculate remaining time
        const remainingMs = blockUntil - now;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingSecondsInMin = remainingSeconds % 60;

        return {
            blocked_until: blockUntil.toISOString().slice(0, 19).replace('T', ' '),
            remaining_seconds: remainingSecondsInMin,
            remaining_minutes: remainingMinutes,
            countdown_seconds: remainingSeconds,
            formatted: `${remainingMinutes}m ${remainingSecondsInMin}s`
        };
    } catch (err) {
        console.error("Error getting remaining block time:", err);
        return null;
    }
};

/**
 * RESET ATTEMPTS
 * ==============
 * Clears all attempt records for a successful login
 * 
 * @param {string} ip - Client IP address
 * @returns {Promise<object>} - Result object
 */
exports.resetAttempts = async (ip) => {
    try {
        const sql = `
            DELETE FROM aura_login_attempts
            WHERE ip_address = INET_ATON(:ip)
        `;
        const [result] = await db.query(sql, { ip });
        return result;
    } catch (err) {
        console.error("Error resetting attempts:", err);
        throw err;
    }
};

/**
 * LOG USER LOGIN
 * ==============
 * Records successful login in audit trail
 * 
 * @param {number} user_id - User ID from aura_users table
 * @param {number} company_id - Company/Organization ID
 * @param {string} ip_address - Client IP address
 * @param {string} login_type - Type of login (e.g., "web", "mobile", "api")
 * @returns {Promise<object>} - Result object with insertId
 */
exports.logUserLogin = async (user_id, company_id, ip_address, login_type = "web") => {
    try {
        // You might need a separate table for successful logins
        // For now, we'll just log to aura_login_attempts with login_type
        const sql = `
            INSERT INTO aura_login_attempts
            (ip_address, login, time)
            VALUES (INET_ATON(:ip_address), :login_type, NOW())
        `;
        const [result] = await db.query(sql, {
            ip_address,
            login_type: `success_${login_type}`
        });
        return result;
    } catch (err) {
        console.error("Error logging user login:", err);
        throw err;
    }
};

/**
 * CLEANUP OLD ATTEMPTS
 * ======================
 * Removes old attempt records from database
 * 
 * @returns {Promise<object>} - Result object with affectedRows
 */
exports.cleanupOldAttempts = async () => {
    try {
        // Keep only last 24 hours of attempts
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const sql = `
            DELETE FROM aura_login_attempts
            WHERE time < :cutoff
        `;
        const [result] = await db.query(sql, { 
            cutoff: cutoff.toISOString().slice(0, 19).replace('T', ' ')
        });
        console.log(`Cleaned up ${result.affectedRows} old attempt records`);
        return result;
    } catch (err) {
        console.error("Error cleaning up old attempts:", err);
        throw err;
    }
};

module.exports = exports;