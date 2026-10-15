const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');
const { logActivity } = require('../../services/auditLogger.service');

/**
 * GET /api/admin/inventory/products
 * List products with search, category filter, stock status, pagination, sorting
 */
exports.listProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;
    const stockStatus = req.query.stock_status; // 'low', 'out', 'in'

    let whereSql = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereSql += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode_symbology LIKE ?)';
      params.push(search, search, search);
    }

    if (categoryId) {
      whereSql += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (stockStatus === 'low') {
      whereSql += ' AND p.quantity > 0 AND p.quantity <= COALESCE(p.alert_quantity, 10)';
    } else if (stockStatus === 'out') {
      whereSql += ' AND p.quantity <= 0';
    } else if (stockStatus === 'in') {
      whereSql += ' AND p.quantity > COALESCE(p.alert_quantity, 10)';
    }

    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM aura_products p ${whereSql}`, params);
    const total = countRows?.[0]?.total || 0;

    const sql = `
      SELECT p.id, p.code, p.name, p.type, p.price, p.cost, p.quantity, p.alert_quantity,
             p.image, p.category_id, p.unit, p.tax_rate, p.tax_method,
             c.name AS category_name, u.name AS unit_name
      FROM aura_products p
      LEFT JOIN aura_categories c ON p.category_id = c.id
      LEFT JOIN aura_units u ON p.unit = u.id
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;

    const [products] = await db.query(sql, [...params, limit, offset]);

    return sendPaginated(res, products || [], total, page, limit);
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
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name, u.name AS unit_name
      FROM aura_products p
      LEFT JOIN aura_categories c ON p.category_id = c.id
      LEFT JOIN aura_units u ON p.unit = u.id
      WHERE p.id = ?
      LIMIT 1
    `, [id]);

    if (!rows || rows.length === 0) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, rows[0]);
  } catch (err) {
    return sendError(res, 'Failed to retrieve product', 500, err.message);
  }
};

/**
 * POST /api/admin/inventory/products
 */
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      code,
      category_id,
      price,
      cost = 0,
      quantity = 0,
      alert_quantity = 5,
      unit = 1,
      type = 'standard',
      details = ''
    } = req.body;

    if (!name) {
      return sendError(res, 'Product name is required', 400);
    }

    const autoCode = code || `SKU-${Date.now().toString().slice(-6)}`;

    const sql = `
      INSERT INTO aura_products (
        code, name, type, category_id, cost, price, quantity, alert_quantity, unit, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      autoCode,
      name,
      type,
      category_id || 1,
      cost,
      price || 0,
      quantity,
      alert_quantity,
      unit,
      details
    ]);

    const newId = result.insertId;

    await logActivity({
      req,
      action: 'create',
      tableName: 'aura_products',
      recordId: newId,
      newValues: { name, code: autoCode, price, quantity }
    });

    return sendSuccess(res, { id: newId, code: autoCode, name }, 'Product created successfully', null, 201);
  } catch (err) {
    return sendError(res, 'Failed to create product', 500, err.message);
  }
};

/**
 * PUT /api/admin/inventory/products/:id
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, category_id, price, cost, quantity, alert_quantity, details } = req.body;

    const [existing] = await db.query('SELECT * FROM aura_products WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return sendError(res, 'Product not found', 404);
    }
    const oldProduct = existing[0];

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (code !== undefined) { updates.push('code = ?'); params.push(code); }
    if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (cost !== undefined) { updates.push('cost = ?'); params.push(cost); }
    if (quantity !== undefined) { updates.push('quantity = ?'); params.push(quantity); }
    if (alert_quantity !== undefined) { updates.push('alert_quantity = ?'); params.push(alert_quantity); }
    if (details !== undefined) { updates.push('details = ?'); params.push(details); }

    if (updates.length === 0) {
      return sendSuccess(res, null, 'No modifications provided');
    }

    params.push(id);
    await db.query(`UPDATE aura_products SET ${updates.join(', ')} WHERE id = ?`, params);

    await logActivity({
      req,
      action: 'update',
      tableName: 'aura_products',
      recordId: id,
      oldValues: { name: oldProduct.name, price: oldProduct.price, quantity: oldProduct.quantity },
      newValues: { name, price, quantity }
    });

    return sendSuccess(res, { id: parseInt(id) }, 'Product updated successfully');
  } catch (err) {
    return sendError(res, 'Failed to update product', 500, err.message);
  }
};

/**
 * DELETE /api/admin/inventory/products/:id
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM aura_products WHERE id = ?', [id]);

    await logActivity({
      req,
      action: 'delete',
      tableName: 'aura_products',
      recordId: id
    });

    return sendSuccess(res, { id: parseInt(id) }, 'Product removed successfully');
  } catch (err) {
    return sendError(res, 'Failed to delete product', 500, err.message);
  }
};

/**
 * GET /api/admin/inventory/export
 * Export products to CSV
 */
exports.exportProductsCSV = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.id, p.code, p.name, c.name AS category, p.cost, p.price, p.quantity, p.alert_quantity
      FROM aura_products p
      LEFT JOIN aura_categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `);

    // Build CSV string
    const headers = ['ID', 'SKU Code', 'Product Name', 'Category', 'Cost ($)', 'Price ($)', 'Quantity', 'Alert Qty'];
    const rows = products.map(p => [
      p.id,
      `"${p.code}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.category || ''}"`,
      p.cost,
      p.price,
      p.quantity,
      p.alert_quantity
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=aura_products_export_${Date.now()}.csv`);
    return res.send(csvContent);
  } catch (err) {
    return sendError(res, 'Failed to export CSV', 500, err.message);
  }
};
