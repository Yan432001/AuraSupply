const db = require("../../config/utill/connection");
const { logError } = require("../../config/utill/logErr");

// Map internal DB sale_status / status to standard UI status
function normalizeStatus(saleStatus, status) {
  const s = String(saleStatus || '').toLowerCase();
  if (s === 'completed' || s === 'delivered' || s === 'paid') return 'Completed';
  if (s === 'ready') return 'Ready';
  if (s === 'preparing' || s === 'ordered') return 'Preparing';
  if (s === 'confirmed') return 'Confirmed';
  if (s === 'cancelled' || s === 'canceled' || s === 'returned') return 'Cancelled';
  return 'Pending';
}

function formatOrder(sale, items = []) {
  const grandTotal = parseFloat(sale.grand_total || sale.total || 0);
  const paid = parseFloat(sale.paid || 0);
  const status = normalizeStatus(sale.sale_status, sale.status);

  return {
    id: sale.id,
    key: sale.id,
    referenceNo: sale.reference_no || `ORD-${sale.id}`,
    reference_no: sale.reference_no || `ORD-${sale.id}`,
    date: sale.date || new Date().toISOString(),
    created_at: sale.date || new Date().toISOString(),
    customer_id: sale.customer_id,
    customer_name: sale.customer || sale.customer_company_name || 'Walk-in Guest',
    customer_email: sale.customer_email || '',
    customer_phone: sale.customer_phone || '',
    store_id: sale.biller_id,
    store_name: sale.biller || sale.biller_company_name || 'Aura Supply HQ',
    storeName: sale.biller || sale.biller_company_name || 'Aura Supply HQ',
    table_number: sale.table_number || sale.wait_number || null,
    total: grandTotal,
    grandTotal: grandTotal,
    paid: paid,
    balance: grandTotal - paid,
    payment_status: sale.payment_status || (paid >= grandTotal ? 'paid' : 'due'),
    status: status,
    raw_status: sale.sale_status || 'pending',
    note: sale.note || sale.staff_note || '',
    items_count: items.length || sale.total_items || 0,
    items: items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_code: item.product_code || '',
      product_name: item.product_name || 'Item',
      quantity: parseFloat(item.quantity || 1),
      unit_price: parseFloat(item.unit_price || item.net_unit_price || 0),
      subtotal: parseFloat(item.subtotal || (item.quantity * item.unit_price) || 0),
      comment: item.comment || ''
    }))
  };
}

/**
 * GET /api/admin/orders
 * List sales orders with filters and summary stats
 */
exports.getOrders = async (req, res) => {
  try {
    const {
      search,
      status,
      storeSlug,
      biller_id,
      customer_id,
      page = 1,
      limit = 50
    } = req.query;

    let query = `
      SELECT 
        s.*,
        c.name AS customer_company_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        b.name AS biller_company_name
      FROM aura_sales s
      LEFT JOIN aura_companies c ON s.customer_id = c.id
      LEFT JOIN aura_companies b ON s.biller_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (s.reference_no LIKE ? OR s.customer LIKE ? OR s.biller LIKE ? OR c.name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (biller_id && biller_id !== 'all') {
      query += ` AND s.biller_id = ?`;
      params.push(biller_id);
    }

    if (customer_id) {
      query += ` AND s.customer_id = ?`;
      params.push(customer_id);
    }

    if (status && status !== 'all') {
      const lower = status.toLowerCase();
      if (lower === 'completed') {
        query += ` AND s.sale_status IN ('completed', 'delivered', 'paid')`;
      } else if (lower === 'cancelled') {
        query += ` AND s.sale_status IN ('cancelled', 'canceled', 'returned')`;
      } else if (lower === 'preparing') {
        query += ` AND s.sale_status IN ('preparing', 'ordered')`;
      } else if (lower === 'ready') {
        query += ` AND s.sale_status = 'ready'`;
      } else if (lower === 'pending') {
        query += ` AND (s.sale_status = 'pending' OR s.sale_status IS NULL OR s.sale_status = '')`;
      }
    }

    query += ` ORDER BY s.id DESC`;

    const numLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 500);
    const numOffset = (Math.max(parseInt(page) || 1, 1) - 1) * numLimit;
    query += ` LIMIT ${numLimit} OFFSET ${numOffset}`;

    const [sales] = await db.query(query, params);

    // Fetch items for these sales
    let itemsBySaleId = {};
    if (sales.length > 0) {
      const saleIds = sales.map(s => s.id);
      const placeholders = saleIds.map(() => '?').join(',');
      const [items] = await db.query(`
        SELECT * FROM aura_sale_items 
        WHERE sale_id IN (${placeholders})
      `, saleIds);

      items.forEach(item => {
        if (!itemsBySaleId[item.sale_id]) {
          itemsBySaleId[item.sale_id] = [];
        }
        itemsBySaleId[item.sale_id].push(item);
      });
    }

    const formattedOrders = sales.map(s => formatOrder(s, itemsBySaleId[s.id] || []));

    // Calculate aggregated metrics
    const [statsRows] = await db.query(`
      SELECT 
        COUNT(*) AS total_orders,
        SUM(CASE WHEN sale_status IN ('pending', '', NULL) THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN sale_status IN ('preparing', 'ordered') THEN 1 ELSE 0 END) AS preparing_orders,
        SUM(CASE WHEN sale_status = 'ready' THEN 1 ELSE 0 END) AS ready_orders,
        SUM(CASE WHEN sale_status IN ('completed', 'delivered', 'paid') THEN 1 ELSE 0 END) AS completed_orders,
        SUM(CASE WHEN sale_status IN ('cancelled', 'canceled', 'returned') THEN 1 ELSE 0 END) AS cancelled_orders,
        SUM(CASE WHEN sale_status NOT IN ('cancelled', 'canceled', 'returned') THEN grand_total ELSE 0 END) AS total_revenue
      FROM aura_sales
    `);

    const stats = statsRows[0] || {};

    res.json({
      status: true,
      orders: formattedOrders,
      data: formattedOrders,
      total: parseInt(stats.total_orders) || 0,
      page: parseInt(page) || 1,
      limit: numLimit,
      metrics: {
        totalOrders: parseInt(stats.total_orders) || 0,
        pending: parseInt(stats.pending_orders) || 0,
        preparing: parseInt(stats.preparing_orders) || 0,
        ready: parseInt(stats.ready_orders) || 0,
        completed: parseInt(stats.completed_orders) || 0,
        cancelled: parseInt(stats.cancelled_orders) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0
      }
    });
  } catch (err) {
    console.error("Orders get error:", err);
    logError("orders.controller.getOrders", err, res);
  }
};

/**
 * GET /api/admin/orders/:id
 */
exports.getOrderById = async (req, res) => {
  try {
    const id = req.params.id;
    const [sales] = await db.query(`
      SELECT 
        s.*,
        c.name AS customer_company_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        b.name AS biller_company_name
      FROM aura_sales s
      LEFT JOIN aura_companies c ON s.customer_id = c.id
      LEFT JOIN aura_companies b ON s.biller_id = b.id
      WHERE s.id = ? OR s.reference_no = ?
      LIMIT 1
    `, [id, id]);

    if (!sales || sales.length === 0) {
      return res.status(404).json({ status: false, message: 'Order not found' });
    }

    const sale = sales[0];
    const [items] = await db.query(`SELECT * FROM aura_sale_items WHERE sale_id = ?`, [sale.id]);

    res.json({
      status: true,
      data: formatOrder(sale, items),
      order: formatOrder(sale, items)
    });
  } catch (err) {
    logError("orders.controller.getOrderById", err, res);
  }
};

/**
 * PUT /api/admin/orders/:id/status or PUT /api/tma/orders/:id/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ status: false, message: 'Status is required' });
    }

    const lower = status.toLowerCase();
    let dbStatus = 'pending';
    if (lower === 'completed' || lower === 'delivered' || lower === 'paid') dbStatus = 'completed';
    else if (lower === 'preparing') dbStatus = 'preparing';
    else if (lower === 'ready') dbStatus = 'ready';
    else if (lower === 'cancelled') dbStatus = 'cancelled';
    else if (lower === 'confirmed') dbStatus = 'confirmed';

    await db.query(`
      UPDATE aura_sales 
      SET sale_status = ?, updated_at = NOW() 
      WHERE id = ? OR reference_no = ?
    `, [dbStatus, id, id]);

    const [updated] = await db.query(`SELECT * FROM aura_sales WHERE id = ? OR reference_no = ?`, [id, id]);
    const updatedSale = updated[0];
    const [items] = updatedSale ? await db.query(`SELECT * FROM aura_sale_items WHERE sale_id = ?`, [updatedSale.id]) : [[]];

    res.json({
      status: true,
      message: `Order status updated to ${status}`,
      data: updatedSale ? formatOrder(updatedSale, items) : null
    });
  } catch (err) {
    console.error("Order status update error:", err);
    logError("orders.controller.updateOrderStatus", err, res);
  }
};

/**
 * POST /api/admin/orders
 * Create new sales order
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      customer_id = 2,
      customer = 'General Customer',
      biller_id = 1,
      biller = 'Aura Supply HQ',
      warehouse_id = 1,
      total,
      grand_total,
      items = [],
      note = '',
      payment_status = 'due'
    } = req.body;

    const calcTotal = grand_total || total || items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
    const refNo = `SO-${Date.now().toString().slice(-6)}`;

    const [saleRes] = await db.query(`
      INSERT INTO aura_sales 
      (date, reference_no, customer_id, customer, biller_id, biller, warehouse_id, total, grand_total, paid, sale_status, payment_status, note, total_items)
      VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?, ?)
    `, [
      refNo,
      parseInt(customer_id) || 2,
      customer,
      parseInt(biller_id) || 1,
      biller,
      parseInt(warehouse_id) || 1,
      calcTotal,
      calcTotal,
      payment_status,
      note,
      items.length
    ]);

    const newSaleId = saleRes.insertId;

    for (const item of items) {
      await db.query(`
        INSERT INTO aura_sale_items 
        (sale_id, product_id, product_code, product_name, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        newSaleId,
        item.product_id || 0,
        item.product_code || '',
        item.product_name || 'Item',
        parseFloat(item.quantity) || 1,
        parseFloat(item.unit_price) || 0,
        parseFloat(item.subtotal || (item.quantity * item.unit_price)) || 0
      ]);
    }

    res.status(201).json({
      status: true,
      message: 'Order created successfully',
      data: {
        id: newSaleId,
        referenceNo: refNo,
        grandTotal: calcTotal,
        status: 'Pending'
      }
    });
  } catch (err) {
    console.error("Create order error:", err);
    logError("orders.controller.createOrder", err, res);
  }
};
