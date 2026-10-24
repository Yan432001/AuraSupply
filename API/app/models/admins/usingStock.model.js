const db = require('../../config/dbPool');

function logError(context, err) {
  console.error(`[UsingStockModel Error] [${context}]:`, err?.message || err);
}

class UsingStockModel {
  /**
   * 1. List stock usage records with filters, search, and pagination
   */
  static async listUsingStocks({
    search = '',
    warehouse_id = 'all',
    biller_id = 'all',
    type = 'all',
    start_date = null,
    end_date = null,
    sort_by = 'us.date',
    sort_order = 'DESC',
    page = 1,
    limit = 20
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
          us.reference_no LIKE ? OR 
          us.using_reference_no LIKE ? OR 
          us.note LIKE ? OR 
          w.name LIKE ? OR 
          b.company LIKE ? OR 
          b.name LIKE ? OR 
          u.username LIKE ? OR
          EXISTS (
            SELECT 1 FROM aura_enter_using_stock_items usi 
            WHERE usi.using_stock_id = us.id AND (usi.product_name LIKE ? OR usi.code LIKE ?)
          )
        )`);
        params.push(term, term, term, term, term, term, term, term, term);
      }

      if (warehouse_id && warehouse_id !== 'all') {
        conditions.push('us.warehouse_id = ?');
        params.push(parseInt(warehouse_id, 10));
      }

      if (biller_id && biller_id !== 'all') {
        conditions.push('us.biller_id = ?');
        params.push(parseInt(biller_id, 10));
      }

      if (type && type !== 'all') {
        conditions.push('us.type = ?');
        params.push(type);
      }

      if (start_date) {
        conditions.push('us.date >= ?');
        params.push(`${start_date} 00:00:00`);
      }

      if (end_date) {
        conditions.push('us.date <= ?');
        params.push(`${end_date} 23:59:59`);
      }

      const whereClause = conditions.join(' AND ');

      // Total count & stats
      const [stats] = await db.query(`
        SELECT 
          COUNT(DISTINCT us.id) AS total,
          COALESCE(SUM(CASE WHEN us.type = 'use' THEN us.total_cost ELSE 0 END), 0) AS total_use_cost,
          COALESCE(SUM(CASE WHEN us.type = 'return' THEN us.total_cost ELSE 0 END), 0) AS total_return_cost,
          COALESCE(SUM(CASE WHEN us.type = 'use' THEN 1 ELSE 0 END), 0) AS count_use,
          COALESCE(SUM(CASE WHEN us.type = 'return' THEN 1 ELSE 0 END), 0) AS count_return
        FROM aura_enter_using_stock us
        LEFT JOIN aura_companies b ON b.id = us.biller_id
        LEFT JOIN aura_warehouses w ON w.id = us.warehouse_id
        LEFT JOIN aura_users u ON u.id = us.employee_id
        WHERE ${whereClause}
      `, params);

      const total = stats[0]?.total || 0;

      // Query Records
      const allowedSortCols = {
        'id': 'us.id',
        'date': 'us.date',
        'reference_no': 'us.reference_no',
        'warehouse_name': 'w.name',
        'biller_name': 'b.company',
        'total_cost': 'us.total_cost',
        'type': 'us.type'
      };
      const sortColumn = allowedSortCols[sort_by] || 'us.date';
      const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const querySql = `
        SELECT 
          us.id,
          us.using_id,
          us.date,
          us.biller_id,
          b.company AS biller_company,
          b.name AS biller_name,
          us.warehouse_id,
          w.name AS warehouse_name,
          us.employee_id,
          u.username AS employee_name,
          u.first_name AS employee_first_name,
          u.last_name AS employee_last_name,
          us.authorize_id,
          us.note,
          us.create_by,
          c.username AS creator_name,
          us.reference_no,
          us.using_reference_no,
          us.type,
          us.total_cost,
          (
            SELECT COUNT(*) 
            FROM aura_enter_using_stock_items usi 
            WHERE usi.using_stock_id = us.id
          ) AS items_count,
          (
            SELECT COALESCE(SUM(usi.qty_use), 0) 
            FROM aura_enter_using_stock_items usi 
            WHERE usi.using_stock_id = us.id
          ) AS total_qty_used,
          (
            SELECT GROUP_CONCAT(CONCAT(usi.product_name, ' (', usi.qty_use, ' ', COALESCE(usi.unit, ''), ')') SEPARATOR ', ')
            FROM aura_enter_using_stock_items usi 
            WHERE usi.using_stock_id = us.id
          ) AS items_summary
        FROM aura_enter_using_stock us
        LEFT JOIN aura_companies b ON b.id = us.biller_id
        LEFT JOIN aura_warehouses w ON w.id = us.warehouse_id
        LEFT JOIN aura_users u ON u.id = us.employee_id
        LEFT JOIN aura_users c ON c.id = us.create_by
        WHERE ${whereClause}
        ORDER BY ${sortColumn} ${sortDirection}, us.id DESC
        LIMIT ? OFFSET ?
      `;

      const [records] = await db.query(querySql, [...params, limitNum, offset]);

      return {
        records,
        stats: stats[0] || {},
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      };
    } catch (err) {
      logError('listUsingStocks', err);
      throw err;
    }
  }

  /**
   * 2. Get Single Stock Usage record by ID with line items
   */
  static async getUsingStockById(id) {
    try {
      const [rows] = await db.query(`
        SELECT 
          us.*,
          b.company AS biller_company,
          b.name AS biller_name,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          u.username AS employee_name,
          u.first_name AS employee_first_name,
          u.last_name AS employee_last_name,
          c.username AS creator_name
        FROM aura_enter_using_stock us
        LEFT JOIN aura_companies b ON b.id = us.biller_id
        LEFT JOIN aura_warehouses w ON w.id = us.warehouse_id
        LEFT JOIN aura_users u ON u.id = us.employee_id
        LEFT JOIN aura_users c ON c.id = us.create_by
        WHERE us.id = ?
        LIMIT 1
      `, [id]);

      if (!rows.length) return null;
      const record = rows[0];

      // Retrieve items
      const [items] = await db.query(`
        SELECT 
          usi.*,
          p.name AS live_product_name,
          p.code AS live_product_code,
          p.image AS product_image,
          p.cost AS current_product_cost,
          COALESCE(wp.quantity, p.quantity, 0) AS current_warehouse_stock,
          un.name AS unit_name
        FROM aura_enter_using_stock_items usi
        LEFT JOIN aura_products p ON p.id = usi.product_id
        LEFT JOIN aura_warehouses_products wp ON wp.product_id = usi.product_id AND wp.warehouse_id = usi.warehouse_id
        LEFT JOIN aura_units un ON un.id = usi.product_unit_id
        WHERE usi.using_stock_id = ?
        ORDER BY usi.id ASC
      `, [id]);

      record.items = items;

      // Check if this record has any returns associated with it
      const [returns] = await db.query(`
        SELECT id, reference_no, date, total_cost, note 
        FROM aura_enter_using_stock 
        WHERE using_id = ? AND type = 'return'
        ORDER BY id DESC
      `, [id]);
      record.returns = returns;

      return record;
    } catch (err) {
      logError('getUsingStockById', err);
      throw err;
    }
  }

  /**
   * 3. Metadata options for form dropdowns & automatic reference generation
   */
  static async getMetadataOptions() {
    try {
      const [warehouses] = await db.query('SELECT id, code, name FROM aura_warehouses ORDER BY name ASC');
      const [billers] = await db.query('SELECT id, name, company FROM aura_companies WHERE group_name = "biller" OR id = 3 ORDER BY name ASC');
      const [employees] = await db.query('SELECT id, username, first_name, last_name, email FROM aura_users ORDER BY username ASC');
      const [units] = await db.query('SELECT id, code, name FROM aura_units ORDER BY name ASC');

      // Generate next reference number in AURA_v1 format: SU{YY}/{0001}
      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      const [lastRef] = await db.query(`
        SELECT reference_no 
        FROM aura_enter_using_stock 
        WHERE type = 'use' AND reference_no LIKE 'SU${yearSuffix}/%'
        ORDER BY id DESC 
        LIMIT 1
      `);

      let nextSeq = 1;
      if (lastRef.length && lastRef[0].reference_no) {
        const parts = lastRef[0].reference_no.split('/');
        if (parts.length > 1 && !isNaN(parseInt(parts[1], 10))) {
          nextSeq = parseInt(parts[1], 10) + 1;
        }
      }
      const nextReferenceNo = `SU${yearSuffix}/${String(nextSeq).padStart(4, '0')}`;

      // Next return reference
      const nextReturnRef = `SUR${yearSuffix}/${String(nextSeq).padStart(4, '0')}`;

      return {
        warehouses,
        billers: billers.length ? billers : [{ id: 3, name: 'Main Company', company: 'Aura Enterprise' }],
        employees,
        units,
        nextReferenceNo,
        nextReturnRef
      };
    } catch (err) {
      logError('getMetadataOptions', err);
      throw err;
    }
  }

  /**
   * 4. Search and fetch products with real-time stock in selected warehouse
   */
  static async getAvailableProducts({ warehouse_id = 1, search = '', limit = 30 } = {}) {
    try {
      const whId = parseInt(warehouse_id, 10) || 1;
      const conditions = ['p.status = 1'];
      const params = [whId];

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        conditions.push('(p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ? OR p.second_name LIKE ?)');
        params.push(term, term, term, term, term);
      }

      const [products] = await db.query(`
        SELECT 
          p.id,
          p.code,
          p.name,
          p.second_name,
          p.barcode,
          p.sku,
          p.cost,
          p.price,
          p.unit,
          u.name AS unit_name,
          p.image,
          COALESCE(wp.quantity, 0) AS warehouse_stock,
          COALESCE(p.quantity, 0) AS total_stock
        FROM aura_products p
        LEFT JOIN aura_warehouses_products wp ON wp.product_id = p.id AND wp.warehouse_id = ?
        LEFT JOIN aura_units u ON u.id = p.unit
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.name ASC
        LIMIT ?
      `, [...params, Math.min(100, parseInt(limit, 10) || 30)]);

      return products;
    } catch (err) {
      logError('getAvailableProducts', err);
      throw err;
    }
  }

  /**
   * 5. Create new Using Stock record with stock deduction and audit moves
   */
  static async createUsingStock({
    date,
    reference_no,
    biller_id = 3,
    warehouse_id = 1,
    employee_id = null,
    authorize_id = null,
    note = '',
    items = [],
    user_id = 1
  }) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();

      const whId = parseInt(warehouse_id, 10);
      if (!whId) throw new Error('Warehouse selection is required.');
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('At least one product item is required for stock usage.');
      }

      // 1. Generate or validate Reference No
      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      let refNo = reference_no && reference_no.trim() ? reference_no.trim() : null;
      if (!refNo) {
        const [lastRef] = await conn.query(`
          SELECT reference_no FROM aura_enter_using_stock 
          WHERE reference_no LIKE 'SU${yearSuffix}/%' 
          ORDER BY id DESC LIMIT 1 FOR UPDATE
        `);
        let seq = 1;
        if (lastRef.length && lastRef[0].reference_no) {
          const parts = lastRef[0].reference_no.split('/');
          if (parts.length > 1 && !isNaN(parseInt(parts[1], 10))) {
            seq = parseInt(parts[1], 10) + 1;
          }
        }
        refNo = `SU${yearSuffix}/${String(seq).padStart(4, '0')}`;
      } else {
        const [existing] = await conn.query('SELECT id FROM aura_enter_using_stock WHERE reference_no = ? LIMIT 1', [refNo]);
        if (existing.length) {
          throw new Error(`Reference number "${refNo}" already exists. Please use a unique reference.`);
        }
      }

      const usageDate = date ? new Date(date) : new Date();

      // 2. Validate availability and calculate total cost
      let totalUsageCost = 0;
      const validatedItems = [];

      for (const rawItem of items) {
        const pId = parseInt(rawItem.product_id, 10);
        const qty = parseFloat(rawItem.qty_use || rawItem.quantity);
        if (!pId) throw new Error('Invalid item: product ID is missing.');
        if (!qty || qty <= 0) throw new Error(`Invalid usage quantity (${qty}) for item #${pId}.`);

        // Check product master
        const [pRows] = await conn.query('SELECT id, name, code, cost, unit FROM aura_products WHERE id = ? LIMIT 1', [pId]);
        if (!pRows.length) throw new Error(`Product #${pId} not found.`);
        const prod = pRows[0];

        // Check warehouse inventory balance
        const [whRows] = await conn.query(`
          SELECT quantity FROM aura_warehouses_products 
          WHERE product_id = ? AND warehouse_id = ? 
          LIMIT 1 FOR UPDATE
        `, [pId, whId]);

        const availableQty = parseFloat(whRows[0]?.quantity) || 0;
        if (availableQty < qty) {
          throw new Error(`Insufficient stock for "${prod.name}" (${prod.code}) in selected warehouse. Available: ${availableQty}, Requested: ${qty}. Negative stock is prevented.`);
        }

        const itemCost = parseFloat(rawItem.cost !== undefined ? rawItem.cost : prod.cost) || 0;
        const lineTotal = itemCost * qty;
        totalUsageCost += lineTotal;

        validatedItems.push({
          product_id: pId,
          code: prod.code,
          product_name: prod.name,
          description: rawItem.description || rawItem.reason || '',
          reason: rawItem.reason || '',
          qty_use: qty,
          product_unit_id: rawItem.product_unit_id || prod.unit || 1,
          unit: rawItem.unit || 'Unit',
          reference_no: refNo,
          warehouse_id: whId,
          qty_by_unit: qty,
          cost: itemCost,
          option_id: rawItem.option_id ? parseInt(rawItem.option_id, 10) : null
        });
      }

      // 3. Insert header
      const [headerRes] = await conn.query(`
        INSERT INTO aura_enter_using_stock (
          date, biller_id, warehouse_id, authorize_id, employee_id,
          note, create_by, reference_no, type, total_cost
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'use', ?)
      `, [
        usageDate,
        biller_id ? parseInt(biller_id, 10) : 3,
        whId,
        authorize_id ? parseInt(authorize_id, 10) : null,
        employee_id ? parseInt(employee_id, 10) : null,
        note || '',
        user_id || 1,
        refNo,
        totalUsageCost
      ]);

      const usingStockId = headerRes.insertId;

      // 4. Insert items & deduct inventory
      for (const item of validatedItems) {
        await conn.query(`
          INSERT INTO aura_enter_using_stock_items (
            using_stock_id, product_id, code, product_name, description,
            reason, qty_use, product_unit_id, unit, reference_no,
            warehouse_id, qty_by_unit, cost, option_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          usingStockId,
          item.product_id,
          item.code,
          item.product_name,
          item.description,
          item.reason,
          item.qty_use,
          item.product_unit_id,
          item.unit,
          item.reference_no,
          item.warehouse_id,
          item.qty_by_unit,
          item.cost,
          item.option_id
        ]);

        // Deduct from aura_warehouses_products
        await conn.query(`
          UPDATE aura_warehouses_products 
          SET quantity = quantity - ? 
          WHERE product_id = ? AND warehouse_id = ?
        `, [item.qty_use, item.product_id, whId]);

        // Deduct from aura_products (overall stock)
        await conn.query(`
          UPDATE aura_products 
          SET quantity = quantity - ? 
          WHERE id = ?
        `, [item.qty_use, item.product_id]);

        // If variant option_id is specified
        if (item.option_id) {
          await conn.query(`
            UPDATE aura_warehouses_products_variants 
            SET quantity = quantity - ? 
            WHERE option_id = ? AND warehouse_id = ?
          `, [item.qty_use, item.option_id, whId]);

          await conn.query(`
            UPDATE aura_product_variants 
            SET quantity = quantity - ? 
            WHERE id = ?
          `, [item.qty_use, item.option_id]);
        }

        // Record stock movement (negative quantity)
        await conn.query(`
          INSERT INTO aura_stock_movement (
            date, reference_no, transaction, transaction_id, warehouse_id,
            product_id, product_type, product_code, product_name, real_unit_cost,
            quantity, unit_quantity, unit_code, unit_id, option_id, user_id, actual_date
          ) VALUES (
            ?, ?, 'using_stock', ?, ?,
            ?, 'standard', ?, ?, ?,
            ?, 1, ?, ?, ?, ?, NOW()
          )
        `, [
          usageDate,
          refNo,
          usingStockId,
          whId,
          item.product_id,
          item.code,
          item.product_name,
          item.cost,
          -Math.abs(item.qty_use), // negative quantity for issue/usage
          item.unit,
          item.product_unit_id,
          item.option_id,
          user_id || 1
        ]);
      }

      await conn.commit();
      return this.getUsingStockById(usingStockId);
    } catch (err) {
      await conn.rollback();
      logError('createUsingStock', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 6. Update existing Stock Usage record (reverses prior deductions and applies new ones)
   */
  static async updateUsingStock(id, {
    date,
    biller_id,
    warehouse_id,
    employee_id,
    authorize_id,
    note,
    items = [],
    user_id = 1
  }) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();

      const usageId = parseInt(id, 10);
      const [existingRows] = await conn.query('SELECT * FROM aura_enter_using_stock WHERE id = ? LIMIT 1 FOR UPDATE', [usageId]);
      if (!existingRows.length) throw new Error(`Stock usage record #${usageId} not found.`);
      const current = existingRows[0];

      if (current.type === 'return') {
        throw new Error('Stock return records cannot be edited directly.');
      }

      // 1. Get old items and reverse stock deductions
      const [oldItems] = await conn.query('SELECT * FROM aura_enter_using_stock_items WHERE using_stock_id = ?', [usageId]);
      for (const oldItem of oldItems) {
        await conn.query(`
          UPDATE aura_warehouses_products 
          SET quantity = quantity + ? 
          WHERE product_id = ? AND warehouse_id = ?
        `, [oldItem.qty_use, oldItem.product_id, oldItem.warehouse_id]);

        await conn.query(`
          UPDATE aura_products 
          SET quantity = quantity + ? 
          WHERE id = ?
        `, [oldItem.qty_use, oldItem.product_id]);

        if (oldItem.option_id) {
          await conn.query(`
            UPDATE aura_warehouses_products_variants 
            SET quantity = quantity + ? 
            WHERE option_id = ? AND warehouse_id = ?
          `, [oldItem.qty_use, oldItem.option_id, oldItem.warehouse_id]);

          await conn.query(`
            UPDATE aura_product_variants 
            SET quantity = quantity + ? 
            WHERE id = ?
          `, [oldItem.qty_use, oldItem.option_id]);
        }
      }

      // Delete old stock movements
      await conn.query('DELETE FROM aura_stock_movement WHERE transaction = "using_stock" AND transaction_id = ?', [usageId]);
      await conn.query('DELETE FROM aura_enter_using_stock_items WHERE using_stock_id = ?', [usageId]);

      // 2. Validate updated items against restored stock
      const targetWhId = warehouse_id ? parseInt(warehouse_id, 10) : current.warehouse_id;
      let newTotalCost = 0;
      const validatedItems = [];

      for (const rawItem of items) {
        const pId = parseInt(rawItem.product_id, 10);
        const qty = parseFloat(rawItem.qty_use || rawItem.quantity);
        if (!pId || !qty || qty <= 0) throw new Error('Invalid item or quantity in update payload.');

        const [pRows] = await conn.query('SELECT id, name, code, cost, unit FROM aura_products WHERE id = ? LIMIT 1', [pId]);
        if (!pRows.length) throw new Error(`Product #${pId} not found.`);
        const prod = pRows[0];

        const [whRows] = await conn.query(`
          SELECT quantity FROM aura_warehouses_products 
          WHERE product_id = ? AND warehouse_id = ? 
          LIMIT 1 FOR UPDATE
        `, [pId, targetWhId]);

        const availableQty = parseFloat(whRows[0]?.quantity) || 0;
        if (availableQty < qty) {
          throw new Error(`Insufficient stock for "${prod.name}" in warehouse #${targetWhId}. Available: ${availableQty}, Required: ${qty}.`);
        }

        const itemCost = parseFloat(rawItem.cost !== undefined ? rawItem.cost : prod.cost) || 0;
        newTotalCost += itemCost * qty;

        validatedItems.push({
          product_id: pId,
          code: prod.code,
          product_name: prod.name,
          description: rawItem.description || rawItem.reason || '',
          reason: rawItem.reason || '',
          qty_use: qty,
          product_unit_id: rawItem.product_unit_id || prod.unit || 1,
          unit: rawItem.unit || 'Unit',
          reference_no: current.reference_no,
          warehouse_id: targetWhId,
          qty_by_unit: qty,
          cost: itemCost,
          option_id: rawItem.option_id ? parseInt(rawItem.option_id, 10) : null
        });
      }

      // 3. Update header
      await conn.query(`
        UPDATE aura_enter_using_stock 
        SET 
          date = COALESCE(?, date),
          biller_id = COALESCE(?, biller_id),
          warehouse_id = ?,
          employee_id = ?,
          authorize_id = ?,
          note = ?,
          total_cost = ?
        WHERE id = ?
      `, [
        date ? new Date(date) : null,
        biller_id ? parseInt(biller_id, 10) : null,
        targetWhId,
        employee_id ? parseInt(employee_id, 10) : null,
        authorize_id ? parseInt(authorize_id, 10) : null,
        note !== undefined ? note : current.note,
        newTotalCost,
        usageId
      ]);

      // 4. Insert new items and re-deduct stock
      for (const item of validatedItems) {
        await conn.query(`
          INSERT INTO aura_enter_using_stock_items (
            using_stock_id, product_id, code, product_name, description,
            reason, qty_use, product_unit_id, unit, reference_no,
            warehouse_id, qty_by_unit, cost, option_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          usageId,
          item.product_id,
          item.code,
          item.product_name,
          item.description,
          item.reason,
          item.qty_use,
          item.product_unit_id,
          item.unit,
          item.reference_no,
          item.warehouse_id,
          item.qty_by_unit,
          item.cost,
          item.option_id
        ]);

        await conn.query(`
          UPDATE aura_warehouses_products 
          SET quantity = quantity - ? 
          WHERE product_id = ? AND warehouse_id = ?
        `, [item.qty_use, item.product_id, targetWhId]);

        await conn.query(`
          UPDATE aura_products 
          SET quantity = quantity - ? 
          WHERE id = ?
        `, [item.qty_use, item.product_id]);

        if (item.option_id) {
          await conn.query(`
            UPDATE aura_warehouses_products_variants 
            SET quantity = quantity - ? 
            WHERE option_id = ? AND warehouse_id = ?
          `, [item.qty_use, item.option_id, targetWhId]);

          await conn.query(`
            UPDATE aura_product_variants 
            SET quantity = quantity - ? 
            WHERE id = ?
          `, [item.qty_use, item.option_id]);
        }

        await conn.query(`
          INSERT INTO aura_stock_movement (
            date, reference_no, transaction, transaction_id, warehouse_id,
            product_id, product_type, product_code, product_name, real_unit_cost,
            quantity, unit_quantity, unit_code, unit_id, option_id, user_id, actual_date
          ) VALUES (
            ?, ?, 'using_stock', ?, ?,
            ?, 'standard', ?, ?, ?,
            ?, 1, ?, ?, ?, ?, NOW()
          )
        `, [
          date ? new Date(date) : current.date,
          current.reference_no,
          usageId,
          targetWhId,
          item.product_id,
          item.code,
          item.product_name,
          item.cost,
          -Math.abs(item.qty_use),
          item.unit,
          item.product_unit_id,
          item.option_id,
          user_id || 1
        ]);
      }

      await conn.commit();
      return this.getUsingStockById(usageId);
    } catch (err) {
      await conn.rollback();
      logError('updateUsingStock', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 7. Delete / Cancel Stock Usage record (reverses all inventory deductions)
   */
  static async deleteUsingStock(id) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();

      const usageId = parseInt(id, 10);
      const [existingRows] = await conn.query('SELECT * FROM aura_enter_using_stock WHERE id = ? LIMIT 1 FOR UPDATE', [usageId]);
      if (!existingRows.length) throw new Error(`Stock usage record #${usageId} not found.`);
      const current = existingRows[0];

      // 1. If this is a 'use' record, check and cancel any dependent 'return' records first
      if (current.type === 'use') {
        const [returns] = await conn.query('SELECT id FROM aura_enter_using_stock WHERE using_id = ?', [usageId]);
        for (const ret of returns) {
          // Re-deduct returned stock since the return is being removed
          const [retItems] = await conn.query('SELECT * FROM aura_enter_using_stock_items WHERE using_stock_id = ?', [ret.id]);
          for (const item of retItems) {
            await conn.query(`
              UPDATE aura_warehouses_products SET quantity = quantity - ? 
              WHERE product_id = ? AND warehouse_id = ?
            `, [item.qty_use, item.product_id, item.warehouse_id]);
            await conn.query(`UPDATE aura_products SET quantity = quantity - ? WHERE id = ?`, [item.qty_use, item.product_id]);
          }
          await conn.query('DELETE FROM aura_stock_movement WHERE transaction = "using_stock_return" AND transaction_id = ?', [ret.id]);
          await conn.query('DELETE FROM aura_enter_using_stock_items WHERE using_stock_id = ?', [ret.id]);
          await conn.query('DELETE FROM aura_enter_using_stock WHERE id = ?', [ret.id]);
        }
      }

      // 2. Restore stock for current record items
      const [items] = await conn.query('SELECT * FROM aura_enter_using_stock_items WHERE using_stock_id = ?', [usageId]);
      for (const item of items) {
        if (current.type === 'use') {
          // Add back used stock
          await conn.query(`
            UPDATE aura_warehouses_products SET quantity = quantity + ? 
            WHERE product_id = ? AND warehouse_id = ?
          `, [item.qty_use, item.product_id, item.warehouse_id]);
          await conn.query(`UPDATE aura_products SET quantity = quantity + ? WHERE id = ?`, [item.qty_use, item.product_id]);

          if (item.option_id) {
            await conn.query(`
              UPDATE aura_warehouses_products_variants SET quantity = quantity + ? 
              WHERE option_id = ? AND warehouse_id = ?
            `, [item.qty_use, item.option_id, item.warehouse_id]);
            await conn.query(`UPDATE aura_product_variants SET quantity = quantity + ? WHERE id = ?`, [item.qty_use, item.option_id]);
          }
        } else if (current.type === 'return') {
          // Reverse returned stock
          await conn.query(`
            UPDATE aura_warehouses_products SET quantity = quantity - ? 
            WHERE product_id = ? AND warehouse_id = ?
          `, [item.qty_use, item.product_id, item.warehouse_id]);
          await conn.query(`UPDATE aura_products SET quantity = quantity - ? WHERE id = ?`, [item.qty_use, item.product_id]);
        }
      }

      // 3. Remove stock movement logs
      await conn.query('DELETE FROM aura_stock_movement WHERE transaction IN ("using_stock", "using_stock_return") AND transaction_id = ?', [usageId]);

      // 4. Delete items and header
      await conn.query('DELETE FROM aura_enter_using_stock_items WHERE using_stock_id = ?', [usageId]);
      await conn.query('DELETE FROM aura_enter_using_stock WHERE id = ?', [usageId]);

      await conn.commit();
      return { success: true, message: `Stock usage #${usageId} (${current.reference_no}) successfully deleted and stock restored.` };
    } catch (err) {
      await conn.rollback();
      logError('deleteUsingStock', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 8. Return stock from an existing stock usage (Stock Return)
   */
  static async createReturn(usingId, {
    date,
    reference_no,
    items = [],
    note = '',
    user_id = 1
  }) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();

      const uId = parseInt(usingId, 10);
      const [parentRows] = await conn.query('SELECT * FROM aura_enter_using_stock WHERE id = ? LIMIT 1 FOR UPDATE', [uId]);
      if (!parentRows.length) throw new Error(`Original stock usage record #${uId} not found.`);
      const parent = parentRows[0];

      if (parent.type !== 'use') {
        throw new Error('Stock can only be returned against a primary stock usage ("use") record.');
      }

      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      let refNo = reference_no && reference_no.trim() ? reference_no.trim() : null;
      if (!refNo) {
        const [lastRef] = await conn.query(`
          SELECT reference_no FROM aura_enter_using_stock 
          WHERE reference_no LIKE 'SUR${yearSuffix}/%' 
          ORDER BY id DESC LIMIT 1 FOR UPDATE
        `);
        let seq = 1;
        if (lastRef.length && lastRef[0].reference_no) {
          const parts = lastRef[0].reference_no.split('/');
          if (parts.length > 1 && !isNaN(parseInt(parts[1], 10))) {
            seq = parseInt(parts[1], 10) + 1;
          }
        }
        refNo = `SUR${yearSuffix}/${String(seq).padStart(4, '0')}`;
      }

      // Check max returnable qty per item
      const [parentItems] = await conn.query('SELECT * FROM aura_enter_using_stock_items WHERE using_stock_id = ?', [uId]);
      const parentItemsMap = new Map(parentItems.map(i => [i.product_id, i]));

      let totalReturnCost = 0;
      const validatedReturnItems = [];

      for (const item of items) {
        const pId = parseInt(item.product_id, 10);
        const returnQty = parseFloat(item.qty_return || item.qty_use || item.quantity);
        if (!pId || !returnQty || returnQty <= 0) continue;

        const origItem = parentItemsMap.get(pId);
        if (!origItem) throw new Error(`Product #${pId} was not part of the original stock usage.`);

        if (returnQty > parseFloat(origItem.qty_use)) {
          throw new Error(`Return quantity (${returnQty}) exceeds original used quantity (${origItem.qty_use}) for "${origItem.product_name}".`);
        }

        const itemCost = parseFloat(origItem.cost) || 0;
        totalReturnCost += itemCost * returnQty;

        validatedReturnItems.push({
          product_id: pId,
          code: origItem.code,
          product_name: origItem.product_name,
          description: item.description || `Returned from ${parent.reference_no}`,
          reason: item.reason || 'Leftover material returned to inventory',
          qty_use: returnQty,
          product_unit_id: origItem.product_unit_id,
          unit: origItem.unit,
          reference_no: refNo,
          warehouse_id: parent.warehouse_id,
          qty_by_unit: returnQty,
          cost: itemCost,
          option_id: origItem.option_id
        });
      }

      if (validatedReturnItems.length === 0) {
        throw new Error('Please specify a positive return quantity for at least one item.');
      }

      const returnDate = date ? new Date(date) : new Date();

      // Insert return header
      const [resHeader] = await conn.query(`
        INSERT INTO aura_enter_using_stock (
          using_id, date, biller_id, warehouse_id, authorize_id, employee_id,
          note, create_by, reference_no, type, total_cost, using_reference_no
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'return', ?, ?)
      `, [
        uId,
        returnDate,
        parent.biller_id,
        parent.warehouse_id,
        parent.authorize_id,
        parent.employee_id,
        note || `Stock returned from ${parent.reference_no}`,
        user_id || 1,
        refNo,
        totalReturnCost,
        parent.reference_no
      ]);

      const returnRecordId = resHeader.insertId;

      // Insert items and restore warehouse inventory
      for (const item of validatedReturnItems) {
        await conn.query(`
          INSERT INTO aura_enter_using_stock_items (
            using_stock_id, product_id, code, product_name, description,
            reason, qty_use, product_unit_id, unit, reference_no,
            warehouse_id, qty_by_unit, cost, option_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          returnRecordId,
          item.product_id,
          item.code,
          item.product_name,
          item.description,
          item.reason,
          item.qty_use,
          item.product_unit_id,
          item.unit,
          item.reference_no,
          item.warehouse_id,
          item.qty_by_unit,
          item.cost,
          item.option_id
        ]);

        // Add back to warehouse products
        await conn.query(`
          UPDATE aura_warehouses_products 
          SET quantity = quantity + ? 
          WHERE product_id = ? AND warehouse_id = ?
        `, [item.qty_use, item.product_id, parent.warehouse_id]);

        await conn.query(`
          UPDATE aura_products 
          SET quantity = quantity + ? 
          WHERE id = ?
        `, [item.qty_use, item.product_id]);

        if (item.option_id) {
          await conn.query(`
            UPDATE aura_warehouses_products_variants 
            SET quantity = quantity + ? 
            WHERE option_id = ? AND warehouse_id = ?
          `, [item.qty_use, item.option_id, parent.warehouse_id]);

          await conn.query(`
            UPDATE aura_product_variants 
            SET quantity = quantity + ? 
            WHERE id = ?
          `, [item.qty_use, item.option_id]);
        }

        // Record stock movement (positive quantity for return)
        await conn.query(`
          INSERT INTO aura_stock_movement (
            date, reference_no, transaction, transaction_id, warehouse_id,
            product_id, product_type, product_code, product_name, real_unit_cost,
            quantity, unit_quantity, unit_code, unit_id, option_id, user_id, actual_date
          ) VALUES (
            ?, ?, 'using_stock_return', ?, ?,
            ?, 'standard', ?, ?, ?,
            ?, 1, ?, ?, ?, ?, NOW()
          )
        `, [
          returnDate,
          refNo,
          returnRecordId,
          parent.warehouse_id,
          item.product_id,
          item.code,
          item.product_name,
          item.cost,
          item.qty_use, // positive quantity for return to inventory
          item.unit,
          item.product_unit_id,
          item.option_id,
          user_id || 1
        ]);
      }

      await conn.commit();
      return this.getUsingStockById(returnRecordId);
    } catch (err) {
      await conn.rollback();
      logError('createReturn', err);
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = UsingStockModel;
