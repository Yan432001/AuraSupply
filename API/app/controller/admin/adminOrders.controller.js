const { db } = require('../../config/utill/helper');
const { sendSuccess, sendError, sendPaginated } = require('../../config/utill/response');
const { logActivity } = require('../../services/auditLogger.service');
const salesController = require('./sales.controller');

/**
 * GET /api/admin/orders (Sales)
 * Delegates to comprehensive Sales Controller with full metrics, pagination, and multi-unit support
 */
exports.listSales = salesController.getSales;

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

const purchasesController = require('./purchases.controller');

/**
 * GET /api/admin/purchases
 * Delegates to full Purchases Controller with metrics, pagination, and multi-unit support
 */
exports.listPurchases = purchasesController.getPurchases;
