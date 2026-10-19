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

  const storeName = p.biller_name || p.biller_company || (p.biller_id ? `Store #${p.biller_id}` : 'Main Store');

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
    billerName: storeName,
    shopName: storeName,
    seller: storeName,
    brand: p.brand || storeName,
    project_id: p.project_id || null,
    projectName: p.project_name || '',
    projectCode: p.project_code || '',
    unit: p.unit || 1,
    purchase_unit: p.purchase_unit || 1,
    sale_unit: p.sale_unit || 1,
    currency: p.currency || 'USD',
    barcode_symbology: p.barcode_symbology || 'Code128',
    item_code: p.item_code || '',
    serial_no: p.serial_no || '',
    max_serial: p.max_serial || '',
    batch_numer: p.batch_numer || '',
    second_name: p.second_name || '',
    weight: p.weight || '',
    tax_rate: p.tax_rate || null,
    tax_method: p.tax_method || 'exclusive',
    expiry_alert_days: p.expiry_alert_days || null,
    stock_type: p.stock_type || null,
    supplier1: p.supplier1 || '',
    supplier1price: p.supplier1price || 0,
    supplier1_part_no: p.supplier1_part_no || '',
    promotion: p.promotion || 0,
    promo_price: p.promo_price || null,
    start_date: p.start_date || null,
    end_date: p.end_date || null
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
      biller_id,
      project_id,
      page = 1,
      limit = 100,
      sort_by = 'p.id',
      sort_order = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        p.*,
        c.name AS category_name,
        c.code AS category_code,
        comp.name AS biller_name,
        comp.company AS biller_company,
        comp.slug AS biller_slug,
        proj.project_name,
        proj.project_code
      FROM aura_products p
      LEFT JOIN aura_categories c ON p.category_id = c.id
      LEFT JOIN aura_companies comp ON p.biller_id = comp.id
      LEFT JOIN aura_projects proj ON p.project_id = proj.project_id
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

    if (biller_id && biller_id !== 'all') {
      query += ` AND p.biller_id = ?`;
      params.push(biller_id);
    }

    if (project_id && project_id !== 'all') {
      query += ` AND p.project_id = ?`;
      params.push(project_id);
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
    const numLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 500);
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
 * Create new product with all multi-tab fields (Required, Details, Variants, Supplier, Promotion)
 */
exports.addProducts = async (req, res) => {
  try {
    const {
      name,
      code,
      barcode,
      type = 'standard',
      category_id = 1,
      unit = 1,
      purchase_unit = 1,
      sale_unit = 1,
      currency = 'USD',
      price = 0,
      cost = 0,
      biller_id = 1,
      project_id = null,
      image = '',
      gallery = [],
      item_code = '',
      serial_no = '',
      max_serial = '',
      batch_numer = '',
      second_name = '',
      weight = '',
      barcode_symbology = 'Code128',
      brand = null,
      tax_rate = null,
      tax_method = 'exclusive',
      alert_quantity = 5,
      expiry_alert_days = null,
      stock_type = null,
      details = '',
      product_details = '',
      supplier1 = '',
      supplier1price = 0,
      supplier1_part_no = '',
      promotion = 0,
      promo_price = null,
      start_date = null,
      end_date = null,
      variants = [],
      quantity = 50,
      warehouse_id = 1
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ status: false, message: 'Product name is required' });
    }

    const safeCode = (code || barcode || '').trim() || `PRD-${Date.now().toString().slice(-6)}`;
    const safeSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
    const safePrice = parseFloat(price) || 0;
    const safeCost = parseFloat(cost) || 0;
    const safeQuantity = parseFloat(quantity) || 0;

    const [result] = await db.query(`
      INSERT INTO aura_products 
      (
        code, name, type, category_id, unit, purchase_unit, sale_unit, currency,
        price, cost, biller_id, project_id, image, slug, item_code, serial_no,
        max_serial, batch_numer, second_name, weight, barcode_symbology, brand,
        tax_rate, tax_method, alert_quantity, expiry_alert_days, stock_type,
        details, product_details, supplier1, supplier1price, supplier1_part_no,
        promotion, promo_price, start_date, end_date, quantity, status
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, 1
      )
    `, [
      safeCode,
      name.trim(),
      type,
      parseInt(category_id) || 1,
      unit,
      purchase_unit,
      sale_unit,
      currency,
      safePrice,
      safeCost,
      parseInt(biller_id) || 1,
      project_id ? parseInt(project_id) : null,
      image || '',
      safeSlug,
      item_code || '',
      serial_no || '',
      max_serial || '',
      batch_numer || '',
      second_name || '',
      weight || '',
      barcode_symbology || 'Code128',
      brand || null,
      tax_rate || null,
      tax_method || 'exclusive',
      parseFloat(alert_quantity) || 5,
      expiry_alert_days ? parseInt(expiry_alert_days) : null,
      stock_type || null,
      details || '',
      product_details || details || '',
      supplier1 || '',
      parseFloat(supplier1price) || 0,
      supplier1_part_no || '',
      promotion ? 1 : 0,
      promo_price ? parseFloat(promo_price) : null,
      start_date || null,
      end_date || null,
      safeQuantity
    ]);

    const newId = result.insertId;

    // Stock in warehouse
    await db.query(`
      INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), avg_cost = VALUES(avg_cost)
    `, [newId, warehouse_id || 1, safeQuantity, safeCost]);

    // Save Gallery photos
    if (Array.isArray(gallery) && gallery.length > 0) {
      for (const photoUrl of gallery) {
        if (photoUrl && String(photoUrl).trim()) {
          await db.query(`INSERT INTO aura_product_photos (product_id, photo) VALUES (?, ?)`, [newId, String(photoUrl).trim()]);
        }
      }
    }

    // Save Variants
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        if (v && v.name) {
          await db.query(`
            INSERT INTO aura_product_variants (product_id, name, cost, price, quantity)
            VALUES (?, ?, ?, ?, ?)
          `, [newId, v.name, safeCost, parseFloat(v.price) || safePrice, parseFloat(v.quantity) || 10]);
        }
      }
    }

    // Save Multi-Unit Pricing (AURA_v1)
    if (Array.isArray(unitPrices) && unitPrices.length > 0) {
      for (const up of unitPrices) {
        if (!up.unit_id) continue;
        const uCost = parseFloat(up.cost) || safeCost;
        const uPrice = parseFloat(up.price) || safePrice;
        const uBarcode = up.product_code || up.barcode || null;
        const uQty = parseFloat(up.unit_qty || up.operation_value || 1);

        await db.query(`
          INSERT INTO aura_cost_price_by_units (product_id, unit_id, cost, price, product_code)
          VALUES (?, ?, ?, ?, ?)
        `, [newId, up.unit_id, uCost, uPrice, uBarcode]);

        await db.query(`
          INSERT INTO aura_product_units (product_id, unit_id, unit_qty, unit_price)
          VALUES (?, ?, ?, ?)
        `, [newId, up.unit_id, uQty, uPrice]);
      }
    }

    const [createdRows] = await db.query(`
      SELECT p.*, c.name AS category_name, comp.name AS biller_name, comp.company AS biller_company, proj.project_name
      FROM aura_products p 
      LEFT JOIN aura_categories c ON p.category_id = c.id 
      LEFT JOIN aura_companies comp ON p.biller_id = comp.id
      LEFT JOIN aura_projects proj ON p.project_id = proj.project_id
      WHERE p.id = ?
    `, [newId]);

    res.status(201).json({
      status: true,
      message: 'Product created successfully',
      data: formatProduct(createdRows[0] || { id: newId, name, code: safeCode, price: safePrice, quantity: safeQuantity, biller_id, project_id })
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
      biller_id,
      project_id,
      unit,
      purchase_unit,
      sale_unit,
      currency,
      item_code,
      serial_no,
      batch_numer,
      second_name,
      weight,
      barcode_symbology,
      tax_rate,
      tax_method,
      details,
      product_details,
      status,
      featured,
      image,
      gallery,
      variants
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
    if (biller_id !== undefined) {
      fields.push('biller_id = ?');
      values.push(parseInt(biller_id) || 1);
    }
    if (project_id !== undefined) {
      fields.push('project_id = ?');
      values.push(project_id ? parseInt(project_id) : null);
    }
    if (unit !== undefined) {
      fields.push('unit = ?');
      values.push(unit);
    }
    if (purchase_unit !== undefined) {
      fields.push('purchase_unit = ?');
      values.push(purchase_unit);
    }
    if (sale_unit !== undefined) {
      fields.push('sale_unit = ?');
      values.push(sale_unit);
    }
    if (currency !== undefined) {
      fields.push('currency = ?');
      values.push(currency);
    }
    if (item_code !== undefined) {
      fields.push('item_code = ?');
      values.push(item_code);
    }
    if (serial_no !== undefined) {
      fields.push('serial_no = ?');
      values.push(serial_no);
    }
    if (batch_numer !== undefined) {
      fields.push('batch_numer = ?');
      values.push(batch_numer);
    }
    if (second_name !== undefined) {
      fields.push('second_name = ?');
      values.push(second_name);
    }
    if (weight !== undefined) {
      fields.push('weight = ?');
      values.push(weight);
    }
    if (barcode_symbology !== undefined) {
      fields.push('barcode_symbology = ?');
      values.push(barcode_symbology);
    }
    if (tax_rate !== undefined) {
      fields.push('tax_rate = ?');
      values.push(tax_rate);
    }
    if (tax_method !== undefined) {
      fields.push('tax_method = ?');
      values.push(tax_method);
    }
    if (details !== undefined) {
      fields.push('details = ?');
      values.push(details);
    }
    if (product_details !== undefined) {
      fields.push('product_details = ?');
      values.push(product_details);
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

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE aura_products SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    // Update gallery if supplied
    if (Array.isArray(gallery)) {
      await db.query('DELETE FROM aura_product_photos WHERE product_id = ?', [id]);
      for (const p of gallery) {
        if (p && String(p).trim()) {
          await db.query('INSERT INTO aura_product_photos (product_id, photo) VALUES (?, ?)', [id, String(p).trim()]);
        }
      }
    }

    // Update warehouse stock if quantity changed
    if (quantity !== undefined) {
      await db.query(`
        INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
        VALUES (?, 1, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
      `, [id, parseFloat(quantity) || 0, parseFloat(cost) || 0]);
    }

    // Update Multi-Unit Pricing (AURA_v1)
    if (Array.isArray(unitPrices)) {
      for (const up of unitPrices) {
        if (!up.unit_id) continue;
        const uCost = parseFloat(up.cost) || parseFloat(cost) || 0;
        const uPrice = parseFloat(up.price) || parseFloat(price) || 0;
        const uBarcode = up.product_code || up.barcode || null;
        const uQty = parseFloat(up.unit_qty || up.operation_value || 1);

        const [existingCp] = await db.query(
          'SELECT id FROM aura_cost_price_by_units WHERE product_id = ? AND unit_id = ? LIMIT 1',
          [id, up.unit_id]
        );
        if (existingCp.length > 0) {
          await db.query(`
            UPDATE aura_cost_price_by_units SET cost = ?, price = ?, product_code = ?
            WHERE id = ?
          `, [uCost, uPrice, uBarcode, existingCp[0].id]);
        } else {
          await db.query(`
            INSERT INTO aura_cost_price_by_units (product_id, unit_id, cost, price, product_code)
            VALUES (?, ?, ?, ?, ?)
          `, [id, up.unit_id, uCost, uPrice, uBarcode]);
        }

        const [existingPu] = await db.query(
          'SELECT id FROM aura_product_units WHERE product_id = ? AND unit_id = ? LIMIT 1',
          [id, up.unit_id]
        );
        if (existingPu.length > 0) {
          await db.query(`
            UPDATE aura_product_units SET unit_qty = ?, unit_price = ?
            WHERE id = ?
          `, [uQty, uPrice, existingPu[0].id]);
        } else {
          await db.query(`
            INSERT INTO aura_product_units (product_id, unit_id, unit_qty, unit_price)
            VALUES (?, ?, ?, ?)
          `, [id, up.unit_id, uQty, uPrice]);
        }
      }
    }

    const [updatedRows] = await db.query(`
      SELECT p.*, c.name AS category_name, comp.name AS biller_name, comp.company AS biller_company, proj.project_name
      FROM aura_products p 
      LEFT JOIN aura_categories c ON p.category_id = c.id 
      LEFT JOIN aura_companies comp ON p.biller_id = comp.id
      LEFT JOIN aura_projects proj ON p.project_id = proj.project_id
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