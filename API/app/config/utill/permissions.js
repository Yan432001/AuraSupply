const { db, DB_PREFIX } = require("./helper");

class Permissions {
    constructor() {
        this.table = `${DB_PREFIX}permissions`;
        this.groupsTable = `${DB_PREFIX}groups`;
        this.usersTable = `${DB_PREFIX}users`;
    }

    // Check if user has specific permission (Owner and Admin bypass all checks)
    async hasPermission(userId, permissionKey) {
        try {
            const [users] = await db.query(
                `SELECT u.group_id, g.name AS role, g.level 
                 FROM ${this.usersTable} u 
                 JOIN ${this.groupsTable} g ON g.id = u.group_id 
                 WHERE u.id = ? LIMIT 1`,
                [userId]
            );

            if (!users || users.length === 0) return false;
            const u = users[0];

            // Owner (level 1 or role 'owner') and Admin (level 2 or role 'admin') have full access
            if (u.level === 1 || u.level === 2 || u.role === 'owner' || u.role === 'admin' || u.group_id === 1) {
                return true;
            }

            // Check specific permission column in aura_permissions
            const cleanKey = permissionKey.replace(/[^a-zA-Z0-9_\-]/g, '');
            const sql = `SELECT \`${cleanKey}\` AS allowed FROM ${this.table} WHERE group_id = ? LIMIT 1`;
            const [rows] = await db.query(sql, [u.group_id]);

            return rows && rows.length > 0 && Number(rows[0].allowed) === 1;
        } catch (error) {
            console.error(`[Permissions.hasPermission error for user ${userId}, key ${permissionKey}]:`, error.message);
            return false;
        }
    }

    // Get complete permissions map (GP) for a user
    async getUserPermissions(userId) {
        try {
            const [users] = await db.query(
                `SELECT u.group_id, g.name AS role, g.level 
                 FROM ${this.usersTable} u 
                 JOIN ${this.groupsTable} g ON g.id = u.group_id 
                 WHERE u.id = ? LIMIT 1`,
                [userId]
            );

            if (!users || users.length === 0) return {};
            const u = users[0];

            return await this.getGroupPermissions(u.group_id);
        } catch (error) {
            console.error("[Permissions.getUserPermissions error]:", error.message);
            return {};
        }
    }

    // Get all permissions for a group ($this->GP in CodeIgniter 3)
    async getGroupPermissions(groupId) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM ${this.table} WHERE group_id = ? LIMIT 1`,
                [groupId]
            );

            if (rows && rows.length > 0) {
                const perms = rows[0];
                delete perms.id;
                return perms;
            }

            // If no row exists yet for this group, return default object with all keys = 0
            const keys = await this.getPermissionKeys();
            const defaultMap = { group_id: Number(groupId) };
            for (const k of keys) {
                defaultMap[k] = 0;
            }
            return defaultMap;
        } catch (error) {
            console.error("[Permissions.getGroupPermissions error]:", error.message);
            return {};
        }
    }

    // Update group permissions (cloning System_settings::permissions($id) in CI3)
    async updateGroupPermissions(groupId, permissionsData) {
        try {
            const cleanGroupId = parseInt(groupId, 10);
            if (!cleanGroupId) {
                throw new Error("Invalid group ID");
            }

            // Get valid column names in aura_permissions
            const validKeys = await this.getPermissionKeys();
            const validKeySet = new Set(validKeys);

            const filteredData = {};
            for (const [key, val] of Object.entries(permissionsData)) {
                if (validKeySet.has(key)) {
                    filteredData[key] = val === true || val === 1 || val === '1' ? 1 : 0;
                }
            }

            if (Object.keys(filteredData).length === 0) {
                return { success: true, updatedCount: 0 };
            }

            // Check if row exists for this group
            const [existing] = await db.query(
                `SELECT id FROM ${this.table} WHERE group_id = ? LIMIT 1`,
                [cleanGroupId]
            );

            if (existing && existing.length > 0) {
                // Update existing row
                const setClauses = [];
                const params = [];
                for (const [key, val] of Object.entries(filteredData)) {
                    setClauses.push(`\`${key}\` = ?`);
                    params.push(val);
                }
                params.push(cleanGroupId);

                const updateSql = `UPDATE ${this.table} SET ${setClauses.join(', ')} WHERE group_id = ?`;
                await db.query(updateSql, params);
            } else {
                // Insert new row
                const columns = ['group_id', ...Object.keys(filteredData).map(k => `\`${k}\``)];
                const placeholders = ['?', ...Object.keys(filteredData).map(() => '?')];
                const params = [cleanGroupId, ...Object.values(filteredData)];

                const insertSql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
                await db.query(insertSql, params);
            }

            return { success: true, updatedCount: Object.keys(filteredData).length };
        } catch (error) {
            console.error("[Permissions.updateGroupPermissions error]:", error.message);
            return { success: false, error: error.message };
        }
    }

    // Get all permission keys (columns) from aura_permissions
    async getPermissionKeys() {
        try {
            const [columns] = await db.query(
                `SHOW COLUMNS FROM ${this.table} WHERE Field NOT IN ('id', 'group_id')`
            );
            return columns.map(col => col.Field);
        } catch (error) {
            console.error("[Permissions.getPermissionKeys error]:", error.message);
            return [];
        }
    }

    // Categorize permission keys by module (Products, Sales, Purchases, Customers, etc.)
    async getCategorizedPermissions(groupId = null) {
        try {
            const keys = await this.getPermissionKeys();
            let currentPerms = {};
            if (groupId) {
                currentPerms = await this.getGroupPermissions(groupId);
            }

            const categories = {
                products: { label: "Products & Inventory", keys: [] },
                sales: { label: "Sales & Invoicing", keys: [] },
                purchases: { label: "Purchases & Expenses", keys: [] },
                customers: { label: "Customers", keys: [] },
                suppliers: { label: "Suppliers", keys: [] },
                quotes: { label: "Quotations", keys: [] },
                transfers: { label: "Transfers", keys: [] },
                reports: { label: "Reports & Analytics", keys: [] },
                accounts: { label: "Accounting & Ledgers", keys: [] },
                users: { label: "User Management", keys: [] },
                settings: { label: "System & Settings", keys: [] },
                other: { label: "Additional Modules", keys: [] }
            };

            for (const key of keys) {
                const prefix = key.split('-')[0].toLowerCase();
                const targetCat = categories[prefix] || categories.other;
                targetCat.keys.push({
                    key,
                    label: key.replace(/-/g, ' ').replace(/_/g, ' ').toUpperCase(),
                    allowed: currentPerms[key] === 1
                });
            }

            return categories;
        } catch (error) {
            console.error("[Permissions.getCategorizedPermissions error]:", error.message);
            return {};
        }
    }
}

module.exports = new Permissions();