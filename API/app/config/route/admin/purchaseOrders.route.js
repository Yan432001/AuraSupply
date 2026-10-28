const purchaseOrdersCtrl = require('../../../controller/admin/purchaseOrders.controller');

module.exports = (app) => {
  // 1. Metadata options
  const metaEndpoints = [
    '/api/admin/purchase_orders/meta/options',
    '/api/admin/purchase-orders/meta/options',
    '/api/admin/purchases_orders/meta/options',
    '/api/admin/purchases-orders/meta/options',
    '/api/admin/products/purchase_orders/meta/options',
    '/api/admin/products/purchase-orders/meta/options',
    '/api/purchase_orders/meta/options',
    '/api/purchase-orders/meta/options',
    '/api/purchases_orders/meta/options',
    '/api/purchases-orders/meta/options',
    '/api/products/purchase_orders/meta/options',
    '/api/products/purchase-orders/meta/options',
  ];
  metaEndpoints.forEach(path => app.get(path, purchaseOrdersCtrl.getMetadataOptions));

  // 2. Search products for purchase order
  const productEndpoints = [
    '/api/admin/purchase_orders/products',
    '/api/admin/purchase-orders/products',
    '/api/admin/purchases_orders/products',
    '/api/admin/purchases-orders/products',
    '/api/admin/products/purchase_orders/products',
    '/api/admin/products/purchase-orders/products',
    '/api/purchase_orders/products',
    '/api/purchase-orders/products',
    '/api/purchases_orders/products',
    '/api/purchases-orders/products',
    '/api/products/purchase_orders/products',
  ];
  productEndpoints.forEach(path => app.get(path, purchaseOrdersCtrl.searchProducts));

  // 3. Purchase Request import endpoints
  const prEndpoints = [
    '/api/admin/purchase_orders/purchase_requests',
    '/api/admin/purchase-orders/purchase_requests',
    '/api/admin/purchase_orders/purchase-requests',
    '/api/admin/purchase-orders/purchase-requests',
    '/api/admin/purchases_orders/purchase_requests',
    '/api/purchase_orders/purchase_requests',
    '/api/purchase-orders/purchase-requests',
  ];
  prEndpoints.forEach(path => app.get(path, purchaseOrdersCtrl.getApprovedPurchaseRequests));

  const prItemEndpoints = [
    '/api/admin/purchase_orders/purchase_requests/:id/items',
    '/api/admin/purchase-orders/purchase_requests/:id/items',
    '/api/admin/purchase_orders/purchase-requests/:id/items',
    '/api/admin/purchase-orders/purchase-requests/:id/items',
    '/api/purchase_orders/purchase_requests/:id/items',
  ];
  prItemEndpoints.forEach(path => app.get(path, purchaseOrdersCtrl.getPurchaseRequestForImport));

  // 4. Approval workflow endpoints
  const approveEndpoints = [
    '/api/admin/purchase_orders/:id/approve',
    '/api/admin/purchase-orders/:id/approve',
    '/api/admin/purchases_orders/:id/approve',
    '/api/admin/purchases-orders/:id/approve',
    '/api/admin/products/purchase_orders/:id/approve',
    '/api/admin/products/purchase-orders/:id/approve',
    '/api/purchase_orders/:id/approve',
    '/api/purchase-orders/:id/approve',
  ];
  approveEndpoints.forEach(path => app.post(path, purchaseOrdersCtrl.approvePurchaseOrder));

  const rejectEndpoints = [
    '/api/admin/purchase_orders/:id/reject',
    '/api/admin/purchase-orders/:id/reject',
    '/api/admin/purchases_orders/:id/reject',
    '/api/admin/purchases-orders/:id/reject',
    '/api/admin/products/purchase_orders/:id/reject',
    '/api/admin/products/purchase-orders/:id/reject',
    '/api/purchase_orders/:id/reject',
    '/api/purchase-orders/:id/reject',
  ];
  rejectEndpoints.forEach(path => app.post(path, purchaseOrdersCtrl.rejectPurchaseOrder));

  const unapproveEndpoints = [
    '/api/admin/purchase_orders/:id/unapprove',
    '/api/admin/purchase-orders/:id/unapprove',
    '/api/admin/purchases_orders/:id/unapprove',
    '/api/admin/purchases-orders/:id/unapprove',
    '/api/admin/products/purchase_orders/:id/unapprove',
    '/api/admin/products/purchase-orders/:id/unapprove',
    '/api/purchase_orders/:id/unapprove',
    '/api/purchase-orders/:id/unapprove',
  ];
  unapproveEndpoints.forEach(path => app.post(path, purchaseOrdersCtrl.unapprovePurchaseOrder));

  // 5. List and create purchase orders
  const listEndpoints = [
    '/api/admin/purchase_orders',
    '/api/admin/purchase-orders',
    '/api/admin/purchases_orders',
    '/api/admin/purchases-orders',
    '/api/admin/products/purchase_orders',
    '/api/admin/products/purchase-orders',
    '/api/purchase_orders',
    '/api/purchase-orders',
    '/api/purchases_orders',
    '/api/purchases-orders',
    '/api/products/purchase_orders',
    '/api/products/purchase-orders',
  ];
  listEndpoints.forEach(path => {
    app.get(path, purchaseOrdersCtrl.listPurchaseOrders);
    app.post(path, purchaseOrdersCtrl.createPurchaseOrder);
  });

  // 6. Single item CRUD (details, update, delete)
  const itemEndpoints = [
    '/api/admin/purchase_orders/:id',
    '/api/admin/purchase-orders/:id',
    '/api/admin/purchases_orders/:id',
    '/api/admin/purchases-orders/:id',
    '/api/admin/products/purchase_orders/:id',
    '/api/admin/products/purchase-orders/:id',
    '/api/purchase_orders/:id',
    '/api/purchase-orders/:id',
    '/api/purchases_orders/:id',
    '/api/purchases-orders/:id',
    '/api/products/purchase_orders/:id',
    '/api/products/purchase-orders/:id',
  ];
  itemEndpoints.forEach(path => {
    app.get(path, purchaseOrdersCtrl.getPurchaseOrderById);
    app.put(path, purchaseOrdersCtrl.updatePurchaseOrder);
    app.delete(path, purchaseOrdersCtrl.deletePurchaseOrder);
  });
};
