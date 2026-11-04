const SalesOrderModel = require('../../models/admins/sales_order.model');
const SalesModel = require('../../models/admins/sales.model');
const { logError } = require('../../config/utill/logErr');

/**
 * Sales Order Controller
 * Replicated from AURA_v1 (Sales_order.php)
 */

/**
 * GET /api/admin/sales_orders
 * Paginated sales order list with filtering, sorting, and metrics
 */
exports.getSalesOrders = async (req, res) => {
  try {
    const {
      search,
      sale_status,
      order_status,
      customer_id,
      biller_id,
      warehouse_id,
      start_date,
      end_date,
      sortBy,
      sortOrder,
      page = 1,
      limit = 20
    } = req.query;

    const result = await SalesOrderModel.getSalesOrders({
      search,
      sale_status,
      order_status,
      customer_id,
      biller_id,
      warehouse_id,
      start_date,
      end_date,
      sortBy,
      sortOrder,
      page,
      limit
    });

    res.json({
      status: true,
      data: result.orders,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      },
      metrics: result.metrics
    });
  } catch (err) {
    logError('sales_order.controller.getSalesOrders', err, res);
  }
};

/**
 * GET /api/admin/sales_orders/meta/options
 * Dropdown options for Add/Edit Sale Order
 */
exports.getMetadata = async (req, res) => {
  try {
    const meta = await SalesModel.getMetadata();
    const nextRef = await SalesOrderModel.generateNextReference();

    res.json({
      status: true,
      data: {
        ...meta,
        nextReferenceNo: nextRef
      }
    });
  } catch (err) {
    logError('sales_order.controller.getMetadata', err, res);
  }
};

/**
 * GET /api/admin/sales_orders/:id
 * Single Sales Order by ID
 */
exports.getSaleOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await SalesOrderModel.getSaleOrderById(id);

    if (!order) {
      return res.status(404).json({
        status: false,
        message: 'Sales order not found'
      });
    }

    res.json({
      status: true,
      data: order
    });
  } catch (err) {
    logError('sales_order.controller.getSaleOrderById', err, res);
  }
};

/**
 * POST /api/admin/sales_orders
 * Create new Sales Order
 */
exports.createSaleOrder = async (req, res) => {
  try {
    const rawOrder = req.body.order || req.body;
    const items = req.body.items || rawOrder.items;
    let payment = req.body.payment;

    if (!payment && Number(rawOrder.paid) > 0) {
      payment = {
        amount: Number(rawOrder.paid),
        paid_by: rawOrder.paid_by || 'Cash',
        note: rawOrder.payment_note || 'Advance customer deposit'
      };
    }

    if (!rawOrder || !rawOrder.customer_id) {
      return res.status(400).json({
        status: false,
        message: 'Customer is required for creating a Sales Order'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Please add at least one line item to the Sales Order'
      });
    }

    const userId = req.user?.id || 1;
    const result = await SalesOrderModel.createSaleOrder(rawOrder, items, payment, userId);

    res.status(201).json({
      status: true,
      message: 'Sales Order created successfully',
      data: result
    });
  } catch (err) {
    logError('sales_order.controller.createSaleOrder', err, res);
  }
};

/**
 * PUT /api/admin/sales_orders/:id
 * Update existing Sales Order
 */
exports.updateSaleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const rawOrder = req.body.order || req.body;
    const items = req.body.items || rawOrder.items;

    if (!rawOrder || !rawOrder.customer_id) {
      return res.status(400).json({
        status: false,
        message: 'Customer is required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Please provide at least one product line item'
      });
    }

    const userId = req.user?.id || 1;
    const result = await SalesOrderModel.updateSaleOrder(id, rawOrder, items, userId);

    res.json({
      status: true,
      message: 'Sales Order updated successfully',
      data: result
    });
  } catch (err) {
    logError('sales_order.controller.updateSaleOrder', err, res);
  }
};

/**
 * DELETE /api/admin/sales_orders/:id
 * Delete Sales Order
 */
exports.deleteSaleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await SalesOrderModel.deleteSaleOrder(id);

    res.json({
      status: true,
      message: 'Sales Order deleted successfully'
    });
  } catch (err) {
    logError('sales_order.controller.deleteSaleOrder', err, res);
  }
};

/**
 * PUT /api/admin/sales_orders/:id/status
 * Update Sales Order status (e.g. approved, rejected, order, completed)
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { sale_status, order_status, note } = req.body;

    const userId = req.user?.id || 1;
    await SalesOrderModel.updateStatus(id, { sale_status, order_status, note }, userId);

    res.json({
      status: true,
      message: 'Sales Order status updated successfully'
    });
  } catch (err) {
    logError('sales_order.controller.updateStatus', err, res);
  }
};

/**
 * POST /api/admin/sales_orders/:id/convert-to-sale
 * Convert an approved Sales Order into a confirmed Commercial Sale (Invoice)
 */
exports.convertToSale = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    const result = await SalesOrderModel.convertToSale(id, userId);

    res.json({
      status: true,
      message: `Sale Order #${id} successfully converted to Commercial Sale #${result.referenceNo}`,
      data: result
    });
  } catch (err) {
    logError('sales_order.controller.convertToSale', err, res);
  }
};

/**
 * POST /api/admin/sales_orders/:id/deposits
 * Record customer advance deposit payment
 */
exports.addDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;
    const userId = req.user?.id || 1;

    const result = await SalesOrderModel.addDeposit(id, paymentData, userId);

    res.status(201).json({
      status: true,
      message: 'Deposit payment recorded successfully',
      data: result
    });
  } catch (err) {
    logError('sales_order.controller.addDeposit', err, res);
  }
};
