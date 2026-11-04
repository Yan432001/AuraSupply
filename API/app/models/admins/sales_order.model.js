const db = require('../../config/utill/connection');
const { unitToBaseQty } = require('../../utils/unitConverter');

/**
 * Sales Order Model for Aura ERP
 * Strictly replicated from AURA_v1 (Sales_order_model.php and Sales_order.php)
 * Handles Sales Order CRUD, approval workflow, customer deposits, and conversion to commercial Sales/Invoices.
 */
const SalesOrderModel = {
  /**
   * Generate next sale order reference number (e.g. SALE-ORD-202610-0001)
   */
  async generateNextReference(prefix = 'SALE-ORD') {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const pattern = `${prefix}-${yearMonth}-%`;

    const [rows] = await db.query(
      `SELECT reference_no FROM aura_sales_order WHERE reference_no LIKE ? ORDER BY id DESC LIMIT 1`,
      [pattern]
    );

    if (rows && rows.length > 0 && rows[0].reference_no) {
      const parts = rows[0].reference_no.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        return `${prefix}-${yearMonth}-${String(lastSeq + 1).padStart(4, '0')}`;
      }
    }

    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM aura_sales_order`);
    const nextNum = (countRows[0]?.total || 0) + 1;
    return `${prefix}-${yearMonth}-${String(nextNum).padStart(4, '0')}`;
  },

  /**
   * Get paginated Sales Orders list with filtering, searching, and metrics
   */
  async getSalesOrders({
    search = '',
    sale_status = 'all',
    order_status = 'all',
    customer_id = null,
    biller_id = null,
    warehouse_id = null,
    start_date = null,
    end_date = null,
    sortBy = 'id',
    sortOrder = 'DESC',
    page = 1,
    limit = 20
  } = {}) {
    let whereConditions = ['1=1'];
    const params = [];

    if (search && search.trim() !== '') {
      whereConditions.push('(so.reference_no LIKE ? OR so.customer LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR so.note LIKE ? OR so.biller LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    if (sale_status && sale_status !== 'all') {
      whereConditions.push('so.sale_status = ?');
      params.push(sale_status);
    }

    if (order_status && order_status !== 'all') {
      whereConditions.push('so.order_status = ?');
      params.push(order_status);
    }

    if (customer_id && customer_id !== 'all') {
      whereConditions.push('so.customer_id = ?');
      params.push(parseInt(customer_id, 10));
    }

    if (biller_id && biller_id !== 'all') {
      whereConditions.push('so.biller_id = ?');
      params.push(parseInt(biller_id, 10));
    }

    if (warehouse_id && warehouse_id !== 'all') {
      whereConditions.push('so.warehouse_id = ?');
      params.push(parseInt(warehouse_id, 10));
    }

    if (start_date) {
      whereConditions.push('DATE(so.date) >= ?');
      params.push(start_date);
    }
    if (end_date) {
      whereConditions.push('DATE(so.date) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    // Metrics summary
    const [metricsRows] = await db.query(
      `SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(so.grand_total), 0) as total_revenue,
        COALESCE(SUM(so.paid), 0) as total_collected,
        COALESCE(SUM(so.grand_total - so.paid), 0) as total_balance,
        COUNT(CASE WHEN so.order_status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN so.order_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN so.sale_status = 'completed' THEN 1 END) as completed_count
      FROM aura_sales_order so
      LEFT JOIN aura_companies c ON c.id = so.customer_id
      WHERE ${whereClause}`,
      params
    );

    // Count total rows for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total
       FROM aura_sales_order so
       LEFT JOIN aura_companies c ON c.id = so.customer_id
       WHERE ${whereClause}`,
      params
    );
    const totalRecords = countResult[0]?.total || 0;

    // Allowed sort columns
    const allowedSortColumns = {
      id: 'so.id',
      date: 'so.date',
      reference_no: 'so.reference_no',
      customer: 'so.customer',
      biller: 'so.biller',
      grand_total: 'so.grand_total',
      paid: 'so.paid',
      sale_status: 'so.sale_status',
      order_status: 'so.order_status',
      due_date: 'so.due_date'
    };
    const orderColumn = allowedSortColumns[sortBy] || 'so.id';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = Math.max(0, (parseInt(page, 10) - 1) * parseInt(limit, 10));
    const queryParams = [...params, parseInt(limit, 10), offset];

    const [rows] = await db.query(
      `SELECT
        so.id,
        so.date,
        so.reference_no,
        so.biller_id,
        so.biller,
        so.customer_id,
        so.customer,
        c.phone as customer_phone,
        c.email as customer_email,
        so.warehouse_id,
        w.name as warehouse_name,
        so.total,
        so.product_discount,
        so.order_discount,
        so.total_discount,
        so.product_tax,
        so.order_tax,
        so.total_tax,
        so.shipping,
        so.grand_total,
        so.paid,
        (so.grand_total - so.paid) as balance,
        so.sale_status,
        so.order_status,
        so.payment_status,
        so.payment_term,
        so.due_date,
        so.note,
        so.staff_note,
        so.total_items,
        so.sale_id,
        u.username as created_by_username
      FROM aura_sales_order so
      LEFT JOIN aura_companies c ON c.id = so.customer_id
      LEFT JOIN aura_warehouses w ON w.id = so.warehouse_id
      LEFT JOIN aura_users u ON u.id = so.created_by
      WHERE ${whereClause}
      ORDER BY ${orderColumn} ${direction}
      LIMIT ? OFFSET ?`,
      queryParams
    );

    return {
      orders: rows,
      total: totalRecords,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(totalRecords / parseInt(limit, 10)),
      metrics: {
        totalOrders: metricsRows[0]?.total_orders || 0,
        totalRevenue: parseFloat(metricsRows[0]?.total_revenue || 0),
        totalCollected: parseFloat(metricsRows[0]?.total_collected || 0),
        totalBalance: parseFloat(metricsRows[0]?.total_balance || 0),
        approvedCount: metricsRows[0]?.approved_count || 0,
        pendingCount: metricsRows[0]?.pending_count || 0,
        completedCount: metricsRows[0]?.completed_count || 0
      }
    };
  },

  /**
   * Get single Sales Order details by ID with line items and customer info
   */
  async getSaleOrderById(id) {
    const [rows] = await db.query(
      `SELECT
        so.*,
        w.name as warehouse_name,
        w.code as warehouse_code,
        u.username as created_by_name,
        u.email as created_by_email
      FROM aura_sales_order so
      LEFT JOIN aura_warehouses w ON w.id = so.warehouse_id
      LEFT JOIN aura_users u ON u.id = so.created_by
      WHERE so.id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) return null;
    const order = rows[0];

    // Customer & Biller Details
    let customerDetails = null;
    if (order.customer_id) {
      const [cRows] = await db.query(`SELECT * FROM aura_companies WHERE id = ?`, [order.customer_id]);
      if (cRows.length > 0) customerDetails = cRows[0];
    }

    let billerDetails = null;
    if (order.biller_id) {
      const [bRows] = await db.query(`SELECT * FROM aura_companies WHERE id = ?`, [order.biller_id]);
      if (bRows.length > 0) billerDetails = bRows[0];
    }

    // Line items
    const [items] = await db.query(
      `SELECT
        soi.*,
        p.image as product_image,
        p.unit as product_base_unit_id,
        u.name as unit_name,
        u.code as unit_code,
        COALESCE(wp.quantity, 0) as qoh
      FROM aura_sale_order_items soi
      LEFT JOIN aura_products p ON p.id = soi.product_id
      LEFT JOIN aura_units u ON u.id = soi.product_unit_id
      LEFT JOIN aura_warehouses_products wp ON wp.product_id = soi.product_id AND wp.warehouse_id = soi.warehouse_id
      WHERE soi.sale_order_id = ?
      ORDER BY soi.id ASC`,
      [id]
    );

    // Payments / Deposits made for this sales order
    const [payments] = await db.query(
      `SELECT p.*, u.username as paid_by_name
       FROM aura_payments p
       LEFT JOIN aura_users u ON u.id = p.created_by
       WHERE (p.sale_order_id = ? OR p.sale_id = ?)
       ORDER BY p.id ASC`,
      [id, order.sale_id || -1]
    );

    return {
      ...order,
      customerDetails,
      billerDetails,
      items,
      payments
    };
  },

  /**
   * Create a new Sales Order in transaction
   */
  async createSaleOrder(data, items, payment = null, userId = 1) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      let referenceNo = data.reference_no;
      if (!referenceNo || referenceNo.trim() === '') {
        referenceNo = await this.generateNextReference();
      }

      // Check unique reference
      const [existingRef] = await conn.query(
        `SELECT id FROM aura_sales_order WHERE reference_no = ? LIMIT 1`,
        [referenceNo]
      );
      if (existingRef.length > 0) {
        referenceNo = await this.generateNextReference();
      }

      // Resolve customer and biller names
      let customerName = data.customer || '';
      if (data.customer_id) {
        const [cRow] = await conn.query(`SELECT name, company FROM aura_companies WHERE id = ?`, [data.customer_id]);
        if (cRow.length > 0) {
          customerName = cRow[0].company && cRow[0].company !== '-' ? cRow[0].company : cRow[0].name;
        }
      }

      let billerName = data.biller || '';
      if (data.biller_id) {
        const [bRow] = await conn.query(`SELECT name, company FROM aura_companies WHERE id = ?`, [data.biller_id]);
        if (bRow.length > 0) {
          billerName = bRow[0].company && bRow[0].company !== '-' ? bRow[0].company : bRow[0].name;
        }
      }

      // Calculate totals
      let itemsTotal = 0;
      let totalItemDiscount = 0;
      let totalItemTax = 0;

      const processedItems = [];
      for (const it of items) {
        const qty = parseFloat(it.quantity || it.unit_quantity || 1);
        const unitPrice = parseFloat(it.unit_price || it.price || 0);
        const netUnitPrice = parseFloat(it.net_unit_price || unitPrice);
        const itemDiscount = parseFloat(it.item_discount || it.discount || 0);
        const itemTax = parseFloat(it.item_tax || it.tax || 0);
        const subtotal = parseFloat(it.subtotal || ((netUnitPrice * qty) - itemDiscount + itemTax));

        itemsTotal += (netUnitPrice * qty);
        totalItemDiscount += itemDiscount;
        totalItemTax += itemTax;

        processedItems.push({
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_type: it.product_type || 'standard',
          option_id: it.option_id || null,
          real_unit_price: it.real_unit_price || unitPrice,
          net_unit_price: netUnitPrice,
          unit_price: unitPrice,
          quantity: qty,
          unit_quantity: it.unit_quantity || qty,
          product_unit_id: it.product_unit_id || it.unit_id || null,
          product_unit_code: it.product_unit_code || it.unit_name || null,
          warehouse_id: data.warehouse_id || 1,
          item_tax: itemTax,
          tax_rate_id: it.tax_rate_id || 0,
          tax: it.tax_rate_name || '',
          discount: String(it.discount_str || itemDiscount),
          item_discount: itemDiscount,
          subtotal: subtotal,
          comment: it.comment || it.description || ''
        });
      }

      const orderDiscount = parseFloat(data.order_discount || 0);
      const orderTax = parseFloat(data.order_tax || 0);
      const shipping = parseFloat(data.shipping || 0);
      const grandTotal = Math.max(0, itemsTotal - totalItemDiscount - orderDiscount + totalItemTax + orderTax + shipping);

      let paidAmount = 0;
      if (payment && parseFloat(payment.amount) > 0) {
        paidAmount = parseFloat(payment.amount);
      }

      let paymentStatus = 'pending';
      if (paidAmount >= grandTotal && grandTotal > 0) {
        paymentStatus = 'paid';
      } else if (paidAmount > 0) {
        paymentStatus = 'partial';
      }

      const orderDate = data.date ? new Date(data.date) : new Date();

      // Insert Sales Order record
      const [insertResult] = await conn.query(
        `INSERT INTO aura_sales_order (
          date, reference_no, biller_id, biller, customer_id, customer,
          warehouse_id, note, staff_note, total, product_discount, order_discount,
          total_discount, product_tax, order_tax, total_tax, shipping, grand_total,
          sale_status, order_status, payment_status, payment_term, due_date,
          created_by, total_items, paid
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderDate,
          referenceNo,
          data.biller_id || 1,
          billerName,
          data.customer_id || 1,
          customerName,
          data.warehouse_id || 1,
          data.note || '',
          data.staff_note || '',
          itemsTotal,
          totalItemDiscount,
          orderDiscount,
          totalItemDiscount + orderDiscount,
          totalItemTax,
          orderTax,
          totalItemTax + orderTax,
          shipping,
          grandTotal,
          data.sale_status || 'order',
          data.order_status || 'pending',
          paymentStatus,
          data.payment_term || 0,
          data.due_date ? new Date(data.due_date) : null,
          userId,
          processedItems.length,
          paidAmount
        ]
      );

      const saleOrderId = insertResult.insertId;

      // Insert line items
      for (const item of processedItems) {
        await conn.query(
          `INSERT INTO aura_sale_order_items (
            sale_order_id, product_id, product_code, product_name, product_type, option_id,
            real_unit_price, net_unit_price, unit_price, quantity, unit_quantity,
            product_unit_id, product_unit_code, warehouse_id, item_tax, tax_rate_id,
            tax, discount, item_discount, subtotal, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            saleOrderId,
            item.product_id,
            item.product_code,
            item.product_name,
            item.product_type,
            item.option_id,
            item.real_unit_price,
            item.net_unit_price,
            item.unit_price,
            item.quantity,
            item.unit_quantity,
            item.product_unit_id,
            item.product_unit_code,
            item.warehouse_id,
            item.item_tax,
            item.tax_rate_id,
            item.tax,
            item.discount,
            item.item_discount,
            item.subtotal,
            item.comment
          ]
        );
      }

      // Record advance deposit / payment if provided
      if (payment && parseFloat(payment.amount) > 0) {
        const payDate = payment.date ? new Date(payment.date) : new Date();
        const payRef = `DEP-${referenceNo}`;
        await conn.query(
          `INSERT INTO aura_payments (
            date, sale_order_id, reference_no, amount, paid_by, note, created_by, type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            payDate,
            saleOrderId,
            payRef,
            paidAmount,
            payment.paid_by || 'cash',
            payment.note || 'Advance customer deposit for Sale Order',
            userId,
            'received'
          ]
        );
      }

      await conn.commit();
      return { id: saleOrderId, reference_no: referenceNo };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Update an existing Sales Order
   */
  async updateSaleOrder(id, data, items, userId = 1) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existingRows] = await conn.query(`SELECT * FROM aura_sales_order WHERE id = ?`, [id]);
      if (existingRows.length === 0) {
        throw new Error('Sales order not found');
      }
      const existing = existingRows[0];

      if (existing.sale_status === 'completed' && existing.sale_id) {
        throw new Error('This Sale Order has already been converted to an active Sale and cannot be modified.');
      }

      // Customer & Biller
      let customerName = data.customer || existing.customer;
      if (data.customer_id) {
        const [cRow] = await conn.query(`SELECT name, company FROM aura_companies WHERE id = ?`, [data.customer_id]);
        if (cRow.length > 0) {
          customerName = cRow[0].company && cRow[0].company !== '-' ? cRow[0].company : cRow[0].name;
        }
      }

      let billerName = data.biller || existing.biller;
      if (data.biller_id) {
        const [bRow] = await conn.query(`SELECT name, company FROM aura_companies WHERE id = ?`, [data.biller_id]);
        if (bRow.length > 0) {
          billerName = bRow[0].company && bRow[0].company !== '-' ? bRow[0].company : bRow[0].name;
        }
      }

      // Calculate totals
      let itemsTotal = 0;
      let totalItemDiscount = 0;
      let totalItemTax = 0;

      const processedItems = [];
      for (const it of items) {
        const qty = parseFloat(it.quantity || it.unit_quantity || 1);
        const unitPrice = parseFloat(it.unit_price || it.price || 0);
        const netUnitPrice = parseFloat(it.net_unit_price || unitPrice);
        const itemDiscount = parseFloat(it.item_discount || it.discount || 0);
        const itemTax = parseFloat(it.item_tax || it.tax || 0);
        const subtotal = parseFloat(it.subtotal || ((netUnitPrice * qty) - itemDiscount + itemTax));

        itemsTotal += (netUnitPrice * qty);
        totalItemDiscount += itemDiscount;
        totalItemTax += itemTax;

        processedItems.push({
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_type: it.product_type || 'standard',
          option_id: it.option_id || null,
          real_unit_price: it.real_unit_price || unitPrice,
          net_unit_price: netUnitPrice,
          unit_price: unitPrice,
          quantity: qty,
          unit_quantity: it.unit_quantity || qty,
          product_unit_id: it.product_unit_id || it.unit_id || null,
          product_unit_code: it.product_unit_code || it.unit_name || null,
          warehouse_id: data.warehouse_id || existing.warehouse_id || 1,
          item_tax: itemTax,
          tax_rate_id: it.tax_rate_id || 0,
          tax: it.tax_rate_name || '',
          discount: String(it.discount_str || itemDiscount),
          item_discount: itemDiscount,
          subtotal: subtotal,
          comment: it.comment || it.description || ''
        });
      }

      const orderDiscount = parseFloat(data.order_discount != null ? data.order_discount : existing.order_discount);
      const orderTax = parseFloat(data.order_tax != null ? data.order_tax : existing.order_tax);
      const shipping = parseFloat(data.shipping != null ? data.shipping : existing.shipping);
      const grandTotal = Math.max(0, itemsTotal - totalItemDiscount - orderDiscount + totalItemTax + orderTax + shipping);

      const paid = parseFloat(existing.paid || 0);
      let paymentStatus = 'pending';
      if (paid >= grandTotal && grandTotal > 0) {
        paymentStatus = 'paid';
      } else if (paid > 0) {
        paymentStatus = 'partial';
      }

      const orderDate = data.date ? new Date(data.date) : existing.date;

      // Update Sales Order record
      await conn.query(
        `UPDATE aura_sales_order SET
          date = ?, biller_id = ?, biller = ?, customer_id = ?, customer = ?,
          warehouse_id = ?, note = ?, staff_note = ?, total = ?, product_discount = ?,
          order_discount = ?, total_discount = ?, product_tax = ?, order_tax = ?,
          total_tax = ?, shipping = ?, grand_total = ?, sale_status = ?, order_status = ?,
          payment_status = ?, payment_term = ?, due_date = ?, updated_by = ?,
          updated_at = NOW(), total_items = ?
        WHERE id = ?`,
        [
          orderDate,
          data.biller_id || existing.biller_id,
          billerName,
          data.customer_id || existing.customer_id,
          customerName,
          data.warehouse_id || existing.warehouse_id,
          data.note != null ? data.note : existing.note,
          data.staff_note != null ? data.staff_note : existing.staff_note,
          itemsTotal,
          totalItemDiscount,
          orderDiscount,
          totalItemDiscount + orderDiscount,
          totalItemTax,
          orderTax,
          totalItemTax + orderTax,
          shipping,
          grandTotal,
          data.sale_status || existing.sale_status,
          data.order_status || existing.order_status,
          paymentStatus,
          data.payment_term != null ? data.payment_term : existing.payment_term,
          data.due_date ? new Date(data.due_date) : existing.due_date,
          userId,
          processedItems.length,
          id
        ]
      );

      // Recreate line items
      await conn.query(`DELETE FROM aura_sale_order_items WHERE sale_order_id = ?`, [id]);

      for (const item of processedItems) {
        await conn.query(
          `INSERT INTO aura_sale_order_items (
            sale_order_id, product_id, product_code, product_name, product_type, option_id,
            real_unit_price, net_unit_price, unit_price, quantity, unit_quantity,
            product_unit_id, product_unit_code, warehouse_id, item_tax, tax_rate_id,
            tax, discount, item_discount, subtotal, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            item.product_id,
            item.product_code,
            item.product_name,
            item.product_type,
            item.option_id,
            item.real_unit_price,
            item.net_unit_price,
            item.unit_price,
            item.quantity,
            item.unit_quantity,
            item.product_unit_id,
            item.product_unit_code,
            item.warehouse_id,
            item.item_tax,
            item.tax_rate_id,
            item.tax,
            item.discount,
            item.item_discount,
            item.subtotal,
            item.comment
          ]
        );
      }

      await conn.commit();
      return { id, reference_no: existing.reference_no };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Delete a Sales Order safely
   */
  async deleteSaleOrder(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query(`SELECT id, sale_status, sale_id FROM aura_sales_order WHERE id = ?`, [id]);
      if (existing.length === 0) {
        throw new Error('Sales order not found');
      }

      if (existing[0].sale_status === 'completed' && existing[0].sale_id) {
        throw new Error('Cannot delete this Sale Order because it has already been converted to an active Commercial Sale (Invoice).');
      }

      // Delete items
      await conn.query(`DELETE FROM aura_sale_order_items WHERE sale_order_id = ?`, [id]);

      // Delete payments/deposits tied specifically to this order
      await conn.query(`DELETE FROM aura_payments WHERE sale_order_id = ?`, [id]);

      // Delete order record
      await conn.query(`DELETE FROM aura_sales_order WHERE id = ?`, [id]);

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Update Sales Order status (e.g. approve, reject, or mark completed)
   */
  async updateStatus(id, { sale_status, order_status, note = '' }, userId = 1) {
    const updateFields = [];
    const params = [];

    if (sale_status) {
      updateFields.push('sale_status = ?');
      params.push(sale_status);
    }
    if (order_status) {
      updateFields.push('order_status = ?');
      params.push(order_status);
    }
    if (note) {
      updateFields.push('note = CONCAT(COALESCE(note, ""), ?)');
      params.push(`\n[Status update: ${new Date().toISOString()}] ${note}`);
    }

    updateFields.push('updated_by = ?');
    params.push(userId);
    updateFields.push('updated_at = NOW()');

    params.push(id);

    await db.query(`UPDATE aura_sales_order SET ${updateFields.join(', ')} WHERE id = ?`, params);
    return true;
  },

  /**
   * Convert an approved Sales Order into a Commercial Sale (Invoice)
   * Exact match to AURA_v1 Sales.php add($sale_order_id)
   */
  async convertToSale(id, userId = 1) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [orderRows] = await conn.query(`SELECT * FROM aura_sales_order WHERE id = ?`, [id]);
      if (orderRows.length === 0) {
        throw new Error('Sales order not found');
      }
      const order = orderRows[0];

      if (order.sale_status === 'completed' && order.sale_id) {
        throw new Error(`This Sale Order has already been converted to Sale #${order.sale_id}`);
      }

      // Fetch items
      const [orderItems] = await conn.query(`SELECT * FROM aura_sale_order_items WHERE sale_order_id = ?`, [id]);
      if (orderItems.length === 0) {
        throw new Error('Sales order has no products to convert.');
      }

      // Generate next commercial sale reference
      const date = new Date();
      const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
      const [countRows] = await conn.query(`SELECT COUNT(*) AS total FROM aura_sales`);
      const nextNum = (countRows[0]?.total || 0) + 1;
      const saleReference = `SALE-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

      // Insert into aura_sales
      const [saleInsert] = await conn.query(
        `INSERT INTO aura_sales (
          date, reference_no, biller_id, biller, customer_id, customer,
          warehouse_id, note, staff_note, total, product_discount, order_discount,
          total_discount, product_tax, order_tax, total_tax, shipping, grand_total,
          sale_status, payment_status, payment_term, due_date, created_by,
          total_items, paid, pos, so_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          new Date(),
          saleReference,
          order.biller_id,
          order.biller,
          order.customer_id,
          order.customer,
          order.warehouse_id,
          order.note || `Generated from Sale Order ${order.reference_no}`,
          order.staff_note || '',
          order.total,
          order.product_discount,
          order.order_discount,
          order.total_discount,
          order.product_tax,
          order.order_tax,
          order.total_tax,
          order.shipping,
          order.grand_total,
          'completed',
          order.paid >= order.grand_total ? 'paid' : order.paid > 0 ? 'partial' : 'due',
          order.payment_term,
          order.due_date,
          userId,
          orderItems.length,
          order.paid,
          order.id
        ]
      );

      const newSaleId = saleInsert.insertId;

      // Insert sale items and deduct inventory
      for (const it of orderItems) {
        await conn.query(
          `INSERT INTO aura_sale_items (
            sale_id, product_id, product_code, product_name, product_type, option_id,
            net_unit_price, unit_price, quantity, unit_quantity, product_unit_id,
            product_unit_code, warehouse_id, item_tax, tax_rate_id, tax,
            discount, item_discount, subtotal, comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newSaleId,
            it.product_id,
            it.product_code,
            it.product_name,
            it.product_type,
            it.option_id,
            it.net_unit_price,
            it.unit_price,
            it.quantity,
            it.unit_quantity,
            it.product_unit_id,
            it.product_unit_code,
            it.warehouse_id,
            it.item_tax,
            it.tax_rate_id,
            it.tax,
            it.discount,
            it.item_discount,
            it.subtotal,
            it.comment
          ]
        );

        // Log stock movement (triggers warehouse product stock update matching AURA_v1)
        if (it.product_type === 'standard' && it.product_id > 0) {
          await conn.query(
            `INSERT INTO aura_stock_movement
             (
               date, reference_no, transaction, transaction_id, warehouse_id,
               product_id, product_type, product_code, product_name, real_unit_cost,
               quantity, unit_quantity, unit_code, unit_id, option_id, user_id
             )
             VALUES (?, ?, 'Sales', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              new Date(),
              saleReference,
              newSaleId,
              it.warehouse_id || order.warehouse_id,
              it.product_id,
              it.product_type || 'standard',
              it.product_code || '',
              it.product_name || '',
              Number(it.real_unit_price || it.net_unit_price || 0),
              0 - Number(it.quantity || 1),
              0 - Number(it.unit_quantity || it.quantity || 1),
              it.product_unit_code || 'Unit',
              it.product_unit_id || 1,
              it.option_id || null,
              userId
            ]
          );
        }
      }

      // Transfer any deposits over to the sale
      await conn.query(
        `UPDATE aura_payments SET sale_id = ? WHERE sale_order_id = ?`,
        [newSaleId, id]
      );

      // Update Sales Order status to completed
      await conn.query(
        `UPDATE aura_sales_order SET
          sale_status = 'completed',
          order_status = 'approved',
          sale_id = ?
        WHERE id = ?`,
        [newSaleId, id]
      );

      await conn.commit();
      return { saleId: newSaleId, referenceNo: saleReference };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Add a deposit payment for this Sales Order
   */
  async addDeposit(orderId, paymentData, userId = 1) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [orderRows] = await conn.query(`SELECT * FROM aura_sales_order WHERE id = ?`, [orderId]);
      if (orderRows.length === 0) throw new Error('Sales order not found');
      const order = orderRows[0];

      const amount = parseFloat(paymentData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Valid deposit payment amount is required');
      }

      const payDate = paymentData.date ? new Date(paymentData.date) : new Date();
      const referenceNo = paymentData.reference_no || `DEP-${order.reference_no}-${Date.now().toString().slice(-4)}`;

      await conn.query(
        `INSERT INTO aura_payments (
          date, sale_order_id, sale_id, reference_no, amount, paid_by, note, created_by, type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payDate,
          orderId,
          order.sale_id || null,
          referenceNo,
          amount,
          paymentData.paid_by || 'cash',
          paymentData.note || 'Customer Advance Deposit',
          userId,
          'received'
        ]
      );

      const newPaid = parseFloat(order.paid || 0) + amount;
      let paymentStatus = 'partial';
      if (newPaid >= parseFloat(order.grand_total)) {
        paymentStatus = 'paid';
      }

      await conn.query(
        `UPDATE aura_sales_order SET paid = ?, payment_status = ? WHERE id = ?`,
        [newPaid, paymentStatus, orderId]
      );

      await conn.commit();
      return { id: orderId, paid: newPaid, payment_status: paymentStatus };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
};

module.exports = SalesOrderModel;
