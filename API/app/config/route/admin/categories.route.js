const {
  getCategories,
  addCategories,
  updateCategories,
  deleteCategories
} = require("../../../controller/admin/categories.controller");

module.exports = (app) => {
  // Public & Admin routes
  app.get("/api/categories", getCategories);
  app.post("/api/categories", addCategories);
  app.put("/api/categories/:id", updateCategories);
  app.put("/api/categories", updateCategories);
  app.delete("/api/categories/:id", deleteCategories);
  app.delete("/api/categories", deleteCategories);

  // Dedicated Admin Namespace
  app.get("/api/admin/categories", getCategories);
  app.post("/api/admin/categories", addCategories);
  app.put("/api/admin/categories/:id", updateCategories);
  app.delete("/api/admin/categories/:id", deleteCategories);
};
