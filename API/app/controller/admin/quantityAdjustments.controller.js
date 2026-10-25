const QuantityAdjustmentsModel = require('../../models/admins/quantityAdjustments.model');
const { sendSuccess, sendError } = require('../../config/utill/response');

/**
 * QUANTITY ADJUSTMENTS CONTROLLER (BPAS / AURA_v1)
 * ===============================================
 */

/**
 * GET /api/admin/products/quantity_adjustments
 * List adjustments with search, filters, pagination, and KPI metrics
 */
exports.listAdjustments = async (req, res) => {
  try {
    const {
      search = '',
      warehouse_id = 'all',
      biller_id = 'all',
      type = 'all',
      start_date,
      end_date,
      page = 1,
      limit = 15
    } = req.query;

    const result = await QuantityAdjustmentsModel.listAdjustments({
      search,
      warehouse_id,
      biller_id,
      type,
      start_date,
      end_date,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      status: true,
      message: 'Quantity adjustments retrieved successfully',
      data: result.records,
      stats: result.stats,
      pagination: result.pagination
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve adjustments', 500);
  }
};

/**
 * GET /api/admin/products/quantity_adjustments/meta/options
 * Warehouses, Billers, Next Reference number
 */
exports.getMetadataOptions = async (req, res) => {
  try {
    const options = await QuantityAdjustmentsModel.getMetadataOptions();
    return sendSuccess(res, options, 'Metadata options retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve metadata options', 500);
  }
};

/**
 * GET /api/admin/products/quantity_adjustments/products
 * Products for selected warehouse with live QOH and variants
 */
exports.getAvailableProducts = async (req, res) => {
  try {
    const { warehouse_id = 1, search = '', limit = 40 } = req.query;
    const products = await QuantityAdjustmentsModel.getAvailableProducts(warehouse_id, search, limit);
    return sendSuccess(res, products, 'Products retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve products', 500);
  }
};

/**
 * GET /api/admin/products/quantity_adjustments/:id
 * Single adjustment voucher details
 */
exports.getAdjustmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const adjustment = await QuantityAdjustmentsModel.getAdjustmentById(id);
    if (!adjustment) {
      return sendError(res, `Quantity adjustment #${id} not found`, 404);
    }
    return sendSuccess(res, adjustment, 'Adjustment voucher retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve adjustment details', 500);
  }
};

/**
 * POST /api/admin/products/quantity_adjustments
 * Create new quantity adjustment
 */
exports.createAdjustment = async (req, res) => {
  try {
    const {
      date,
      reference_no,
      warehouse_id,
      biller_id,
      note,
      attachment,
      items
    } = req.body;

    const userId = req.user_id || req.user?.id || 1;

    if (!warehouse_id) {
      return sendError(res, 'Warehouse selection is required.', 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Please add at least one product item to adjust.', 400);
    }

    const created = await QuantityAdjustmentsModel.createAdjustment({
      date,
      reference_no,
      warehouse_id,
      biller_id,
      note,
      attachment,
      items,
      user_id: userId
    });

    return res.status(201).json({
      success: true,
      status: true,
      message: `Quantity Adjustment ${created.reference_no} created successfully and stock balances updated.`,
      data: created
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to create quantity adjustment', 400);
  }
};

/**
 * PUT /api/admin/products/quantity_adjustments/:id
 * Update quantity adjustment
 */
exports.updateAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      reference_no,
      warehouse_id,
      biller_id,
      note,
      items
    } = req.body;

    const userId = req.user_id || req.user?.id || 1;

    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Please add at least one product item to adjust.', 400);
    }

    const updated = await QuantityAdjustmentsModel.updateAdjustment(id, {
      date,
      reference_no,
      warehouse_id,
      biller_id,
      note,
      items,
      user_id: userId
    });

    return sendSuccess(res, updated, 'Quantity adjustment updated and stock recalculated successfully.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update quantity adjustment', 400);
  }
};

/**
 * DELETE /api/admin/products/quantity_adjustments/:id
 * Cancel / Delete adjustment and reverse all stock movements
 */
exports.deleteAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await QuantityAdjustmentsModel.deleteAdjustment(id);
    return sendSuccess(res, result, 'Quantity adjustment cancelled and inventory stock effects reversed successfully.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete adjustment', 400);
  }
};
