const InventoryModel = require('../../models/admins/inventory.model');
const { logError } = require('../../config/utill/logErr');
const { db } = require('../../config/utill/helper');

/**
 * GET /api/admin/products & GET /api/products
 * Fetch products list with filters, search, variants, warehouse stock, and metrics
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      category_id,
      category,
      brand_id,
      brand,
      warehouse_id,
      stock,
      stock_status,
      status,
      type,
      page = 1,
      limit = 50,
      sort_by = 'p.id',
      sort_order = 'DESC'
    } = req.query;

    const result = await InventoryModel.getProducts({
      search,
      category_id: category_id || category,
      brand_id: brand_id || brand,
      warehouse_id,
      stock_status: stock_status || stock || 'all',
      status: status || 'all',
      type: type || 'all',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sort_by,
      sort_order
    });

    res.json({
      status: true,
      success: true,
      data: result.products,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (err) {
    console.error('[Products getProducts Error]', err);
    logError('products.controller.getProducts', err, res);
  }
};

/**
 * GET /api/admin/products/:id
 */
exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await InventoryModel.getProductById(id);

    if (!product) {
      return res.status(404).json({ status: false, message: 'Product not found' });
    }

    res.json({
      status: true,
      success: true,
      data: product
    });
  } catch (err) {
    logError('products.controller.getProductById', err, res);
  }
};

/**
 * POST /api/admin/products & POST /api/products
 * Create new product with variants, warehouse stock, and audit trail
 */
exports.addProducts = async (req, res) => {
  try {
    const product = await InventoryModel.createProduct(req.body);

    res.status(201).json({
      status: true,
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (err) {
    console.error('[Products addProducts Error]', err);
    res.status(400).json({
      status: false,
      success: false,
      message: err.message || 'Failed to create product'
    });
  }
};

/**
 * PUT /api/admin/products/:id or POST /api/products/update
 * Update product and synchronize variants
 */
exports.updateProducts = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      return res.status(400).json({ status: false, message: 'Product ID is required for update' });
    }

    const updated = await InventoryModel.updateProduct(id, req.body);

    res.json({
      status: true,
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('[Products updateProducts Error]', err);
    res.status(400).json({
      status: false,
      success: false,
      message: err.message || 'Failed to update product'
    });
  }
};

/**
 * DELETE /api/admin/products/:id or DELETE /api/products
 * Safe deletion: prevents hard deletion if referenced in transactions, archives instead
 */
exports.deleteProducts = async (req, res) => {
  try {
    const id = req.params.id || req.body.id || req.query.id;
    if (!id) {
      return res.status(400).json({ status: false, message: 'Product ID is required for deletion' });
    }

    const result = await InventoryModel.deleteProduct(id);

    if (result.archived) {
      return res.status(200).json({
        status: true,
        success: true,
        archived: true,
        deleted: false,
        message: result.message
      });
    }

    res.json({
      status: true,
      success: true,
      archived: false,
      deleted: true,
      message: result.message
    });
  } catch (err) {
    console.error('[Products deleteProducts Error]', err);
    res.status(400).json({
      status: false,
      success: false,
      message: err.message || 'Failed to delete product'
    });
  }
};

/**
 * POST /api/admin/products/bulk-price
 * Bulk price updates
 */
exports.bulkUpdatePrices = async (req, res) => {
  try {
    const { productIds, type, value } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ status: false, message: 'productIds array is required' });
    }

    const numVal = parseFloat(value) || 0;
    const placeholders = productIds.map(() => '?').join(',');

    if (type === 'percent_discount') {
      const factor = (100 - numVal) / 100;
      await db.query(`UPDATE aura_products SET price = ROUND(price * ?, 4) WHERE id IN (${placeholders})`, [factor, ...productIds]);
    } else if (type === 'percent_increase') {
      const factor = (100 + numVal) / 100;
      await db.query(`UPDATE aura_products SET price = ROUND(price * ?, 4) WHERE id IN (${placeholders})`, [factor, ...productIds]);
    } else if (type === 'fixed_discount') {
      await db.query(`UPDATE aura_products SET price = GREATEST(0, ROUND(price - ?, 4)) WHERE id IN (${placeholders})`, [numVal, ...productIds]);
    } else if (type === 'fixed_set') {
      await db.query(`UPDATE aura_products SET price = ? WHERE id IN (${placeholders})`, [numVal, ...productIds]);
    }

    res.json({
      status: true,
      success: true,
      message: `Bulk price adjustment applied to ${productIds.length} products`
    });
  } catch (err) {
    logError('products.controller.bulkUpdatePrices', err, res);
  }
};

/**
 * GET /api/admin/products/meta/options & GET /api/products/meta/options
 * Product creation and editing metadata (categories, units, brands, suppliers, warehouses, tax rates, attributes)
 */
exports.getProductMetadata = async (req, res) => {
  try {
    const meta = await InventoryModel.getProductMetadata();
    res.json({
      status: true,
      success: true,
      data: meta
    });
  } catch (err) {
    logError('products.controller.getProductMetadata', err, res);
  }
};

/**
 * POST /api/admin/products/:id/duplicate
 * Duplicate existing product with clean code & unique SKU
 */
exports.duplicateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const original = await InventoryModel.getProductById(id);
    if (!original) {
      return res.status(404).json({ status: false, message: 'Product not found for duplication' });
    }

    const newCode = `${original.code || 'PRD'}-COPY-${Date.now().toString().slice(-4)}`;
    const clonedData = {
      ...original,
      id: undefined,
      code: newCode,
      barcode: newCode,
      sku: newCode,
      name: `${original.name} (Copy)`,
      variants: (original.variants || []).map(v => ({
        ...v,
        id: undefined,
        sku: `${v.sku || newCode}-COPY`,
        barcode: `${v.barcode || newCode}-COPY`
      }))
    };

    const created = await InventoryModel.createProduct(clonedData);
    res.status(201).json({
      status: true,
      success: true,
      message: 'Product duplicated successfully',
      data: created
    });
  } catch (err) {
    logError('products.controller.duplicateProduct', err, res);
  }
};
