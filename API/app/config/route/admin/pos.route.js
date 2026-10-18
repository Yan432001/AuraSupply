const {
  getCurrentRegister,
  openRegister,
  getRegisterSummary,
  closeRegister,
  getPosProducts,
  getPosCategories,
  getPosCustomers,
  addPosCustomer,
  checkoutPosSale,
} = require("../../../controller/admin/pos.controller");

module.exports = (app) => {
  // POS Cash Register Lifecycle
  app.get("/api/admin/pos/register/current", getCurrentRegister);
  app.post("/api/admin/pos/register/open", openRegister);
  app.get("/api/admin/pos/register/summary", getRegisterSummary);
  app.get("/api/admin/pos/register/:id/summary", getRegisterSummary);
  app.post("/api/admin/pos/register/close", closeRegister);

  // POS Real-time Catalog & Customers
  app.get("/api/admin/pos/products", getPosProducts);
  app.get("/api/admin/pos/categories", getPosCategories);
  app.get("/api/admin/pos/customers", getPosCustomers);
  app.post("/api/admin/pos/customers", addPosCustomer);

  // POS Checkout & Order Finalization
  app.post("/api/admin/pos/checkout", checkoutPosSale);
};
