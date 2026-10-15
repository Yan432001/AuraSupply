const { getProductPhoto } = require("../../../controller/admin/product.photo.controller");
module.exports = (app) => {
    app.get("/api/product_photos", getProductPhoto);
}
