const {
  getPurchases,
  getPurchaseById,
  getMetadata,
  createPurchase,
  updatePurchase,
  updateStatus,
  receiveGoods,
  addPayment,
  deletePayment,
  deletePurchase
} = require("../../../controller/admin/purchases.controller");

module.exports = (app) => {
  // Metadata options (suppliers, warehouses, units, next reference)
  app.get("/api/admin/purchases/meta/options", getMetadata);

  // Core Purchases CRUD
  app.get("/api/admin/purchases", getPurchases);
  app.get("/api/admin/purchases/:id", getPurchaseById);
  app.post("/api/admin/purchases", createPurchase);
  app.put("/api/admin/purchases/:id", updatePurchase);
  app.delete("/api/admin/purchases/:id", deletePurchase);

  // Workflow, Receiving, and Payments
  app.put("/api/admin/purchases/:id/status", updateStatus);
  app.post("/api/admin/purchases/:id/receive", receiveGoods);
  app.post("/api/admin/purchases/:id/payments", addPayment);
  app.delete("/api/admin/purchases/:id/payments/:paymentId", deletePayment);
};
