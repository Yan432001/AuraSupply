const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');
const { logActivity } = require('../../services/auditLogger.service');

/**
 * GET /api/admin/orders (Sales)
 * List commercial sales orders with customer, payment status, and pagination
 */
exports.listSales = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    const status = req.query.status;
    const paymentStatus = req.query.payment_status;

    let whereSql = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereSql += ' AND (reference_no LIKE ? OR customer LIKE ? OR note LIKE ?)';
      params.push(search, search, search);
    }

    if (status && status !== 'all') {
      whereSql += ' AND sale_status = ?';
      params.push(status);
    }

    if (paymentStatus && paymentStatus !== 'all') {
      whereSql += ' AND payment_status = ?';
      params.push(paymentStatus);
    }

    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM aura_sales ${whereSql}`, params);
    const total = countRows?.[0]?.total || 0;

    const sql = `
      SELECT s.id, s.reference_no, s.date, s.customer, s.customer_id, s.biller, s.biller_id,
             s.grand_total, s.paid, (s.grand_total - s.paid) AS balance,
             s.sale_status, s.payment_status, s.delivery_status, s.note,
             b.theme_color AS biller_color, b.vat_no AS biller_vat_no,
             b.name_kh AS biller_name_kh, b.company_kh AS biller_company_kh,
             b.address_kh AS biller_address_kh, b.address AS biller_address,
             b.phone AS biller_phone, b.email AS biller_email,
             b.logo AS biller_logo, b.logo_url AS biller_logo_url,
             c.vat_no AS customer_vat_no, c.address AS customer_address
      FROM aura_sales s
      LEFT JOIN aura_companies b ON s.biller_id = b.id
      LEFT JOIN aura_companies c ON s.customer_id = c.id
      ${whereSql}
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?
    `;

    const [orders] = await db.query(sql, [...params, limit, offset]);

    return sendPaginated(res, orders || [], total, page, limit);
  } catch (err) {
    console.error('[AdminOrders listSales error]', err);
    return sendError(res, 'Failed to fetch sales orders', 500, err.message);
  }
};

/**
 * GET /api/admin/orders/:id
 * Retrieve single sale order with line items
 */
exports.getSaleDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const [orderRows] = await db.query(`
      SELECT s.*, 
             b.theme_color AS biller_color, b.vat_no AS biller_vat_no, 
             b.name_kh AS biller_name_kh, b.company_kh AS biller_company_kh, 
             b.address_kh AS biller_address_kh, b.address AS biller_address,
             b.phone AS biller_phone, b.email AS biller_email,
             b.logo AS biller_logo, b.logo_url AS biller_logo_url,
             c.vat_no AS customer_vat_no, c.address AS customer_address
      FROM aura_sales s
      LEFT JOIN aura_companies b ON s.biller_id = b.id
      LEFT JOIN aura_companies c ON s.customer_id = c.id
      WHERE s.id = ? LIMIT 1
    `, [id]);

    if (!orderRows || orderRows.length === 0) {
      return sendError(res, 'Order not found', 404);
    }

    const order = orderRows[0];
    const [items] = await db.query(`
      SELECT id, product_id, product_code, product_name, net_unit_price, unit_price,
             quantity, subtotal, tax, discount
      FROM aura_sale_items
      WHERE sale_id = ?
    `, [id]);

    order.items = items || [];
    return sendSuccess(res, order);
  } catch (err) {
    return sendError(res, 'Failed to retrieve order details', 500, err.message);
  }
};

/**
 * PUT /api/admin/orders/:id/status
 */
exports.updateSaleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { sale_status, payment_status } = req.body;

    const updates = [];
    const params = [];

    if (sale_status) { updates.push('sale_status = ?'); params.push(sale_status); }
    if (payment_status) { updates.push('payment_status = ?'); params.push(payment_status); }

    if (updates.length === 0) {
      return sendSuccess(res, null, 'No status changes requested');
    }

    params.push(id);
    await db.query(`UPDATE aura_sales SET ${updates.join(', ')} WHERE id = ?`, params);

    await logActivity({
      req,
      action: 'status_update',
      tableName: 'aura_sales',
      recordId: id,
      newValues: { sale_status, payment_status }
    });

    return sendSuccess(res, { id: parseInt(id), sale_status, payment_status }, 'Order status updated');
  } catch (err) {
    return sendError(res, 'Failed to update order status', 500, err.message);
  }
};

/**
 * GET /api/admin/purchases
 * List supplier purchase orders with pagination & filters
 */
exports.listPurchases = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;

    let whereSql = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereSql += ' AND (reference_no LIKE ? OR supplier LIKE ? OR note LIKE ?)';
      params.push(search, search, search);
    }

    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM aura_purchases ${whereSql}`, params);
    const total = countRows?.[0]?.total || 0;

    const sql = `
      SELECT id, reference_no, date, supplier, supplier_id,
             grand_total, paid, (grand_total - paid) AS balance,
             status, payment_status, note
      FROM aura_purchases
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    const [purchases] = await db.query(sql, [...params, limit, offset]);

    return sendPaginated(res, purchases || [], total, page, limit);
  } catch (err) {
    return sendError(res, 'Failed to fetch purchase orders', 500, err.message);
  }
};
