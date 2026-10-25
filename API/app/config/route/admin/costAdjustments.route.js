const costAdjustmentsCtrl = require('../../../controller/admin/costAdjustments.controller');

module.exports = (app) => {
  // Metadata options & products for warehouse
  app.get('/api/admin/products/cost_adjustments/meta/options', costAdjustmentsCtrl.getMetadataOptions);
  app.get('/api/admin/products/cost-adjustments/meta/options', costAdjustmentsCtrl.getMetadataOptions);
  app.get('/api/products/cost_adjustments/meta/options', costAdjustmentsCtrl.getMetadataOptions);

  app.get('/api/admin/products/cost_adjustments/products', costAdjustmentsCtrl.getAvailableProducts);
  app.get('/api/admin/products/cost-adjustments/products', costAdjustmentsCtrl.getAvailableProducts);
  app.get('/api/products/cost_adjustments/products', costAdjustmentsCtrl.getAvailableProducts);

  // List Adjustments
  app.get('/api/admin/products/cost_adjustments', costAdjustmentsCtrl.listCostAdjustments);
  app.get('/api/admin/products/cost-adjustments', costAdjustmentsCtrl.listCostAdjustments);
  app.get('/api/products/cost_adjustments', costAdjustmentsCtrl.listCostAdjustments);

  // Single Adjustment Details
  app.get('/api/admin/products/cost_adjustments/:id', costAdjustmentsCtrl.getCostAdjustmentById);
  app.get('/api/admin/products/cost-adjustments/:id', costAdjustmentsCtrl.getCostAdjustmentById);
  app.get('/api/products/cost_adjustments/:id', costAdjustmentsCtrl.getCostAdjustmentById);

  // Create Adjustment
  app.post('/api/admin/products/cost_adjustments', costAdjustmentsCtrl.createCostAdjustment);
  app.post('/api/admin/products/cost-adjustments', costAdjustmentsCtrl.createCostAdjustment);
  app.post('/api/products/cost_adjustments', costAdjustmentsCtrl.createCostAdjustment);

  // Update Adjustment
  app.put('/api/admin/products/cost_adjustments/:id', costAdjustmentsCtrl.updateCostAdjustment);
  app.put('/api/admin/products/cost-adjustments/:id', costAdjustmentsCtrl.updateCostAdjustment);
  app.put('/api/products/cost_adjustments/:id', costAdjustmentsCtrl.updateCostAdjustment);

  // Delete Adjustment
  app.delete('/api/admin/products/cost_adjustments/:id', costAdjustmentsCtrl.deleteCostAdjustment);
  app.delete('/api/admin/products/cost-adjustments/:id', costAdjustmentsCtrl.deleteCostAdjustment);
  app.delete('/api/products/cost_adjustments/:id', costAdjustmentsCtrl.deleteCostAdjustment);

  console.log('[Route] Mounted admin/costAdjustments.route');
};
