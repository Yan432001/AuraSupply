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
  getRegistersList,
  getTodaySaleReport,
  getTodayProfit,
  addPosExpense,
  suspendSale,
  getSuspendedSales,
  deleteSuspendedSale,
  getPosSales,
  getPosSettings,
  updatePosSettings,
} = require("../../../controller/admin/pos.controller");

module.exports = (app) => {
  // POS Cash Register Lifecycle
  app.get("/api/admin/pos/register/current", getCurrentRegister);
  app.post("/api/admin/pos/register/open", openRegister);
  app.get("/api/admin/pos/register/summary", getRegisterSummary);
  app.get("/api/admin/pos/register/:id/summary", getRegisterSummary);
  app.post("/api/admin/pos/register/close", closeRegister);
  app.get("/api/admin/pos/registers", getRegistersList);

  // POS Real-time Catalog & Customers
  app.get("/api/admin/pos/products", getPosProducts);
  app.get("/api/admin/pos/categories", getPosCategories);
  app.get("/api/admin/pos/customers", getPosCustomers);
  app.post("/api/admin/pos/customers", addPosCustomer);

  // POS Checkout & Order Finalization
  app.post("/api/admin/pos/checkout", checkoutPosSale);

  // POS Today's Telemetry & Reporting
  app.get("/api/admin/pos/today-sale", getTodaySaleReport);
  app.get("/api/admin/pos/today-profit", getTodayProfit);

  // POS Expenses Management
  app.post("/api/admin/pos/expenses", addPosExpense);

  // POS Suspended Bills Management
  app.post("/api/admin/pos/suspend", suspendSale);
  app.get("/api/admin/pos/suspended", getSuspendedSales);
  app.delete("/api/admin/pos/suspended/:id", deleteSuspendedSale);

  // POS Completed Sales History
  app.get("/api/admin/pos/sales", getPosSales);

  // POS Hardware & System Settings
  app.get("/api/admin/pos/settings", getPosSettings);
  app.post("/api/admin/pos/settings", updatePosSettings);
};
