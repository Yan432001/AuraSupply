const db = require('../../config/dbPool');

function logError(context, err) {
  console.error(`[CostAdjustmentsModel Error] [${context}]:`, err?.message || err);
}

class CostAdjustmentsModel {
  /**
   * 1. Get metadata options (warehouses, billers, standard reasons, next reference, statuses)
   */
  static async getMetadataOptions() {
    try {
      const [warehouses] = await db.query(`
        SELECT id, code, name, address 
        FROM aura_warehouses 
        ORDER BY name ASC
      `);

      const [billers] = await db.query(`
        SELECT id, name, company 
        FROM aura_companies 
        WHERE group_name = 'biller' 
        ORDER BY company ASC
      `);

      // Generate next reference like CA-XXXXXX
      const [lastAdj] = await db.query(`
        SELECT id, reference_no 
        FROM aura_cost_adjustments 
        ORDER BY id DESC 
        LIMIT 1
      `);

      const nextId = (lastAdj[0]?.id || 0) + 1;
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const nextReferenceNo = `CA-${String(nextId).padStart(4, '0')}${randomPart.toString().slice(-2)}`;

      const standardReasons = [
        'Supplier Price Revision',
        'Market Revaluation / Devaluation',
        'Freight & Landed Cost Recalculation',
        'Currency / Exchange Rate Adjustment',
        'Internal Cost Audit & Correction',
        'Bulk Discount Rebate Application',
        'Packaging or Component Price Change',
        'End-of-Period Inventory Revaluation',
        'Other',
      ];

      const statuses = [
        { key: 'completed', label: 'Completed (Applied)', color: 'green' },
        { key: 'pending', label: 'Pending Review', color: 'orange' },
        { key: 'draft', label: 'Draft', color: 'default' },
        { key: 'cancelled', label: 'Cancelled / Reverted', color: 'red' },
      ];

      return {
        warehouses: warehouses || [],
        billers: billers || [],
        standardReasons,
        nextReferenceNo,
        statuses,
      };
    } catch (err) {
      logError('getMetadataOptions', err);
      throw err;
    }
  }

  /**
   * 2. Search available products with current cost and warehouse inventory balances
   */
  static async getAvailableProducts(warehouseId = 'all', term = '', limit = 20) {
    try {
      const cleanTerm = term ? term.trim() : '';
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

      const conditions = ['1=1'];
      const params = [];

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

      const whCondition = warehouseId && warehouseId !== 'all' ? 'AND wp.warehouse_id = ?' : '';
      if (whCondition) {
        params.push(parseInt(warehouseId, 10));
      }

      const query = `
        SELECT 
          p.id AS product_id,
          p.code AS product_code,
          p.barcode AS product_barcode,
          p.name AS product_name,
          p.cost AS current_cost,
          p.price AS selling_price,
          p.unit AS unit_id,
          u.code AS unit_code,
          u.name AS unit_name,
          p.image,
          pv.id AS option_id,
          pv.name AS variant_name,
          pv.cost AS variant_cost,
          COALESCE(SUM(wp.quantity), 0) AS total_on_hand_quantity,
          AVG(NULLIF(wp.avg_cost, 0)) AS warehouse_avg_cost
        FROM aura_products p
        LEFT JOIN aura_units u ON u.id = p.unit
        LEFT JOIN aura_product_variants pv ON pv.product_id = p.id
        LEFT JOIN aura_warehouses_products wp ON wp.product_id = p.id ${whCondition}
        WHERE ${conditions.join(' AND ')}
        GROUP BY p.id, pv.id
        ORDER BY p.name ASC, pv.name ASC
        LIMIT ?
      `;
      params.push(limitNum);

      const [rows] = await db.query(query, params);

      return rows.map((r) => {
        const costToUse = parseFloat(r.variant_cost || r.warehouse_avg_cost || r.current_cost || 0);
        return {
          id: r.product_id,
          product_id: r.product_id,
          product_code: r.product_code,
          product_barcode: r.product_barcode,
          product_name: r.product_name,
          display_name: r.variant_name ? `${r.product_name} (${r.variant_name})` : r.product_name,
          option_id: r.option_id || null,
          variant_name: r.variant_name || null,
          unit_code: r.unit_code || 'ea',
          unit_name: r.unit_name || '',
          current_cost: costToUse,
          old_cost: costToUse,
          new_cost: costToUse,
          selling_price: parseFloat(r.selling_price || 0),
          on_hand_quantity: parseFloat(r.total_on_hand_quantity || 0),
          image: r.image,
        };
      });
    } catch (err) {
      logError('getAvailableProducts', err);
      throw err;
    }
  }

  /**
   * 3. List Cost Adjustments with filters, search, metrics, and pagination
   */
  static async listCostAdjustments({
    search = '',
    warehouse_id = 'all',
    status = 'all',
    reason = 'all',
    start_date = null,
    end_date = null,
    sort_by = 'ca.date',
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
          ca.reference_no LIKE ? OR 
          ca.reason LIKE ? OR 
          ca.note LIKE ? OR 
          w.name LIKE ? OR 
          EXISTS (
            SELECT 1 FROM aura_cost_adjustment_items cai 
            WHERE cai.cost_adjustment_id = ca.id AND (cai.product_name LIKE ? OR cai.product_code LIKE ?)
          )
        )`);
        params.push(term, term, term, term, term, term);
      }

      if (warehouse_id && warehouse_id !== 'all') {
        conditions.push('(ca.warehouse_id = ? OR ca.warehouse_id IS NULL)');
        params.push(parseInt(warehouse_id, 10));
      }

      if (status && status !== 'all') {
        conditions.push('ca.status = ?');
        params.push(status);
      }

      if (reason && reason !== 'all') {
        conditions.push('ca.reason = ?');
        params.push(reason);
      }

      if (start_date) {
        conditions.push('ca.date >= ?');
        params.push(`${start_date} 00:00:00`);
      }

      if (end_date) {
        conditions.push('ca.date <= ?');
        params.push(`${end_date} 23:59:59`);
      }

      const whereClause = conditions.join(' AND ');

      // Summary statistics across filters
      const [stats] = await db.query(`
        SELECT 
          COUNT(DISTINCT ca.id) AS total_count,
          COALESCE(SUM(CASE WHEN ca.status = 'completed' THEN 1 ELSE 0 END), 0) AS count_completed,
          COALESCE(SUM(CASE WHEN ca.status = 'pending' THEN 1 ELSE 0 END), 0) AS count_pending,
          COALESCE(SUM(CASE WHEN ca.status = 'draft' THEN 1 ELSE 0 END), 0) AS count_draft,
          COALESCE(SUM(CASE WHEN ca.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS count_cancelled,
          COALESCE(SUM(ca.total_cost_difference), 0) AS sum_cost_difference,
          COALESCE(SUM(ca.total_valuation_change), 0) AS sum_valuation_change,
          COALESCE(SUM(ca.total_items), 0) AS total_adjusted_items
        FROM aura_cost_adjustments ca
        LEFT JOIN aura_warehouses w ON w.id = ca.warehouse_id
        WHERE ${whereClause}
      `, params);

      const totalRecords = stats[0]?.total_count || 0;

      // Safe sorting mapping
      const allowedSortCols = {
        id: 'ca.id',
        date: 'ca.date',
        reference_no: 'ca.reference_no',
        warehouse_name: 'w.name',
        reason: 'ca.reason',
        status: 'ca.status',
        total_items: 'ca.total_items',
        total_valuation_change: 'ca.total_valuation_change',
        total_cost_difference: 'ca.total_cost_difference',
      };

      const sortCol = allowedSortCols[sort_by] || 'ca.date';
      const sortDir = String(sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Query Records
      const [rows] = await db.query(`
        SELECT 
          ca.id,
          ca.reference_no,
          ca.date,
          ca.warehouse_id,
          COALESCE(w.name, 'All Warehouses (Global)') AS warehouse_name,
          w.code AS warehouse_code,
          ca.biller_id,
          b.company AS biller_name,
          ca.reason,
          ca.status,
          ca.total_items,
          ca.total_cost_difference,
          ca.total_valuation_change,
          ca.note,
          ca.created_by,
          u.username AS created_by_username,
          CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS created_by_fullname,
          ca.created_at,
          ca.updated_at,
          (
            SELECT GROUP_CONCAT(CONCAT(cai.product_name, ' (', cai.old_cost, ' -> ', cai.new_cost, ')') SEPARATOR ', ')
            FROM aura_cost_adjustment_items cai
            WHERE cai.cost_adjustment_id = ca.id
            LIMIT 3
          ) AS items_preview
        FROM aura_cost_adjustments ca
        LEFT JOIN aura_warehouses w ON w.id = ca.warehouse_id
        LEFT JOIN aura_companies b ON b.id = ca.biller_id
        LEFT JOIN aura_users u ON u.id = ca.created_by
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
      logError('listCostAdjustments', err);
      throw err;
    }
  }

  /**
   * 4. Get detailed cost adjustment by ID with items, stock quantities, and audit trail
   */
  static async getCostAdjustmentById(id) {
    try {
      const [rows] = await db.query(`
        SELECT 
          ca.*,
          COALESCE(w.name, 'All Warehouses (Global)') AS warehouse_name,
          w.code AS warehouse_code,
          b.company AS biller_company,
          b.name AS biller_name,
          u.username AS creator_username,
          CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS creator_fullname,
          uu.username AS updater_username
        FROM aura_cost_adjustments ca
        LEFT JOIN aura_warehouses w ON w.id = ca.warehouse_id
        LEFT JOIN aura_companies b ON b.id = ca.biller_id
        LEFT JOIN aura_users u ON u.id = ca.created_by
        LEFT JOIN aura_users uu ON uu.id = ca.updated_by
        WHERE ca.id = ?
        LIMIT 1
      `, [id]);

      if (!rows.length) {
        return null;
      }

      const adjustment = rows[0];

      // Retrieve items
      const [items] = await db.query(`
        SELECT 
          cai.*,
          p.image,
          p.price AS current_selling_price,
          u.code AS unit_code,
          u.name AS unit_name
        FROM aura_cost_adjustment_items cai
        LEFT JOIN aura_products p ON p.id = cai.product_id
        LEFT JOIN aura_units u ON u.id = p.unit
        WHERE cai.cost_adjustment_id = ?
        ORDER BY cai.id ASC
      `, [id]);

      // Retrieve history logs
      const [history] = await db.query(`
        SELECT 
          cah.*,
          p.name AS product_name,
          p.code AS product_code,
          u.username AS actor_username
        FROM aura_cost_adjustment_history cah
        LEFT JOIN aura_products p ON p.id = cah.product_id
        LEFT JOIN aura_users u ON u.id = cah.actor_id
        WHERE cah.cost_adjustment_id = ?
        ORDER BY cah.created_at ASC
      `, [id]);

      return {
        ...adjustment,
        items: items || [],
        history: history || [],
      };
    } catch (err) {
      logError('getCostAdjustmentById', err);
      throw err;
    }
  }

  /**
   * 5. Create Cost Adjustment (ACID transaction, applies cost & valuation changes while preserving stock)
   */
  static async createCostAdjustment(payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        reference_no,
        date = new Date(),
        warehouse_id = null,
        biller_id = null,
        reason = 'Supplier Price Revision',
        status = 'completed',
        note = '',
        items = [],
      } = payload;

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('At least one product item is required for cost adjustment');
      }

      // Generate Reference if needed
      let finalRef = reference_no;
      if (!finalRef) {
        const [last] = await conn.query('SELECT id FROM aura_cost_adjustments ORDER BY id DESC LIMIT 1');
        const nextId = (last[0]?.id || 0) + 1;
        finalRef = `CA-${String(nextId).padStart(4, '0')}${Math.floor(10 + Math.random() * 90)}`;
      }

      let totalCostDiff = 0;
      let totalValuationDiff = 0;
      const processedItems = [];

      for (const item of items) {
        const oldCost = parseFloat(item.old_cost ?? item.current_cost ?? 0);
        let newCost = parseFloat(item.new_cost);

        if (isNaN(newCost) || newCost < 0) {
          throw new Error(`Invalid new cost for product "${item.product_name || item.product_code}"`);
        }

        // Support percentage adjustment calculation if provided
        if (item.adjustment_type === 'percentage' && item.adjustment_value) {
          const pct = parseFloat(item.adjustment_value);
          newCost = oldCost * (1 + pct / 100);
        }

        const costDiff = newCost - oldCost;

        // Fetch current on-hand stock quantity (Preserving stock, only calculating valuation)
        const whClause = warehouse_id && warehouse_id !== 'all' ? 'AND warehouse_id = ?' : '';
        const whParams = [item.product_id];
        if (whClause) whParams.push(parseInt(warehouse_id, 10));

        const [stockRow] = await conn.query(`
          SELECT COALESCE(SUM(quantity), 0) AS on_hand_qty 
          FROM aura_warehouses_products 
          WHERE product_id = ? ${whClause}
        `, whParams);

        const onHandQty = parseFloat(stockRow[0]?.on_hand_qty || item.on_hand_quantity || 0);
        const valuationDiff = costDiff * onHandQty;

        totalCostDiff += costDiff;
        totalValuationDiff += valuationDiff;

        processedItems.push({
          product_id: item.product_id,
          product_code: item.product_code || '',
          product_name: item.product_name || '',
          option_id: item.option_id ? parseInt(item.option_id, 10) : null,
          warehouse_id: warehouse_id && warehouse_id !== 'all' ? parseInt(warehouse_id, 10) : null,
          on_hand_quantity: onHandQty,
          old_cost: oldCost,
          new_cost: newCost,
          cost_difference: costDiff,
          valuation_difference: valuationDiff,
          adjustment_type: item.adjustment_type || 'amount',
          adjustment_value: parseFloat(item.adjustment_value || costDiff),
          note: item.note || '',
        });
      }

      // Insert Cost Adjustment Header
      const [insertHeader] = await conn.query(`
        INSERT INTO aura_cost_adjustments (
          reference_no, date, warehouse_id, biller_id, note, reason, status,
          total_items, total_cost_difference, total_valuation_change, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        finalRef,
        date ? new Date(date) : new Date(),
        warehouse_id && warehouse_id !== 'all' ? parseInt(warehouse_id, 10) : null,
        biller_id || null,
        note || '',
        reason || 'Supplier Price Revision',
        status,
        processedItems.length,
        totalCostDiff,
        totalValuationDiff,
        user.id || 1,
      ]);

      const costAdjId = insertHeader.insertId;

      // Insert Items & Apply Product Costing Updates
      for (const item of processedItems) {
        await conn.query(`
          INSERT INTO aura_cost_adjustment_items (
            cost_adjustment_id, product_id, product_code, product_name, option_id,
            warehouse_id, on_hand_quantity, old_cost, new_cost, cost_difference,
            valuation_difference, adjustment_type, adjustment_value, note
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          costAdjId,
          item.product_id,
          item.product_code,
          item.product_name,
          item.option_id,
          item.warehouse_id,
          item.on_hand_quantity,
          item.old_cost,
          item.new_cost,
          item.cost_difference,
          item.valuation_difference,
          item.adjustment_type,
          item.adjustment_value,
          item.note,
        ]);

        // If status is 'completed', update master product cost, warehouse avg_cost, and product units
        if (status === 'completed') {
          const applyAll = payload.apply_all_warehouses !== false;
          await CostAdjustmentsModel.syncProductCostToAllLevels(
            conn,
            item.product_id,
            item.new_cost,
            item.warehouse_id,
            applyAll,
            item.option_id
          );
        }

        // Insert Audit Trail
        await conn.query(`
          INSERT INTO aura_cost_adjustment_history (
            cost_adjustment_id, product_id, action, old_cost, new_cost, actor_id, actor_name, note
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          costAdjId,
          item.product_id,
          status === 'completed' ? 'cost_updated' : 'cost_adjustment_created',
          item.old_cost,
          item.new_cost,
          user.id || 1,
          user.username || 'System',
          item.note || `Cost adjusted from ${item.old_cost} to ${item.new_cost} (Reason: ${reason})`,
        ]);
      }

      await conn.commit();
      return {
        id: costAdjId,
        reference_no: finalRef,
        status,
        total_items: processedItems.length,
        total_valuation_change: totalValuationDiff,
      };
    } catch (err) {
      await conn.rollback();
      logError('createCostAdjustment', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 6. Update Cost Adjustment
   */
  static async updateCostAdjustment(id, payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT * FROM aura_cost_adjustments WHERE id = ? FOR UPDATE', [id]);
      if (!existing.length) {
        throw new Error('Cost adjustment record not found');
      }

      const current = existing[0];
      if (current.status === 'cancelled') {
        throw new Error('Cancelled cost adjustments cannot be modified');
      }

      const {
        reference_no = current.reference_no,
        date = current.date,
        warehouse_id = current.warehouse_id,
        biller_id = current.biller_id,
        reason = current.reason,
        status = current.status,
        note = current.note,
        items = [],
      } = payload;

      // Delete existing item rows
      await conn.query('DELETE FROM aura_cost_adjustment_items WHERE cost_adjustment_id = ?', [id]);

      let totalCostDiff = 0;
      let totalValuationDiff = 0;

      for (const item of items) {
        const oldCost = parseFloat(item.old_cost || 0);
        const newCost = parseFloat(item.new_cost || 0);
        const costDiff = newCost - oldCost;
        const onHandQty = parseFloat(item.on_hand_quantity || 0);
        const valuationDiff = costDiff * onHandQty;

        totalCostDiff += costDiff;
        totalValuationDiff += valuationDiff;

        await conn.query(`
          INSERT INTO aura_cost_adjustment_items (
            cost_adjustment_id, product_id, product_code, product_name, option_id,
            warehouse_id, on_hand_quantity, old_cost, new_cost, cost_difference,
            valuation_difference, adjustment_type, adjustment_value, note
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          item.product_id,
          item.product_code || '',
          item.product_name || '',
          item.option_id || null,
          warehouse_id && warehouse_id !== 'all' ? parseInt(warehouse_id, 10) : null,
          onHandQty,
          oldCost,
          newCost,
          costDiff,
          valuationDiff,
          item.adjustment_type || 'amount',
          parseFloat(item.adjustment_value || costDiff),
          item.note || '',
        ]);

        if (status === 'completed') {
          const applyAll = payload.apply_all_warehouses !== false;
          await CostAdjustmentsModel.syncProductCostToAllLevels(
            conn,
            item.product_id,
            newCost,
            warehouse_id,
            applyAll,
            item.option_id
          );
        }
      }

      await conn.query(`
        UPDATE aura_cost_adjustments SET 
          reference_no = ?,
          date = ?,
          warehouse_id = ?,
          biller_id = ?,
          note = ?,
          reason = ?,
          status = ?,
          total_items = ?,
          total_cost_difference = ?,
          total_valuation_change = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        reference_no,
        date ? new Date(date) : current.date,
        warehouse_id && warehouse_id !== 'all' ? parseInt(warehouse_id, 10) : null,
        biller_id || null,
        note,
        reason,
        status,
        items.length,
        totalCostDiff,
        totalValuationDiff,
        user.id || 1,
        id,
      ]);

      await conn.commit();
      return { id, reference_no, status };
    } catch (err) {
      await conn.rollback();
      logError('updateCostAdjustment', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 7. Delete / Cancel Cost Adjustment (Reverses cost updates safely)
   */
  static async deleteCostAdjustment(id, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query('SELECT * FROM aura_cost_adjustments WHERE id = ? FOR UPDATE', [id]);
      if (!rows.length) {
        throw new Error('Cost adjustment record not found');
      }

      const adjustment = rows[0];

      // If completed, revert costs back to old_cost across all levels
      if (adjustment.status === 'completed') {
        const [items] = await conn.query('SELECT * FROM aura_cost_adjustment_items WHERE cost_adjustment_id = ?', [id]);
        for (const item of items) {
          await CostAdjustmentsModel.syncProductCostToAllLevels(
            conn,
            item.product_id,
            item.old_cost,
            item.warehouse_id,
            true, // revert globally
            item.option_id
          );
        }
      }

      await conn.query('DELETE FROM aura_cost_adjustment_history WHERE cost_adjustment_id = ?', [id]);
      await conn.query('DELETE FROM aura_cost_adjustment_items WHERE cost_adjustment_id = ?', [id]);
      await conn.query('DELETE FROM aura_cost_adjustments WHERE id = ?', [id]);

      await conn.commit();
      return { id, deleted: true };
    } catch (err) {
      await conn.rollback();
      logError('deleteCostAdjustment', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 8. Synchronize product cost across:
   * 1. aura_products.cost (Master Products List)
   * 2. aura_cost_price_by_units (Base unit & all derived/sub units)
   * 3. aura_warehouses_products.avg_cost (All warehouses or selected warehouse, upserting if missing)
   * 4. aura_product_variants.cost (if option/variant specified)
   */
  static async syncProductCostToAllLevels(conn, productId, newCost, warehouseId = null, applyAllWarehouses = true, optionId = null) {
    const costVal = parseFloat(newCost) || 0;

    // 1. Update Master Product table cost
    await conn.query('UPDATE aura_products SET cost = ? WHERE id = ?', [costVal, productId]);

    // 2. Update Product Units in aura_cost_price_by_units
    const [pRows] = await conn.query('SELECT id, code, unit, purchase_unit, sale_unit FROM aura_products WHERE id = ?', [productId]);
    const prod = pRows[0];
    const baseUnitId = prod ? (prod.unit || prod.purchase_unit || prod.sale_unit) : null;

    if (baseUnitId) {
      // 2a. Update or Insert base unit row
      const [baseRows] = await conn.query(
        'SELECT id FROM aura_cost_price_by_units WHERE product_id = ? AND unit_id = ? LIMIT 1',
        [productId, baseUnitId]
      );
      if (baseRows.length > 0) {
        await conn.query(
          'UPDATE aura_cost_price_by_units SET cost = ?, product_code = ? WHERE id = ?',
          [costVal, prod.code, baseRows[0].id]
        );
      } else {
        await conn.query(
          'INSERT INTO aura_cost_price_by_units (product_id, unit_id, cost, price, product_code) VALUES (?, ?, ?, 0, ?)',
          [productId, baseUnitId, costVal, prod.code]
        );
      }

      // 2b. Recalculate and update derived/sub units
      const [childUnits] = await conn.query(`
        SELECT cpu.id, cpu.unit_id, u.operator, u.operation_value
        FROM aura_cost_price_by_units cpu
        JOIN aura_units u ON u.id = cpu.unit_id
        WHERE cpu.product_id = ? AND cpu.unit_id != ?
      `, [productId, baseUnitId]);

      for (const cu of childUnits) {
        let childCost = costVal;
        const opVal = parseFloat(cu.operation_value) || 1;
        if (cu.operator === '*') {
          childCost = costVal * opVal;
        } else if (cu.operator === '/') {
          childCost = opVal !== 0 ? costVal / opVal : costVal;
        } else if (cu.operator === '+') {
          childCost = costVal + opVal;
        } else if (cu.operator === '-') {
          childCost = costVal - opVal;
        }
        childCost = parseFloat(childCost.toFixed(4));
        await conn.query('UPDATE aura_cost_price_by_units SET cost = ? WHERE id = ?', [childCost, cu.id]);
      }
    } else {
      // If product has no base unit ID configured, update any existing rows in cost_price_by_units
      await conn.query('UPDATE aura_cost_price_by_units SET cost = ? WHERE product_id = ?', [costVal, productId]);
    }

    // 3. Update Warehouse Stock (aura_warehouses_products)
    if (applyAllWarehouses || !warehouseId || warehouseId === 'all') {
      // Update ALL warehouses for this product
      await conn.query('UPDATE aura_warehouses_products SET avg_cost = ? WHERE product_id = ?', [costVal, productId]);

      // If specific warehouse selected, ensure it exists in aura_warehouses_products
      if (warehouseId && warehouseId !== 'all') {
        const whId = parseInt(warehouseId, 10);
        await conn.query(`
          INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
          VALUES (?, ?, 0, ?)
          ON DUPLICATE KEY UPDATE avg_cost = VALUES(avg_cost)
        `, [productId, whId, costVal]);
      }
    } else {
      const whId = parseInt(warehouseId, 10);
      await conn.query(`
        INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
        VALUES (?, ?, 0, ?)
        ON DUPLICATE KEY UPDATE avg_cost = VALUES(avg_cost)
      `, [productId, whId, costVal]);
    }

    // 4. Update Variant Costs if option_id is provided
    if (optionId) {
      await conn.query('UPDATE aura_product_variants SET cost = ? WHERE id = ?', [costVal, optionId]);
    }
  }
}

module.exports = CostAdjustmentsModel;
