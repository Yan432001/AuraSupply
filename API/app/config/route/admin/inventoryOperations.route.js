const {
  receiveStock,
  issueStock,
  adjustStock,
  transferStock,
  getWarehouseStock,
  getStockMovements,
  getOversellingConfig,
  updateOversellingConfig,
  syncOpeningStock,
  checkStockAvailability
} = require('../../../controller/admin/inventoryOperations.controller');

module.exports = (app) => {
  // Inventory Stock Operations
  app.post('/api/admin/inventory/receive', receiveStock);
  app.post('/api/admin/inventory/issue', issueStock);
  app.post('/api/admin/inventory/adjust', adjustStock);
  app.post('/api/admin/inventory/transfer', transferStock);

  // Warehouse Stock Balances Overview
  app.get('/api/admin/inventory/warehouse-stock', getWarehouseStock);

  // Stock Movement History & Audit Trail
  app.get('/api/admin/inventory/movements', getStockMovements);

  // Overselling Configuration & Stock Availability
  app.get('/api/admin/inventory/overselling-config', getOversellingConfig);
  app.put('/api/admin/inventory/overselling-config', updateOversellingConfig);
  app.post('/api/admin/inventory/sync-opening-stock', syncOpeningStock);
  app.post('/api/admin/inventory/check-availability', checkStockAvailability);

  console.log('[Route] Mounted admin/inventoryOperations.route');
};
