const {
  getOrders,
  getOrderById,
  updateOrderStatus,
  createOrder
} = require("../../../controller/admin/orders.controller");

module.exports = (app) => {
  // Admin Orders Endpoints
  app.get("/api/admin/orders", getOrders);
  app.get("/api/admin/orders/:id", getOrderById);
  app.put("/api/admin/orders/:id/status", updateOrderStatus);
  app.post("/api/admin/orders", createOrder);

  // E-Menu / TMA Compatibility
  app.get("/api/tma/orders", getOrders);
  app.get("/api/tma/orders/:id", getOrderById);
  app.put("/api/tma/orders/:id/status", updateOrderStatus);
};
