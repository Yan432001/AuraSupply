const {getPorductUnits} = require("../../../controller/admin/product.units.controller")

module.exports = (app) => {
    app.get("/api/product_units", getPorductUnits);
}