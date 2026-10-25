const {
  listAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  getAttributeValues,
  addAttributeValue,
  deleteAttributeValue,
  generateVariantCombinations
} = require('../../../controller/admin/attributes.controller');

module.exports = (app) => {
  app.get('/api/admin/attributes', listAttributes);
  app.post('/api/admin/attributes', createAttribute);
  app.put('/api/admin/attributes/:id', updateAttribute);
  app.delete('/api/admin/attributes/:id', deleteAttribute);

  app.get('/api/admin/attributes/:id/values', getAttributeValues);
  app.post('/api/admin/attributes/:id/values', addAttributeValue);
  app.delete('/api/admin/attributes/values/:valueId', deleteAttributeValue);

  app.post('/api/admin/attributes/generate-combinations', generateVariantCombinations);

  // General attributes endpoints
  app.get('/api/attributes', listAttributes);
  app.get('/api/attributes/:id/values', getAttributeValues);
  app.post('/api/attributes/generate-combinations', generateVariantCombinations);

  console.log('[Route] Mounted admin/attributes.route');
};
