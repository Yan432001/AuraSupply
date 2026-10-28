const stockReceivedCtrl = require('../../../controller/admin/stockReceived.controller');

module.exports = (app) => {
  // 1. Metadata options
  const metaEndpoints = [
    '/api/admin/stock_received/meta/options',
    '/api/admin/stock-received/meta/options',
    '/api/admin/products/stock_received/meta/options',
    '/api/admin/products/stock-received/meta/options',
    '/api/stock_received/meta/options',
    '/api/products/stock_received/meta/options',
  ];
  metaEndpoints.forEach(path => app.get(path, stockReceivedCtrl.getMetadataOptions));

  // 2. Purchase Order items auto-fetch
  const poEndpoints = [
    '/api/admin/stock_received/purchases/:purchaseId',
    '/api/admin/stock-received/purchases/:purchaseId',
    '/api/admin/products/stock_received/purchases/:purchaseId',
    '/api/admin/products/stock-received/purchases/:purchaseId',
    '/api/stock_received/purchases/:purchaseId',
  ];
  poEndpoints.forEach(path => app.get(path, stockReceivedCtrl.getPurchaseOrderDetails));

  // 3. Products search for direct stock receipts
  const productEndpoints = [
    '/api/admin/stock_received/products',
    '/api/admin/stock-received/products',
    '/api/admin/products/stock_received/products',
    '/api/admin/products/stock-received/products',
    '/api/stock_received/products',
  ];
  productEndpoints.forEach(path => app.get(path, stockReceivedCtrl.getAvailableProducts));

  // 4. List stock received
  const listEndpoints = [
    '/api/admin/stock_received',
    '/api/admin/stock-received',
    '/api/admin/products/stock_received',
    '/api/admin/products/stock-received',
    '/api/stock_received',
    '/api/products/stock_received',
  ];
  listEndpoints.forEach(path => {
    app.get(path, stockReceivedCtrl.listStockReceived);
    app.post(path, stockReceivedCtrl.createStockReceived);
  });

  // 5. Single item CRUD (details, update, delete)
  const itemEndpoints = [
    '/api/admin/stock_received/:id',
    '/api/admin/stock-received/:id',
    '/api/admin/products/stock_received/:id',
    '/api/admin/products/stock-received/:id',
    '/api/stock_received/:id',
    '/api/products/stock_received/:id',
  ];
  itemEndpoints.forEach(path => {
    app.get(path, stockReceivedCtrl.getStockReceivedById);
    app.put(path, stockReceivedCtrl.updateStockReceived);
    app.delete(path, stockReceivedCtrl.deleteStockReceived);
  });

  console.log('[Route] Mounted admin/stockReceived.route');
};
