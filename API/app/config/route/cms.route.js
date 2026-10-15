const cmsController = require('../../controller/admin/cms.controller');

module.exports = (app) => {
  // Public & General Endpoints
  app.get('/api/cms/all', cmsController.getAll);
  app.get('/api/cms/settings', cmsController.getSettings);
  app.post('/api/cms/settings', cmsController.updateSettings);

  app.get('/api/cms/menus', cmsController.getMenus);
  app.post('/api/cms/menus', cmsController.saveMenu);
  app.delete('/api/cms/menus/:id', cmsController.deleteMenu);

  app.get('/api/cms/hero', cmsController.getHeroSlides);
  app.post('/api/cms/hero', cmsController.saveHeroSlide);
  app.delete('/api/cms/hero/:id', cmsController.deleteHeroSlide);

  app.get('/api/cms/pages', cmsController.getPages);
  app.get('/api/cms/pages/:slug', cmsController.getPageBySlug);
  app.post('/api/cms/pages', cmsController.savePage);
  app.delete('/api/cms/pages/:id', cmsController.deletePage);

  app.get('/api/cms/posts', cmsController.getPosts);
  app.post('/api/cms/posts', cmsController.savePost);
  app.delete('/api/cms/posts/:id', cmsController.deletePost);

  app.get('/api/cms/team', cmsController.getTeam);
  app.post('/api/cms/team', cmsController.saveTeamMember);
  app.delete('/api/cms/team/:id', cmsController.deleteTeamMember);

  app.get('/api/cms/testimonials', cmsController.getTestimonials);
  app.post('/api/cms/testimonials', cmsController.saveTestimonial);
  app.delete('/api/cms/testimonials/:id', cmsController.deleteTestimonial);

  app.get('/api/cms/faqs', cmsController.getFaqs);
  app.post('/api/cms/faqs', cmsController.saveFaq);
  app.delete('/api/cms/faqs/:id', cmsController.deleteFaq);

  app.get('/api/cms/partners', cmsController.getPartners);
  app.post('/api/cms/partners', cmsController.savePartner);
  app.delete('/api/cms/partners/:id', cmsController.deletePartner);

  app.get('/api/cms/inquiries', cmsController.getInquiries);
  app.post('/api/cms/inquiries', cmsController.submitInquiry);
  app.put('/api/cms/inquiries/:id', cmsController.updateInquiry);
  app.delete('/api/cms/inquiries/:id', cmsController.deleteInquiry);

  app.get('/api/cms/subscribers', cmsController.getSubscribers);
  app.post('/api/cms/subscribers', cmsController.subscribe);
  app.delete('/api/cms/subscribers/:id', cmsController.deleteSubscriber);

  app.get('/api/cms/media', cmsController.getMedia);
  app.post('/api/cms/media', cmsController.addMedia);
  app.delete('/api/cms/media/:id', cmsController.deleteMedia);

  app.post('/api/cms/bulk-import/:collection', cmsController.bulkImport);

  app.get('/api/cms/db-status', cmsController.getDbStatus);
};
