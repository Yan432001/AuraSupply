const transfersCtrl = require('../../../controller/admin/transfers.controller');

module.exports = (app) => {
  // Metadata options & product suggestions for warehouse
  app.get('/api/admin/transfers/meta/options', transfersCtrl.getMetadataOptions);
  app.get('/api/transfers/meta/options', transfersCtrl.getMetadataOptions);

  app.get('/api/admin/transfers/products', transfersCtrl.getAvailableProducts);
  app.get('/api/transfers/products', transfersCtrl.getAvailableProducts);

  // List Transfers
  app.get('/api/admin/transfers', transfersCtrl.listTransfers);
  app.get('/api/transfers', transfersCtrl.listTransfers);

  // Single Transfer Details
  app.get('/api/admin/transfers/:id', transfersCtrl.getTransferById);
  app.get('/api/transfers/:id', transfersCtrl.getTransferById);

  // Create Transfer
  app.post('/api/admin/transfers', transfersCtrl.createTransfer);
  app.post('/api/transfers', transfersCtrl.createTransfer);

  // Update Transfer
  app.put('/api/admin/transfers/:id', transfersCtrl.updateTransfer);
  app.put('/api/transfers/:id', transfersCtrl.updateTransfer);

  // Workflow Actions
  app.post('/api/admin/transfers/:id/approve', transfersCtrl.approveTransfer);
  app.post('/api/transfers/:id/approve', transfersCtrl.approveTransfer);

  app.post('/api/admin/transfers/:id/reject', transfersCtrl.rejectTransfer);
  app.post('/api/transfers/:id/reject', transfersCtrl.rejectTransfer);

  app.post('/api/admin/transfers/:id/dispatch', transfersCtrl.dispatchTransfer);
  app.post('/api/transfers/:id/dispatch', transfersCtrl.dispatchTransfer);

  app.post('/api/admin/transfers/:id/receive', transfersCtrl.receiveTransfer);
  app.post('/api/transfers/:id/receive', transfersCtrl.receiveTransfer);

  app.post('/api/admin/transfers/:id/cancel', transfersCtrl.cancelTransfer);
  app.post('/api/transfers/:id/cancel', transfersCtrl.cancelTransfer);

  // Delete Transfer
  app.delete('/api/admin/transfers/:id', transfersCtrl.deleteTransfer);
  app.delete('/api/transfers/:id', transfersCtrl.deleteTransfer);

  console.log('[Route] Mounted admin/transfers.route');
};
