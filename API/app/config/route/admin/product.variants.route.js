const {getPorductVariants} = require("../../../controller/admin/product.variants.controller")

module.exports = (app) => {
    app.get("/api/product_varaints", getPorductVariants);
}