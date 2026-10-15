const db = require("../../config/utill/connection");
const { logError } = require("../../config/utill/logErr");

/**
 * GET /api/admin/purchases
 */
exports.getPurchases = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT 
        p.*,
        c.name AS supplier_name,
        c.email AS supplier_email,
        c.phone AS supplier_phone
      FROM aura_purchases p
      LEFT JOIN aura_companies c ON p.supplier_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (p.reference_no LIKE ? OR p.supplier LIKE ? OR c.name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (status && status !== 'all') {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY p.id DESC`;

    const numLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    const numOffset = (Math.max(parseInt(page) || 1, 1) - 1) * numLimit;
    query += ` LIMIT ${numLimit} OFFSET ${numOffset}`;

    const [rows] = await db.query(query, params);

    const [statsRows] = await db.query(`
      SELECT 
        COUNT(*) AS total_purchases,
        COALESCE(SUM(grand_total), 0) AS total_spend,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) AS received_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count
      FROM aura_purchases
    `);

    const stats = statsRows[0] || {};

    res.json({
      status: true,
      data: rows.map(p => ({
        id: p.id,
        key: p.id,
        referenceNo: p.reference_no,
        date: p.date,
        supplier: p.supplier || p.supplier_name || 'General Supplier',
        status: p.status || 'received',
        total: parseFloat(p.grand_total || 0),
        paid: parseFloat(p.paid || 0),
        balance: parseFloat(p.grand_total || 0) - parseFloat(p.paid || 0),
        payment_status: p.payment_status || 'due'
      })),
      metrics: {
        totalPurchases: parseInt(stats.total_purchases) || 0,
        totalSpend: parseFloat(stats.total_spend) || 0,
        received: parseInt(stats.received_count) || 0,
        pending: parseInt(stats.pending_count) || 0
      }
    });
  } catch (err) {
    logError("purchases.controller.getPurchases", err, res);
  }
};
