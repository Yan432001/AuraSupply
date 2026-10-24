const {
  getSales,
  getSaleById,
  getMetadata,
  createSale,
  updateSale,
  updateStatus,
  addPayment,
  deletePayment,
  deleteSale
} = require("../../../controller/admin/sales.controller");

module.exports = (app) => {
  // Sales Metadata
  app.get("/api/admin/sales/meta/options", getMetadata);

  // Core Sales CRUD
  app.get("/api/admin/sales", getSales);
  app.get("/api/admin/sales/:id", getSaleById);
  app.post("/api/admin/sales", createSale);
  app.put("/api/admin/sales/:id", updateSale);
  app.delete("/api/admin/sales/:id", deleteSale);

  // Workflow Status and Payments
  app.put("/api/admin/sales/:id/status", updateStatus);
  app.post("/api/admin/sales/:id/payments", addPayment);
  app.delete("/api/admin/sales/:id/payments/:paymentId", deletePayment);
};
