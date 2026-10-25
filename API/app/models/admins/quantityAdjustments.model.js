const db = require('../../config/dbPool');

/**
 * QUANTITY ADJUSTMENTS MODEL (BPAS / AURA_v1 Standard)
 * ====================================================
 * Architected to mirror AURA_v1:
 * - Table: aura_adjustments & aura_adjustment_items
 * - Stock Movement: aura_stock_movement with transaction: 'QuantityAdjustment'
 * - Real-time warehouse balance synchronization: aura_warehouses_products & aura_products
 * - Atomicity: ACID transactions with FOR UPDATE row locks to prevent negative inventory
 */

function logError(method, err) {
  console.error(`[QuantityAdjustmentsModel.${method}] Error:`, err.message || err);
}

class QuantityAdjustmentsModel {
  /**
   * 1. List adjustments with pagination, search, warehouse, type, and date filters + stats
   */
  static async listAdjustments({
    page = 1,
    limit = 15,
    search = '',
    warehouse_id = 'all',
    type = 'all',
    biller_id = 'all',
    start_date = null,
    end_date = null
  } = {}) {
    try {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
      const offset = (pageNum - 1) * limitNum;

      const conditions = ['1=1'];
      const params = [];

      if (warehouse_id && warehouse_id !== 'all') {
        conditions.push('a.warehouse_id = ?');
        params.push(parseInt(warehouse_id, 10));
      }

      if (biller_id && biller_id !== 'all') {
        conditions.push('a.biller_id = ?');
        params.push(parseInt(biller_id, 10));
      }

      if (start_date) {
        conditions.push('DATE(a.date) >= ?');
        params.push(start_date);
      }
      if (end_date) {
        conditions.push('DATE(a.date) <= ?');
        params.push(end_date);
      }

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        conditions.push(`(
          a.reference_no LIKE ? OR
          a.note LIKE ? OR
          w.name LIKE ? OR
          u.username LIKE ? OR
          EXISTS (
            SELECT 1 FROM aura_adjustment_items ai 
            LEFT JOIN aura_products p ON p.id = ai.product_id
            WHERE ai.adjustment_id = a.id AND (p.name LIKE ? OR p.code LIKE ?)
          )
        )`);
        params.push(term, term, term, term, term, term);
      }

      if (type && type !== 'all') {
        conditions.push(`EXISTS (
          SELECT 1 FROM aura_adjustment_items ai 
          WHERE ai.adjustment_id = a.id AND ai.type = ?
        )`);
        params.push(type);
      }

      const whereClause = conditions.join(' AND ');

      // Global Stats
      const [statsRows] = await db.query(`
        SELECT 
          COUNT(DISTINCT a.id) AS total_adjustments,
          COALESCE(SUM(CASE WHEN ai.type = 'addition' THEN ai.quantity ELSE 0 END), 0) AS total_added_qty,
          COALESCE(SUM(CASE WHEN ai.type = 'subtraction' THEN ai.quantity ELSE 0 END), 0) AS total_subtracted_qty,
          COALESCE(SUM(CASE WHEN ai.type = 'addition' THEN ai.quantity * COALESCE(p.cost, 0) ELSE 0 END), 0) AS total_added_cost,
          COALESCE(SUM(CASE WHEN ai.type = 'subtraction' THEN ai.quantity * COALESCE(p.cost, 0) ELSE 0 END), 0) AS total_subtracted_cost
        FROM aura_adjustments a
        LEFT JOIN aura_adjustment_items ai ON ai.adjustment_id = a.id
        LEFT JOIN aura_products p ON p.id = ai.product_id
        LEFT JOIN aura_warehouses w ON w.id = a.warehouse_id
        LEFT JOIN aura_users u ON u.id = a.created_by
        WHERE ${whereClause}
      `, params);

      // Total count for pagination
      const [countRows] = await db.query(`
        SELECT COUNT(DISTINCT a.id) AS total 
        FROM aura_adjustments a
        LEFT JOIN aura_warehouses w ON w.id = a.warehouse_id
        LEFT JOIN aura_users u ON u.id = a.created_by
        WHERE ${whereClause}
      `, params);

      const total = countRows[0]?.total || 0;

      // Query Records
      const querySql = `
        SELECT 
          a.id,
          a.date,
          a.reference_no,
          a.warehouse_id,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          a.biller_id,
          c.name AS biller_name,
          a.note,
          a.attachment,
          a.created_by,
          u.username AS creator_username,
          CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS creator_fullname,
          a.status,
          COALESCE(item_stats.total_items, 0) AS items_count,
          COALESCE(item_stats.added_qty, 0) AS total_addition_qty,
          COALESCE(item_stats.subtracted_qty, 0) AS total_subtraction_qty,
          COALESCE(item_stats.net_qty, 0) AS net_quantity,
          COALESCE(item_stats.total_cost, 0) AS total_valuation
        FROM aura_adjustments a
        LEFT JOIN aura_warehouses w ON w.id = a.warehouse_id
        LEFT JOIN aura_users u ON u.id = a.created_by
        LEFT JOIN aura_companies c ON c.id = a.biller_id
        LEFT JOIN (
          SELECT 
            ai.adjustment_id,
            COUNT(ai.id) AS total_items,
            SUM(CASE WHEN ai.type = 'addition' THEN ai.quantity ELSE 0 END) AS added_qty,
            SUM(CASE WHEN ai.type = 'subtraction' THEN ai.quantity ELSE 0 END) AS subtracted_qty,
            SUM(CASE WHEN ai.type = 'addition' THEN ai.quantity ELSE -ai.quantity END) AS net_qty,
            SUM(ai.quantity * COALESCE(p.cost, 0)) AS total_cost
          FROM aura_adjustment_items ai
          LEFT JOIN aura_products p ON p.id = ai.product_id
          GROUP BY ai.adjustment_id
        ) item_stats ON item_stats.adjustment_id = a.id
        WHERE ${whereClause}
        ORDER BY a.date DESC, a.id DESC
        LIMIT ? OFFSET ?
      `;

      const [records] = await db.query(querySql, [...params, limitNum, offset]);

      return {
        records,
        stats: statsRows[0] || {},
        pagination: {
          current: pageNum,
          pageSize: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (err) {
      logError('listAdjustments', err);
      throw err;
    }
  }

  /**
   * 2. Get adjustment voucher by ID with items, products, variants, and stock moves
   */
  static async getAdjustmentById(id) {
    try {
      const adjId = parseInt(id, 10);
      if (!adjId) throw new Error('Invalid adjustment ID');

      const [rows] = await db.query(`
        SELECT 
          a.id,
          a.date,
          a.reference_no,
          a.warehouse_id,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          a.biller_id,
          c.name AS biller_name,
          a.note,
          a.attachment,
          a.created_by,
          u.username AS creator_username,
          CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS creator_fullname,
          a.updated_by,
          a.updated_at,
          a.status
        FROM aura_adjustments a
        LEFT JOIN aura_warehouses w ON w.id = a.warehouse_id
        LEFT JOIN aura_users u ON u.id = a.created_by
        LEFT JOIN aura_companies c ON c.id = a.biller_id
        WHERE a.id = ?
        LIMIT 1
      `, [adjId]);

      if (!rows.length) return null;
      const adjustment = rows[0];

      // Retrieve Line Items
      const [items] = await db.query(`
        SELECT 
          ai.id,
          ai.adjustment_id,
          ai.product_id,
          p.code AS product_code,
          p.name AS product_name,
          p.image AS product_image,
          ai.option_id,
          pv.name AS variant_name,
          pv.sku AS variant_sku,
          ai.quantity,
          ai.type,
          ai.serial_no,
          ai.expiry,
          ai.real_unit_cost,
          COALESCE(ai.real_unit_cost, p.cost, 0) AS unit_cost,
          (ai.quantity * COALESCE(ai.real_unit_cost, p.cost, 0)) AS subtotal,
          p.unit AS unit_id,
          u.name AS unit_name,
          COALESCE(wp.quantity, 0) AS warehouse_qoh,
          COALESCE(p.quantity, 0) AS total_qoh
        FROM aura_adjustment_items ai
        LEFT JOIN aura_products p ON p.id = ai.product_id
        LEFT JOIN aura_product_variants pv ON pv.id = ai.option_id
        LEFT JOIN aura_units u ON u.id = p.unit
        LEFT JOIN aura_warehouses_products wp ON wp.product_id = ai.product_id AND wp.warehouse_id = ai.warehouse_id
        WHERE ai.adjustment_id = ?
        ORDER BY ai.id ASC
      `, [adjId]);

      adjustment.items = items;
      return adjustment;
    } catch (err) {
      logError('getAdjustmentById', err);
      throw err;
    }
  }

  /**
   * 3. Metadata Options: Warehouses, Billers, Sequence Reference
   */
  static async getMetadataOptions() {
    try {
      const [warehouses] = await db.query('SELECT id, code, name FROM aura_warehouses ORDER BY name ASC');
      const [billers] = await db.query('SELECT id, name, company FROM aura_companies WHERE group_name = "biller" OR id = 3 ORDER BY name ASC');
      const [units] = await db.query('SELECT id, code, name FROM aura_units ORDER BY name ASC');

      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      const [lastRef] = await db.query(`
        SELECT reference_no FROM aura_adjustments 
        WHERE reference_no LIKE 'Adj${yearSuffix}/%' 
        ORDER BY id DESC LIMIT 1
      `);

      let seq = 1;
      if (lastRef.length && lastRef[0].reference_no) {
        const parts = lastRef[0].reference_no.split('/');
        if (parts.length > 1 && !isNaN(parseInt(parts[1], 10))) {
          seq = parseInt(parts[1], 10) + 1;
        }
      }
      const nextReferenceNo = `Adj${yearSuffix}/${String(seq).padStart(4, '0')}`;

      return {
        warehouses,
        billers,
        units,
        nextReferenceNo
      };
    } catch (err) {
      logError('getMetadataOptions', err);
      throw err;
    }
  }

  /**
   * 4. Available Products for a selected warehouse with live QOH and variants
   */
  static async getAvailableProducts(warehouseId, search = '', limit = 40) {
    try {
      const whId = parseInt(warehouseId, 10) || 1;
      const conditions = ['1=1'];
      const params = [whId];

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        conditions.push('(p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)');
        params.push(term, term, term, term);
      }

      const [products] = await db.query(`
        SELECT 
          p.id,
          p.code,
          p.name,
          p.barcode,
          p.sku,
          p.cost,
          p.price,
          p.unit AS unit_id,
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
      `, [...params, Math.min(100, parseInt(limit, 10) || 40)]);

      // Fetch variants for returned products
      if (products.length > 0) {
        const productIds = products.map(p => p.id);
        const [variants] = await db.query(`
          SELECT 
            pv.id,
            pv.product_id,
            pv.name,
            pv.sku,
            COALESCE(wpv.quantity, 0) AS variant_warehouse_stock,
            COALESCE(pv.quantity, 0) AS variant_total_stock
          FROM aura_product_variants pv
          LEFT JOIN aura_warehouses_products_variants wpv 
            ON wpv.option_id = pv.id AND wpv.warehouse_id = ?
          WHERE pv.product_id IN (?)
          ORDER BY pv.name ASC
        `, [whId, productIds]);

        const variantMap = new Map();
        for (const v of variants) {
          if (!variantMap.has(v.product_id)) variantMap.set(v.product_id, []);
          variantMap.get(v.product_id).push(v);
        }

        for (const prod of products) {
          prod.variants = variantMap.get(prod.id) || [];
        }
      }

      return products;
    } catch (err) {
      logError('getAvailableProducts', err);
      throw err;
    }
  }

  /**
   * 5. Create new Quantity Adjustment (ACID Transaction)
   */
  static async createAdjustment({
    date,
    reference_no,
    warehouse_id = 1,
    biller_id = null,
    note = '',
    attachment = null,
    items = [],
    user_id = 1
  }) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();

      const whId = parseInt(warehouse_id, 10);
      if (!whId) throw new Error('Valid warehouse is required.');

      const [whRows] = await conn.query('SELECT id, name, code FROM aura_warehouses WHERE id = ? LIMIT 1', [whId]);
      if (!whRows.length) throw new Error(`Warehouse #${whId} not found.`);
      const warehouse = whRows[0];

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('At least one product line item is required for adjustment.');
      }

      // Generate reference if not given
      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      let refNo = reference_no && reference_no.trim() ? reference_no.trim() : null;
      if (!refNo) {
        const [lastRef] = await conn.query(`
          SELECT reference_no FROM aura_adjustments 
          WHERE reference_no LIKE 'Adj${yearSuffix}/%' 
          ORDER BY id DESC LIMIT 1 FOR UPDATE
        `);
        let seq = 1;
        if (lastRef.length && lastRef[0].reference_no) {
          const parts = lastRef[0].reference_no.split('/');
          if (parts.length > 1 && !isNaN(parseInt(parts[1], 10))) {
            seq = parseInt(parts[1], 10) + 1;
          }
        }
        refNo = `Adj${yearSuffix}/${String(seq).padStart(4, '0')}`;
      }

      const adjDate = date ? new Date(date) : new Date();

      // Insert adjustment header
      const [hdrRes] = await conn.query(`
        INSERT INTO aura_adjustments (
          date, reference_no, warehouse_id, biller_id, note, attachment, created_by, status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, 'completed'
        )
      `, [adjDate, refNo, whId, biller_id || null, note || '', attachment || null, user_id || 1]);

      const adjustmentId = hdrRes.insertId;

      // Process each line item
      for (const item of items) {
        const pId = parseInt(item.product_id, 10);
        const optId = item.option_id ? parseInt(item.option_id, 10) : null;
        const qty = parseFloat(item.quantity);
        const type = (item.type === 'subtraction') ? 'subtraction' : 'addition';
        const isSub = (type === 'subtraction');
        const delta = isSub ? -Math.abs(qty) : Math.abs(qty);

        if (!pId) throw new Error('Product ID is missing in adjustment item.');
        if (!qty || qty <= 0) throw new Error(`Invalid quantity ${qty} for product item #${pId}. Must be > 0.`);

        // Fetch & lock master product
        const [pRows] = await conn.query(
          'SELECT id, name, code, cost, price, unit FROM aura_products WHERE id = ? LIMIT 1 FOR UPDATE',
          [pId]
        );
        if (!pRows.length) throw new Error(`Product #${pId} not found.`);
        const prod = pRows[0];
        const unitCost = parseFloat(item.unit_cost || prod.cost) || 0;

        let variantSku = prod.code;
        let variantName = '';

        // If variant, lock and validate variant stock
        if (optId) {
          const [vRows] = await conn.query(
            'SELECT id, name, sku, quantity FROM aura_product_variants WHERE id = ? AND product_id = ? LIMIT 1 FOR UPDATE',
            [optId, pId]
          );
          if (!vRows.length) throw new Error(`Variant #${optId} not found for product "${prod.name}".`);
          variantName = vRows[0].name;
          variantSku = vRows[0].sku || `${prod.code}-${variantName}`;

          if (isSub) {
            const [whv] = await conn.query(
              'SELECT quantity FROM aura_warehouses_products_variants WHERE option_id = ? AND warehouse_id = ? LIMIT 1 FOR UPDATE',
              [optId, whId]
            );
            const currentVarQty = parseFloat(whv[0]?.quantity) || 0;
            if (currentVarQty < qty) {
              throw new Error(`Insufficient stock for variant "${variantName}". Current QOH in ${warehouse.name} is ${currentVarQty}, cannot subtract ${qty}.`);
            }
          }

          // Update variant warehouse balance
          await conn.query(`
            INSERT INTO aura_warehouses_products_variants (option_id, product_id, warehouse_id, quantity)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = GREATEST(0, quantity + VALUES(quantity))
          `, [optId, pId, whId, delta]);

          // Update master variant balance
          await conn.query('UPDATE aura_product_variants SET quantity = GREATEST(0, quantity + ?) WHERE id = ?', [delta, optId]);
        }

        // Validate overall warehouse stock for subtraction
        if (isSub) {
          const [whp] = await conn.query(
            'SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ? LIMIT 1 FOR UPDATE',
            [pId, whId]
          );
          const currentProdQty = parseFloat(whp[0]?.quantity) || 0;
          if (currentProdQty < qty) {
            throw new Error(`Insufficient stock for "${prod.name}". Current QOH in ${warehouse.name} is ${currentProdQty}, cannot subtract ${qty}.`);
          }
        }

        // Update warehouse product stock
        await conn.query(`
          INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = GREATEST(0, quantity + VALUES(quantity))
        `, [pId, whId, delta, unitCost]);

        // Update master product total stock
        await conn.query('UPDATE aura_products SET quantity = GREATEST(0, quantity + ?) WHERE id = ?', [delta, pId]);

        // Insert adjustment item
        await conn.query(`
          INSERT INTO aura_adjustment_items (
            adjustment_id, product_id, option_id, quantity, warehouse_id,
            serial_no, type, expiry, real_unit_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          adjustmentId,
          pId,
          optId || null,
          qty,
          whId,
          item.serial_no || null,
          type,
          item.expiry || null,
          unitCost
        ]);

        // Log Stock Movement Audit Ledger
        await conn.query(`
          INSERT INTO aura_stock_movement (
            date, reference_no, transaction, transaction_id, warehouse_id, product_id,
            product_type, product_code, product_name, real_unit_cost, quantity, unit_quantity,
            option_id, user_id, serial_no, expiry, actual_date
          ) VALUES (
            ?, ?, 'QuantityAdjustment', ?, ?, ?,
            'standard', ?, ?, ?, ?, 1,
            ?, ?, ?, ?, ?
          )
        `, [
          adjDate,
          refNo,
          adjustmentId,
          whId,
          pId,
          variantSku,
          variantName ? `${prod.name} (${variantName})` : prod.name,
          unitCost,
          delta,
          optId || null,
          user_id || 1,
          item.serial_no || null,
          item.expiry || null,
          adjDate
        ]);
      }

      await conn.commit();
      return { id: adjustmentId, reference_no: refNo };
    } catch (err) {
      await conn.rollback();
      logError('createAdjustment', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 6. Update existing Quantity Adjustment (Atomically Reverses Prior Effects & Reapplies)
   */
  static async updateAdjustment(id, {
    date,
    reference_no,
    warehouse_id,
    biller_id,
    note,
    items = [],
    user_id = 1
  }) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();

      const adjId = parseInt(id, 10);
      const [existingRows] = await conn.query('SELECT * FROM aura_adjustments WHERE id = ? LIMIT 1 FOR UPDATE', [adjId]);
      if (!existingRows.length) throw new Error(`Adjustment #${adjId} not found.`);
      const oldAdj = existingRows[0];

      // 1. Fetch old items and reverse their stock effects
      const [oldItems] = await conn.query('SELECT * FROM aura_adjustment_items WHERE adjustment_id = ?', [adjId]);
      for (const oldItem of oldItems) {
        const pId = oldItem.product_id;
        const optId = oldItem.option_id;
        const oldQty = parseFloat(oldItem.quantity);
        const oldType = oldItem.type;
        // Reversal: if old was addition (+qty), reverse is -qty. If old was subtraction (-qty), reverse is +qty.
        const revDelta = (oldType === 'addition') ? -oldQty : oldQty;

        if (optId) {
          await conn.query('UPDATE aura_warehouses_products_variants SET quantity = GREATEST(0, quantity + ?) WHERE option_id = ? AND warehouse_id = ?', [revDelta, optId, oldAdj.warehouse_id]);
          await conn.query('UPDATE aura_product_variants SET quantity = GREATEST(0, quantity + ?) WHERE id = ?', [revDelta, optId]);
        }
        await conn.query('UPDATE aura_warehouses_products SET quantity = GREATEST(0, quantity + ?) WHERE product_id = ? AND warehouse_id = ?', [revDelta, pId, oldAdj.warehouse_id]);
        await conn.query('UPDATE aura_products SET quantity = GREATEST(0, quantity + ?) WHERE id = ?', [revDelta, pId]);
      }

      // Delete prior stock movements and adjustment items
      await conn.query('DELETE FROM aura_stock_movement WHERE transaction = "QuantityAdjustment" AND transaction_id = ?', [adjId]);
      await conn.query('DELETE FROM aura_adjustment_items WHERE adjustment_id = ?', [adjId]);

      // 2. Validate target warehouse
      const targetWhId = parseInt(warehouse_id || oldAdj.warehouse_id, 10);
      const [whRows] = await conn.query('SELECT id, name, code FROM aura_warehouses WHERE id = ? LIMIT 1', [targetWhId]);
      if (!whRows.length) throw new Error(`Warehouse #${targetWhId} not found.`);
      const warehouse = whRows[0];

      const refNo = reference_no || oldAdj.reference_no;
      const adjDate = date ? new Date(date) : new Date(oldAdj.date);

      // Update header
      await conn.query(`
        UPDATE aura_adjustments SET
          date = ?,
          reference_no = ?,
          warehouse_id = ?,
          biller_id = ?,
          note = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [adjDate, refNo, targetWhId, biller_id || null, note || '', user_id || 1, adjId]);

      // 3. Re-apply new items
      for (const item of items) {
        const pId = parseInt(item.product_id, 10);
        const optId = item.option_id ? parseInt(item.option_id, 10) : null;
        const qty = parseFloat(item.quantity);
        const type = (item.type === 'subtraction') ? 'subtraction' : 'addition';
        const isSub = (type === 'subtraction');
        const delta = isSub ? -Math.abs(qty) : Math.abs(qty);

        if (!pId) throw new Error('Product ID is missing in adjustment item.');
        if (!qty || qty <= 0) throw new Error(`Invalid quantity ${qty} for product item #${pId}. Must be > 0.`);

        const [pRows] = await conn.query('SELECT id, name, code, cost, price, unit FROM aura_products WHERE id = ? LIMIT 1 FOR UPDATE', [pId]);
        if (!pRows.length) throw new Error(`Product #${pId} not found.`);
        const prod = pRows[0];
        const unitCost = parseFloat(item.unit_cost || prod.cost) || 0;

        let variantSku = prod.code;
        let variantName = '';

        if (optId) {
          const [vRows] = await conn.query('SELECT id, name, sku FROM aura_product_variants WHERE id = ? AND product_id = ? LIMIT 1 FOR UPDATE', [optId, pId]);
          if (!vRows.length) throw new Error(`Variant #${optId} not found for product "${prod.name}".`);
          variantName = vRows[0].name;
          variantSku = vRows[0].sku || `${prod.code}-${variantName}`;

          if (isSub) {
            const [whv] = await conn.query('SELECT quantity FROM aura_warehouses_products_variants WHERE option_id = ? AND warehouse_id = ? LIMIT 1 FOR UPDATE', [optId, targetWhId]);
            const currentVarQty = parseFloat(whv[0]?.quantity) || 0;
            if (currentVarQty < qty) {
              throw new Error(`Insufficient stock for variant "${variantName}". Current QOH in ${warehouse.name} is ${currentVarQty}, cannot subtract ${qty}.`);
            }
          }

          await conn.query(`
            INSERT INTO aura_warehouses_products_variants (option_id, product_id, warehouse_id, quantity)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = GREATEST(0, quantity + VALUES(quantity))
          `, [optId, pId, targetWhId, delta]);

          await conn.query('UPDATE aura_product_variants SET quantity = GREATEST(0, quantity + ?) WHERE id = ?', [delta, optId]);
        }

        if (isSub) {
          const [whp] = await conn.query('SELECT quantity FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ? LIMIT 1 FOR UPDATE', [pId, targetWhId]);
          const currentProdQty = parseFloat(whp[0]?.quantity) || 0;
          if (currentProdQty < qty) {
            throw new Error(`Insufficient stock for "${prod.name}". Current QOH in ${warehouse.name} is ${currentProdQty}, cannot subtract ${qty}.`);
          }
        }

        await conn.query(`
          INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE quantity = GREATEST(0, quantity + VALUES(quantity))
        `, [pId, targetWhId, delta, unitCost]);

        await conn.query('UPDATE aura_products SET quantity = GREATEST(0, quantity + ?) WHERE id = ?', [delta, pId]);

        await conn.query(`
          INSERT INTO aura_adjustment_items (
            adjustment_id, product_id, option_id, quantity, warehouse_id,
            serial_no, type, expiry, real_unit_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          adjId,
          pId,
          optId || null,
          qty,
          targetWhId,
          item.serial_no || null,
          type,
          item.expiry || null,
          unitCost
        ]);

        await conn.query(`
          INSERT INTO aura_stock_movement (
            date, reference_no, transaction, transaction_id, warehouse_id, product_id,
            product_type, product_code, product_name, real_unit_cost, quantity, unit_quantity,
            option_id, user_id, serial_no, expiry, actual_date
          ) VALUES (
            ?, ?, 'QuantityAdjustment', ?, ?, ?,
            'standard', ?, ?, ?, ?, 1,
            ?, ?, ?, ?, ?
          )
        `, [
          adjDate,
          refNo,
          adjId,
          targetWhId,
          pId,
          variantSku,
          variantName ? `${prod.name} (${variantName})` : prod.name,
          unitCost,
          delta,
          optId || null,
          user_id || 1,
          item.serial_no || null,
          item.expiry || null,
          adjDate
        ]);
      }

      await conn.commit();
      return { id: adjId, reference_no: refNo };
    } catch (err) {
      await conn.rollback();
      logError('updateAdjustment', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 7. Delete / Cancel Adjustment (Safely Reverses All Stock Effects)
   */
  static async deleteAdjustment(id) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();

      const adjId = parseInt(id, 10);
      const [existingRows] = await conn.query('SELECT * FROM aura_adjustments WHERE id = ? LIMIT 1 FOR UPDATE', [adjId]);
      if (!existingRows.length) throw new Error(`Adjustment #${adjId} not found.`);
      const adj = existingRows[0];

      const [items] = await conn.query('SELECT * FROM aura_adjustment_items WHERE adjustment_id = ?', [adjId]);

      // Reverse each item's effect
      for (const item of items) {
        const pId = item.product_id;
        const optId = item.option_id;
        const qty = parseFloat(item.quantity);
        const revDelta = (item.type === 'addition') ? -qty : qty;

        if (optId) {
          await conn.query('UPDATE aura_warehouses_products_variants SET quantity = GREATEST(0, quantity + ?) WHERE option_id = ? AND warehouse_id = ?', [revDelta, optId, adj.warehouse_id]);
          await conn.query('UPDATE aura_product_variants SET quantity = GREATEST(0, quantity + ?) WHERE id = ?', [revDelta, optId]);
        }
        await conn.query('UPDATE aura_warehouses_products SET quantity = GREATEST(0, quantity + ?) WHERE product_id = ? AND warehouse_id = ?', [revDelta, pId, adj.warehouse_id]);
        await conn.query('UPDATE aura_products SET quantity = GREATEST(0, quantity + ?) WHERE id = ?', [revDelta, pId]);
      }

      // Delete stock movement records
      await conn.query('DELETE FROM aura_stock_movement WHERE transaction = "QuantityAdjustment" AND transaction_id = ?', [adjId]);

      // Delete items
      await conn.query('DELETE FROM aura_adjustment_items WHERE adjustment_id = ?', [adjId]);

      // Delete header
      await conn.query('DELETE FROM aura_adjustments WHERE id = ?', [adjId]);

      await conn.commit();
      return { success: true, deleted_id: adjId };
    } catch (err) {
      await conn.rollback();
      logError('deleteAdjustment', err);
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = QuantityAdjustmentsModel;
