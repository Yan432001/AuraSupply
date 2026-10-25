const {
  listEntityRecords,
  createEntityRecord,
  updateEntityRecord,
  deleteEntityRecord
} = require("../../../controller/admin/bpasErpData.controller");

module.exports = (app) => {
  // Dynamic multi-module endpoints
  app.get("/api/admin/erp/entity/:entity", listEntityRecords);
  app.post("/api/admin/erp/entity/:entity", createEntityRecord);
  app.put("/api/admin/erp/entity/:entity/:id", updateEntityRecord);
  app.delete("/api/admin/erp/entity/:entity/:id", deleteEntityRecord);

  // Dedicated shortcuts matching BPAS URLs
  app.get("/api/admin/quotes", (req, res, next) => {
    req.params.entity = 'quotes';
    listEntityRecords(req, res, next);
  });

  app.get("/api/admin/sales-orders", (req, res, next) => {
    req.params.entity = 'sales_orders';
    listEntityRecords(req, res, next);
  });

  app.get("/api/admin/deliveries", (req, res, next) => {
    req.params.entity = 'deliveries';
    listEntityRecords(req, res, next);
  });

  app.get("/api/admin/expenses", (req, res, next) => {
    req.params.entity = 'expenses';
    listEntityRecords(req, res, next);
  });

  app.get("/api/admin/loans", (req, res, next) => {
    req.params.entity = 'loans';
    listEntityRecords(req, res, next);
  });

  app.get("/api/admin/attendances", (req, res, next) => {
    req.params.entity = 'attendances';
    listEntityRecords(req, res, next);
  });

  app.get("/api/admin/payrolls", (req, res, next) => {
    req.params.entity = 'payrolls';
    listEntityRecords(req, res, next);
  });

  app.get("/api/admin/assets", (req, res, next) => {
    req.params.entity = 'assets';
    listEntityRecords(req, res, next);
  });

  console.log('[Route] Mounted BPAS ERP Universal Entity Routes (/api/admin/erp/entity/*)');
};
