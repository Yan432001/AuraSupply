const { getPurchases } = require("../../../controller/admin/purchases.controller");

module.exports = (app) => {
  app.get("/api/admin/purchases", getPurchases);
};
