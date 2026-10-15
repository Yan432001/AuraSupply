const ctrl = require('../API/app/controller/web/themePublic.controller');

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.body = obj;
      return this;
    }
  };
  return res;
}

async function testEndpoints() {
  console.log('--- Testing API Endpoints ---');

  // 1. GET /api/products
  const resProd = mockRes();
  await ctrl.getProducts({ query: { limit: 5 } }, resProd);
  console.log('1. getProducts:', resProd.statusCode, 'count:', resProd.body?.data?.length, 'sample:', resProd.body?.data?.[0]?.name);

  // 2. GET /api/products/:slug
  const slug = resProd.body?.data?.[0]?.slug || 'mondulkiri-arabica-beans';
  const resSingle = mockRes();
  await ctrl.getProductBySlug({ params: { slug } }, resSingle);
  console.log('2. getProductBySlug ("' + slug + '"):', resSingle.statusCode, resSingle.body?.data?.name, 'biller:', resSingle.body?.data?.shop?.name);

  // 3. GET /api/categories
  const resCat = mockRes();
  await ctrl.getCategories({}, resCat);
  console.log('3. getCategories:', resCat.statusCode, 'count:', resCat.body?.data?.length, 'sample:', resCat.body?.data?.[0]?.name);

  // 4. GET /api/brands
  const resBrand = mockRes();
  await ctrl.getBrands({}, resBrand);
  console.log('4. getBrands:', resBrand.statusCode, 'count:', resBrand.body?.data?.length);

  // 5. GET /api/shops
  const resShops = mockRes();
  await ctrl.getShops({ query: {} }, resShops);
  console.log('5. getShops:', resShops.statusCode, 'count:', resShops.body?.data?.length, 'sample:', resShops.body?.data?.[0]?.name);

  // 6. GET /api/banners
  const resBanners = mockRes();
  await ctrl.getBanners({}, resBanners);
  console.log('6. getBanners:', resBanners.statusCode, 'count:', resBanners.body?.data?.length, 'sample:', resBanners.body?.data?.[0]?.title);

  // 7. GET /api/shop-settings
  const resSettings = mockRes();
  await ctrl.getShopSettings({}, resSettings);
  console.log('7. getShopSettings:', resSettings.statusCode, resSettings.body?.data?.shopName, resSettings.body?.data?.phone);

  // 8. GET /api/posts
  const resPosts = mockRes();
  await ctrl.getPosts({}, resPosts);
  console.log('8. getPosts:', resPosts.statusCode, 'count:', resPosts.body?.data?.length, 'sample:', resPosts.body?.data?.[0]?.title);

  // 9. GET /api/reviews
  const resReviews = mockRes();
  await ctrl.getReviews({ query: {} }, resReviews);
  console.log('9. getReviews:', resReviews.statusCode, 'count:', resReviews.body?.data?.length);

  // 10. POST /api/newsletter
  const resNews = mockRes();
  await ctrl.submitNewsletter({ body: { email: 'test.procurement@corporation.com' } }, resNews);
  console.log('10. submitNewsletter:', resNews.statusCode, resNews.body?.message);

  // 11. POST /api/contact
  const resContact = mockRes();
  await ctrl.submitContact({ body: { name: 'Dara Test', email: 'dara@test.com', message: 'Inquiry regarding bulk wholesale' } }, resContact);
  console.log('11. submitContact:', resContact.statusCode, resContact.body?.message);

  // 12. POST /api/orders
  const resOrder = mockRes();
  await ctrl.submitOrder({
    body: {
      customer: { name: 'Aura Test Buyer', phone: '012 345 678', email: 'buyer@aura.com', company: 'Aura Enterprise' },
      items: [{ id: resProd.body?.data?.[0]?.id, name: resProd.body?.data?.[0]?.name, price: 16.5, quantity: 2 }]
    }
  }, resOrder);
  console.log('12. submitOrder:', resOrder.statusCode, resOrder.body?.data?.reference_no, 'total:', resOrder.body?.data?.total);

  // 13. GET /api/orders
  const resOrdersList = mockRes();
  await ctrl.getOrders({}, resOrdersList);
  console.log('13. getOrders:', resOrdersList.statusCode, 'count:', resOrdersList.body?.data?.length, 'recent ref:', resOrdersList.body?.data?.[0]?.reference_no);

  process.exit(0);
}

testEndpoints().catch(e => { console.error(e); process.exit(1); });
