const quantityAdjCtrl = require('../../../controller/admin/quantityAdjustments.controller');

module.exports = (app) => {
  // Metadata options & products for warehouse
  app.get('/api/admin/products/quantity_adjustments/meta/options', quantityAdjCtrl.getMetadataOptions);
  app.get('/api/products/quantity_adjustments/meta/options', quantityAdjCtrl.getMetadataOptions);

  app.get('/api/admin/products/quantity_adjustments/products', quantityAdjCtrl.getAvailableProducts);
  app.get('/api/products/quantity_adjustments/products', quantityAdjCtrl.getAvailableProducts);

  // List Adjustments
  app.get('/api/admin/products/quantity_adjustments', quantityAdjCtrl.listAdjustments);
  app.get('/api/products/quantity_adjustments', quantityAdjCtrl.listAdjustments);

  // Single Adjustment Details
  app.get('/api/admin/products/quantity_adjustments/:id', quantityAdjCtrl.getAdjustmentById);
  app.get('/api/products/quantity_adjustments/:id', quantityAdjCtrl.getAdjustmentById);

  // Create Adjustment
  app.post('/api/admin/products/quantity_adjustments', quantityAdjCtrl.createAdjustment);
  app.post('/api/products/quantity_adjustments', quantityAdjCtrl.createAdjustment);

  // Update Adjustment
  app.put('/api/admin/products/quantity_adjustments/:id', quantityAdjCtrl.updateAdjustment);
  app.put('/api/products/quantity_adjustments/:id', quantityAdjCtrl.updateAdjustment);

  // Delete / Cancel Adjustment
  app.delete('/api/admin/products/quantity_adjustments/:id', quantityAdjCtrl.deleteAdjustment);
  app.delete('/api/products/quantity_adjustments/:id', quantityAdjCtrl.deleteAdjustment);

  console.log('[Route] Mounted admin/quantityAdjustments.route');
};
