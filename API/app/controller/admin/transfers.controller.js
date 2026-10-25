const TransfersModel = require('../../models/admins/transfers.model');
const { sendSuccess, sendError } = require('../../config/utill/response');

/**
 * TRANSFER MANAGEMENT CONTROLLER
 * Aligned with AURA_v1 Transfers.php & Transfers_model.php
 */

/**
 * GET /api/admin/transfers/meta/options
 * Retrieve warehouses, billers, tax rates, generated transfer reference, and statuses
 */
exports.getMetadataOptions = async (req, res) => {
  try {
    const meta = await TransfersModel.getMetadataOptions();
    return sendSuccess(res, meta, 'Transfer metadata options retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve transfer metadata options', 500);
  }
};

/**
 * GET /api/admin/transfers/products
 * Search available products in a source warehouse with real-time stock balances
 */
exports.getAvailableProducts = async (req, res) => {
  try {
    const { warehouse_id, term = '', limit = 20 } = req.query;
    if (!warehouse_id) {
      return sendError(res, 'warehouse_id query parameter is required', 400);
    }
    const products = await TransfersModel.getAvailableProducts(warehouse_id, term, limit);
    return sendSuccess(res, products, 'Available products retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to search warehouse products', 500);
  }
};

/**
 * GET /api/admin/transfers
 * List transfers with search, warehouse filters, status filtering, and statistics
 */
exports.listTransfers = async (req, res) => {
  try {
    const {
      search = '',
      from_warehouse_id = 'all',
      to_warehouse_id = 'all',
      status = 'all',
      start_date,
      end_date,
      sort_by = 'date',
      sort_order = 'DESC',
      page = 1,
      limit = 20,
    } = req.query;

    const result = await TransfersModel.listTransfers({
      search,
      from_warehouse_id,
      to_warehouse_id,
      status,
      start_date,
      end_date,
      sort_by,
      sort_order,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      status: true,
      message: 'Transfers retrieved successfully',
      data: result.data,
      stats: result.stats,
      pagination: result.pagination,
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to list transfers', 500);
  }
};

/**
 * GET /api/admin/transfers/:id
 * Retrieve single transfer with full items list and immutable audit history
 */
exports.getTransferById = async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await TransfersModel.getTransferById(id);
    if (!transfer) {
      return sendError(res, 'Transfer record not found', 404);
    }
    return sendSuccess(res, transfer, 'Transfer details retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve transfer details', 500);
  }
};

/**
 * POST /api/admin/transfers
 * Create a new transfer (request, order, dispatch, or direct completed transfer)
 */
exports.createTransfer = async (req, res) => {
  try {
    const user = req.user || { id: 1, username: 'admin' };
    const payload = req.body;

    if (!payload.from_warehouse_id || !payload.to_warehouse_id) {
      return sendError(res, 'Source warehouse and destination warehouse are required', 400);
    }

    if (parseInt(payload.from_warehouse_id, 10) === parseInt(payload.to_warehouse_id, 10)) {
      return sendError(res, 'Source and destination warehouses cannot be the same', 400);
    }

    if (!payload.items || !payload.items.length) {
      return sendError(res, 'Please add at least one item to the transfer', 400);
    }

    const created = await TransfersModel.createTransfer(payload, user);
    return res.status(201).json({
      success: true,
      status: true,
      message: `Transfer ${created.transfer_no} created successfully`,
      data: created,
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to create transfer', 400);
  }
};

/**
 * PUT /api/admin/transfers/:id
 * Update an existing transfer (allowed while in draft or pending status)
 */
exports.updateTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const payload = req.body;

    const updated = await TransfersModel.updateTransfer(id, payload, user);
    return sendSuccess(res, updated, 'Transfer updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update transfer', 400);
  }
};

/**
 * POST /api/admin/transfers/:id/approve
 * Review and approve a pending transfer request into an authorized transfer order
 */
exports.approveTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const { note = '' } = req.body;

    const result = await TransfersModel.approveTransfer(id, user, note);
    return sendSuccess(res, result, 'Transfer request approved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to approve transfer', 400);
  }
};

/**
 * POST /api/admin/transfers/:id/reject
 * Reject a pending transfer request
 */
exports.rejectTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const { reason = '' } = req.body;

    const result = await TransfersModel.rejectTransfer(id, user, reason);
    return sendSuccess(res, result, 'Transfer request rejected');
  } catch (err) {
    return sendError(res, err.message || 'Failed to reject transfer', 400);
  }
};

/**
 * POST /api/admin/transfers/:id/dispatch
 * Dispatch stock from source warehouse (deducts physical stock and moves to in_transit)
 */
exports.dispatchTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const dispatchData = req.body || {};

    const result = await TransfersModel.dispatchTransfer(id, user, dispatchData);
    return sendSuccess(res, result, 'Transfer dispatched and stock marked in-transit');
  } catch (err) {
    return sendError(res, err.message || 'Failed to dispatch transfer', 400);
  }
};

/**
 * POST /api/admin/transfers/:id/receive
 * Confirm receipt of items at destination warehouse (supports partial receipt, damages, shortages)
 */
exports.receiveTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const receiveData = req.body || {};

    const result = await TransfersModel.receiveTransfer(id, user, receiveData);
    return sendSuccess(res, result, 'Transfer items received and stocked into warehouse');
  } catch (err) {
    return sendError(res, err.message || 'Failed to receive transfer', 400);
  }
};

/**
 * POST /api/admin/transfers/:id/cancel
 * Cancel transfer with stock reversal if already dispatched
 */
exports.cancelTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const { reason = '' } = req.body;

    const result = await TransfersModel.cancelTransfer(id, user, reason);
    return sendSuccess(res, result, 'Transfer cancelled and stock reversed if needed');
  } catch (err) {
    return sendError(res, err.message || 'Failed to cancel transfer', 400);
  }
};

/**
 * DELETE /api/admin/transfers/:id
 * Delete transfer (allowed for draft, cancelled, or rejected transfers)
 */
exports.deleteTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };

    const result = await TransfersModel.deleteTransfer(id, user);
    return sendSuccess(res, result, 'Transfer record deleted successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete transfer', 400);
  }
};
