const   { 
            getAllBrands, 
            getAllCategories,
            getAllZones,
            getAllUnits
        } = require("../../../controller/admin/setting.controller");

module.exports = (app) => { 
    app.get("/api/settings/brands", getAllBrands);
    app.get("/api/settings/categories", getAllCategories);
    app.get("/api/settings/zones", getAllZones);
    app.get("/api/settings/units", getAllUnits)
}