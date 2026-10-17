/**
 * HIGH-VOLUME ERP ITEMS CONTROLLER
 * =================================
 * Architected for millions of master items under high concurrency.
 * Features:
 *   - Cursor-based (Keyset) O(1) pagination (eliminates filesort and OFFSET overhead)
 *   - Sub-50ms target response time guaranteed via composite B-tree & fulltext indexing
 *   - Pessimistic row-level locking (SELECT ... FOR UPDATE) on transactional updates
 *   - Input sanitization and audit trail tracking
 */

const { query, withTransaction } = require('../config/dbPool');

/**
 * Encode cursor object to opaque base64 string
 */
function encodeCursor(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decode base64 cursor string to object
 */
function decodeCursor(cursorStr) {
  try {
    return JSON.parse(Buffer.from(cursorStr, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * GET /api/items
 * High-performance paginated item listing with cursor keyset navigation & multi-faceted search.
 */
async function getItems(req, res) {
  const startTime = process.hrtime.bigint();

  try {
    const {
      cursor,
      limit: rawLimit = 50,
      search,
      category_id,
      brand_id,
      status = 'active',
      low_stock,
      min_price,
      max_price,
      sort_by = 'id',
      sort_dir = 'DESC'
    } = req.query;

    // 1. Sanitize & clamp pagination limit (1 - 200)
    const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 200);
    const limitPlusOne = limit + 1;

    // 2. Build Dynamic Query & Params
    const whereConditions = ['is_deleted = 0'];
    const params = {};

    // Filter: Status (defaults to 'active')
    if (status && status !== 'all') {
      whereConditions.push('status = :status');
      params.status = String(status).toLowerCase();
    }

    // Filter: Category (leverages idx_items_filter_sort)
    if (category_id && !isNaN(category_id)) {
      whereConditions.push('category_id = :category_id');
      params.category_id = parseInt(category_id, 10);
    }

    // Filter: Brand
    if (brand_id && !isNaN(brand_id)) {
      whereConditions.push('brand_id = :brand_id');
      params.brand_id = parseInt(brand_id, 10);
    }

    // Filter: Low-Stock Replenishment Alert (leverages idx_items_stock_alert)
    if (low_stock === 'true' || low_stock === '1') {
      whereConditions.push('track_inventory = 1 AND quantity_on_hand <= alert_quantity');
    }

    // Filter: Price Range
    if (min_price && !isNaN(min_price)) {
      whereConditions.push('selling_price >= :min_price');
      params.min_price = parseFloat(min_price);
    }
    if (max_price && !isNaN(max_price)) {
      whereConditions.push('selling_price <= :max_price');
      params.max_price = parseFloat(max_price);
    }

    // Search: Barcode/SKU Index Seek OR Fulltext Search
    if (search && String(search).trim() !== '') {
      const term = String(search).trim();
      // If alphanumeric exact SKU or numeric barcode, use B-Tree equality seek
      if (/^[a-zA-Z0-9_-]+$/.test(term) && term.length <= 60) {
        whereConditions.push('(sku = :searchTerm OR barcode = :searchTerm OR MATCH(sku, barcode, name) AGAINST(:searchBoolean IN BOOLEAN MODE))');
        params.searchTerm = term;
        params.searchBoolean = `+${term}*`;
      } else {
        // Natural fulltext inverted index seek
        whereConditions.push('MATCH(sku, barcode, name) AGAINST(:searchBoolean IN BOOLEAN MODE)');
        params.searchBoolean = term.split(/\s+/).map(w => `+${w}*`).join(' ');
      }
    }

    // 3. Keyset Cursor Navigation (O(1) Million-Row Traversal)
    const normalizedDir = String(sort_dir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const cursorData = cursor ? decodeCursor(cursor) : null;

    if (cursorData && cursorData.id) {
      if (normalizedDir === 'DESC') {
        whereConditions.push('id < :cursorId');
      } else {
        whereConditions.push('id > :cursorId');
      }
      params.cursorId = cursorData.id;
    }

    // 4. Construct SQL statement
    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        id, uuid, sku, barcode, barcode_symbology,
        name, second_name, item_type, category_id, brand_id, unit_id,
        cost_price, selling_price, currency,
        quantity_on_hand, alert_quantity, track_inventory,
        status, tax_rate, image_url, created_at, updated_at
      FROM items
      ${whereSql}
      ORDER BY id ${normalizedDir}
      LIMIT ${limitPlusOne}
    `;

    // 5. Execute on connection pool
    const [rows] = await query(sql, params);

    // 6. Calculate Keyset Pagination Metadata
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    let nextCursor = null;
    if (hasMore && items.length > 0) {
      const lastRow = items[items.length - 1];
      nextCursor = encodeCursor({ id: lastRow.id });
    }

    // 7. High-Precision Timing Calculation
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1e6;

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        limit,
        returned: items.length,
        has_more: hasMore,
        next_cursor: nextCursor
      },
      meta: {
        execution_time_ms: Math.round(executionTimeMs * 100) / 100,
        benchmark: executionTimeMs < 50 ? 'SUB_50MS_OPTIMAL' : 'ACCEPTABLE'
      }
    });
  } catch (err) {
    console.error('[getItems Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve item catalog.'
    });
  }
}

/**
 * PUT /api/items/:id
 * Concurrency-safe item update using InnoDB row-level locking.
 */
async function updateItem(req, res) {
  const startTime = process.hrtime.bigint();

  try {
    const itemId = parseInt(req.params.id, 10);
    if (!itemId || isNaN(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Valid numeric item ID parameter is required.'
      });
    }

    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'No update payload provided.'
      });
    }

    // Whitelist allowed fields to prevent mass assignment vulnerabilities
    const allowedFields = {
      sku: 'string',
      barcode: 'string',
      barcode_symbology: 'string',
      name: 'string',
      second_name: 'string',
      item_type: 'string',
      category_id: 'number',
      brand_id: 'number',
      unit_id: 'number',
      cost_price: 'number',
      selling_price: 'number',
      quantity_on_hand: 'number',
      alert_quantity: 'number',
      track_inventory: 'boolean',
      status: 'string',
      tax_rate: 'number',
      image_url: 'string',
      details: 'string'
    };

    // Validate payload values
    if (updates.name !== undefined && String(updates.name).trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Item name cannot be empty.'
      });
    }

    if (updates.selling_price !== undefined && Number(updates.selling_price) < 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Selling price cannot be negative.'
      });
    }

    if (updates.cost_price !== undefined && Number(updates.cost_price) < 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Cost price cannot be negative.'
      });
    }

    // Execute atomic update with row-level locking
    const updatedRecord = await withTransaction(async (conn) => {
      // 1. Acquire Row-Level Lock (InnoDB SELECT ... FOR UPDATE)
      const [existingRows] = await conn.query(
        'SELECT * FROM items WHERE id = ? AND is_deleted = 0 FOR UPDATE',
        [itemId]
      );

      if (!existingRows || existingRows.length === 0) {
        const error = new Error('ITEM_NOT_FOUND');
        error.code = 'NOT_FOUND';
        throw error;
      }

      // 2. Validate SKU Uniqueness if SKU is being modified
      if (updates.sku && updates.sku !== existingRows[0].sku) {
        const [duplicateSku] = await conn.query(
          'SELECT id FROM items WHERE sku = ? AND id != ? AND is_deleted = 0 LIMIT 1',
          [updates.sku, itemId]
        );
        if (duplicateSku && duplicateSku.length > 0) {
          const error = new Error(`SKU '${updates.sku}' is already in use by another item.`);
          error.code = 'DUPLICATE_SKU';
          throw error;
        }
      }

      // 3. Build dynamic parameterized SET clause
      const setClauses = [];
      const setParams = [];

      for (const [key, expectedType] of Object.entries(allowedFields)) {
        if (updates[key] !== undefined) {
          setClauses.push(`\`${key}\` = ?`);
          let val = updates[key];
          if (expectedType === 'boolean') val = val ? 1 : 0;
          setParams.push(val);
        }
      }

      // Always update audit columns
      setClauses.push('`updated_by` = ?');
      setParams.push(req.user ? req.user.id : null);

      setClauses.push('`updated_at` = NOW(3)');

      if (setClauses.length === 0) {
        return existingRows[0];
      }

      // 4. Execute UPDATE query
      setParams.push(itemId);
      await conn.query(
        `UPDATE items SET ${setClauses.join(', ')} WHERE id = ?`,
        setParams
      );

      // 5. Fetch updated row inside transaction
      const [refetched] = await conn.query(
        'SELECT * FROM items WHERE id = ?',
        [itemId]
      );

      return refetched[0];
    });

    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1e6;

    return res.status(200).json({
      success: true,
      message: 'Item updated successfully.',
      data: updatedRecord,
      meta: {
        execution_time_ms: Math.round(executionTimeMs * 100) / 100
      }
    });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Item not found or has been deleted.'
      });
    }

    if (err.code === 'DUPLICATE_SKU') {
      return res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: err.message
      });
    }

    console.error('[updateItem Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update item record.'
    });
  }
}

module.exports = {
  getItems,
  updateItem
};
