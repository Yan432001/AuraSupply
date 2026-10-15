const db = require("../../config/utill/connection");
const { logError } = require("../../config/utill/logErr");

/**
 * GET /api/categories & GET /api/admin/categories
 */
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.*,
        COUNT(p.id) AS products_count
      FROM aura_categories c
      LEFT JOIN aura_products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.order_number ASC, c.name ASC
    `);

    res.json({
      status: true,
      data: rows.map(c => ({
        id: c.id,
        key: c.id,
        code: c.code || '',
        name: c.name || 'Untitled Category',
        slug: c.slug || '',
        description: c.description || '',
        image: c.image ? `/assets/uploads/${c.image}` : null,
        parent_id: c.parent_id,
        order_number: c.order_number || 0,
        status: c.status === '0' || c.status === 0 ? 'inactive' : 'active',
        products_count: parseInt(c.products_count || 0)
      }))
    });
  } catch (err) {
    console.error("Categories get error:", err);
    logError("categories.controller.getCategories", err, res);
  }
};

/**
 * POST /api/categories & POST /api/admin/categories
 */
exports.addCategories = async (req, res) => {
  try {
    const { name, code, description, status = 'active', parent_id = 0, image = '' } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ status: false, message: 'Category name is required' });
    }

    const safeCode = (code && code.trim() !== '') ? code.trim() : name.toUpperCase().slice(0, 4) + Math.floor(100 + Math.random() * 900);
    const safeSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [result] = await db.query(`
      INSERT INTO aura_categories 
      (code, name, slug, description, status, parent_id, image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      safeCode,
      name.trim(),
      safeSlug,
      description || '',
      status === 'inactive' || status === 0 ? '0' : '1',
      parseInt(parent_id) || 0,
      image || ''
    ]);

    const newId = result.insertId;
    res.status(201).json({
      status: true,
      success: true,
      message: 'Category created successfully',
      data: {
        id: newId,
        code: safeCode,
        name: name.trim(),
        description,
        status
      }
    });
  } catch (err) {
    console.error("Create category error:", err);
    logError("categories.controller.addCategories", err, res);
  }
};

/**
 * PUT /api/categories/:id & PUT /api/admin/categories/:id
 */
exports.updateCategories = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      return res.status(400).json({ status: false, message: 'Category ID is required' });
    }

    const { name, code, description, status, parent_id, image } = req.body;
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name.trim());
      fields.push('slug = ?');
      values.push(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
    if (code !== undefined) {
      fields.push('code = ?');
      values.push(code.trim());
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      values.push(status === 'inactive' || status === 0 || status === '0' ? '0' : '1');
    }
    if (parent_id !== undefined) {
      fields.push('parent_id = ?');
      values.push(parseInt(parent_id) || 0);
    }
    if (image !== undefined && image !== '') {
      fields.push('image = ?');
      values.push(image);
    }

    if (fields.length === 0) {
      return res.json({ status: true, message: 'No fields to update' });
    }

    values.push(id);
    await db.query(`UPDATE aura_categories SET ${fields.join(', ')} WHERE id = ?`, values);

    res.json({
      status: true,
      success: true,
      message: 'Category updated successfully'
    });
  } catch (err) {
    console.error("Update category error:", err);
    logError("categories.controller.updateCategories", err, res);
  }
};

/**
 * DELETE /api/categories/:id & DELETE /api/admin/categories/:id
 */
exports.deleteCategories = async (req, res) => {
  try {
    const id = req.params.id || req.body.id || req.query.id;
    if (!id) {
      return res.status(400).json({ status: false, message: 'Category ID is required' });
    }

    await db.query("DELETE FROM aura_categories WHERE id = ?", [id]);

    res.json({
      status: true,
      success: true,
      message: `Category #${id} deleted successfully`
    });
  } catch (err) {
    console.error("Delete category error:", err);
    logError("categories.controller.deleteCategories", err, res);
  }
};
