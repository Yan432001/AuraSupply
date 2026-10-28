const PurchaseRequestsModel = require('../../models/admins/purchaseRequests.model');
const { sendSuccess, sendError } = require('../../config/utill/response');

/**
 * PURCHASE REQUESTS MANAGEMENT CONTROLLER
 * Aligned with Cyspharma Purchases_request.php & Purchases_request_model.php architecture
 */

/**
 * GET /api/admin/purchase_requests/meta/options
 * Retrieve warehouses, departments, suppliers, billers, next ref, and statuses
 */
exports.getMetadataOptions = async (req, res) => {
  try {
    const meta = await PurchaseRequestsModel.getMetadataOptions();
    return sendSuccess(res, meta, 'Purchase requests metadata options retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve purchase requests metadata options', 500);
  }
};

/**
 * GET /api/admin/purchase_requests/products
 * Search products with live warehouse stock balances / QOH
 */
exports.searchProducts = async (req, res) => {
  try {
    const { warehouse_id = 'all', term = '', limit = 20 } = req.query;
    const products = await PurchaseRequestsModel.searchProducts(warehouse_id, term, limit);
    return sendSuccess(res, products, 'Products retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to search products for purchase request', 500);
  }
};

/**
 * GET /api/admin/purchase_requests
 * List purchase requests with filters, pagination, and KPI metrics
 */
exports.listPurchaseRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      warehouse_id = 'all',
      department_id = 'all',
      supplier_id = 'all',
      start_date = '',
      end_date = '',
    } = req.query;

    const filters = {
      search,
      status,
      warehouse_id,
      department_id,
      supplier_id,
      start_date,
      end_date,
    };

    const result = await PurchaseRequestsModel.listPurchaseRequests(filters, { page, limit });
    return sendSuccess(res, result, 'Purchase requests list retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to list purchase requests', 500);
  }
};

/**
 * GET /api/admin/purchase_requests/:id
 * Retrieve a single purchase request by ID with full item details
 */
exports.getPurchaseRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await PurchaseRequestsModel.getPurchaseRequestById(id);
    if (!request) {
      return sendError(res, `Purchase request #${id} not found`, 404);
    }
    return sendSuccess(res, request, 'Purchase request details retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to get purchase request details', 500);
  }
};

/**
 * POST /api/admin/purchase_requests
 * Create a new purchase request
 */
exports.createPurchaseRequest = async (req, res) => {
  try {
    const user = req.user || { id: 1, username: 'admin' };
    const result = await PurchaseRequestsModel.createPurchaseRequest(req.body, user);
    return sendSuccess(res, result, 'Purchase request created successfully', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create purchase request', 400);
  }
};

/**
 * PUT /api/admin/purchase_requests/:id
 * Update an existing purchase request
 */
exports.updatePurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const result = await PurchaseRequestsModel.updatePurchaseRequest(id, req.body, user);
    return sendSuccess(res, result, 'Purchase request updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update purchase request', 400);
  }
};

/**
 * DELETE /api/admin/purchase_requests/:id
 * Delete a purchase request
 */
exports.deletePurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const result = await PurchaseRequestsModel.deletePurchaseRequest(id, user);
    return sendSuccess(res, result, 'Purchase request deleted successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete purchase request', 400);
  }
};

/**
 * POST /api/admin/purchase_requests/:id/approve
 * Approve purchase request
 */
exports.approvePurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const result = await PurchaseRequestsModel.approvePurchaseRequest(id, user);
    return sendSuccess(res, result, 'Purchase request approved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to approve purchase request', 400);
  }
};

/**
 * POST /api/admin/purchase_requests/:id/reject
 * Reject purchase request
 */
exports.rejectPurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const { reason = '' } = req.body;
    const result = await PurchaseRequestsModel.rejectPurchaseRequest(id, user, reason);
    return sendSuccess(res, result, 'Purchase request rejected successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to reject purchase request', 400);
  }
};

/**
 * POST /api/admin/purchase_requests/:id/unapprove
 * Revert purchase request to pending
 */
exports.unapprovePurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const result = await PurchaseRequestsModel.unapprovePurchaseRequest(id, user);
    return sendSuccess(res, result, 'Purchase request reverted to pending');
  } catch (err) {
    return sendError(res, err.message || 'Failed to unapprove purchase request', 400);
  }
};
