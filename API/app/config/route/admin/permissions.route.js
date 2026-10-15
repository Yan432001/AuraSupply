const {
    getPermissions,
    deletePermissions

} = require("../../../controller/admin/permissions.controller");

module.exports = (app) => {
    app.get("/api/permissions", getPermissions);
    app.delete("/api/permissions", deletePermissions);
};