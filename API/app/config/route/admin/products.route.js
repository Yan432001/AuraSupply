const {
  getProducts,
  getProductById,
  getProductMetadata,
  duplicateProduct,
  addProducts,
  updateProducts,
  deleteProducts,
  bulkUpdatePrices
} = require("../../../controller/admin/products.controller");

module.exports = (app) => {
  // Metadata options endpoint (MUST be before :id)
  app.get("/api/products/meta/options", getProductMetadata);
  app.get("/api/admin/products/meta/options", getProductMetadata);

  // Duplicate product
  app.post("/api/admin/products/:id/duplicate", duplicateProduct);
  app.post("/api/products/:id/duplicate", duplicateProduct);

  // Public & Admin Products Endpoints
  app.get("/api/products", getProducts);
  app.get("/api/products/:id(\\d+)", getProductById);
  app.post("/api/products", addProducts);
  app.put("/api/products/:id(\\d+)", updateProducts);
  app.post("/api/products/update", updateProducts);
  app.delete("/api/products/:id(\\d+)", deleteProducts);
  app.delete("/api/products", deleteProducts);

  // Dedicated Admin Namespace
  app.get("/api/admin/products", getProducts);
  app.get("/api/admin/products/:id(\\d+)", getProductById);
  app.post("/api/admin/products", addProducts);
  app.put("/api/admin/products/:id(\\d+)", updateProducts);
  app.delete("/api/admin/products/:id(\\d+)", deleteProducts);
  app.post("/api/admin/products/bulk-price", bulkUpdatePrices);
};
