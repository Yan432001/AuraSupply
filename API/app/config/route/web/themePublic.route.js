const ctrl = require('../../../controller/web/themePublic.controller');

module.exports = (app) => {
  // Products Catalog
  app.get('/api/products', ctrl.getProducts);
  app.get('/api/products/:slug', ctrl.getProductBySlug);

  // Categories & Brands
  app.get('/api/categories', ctrl.getCategories);
  app.get('/api/brands', ctrl.getBrands);

  // Multi-Store & Verified Suppliers
  app.get('/api/shops', ctrl.getShops);
  app.get('/api/shops/:id', ctrl.getShopById);
  app.get('/api/stores', ctrl.getShops);
  app.get('/api/store/:id', ctrl.getShopById);

  // Store Settings & Banners
  app.get('/api/shop-settings', ctrl.getShopSettings);
  app.get('/api/banners', ctrl.getBanners);

  // CMS Pages & Menu
  app.get('/api/pages/:slug', ctrl.getPage);
  app.get('/api/menu', ctrl.getMenu);

  // Knowledge Base & Articles
  app.get('/api/posts', ctrl.getPosts);
  app.get('/api/posts/:slug', ctrl.getPage);

  // Customer Reviews
  app.get('/api/reviews', ctrl.getReviews);
  app.post('/api/reviews', ctrl.submitReview);

  // Newsletter & Contact Inquiries
  app.post('/api/newsletter', ctrl.submitNewsletter);
  app.post('/api/contact', ctrl.submitContact);

  // Commercial Orders
  app.post('/api/orders', ctrl.submitOrder);
  app.get('/api/orders', ctrl.getOrders);

  // Customer Account Registration
  app.post('/api/register', ctrl.registerCustomer);
  app.post('/api/auth/register-public', ctrl.registerCustomer);

  // Currency & Branch Locations
  app.get('/api/currencies', ctrl.getCurrencies);
  app.get('/api/branches', ctrl.getBranches);
};
