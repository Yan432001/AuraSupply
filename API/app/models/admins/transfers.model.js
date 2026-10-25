const db = require('../../config/dbPool');

function logError(context, err) {
  console.error(`[TransfersModel Error] [${context}]:`, err?.message || err);
}

class TransfersModel {
  /**
   * 1. Get metadata options (warehouses, billers, tax rates, generated reference, statuses)
   */
  static async getMetadataOptions() {
    try {
      const [warehouses] = await db.query(`
        SELECT id, code, name, address, phone, email 
        FROM aura_warehouses 
        ORDER BY name ASC
      `);

      const [billers] = await db.query(`
        SELECT id, name, company, vat_no, phone, email, address 
        FROM aura_companies 
        WHERE group_name = 'biller' 
        ORDER BY company ASC
      `);

      const [taxRates] = await db.query(`
        SELECT id, name, code, rate, type 
        FROM aura_tax_rates 
        ORDER BY name ASC
      `);

      // Generate next transfer reference like TR-XXXXXX (or timestamp sequence)
      const [lastTransfer] = await db.query(`
        SELECT id, transfer_no 
        FROM aura_transfers 
        ORDER BY id DESC 
        LIMIT 1
      `);

      const nextId = (lastTransfer[0]?.id || 0) + 1;
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const nextReferenceNo = `TR-${String(nextId).padStart(4, '0')}${randomPart.toString().slice(-2)}`;

      const statuses = [
        { key: 'draft', label: 'Draft', color: 'default' },
        { key: 'pending', label: 'Pending (Request)', color: 'orange' },
        { key: 'approved', label: 'Approved (Order)', color: 'blue' },
        { key: 'in_transit', label: 'In Transit (Dispatched)', color: 'purple' },
        { key: 'partially_received', label: 'Partially Received', color: 'gold' },
        { key: 'completed', label: 'Completed (Received)', color: 'green' },
        { key: 'rejected', label: 'Rejected', color: 'volcano' },
        { key: 'cancelled', label: 'Cancelled', color: 'red' },
      ];

      return {
        warehouses: warehouses || [],
        billers: billers || [],
        taxRates: taxRates || [],
        nextReferenceNo,
        statuses,
      };
    } catch (err) {
      logError('getMetadataOptions', err);
      throw err;
    }
  }

  /**
   * 2. Search available products in a source warehouse
   */
  static async getAvailableProducts(warehouseId, term = '', limit = 20) {
    try {
      if (!warehouseId) {
        return [];
      }

      const cleanTerm = term ? term.trim() : '';
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

      const conditions = ['wp.warehouse_id = ?'];
      const params = [parseInt(warehouseId, 10)];

      if (cleanTerm) {
        const searchPattern = `%${cleanTerm}%`;
        conditions.push(`(
          p.code LIKE ? OR 
          p.barcode LIKE ? OR 
          p.name LIKE ? OR 
          pv.name LIKE ? OR 
          pv.sku LIKE ?
        )`);
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const query = `
        SELECT 
          p.id AS product_id,
          p.code AS product_code,
          p.name AS product_name,
          p.type AS product_type,
          p.cost AS default_cost,
          p.unit AS unit_id,
          u.code AS unit_code,
          u.name AS unit_name,
          p.tax_rate AS tax_rate_id,
          tr.rate AS tax_rate_percentage,
          tr.name AS tax_rate_name,
          p.tax_method,
          p.image,
          wp.quantity AS warehouse_quantity,
          wp.avg_cost AS warehouse_avg_cost,
          pv.id AS option_id,
          pv.name AS variant_name,
          pv.sku AS variant_sku,
          wpv.quantity AS variant_quantity
        FROM aura_warehouses_products wp
        JOIN aura_products p ON p.id = wp.product_id
        LEFT JOIN aura_units u ON u.id = p.unit
        LEFT JOIN aura_tax_rates tr ON tr.id = p.tax_rate
        LEFT JOIN aura_product_variants pv ON pv.product_id = p.id
        LEFT JOIN aura_warehouses_products_variants wpv ON wpv.option_id = pv.id AND wpv.warehouse_id = wp.warehouse_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.name ASC, pv.name ASC
        LIMIT ?
      `;
      params.push(limitNum);

      const [rows] = await db.query(query, params);

      return rows.map((r) => {
        const availableStock = r.option_id
          ? parseFloat(r.variant_quantity || 0)
          : parseFloat(r.warehouse_quantity || 0);

        const realCost = parseFloat(r.warehouse_avg_cost || r.default_cost || 0);

        return {
          id: r.product_id,
          product_id: r.product_id,
          product_code: r.product_code,
          product_name: r.product_name,
          display_name: r.variant_name
            ? `${r.product_name} (${r.variant_name})`
            : r.product_name,
          product_type: r.product_type,
          option_id: r.option_id || null,
          variant_name: r.variant_name || null,
          variant_sku: r.variant_sku || null,
          unit_id: r.unit_id,
          unit_code: r.unit_code || 'ea',
          unit_name: r.unit_name || '',
          unit_cost: realCost,
          net_unit_cost: realCost,
          tax_rate_id: r.tax_rate_id || null,
          tax_rate_percentage: parseFloat(r.tax_rate_percentage || 0),
          tax_rate_name: r.tax_rate_name || 'No Tax',
          tax_method: r.tax_method || 1,
          available_quantity: availableStock,
          image: r.image,
        };
      });
    } catch (err) {
      logError('getAvailableProducts', err);
      throw err;
    }
  }

  /**
   * 3. List transfers with comprehensive filters, search, and aggregates
   */
  static async listTransfers({
    search = '',
    from_warehouse_id = 'all',
    to_warehouse_id = 'all',
    status = 'all',
    start_date = null,
    end_date = null,
    sort_by = 't.date',
    sort_order = 'DESC',
    page = 1,
    limit = 20,
  } = {}) {
    try {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      const conditions = ['1=1'];
      const params = [];

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        conditions.push(`(
          t.transfer_no LIKE ? OR 
          t.note LIKE ? OR 
          t.from_warehouse_name LIKE ? OR 
          t.to_warehouse_name LIKE ? OR 
          EXISTS (
            SELECT 1 FROM aura_transfer_items ti 
            WHERE ti.transfer_id = t.id AND (ti.product_name LIKE ? OR ti.product_code LIKE ?)
          )
        )`);
        params.push(term, term, term, term, term, term);
      }

      if (from_warehouse_id && from_warehouse_id !== 'all') {
        conditions.push('t.from_warehouse_id = ?');
        params.push(parseInt(from_warehouse_id, 10));
      }

      if (to_warehouse_id && to_warehouse_id !== 'all') {
        conditions.push('t.to_warehouse_id = ?');
        params.push(parseInt(to_warehouse_id, 10));
      }

      if (status && status !== 'all') {
        if (status === 'sent') {
          conditions.push("t.status IN ('sent', 'in_transit')");
        } else {
          conditions.push('t.status = ?');
          params.push(status);
        }
      }

      if (start_date) {
        conditions.push('t.date >= ?');
        params.push(`${start_date} 00:00:00`);
      }

      if (end_date) {
        conditions.push('t.date <= ?');
        params.push(`${end_date} 23:59:59`);
      }

      const whereClause = conditions.join(' AND ');

      // Summary statistics across filters
      const [stats] = await db.query(`
        SELECT 
          COUNT(DISTINCT t.id) AS total_count,
          COALESCE(SUM(CASE WHEN t.status IN ('pending', 'draft') THEN 1 ELSE 0 END), 0) AS count_pending,
          COALESCE(SUM(CASE WHEN t.status = 'approved' THEN 1 ELSE 0 END), 0) AS count_approved,
          COALESCE(SUM(CASE WHEN t.status IN ('sent', 'in_transit') THEN 1 ELSE 0 END), 0) AS count_in_transit,
          COALESCE(SUM(CASE WHEN t.status = 'partially_received' THEN 1 ELSE 0 END), 0) AS count_partially_received,
          COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0) AS count_completed,
          COALESCE(SUM(CASE WHEN t.status IN ('rejected', 'cancelled') THEN 1 ELSE 0 END), 0) AS count_cancelled,
          COALESCE(SUM(t.grand_total), 0) AS total_grand_total,
          COALESCE(SUM(t.shipping), 0) AS total_shipping,
          COALESCE(SUM(t.in_transit_quantity), 0) AS total_in_transit_qty
        FROM aura_transfers t
        WHERE ${whereClause}
      `, params);

      const totalRecords = stats[0]?.total_count || 0;

      // Safe column sorting
      const allowedSortCols = {
        id: 't.id',
        date: 't.date',
        transfer_no: 't.transfer_no',
        from_warehouse_name: 't.from_warehouse_name',
        to_warehouse_name: 't.to_warehouse_name',
        status: 't.status',
        grand_total: 't.grand_total',
        shipping: 't.shipping',
      };

      const sortCol = allowedSortCols[sort_by] || 't.date';
      const sortDir = String(sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Query records
      const [rows] = await db.query(`
        SELECT 
          t.id,
          t.transfer_no,
          t.date,
          t.from_warehouse_id,
          t.from_warehouse_code,
          t.from_warehouse_name,
          t.to_warehouse_id,
          t.to_warehouse_code,
          t.to_warehouse_name,
          t.from_biller,
          t.to_biller,
          fb.company AS from_biller_name,
          tb.company AS to_biller_name,
          t.status,
          t.total,
          t.total_tax,
          t.shipping,
          t.grand_total,
          t.note,
          t.attachment,
          t.created_by,
          u.username AS created_by_username,
          CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS created_by_name,
          t.approved_by,
          t.approved_at,
          t.dispatched_by,
          t.dispatched_at,
          t.received_by,
          t.received_at,
          t.cancelled_by,
          t.cancelled_at,
          t.cancel_reason,
          t.in_transit_quantity,
          t.received_quantity,
          (
            SELECT COUNT(*) 
            FROM aura_transfer_items ti 
            WHERE ti.transfer_id = t.id
          ) AS items_count,
          (
            SELECT COALESCE(SUM(ti.quantity), 0) 
            FROM aura_transfer_items ti 
            WHERE ti.transfer_id = t.id
          ) AS total_items_quantity
        FROM aura_transfers t
        LEFT JOIN aura_companies fb ON fb.id = t.from_biller
        LEFT JOIN aura_companies tb ON tb.id = t.to_biller
        LEFT JOIN aura_users u ON u.id = t.created_by
        WHERE ${whereClause}
        ORDER BY ${sortCol} ${sortDir}
        LIMIT ? OFFSET ?
      `, [...params, limitNum, offset]);

      return {
        data: rows,
        stats: stats[0] || {},
        pagination: {
          current_page: pageNum,
          limit: limitNum,
          total_records: totalRecords,
          total_pages: Math.ceil(totalRecords / limitNum),
        },
      };
    } catch (err) {
      logError('listTransfers', err);
      throw err;
    }
  }

  /**
   * 4. Get detailed transfer by ID with items, warehouse info, and full action history
   */
  static async getTransferById(id) {
    try {
      const [transfers] = await db.query(`
        SELECT 
          t.*,
          fw.name AS from_warehouse_name,
          fw.code AS from_warehouse_code,
          fw.address AS from_warehouse_address,
          tw.name AS to_warehouse_name,
          tw.code AS to_warehouse_code,
          tw.address AS to_warehouse_address,
          fb.company AS from_biller_company,
          fb.name AS from_biller_name,
          tb.company AS to_biller_company,
          tb.name AS to_biller_name,
          u.username AS creator_username,
          CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS creator_fullname,
          au.username AS approver_username,
          du.username AS dispatcher_username,
          ru.username AS receiver_username
        FROM aura_transfers t
        LEFT JOIN aura_warehouses fw ON fw.id = t.from_warehouse_id
        LEFT JOIN aura_warehouses tw ON tw.id = t.to_warehouse_id
        LEFT JOIN aura_companies fb ON fb.id = t.from_biller
        LEFT JOIN aura_companies tb ON tb.id = t.to_biller
        LEFT JOIN aura_users u ON u.id = t.created_by
        LEFT JOIN aura_users au ON au.id = t.approved_by
        LEFT JOIN aura_users du ON du.id = t.dispatched_by
        LEFT JOIN aura_users ru ON ru.id = t.received_by
        WHERE t.id = ?
        LIMIT 1
      `, [id]);

      if (!transfers.length) {
        return null;
      }

      const transfer = transfers[0];

      // Retrieve transfer items
      const [items] = await db.query(`
        SELECT 
          ti.*,
          p.image,
          p.type AS product_type,
          pv.name AS variant_name,
          pv.sku AS variant_sku,
          u.code AS unit_code,
          u.name AS unit_name,
          COALESCE(wp_from.quantity, 0) AS from_wh_stock,
          COALESCE(wp_to.quantity, 0) AS to_wh_stock
        FROM aura_transfer_items ti
        LEFT JOIN aura_products p ON p.id = ti.product_id
        LEFT JOIN aura_product_variants pv ON pv.id = ti.option_id
        LEFT JOIN aura_units u ON u.id = ti.product_unit_id
        LEFT JOIN aura_warehouses_products wp_from ON wp_from.product_id = ti.product_id AND wp_from.warehouse_id = ?
        LEFT JOIN aura_warehouses_products wp_to ON wp_to.product_id = ti.product_id AND wp_to.warehouse_id = ?
        WHERE ti.transfer_id = ?
        ORDER BY ti.id ASC
      `, [transfer.from_warehouse_id, transfer.to_warehouse_id, id]);

      // Retrieve audit history
      const [history] = await db.query(`
        SELECT 
          th.*,
          u.username AS actor_username,
          CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS actor_fullname
        FROM aura_transfer_history th
        LEFT JOIN aura_users u ON u.id = th.actor_id
        WHERE th.transfer_id = ?
        ORDER BY th.created_at ASC
      `, [id]);

      return {
        ...transfer,
        items: items || [],
        history: history || [],
      };
    } catch (err) {
      logError('getTransferById', err);
      throw err;
    }
  }

  /**
   * Helper: Insert history action into aura_transfer_history
   */
  static async logHistory(conn, {
    transfer_id,
    action,
    from_status,
    to_status,
    actor_id,
    actor_name,
    note = '',
    data_payload = null,
  }) {
    await conn.query(`
      INSERT INTO aura_transfer_history (
        transfer_id, action, from_status, to_status, actor_id, actor_name, note, data_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transfer_id,
      action,
      from_status,
      to_status,
      actor_id || null,
      actor_name || null,
      note || null,
      data_payload ? JSON.stringify(data_payload) : null,
    ]);
  }

  /**
   * 5. Create Transfer (Lifecycle support: draft, pending, approved, in_transit, completed)
   */
  static async createTransfer(payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        transfer_no,
        date = new Date(),
        from_warehouse_id,
        to_warehouse_id,
        from_biller = null,
        to_biller = null,
        status = 'pending',
        shipping = 0,
        note = '',
        items = [],
        attachment = null,
      } = payload;

      if (!from_warehouse_id || !to_warehouse_id) {
        throw new Error('Source warehouse and destination warehouse are required');
      }

      if (parseInt(from_warehouse_id, 10) === parseInt(to_warehouse_id, 10)) {
        throw new Error('Source warehouse and destination warehouse cannot be the same');
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('At least one product item is required for the transfer');
      }

      // Warehouse details
      const [whRows] = await conn.query(
        'SELECT id, code, name FROM aura_warehouses WHERE id IN (?, ?)',
        [from_warehouse_id, to_warehouse_id]
      );
      const fromWh = whRows.find((w) => w.id === parseInt(from_warehouse_id, 10));
      const toWh = whRows.find((w) => w.id === parseInt(to_warehouse_id, 10));

      if (!fromWh || !toWh) {
        throw new Error('Invalid source or destination warehouse specified');
      }

      // Generate Reference No if not provided
      let finalTransferNo = transfer_no;
      if (!finalTransferNo) {
        const [last] = await conn.query('SELECT id FROM aura_transfers ORDER BY id DESC LIMIT 1');
        const nextId = (last[0]?.id || 0) + 1;
        finalTransferNo = `TR-${String(nextId).padStart(4, '0')}${Math.floor(10 + Math.random() * 90)}`;
      }

      // Calculate totals
      let totalAmount = 0;
      let totalTax = 0;
      let totalQty = 0;

      const processedItems = [];

      for (const item of items) {
        const qty = parseFloat(item.quantity || 0);
        if (qty <= 0) {
          throw new Error(`Quantity for product "${item.product_name || item.product_code}" must be greater than 0`);
        }

        // Verify stock in source warehouse if immediate dispatch or direct completion
        const [stockRow] = await conn.query(`
          SELECT quantity FROM aura_warehouses_products 
          WHERE product_id = ? AND warehouse_id = ? 
          FOR UPDATE
        `, [item.product_id, from_warehouse_id]);

        const currentStock = parseFloat(stockRow[0]?.quantity || 0);

        if ((status === 'in_transit' || status === 'sent' || status === 'completed') && currentStock < qty) {
          throw new Error(
            `Insufficient stock for product "${item.product_name || item.product_code}". Available: ${currentStock}, Requested: ${qty}`
          );
        }

        const unitCost = parseFloat(item.unit_cost || item.net_unit_cost || 0);
        const itemTax = parseFloat(item.item_tax || 0);
        const subtotal = parseFloat(item.subtotal || unitCost * qty + itemTax);

        totalAmount += unitCost * qty;
        totalTax += itemTax;
        totalQty += qty;

        processedItems.push({
          product_id: item.product_id,
          product_code: item.product_code || '',
          product_name: item.product_name || '',
          option_id: item.option_id ? parseInt(item.option_id, 10) : null,
          quantity: qty,
          quantity_balance: qty,
          received_quantity: status === 'completed' ? qty : 0,
          damaged_quantity: 0,
          shortage_quantity: 0,
          unit_cost: unitCost,
          net_unit_cost: parseFloat(item.net_unit_cost || unitCost),
          real_unit_cost: parseFloat(item.real_unit_cost || unitCost),
          tax_rate_id: item.tax_rate_id || null,
          tax: item.tax || '0',
          item_tax: itemTax,
          subtotal,
          warehouse_id: to_warehouse_id,
          product_unit_id: item.product_unit_id || null,
          product_unit_code: item.product_unit_code || 'ea',
          unit_quantity: parseFloat(item.unit_quantity || 1),
          date: date ? new Date(date) : new Date(),
        });
      }

      const shippingVal = parseFloat(shipping || 0);
      const grandTotal = totalAmount + totalTax + shippingVal;

      // Status timestamps & actors
      const isDispatched = status === 'in_transit' || status === 'sent' || status === 'completed';
      const isCompleted = status === 'completed';

      const [transferInsert] = await conn.query(`
        INSERT INTO aura_transfers (
          transfer_no, date, from_warehouse_id, from_warehouse_code, from_warehouse_name,
          to_warehouse_id, to_warehouse_code, to_warehouse_name, from_biller, to_biller,
          status, total, total_tax, shipping, grand_total, note, attachment, created_by,
          dispatched_by, dispatched_at, received_by, received_at,
          in_transit_quantity, received_quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        finalTransferNo,
        date ? new Date(date) : new Date(),
        from_warehouse_id,
        fromWh.code,
        fromWh.name,
        to_warehouse_id,
        toWh.code,
        toWh.name,
        from_biller || null,
        to_biller || null,
        status,
        totalAmount,
        totalTax,
        shippingVal,
        grandTotal,
        note || '',
        attachment || null,
        user.id || 1,
        isDispatched ? user.id || 1 : null,
        isDispatched ? new Date() : null,
        isCompleted ? user.id || 1 : null,
        isCompleted ? new Date() : null,
        isDispatched && !isCompleted ? totalQty : 0,
        isCompleted ? totalQty : 0,
      ]);

      const transferId = transferInsert.insertId;

      // Insert Items
      for (const item of processedItems) {
        await conn.query(`
          INSERT INTO aura_transfer_items (
            transfer_id, product_id, product_code, product_name, option_id,
            quantity, quantity_balance, received_quantity, damaged_quantity, shortage_quantity,
            unit_cost, net_unit_cost, real_unit_cost, tax_rate_id, tax, item_tax,
            subtotal, warehouse_id, product_unit_id, product_unit_code, unit_quantity, date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          transferId,
          item.product_id,
          item.product_code,
          item.product_name,
          item.option_id,
          item.quantity,
          item.quantity_balance,
          item.received_quantity,
          item.damaged_quantity,
          item.shortage_quantity,
          item.unit_cost,
          item.net_unit_cost,
          item.real_unit_cost,
          item.tax_rate_id,
          item.tax,
          item.item_tax,
          item.subtotal,
          item.warehouse_id,
          item.product_unit_id,
          item.product_unit_code,
          item.unit_quantity,
          item.date,
        ]);

        // Physical Stock Movements & Deductions
        if (isDispatched) {
          // 1. Deduct from Source Warehouse
          await conn.query(`
            UPDATE aura_warehouses_products 
            SET quantity = quantity - ? 
            WHERE product_id = ? AND warehouse_id = ?
          `, [item.quantity, item.product_id, from_warehouse_id]);

          if (item.option_id) {
            await conn.query(`
              UPDATE aura_warehouses_products_variants 
              SET quantity = quantity - ? 
              WHERE option_id = ? AND warehouse_id = ?
            `, [item.quantity, item.option_id, from_warehouse_id]);
          }

          // Record stock movement (transfer_out)
          await conn.query(`
            INSERT INTO aura_stock_movement (
              date, reference_no, transaction, transaction_id, warehouse_id,
              product_id, product_code, product_name, option_id,
              real_unit_cost, quantity, unit_quantity, unit_code, unit_id, user_id
            ) VALUES (?, ?, 'transfer_out', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            new Date(),
            finalTransferNo,
            transferId,
            from_warehouse_id,
            item.product_id,
            item.product_code,
            item.product_name,
            item.option_id,
            item.real_unit_cost,
            -item.quantity,
            item.unit_quantity,
            item.product_unit_code,
            item.product_unit_id,
            user.id || 1,
          ]);
        }

        if (isCompleted) {
          // 2. Add to Destination Warehouse (Upsert)
          await conn.query(`
            INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
          `, [item.product_id, to_warehouse_id, item.quantity, item.real_unit_cost]);

          if (item.option_id) {
            await conn.query(`
              INSERT INTO aura_warehouses_products_variants (option_id, product_id, warehouse_id, quantity)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
            `, [item.option_id, item.product_id, to_warehouse_id, item.quantity]);
          }

          // Record stock movement (transfer_in)
          await conn.query(`
            INSERT INTO aura_stock_movement (
              date, reference_no, transaction, transaction_id, warehouse_id,
              product_id, product_code, product_name, option_id,
              real_unit_cost, quantity, unit_quantity, unit_code, unit_id, user_id
            ) VALUES (?, ?, 'transfer_in', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            new Date(),
            finalTransferNo,
            transferId,
            to_warehouse_id,
            item.product_id,
            item.product_code,
            item.product_name,
            item.option_id,
            item.real_unit_cost,
            item.quantity,
            item.unit_quantity,
            item.product_unit_code,
            item.product_unit_id,
            user.id || 1,
          ]);
        }
      }

      // Log initial history
      const actionName = status === 'pending'
        ? 'created'
        : status === 'approved'
        ? 'approved'
        : status === 'in_transit' || status === 'sent'
        ? 'dispatched'
        : status === 'completed'
        ? 'completed'
        : 'draft_created';

      await TransfersModel.logHistory(conn, {
        transfer_id: transferId,
        action: actionName,
        from_status: null,
        to_status: status,
        actor_id: user.id || 1,
        actor_name: user.username || user.first_name || 'System',
        note: note || `Transfer ${finalTransferNo} created with status ${status}`,
        data_payload: {
          items_count: processedItems.length,
          total_qty: totalQty,
          grand_total: grandTotal,
        },
      });

      await conn.commit();
      return { id: transferId, transfer_no: finalTransferNo, status };
    } catch (err) {
      await conn.rollback();
      logError('createTransfer', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 6. Update Transfer (allowed when status is 'draft' or 'pending')
   */
  static async updateTransfer(id, payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT * FROM aura_transfers WHERE id = ? FOR UPDATE', [id]);
      if (!existing.length) {
        throw new Error('Transfer record not found');
      }

      const current = existing[0];
      if (['in_transit', 'sent', 'completed', 'cancelled'].includes(current.status)) {
        throw new Error(`Transfers in "${current.status}" status cannot be directly modified. Use workflow actions.`);
      }

      const {
        transfer_no,
        date,
        from_warehouse_id = current.from_warehouse_id,
        to_warehouse_id = current.to_warehouse_id,
        from_biller = current.from_biller,
        to_biller = current.to_biller,
        status = current.status,
        shipping = current.shipping,
        note = current.note,
        items = [],
      } = payload;

      if (parseInt(from_warehouse_id, 10) === parseInt(to_warehouse_id, 10)) {
        throw new Error('Source warehouse and destination warehouse cannot be the same');
      }

      // Warehouse details
      const [whRows] = await conn.query(
        'SELECT id, code, name FROM aura_warehouses WHERE id IN (?, ?)',
        [from_warehouse_id, to_warehouse_id]
      );
      const fromWh = whRows.find((w) => w.id === parseInt(from_warehouse_id, 10));
      const toWh = whRows.find((w) => w.id === parseInt(to_warehouse_id, 10));

      // Delete existing items
      await conn.query('DELETE FROM aura_transfer_items WHERE transfer_id = ?', [id]);

      let totalAmount = 0;
      let totalTax = 0;
      let totalQty = 0;

      for (const item of items) {
        const qty = parseFloat(item.quantity || 0);
        if (qty <= 0) {
          throw new Error(`Quantity for "${item.product_name}" must be greater than 0`);
        }

        const unitCost = parseFloat(item.unit_cost || 0);
        const itemTax = parseFloat(item.item_tax || 0);
        const subtotal = parseFloat(item.subtotal || unitCost * qty + itemTax);

        totalAmount += unitCost * qty;
        totalTax += itemTax;
        totalQty += qty;

        await conn.query(`
          INSERT INTO aura_transfer_items (
            transfer_id, product_id, product_code, product_name, option_id,
            quantity, quantity_balance, received_quantity, damaged_quantity, shortage_quantity,
            unit_cost, net_unit_cost, real_unit_cost, tax_rate_id, tax, item_tax,
            subtotal, warehouse_id, product_unit_id, product_unit_code, unit_quantity, date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          item.product_id,
          item.product_code || '',
          item.product_name || '',
          item.option_id ? parseInt(item.option_id, 10) : null,
          qty,
          qty,
          0,
          0,
          0,
          unitCost,
          unitCost,
          unitCost,
          item.tax_rate_id || null,
          item.tax || '0',
          itemTax,
          subtotal,
          to_warehouse_id,
          item.product_unit_id || null,
          item.product_unit_code || 'ea',
          item.unit_quantity || 1,
          date ? new Date(date) : new Date(),
        ]);
      }

      const shippingVal = parseFloat(shipping || 0);
      const grandTotal = totalAmount + totalTax + shippingVal;

      await conn.query(`
        UPDATE aura_transfers SET 
          transfer_no = ?,
          date = ?,
          from_warehouse_id = ?,
          from_warehouse_code = ?,
          from_warehouse_name = ?,
          to_warehouse_id = ?,
          to_warehouse_code = ?,
          to_warehouse_name = ?,
          from_biller = ?,
          to_biller = ?,
          status = ?,
          total = ?,
          total_tax = ?,
          shipping = ?,
          grand_total = ?,
          note = ?
        WHERE id = ?
      `, [
        transfer_no || current.transfer_no,
        date ? new Date(date) : current.date,
        from_warehouse_id,
        fromWh?.code || current.from_warehouse_code,
        fromWh?.name || current.from_warehouse_name,
        to_warehouse_id,
        toWh?.code || current.to_warehouse_code,
        toWh?.name || current.to_warehouse_name,
        from_biller || null,
        to_biller || null,
        status,
        totalAmount,
        totalTax,
        shippingVal,
        grandTotal,
        note,
        id,
      ]);

      await TransfersModel.logHistory(conn, {
        transfer_id: id,
        action: 'updated',
        from_status: current.status,
        to_status: status,
        actor_id: user.id || 1,
        actor_name: user.username || 'System',
        note: `Transfer updated. New items count: ${items.length}, Grand Total: ${grandTotal}`,
      });

      await conn.commit();
      return { id, status };
    } catch (err) {
      await conn.rollback();
      logError('updateTransfer', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 7. Approve Transfer (Transfer Request -> Transfer Order)
   */
  static async approveTransfer(id, user = {}, note = '') {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query('SELECT * FROM aura_transfers WHERE id = ? FOR UPDATE', [id]);
      if (!rows.length) {
        throw new Error('Transfer record not found');
      }

      const transfer = rows[0];
      if (transfer.status !== 'pending') {
        throw new Error(`Only pending transfers can be approved. Current status: "${transfer.status}"`);
      }

      // Check stock availability in source warehouse
      const [items] = await conn.query('SELECT * FROM aura_transfer_items WHERE transfer_id = ?', [id]);
      for (const item of items) {
        const [stock] = await conn.query(`
          SELECT quantity FROM aura_warehouses_products 
          WHERE product_id = ? AND warehouse_id = ?
        `, [item.product_id, transfer.from_warehouse_id]);

        const avail = parseFloat(stock[0]?.quantity || 0);
        if (avail < parseFloat(item.quantity)) {
          throw new Error(
            `Cannot approve transfer: product "${item.product_name}" has insufficient stock in warehouse. Available: ${avail}, Required: ${item.quantity}`
          );
        }
      }

      await conn.query(`
        UPDATE aura_transfers SET 
          status = 'approved',
          approved_by = ?,
          approved_at = NOW()
        WHERE id = ?
      `, [user.id || 1, id]);

      await TransfersModel.logHistory(conn, {
        transfer_id: id,
        action: 'approved',
        from_status: 'pending',
        to_status: 'approved',
        actor_id: user.id || 1,
        actor_name: user.username || 'Approver',
        note: note || 'Transfer approved and authorized for dispatch',
      });

      await conn.commit();
      return { id, status: 'approved' };
    } catch (err) {
      await conn.rollback();
      logError('approveTransfer', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 8. Reject Transfer
   */
  static async rejectTransfer(id, user = {}, reason = '') {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query('SELECT * FROM aura_transfers WHERE id = ? FOR UPDATE', [id]);
      if (!rows.length) {
        throw new Error('Transfer record not found');
      }

      const transfer = rows[0];
      if (transfer.status !== 'pending') {
        throw new Error(`Only pending transfers can be rejected. Current status: "${transfer.status}"`);
      }

      await conn.query(`
        UPDATE aura_transfers SET 
          status = 'rejected',
          note = CONCAT(COALESCE(note, ''), '\n[Rejected Reason]: ', ?)
        WHERE id = ?
      `, [reason || 'Transfer request rejected by manager', id]);

      await TransfersModel.logHistory(conn, {
        transfer_id: id,
        action: 'rejected',
        from_status: 'pending',
        to_status: 'rejected',
        actor_id: user.id || 1,
        actor_name: user.username || 'Manager',
        note: reason || 'Transfer request rejected',
      });

      await conn.commit();
      return { id, status: 'rejected' };
    } catch (err) {
      await conn.rollback();
      logError('rejectTransfer', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 9. Dispatch Transfer (Physical Stock deducted from source warehouse exactly once)
   */
  static async dispatchTransfer(id, user = {}, dispatchData = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query('SELECT * FROM aura_transfers WHERE id = ? FOR UPDATE', [id]);
      if (!rows.length) {
        throw new Error('Transfer record not found');
      }

      const transfer = rows[0];
      if (!['pending', 'approved'].includes(transfer.status)) {
        throw new Error(`Transfer cannot be dispatched from status "${transfer.status}". Must be pending or approved.`);
      }

      const [items] = await conn.query('SELECT * FROM aura_transfer_items WHERE transfer_id = ? FOR UPDATE', [id]);
      let totalDispatchedQty = 0;

      for (const item of items) {
        const qty = parseFloat(item.quantity || 0);

        // Check and deduct stock from source warehouse
        const [stock] = await conn.query(`
          SELECT quantity FROM aura_warehouses_products 
          WHERE product_id = ? AND warehouse_id = ? 
          FOR UPDATE
        `, [item.product_id, transfer.from_warehouse_id]);

        const avail = parseFloat(stock[0]?.quantity || 0);
        if (avail < qty) {
          throw new Error(
            `Insufficient stock for product "${item.product_name}". Available: ${avail}, Dispatched: ${qty}`
          );
        }

        // Deduct from source warehouse
        await conn.query(`
          UPDATE aura_warehouses_products 
          SET quantity = quantity - ? 
          WHERE product_id = ? AND warehouse_id = ?
        `, [qty, item.product_id, transfer.from_warehouse_id]);

        if (item.option_id) {
          await conn.query(`
            UPDATE aura_warehouses_products_variants 
            SET quantity = quantity - ? 
            WHERE option_id = ? AND warehouse_id = ?
          `, [qty, item.option_id, transfer.from_warehouse_id]);
        }

        // Record stock movement (transfer_out)
        await conn.query(`
          INSERT INTO aura_stock_movement (
            date, reference_no, transaction, transaction_id, warehouse_id,
            product_id, product_code, product_name, option_id,
            real_unit_cost, quantity, unit_quantity, unit_code, unit_id, user_id
          ) VALUES (?, ?, 'transfer_out', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          new Date(),
          transfer.transfer_no,
          id,
          transfer.from_warehouse_id,
          item.product_id,
          item.product_code,
          item.product_name,
          item.option_id,
          item.real_unit_cost,
          -qty,
          item.unit_quantity,
          item.product_unit_code,
          item.product_unit_id,
          user.id || 1,
        ]);

        totalDispatchedQty += qty;
      }

      await conn.query(`
        UPDATE aura_transfers SET 
          status = 'in_transit',
          dispatched_by = ?,
          dispatched_at = NOW(),
          in_transit_quantity = ?
        WHERE id = ?
      `, [user.id || 1, totalDispatchedQty, id]);

      await TransfersModel.logHistory(conn, {
        transfer_id: id,
        action: 'dispatched',
        from_status: transfer.status,
        to_status: 'in_transit',
        actor_id: user.id || 1,
        actor_name: user.username || 'Dispatcher',
        note: dispatchData.note || `Dispatched ${totalDispatchedQty} units in transit`,
      });

      await conn.commit();
      return { id, status: 'in_transit', dispatched_quantity: totalDispatchedQty };
    } catch (err) {
      await conn.rollback();
      logError('dispatchTransfer', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 10. Receive Transfer (Adds to destination warehouse, supports partial receipts, damaged, and shortages)
   */
  static async receiveTransfer(id, user = {}, receiveData = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query('SELECT * FROM aura_transfers WHERE id = ? FOR UPDATE', [id]);
      if (!rows.length) {
        throw new Error('Transfer record not found');
      }

      const transfer = rows[0];
      if (!['in_transit', 'sent', 'partially_received'].includes(transfer.status)) {
        throw new Error(
          `Cannot receive transfer in "${transfer.status}" status. Transfer must be in transit.`
        );
      }

      const [items] = await conn.query('SELECT * FROM aura_transfer_items WHERE transfer_id = ? FOR UPDATE', [id]);

      const itemReceipts = receiveData.items || [];
      let totalReceivedNow = 0;
      let totalDamagedNow = 0;
      let totalShortageNow = 0;

      let hasDiscrepancy = false;

      for (const item of items) {
        // Find receipt info from payload or default to remaining balance
        const receiptInput = itemReceipts.find((r) => r.id === item.id || r.product_id === item.product_id);

        const alreadyReceived = parseFloat(item.received_quantity || 0);
        const sentQty = parseFloat(item.quantity || 0);
        const remainingToReceive = Math.max(0, sentQty - alreadyReceived);

        let receivedThisTurn = remainingToReceive;
        let damagedThisTurn = 0;
        let shortageThisTurn = 0;

        if (receiptInput) {
          receivedThisTurn = parseFloat(receiptInput.received_quantity ?? remainingToReceive);
          damagedThisTurn = parseFloat(receiptInput.damaged_quantity || 0);
          shortageThisTurn = parseFloat(receiptInput.shortage_quantity || 0);
        }

        if (damagedThisTurn > 0 || shortageThisTurn > 0 || receivedThisTurn < remainingToReceive) {
          hasDiscrepancy = true;
        }

        const newTotalReceived = alreadyReceived + receivedThisTurn;
        const newTotalDamaged = parseFloat(item.damaged_quantity || 0) + damagedThisTurn;
        const newTotalShortage = parseFloat(item.shortage_quantity || 0) + shortageThisTurn;

        // Update Item Record
        await conn.query(`
          UPDATE aura_transfer_items SET 
            received_quantity = ?,
            damaged_quantity = ?,
            shortage_quantity = ?,
            quantity_balance = ?
          WHERE id = ?
        `, [
          newTotalReceived,
          newTotalDamaged,
          newTotalShortage,
          Math.max(0, sentQty - newTotalReceived),
          item.id,
        ]);

        // Add received stock to Destination Warehouse
        if (receivedThisTurn > 0) {
          await conn.query(`
            INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
          `, [item.product_id, transfer.to_warehouse_id, receivedThisTurn, item.real_unit_cost]);

          if (item.option_id) {
            await conn.query(`
              INSERT INTO aura_warehouses_products_variants (option_id, product_id, warehouse_id, quantity)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
            `, [item.option_id, item.product_id, transfer.to_warehouse_id, receivedThisTurn]);
          }

          // Record stock movement (transfer_in)
          await conn.query(`
            INSERT INTO aura_stock_movement (
              date, reference_no, transaction, transaction_id, warehouse_id,
              product_id, product_code, product_name, option_id,
              real_unit_cost, quantity, unit_quantity, unit_code, unit_id, user_id
            ) VALUES (?, ?, 'transfer_in', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            new Date(),
            transfer.transfer_no,
            id,
            transfer.to_warehouse_id,
            item.product_id,
            item.product_code,
            item.product_name,
            item.option_id,
            item.real_unit_cost,
            receivedThisTurn,
            item.unit_quantity,
            item.product_unit_code,
            item.product_unit_id,
            user.id || 1,
          ]);
        }

        totalReceivedNow += receivedThisTurn;
        totalDamagedNow += damagedThisTurn;
        totalShortageNow += shortageThisTurn;
      }

      // Check if all items fully received
      const [updatedItems] = await conn.query(
        'SELECT SUM(quantity) AS sent, SUM(received_quantity) AS received FROM aura_transfer_items WHERE transfer_id = ?',
        [id]
      );
      const totalSent = parseFloat(updatedItems[0]?.sent || 0);
      const totalReceived = parseFloat(updatedItems[0]?.received || 0);

      const nextStatus = totalReceived >= totalSent && !hasDiscrepancy
        ? 'completed'
        : receiveData.is_final
        ? 'completed'
        : 'partially_received';

      await conn.query(`
        UPDATE aura_transfers SET 
          status = ?,
          received_by = ?,
          received_at = NOW(),
          received_quantity = ?,
          in_transit_quantity = GREATEST(0, in_transit_quantity - ?)
        WHERE id = ?
      `, [nextStatus, user.id || 1, totalReceived, totalReceivedNow, id]);

      await TransfersModel.logHistory(conn, {
        transfer_id: id,
        action: nextStatus === 'completed' ? 'received_completed' : 'partially_received',
        from_status: transfer.status,
        to_status: nextStatus,
        actor_id: user.id || 1,
        actor_name: user.username || 'Receiver',
        note: receiveData.note || `Received ${totalReceivedNow} units at ${transfer.to_warehouse_name}. Shortages: ${totalShortageNow}, Damaged: ${totalDamagedNow}`,
        data_payload: {
          received_this_turn: totalReceivedNow,
          damaged: totalDamagedNow,
          shortages: totalShortageNow,
          status: nextStatus,
        },
      });

      await conn.commit();
      return { id, status: nextStatus, total_received: totalReceived };
    } catch (err) {
      await conn.rollback();
      logError('receiveTransfer', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 11. Cancel Transfer (Safe stock reversal if dispatched, clean cancellation if pending/approved)
   */
  static async cancelTransfer(id, user = {}, reason = '') {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query('SELECT * FROM aura_transfers WHERE id = ? FOR UPDATE', [id]);
      if (!rows.length) {
        throw new Error('Transfer record not found');
      }

      const transfer = rows[0];
      if (['completed', 'cancelled'].includes(transfer.status)) {
        throw new Error(`Transfer in "${transfer.status}" status cannot be cancelled.`);
      }

      // If dispatched / in_transit, reverse the unreceived physical stock back into source warehouse
      if (transfer.status === 'in_transit' || transfer.status === 'sent' || transfer.status === 'partially_received') {
        const [items] = await conn.query('SELECT * FROM aura_transfer_items WHERE transfer_id = ? FOR UPDATE', [id]);

        for (const item of items) {
          const sent = parseFloat(item.quantity || 0);
          const rec = parseFloat(item.received_quantity || 0);
          const inTransitQty = Math.max(0, sent - rec);

          if (inTransitQty > 0) {
            // Restore to source warehouse
            await conn.query(`
              UPDATE aura_warehouses_products 
              SET quantity = quantity + ? 
              WHERE product_id = ? AND warehouse_id = ?
            `, [inTransitQty, item.product_id, transfer.from_warehouse_id]);

            if (item.option_id) {
              await conn.query(`
                UPDATE aura_warehouses_products_variants 
                SET quantity = quantity + ? 
                WHERE option_id = ? AND warehouse_id = ?
              `, [inTransitQty, item.option_id, transfer.from_warehouse_id]);
            }

            // Insert stock reversal movement
            await conn.query(`
              INSERT INTO aura_stock_movement (
                date, reference_no, transaction, transaction_id, warehouse_id,
                product_id, product_code, product_name, option_id,
                real_unit_cost, quantity, unit_quantity, unit_code, unit_id, user_id
              ) VALUES (?, ?, 'transfer_reversal', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              new Date(),
              transfer.transfer_no,
              id,
              transfer.from_warehouse_id,
              item.product_id,
              item.product_code,
              item.product_name,
              item.option_id,
              item.real_unit_cost,
              inTransitQty,
              item.unit_quantity,
              item.product_unit_code,
              item.product_unit_id,
              user.id || 1,
            ]);
          }
        }
      }

      await conn.query(`
        UPDATE aura_transfers SET 
          status = 'cancelled',
          cancelled_by = ?,
          cancelled_at = NOW(),
          cancel_reason = ?,
          in_transit_quantity = 0
        WHERE id = ?
      `, [user.id || 1, reason || 'Cancelled by user', id]);

      await TransfersModel.logHistory(conn, {
        transfer_id: id,
        action: 'cancelled',
        from_status: transfer.status,
        to_status: 'cancelled',
        actor_id: user.id || 1,
        actor_name: user.username || 'System',
        note: reason || 'Transfer cancelled and stock reversed if dispatched',
      });

      await conn.commit();
      return { id, status: 'cancelled' };
    } catch (err) {
      await conn.rollback();
      logError('cancelTransfer', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 12. Delete Transfer (Allowed only for draft or cancelled transfers)
   */
  static async deleteTransfer(id, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query('SELECT * FROM aura_transfers WHERE id = ? FOR UPDATE', [id]);
      if (!rows.length) {
        throw new Error('Transfer record not found');
      }

      const transfer = rows[0];
      if (!['draft', 'cancelled', 'rejected'].includes(transfer.status)) {
        throw new Error(
          `Cannot delete transfer with status "${transfer.status}". Please cancel or reverse the transfer first.`
        );
      }

      await conn.query('DELETE FROM aura_transfer_history WHERE transfer_id = ?', [id]);
      await conn.query('DELETE FROM aura_transfer_items WHERE transfer_id = ?', [id]);
      await conn.query('DELETE FROM aura_transfers WHERE id = ?', [id]);

      await conn.commit();
      return { id, deleted: true };
    } catch (err) {
      await conn.rollback();
      logError('deleteTransfer', err);
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = TransfersModel;
