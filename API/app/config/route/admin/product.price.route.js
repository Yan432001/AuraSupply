const {getProductPrice} = require("../../../controller/admin/product.price.controller")

module.exports = (app) => {
    app.get("/api/product_prices", getProductPrice);
}