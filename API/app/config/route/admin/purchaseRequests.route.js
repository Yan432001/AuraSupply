const purchaseRequestsCtrl = require('../../../controller/admin/purchaseRequests.controller');

module.exports = (app) => {
  // 1. Metadata options
  const metaEndpoints = [
    '/api/admin/purchase_requests/meta/options',
    '/api/admin/purchase-requests/meta/options',
    '/api/admin/products/purchase_requests/meta/options',
    '/api/admin/products/purchase-requests/meta/options',
    '/api/purchase_requests/meta/options',
    '/api/purchase-requests/meta/options',
    '/api/products/purchase_requests/meta/options',
    '/api/products/purchase-requests/meta/options',
  ];
  metaEndpoints.forEach(path => app.get(path, purchaseRequestsCtrl.getMetadataOptions));

  // 2. Search products for purchase request
  const productEndpoints = [
    '/api/admin/purchase_requests/products',
    '/api/admin/purchase-requests/products',
    '/api/admin/products/purchase_requests/products',
    '/api/admin/products/purchase-requests/products',
    '/api/purchase_requests/products',
    '/api/purchase-requests/products',
    '/api/products/purchase_requests/products',
  ];
  productEndpoints.forEach(path => app.get(path, purchaseRequestsCtrl.searchProducts));

  // 3. Approval workflow endpoints
  const approveEndpoints = [
    '/api/admin/purchase_requests/:id/approve',
    '/api/admin/purchase-requests/:id/approve',
    '/api/admin/products/purchase_requests/:id/approve',
    '/api/admin/products/purchase-requests/:id/approve',
    '/api/purchase_requests/:id/approve',
    '/api/purchase-requests/:id/approve',
  ];
  approveEndpoints.forEach(path => app.post(path, purchaseRequestsCtrl.approvePurchaseRequest));

  const rejectEndpoints = [
    '/api/admin/purchase_requests/:id/reject',
    '/api/admin/purchase-requests/:id/reject',
    '/api/admin/products/purchase_requests/:id/reject',
    '/api/admin/products/purchase-requests/:id/reject',
    '/api/purchase_requests/:id/reject',
    '/api/purchase-requests/:id/reject',
  ];
  rejectEndpoints.forEach(path => app.post(path, purchaseRequestsCtrl.rejectPurchaseRequest));

  const unapproveEndpoints = [
    '/api/admin/purchase_requests/:id/unapprove',
    '/api/admin/purchase-requests/:id/unapprove',
    '/api/admin/products/purchase_requests/:id/unapprove',
    '/api/admin/products/purchase-requests/:id/unapprove',
    '/api/purchase_requests/:id/unapprove',
    '/api/purchase-requests/:id/unapprove',
  ];
  unapproveEndpoints.forEach(path => app.post(path, purchaseRequestsCtrl.unapprovePurchaseRequest));

  // 4. List and create purchase requests
  const listEndpoints = [
    '/api/admin/purchase_requests',
    '/api/admin/purchase-requests',
    '/api/admin/products/purchase_requests',
    '/api/admin/products/purchase-requests',
    '/api/purchase_requests',
    '/api/purchase-requests',
    '/api/products/purchase_requests',
    '/api/products/purchase-requests',
  ];
  listEndpoints.forEach(path => {
    app.get(path, purchaseRequestsCtrl.listPurchaseRequests);
    app.post(path, purchaseRequestsCtrl.createPurchaseRequest);
  });

  // 5. Single item CRUD (details, update, delete)
  const itemEndpoints = [
    '/api/admin/purchase_requests/:id',
    '/api/admin/purchase-requests/:id',
    '/api/admin/products/purchase_requests/:id',
    '/api/admin/products/purchase-requests/:id',
    '/api/purchase_requests/:id',
    '/api/purchase-requests/:id',
    '/api/products/purchase_requests/:id',
    '/api/products/purchase-requests/:id',
  ];
  itemEndpoints.forEach(path => {
    app.get(path, purchaseRequestsCtrl.getPurchaseRequestById);
    app.put(path, purchaseRequestsCtrl.updatePurchaseRequest);
    app.delete(path, purchaseRequestsCtrl.deletePurchaseRequest);
  });
};
