const ctrl = require('../../../controller/admin/moneyExchange.controller');

module.exports = (app) => {
  const prefixes = ['/api/admin/money_exchange', '/api/admin/money-exchange', '/api/admin/money'];

  prefixes.forEach((base) => {
    // 1. Metadata & Service Product Suggestions (register before /:id)
    app.get(`${base}/meta/options`, ctrl.getMetadata);
    app.get(`${base}/suggestions`, ctrl.getSuggestions);

    // 2. Exchange Rates Matrix & Live Pair Lookup
    app.get(`${base}/rates`, ctrl.getExchangeRates);
    app.post(`${base}/rates`, ctrl.saveExchangeRates);
    app.put(`${base}/rates`, ctrl.saveExchangeRates);
    app.get(`${base}/rate-lookup`, ctrl.lookupExchangeRate);

    // 3. Currencies Management (aura_currencies)
    app.get(`${base}/currencies`, ctrl.listCurrencies);
    app.post(`${base}/currencies`, ctrl.createCurrency);
    app.put(`${base}/currencies/:currencyId`, ctrl.updateCurrency);
    app.delete(`${base}/currencies/:currencyId`, ctrl.deleteCurrency);

    // 4. Transfer Companies & Tiered Transfer Ranges
    app.get(`${base}/transfer-companies`, ctrl.listTransferCompanies);
    app.post(`${base}/transfer-companies`, ctrl.createTransferCompany);
    app.get(`${base}/transfer-companies/range-lookup`, ctrl.lookupTransferRange);
    app.get(`${base}/transfer-companies/:companyId`, ctrl.getTransferCompanyById);
    app.put(`${base}/transfer-companies/:companyId`, ctrl.updateTransferCompany);
    app.delete(`${base}/transfer-companies/:companyId`, ctrl.deleteTransferCompany);
    app.get(`${base}/transfer-companies/:companyId/ranges`, ctrl.getTransferRanges);
    app.post(`${base}/transfer-companies/:companyId/ranges`, ctrl.saveTransferRanges);
    app.put(`${base}/transfer-companies/:companyId/ranges`, ctrl.saveTransferRanges);

    // 5. Bulk Delete
    app.post(`${base}/bulk-delete`, ctrl.bulkDeleteExchanges);

    // 6. Core Money Exchange CRUD & Payments
    app.get(base, ctrl.listExchanges);
    app.post(base, ctrl.createExchange);
    app.get(`${base}/:id`, ctrl.getExchangeById);
    app.put(`${base}/:id`, ctrl.updateExchange);
    app.delete(`${base}/:id`, ctrl.deleteExchange);

    app.get(`${base}/:id/payments`, ctrl.getPayments);
    app.post(`${base}/:id/payments`, ctrl.addPayment);
    app.delete(`${base}/:id/payments/:paymentId`, ctrl.deletePayment);
  });
};
