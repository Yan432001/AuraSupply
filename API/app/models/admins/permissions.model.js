/**
 * PERMISSIONS MODEL
 * =================
 * Manages user and group permissions system
 * Supports 770+ granular permissions per group
 * 
 * Features:
 * - Get/Update group permissions
 * - Get user permissions via group
 * - Check single or multiple permissions
 * - Bulk permission updates
 * - Permission availability listing
 */

const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");

/**
 * GET GROUP PERMISSIONS
 * =====================
 * Retrieves all permissions for a specific group
 * Returns 770+ permission columns with their values (0 or 1)
 * 
 * @param {number} group_id - Group ID from aura_groups table
 * @returns {Promise<Array>} - Array with permission record or empty array
 */
exports.getGroupPermissions = async (group_id) => {
    try {
        const sql = `
            SELECT * FROM aura_permissions
            WHERE group_id = :group_id
            LIMIT 1
        `;
        const [rows] = await db.query(sql, { group_id });
        return rows;
    } catch (err) {
        console.error("Error getting group permissions:", err);
        return [];
    }
};

/**
 * GET USER PERMISSIONS
 * ====================
 * Retrieves permissions for a user by joining users and permissions tables
 * Uses the user's group_id to fetch associated permissions
 * 
 * @param {number} user_id - User ID from aura_users table
 * @returns {Promise<Array>} - Array with user's permission record or empty array
 */
exports.getUserPermissions = async (user_id) => {
    try {
        const sql = `
            SELECT p.* FROM aura_permissions p
            INNER JOIN aura_users u ON u.group_id = p.group_id
            WHERE u.id = :user_id
            LIMIT 1
        `;
        const [rows] = await db.query(sql, { user_id });
        return rows;
    } catch (err) {
        console.error("Error getting user permissions:", err);
        return [];
    }
};

/**
 * HAS PERMISSION
 * ==============
 * Checks if a user's group has a specific permission enabled
 * Returns true/false for single permission check
 * 
 * @param {number} group_id - Group ID from aura_groups table
 * @param {string} permission_key - Permission key (e.g., "products-add", "sales-edit")
 * @returns {Promise<boolean>} - true if permission is 1, false otherwise
 */
exports.hasPermission = async (group_id, permission_key) => {
    try {
        // Sanitize permission key (only allow alphanumeric, -, _)
        if (!/^[a-zA-Z0-9\-_]+$/.test(permission_key)) {
            return false;
        }

        const permissions = await exports.getGroupPermissions(group_id);
        
        if (permissions.length === 0) {
            return false;
        }

        const permissionValue = permissions[0][permission_key];
        return permissionValue === 1 ? true : false;
    } catch (err) {
        console.error("Error checking permission:", err);
        return false;
    }
};

/**
 * CREATE GROUP PERMISSIONS
 * ========================
 * Creates a new permissions record for a group
 * Initializes all permissions to 0 (disabled)
 * 
 * @param {number} group_id - Group ID to create permissions for
 * @returns {Promise<object>} - Result object with insertId
 */
exports.createGroupPermissions = async (group_id) => {
    try {
        // Get list of all permission columns from INFORMATION_SCHEMA
        const sql = `
            INSERT INTO aura_permissions (group_id)
            VALUES (:group_id)
        `;
        const [result] = await db.query(sql, { group_id });
        return result;
    } catch (err) {
        console.error("Error creating group permissions:", err);
        throw err;
    }
};

/**
 * UPDATE PERMISSION
 * =================
 * Updates a single permission value for a group
 * Used for toggling individual permissions
 * 
 * @param {number} group_id - Group ID from aura_groups table
 * @param {string} permission_key - Permission key to update
 * @param {number} value - Value to set (0 or 1)
 * @returns {Promise<object>} - Result object
 */
exports.updatePermission = async (group_id, permission_key, value) => {
    try {
        // Sanitize permission key
        if (!/^[a-zA-Z0-9\-_]+$/.test(permission_key)) {
            throw new Error("Invalid permission key");
        }

        // Build dynamic SQL with proper backticks for column names
        const sql = `
            UPDATE aura_permissions
            SET \`${permission_key}\` = :value
            WHERE group_id = :group_id
        `;
        const [result] = await db.query(sql, { value: value ? 1 : 0, group_id });
        return result;
    } catch (err) {
        console.error("Error updating permission:", err);
        throw err;
    }
};

/**
 * UPDATE BULK PERMISSIONS
 * =======================
 * Updates multiple permissions in a single operation
 * Accepts object with permission_key: value pairs
 * Reduces database round-trips for multiple updates
 * 
 * @param {number} group_id - Group ID from aura_groups table
 * @param {object} permissions - Object with {permission_key: value, ...}
 * @returns {Promise<object>} - Result object
 */
exports.updateBulkPermissions = async (group_id, permissions) => {
    try {
        // Build SET clause dynamically
        const setClause = Object.keys(permissions)
            .map(key => {
                if (!/^[a-zA-Z0-9\-_]+$/.test(key)) {
                    throw new Error(`Invalid permission key: ${key}`);
                }
                return `\`${key}\` = ${permissions[key] ? 1 : 0}`;
            })
            .join(", ");

        const sql = `UPDATE aura_permissions SET ${setClause} WHERE group_id = :group_id`;
        const [result] = await db.query(sql, { group_id });
        return result;
    } catch (err) {
        console.error("Error updating bulk permissions:", err);
        throw err;
    }
};

/**
 * GET AVAILABLE PERMISSIONS
 * ==========================
 * Lists all available permission keys in the system
 * Retrieved from aura_permissions table structure
 * Used for permission management UI/API
 * 
 * @returns {Promise<Array>} - Array of all permission column names
 */
exports.getAvailablePermissions = async () => {
    try {
        const sql = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'aura_permissions'
            AND TABLE_SCHEMA = DATABASE()
            AND COLUMN_NAME NOT IN ('id', 'group_id')
            ORDER BY COLUMN_NAME
        `;
        const [rows] = await db.query(sql);
        return rows.map(row => row.COLUMN_NAME);
    } catch (err) {
        console.error("Error getting available permissions:", err);
        return [];
    }
};

/**
 * CHECK MULTIPLE PERMISSIONS
 * ===========================
 * Checks multiple permissions for a user at once
 * More efficient than checking permissions individually
 * 
 * @param {number} user_id - User ID from aura_users table
 * @param {Array<string>} permission_keys - Array of permission keys to check
 * @returns {Promise<object>} - Object with {permission_key: boolean, ...}
 * 
 * Example:
 * checkMultiplePermissions(5, ['products-add', 'sales-edit'])
 * Returns: { 'products-add': true, 'sales-edit': false }
 */
exports.checkMultiplePermissions = async (user_id, permission_keys) => {
    try {
        const userPermissions = await exports.getUserPermissions(user_id);
        
        if (userPermissions.length === 0) {
            // Return all false if no permissions found
            const result = {};
            permission_keys.forEach(key => {
                result[key] = false;
            });
            return result;
        }

        const permissions = userPermissions[0];
        const result = {};

        permission_keys.forEach(key => {
            if (!/^[a-zA-Z0-9\-_]+$/.test(key)) {
                result[key] = false;
                return;
            }
            result[key] = permissions[key] === 1 ? true : false;
        });

        return result;
    } catch (err) {
        console.error("Error checking multiple permissions:", err);
        return {};
    }
};

/**
 * DELETE GROUP PERMISSIONS
 * ========================
 * Deletes permission record for a group
 * Used when removing a group or resetting permissions
 * 
 * @param {number} group_id - Group ID to delete permissions for
 * @returns {Promise<object>} - Result object
 */
exports.deleteGroupPermissions = async (group_id) => {
    try {
        const sql = `
            DELETE FROM aura_permissions
            WHERE group_id = :group_id
        `;
        const [result] = await db.query(sql, { group_id });
        return result;
    } catch (err) {
        console.error("Error deleting group permissions:", err);
        throw err;
    }
};

module.exports = exports;
