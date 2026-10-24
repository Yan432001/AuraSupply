const db = require('../../config/utill/connection');
const { unitToBaseQty, convertToBasePrice } = require('../../utils/unitConverter');

/**
 * Purchases Model for Aura ERP
 * Aligned with AURA_v1 Purchases_model.php and database schemas
 */
const PurchasesModel = {
  /**
   * Generate next purchase reference number (e.g. PO-202610-0001)
   */
  async generateNextReference() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `PO-${yearMonth}-`;

    const [rows] = await db.query(
      `SELECT reference_no FROM aura_purchases WHERE reference_no LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    if (rows && rows.length > 0 && rows[0].reference_no) {
      const parts = rows[0].reference_no.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        return `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;
      }
    }

    // Also check total purchases count for fallback
    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM aura_purchases`);
    const nextNum = (countRows[0]?.total || 0) + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  },

  /**
   * Get paginated purchases with search, filters, and summary metrics
   */
  async getPurchases({
    search = '',
    status = 'all',
    payment_status = 'all',
    supplier_id = null,
    warehouse_id = null,
    start_date = null,
    end_date = null,
    sortBy = 'id',
    sortOrder = 'DESC',
    page = 1,
    limit = 50
  } = {}) {
    let whereConditions = ['1=1'];
    const params = [];

    if (search && search.trim() !== '') {
      whereConditions.push('(p.reference_no LIKE ? OR p.supplier LIKE ? OR c.name LIKE ? OR c.company LIKE ? OR p.note LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (status && status !== 'all') {
      whereConditions.push('p.status = ?');
      params.push(status);
    }

    if (payment_status && payment_status !== 'all') {
      if (payment_status === 'unpaid' || payment_status === 'due') {
        whereConditions.push('(p.payment_status IN ("due", "unpaid") OR p.payment_status IS NULL OR p.paid = 0)');
      } else {
        whereConditions.push('p.payment_status = ?');
        params.push(payment_status);
      }
    }

    if (supplier_id && supplier_id !== 'all') {
      whereConditions.push('p.supplier_id = ?');
      params.push(parseInt(supplier_id, 10));
    }

    if (warehouse_id && warehouse_id !== 'all') {
      whereConditions.push('p.warehouse_id = ?');
      params.push(parseInt(warehouse_id, 10));
    }

    if (start_date) {
      whereConditions.push('DATE(p.date) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(p.date) <= ?');
      params.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    // Order by safely
    const allowedSortFields = ['id', 'reference_no', 'date', 'supplier', 'grand_total', 'paid', 'status', 'payment_status'];
    const orderCol = allowedSortFields.includes(sortBy) ? `p.${sortBy}` : 'p.id';
    const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count total rows matching filters
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM aura_purchases p LEFT JOIN aura_companies c ON p.supplier_id = c.id WHERE ${whereClause}`,
      params
    );
    const totalRecords = countRows[0]?.total || 0;

    // Pagination bounds
    const numLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const numPage = Math.max(parseInt(page, 10) || 1, 1);
    const numOffset = (numPage - 1) * numLimit;

    // Query purchases list
    const query = `
      SELECT 
        p.*,
        c.name AS supplier_name,
        c.company AS supplier_company,
        c.email AS supplier_email,
        c.phone AS supplier_phone,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        (SELECT COUNT(*) FROM aura_purchase_items pi WHERE pi.purchase_id = p.id) AS items_count,
        (SELECT COALESCE(SUM(pi.quantity), 0) FROM aura_purchase_items pi WHERE pi.purchase_id = p.id) AS total_quantity,
        (SELECT COALESCE(SUM(pi.quantity_received), 0) FROM aura_purchase_items pi WHERE pi.purchase_id = p.id) AS total_received_quantity
      FROM aura_purchases p
      LEFT JOIN aura_companies c ON p.supplier_id = c.id
      LEFT JOIN aura_warehouses w ON p.warehouse_id = w.id
      WHERE ${whereClause}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ${numLimit} OFFSET ${numOffset}
    `;

    const [rows] = await db.query(query, params);

    // Compute metrics across entire table
    const [statsRows] = await db.query(`
      SELECT 
        COUNT(*) AS total_purchases,
        COALESCE(SUM(grand_total), 0) AS total_spend,
        COALESCE(SUM(paid), 0) AS total_paid,
        COALESCE(SUM(grand_total - paid), 0) AS total_balance,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) AS received_count,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) AS partial_count,
        SUM(CASE WHEN status = 'ordered' THEN 1 ELSE 0 END) AS ordered_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
        SUM(CASE WHEN payment_status = 'partial' THEN 1 ELSE 0 END) AS partial_paid_count,
        SUM(CASE WHEN payment_status IN ('due', 'unpaid') OR payment_status IS NULL OR paid = 0 THEN 1 ELSE 0 END) AS unpaid_count
      FROM aura_purchases
    `);

    const stats = statsRows[0] || {};

    return {
      records: rows.map(p => {
        const grandTotal = parseFloat(p.grand_total || 0);
        const paid = parseFloat(p.paid || 0);
        const balance = Math.max(0, grandTotal - paid);

        let paymentStatus = p.payment_status || 'due';
        if (paid >= grandTotal && grandTotal > 0) {
          paymentStatus = 'paid';
        } else if (paid > 0 && paid < grandTotal) {
          paymentStatus = 'partial';
        } else if (paid === 0) {
          paymentStatus = 'due';
        }

        return {
          id: p.id,
          key: p.id,
          referenceNo: p.reference_no,
          orderRef: p.order_ref || '',
          date: p.date,
          dueDate: p.due_date,
          supplierId: p.supplier_id,
          supplier: p.supplier || p.supplier_name || 'General Supplier',
          supplierCompany: p.supplier_company || '',
          supplierPhone: p.supplier_phone || '',
          supplierEmail: p.supplier_email || '',
          warehouseId: p.warehouse_id,
          warehouseName: p.warehouse_name || `Warehouse #${p.warehouse_id}`,
          billerId: p.biller_id,
          status: p.status || 'received',
          paymentStatus: paymentStatus,
          total: parseFloat(p.total || 0),
          productDiscount: parseFloat(p.product_discount || 0),
          orderDiscount: parseFloat(p.order_discount || 0),
          totalDiscount: parseFloat(p.total_discount || 0),
          productTax: parseFloat(p.product_tax || 0),
          orderTax: parseFloat(p.order_tax || 0),
          totalTax: parseFloat(p.total_tax || 0),
          shipping: parseFloat(p.shipping || 0),
          grandTotal: grandTotal,
          paid: paid,
          balance: balance,
          itemsCount: parseInt(p.items_count, 10) || 0,
          totalQuantity: parseFloat(p.total_quantity || 0),
          totalReceivedQuantity: parseFloat(p.total_received_quantity || 0),
          note: p.note || ''
        };
      }),
      pagination: {
        page: numPage,
        limit: numLimit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / numLimit) || 1
      },
      metrics: {
        totalPurchases: parseInt(stats.total_purchases, 10) || 0,
        totalSpend: parseFloat(stats.total_spend) || 0,
        totalPaid: parseFloat(stats.total_paid) || 0,
        totalBalance: parseFloat(stats.total_balance) || 0,
        received: parseInt(stats.received_count, 10) || 0,
        partial: parseInt(stats.partial_count, 10) || 0,
        ordered: parseInt(stats.ordered_count, 10) || 0,
        pending: parseInt(stats.pending_count, 10) || 0,
        draft: parseInt(stats.draft_count, 10) || 0,
        cancelled: parseInt(stats.cancelled_count, 10) || 0,
        paidCount: parseInt(stats.paid_count, 10) || 0,
        partialPaidCount: parseInt(stats.partial_paid_count, 10) || 0,
        unpaidCount: parseInt(stats.unpaid_count, 10) || 0
      }
    };
  },

  /**
   * Get single purchase details by ID with items, variant details, payments, and receipt history
   */
  async getPurchaseById(id) {
    const purchaseId = parseInt(id, 10);
    if (!purchaseId) return null;

    const [purchases] = await db.query(
      `
      SELECT 
        p.*,
        c.name AS supplier_name,
        c.company AS supplier_company,
        c.email AS supplier_email,
        c.phone AS supplier_phone,
        c.address AS supplier_address,
        c.city AS supplier_city,
        c.country AS supplier_country,
        c.vat_no AS supplier_vat_no,
        w.name AS warehouse_name,
        w.code AS warehouse_code,
        w.address AS warehouse_address
      FROM aura_purchases p
      LEFT JOIN aura_companies c ON p.supplier_id = c.id
      LEFT JOIN aura_warehouses w ON p.warehouse_id = w.id
      WHERE p.id = ?
      LIMIT 1
      `,
      [purchaseId]
    );

    if (!purchases || purchases.length === 0) {
      return null;
    }

    const p = purchases[0];

    // Fetch items with variant and unit details
    const [items] = await db.query(
      `
      SELECT 
        pi.*,
        pv.name AS variant_name,
        pv.cost AS variant_cost,
        pv.price AS variant_price,
        u.name AS unit_name,
        p.image AS product_image
      FROM aura_purchase_items pi
      LEFT JOIN aura_product_variants pv ON pi.option_id = pv.id
      LEFT JOIN aura_units u ON pi.product_unit_id = u.id
      LEFT JOIN aura_products p ON pi.product_id = p.id
      WHERE pi.purchase_id = ?
      ORDER BY pi.id ASC
      `,
      [purchaseId]
    );

    // Fetch payments
    const [payments] = await db.query(
      `
      SELECT 
        id,
        date,
        reference_no,
        amount,
        paid_by,
        cheque_no,
        note,
        created_by
      FROM aura_payments
      WHERE purchase_id = ?
      ORDER BY id DESC
      `,
      [purchaseId]
    );

    // Fetch goods receipt stock movements
    const [movements] = await db.query(
      `
      SELECT 
        id,
        date,
        reference_no,
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
      WHERE transaction_id = ? AND transaction = 'Purchases'
      ORDER BY id ASC
      `,
      [purchaseId]
    );

    const grandTotal = parseFloat(p.grand_total || 0);
    const paid = parseFloat(p.paid || 0);
    const balance = Math.max(0, grandTotal - paid);

    return {
      id: p.id,
      key: p.id,
      referenceNo: p.reference_no,
      orderRef: p.order_ref || '',
      requestRef: p.request_ref || '',
      date: p.date,
      dueDate: p.due_date,
      supplierId: p.supplier_id,
      supplier: p.supplier || p.supplier_name || 'General Supplier',
      supplierDetails: {
        name: p.supplier_name || p.supplier || 'General Supplier',
        company: p.supplier_company || '-',
        email: p.supplier_email || '',
        phone: p.supplier_phone || '',
        address: p.supplier_address || '',
        city: p.supplier_city || '',
        country: p.supplier_country || '',
        vatNo: p.supplier_vat_no || ''
      },
      warehouseId: p.warehouse_id,
      warehouseName: p.warehouse_name || `Warehouse #${p.warehouse_id}`,
      warehouseCode: p.warehouse_code || 'HQ',
      warehouseAddress: p.warehouse_address || '',
      billerId: p.biller_id,
      status: p.status || 'received',
      paymentStatus: p.payment_status || 'due',
      note: p.note || '',
      total: parseFloat(p.total || 0),
      productDiscount: parseFloat(p.product_discount || 0),
      orderDiscount: parseFloat(p.order_discount || 0),
      totalDiscount: parseFloat(p.total_discount || 0),
      productTax: parseFloat(p.product_tax || 0),
      orderTax: parseFloat(p.order_tax || 0),
      totalTax: parseFloat(p.total_tax || 0),
      shipping: parseFloat(p.shipping || 0),
      grandTotal: grandTotal,
      paid: paid,
      balance: balance,
      items: items.map(it => {
        const qty = parseFloat(it.quantity || 0);
        const qtyRcvd = parseFloat(it.quantity_received || 0);
        const qtyBal = it.quantity_balance !== null ? parseFloat(it.quantity_balance) : Math.max(0, qty - qtyRcvd);

        return {
          id: it.id,
          purchaseId: it.purchase_id,
          productId: it.product_id,
          productCode: it.product_code,
          productName: it.product_name,
          productImage: it.product_image || null,
          optionId: it.option_id || null,
          variantName: it.variant_name || null,
          unitId: it.product_unit_id,
          unitCode: it.product_unit_code || 'Unit',
          unitName: it.unit_name || it.product_unit_code || 'Unit',
          warehouseId: it.warehouse_id,
          quantity: qty,
          unitQuantity: parseFloat(it.unit_quantity || qty),
          quantityReceived: qtyRcvd,
          quantityBalance: qtyBal,
          unitCost: parseFloat(it.unit_cost || 0),
          realUnitCost: parseFloat(it.real_unit_cost || it.unit_cost || 0),
          baseUnitCost: parseFloat(it.base_unit_cost || it.unit_cost || 0),
          itemDiscount: parseFloat(it.item_discount || 0),
          discount: it.discount || '0',
          itemTax: parseFloat(it.item_tax || 0),
          tax: it.tax || '0',
          subtotal: parseFloat(it.subtotal || 0),
          status: it.status || p.status,
          expiry: it.expiry || null
        };
      }),
      payments: payments.map(pay => ({
        id: pay.id,
        date: pay.date,
        referenceNo: pay.reference_no,
        amount: parseFloat(pay.amount || 0),
        paidBy: pay.paid_by || 'cash',
        chequeNo: pay.cheque_no || '',
        note: pay.note || '',
        createdBy: pay.created_by
      })),
      stockMovements: movements.map(sm => ({
        id: sm.id,
        date: sm.date,
        referenceNo: sm.reference_no,
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
   * Create a purchase order with items, calculation, and stock receipt handling
   */
  async createPurchase(purchaseData, items = [], user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      let refNo = purchaseData.reference_no;
      if (!refNo || refNo.trim() === '') {
        refNo = await PurchasesModel.generateNextReference();
      }

      // Check unique reference
      const [existingRef] = await conn.query(
        'SELECT id FROM aura_purchases WHERE reference_no = ? LIMIT 1',
        [refNo]
      );
      if (existingRef.length > 0) {
        refNo = `${refNo}-${Date.now().toString().slice(-4)}`;
      }

      const supplierId = parseInt(purchaseData.supplier_id, 10) || 1;
      let supplierName = purchaseData.supplier;
      if (!supplierName) {
        const [supRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ?', [supplierId]);
        supplierName = supRows[0]?.name || supRows[0]?.company || 'General Supplier';
      }

      const warehouseId = parseInt(purchaseData.warehouse_id, 10) || 1;
      const billerId = parseInt(purchaseData.biller_id, 10) || 1;
      const purchaseDate = purchaseData.date || new Date().toISOString().slice(0, 19).replace('T', ' ');
      const dueDate = purchaseData.due_date || null;
      const initialStatus = purchaseData.status || 'received'; // 'draft', 'pending', 'ordered', 'received'
      const note = purchaseData.note || '';

      const orderDiscount = parseFloat(purchaseData.order_discount || 0);
      const orderTax = parseFloat(purchaseData.order_tax || 0);
      const shipping = parseFloat(purchaseData.shipping || 0);

      // Pre-calculate items subtotals
      let productSubtotal = 0;
      let productDiscountTotal = 0;
      let productTaxTotal = 0;

      const processedItems = [];
      for (const item of items) {
        const prodId = parseInt(item.product_id, 10) || 0;
        const optId = item.option_id ? parseInt(item.option_id, 10) : null;
        const itemQty = Math.max(parseFloat(item.quantity) || 1, 0);
        const unitCost = Math.max(parseFloat(item.unit_cost) || 0, 0);

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
            'SELECT p.purchase_unit, p.unit, u.code, u.operator, u.operation_value FROM aura_products p LEFT JOIN aura_units u ON u.id = COALESCE(p.purchase_unit, p.unit) WHERE p.id = ?',
            [prodId]
          );
          if (pRows.length && pRows[0].code) {
            unitId = pRows[0].purchase_unit || pRows[0].unit;
            unitCode = pRows[0].code;
            unitObj = pRows[0];
          }
        }

        const baseUnitQty = unitToBaseQty(itemQty, unitObj);
        const baseUnitCost = convertToBasePrice(unitCost, unitObj);

        // Discounts and taxes per item
        const itemDisc = parseFloat(item.item_discount || item.discount || 0);
        const itemTax = parseFloat(item.item_tax || item.tax || 0);
        const lineTotal = Math.max(0, (itemQty * unitCost) - itemDisc + itemTax);

        productSubtotal += (itemQty * unitCost);
        productDiscountTotal += itemDisc;
        productTaxTotal += itemTax;

        // If status is received, immediately mark all received
        const qtyReceived = (initialStatus === 'received') ? itemQty : 0;
        const qtyBalance = (initialStatus === 'received') ? 0 : itemQty;

        processedItems.push({
          productId: prodId,
          productCode: item.product_code || '',
          productName: item.product_name || 'Product',
          productType: item.product_type || 'standard',
          unitId: unitId,
          unitCode: unitCode,
          unitObj: unitObj,
          optionId: optId,
          warehouseId: warehouseId,
          quantity: itemQty,
          unitQuantity: baseUnitQty,
          quantityReceived: qtyReceived,
          quantityBalance: qtyBalance,
          unitCost: unitCost,
          realUnitCost: unitCost,
          baseUnitCost: baseUnitCost,
          itemDiscount: itemDisc,
          itemTax: itemTax,
          subtotal: lineTotal,
          expiry: item.expiry || null,
          status: initialStatus
        });
      }

      const total = productSubtotal;
      const totalDiscount = productDiscountTotal + orderDiscount;
      const totalTax = productTaxTotal + orderTax;
      const grandTotal = Math.max(0, (total - totalDiscount) + totalTax + shipping);

      const paid = parseFloat(purchaseData.paid || 0);
      let paymentStatus = 'due';
      if (paid >= grandTotal && grandTotal > 0) {
        paymentStatus = 'paid';
      } else if (paid > 0) {
        paymentStatus = 'partial';
      }

      // Insert Purchase Header
      const [insertResult] = await conn.query(
        `
        INSERT INTO aura_purchases 
        (
          reference_no, order_ref, request_ref, date, due_date,
          supplier_id, supplier, biller_id, warehouse_id, note,
          total, product_discount, order_discount, total_discount,
          product_tax, order_tax, total_tax, shipping,
          grand_total, paid, status, payment_status, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          refNo,
          purchaseData.order_ref || '',
          purchaseData.request_ref || '',
          purchaseDate,
          dueDate,
          supplierId,
          supplierName,
          billerId,
          warehouseId,
          note,
          total,
          productDiscountTotal,
          orderDiscount,
          totalDiscount,
          productTaxTotal,
          orderTax,
          totalTax,
          shipping,
          grandTotal,
          paid,
          initialStatus,
          paymentStatus,
          user.id || 1
        ]
      );

      const purchaseId = insertResult.insertId;

      // Insert Purchase Items
      for (const it of processedItems) {
        await conn.query(
          `
          INSERT INTO aura_purchase_items
          (
            purchase_id, product_id, product_type, product_code, product_name,
            product_unit_id, product_unit_code, warehouse_id, option_id,
            quantity, unit_quantity, quantity_received, quantity_balance,
            unit_cost, real_unit_cost, net_unit_cost, base_unit_cost,
            item_discount, item_tax, subtotal, status, expiry, date
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            purchaseId,
            it.productId,
            it.productType,
            it.productCode,
            it.productName,
            it.unitId,
            it.unitCode,
            it.warehouseId,
            it.optionId,
            it.quantity,
            it.unitQuantity,
            it.quantityReceived,
            it.quantityBalance,
            it.unitCost,
            it.realUnitCost,
            it.unitCost,
            it.baseUnitCost,
            it.itemDiscount,
            it.itemTax,
            it.subtotal,
            it.status,
            it.expiry,
            purchaseDate
          ]
        );

        // If status is 'received', insert stock movement (DB trigger updates warehouses_products & variants)
        if (initialStatus === 'received' && it.productId > 0) {
          await conn.query(
            `
            INSERT INTO aura_stock_movement
            (
              date, reference_no, transaction, transaction_id,
              warehouse_id, product_id, product_type, product_code, product_name,
              real_unit_cost, quantity, unit_quantity, unit_code, unit_id,
              option_id, expiry, user_id
            )
            VALUES (?, ?, 'Purchases', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              purchaseDate,
              refNo,
              purchaseId,
              it.warehouseId,
              it.productId,
              it.productType,
              it.productCode,
              it.productName,
              it.baseUnitCost,
              it.quantity,
              it.unitQuantity,
              it.unitCode,
              it.unitId,
              it.optionId,
              it.expiry,
              user.id || 1
            ]
          );
        }
      }

      // If initial payment is provided, record it in aura_payments
      if (paid > 0) {
        const payRef = `PAY-${refNo}`;
        await conn.query(
          `
          INSERT INTO aura_payments
          (
            date, purchase_id, reference_no, paid_by, amount, amount_usd, type, note, created_by
          )
          VALUES (?, ?, ?, ?, ?, ?, 'sent', 'Initial purchase payment', ?)
          `,
          [
            purchaseDate,
            purchaseId,
            payRef,
            purchaseData.paid_by || 'cash',
            paid,
            paid,
            user.id || 1
          ]
        );
      }

      await conn.commit();
      return PurchasesModel.getPurchaseById(purchaseId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Update purchase order
   * Disallows item destruction if goods are already received
   */
  async updatePurchase(id, purchaseData, items = [], user = {}) {
    const purchaseId = parseInt(id, 10);
    const existing = await PurchasesModel.getPurchaseById(purchaseId);
    if (!existing) {
      throw new Error(`Purchase order #${purchaseId} not found`);
    }

    // Safety checks: If already received or partially received, prevent destructive line rewriting
    if (existing.status === 'received' || existing.status === 'partial') {
      // Allow only metadata update (note, due_date, supplier info)
      await db.query(
        `
        UPDATE aura_purchases 
        SET note = ?, due_date = ?, order_ref = ?, updated_by = ?, updated_at = NOW()
        WHERE id = ?
        `,
        [
          purchaseData.note || existing.note,
          purchaseData.due_date || existing.dueDate,
          purchaseData.order_ref || existing.orderRef,
          user.id || 1,
          purchaseId
        ]
      );
      return PurchasesModel.getPurchaseById(purchaseId);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const supplierId = parseInt(purchaseData.supplier_id, 10) || existing.supplierId;
      let supplierName = purchaseData.supplier;
      if (!supplierName) {
        const [supRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ?', [supplierId]);
        supplierName = supRows[0]?.name || supRows[0]?.company || existing.supplier;
      }

      const warehouseId = parseInt(purchaseData.warehouse_id, 10) || existing.warehouseId;
      const billerId = parseInt(purchaseData.biller_id, 10) || existing.billerId || 1;
      const purchaseDate = purchaseData.date || existing.date;
      const dueDate = purchaseData.due_date || existing.dueDate;
      const status = purchaseData.status || existing.status;
      const note = purchaseData.note !== undefined ? purchaseData.note : existing.note;

      const orderDiscount = parseFloat(purchaseData.order_discount !== undefined ? purchaseData.order_discount : existing.orderDiscount);
      const orderTax = parseFloat(purchaseData.order_tax !== undefined ? purchaseData.order_tax : existing.orderTax);
      const shipping = parseFloat(purchaseData.shipping !== undefined ? purchaseData.shipping : existing.shipping);

      // Delete existing unreceived items
      await conn.query('DELETE FROM aura_purchase_items WHERE purchase_id = ?', [purchaseId]);

      // Re-insert items
      let productSubtotal = 0;
      let productDiscountTotal = 0;
      let productTaxTotal = 0;

      for (const item of items) {
        const prodId = parseInt(item.product_id, 10) || 0;
        const optId = item.option_id ? parseInt(item.option_id, 10) : null;
        const itemQty = Math.max(parseFloat(item.quantity) || 1, 0);
        const unitCost = Math.max(parseFloat(item.unit_cost) || 0, 0);

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
        const baseUnitCost = convertToBasePrice(unitCost, unitObj);

        const itemDisc = parseFloat(item.item_discount || item.discount || 0);
        const itemTax = parseFloat(item.item_tax || item.tax || 0);
        const lineTotal = Math.max(0, (itemQty * unitCost) - itemDisc + itemTax);

        productSubtotal += (itemQty * unitCost);
        productDiscountTotal += itemDisc;
        productTaxTotal += itemTax;

        await conn.query(
          `
          INSERT INTO aura_purchase_items
          (
            purchase_id, product_id, product_type, product_code, product_name,
            product_unit_id, product_unit_code, warehouse_id, option_id,
            quantity, unit_quantity, quantity_received, quantity_balance,
            unit_cost, real_unit_cost, net_unit_cost, base_unit_cost,
            item_discount, item_tax, subtotal, status, expiry, date
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            purchaseId,
            prodId,
            item.product_type || 'standard',
            item.product_code || '',
            item.product_name || 'Product',
            unitId,
            unitCode,
            warehouseId,
            optId,
            itemQty,
            baseUnitQty,
            0,
            itemQty,
            unitCost,
            unitCost,
            unitCost,
            baseUnitCost,
            itemDisc,
            itemTax,
            lineTotal,
            status,
            item.expiry || null,
            purchaseDate
          ]
        );
      }

      const total = productSubtotal;
      const totalDiscount = productDiscountTotal + orderDiscount;
      const totalTax = productTaxTotal + orderTax;
      const grandTotal = Math.max(0, (total - totalDiscount) + totalTax + shipping);

      // Recalculate payment status based on existing paid
      let paymentStatus = 'due';
      if (existing.paid >= grandTotal && grandTotal > 0) {
        paymentStatus = 'paid';
      } else if (existing.paid > 0) {
        paymentStatus = 'partial';
      }

      await conn.query(
        `
        UPDATE aura_purchases 
        SET 
          supplier_id = ?, supplier = ?, warehouse_id = ?, biller_id = ?,
          date = ?, due_date = ?, note = ?, total = ?,
          product_discount = ?, order_discount = ?, total_discount = ?,
          product_tax = ?, order_tax = ?, total_tax = ?, shipping = ?,
          grand_total = ?, payment_status = ?, status = ?,
          updated_by = ?, updated_at = NOW()
        WHERE id = ?
        `,
        [
          supplierId,
          supplierName,
          warehouseId,
          billerId,
          purchaseDate,
          dueDate,
          note,
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
          status,
          user.id || 1,
          purchaseId
        ]
      );

      await conn.commit();
      return PurchasesModel.getPurchaseById(purchaseId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Update purchase order status (draft -> pending -> ordered -> cancelled)
   */
  async updateStatus(id, newStatus, user = {}) {
    const purchaseId = parseInt(id, 10);
    const purchase = await PurchasesModel.getPurchaseById(purchaseId);
    if (!purchase) {
      throw new Error(`Purchase #${purchaseId} not found`);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // If cancelling a purchase that had received goods, reverse the stock movements
      if (newStatus === 'cancelled' && (purchase.status === 'received' || purchase.status === 'partial')) {
        for (const it of purchase.items) {
          if (it.quantityReceived > 0) {
            let rcvdBaseQty = it.quantityReceived;
            if (it.unitId) {
              const [uRows] = await conn.query('SELECT * FROM aura_units WHERE id = ?', [it.unitId]);
              if (uRows.length) {
                rcvdBaseQty = unitToBaseQty(it.quantityReceived, uRows[0]);
              }
            }

            // Log reversal in stock movement (DB trigger automatically recalculates stock)
            await conn.query(
              `
              INSERT INTO aura_stock_movement
              (
                date, reference_no, transaction, transaction_id, warehouse_id, product_id,
                product_type, product_code, product_name, real_unit_cost, quantity,
                unit_quantity, unit_code, unit_id, option_id, user_id
              )
              VALUES (NOW(), ?, 'Purchase Reversal', ?, ?, ?, 'standard', ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
              [
                purchase.referenceNo,
                purchaseId,
                it.warehouseId,
                it.productId,
                it.productCode,
                it.productName,
                it.baseUnitCost,
                -it.quantityReceived,
                -rcvdBaseQty,
                it.unitCode,
                it.unitId,
                it.optionId,
                user.id || 1
              ]
            );

            // Reset quantity_received on item
            await conn.query(
              `UPDATE aura_purchase_items SET quantity_received = 0, quantity_balance = quantity, status = 'cancelled' WHERE id = ?`,
              [it.id]
            );
          }
        }
      }

      await conn.query(
        `UPDATE aura_purchases SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?`,
        [newStatus, user.id || 1, purchaseId]
      );

      await conn.commit();
      return PurchasesModel.getPurchaseById(purchaseId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Receive goods for a purchase order (partial or full receipt)
   */
  async receiveGoods(id, receiveItems = [], user = {}) {
    const purchaseId = parseInt(id, 10);
    const purchase = await PurchasesModel.getPurchaseById(purchaseId);
    if (!purchase) {
      throw new Error(`Purchase #${purchaseId} not found`);
    }

    if (purchase.status === 'cancelled') {
      throw new Error(`Cannot receive goods for a cancelled purchase`);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const receiptDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

      for (const recItem of receiveItems) {
        const itemId = parseInt(recItem.item_id || recItem.id, 10);
        const qtyToReceive = Math.max(parseFloat(recItem.quantity_to_receive || recItem.received_quantity || 0), 0);

        if (qtyToReceive <= 0) continue;

        const dbItem = purchase.items.find(it => it.id === itemId);
        if (!dbItem) {
          throw new Error(`Purchase item #${itemId} not found in this order`);
        }

        if (qtyToReceive > (dbItem.quantityBalance + 0.0001)) {
          throw new Error(`Cannot receive ${qtyToReceive} for ${dbItem.productName}. Maximum remaining balance is ${dbItem.quantityBalance}`);
        }

        // Unit conversion for warehouse addition
        const unitObj = dbItem.unitId ? { id: dbItem.unitId, code: dbItem.unitCode } : null;
        let baseUnitQty = qtyToReceive;
        if (dbItem.unitId) {
          const [uRows] = await conn.query('SELECT * FROM aura_units WHERE id = ?', [dbItem.unitId]);
          if (uRows.length) {
            baseUnitQty = unitToBaseQty(qtyToReceive, uRows[0]);
          }
        }

        const newReceived = dbItem.quantityReceived + qtyToReceive;
        const newBalance = Math.max(0, dbItem.quantity - newReceived);
        const itemStatus = (newBalance <= 0) ? 'received' : 'partial';

        // 1. Update purchase item
        await conn.query(
          `
          UPDATE aura_purchase_items 
          SET quantity_received = ?, quantity_balance = ?, status = ?
          WHERE id = ?
          `,
          [newReceived, newBalance, itemStatus, itemId]
        );

        // 2. Insert stock movement entry (DB trigger automatically updates warehouse & variant stock)
        await conn.query(
          `
          INSERT INTO aura_stock_movement
          (
            date, reference_no, transaction, transaction_id, warehouse_id,
            product_id, product_type, product_code, product_name, real_unit_cost,
            quantity, unit_quantity, unit_code, unit_id, option_id, user_id
          )
          VALUES (?, ?, 'Purchases', ?, ?, ?, 'standard', ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            receiptDate,
            purchase.referenceNo,
            purchaseId,
            dbItem.warehouseId,
            dbItem.productId,
            dbItem.productCode,
            dbItem.productName,
            dbItem.baseUnitCost,
            qtyToReceive,
            baseUnitQty,
            dbItem.unitCode,
            dbItem.unitId,
            dbItem.optionId,
            user.id || 1
          ]
        );
      }

      // Check overall purchase status
      const [allBal] = await conn.query(
        `SELECT SUM(quantity_balance) AS total_bal, SUM(quantity_received) AS total_rcvd FROM aura_purchase_items WHERE purchase_id = ?`,
        [purchaseId]
      );

      const totalBal = parseFloat(allBal[0]?.total_bal || 0);
      const totalRcvd = parseFloat(allBal[0]?.total_rcvd || 0);

      let overallStatus = 'ordered';
      if (totalBal <= 0 && totalRcvd > 0) {
        overallStatus = 'received';
      } else if (totalRcvd > 0) {
        overallStatus = 'partial';
      }

      await conn.query(
        `UPDATE aura_purchases SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?`,
        [overallStatus, user.id || 1, purchaseId]
      );

      await conn.commit();
      return PurchasesModel.getPurchaseById(purchaseId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Add payment to purchase
   */
  async addPayment(id, paymentData, user = {}) {
    const purchaseId = parseInt(id, 10);
    const purchase = await PurchasesModel.getPurchaseById(purchaseId);
    if (!purchase) {
      throw new Error(`Purchase #${purchaseId} not found`);
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
        const [cnt] = await conn.query('SELECT COUNT(*) AS total FROM aura_payments WHERE purchase_id = ?', [purchaseId]);
        payRef = `PAY-${purchase.referenceNo}-${(cnt[0]?.total || 0) + 1}`;
      }

      const payDate = paymentData.date || new Date().toISOString().slice(0, 19).replace('T', ' ');
      const paidBy = paymentData.paid_by || 'cash';
      const chequeNo = paymentData.cheque_no || null;
      const note = paymentData.note || '';

      await conn.query(
        `
        INSERT INTO aura_payments
        (
          date, purchase_id, reference_no, paid_by, cheque_no,
          amount, amount_usd, type, note, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?)
        `,
        [
          payDate,
          purchaseId,
          payRef,
          paidBy,
          chequeNo,
          amount,
          amount,
          note,
          user.id || 1
        ]
      );

      // Re-sum payments for purchase
      const [sumRows] = await conn.query(
        'SELECT COALESCE(SUM(amount), 0) AS total_paid FROM aura_payments WHERE purchase_id = ?',
        [purchaseId]
      );

      const totalPaid = parseFloat(sumRows[0]?.total_paid || 0);
      let paymentStatus = 'due';
      if (totalPaid >= purchase.grandTotal && purchase.grandTotal > 0) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }

      await conn.query(
        'UPDATE aura_purchases SET paid = ?, payment_status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [totalPaid, paymentStatus, user.id || 1, purchaseId]
      );

      await conn.commit();
      return PurchasesModel.getPurchaseById(purchaseId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Delete payment from purchase
   */
  async deletePayment(purchaseId, paymentId) {
    const pId = parseInt(purchaseId, 10);
    const payId = parseInt(paymentId, 10);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query('DELETE FROM aura_payments WHERE id = ? AND purchase_id = ?', [payId, pId]);

      // Re-sum payments
      const [sumRows] = await conn.query(
        'SELECT COALESCE(SUM(amount), 0) AS total_paid FROM aura_payments WHERE purchase_id = ?',
        [pId]
      );

      const totalPaid = parseFloat(sumRows[0]?.total_paid || 0);
      const [purch] = await conn.query('SELECT grand_total FROM aura_purchases WHERE id = ?', [pId]);
      const grandTotal = parseFloat(purch[0]?.grand_total || 0);

      let paymentStatus = 'due';
      if (totalPaid >= grandTotal && grandTotal > 0) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }

      await conn.query(
        'UPDATE aura_purchases SET paid = ?, payment_status = ?, updated_at = NOW() WHERE id = ?',
        [totalPaid, paymentStatus, pId]
      );

      await conn.commit();
      return PurchasesModel.getPurchaseById(pId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Safe Delete Purchase
   * Forbids deletion if goods have already been received or payments exist
   */
  async deletePurchase(id) {
    const purchaseId = parseInt(id, 10);
    const purchase = await PurchasesModel.getPurchaseById(purchaseId);
    if (!purchase) {
      throw new Error(`Purchase #${purchaseId} not found`);
    }

    // Safety checks
    if (purchase.payments && purchase.payments.length > 0) {
      throw new Error(`Cannot delete purchase #${purchase.referenceNo} because it has ${purchase.payments.length} associated payment records. Please delete payments first or cancel the purchase.`);
    }

    const hasReceivedItems = purchase.items.some(it => it.quantityReceived > 0);
    if (hasReceivedItems || purchase.status === 'received' || purchase.status === 'partial') {
      throw new Error(`Cannot delete purchase #${purchase.referenceNo} because stock has already been received into the warehouse. Please cancel the purchase order instead to safely reverse inventory.`);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Delete items
      await conn.query('DELETE FROM aura_purchase_items WHERE purchase_id = ?', [purchaseId]);
      // Delete header
      await conn.query('DELETE FROM aura_purchases WHERE id = ?', [purchaseId]);

      await conn.commit();
      return { success: true, message: `Purchase #${purchase.referenceNo} deleted successfully` };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Get metadata options (suppliers, warehouses, units, next reference)
   */
  async getMetadata() {
    const [suppliers] = await db.query(
      `SELECT id, name, company, email, phone, address, city FROM aura_companies WHERE group_name = 'supplier' ORDER BY name ASC`
    );

    const [warehouses] = await db.query(
      `SELECT id, code, name, address, phone FROM aura_warehouses ORDER BY name ASC`
    );

    const [units] = await db.query(
      `SELECT id, code, name, base_unit, operator, operation_value FROM aura_units ORDER BY name ASC`
    );

    const nextRef = await PurchasesModel.generateNextReference();

    return {
      suppliers: suppliers.map(s => ({
        id: s.id,
        name: s.name || s.company,
        company: s.company || '-',
        email: s.email || '',
        phone: s.phone || '',
        address: s.address || ''
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
      nextReference: nextRef
    };
  }
};

module.exports = PurchasesModel;
