const {
  getDashboardMetrics,
  getNextAssetCode,
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAssignments,
  assignAsset,
  returnAsset,
  getTransfers,
  createTransfer,
  getMaintenances,
  createMaintenance,
  updateMaintenance,
  getDepreciationSchedule,
  runDepreciation,
  getDisposals,
  createDisposal,
  getAssetReports
} = require("../../../controller/admin/asset.controller");

module.exports = (app) => {
  // 1. Dashboard Metrics
  app.get("/api/admin/assets/dashboard", getDashboardMetrics);

  // 2. Asset Categories (must be above :id)
  app.get("/api/admin/assets/categories", getCategories);
  app.get("/api/admin/assets/categories/:id", getCategoryById);
  app.post("/api/admin/assets/categories", createCategory);
  app.put("/api/admin/assets/categories/:id", updateCategory);
  app.delete("/api/admin/assets/categories/:id", deleteCategory);

  // 3. Asset Assignments & Returns
  app.get("/api/admin/assets/assignments", getAssignments);
  app.post("/api/admin/assets/assignments", assignAsset);
  app.post("/api/admin/assets/assignments/return", returnAsset);

  // 4. Asset Transfers
  app.get("/api/admin/assets/transfers", getTransfers);
  app.post("/api/admin/assets/transfers", createTransfer);

  // 5. Maintenance
  app.get("/api/admin/assets/maintenances", getMaintenances);
  app.post("/api/admin/assets/maintenances", createMaintenance);
  app.put("/api/admin/assets/maintenances/:id", updateMaintenance);

  // 6. Depreciation Schedule & Runner
  app.get("/api/admin/assets/depreciation", getDepreciationSchedule);
  app.post("/api/admin/assets/depreciation/run", runDepreciation);

  // 7. Disposals & Retirements
  app.get("/api/admin/assets/disposals", getDisposals);
  app.post("/api/admin/assets/disposals", createDisposal);

  // 8. Asset Reports
  app.get("/api/admin/assets/reports", getAssetReports);

  // 9. Asset Register (CRUD)
  app.get("/api/admin/assets/next-code", getNextAssetCode);
  app.get("/api/admin/assets", getAssets);
  app.get("/api/admin/assets/:id", getAssetById);
  app.post("/api/admin/assets", createAsset);
  app.put("/api/admin/assets/:id", updateAsset);
  app.delete("/api/admin/assets/:id", deleteAsset);
};
