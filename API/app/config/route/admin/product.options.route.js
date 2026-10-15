const {getProductOptions} = require("../../../controller/admin/product.options.controller");

module.exports = (app) =>{
    app.get("/api/product_options", getProductOptions)
}