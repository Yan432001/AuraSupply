const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');
const { logActivity } = require('../../services/auditLogger.service');

/**
 * GET /api/admin/inventory/products
 * List products with search, category filter, store/biller filter, project filter, stock status, pagination, sorting
 */
exports.listProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(250, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const categoryId = req.query.category_id && req.query.category_id !== 'all' ? parseInt(req.query.category_id) : null;
    const billerId = req.query.biller_id && req.query.biller_id !== 'all' ? parseInt(req.query.biller_id) : null;
    const projectId = req.query.project_id && req.query.project_id !== 'all' ? parseInt(req.query.project_id) : null;
    const stockStatus = req.query.stock_status; // 'low', 'out', 'in'

    let whereSql = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereSql += ' AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode_symbology LIKE ? OR p.details LIKE ?)';
      params.push(search, search, search, search);
    }

    if (categoryId) {
      whereSql += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (billerId) {
      whereSql += ' AND p.biller_id = ?';
      params.push(billerId);
    }

    if (projectId) {
      whereSql += ' AND p.project_id = ?';
      params.push(projectId);
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
      SELECT p.*,
             c.name AS category_name, u.name AS unit_name,
             comp.name AS biller_name, comp.company AS biller_company, comp.slug AS biller_slug,
             proj.project_name, proj.project_code
      FROM aura_products p
      LEFT JOIN aura_categories c ON p.category_id = c.id
      LEFT JOIN aura_units u ON p.unit = u.id
      LEFT JOIN aura_companies comp ON p.biller_id = comp.id
      LEFT JOIN aura_projects proj ON p.project_id = proj.project_id
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;

    const [products] = await db.query(sql, [...params, limit, offset]);

    const formatted = (products || []).map(p => {
      const price = parseFloat(p.price) || 0;
      const quantity = parseFloat(p.quantity) || 0;
      const storeName = p.biller_name || p.biller_company || (p.biller_id ? `Store #${p.biller_id}` : 'Main Store');

      let imageUrl = p.image || '/placeholder.png';
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = `/assets/uploads/${imageUrl}`;
      }

      return {
        ...p,
        id: p.id,
        key: p.id,
        price,
        originalPrice: price,
        cost: parseFloat(p.cost) || 0,
        quantity,
        stockCount: quantity,
        inStock: quantity > 0,
        category: p.category_name || 'General',
        image: imageUrl,
        biller_id: p.biller_id || 1,
        billerName: storeName,
        shopName: storeName,
        seller: storeName,
        brand: p.brand || storeName,
        project_id: p.project_id || null,
        projectName: p.project_name || '',
        projectCode: p.project_code || ''
      };
    });

    return sendPaginated(res, formatted, total, page, limit);
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
      SELECT p.*, c.name AS category_name, u.name AS unit_name,
             comp.name AS biller_name, comp.company AS biller_company,
             proj.project_name, proj.project_code
      FROM aura_products p
      LEFT JOIN aura_categories c ON p.category_id = c.id
      LEFT JOIN aura_units u ON p.unit = u.id
      LEFT JOIN aura_companies comp ON p.biller_id = comp.id
      LEFT JOIN aura_projects proj ON p.project_id = proj.project_id
      WHERE p.id = ?
      LIMIT 1
    `, [id]);

    if (!rows || rows.length === 0) {
      return sendError(res, 'Product not found', 404);
    }

    const p = rows[0];
    const [gallery] = await db.query('SELECT photo FROM aura_product_photos WHERE product_id = ?', [id]);
    const [variants] = await db.query('SELECT * FROM aura_product_variants WHERE product_id = ?', [id]);

    return sendSuccess(res, {
      ...p,
      gallery: (gallery || []).map(g => g.photo),
      variants: variants || []
    });
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

    if (!name) {
      return sendError(res, 'Product name is required', 400);
    }

    const autoCode = (code || barcode || '').trim() || `PRD-${Date.now().toString().slice(-6)}`;
    const safeSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
    const safePrice = parseFloat(price) || 0;
    const safeCost = parseFloat(cost) || 0;
    const safeQuantity = parseFloat(quantity) || 0;

    const sql = `
      INSERT INTO aura_products (
        code, name, type, category_id, unit, purchase_unit, sale_unit, currency,
        price, cost, biller_id, project_id, image, slug, item_code, serial_no,
        max_serial, batch_numer, second_name, weight, barcode_symbology, brand,
        tax_rate, tax_method, alert_quantity, expiry_alert_days, stock_type,
        details, product_details, supplier1, supplier1price, supplier1_part_no,
        promotion, promo_price, start_date, end_date, quantity, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, 1
      )
    `;

    const [result] = await db.query(sql, [
      autoCode,
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

    await logActivity({
      req,
      action: 'create',
      tableName: 'aura_products',
      recordId: newId,
      newValues: { name, code: autoCode, price: safePrice, quantity: safeQuantity, biller_id, project_id }
    });

    return sendSuccess(res, {
      id: newId,
      code: autoCode,
      name,
      slug: safeSlug,
      price: safePrice,
      quantity: safeQuantity,
      biller_id,
      project_id
    }, 'Product created successfully', null, 201);
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
    const {
      name, code, category_id, biller_id, project_id, price, cost, quantity,
      alert_quantity, details, product_details, image, gallery, unit,
      purchase_unit, sale_unit, currency, barcode_symbology, item_code,
      serial_no, batch_numer, second_name, weight, tax_rate, tax_method,
      status, featured, variants
    } = req.body;

    const [existing] = await db.query('SELECT * FROM aura_products WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return sendError(res, 'Product not found', 404);
    }
    const oldProduct = existing[0];

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
      updates.push('slug = ?');
      params.push(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
    if (code !== undefined) { updates.push('code = ?'); params.push(code); }
    if (category_id !== undefined) { updates.push('category_id = ?'); params.push(parseInt(category_id) || 1); }
    if (biller_id !== undefined) { updates.push('biller_id = ?'); params.push(parseInt(biller_id) || 1); }
    if (project_id !== undefined) { updates.push('project_id = ?'); params.push(project_id ? parseInt(project_id) : null); }
    if (price !== undefined) { updates.push('price = ?'); params.push(parseFloat(price) || 0); }
    if (cost !== undefined) { updates.push('cost = ?'); params.push(parseFloat(cost) || 0); }
    if (quantity !== undefined) { updates.push('quantity = ?'); params.push(parseFloat(quantity) || 0); }
    if (alert_quantity !== undefined) { updates.push('alert_quantity = ?'); params.push(parseFloat(alert_quantity) || 5); }
    if (details !== undefined) { updates.push('details = ?'); params.push(details); }
    if (product_details !== undefined) { updates.push('product_details = ?'); params.push(product_details); }
    if (image !== undefined) { updates.push('image = ?'); params.push(image); }
    if (unit !== undefined) { updates.push('unit = ?'); params.push(unit); }
    if (purchase_unit !== undefined) { updates.push('purchase_unit = ?'); params.push(purchase_unit); }
    if (sale_unit !== undefined) { updates.push('sale_unit = ?'); params.push(sale_unit); }
    if (currency !== undefined) { updates.push('currency = ?'); params.push(currency); }
    if (barcode_symbology !== undefined) { updates.push('barcode_symbology = ?'); params.push(barcode_symbology); }
    if (item_code !== undefined) { updates.push('item_code = ?'); params.push(item_code); }
    if (serial_no !== undefined) { updates.push('serial_no = ?'); params.push(serial_no); }
    if (batch_numer !== undefined) { updates.push('batch_numer = ?'); params.push(batch_numer); }
    if (second_name !== undefined) { updates.push('second_name = ?'); params.push(second_name); }
    if (weight !== undefined) { updates.push('weight = ?'); params.push(weight); }
    if (tax_rate !== undefined) { updates.push('tax_rate = ?'); params.push(tax_rate); }
    if (tax_method !== undefined) { updates.push('tax_method = ?'); params.push(tax_method); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status === 'active' || status === 1 || status === true ? 1 : 0); }
    if (featured !== undefined) { updates.push('featured = ?'); params.push(featured ? 1 : 0); }

    if (updates.length > 0) {
      params.push(id);
      await db.query(`UPDATE aura_products SET ${updates.join(', ')} WHERE id = ?`, params);
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

    await logActivity({
      req,
      action: 'update',
      tableName: 'aura_products',
      recordId: id,
      oldValues: { name: oldProduct.name, price: oldProduct.price, quantity: oldProduct.quantity },
      newValues: { name, price, quantity, biller_id, project_id }
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
