const {
  getUnits,
  getBaseUnits,
  getUnitsByBUID,
  getSubUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
  unitActions,
  changeUnitToGetNewPrice,
  productSuggestionByMultiUnit,
  checkDuplicateUnitCode,
  getProductUnits,
  saveProductUnits
} = require('../../../controller/admin/units.controller');

module.exports = (app) => {
  app.get('/api/admin/units', getUnits);
  app.get('/api/units', getUnits); // alias for backwards compatibility
  app.get('/api/admin/units/base', getBaseUnits);
  app.get('/api/admin/units/by-base/:baseUnitId', getUnitsByBUID);
  app.get('/api/admin/units/sub-units/:baseUnitId', getSubUnits);
  app.get('/api/admin/units/change-unit-price', changeUnitToGetNewPrice);
  app.get('/api/admin/units/change-unit-price/:groupId', changeUnitToGetNewPrice);
  app.get('/api/admin/units/product-suggestions', productSuggestionByMultiUnit);
  app.get('/api/admin/units/check-duplicate-code', checkDuplicateUnitCode);
  app.post('/api/admin/units/actions', unitActions);

  app.get('/api/admin/units/:id(\\d+)', getUnitById);
  app.post('/api/admin/units', createUnit);
  app.put('/api/admin/units/:id(\\d+)', updateUnit);
  app.delete('/api/admin/units/:id(\\d+)', deleteUnit);

  // Product specific multi-unit pricing & barcodes
  app.get('/api/admin/products/:id/units', getProductUnits);
  app.put('/api/admin/products/:id/units', saveProductUnits);
};
