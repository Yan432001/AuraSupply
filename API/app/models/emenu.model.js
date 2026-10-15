const pool = require('../config/utill/connection');

const EMenuModel = {
  async getStoreBySlug(slug) {
    const sql = `
      SELECT id, name, company, address, phone, email, logo, banner, theme_color, currency_code, currency_symbol, is_active
      FROM aura_companies
      WHERE slug = ? AND (group_name = 'biller' OR group_name IS NULL)
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [slug]);
    return rows[0] || null;
  },

  async getStoreByBillerId(billerId) {
    const sql = `
      SELECT id, name, company, slug, logo, banner, theme_color, currency_code, currency_symbol, is_active
      FROM aura_companies
      WHERE id = ? AND (group_name = 'biller' OR group_name IS NULL)
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [billerId]);
    return rows[0] || null;
  },

  async getStoreByIdentifier(identifier) {
    if (!identifier) return null;
    if (/^\d+$/.test(String(identifier))) {
      const byId = await this.getStoreByBillerId(identifier);
      if (byId) return { ...byId, biller_id: byId.id };
    }
    const bySlug = await this.getStoreBySlug(identifier);
    if (bySlug) return { ...bySlug, biller_id: bySlug.id };
    return null;
  },

  async getStoreMenu(billerId) {
    const categories = await this.getCategoriesByStore(billerId);
    const { rows: products } = await this.getProductsByStore(billerId, { limit: 100, offset: 0 });
    return { categories, products };
  },

  async createOrder(billerId, customerData, items) {
    const store = (await this.getStoreByBillerId(billerId)) || { id: billerId, name: 'Store' };
    return this.createStoreOrder(store, customerData.customerId || 1, items, customerData.note || '');
  },

  async getCategoriesByStore(billerId) {
    const sql = `
      SELECT DISTINCT c.id, c.code, c.name, c.image
      FROM aura_categories c
      INNER JOIN aura_products p ON p.category_id = c.id
      WHERE (p.biller_id = ? OR p.biller_id IS NULL OR ? = 0)
      ORDER BY c.name ASC
    `;
    const [rows] = await pool.query(sql, [billerId, billerId]);
    return rows;
  },

  async getProductsByStore(billerId, { categoryId, query, offset, limit }) {
    let whereConditions = ['(p.biller_id = ? OR p.biller_id IS NULL OR ? = 0)'];
    let params = [billerId, billerId];

    if (categoryId) {
      whereConditions.push('p.category_id = ?');
      params.push(categoryId);
    }

    if (query) {
      whereConditions.push('(p.name LIKE ? OR p.code LIKE ?)');
      params.push(`%${query}%`, `%${query}%`);
    }

    const whereSql = whereConditions.join(' AND ');
    const countSql = `SELECT COUNT(*) AS total FROM aura_products p WHERE ${whereSql}`;
    const [countRes] = await pool.query(countSql, params);
    const total = countRes[0].total;

    const dataSql = `
      SELECT p.id, p.code, p.name, p.price, p.image, p.unit, p.details, p.category_id,
             COALESCE(SUM(wp.quantity), 0) AS in_stock
      FROM aura_products p
      LEFT JOIN aura_warehouses_products wp ON wp.product_id = p.id
      WHERE ${whereSql}
      GROUP BY p.id
      ORDER BY p.name ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataSql, [...params, limit, offset]);

    return { total, rows };
  },

  async getOrCreateCustomer(billerId, tgUser) {
    const [exist] = await pool.query(
      `SELECT customer_id FROM aura_telegram_customers WHERE telegram_id = ? AND biller_id = ? LIMIT 1`,
      [tgUser.id, billerId]
    );

    if (exist.length > 0) {
      return exist[0].customer_id;
    }

    // Insert internal customer profile into aura_companies
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Telegram Guest';
    const [custRes] = await pool.query(
      `INSERT INTO aura_companies (group_name, name, company, phone, email) VALUES ('customer', ?, ?, ?, ?)`,
      [fullName, fullName, '', `tg_${tgUser.id}@telegram.me`]
    );
    const customerId = custRes.insertId;

    await pool.query(
      `INSERT INTO aura_telegram_customers (telegram_id, biller_id, customer_id, first_name, last_name, username)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tgUser.id, billerId, customerId, tgUser.first_name, tgUser.last_name || '', tgUser.username || '']
    );

    return customerId;
  },

  async createStoreOrder(store, customerId, items, note = '') {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let grandTotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        const [pRows] = await connection.query(`SELECT id, code, name, price FROM aura_products WHERE id = ?`, [item.id]);
        if (pRows.length === 0) throw new Error(`Product ${item.id} not found`);
        const product = pRows[0];
        const subtotal = Number(product.price) * Number(item.quantity);
        grandTotal += subtotal;
        verifiedItems.push({ ...product, qty: item.quantity, subtotal });
      }

      const refNo = `TMA-${Date.now()}`;
      const [saleRes] = await connection.query(
        `INSERT INTO aura_sales (date, reference_no, biller_id, biller, customer_id, customer, total, grand_total, sale_status, payment_status, note)
         VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, 'ordered', 'pending', ?)`,
        [refNo, store.id, store.name || store.company, customerId, 'Customer', grandTotal, grandTotal, note]
      );

      const saleId = saleRes.insertId;

      for (const item of verifiedItems) {
        await connection.query(
          `INSERT INTO aura_sale_items (sale_id, product_id, product_code, product_name, net_unit_price, unit_price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [saleId, item.id, item.code, item.name, item.price, item.price, item.qty, item.subtotal]
        );
      }

      await connection.commit();
      return { saleId, referenceNo: refNo, grandTotal };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};

module.exports = EMenuModel;