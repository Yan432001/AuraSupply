const consignmentsCtrl = require('../../../controller/admin/consignments.controller');

module.exports = (app) => {
  // 1. Metadata options
  const metaEndpoints = [
    '/api/admin/consignments/meta/options',
    '/api/admin/products/consignments/meta/options',
    '/api/consignments/meta/options',
    '/api/products/consignments/meta/options',
  ];
  metaEndpoints.forEach(path => app.get(path, consignmentsCtrl.getMetadataOptions));

  // 2. Search products for consignment dispatch
  const productEndpoints = [
    '/api/admin/consignments/products',
    '/api/admin/products/consignments/products',
    '/api/consignments/products',
  ];
  productEndpoints.forEach(path => app.get(path, consignmentsCtrl.getAvailableProducts));

  // 3. List and create consignments
  const listEndpoints = [
    '/api/admin/consignments',
    '/api/admin/products/consignments',
    '/api/consignments',
    '/api/products/consignments',
  ];
  listEndpoints.forEach(path => {
    app.get(path, consignmentsCtrl.listConsignments);
    app.post(path, consignmentsCtrl.createConsignment);
  });

  // 4. Returns & Sales endpoints
  const returnEndpoints = [
    '/api/admin/consignments/:id/returns',
    '/api/admin/products/consignments/:id/returns',
    '/api/consignments/:id/returns',
  ];
  returnEndpoints.forEach(path => app.post(path, consignmentsCtrl.recordConsignmentReturn));

  const salesEndpoints = [
    '/api/admin/consignments/:id/sales',
    '/api/admin/products/consignments/:id/sales',
    '/api/consignments/:id/sales',
  ];
  salesEndpoints.forEach(path => app.post(path, consignmentsCtrl.recordConsignmentSales));

  // 5. Single item CRUD (details, update, delete)
  const itemEndpoints = [
    '/api/admin/consignments/:id',
    '/api/admin/products/consignments/:id',
    '/api/consignments/:id',
    '/api/products/consignments/:id',
  ];
  itemEndpoints.forEach(path => {
    app.get(path, consignmentsCtrl.getConsignmentById);
    app.put(path, consignmentsCtrl.updateConsignment);
    app.delete(path, consignmentsCtrl.deleteConsignment);
  });

  console.log('[Route] Mounted admin/consignments.route');
};
