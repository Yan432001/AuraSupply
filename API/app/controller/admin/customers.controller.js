const db = require("../../config/utill/connection");
const { logError } = require("../../config/utill/logErr");

// Determine customer tier based on spend
function getCustomerTier(spend) {
  if (spend >= 2500) return 'Gold';
  if (spend >= 500) return 'Silver';
  return 'Bronze';
}

function formatCustomer(c) {
  const ordersCount = parseInt(c.orders_count || 0);
  const totalSpend = parseFloat(c.total_spend || 0);
  const seed = (c.id % 70) + 1;

  return {
    id: c.id,
    key: c.id,
    name: c.name || c.company || 'Unnamed Customer',
    company: c.company || '',
    email: c.email || 'customer@aurasupply.com',
    phone: c.phone || '',
    city: c.city || 'Phnom Penh',
    address: c.address || '',
    orders: ordersCount,
    spend: totalSpend,
    tier: getCustomerTier(totalSpend),
    avatar: c.logo_url || `https://i.pravatar.cc/80?img=${seed}`,
    points: parseInt(c.award_points || 0),
    created_at: c.date || new Date().toISOString()
  };
}

/**
 * GET /api/admin/customers
 * List customers from aura_companies where group_name = 'customer'
 */
exports.getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT 
        c.*,
        COUNT(s.id) AS orders_count,
        COALESCE(SUM(s.grand_total), 0) AS total_spend
      FROM aura_companies c
      LEFT JOIN aura_sales s ON c.id = s.customer_id
      WHERE c.group_name = 'customer'
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
    const formattedCustomers = rows.map(formatCustomer);

    // Compute metrics
    const [totalRows] = await db.query(`
      SELECT 
        COUNT(*) AS total_customers,
        COALESCE(SUM(s.grand_total), 0) AS total_customer_spend
      FROM aura_companies c
      LEFT JOIN aura_sales s ON c.id = s.customer_id
      WHERE c.group_name = 'customer'
    `);

    const totalCustomers = parseInt(totalRows[0]?.total_customers) || formattedCustomers.length;
    const totalSpend = parseFloat(totalRows[0]?.total_customer_spend) || 0;
    const avgSpend = totalCustomers > 0 ? (totalSpend / totalCustomers) : 0;
    const goldCount = formattedCustomers.filter(c => c.tier === 'Gold').length;

    res.json({
      status: true,
      data: formattedCustomers,
      customers: formattedCustomers,
      total: totalCustomers,
      metrics: {
        totalCustomers,
        goldCount,
        avgSpend,
        totalSpend
      }
    });
  } catch (err) {
    console.error("Customers get error:", err);
    logError("customers.controller.getCustomers", err, res);
  }
};

/**
 * GET /api/admin/customers/:id
 */
exports.getCustomerById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(`
      SELECT 
        c.*,
        COUNT(s.id) AS orders_count,
        COALESCE(SUM(s.grand_total), 0) AS total_spend
      FROM aura_companies c
      LEFT JOIN aura_sales s ON c.id = s.customer_id
      WHERE c.id = ? AND c.group_name = 'customer'
      GROUP BY c.id
      LIMIT 1
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ status: false, message: 'Customer not found' });
    }

    res.json({
      status: true,
      data: formatCustomer(rows[0])
    });
  } catch (err) {
    logError("customers.controller.getCustomerById", err, res);
  }
};

/**
 * POST /api/admin/customers
 */
exports.createCustomer = async (req, res) => {
  try {
    const { name, company, email, phone, city, address } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ status: false, message: 'Customer name is required' });
    }

    const [result] = await db.query(`
      INSERT INTO aura_companies 
      (group_id, group_name, customer_group_id, customer_group_name, name, company, email, phone, city, address, date)
      VALUES (3, 'customer', 1, 'General', ?, ?, ?, ?, ?, ?, NOW())
    `, [
      name.trim(),
      company || name.trim(),
      email || null,
      phone || null,
      city || 'Phnom Penh',
      address || null
    ]);

    const newId = result.insertId;
    res.status(201).json({
      status: true,
      message: 'Customer registered successfully',
      data: {
        id: newId,
        key: newId,
        name: name.trim(),
        email: email || '',
        phone: phone || '',
        tier: 'Bronze',
        orders: 0,
        spend: 0
      }
    });
  } catch (err) {
    console.error("Create customer error:", err);
    logError("customers.controller.createCustomer", err, res);
  }
};

/**
 * PUT /api/admin/customers/:id
 */
exports.updateCustomer = async (req, res) => {
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
    await db.query(`UPDATE aura_companies SET ${fields.join(', ')} WHERE id = ? AND group_name = 'customer'`, values);

    res.json({
      status: true,
      message: 'Customer updated successfully'
    });
  } catch (err) {
    logError("customers.controller.updateCustomer", err, res);
  }
};

/**
 * DELETE /api/admin/customers/:id
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM aura_companies WHERE id = ? AND group_name = 'customer'", [id]);
    res.json({
      status: true,
      message: `Customer #${id} deleted successfully`
    });
  } catch (err) {
    logError("customers.controller.deleteCustomer", err, res);
  }
};
