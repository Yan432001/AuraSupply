const db = require('../../config/dbPool');

function logError(method, err) {
  console.error(`[StockCountsModel.${method}] Error:`, err.message || err);
}

class StockCountsModel {
  /**
   * 1. List Stock Counts with filtering, searching, pagination, and KPI metrics
   */
  static async listStockCounts({
    search = '',
    warehouse_id = 'all',
    type = 'all',
    status = 'all',
    start_date,
    end_date,
    page = 1,
    limit = 15
  } = {}) {
    try {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
      const offset = (pageNum - 1) * pageSize;

      const conditions = ['1=1'];
      const params = [];

      if (warehouse_id && warehouse_id !== 'all' && warehouse_id !== '') {
        conditions.push('sc.warehouse_id = ?');
        params.push(parseInt(warehouse_id, 10));
      }

      if (type && type !== 'all' && type !== '') {
        conditions.push('sc.type = ?');
        params.push(type);
      }

      if (status !== 'all' && status !== '' && status !== undefined && status !== null) {
        if (status === 'draft' || status === '0') {
          conditions.push('(sc.status = 0 OR sc.finalized = 0 OR sc.status IS NULL)');
        } else if (status === 'completed' || status === '1') {
          conditions.push('(sc.status = 1 OR sc.finalized = 1)');
        }
      }

      if (start_date) {
        conditions.push('DATE(sc.date) >= ?');
        params.push(start_date);
      }
      if (end_date) {
        conditions.push('DATE(sc.date) <= ?');
        params.push(end_date);
      }

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        conditions.push(`(
          sc.reference_no LIKE ? OR 
          w.name LIKE ? OR 
          sc.category_names LIKE ? OR 
          sc.brand_names LIKE ? OR
          sc.note LIKE ?
        )`);
        params.push(term, term, term, term, term);
      }

      const whereClause = conditions.join(' AND ');

      // Total count query
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total 
         FROM aura_stock_counts sc
         LEFT JOIN aura_warehouses w ON w.id = sc.warehouse_id
         WHERE ${whereClause}`,
        params
      );
      const totalRecords = countRows[0]?.total || 0;

      // Summary KPIs query
      const [kpiRows] = await db.query(`
        SELECT 
          COUNT(sc.id) AS total_audits,
          SUM(CASE WHEN (sc.status = 0 OR sc.finalized = 0 OR sc.status IS NULL) THEN 1 ELSE 0 END) AS draft_audits,
          SUM(CASE WHEN (sc.status = 1 OR sc.finalized = 1) THEN 1 ELSE 0 END) AS completed_audits,
          COALESCE(SUM(sc.differences), 0) AS total_differences,
          COALESCE(SUM(sc.matches), 0) AS total_matches
        FROM aura_stock_counts sc
      `);

      // Main records query
      const queryParams = [...params, pageSize, offset];
      const [rows] = await db.query(
        `SELECT 
          sc.*,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          u.username AS creator_username,
          u.first_name AS creator_first_name,
          u.last_name AS creator_last_name,
          uu.username AS updater_username,
          adj.id AS linked_adjustment_id,
          adj.reference_no AS linked_adjustment_ref
         FROM aura_stock_counts sc
         LEFT JOIN aura_warehouses w ON w.id = sc.warehouse_id
         LEFT JOIN aura_users u ON u.id = sc.created_by
         LEFT JOIN aura_users uu ON uu.id = sc.updated_by
         LEFT JOIN aura_adjustments adj ON adj.count_id = sc.id
         WHERE ${whereClause}
         ORDER BY sc.date DESC, sc.id DESC
         LIMIT ? OFFSET ?`,
        queryParams
      );

      const records = rows.map((r) => {
        const isDraft = !r.finalized && r.status !== 1;
        return {
          id: r.id,
          date: r.date,
          reference_no: r.reference_no,
          warehouse_id: r.warehouse_id,
          warehouse_name: r.warehouse_name || 'All Warehouses',
          warehouse_code: r.warehouse_code || '',
          type: r.type || 'full',
          status: isDraft ? 'draft' : 'completed',
          status_code: isDraft ? 0 : 1,
          finalized: r.finalized ? 1 : 0,
          categories: r.categories,
          category_names: r.category_names || '',
          brands: r.brands,
          brand_names: r.brand_names || '',
          products_count: parseInt(r.products, 10) || 0,
          rows_count: parseInt(r.rows, 10) || 0,
          differences: parseInt(r.differences, 10) || 0,
          matches: parseInt(r.matches, 10) || 0,
          missing: parseInt(r.missing, 10) || 0,
          note: r.note || '',
          initial_file: r.initial_file,
          final_file: r.final_file,
          created_by: r.created_by,
          creator_name: r.creator_first_name ? `${r.creator_first_name} ${r.creator_last_name || ''}`.trim() : (r.creator_username || 'Admin'),
          updated_at: r.updated_at,
          linked_adjustment_id: r.linked_adjustment_id || null,
          linked_adjustment_ref: r.linked_adjustment_ref || null
        };
      });

      return {
        records,
        stats: {
          total_audits: kpiRows[0]?.total_audits || 0,
          draft_audits: kpiRows[0]?.draft_audits || 0,
          completed_audits: kpiRows[0]?.completed_audits || 0,
          total_differences: kpiRows[0]?.total_differences || 0,
          total_matches: kpiRows[0]?.total_matches || 0
        },
        pagination: {
          current_page: pageNum,
          limit: pageSize,
          total_records: totalRecords,
          total_pages: Math.ceil(totalRecords / pageSize)
        }
      };
    } catch (err) {
      logError('listStockCounts', err);
      throw err;
    }
  }

  /**
   * 2. Metadata Options: Warehouses, Categories, Brands, Sequence Reference
   */
  static async getMetadataOptions() {
    try {
      const [warehouses] = await db.query('SELECT id, code, name FROM aura_warehouses ORDER BY name ASC');
      const [categories] = await db.query(`
        SELECT c.id, c.code, c.name, COUNT(p.id) AS product_count 
        FROM aura_categories c
        LEFT JOIN aura_products p ON (p.category_id = c.id OR p.subcategory_id = c.id)
        GROUP BY c.id, c.code, c.name
        ORDER BY product_count DESC, c.name ASC
      `);
      const [brands] = await db.query(`
        SELECT b.id, b.code, b.name, COUNT(p.id) AS product_count 
        FROM aura_brands b
        LEFT JOIN aura_products p ON (p.brand = b.id OR p.brand_id = b.id)
        GROUP BY b.id, b.code, b.name
        ORDER BY product_count DESC, b.name ASC
      `);

      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      const [lastRef] = await db.query(`
        SELECT reference_no FROM aura_stock_counts 
        WHERE reference_no LIKE 'STC${yearSuffix}/%' OR reference_no LIKE 'STC-%'
        ORDER BY id DESC LIMIT 1
      `);

      let seq = 1;
      if (lastRef.length && lastRef[0].reference_no) {
        const parts = lastRef[0].reference_no.split(/[\/\-]/);
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
          seq = lastNum + 1;
        }
      }
      const nextReferenceNo = `STC${yearSuffix}/${String(seq).padStart(4, '0')}`;

      return {
        warehouses,
        categories,
        brands,
        nextReferenceNo,
        next_reference: nextReferenceNo
      };
    } catch (err) {
      logError('getMetadataOptions', err);
      throw err;
    }
  }

  /**
   * 3. Initiate New Stock Count (ACID Transaction)
   * Snapshots current warehouse stock quantities for all matching products and variants
   */
  static async createStockCount({
    date,
    reference_no,
    warehouse_id = 1,
    type = 'full', // 'full' | 'partial'
    categories = [],
    brands = [],
    note = '',
    user_id = 1
  }) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();

      const whId = parseInt(warehouse_id, 10);
      if (!whId) throw new Error('Warehouse selection is required.');

      const [whRows] = await conn.query('SELECT id, name, code FROM aura_warehouses WHERE id = ? LIMIT 1', [whId]);
      if (!whRows.length) throw new Error(`Warehouse #${whId} not found.`);
      const warehouse = whRows[0];

      // Generate Reference No if not provided
      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      let refNo = reference_no && reference_no.trim() ? reference_no.trim() : null;
      if (!refNo) {
        const [lastRef] = await conn.query(`
          SELECT reference_no FROM aura_stock_counts 
          WHERE reference_no LIKE 'STC${yearSuffix}/%' 
          ORDER BY id DESC LIMIT 1 FOR UPDATE
        `);
        let seq = 1;
        if (lastRef.length && lastRef[0].reference_no) {
          const parts = lastRef[0].reference_no.split('/');
          if (parts.length > 1 && !isNaN(parseInt(parts[1], 10))) {
            seq = parseInt(parts[1], 10) + 1;
          }
        }
        refNo = `STC${yearSuffix}/${String(seq).padStart(4, '0')}`;
      }

      // Resolve category names
      let categoryIdsStr = '';
      let categoryNamesStr = '';
      if (Array.isArray(categories) && categories.length > 0) {
        const catIds = categories.map((c) => parseInt(c, 10)).filter(Boolean);
        if (catIds.length > 0) {
          categoryIdsStr = catIds.join(',');
          const [catRows] = await conn.query(
            `SELECT id, name FROM aura_categories WHERE id IN (${catIds.map(() => '?').join(',')})`,
            catIds
          );
          categoryNamesStr = catRows.map((c) => c.name).join(', ');
        }
      }

      // Resolve brand names
      let brandIdsStr = '';
      let brandNamesStr = '';
      if (Array.isArray(brands) && brands.length > 0) {
        const brIds = brands.map((b) => parseInt(b, 10)).filter(Boolean);
        if (brIds.length > 0) {
          brandIdsStr = brIds.join(',');
          const [brRows] = await conn.query(
            `SELECT id, name FROM aura_brands WHERE id IN (${brIds.map(() => '?').join(',')})`,
            brIds
          );
          brandNamesStr = brRows.map((b) => b.name).join(', ');
        }
      }

      // Build product query based on type and filters
      const prodConditions = ["(p.type = 'standard' OR p.type IS NULL OR p.type = '')"];
      const prodParams = [whId];

      if (type === 'partial') {
        if (categoryIdsStr) {
          const catIds = categoryIdsStr.split(',').map(Number).filter(Boolean);
          if (catIds.length > 0) {
            prodConditions.push(`(p.category_id IN (${catIds.map(() => '?').join(',')}) OR p.subcategory_id IN (${catIds.map(() => '?').join(',')}))`);
            prodParams.push(...catIds, ...catIds);
          }
        }
        if (brandIdsStr) {
          const brIds = brandIdsStr.split(',').map(Number).filter(Boolean);
          if (brIds.length > 0) {
            prodConditions.push(`(p.brand IN (${brIds.map(() => '?').join(',')}) OR p.brand_id IN (${brIds.map(() => '?').join(',')}))`);
            prodParams.push(...brIds, ...brIds);
          }
        }
      }

      // Select products with live warehouse stock
      const [products] = await conn.query(
        `SELECT 
          p.id, p.code, p.name, p.cost, p.price, NULL AS expiry, p.unit,
          COALESCE(wp.quantity, p.quantity, 0) AS current_qoh
         FROM aura_products p
         LEFT JOIN aura_warehouses_products wp ON wp.product_id = p.id AND wp.warehouse_id = ?
         WHERE ${prodConditions.join(' AND ')}
         ORDER BY p.code ASC`,
        prodParams
      );

      if (!products.length) {
        throw new Error('No products found matching the selected warehouse and category/brand criteria. Please select a category or brand containing active inventory products, or run a Full Warehouse count.');
      }

      const countDate = date ? new Date(date) : new Date();
      const initialFileName = `${refNo.replace(/[^a-zA-Z0-9]/g, '_')}_initial.csv`;

      // Insert stock count header
      const [headerRes] = await conn.query(
        `INSERT INTO aura_stock_counts (
          date, reference_no, warehouse_id, type, initial_file, categories, category_names,
          brands, brand_names, note, products, \`rows\`, created_by, finalized, status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, 0
        )`,
        [
          countDate,
          refNo,
          whId,
          type,
          initialFileName,
          categoryIdsStr,
          categoryNamesStr,
          brandIdsStr,
          brandNamesStr,
          note || '',
          products.length,
          user_id || 1
        ]
      );

      const stockCountId = headerRes.insertId;

      // Build item lines, checking variants
      const itemValues = [];
      let totalRows = 0;

      for (const prod of products) {
        const [variants] = await conn.query(
          `SELECT id, name, sku, quantity 
           FROM aura_product_variants 
           WHERE product_id = ? 
           ORDER BY id ASC`,
          [prod.id]
        );

        if (variants.length > 0) {
          for (const v of variants) {
            itemValues.push([
              stockCountId,
              countDate,
              prod.id,
              prod.code,
              prod.name,
              v.name,
              v.id,
              parseFloat(v.quantity) || 0,
              null, // counted initially null
              parseFloat(prod.cost) || 0,
              0, // status
              prod.expiry || null
            ]);
            totalRows++;
          }
        } else {
          itemValues.push([
            stockCountId,
            countDate,
            prod.id,
            prod.code,
            prod.name,
            '',
            null,
            parseFloat(prod.current_qoh) || 0,
            null, // counted initially null
            parseFloat(prod.cost) || 0,
            0, // status
            prod.expiry || null
          ]);
          totalRows++;
        }
      }

      // Batch insert items in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < itemValues.length; i += chunkSize) {
        const chunk = itemValues.slice(i, i + chunkSize);
        await conn.query(
          `INSERT INTO aura_stock_count_items (
            stock_count_id, date_time, product_id, product_code, product_name,
            product_variant, product_variant_id, expected, counted, cost, status, expiry
          ) VALUES ?`,
          [chunk]
        );
      }

      // Update rows count
      await conn.query('UPDATE aura_stock_counts SET `rows` = ? WHERE id = ?', [totalRows, stockCountId]);

      await conn.commit();

      return {
        id: stockCountId,
        reference_no: refNo,
        warehouse_name: warehouse.name,
        type,
        products_count: products.length,
        rows_count: totalRows
      };
    } catch (err) {
      await conn.rollback();
      logError('createStockCount', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 4. Get Single Stock Count Details & Full Item Discrepancy Breakdown
   */
  static async getStockCountById(id) {
    try {
      const countId = parseInt(id, 10);
      const [countRows] = await db.query(
        `SELECT 
          sc.*,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          u.username AS creator_username,
          u.first_name AS creator_first_name,
          u.last_name AS creator_last_name,
          uu.username AS updater_username,
          adj.id AS linked_adjustment_id,
          adj.reference_no AS linked_adjustment_ref
         FROM aura_stock_counts sc
         LEFT JOIN aura_warehouses w ON w.id = sc.warehouse_id
         LEFT JOIN aura_users u ON u.id = sc.created_by
         LEFT JOIN aura_users uu ON uu.id = sc.updated_by
         LEFT JOIN aura_adjustments adj ON adj.count_id = sc.id
         WHERE sc.id = ? LIMIT 1`,
        [countId]
      );

      if (!countRows.length) return null;
      const count = countRows[0];

      // Fetch items
      const [items] = await db.query(
        `SELECT 
          sci.*,
          p.image AS product_image,
          p.barcode AS product_barcode,
          u.name AS unit_name
         FROM aura_stock_count_items sci
         LEFT JOIN aura_products p ON p.id = sci.product_id
         LEFT JOIN aura_units u ON u.id = p.unit
         WHERE sci.stock_count_id = ?
         ORDER BY sci.id ASC`,
        [countId]
      );

      let totalExpected = 0;
      let totalCounted = 0;
      let totalDifference = 0;
      let totalVarianceCost = 0;
      let matchesCount = 0;
      let overCount = 0;
      let shortageCount = 0;
      let uncountedCount = 0;

      const processedItems = items.map((it) => {
        const expected = parseFloat(it.expected) || 0;
        const counted = it.counted !== null && it.counted !== undefined ? parseFloat(it.counted) : null;
        const cost = parseFloat(it.cost) || 0;

        totalExpected += expected;

        let diff = 0;
        let diffCost = 0;
        let isCounted = counted !== null;

        if (isCounted) {
          totalCounted += counted;
          diff = counted - expected;
          diffCost = diff * cost;
          totalDifference += diff;
          totalVarianceCost += diffCost;

          if (diff === 0) matchesCount++;
          else if (diff > 0) overCount++;
          else shortageCount++;
        } else {
          uncountedCount++;
        }

        return {
          id: it.id,
          product_id: it.product_id,
          product_code: it.product_code,
          product_name: it.product_name,
          product_variant: it.product_variant || '',
          product_variant_id: it.product_variant_id,
          product_image: it.product_image || null,
          unit_name: it.unit_name || 'Pcs',
          expected,
          counted,
          difference: isCounted ? diff : null,
          cost,
          difference_cost: isCounted ? Math.round(diffCost * 100) / 100 : 0,
          is_counted: isCounted,
          expiry: it.expiry || null,
          date_time: it.date_time
        };
      });

      const isDraft = !count.finalized && count.status !== 1;

      return {
        id: count.id,
        date: count.date,
        reference_no: count.reference_no,
        warehouse_id: count.warehouse_id,
        warehouse_name: count.warehouse_name || 'All Warehouses',
        warehouse_code: count.warehouse_code || '',
        type: count.type || 'full',
        status: isDraft ? 'draft' : 'completed',
        status_code: isDraft ? 0 : 1,
        finalized: count.finalized ? 1 : 0,
        categories: count.categories,
        category_names: count.category_names || '',
        brands: count.brands,
        brand_names: count.brand_names || '',
        note: count.note || '',
        initial_file: count.initial_file,
        final_file: count.final_file,
        created_by: count.created_by,
        creator_name: count.creator_first_name ? `${count.creator_first_name} ${count.creator_last_name || ''}`.trim() : (count.creator_username || 'Admin'),
        updated_at: count.updated_at,
        linked_adjustment_id: count.linked_adjustment_id || null,
        linked_adjustment_ref: count.linked_adjustment_ref || null,
        items: processedItems,
        summary: {
          total_items: processedItems.length,
          total_expected: Math.round(totalExpected * 100) / 100,
          total_counted: Math.round(totalCounted * 100) / 100,
          total_difference: Math.round(totalDifference * 100) / 100,
          total_variance_cost: Math.round(totalVarianceCost * 100) / 100,
          matches_count: matchesCount,
          over_count: overCount,
          shortage_count: shortageCount,
          uncounted_count: uncountedCount
        }
      };
    } catch (err) {
      logError('getStockCountById', err);
      throw err;
    }
  }

  /**
   * 5. Update Stock Count Items (Live audit or bulk manual count update)
   */
  static async updateStockCountItems(id, { items = [], date, status, note, user_id = 1 }) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();
      const countId = parseInt(id, 10);

      const [countRows] = await conn.query('SELECT * FROM aura_stock_counts WHERE id = ? LIMIT 1 FOR UPDATE', [countId]);
      if (!countRows.length) throw new Error('Stock count audit record not found.');
      const currentCount = countRows[0];

      if (currentCount.finalized && currentCount.status === 1) {
        throw new Error('This stock count has already been finalized and cannot be modified.');
      }

      const updateTimestamp = date ? new Date(date) : new Date();

      if (Array.isArray(items) && items.length > 0) {
        for (const it of items) {
          const itemId = parseInt(it.id, 10);
          if (!itemId) continue;

          const countedVal = it.counted !== null && it.counted !== undefined && it.counted !== '' ? parseFloat(it.counted) : null;
          const expiryVal = it.expiry ? it.expiry : null;

          await conn.query(
            `UPDATE aura_stock_count_items 
             SET counted = ?, expiry = COALESCE(?, expiry), date_time = ?
             WHERE id = ? AND stock_count_id = ?`,
            [countedVal, expiryVal, updateTimestamp, itemId, countId]
          );
        }
      }

      // Recalculate statistics (differences, matches, missing)
      const [allCountItems] = await conn.query(
        'SELECT expected, counted FROM aura_stock_count_items WHERE stock_count_id = ?',
        [countId]
      );

      let matches = 0;
      let differences = 0;
      let missing = 0;

      for (const row of allCountItems) {
        if (row.counted === null || row.counted === undefined) {
          missing++;
        } else if (parseFloat(row.counted) === parseFloat(row.expected)) {
          matches++;
        } else {
          differences++;
        }
      }

      const shouldFinalize = (status === 1 || status === 'completed');
      await conn.query(
        `UPDATE aura_stock_counts 
         SET matches = ?, differences = ?, missing = ?, 
             finalized = ?, status = ?, updated_at = NOW(), updated_by = ?,
             note = COALESCE(?, note)
         WHERE id = ?`,
        [
          matches,
          differences,
          missing,
          shouldFinalize ? 1 : 0,
          shouldFinalize ? 1 : 0,
          user_id || 1,
          note || null,
          countId
        ]
      );

      await conn.commit();
      return { success: true, count_id: countId, matches, differences, missing, finalized: shouldFinalize };
    } catch (err) {
      await conn.rollback();
      logError('updateStockCountItems', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 6. Live Barcode Scan Count Entry (Matching AURA_v1 scan_count)
   */
  static async scanBarcodeItem(id, { barcode, quantity_delta = 1, set_quantity = null }) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();
      const countId = parseInt(id, 10);
      const codeTerm = barcode ? barcode.trim() : '';

      if (!codeTerm) throw new Error('Valid barcode or product SKU is required.');

      const [countRows] = await conn.query('SELECT * FROM aura_stock_counts WHERE id = ? LIMIT 1', [countId]);
      if (!countRows.length) throw new Error('Stock count record not found.');
      if (countRows[0].finalized) throw new Error('Cannot scan into a finalized stock count.');

      // Find item in this count matching code or variant SKU or barcode
      const [itemRows] = await conn.query(
        `SELECT sci.* 
         FROM aura_stock_count_items sci
         LEFT JOIN aura_products p ON p.id = sci.product_id
         WHERE sci.stock_count_id = ? AND (
           sci.product_code = ? OR 
           p.barcode = ? OR 
           p.code = ? OR
           sci.product_name = ?
         )
         LIMIT 1`,
        [countId, codeTerm, codeTerm, codeTerm, codeTerm]
      );

      if (!itemRows.length) {
        throw new Error(`Product with barcode "${codeTerm}" not found in this stock count audit.`);
      }

      const targetItem = itemRows[0];
      let newCounted = 0;

      if (set_quantity !== null && set_quantity !== undefined) {
        newCounted = Math.max(0, parseFloat(set_quantity) || 0);
      } else {
        const curCounted = targetItem.counted !== null ? parseFloat(targetItem.counted) : 0;
        newCounted = curCounted + (parseFloat(quantity_delta) || 1);
      }

      await conn.query(
        `UPDATE aura_stock_count_items 
         SET counted = ?, date_time = NOW() 
         WHERE id = ?`,
        [newCounted, targetItem.id]
      );

      await conn.commit();

      const expected = parseFloat(targetItem.expected) || 0;
      return {
        item_id: targetItem.id,
        product_id: targetItem.product_id,
        product_code: targetItem.product_code,
        product_name: targetItem.product_name,
        expected,
        counted: newCounted,
        difference: newCounted - expected
      };
    } catch (err) {
      await conn.rollback();
      logError('scanBarcodeItem', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 7. Finalize Stock Count (Matching AURA_v1 finalize_count)
   */
  static async finalizeStockCount(id, { note = '', user_id = 1 }) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();
      const countId = parseInt(id, 10);

      const [countRows] = await conn.query('SELECT * FROM aura_stock_counts WHERE id = ? LIMIT 1 FOR UPDATE', [countId]);
      if (!countRows.length) throw new Error('Stock count not found.');
      const current = countRows[0];

      if (current.finalized) {
        throw new Error('This stock count has already been finalized.');
      }

      // Calculate matches, differences, missing
      const [items] = await conn.query(
        'SELECT expected, counted FROM aura_stock_count_items WHERE stock_count_id = ?',
        [countId]
      );

      let matches = 0;
      let differences = 0;
      let missing = 0;

      for (const it of items) {
        if (it.counted === null || it.counted === undefined) {
          missing++;
        } else if (parseFloat(it.counted) === parseFloat(it.expected)) {
          matches++;
        } else {
          differences++;
        }
      }

      await conn.query(
        `UPDATE aura_stock_counts 
         SET finalized = 1, status = 1, updated_at = NOW(), updated_by = ?,
             matches = ?, differences = ?, missing = ?,
             note = CASE WHEN ? != '' THEN ? ELSE note END
         WHERE id = ?`,
        [user_id || 1, matches, differences, missing, note, note, countId]
      );

      await conn.commit();
      return { success: true, count_id: countId, matches, differences, missing };
    } catch (err) {
      await conn.rollback();
      logError('finalizeStockCount', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 8. Convert Stock Count Discrepancies into an Official Inventory Adjustment
   * Matching AURA_v1 add_adjustment($count_id)
   */
  static async convertCountToAdjustment(id, { user_id = 1, biller_id = null, note = '' }) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();
      const countId = parseInt(id, 10);

      // Check if adjustment already exists for this count_id
      const [existingAdj] = await conn.query(
        'SELECT id, reference_no FROM aura_adjustments WHERE count_id = ? LIMIT 1',
        [countId]
      );
      if (existingAdj.length > 0) {
        await conn.rollback();
        return {
          already_adjusted: true,
          adjustment_id: existingAdj[0].id,
          reference_no: existingAdj[0].reference_no,
          message: `Inventory adjustment #${existingAdj[0].reference_no} already exists for this stock count.`
        };
      }

      const [countRows] = await conn.query('SELECT * FROM aura_stock_counts WHERE id = ? LIMIT 1', [countId]);
      if (!countRows.length) throw new Error('Stock count not found.');
      const stockCount = countRows[0];

      // Pull all discrepant items
      const [diffItems] = await conn.query(
        `SELECT * FROM aura_stock_count_items 
         WHERE stock_count_id = ? AND counted IS NOT NULL AND counted != expected`,
        [countId]
      );

      if (!diffItems.length) {
        await conn.rollback();
        return {
          no_differences: true,
          message: 'No stock differences found in this count. Inventory matches system records exactly.'
        };
      }

      // Generate adjustment reference
      const yearSuffix = new Date().getFullYear().toString().slice(-2);
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
      const refNo = `Adj${yearSuffix}/${String(seq).padStart(4, '0')}`;

      const adjNote = note || `Auto-generated from Stock Count #${stockCount.reference_no} (${stockCount.type})`;

      // Create adjustment header with count_id
      const [adjRes] = await conn.query(
        `INSERT INTO aura_adjustments (
          date, reference_no, warehouse_id, biller_id, note, created_by, status, count_id
        ) VALUES (
          NOW(), ?, ?, ?, ?, ?, 'completed', ?
        )`,
        [refNo, stockCount.warehouse_id, biller_id || 1, adjNote, user_id || 1, countId]
      );

      const adjustmentId = adjRes.insertId;

      // Process each discrepancy into an adjustment line item
      for (const item of diffItems) {
        const expected = parseFloat(item.expected) || 0;
        const counted = parseFloat(item.counted) || 0;
        const diff = counted - expected;
        const type = diff > 0 ? 'addition' : 'subtraction';
        const adjustQty = Math.abs(diff);

        // Insert adjustment item
        await conn.query(
          `INSERT INTO aura_adjustment_items (
            adjustment_id, product_id, option_id, quantity, type, real_unit_cost, warehouse_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            adjustmentId,
            item.product_id,
            item.product_variant_id || null,
            adjustQty,
            type,
            item.cost || 0,
            stockCount.warehouse_id
          ]
        );

        // Update warehouse product stock
        const delta = type === 'addition' ? adjustQty : -adjustQty;
        await conn.query(
          `UPDATE aura_warehouses_products 
           SET quantity = quantity + ? 
           WHERE product_id = ? AND warehouse_id = ?`,
          [delta, item.product_id, stockCount.warehouse_id]
        );

        // Update master product total quantity
        await conn.query(
          `UPDATE aura_products 
           SET quantity = quantity + ? 
           WHERE id = ?`,
          [delta, item.product_id]
        );

        // If variant, update variant quantity
        if (item.product_variant_id) {
          await conn.query(
            `UPDATE aura_product_variants 
             SET quantity = quantity + ? 
             WHERE id = ?`,
            [delta, item.product_variant_id]
          );
        }

        // Record stock movement audit entry
        await conn.query(
          `INSERT INTO aura_stock_movement (
            date, reference_no, transaction, transaction_id, warehouse_id, product_id,
            product_type, product_code, product_name, real_unit_cost, quantity, unit_quantity,
            weight, option_id, user_id, serial_no, expiry, actual_date
          ) VALUES (
            NOW(), ?, 'QuantityAdjustment', ?, ?, ?,
            'standard', ?, ?, ?, ?, 1,
            0, ?, ?, NULL, ?, NOW()
          )`,
          [
            refNo,
            adjustmentId,
            stockCount.warehouse_id,
            item.product_id,
            item.product_code,
            item.product_name,
            item.cost || 0,
            delta,
            item.product_variant_id || null,
            user_id || 1,
            item.expiry || null
          ]
        );
      }

      // Mark stock count as finalized if not yet
      await conn.query(
        'UPDATE aura_stock_counts SET finalized = 1, status = 1, updated_at = NOW(), updated_by = ? WHERE id = ?',
        [user_id || 1, countId]
      );

      await conn.commit();

      return {
        success: true,
        adjustment_id: adjustmentId,
        reference_no: refNo,
        items_adjusted_count: diffItems.length,
        message: `Inventory adjustment #${refNo} created successfully with ${diffItems.length} reconciled items.`
      };
    } catch (err) {
      await conn.rollback();
      logError('convertCountToAdjustment', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 9. Delete Stock Count
   */
  static async deleteStockCount(id) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();
      const countId = parseInt(id, 10);

      // Check if linked to an active adjustment
      const [adj] = await conn.query('SELECT id, reference_no FROM aura_adjustments WHERE count_id = ? LIMIT 1', [countId]);
      if (adj.length > 0) {
        throw new Error(`Cannot delete stock count. It is linked to Inventory Adjustment #${adj[0].reference_no}. Delete the adjustment first.`);
      }

      await conn.query('DELETE FROM aura_stock_count_items WHERE stock_count_id = ?', [countId]);
      await conn.query('DELETE FROM aura_stock_counts WHERE id = ?', [countId]);

      await conn.commit();
      return { success: true, count_id: countId };
    } catch (err) {
      await conn.rollback();
      logError('deleteStockCount', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 10. Export Stock Count CSV Worksheet (Matching AURA_v1 initial_file download)
   */
  static async exportStockCountCSV(id) {
    try {
      const count = await this.getStockCountById(id);
      if (!count) throw new Error(`Stock count #${id} not found.`);

      const headers = ['product_code', 'product_name', 'variant', 'expected', 'counted', 'expiry'];
      const csvLines = [headers.join(',')];

      for (const it of count.items) {
        const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        const code = escapeCsv(it.product_code);
        const name = escapeCsv(it.product_name);
        const variant = escapeCsv(it.product_variant || '');
        const expected = it.expected ?? 0;
        const counted = it.counted !== null && it.counted !== undefined ? it.counted : '';
        const expiry = it.expiry ? String(it.expiry).slice(0, 10) : '';

        csvLines.push([code, name, variant, expected, counted, expiry].join(','));
      }

      const safeRef = (count.reference_no || `STC-${count.id}`).replace(/[\/\\]/g, '_');
      const filename = `stock_count_${safeRef}.csv`;

      return {
        reference_no: count.reference_no,
        filename,
        content: '\uFEFF' + csvLines.join('\r\n'),
        items_count: count.items.length
      };
    } catch (err) {
      logError('exportStockCountCSV', err);
      throw err;
    }
  }

  /**
   * 11. Import Counted CSV Worksheet (Matching AURA_v1 finalize_count CSV upload)
   */
  static async importStockCountCSV(id, { rows = [], csv_text = '', finalize = false, user_id = 1 }) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();
      const countId = parseInt(id, 10);

      const [countRows] = await conn.query('SELECT * FROM aura_stock_counts WHERE id = ? LIMIT 1 FOR UPDATE', [countId]);
      if (!countRows.length) throw new Error(`Stock count #${id} not found.`);
      const current = countRows[0];

      if (current.finalized) {
        throw new Error('This stock count has already been finalized and cannot be modified.');
      }

      let parsedRows = rows;
      if (!parsedRows.length && csv_text && typeof csv_text === 'string') {
        const lines = csv_text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length > 1) {
          const parseCsvLine = (text) => {
            const result = [];
            let cur = '';
            let inQuotes = false;
            for (let i = 0; i < text.length; i++) {
              const c = text[i];
              if (c === '"') {
                if (inQuotes && text[i + 1] === '"') {
                  cur += '"';
                  i++;
                } else {
                  inQuotes = !inQuotes;
                }
              } else if (c === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
              } else {
                cur += c;
              }
            }
            result.push(cur.trim());
            return result;
          };

          const headerParts = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());
          const codeIdx = headerParts.findIndex((h) => h.includes('code') || h === 'product_code');
          const countedIdx = headerParts.findIndex((h) => h.includes('count') || h === 'counted');
          const expiryIdx = headerParts.findIndex((h) => h.includes('expir') || h === 'expiry');
          const variantIdx = headerParts.findIndex((h) => h.includes('variant') || h === 'product_variant');

          if (codeIdx !== -1 && countedIdx !== -1) {
            for (let i = 1; i < lines.length; i++) {
              const rowParts = parseCsvLine(lines[i]);
              const clean = (val) => String(val || '').replace(/^"|"$/g, '').trim();

              const code = clean(rowParts[codeIdx]);
              const counted = clean(rowParts[countedIdx]);
              const expiry = expiryIdx !== -1 ? clean(rowParts[expiryIdx]) : null;
              const variant = variantIdx !== -1 ? clean(rowParts[variantIdx]) : '';

              if (code) {
                parsedRows.push({
                  product_code: code,
                  counted: counted !== '' && !isNaN(parseFloat(counted)) ? parseFloat(counted) : null,
                  expiry: expiry || null,
                  variant
                });
              }
            }
          }
        }
      }

      if (!parsedRows.length) {
        throw new Error('No valid product count records detected in uploaded CSV.');
      }

      let updatedCount = 0;
      for (const pr of parsedRows) {
        if (!pr.product_code) continue;

        const countedVal = pr.counted !== null && pr.counted !== undefined && pr.counted !== '' ? parseFloat(pr.counted) : null;
        const expiryVal = pr.expiry ? String(pr.expiry).slice(0, 10) : null;

        let query = `UPDATE aura_stock_count_items 
                     SET counted = ?, date_time = NOW()`;
        const params = [countedVal];

        if (expiryVal) {
          query += ', expiry = ?';
          params.push(expiryVal);
        }

        query += ' WHERE stock_count_id = ? AND product_code = ?';
        params.push(countId, String(pr.product_code).trim());

        if (pr.variant && pr.variant.trim()) {
          query += ' AND product_variant = ?';
          params.push(String(pr.variant).trim());
        }

        const [res] = await conn.query(query, params);
        if (res.affectedRows > 0) updatedCount++;
      }

      // Recalculate statistics
      const [allItems] = await conn.query('SELECT expected, counted FROM aura_stock_count_items WHERE stock_count_id = ?', [countId]);
      let matches = 0;
      let differences = 0;
      let missing = 0;

      for (const it of allItems) {
        if (it.counted === null || it.counted === undefined) {
          missing++;
        } else if (parseFloat(it.counted) === parseFloat(it.expected)) {
          matches++;
        } else {
          differences++;
        }
      }

      const shouldFinalize = Boolean(finalize);
      await conn.query(
        `UPDATE aura_stock_counts 
         SET matches = ?, differences = ?, missing = ?, 
             finalized = ?, status = ?, updated_at = NOW(), updated_by = ?
         WHERE id = ?`,
        [matches, differences, missing, shouldFinalize ? 1 : 0, shouldFinalize ? 1 : 0, user_id || 1, countId]
      );

      await conn.commit();
      return {
        success: true,
        count_id: countId,
        updated_items: updatedCount,
        matches,
        differences,
        missing,
        finalized: shouldFinalize
      };
    } catch (err) {
      await conn.rollback();
      logError('importStockCountCSV', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 12. Autocomplete Suggestions for Scanning & Counting (Matching AURA_v1 product_count_suggestions)
   */
  static async getProductSuggestions(id, search = '') {
    try {
      const countId = parseInt(id, 10);
      const term = `%${String(search || '').trim()}%`;

      const [rows] = await db.query(
        `SELECT 
          sci.id,
          sci.product_id,
          sci.product_code,
          sci.product_name,
          sci.product_variant,
          sci.product_variant_id,
          sci.expected,
          sci.counted,
          sci.cost,
          p.barcode,
          p.image AS product_image,
          u.name AS unit_name
         FROM aura_stock_count_items sci
         LEFT JOIN aura_products p ON p.id = sci.product_id
         LEFT JOIN aura_units u ON u.id = p.unit
         WHERE sci.stock_count_id = ? AND (
           sci.product_code LIKE ? OR 
           sci.product_name LIKE ? OR 
           p.barcode LIKE ? OR 
           sci.product_variant LIKE ?
         )
         ORDER BY sci.product_code ASC
         LIMIT 20`,
        [countId, term, term, term, term]
      );

      return rows.map((r) => ({
        id: r.id,
        product_id: r.product_id,
        product_code: r.product_code,
        product_name: r.product_name,
        product_variant: r.product_variant || '',
        product_variant_id: r.product_variant_id,
        barcode: r.barcode || '',
        product_image: r.product_image || null,
        unit_name: r.unit_name || 'Pcs',
        expected: parseFloat(r.expected) || 0,
        counted: r.counted !== null ? parseFloat(r.counted) : null,
        cost: parseFloat(r.cost) || 0,
        label: `${r.product_name} (${r.product_code}${r.product_variant ? ' - ' + r.product_variant : ''})`
      }));
    } catch (err) {
      logError('getProductSuggestions', err);
      throw err;
    }
  }
}

module.exports = StockCountsModel;
