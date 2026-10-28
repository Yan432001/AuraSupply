const PurchaseOrdersModel = require('../../models/admins/purchaseOrders.model');
const { sendSuccess, sendError } = require('../../config/utill/response');

/**
 * PURCHASE ORDERS MANAGEMENT CONTROLLER
 * Aligned with Cyspharma Purchases_order.php & Purchases_order_model.php architecture
 */

/**
 * GET /api/admin/purchase_orders/meta/options
 * Retrieve warehouses, suppliers, billers, projects, tax rates, approved PRs, next ref, and statuses
 */
exports.getMetadataOptions = async (req, res) => {
  try {
    const meta = await PurchaseOrdersModel.getMetadataOptions();
    return sendSuccess(res, meta, 'Purchase orders metadata options retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve purchase orders metadata options', 500);
  }
};

/**
 * GET /api/admin/purchase_orders/products
 * Search products with live warehouse stock balances / QOH
 */
exports.searchProducts = async (req, res) => {
  try {
    const { warehouse_id = 'all', supplier_id = null, term = '', limit = 25 } = req.query;
    const products = await PurchaseOrdersModel.searchProducts(warehouse_id, supplier_id, term, limit);
    return sendSuccess(res, products, 'Products retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to search products for purchase order', 500);
  }
};

/**
 * GET /api/admin/purchase_orders/purchase_requests
 * List approved purchase requests available for conversion to purchase order
 */
exports.getApprovedPurchaseRequests = async (req, res) => {
  try {
    const { supplier_id = null, warehouse_id = null } = req.query;
    const requests = await PurchaseOrdersModel.getApprovedPurchaseRequests(supplier_id, warehouse_id);
    return sendSuccess(res, requests, 'Approved purchase requests retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve approved purchase requests', 500);
  }
};

/**
 * GET /api/admin/purchase_orders/purchase_requests/:id/items
 * Retrieve unfilled items for a specific purchase request for importing into PO
 */
exports.getPurchaseRequestForImport = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouse_id = null } = req.query;
    const data = await PurchaseOrdersModel.getPurchaseRequestForImport(id, warehouse_id);
    return sendSuccess(res, data, 'Purchase request import items retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve items for import', 500);
  }
};

/**
 * GET /api/admin/purchase_orders
 * List purchase orders with filters, pagination, and KPI metrics
 */
exports.listPurchaseOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      order_status = 'all',
      warehouse_id = 'all',
      supplier_id = 'all',
      start_date = '',
      end_date = '',
    } = req.query;

    const filters = {
      search,
      status,
      order_status,
      warehouse_id,
      supplier_id,
      start_date,
      end_date,
    };

    const result = await PurchaseOrdersModel.listPurchaseOrders(filters, { page, limit });
    return sendSuccess(res, result, 'Purchase orders list retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to list purchase orders', 500);
  }
};

/**
 * GET /api/admin/purchase_orders/:id
 * Retrieve a single purchase order by ID with line items
 */
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await PurchaseOrdersModel.getPurchaseOrderById(id);
    if (!order) {
      return sendError(res, `Purchase order #${id} not found`, 404);
    }
    return sendSuccess(res, order, 'Purchase order details retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to get purchase order details', 500);
  }
};

/**
 * POST /api/admin/purchase_orders
 * Create a new purchase order
 */
exports.createPurchaseOrder = async (req, res) => {
  try {
    const user = req.user || { id: 1, username: 'admin' };
    const result = await PurchaseOrdersModel.createPurchaseOrder(req.body, user);
    return sendSuccess(res, result, 'Purchase order created successfully', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create purchase order', 400);
  }
};

/**
 * PUT /api/admin/purchase_orders/:id
 * Update an existing purchase order
 */
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const result = await PurchaseOrdersModel.updatePurchaseOrder(id, req.body, user);
    return sendSuccess(res, result, 'Purchase order updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update purchase order', 400);
  }
};

/**
 * DELETE /api/admin/purchase_orders/:id
 * Delete a purchase order
 */
exports.deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const result = await PurchaseOrdersModel.deletePurchaseOrder(id, user);
    return sendSuccess(res, result, 'Purchase order deleted successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete purchase order', 400);
  }
};

/**
 * POST /api/admin/purchase_orders/:id/approve
 * Approve purchase order
 */
exports.approvePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const result = await PurchaseOrdersModel.approvePurchaseOrder(id, user);
    return sendSuccess(res, result, 'Purchase order approved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to approve purchase order', 400);
  }
};

/**
 * POST /api/admin/purchase_orders/:id/reject
 * Reject purchase order
 */
exports.rejectPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const { reason = '' } = req.body;
    const result = await PurchaseOrdersModel.rejectPurchaseOrder(id, user, reason);
    return sendSuccess(res, result, 'Purchase order rejected successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to reject purchase order', 400);
  }
};

/**
 * POST /api/admin/purchase_orders/:id/unapprove
 * Revert purchase order to pending
 */
exports.unapprovePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const result = await PurchaseOrdersModel.unapprovePurchaseOrder(id, user);
    return sendSuccess(res, result, 'Purchase order reverted to pending');
  } catch (err) {
    return sendError(res, err.message || 'Failed to unapprove purchase order', 400);
  }
};
