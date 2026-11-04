const {
  getSales,
  getSaleById,
  getMetadata,
  getSuggestions,
  createSale,
  updateSale,
  updateStatus,
  addPayment,
  deletePayment,
  deleteSale,
  getDeliveries,
  addDelivery
} = require("../../../controller/admin/sales.controller");

module.exports = (app) => {
  // Sales Metadata & Product Autocomplete Suggestions
  app.get("/api/admin/sales/meta/options", getMetadata);
  app.get("/api/admin/sales/suggestions", getSuggestions);

  // Core Sales CRUD
  app.get("/api/admin/sales", getSales);
  app.get("/api/admin/sales/:id", getSaleById);
  app.post("/api/admin/sales", createSale);
  app.put("/api/admin/sales/:id", updateSale);
  app.delete("/api/admin/sales/:id", deleteSale);

  // Workflow Status, Payments, and Deliveries
  app.put("/api/admin/sales/:id/status", updateStatus);
  app.post("/api/admin/sales/:id/payments", addPayment);
  app.delete("/api/admin/sales/:id/payments/:paymentId", deletePayment);
  app.get("/api/admin/sales/:id/deliveries", getDeliveries);
  app.post("/api/admin/sales/:id/deliveries", addDelivery);
};
