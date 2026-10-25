const StockCountsModel = require('../../models/admins/stockCounts.model');
const { sendSuccess, sendError } = require('../../config/utill/response');

/**
 * STOCK COUNTS CONTROLLER (Matching AURA_v1 Products.php count_stock / finalize_count / scan_count)
 * =================================================================================================
 */

/**
 * GET /api/admin/products/stock-counts
 * List stock counts with search, filters, pagination, and KPI metrics
 */
exports.listStockCounts = async (req, res) => {
  try {
    const {
      search = '',
      warehouse_id = 'all',
      type = 'all',
      status = 'all',
      start_date,
      end_date,
      page = 1,
      limit = 15
    } = req.query;

    const result = await StockCountsModel.listStockCounts({
      search,
      warehouse_id,
      type,
      status,
      start_date,
      end_date,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      status: true,
      message: 'Stock counts retrieved successfully',
      data: result.records,
      stats: result.stats,
      pagination: result.pagination
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve stock counts', 500);
  }
};

/**
 * GET /api/admin/products/stock-counts/meta/options
 * Warehouses, Categories, Brands, and Next Reference Number
 */
exports.getMetadataOptions = async (req, res) => {
  try {
    const options = await StockCountsModel.getMetadataOptions();
    return sendSuccess(res, options, 'Stock count metadata options retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve metadata options', 500);
  }
};

/**
 * POST /api/admin/products/stock-counts
 * Initiate a new stock count audit (Full or Partial by Category/Brand)
 */
exports.createStockCount = async (req, res) => {
  try {
    const {
      date,
      reference_no,
      warehouse_id,
      type = 'full',
      categories = [],
      brands = [],
      note = ''
    } = req.body;

    const userId = req.user_id || req.user?.id || 1;

    if (!warehouse_id) {
      return sendError(res, 'Warehouse selection is required.', 400);
    }

    const created = await StockCountsModel.createStockCount({
      date,
      reference_no,
      warehouse_id,
      type,
      categories,
      brands,
      note,
      user_id: userId
    });

    return res.status(201).json({
      success: true,
      status: true,
      message: `Stock count #${created.reference_no} initiated with ${created.products_count} products (${created.rows_count} rows).`,
      data: created
    });
  } catch (err) {
    const isValidation = err.message && (
      err.message.includes('No products found') ||
      err.message.includes('not found') ||
      err.message.includes('required') ||
      err.message.includes('selection')
    );
    return sendError(res, err.message || 'Failed to initiate stock count', isValidation ? 400 : 500);
  }
};

/**
 * GET /api/admin/products/stock-counts/:id
 * Single stock count details with live items variance breakdown
 */
exports.getStockCountById = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await StockCountsModel.getStockCountById(id);
    if (!count) {
      return sendError(res, `Stock count #${id} not found`, 404);
    }
    return sendSuccess(res, count, 'Stock count details retrieved successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve stock count details', 500);
  }
};

/**
 * PUT /api/admin/products/stock-counts/:id/items
 * Update counted quantities for items in a stock count (batch update or save progress)
 */
exports.updateStockCountItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [], date, status, note } = req.body;
    const userId = req.user_id || req.user?.id || 1;

    const updated = await StockCountsModel.updateStockCountItems(id, {
      items,
      date,
      status,
      note,
      user_id: userId
    });

    return sendSuccess(res, updated, 'Stock count items updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update stock count items', 500);
  }
};

/**
 * POST /api/admin/products/stock-counts/:id/scan
 * Real-time barcode scanning count entry (matches AURA_v1 scan_count)
 */
exports.scanBarcodeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const barcode = req.body.barcode || req.body.barcode_or_code || req.body.code || req.body.sku;
    const { quantity_delta = 1, set_quantity = null } = req.body;

    const scanned = await StockCountsModel.scanBarcodeItem(id, {
      barcode,
      quantity_delta,
      set_quantity
    });

    return sendSuccess(res, scanned, `Scanned: ${scanned.product_name} (${scanned.counted} counted)`);
  } catch (err) {
    return sendError(res, err.message || 'Barcode scan failed', 400);
  }
};

/**
 * POST /api/admin/products/stock-counts/:id/finalize
 * Finalize stock count and lock audit lines
 */
exports.finalizeStockCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { note = '' } = req.body;
    const userId = req.user_id || req.user?.id || 1;

    const finalized = await StockCountsModel.finalizeStockCount(id, {
      note,
      user_id: userId
    });

    return sendSuccess(res, finalized, 'Stock count finalized successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to finalize stock count', 500);
  }
};

/**
 * POST /api/admin/products/stock-counts/:id/create-adjustment
 * Convert stock count differences into an official Inventory Adjustment voucher
 * (Matches AURA_v1 add_adjustment($count_id))
 */
exports.convertCountToAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const { biller_id = null, note = '' } = req.body;
    const userId = req.user_id || req.user?.id || 1;

    const result = await StockCountsModel.convertCountToAdjustment(id, {
      user_id: userId,
      biller_id,
      note
    });

    return res.status(200).json({
      success: true,
      status: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    return sendError(res, err.message || 'Failed to create inventory adjustment from stock count', 500);
  }
};

/**
 * DELETE /api/admin/products/stock-counts/:id
 * Delete stock count audit
 */
exports.deleteStockCount = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await StockCountsModel.deleteStockCount(id);
    return sendSuccess(res, deleted, 'Stock count deleted successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete stock count', 400);
  }
};

/**
 * GET /api/admin/products/stock-counts/:id/export-csv
 * Download Stock Count CSV Worksheet (matches AURA_v1 initial_file download)
 */
exports.exportStockCountCSV = async (req, res) => {
  try {
    const { id } = req.params;
    const csvData = await StockCountsModel.exportStockCountCSV(id);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(csvData.filename);
    return res.send(csvData.content);
  } catch (err) {
    return sendError(res, err.message || 'Failed to export stock count CSV', 500);
  }
};

/**
 * POST /api/admin/products/stock-counts/:id/import-csv
 * Bulk import counted results from CSV (matches AURA_v1 finalize_count upload)
 */
exports.importStockCountCSV = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = req.body.rows || [];
    const csv_text = req.body.csv_text || req.body.csvContent || '';
    const finalize = !!req.body.finalize;
    const userId = req.user_id || req.user?.id || 1;

    const result = await StockCountsModel.importStockCountCSV(id, {
      rows,
      csv_text,
      finalize,
      user_id: userId
    });

    return sendSuccess(res, result, `Successfully imported ${result.updated_items} items into stock count.`);
  } catch (err) {
    return sendError(res, err.message || 'Failed to import stock count CSV', 400);
  }
};

/**
 * GET /api/admin/products/stock-counts/:id/suggestions
 * Autocomplete suggestions for real-time barcode / code search during stock count
 */
exports.getProductSuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { q = '' } = req.query;

    const suggestions = await StockCountsModel.getProductSuggestions(id, q);
    return sendSuccess(res, suggestions, 'Product count suggestions retrieved');
  } catch (err) {
    return sendError(res, err.message || 'Failed to retrieve suggestions', 500);
  }
};
