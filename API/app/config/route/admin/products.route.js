const {
  getProducts,
  getProductById,
  addProducts,
  updateProducts,
  deleteProducts,
  bulkUpdatePrices
} = require("../../../controller/admin/products.controller");

module.exports = (app) => {
  // Public & Admin Products Endpoints
  app.get("/api/products", getProducts);
  app.get("/api/products/:id", getProductById);
  app.post("/api/products", addProducts);
  app.put("/api/products/:id", updateProducts);
  app.post("/api/products/update", updateProducts);
  app.delete("/api/products/:id", deleteProducts);
  app.delete("/api/products", deleteProducts);

  // Dedicated Admin Namespace
  app.get("/api/admin/products", getProducts);
  app.get("/api/admin/products/:id", getProductById);
  app.post("/api/admin/products", addProducts);
  app.put("/api/admin/products/:id", updateProducts);
  app.delete("/api/admin/products/:id", deleteProducts);
  app.post("/api/admin/products/bulk-price", bulkUpdatePrices);
};