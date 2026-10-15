const {getPorductRack} = require("../../../controller/admin/product.rack.controller")

module.exports = (app) => {
    app.get("/api/product_racks", getPorductRack);
}