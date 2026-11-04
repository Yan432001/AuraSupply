const salesOrderCtrl = require('../../../controller/admin/sales_order.controller');

module.exports = (app) => {
  // Sales Orders Metadata
  const metaPaths = [
    '/api/admin/sales_orders/meta/options',
    '/api/admin/sales-orders/meta/options',
    '/api/admin/sales/orders/meta/options'
  ];
  metaPaths.forEach(p => app.get(p, salesOrderCtrl.getMetadata));

  // Convert to Sale
  const convertPaths = [
    '/api/admin/sales_orders/:id/convert-to-sale',
    '/api/admin/sales-orders/:id/convert-to-sale',
    '/api/admin/sales/orders/:id/convert-to-sale'
  ];
  convertPaths.forEach(p => app.post(p, salesOrderCtrl.convertToSale));

  // Status updates
  const statusPaths = [
    '/api/admin/sales_orders/:id/status',
    '/api/admin/sales-orders/:id/status',
    '/api/admin/sales/orders/:id/status'
  ];
  statusPaths.forEach(p => {
    app.put(p, salesOrderCtrl.updateStatus);
    app.patch(p, salesOrderCtrl.updateStatus);
  });

  // Deposits
  const depositPaths = [
    '/api/admin/sales_orders/:id/deposits',
    '/api/admin/sales-orders/:id/deposits',
    '/api/admin/sales/orders/:id/deposits'
  ];
  depositPaths.forEach(p => app.post(p, salesOrderCtrl.addDeposit));

  // Core Sales Orders CRUD
  const listPaths = [
    '/api/admin/sales_orders',
    '/api/admin/sales-orders',
    '/api/admin/sales/orders'
  ];
  listPaths.forEach(p => {
    app.get(p, salesOrderCtrl.getSalesOrders);
    app.post(p, salesOrderCtrl.createSaleOrder);
  });

  const itemPaths = [
    '/api/admin/sales_orders/:id',
    '/api/admin/sales-orders/:id',
    '/api/admin/sales/orders/:id'
  ];
  itemPaths.forEach(p => {
    app.get(p, salesOrderCtrl.getSaleOrderById);
    app.put(p, salesOrderCtrl.updateSaleOrder);
    app.delete(p, salesOrderCtrl.deleteSaleOrder);
  });
};
