const { getPurchases, createPurchase } = require("../../../controller/admin/purchases.controller");

module.exports = (app) => {
  app.get("/api/admin/purchases", getPurchases);
  app.post("/api/admin/purchases", createPurchase);
};
