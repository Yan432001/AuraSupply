const db = require("../../config/utill/connection");
const { logError } = require("../../config/utill/logErr");

function formatSupplier(s) {
  const purchasesCount = parseInt(s.purchases_count || 0);
  const totalPurchases = parseFloat(s.total_purchased || 0);

  return {
    id: s.id,
    key: s.id,
    name: s.name || s.company || 'Unnamed Supplier',
    company: s.company || s.name || '',
    email: s.email || 'supplier@aurasupply.com',
    phone: s.phone || '',
    city: s.city || 'Phnom Penh',
    address: s.address || '',
    purchases: purchasesCount,
    spend: totalPurchases,
    total_purchased: totalPurchases,
    created_at: s.date || new Date().toISOString()
  };
}

/**
 * GET /api/admin/suppliers
 */
exports.getSuppliers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT 
        c.*,
        COUNT(p.id) AS purchases_count,
        COALESCE(SUM(p.grand_total), 0) AS total_purchased
      FROM aura_companies c
      LEFT JOIN aura_purchases p ON c.id = p.supplier_id
      WHERE c.group_name = 'supplier'
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (c.name LIKE ? OR c.company LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` GROUP BY c.id ORDER BY c.id DESC`;

    const numLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    const numOffset = (Math.max(parseInt(page) || 1, 1) - 1) * numLimit;
    query += ` LIMIT ${numLimit} OFFSET ${numOffset}`;

    const [rows] = await db.query(query, params);
    const formattedSuppliers = rows.map(formatSupplier);

    res.json({
      status: true,
      data: formattedSuppliers,
      suppliers: formattedSuppliers,
      total: formattedSuppliers.length
    });
  } catch (err) {
    logError("suppliers.controller.getSuppliers", err, res);
  }
};

/**
 * POST /api/admin/suppliers
 */
exports.createSupplier = async (req, res) => {
  try {
    const { name, company, email, phone, city, address } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ status: false, message: 'Supplier name is required' });
    }

    const [result] = await db.query(`
      INSERT INTO aura_companies 
      (group_id, group_name, name, company, email, phone, city, address, date)
      VALUES (4, 'supplier', ?, ?, ?, ?, ?, ?, NOW())
    `, [
      name.trim(),
      company || name.trim(),
      email || null,
      phone || null,
      city || 'Phnom Penh',
      address || null
    ]);

    res.status(201).json({
      status: true,
      message: 'Supplier created successfully',
      data: { id: result.insertId, name: name.trim() }
    });
  } catch (err) {
    logError("suppliers.controller.createSupplier", err, res);
  }
};

/**
 * PUT /api/admin/suppliers/:id
 */
exports.updateSupplier = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, company, email, phone, city, address } = req.body;

    const fields = [];
    const values = [];

    if (name) { fields.push('name = ?'); values.push(name); }
    if (company !== undefined) { fields.push('company = ?'); values.push(company); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (city !== undefined) { fields.push('city = ?'); values.push(city); }
    if (address !== undefined) { fields.push('address = ?'); values.push(address); }

    if (fields.length === 0) {
      return res.json({ status: true, message: 'No fields to update' });
    }

    values.push(id);
    await db.query(`UPDATE aura_companies SET ${fields.join(', ')} WHERE id = ? AND group_name = 'supplier'`, values);

    res.json({
      status: true,
      message: 'Supplier updated successfully'
    });
  } catch (err) {
    logError("suppliers.controller.updateSupplier", err, res);
  }
};

/**
 * DELETE /api/admin/suppliers/:id
 */
exports.deleteSupplier = async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM aura_companies WHERE id = ? AND group_name = 'supplier'", [id]);
    res.json({
      status: true,
      message: `Supplier #${id} deleted successfully`
    });
  } catch (err) {
    logError("suppliers.controller.deleteSupplier", err, res);
  }
};
