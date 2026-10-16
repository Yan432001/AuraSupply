const {
    getPermissions,
    getGroupPermissions,
    updateGroupPermissions,
    deletePermissions
} = require("../../../controller/admin/permissions.controller");
const { authenticate, requireRole } = require("../../../middleware/permission.middleware");

module.exports = (app) => {
    // Group permissions endpoints
    app.get("/api/admin/permissions", authenticate, getPermissions);
    app.get("/api/admin/permissions/:groupId", authenticate, getGroupPermissions);
    app.put("/api/admin/permissions/:groupId", authenticate, requireRole('owner', 'admin'), updateGroupPermissions);
    app.post("/api/admin/permissions/:groupId", authenticate, requireRole('owner', 'admin'), updateGroupPermissions);
    app.delete("/api/admin/permissions/:groupId", authenticate, requireRole('owner', 'admin'), deletePermissions);

    // Backward-compatibility aliases
    app.get("/api/permissions", authenticate, getPermissions);
    app.get("/api/permissions/:groupId", authenticate, getGroupPermissions);
    app.put("/api/permissions/:groupId", authenticate, updateGroupPermissions);
    app.post("/api/permissions/:groupId", authenticate, updateGroupPermissions);
    app.delete("/api/permissions", authenticate, deletePermissions);
};