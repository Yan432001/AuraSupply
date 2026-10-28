const rewardsExchangeCtrl = require('../../../controller/admin/rewardsExchange.controller');

module.exports = (app) => {
  // 1. Metadata options
  const metaEndpoints = [
    '/api/admin/rewards_exchange/meta/options',
    '/api/admin/rewards-exchange/meta/options',
    '/api/admin/products/rewards_exchange/meta/options',
    '/api/admin/products/rewards-exchange/meta/options',
    '/api/rewards_exchange/meta/options',
    '/api/rewards-exchange/meta/options',
    '/api/products/rewards_exchange/meta/options',
    '/api/products/rewards-exchange/meta/options',
  ];
  metaEndpoints.forEach(path => app.get(path, rewardsExchangeCtrl.getMetadataOptions));

  // 2. Search products for reward exchange
  const productEndpoints = [
    '/api/admin/rewards_exchange/products',
    '/api/admin/rewards-exchange/products',
    '/api/admin/products/rewards_exchange/products',
    '/api/admin/products/rewards-exchange/products',
    '/api/rewards_exchange/products',
    '/api/rewards-exchange/products',
    '/api/products/rewards_exchange/products',
  ];
  productEndpoints.forEach(path => app.get(path, rewardsExchangeCtrl.getExchangeableProducts));

  // 3. List and create rewards exchange
  const listEndpoints = [
    '/api/admin/rewards_exchange',
    '/api/admin/rewards-exchange',
    '/api/admin/products/rewards_exchange',
    '/api/admin/products/rewards-exchange',
    '/api/rewards_exchange',
    '/api/rewards-exchange',
    '/api/products/rewards_exchange',
    '/api/products/rewards-exchange',
  ];
  listEndpoints.forEach(path => {
    app.get(path, rewardsExchangeCtrl.listRewardsExchange);
    app.post(path, rewardsExchangeCtrl.createRewardsExchange);
  });

  // 4. Single exchange CRUD (details, update, delete)
  const itemEndpoints = [
    '/api/admin/rewards_exchange/:id',
    '/api/admin/rewards-exchange/:id',
    '/api/admin/products/rewards_exchange/:id',
    '/api/admin/products/rewards-exchange/:id',
    '/api/rewards_exchange/:id',
    '/api/rewards-exchange/:id',
    '/api/products/rewards_exchange/:id',
    '/api/products/rewards-exchange/:id',
  ];
  itemEndpoints.forEach(path => {
    app.get(path, rewardsExchangeCtrl.getRewardsExchangeById);
    app.put(path, rewardsExchangeCtrl.updateRewardsExchange);
    app.delete(path, rewardsExchangeCtrl.deleteRewardsExchange);
  });
};
