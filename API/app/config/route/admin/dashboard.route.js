const { getDashboardStats } = require("../../../controller/admin/dashboard.controller");

module.exports = (app) => {
  app.get("/api/admin/dashboard/stats", getDashboardStats);
  app.get("/api/admin/dashboard", getDashboardStats);
};
