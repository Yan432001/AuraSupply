const StockReceivedModel = require('../../models/admins/stockReceived.model');
const { sendSuccess, sendError } = require('../../config/utill/response');

/**
 * STOCK RECEIVED CONTROLLER
 * Fully aligned with AURA_v1 Purchases.php / Products.php Stock Received logic
 */

/**
 * GET /api/admin/stock_received/meta/options
 * Retrieve warehouses, suppliers, billers, open purchase orders, next reference, and statuses
 */
exports.getMetadataOptions = async (req, res) => {
  try {
    const meta = await StockReceivedModel.getMetadataOptions();
    return sendSuccess(res, meta, 'Stock received metadata options retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve stock received metadata options', 500);
  }
};

/**
 * GET /api/admin/stock_received/purchases/:purchaseId
 * Get items and supplier info from an existing Purchase Order for automatic receiving
 */
exports.getPurchaseOrderDetails = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    if (!purchaseId) {
      return sendError(res, 'purchaseId parameter is required', 400);
    }
    const details = await StockReceivedModel.getPurchaseOrderDetails(purchaseId);
    return sendSuccess(res, details, 'Purchase order details retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve purchase order details', 500);
  }
};

/**
 * GET /api/admin/stock_received/products
 * Search available products for direct stock receipts
 */
exports.getAvailableProducts = async (req, res) => {
  try {
    const { warehouse_id = 'all', term = '', limit = 20 } = req.query;
    const products = await StockReceivedModel.getAvailableProducts(warehouse_id, term, limit);
    return sendSuccess(res, products, 'Products retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to search products', 500);
  }
};

/**
 * GET /api/admin/stock_received
 * List stock received records with search, filter, and pagination
 */
exports.listStockReceived = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      warehouse_id = 'all',
      supplier_id = 'all',
      status = 'all',
      start_date = '',
      end_date = '',
    } = req.query;

    const filters = {
      search,
      warehouse_id,
      supplier_id,
      status,
      start_date,
      end_date,
    };

    const result = await StockReceivedModel.listStockReceived(filters, { page, limit });
    return sendSuccess(res, result, 'Stock received list retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to list stock received records', 500);
  }
};

/**
 * GET /api/admin/stock_received/:id
 * Retrieve single stock received record by ID
 */
exports.getStockReceivedById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await StockReceivedModel.getStockReceivedById(id);
    if (!record) {
      return sendError(res, `Stock received record #${id} not found`, 404);
    }
    return sendSuccess(res, record, 'Stock received record retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve stock received record', 500);
  }
};

/**
 * POST /api/admin/stock_received
 * Create new stock received record and post inventory
 */
exports.createStockReceived = async (req, res) => {
  try {
    const payload = req.body;
    const user = req.user || { id: 1, username: 'admin' };

    if (!payload.warehouse_id) {
      return sendError(res, 'Warehouse is required.', 400);
    }
    if (!payload.supplier_id) {
      return sendError(res, 'Supplier is required.', 400);
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return sendError(res, 'Stock receive must include at least one product item.', 400);
    }

    const result = await StockReceivedModel.createStockReceived(payload, user);
    return sendSuccess(res, result, 'Stock received record created successfully and stock posted.', 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create stock received record', 500);
  }
};

/**
 * PUT /api/admin/stock_received/:id
 * Update existing stock received record and synchronize inventory
 */
exports.updateStockReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const user = req.user || { id: 1, username: 'admin' };

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return sendError(res, 'Stock receive must include at least one product item.', 400);
    }

    const result = await StockReceivedModel.updateStockReceived(id, payload, user);
    return sendSuccess(res, result, 'Stock received record updated successfully.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update stock received record', 500);
  }
};

/**
 * DELETE /api/admin/stock_received/:id
 * Revert inventory and delete stock received record
 */
exports.deleteStockReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || { id: 1, username: 'admin' };

    const result = await StockReceivedModel.deleteStockReceived(id, user);
    return sendSuccess(res, result, 'Stock received record deleted and stock safely reverted.');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete stock received record', 500);
  }
};
