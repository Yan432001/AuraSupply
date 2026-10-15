const {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require("../../../controller/admin/suppliers.controller");

module.exports = (app) => {
  app.get("/api/admin/suppliers", getSuppliers);
  app.post("/api/admin/suppliers", createSupplier);
  app.put("/api/admin/suppliers/:id", updateSupplier);
  app.delete("/api/admin/suppliers/:id", deleteSupplier);
};
