const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");
const permissionsUtil = require("../../config/utill/permissions");

/**
 * GET /api/admin/permissions
 * List all groups with permission matrix status
 */
exports.getPermissions = async (req, res) => {
    try {
        const [groups] = await db.query(`
            SELECT g.id, g.name, g.description, g.level, g.allow_admin_login,
                   CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END AS has_permissions_record,
                   COUNT(u.id) AS user_count
            FROM aura_groups g
            LEFT JOIN aura_permissions p ON p.group_id = g.id
            LEFT JOIN aura_users u ON u.group_id = g.id AND u.deleted_at IS NULL
            GROUP BY g.id
            ORDER BY g.level ASC, g.id ASC
        `);

        res.json({
            success: true,
            status: true,
            data: groups,
            groups
        });
    } catch (err) {
        logError("getPermissions.controller", err, res);
    }
};

/**
 * GET /api/admin/permissions/:groupId
 * Retrieve full permission record ($this->GP) for a specific group, along with module categorization
 * (Cloning System_settings::permissions($id) in CodeIgniter 3)
 */
exports.getGroupPermissions = async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId || req.params.id, 10);
        if (!groupId) {
            return res.status(400).json({ success: false, status: false, message: "Invalid group ID" });
        }

        const [groups] = await db.query("SELECT * FROM aura_groups WHERE id = ? LIMIT 1", [groupId]);
        if (!groups || groups.length === 0) {
            return res.status(404).json({ success: false, status: false, message: "Group not found" });
        }
        const group = groups[0];

        const GP = await permissionsUtil.getGroupPermissions(groupId);
        const categories = await permissionsUtil.getCategorizedPermissions(groupId);
        const keys = await permissionsUtil.getPermissionKeys();

        // Calculate allowed count
        const allowedCount = Object.entries(GP).filter(([k, v]) => k !== 'group_id' && v == 1).length;

        res.json({
            success: true,
            status: true,
            data: {
                group,
                groupId,
                GP,
                permissions: GP,
                categories,
                totalKeys: keys.length,
                allowedCount
            },
            group,
            GP,
            permissions: GP,
            categories
        });
    } catch (err) {
        logError("getGroupPermissions.controller", err, res);
    }
};

/**
 * PUT /api/admin/permissions/:groupId or POST /api/admin/permissions/:groupId
 * Update group permissions in aura_permissions
 * (Cloning $this->settings_model->updatePermissions($id, $data) in CodeIgniter 3)
 */
exports.updateGroupPermissions = async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId || req.params.id || req.body.group_id, 10);
        if (!groupId) {
            return res.status(400).json({ success: false, status: false, message: "Invalid group ID" });
        }

        // Safety: Root Owner (group 1) always has full access
        if (groupId === 1) {
            return res.status(400).json({
                success: false,
                status: false,
                message: "Owner permissions are root system hardwired and cannot be restricted."
            });
        }

        const permissionsData = req.body.permissions || req.body.data || req.body;
        const result = await permissionsUtil.updateGroupPermissions(groupId, permissionsData);

        if (!result.success) {
            return res.status(500).json({ success: false, status: false, message: result.error });
        }

        // Fetch refreshed permissions
        const updatedGP = await permissionsUtil.getGroupPermissions(groupId);

        res.json({
            success: true,
            status: true,
            message: "Group permissions updated successfully",
            updatedCount: result.updatedCount,
            GP: updatedGP,
            data: updatedGP
        });
    } catch (err) {
        logError("updateGroupPermissions.controller", err, res);
    }
};

/**
 * DELETE /api/admin/permissions/:groupId
 */
exports.deletePermissions = async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId || req.params.id || req.body.id || req.body.group_id, 10);
        if (!groupId || groupId === 1) {
            return res.status(400).json({ success: false, status: false, message: "Invalid group ID or cannot delete owner" });
        }

        await db.query("DELETE FROM aura_permissions WHERE group_id = ?", [groupId]);
        res.json({ success: true, status: true, message: "Permissions record removed for group" });
    } catch (err) {
        logError("deletePermissions.controller", err, res);
    }
};