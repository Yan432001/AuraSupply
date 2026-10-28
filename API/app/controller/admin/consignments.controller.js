const ConsignmentsModel = require('../../models/admins/consignments.model');
const { sendSuccess, sendError } = require('../../config/utill/response');

/**
 * CONSIGNMENTS MANAGEMENT CONTROLLER
 * Aligned with AURA_v1 Products.php & Products_model.php consignments architecture
 */

/**
 * GET /api/admin/consignments/meta/options
 * Retrieve warehouses, customers/consignees, billers, next reference, and statuses
 */
exports.getMetadataOptions = async (req, res) => {
  try {
    const meta = await ConsignmentsModel.getMetadataOptions();
    return sendSuccess(res, meta, 'Consignment metadata options retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve consignment metadata options', 500);
  }
};

/**
 * GET /api/admin/consignments/products
 * Search available products with current warehouse stock balances for consignment dispatch
 */
exports.getAvailableProducts = async (req, res) => {
  try {
    const { warehouse_id = 'all', term = '', limit = 20 } = req.query;
    const products = await ConsignmentsModel.getAvailableProducts(warehouse_id, term, limit);
    return sendSuccess(res, products, 'Products retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to search products for consignment', 500);
  }
};

/**
 * GET /api/admin/consignments
 * List consignments with search, filters, metrics, and pagination
 */
exports.listConsignments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      warehouse_id = 'all',
      customer_id = 'all',
      status = 'all',
      start_date = '',
      end_date = '',
    } = req.query;

    const filters = {
      search,
      warehouse_id,
      customer_id,
      status,
      start_date,
      end_date,
    };

    const result = await ConsignmentsModel.listConsignments(filters, { page, limit });
    return sendSuccess(res, result, 'Consignments list retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to list consignments', 500);
  }
};

/**
 * GET /api/admin/consignments/:id
 * Retrieve single consignment record by ID
 */
exports.getConsignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await ConsignmentsModel.getConsignmentById(id);
    if (!record) {
      return sendError(res, `Consignment voucher #${id} not found`, 404);
    }
    return sendSuccess(res, record, 'Consignment record retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve consignment record', 500);
  }
};

/**
 * POST /api/admin/consignments
 * Create a new consignment and post inventory dispatch
 */
exports.createConsignment = async (req, res) => {
  try {
    const payload = req.body;
    const user = req.user || { id: 1, username: 'admin' };

    if (!payload.warehouse_id) {
      return sendError(res, 'Source Warehouse is required.', 400);
    }
    if (!payload.customer_id) {
      return sendError(res, 'Customer / Consignee is required.', 400);
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return sendError(res, 'Consignment must include at least one product item.', 400);
    }

    const result = await ConsignmentsModel.createConsignment(payload, user);
    return sendSuccess(res, result, 'Consignment voucher created successfully and inventory dispatched.', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create consignment voucher', 500);
  }
};

/**
 * PUT /api/admin/consignments/:id
 * Update existing consignment and re-balance inventory
 */
exports.updateConsignment = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const user = req.user || { id: 1, username: 'admin' };

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return sendError(res, 'Consignment must include at least one product item.', 400);
    }

    const result = await ConsignmentsModel.updateConsignment(id, payload, user);
    return sendSuccess(res, result, 'Consignment voucher updated successfully and stock re-synced.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update consignment voucher', 500);
  }
};

/**
 * POST /api/admin/consignments/:id/returns
 * Record return of goods from consignee back into warehouse stock
 */
exports.recordConsignmentReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const user = req.user || { id: 1, username: 'admin' };

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return sendError(res, 'Please provide at least one item to return.', 400);
    }

    const result = await ConsignmentsModel.recordConsignmentReturn(id, payload, user);
    return sendSuccess(res, result, 'Consignment return recorded and stock returned to warehouse.', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to record consignment return', 500);
  }
};

/**
 * POST /api/admin/consignments/:id/sales
 * Record reported sales from consignee
 */
exports.recordConsignmentSales = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const user = req.user || { id: 1, username: 'admin' };

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return sendError(res, 'Please provide items with reported sale quantities.', 400);
    }

    const result = await ConsignmentsModel.recordConsignmentSales(id, payload, user);
    return sendSuccess(res, result, 'Consignment sales recorded and balances updated.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to record consignment sales', 500);
  }
};

/**
 * DELETE /api/admin/consignments/:id
 * Delete consignment voucher and revert dispatched stock
 */
exports.deleteConsignment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };

    const result = await ConsignmentsModel.deleteConsignment(id, user);
    return sendSuccess(res, result, 'Consignment voucher deleted and stock safely reverted.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete consignment voucher', 500);
  }
};
