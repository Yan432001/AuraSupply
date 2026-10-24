const db = require('../../config/utill/connection');
const { unitToBaseQty, convertToBasePrice } = require('../../utils/unitConverter');

/**
 * Sales Model for Aura ERP
 * Strictly replicated from AURA_v1 (Sales_model.php and Pos_model.php)
 * Handles Sales CRUD, variant selection, multi-unit conversions,
 * stock movement ledger integration, supplier/customer payments, and safe deletion.
 */
const SalesModel = {
  /**
   * Generate next sale reference number (e.g. SALE-202610-0001 or SL-0001)
   */
  async generateNextReference(prefix = 'SALE') {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const pattern = `${prefix}-${yearMonth}-%`;

    const [rows] = await db.query(
      `SELECT reference_no FROM aura_sales WHERE reference_no LIKE ? ORDER BY id DESC LIMIT 1`,
      [pattern]
    );

    if (rows && rows.length > 0 && rows[0].reference_no) {
      const parts = rows[0].reference_no.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        return `${prefix}-${yearMonth}-${String(lastSeq + 1).padStart(4, '0')}`;
      }
    }

    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM aura_sales`);
    const nextNum = (countRows[0]?.total || 0) + 1;
    return `${prefix}-${yearMonth}-${String(nextNum).padStart(4, '0')}`;
  },

  /**
   * Get paginated sales list with search, filters, and summary metrics
   */
  async getSales({
    search = '',
    sale_status = 'all',
    payment_status = 'all',
    customer_id = null,
    biller_id = null,
    warehouse_id = null,
    pos_type = 'all', // 'all' | 'pos' | 'standard'
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
      whereConditions.push('(s.reference_no LIKE ? OR s.customer LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR s.note LIKE ? OR s.biller LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    if (sale_status && sale_status !== 'all') {
      whereConditions.push('s.sale_status = ?');
      params.push(sale_status);
    }

    if (payment_status && payment_status !== 'all') {
      if (payment_status === 'due' || payment_status === 'unpaid') {
        whereConditions.push('(s.payment_status IN ("due", "unpaid") OR s.payment_status IS NULL OR s.paid = 0)');
      } else {
        whereConditions.push('s.payment_status = ?');
        params.push(payment_status);
      }
    }

    if (customer_id && customer_id !== 'all') {
      whereConditions.push('s.customer_id = ?');
      params.push(parseInt(customer_id, 10));
    }

    if (biller_id && biller_id !== 'all') {
      whereConditions.push('s.biller_id = ?');
      params.push(parseInt(biller_id, 10));
    }

    if (warehouse_id && warehouse_id !== 'all') {
      whereConditions.push('s.warehouse_id = ?');
      params.push(parseInt(warehouse_id, 10));
    }

    if (pos_type === 'pos') {
      whereConditions.push('s.pos = 1');
    } else if (pos_type === 'standard') {
      whereConditions.push('s.pos = 0');
    }

    if (start_date) {
      whereConditions.push('DATE(s.date) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(s.date) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    // Order column safely
    const allowedSortFields = ['id', 'reference_no', 'date', 'customer', 'grand_total', 'paid', 'sale_status', 'payment_status'];
    const orderCol = allowedSortFields.includes(sortBy) ? `s.${sortBy}` : 's.id';
    const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count total rows matching filters
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM aura_sales s LEFT JOIN aura_companies c ON s.customer_id = c.id WHERE ${whereClause}`,
      params
    );
    const totalRecords = countRows[0]?.total || 0;

    // Pagination
    const numLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const numPage = Math.max(parseInt(page, 10) || 1, 1);
    const numOffset = (numPage - 1) * numLimit;

    // Query sales list
    const query = `
      SELECT 
        s.*,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        u.username AS cashier_username,
        u.first_name AS cashier_first_name,
        u.last_name AS cashier_last_name,
        (SELECT COUNT(*) FROM aura_sale_items si WHERE si.sale_id = s.id) AS items_count,
        (SELECT COALESCE(SUM(si.quantity), 0) FROM aura_sale_items si WHERE si.sale_id = s.id) AS total_quantity
      FROM aura_sales s
      LEFT JOIN aura_companies c ON s.customer_id = c.id
      LEFT JOIN aura_warehouses w ON s.warehouse_id = w.id
      LEFT JOIN aura_users u ON s.created_by = u.id
      WHERE ${whereClause}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ${numLimit} OFFSET ${numOffset}
    `;

    const [rows] = await db.query(query, params);

    // Compute metrics across entire table
    const [statsRows] = await db.query(`
      SELECT 
        COUNT(*) AS total_sales,
        COALESCE(SUM(grand_total), 0) AS total_revenue,
        COALESCE(SUM(paid), 0) AS total_paid,
        COALESCE(SUM(grand_total - paid), 0) AS total_balance,
        SUM(CASE WHEN sale_status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN sale_status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN sale_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
        SUM(CASE WHEN pos = 1 THEN 1 ELSE 0 END) AS pos_count,
        SUM(CASE WHEN pos = 0 THEN 1 ELSE 0 END) AS standard_count,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
        SUM(CASE WHEN payment_status = 'partial' THEN 1 ELSE 0 END) AS partial_paid_count,
        SUM(CASE WHEN payment_status IN ('due', 'unpaid') OR payment_status IS NULL OR paid = 0 THEN 1 ELSE 0 END) AS unpaid_count
      FROM aura_sales
    `);

    const stats = statsRows[0] || {};

    return {
      records: rows.map(s => {
        const grandTotal = parseFloat(s.grand_total || 0);
        const paid = parseFloat(s.paid || 0);
        const balance = Math.max(0, grandTotal - paid);

        let payStatus = s.payment_status || 'due';
        if (paid >= grandTotal && grandTotal > 0) {
          payStatus = 'paid';
        } else if (paid > 0 && paid < grandTotal) {
          payStatus = 'partial';
        } else if (paid === 0) {
          payStatus = 'due';
        }

        const cashierName = [s.cashier_first_name, s.cashier_last_name].filter(Boolean).join(' ') || s.cashier_username || 'Admin';

        return {
          id: s.id,
          key: s.id,
          referenceNo: s.reference_no,
          date: s.date,
          dueDate: s.due_date,
          customerId: s.customer_id,
          customer: s.customer || s.customer_name || 'General Customer',
          customerPhone: s.customer_phone || '',
          customerEmail: s.customer_email || '',
          billerId: s.biller_id,
          biller: s.biller || 'Aura Supply HQ',
          warehouseId: s.warehouse_id,
          warehouseName: s.warehouse_name || `Warehouse #${s.warehouse_id}`,
          cashier: cashierName,
          pos: Boolean(s.pos),
          saleStatus: s.sale_status || 'completed',
          paymentStatus: payStatus,
          total: parseFloat(s.total || 0),
          productDiscount: parseFloat(s.product_discount || 0),
          orderDiscount: parseFloat(s.order_discount || 0),
          totalDiscount: parseFloat(s.total_discount || 0),
          productTax: parseFloat(s.product_tax || 0),
          orderTax: parseFloat(s.order_tax || 0),
          totalTax: parseFloat(s.total_tax || 0),
          shipping: parseFloat(s.shipping || 0),
          grandTotal: grandTotal,
          paid: paid,
          balance: balance,
          itemsCount: parseInt(s.items_count, 10) || 0,
          totalQuantity: parseFloat(s.total_quantity || 0),
          note: s.note || '',
          staffNote: s.staff_note || ''
        };
      }),
      pagination: {
        page: numPage,
        limit: numLimit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / numLimit) || 1
      },
      metrics: {
        totalSales: parseInt(stats.total_sales, 10) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        totalPaid: parseFloat(stats.total_paid) || 0,
        totalBalance: parseFloat(stats.total_balance) || 0,
        completedCount: parseInt(stats.completed_count, 10) || 0,
        pendingCount: parseInt(stats.pending_count, 10) || 0,
        cancelledCount: parseInt(stats.cancelled_count, 10) || 0,
        posCount: parseInt(stats.pos_count, 10) || 0,
        standardCount: parseInt(stats.standard_count, 10) || 0,
        paidCount: parseInt(stats.paid_count, 10) || 0,
        partialPaidCount: parseInt(stats.partial_paid_count, 10) || 0,
        unpaidCount: parseInt(stats.unpaid_count, 10) || 0
      }
    };
  },

  /**
   * Get single sale details by ID with line items, variants, units, payments, and stock movements
   */
  async getSaleById(id) {
    const saleId = parseInt(id, 10);
    if (!saleId) return null;

    const [sales] = await db.query(
      `
      SELECT 
        s.*,
        c.name AS customer_name,
        c.company AS customer_company,
        c.email AS customer_email,
        c.phone AS customer_phone,
        c.address AS customer_address,
        c.city AS customer_city,
        c.vat_no AS customer_vat_no,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        w.address AS warehouse_address,
        b.name AS biller_name,
        b.company AS biller_company,
        b.phone AS biller_phone,
        b.email AS biller_email,
        b.address AS biller_address,
        u.username AS cashier_username,
        u.first_name AS cashier_first_name,
        u.last_name AS cashier_last_name
      FROM aura_sales s
      LEFT JOIN aura_companies c ON s.customer_id = c.id
      LEFT JOIN aura_warehouses w ON s.warehouse_id = w.id
      LEFT JOIN aura_companies b ON s.biller_id = b.id
      LEFT JOIN aura_users u ON s.created_by = u.id
      WHERE s.id = ?
      LIMIT 1
      `,
      [saleId]
    );

    if (!sales || sales.length === 0) {
      return null;
    }

    const s = sales[0];

    // Fetch Line Items with variant attributes and units
    const [items] = await db.query(
      `
      SELECT 
        si.*,
        pv.name AS variant_name,
        pv.cost AS variant_cost,
        pv.price AS variant_price,
        u.name AS unit_name,
        p.image AS product_image,
        p.category_id,
        p.tax_rate AS product_tax_rate
      FROM aura_sale_items si
      LEFT JOIN aura_product_variants pv ON si.option_id = pv.id
      LEFT JOIN aura_units u ON si.product_unit_id = u.id
      LEFT JOIN aura_products p ON si.product_id = p.id
      WHERE si.sale_id = ?
      ORDER BY si.id ASC
      `,
      [saleId]
    );

    // Fetch Payments
    const [payments] = await db.query(
      `
      SELECT 
        id,
        date,
        reference_no,
        amount,
        paid_by,
        cheque_no,
        cc_no,
        cc_holder,
        note,
        created_by
      FROM aura_payments
      WHERE sale_id = ?
      ORDER BY id DESC
      `,
      [saleId]
    );

    // Fetch Stock Movements logged for this sale
    const [movements] = await db.query(
      `
      SELECT 
        id,
        date,
        reference_no,
        transaction,
        product_id,
        product_code,
        product_name,
        option_id,
        quantity,
        unit_quantity,
        unit_code,
        warehouse_id,
        real_unit_cost,
        user_id
      FROM aura_stock_movement
      WHERE transaction_id = ? AND transaction IN ('Sales', 'POS', 'Sale Reversal')
      ORDER BY id ASC
      `,
      [saleId]
    );

    const grandTotal = parseFloat(s.grand_total || 0);
    const paid = parseFloat(s.paid || 0);
    const balance = Math.max(0, grandTotal - paid);

    const cashierName = [s.cashier_first_name, s.cashier_last_name].filter(Boolean).join(' ') || s.cashier_username || 'Admin';

    return {
      id: s.id,
      key: s.id,
      referenceNo: s.reference_no,
      date: s.date,
      dueDate: s.due_date,
      customerId: s.customer_id,
      customer: s.customer || s.customer_name || 'General Customer',
      customerDetails: {
        name: s.customer_name || s.customer || 'General Customer',
        company: s.customer_company || '-',
        email: s.customer_email || '',
        phone: s.customer_phone || '',
        address: s.customer_address || '',
        city: s.customer_city || '',
        vatNo: s.customer_vat_no || ''
      },
      billerId: s.biller_id,
      biller: s.biller || s.biller_name || 'Aura Supply HQ',
      billerDetails: {
        name: s.biller_name || s.biller || 'Aura Supply HQ',
        company: s.biller_company || 'Aura Supply HQ',
        phone: s.biller_phone || '',
        email: s.biller_email || '',
        address: s.biller_address || ''
      },
      warehouseId: s.warehouse_id,
      warehouseName: s.warehouse_name || `Warehouse #${s.warehouse_id}`,
      warehouseCode: s.warehouse_code || 'HQ',
      warehouseAddress: s.warehouse_address || '',
      cashier: cashierName,
      pos: Boolean(s.pos),
      saleStatus: s.sale_status || 'completed',
      paymentStatus: s.payment_status || 'due',
      note: s.note || '',
      staffNote: s.staff_note || '',
      total: parseFloat(s.total || 0),
      productDiscount: parseFloat(s.product_discount || 0),
      orderDiscount: parseFloat(s.order_discount || 0),
      totalDiscount: parseFloat(s.total_discount || 0),
      productTax: parseFloat(s.product_tax || 0),
      orderTax: parseFloat(s.order_tax || 0),
      totalTax: parseFloat(s.total_tax || 0),
      shipping: parseFloat(s.shipping || 0),
      grandTotal: grandTotal,
      paid: paid,
      balance: balance,
      items: items.map(it => ({
        id: it.id,
        saleId: it.sale_id,
        productId: it.product_id,
        productCode: it.product_code,
        productName: it.product_name,
        productImage: it.product_image || null,
        optionId: it.option_id || null,
        variantName: it.variant_name || null,
        unitId: it.product_unit_id,
        unitCode: it.product_unit_code || 'Unit',
        unitName: it.unit_name || it.product_unit_code || 'Unit',
        warehouseId: it.warehouse_id || s.warehouse_id,
        quantity: parseFloat(it.quantity || 0),
        unitQuantity: parseFloat(it.unit_quantity || it.quantity || 0),
        unitPrice: parseFloat(it.unit_price || it.net_unit_price || 0),
        netUnitPrice: parseFloat(it.net_unit_price || it.unit_price || 0),
        realUnitPrice: parseFloat(it.real_unit_price || it.unit_price || 0),
        itemDiscount: parseFloat(it.item_discount || 0),
        discount: it.discount || '0',
        itemTax: parseFloat(it.item_tax || 0),
        tax: it.tax || '0',
        subtotal: parseFloat(it.subtotal || 0),
        serialNo: it.serial_no || '',
        comment: it.comment || ''
      })),
      payments: payments.map(p => ({
        id: p.id,
        date: p.date,
        referenceNo: p.reference_no,
        amount: parseFloat(p.amount || 0),
        paidBy: p.paid_by || 'cash',
        chequeNo: p.cheque_no || '',
        ccNo: p.cc_no || '',
        ccHolder: p.cc_holder || '',
        note: p.note || '',
        createdBy: p.created_by
      })),
      stockMovements: movements.map(sm => ({
        id: sm.id,
        date: sm.date,
        referenceNo: sm.reference_no,
        transaction: sm.transaction,
        productId: sm.product_id,
        productCode: sm.product_code,
        productName: sm.product_name,
        optionId: sm.option_id,
        quantity: parseFloat(sm.quantity || 0),
        unitQuantity: parseFloat(sm.unit_quantity || 0),
        unitCode: sm.unit_code,
        warehouseId: sm.warehouse_id,
        realUnitCost: parseFloat(sm.real_unit_cost || 0)
      }))
    };
  },

  /**
   * Create a new Sale (transactional)
   * Deducts inventory via aura_stock_movement when completed, and records payment if provided
   */
  async createSale(saleData, items = [], payment = null, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      let refNo = saleData.reference_no;
      const isPos = Boolean(saleData.pos);
      if (!refNo || refNo.trim() === '') {
        refNo = await SalesModel.generateNextReference(isPos ? 'POS' : 'SALE');
      }

      // Check duplicate reference
      const [existing] = await conn.query('SELECT id FROM aura_sales WHERE reference_no = ? LIMIT 1', [refNo]);
      if (existing.length > 0) {
        refNo = `${refNo}-${Date.now().toString().slice(-4)}`;
      }

      const customerId = parseInt(saleData.customer_id, 10) || 1;
      let customerName = saleData.customer;
      if (!customerName) {
        const [cRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ?', [customerId]);
        customerName = cRows[0]?.name || cRows[0]?.company || 'General Customer';
      }

      const billerId = parseInt(saleData.biller_id, 10) || 1;
      let billerName = saleData.biller;
      if (!billerName) {
        const [bRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ?', [billerId]);
        billerName = bRows[0]?.name || bRows[0]?.company || 'Aura Supply HQ';
      }

      const warehouseId = parseInt(saleData.warehouse_id, 10) || 1;
      const saleDate = saleData.date || new Date().toISOString().slice(0, 19).replace('T', ' ');
      const dueDate = saleData.due_date || null;
      const saleStatus = saleData.sale_status || 'completed'; // 'completed' | 'pending' | 'draft'
      const note = saleData.note || '';
      const staffNote = saleData.staff_note || '';

      const orderDiscount = parseFloat(saleData.order_discount || 0);
      const orderTax = parseFloat(saleData.order_tax || 0);
      const shipping = parseFloat(saleData.shipping || 0);

      let productSubtotal = 0;
      let productDiscountTotal = 0;
      let productTaxTotal = 0;

      const processedItems = [];
      for (const item of items) {
        const prodId = parseInt(item.product_id, 10) || 0;
        const optId = item.option_id ? parseInt(item.option_id, 10) : null;
        const itemQty = Math.max(parseFloat(item.quantity) || 1, 0);
        const unitPrice = Math.max(parseFloat(item.unit_price) || 0, 0);

        // Fetch Unit details
        let unitId = item.product_unit_id || item.unit_id || null;
        let unitCode = item.product_unit_code || item.unit_code || null;
        let unitObj = null;

        if (unitId) {
          const [uRows] = await conn.query('SELECT * FROM aura_units WHERE id = ?', [unitId]);
          if (uRows.length) {
            unitObj = uRows[0];
            unitCode = unitObj.code;
          }
        } else if (prodId) {
          const [pRows] = await conn.query(
            'SELECT p.sale_unit, p.unit, u.code, u.operator, u.operation_value FROM aura_products p LEFT JOIN aura_units u ON u.id = COALESCE(p.sale_unit, p.unit) WHERE p.id = ?',
            [prodId]
          );
          if (pRows.length && pRows[0].code) {
            unitId = pRows[0].sale_unit || pRows[0].unit;
            unitCode = pRows[0].code;
            unitObj = pRows[0];
          }
        }

        const baseUnitQty = unitToBaseQty(itemQty, unitObj);
        const baseUnitPrice = convertToBasePrice(unitPrice, unitObj);

        // Item discounts and taxes
        const itemDisc = parseFloat(item.item_discount || item.discount || 0);
        const itemTax = parseFloat(item.item_tax || item.tax || 0);
        const lineSubtotal = Math.max(0, (itemQty * unitPrice) - itemDisc + itemTax);

        productSubtotal += (itemQty * unitPrice);
        productDiscountTotal += itemDisc;
        productTaxTotal += itemTax;

        // Fetch product cost for margin calculation
        let prodCost = parseFloat(item.cost || 0);
        if (!prodCost && prodId) {
          const [costRows] = await conn.query('SELECT cost FROM aura_products WHERE id = ?', [prodId]);
          prodCost = parseFloat(costRows[0]?.cost || 0);
        }

        processedItems.push({
          productId: prodId,
          productCode: item.product_code || '',
          productName: item.product_name || 'Product',
          productType: item.product_type || 'standard',
          unitId: unitId,
          unitCode: unitCode,
          optionId: optId,
          warehouseId: warehouseId,
          quantity: itemQty,
          unitQuantity: baseUnitQty,
          unitPrice: unitPrice,
          netUnitPrice: unitPrice,
          realUnitPrice: unitPrice,
          baseUnitPrice: baseUnitPrice,
          cost: prodCost,
          itemDiscount: itemDisc,
          itemTax: itemTax,
          subtotal: lineSubtotal,
          serialNo: item.serial_no || '',
          comment: item.comment || ''
        });
      }

      const total = productSubtotal;
      const totalDiscount = productDiscountTotal + orderDiscount;
      const totalTax = productTaxTotal + orderTax;
      const grandTotal = Math.max(0, (total - totalDiscount) + totalTax + shipping);

      // Evaluate payment
      const initialPaid = parseFloat(saleData.paid || payment?.amount || 0);
      let paymentStatus = 'due';
      if (initialPaid >= grandTotal && grandTotal > 0) {
        paymentStatus = 'paid';
      } else if (initialPaid > 0) {
        paymentStatus = 'partial';
      }

      // Insert Sale Header
      const [insertResult] = await conn.query(
        `
        INSERT INTO aura_sales
        (
          date, due_date, reference_no, biller_id, biller,
          customer_id, customer, warehouse_id,
          total, product_discount, order_discount, total_discount,
          product_tax, order_tax, total_tax, shipping,
          grand_total, paid, sale_status, payment_status,
          total_items, note, staff_note, pos, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          saleDate,
          dueDate,
          refNo,
          billerId,
          billerName,
          customerId,
          customerName,
          warehouseId,
          total,
          productDiscountTotal,
          orderDiscount,
          totalDiscount,
          productTaxTotal,
          orderTax,
          totalTax,
          shipping,
          grandTotal,
          initialPaid,
          saleStatus,
          paymentStatus,
          processedItems.length,
          note,
          staffNote,
          isPos ? 1 : 0,
          user.id || 1
        ]
      );

      const saleId = insertResult.insertId;

      // Insert Sale Line Items
      for (const it of processedItems) {
        await conn.query(
          `
          INSERT INTO aura_sale_items
          (
            sale_id, product_id, product_code, product_name, product_type,
            option_id, cost, real_unit_price, original_price, net_unit_price,
            unit_price, quantity, unit_quantity, product_unit_id, product_unit_code,
            warehouse_id, item_tax, item_discount, subtotal, serial_no, comment
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            saleId,
            it.productId,
            it.productCode,
            it.productName,
            it.productType,
            it.optionId,
            it.cost,
            it.realUnitPrice,
            it.realUnitPrice,
            it.netUnitPrice,
            it.unitPrice,
            it.quantity,
            it.unitQuantity,
            it.unitId,
            it.unitCode,
            it.warehouseId,
            it.itemTax,
            it.itemDiscount,
            it.subtotal,
            it.serialNo,
            it.comment
          ]
        );

        // If sale is 'completed', deduct inventory via aura_stock_movement (trigger insertStock updates warehouses_products & variants)
        if (saleStatus === 'completed' && it.productId > 0) {
          await conn.query(
            `
            INSERT INTO aura_stock_movement
            (
              date, reference_no, transaction, transaction_id, warehouse_id,
              product_id, product_type, product_code, product_name, real_unit_cost,
              quantity, unit_quantity, unit_code, unit_id, option_id, user_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              saleDate,
              refNo,
              isPos ? 'POS' : 'Sales',
              saleId,
              it.warehouseId,
              it.productId,
              it.productType,
              it.productCode,
              it.productName,
              it.cost,
              -it.quantity,      // Negative to decrement stock
              -it.unitQuantity,  // Negative base unit quantity
              it.unitCode,
              it.unitId,
              it.optionId,
              user.id || 1
            ]
          );
        }
      }

      // Record initial payment in aura_payments if provided
      if (initialPaid > 0) {
        const payRef = payment?.reference_no || `PAY-${refNo}`;
        const paidBy = payment?.paid_by || saleData.paid_by || 'cash';

        await conn.query(
          `
          INSERT INTO aura_payments
          (
            date, sale_id, reference_no, paid_by, amount, amount_usd, type,
            cheque_no, note, created_by
          )
          VALUES (?, ?, ?, ?, ?, ?, 'received', ?, ?, ?)
          `,
          [
            saleDate,
            saleId,
            payRef,
            paidBy,
            initialPaid,
            initialPaid,
            payment?.cheque_no || null,
            payment?.note || 'Initial payment for sale',
            user.id || 1
          ]
        );
      }

      await conn.commit();
      return SalesModel.getSaleById(saleId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Update existing Sale
   */
  async updateSale(id, saleData, items = [], user = {}) {
    const saleId = parseInt(id, 10);
    const existing = await SalesModel.getSaleById(saleId);
    if (!existing) {
      throw new Error(`Sale #${saleId} not found`);
    }

    if (existing.saleStatus === 'cancelled') {
      throw new Error(`Cannot edit a cancelled sale`);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const customerId = parseInt(saleData.customer_id, 10) || existing.customerId;
      let customerName = saleData.customer;
      if (!customerName) {
        const [cRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ?', [customerId]);
        customerName = cRows[0]?.name || cRows[0]?.company || existing.customer;
      }

      const warehouseId = parseInt(saleData.warehouse_id, 10) || existing.warehouseId;
      const billerId = parseInt(saleData.biller_id, 10) || existing.billerId || 1;
      const saleDate = saleData.date || existing.date;
      const dueDate = saleData.due_date || existing.dueDate;
      const saleStatus = saleData.sale_status || existing.saleStatus;
      const note = saleData.note !== undefined ? saleData.note : existing.note;
      const staffNote = saleData.staff_note !== undefined ? saleData.staff_note : existing.staffNote;

      const orderDiscount = parseFloat(saleData.order_discount !== undefined ? saleData.order_discount : existing.orderDiscount);
      const orderTax = parseFloat(saleData.order_tax !== undefined ? saleData.order_tax : existing.orderTax);
      const shipping = parseFloat(saleData.shipping !== undefined ? saleData.shipping : existing.shipping);

      // If items are provided, replace them safely
      if (items && items.length > 0) {
        // 1. If existing sale had completed stock movements, reverse them first
        if (existing.saleStatus === 'completed') {
          for (const oldIt of existing.items) {
            await conn.query(
              `
              INSERT INTO aura_stock_movement
              (
                date, reference_no, transaction, transaction_id, warehouse_id,
                product_id, product_type, product_code, product_name, real_unit_cost,
                quantity, unit_quantity, unit_code, unit_id, option_id, user_id
              )
              VALUES (NOW(), ?, 'Sale Reversal', ?, ?, ?, 'standard', ?, ?, 0, ?, ?, ?, ?, ?, ?)
              `,
              [
                existing.referenceNo,
                saleId,
                oldIt.warehouseId,
                oldIt.productId,
                oldIt.productCode,
                oldIt.productName,
                oldIt.quantity,      // Positive to restore previously deducted stock
                oldIt.unitQuantity,
                oldIt.unitCode,
                oldIt.unitId,
                oldIt.optionId,
                user.id || 1
              ]
            );
          }
        }

        // 2. Delete existing items
        await conn.query('DELETE FROM aura_sale_items WHERE sale_id = ?', [saleId]);

        // 3. Re-insert items
        let productSubtotal = 0;
        let productDiscountTotal = 0;
        let productTaxTotal = 0;

        for (const item of items) {
          const prodId = parseInt(item.product_id, 10) || 0;
          const optId = item.option_id ? parseInt(item.option_id, 10) : null;
          const itemQty = Math.max(parseFloat(item.quantity) || 1, 0);
          const unitPrice = Math.max(parseFloat(item.unit_price) || 0, 0);

          let unitId = item.product_unit_id || item.unit_id || null;
          let unitCode = item.product_unit_code || item.unit_code || null;
          let unitObj = null;

          if (unitId) {
            const [uRows] = await conn.query('SELECT * FROM aura_units WHERE id = ?', [unitId]);
            if (uRows.length) {
              unitObj = uRows[0];
              unitCode = unitObj.code;
            }
          }

          const baseUnitQty = unitToBaseQty(itemQty, unitObj);
          const baseUnitPrice = convertToBasePrice(unitPrice, unitObj);

          const itemDisc = parseFloat(item.item_discount || item.discount || 0);
          const itemTax = parseFloat(item.item_tax || item.tax || 0);
          const lineSubtotal = Math.max(0, (itemQty * unitPrice) - itemDisc + itemTax);

          productSubtotal += (itemQty * unitPrice);
          productDiscountTotal += itemDisc;
          productTaxTotal += itemTax;

          let prodCost = parseFloat(item.cost || 0);
          if (!prodCost && prodId) {
            const [costRows] = await conn.query('SELECT cost FROM aura_products WHERE id = ?', [prodId]);
            prodCost = parseFloat(costRows[0]?.cost || 0);
          }

          await conn.query(
            `
            INSERT INTO aura_sale_items
            (
              sale_id, product_id, product_code, product_name, product_type,
              option_id, cost, real_unit_price, original_price, net_unit_price,
              unit_price, quantity, unit_quantity, product_unit_id, product_unit_code,
              warehouse_id, item_tax, item_discount, subtotal, serial_no, comment
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              saleId,
              prodId,
              item.product_code || '',
              item.product_name || 'Product',
              item.product_type || 'standard',
              optId,
              prodCost,
              unitPrice,
              unitPrice,
              unitPrice,
              unitPrice,
              itemQty,
              baseUnitQty,
              unitId,
              unitCode,
              warehouseId,
              itemTax,
              itemDisc,
              lineSubtotal,
              item.serial_no || '',
              item.comment || ''
            ]
          );

          // If updated status is 'completed', log new stock movement
          if (saleStatus === 'completed' && prodId > 0) {
            await conn.query(
              `
              INSERT INTO aura_stock_movement
              (
                date, reference_no, transaction, transaction_id, warehouse_id,
                product_id, product_type, product_code, product_name, real_unit_cost,
                quantity, unit_quantity, unit_code, unit_id, option_id, user_id
              )
              VALUES (NOW(), ?, ?, ?, ?, ?, 'standard', ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
              [
                existing.referenceNo,
                existing.pos ? 'POS' : 'Sales',
                saleId,
                warehouseId,
                prodId,
                item.product_code || '',
                item.product_name || 'Product',
                prodCost,
                -itemQty,
                -baseUnitQty,
                unitCode,
                unitId,
                optId,
                user.id || 1
              ]
            );
          }
        }

        const total = productSubtotal;
        const totalDiscount = productDiscountTotal + orderDiscount;
        const totalTax = productTaxTotal + orderTax;
        const grandTotal = Math.max(0, (total - totalDiscount) + totalTax + shipping);

        // Recalculate payment status
        let paymentStatus = 'due';
        if (existing.paid >= grandTotal && grandTotal > 0) {
          paymentStatus = 'paid';
        } else if (existing.paid > 0) {
          paymentStatus = 'partial';
        }

        await conn.query(
          `
          UPDATE aura_sales
          SET 
            customer_id = ?, customer = ?, biller_id = ?, warehouse_id = ?,
            date = ?, due_date = ?, note = ?, staff_note = ?,
            total = ?, product_discount = ?, order_discount = ?, total_discount = ?,
            product_tax = ?, order_tax = ?, total_tax = ?, shipping = ?,
            grand_total = ?, payment_status = ?, sale_status = ?,
            total_items = ?, updated_by = ?, updated_at = NOW()
          WHERE id = ?
          `,
          [
            customerId,
            customerName,
            billerId,
            warehouseId,
            saleDate,
            dueDate,
            note,
            staffNote,
            total,
            productDiscountTotal,
            orderDiscount,
            totalDiscount,
            productTaxTotal,
            orderTax,
            totalTax,
            shipping,
            grandTotal,
            paymentStatus,
            saleStatus,
            items.length,
            user.id || 1,
            saleId
          ]
        );
      } else {
        // Metadata only update
        await conn.query(
          `
          UPDATE aura_sales
          SET customer_id = ?, customer = ?, note = ?, staff_note = ?, due_date = ?,
              sale_status = ?, updated_by = ?, updated_at = NOW()
          WHERE id = ?
          `,
          [
            customerId,
            customerName,
            note,
            staffNote,
            dueDate,
            saleStatus,
            user.id || 1,
            saleId
          ]
        );
      }

      await conn.commit();
      return SalesModel.getSaleById(saleId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Update sale status (e.g. pending -> completed -> cancelled)
   * Handles automatic stock deduction on completed, and stock reversal on cancelled
   */
  async updateStatus(id, newStatus, user = {}) {
    const saleId = parseInt(id, 10);
    const sale = await SalesModel.getSaleById(saleId);
    if (!sale) {
      throw new Error(`Sale #${saleId} not found`);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // If cancelling a sale that was previously completed, reverse inventory
      if (newStatus === 'cancelled' && sale.saleStatus === 'completed') {
        for (const it of sale.items) {
          if (it.quantity > 0) {
            await conn.query(
              `
              INSERT INTO aura_stock_movement
              (
                date, reference_no, transaction, transaction_id, warehouse_id,
                product_id, product_type, product_code, product_name, real_unit_cost,
                quantity, unit_quantity, unit_code, unit_id, option_id, user_id
              )
              VALUES (NOW(), ?, 'Sale Reversal', ?, ?, ?, 'standard', ?, ?, 0, ?, ?, ?, ?, ?, ?)
              `,
              [
                sale.referenceNo,
                saleId,
                it.warehouseId,
                it.productId,
                it.productCode,
                it.productName,
                it.quantity,      // Positive to restore stock
                it.unitQuantity,
                it.unitCode,
                it.unitId,
                it.optionId,
                user.id || 1
              ]
            );
          }
        }
      } else if (newStatus === 'completed' && sale.saleStatus !== 'completed') {
        // If moving from pending/draft to completed, deduct stock
        for (const it of sale.items) {
          if (it.quantity > 0) {
            await conn.query(
              `
              INSERT INTO aura_stock_movement
              (
                date, reference_no, transaction, transaction_id, warehouse_id,
                product_id, product_type, product_code, product_name, real_unit_cost,
                quantity, unit_quantity, unit_code, unit_id, option_id, user_id
              )
              VALUES (NOW(), ?, 'Sales', ?, ?, ?, 'standard', ?, ?, 0, ?, ?, ?, ?, ?, ?)
              `,
              [
                sale.referenceNo,
                saleId,
                it.warehouseId,
                it.productId,
                it.productCode,
                it.productName,
                -it.quantity,     // Negative to deduct stock
                -it.unitQuantity,
                it.unitCode,
                it.unitId,
                it.optionId,
                user.id || 1
              ]
            );
          }
        }
      }

      await conn.query(
        `UPDATE aura_sales SET sale_status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?`,
        [newStatus, user.id || 1, saleId]
      );

      await conn.commit();
      return SalesModel.getSaleById(saleId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Record Customer Payment for Sale
   */
  async addPayment(id, paymentData, user = {}) {
    const saleId = parseInt(id, 10);
    const sale = await SalesModel.getSaleById(saleId);
    if (!sale) {
      throw new Error(`Sale #${saleId} not found`);
    }

    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      let payRef = paymentData.reference_no;
      if (!payRef || payRef.trim() === '') {
        const [cnt] = await conn.query('SELECT COUNT(*) AS total FROM aura_payments WHERE sale_id = ?', [saleId]);
        payRef = `PAY-${sale.referenceNo}-${(cnt[0]?.total || 0) + 1}`;
      }

      const payDate = paymentData.date || new Date().toISOString().slice(0, 19).replace('T', ' ');
      const paidBy = paymentData.paid_by || 'cash';
      const chequeNo = paymentData.cheque_no || null;
      const ccNo = paymentData.cc_no || null;
      const ccHolder = paymentData.cc_holder || null;
      const note = paymentData.note || '';

      await conn.query(
        `
        INSERT INTO aura_payments
        (
          date, sale_id, reference_no, paid_by, cheque_no, cc_no, cc_holder,
          amount, amount_usd, type, note, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?)
        `,
        [
          payDate,
          saleId,
          payRef,
          paidBy,
          chequeNo,
          ccNo,
          ccHolder,
          amount,
          amount,
          note,
          user.id || 1
        ]
      );

      // Re-sum payments
      const [sumRows] = await conn.query(
        'SELECT COALESCE(SUM(amount), 0) AS total_paid FROM aura_payments WHERE sale_id = ?',
        [saleId]
      );

      const totalPaid = parseFloat(sumRows[0]?.total_paid || 0);
      let paymentStatus = 'due';
      if (totalPaid >= sale.grandTotal && sale.grandTotal > 0) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }

      await conn.query(
        'UPDATE aura_sales SET paid = ?, payment_status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [totalPaid, paymentStatus, user.id || 1, saleId]
      );

      await conn.commit();
      return SalesModel.getSaleById(saleId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Delete Payment from Sale
   */
  async deletePayment(saleId, paymentId) {
    const sId = parseInt(saleId, 10);
    const payId = parseInt(paymentId, 10);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query('DELETE FROM aura_payments WHERE id = ? AND sale_id = ?', [payId, sId]);

      // Re-sum payments
      const [sumRows] = await conn.query(
        'SELECT COALESCE(SUM(amount), 0) AS total_paid FROM aura_payments WHERE sale_id = ?',
        [sId]
      );

      const totalPaid = parseFloat(sumRows[0]?.total_paid || 0);
      const [sl] = await conn.query('SELECT grand_total FROM aura_sales WHERE id = ?', [sId]);
      const grandTotal = parseFloat(sl[0]?.grand_total || 0);

      let paymentStatus = 'due';
      if (totalPaid >= grandTotal && grandTotal > 0) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }

      await conn.query(
        'UPDATE aura_sales SET paid = ?, payment_status = ?, updated_at = NOW() WHERE id = ?',
        [totalPaid, paymentStatus, sId]
      );

      await conn.commit();
      return SalesModel.getSaleById(sId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Safe Delete Sale
   * Forbids deletion if payments exist or if sale is completed with inventory committed
   */
  async deleteSale(id) {
    const saleId = parseInt(id, 10);
    const sale = await SalesModel.getSaleById(saleId);
    if (!sale) {
      throw new Error(`Sale #${saleId} not found`);
    }

    if (sale.payments && sale.payments.length > 0) {
      throw new Error(`Cannot delete sale #${sale.referenceNo} because it has ${sale.payments.length} associated payment records. Please delete payments first or cancel the sale.`);
    }

    if (sale.saleStatus === 'completed') {
      throw new Error(`Cannot delete sale #${sale.referenceNo} because it has already deducted inventory from the warehouse. Please cancel the sale instead to safely reverse warehouse stock.`);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Delete items
      await conn.query('DELETE FROM aura_sale_items WHERE sale_id = ?', [saleId]);
      // Delete header
      await conn.query('DELETE FROM aura_sales WHERE id = ?', [saleId]);

      await conn.commit();
      return { success: true, message: `Sale #${sale.referenceNo} deleted successfully` };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Metadata options (Customers, Billers, Warehouses, Units, Next Ref)
   */
  async getMetadata() {
    const [customers] = await db.query(
      `SELECT id, name, company, email, phone, address, city FROM aura_companies WHERE group_name = 'customer' ORDER BY name ASC`
    );

    const [billers] = await db.query(
      `SELECT id, name, company, email, phone, address FROM aura_companies WHERE group_name = 'biller' ORDER BY name ASC`
    );

    const [warehouses] = await db.query(
      `SELECT id, code, name, address, phone FROM aura_warehouses ORDER BY name ASC`
    );

    const [units] = await db.query(
      `SELECT id, code, name, base_unit, operator, operation_value FROM aura_units ORDER BY name ASC`
    );

    const nextReference = await SalesModel.generateNextReference('SALE');

    return {
      customers: customers.map(c => ({
        id: c.id,
        name: c.name || c.company || 'Customer',
        company: c.company || '-',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || ''
      })),
      billers: billers.map(b => ({
        id: b.id,
        name: b.name || b.company || 'Biller',
        company: b.company || '-',
        email: b.email || '',
        phone: b.phone || '',
        address: b.address || ''
      })),
      warehouses: warehouses.map(w => ({
        id: w.id,
        code: w.code,
        name: w.name
      })),
      units: units.map(u => ({
        id: u.id,
        code: u.code,
        name: u.name,
        baseUnit: u.base_unit,
        operator: u.operator,
        operationValue: parseFloat(u.operation_value || 1)
      })),
      nextReference
    };
  }
};

module.exports = SalesModel;
