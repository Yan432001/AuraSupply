const {
  receiveStock,
  issueStock,
  adjustStock,
  transferStock,
  getWarehouseStock,
  getStockMovements
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

  console.log('[Route] Mounted admin/inventoryOperations.route');
};
