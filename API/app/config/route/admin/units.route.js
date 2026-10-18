const {
  getUnits,
  getBaseUnits,
  getSubUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getProductUnits,
  saveProductUnits
} = require('../../../controller/admin/units.controller');

module.exports = (app) => {
  app.get('/api/admin/units', getUnits);
  app.get('/api/units', getUnits); // alias for backwards compatibility
  app.get('/api/admin/units/base', getBaseUnits);
  app.get('/api/admin/units/sub-units/:baseUnitId', getSubUnits);
  app.post('/api/admin/units', createUnit);
  app.put('/api/admin/units/:id', updateUnit);
  app.delete('/api/admin/units/:id', deleteUnit);

  // Product specific multi-unit pricing & barcodes
  app.get('/api/admin/products/:id/units', getProductUnits);
  app.put('/api/admin/products/:id/units', saveProductUnits);
};
