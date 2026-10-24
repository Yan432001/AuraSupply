const pool = require('../../config/dbPool');

class BarcodePrintLogModel {
  /**
   * Log a single barcode print action
   */
  static async createLog({
    product_id,
    quantity = 1,
    label_size = '50x30',
    barcode_type = 'CODE128',
    template = 'standard',
    printed_by = 1
  }) {
    const [result] = await pool.query(`
      INSERT INTO barcode_print_logs (product_id, quantity, label_size, barcode_type, template, printed_by, printed_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [product_id, quantity, label_size, barcode_type, template, printed_by]);

    return {
      id: result.insertId,
      product_id,
      quantity,
      label_size,
      barcode_type,
      template,
      printed_by
    };
  }

  /**
   * Batch log print actions
   */
  static async batchCreateLogs(items = [], {
    label_size = '50x30',
    barcode_type = 'CODE128',
    template = 'standard',
    printed_by = 1
  } = {}) {
    if (!items || items.length === 0) return [];

    const values = [];
    const placeholders = [];

    for (const item of items) {
      const pid = item.product_id || item.id;
      const qty = parseInt(item.quantity) || 1;
      const bType = item.barcode_type || barcode_type || 'CODE128';
      const size = item.label_size || label_size || '50x30';
      const tpl = item.template || template || 'standard';

      placeholders.push('(?, ?, ?, ?, ?, ?, NOW())');
      values.push(pid, qty, size, bType, tpl, printed_by);
    }

    const sql = `
      INSERT INTO barcode_print_logs (product_id, quantity, label_size, barcode_type, template, printed_by, printed_at)
      VALUES ${placeholders.join(', ')}
    `;

    const [result] = await pool.query(sql, values);
    return {
      inserted: items.length,
      first_id: result.insertId
    };
  }

  /**
   * Get print logs with product and admin user details (joined to avoid N+1)
   */
  static async getLogs({
    page = 1,
    limit = 20,
    search = '',
    date_from = null,
    date_to = null
  } = {}) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['1=1'];
    const params = [];

    if (search && search.trim() !== '') {
      conditions.push('(p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ? OR l.template LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (date_from) {
      conditions.push('l.printed_at >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('l.printed_at <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const [countRows] = await pool.query(`
      SELECT COUNT(l.id) AS total
      FROM barcode_print_logs l
      LEFT JOIN aura_products p ON p.id = l.product_id
      WHERE ${whereClause}
    `, params);
    const total = countRows[0] ? countRows[0].total : 0;

    // Log list
    const [rows] = await pool.query(`
      SELECT 
        l.id, l.product_id, l.quantity, l.label_size, l.barcode_type, 
        l.template, l.printed_by, l.printed_at,
        p.name AS product_name, p.code AS product_code, p.barcode, p.sku, p.price, p.image,
        u.first_name, u.last_name, u.username
      FROM barcode_print_logs l
      LEFT JOIN aura_products p ON p.id = l.product_id
      LEFT JOIN aura_users u ON u.id = l.printed_by
      WHERE ${whereClause}
      ORDER BY l.printed_at DESC, l.id DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    const logs = rows.map(r => ({
      id: r.id,
      product_id: r.product_id,
      quantity: r.quantity,
      label_size: r.label_size,
      barcode_type: r.barcode_type,
      template: r.template,
      printed_at: r.printed_at,
      product: {
        id: r.product_id,
        name: r.product_name,
        code: r.product_code,
        barcode: r.barcode || r.product_code,
        sku: r.sku,
        price: r.price,
        image: r.image
      },
      printed_by_user: {
        id: r.printed_by,
        name: r.first_name ? `${r.first_name} ${r.last_name || ''}`.trim() : (r.username || `Admin #${r.printed_by}`)
      }
    }));

    return {
      logs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    };
  }
}

module.exports = BarcodePrintLogModel;
