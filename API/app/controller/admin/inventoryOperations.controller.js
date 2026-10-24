const InventoryModel = require('../../models/admins/inventory.model');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');

/**
 * POST /api/admin/inventory/receive
 * Receive stock into warehouse for product or variant
 */
exports.receiveStock = async (req, res) => {
  try {
    const { product_id, option_id, warehouse_id, quantity, unit_cost, reference_no, note } = req.body;
    const userId = req.user_id || req.user?.id || 1;

    if (!product_id) return sendError(res, 'Product ID is required', 400);
    if (!quantity || parseFloat(quantity) <= 0) return sendError(res, 'Valid quantity greater than 0 is required', 400);

    const result = await InventoryModel.receiveStock({
      product_id: parseInt(product_id),
      option_id: option_id ? parseInt(option_id) : null,
      warehouse_id: parseInt(warehouse_id) || 1,
      quantity: parseFloat(quantity),
      unit_cost: parseFloat(unit_cost) || 0,
      reference_no,
      note,
      user_id: userId
    });

    return sendSuccess(res, result, 'Stock received successfully', null, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to receive stock', 400);
  }
};

/**
 * POST /api/admin/inventory/issue
 * Issue / consume stock out of warehouse (Prevents negative stock)
 */
exports.issueStock = async (req, res) => {
  try {
    const { product_id, option_id, warehouse_id, quantity, reason, reference_no } = req.body;
    const userId = req.user_id || req.user?.id || 1;

    if (!product_id) return sendError(res, 'Product ID is required', 400);
    if (!quantity || parseFloat(quantity) <= 0) return sendError(res, 'Valid quantity greater than 0 is required', 400);

    const result = await InventoryModel.issueStock({
      product_id: parseInt(product_id),
      option_id: option_id ? parseInt(option_id) : null,
      warehouse_id: parseInt(warehouse_id) || 1,
      quantity: parseFloat(quantity),
      reason,
      reference_no,
      user_id: userId
    });

    return sendSuccess(res, result, 'Stock issued successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to issue stock', 400);
  }
};

/**
 * POST /api/admin/inventory/adjust
 * Adjust stock balance with reason and audit history
 */
exports.adjustStock = async (req, res) => {
  try {
    const { product_id, option_id, warehouse_id, type = 'addition', quantity, reason, reference_no } = req.body;
    const userId = req.user_id || req.user?.id || 1;

    if (!product_id) return sendError(res, 'Product ID is required', 400);
    if (!quantity || parseFloat(quantity) <= 0) return sendError(res, 'Quantity must be greater than 0', 400);

    const result = await InventoryModel.adjustStock({
      product_id: parseInt(product_id),
      option_id: option_id ? parseInt(option_id) : null,
      warehouse_id: parseInt(warehouse_id) || 1,
      type: type === 'subtraction' ? 'subtraction' : 'addition',
      quantity: parseFloat(quantity),
      reason: reason || 'Inventory audit adjustment',
      reference_no,
      user_id: userId
    });

    return sendSuccess(res, result, 'Stock adjusted successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to adjust stock', 400);
  }
};

/**
 * POST /api/admin/inventory/transfer
 * Transfer stock between warehouses (with negative stock prevention and dual audit moves)
 */
exports.transferStock = async (req, res) => {
  try {
    const { from_warehouse_id, to_warehouse_id, items, note } = req.body;
    const userId = req.user_id || req.user?.id || 1;

    if (!from_warehouse_id || !to_warehouse_id) {
      return sendError(res, 'Source and destination warehouses are required', 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 'At least one item must be included in the transfer', 400);
    }

    const result = await InventoryModel.transferStock({
      from_warehouse_id: parseInt(from_warehouse_id),
      to_warehouse_id: parseInt(to_warehouse_id),
      items,
      note,
      user_id: userId
    });

    return sendSuccess(res, result, 'Stock transfer completed successfully', null, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to transfer stock', 400);
  }
};

/**
 * GET /api/admin/inventory/warehouse-stock
 * Warehouse stock balances overview
 */
exports.getWarehouseStock = async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    const data = await InventoryModel.getWarehouseStockOverview(warehouse_id);
    return sendSuccess(res, data, 'Warehouse stock overview fetched successfully');
  } catch (err) {
    return sendError(res, 'Failed to fetch warehouse stock', 500, err.message);
  }
};

/**
 * GET /api/admin/inventory/movements
 * Stock movement audit trail
 */
exports.getStockMovements = async (req, res) => {
  try {
    const { product_id, warehouse_id, transaction, page = 1, limit = 50 } = req.query;
    const data = await InventoryModel.getStockMovements({
      product_id: product_id ? parseInt(product_id) : null,
      warehouse_id: warehouse_id || null,
      transaction: transaction || null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    });

    return sendPaginated(res, data.movements, data.total, data.page, data.limit, 'Stock movements retrieved');
  } catch (err) {
    return sendError(res, 'Failed to fetch stock movements', 500, err.message);
  }
};
