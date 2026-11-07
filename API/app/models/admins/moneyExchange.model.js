const crypto = require('crypto');
const db = require('../../config/utill/connection');

/**
 * Parse discount string (e.g. "10%" or "15") against a base amount
 * Replicates AURA_v1 Site::calculateDiscount()
 */
function calculateDiscount(discountVal, amount) {
  const base = parseFloat(amount) || 0;
  if (!discountVal || base <= 0) return 0;
  const str = String(discountVal).trim();
  if (!str || str === '0') return 0;
  if (str.endsWith('%')) {
    const pct = parseFloat(str.slice(0, -1)) || 0;
    return Number(((base * pct) / 100).toFixed(4));
  }
  return Number((parseFloat(str) || 0).toFixed(4));
}

/**
 * Format JS/ISO date string to MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
 */
function toMysqlDateTime(input) {
  if (!input) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  const str = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const nowTime = new Date().toTimeString().slice(0, 8);
    return `${str} ${nowTime}`;
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(str)) {
    return str.length === 16 ? `${str}:00` : str;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
  }
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

const MoneyExchangeModel = {
  /**
   * Ensure default service products exist for Money Exchange & Money Transfer
   * so ExchangeSuggestions (type='service') always has standard service items like AURA_v1 ("Exc" - "Exchange Money")
   */
  async ensureDefaultServiceProducts() {
    try {
      const [existing] = await db.query(
        `SELECT id, code, name FROM aura_products WHERE type = 'service' AND (UPPER(code) IN ('EXC', 'EXC-001', 'TRF-SVC') OR name LIKE '%Exchange Money%' OR name LIKE '%Money Transfer%') LIMIT 5`
      );
      if (existing && existing.length > 0) {
        return existing;
      }

      const [cats] = await db.query(`SELECT id FROM aura_categories ORDER BY id ASC LIMIT 1`);
      const categoryId = cats?.[0]?.id || 1;

      const defaults = [
        { code: 'EXC', name: 'Exchange Money' },
        { code: 'TRF-SVC', name: 'Money Transfer Service' }
      ];

      for (const item of defaults) {
        const [dup] = await db.query(`SELECT id FROM aura_products WHERE code = ? LIMIT 1`, [item.code]);
        if (!dup || dup.length === 0) {
          await db.query(
            `INSERT INTO aura_products (
              code, barcode, name, unit, purchase_unit, sale_unit,
              cost, price, currency, category_id, quantity, tax_rate,
              track_quantity, barcode_symbology, tax_method, type, module_type, status
            ) VALUES (?, ?, ?, 1, 1, 1, 0, 1, 'USD', ?, 0, 1, 0, 'code128', 1, 'service', 'inventory', 1)`,
            [item.code, item.code, item.name, categoryId]
          );
        }
      }
    } catch (err) {
      // Non-fatal if products table is locked or mocked
      console.warn('[MoneyExchangeModel] ensureDefaultServiceProducts notice:', err.message);
    }
  },

  /**
   * Generate next Money Exchange reference number (e.g. ME-202611-0001)
   */
  async generateNextReference(prefix = 'ME') {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const pattern = `${prefix}-${ym}-%`;

    const [rows] = await db.query(
      `SELECT reference_no FROM aura_money_exchange WHERE reference_no LIKE ? ORDER BY id DESC LIMIT 1`,
      [pattern]
    );

    if (rows && rows.length > 0 && rows[0].reference_no) {
      const parts = String(rows[0].reference_no).split('-');
      const seq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(seq)) {
        return `${prefix}-${ym}-${String(seq + 1).padStart(4, '0')}`;
      }
    }

    const [cnt] = await db.query(`SELECT COUNT(*) AS total FROM aura_money_exchange`);
    const nextSeq = (cnt?.[0]?.total || 0) + 1;
    return `${prefix}-${ym}-${String(nextSeq).padStart(4, '0')}`;
  },

  /**
   * Generate next Payment reference number (e.g. PAY-ME-202611-0001)
   */
  async generateNextPaymentReference() {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const pattern = `PAY-ME-${ym}-%`;

    const [rows] = await db.query(
      `SELECT reference_no FROM aura_payments WHERE reference_no LIKE ? ORDER BY id DESC LIMIT 1`,
      [pattern]
    );
    if (rows && rows.length > 0 && rows[0].reference_no) {
      const parts = String(rows[0].reference_no).split('-');
      const seq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(seq)) {
        return `PAY-ME-${ym}-${String(seq + 1).padStart(4, '0')}`;
      }
    }
    return `PAY-ME-${ym}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  },

  /**
   * Get form metadata & reference tables (billers, warehouses, customers, currencies, rates, transfer companies, etc.)
   */
  async getMetadata() {
    await this.ensureDefaultServiceProducts();

    const [
      [customers],
      [billers],
      [warehouses],
      [currencies],
      [exchangeRates],
      [taxRates],
      [units],
      [transferCompanies],
      [serviceProducts],
      [salemans],
      nextReference,
      nextPaymentReference
    ] = await Promise.all([
      db.query(
        `SELECT id, name, company, phone, email, address, city
         FROM aura_companies
         WHERE group_name = 'customer'
         ORDER BY CASE WHEN name LIKE '%General%' OR name LIKE '%Walk%' THEN 0 ELSE 1 END, name ASC
         LIMIT 500`
      ),
      db.query(
        `SELECT id, name, company, phone, email, address, city
         FROM aura_companies
         WHERE group_name = 'biller'
         ORDER BY id ASC`
      ),
      db.query(`SELECT id, code, name, address, phone FROM aura_warehouses ORDER BY id ASC`),
      db.query(`SELECT id, code, name, rate, auto_update, symbol, day FROM aura_currencies ORDER BY id ASC`),
      db.query(`SELECT id, currency_id, from_currency, to_currency, exchange_rate, created_by, updated_by FROM aura_money_exchange_rate ORDER BY id ASC`),
      db.query(`SELECT id, name, code, rate, type FROM aura_tax_rates ORDER BY id ASC`),
      db.query(`SELECT id, code, name, base_unit, operator, operation_value FROM aura_units ORDER BY id ASC`),
      db.query(
        `SELECT pg.id, pg.name, pg.type,
                (SELECT COUNT(*) FROM aura_money_transfer_range tr WHERE tr.company_id = pg.id) AS ranges_count
         FROM aura_price_groups pg
         WHERE pg.type = 'transfer_money'
         ORDER BY pg.name ASC`
      ),
      db.query(
        `SELECT id, code, name, type, price, cost, unit, sale_unit, tax_rate, tax_method
         FROM aura_products
         WHERE type = 'service'
         ORDER BY CASE WHEN UPPER(code) IN ('EXC', 'TRF-SVC') THEN 0 ELSE 1 END, name ASC
         LIMIT 100`
      ),
      db.query(
        `SELECT id, username, first_name, last_name, email
         FROM aura_users
         WHERE active = 1
         ORDER BY first_name ASC, username ASC
         LIMIT 200`
      ),
      this.generateNextReference('ME'),
      this.generateNextPaymentReference()
    ]);

    return {
      customers: customers || [],
      billers: billers || [],
      warehouses: warehouses || [],
      currencies: (currencies || []).map((c) => ({
        ...c,
        rate: parseFloat(c.rate || 1)
      })),
      exchangeRates: (exchangeRates || []).map((r) => ({
        ...r,
        from_currency: String(r.from_currency || '').trim(),
        to_currency: String(r.to_currency || '').trim(),
        exchange_rate: parseFloat(r.exchange_rate || 0)
      })),
      taxRates: (taxRates || []).map((t) => ({
        ...t,
        rate: parseFloat(t.rate || 0)
      })),
      units: units || [],
      transferCompanies: transferCompanies || [],
      serviceProducts: (serviceProducts || []).map((p) => ({
        ...p,
        price: parseFloat(p.price || 0),
        cost: parseFloat(p.cost || 0)
      })),
      salemans: (salemans || []).map((u) => ({
        id: u.id,
        username: u.username,
        name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username
      })),
      nextReference,
      nextPaymentReference
    };
  },

  /**
   * Replicates AURA_v1 Money::ExchangeSuggestions & Money_model::getProductNames
   * Searches service products (with fallback to matching products) and enriches with currencies & pair rates
   */
  async getSuggestions({ term = '', warehouseId = 1, serviceOnly = true, limit = 20 } = {}) {
    await this.ensureDefaultServiceProducts();

    const cleanTerm = String(term || '').trim();
    const numLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const params = [];
    const where = ['1=1'];

    if (serviceOnly) {
      where.push(`p.type = 'service'`);
    }

    if (cleanTerm) {
      const like = `%${cleanTerm}%`;
      where.push(`(p.name LIKE ? OR p.code LIKE ? OR CONCAT(p.name, ' (', p.code, ')') LIKE ?)`);
      params.push(like, like, like);
    }

    let [rows] = await db.query(
      `SELECT p.id, p.code, p.name, p.type, p.price, p.cost, p.unit, p.sale_unit,
              p.tax_rate, p.tax_method, p.category_id, c.name AS category_name,
              u.code AS unit_code, u.name AS unit_name
       FROM aura_products p
       LEFT JOIN aura_categories c ON c.id = p.category_id
       LEFT JOIN aura_units u ON u.id = COALESCE(p.sale_unit, p.unit)
       WHERE ${where.join(' AND ')}
       ORDER BY CASE WHEN UPPER(p.code) IN ('EXC', 'TRF-SVC') THEN 0 ELSE 1 END, p.name ASC
       LIMIT ${numLimit}`,
      params
    );

    // Fallback: if user typed a specific product code/name that isn't service, still allow finding it
    if ((!rows || rows.length === 0) && cleanTerm && serviceOnly) {
      const like = `%${cleanTerm}%`;
      const [fallbackRows] = await db.query(
        `SELECT p.id, p.code, p.name, p.type, p.price, p.cost, p.unit, p.sale_unit,
                p.tax_rate, p.tax_method, p.category_id, c.name AS category_name,
                u.code AS unit_code, u.name AS unit_name
         FROM aura_products p
         LEFT JOIN aura_categories c ON c.id = p.category_id
         LEFT JOIN aura_units u ON u.id = COALESCE(p.sale_unit, p.unit)
         WHERE (p.name LIKE ? OR p.code LIKE ? OR CONCAT(p.name, ' (', p.code, ')') LIKE ?)
         ORDER BY CASE WHEN p.type = 'service' THEN 0 ELSE 1 END, p.name ASC
         LIMIT ${numLimit}`,
        [like, like, like]
      );
      rows = fallbackRows || [];
    }

    const [currencies] = await db.query(`SELECT id, code, name, rate, symbol FROM aura_currencies ORDER BY id ASC`);
    const [rates] = await db.query(`SELECT from_currency, to_currency, exchange_rate FROM aura_money_exchange_rate`);

    const defaultFrom = currencies?.[0]?.code || 'USD';
    const defaultTo = currencies?.find((c) => c.code !== defaultFrom)?.code || 'KHR';
    const defaultPair = (rates || []).find(
      (r) =>
        String(r.from_currency || '').trim().toUpperCase() === String(defaultFrom).toUpperCase() &&
        String(r.to_currency || '').trim().toUpperCase() === String(defaultTo).toUpperCase()
    );
    const initialRate = defaultPair ? parseFloat(defaultPair.exchange_rate || 0) : 0;

    return (rows || []).map((row) => ({
      id: row.id,
      item_id: row.id,
      code: row.code,
      name: row.name,
      label: `${row.name} (${row.code})`,
      type: row.type || 'service',
      price: parseFloat(row.price || 0),
      cost: parseFloat(row.cost || 0),
      unit_id: row.sale_unit || row.unit || 1,
      unit_code: row.unit_code || 'Unit',
      unit_name: row.unit_name || 'Unit',
      category_id: row.category_id,
      category_name: row.category_name || '',
      from_currency: defaultFrom,
      to_currency: defaultTo,
      exchange_rate: initialRate,
      currencies: currencies || [],
      warehouse_id: parseInt(warehouseId, 10) || 1
    }));
  },

  /**
   * Paginated list of Money Exchanges with filters, pair summaries, page footer totals, and global KPI metrics
   * Replicates AURA_v1 Money::getChange() & Money::getChange_()
   */
  async listExchanges({
    search = '',
    reference_no = '',
    sale_status = 'all',
    payment_status = 'all',
    customer_id = null,
    biller_id = null,
    warehouse_id = null,
    saleman_by = null,
    start_date = null,
    end_date = null,
    sortBy = 'id',
    sortOrder = 'DESC',
    page = 1,
    limit = 20
  } = {}) {
    const where = ['1=1'];
    const params = [];

    if (search && String(search).trim() !== '') {
      const term = `%${String(search).trim()}%`;
      where.push(
        `(me.reference_no LIKE ? OR me.customer LIKE ? OR me.biller LIKE ? OR me.note LIKE ? OR c.phone LIKE ?
          OR EXISTS (
            SELECT 1 FROM aura_money_exchange_items mei
            WHERE mei.sale_id = me.id
              AND (mei.product_name LIKE ? OR mei.from_currency LIKE ? OR mei.to_currency LIKE ?)
          ))`
      );
      params.push(term, term, term, term, term, term, term, term);
    }

    if (reference_no && String(reference_no).trim() !== '') {
      where.push(`me.reference_no LIKE ?`);
      params.push(`%${String(reference_no).trim()}%`);
    }

    if (sale_status && sale_status !== 'all') {
      where.push(`me.sale_status = ?`);
      params.push(sale_status);
    }

    if (payment_status && payment_status !== 'all') {
      if (payment_status === 'due' || payment_status === 'pending') {
        where.push(`(me.payment_status IN ('pending', 'due') OR me.payment_status IS NULL OR me.paid = 0)`);
      } else {
        where.push(`me.payment_status = ?`);
        params.push(payment_status);
      }
    }

    if (customer_id && customer_id !== 'all') {
      where.push(`me.customer_id = ?`);
      params.push(parseInt(customer_id, 10));
    }

    if (biller_id && biller_id !== 'all') {
      where.push(`me.biller_id = ?`);
      params.push(parseInt(biller_id, 10));
    }

    if (warehouse_id && warehouse_id !== 'all') {
      where.push(`me.warehouse_id = ?`);
      params.push(parseInt(warehouse_id, 10));
    }

    if (saleman_by && saleman_by !== 'all') {
      where.push(`me.saleman_by = ?`);
      params.push(parseInt(saleman_by, 10));
    }

    if (start_date) {
      where.push(`DATE(me.date) >= ?`);
      params.push(start_date);
    }

    if (end_date) {
      where.push(`DATE(me.date) <= ?`);
      params.push(end_date);
    }

    const whereClause = where.join(' AND ');
    const allowedSort = ['id', 'date', 'reference_no', 'biller', 'customer', 'grand_total', 'paid', 'sale_status', 'payment_status'];
    const orderCol = allowedSort.includes(sortBy) ? `me.${sortBy}` : 'me.id';
    const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const numLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const numPage = Math.max(parseInt(page, 10) || 1, 1);
    const numOffset = (numPage - 1) * numLimit;

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(me.grand_total), 0) AS filtered_grand_total,
              COALESCE(SUM(me.paid), 0) AS filtered_paid,
              COALESCE(SUM(me.grand_total - me.paid), 0) AS filtered_balance
       FROM aura_money_exchange me
       LEFT JOIN aura_companies c ON c.id = me.customer_id
       WHERE ${whereClause}`,
      params
    );

    const totalRecords = parseInt(countRows?.[0]?.total, 10) || 0;

    const [rows] = await db.query(
      `SELECT
          me.*,
          c.phone AS customer_phone,
          c.email AS customer_email,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          u.username AS creator_username,
          u.first_name AS creator_first_name,
          u.last_name AS creator_last_name,
          sm.username AS saleman_username,
          sm.first_name AS saleman_first_name,
          sm.last_name AS saleman_last_name
       FROM aura_money_exchange me
       LEFT JOIN aura_companies c ON c.id = me.customer_id
       LEFT JOIN aura_warehouses w ON w.id = me.warehouse_id
       LEFT JOIN aura_users u ON u.id = me.created_by
       LEFT JOIN aura_users sm ON sm.id = me.saleman_by
       WHERE ${whereClause}
       ORDER BY ${orderCol} ${orderDir}
       LIMIT ${numLimit} OFFSET ${numOffset}`,
      params
    );

    // Fetch line items for displayed rows so currency pairs, amounts, and exchange rates display cleanly
    const ids = (rows || []).map((r) => r.id);
    let itemsBySaleId = {};
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      const [itemRows] = await db.query(
        `SELECT id, sale_id, product_id, product_code, product_name, product_type,
                from_currency, to_currency, exchange_rate, unit_quantity, quantity, subtotal, comment, commission
         FROM aura_money_exchange_items
         WHERE sale_id IN (${placeholders})
         ORDER BY id ASC`,
        ids
      );
      for (const it of itemRows || []) {
        if (!itemsBySaleId[it.sale_id]) itemsBySaleId[it.sale_id] = [];
        itemsBySaleId[it.sale_id].push({
          id: it.id,
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_type: it.product_type,
          from_currency: it.from_currency ? String(it.from_currency).trim() : '',
          to_currency: it.to_currency ? String(it.to_currency).trim() : '',
          exchange_rate: parseFloat(it.exchange_rate || 0),
          amount: parseFloat(it.unit_quantity || it.quantity || 0),
          subtotal: parseFloat(it.subtotal || 0),
          commission: parseFloat(it.commission || 0),
          comment: it.comment || ''
        });
      }
    }

    const [statsRows] = await db.query(`
      SELECT
        COUNT(*) AS total_exchanges,
        COALESCE(SUM(grand_total), 0) AS total_volume,
        COALESCE(SUM(paid), 0) AS total_paid,
        COALESCE(SUM(grand_total - paid), 0) AS total_balance,
        SUM(CASE WHEN sale_status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN sale_status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
        SUM(CASE WHEN payment_status = 'partial' THEN 1 ELSE 0 END) AS partial_count,
        SUM(CASE WHEN payment_status IN ('pending', 'due') OR payment_status IS NULL OR paid = 0 THEN 1 ELSE 0 END) AS unpaid_count
      FROM aura_money_exchange
    `);
    const stats = statsRows?.[0] || {};

    const records = (rows || []).map((r) => {
      const grandTotal = parseFloat(r.grand_total || 0);
      const paid = parseFloat(r.paid || 0);
      const balance = Number((grandTotal - paid).toFixed(4));

      let payStatus = r.payment_status || 'pending';
      if (grandTotal > 0 && paid >= grandTotal) {
        payStatus = 'paid';
      } else if (paid > 0 && paid < grandTotal) {
        payStatus = 'partial';
      }

      const lineItems = itemsBySaleId[r.id] || [];
      const pairs = lineItems
        .filter((li) => li.from_currency || li.to_currency)
        .map((li) => `${li.from_currency || '?'} → ${li.to_currency || '?'}`);

      const creatorName =
        [r.creator_first_name, r.creator_last_name].filter(Boolean).join(' ') ||
        r.creator_username ||
        'Admin';
      const salemanName =
        [r.saleman_first_name, r.saleman_last_name].filter(Boolean).join(' ') ||
        r.saleman_username ||
        '';

      return {
        id: r.id,
        key: r.id,
        date: r.date,
        reference_no: r.reference_no,
        referenceNo: r.reference_no,
        biller_id: r.biller_id,
        biller: r.biller || '',
        customer_id: r.customer_id,
        customer: r.customer || 'General Customer',
        customer_phone: r.customer_phone || '',
        warehouse_id: r.warehouse_id,
        warehouse_name: r.warehouse_name || '',
        sale_status: r.sale_status || 'completed',
        payment_status: payStatus,
        total: parseFloat(r.total || 0),
        order_discount_id: r.order_discount_id || '',
        order_discount: parseFloat(r.order_discount || 0),
        product_discount: parseFloat(r.product_discount || 0),
        total_discount: parseFloat(r.total_discount || 0),
        order_tax_id: r.order_tax_id || 1,
        order_tax: parseFloat(r.order_tax || 0),
        total_tax: parseFloat(r.total_tax || 0),
        shipping: parseFloat(r.shipping || 0),
        surcharge: parseFloat(r.surcharge || 0),
        grand_total: grandTotal,
        paid,
        balance,
        total_items: lineItems.length || parseInt(r.total_items || 0, 10),
        currency: r.currency || 'USD',
        currencies: r.currencies || null,
        payment_method: r.payment_method || null,
        module_type: r.module_type || 'exchange',
        note: r.note || '',
        staff_note: r.staff_note || '',
        created_by: r.created_by,
        creator_name: creatorName,
        saleman_by: r.saleman_by,
        saleman_name: salemanName,
        pairs_summary: [...new Set(pairs)].join(', '),
        items: lineItems
      };
    });

    return {
      records,
      pagination: {
        page: numPage,
        limit: numLimit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / numLimit) || 1
      },
      filteredTotals: {
        grand_total: parseFloat(countRows?.[0]?.filtered_grand_total || 0),
        paid: parseFloat(countRows?.[0]?.filtered_paid || 0),
        balance: parseFloat(countRows?.[0]?.filtered_balance || 0)
      },
      metrics: {
        totalExchanges: parseInt(stats.total_exchanges, 10) || 0,
        totalVolume: parseFloat(stats.total_volume || 0),
        totalPaid: parseFloat(stats.total_paid || 0),
        totalBalance: parseFloat(stats.total_balance || 0),
        completedCount: parseInt(stats.completed_count, 10) || 0,
        pendingCount: parseInt(stats.pending_count, 10) || 0,
        paidCount: parseInt(stats.paid_count, 10) || 0,
        partialCount: parseInt(stats.partial_count, 10) || 0,
        unpaidCount: parseInt(stats.unpaid_count, 10) || 0
      }
    };
  },

  /**
   * Fetch single Money Exchange record with all line items and payment records
   */
  async getExchangeById(id) {
    const exchangeId = parseInt(id, 10);
    if (!exchangeId) return null;

    const [rows] = await db.query(
      `SELECT
          me.*,
          c.phone AS customer_phone,
          c.email AS customer_email,
          c.address AS customer_address,
          b.phone AS biller_phone,
          b.email AS biller_email,
          b.address AS biller_address,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          u.username AS creator_username,
          u.first_name AS creator_first_name,
          u.last_name AS creator_last_name
       FROM aura_money_exchange me
       LEFT JOIN aura_companies c ON c.id = me.customer_id
       LEFT JOIN aura_companies b ON b.id = me.biller_id
       LEFT JOIN aura_warehouses w ON w.id = me.warehouse_id
       LEFT JOIN aura_users u ON u.id = me.created_by
       WHERE me.id = ?
       LIMIT 1`,
      [exchangeId]
    );

    if (!rows || rows.length === 0) return null;
    const header = rows[0];

    const [items] = await db.query(
      `SELECT * FROM aura_money_exchange_items WHERE sale_id = ? ORDER BY id ASC`,
      [exchangeId]
    );

    const payments = await this.getPayments(exchangeId);

    const grandTotal = parseFloat(header.grand_total || 0);
    const paid = parseFloat(header.paid || 0);
    const balance = Number((grandTotal - paid).toFixed(4));

    return {
      ...header,
      total: parseFloat(header.total || 0),
      product_discount: parseFloat(header.product_discount || 0),
      order_discount: parseFloat(header.order_discount || 0),
      total_discount: parseFloat(header.total_discount || 0),
      product_tax: parseFloat(header.product_tax || 0),
      order_tax: parseFloat(header.order_tax || 0),
      total_tax: parseFloat(header.total_tax || 0),
      shipping: parseFloat(header.shipping || 0),
      surcharge: parseFloat(header.surcharge || 0),
      grand_total: grandTotal,
      paid,
      balance,
      creator_name:
        [header.creator_first_name, header.creator_last_name].filter(Boolean).join(' ') ||
        header.creator_username ||
        'Admin',
      items: (items || []).map((it) => ({
        ...it,
        from_currency: it.from_currency ? String(it.from_currency).trim() : '',
        to_currency: it.to_currency ? String(it.to_currency).trim() : '',
        exchange_rate: parseFloat(it.exchange_rate || 0),
        quantity: parseFloat(it.quantity || 1),
        unit_quantity: parseFloat(it.unit_quantity || it.quantity || 1),
        amount: parseFloat(it.unit_quantity || it.quantity || 1),
        unit_price: parseFloat(it.unit_price || 0),
        net_unit_price: parseFloat(it.net_unit_price || 0),
        real_unit_price: parseFloat(it.real_unit_price || 0),
        item_discount: parseFloat(it.item_discount || 0),
        item_tax: parseFloat(it.item_tax || 0),
        commission: parseFloat(it.commission || 0),
        subtotal: parseFloat(it.subtotal || 0)
      })),
      payments
    };
  },

  /**
   * Fetch payment records linked to a Money Exchange transaction
   */
  async getPayments(exchangeId) {
    const idNum = parseInt(exchangeId, 10);
    if (!idNum) return [];

    const [payments] = await db.query(
      `SELECT p.*, u.username AS creator_username, u.first_name, u.last_name
       FROM aura_payments p
       LEFT JOIN aura_users u ON u.id = p.created_by
       WHERE (p.transaction_type = 'money_exchange' AND p.transaction = ?)
          OR (p.sale_id = ? AND p.reference_no LIKE 'PAY-ME-%')
       ORDER BY p.id DESC`,
      [String(idNum), idNum]
    );

    return (payments || []).map((p) => {
      let parsedCurrencies = null;
      if (p.currencies) {
        try {
          parsedCurrencies = JSON.parse(p.currencies);
        } catch (_) {
          parsedCurrencies = p.currencies;
        }
      }
      return {
        id: p.id,
        date: p.date,
        reference_no: p.reference_no,
        paid_by: p.paid_by,
        amount: parseFloat(p.amount || 0),
        amount_usd: parseFloat(p.amount_usd || 0),
        amount_khr: parseFloat(p.amount_khr || 0),
        amount_thb: parseFloat(p.amount_thb || 0),
        currency: p.currency || 'USD',
        currencies: parsedCurrencies,
        cheque_no: p.cheque_no || '',
        cc_no: p.cc_no || '',
        cc_holder: p.cc_holder || '',
        bank_name: p.bank_name || '',
        account_number: p.account_number || '',
        type: p.type || 'received',
        note: p.note || '',
        created_by: p.created_by,
        created_by_name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.creator_username || 'Admin'
      };
    });
  },

  /**
   * Helper to resolve Biller & Customer display names just like AURA_v1 Money::add_exchange
   */
  async resolvePartyNames(conn, billerId, customerId, fallbackBiller, fallbackCustomer) {
    let billerName = fallbackBiller || 'Main Branch';
    let resolvedBillerId = parseInt(billerId, 10) || 0;
    if (resolvedBillerId) {
      const [bRows] = await conn.query(`SELECT id, name, company FROM aura_companies WHERE id = ? LIMIT 1`, [resolvedBillerId]);
      if (bRows?.[0]) {
        const b = bRows[0];
        billerName = b.company && b.company !== '-' && b.company !== b.name ? `${b.company}/${b.name}` : b.name;
      }
    } else {
      const [bRows] = await conn.query(`SELECT id, name, company FROM aura_companies WHERE group_name = 'biller' ORDER BY id ASC LIMIT 1`);
      if (bRows?.[0]) {
        resolvedBillerId = bRows[0].id;
        billerName = bRows[0].company && bRows[0].company !== '-' ? `${bRows[0].company}/${bRows[0].name}` : bRows[0].name;
      } else {
        resolvedBillerId = 1;
      }
    }

    let customerName = fallbackCustomer || 'General Customer';
    let resolvedCustomerId = parseInt(customerId, 10) || 0;
    if (resolvedCustomerId) {
      const [cRows] = await conn.query(`SELECT id, name, company FROM aura_companies WHERE id = ? LIMIT 1`, [resolvedCustomerId]);
      if (cRows?.[0]) {
        const c = cRows[0];
        customerName = c.company && c.company !== '-' && c.company !== c.name ? `${c.company}/${c.name}` : c.name;
      }
    } else {
      const [cRows] = await conn.query(`SELECT id, name, company FROM aura_companies WHERE group_name = 'customer' ORDER BY id ASC LIMIT 1`);
      if (cRows?.[0]) {
        resolvedCustomerId = cRows[0].id;
        customerName = cRows[0].name || 'General Customer';
      } else {
        resolvedCustomerId = 1;
      }
    }

    return { resolvedBillerId, billerName, resolvedCustomerId, customerName };
  },

  /**
   * Normalize line items & calculate totals (replicates Money.php lines 452-694)
   * Formula: subtotal = exchange_rate > 0 ? (exchange_rate * unit_quantity) : (net_unit_price * unit_quantity)
   */
  async prepareLineItems(conn, rawItems, defaultWarehouseId, exchangeHeader = {}) {
    let itemsInput = Array.isArray(rawItems) ? [...rawItems] : [];

    // Support Quick Counter Exchange mode (Money::add_exchange_ / edit_exchange)
    if (itemsInput.length === 0 && (exchangeHeader.from_currency || exchangeHeader.amount)) {
      await this.ensureDefaultServiceProducts();
      const [svcRows] = await conn.query(
        `SELECT id, code, name, type FROM aura_products WHERE type = 'service' ORDER BY CASE WHEN UPPER(code) = 'EXC' THEN 0 ELSE 1 END, id ASC LIMIT 1`
      );
      const svc = svcRows?.[0] || { id: 1, code: 'EXC', name: 'Exchange Money', type: 'service' };
      const txType = exchangeHeader.type === 'sell' ? 'Sell Currency' : exchangeHeader.type === 'transfer' ? 'Money Transfer' : 'Buy / Exchange Currency';
      itemsInput = [
        {
          product_id: svc.id,
          product_code: svc.code,
          product_name: svc.name,
          product_type: svc.type || 'service',
          from_currency: exchangeHeader.from_currency || 'USD',
          to_currency: exchangeHeader.to_currency || 'KHR',
          exchange_rate: parseFloat(exchangeHeader.exchange_rate ?? exchangeHeader.kh_rate ?? 0),
          unit_quantity: parseFloat(exchangeHeader.amount || 1),
          quantity: 1,
          comment: txType
        }
      ];
    }

    if (!itemsInput.length) {
      throw new Error('At least one exchange item is required.');
    }

    let total = 0;
    let productDiscount = 0;
    let productTax = 0;
    let totalCommission = 0;
    const preparedItems = [];

    for (const raw of itemsInput) {
      const productId = parseInt(raw.product_id || raw.item_id, 10) || 1;
      const productCode = String(raw.product_code || raw.code || 'EXC').slice(0, 55);
      const productName = String(raw.product_name || raw.name || 'Exchange Money').slice(0, 255);
      const productType = String(raw.product_type || raw.type || 'service').slice(0, 20);
      const fromCurrency = raw.from_currency ? String(raw.from_currency).trim().slice(0, 20) : null;
      const toCurrency = raw.to_currency ? String(raw.to_currency).trim().slice(0, 20) : null;
      const exchangeRate = parseFloat(raw.exchange_rate || 0);
      const unitQty = parseFloat(raw.unit_quantity ?? raw.amount ?? raw.quantity ?? 1) || 0;
      const baseQty = parseFloat(raw.quantity ?? unitQty) || 1;
      const rawPrice = parseFloat(raw.unit_price ?? raw.net_unit_price ?? raw.price ?? 0) || 0;
      const discountStr = raw.discount ? String(raw.discount) : '0';
      const perUnitDisc = calculateDiscount(discountStr, rawPrice);
      const netUnitPrice = Math.max(0, rawPrice - perUnitDisc);
      const itemDiscTotal = Number((perUnitDisc * unitQty).toFixed(4));
      const itemTax = parseFloat(raw.item_tax || 0) || 0;
      const commission = parseFloat(raw.commission || 0) || 0;
      const transferFee = parseFloat(raw.transfer_fee || 0) || 0;

      // Core AURA_v1 Money Exchange formula: subtotal = exchange_rate * unit_quantity (+ optional transfer_fee)
      let subtotal = 0;
      if (raw.subtotal !== undefined && raw.subtotal !== null && raw.subtotal !== '' && exchangeRate === 0 && netUnitPrice === 0) {
        subtotal = parseFloat(raw.subtotal) || 0;
      } else if (exchangeRate > 0) {
        subtotal = Number((exchangeRate * unitQty + transferFee - itemDiscTotal + itemTax).toFixed(4));
      } else {
        subtotal = Number((netUnitPrice * unitQty + transferFee + itemTax).toFixed(4));
      }

      productDiscount += itemDiscTotal;
      productTax += itemTax;
      totalCommission += commission;
      total += subtotal;

      preparedItems.push({
        product_id: productId,
        product_code: productCode,
        product_name: productName,
        product_type: productType,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        exchange_rate: exchangeRate,
        cost: parseFloat(raw.cost || 0) || 0,
        purchase_unit_cost: parseFloat(raw.purchase_unit_cost || raw.cost || 0) || 0,
        real_unit_price: rawPrice,
        original_price: rawPrice,
        net_unit_price: netUnitPrice,
        unit_price: Number((netUnitPrice + itemTax).toFixed(4)),
        quantity: baseQty,
        unit_quantity: unitQty,
        product_unit_id: parseInt(raw.product_unit_id || raw.unit_id, 10) || 1,
        product_unit_code: raw.product_unit_code || raw.unit_code || 'Unit',
        item_tax: itemTax,
        tax_rate_id: raw.tax_rate_id ? parseInt(raw.tax_rate_id, 10) : null,
        tax: raw.tax ? String(raw.tax).slice(0, 55) : '',
        discount: discountStr.slice(0, 55),
        item_discount: itemDiscTotal,
        subtotal,
        comment: raw.comment ? String(raw.comment).slice(0, 255) : null,
        warehouse_id: parseInt(raw.warehouse_id || defaultWarehouseId, 10) || 1,
        commission
      });
    }

    return {
      preparedItems,
      total: Number(total.toFixed(4)),
      productDiscount: Number(productDiscount.toFixed(4)),
      productTax: Number(productTax.toFixed(4)),
      totalCommission: Number(totalCommission.toFixed(4))
    };
  },

  /**
   * Compute order-level tax from aura_tax_rates (replicates Site::calculateOrderTax)
   */
  async computeOrderTax(conn, orderTaxId, taxableBase) {
    const taxId = parseInt(orderTaxId, 10);
    if (!taxId || taxableBase <= 0) return 0;
    const [taxRows] = await conn.query(`SELECT id, rate, type FROM aura_tax_rates WHERE id = ? LIMIT 1`, [taxId]);
    if (!taxRows || taxRows.length === 0) return 0;
    const tr = taxRows[0];
    const rate = parseFloat(tr.rate || 0);
    if (rate <= 0) return 0;
    // In BPAS/AURA_v1: type 1 = percentage, type 2 = fixed
    if (String(tr.type) === '1') {
      return Number(((taxableBase * rate) / 100).toFixed(4));
    }
    return Number(rate.toFixed(4));
  },

  /**
   * Insert a payment row for a Money Exchange record
   */
  async insertExchangePayment(conn, exchangeId, billerId, paymentObj, dateStr, userId) {
    const amount = parseFloat(paymentObj.amount || 0);
    if (amount <= 0) return null;

    const payRef =
      paymentObj.reference_no && String(paymentObj.reference_no).trim()
        ? String(paymentObj.reference_no).trim().slice(0, 50)
        : await this.generateNextPaymentReference();

    const paidBy = String(paymentObj.paid_by || 'cash').slice(0, 20);
    const amountUsd = parseFloat(paymentObj.amount_usd || 0);
    const amountKhr = parseFloat(paymentObj.amount_khr || 0);
    const amountThb = parseFloat(paymentObj.amount_thb || 0);
    const currenciesJson = paymentObj.currencies
      ? typeof paymentObj.currencies === 'string'
        ? paymentObj.currencies
        : JSON.stringify(paymentObj.currencies)
      : null;

    const [res] = await conn.query(
      `INSERT INTO aura_payments (
        date, biller_id, sale_id, transaction_type, transaction,
        reference_no, paid_by, cheque_no, cc_no, cc_holder, cc_month, cc_year, cc_type,
        bank_name, account_number,
        amount, amount_usd, amount_khr, amount_thb,
        currency, currencies, created_by, type, note,
        commission_product, commission_amount
      ) VALUES (?, ?, NULL, 'money_exchange', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        toMysqlDateTime(paymentObj.date || dateStr),
        parseInt(billerId, 10) || 0,
        String(exchangeId),
        payRef,
        paidBy,
        paymentObj.cheque_no || null,
        paymentObj.cc_no || null,
        paymentObj.cc_holder || null,
        paymentObj.cc_month || null,
        paymentObj.cc_year || null,
        paymentObj.cc_type || null,
        paymentObj.bank_name || null,
        paymentObj.account_number || null,
        amount,
        amountUsd,
        amountKhr,
        amountThb,
        paymentObj.currency ? String(paymentObj.currency).slice(0, 5) : 'USD',
        currenciesJson ? String(currenciesJson).slice(0, 250) : null,
        parseInt(userId, 10) || 1,
        paymentObj.type || 'received',
        paymentObj.note || ''
      ]
    );

    return res.insertId;
  },

  /**
   * Recalculate and sync paid amount & payment_status on aura_money_exchange
   */
  async syncExchangePayments(conn, exchangeId) {
    const [exRows] = await conn.query(`SELECT id, grand_total, payment_status FROM aura_money_exchange WHERE id = ? LIMIT 1`, [exchangeId]);
    if (!exRows || exRows.length === 0) return;

    const grandTotal = parseFloat(exRows[0].grand_total || 0);
    const [paySum] = await conn.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'returned' THEN -amount ELSE amount END), 0) AS total_paid
       FROM aura_payments
       WHERE (transaction_type = 'money_exchange' AND transaction = ?)
          OR (sale_id = ? AND reference_no LIKE 'PAY-ME-%')`,
      [String(exchangeId), exchangeId]
    );

    const paid = Math.max(0, Number(parseFloat(paySum?.[0]?.total_paid || 0).toFixed(4)));
    let paymentStatus = 'pending';
    if (grandTotal > 0 && paid >= grandTotal) {
      paymentStatus = 'paid';
    } else if (paid > 0 && paid < grandTotal) {
      paymentStatus = 'partial';
    }

    await conn.query(
      `UPDATE aura_money_exchange SET paid = ?, payment_status = ? WHERE id = ?`,
      [paid, paymentStatus, exchangeId]
    );
  },

  /**
   * Create a new Money Exchange (supports full multi-item form & quick counter exchange)
   */
  async createExchange(exchangeData = {}, items = [], paymentsInput = null, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const userId = parseInt(user.id || exchangeData.created_by, 10) || 1;
      const dateStr = toMysqlDateTime(exchangeData.date);
      const warehouseId = parseInt(exchangeData.warehouse_id || exchangeData.warehouse, 10) || 1;

      const referenceNo =
        exchangeData.reference_no && String(exchangeData.reference_no).trim()
          ? String(exchangeData.reference_no).trim().slice(0, 55)
          : await this.generateNextReference('ME');

      const { resolvedBillerId, billerName, resolvedCustomerId, customerName } =
        await this.resolvePartyNames(
          conn,
          exchangeData.biller_id || exchangeData.biller,
          exchangeData.customer_id || exchangeData.customer,
          exchangeData.biller_name,
          exchangeData.customer_name
        );

      const { preparedItems, total, productDiscount, productTax, totalCommission } =
        await this.prepareLineItems(conn, items, warehouseId, exchangeData);

      const orderDiscountInput = exchangeData.order_discount_id ?? exchangeData.order_discount ?? '0';
      const orderDiscount = calculateDiscount(orderDiscountInput, total + productTax);
      const totalDiscount = Number((productDiscount + orderDiscount).toFixed(4));

      const orderTaxId = parseInt(exchangeData.order_tax_id ?? exchangeData.order_tax, 10) || 1;
      const orderTax = await this.computeOrderTax(conn, orderTaxId, Math.max(0, total + productTax - orderDiscount));
      const totalTax = Number((productTax + orderTax).toFixed(4));

      const shipping = Number((parseFloat(exchangeData.shipping || 0) || 0).toFixed(4));
      const surcharge = Number((parseFloat(exchangeData.surcharge || 0) || 0).toFixed(4));
      const grandTotal = Number(Math.max(0, total + totalTax + shipping + surcharge - orderDiscount).toFixed(4));

      const saleStatus = exchangeData.sale_status || 'completed';
      let paymentStatus = exchangeData.payment_status || 'pending';

      const [khrRow] = await conn.query(`SELECT rate FROM aura_currencies WHERE UPPER(code) = 'KHR' LIMIT 1`);
      const [thbRow] = await conn.query(`SELECT rate FROM aura_currencies WHERE UPPER(code) IN ('BAHT', 'THB') LIMIT 1`);
      const rateKh = parseFloat(exchangeData.currency_rate_kh || khrRow?.[0]?.rate || 4100);
      const rateBat = parseFloat(exchangeData.currency_rate_bat || thbRow?.[0]?.rate || 33);

      const hash = crypto.createHash('sha256').update(`${Date.now()}_${Math.random()}`).digest('hex');

      const [insertRes] = await conn.query(
        `INSERT INTO aura_money_exchange (
          date, reference_no, project_id, biller_id, biller, customer_id, customer, warehouse_id,
          product_discount, order_discount_id, order_discount, total_discount,
          product_tax, order_tax_id, order_tax, total_tax,
          shipping, surcharge, total, total_items, grand_total,
          status, sale_status, payment_status, payment_term,
          created_by, note, staff_note, pos, paid, hash,
          payment_method, currency, currency_rate_kh, currency_rate_bat,
          saleman_by, module_type, hide, customer_qty,
          commission_amount, payment_commission_status, commission_note
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          0, ?, ?, ?,
          ?, ?, ?, 0, 0, ?,
          ?, ?, ?, ?,
          ?, ?, 1, 1,
          ?, 'due', ?
        )`,
        [
          dateStr,
          referenceNo,
          exchangeData.project_id ? parseInt(exchangeData.project_id, 10) : null,
          resolvedBillerId,
          billerName.slice(0, 55),
          resolvedCustomerId,
          customerName.slice(0, 55),
          warehouseId,
          productDiscount,
          String(orderDiscountInput || '').slice(0, 20),
          orderDiscount,
          totalDiscount,
          productTax,
          orderTaxId,
          orderTax,
          totalTax,
          shipping,
          surcharge,
          total,
          preparedItems.length,
          grandTotal,
          saleStatus,
          paymentStatus,
          parseInt(exchangeData.payment_term, 10) || 0,
          userId,
          exchangeData.note || '',
          exchangeData.staff_note || '',
          hash,
          exchangeData.paid_by || exchangeData.payment_method || null,
          exchangeData.currency || 'USD',
          rateKh,
          rateBat,
          exchangeData.saleman_by ? parseInt(exchangeData.saleman_by, 10) : null,
          exchangeData.module_type || 'exchange',
          exchangeData.commission_amount !== undefined ? parseFloat(exchangeData.commission_amount || 0) : totalCommission,
          exchangeData.commission_note || null
        ]
      );

      const saleId = insertRes.insertId;

      for (const item of preparedItems) {
        await conn.query(
          `INSERT INTO aura_money_exchange_items (
            sale_id, product_id, product_code, product_name, product_type,
            from_currency, to_currency, exchange_rate,
            cost, purchase_unit_cost, real_unit_price, original_price, net_unit_price, unit_price,
            quantity, unit_quantity, product_unit_id, product_unit_code,
            item_tax, tax_rate_id, tax, discount, item_discount,
            subtotal, comment, warehouse_id, commission
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            saleId,
            item.product_id,
            item.product_code,
            item.product_name,
            item.product_type,
            item.from_currency,
            item.to_currency,
            item.exchange_rate,
            item.cost,
            item.purchase_unit_cost,
            item.real_unit_price,
            item.original_price,
            item.net_unit_price,
            item.unit_price,
            item.quantity,
            item.unit_quantity,
            item.product_unit_id,
            item.product_unit_code,
            item.item_tax,
            item.tax_rate_id,
            item.tax,
            item.discount,
            item.item_discount,
            item.subtotal,
            item.comment,
            item.warehouse_id,
            item.commission
          ]
        );
      }

      // Normalize payments array
      let paymentList = [];
      if (Array.isArray(paymentsInput)) {
        paymentList = paymentsInput;
      } else if (paymentsInput && typeof paymentsInput === 'object') {
        paymentList = [paymentsInput];
      } else if (exchangeData.quick && grandTotal > 0) {
        paymentList = [
          {
            amount: grandTotal,
            paid_by: exchangeData.paid_by || 'cash',
            note: exchangeData.payment_note || exchangeData.note || ''
          }
        ];
        paymentStatus = 'paid';
      } else if ((paymentStatus === 'paid' || paymentStatus === 'partial') && parseFloat(exchangeData.paid || 0) > 0) {
        paymentList = [
          {
            amount: parseFloat(exchangeData.paid),
            paid_by: exchangeData.paid_by || 'cash',
            reference_no: exchangeData.payment_reference_no,
            note: exchangeData.payment_note || ''
          }
        ];
      }

      if (paymentStatus === 'paid' || paymentStatus === 'partial' || exchangeData.quick) {
        for (const p of paymentList) {
          if (parseFloat(p?.amount || 0) > 0) {
            await this.insertExchangePayment(conn, saleId, resolvedBillerId, p, dateStr, userId);
          }
        }
        await this.syncExchangePayments(conn, saleId);
      }

      await conn.commit();
      return await this.getExchangeById(saleId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Update an existing Money Exchange transaction & its line items
   */
  async updateExchange(id, exchangeData = {}, items = [], paymentsInput = null, user = {}) {
    const exchangeId = parseInt(id, 10);
    if (!exchangeId) throw new Error('Invalid Money Exchange ID.');

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existingRows] = await conn.query(`SELECT * FROM aura_money_exchange WHERE id = ? LIMIT 1`, [exchangeId]);
      if (!existingRows || existingRows.length === 0) {
        throw new Error(`Money Exchange #${exchangeId} not found.`);
      }
      const existing = existingRows[0];

      const userId = parseInt(user.id || exchangeData.updated_by, 10) || 1;
      const dateStr = exchangeData.date ? toMysqlDateTime(exchangeData.date) : toMysqlDateTime(existing.date);
      const warehouseId = parseInt(exchangeData.warehouse_id ?? exchangeData.warehouse ?? existing.warehouse_id, 10) || 1;
      const referenceNo = String(exchangeData.reference_no || existing.reference_no).trim().slice(0, 55);

      const { resolvedBillerId, billerName, resolvedCustomerId, customerName } =
        await this.resolvePartyNames(
          conn,
          exchangeData.biller_id ?? exchangeData.biller ?? existing.biller_id,
          exchangeData.customer_id ?? exchangeData.customer ?? existing.customer_id,
          existing.biller,
          existing.customer
        );

      const { preparedItems, total, productDiscount, productTax, totalCommission } =
        await this.prepareLineItems(conn, items, warehouseId, exchangeData);

      const orderDiscountInput = exchangeData.order_discount_id ?? exchangeData.order_discount ?? existing.order_discount_id ?? '0';
      const orderDiscount = calculateDiscount(orderDiscountInput, total + productTax);
      const totalDiscount = Number((productDiscount + orderDiscount).toFixed(4));

      const orderTaxId = parseInt(exchangeData.order_tax_id ?? exchangeData.order_tax ?? existing.order_tax_id, 10) || 1;
      const orderTax = await this.computeOrderTax(conn, orderTaxId, Math.max(0, total + productTax - orderDiscount));
      const totalTax = Number((productTax + orderTax).toFixed(4));

      const shipping = Number((parseFloat(exchangeData.shipping ?? existing.shipping ?? 0) || 0).toFixed(4));
      const surcharge = Number((parseFloat(exchangeData.surcharge ?? existing.surcharge ?? 0) || 0).toFixed(4));
      const grandTotal = Number(Math.max(0, total + totalTax + shipping + surcharge - orderDiscount).toFixed(4));

      const saleStatus = exchangeData.sale_status || existing.sale_status || 'completed';
      const paymentStatus = exchangeData.payment_status || existing.payment_status || 'pending';

      await conn.query(
        `UPDATE aura_money_exchange SET
          date = ?, reference_no = ?, biller_id = ?, biller = ?,
          customer_id = ?, customer = ?, warehouse_id = ?,
          product_discount = ?, order_discount_id = ?, order_discount = ?, total_discount = ?,
          product_tax = ?, order_tax_id = ?, order_tax = ?, total_tax = ?,
          shipping = ?, surcharge = ?, total = ?, total_items = ?, grand_total = ?,
          sale_status = ?, payment_status = ?, payment_term = ?,
          updated_by = ?, updated_at = NOW(),
          note = ?, staff_note = ?, saleman_by = ?,
          payment_method = ?, commission_amount = ?, commission_note = ?
         WHERE id = ?`,
        [
          dateStr,
          referenceNo,
          resolvedBillerId,
          billerName.slice(0, 55),
          resolvedCustomerId,
          customerName.slice(0, 55),
          warehouseId,
          productDiscount,
          String(orderDiscountInput || '').slice(0, 20),
          orderDiscount,
          totalDiscount,
          productTax,
          orderTaxId,
          orderTax,
          totalTax,
          shipping,
          surcharge,
          total,
          preparedItems.length,
          grandTotal,
          saleStatus,
          paymentStatus,
          parseInt(exchangeData.payment_term ?? existing.payment_term, 10) || 0,
          userId,
          exchangeData.note !== undefined ? exchangeData.note : existing.note,
          exchangeData.staff_note !== undefined ? exchangeData.staff_note : existing.staff_note,
          exchangeData.saleman_by !== undefined ? (exchangeData.saleman_by ? parseInt(exchangeData.saleman_by, 10) : null) : existing.saleman_by,
          exchangeData.paid_by || exchangeData.payment_method || existing.payment_method,
          exchangeData.commission_amount !== undefined ? parseFloat(exchangeData.commission_amount || 0) : totalCommission,
          exchangeData.commission_note !== undefined ? exchangeData.commission_note : existing.commission_note,
          exchangeId
        ]
      );

      // Replace line items cleanly
      await conn.query(`DELETE FROM aura_money_exchange_items WHERE sale_id = ?`, [exchangeId]);
      for (const item of preparedItems) {
        await conn.query(
          `INSERT INTO aura_money_exchange_items (
            sale_id, product_id, product_code, product_name, product_type,
            from_currency, to_currency, exchange_rate,
            cost, purchase_unit_cost, real_unit_price, original_price, net_unit_price, unit_price,
            quantity, unit_quantity, product_unit_id, product_unit_code,
            item_tax, tax_rate_id, tax, discount, item_discount,
            subtotal, comment, warehouse_id, commission
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            exchangeId,
            item.product_id,
            item.product_code,
            item.product_name,
            item.product_type,
            item.from_currency,
            item.to_currency,
            item.exchange_rate,
            item.cost,
            item.purchase_unit_cost,
            item.real_unit_price,
            item.original_price,
            item.net_unit_price,
            item.unit_price,
            item.quantity,
            item.unit_quantity,
            item.product_unit_id,
            item.product_unit_code,
            item.item_tax,
            item.tax_rate_id,
            item.tax,
            item.discount,
            item.item_discount,
            item.subtotal,
            item.comment,
            item.warehouse_id,
            item.commission
          ]
        );
      }

      // Optional additional payments submitted on edit
      if (Array.isArray(paymentsInput) && paymentsInput.length > 0) {
        for (const p of paymentsInput) {
          if (parseFloat(p?.amount || 0) > 0) {
            await this.insertExchangePayment(conn, exchangeId, resolvedBillerId, p, dateStr, userId);
          }
        }
      }

      await this.syncExchangePayments(conn, exchangeId);
      await conn.commit();
      return await this.getExchangeById(exchangeId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Delete single Money Exchange & its items/payments
   */
  async deleteExchange(id) {
    const exchangeId = parseInt(id, 10);
    if (!exchangeId) throw new Error('Invalid Money Exchange ID.');

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM aura_money_exchange_items WHERE sale_id = ?`, [exchangeId]);
      await conn.query(
        `DELETE FROM aura_payments
         WHERE (transaction_type = 'money_exchange' AND transaction = ?)
            OR (sale_id = ? AND reference_no LIKE 'PAY-ME-%')`,
        [String(exchangeId), exchangeId]
      );
      const [res] = await conn.query(`DELETE FROM aura_money_exchange WHERE id = ?`, [exchangeId]);
      await conn.commit();
      return res.affectedRows > 0;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Bulk delete Money Exchanges
   */
  async bulkDeleteExchanges(ids = []) {
    const validIds = (ids || []).map((v) => parseInt(v, 10)).filter(Boolean);
    if (!validIds.length) return 0;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const placeholders = validIds.map(() => '?').join(',');
      const strIds = validIds.map(String);
      await conn.query(`DELETE FROM aura_money_exchange_items WHERE sale_id IN (${placeholders})`, validIds);
      await conn.query(
        `DELETE FROM aura_payments WHERE transaction_type = 'money_exchange' AND transaction IN (${placeholders})`,
        strIds
      );
      const [res] = await conn.query(`DELETE FROM aura_money_exchange WHERE id IN (${placeholders})`, validIds);
      await conn.commit();
      return res.affectedRows || 0;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Add payment to an existing Money Exchange
   */
  async addPayment(exchangeId, paymentData = {}, user = {}) {
    const idNum = parseInt(exchangeId, 10);
    if (!idNum) throw new Error('Invalid Money Exchange ID.');

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [exRows] = await conn.query(`SELECT id, biller_id FROM aura_money_exchange WHERE id = ? LIMIT 1`, [idNum]);
      if (!exRows || exRows.length === 0) {
        throw new Error(`Money Exchange #${idNum} not found.`);
      }

      const userId = parseInt(user.id || paymentData.created_by, 10) || 1;
      await this.insertExchangePayment(
        conn,
        idNum,
        exRows[0].biller_id,
        paymentData,
        paymentData.date || new Date(),
        userId
      );
      await this.syncExchangePayments(conn, idNum);
      await conn.commit();
      return await this.getExchangeById(idNum);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Delete payment from a Money Exchange and sync balance
   */
  async deletePayment(exchangeId, paymentId) {
    const idNum = parseInt(exchangeId, 10);
    const payId = parseInt(paymentId, 10);
    if (!idNum || !payId) throw new Error('Invalid Exchange or Payment ID.');

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM aura_payments WHERE id = ?`, [payId]);
      await this.syncExchangePayments(conn, idNum);
      await conn.commit();
      return await this.getExchangeById(idNum);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // ===========================================================================
  // EXCHANGE RATES MATRIX (aura_money_exchange_rate) & CURRENCIES (aura_currencies)
  // Replicates Money::exchange_rate(), Money::get_exchange_rate(), Money_model::addMoneyExchangeRate()
  // ===========================================================================

  async getExchangeRates() {
    const [rates] = await db.query(
      `SELECT r.id, r.currency_id, r.from_currency, r.to_currency, r.exchange_rate, r.created_by, r.updated_by,
              fc.name AS from_currency_name, fc.symbol AS from_symbol,
              tc.name AS to_currency_name, tc.symbol AS to_symbol
       FROM aura_money_exchange_rate r
       LEFT JOIN aura_currencies fc ON UPPER(fc.code) = UPPER(TRIM(r.from_currency))
       LEFT JOIN aura_currencies tc ON UPPER(tc.code) = UPPER(TRIM(r.to_currency))
       ORDER BY r.id ASC`
    );
    return (rates || []).map((r) => ({
      id: r.id,
      currency_id: r.currency_id,
      from_currency: String(r.from_currency || '').trim(),
      to_currency: String(r.to_currency || '').trim(),
      exchange_rate: parseFloat(r.exchange_rate || 0),
      from_currency_name: r.from_currency_name || String(r.from_currency || '').trim(),
      from_symbol: r.from_symbol || '',
      to_currency_name: r.to_currency_name || String(r.to_currency || '').trim(),
      to_symbol: r.to_symbol || ''
    }));
  },

  async saveExchangeRates(rates = [], userId = 1) {
    const validRows = (rates || [])
      .map((r) => ({
        from_currency: String(r.from_currency || '').trim().toUpperCase(),
        to_currency: String(r.to_currency || '').trim().toUpperCase(),
        exchange_rate: parseFloat(r.exchange_rate ?? 0) || 0
      }))
      .filter((r) => r.from_currency && r.to_currency && r.from_currency !== r.to_currency);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM aura_money_exchange_rate`);
      for (const row of validRows) {
        await conn.query(
          `INSERT INTO aura_money_exchange_rate (from_currency, to_currency, exchange_rate, created_by, updated_by)
           VALUES (?, ?, ?, ?, ?)`,
          [row.from_currency, row.to_currency, row.exchange_rate, parseInt(userId, 10) || 1, parseInt(userId, 10) || 1]
        );
      }
      await conn.commit();
      return await this.getExchangeRates();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async lookupExchangeRate(fromCurrency, toCurrency) {
    const fromCode = String(fromCurrency || '').trim().toUpperCase();
    const toCode = String(toCurrency || '').trim().toUpperCase();
    if (!fromCode || !toCode) return null;
    if (fromCode === toCode) {
      return { from_currency: fromCode, to_currency: toCode, exchange_rate: 1, source: 'identity' };
    }

    const [rows] = await db.query(
      `SELECT id, from_currency, to_currency, exchange_rate
       FROM aura_money_exchange_rate
       WHERE UPPER(TRIM(from_currency)) = ? AND UPPER(TRIM(to_currency)) = ?
       LIMIT 1`,
      [fromCode, toCode]
    );

    if (rows && rows.length > 0 && parseFloat(rows[0].exchange_rate || 0) > 0) {
      return {
        id: rows[0].id,
        from_currency: fromCode,
        to_currency: toCode,
        exchange_rate: parseFloat(rows[0].exchange_rate),
        source: 'matrix'
      };
    }

    // Fallback cross-rate calculation from aura_currencies base rates if matrix pair is 0 or missing
    const [curRows] = await db.query(
      `SELECT code, rate FROM aura_currencies WHERE UPPER(code) IN (?, ?)`,
      [fromCode, toCode]
    );
    const fromObj = (curRows || []).find((c) => String(c.code).toUpperCase() === fromCode);
    const toObj = (curRows || []).find((c) => String(c.code).toUpperCase() === toCode);
    if (fromObj && toObj && parseFloat(fromObj.rate) > 0) {
      const derivedRate = Number((parseFloat(toObj.rate) / parseFloat(fromObj.rate)).toFixed(6));
      return {
        from_currency: fromCode,
        to_currency: toCode,
        exchange_rate: derivedRate,
        source: 'currencies_fallback'
      };
    }

    return {
      from_currency: fromCode,
      to_currency: toCode,
      exchange_rate: rows?.[0] ? parseFloat(rows[0].exchange_rate || 0) : 0,
      source: 'none'
    };
  },

  async listCurrencies(term = '') {
    const params = [];
    let where = '1=1';
    if (term && String(term).trim()) {
      const like = `%${String(term).trim()}%`;
      where = `(code LIKE ? OR name LIKE ?)`;
      params.push(like, like);
    }
    const [rows] = await db.query(
      `SELECT id, code, name, rate, auto_update, symbol, day FROM aura_currencies WHERE ${where} ORDER BY id ASC`,
      params
    );
    return (rows || []).map((c) => ({
      ...c,
      rate: parseFloat(c.rate || 0),
      auto_update: Boolean(c.auto_update)
    }));
  },

  async createCurrency({ code, name, rate = 1, symbol = '', auto_update = 0 }) {
    const cleanCode = String(code || '').trim().toUpperCase().slice(0, 5);
    const cleanName = String(name || '').trim().slice(0, 55);
    if (!cleanCode || !cleanName) {
      throw new Error('Currency code and name are required.');
    }
    const [dup] = await db.query(`SELECT id FROM aura_currencies WHERE UPPER(code) = ? LIMIT 1`, [cleanCode]);
    if (dup && dup.length > 0) {
      throw new Error(`Currency code "${cleanCode}" already exists.`);
    }
    const [res] = await db.query(
      `INSERT INTO aura_currencies (code, name, rate, auto_update, symbol) VALUES (?, ?, ?, ?, ?)`,
      [cleanCode, cleanName, parseFloat(rate) || 1, auto_update ? 1 : 0, String(symbol || '').slice(0, 50)]
    );
    const [created] = await db.query(`SELECT * FROM aura_currencies WHERE id = ? LIMIT 1`, [res.insertId]);
    return created?.[0];
  },

  async updateCurrency(id, { code, name, rate, symbol, auto_update }) {
    const curId = parseInt(id, 10);
    if (!curId) throw new Error('Invalid currency ID.');
    const [existing] = await db.query(`SELECT * FROM aura_currencies WHERE id = ? LIMIT 1`, [curId]);
    if (!existing || existing.length === 0) throw new Error('Currency not found.');
    const cur = existing[0];

    const cleanCode = code !== undefined ? String(code).trim().toUpperCase().slice(0, 5) : cur.code;
    const cleanName = name !== undefined ? String(name).trim().slice(0, 55) : cur.name;
    const numRate = rate !== undefined ? parseFloat(rate) || 0 : parseFloat(cur.rate || 1);
    const cleanSymbol = symbol !== undefined ? String(symbol).slice(0, 50) : cur.symbol;
    const autoUpd = auto_update !== undefined ? (auto_update ? 1 : 0) : cur.auto_update;

    await db.query(
      `UPDATE aura_currencies SET code = ?, name = ?, rate = ?, symbol = ?, auto_update = ? WHERE id = ?`,
      [cleanCode, cleanName, numRate, cleanSymbol, autoUpd, curId]
    );
    const [updated] = await db.query(`SELECT * FROM aura_currencies WHERE id = ? LIMIT 1`, [curId]);
    return updated?.[0];
  },

  async deleteCurrency(id) {
    const curId = parseInt(id, 10);
    if (!curId) throw new Error('Invalid currency ID.');
    if (curId === 1) throw new Error('Default base currency cannot be deleted.');
    const [res] = await db.query(`DELETE FROM aura_currencies WHERE id = ?`, [curId]);
    return res.affectedRows > 0;
  },

  // ===========================================================================
  // TRANSFER COMPANIES (aura_price_groups WHERE type='transfer_money')
  // & TRANSFER RANGES (aura_money_transfer_range)
  // Replicates Money::transfer_companies(), add_transfer_company(), edit_transfer_company(), transfer_range()
  // ===========================================================================

  async listTransferCompanies(search = '') {
    const params = [];
    let searchSql = '';
    if (search && String(search).trim()) {
      searchSql = `AND pg.name LIKE ?`;
      params.push(`%${String(search).trim()}%`);
    }

    const [rows] = await db.query(
      `SELECT
          pg.id,
          pg.name,
          pg.type,
          COUNT(tr.id) AS ranges_count,
          COALESCE(MIN(tr.from_amount), 0) AS min_amount,
          COALESCE(MAX(tr.to_amount), 0) AS max_amount
       FROM aura_price_groups pg
       LEFT JOIN aura_money_transfer_range tr ON tr.company_id = pg.id
       WHERE pg.type = 'transfer_money' ${searchSql}
       GROUP BY pg.id, pg.name, pg.type
       ORDER BY pg.id DESC`,
      params
    );

    return (rows || []).map((r) => ({
      id: r.id,
      key: r.id,
      name: r.name,
      type: r.type,
      ranges_count: parseInt(r.ranges_count, 10) || 0,
      min_amount: parseFloat(r.min_amount || 0),
      max_amount: parseFloat(r.max_amount || 0)
    }));
  },

  async getTransferCompanyById(id) {
    const companyId = parseInt(id, 10);
    if (!companyId) return null;
    const [rows] = await db.query(
      `SELECT id, name, type FROM aura_price_groups WHERE id = ? AND type = 'transfer_money' LIMIT 1`,
      [companyId]
    );
    if (!rows || rows.length === 0) return null;
    const ranges = await this.getTransferRanges(companyId);
    return {
      ...rows[0],
      ranges
    };
  },

  async createTransferCompany({ name }) {
    const cleanName = String(name || '').trim().slice(0, 50);
    if (!cleanName) throw new Error('Transfer company name is required.');

    const [dup] = await db.query(
      `SELECT id FROM aura_price_groups WHERE LOWER(name) = LOWER(?) AND type = 'transfer_money' LIMIT 1`,
      [cleanName]
    );
    if (dup && dup.length > 0) {
      throw new Error(`Transfer company "${cleanName}" already exists.`);
    }

    const [res] = await db.query(
      `INSERT INTO aura_price_groups (name, type) VALUES (?, 'transfer_money')`,
      [cleanName]
    );
    return await this.getTransferCompanyById(res.insertId);
  },

  async updateTransferCompany(id, { name }) {
    const companyId = parseInt(id, 10);
    if (!companyId) throw new Error('Invalid transfer company ID.');

    const cleanName = String(name || '').trim().slice(0, 50);
    if (!cleanName) throw new Error('Transfer company name is required.');

    const [dup] = await db.query(
      `SELECT id FROM aura_price_groups WHERE LOWER(name) = LOWER(?) AND type = 'transfer_money' AND id != ? LIMIT 1`,
      [cleanName, companyId]
    );
    if (dup && dup.length > 0) {
      throw new Error(`Transfer company "${cleanName}" already exists.`);
    }

    await db.query(
      `UPDATE aura_price_groups SET name = ? WHERE id = ? AND type = 'transfer_money'`,
      [cleanName, companyId]
    );
    return await this.getTransferCompanyById(companyId);
  },

  async deleteTransferCompany(id) {
    const companyId = parseInt(id, 10);
    if (!companyId) throw new Error('Invalid transfer company ID.');

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM aura_money_transfer_range WHERE company_id = ?`, [companyId]);
      const [res] = await conn.query(
        `DELETE FROM aura_price_groups WHERE id = ? AND type = 'transfer_money'`,
        [companyId]
      );
      await conn.commit();
      return res.affectedRows > 0;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getTransferRanges(companyId) {
    const idNum = parseInt(companyId, 10);
    if (!idNum) return [];

    const [rows] = await db.query(
      `SELECT id, company_id, from_amount, to_amount, commission, transfer_fee, created_by, updated_by
       FROM aura_money_transfer_range
       WHERE company_id = ?
       ORDER BY from_amount ASC, id ASC`,
      [idNum]
    );

    return (rows || []).map((r) => ({
      id: r.id,
      company_id: r.company_id,
      from_amount: parseFloat(r.from_amount || 0),
      to_amount: parseFloat(r.to_amount || 0),
      commission: parseFloat(r.commission || 0),
      transfer_fee: parseFloat(r.transfer_fee || 0)
    }));
  },

  async saveTransferRanges(companyId, ranges = [], userId = 1) {
    const idNum = parseInt(companyId, 10);
    if (!idNum) throw new Error('Invalid transfer company ID.');

    const [company] = await db.query(
      `SELECT id, name FROM aura_price_groups WHERE id = ? AND type = 'transfer_money' LIMIT 1`,
      [idNum]
    );
    if (!company || company.length === 0) {
      throw new Error('Transfer company not found.');
    }

    const validRanges = (ranges || [])
      .map((r) => ({
        from_amount: parseFloat(r.from_amount ?? 0) || 0,
        to_amount: parseFloat(r.to_amount ?? 0) || 0,
        commission: parseFloat(r.commission ?? 0) || 0,
        transfer_fee: parseFloat(r.transfer_fee ?? r.fee ?? 0) || 0
      }))
      .filter((r) => r.from_amount >= 0 || r.to_amount > 0 || r.commission > 0 || r.transfer_fee > 0);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM aura_money_transfer_range WHERE company_id = ?`, [idNum]);
      for (const r of validRanges) {
        await conn.query(
          `INSERT INTO aura_money_transfer_range (company_id, from_amount, to_amount, commission, transfer_fee, created_by, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [idNum, r.from_amount, r.to_amount, r.commission, r.transfer_fee, parseInt(userId, 10) || 1, parseInt(userId, 10) || 1]
        );
      }
      await conn.commit();
      return await this.getTransferCompanyById(idNum);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async lookupTransferRange(companyId, amount) {
    const idNum = parseInt(companyId, 10);
    const amt = parseFloat(amount || 0);
    if (!idNum || amt <= 0) return null;

    const [rows] = await db.query(
      `SELECT id, company_id, from_amount, to_amount, commission, transfer_fee
       FROM aura_money_transfer_range
       WHERE company_id = ?
         AND from_amount <= ?
         AND (to_amount >= ? OR to_amount = 0)
       ORDER BY from_amount DESC
       LIMIT 1`,
      [idNum, amt, amt]
    );

    if (!rows || rows.length === 0) return null;
    return {
      id: rows[0].id,
      company_id: rows[0].company_id,
      from_amount: parseFloat(rows[0].from_amount || 0),
      to_amount: parseFloat(rows[0].to_amount || 0),
      commission: parseFloat(rows[0].commission || 0),
      transfer_fee: parseFloat(rows[0].transfer_fee || 0)
    };
  }
};

module.exports = MoneyExchangeModel;
