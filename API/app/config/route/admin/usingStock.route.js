const usingStockCtrl = require('../../../controller/admin/usingStock.controller');

module.exports = (app) => {
  // Metadata options & products for warehouse
  app.get('/api/admin/products/using_stock/meta/options', usingStockCtrl.getMetadataOptions);
  app.get('/api/products/using_stock/meta/options', usingStockCtrl.getMetadataOptions);

  app.get('/api/admin/products/using_stock/products', usingStockCtrl.getAvailableProducts);
  app.get('/api/products/using_stock/products', usingStockCtrl.getAvailableProducts);

  // Stock Usage List
  app.get('/api/admin/products/using_stock', usingStockCtrl.listUsingStocks);
  app.get('/api/products/using_stock', usingStockCtrl.listUsingStocks);
  app.get('/admins/products/using_stock/data', usingStockCtrl.listUsingStocks);

  // Single Stock Usage details
  app.get('/api/admin/products/using_stock/:id', usingStockCtrl.getUsingStockById);
  app.get('/api/products/using_stock/:id', usingStockCtrl.getUsingStockById);

  // Create Stock Usage
  app.post('/api/admin/products/using_stock', usingStockCtrl.createUsingStock);
  app.post('/api/products/using_stock', usingStockCtrl.createUsingStock);

  // Update Stock Usage
  app.put('/api/admin/products/using_stock/:id', usingStockCtrl.updateUsingStock);
  app.put('/api/products/using_stock/:id', usingStockCtrl.updateUsingStock);

  // Delete / Cancel Stock Usage
  app.delete('/api/admin/products/using_stock/:id', usingStockCtrl.deleteUsingStock);
  app.delete('/api/products/using_stock/:id', usingStockCtrl.deleteUsingStock);

  // Return Stock against existing usage
  app.post('/api/admin/products/using_stock/:id/return', usingStockCtrl.createReturn);
  app.post('/api/products/using_stock/:id/return', usingStockCtrl.createReturn);

  console.log('[Route] Mounted admin/usingStock.route');
};
