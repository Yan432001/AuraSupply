const langCtrl = require('../../../controller/admin/language.controller');
const { authenticate } = require('../../../middleware/permission.middleware');

module.exports = (app) => {
  // Public language queries
  app.get('/api/languages', langCtrl.getSupportedLanguages);
  app.get('/api/languages/supported', langCtrl.getSupportedLanguages);
  app.get('/api/languages/translations/:lang', langCtrl.getTranslations);
  app.get('/api/language/:lang', langCtrl.getTranslations);
  app.get('/api/languages/:lang', langCtrl.getTranslations);

  // User language switching (cloned from CodeIgniter 3 Welcome::language)
  app.post('/api/user/language', langCtrl.changeUserLanguage);
  app.post('/api/admin/user/language', langCtrl.changeUserLanguage);
  app.get('/api/admin/welcome/language/:lang', langCtrl.changeUserLanguage);
  app.get('/api/welcome/language/:lang', langCtrl.changeUserLanguage);

  // Administrative Language Management (cloned from System_settings::language)
  app.get('/api/admin/languages/entries', langCtrl.getLanguageEntries);
  app.post('/api/admin/languages/entries', authenticate, langCtrl.createLanguageEntry);
  app.put('/api/admin/languages/entries/:id', authenticate, langCtrl.updateLanguageEntry);
  app.delete('/api/admin/languages/entries/:id', authenticate, langCtrl.deleteLanguageEntry);
};
