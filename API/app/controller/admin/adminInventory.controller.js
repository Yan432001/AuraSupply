const InventoryModel = require('../../models/admins/inventory.model');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');
const { logActivity } = require('../../services/auditLogger.service');

/**
 * GET /api/admin/inventory/products
 */
exports.listProducts = async (req, res) => {
  try {
    const {
      search,
      category_id,
      warehouse_id,
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
      category_id,
      warehouse_id,
      stock_status,
      status,
      type,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sort_by,
      sort_order
    });

    return sendPaginated(res, result.products, result.total, result.page, result.limit, 'Inventory products retrieved');
  } catch (err) {
    console.error('[AdminInventory list error]', err);
    return sendError(res, 'Failed to fetch inventory products', 500, err.message);
  }
};

/**
 * GET /api/admin/inventory/products/:id
 */
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await InventoryModel.getProductById(id);
    if (!product) return sendError(res, 'Product not found', 404);
    return sendSuccess(res, product, 'Product details fetched successfully');
  } catch (err) {
    return sendError(res, 'Failed to retrieve product', 500, err.message);
  }
};

/**
 * POST /api/admin/inventory/products
 */
exports.createProduct = async (req, res) => {
  try {
    const product = await InventoryModel.createProduct(req.body);

    await logActivity({
      req,
      action: 'create',
      tableName: 'aura_products',
      recordId: product.id,
      newValues: { name: product.name, code: product.code, price: product.price, quantity: product.quantity }
    }).catch(() => {});

    return sendSuccess(res, product, 'Product created successfully', null, 201);
  } catch (err) {
    return sendError(res, err.message || 'Failed to create product', 400);
  }
};

/**
 * PUT /api/admin/inventory/products/:id
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await InventoryModel.updateProduct(id, req.body);

    await logActivity({
      req,
      action: 'update',
      tableName: 'aura_products',
      recordId: id,
      newValues: req.body
    }).catch(() => {});

    return sendSuccess(res, updated, 'Product updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Failed to update product', 400);
  }
};

/**
 * DELETE /api/admin/inventory/products/:id
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await InventoryModel.deleteProduct(id);

    await logActivity({
      req,
      action: result.deleted ? 'delete' : 'archive',
      tableName: 'aura_products',
      recordId: id
    }).catch(() => {});

    return sendSuccess(res, result, result.message);
  } catch (err) {
    return sendError(res, err.message || 'Failed to delete product', 400);
  }
};

/**
 * GET /api/admin/inventory/export
 */
exports.exportProductsCSV = async (req, res) => {
  try {
    const result = await InventoryModel.getProducts({ limit: 10000 });
    const fields = ['id', 'code', 'name', 'category', 'unit', 'cost', 'price', 'quantity', 'alertQuantity', 'stock_status'];
    const csvRows = [fields.join(',')];

    for (const p of result.products) {
      csvRows.push([
        p.id,
        `"${p.code}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        `"${p.unit}"`,
        p.cost,
        p.price,
        p.quantity,
        p.alertQuantity,
        p.stock_status
      ].join(','));
    }

    res.header('Content-Type', 'text/csv');
    res.attachment(`inventory_products_${Date.now()}.csv`);
    return res.send(csvRows.join('\n'));
  } catch (err) {
    return sendError(res, 'Failed to export products', 500, err.message);
  }
};
