const db = require('../../config/dbPool');

function logError(context, err) {
  console.error(`[PurchaseOrdersModel Error] [${context}]:`, err?.message || err);
}

class PurchaseOrdersModel {
  /**
   * 1. Get metadata options (warehouses, suppliers, billers, projects, tax rates, approved PRs, next ref, statuses)
   */
  static async getMetadataOptions() {
    try {
      // Warehouses
      const [warehouses] = await db.query(`
        SELECT id, name, code, address, phone 
        FROM aura_warehouses 
        ORDER BY name ASC
      `);

      // Suppliers
      const [suppliers] = await db.query(`
        SELECT id, name, company, phone, email, address, vat_no 
        FROM aura_companies 
        WHERE group_name = 'supplier' 
        ORDER BY CASE WHEN company = '-' OR company IS NULL THEN name ELSE company END ASC
      `);

      // Billers
      const [billers] = await db.query(`
        SELECT id, name, company, phone, email, address 
        FROM aura_companies 
        WHERE group_name = 'biller' 
        ORDER BY CASE WHEN company = '-' OR company IS NULL THEN name ELSE company END ASC
      `);

      // Projects
      let projects = [];
      try {
        const [projRows] = await db.query(`
          SELECT project_id AS id, project_name AS name, project_code AS code 
          FROM aura_projects 
          ORDER BY project_name ASC
        `);
        projects = projRows;
      } catch (err) {
        // Fallback if projects query fails
      }

      // Tax Rates
      let taxRates = [];
      try {
        const [taxRows] = await db.query(`
          SELECT id, name, code, rate, type 
          FROM aura_tax_rates 
          ORDER BY name ASC
        `);
        taxRates = taxRows;
      } catch (err) {
        // Fallback
      }

      // Approved Purchase Requests ready for ordering
      let approvedPurchaseRequests = [];
      try {
        const [prRows] = await db.query(`
          SELECT 
            pr.id,
            pr.reference_no,
            pr.date,
            pr.supplier_id,
            pr.supplier,
            pr.warehouse_id,
            w.name AS warehouse_name,
            pr.purpose,
            pr.total_qty,
            pr.grand_total,
            pr.order_status,
            (SELECT COUNT(*) FROM aura_purchase_request_items pri WHERE pri.purchase_id = pr.id) AS item_count
          FROM aura_purchases_request pr
          LEFT JOIN aura_warehouses w ON w.id = pr.warehouse_id
          WHERE (pr.status = 'approved' OR pr.status = 'partial')
            AND (pr.order_status IS NULL OR pr.order_status != 'completed')
          ORDER BY pr.id DESC
          LIMIT 50
        `);
        approvedPurchaseRequests = prRows;
      } catch (err) {
        // Fallback
      }

      // Next reference: PO{YY}/{0001}
      const yearShort = new Date().getFullYear().toString().slice(-2);
      const [lastRefRow] = await db.query(`
        SELECT reference_no, id 
        FROM aura_purchases_order 
        ORDER BY id DESC 
        LIMIT 1
      `);

      let nextNumber = 1;
      if (lastRefRow.length > 0 && lastRefRow[0].id) {
        nextNumber = parseInt(lastRefRow[0].id, 10) + 1;
      }
      const paddedNum = String(nextNumber).padStart(4, '0');
      const nextReference = `PO${yearShort}/${paddedNum}`;

      const statuses = [
        { value: 'pending', label: 'Pending Approval', color: 'gold' },
        { value: 'approved', label: 'Approved', color: 'green' },
        { value: 'rejected', label: 'Rejected', color: 'red' },
        { value: 'completed', label: 'Completed', color: 'blue' },
        { value: 'cancelled', label: 'Cancelled', color: 'default' },
      ];

      const orderStatuses = [
        { value: 'pending', label: 'Pending Goods Receipt', color: 'warning' },
        { value: 'partial', label: 'Partially Received', color: 'processing' },
        { value: 'completed', label: 'Fully Received', color: 'success' },
      ];

      return {
        warehouses,
        suppliers,
        billers,
        projects,
        taxRates,
        approvedPurchaseRequests,
        nextReference,
        statuses,
        orderStatuses,
      };
    } catch (err) {
      logError('getMetadataOptions', err);
      throw err;
    }
  }

  /**
   * 2. Search products for purchase order with live QOH and pricing
   */
  static async searchProducts(warehouseId, supplierId = null, term = '', limit = 25) {
    try {
      const conditions = ["(p.type = 'standard' OR p.type IS NULL OR p.type = 'raw_material')"];
      const params = [];

      if (warehouseId && warehouseId !== 'all') {
        params.push(warehouseId);
      } else {
        params.push(null);
      }

      if (term && term.trim()) {
        const cleanTerm = `%${term.trim()}%`;
        conditions.push('(p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)');
        params.push(cleanTerm, cleanTerm, cleanTerm);
      }

      const sql = `
        SELECT 
          p.id,
          p.id AS product_id,
          p.code,
          p.code AS product_code,
          p.name,
          p.name AS product_name,
          p.type AS product_type,
          COALESCE(p.cost, 0) AS cost,
          COALESCE(p.cost, 0) AS unit_cost,
          COALESCE(p.price, 0) AS price,
          COALESCE(p.price, 0) AS unit_price,
          p.unit AS product_unit_id,
          u.code AS product_unit_code,
          u.name AS product_unit_name,
          p.image,
          COALESCE(wp.quantity, p.quantity, 0) AS qoh,
          COALESCE(p.quantity, 0) AS total_stock
        FROM aura_products p
        LEFT JOIN aura_units u ON u.id = p.unit
        LEFT JOIN aura_warehouses_products wp ON (wp.product_id = p.id AND wp.warehouse_id = ?)
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.name ASC
        LIMIT ${parseInt(limit, 10) || 25}
      `;

      const [rows] = await db.query(sql, params);
      return rows;
    } catch (err) {
      logError('searchProducts', err);
      throw err;
    }
  }

  /**
   * 3. Get approved purchase requests for dropdown / selection
   */
  static async getApprovedPurchaseRequests(supplierId = null, warehouseId = null) {
    try {
      const conditions = [
        "(pr.status = 'approved' OR pr.status = 'partial')",
        "(pr.order_status IS NULL OR pr.order_status != 'completed')"
      ];
      const params = [];

      if (supplierId && supplierId !== 'all') {
        conditions.push("pr.supplier_id = ?");
        params.push(supplierId);
      }

      if (warehouseId && warehouseId !== 'all') {
        conditions.push("pr.warehouse_id = ?");
        params.push(warehouseId);
      }

      const sql = `
        SELECT 
          pr.id,
          pr.reference_no,
          pr.date,
          pr.supplier_id,
          pr.supplier,
          pr.warehouse_id,
          w.name AS warehouse_name,
          pr.purpose,
          pr.total_qty,
          pr.grand_total,
          pr.order_status,
          (
            SELECT COUNT(*) 
            FROM aura_purchase_request_items pri 
            WHERE pri.purchase_id = pr.id
          ) AS total_items,
          (
            SELECT COALESCE(SUM(pri.quantity - COALESCE(pri.po_quantity, 0)), 0) 
            FROM aura_purchase_request_items pri 
            WHERE pri.purchase_id = pr.id
          ) AS remaining_qty
        FROM aura_purchases_request pr
        LEFT JOIN aura_warehouses w ON w.id = pr.warehouse_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY pr.id DESC
      `;

      const [rows] = await db.query(sql, params);
      return rows;
    } catch (err) {
      logError('getApprovedPurchaseRequests', err);
      throw err;
    }
  }

  /**
   * 4. Get Purchase Request details and remaining unfilled items for importing into PO
   */
  static async getPurchaseRequestForImport(prId, warehouseId = null) {
    try {
      const [prRows] = await db.query(`
        SELECT 
          pr.*,
          w.name AS warehouse_name,
          s.company AS supplier_company,
          s.phone AS supplier_phone,
          s.email AS supplier_email
        FROM aura_purchases_request pr
        LEFT JOIN aura_warehouses w ON w.id = pr.warehouse_id
        LEFT JOIN aura_companies s ON s.id = pr.supplier_id
        WHERE pr.id = ?
        LIMIT 1
      `, [prId]);

      if (prRows.length === 0) {
        throw new Error(`Purchase Request #${prId} not found.`);
      }

      const pr = prRows[0];
      const targetWarehouseId = warehouseId || pr.warehouse_id;

      // Fetch items that still have remaining qty to order
      const [itemRows] = await db.query(`
        SELECT 
          pri.id AS pri_id,
          pri.purchase_id AS purchase_request_id,
          pri.product_id,
          pri.product_code,
          pri.product_name,
          pri.unit_cost,
          pri.real_unit_cost,
          pri.product_unit_id,
          pri.product_unit_code,
          pri.quantity AS requested_qty,
          COALESCE(pri.po_quantity, 0) AS ordered_qty,
          GREATEST(0, (pri.quantity - COALESCE(pri.po_quantity, 0))) AS quantity,
          pri.discount,
          pri.item_discount,
          pri.subtotal,
          pri.description AS remarks,
          COALESCE(wp.quantity, p.quantity, 0) AS qoh
        FROM aura_purchase_request_items pri
        LEFT JOIN aura_products p ON p.id = pri.product_id
        LEFT JOIN aura_warehouses_products wp ON (wp.product_id = pri.product_id AND wp.warehouse_id = ?)
        WHERE pri.purchase_id = ?
        ORDER BY pri.id ASC
      `, [targetWarehouseId, prId]);

      return {
        purchaseRequest: pr,
        items: itemRows,
      };
    } catch (err) {
      logError('getPurchaseRequestForImport', err);
      throw err;
    }
  }

  /**
   * 5. List purchase orders with filters, pagination, and KPI metrics
   */
  static async listPurchaseOrders(filters = {}, pagination = {}) {
    try {
      const {
        search = '',
        status = '',
        order_status = '',
        warehouse_id = '',
        supplier_id = '',
        start_date = '',
        end_date = '',
      } = filters;

      const page = Math.max(1, parseInt(pagination.page, 10) || 1);
      const limit = Math.max(1, parseInt(pagination.limit, 10) || 15);
      const offset = (page - 1) * limit;

      const whereClauses = ['1=1'];
      const params = [];

      if (search && search.trim()) {
        const cleanSearch = `%${search.trim()}%`;
        whereClauses.push('(po.reference_no LIKE ? OR po.supplier LIKE ? OR po.note LIKE ? OR po.purchase_ref LIKE ?)');
        params.push(cleanSearch, cleanSearch, cleanSearch, cleanSearch);
      }

      if (status && status !== 'all') {
        if (status === 'pending') {
          whereClauses.push("(po.status = 'pending' OR po.status = 'requested' OR po.status IS NULL)");
        } else {
          whereClauses.push('po.status = ?');
          params.push(status);
        }
      }

      if (order_status && order_status !== 'all') {
        whereClauses.push('po.order_status = ?');
        params.push(order_status);
      }

      if (warehouse_id && warehouse_id !== 'all') {
        whereClauses.push('po.warehouse_id = ?');
        params.push(warehouse_id);
      }

      if (supplier_id && supplier_id !== 'all') {
        whereClauses.push('po.supplier_id = ?');
        params.push(supplier_id);
      }

      if (start_date) {
        whereClauses.push('DATE(po.date) >= ?');
        params.push(start_date);
      }

      if (end_date) {
        whereClauses.push('DATE(po.date) <= ?');
        params.push(end_date);
      }

      const whereSql = whereClauses.join(' AND ');

      // Total count query
      const [countRows] = await db.query(`
        SELECT COUNT(*) AS total
        FROM aura_purchases_order po
        WHERE ${whereSql}
      `, params);
      const totalRecords = countRows[0]?.total || 0;

      // Summary KPIs
      const [metricsRows] = await db.query(`
        SELECT 
          COUNT(*) AS total_orders,
          COALESCE(SUM(CASE WHEN po.status = 'pending' OR po.status = 'requested' OR po.status IS NULL THEN 1 ELSE 0 END), 0) AS pending_count,
          COALESCE(SUM(CASE WHEN po.status = 'approved' THEN 1 ELSE 0 END), 0) AS approved_count,
          COALESCE(SUM(CASE WHEN po.status = 'rejected' OR po.status = 'reject' THEN 1 ELSE 0 END), 0) AS rejected_count,
          COALESCE(SUM(CASE WHEN po.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_count,
          COALESCE(SUM(po.total_qty), 0) AS total_ordered_qty,
          COALESCE(SUM(po.grand_total), 0) AS total_order_amount
        FROM aura_purchases_order po
        WHERE ${whereSql}
      `, params);

      // Data query
      const sql = `
        SELECT 
          po.id,
          po.date,
          po.reference_no,
          po.purchase_ref,
          po.warehouse_id,
          w.name AS warehouse_name,
          po.supplier_id,
          po.supplier,
          po.biller_id,
          b.company AS biller_name,
          po.project_id,
          p_proj.project_name,
          po.request_id,
          po.purchase_request_id,
          pr.reference_no AS purchase_request_ref,
          po.deadline,
          po.due_date,
          po.payment_term,
          po.total,
          po.product_discount,
          po.order_discount,
          po.total_discount,
          po.product_tax,
          po.order_tax,
          po.total_tax,
          po.shipping,
          po.total_qty,
          po.grand_total,
          po.paid,
          po.status,
          po.order_status,
          po.received,
          po.note,
          po.created_by,
          u_creator.username AS creator_username,
          CONCAT(COALESCE(u_creator.first_name, ''), ' ', COALESCE(u_creator.last_name, '')) AS creator_fullname,
          po.approved_by,
          CONCAT(COALESCE(u_approver.first_name, ''), ' ', COALESCE(u_approver.last_name, '')) AS approver_fullname,
          po.approved_date,
          po.rejected_by,
          CONCAT(COALESCE(u_rejecter.first_name, ''), ' ', COALESCE(u_rejecter.last_name, '')) AS rejecter_fullname,
          po.rejected_date,
          po.reject_reason,
          (
            SELECT COUNT(*) 
            FROM aura_purchase_order_items poi 
            WHERE poi.purchase_id = po.id
          ) AS items_count
        FROM aura_purchases_order po
        LEFT JOIN aura_warehouses w ON w.id = po.warehouse_id
        LEFT JOIN aura_companies b ON b.id = po.biller_id
        LEFT JOIN aura_projects p_proj ON p_proj.project_id = po.project_id
        LEFT JOIN aura_purchases_request pr ON (pr.id = po.request_id OR pr.id = po.purchase_request_id)
        LEFT JOIN aura_users u_creator ON u_creator.id = po.created_by
        LEFT JOIN aura_users u_approver ON u_approver.id = po.approved_by
        LEFT JOIN aura_users u_rejecter ON u_rejecter.id = po.rejected_by
        WHERE ${whereSql}
        ORDER BY po.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const [rows] = await db.query(sql, params);

      return {
        data: rows,
        pagination: {
          page,
          limit,
          totalRecords,
          totalPages: Math.ceil(totalRecords / limit),
        },
        kpis: metricsRows[0] || {
          total_orders: 0,
          pending_count: 0,
          approved_count: 0,
          rejected_count: 0,
          completed_count: 0,
          total_ordered_qty: 0,
          total_order_amount: 0,
        },
      };
    } catch (err) {
      logError('listPurchaseOrders', err);
      throw err;
    }
  }

  /**
   * 6. Get purchase order details by ID
   */
  static async getPurchaseOrderById(id) {
    try {
      const sql = `
        SELECT 
          po.*,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          w.address AS warehouse_address,
          w.phone AS warehouse_phone,
          s.company AS supplier_company,
          s.name AS supplier_contact_name,
          s.phone AS supplier_phone,
          s.email AS supplier_email,
          s.address AS supplier_address,
          s.vat_no AS supplier_vat_no,
          b.company AS biller_name,
          b.address AS biller_address,
          b.phone AS biller_phone,
          b.email AS biller_email,
          p_proj.project_name,
          pr.reference_no AS purchase_request_ref,
          u_creator.username AS creator_username,
          CONCAT(COALESCE(u_creator.first_name, ''), ' ', COALESCE(u_creator.last_name, '')) AS creator_fullname,
          u_approver.username AS approver_username,
          CONCAT(COALESCE(u_approver.first_name, ''), ' ', COALESCE(u_approver.last_name, '')) AS approver_fullname,
          u_rejecter.username AS rejecter_username,
          CONCAT(COALESCE(u_rejecter.first_name, ''), ' ', COALESCE(u_rejecter.last_name, '')) AS rejecter_fullname
        FROM aura_purchases_order po
        LEFT JOIN aura_warehouses w ON w.id = po.warehouse_id
        LEFT JOIN aura_companies s ON s.id = po.supplier_id
        LEFT JOIN aura_companies b ON b.id = po.biller_id
        LEFT JOIN aura_projects p_proj ON p_proj.project_id = po.project_id
        LEFT JOIN aura_purchases_request pr ON (pr.id = po.request_id OR pr.id = po.purchase_request_id)
        LEFT JOIN aura_users u_creator ON u_creator.id = po.created_by
        LEFT JOIN aura_users u_approver ON u_approver.id = po.approved_by
        LEFT JOIN aura_users u_rejecter ON u_rejecter.id = po.rejected_by
        WHERE po.id = ?
        LIMIT 1
      `;

      const [headerRows] = await db.query(sql, [id]);
      if (headerRows.length === 0) {
        return null;
      }

      const order = headerRows[0];

      // Fetch items
      const itemsSql = `
        SELECT 
          poi.*,
          p.code AS current_product_code,
          p.name AS current_product_name,
          p.image AS product_image,
          u.name AS unit_name,
          COALESCE(wp.quantity, p.quantity, 0) AS live_qoh
        FROM aura_purchase_order_items poi
        LEFT JOIN aura_products p ON p.id = poi.product_id
        LEFT JOIN aura_units u ON u.id = poi.product_unit_id
        LEFT JOIN aura_warehouses_products wp ON (wp.product_id = poi.product_id AND wp.warehouse_id = poi.warehouse_id)
        WHERE poi.purchase_id = ?
        ORDER BY poi.id ASC
      `;

      const [itemRows] = await db.query(itemsSql, [id]);
      order.items = itemRows;

      return order;
    } catch (err) {
      logError('getPurchaseOrderById', err);
      throw err;
    }
  }

  /**
   * 7. Create a new purchase order
   * NOTE: PO NEVER ALTERS PHYSICAL INVENTORY STOCK!
   */
  static async createPurchaseOrder(payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        date = new Date().toISOString().slice(0, 19).replace('T', ' '),
        reference_no,
        purchase_ref = '',
        warehouse_id,
        supplier_id,
        biller_id,
        project_id = 0,
        request_id = null,
        purchase_request_id = null,
        deadline = null,
        due_date = null,
        payment_term = 0,
        status = 'pending',
        order_status = 'pending',
        note = '',
        shipping = 0,
        order_discount = 0,
        order_tax_id = 1,
        order_tax = 0,
        items = [],
      } = payload;

      if (!warehouse_id) {
        throw new Error('Destination warehouse is required.');
      }
      if (!supplier_id) {
        throw new Error('Supplier is required.');
      }
      if (!items || items.length === 0) {
        throw new Error('Please add at least one product to the purchase order.');
      }

      // Supplier lookup
      let supplierName = 'Supplier';
      const [supRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ? LIMIT 1', [supplier_id]);
      if (supRows.length > 0) {
        supplierName = supRows[0].company && supRows[0].company !== '-' ? supRows[0].company : supRows[0].name;
      }

      // Biller lookup
      let finalBillerId = biller_id || 3;
      if (!biller_id) {
        const [billerRows] = await conn.query("SELECT id FROM aura_companies WHERE group_name = 'biller' ORDER BY id ASC LIMIT 1");
        if (billerRows.length > 0) {
          finalBillerId = billerRows[0].id;
        }
      }

      // Reference Generation
      let finalRef = reference_no;
      if (!finalRef || !finalRef.trim()) {
        const yearShort = new Date().getFullYear().toString().slice(-2);
        const [lastRow] = await conn.query('SELECT id FROM aura_purchases_order ORDER BY id DESC LIMIT 1 FOR UPDATE');
        const nextId = (lastRow[0]?.id || 0) + 1;
        finalRef = `PO${yearShort}/${String(nextId).padStart(4, '0')}`;
      }

      // Calculate totals
      let totalQty = 0;
      let itemsTotal = 0;
      let totalItemDiscount = 0;
      let totalItemTax = 0;

      const processedItems = [];
      for (const item of items) {
        const qty = parseFloat(item.quantity || 1);
        const cost = parseFloat(item.unit_cost || 0);
        const itemDiscount = parseFloat(item.item_discount || 0);
        const itemTax = parseFloat(item.item_tax || 0);
        const subtotal = (qty * cost) - itemDiscount + itemTax;

        totalQty += qty;
        itemsTotal += (qty * cost);
        totalItemDiscount += itemDiscount;
        totalItemTax += itemTax;

        processedItems.push({
          ...item,
          quantity: qty,
          unit_cost: cost,
          net_unit_cost: cost,
          real_unit_cost: cost,
          item_discount: itemDiscount,
          item_tax: itemTax,
          subtotal: subtotal,
        });
      }

      const numShipping = parseFloat(shipping || 0);
      const numOrderDiscount = parseFloat(order_discount || 0);
      const numOrderTax = parseFloat(order_tax || 0);
      const grandTotal = itemsTotal - totalItemDiscount - numOrderDiscount + totalItemTax + numOrderTax + numShipping;

      const linkedPrId = purchase_request_id || request_id || null;

      // Insert Header
      const [insertHeader] = await conn.query(`
        INSERT INTO aura_purchases_order (
          date, reference_no, purchase_ref, warehouse_id, supplier_id, supplier,
          biller_id, project_id, request_id, purchase_request_id,
          deadline, due_date, payment_term, status, order_status,
          total, product_discount, order_discount, total_discount,
          product_tax, order_tax_id, order_tax, total_tax,
          shipping, grand_total, total_qty, paid, received,
          note, reference_no_tax, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        date,
        finalRef,
        purchase_ref,
        warehouse_id,
        supplier_id,
        supplierName,
        finalBillerId,
        project_id || 0,
        linkedPrId,
        linkedPrId,
        deadline || null,
        due_date || null,
        payment_term || 0,
        status || 'pending',
        order_status || 'pending',
        itemsTotal,
        totalItemDiscount,
        numOrderDiscount,
        totalItemDiscount + numOrderDiscount,
        totalItemTax,
        order_tax_id || 1,
        numOrderTax,
        totalItemTax + numOrderTax,
        numShipping,
        grandTotal,
        totalQty,
        0, // paid
        0, // received (goods receipt)
        note || '',
        '',
        user.id || 1,
      ]);

      const poId = insertHeader.insertId;

      // Insert Line Items
      for (const item of processedItems) {
        await conn.query(`
          INSERT INTO aura_purchase_order_items (
            purchase_id, product_id, product_code, product_name, warehouse_id,
            product_unit_id, product_unit_code, unit_cost, real_unit_cost, net_unit_cost,
            unit_quantity, quantity, quantity_received, quantity_balance,
            discount, item_discount, item_tax, subtotal, qoh,
            status, date, pri_id, remarks
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          poId,
          item.product_id,
          item.product_code || '',
          item.product_name || '',
          warehouse_id,
          item.product_unit_id || null,
          item.product_unit_code || 'Unit',
          item.unit_cost,
          item.real_unit_cost,
          item.net_unit_cost,
          item.quantity,
          item.quantity,
          0, // quantity_received
          item.quantity, // quantity_balance remaining to receive
          item.discount || '0',
          item.item_discount || 0,
          item.item_tax || 0,
          item.subtotal,
          item.qoh || 0,
          'pending',
          date.slice(0, 10),
          item.pri_id || null,
          item.remarks || item.description || '',
        ]);
      }

      // If linked to a Purchase Request, update po_quantity and sync PR status
      if (linkedPrId) {
        await this._syncLinkedPurchaseRequest(conn, linkedPrId);
      }

      await conn.commit();

      return {
        id: poId,
        reference_no: finalRef,
        grand_total: grandTotal,
        total_qty: totalQty,
        status: status || 'pending',
      };
    } catch (err) {
      await conn.rollback();
      logError('createPurchaseOrder', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 8. Update an existing purchase order
   */
  static async updatePurchaseOrder(id, payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existingRows] = await conn.query('SELECT * FROM aura_purchases_order WHERE id = ? FOR UPDATE', [id]);
      if (existingRows.length === 0) {
        throw new Error(`Purchase Order #${id} not found.`);
      }

      const existingPO = existingRows[0];

      // Check if goods have been received
      if (existingPO.received == 1 || existingPO.order_status === 'completed') {
        throw new Error('This Purchase Order has already been received into warehouse stock and cannot be modified.');
      }

      const [recCheck] = await conn.query(`
        SELECT SUM(quantity_received) as total_received 
        FROM aura_purchase_order_items 
        WHERE purchase_id = ?
      `, [id]);
      if (recCheck[0]?.total_received > 0) {
        throw new Error('Items from this Purchase Order have already been received. Modify via Goods Receipt / Stock Received instead.');
      }

      const {
        date = existingPO.date,
        reference_no = existingPO.reference_no,
        purchase_ref = existingPO.purchase_ref,
        warehouse_id = existingPO.warehouse_id,
        supplier_id = existingPO.supplier_id,
        biller_id = existingPO.biller_id,
        project_id = existingPO.project_id,
        request_id = existingPO.request_id,
        purchase_request_id = existingPO.purchase_request_id,
        deadline = existingPO.deadline,
        due_date = existingPO.due_date,
        payment_term = existingPO.payment_term,
        status = existingPO.status,
        note = existingPO.note,
        shipping = existingPO.shipping,
        order_discount = existingPO.order_discount,
        order_tax_id = existingPO.order_tax_id,
        order_tax = existingPO.order_tax,
        items = [],
      } = payload;

      if (!warehouse_id) {
        throw new Error('Destination warehouse is required.');
      }
      if (!supplier_id) {
        throw new Error('Supplier is required.');
      }
      if (!items || items.length === 0) {
        throw new Error('Please add at least one product to the purchase order.');
      }

      // Supplier lookup
      let supplierName = existingPO.supplier;
      if (supplier_id !== existingPO.supplier_id) {
        const [supRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ? LIMIT 1', [supplier_id]);
        if (supRows.length > 0) {
          supplierName = supRows[0].company && supRows[0].company !== '-' ? supRows[0].company : supRows[0].name;
        }
      }

      // Calculate totals
      let totalQty = 0;
      let itemsTotal = 0;
      let totalItemDiscount = 0;
      let totalItemTax = 0;

      const processedItems = [];
      for (const item of items) {
        const qty = parseFloat(item.quantity || 1);
        const cost = parseFloat(item.unit_cost || 0);
        const itemDiscount = parseFloat(item.item_discount || 0);
        const itemTax = parseFloat(item.item_tax || 0);
        const subtotal = (qty * cost) - itemDiscount + itemTax;

        totalQty += qty;
        itemsTotal += (qty * cost);
        totalItemDiscount += itemDiscount;
        totalItemTax += itemTax;

        processedItems.push({
          ...item,
          quantity: qty,
          unit_cost: cost,
          net_unit_cost: cost,
          real_unit_cost: cost,
          item_discount: itemDiscount,
          item_tax: itemTax,
          subtotal: subtotal,
        });
      }

      const numShipping = parseFloat(shipping || 0);
      const numOrderDiscount = parseFloat(order_discount || 0);
      const numOrderTax = parseFloat(order_tax || 0);
      const grandTotal = itemsTotal - totalItemDiscount - numOrderDiscount + totalItemTax + numOrderTax + numShipping;

      const linkedPrId = purchase_request_id || request_id || existingPO.purchase_request_id || existingPO.request_id || null;

      // Update Header
      await conn.query(`
        UPDATE aura_purchases_order SET
          date = ?,
          reference_no = ?,
          purchase_ref = ?,
          warehouse_id = ?,
          supplier_id = ?,
          supplier = ?,
          biller_id = ?,
          project_id = ?,
          request_id = ?,
          purchase_request_id = ?,
          deadline = ?,
          due_date = ?,
          payment_term = ?,
          status = ?,
          total = ?,
          product_discount = ?,
          order_discount = ?,
          total_discount = ?,
          product_tax = ?,
          order_tax_id = ?,
          order_tax = ?,
          total_tax = ?,
          shipping = ?,
          grand_total = ?,
          total_qty = ?,
          note = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        date,
        reference_no,
        purchase_ref,
        warehouse_id,
        supplier_id,
        supplierName,
        biller_id || 3,
        project_id || 0,
        linkedPrId,
        linkedPrId,
        deadline || null,
        due_date || null,
        payment_term || 0,
        status || 'pending',
        itemsTotal,
        totalItemDiscount,
        numOrderDiscount,
        totalItemDiscount + numOrderDiscount,
        totalItemTax,
        order_tax_id || 1,
        numOrderTax,
        totalItemTax + numOrderTax,
        numShipping,
        grandTotal,
        totalQty,
        note || '',
        user.id || 1,
        id,
      ]);

      // Delete old items and insert updated items
      await conn.query('DELETE FROM aura_purchase_order_items WHERE purchase_id = ?', [id]);

      for (const item of processedItems) {
        await conn.query(`
          INSERT INTO aura_purchase_order_items (
            purchase_id, product_id, product_code, product_name, warehouse_id,
            product_unit_id, product_unit_code, unit_cost, real_unit_cost, net_unit_cost,
            unit_quantity, quantity, quantity_received, quantity_balance,
            discount, item_discount, item_tax, subtotal, qoh,
            status, date, pri_id, remarks
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          item.product_id,
          item.product_code || '',
          item.product_name || '',
          warehouse_id,
          item.product_unit_id || null,
          item.product_unit_code || 'Unit',
          item.unit_cost,
          item.real_unit_cost,
          item.net_unit_cost,
          item.quantity,
          item.quantity,
          0,
          item.quantity,
          item.discount || '0',
          item.item_discount || 0,
          item.item_tax || 0,
          item.subtotal,
          item.qoh || 0,
          'pending',
          String(date).slice(0, 10),
          item.pri_id || null,
          item.remarks || item.description || '',
        ]);
      }

      // Resync PR status
      if (linkedPrId) {
        await this._syncLinkedPurchaseRequest(conn, linkedPrId);
      }

      await conn.commit();

      return {
        id,
        reference_no,
        grand_total: grandTotal,
        total_qty: totalQty,
        status,
      };
    } catch (err) {
      await conn.rollback();
      logError('updatePurchaseOrder', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 9. Delete purchase order
   */
  static async deletePurchaseOrder(id, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existingRows] = await conn.query('SELECT * FROM aura_purchases_order WHERE id = ? FOR UPDATE', [id]);
      if (existingRows.length === 0) {
        throw new Error(`Purchase Order #${id} not found.`);
      }

      const po = existingRows[0];

      if (po.received == 1 || po.order_status === 'completed') {
        throw new Error('This Purchase Order has goods receipts recorded and cannot be deleted.');
      }

      const [recCheck] = await conn.query(`
        SELECT SUM(quantity_received) as total_received 
        FROM aura_purchase_order_items 
        WHERE purchase_id = ?
      `, [id]);
      if (recCheck[0]?.total_received > 0) {
        throw new Error('Items from this Purchase Order have already been received. Please reverse receipts before deleting.');
      }

      const linkedPrId = po.purchase_request_id || po.request_id;

      // Delete items
      await conn.query('DELETE FROM aura_purchase_order_items WHERE purchase_id = ?', [id]);

      // Delete header
      await conn.query('DELETE FROM aura_purchases_order WHERE id = ?', [id]);

      // Resync PR if linked
      if (linkedPrId) {
        await this._syncLinkedPurchaseRequest(conn, linkedPrId);
      }

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      logError('deletePurchaseOrder', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 10. Approve purchase order
   * PO APPROVAL DOES NOT ALTER INVENTORY!
   */
  static async approvePurchaseOrder(id, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existingRows] = await conn.query('SELECT * FROM aura_purchases_order WHERE id = ? FOR UPDATE', [id]);
      if (existingRows.length === 0) {
        throw new Error(`Purchase Order #${id} not found.`);
      }

      const po = existingRows[0];
      if (po.status === 'completed') {
        throw new Error('Cannot approve an order that is already completed.');
      }

      await conn.query(`
        UPDATE aura_purchases_order SET
          status = 'approved',
          approved_by = ?,
          approved_date = NOW(),
          rejected_by = NULL,
          rejected_date = NULL,
          reject_reason = NULL,
          updated_at = NOW()
        WHERE id = ?
      `, [user.id || 1, id]);

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      logError('approvePurchaseOrder', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 11. Reject purchase order
   */
  static async rejectPurchaseOrder(id, user = {}, reason = '') {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existingRows] = await conn.query('SELECT * FROM aura_purchases_order WHERE id = ? FOR UPDATE', [id]);
      if (existingRows.length === 0) {
        throw new Error(`Purchase Order #${id} not found.`);
      }

      const po = existingRows[0];
      if (po.received == 1 || po.order_status === 'completed') {
        throw new Error('Cannot reject a Purchase Order that has goods received.');
      }

      await conn.query(`
        UPDATE aura_purchases_order SET
          status = 'rejected',
          rejected_by = ?,
          rejected_date = NOW(),
          reject_reason = ?,
          approved_by = NULL,
          approved_date = NULL,
          updated_at = NOW()
        WHERE id = ?
      `, [user.id || 1, reason || 'Rejected by administrator', id]);

      const linkedPrId = po.purchase_request_id || po.request_id;
      if (linkedPrId) {
        await this._syncLinkedPurchaseRequest(conn, linkedPrId);
      }

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      logError('rejectPurchaseOrder', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 12. Unapprove purchase order (revert to pending)
   */
  static async unapprovePurchaseOrder(id, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existingRows] = await conn.query('SELECT * FROM aura_purchases_order WHERE id = ? FOR UPDATE', [id]);
      if (existingRows.length === 0) {
        throw new Error(`Purchase Order #${id} not found.`);
      }

      const po = existingRows[0];
      if (po.received == 1 || po.order_status === 'completed') {
        throw new Error('Cannot unapprove a Purchase Order that has already received stock.');
      }

      await conn.query(`
        UPDATE aura_purchases_order SET
          status = 'pending',
          approved_by = NULL,
          approved_date = NULL,
          updated_at = NOW()
        WHERE id = ?
      `, [id]);

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      logError('unapprovePurchaseOrder', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Helper: Sync linked Purchase Request item po_quantities and order_status
   */
  static async _syncLinkedPurchaseRequest(conn, prId) {
    try {
      // 1. Reset all PR items po_quantity to 0
      await conn.query(`
        UPDATE aura_purchase_request_items 
        SET po_quantity = 0 
        WHERE purchase_id = ?
      `, [prId]);

      // 2. Aggregate active ordered quantities from non-rejected POs
      const [orderedRows] = await conn.query(`
        SELECT 
          poi.pri_id,
          poi.product_id,
          SUM(poi.quantity) as total_po_qty
        FROM aura_purchase_order_items poi
        JOIN aura_purchases_order po ON po.id = poi.purchase_id
        WHERE (po.request_id = ? OR po.purchase_request_id = ?)
          AND po.status != 'rejected'
          AND po.status != 'cancelled'
        GROUP BY poi.pri_id, poi.product_id
      `, [prId, prId]);

      for (const row of orderedRows) {
        if (row.pri_id) {
          await conn.query(`
            UPDATE aura_purchase_request_items 
            SET po_quantity = ? 
            WHERE id = ? AND purchase_id = ?
          `, [row.total_po_qty, row.pri_id, prId]);
        } else if (row.product_id) {
          await conn.query(`
            UPDATE aura_purchase_request_items 
            SET po_quantity = ? 
            WHERE product_id = ? AND purchase_id = ?
          `, [row.total_po_qty, row.product_id, prId]);
        }
      }

      // 3. Check overall PR fulfillment status
      const [priRows] = await conn.query(`
        SELECT quantity, COALESCE(po_quantity, 0) AS po_qty 
        FROM aura_purchase_request_items 
        WHERE purchase_id = ?
      `, [prId]);

      let newStatus = 'pending';
      if (priRows.length > 0) {
        const allCompleted = priRows.every(r => parseFloat(r.po_qty) >= parseFloat(r.quantity));
        const anyOrdered = priRows.some(r => parseFloat(r.po_qty) > 0);

        if (allCompleted) {
          newStatus = 'completed';
        } else if (anyOrdered) {
          newStatus = 'partial';
        }
      }

      await conn.query(`
        UPDATE aura_purchases_request 
        SET order_status = ? 
        WHERE id = ?
      `, [newStatus, prId]);
    } catch (err) {
      logError('_syncLinkedPurchaseRequest', err);
    }
  }
}

module.exports = PurchaseOrdersModel;
