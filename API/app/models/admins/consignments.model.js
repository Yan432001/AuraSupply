const db = require('../../config/dbPool');

function logError(context, err) {
  console.error(`[ConsignmentsModel Error] [${context}]:`, err?.message || err);
}

class ConsignmentsModel {
  /**
   * 1. Get metadata options (warehouses, customers, billers, next reference, statuses)
   */
  static async getMetadataOptions() {
    try {
      // Active warehouses
      const [warehouses] = await db.query(`
        SELECT id, name, code, address, phone 
        FROM aura_warehouses 
        ORDER BY name ASC
      `);

      // Customers / Consignees
      const [customers] = await db.query(`
        SELECT id, name, company, phone, email, address 
        FROM aura_companies 
        WHERE group_name = 'customer' 
        ORDER BY CASE WHEN company = '-' OR company IS NULL THEN name ELSE company END ASC
      `);

      // Billers
      const [billers] = await db.query(`
        SELECT id, name, company, phone, email, address 
        FROM aura_companies 
        WHERE group_name = 'biller' 
        ORDER BY CASE WHEN company = '-' OR company IS NULL THEN name ELSE company END ASC
      `);

      // Generate next reference number
      const yearShort = new Date().getFullYear().toString().slice(-2);
      const [lastRefRow] = await db.query(`
        SELECT reference_no, id 
        FROM aura_consignments 
        WHERE consignment_id IS NULL OR consignment_id = 0
        ORDER BY id DESC 
        LIMIT 1
      `);

      let nextNumber = 1;
      if (lastRefRow.length > 0 && lastRefRow[0].id) {
        nextNumber = parseInt(lastRefRow[0].id, 10) + 1;
      }
      const paddedNum = String(nextNumber).padStart(4, '0');
      const nextReference = `CSM${yearShort}/${paddedNum}`;

      const statuses = [
        { value: 'draft', label: 'Draft', color: 'default' },
        { value: 'approved', label: 'Approved', color: 'cyan' },
        { value: 'dispatched', label: 'Dispatched', color: 'blue' },
        { value: 'pending', label: 'Pending', color: 'gold' },
        { value: 'partially_sold', label: 'Partially Sold', color: 'geekblue' },
        { value: 'partially_returned', label: 'Partially Returned', color: 'purple' },
        { value: 'completed', label: 'Completed', color: 'green' },
        { value: 'cancelled', label: 'Cancelled', color: 'red' },
      ];

      return {
        warehouses,
        customers,
        billers,
        nextReference,
        statuses,
      };
    } catch (err) {
      logError('getMetadataOptions', err);
      throw err;
    }
  }

  /**
   * 2. Search available products for consignment with live warehouse stock balances
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
          p.price AS unit_price,
          p.price AS real_unit_price,
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
   * 3. List consignments with search, filters, metrics, and pagination
   */
  static async listConsignments(filters = {}, pagination = {}) {
    try {
      const page = Math.max(1, parseInt(pagination.page, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(pagination.limit, 10) || 20));
      const offset = (page - 1) * limit;

      // Base query excludes child return vouchers from primary consignment list
      const conditions = ['(c.consignment_id IS NULL OR c.consignment_id = 0)'];
      const params = [];

      // Search term
      if (filters.search && filters.search.trim()) {
        const term = `%${filters.search.trim()}%`;
        conditions.push(`(
          c.reference_no LIKE ? OR 
          c.customer LIKE ? OR 
          c.destination LIKE ? OR 
          c.note LIKE ?
        )`);
        params.push(term, term, term, term);
      }

      // Warehouse filter
      if (filters.warehouse_id && filters.warehouse_id !== 'all') {
        conditions.push('c.warehouse_id = ?');
        params.push(filters.warehouse_id);
      }

      // Customer filter
      if (filters.customer_id && filters.customer_id !== 'all') {
        conditions.push('c.customer_id = ?');
        params.push(filters.customer_id);
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        conditions.push('c.status = ?');
        params.push(filters.status);
      }

      // Date range filter
      if (filters.start_date) {
        conditions.push('DATE(c.date) >= ?');
        params.push(filters.start_date);
      }
      if (filters.end_date) {
        conditions.push('DATE(c.date) <= ?');
        params.push(filters.end_date);
      }

      const whereClause = conditions.join(' AND ');

      // Summary metrics
      const [metricsRows] = await db.query(`
        SELECT 
          COUNT(c.id) AS total_count,
          COALESCE(SUM(c.grand_total), 0) AS total_amount,
          COALESCE(SUM(ci.quantity), 0) AS total_dispatched_qty,
          COALESCE(SUM(ci.sale_qty), 0) AS total_sold_qty,
          COALESCE(SUM(ci.return_qty), 0) AS total_returned_qty,
          COUNT(CASE WHEN c.status = 'completed' THEN 1 END) AS completed_count,
          COUNT(CASE WHEN c.status IN ('dispatched', 'pending', 'partially_sold', 'partially_returned') THEN 1 END) AS active_count
        FROM aura_consignments c
        LEFT JOIN aura_consignment_items ci ON ci.consignment_id = c.id
        WHERE ${whereClause}
      `, params);

      const metrics = metricsRows[0] || {
        total_count: 0,
        total_amount: 0,
        total_dispatched_qty: 0,
        total_sold_qty: 0,
        total_returned_qty: 0,
        completed_count: 0,
        active_count: 0,
      };

      metrics.total_remaining_qty = Math.max(
        0,
        (parseFloat(metrics.total_dispatched_qty) || 0) -
        (parseFloat(metrics.total_sold_qty) || 0) -
        (parseFloat(metrics.total_returned_qty) || 0)
      );

      // Main List
      const [records] = await db.query(`
        SELECT 
          c.id,
          c.date,
          c.dispatch_date,
          c.expected_return_date,
          c.valid_day,
          c.reference_no,
          c.customer_id,
          c.customer,
          cust.company AS customer_company,
          cust.phone AS customer_phone,
          c.warehouse_id,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          c.destination,
          c.biller_id,
          c.biller,
          c.status,
          c.total,
          c.grand_total,
          c.note,
          c.created_by,
          c.updated_at,
          COUNT(ci.id) AS items_count,
          COALESCE(SUM(ci.quantity), 0) AS total_quantity,
          COALESCE(SUM(ci.sale_qty), 0) AS total_sale_qty,
          COALESCE(SUM(ci.return_qty), 0) AS total_return_qty,
          COALESCE(SUM(ci.damage_qty), 0) AS total_damage_qty,
          COALESCE(SUM(ci.missing_qty), 0) AS total_missing_qty,
          GREATEST(0, COALESCE(SUM(ci.quantity), 0) - COALESCE(SUM(ci.sale_qty), 0) - COALESCE(SUM(ci.return_qty), 0) - COALESCE(SUM(ci.damage_qty), 0) - COALESCE(SUM(ci.missing_qty), 0)) AS remaining_qty
        FROM aura_consignments c
        LEFT JOIN aura_warehouses w ON w.id = c.warehouse_id
        LEFT JOIN aura_companies cust ON cust.id = c.customer_id
        LEFT JOIN aura_consignment_items ci ON ci.consignment_id = c.id
        WHERE ${whereClause}
        GROUP BY c.id
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      return {
        data: records,
        pagination: {
          total: metrics.total_count,
          page,
          limit,
          totalPages: Math.ceil(metrics.total_count / limit) || 1,
        },
        summary: metrics,
      };
    } catch (err) {
      logError('listConsignments', err);
      throw err;
    }
  }

  /**
   * 4. Get a single consignment by ID with line items, progress balances, and returns history
   */
  static async getConsignmentById(id) {
    try {
      const [headerRows] = await db.query(`
        SELECT 
          c.*,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          w.address AS warehouse_address,
          cust.company AS customer_company,
          cust.phone AS customer_phone,
          cust.email AS customer_email,
          cust.address AS customer_address,
          b.company AS biller_company,
          b.name AS biller_name,
          u.username AS creator_username
        FROM aura_consignments c
        LEFT JOIN aura_warehouses w ON w.id = c.warehouse_id
        LEFT JOIN aura_companies cust ON cust.id = c.customer_id
        LEFT JOIN aura_companies b ON b.id = c.biller_id
        LEFT JOIN aura_users u ON u.id = c.created_by
        WHERE c.id = ?
        LIMIT 1
      `, [id]);

      if (headerRows.length === 0) {
        return null;
      }

      const record = headerRows[0];

      // Retrieve items
      const [items] = await db.query(`
        SELECT 
          ci.*,
          p.image AS product_image,
          p.cost AS master_product_cost,
          COALESCE(wp.quantity, 0) AS current_warehouse_stock,
          u.name AS unit_name,
          GREATEST(0, ci.quantity - COALESCE(ci.sale_qty, 0) - COALESCE(ci.return_qty, 0) - COALESCE(ci.damage_qty, 0) - COALESCE(ci.missing_qty, 0)) AS balance_quantity
        FROM aura_consignment_items ci
        LEFT JOIN aura_products p ON p.id = ci.product_id
        LEFT JOIN aura_units u ON u.id = ci.product_unit_id
        LEFT JOIN aura_warehouses_products wp ON wp.product_id = ci.product_id AND wp.warehouse_id = ci.warehouse_id
        WHERE ci.consignment_id = ?
        ORDER BY ci.id ASC
      `, [id]);

      record.items = items;

      // Retrieve return vouchers associated with this consignment
      const [returns] = await db.query(`
        SELECT 
          r.id,
          r.date,
          r.reference_no,
          r.status,
          r.total,
          r.grand_total,
          r.note,
          COUNT(ri.id) AS return_items_count,
          COALESCE(SUM(ABS(ri.quantity)), 0) AS total_returned_qty
        FROM aura_consignments r
        LEFT JOIN aura_consignment_items ri ON ri.consignment_id = r.id
        WHERE r.consignment_id = ?
        GROUP BY r.id
        ORDER BY r.id DESC
      `, [id]);

      record.returns = returns;
      return record;
    } catch (err) {
      logError('getConsignmentById', err);
      throw err;
    }
  }

  /**
   * 5. Create a new consignment and post inventory dispatch
   */
  static async createConsignment(payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        date = new Date(),
        dispatch_date = new Date(),
        valid_day = 30,
        expected_return_date = null,
        reference_no,
        customer_id,
        warehouse_id,
        biller_id = null,
        destination = '',
        note = '',
        status = 'dispatched',
        items = [],
      } = payload;

      if (!customer_id) throw new Error('Customer / Consignee is required.');
      if (!warehouse_id) throw new Error('Source Warehouse is required.');
      if (!items || items.length === 0) throw new Error('Consignment must contain at least one product item.');

      // Customer info
      const [custRows] = await conn.query('SELECT name, company, address FROM aura_companies WHERE id = ? LIMIT 1', [customer_id]);
      const customerName = custRows.length > 0
        ? (custRows[0].company && custRows[0].company !== '-' ? custRows[0].company : custRows[0].name)
        : 'Customer';

      // Biller info
      let billerId = biller_id;
      let billerName = '';
      if (!billerId) {
        const [defBiller] = await conn.query("SELECT id, name, company FROM aura_companies WHERE group_name = 'biller' ORDER BY id ASC LIMIT 1");
        if (defBiller.length > 0) {
          billerId = defBiller[0].id;
          billerName = defBiller[0].company && defBiller[0].company !== '-' ? defBiller[0].company : defBiller[0].name;
        } else {
          billerId = 1;
          billerName = 'Aura';
        }
      } else {
        const [billerRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ? LIMIT 1', [billerId]);
        if (billerRows.length > 0) {
          billerName = billerRows[0].company && billerRows[0].company !== '-' ? billerRows[0].company : billerRows[0].name;
        }
      }

      // Reference generation
      let finalRef = reference_no;
      if (!finalRef || !finalRef.trim()) {
        const yearShort = new Date().getFullYear().toString().slice(-2);
        const [lastRow] = await conn.query('SELECT id FROM aura_consignments ORDER BY id DESC LIMIT 1 FOR UPDATE');
        const nextId = (lastRow[0]?.id || 0) + 1;
        finalRef = `CSM${yearShort}/${String(nextId).padStart(4, '0')}`;
      }

      // Check stock availability if status is dispatched or pending
      const deductStock = (status === 'dispatched' || status === 'pending' || status === 'approved');
      if (deductStock) {
        for (const item of items) {
          const qty = parseFloat(item.quantity || 0);
          const [whRows] = await conn.query(`
            SELECT quantity FROM aura_warehouses_products 
            WHERE product_id = ? AND warehouse_id = ? 
            LIMIT 1 FOR UPDATE
          `, [item.product_id, warehouse_id]);

          const available = parseFloat(whRows[0]?.quantity || 0);
          if (available < qty) {
            throw new Error(`Insufficient stock for "${item.product_name}" (${item.product_code}) in warehouse. Available: ${available}, Dispatched: ${qty}`);
          }
        }
      }

      // Calculate totals
      let totalQty = 0;
      let totalAmount = 0;
      for (const item of items) {
        const qty = parseFloat(item.quantity || 0);
        const price = parseFloat(item.unit_price || item.real_unit_price || 0);
        totalQty += qty;
        totalAmount += (qty * price);
      }

      // Calculated expected return date
      let expDate = expected_return_date;
      if (!expDate && valid_day > 0) {
        const d = new Date(date);
        d.setDate(d.getDate() + parseInt(valid_day, 10));
        expDate = d.toISOString().slice(0, 10);
      }

      // Insert Header
      const [insertResult] = await conn.query(`
        INSERT INTO aura_consignments (
          date, dispatch_date, valid_day, expected_return_date, reference_no,
          customer_id, customer, warehouse_id, destination, biller_id, biller,
          project_id, note, total, grand_total, total_qty, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        date,
        dispatch_date,
        valid_day,
        expDate,
        finalRef,
        customer_id,
        customerName,
        warehouse_id,
        destination || custRows[0]?.address || '',
        billerId,
        billerName,
        payload.project_id || 1,
        note,
        totalAmount,
        totalAmount,
        totalQty,
        status,
        user.id || 1,
      ]);

      const consignmentId = insertResult.insertId;

      // Insert items & process stock movement
      for (const item of items) {
        const productId = item.product_id;
        const qty = parseFloat(item.quantity || 0);
        const unitPrice = parseFloat(item.unit_price || 0);
        const realUnitPrice = parseFloat(item.real_unit_price || unitPrice);
        const netUnitPrice = parseFloat(item.net_unit_price || unitPrice);
        const unitCost = parseFloat(item.unit_cost || 0);
        const subtotal = qty * unitPrice;

        // Insert consignment item
        await conn.query(`
          INSERT INTO aura_consignment_items (
            consignment_id, product_id, product_code, product_name, product_type,
            real_unit_price, net_unit_price, unit_price, unit_cost, quantity, unit_quantity,
            warehouse_id, option_id, subtotal, product_unit_id, product_unit_code,
            comment, expiry, serial_no, return_qty, sale_qty, damage_qty, missing_qty, batch_no
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          consignmentId,
          productId,
          item.product_code || '',
          item.product_name || '',
          item.product_type || 'standard',
          realUnitPrice,
          netUnitPrice,
          unitPrice,
          unitCost,
          qty,
          qty,
          warehouse_id,
          item.option_id || null,
          subtotal,
          item.product_unit_id || null,
          item.product_unit_code || 'Unit',
          item.comment || '',
          item.expiry || null,
          item.serial_no || null,
          0, // return_qty
          0, // sale_qty
          0, // damage_qty
          0, // missing_qty
          item.batch_no || null,
        ]);

        // If dispatched or pending, deduct from warehouse stock and log movement
        if (deductStock) {
          await conn.query(`
            UPDATE aura_warehouses_products 
            SET quantity = quantity - ? 
            WHERE product_id = ? AND warehouse_id = ?
          `, [qty, productId, warehouse_id]);

          await conn.query(`
            UPDATE aura_products 
            SET quantity = quantity - ? 
            WHERE id = ?
          `, [qty, productId]);

          if (item.option_id) {
            await conn.query(`
              UPDATE aura_warehouses_products_variants 
              SET quantity = quantity - ? 
              WHERE option_id = ? AND warehouse_id = ?
            `, [qty, item.option_id, warehouse_id]);

            await conn.query(`
              UPDATE aura_product_variants 
              SET quantity = quantity - ? 
              WHERE id = ?
            `, [qty, item.option_id]);
          }

          // Insert stock movement record (outward dispatch)
          await conn.query(`
            INSERT INTO aura_stock_movement (
              date, reference_no, transaction, transaction_id,
              warehouse_id, product_id, product_type, product_code, product_name,
              real_unit_cost, quantity, unit_quantity,
              unit_code, unit_id, option_id, serial_no, expiry, user_id, actual_date
            ) VALUES (?, ?, 'Consignment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            date,
            finalRef,
            consignmentId,
            warehouse_id,
            productId,
            item.product_type || 'standard',
            item.product_code || '',
            item.product_name || '',
            unitCost,
            -qty,
            -qty,
            item.product_unit_code || 'Unit',
            item.product_unit_id || null,
            item.option_id || null,
            item.serial_no || null,
            item.expiry || null,
            user.id || 1,
            date,
          ]);
        }
      }

      await conn.commit();
      return { id: consignmentId, reference_no: finalRef };
    } catch (err) {
      await conn.rollback();
      logError('createConsignment', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 6. Update an existing consignment with safe inventory re-balancing
   */
  static async updateConsignment(id, payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Retrieve existing record and items
      const [existingHeader] = await conn.query('SELECT * FROM aura_consignments WHERE id = ? FOR UPDATE', [id]);
      if (existingHeader.length === 0) {
        throw new Error(`Consignment voucher #${id} not found`);
      }
      const oldRecord = existingHeader[0];
      const [oldItems] = await conn.query('SELECT * FROM aura_consignment_items WHERE consignment_id = ?', [id]);

      // Revert previous stock deductions if old status was dispatched or pending
      const oldDeducted = (oldRecord.status === 'dispatched' || oldRecord.status === 'pending' || oldRecord.status === 'approved' || oldRecord.status === 'partially_sold' || oldRecord.status === 'partially_returned');
      if (oldDeducted) {
        for (const oItem of oldItems) {
          const qty = parseFloat(oItem.quantity || 0);

          await conn.query(`
            UPDATE aura_warehouses_products 
            SET quantity = quantity + ? 
            WHERE product_id = ? AND warehouse_id = ?
          `, [qty, oItem.product_id, oldRecord.warehouse_id]);

          await conn.query(`
            UPDATE aura_products 
            SET quantity = quantity + ? 
            WHERE id = ?
          `, [qty, oItem.product_id]);

          if (oItem.option_id) {
            await conn.query(`
              UPDATE aura_warehouses_products_variants 
              SET quantity = quantity + ? 
              WHERE option_id = ? AND warehouse_id = ?
            `, [qty, oItem.option_id, oldRecord.warehouse_id]);

            await conn.query(`
              UPDATE aura_product_variants 
              SET quantity = quantity + ? 
              WHERE id = ?
            `, [qty, oItem.option_id]);
          }
        }

        // Delete previous movement records for this parent consignment
        await conn.query(`
          DELETE FROM aura_stock_movement 
          WHERE transaction = 'Consignment' AND transaction_id = ?
        `, [id]);
      }

      // Prepare updated payload
      const {
        date = oldRecord.date,
        dispatch_date = oldRecord.dispatch_date,
        valid_day = oldRecord.valid_day,
        expected_return_date = oldRecord.expected_return_date,
        reference_no = oldRecord.reference_no,
        customer_id = oldRecord.customer_id,
        warehouse_id = oldRecord.warehouse_id,
        biller_id = oldRecord.biller_id,
        destination = oldRecord.destination,
        note = oldRecord.note,
        status = oldRecord.status,
        items = [],
      } = payload;

      // Customer info
      let customerName = oldRecord.customer;
      if (customer_id) {
        const [custRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ? LIMIT 1', [customer_id]);
        if (custRows.length > 0) {
          customerName = custRows[0].company && custRows[0].company !== '-' ? custRows[0].company : custRows[0].name;
        }
      }

      // Check stock for new quantities if status is dispatched/pending
      const newDeduct = (status === 'dispatched' || status === 'pending' || status === 'approved' || status === 'partially_sold' || status === 'partially_returned');
      if (newDeduct) {
        for (const item of items) {
          const qty = parseFloat(item.quantity || 0);
          const [whRows] = await conn.query(`
            SELECT quantity FROM aura_warehouses_products 
            WHERE product_id = ? AND warehouse_id = ? 
            LIMIT 1 FOR UPDATE
          `, [item.product_id, warehouse_id]);

          const available = parseFloat(whRows[0]?.quantity || 0);
          if (available < qty) {
            throw new Error(`Insufficient stock for "${item.product_name}" (${item.product_code}) in warehouse. Available: ${available}, Dispatched: ${qty}`);
          }
        }
      }

      // Calculate totals
      let totalQty = 0;
      let totalAmount = 0;
      for (const item of items) {
        const qty = parseFloat(item.quantity || 0);
        const price = parseFloat(item.unit_price || item.real_unit_price || 0);
        totalQty += qty;
        totalAmount += (qty * price);
      }

      // Update header
      await conn.query(`
        UPDATE aura_consignments SET
          date = ?, dispatch_date = ?, valid_day = ?, expected_return_date = ?,
          reference_no = ?, customer_id = ?, customer = ?, warehouse_id = ?,
          destination = ?, biller_id = ?, note = ?, total = ?, grand_total = ?,
          total_qty = ?, status = ?, updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `, [
        date,
        dispatch_date,
        valid_day,
        expected_return_date,
        reference_no,
        customer_id,
        customerName,
        warehouse_id,
        destination,
        biller_id || null,
        note,
        totalAmount,
        totalAmount,
        totalQty,
        status,
        user.id || 1,
        id,
      ]);

      // Remove existing items and insert new items
      await conn.query('DELETE FROM aura_consignment_items WHERE consignment_id = ?', [id]);

      for (const item of items) {
        const productId = item.product_id;
        const qty = parseFloat(item.quantity || 0);
        const unitPrice = parseFloat(item.unit_price || 0);
        const realUnitPrice = parseFloat(item.real_unit_price || unitPrice);
        const netUnitPrice = parseFloat(item.net_unit_price || unitPrice);
        const unitCost = parseFloat(item.unit_cost || 0);
        const subtotal = qty * unitPrice;

        await conn.query(`
          INSERT INTO aura_consignment_items (
            consignment_id, product_id, product_code, product_name, product_type,
            real_unit_price, net_unit_price, unit_price, unit_cost, quantity, unit_quantity,
            warehouse_id, option_id, subtotal, product_unit_id, product_unit_code,
            comment, expiry, serial_no, return_qty, sale_qty, damage_qty, missing_qty, batch_no
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          productId,
          item.product_code || '',
          item.product_name || '',
          item.product_type || 'standard',
          realUnitPrice,
          netUnitPrice,
          unitPrice,
          unitCost,
          qty,
          qty,
          warehouse_id,
          item.option_id || null,
          subtotal,
          item.product_unit_id || null,
          item.product_unit_code || 'Unit',
          item.comment || '',
          item.expiry || null,
          item.serial_no || null,
          parseFloat(item.return_qty || 0),
          parseFloat(item.sale_qty || 0),
          parseFloat(item.damage_qty || 0),
          parseFloat(item.missing_qty || 0),
          item.batch_no || null,
        ]);

        if (newDeduct) {
          await conn.query(`
            UPDATE aura_warehouses_products 
            SET quantity = quantity - ? 
            WHERE product_id = ? AND warehouse_id = ?
          `, [qty, productId, warehouse_id]);

          await conn.query(`
            UPDATE aura_products 
            SET quantity = quantity - ? 
            WHERE id = ?
          `, [qty, productId]);

          if (item.option_id) {
            await conn.query(`
              UPDATE aura_warehouses_products_variants 
              SET quantity = quantity - ? 
              WHERE option_id = ? AND warehouse_id = ?
            `, [qty, item.option_id, warehouse_id]);

            await conn.query(`
              UPDATE aura_product_variants 
              SET quantity = quantity - ? 
              WHERE id = ?
            `, [qty, item.option_id]);
          }

          await conn.query(`
            INSERT INTO aura_stock_movement (
              date, reference_no, transaction, transaction_id,
              warehouse_id, product_id, product_type, product_code, product_name,
              real_unit_cost, quantity, unit_quantity,
              unit_code, unit_id, option_id, serial_no, expiry, user_id, actual_date
            ) VALUES (?, ?, 'Consignment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            date,
            reference_no,
            id,
            warehouse_id,
            productId,
            item.product_type || 'standard',
            item.product_code || '',
            item.product_name || '',
            unitCost,
            -qty,
            -qty,
            item.product_unit_code || 'Unit',
            item.product_unit_id || null,
            item.option_id || null,
            item.serial_no || null,
            item.expiry || null,
            user.id || 1,
            date,
          ]);
        }
      }

      await this.syncConsignmentStatus(conn, id);

      await conn.commit();
      return { id, reference_no };
    } catch (err) {
      await conn.rollback();
      logError('updateConsignment', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 7. Record Consignment Returns (goods returned from consignee to warehouse)
   */
  static async recordConsignmentReturn(id, payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [parentRows] = await conn.query('SELECT * FROM aura_consignments WHERE id = ? FOR UPDATE', [id]);
      if (parentRows.length === 0) throw new Error(`Consignment #${id} not found`);
      const parent = parentRows[0];

      const {
        date = new Date(),
        reference_no,
        note = '',
        items = [], // [{ consignment_item_id, product_id, return_quantity, unit_cost }]
      } = payload;

      if (!items || items.length === 0) {
        throw new Error('Please select at least one item to return.');
      }

      let returnRef = reference_no;
      if (!returnRef || !returnRef.trim()) {
        const yearShort = new Date().getFullYear().toString().slice(-2);
        const [lastRow] = await conn.query('SELECT id FROM aura_consignments ORDER BY id DESC LIMIT 1 FOR UPDATE');
        returnRef = `RCSM${yearShort}/${String((lastRow[0]?.id || 0) + 1).padStart(4, '0')}`;
      }

      let totalReturnedQty = 0;
      let totalReturnedAmount = 0;

      // Create return record in aura_consignments
      const [retInsert] = await conn.query(`
        INSERT INTO aura_consignments (
          consignment_id, date, reference_no, customer_id, customer,
          warehouse_id, biller_id, biller, project_id, note, total, grand_total,
          total_qty, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'returned', ?)
      `, [
        id,
        date,
        returnRef,
        parent.customer_id,
        parent.customer,
        parent.warehouse_id,
        parent.biller_id,
        parent.biller,
        parent.project_id,
        note,
        0, 0, 0,
        user.id || 1,
      ]);

      const returnId = retInsert.insertId;

      for (const item of items) {
        const retQty = parseFloat(item.return_quantity || 0);
        if (retQty <= 0) continue;

        // Fetch parent item to validate
        const [pItemRows] = await conn.query('SELECT * FROM aura_consignment_items WHERE id = ? LIMIT 1 FOR UPDATE', [item.consignment_item_id]);
        if (pItemRows.length === 0) continue;
        const pItem = pItemRows[0];

        const alreadyReturned = parseFloat(pItem.return_qty || 0);
        const alreadySold = parseFloat(pItem.sale_qty || 0);
        const maxReturnable = Math.max(0, parseFloat(pItem.quantity) - alreadyReturned - alreadySold);

        if (retQty > maxReturnable) {
          throw new Error(`Cannot return ${retQty} of "${pItem.product_name}". Maximum returnable balance is ${maxReturnable}.`);
        }

        const unitPrice = parseFloat(pItem.unit_price || 0);
        const subtotal = -(retQty * unitPrice);

        totalReturnedQty += retQty;
        totalReturnedAmount += subtotal;

        // Insert return child item
        await conn.query(`
          INSERT INTO aura_consignment_items (
            consignment_id, consignment_item_id, product_id, product_code, product_name,
            product_type, real_unit_price, net_unit_price, unit_price, unit_cost,
            quantity, unit_quantity, warehouse_id, option_id, subtotal,
            product_unit_id, product_unit_code, comment, expiry, serial_no
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          returnId,
          pItem.id,
          pItem.product_id,
          pItem.product_code,
          pItem.product_name,
          pItem.product_type,
          pItem.real_unit_price,
          pItem.net_unit_price,
          unitPrice,
          pItem.unit_cost,
          -retQty,
          -retQty,
          parent.warehouse_id,
          pItem.option_id,
          subtotal,
          pItem.product_unit_id,
          pItem.product_unit_code,
          item.comment || '',
          pItem.expiry,
          pItem.serial_no,
        ]);

        // Add stock BACK to warehouse
        await conn.query(`
          UPDATE aura_warehouses_products 
          SET quantity = quantity + ? 
          WHERE product_id = ? AND warehouse_id = ?
        `, [retQty, pItem.product_id, parent.warehouse_id]);

        await conn.query(`
          UPDATE aura_products 
          SET quantity = quantity + ? 
          WHERE id = ?
        `, [retQty, pItem.product_id]);

        if (pItem.option_id) {
          await conn.query(`
            UPDATE aura_warehouses_products_variants 
            SET quantity = quantity + ? 
            WHERE option_id = ? AND warehouse_id = ?
          `, [retQty, pItem.option_id, parent.warehouse_id]);

          await conn.query(`
            UPDATE aura_product_variants 
            SET quantity = quantity + ? 
            WHERE id = ?
          `, [retQty, pItem.option_id]);
        }

        // Insert positive movement log (return to warehouse)
        await conn.query(`
          INSERT INTO aura_stock_movement (
            date, reference_no, transaction, transaction_id,
            warehouse_id, product_id, product_type, product_code, product_name,
            real_unit_cost, quantity, unit_quantity,
            unit_code, unit_id, option_id, serial_no, expiry, user_id, actual_date
          ) VALUES (?, ?, 'Consignment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          date,
          returnRef,
          returnId,
          parent.warehouse_id,
          pItem.product_id,
          pItem.product_type,
          pItem.product_code,
          pItem.product_name,
          pItem.unit_cost,
          retQty,
          retQty,
          pItem.product_unit_code,
          pItem.product_unit_id,
          pItem.option_id,
          pItem.serial_no,
          pItem.expiry,
          user.id || 1,
          date,
        ]);

        // Update parent item's return_qty
        await conn.query(`
          UPDATE aura_consignment_items 
          SET return_qty = return_qty + ? 
          WHERE id = ?
        `, [retQty, pItem.id]);
      }

      // Update return header totals
      await conn.query(`
        UPDATE aura_consignments 
        SET total = ?, grand_total = ?, total_qty = ? 
        WHERE id = ?
      `, [totalReturnedAmount, totalReturnedAmount, totalReturnedQty, returnId]);

      // Sync parent consignment status
      await this.syncConsignmentStatus(conn, id);

      await conn.commit();
      return { return_id: returnId, reference_no: returnRef, total_returned_qty: totalReturnedQty };
    } catch (err) {
      await conn.rollback();
      logError('recordConsignmentReturn', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 8. Record Consignment Sales (consignee reports sold items)
   */
  static async recordConsignmentSales(id, payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [parentRows] = await conn.query('SELECT * FROM aura_consignments WHERE id = ? FOR UPDATE', [id]);
      if (parentRows.length === 0) throw new Error(`Consignment #${id} not found`);

      const { items = [] } = payload; // [{ consignment_item_id, sale_quantity }]

      for (const item of items) {
        const saleQty = parseFloat(item.sale_quantity || 0);
        if (saleQty <= 0) continue;

        const [pItemRows] = await conn.query('SELECT * FROM aura_consignment_items WHERE id = ? LIMIT 1 FOR UPDATE', [item.consignment_item_id]);
        if (pItemRows.length === 0) continue;
        const pItem = pItemRows[0];

        const alreadyReturned = parseFloat(pItem.return_qty || 0);
        const alreadySold = parseFloat(pItem.sale_qty || 0);
        const maxSalable = Math.max(0, parseFloat(pItem.quantity) - alreadyReturned - alreadySold);

        if (saleQty > maxSalable) {
          throw new Error(`Cannot record sale of ${saleQty} for "${pItem.product_name}". Maximum unsold balance is ${maxSalable}.`);
        }

        await conn.query(`
          UPDATE aura_consignment_items 
          SET sale_qty = sale_qty + ? 
          WHERE id = ?
        `, [saleQty, pItem.id]);
      }

      await this.syncConsignmentStatus(conn, id);

      await conn.commit();
      return { id, sales_recorded: true };
    } catch (err) {
      await conn.rollback();
      logError('recordConsignmentSales', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 9. Delete a consignment with complete inventory and return rollback
   */
  static async deleteConsignment(id, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [headerRows] = await conn.query('SELECT * FROM aura_consignments WHERE id = ? FOR UPDATE', [id]);
      if (headerRows.length === 0) throw new Error(`Consignment #${id} not found`);
      const record = headerRows[0];

      // Retrieve items
      const [items] = await conn.query('SELECT * FROM aura_consignment_items WHERE consignment_id = ?', [id]);

      // Revert parent stock deductions if dispatched
      const wasDeducted = (record.status === 'dispatched' || record.status === 'pending' || record.status === 'approved' || record.status === 'partially_sold' || record.status === 'partially_returned');
      if (wasDeducted) {
        for (const it of items) {
          const qty = parseFloat(it.quantity || 0);

          await conn.query(`
            UPDATE aura_warehouses_products 
            SET quantity = quantity + ? 
            WHERE product_id = ? AND warehouse_id = ?
          `, [qty, it.product_id, record.warehouse_id]);

          await conn.query(`
            UPDATE aura_products 
            SET quantity = quantity + ? 
            WHERE id = ?
          `, [qty, it.product_id]);

          if (it.option_id) {
            await conn.query(`
              UPDATE aura_warehouses_products_variants 
              SET quantity = quantity + ? 
              WHERE option_id = ? AND warehouse_id = ?
            `, [qty, it.option_id, record.warehouse_id]);

            await conn.query(`
              UPDATE aura_product_variants 
              SET quantity = quantity + ? 
              WHERE id = ?
            `, [qty, it.option_id]);
          }
        }
      }

      // Revert associated returns (if any goods were returned back, remove them so stock is clean)
      const [childReturns] = await conn.query('SELECT * FROM aura_consignments WHERE consignment_id = ?', [id]);
      for (const cr of childReturns) {
        const [crItems] = await conn.query('SELECT * FROM aura_consignment_items WHERE consignment_id = ?', [cr.id]);
        for (const crit of crItems) {
          const retQty = Math.abs(parseFloat(crit.quantity || 0));
          await conn.query(`
            UPDATE aura_warehouses_products 
            SET quantity = quantity - ? 
            WHERE product_id = ? AND warehouse_id = ?
          `, [retQty, crit.product_id, cr.warehouse_id]);

          await conn.query(`
            UPDATE aura_products 
            SET quantity = quantity - ? 
            WHERE id = ?
          `, [retQty, crit.product_id]);
        }
        await conn.query('DELETE FROM aura_stock_movement WHERE transaction = "Consignment" AND transaction_id = ?', [cr.id]);
        await conn.query('DELETE FROM aura_consignment_items WHERE consignment_id = ?', [cr.id]);
        await conn.query('DELETE FROM aura_consignments WHERE id = ?', [cr.id]);
      }

      // Delete parent movement logs, items, and record
      await conn.query('DELETE FROM aura_stock_movement WHERE transaction = "Consignment" AND transaction_id = ?', [id]);
      await conn.query('DELETE FROM aura_consignment_items WHERE consignment_id = ?', [id]);
      await conn.query('DELETE FROM aura_consignments WHERE id = ?', [id]);

      await conn.commit();
      return { id, deleted: true };
    } catch (err) {
      await conn.rollback();
      logError('deleteConsignment', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Helper: Reconcile consignment item balances and sync header status
   * Status logic: completed when (sale_qty + return_qty + damage_qty + missing_qty) >= quantity
   */
  static async syncConsignmentStatus(conn, consignmentId) {
    if (!consignmentId) return;
    try {
      const [sumRows] = await conn.query(`
        SELECT 
          COALESCE(SUM(quantity), 0) AS total_qty,
          COALESCE(SUM(sale_qty), 0) AS total_sold,
          COALESCE(SUM(return_qty), 0) AS total_returned,
          COALESCE(SUM(damage_qty), 0) AS total_damaged,
          COALESCE(SUM(missing_qty), 0) AS total_missing
        FROM aura_consignment_items
        WHERE consignment_id = ?
      `, [consignmentId]);

      if (sumRows.length > 0) {
        const { total_qty, total_sold, total_returned, total_damaged, total_missing } = sumRows[0];
        const accounted = (parseFloat(total_sold) || 0) + (parseFloat(total_returned) || 0) + (parseFloat(total_damaged) || 0) + (parseFloat(total_missing) || 0);
        const dispatched = parseFloat(total_qty) || 0;

        let status = 'dispatched';
        if (dispatched > 0 && accounted >= dispatched) {
          status = 'completed';
        } else if ((parseFloat(total_sold) || 0) > 0 && (parseFloat(total_returned) || 0) > 0) {
          status = 'partially_sold';
        } else if ((parseFloat(total_sold) || 0) > 0) {
          status = 'partially_sold';
        } else if ((parseFloat(total_returned) || 0) > 0) {
          status = 'partially_returned';
        }

        await conn.query('UPDATE aura_consignments SET status = ? WHERE id = ?', [status, consignmentId]);
      }
    } catch (err) {
      logError('syncConsignmentStatus', err);
    }
  }
}

module.exports = ConsignmentsModel;
