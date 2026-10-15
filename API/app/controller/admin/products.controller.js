const db = require("../../config/utill/connection");
const { logError } = require("../../config/utill/logErr");

// Helper to format a product record
function formatProduct(p) {
  const price = parseFloat(p.price) || 0;
  const cost = parseFloat(p.cost) || 0;
  const quantity = parseFloat(p.quantity) || 0;
  const alertQuantity = parseFloat(p.alert_quantity) || 5;

  let imageUrl = '/placeholder.png';
  if (p.image) {
    if (p.image.startsWith('http') || p.image.startsWith('/')) {
      imageUrl = p.image;
    } else {
      imageUrl = `/assets/uploads/${p.image}`;
    }
  }

  return {
    id: p.id,
    key: p.id,
    code: p.code || '',
    name: p.name || 'Untitled Product',
    price: price,
    originalPrice: price,
    cost: cost,
    quantity: quantity,
    stockCount: quantity,
    alertQuantity: alertQuantity,
    inStock: quantity > 0,
    category_id: p.category_id,
    category: p.category_name || 'Uncategorized',
    image: imageUrl,
    image_thumb: p.image ? `/assets/uploads/thumbs/${p.image}` : imageUrl,
    details: p.details || p.product_details || '',
    description: p.details || p.product_details || '',
    type: p.type || 'standard',
    status: p.status === 0 ? 'inactive' : 'active',
    featured: Boolean(p.featured),
    slug: p.slug || '',
    biller_id: p.biller_id || 1,
    unit: p.unit || 1
  };
}

/**
 * GET /api/admin/products and GET /api/products
 * Fetch products list with filters, search, and metrics
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      category_id,
      category,
      stock,
      status,
      page = 1,
      limit = 100,
      sort_by = 'p.id',
      sort_order = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        p.*,
        c.name AS category_name,
        c.code AS category_code
      FROM aura_products p
      LEFT JOIN aura_categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (p.name LIKE ? OR p.code LIKE ? OR p.details LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category_id && category_id !== 'all') {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    } else if (category && category !== 'all') {
      query += ` AND (c.name = ? OR c.code = ?)`;
      params.push(category, category);
    }

    if (stock === 'in_stock') {
      query += ` AND p.quantity > 0`;
    } else if (stock === 'out_of_stock') {
      query += ` AND p.quantity <= 0`;
    } else if (stock === 'low_stock') {
      query += ` AND p.quantity > 0 AND p.quantity <= COALESCE(p.alert_quantity, 5)`;
    }

    if (status && status !== 'all') {
      query += ` AND p.status = ?`;
      params.push(status === 'active' ? 1 : 0);
    }

    // Order by
    const validSortCols = ['p.id', 'p.name', 'p.price', 'p.quantity', 'p.code'];
    const safeCol = validSortCols.includes(sort_by) ? sort_by : 'p.id';
    const safeOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${safeCol} ${safeOrder}`;

    // Pagination
    const numLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 500);
    const numOffset = (Math.max(parseInt(page) || 1, 1) - 1) * numLimit;
    query += ` LIMIT ${numLimit} OFFSET ${numOffset}`;

    const [rows] = await db.query(query, params);

    // Compute metrics
    const [countRows] = await db.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END) AS in_stock,
        SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END) AS out_of_stock,
        SUM(CASE WHEN quantity > 0 AND quantity <= COALESCE(alert_quantity, 5) THEN 1 ELSE 0 END) AS low_stock,
        SUM(price * quantity) AS total_catalog_value
      FROM aura_products
    `);

    const metrics = {
      total: parseInt(countRows[0]?.total) || 0,
      inStock: parseInt(countRows[0]?.in_stock) || 0,
      outOfStock: parseInt(countRows[0]?.out_of_stock) || 0,
      lowStock: parseInt(countRows[0]?.low_stock) || 0,
      totalCatalogValue: parseFloat(countRows[0]?.total_catalog_value) || 0
    };

    const formattedData = rows.map(formatProduct);

    res.json({
      status: true,
      data: formattedData,
      total: metrics.total,
      page: parseInt(page) || 1,
      limit: numLimit,
      metrics
    });
  } catch (err) {
    console.error("Products controller error:", err);
    logError("products.controller.getProducts", err, res);
  }
};

/**
 * GET /api/admin/products/:id
 */
exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name 
      FROM aura_products p 
      LEFT JOIN aura_categories c ON p.category_id = c.id 
      WHERE p.id = ? LIMIT 1
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: false, message: 'Product not found' });
    }

    res.json({
      status: true,
      data: formatProduct(rows[0])
    });
  } catch (err) {
    logError("products.controller.getProductById", err, res);
  }
};

/**
 * POST /api/admin/products & POST /api/products
 * Create new product
 */
exports.addProducts = async (req, res) => {
  try {
    const {
      name,
      code,
      price,
      cost = 0,
      quantity = 0,
      alert_quantity = 5,
      category_id = 1,
      details = '',
      type = 'standard',
      biller_id = 1,
      image = ''
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ status: false, message: 'Product name is required' });
    }

    const safeCode = (code && code.trim() !== '') ? code.trim() : Math.floor(10000000 + Math.random() * 90000000).toString();
    const safeSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const safePrice = parseFloat(price) || 0;
    const safeCost = parseFloat(cost) || 0;
    const safeQuantity = parseFloat(quantity) || 0;

    const [result] = await db.query(`
      INSERT INTO aura_products 
      (code, name, slug, price, cost, quantity, alert_quantity, category_id, details, type, biller_id, image, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      safeCode,
      name.trim(),
      safeSlug,
      safePrice,
      safeCost,
      safeQuantity,
      parseFloat(alert_quantity) || 5,
      parseInt(category_id) || 1,
      details,
      type,
      parseInt(biller_id) || 1,
      image || ''
    ]);

    const newId = result.insertId;
    const [createdRows] = await db.query(`
      SELECT p.*, c.name AS category_name 
      FROM aura_products p 
      LEFT JOIN aura_categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [newId]);

    res.status(201).json({
      status: true,
      message: 'Product created successfully',
      data: formatProduct(createdRows[0] || { id: newId, name, code: safeCode, price: safePrice, quantity: safeQuantity })
    });
  } catch (err) {
    console.error("Add product error:", err);
    logError("products.controller.addProducts", err, res);
  }
};

/**
 * PUT /api/admin/products/:id or POST /api/products/update
 * Update product
 */
exports.updateProducts = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      return res.status(400).json({ status: false, message: 'Product ID is required for update' });
    }

    const {
      name,
      code,
      price,
      cost,
      quantity,
      alert_quantity,
      category_id,
      details,
      status,
      featured,
      image
    } = req.body;

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
      fields.push('slug = ?');
      values.push(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
    if (code !== undefined) {
      fields.push('code = ?');
      values.push(code);
    }
    if (price !== undefined) {
      fields.push('price = ?');
      values.push(parseFloat(price) || 0);
    }
    if (cost !== undefined) {
      fields.push('cost = ?');
      values.push(parseFloat(cost) || 0);
    }
    if (quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(parseFloat(quantity) || 0);
    }
    if (alert_quantity !== undefined) {
      fields.push('alert_quantity = ?');
      values.push(parseFloat(alert_quantity) || 5);
    }
    if (category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(parseInt(category_id) || 1);
    }
    if (details !== undefined) {
      fields.push('details = ?');
      values.push(details);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      values.push(status === 'active' || status === 1 || status === true ? 1 : 0);
    }
    if (featured !== undefined) {
      fields.push('featured = ?');
      values.push(featured ? 1 : 0);
    }
    if (image !== undefined && image !== '') {
      fields.push('image = ?');
      values.push(image);
    }

    if (fields.length === 0) {
      return res.json({ status: true, message: 'No fields to update' });
    }

    values.push(id);
    await db.query(`UPDATE aura_products SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updatedRows] = await db.query(`
      SELECT p.*, c.name AS category_name 
      FROM aura_products p 
      LEFT JOIN aura_categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [id]);

    res.json({
      status: true,
      message: 'Product updated successfully',
      data: formatProduct(updatedRows[0])
    });
  } catch (err) {
    console.error("Update product error:", err);
    logError("products.controller.updateProducts", err, res);
  }
};

/**
 * DELETE /api/admin/products/:id or DELETE /api/products
 * Delete product
 */
exports.deleteProducts = async (req, res) => {
  try {
    const id = req.params.id || req.body.id || req.query.id;
    if (!id) {
      return res.status(400).json({ status: false, message: 'Product ID is required for deletion' });
    }

    await db.query("DELETE FROM aura_products WHERE id = ?", [id]);

    res.json({
      status: true,
      message: `Product #${id} deleted successfully`
    });
  } catch (err) {
    logError("products.controller.deleteProducts", err, res);
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
      message: `Bulk price adjustment applied to ${productIds.length} products`
    });
  } catch (err) {
    logError("products.controller.bulkUpdatePrices", err, res);
  }
};