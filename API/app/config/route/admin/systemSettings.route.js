const {
  getSystemSettings,
  updateSystemSettings,
  resetPrefixes
} = require('../../../controller/admin/systemSettings.controller');

module.exports = (app) => {
  app.get('/api/admin/system-settings', getSystemSettings);
  app.put('/api/admin/system-settings', updateSystemSettings);
  app.post('/api/admin/system-settings/reset-prefixes', resetPrefixes);
};
