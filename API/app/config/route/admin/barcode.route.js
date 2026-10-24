const {
  listBarcodeProducts,
  generateBarcodes,
  previewLabels,
  printLabels,
  getPrintLogs,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getBarcodeSettings,
  searchProducts,
  getProductForBarcode,
  getPurchaseBarcodeItems,
  getTransferBarcodeItems
} = require("../../../controller/admin/barcode.controller");

module.exports = (app) => {
  // 1. Core Barcode Management & RESTful Endpoints
  app.get("/api/admin/products/barcode/list", listBarcodeProducts);
  app.post("/api/admin/products/barcode/generate", generateBarcodes);
  app.post("/api/admin/products/barcode/preview", previewLabels);
  app.post("/api/admin/products/barcode/print", printLabels);
  app.get("/api/admin/products/barcode/logs", getPrintLogs);

  // Direct alias paths under /admins/products/barcode/*
  app.get("/admins/products/barcode/list", listBarcodeProducts);
  app.post("/admins/products/barcode/generate", generateBarcodes);
  app.post("/admins/products/barcode/preview", previewLabels);
  app.post("/admins/products/barcode/print", printLabels);
  app.get("/admins/products/barcode/logs", getPrintLogs);

  // Intercept /api/admin/products and /admins/products when action=barcode & requesting JSON
  app.use("/api/admin/products", (req, res, next) => {
    if (req.query.action === 'barcode') {
      return listBarcodeProducts(req, res);
    }
    next();
  });

  app.use("/admins/products", (req, res, next) => {
    if (req.query.action === 'barcode' && (req.xhr || req.headers.accept?.includes('application/json') || req.query.format === 'json')) {
      return listBarcodeProducts(req, res);
    }
    next();
  });

  // 2. Templates Management Endpoints
  app.get("/api/admin/products/barcode/templates", getTemplates);
  app.post("/api/admin/products/barcode/templates", createTemplate);
  app.put("/api/admin/products/barcode/templates/:id", updateTemplate);
  app.delete("/api/admin/products/barcode/templates/:id", deleteTemplate);

  // 3. Settings & Data Import Endpoints (AURA_v1 compatibility)
  app.get("/api/admin/products/barcode/settings", getBarcodeSettings);
  app.get("/api/admin/products/barcode/suggestions", searchProducts);
  app.get("/api/admin/products/barcode/product/:id", getProductForBarcode);
  app.get("/api/admin/products/barcode/purchase/:id", getPurchaseBarcodeItems);
  app.get("/api/admin/products/barcode/transfer/:id", getTransferBarcodeItems);
};
