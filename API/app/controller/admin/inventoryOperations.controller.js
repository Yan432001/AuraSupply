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

/**
 * GET /api/admin/inventory/overselling-config
 * Retrieve global and warehouse-level overselling configurations
 */
exports.getOversellingConfig = async (req, res) => {
  try {
    const inventoryService = require('../../services/inventory.service');
    const settings = await inventoryService.getSettings();
    const db = require('../../config/utill/connection');
    const [warehouses] = await db.query(
      'SELECT id, code, name, overselling, saleable FROM aura_warehouses ORDER BY name ASC'
    );

    return sendSuccess(res, {
      global_overselling: parseInt(settings.overselling, 10) === 1,
      default_warehouse: settings.default_warehouse,
      accounting_method: settings.accounting_method,
      warehouses: warehouses.map(w => ({
        id: w.id,
        code: w.code,
        name: w.name,
        overselling: w.overselling !== null ? parseInt(w.overselling, 10) === 1 : null,
        effective_overselling: (parseInt(settings.overselling, 10) === 1) && (w.overselling !== 0),
        saleable: w.saleable !== null ? parseInt(w.saleable, 10) === 1 : true
      }))
    }, 'Overselling configuration retrieved');
  } catch (err) {
    return sendError(res, err.message || 'Failed to fetch overselling config', 500);
  }
};

/**
 * PUT /api/admin/inventory/overselling-config
 * Update global and warehouse-level overselling toggles
 */
exports.updateOversellingConfig = async (req, res) => {
  try {
    const { global_overselling, warehouse_configs } = req.body;
    const db = require('../../config/utill/connection');

    if (global_overselling !== undefined) {
      await db.query(
        'UPDATE aura_settings SET overselling = ? WHERE setting_id = 1',
        [global_overselling ? 1 : 0]
      );
    }

    if (Array.isArray(warehouse_configs)) {
      for (const wc of warehouse_configs) {
        if (wc.id) {
          const val = wc.overselling === null || wc.overselling === undefined ? null : (wc.overselling ? 1 : 0);
          await db.query(
            'UPDATE aura_warehouses SET overselling = ? WHERE id = ?',
            [val, wc.id]
          );
        }
      }
    }

    return sendSuccess(res, null, 'Overselling configuration updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update overselling config', 500);
  }
};

/**
 * POST /api/admin/inventory/sync-opening-stock
 * Ensure every warehouse product has backing stock_movement rows
 */
exports.syncOpeningStock = async (req, res) => {
  try {
    const inventoryService = require('../../services/inventory.service');
    const count = await inventoryService.syncMissingOpeningStock();
    return sendSuccess(res, { synced_records: count }, `Successfully synchronized ${count} opening stock movements`);
  } catch (err) {
    return sendError(res, err.message || 'Failed to sync opening stock', 500);
  }
};

/**
 * POST /api/admin/inventory/check-availability
 * Check if a product can be sold/issued from warehouse given current stock and overselling rules
 */
exports.checkStockAvailability = async (req, res) => {
  try {
    const { product_id, warehouse_id, quantity, option_id, unit_id } = req.body;
    const inventoryService = require('../../services/inventory.service');

    if (!product_id || !warehouse_id) {
      return sendError(res, 'Product ID and Warehouse ID are required', 400);
    }

    const unit = await inventoryService.getProductUnit(product_id, unit_id);
    const requestedBaseQty = inventoryService.unitToBaseQty(quantity || 1, unit);
    const currentQOH = await inventoryService.getWarehouseStock(product_id, warehouse_id, option_id);
    const canOversellStock = await inventoryService.canOversell(warehouse_id);

    const willOversell = (currentQOH - requestedBaseQty) < 0;
    const isAllowed = canOversellStock || !willOversell;

    return sendSuccess(res, {
      product_id,
      warehouse_id,
      current_qoh: currentQOH,
      requested_unit_qty: parseFloat(quantity) || 1,
      requested_base_qty: requestedBaseQty,
      remaining_qoh: currentQOH - requestedBaseQty,
      can_oversell: canOversellStock,
      is_allowed: isAllowed,
      unit_info: {
        code: unit.code,
        operator: unit.operator,
        operation_value: unit.operation_value
      }
    }, 'Stock availability calculated');
  } catch (err) {
    return sendError(res, err.message || 'Failed to check stock availability', 500);
  }
};
