const UsingStockModel = require('../../models/admins/usingStock.model');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');

/**
 * GET /api/admin/products/using_stock
 * List stock usage records with pagination, filtering & search
 */
exports.listUsingStocks = async (req, res) => {
  try {
    const {
      search = '',
      warehouse_id = 'all',
      biller_id = 'all',
      type = 'all',
      start_date,
      end_date,
      sort_by = 'us.date',
      sort_order = 'DESC',
      page = 1,
      limit = 20
    } = req.query;

    const result = await UsingStockModel.listUsingStocks({
      search,
      warehouse_id,
      biller_id,
      type,
      start_date,
      end_date,
      sort_by,
      sort_order,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      status: true,
      message: 'Using stock records retrieved successfully',
      data: result.records,
      stats: result.stats,
      pagination: result.pagination
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve stock usage records', 500);
  }
};

/**
 * GET /api/admin/products/using_stock/meta/options
 * Form dropdown options and auto-generated reference number
 */
exports.getMetadataOptions = async (req, res) => {
  try {
    const meta = await UsingStockModel.getMetadataOptions();
    return sendSuccess(res, meta, 'Metadata loaded successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to load metadata options', 500);
  }
};

/**
 * GET /api/admin/products/using_stock/products
 * Get available products in warehouse with QOH
 */
exports.getAvailableProducts = async (req, res) => {
  try {
    const { warehouse_id = 1, search = '', limit = 30 } = req.query;
    const products = await UsingStockModel.getAvailableProducts({
      warehouse_id,
      search,
      limit
    });
    return sendSuccess(res, products, 'Available products retrieved');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve available products', 500);
  }
};

/**
 * GET /api/admin/products/using_stock/:id
 * Retrieve single record with line items
 */
exports.getUsingStockById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await UsingStockModel.getUsingStockById(parseInt(id, 10));
    if (!record) {
      return sendError(res, `Stock usage record #${id} not found`, 404);
    }
    return sendSuccess(res, record, 'Stock usage details retrieved');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve record', 500);
  }
};

/**
 * POST /api/admin/products/using_stock
 * Create new stock usage record
 */
exports.createUsingStock = async (req, res) => {
  try {
    const userId = req.user_id || req.user?.id || 1;
    const {
      date,
      reference_no,
      biller_id,
      warehouse_id,
      employee_id,
      authorize_id,
      note,
      items
    } = req.body;

    if (!warehouse_id) {
      return sendError(res, 'Warehouse is required.', 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 'At least one product item is required.', 400);
    }

    const created = await UsingStockModel.createUsingStock({
      date,
      reference_no,
      biller_id,
      warehouse_id,
      employee_id,
      authorize_id,
      note,
      items,
      user_id: userId
    });

    return sendSuccess(res, created, 'Stock usage recorded successfully', null, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create stock usage record', 400);
  }
};

/**
 * PUT /api/admin/products/using_stock/:id
 * Update existing stock usage record
 */
exports.updateUsingStock = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user_id || req.user?.id || 1;
    const {
      date,
      biller_id,
      warehouse_id,
      employee_id,
      authorize_id,
      note,
      items
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 'At least one product item is required.', 400);
    }

    const updated = await UsingStockModel.updateUsingStock(parseInt(id, 10), {
      date,
      biller_id,
      warehouse_id,
      employee_id,
      authorize_id,
      note,
      items,
      user_id: userId
    });

    return sendSuccess(res, updated, 'Stock usage record updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update stock usage record', 400);
  }
};

/**
 * DELETE /api/admin/products/using_stock/:id
 * Delete / cancel stock usage record and restore inventory
 */
exports.deleteUsingStock = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UsingStockModel.deleteUsingStock(parseInt(id, 10));
    return sendSuccess(res, result, result.message || 'Stock usage deleted successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete stock usage record', 400);
  }
};

/**
 * POST /api/admin/products/using_stock/:id/return
 * Return stock from usage record
 */
exports.createReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user_id || req.user?.id || 1;
    const { date, reference_no, items, note } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Please provide items to return.', 400);
    }

    const returnRecord = await UsingStockModel.createReturn(parseInt(id, 10), {
      date,
      reference_no,
      items,
      note,
      user_id: userId
    });

    return sendSuccess(res, returnRecord, 'Stock return recorded successfully', null, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to process stock return', 400);
  }
};
