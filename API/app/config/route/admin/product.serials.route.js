const {getPorductSerials} = require("../../../controller/admin/product.serials.controller")

module.exports = (app) => {
    app.get("/api/product_serails", getPorductSerials);
}