const db = require('../../config/dbPool');

function logError(context, err) {
  console.error(`[StockReceivedModel Error] [${context}]:`, err?.message || err);
}

class StockReceivedModel {
  /**
   * 1. Get metadata options (warehouses, suppliers, billers, open purchase orders, next reference, statuses)
   */
  static async getMetadataOptions() {
    try {
      // Active warehouses
      const [warehouses] = await db.query(`
        SELECT id, name, code, address, phone 
        FROM aura_warehouses 
        ORDER BY name ASC
      `);

      // Suppliers
      const [suppliers] = await db.query(`
        SELECT id, name, company, phone, email, address 
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

      // Recent / Open purchases available for stock receipt
      const [purchases] = await db.query(`
        SELECT 
          p.id, 
          p.reference_no, 
          p.date, 
          p.supplier_id, 
          p.supplier, 
          p.warehouse_id, 
          p.biller_id,
          p.status, 
          p.grand_total,
          p.total_qty,
          COALESCE(SUM(pi.quantity), 0) AS ordered_quantity,
          COALESCE(SUM(pi.quantity_received), 0) AS total_received_quantity
        FROM aura_purchases p
        LEFT JOIN aura_purchase_items pi ON pi.purchase_id = p.id
        WHERE p.status IN ('pending', 'partial', 'ordered', 'received')
        GROUP BY p.id
        ORDER BY p.id DESC 
        LIMIT 100
      `);

      // Generate next reference number
      const yearShort = new Date().getFullYear().toString().slice(-2);
      const [lastRefRow] = await db.query(`
        SELECT re_reference_no, id 
        FROM aura_stock_received 
        ORDER BY id DESC 
        LIMIT 1
      `);
      
      let nextNumber = 1;
      if (lastRefRow.length > 0 && lastRefRow[0].id) {
        nextNumber = parseInt(lastRefRow[0].id, 10) + 1;
      }
      const paddedNum = String(nextNumber).padStart(4, '0');
      const nextReference = `STR${yearShort}/${paddedNum}`;

      const statuses = [
        { value: 'completed', label: 'Completed', color: 'green' },
        { value: 'received', label: 'Received', color: 'blue' },
        { value: 'partial', label: 'Partial', color: 'orange' },
        { value: 'pending', label: 'Pending', color: 'gold' },
        { value: 'cancelled', label: 'Cancelled', color: 'red' },
      ];

      return {
        warehouses,
        suppliers,
        billers,
        purchases,
        nextReference,
        statuses,
      };
    } catch (err) {
      logError('getMetadataOptions', err);
      throw err;
    }
  }

  /**
   * 2. Get purchase order details and pending items for receiving
   */
  static async getPurchaseOrderDetails(purchaseId) {
    try {
      const [purchaseRows] = await db.query(`
        SELECT 
          p.id,
          p.reference_no,
          p.date,
          p.supplier_id,
          p.supplier,
          p.biller_id,
          p.warehouse_id,
          p.status,
          p.note,
          w.name AS warehouse_name,
          s.company AS supplier_company,
          s.phone AS supplier_phone,
          s.address AS supplier_address
        FROM aura_purchases p
        LEFT JOIN aura_warehouses w ON w.id = p.warehouse_id
        LEFT JOIN aura_companies s ON s.id = p.supplier_id
        WHERE p.id = ?
        LIMIT 1
      `, [purchaseId]);

      if (purchaseRows.length === 0) {
        throw new Error(`Purchase order #${purchaseId} not found`);
      }

      const purchase = purchaseRows[0];

      // Fetch items with ordered quantity, previous received quantity, and remaining quantity
      const [items] = await db.query(`
        SELECT 
          pi.id AS purchase_item_id,
          pi.purchase_id,
          pi.product_id,
          pi.product_code,
          pi.product_name,
          pi.product_type,
          pi.product_unit_id,
          pi.product_unit_code,
          pi.option_id,
          pi.serial_no,
          pi.unit_cost,
          pi.real_unit_cost,
          pi.net_unit_cost,
          pi.quantity AS quantity_ordered,
          COALESCE(pi.quantity_received, 0) AS quantity_previously_received,
          GREATEST(0, pi.quantity - COALESCE(pi.quantity_received, 0)) AS quantity_balance,
          GREATEST(0, pi.quantity - COALESCE(pi.quantity_received, 0)) AS quantity_to_receive,
          0 AS quantity_rejected,
          '' AS batch_no,
          pi.expiry,
          p.image AS product_image,
          COALESCE(wp.quantity, 0) AS current_warehouse_stock,
          u.name AS unit_name
        FROM aura_purchase_items pi
        LEFT JOIN aura_products p ON p.id = pi.product_id
        LEFT JOIN aura_units u ON u.id = pi.product_unit_id
        LEFT JOIN aura_warehouses_products wp ON wp.product_id = pi.product_id AND wp.warehouse_id = pi.warehouse_id
        WHERE pi.purchase_id = ?
        ORDER BY pi.id ASC
      `, [purchaseId]);

      return {
        purchase,
        items,
      };
    } catch (err) {
      logError('getPurchaseOrderDetails', err);
      throw err;
    }
  }

  /**
   * 3. Search available products for direct stock receipts (without purchase order)
   */
  static async getAvailableProducts(warehouseId, term = '', limit = 20) {
    try {
      const conditions = ["(p.type = 'standard' OR p.type IS NULL)"];
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
          p.id AS product_id,
          p.code AS product_code,
          p.name AS product_name,
          p.type AS product_type,
          p.cost AS unit_cost,
          p.cost AS real_unit_cost,
          p.cost AS net_unit_cost,
          p.unit AS product_unit_id,
          p.image AS product_image,
          u.code AS product_unit_code,
          u.name AS unit_name,
          COALESCE(wp.quantity, 0) AS current_warehouse_stock,
          COALESCE(p.quantity, 0) AS total_stock
        FROM aura_products p
        LEFT JOIN aura_units u ON u.id = p.unit
        LEFT JOIN aura_warehouses_products wp ON wp.product_id = p.id AND (wp.warehouse_id = ? OR ? IS NULL)
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.name ASC
        LIMIT ?
      `;

      params.push(params[0]); // For `OR ? IS NULL`
      params.push(Math.min(100, parseInt(limit, 10) || 20));

      const [products] = await db.query(sql, params);
      return products;
    } catch (err) {
      logError('getAvailableProducts', err);
      throw err;
    }
  }

  /**
   * 4. List stock received records with search, filters, metrics, and pagination
   */
  static async listStockReceived(filters = {}, pagination = {}) {
    try {
      const page = Math.max(1, parseInt(pagination.page, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 20));
      const offset = (page - 1) * limit;

      const conditions = ['1=1'];
      const params = [];

      // Search term
      if (filters.search && filters.search.trim()) {
        const term = `%${filters.search.trim()}%`;
        conditions.push(`(
          sr.re_reference_no LIKE ? OR 
          sr.pu_reference_no LIKE ? OR 
          sr.si_reference_no LIKE ? OR 
          sr.supplier LIKE ? OR 
          sr.note LIKE ?
        )`);
        params.push(term, term, term, term, term);
      }

      // Warehouse filter
      if (filters.warehouse_id && filters.warehouse_id !== 'all') {
        conditions.push('sr.warehouse_id = ?');
        params.push(filters.warehouse_id);
      }

      // Supplier filter
      if (filters.supplier_id && filters.supplier_id !== 'all') {
        conditions.push('sr.supplier_id = ?');
        params.push(filters.supplier_id);
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        conditions.push('sr.status = ?');
        params.push(filters.status);
      }

      // Date range filter
      if (filters.start_date) {
        conditions.push('DATE(sr.date) >= ?');
        params.push(filters.start_date);
      }
      if (filters.end_date) {
        conditions.push('DATE(sr.date) <= ?');
        params.push(filters.end_date);
      }

      const whereClause = conditions.join(' AND ');

      // Total count and summary metrics
      const [metricsRows] = await db.query(`
        SELECT 
          COUNT(sr.id) AS total_count,
          COALESCE(SUM(sr.total_qty), 0) AS total_received_quantity,
          COALESCE(SUM(sr.total_amount), 0) AS total_received_amount,
          COUNT(CASE WHEN sr.status = 'completed' OR sr.status = 'received' THEN 1 END) AS completed_count,
          COUNT(CASE WHEN sr.status = 'pending' THEN 1 END) AS pending_count,
          COUNT(CASE WHEN sr.status = 'partial' THEN 1 END) AS partial_count
        FROM aura_stock_received sr
        WHERE ${whereClause}
      `, params);

      const metrics = metricsRows[0] || {
        total_count: 0,
        total_received_quantity: 0,
        total_received_amount: 0,
        completed_count: 0,
        pending_count: 0,
        partial_count: 0,
      };

      // Main list query with item counts
      const [records] = await db.query(`
        SELECT 
          sr.id,
          sr.date,
          sr.biller_id,
          sr.biller,
          sr.supplier_id,
          sr.supplier,
          sr.warehouse_id,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          sr.purchase_id,
          sr.purchase_order_id,
          sr.re_reference_no,
          sr.pu_reference_no,
          sr.si_reference_no,
          sr.dn_reference,
          sr.truck,
          sr.address,
          sr.note,
          sr.status,
          sr.attachment,
          sr.received_by,
          sr.created_by,
          sr.updated_at,
          sr.total_qty,
          sr.total_amount,
          COUNT(sri.id) AS items_count,
          COALESCE(SUM(sri.quantity), 0) AS computed_total_qty,
          COALESCE(SUM(sri.subtotal), 0) AS computed_total_amount
        FROM aura_stock_received sr
        LEFT JOIN aura_warehouses w ON w.id = sr.warehouse_id
        LEFT JOIN aura_stock_received_items sri ON sri.stock_received_id = sr.id
        WHERE ${whereClause}
        GROUP BY sr.id
        ORDER BY sr.id DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      return {
        data: records.map(r => ({
          ...r,
          total_qty: r.total_qty || r.computed_total_qty,
          total_amount: r.total_amount || r.computed_total_amount,
        })),
        pagination: {
          total: metrics.total_count,
          page,
          limit,
          totalPages: Math.ceil(metrics.total_count / limit) || 1,
        },
        summary: metrics,
      };
    } catch (err) {
      logError('listStockReceived', err);
      throw err;
    }
  }

  /**
   * 5. Get a single stock received record by ID with all item details
   */
  static async getStockReceivedById(id) {
    try {
      const [headerRows] = await db.query(`
        SELECT 
          sr.*,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          w.address AS warehouse_address,
          s.company AS supplier_company,
          s.phone AS supplier_phone,
          s.email AS supplier_email,
          b.company AS biller_company,
          b.name AS biller_name,
          p.reference_no AS purchase_reference_no,
          u.username AS creator_username
        FROM aura_stock_received sr
        LEFT JOIN aura_warehouses w ON w.id = sr.warehouse_id
        LEFT JOIN aura_companies s ON s.id = sr.supplier_id
        LEFT JOIN aura_companies b ON b.id = sr.biller_id
        LEFT JOIN aura_purchases p ON p.id = sr.purchase_id
        LEFT JOIN aura_users u ON u.id = sr.created_by
        WHERE sr.id = ?
        LIMIT 1
      `, [id]);

      if (headerRows.length === 0) {
        return null;
      }

      const record = headerRows[0];

      // Retrieve items
      const [items] = await db.query(`
        SELECT 
          sri.*,
          p.image AS product_image,
          p.cost AS master_product_cost,
          COALESCE(wp.quantity, 0) AS current_warehouse_stock,
          u.name AS unit_name,
          pi.quantity AS po_ordered_quantity,
          pi.quantity_received AS po_received_quantity
        FROM aura_stock_received_items sri
        LEFT JOIN aura_products p ON p.id = sri.product_id
        LEFT JOIN aura_units u ON u.id = sri.product_unit_id
        LEFT JOIN aura_warehouses_products wp ON wp.product_id = sri.product_id AND wp.warehouse_id = sri.warehouse_id
        LEFT JOIN aura_purchase_items pi ON pi.id = sri.purchase_item_id
        WHERE sri.stock_received_id = ?
        ORDER BY sri.id ASC
      `, [id]);

      record.items = items;
      return record;
    } catch (err) {
      logError('getStockReceivedById', err);
      throw err;
    }
  }

  /**
   * 6. Create a stock received record with ACID transaction and stock posting
   */
  static async createStockReceived(payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        date = new Date(),
        biller_id,
        supplier_id,
        warehouse_id,
        purchase_id = null,
        purchase_order_id = null,
        re_reference_no,
        pu_reference_no,
        si_reference_no = '',
        dn_reference = '',
        truck = '',
        address = '',
        note = '',
        status = 'completed',
        received_by = user.id || 1,
        items = [],
      } = payload;

      if (!warehouse_id) {
        throw new Error('Warehouse is required.');
      }
      if (!supplier_id) {
        throw new Error('Supplier is required.');
      }
      if (!items || items.length === 0) {
        throw new Error('Stock receive must contain at least one item.');
      }

      // Resolve biller name
      let billerName = '';
      if (biller_id) {
        const [billerRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ? LIMIT 1', [biller_id]);
        if (billerRows.length > 0) {
          billerName = billerRows[0].company && billerRows[0].company !== '-' ? billerRows[0].company : billerRows[0].name;
        }
      }

      // Resolve supplier name
      let supplierName = '';
      const [supplierRows] = await conn.query('SELECT name, company, address FROM aura_companies WHERE id = ? LIMIT 1', [supplier_id]);
      if (supplierRows.length > 0) {
        supplierName = supplierRows[0].company && supplierRows[0].company !== '-' ? supplierRows[0].company : supplierRows[0].name;
      }

      // Calculate totals
      let totalQty = 0;
      let totalAmount = 0;
      for (const item of items) {
        const qty = parseFloat(item.quantity || item.unit_quantity || 0);
        const cost = parseFloat(item.unit_cost || item.net_unit_cost || 0);
        totalQty += qty;
        totalAmount += (qty * cost);
      }

      // Determine reference
      let finalRef = re_reference_no;
      if (!finalRef || !finalRef.trim()) {
        const yearShort = new Date().getFullYear().toString().slice(-2);
        const [lastRow] = await conn.query('SELECT id FROM aura_stock_received ORDER BY id DESC LIMIT 1 FOR UPDATE');
        const nextId = (lastRow[0]?.id || 0) + 1;
        finalRef = `STR${yearShort}/${String(nextId).padStart(4, '0')}`;
      }

      // Insert Header
      const [insertResult] = await conn.query(`
        INSERT INTO aura_stock_received (
          date, biller_id, biller, project_id, supplier_id, supplier,
          warehouse_id, purchase_id, purchase_order_id,
          re_reference_no, pu_reference_no, si_reference_no, dn_reference,
          truck, address, note, status, received_by, created_by,
          total_qty, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        date,
        biller_id || null,
        billerName,
        payload.project_id || 1,
        supplier_id,
        supplierName,
        warehouse_id,
        purchase_id || null,
        purchase_order_id || null,
        finalRef,
        pu_reference_no || null,
        si_reference_no,
        dn_reference,
        truck,
        address || supplierRows[0]?.address || '',
        note,
        status,
        received_by,
        user.id || 1,
        totalQty,
        totalAmount,
      ]);

      const stockReceivedId = insertResult.insertId;

      // Process Items
      for (const item of items) {
        const productId = item.product_id;
        const qtyReceived = parseFloat(item.quantity || item.unit_quantity || 0);
        const unitCost = parseFloat(item.unit_cost || 0);
        const realUnitCost = parseFloat(item.real_unit_cost || unitCost);
        const netUnitCost = parseFloat(item.net_unit_cost || unitCost);
        const subtotal = qtyReceived * unitCost;

        // Insert item record
        await conn.query(`
          INSERT INTO aura_stock_received_items (
            stock_received_id, purchase_item_id, product_id, parent_id,
            product_code, product_name, product_type, option_id,
            product_unit_id, product_unit_code, unit_cost, real_unit_cost,
            net_unit_cost, quantity, unit_quantity, weight, warehouse_id,
            item_tax, tax_rate_id, tax, discount, item_discount, subtotal,
            serial_no, comment, expiry, total_cbm, sup_qty,
            quantity_ordered, quantity_rejected, batch_no
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          stockReceivedId,
          item.purchase_item_id || null,
          productId,
          item.parent_id || 0,
          item.product_code || '',
          item.product_name || '',
          item.product_type || 'standard',
          item.option_id || null,
          item.product_unit_id || null,
          item.product_unit_code || 'Unit',
          unitCost,
          realUnitCost,
          netUnitCost,
          qtyReceived,
          qtyReceived,
          item.weight || 0,
          warehouse_id,
          item.item_tax || 0,
          item.tax_rate_id || null,
          item.tax || '',
          item.discount || '0',
          item.item_discount || 0,
          subtotal,
          item.serial_no || null,
          item.comment || '',
          item.expiry || null,
          item.total_cbm || 0,
          item.sup_qty || item.quantity_ordered || qtyReceived,
          item.quantity_ordered || qtyReceived,
          item.quantity_rejected || 0,
          item.batch_no || null,
        ]);

        // If status is completed or received, update stock and movement logs
        if (status === 'completed' || status === 'received') {
          // 1. Update aura_warehouses_products
          await conn.query(`
            INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
          `, [productId, warehouse_id, qtyReceived]);

          // 2. Update aura_products overall quantity
          await conn.query(`
            UPDATE aura_products 
            SET quantity = COALESCE(quantity, 0) + ? 
            WHERE id = ?
          `, [qtyReceived, productId]);

          // 3. Variant inventory updates if option_id exists
          if (item.option_id) {
            await conn.query(`
              INSERT INTO aura_warehouses_products_variants (option_id, warehouse_id, product_id, quantity)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
            `, [item.option_id, warehouse_id, productId, qtyReceived]);

            await conn.query(`
              UPDATE aura_product_variants 
              SET quantity = COALESCE(quantity, 0) + ? 
              WHERE id = ?
            `, [item.option_id, item.option_id]);
          }

          // 4. Log in aura_stock_movement
          await conn.query(`
            INSERT INTO aura_stock_movement (
              date, reference_no, transaction, transaction_id,
              warehouse_id, product_id, product_type, product_code, product_name,
              real_unit_cost, quantity, unit_quantity, weight,
              unit_code, unit_id, option_id, serial_no, expiry, user_id, actual_date
            ) VALUES (?, ?, 'Receives', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            date,
            finalRef,
            stockReceivedId,
            warehouse_id,
            productId,
            item.product_type || 'standard',
            item.product_code || '',
            item.product_name || '',
            realUnitCost,
            qtyReceived,
            qtyReceived,
            item.weight || 0,
            item.product_unit_code || 'Unit',
            item.product_unit_id || null,
            item.option_id || null,
            item.serial_no || null,
            item.expiry || null,
            user.id || 1,
            date,
          ]);

          // 5. Update purchase item received quantity if linked to PO
          if (item.purchase_item_id) {
            await conn.query(`
              UPDATE aura_purchase_items
              SET 
                quantity_received = COALESCE(quantity_received, 0) + ?,
                quantity_balance = GREATEST(0, quantity - (COALESCE(quantity_received, 0) + ?)),
                status = CASE 
                  WHEN (COALESCE(quantity_received, 0) + ?) >= quantity THEN 'received' 
                  WHEN (COALESCE(quantity_received, 0) + ?) > 0 THEN 'partial' 
                  ELSE 'pending' 
                END
              WHERE id = ?
            `, [qtyReceived, qtyReceived, qtyReceived, qtyReceived, item.purchase_item_id]);
          }
        }
      }

      // Sync overall purchase order status if purchase_id is provided
      if (purchase_id && (status === 'completed' || status === 'received')) {
        await this.syncPurchaseOrderStatus(conn, purchase_id);
      }

      await conn.commit();
      return { id: stockReceivedId, reference_no: finalRef };
    } catch (err) {
      await conn.rollback();
      logError('createStockReceived', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 7. Update an existing stock received record with inventory re-balancing
   */
  static async updateStockReceived(id, payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Retrieve existing record and items for safe reversal
      const [existingHeader] = await conn.query('SELECT * FROM aura_stock_received WHERE id = ? FOR UPDATE', [id]);
      if (existingHeader.length === 0) {
        throw new Error(`Stock receipt #${id} not found`);
      }
      const oldRecord = existingHeader[0];
      const [oldItems] = await conn.query('SELECT * FROM aura_stock_received_items WHERE stock_received_id = ?', [id]);

      // If old status was completed or received, revert previous additions
      if (oldRecord.status === 'completed' || oldRecord.status === 'received') {
        for (const oItem of oldItems) {
          const qty = parseFloat(oItem.quantity || 0);

          // Deduct from warehouse
          await conn.query(`
            UPDATE aura_warehouses_products 
            SET quantity = quantity - ? 
            WHERE product_id = ? AND warehouse_id = ?
          `, [qty, oItem.product_id, oldRecord.warehouse_id]);

          // Deduct from overall products
          await conn.query(`
            UPDATE aura_products 
            SET quantity = quantity - ? 
            WHERE id = ?
          `, [qty, oItem.product_id]);

          // Revert variants if present
          if (oItem.option_id) {
            await conn.query(`
              UPDATE aura_warehouses_products_variants 
              SET quantity = quantity - ? 
              WHERE option_id = ? AND warehouse_id = ?
            `, [qty, oItem.option_id, oldRecord.warehouse_id]);

            await conn.query(`
              UPDATE aura_product_variants 
              SET quantity = quantity - ? 
              WHERE id = ?
            `, [qty, oItem.option_id]);
          }

          // Revert purchase item received quantity
          if (oItem.purchase_item_id) {
            await conn.query(`
              UPDATE aura_purchase_items
              SET 
                quantity_received = GREATEST(0, COALESCE(quantity_received, 0) - ?),
                quantity_balance = quantity - GREATEST(0, COALESCE(quantity_received, 0) - ?),
                status = CASE 
                  WHEN GREATEST(0, COALESCE(quantity_received, 0) - ?) >= quantity THEN 'received' 
                  WHEN GREATEST(0, COALESCE(quantity_received, 0) - ?) > 0 THEN 'partial' 
                  ELSE 'pending' 
                END
              WHERE id = ?
            `, [qty, qty, qty, qty, oItem.purchase_item_id]);
          }
        }

        // Delete old stock movements
        await conn.query(`
          DELETE FROM aura_stock_movement 
          WHERE transaction = 'Receives' AND transaction_id = ?
        `, [id]);
      }

      // Re-sync previous purchase status
      if (oldRecord.purchase_id) {
        await this.syncPurchaseOrderStatus(conn, oldRecord.purchase_id);
      }

      // Prepare updated values
      const {
        date = oldRecord.date,
        biller_id = oldRecord.biller_id,
        supplier_id = oldRecord.supplier_id,
        warehouse_id = oldRecord.warehouse_id,
        purchase_id = oldRecord.purchase_id,
        purchase_order_id = oldRecord.purchase_order_id,
        re_reference_no = oldRecord.re_reference_no,
        pu_reference_no = oldRecord.pu_reference_no,
        si_reference_no = oldRecord.si_reference_no,
        dn_reference = oldRecord.dn_reference,
        truck = oldRecord.truck,
        address = oldRecord.address,
        note = oldRecord.note,
        status = oldRecord.status,
        received_by = oldRecord.received_by,
        items = [],
      } = payload;

      // Resolve biller name
      let billerName = oldRecord.biller;
      if (biller_id) {
        const [billerRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ? LIMIT 1', [biller_id]);
        if (billerRows.length > 0) {
          billerName = billerRows[0].company && billerRows[0].company !== '-' ? billerRows[0].company : billerRows[0].name;
        }
      }

      // Resolve supplier name
      let supplierName = oldRecord.supplier;
      if (supplier_id) {
        const [supplierRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ? LIMIT 1', [supplier_id]);
        if (supplierRows.length > 0) {
          supplierName = supplierRows[0].company && supplierRows[0].company !== '-' ? supplierRows[0].company : supplierRows[0].name;
        }
      }

      // Calculate totals
      let totalQty = 0;
      let totalAmount = 0;
      for (const item of items) {
        const qty = parseFloat(item.quantity || item.unit_quantity || 0);
        const cost = parseFloat(item.unit_cost || item.net_unit_cost || 0);
        totalQty += qty;
        totalAmount += (qty * cost);
      }

      // Update Header
      await conn.query(`
        UPDATE aura_stock_received SET
          date = ?, biller_id = ?, biller = ?, supplier_id = ?, supplier = ?,
          warehouse_id = ?, purchase_id = ?, purchase_order_id = ?,
          re_reference_no = ?, pu_reference_no = ?, si_reference_no = ?, dn_reference = ?,
          truck = ?, address = ?, note = ?, status = ?, received_by = ?,
          updated_at = NOW(), updated_by = ?, total_qty = ?, total_amount = ?
        WHERE id = ?
      `, [
        date,
        biller_id || null,
        billerName,
        supplier_id,
        supplierName,
        warehouse_id,
        purchase_id || null,
        purchase_order_id || null,
        re_reference_no,
        pu_reference_no || null,
        si_reference_no,
        dn_reference,
        truck,
        address,
        note,
        status,
        received_by,
        user.id || 1,
        totalQty,
        totalAmount,
        id,
      ]);

      // Remove previous items
      await conn.query('DELETE FROM aura_stock_received_items WHERE stock_received_id = ?', [id]);

      // Insert new items
      for (const item of items) {
        const productId = item.product_id;
        const qtyReceived = parseFloat(item.quantity || item.unit_quantity || 0);
        const unitCost = parseFloat(item.unit_cost || 0);
        const realUnitCost = parseFloat(item.real_unit_cost || unitCost);
        const netUnitCost = parseFloat(item.net_unit_cost || unitCost);
        const subtotal = qtyReceived * unitCost;

        await conn.query(`
          INSERT INTO aura_stock_received_items (
            stock_received_id, purchase_item_id, product_id, parent_id,
            product_code, product_name, product_type, option_id,
            product_unit_id, product_unit_code, unit_cost, real_unit_cost,
            net_unit_cost, quantity, unit_quantity, weight, warehouse_id,
            item_tax, tax_rate_id, tax, discount, item_discount, subtotal,
            serial_no, comment, expiry, total_cbm, sup_qty,
            quantity_ordered, quantity_rejected, batch_no
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          item.purchase_item_id || null,
          productId,
          item.parent_id || 0,
          item.product_code || '',
          item.product_name || '',
          item.product_type || 'standard',
          item.option_id || null,
          item.product_unit_id || null,
          item.product_unit_code || 'Unit',
          unitCost,
          realUnitCost,
          netUnitCost,
          qtyReceived,
          qtyReceived,
          item.weight || 0,
          warehouse_id,
          item.item_tax || 0,
          item.tax_rate_id || null,
          item.tax || '',
          item.discount || '0',
          item.item_discount || 0,
          subtotal,
          item.serial_no || null,
          item.comment || '',
          item.expiry || null,
          item.total_cbm || 0,
          item.sup_qty || item.quantity_ordered || qtyReceived,
          item.quantity_ordered || qtyReceived,
          item.quantity_rejected || 0,
          item.batch_no || null,
        ]);

        // If new status is completed or received, post stock additions
        if (status === 'completed' || status === 'received') {
          await conn.query(`
            INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
          `, [productId, warehouse_id, qtyReceived]);

          await conn.query(`
            UPDATE aura_products 
            SET quantity = COALESCE(quantity, 0) + ? 
            WHERE id = ?
          `, [qtyReceived, productId]);

          if (item.option_id) {
            await conn.query(`
              INSERT INTO aura_warehouses_products_variants (option_id, warehouse_id, product_id, quantity)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
            `, [item.option_id, warehouse_id, productId, qtyReceived]);

            await conn.query(`
              UPDATE aura_product_variants 
              SET quantity = COALESCE(quantity, 0) + ? 
              WHERE id = ?
            `, [item.option_id, item.option_id]);
          }

          // Insert new movement log
          await conn.query(`
            INSERT INTO aura_stock_movement (
              date, reference_no, transaction, transaction_id,
              warehouse_id, product_id, product_type, product_code, product_name,
              real_unit_cost, quantity, unit_quantity, weight,
              unit_code, unit_id, option_id, serial_no, expiry, user_id, actual_date
            ) VALUES (?, ?, 'Receives', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            date,
            re_reference_no,
            id,
            warehouse_id,
            productId,
            item.product_type || 'standard',
            item.product_code || '',
            item.product_name || '',
            realUnitCost,
            qtyReceived,
            qtyReceived,
            item.weight || 0,
            item.product_unit_code || 'Unit',
            item.product_unit_id || null,
            item.option_id || null,
            item.serial_no || null,
            item.expiry || null,
            user.id || 1,
            date,
          ]);

          if (item.purchase_item_id) {
            await conn.query(`
              UPDATE aura_purchase_items
              SET 
                quantity_received = COALESCE(quantity_received, 0) + ?,
                quantity_balance = GREATEST(0, quantity - (COALESCE(quantity_received, 0) + ?)),
                status = CASE 
                  WHEN (COALESCE(quantity_received, 0) + ?) >= quantity THEN 'received' 
                  WHEN (COALESCE(quantity_received, 0) + ?) > 0 THEN 'partial' 
                  ELSE 'pending' 
                END
              WHERE id = ?
            `, [qtyReceived, qtyReceived, qtyReceived, qtyReceived, item.purchase_item_id]);
          }
        }
      }

      // Sync new purchase order status
      if (purchase_id && (status === 'completed' || status === 'received')) {
        await this.syncPurchaseOrderStatus(conn, purchase_id);
      }

      await conn.commit();
      return { id, reference_no: re_reference_no };
    } catch (err) {
      await conn.rollback();
      logError('updateStockReceived', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 8. Delete a stock received record with complete inventory rollback
   */
  static async deleteStockReceived(id, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [headerRows] = await conn.query('SELECT * FROM aura_stock_received WHERE id = ? FOR UPDATE', [id]);
      if (headerRows.length === 0) {
        throw new Error(`Stock receipt #${id} not found`);
      }
      const record = headerRows[0];
      const [items] = await conn.query('SELECT * FROM aura_stock_received_items WHERE stock_received_id = ?', [id]);

      // If status was completed or received, revert inventory
      if (record.status === 'completed' || record.status === 'received') {
        for (const item of items) {
          const qty = parseFloat(item.quantity || 0);

          await conn.query(`
            UPDATE aura_warehouses_products 
            SET quantity = quantity - ? 
            WHERE product_id = ? AND warehouse_id = ?
          `, [qty, item.product_id, record.warehouse_id]);

          await conn.query(`
            UPDATE aura_products 
            SET quantity = quantity - ? 
            WHERE id = ?
          `, [qty, item.product_id]);

          if (item.option_id) {
            await conn.query(`
              UPDATE aura_warehouses_products_variants 
              SET quantity = quantity - ? 
              WHERE option_id = ? AND warehouse_id = ?
            `, [qty, item.option_id, record.warehouse_id]);

            await conn.query(`
              UPDATE aura_product_variants 
              SET quantity = quantity - ? 
              WHERE id = ?
            `, [qty, item.option_id]);
          }

          if (item.purchase_item_id) {
            await conn.query(`
              UPDATE aura_purchase_items
              SET 
                quantity_received = GREATEST(0, COALESCE(quantity_received, 0) - ?),
                quantity_balance = quantity - GREATEST(0, COALESCE(quantity_received, 0) - ?),
                status = CASE 
                  WHEN GREATEST(0, COALESCE(quantity_received, 0) - ?) >= quantity THEN 'received' 
                  WHEN GREATEST(0, COALESCE(quantity_received, 0) - ?) > 0 THEN 'partial' 
                  ELSE 'pending' 
                END
              WHERE id = ?
            `, [qty, qty, qty, qty, item.purchase_item_id]);
          }
        }

        // Delete movement logs
        await conn.query(`
          DELETE FROM aura_stock_movement 
          WHERE transaction = 'Receives' AND transaction_id = ?
        `, [id]);
      }

      // Delete items and header
      await conn.query('DELETE FROM aura_stock_received_items WHERE stock_received_id = ?', [id]);
      await conn.query('DELETE FROM aura_stock_received WHERE id = ?', [id]);

      // Re-sync purchase order status
      if (record.purchase_id) {
        await this.syncPurchaseOrderStatus(conn, record.purchase_id);
      }

      await conn.commit();
      return { id, reference_no: record.re_reference_no, deleted: true };
    } catch (err) {
      await conn.rollback();
      logError('deleteStockReceived', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Helper: Calculate and update parent purchase order status (received, partial, pending)
   */
  static async syncPurchaseOrderStatus(conn, purchaseId) {
    if (!purchaseId) return;
    try {
      const [sumRows] = await conn.query(`
        SELECT 
          COALESCE(SUM(quantity), 0) AS total_ordered,
          COALESCE(SUM(quantity_received), 0) AS total_received
        FROM aura_purchase_items
        WHERE purchase_id = ?
      `, [purchaseId]);

      if (sumRows.length > 0) {
        const { total_ordered, total_received } = sumRows[0];
        let newStatus = 'pending';
        if (parseFloat(total_received) >= parseFloat(total_ordered) && parseFloat(total_ordered) > 0) {
          newStatus = 'received';
        } else if (parseFloat(total_received) > 0) {
          newStatus = 'partial';
        }

        await conn.query('UPDATE aura_purchases SET status = ? WHERE id = ?', [newStatus, purchaseId]);
      }
    } catch (err) {
      logError('syncPurchaseOrderStatus', err);
    }
  }
}

module.exports = StockReceivedModel;
