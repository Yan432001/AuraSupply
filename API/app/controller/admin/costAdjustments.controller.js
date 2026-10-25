const CostAdjustmentsModel = require('../../models/admins/costAdjustments.model');
const { sendSuccess, sendError } = require('../../config/utill/response');

/**
 * COST ADJUSTMENTS CONTROLLER
 * Aligned with AURA_v1 products costing and inventory valuation architecture
 */

/**
 * GET /api/admin/products/cost_adjustments/meta/options
 * Retrieve warehouses, billers, standard reasons, next reference number, and statuses
 */
exports.getMetadataOptions = async (req, res) => {
  try {
    const meta = await CostAdjustmentsModel.getMetadataOptions();
    return sendSuccess(res, meta, 'Cost adjustment metadata options retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve metadata options', 500);
  }
};

/**
 * GET /api/admin/products/cost_adjustments/products
 * Search available products with current cost and inventory balances
 */
exports.getAvailableProducts = async (req, res) => {
  try {
    const { warehouse_id = 'all', term = '', limit = 20 } = req.query;
    const products = await CostAdjustmentsModel.getAvailableProducts(warehouse_id, term, limit);
    return sendSuccess(res, products, 'Products retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to search products', 500);
  }
};

/**
 * GET /api/admin/products/cost_adjustments
 * List cost adjustments with search, filters, metrics, and pagination
 */
exports.listCostAdjustments = async (req, res) => {
  try {
    const {
      search = '',
      warehouse_id = 'all',
      status = 'all',
      reason = 'all',
      start_date,
      end_date,
      sort_by = 'date',
      sort_order = 'DESC',
      page = 1,
      limit = 20,
    } = req.query;

    const result = await CostAdjustmentsModel.listCostAdjustments({
      search,
      warehouse_id,
      status,
      reason,
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
      message: 'Cost adjustments retrieved successfully',
      data: result.data,
      stats: result.stats,
      pagination: result.pagination,
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to list cost adjustments', 500);
  }
};

/**
 * GET /api/admin/products/cost_adjustments/:id
 * Retrieve single cost adjustment details with items and valuation impact
 */
exports.getCostAdjustmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const adjustment = await CostAdjustmentsModel.getCostAdjustmentById(id);
    if (!adjustment) {
      return sendError(res, 'Cost adjustment record not found', 404);
    }
    return sendSuccess(res, adjustment, 'Cost adjustment retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve cost adjustment', 500);
  }
};

/**
 * POST /api/admin/products/cost_adjustments
 * Create a new cost adjustment and apply inventory valuation changes
 */
exports.createCostAdjustment = async (req, res) => {
  try {
    const user = req.user || { id: 1, username: 'admin' };
    const payload = req.body;

    if (!payload.items || !payload.items.length) {
      return sendError(res, 'Please add at least one product to adjust cost', 400);
    }

    const created = await CostAdjustmentsModel.createCostAdjustment(payload, user);
    return res.status(201).json({
      success: true,
      status: true,
      message: `Cost adjustment ${created.reference_no} created successfully`,
      data: created,
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to create cost adjustment', 400);
  }
};

/**
 * PUT /api/admin/products/cost_adjustments/:id
 * Update an existing cost adjustment
 */
exports.updateCostAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };
    const payload = req.body;

    const updated = await CostAdjustmentsModel.updateCostAdjustment(id, payload, user);
    return sendSuccess(res, updated, 'Cost adjustment updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update cost adjustment', 400);
  }
};

/**
 * DELETE /api/admin/products/cost_adjustments/:id
 * Delete or revert a cost adjustment safely
 */
exports.deleteCostAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };

    const result = await CostAdjustmentsModel.deleteCostAdjustment(id, user);
    return sendSuccess(res, result, 'Cost adjustment deleted and costing safely reverted');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete cost adjustment', 400);
  }
};
