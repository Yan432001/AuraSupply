const { db, DB_PREFIX } = require("./helper");

class Permissions {
    constructor() {
        this.table = `${DB_PREFIX}permissions`;
        this.groupsTable = `${DB_PREFIX}groups`;
        this.usersTable = `${DB_PREFIX}users`;
    }

    // Check if user has specific permission
    async hasPermission(userId, permission) {
        try {
            const sql = `
                SELECT p.* 
                FROM ${this.table} p
                JOIN ${this.usersTable} u ON p.group_id = u.group_id
                WHERE u.id = :userId
                AND p.${permission} = 1
                LIMIT 1
            `;
            
            const [rows] = await db.query(sql, { userId });
            return rows.length > 0;
        } catch (error) {
            console.error("Error checking permission:", error);
            return false;
        }
    }

    // Get all permissions for a user
    async getUserPermissions(userId) {
        try {
            const sql = `
                SELECT p.* 
                FROM ${this.table} p
                JOIN ${this.usersTable} u ON p.group_id = u.group_id
                WHERE u.id = :userId
                LIMIT 1
            `;
            
            const [rows] = await db.query(sql, { userId });
            return rows.length > 0 ? rows[0] : {};
        } catch (error) {
            console.error("Error getting user permissions:", error);
            return {};
        }
    }

    // Get all permissions for a group
    async getGroupPermissions(groupId) {
        try {
            const sql = `SELECT * FROM ${this.table} WHERE group_id = :groupId LIMIT 1`;
            const [rows] = await db.query(sql, { groupId });
            return rows.length > 0 ? rows[0] : {};
        } catch (error) {
            console.error("Error getting group permissions:", error);
            return {};
        }
    }

    // Update group permissions
    async updateGroupPermissions(groupId, permissions) {
        try {
            // Check if permissions exist for this group
            const checkSql = `SELECT id FROM ${this.table} WHERE group_id = :groupId`;
            const [existing] = await db.query(checkSql, { groupId });

            let result;
            if (existing.length > 0) {
                // Update existing permissions
                const updateFields = Object.keys(permissions)
                    .map(key => `${key} = :${key}`)
                    .join(', ');
                
                const updateSql = `
                    UPDATE ${this.table} 
                    SET ${updateFields}
                    WHERE group_id = :groupId
                `;
                
                result = await db.query(updateSql, { ...permissions, groupId });
            } else {
                // Insert new permissions
                const columns = ['group_id', ...Object.keys(permissions)].join(', ');
                const values = ['groupId', ...Object.keys(permissions).map(key => `:${key}`)].join(', ');
                
                const insertSql = `
                    INSERT INTO ${this.table} (${columns})
                    VALUES (${values})
                `;
                
                result = await db.query(insertSql, { groupId, ...permissions });
            }
            
            return { success: true };
        } catch (error) {
            console.error("Error updating permissions:", error);
            return { success: false, error: error.message };
        }
    }

    // Get all permission keys (columns) from the table
    async getPermissionKeys() {
        try {
            const sql = `SHOW COLUMNS FROM ${this.table} WHERE Field NOT IN ('id', 'group_id')`;
            const [columns] = await db.query(sql);
            return columns.map(col => col.Field);
        } catch (error) {
            console.error("Error getting permission keys:", error);
            return [];
        }
    }

    // Check multiple permissions at once
    async checkPermissions(userId, permissions) {
        try {
            const userPerms = await this.getUserPermissions(userId);
            const results = {};
            
            for (const perm of permissions) {
                results[perm] = userPerms[perm] === 1;
            }
            
            return results;
        } catch (error) {
            console.error("Error checking multiple permissions:", error);
            return {};
        }
    }
}

module.exports = new Permissions();