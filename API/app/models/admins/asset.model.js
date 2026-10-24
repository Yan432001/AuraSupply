const pool = require('../../config/utill/connection');

class AssetModel {
  /**
   * Helper to format decimal numbers to 2 decimal places
   */
  static formatDecimal(val) {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
  }

  // =========================================================================
  // 1. DASHBOARD METRICS & OVERVIEW
  // =========================================================================

  static async getDashboardMetrics() {
    // 1. Counts and financial totals
    const [totals] = await pool.query(`
      SELECT 
        COUNT(*) as total_assets,
        SUM(CASE WHEN status != 'disposed' THEN 1 ELSE 0 END) as active_assets,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_assets,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned_assets,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_assets,
        SUM(CASE WHEN status = 'disposed' THEN 1 ELSE 0 END) as disposed_assets,
        SUM(CASE WHEN status != 'disposed' THEN purchase_cost ELSE 0 END) as total_acquisition_cost,
        SUM(CASE WHEN status != 'disposed' THEN current_value ELSE 0 END) as total_current_value,
        SUM(CASE WHEN status != 'disposed' THEN accumulated_depreciation ELSE 0 END) as total_depreciation
      FROM aura_assets
    `);

    // 2. By Category
    const [byCategory] = await pool.query(`
      SELECT 
        COALESCE(c.name, 'Unassigned') as category_name,
        COUNT(a.id) as count,
        SUM(a.purchase_cost) as total_cost,
        SUM(a.current_value) as total_value
      FROM aura_assets a
      LEFT JOIN aura_asset_categories c ON c.id = a.category_id
      WHERE a.status != 'disposed'
      GROUP BY a.category_id, c.name
      ORDER BY count DESC
    `);

    // 3. By Location
    const [byLocation] = await pool.query(`
      SELECT 
        COALESCE(location_name, 'Unknown Location') as location_name,
        COUNT(*) as count,
        SUM(current_value) as total_value
      FROM aura_assets
      WHERE status != 'disposed'
      GROUP BY location_name
      ORDER BY count DESC
      LIMIT 10
    `);

    // 4. By Department
    const [byDepartment] = await pool.query(`
      SELECT 
        COALESCE(department_name, 'General') as department_name,
        COUNT(*) as count,
        SUM(current_value) as total_value
      FROM aura_assets
      WHERE status != 'disposed'
      GROUP BY department_name
      ORDER BY count DESC
      LIMIT 10
    `);

    // 5. Upcoming Maintenance (Next 45 days or overdue)
    const [upcomingMaintenance] = await pool.query(`
      SELECT 
        m.id,
        m.reference_no,
        m.title,
        m.maintenance_type,
        m.priority,
        m.scheduled_date,
        m.cost,
        m.status,
        a.asset_code,
        a.name as asset_name,
        a.location_name
      FROM aura_asset_maintenances m
      JOIN aura_assets a ON a.id = m.asset_id
      WHERE m.status IN ('pending', 'in_progress')
      ORDER BY m.scheduled_date ASC
      LIMIT 8
    `);

    // 6. Expiring Warranties (In next 60 days or active)
    const [expiringWarranties] = await pool.query(`
      SELECT 
        id,
        asset_code,
        name,
        brand,
        model,
        warranty_start,
        warranty_end,
        DATEDIFF(warranty_end, CURDATE()) as days_remaining,
        location_name,
        assigned_to
      FROM aura_assets
      WHERE warranty_end IS NOT NULL 
        AND warranty_end >= CURDATE()
        AND warranty_end <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
        AND status != 'disposed'
      ORDER BY warranty_end ASC
      LIMIT 8
    `);

    // 7. Recent Activities (Union of recent assignments, transfers, and disposals)
    const [recentActivities] = await pool.query(`
      (SELECT 
        'assignment' as activity_type,
        asn.id,
        CONCAT('Assigned to ', asn.employee_name) as description,
        asn.assigned_date as activity_date,
        a.asset_code,
        a.name as asset_name
      FROM aura_asset_assignments asn
      JOIN aura_assets a ON a.id = asn.asset_id
      ORDER BY asn.id DESC LIMIT 4)
      UNION ALL
      (SELECT 
        'transfer' as activity_type,
        trf.id,
        CONCAT('Transferred: ', trf.from_location, ' -> ', trf.to_location) as description,
        trf.transfer_date as activity_date,
        a.asset_code,
        a.name as asset_name
      FROM aura_asset_transfers trf
      JOIN aura_assets a ON a.id = trf.asset_id
      ORDER BY trf.id DESC LIMIT 4)
      UNION ALL
      (SELECT 
        'maintenance' as activity_type,
        mnt.id,
        CONCAT(mnt.maintenance_type, ' - ', mnt.title) as description,
        mnt.scheduled_date as activity_date,
        a.asset_code,
        a.name as asset_name
      FROM aura_asset_maintenances mnt
      JOIN aura_assets a ON a.id = mnt.asset_id
      ORDER BY mnt.id DESC LIMIT 4)
      ORDER BY activity_date DESC
      LIMIT 10
    `);

    return {
      summary: totals[0] || {
        total_assets: 0,
        active_assets: 0,
        available_assets: 0,
        assigned_assets: 0,
        maintenance_assets: 0,
        disposed_assets: 0,
        total_acquisition_cost: 0,
        total_current_value: 0,
        total_depreciation: 0
      },
      byCategory,
      byLocation,
      byDepartment,
      upcomingMaintenance,
      expiringWarranties,
      recentActivities
    };
  }

  // =========================================================================
  // 2. ASSET REGISTER (CRUD)
  // =========================================================================

  static async getNextAssetCode() {
    const year = new Date().getFullYear();
    const prefix = `AST-${year}-`;
    const [rows] = await pool.query(
      `SELECT asset_code FROM aura_assets WHERE asset_code LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    if (rows.length === 0) {
      return `${prefix}0001`;
    }

    const lastCode = rows[0].asset_code;
    const parts = lastCode.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  static async getAssets({ search, category_id, status, condition, location, department, sortBy = 'id', sortOrder = 'DESC', page = 1, limit = 50 }) {
    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ` AND (
        a.asset_code LIKE ? OR 
        a.name LIKE ? OR 
        a.serial_number LIKE ? OR 
        a.barcode LIKE ? OR 
        a.brand LIKE ? OR 
        a.model LIKE ? OR 
        a.assigned_to LIKE ?
      )`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s, s);
    }

    if (category_id) {
      whereClause += ' AND a.category_id = ?';
      params.push(parseInt(category_id, 10));
    }

    if (status && status !== 'all') {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }

    if (condition && condition !== 'all') {
      whereClause += ' AND a.`condition` = ?';
      params.push(condition);
    }

    if (location && location !== 'all') {
      whereClause += ' AND a.location_name = ?';
      params.push(location);
    }

    if (department && department !== 'all') {
      whereClause += ' AND a.department_name = ?';
      params.push(department);
    }

    // Count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM aura_assets a WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Allowed sort columns
    const allowedSort = ['id', 'asset_code', 'name', 'purchase_date', 'purchase_cost', 'current_value', 'status', 'created_at'];
    const safeSortBy = allowedSort.includes(sortBy) ? `a.${sortBy}` : 'a.id';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const safeLimit = Math.max(1, parseInt(limit, 10));

    const [records] = await pool.query(
      `SELECT 
        a.*,
        c.name as category_name,
        c.code as category_code
       FROM aura_assets a
       LEFT JOIN aura_asset_categories c ON c.id = a.category_id
       WHERE ${whereClause}
       ORDER BY ${safeSortBy} ${safeSortOrder}
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    return {
      records,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  static async getAssetById(id) {
    const [assets] = await pool.query(
      `SELECT 
        a.*,
        c.name as category_name,
        c.code as category_code,
        c.useful_life_months as category_life_months,
        c.depreciation_rate as category_depreciation_rate
       FROM aura_assets a
       LEFT JOIN aura_asset_categories c ON c.id = a.category_id
       WHERE a.id = ?`,
      [id]
    );

    if (assets.length === 0) return null;
    const asset = assets[0];

    // Related Assignments History
    const [assignments] = await pool.query(
      `SELECT * FROM aura_asset_assignments WHERE asset_id = ? ORDER BY id DESC`,
      [id]
    );

    // Related Transfers History
    const [transfers] = await pool.query(
      `SELECT * FROM aura_asset_transfers WHERE asset_id = ? ORDER BY id DESC`,
      [id]
    );

    // Related Maintenance History
    const [maintenances] = await pool.query(
      `SELECT * FROM aura_asset_maintenances WHERE asset_id = ? ORDER BY scheduled_date DESC`,
      [id]
    );

    // Related Disposal Record
    const [disposals] = await pool.query(
      `SELECT * FROM aura_asset_disposals WHERE asset_id = ? ORDER BY id DESC LIMIT 1`,
      [id]
    );

    return {
      ...asset,
      assignments,
      transfers,
      maintenances,
      disposal: disposals.length > 0 ? disposals[0] : null
    };
  }

  static async createAsset(data) {
    let assetCode = data.asset_code ? data.asset_code.trim() : null;
    if (!assetCode) {
      assetCode = await this.getNextAssetCode();
    }

    const purchaseCost = parseFloat(data.purchase_cost) || 0;
    const residualValue = parseFloat(data.residual_value) || 0;
    const usefulLifeMonths = parseInt(data.useful_life_months, 10) || 36;
    const accumulatedDepreciation = parseFloat(data.accumulated_depreciation) || 0;
    const currentValue = parseFloat(data.current_value) || Math.max(0, purchaseCost - accumulatedDepreciation);

    const [result] = await pool.query(
      `INSERT INTO aura_assets (
        asset_code, name, category_id, brand, model, serial_number, barcode,
        purchase_date, purchase_cost, residual_value, useful_life_months,
        depreciation_method, accumulated_depreciation, current_value,
        location_name, department_name, assigned_to, assigned_date,
        warranty_start, warranty_end, \`condition\`, status, image, note, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assetCode,
        data.name.trim(),
        data.category_id ? parseInt(data.category_id, 10) : null,
        data.brand || null,
        data.model || null,
        data.serial_number || null,
        data.barcode || null,
        data.purchase_date || null,
        purchaseCost,
        residualValue,
        usefulLifeMonths,
        data.depreciation_method || 'straight_line',
        accumulatedDepreciation,
        currentValue,
        data.location_name || null,
        data.department_name || null,
        data.assigned_to || null,
        data.assigned_date || null,
        data.warranty_start || null,
        data.warranty_end || null,
        data.condition || 'good',
        data.status || 'available',
        data.image || null,
        data.note || null,
        data.created_by || 1
      ]
    );

    return { id: result.insertId, asset_code: assetCode };
  }

  static async updateAsset(id, data) {
    const [existing] = await pool.query(`SELECT * FROM aura_assets WHERE id = ?`, [id]);
    if (existing.length === 0) throw new Error('Asset not found');
    const asset = existing[0];

    const purchaseCost = data.purchase_cost !== undefined ? parseFloat(data.purchase_cost) : asset.purchase_cost;
    const residualValue = data.residual_value !== undefined ? parseFloat(data.residual_value) : asset.residual_value;
    const usefulLifeMonths = data.useful_life_months !== undefined ? parseInt(data.useful_life_months, 10) : asset.useful_life_months;
    const accumulatedDepreciation = data.accumulated_depreciation !== undefined ? parseFloat(data.accumulated_depreciation) : asset.accumulated_depreciation;
    const currentValue = data.current_value !== undefined ? parseFloat(data.current_value) : Math.max(0, purchaseCost - accumulatedDepreciation);

    await pool.query(
      `UPDATE aura_assets SET
        asset_code = ?,
        name = ?,
        category_id = ?,
        brand = ?,
        model = ?,
        serial_number = ?,
        barcode = ?,
        purchase_date = ?,
        purchase_cost = ?,
        residual_value = ?,
        useful_life_months = ?,
        depreciation_method = ?,
        accumulated_depreciation = ?,
        current_value = ?,
        location_name = ?,
        department_name = ?,
        assigned_to = ?,
        assigned_date = ?,
        warranty_start = ?,
        warranty_end = ?,
        \`condition\` = ?,
        status = ?,
        image = ?,
        note = ?
       WHERE id = ?`,
      [
        data.asset_code ? data.asset_code.trim() : asset.asset_code,
        data.name ? data.name.trim() : asset.name,
        data.category_id !== undefined ? (data.category_id ? parseInt(data.category_id, 10) : null) : asset.category_id,
        data.brand !== undefined ? data.brand : asset.brand,
        data.model !== undefined ? data.model : asset.model,
        data.serial_number !== undefined ? data.serial_number : asset.serial_number,
        data.barcode !== undefined ? data.barcode : asset.barcode,
        data.purchase_date !== undefined ? data.purchase_date : asset.purchase_date,
        purchaseCost,
        residualValue,
        usefulLifeMonths,
        data.depreciation_method || asset.depreciation_method,
        accumulatedDepreciation,
        currentValue,
        data.location_name !== undefined ? data.location_name : asset.location_name,
        data.department_name !== undefined ? data.department_name : asset.department_name,
        data.assigned_to !== undefined ? data.assigned_to : asset.assigned_to,
        data.assigned_date !== undefined ? data.assigned_date : asset.assigned_date,
        data.warranty_start !== undefined ? data.warranty_start : asset.warranty_start,
        data.warranty_end !== undefined ? data.warranty_end : asset.warranty_end,
        data.condition !== undefined ? data.condition : asset.condition,
        data.status !== undefined ? data.status : asset.status,
        data.image !== undefined ? data.image : asset.image,
        data.note !== undefined ? data.note : asset.note,
        id
      ]
    );

    return { id, success: true };
  }

  static async deleteAsset(id, force = false) {
    const [existing] = await pool.query(`SELECT * FROM aura_assets WHERE id = ?`, [id]);
    if (existing.length === 0) throw new Error('Asset not found');

    // Check if asset has active assignments, transfers or maintenance
    const [assignments] = await pool.query(`SELECT COUNT(*) as count FROM aura_asset_assignments WHERE asset_id = ?`, [id]);
    const [transfers] = await pool.query(`SELECT COUNT(*) as count FROM aura_asset_transfers WHERE asset_id = ?`, [id]);
    const [maintenances] = await pool.query(`SELECT COUNT(*) as count FROM aura_asset_maintenances WHERE asset_id = ?`, [id]);

    const hasHistory = assignments[0].count > 0 || transfers[0].count > 0 || maintenances[0].count > 0;

    if (hasHistory && !force) {
      // Soft-retire / dispose instead of hard delete to preserve historical integrity
      await pool.query(`UPDATE aura_assets SET status = 'disposed', note = CONCAT(COALESCE(note, ''), ' [Archived/Deleted on ', NOW(), ']') WHERE id = ?`, [id]);
      return { id, success: true, archived: true, message: 'Asset archived as disposed because related history exists.' };
    }

    await pool.query(`DELETE FROM aura_asset_assignments WHERE asset_id = ?`, [id]);
    await pool.query(`DELETE FROM aura_asset_transfers WHERE asset_id = ?`, [id]);
    await pool.query(`DELETE FROM aura_asset_maintenances WHERE asset_id = ?`, [id]);
    await pool.query(`DELETE FROM aura_asset_disposals WHERE asset_id = ?`, [id]);
    await pool.query(`DELETE FROM aura_assets WHERE id = ?`, [id]);

    return { id, success: true, hardDeleted: true };
  }

  // =========================================================================
  // 3. ASSET CATEGORIES (CRUD)
  // =========================================================================

  static async getCategories({ search, status } = {}) {
    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const [categories] = await pool.query(
      `SELECT 
        c.*,
        COUNT(a.id) as total_assets,
        SUM(CASE WHEN a.status != 'disposed' THEN a.purchase_cost ELSE 0 END) as total_cost,
        SUM(CASE WHEN a.status != 'disposed' THEN a.current_value ELSE 0 END) as total_book_value
       FROM aura_asset_categories c
       LEFT JOIN aura_assets a ON a.category_id = c.id
       WHERE ${whereClause}
       GROUP BY c.id
       ORDER BY c.name ASC`,
      params
    );

    return categories;
  }

  static async getCategoryById(id) {
    const [rows] = await pool.query(`SELECT * FROM aura_asset_categories WHERE id = ?`, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async createCategory(data) {
    const code = data.code ? data.code.trim().toUpperCase() : `CAT-${Date.now().toString().slice(-4)}`;
    const [result] = await pool.query(
      `INSERT INTO aura_asset_categories (code, name, description, useful_life_months, depreciation_rate, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        code,
        data.name.trim(),
        data.description || null,
        parseInt(data.useful_life_months, 10) || 36,
        parseFloat(data.depreciation_rate) || 20.00,
        data.status || 'active'
      ]
    );
    return { id: result.insertId, code, name: data.name };
  }

  static async updateCategory(id, data) {
    await pool.query(
      `UPDATE aura_asset_categories SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        useful_life_months = COALESCE(?, useful_life_months),
        depreciation_rate = COALESCE(?, depreciation_rate),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        data.name ? data.name.trim() : null,
        data.description !== undefined ? data.description : null,
        data.useful_life_months ? parseInt(data.useful_life_months, 10) : null,
        data.depreciation_rate ? parseFloat(data.depreciation_rate) : null,
        data.status || null,
        id
      ]
    );
    return { id, success: true };
  }

  static async deleteCategory(id) {
    const [assets] = await pool.query(`SELECT COUNT(*) as count FROM aura_assets WHERE category_id = ?`, [id]);
    if (assets[0].count > 0) {
      throw new Error(`Cannot delete category: ${assets[0].count} asset(s) are currently assigned to it.`);
    }
    await pool.query(`DELETE FROM aura_asset_categories WHERE id = ?`, [id]);
    return { id, success: true };
  }

  // =========================================================================
  // 4. ASSET ASSIGNMENT & RETURN
  // =========================================================================

  static async getAssignments({ asset_id, employee_id, status, page = 1, limit = 50 } = {}) {
    let whereClause = '1=1';
    const params = [];

    if (asset_id) {
      whereClause += ' AND asn.asset_id = ?';
      params.push(parseInt(asset_id, 10));
    }

    if (employee_id) {
      whereClause += ' AND asn.employee_id = ?';
      params.push(parseInt(employee_id, 10));
    }

    if (status) {
      whereClause += ' AND asn.status = ?';
      params.push(status);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM aura_asset_assignments asn WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const safeLimit = Math.max(1, parseInt(limit, 10));

    const [records] = await pool.query(
      `SELECT 
        asn.*,
        a.asset_code,
        a.name as asset_name,
        a.brand,
        a.model,
        a.serial_number,
        c.name as category_name
       FROM aura_asset_assignments asn
       JOIN aura_assets a ON a.id = asn.asset_id
       LEFT JOIN aura_asset_categories c ON c.id = a.category_id
       WHERE ${whereClause}
       ORDER BY asn.id DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    return {
      records,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  static async assignAsset({ asset_id, employee_id, employee_name, department_name, assigned_date, expected_return_date, condition_out, note, assigned_by = 1 }) {
    const [assets] = await pool.query(`SELECT * FROM aura_assets WHERE id = ?`, [asset_id]);
    if (assets.length === 0) throw new Error('Asset not found');

    const assignDate = assigned_date || new Date().toISOString().slice(0, 10);

    const [result] = await pool.query(
      `INSERT INTO aura_asset_assignments (
        asset_id, employee_id, employee_name, department_name,
        assigned_date, expected_return_date, condition_out, note, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        asset_id,
        employee_id || null,
        employee_name,
        department_name || null,
        assignDate,
        expected_return_date || null,
        condition_out || 'good',
        note || null,
        assigned_by
      ]
    );

    // Update Asset status to 'assigned'
    await pool.query(
      `UPDATE aura_assets SET
        status = 'assigned',
        assigned_to = ?,
        assigned_date = ?,
        department_name = COALESCE(?, department_name),
        \`condition\` = COALESCE(?, \`condition\`)
       WHERE id = ?`,
      [employee_name, assignDate, department_name, condition_out, asset_id]
    );

    return { id: result.insertId, asset_id, status: 'assigned' };
  }

  static async returnAsset({ assignment_id, returned_date, condition_in = 'good', return_note = null }) {
    const [assignments] = await pool.query(`SELECT * FROM aura_asset_assignments WHERE id = ?`, [assignment_id]);
    if (assignments.length === 0) throw new Error('Assignment record not found');
    const assignment = assignments[0];

    const returnDate = returned_date || new Date().toISOString().slice(0, 10);

    await pool.query(
      `UPDATE aura_asset_assignments SET
        returned_date = ?,
        condition_in = ?,
        note = CONCAT(COALESCE(note, ''), CASE WHEN ? IS NOT NULL THEN CONCAT(' | Return: ', ?) ELSE '' END),
        status = 'returned'
       WHERE id = ?`,
      [returnDate, condition_in, return_note, return_note, assignment_id]
    );

    // Update Asset status to 'available'
    await pool.query(
      `UPDATE aura_assets SET
        status = 'available',
        assigned_to = NULL,
        assigned_date = NULL,
        \`condition\` = ?
       WHERE id = ?`,
      [condition_in, assignment.asset_id]
    );

    return { id: assignment_id, asset_id: assignment.asset_id, status: 'returned' };
  }

  // =========================================================================
  // 5. ASSET TRANSFERS
  // =========================================================================

  static async getNextTransferRef() {
    const year = new Date().getFullYear();
    const prefix = `TRF-${year}-`;
    const [rows] = await pool.query(
      `SELECT reference_no FROM aura_asset_transfers WHERE reference_no LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    if (rows.length === 0) return `${prefix}0001`;
    const lastCode = rows[0].reference_no;
    const parts = lastCode.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  static async getTransfers({ asset_id, page = 1, limit = 50 } = {}) {
    let whereClause = '1=1';
    const params = [];

    if (asset_id) {
      whereClause += ' AND trf.asset_id = ?';
      params.push(parseInt(asset_id, 10));
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM aura_asset_transfers trf WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const safeLimit = Math.max(1, parseInt(limit, 10));

    const [records] = await pool.query(
      `SELECT 
        trf.*,
        a.asset_code,
        a.name as asset_name,
        a.brand,
        a.model,
        c.name as category_name
       FROM aura_asset_transfers trf
       JOIN aura_assets a ON a.id = trf.asset_id
       LEFT JOIN aura_asset_categories c ON c.id = a.category_id
       WHERE ${whereClause}
       ORDER BY trf.id DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    return {
      records,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  static async createTransfer({ asset_id, transfer_date, from_location, to_location, from_department, to_department, from_employee, to_employee, reason, transferred_by = 1 }) {
    const [assets] = await pool.query(`SELECT * FROM aura_assets WHERE id = ?`, [asset_id]);
    if (assets.length === 0) throw new Error('Asset not found');
    const asset = assets[0];

    const refNo = await this.getNextTransferRef();
    const tDate = transfer_date || new Date().toISOString().slice(0, 10);

    const fLoc = from_location || asset.location_name;
    const fDept = from_department || asset.department_name;
    const fEmp = from_employee || asset.assigned_to;

    const [result] = await pool.query(
      `INSERT INTO aura_asset_transfers (
        asset_id, reference_no, transfer_date,
        from_location, to_location, from_department, to_department,
        from_employee, to_employee, reason, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [
        asset_id,
        refNo,
        tDate,
        fLoc,
        to_location,
        fDept,
        to_department || fDept,
        fEmp,
        to_employee || fEmp,
        reason || null,
        transferred_by
      ]
    );

    // Update Asset
    await pool.query(
      `UPDATE aura_assets SET
        location_name = ?,
        department_name = COALESCE(?, department_name),
        assigned_to = COALESCE(?, assigned_to)
       WHERE id = ?`,
      [to_location, to_department, to_employee, asset_id]
    );

    return { id: result.insertId, reference_no: refNo, success: true };
  }

  // =========================================================================
  // 6. ASSET MAINTENANCE
  // =========================================================================

  static async getNextMaintenanceRef() {
    const year = new Date().getFullYear();
    const prefix = `MNT-${year}-`;
    const [rows] = await pool.query(
      `SELECT reference_no FROM aura_asset_maintenances WHERE reference_no LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    if (rows.length === 0) return `${prefix}0001`;
    const lastCode = rows[0].reference_no;
    const parts = lastCode.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  static async getMaintenances({ asset_id, status, priority, maintenance_type, page = 1, limit = 50 } = {}) {
    let whereClause = '1=1';
    const params = [];

    if (asset_id) {
      whereClause += ' AND mnt.asset_id = ?';
      params.push(parseInt(asset_id, 10));
    }

    if (status && status !== 'all') {
      whereClause += ' AND mnt.status = ?';
      params.push(status);
    }

    if (priority && priority !== 'all') {
      whereClause += ' AND mnt.priority = ?';
      params.push(priority);
    }

    if (maintenance_type && maintenance_type !== 'all') {
      whereClause += ' AND mnt.maintenance_type = ?';
      params.push(maintenance_type);
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM aura_asset_maintenances mnt WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const safeLimit = Math.max(1, parseInt(limit, 10));

    const [records] = await pool.query(
      `SELECT 
        mnt.*,
        a.asset_code,
        a.name as asset_name,
        a.brand,
        a.model,
        a.location_name,
        a.status as asset_status,
        c.name as category_name
       FROM aura_asset_maintenances mnt
       JOIN aura_assets a ON a.id = mnt.asset_id
       LEFT JOIN aura_asset_categories c ON c.id = a.category_id
       WHERE ${whereClause}
       ORDER BY mnt.scheduled_date DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    return {
      records,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  static async createMaintenance({ asset_id, maintenance_type = 'preventive', title, description, priority = 'medium', scheduled_date, technician, cost = 0, parts_replaced, created_by = 1, set_asset_in_maintenance = false }) {
    const [assets] = await pool.query(`SELECT * FROM aura_assets WHERE id = ?`, [asset_id]);
    if (assets.length === 0) throw new Error('Asset not found');

    const refNo = await this.getNextMaintenanceRef();
    const schedDate = scheduled_date || new Date().toISOString().slice(0, 10);

    const [result] = await pool.query(
      `INSERT INTO aura_asset_maintenances (
        asset_id, reference_no, maintenance_type, title, description,
        priority, scheduled_date, technician, cost, parts_replaced,
        created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        asset_id,
        refNo,
        maintenance_type,
        title.trim(),
        description || null,
        priority,
        schedDate,
        technician || null,
        parseFloat(cost) || 0,
        parts_replaced || null,
        created_by
      ]
    );

    if (set_asset_in_maintenance) {
      await pool.query(`UPDATE aura_assets SET status = 'maintenance' WHERE id = ?`, [asset_id]);
    }

    return { id: result.insertId, reference_no: refNo, success: true };
  }

  static async updateMaintenance(id, data) {
    const [existing] = await pool.query(`SELECT * FROM aura_asset_maintenances WHERE id = ?`, [id]);
    if (existing.length === 0) throw new Error('Maintenance record not found');
    const record = existing[0];

    const newStatus = data.status || record.status;
    const completedDate = data.completed_date || (newStatus === 'completed' ? new Date().toISOString().slice(0, 10) : record.completed_date);

    await pool.query(
      `UPDATE aura_asset_maintenances SET
        maintenance_type = COALESCE(?, maintenance_type),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        scheduled_date = COALESCE(?, scheduled_date),
        completed_date = ?,
        technician = COALESCE(?, technician),
        cost = COALESCE(?, cost),
        parts_replaced = COALESCE(?, parts_replaced),
        status = ?
       WHERE id = ?`,
      [
        data.maintenance_type || null,
        data.title ? data.title.trim() : null,
        data.description !== undefined ? data.description : null,
        data.priority || null,
        data.scheduled_date || null,
        completedDate,
        data.technician !== undefined ? data.technician : null,
        data.cost !== undefined ? parseFloat(data.cost) : null,
        data.parts_replaced !== undefined ? data.parts_replaced : null,
        newStatus,
        id
      ]
    );

    // If completed or cancelled, check if asset was in maintenance and restore status
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      const [assetRows] = await pool.query(`SELECT * FROM aura_assets WHERE id = ?`, [record.asset_id]);
      if (assetRows.length > 0 && assetRows[0].status === 'maintenance') {
        const nextStatus = assetRows[0].assigned_to ? 'assigned' : 'available';
        await pool.query(`UPDATE aura_assets SET status = ? WHERE id = ?`, [nextStatus, record.asset_id]);
      }
    } else if (newStatus === 'in_progress') {
      await pool.query(`UPDATE aura_assets SET status = 'maintenance' WHERE id = ?`, [record.asset_id]);
    }

    return { id, success: true, status: newStatus };
  }

  // =========================================================================
  // 7. ASSET DEPRECIATION (STRAIGHT-LINE CALCULATION & SCHEDULER)
  // =========================================================================

  static calculateDepreciationForAsset(asset, targetDateStr = null) {
    const purchaseCost = parseFloat(asset.purchase_cost) || 0;
    const residualValue = parseFloat(asset.residual_value) || 0;
    const usefulLifeMonths = parseInt(asset.useful_life_months, 10) || 36;

    const depreciableBase = Math.max(0, purchaseCost - residualValue);
    const monthlyDepreciation = usefulLifeMonths > 0 ? (depreciableBase / usefulLifeMonths) : 0;

    // Calculate months elapsed
    const pDate = new Date(asset.purchase_date || Date.now());
    const tDate = targetDateStr ? new Date(targetDateStr) : new Date();

    let monthsElapsed = (tDate.getFullYear() - pDate.getFullYear()) * 12 + (tDate.getMonth() - pDate.getMonth());
    if (tDate.getDate() >= pDate.getDate()) {
      monthsElapsed += 1;
    }
    monthsElapsed = Math.max(0, monthsElapsed);

    const calculatedAccumulated = Math.min(depreciableBase, monthlyDepreciation * monthsElapsed);
    const calculatedCurrentValue = Math.max(residualValue, purchaseCost - calculatedAccumulated);
    const remainingMonths = Math.max(0, usefulLifeMonths - monthsElapsed);

    return {
      asset_id: asset.id,
      asset_code: asset.asset_code,
      name: asset.name,
      purchase_date: asset.purchase_date,
      purchase_cost: purchaseCost,
      residual_value: residualValue,
      useful_life_months: usefulLifeMonths,
      months_elapsed: monthsElapsed,
      remaining_months: remainingMonths,
      monthly_depreciation: parseFloat(monthlyDepreciation.toFixed(2)),
      accumulated_depreciation: parseFloat(calculatedAccumulated.toFixed(2)),
      net_book_value: parseFloat(calculatedCurrentValue.toFixed(2)),
      depreciation_percentage: depreciableBase > 0 ? parseFloat(((calculatedAccumulated / depreciableBase) * 100).toFixed(1)) : 100
    };
  }

  static async getDepreciationSchedule({ category_id, search, target_date } = {}) {
    let whereClause = "a.status != 'disposed'";
    const params = [];

    if (category_id) {
      whereClause += ' AND a.category_id = ?';
      params.push(parseInt(category_id, 10));
    }

    if (search) {
      whereClause += ' AND (a.asset_code LIKE ? OR a.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [assets] = await pool.query(
      `SELECT 
        a.*,
        c.name as category_name
       FROM aura_assets a
       LEFT JOIN aura_asset_categories c ON c.id = a.category_id
       WHERE ${whereClause}
       ORDER BY a.purchase_date ASC`,
      params
    );

    const schedule = assets.map(asset => {
      const calc = this.calculateDepreciationForAsset(asset, target_date);
      return {
        ...calc,
        category_name: asset.category_name,
        current_status: asset.status,
        db_accumulated_depreciation: parseFloat(asset.accumulated_depreciation) || 0,
        db_current_value: parseFloat(asset.current_value) || 0
      };
    });

    const totalCost = schedule.reduce((sum, item) => sum + item.purchase_cost, 0);
    const totalAccumulated = schedule.reduce((sum, item) => sum + item.accumulated_depreciation, 0);
    const totalBookValue = schedule.reduce((sum, item) => sum + item.net_book_value, 0);
    const totalMonthlyDepreciation = schedule.reduce((sum, item) => sum + item.monthly_depreciation, 0);

    return {
      schedule,
      totals: {
        total_assets: schedule.length,
        total_cost: parseFloat(totalCost.toFixed(2)),
        total_accumulated_depreciation: parseFloat(totalAccumulated.toFixed(2)),
        total_net_book_value: parseFloat(totalBookValue.toFixed(2)),
        total_monthly_depreciation: parseFloat(totalMonthlyDepreciation.toFixed(2))
      }
    };
  }

  static async runDepreciation({ target_date = null }) {
    const tDateStr = target_date || new Date().toISOString().slice(0, 10);
    const [assets] = await pool.query(`SELECT * FROM aura_assets WHERE status != 'disposed'`);

    let updatedCount = 0;
    let totalDepreciationBooked = 0;

    for (const asset of assets) {
      const calc = this.calculateDepreciationForAsset(asset, tDateStr);
      await pool.query(
        `UPDATE aura_assets SET
          accumulated_depreciation = ?,
          current_value = ?
         WHERE id = ?`,
        [calc.accumulated_depreciation, calc.net_book_value, asset.id]
      );
      updatedCount++;
      totalDepreciationBooked += calc.accumulated_depreciation;
    }

    return {
      success: true,
      target_date: tDateStr,
      assets_updated: updatedCount,
      total_accumulated_depreciation: parseFloat(totalDepreciationBooked.toFixed(2))
    };
  }

  // =========================================================================
  // 8. ASSET DISPOSAL & RETIREMENT
  // =========================================================================

  static async getNextDisposalRef() {
    const year = new Date().getFullYear();
    const prefix = `DSP-${year}-`;
    const [rows] = await pool.query(
      `SELECT reference_no FROM aura_asset_disposals WHERE reference_no LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    if (rows.length === 0) return `${prefix}0001`;
    const lastCode = rows[0].reference_no;
    const parts = lastCode.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  static async getDisposals({ asset_id, page = 1, limit = 50 } = {}) {
    let whereClause = '1=1';
    const params = [];

    if (asset_id) {
      whereClause += ' AND dsp.asset_id = ?';
      params.push(parseInt(asset_id, 10));
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM aura_asset_disposals dsp WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const safeLimit = Math.max(1, parseInt(limit, 10));

    const [records] = await pool.query(
      `SELECT 
        dsp.*,
        a.asset_code,
        a.name as asset_name,
        a.brand,
        a.model,
        a.purchase_cost,
        c.name as category_name
       FROM aura_asset_disposals dsp
       JOIN aura_assets a ON a.id = dsp.asset_id
       LEFT JOIN aura_asset_categories c ON c.id = a.category_id
       WHERE ${whereClause}
       ORDER BY dsp.disposal_date DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    return {
      records,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  static async createDisposal({ asset_id, disposal_date, disposal_method = 'sale', sale_amount = 0, buyer_name, reason, approved_by = 1, created_by = 1 }) {
    const [assets] = await pool.query(`SELECT * FROM aura_assets WHERE id = ?`, [asset_id]);
    if (assets.length === 0) throw new Error('Asset not found');
    const asset = assets[0];

    if (asset.status === 'disposed') {
      throw new Error('This asset has already been marked as disposed.');
    }

    const bookValue = parseFloat(asset.current_value) || 0;
    const saleAmt = parseFloat(sale_amount) || 0;
    const gainLoss = parseFloat((saleAmt - bookValue).toFixed(2));

    const refNo = await this.getNextDisposalRef();
    const dispDate = disposal_date || new Date().toISOString().slice(0, 10);

    const [result] = await pool.query(
      `INSERT INTO aura_asset_disposals (
        asset_id, reference_no, disposal_date, disposal_method,
        sale_amount, book_value_at_disposal, gain_loss, buyer_name,
        reason, approved_by, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset_id,
        refNo,
        dispDate,
        disposal_method,
        saleAmt,
        bookValue,
        gainLoss,
        buyer_name || null,
        reason || null,
        approved_by,
        created_by
      ]
    );

    // Update asset status to 'disposed' and set current value to 0
    await pool.query(
      `UPDATE aura_assets SET
        status = 'disposed',
        current_value = 0,
        note = CONCAT(COALESCE(note, ''), ' [Disposed on ', ?, ' via ', ?, ' | Ref: ', ?, ']')
       WHERE id = ?`,
      [dispDate, disposal_method, refNo, asset_id]
    );

    return {
      id: result.insertId,
      reference_no: refNo,
      gain_loss: gainLoss,
      status: 'disposed'
    };
  }

  // =========================================================================
  // 9. ASSET REPORTS
  // =========================================================================

  static async getAssetReports({ type = 'summary', category_id, start_date, end_date } = {}) {
    if (type === 'by_category') {
      const [rows] = await pool.query(`
        SELECT 
          c.id as category_id,
          c.code as category_code,
          c.name as category_name,
          c.depreciation_rate,
          COUNT(a.id) as total_assets,
          SUM(CASE WHEN a.status = 'available' THEN 1 ELSE 0 END) as available_count,
          SUM(CASE WHEN a.status = 'assigned' THEN 1 ELSE 0 END) as assigned_count,
          SUM(CASE WHEN a.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count,
          SUM(CASE WHEN a.status = 'disposed' THEN 1 ELSE 0 END) as disposed_count,
          SUM(a.purchase_cost) as total_purchase_cost,
          SUM(a.accumulated_depreciation) as total_depreciation,
          SUM(a.current_value) as total_net_book_value
        FROM aura_asset_categories c
        LEFT JOIN aura_assets a ON a.category_id = c.id
        GROUP BY c.id, c.code, c.name, c.depreciation_rate
        ORDER BY total_assets DESC
      `);
      return { type: 'by_category', data: rows };
    }

    if (type === 'by_location') {
      const [rows] = await pool.query(`
        SELECT 
          COALESCE(location_name, 'Unassigned Location') as location_name,
          COUNT(*) as total_assets,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_count,
          SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned_count,
          SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count,
          SUM(purchase_cost) as total_purchase_cost,
          SUM(current_value) as total_net_book_value
        FROM aura_assets
        WHERE status != 'disposed'
        GROUP BY location_name
        ORDER BY total_assets DESC
      `);
      return { type: 'by_location', data: rows };
    }

    if (type === 'maintenance_costs') {
      const [rows] = await pool.query(`
        SELECT 
          a.id as asset_id,
          a.asset_code,
          a.name as asset_name,
          c.name as category_name,
          a.location_name,
          COUNT(m.id) as total_service_events,
          SUM(m.cost) as total_maintenance_cost,
          MAX(m.scheduled_date) as last_maintenance_date
        FROM aura_assets a
        LEFT JOIN aura_asset_categories c ON c.id = a.category_id
        JOIN aura_asset_maintenances m ON m.asset_id = a.id
        GROUP BY a.id, a.asset_code, a.name, c.name, a.location_name
        ORDER BY total_maintenance_cost DESC
      `);
      return { type: 'maintenance_costs', data: rows };
    }

    if (type === 'disposals') {
      const [rows] = await pool.query(`
        SELECT 
          dsp.*,
          a.asset_code,
          a.name as asset_name,
          a.purchase_cost,
          c.name as category_name
        FROM aura_asset_disposals dsp
        JOIN aura_assets a ON a.id = dsp.asset_id
        LEFT JOIN aura_asset_categories c ON c.id = a.category_id
        ORDER BY dsp.disposal_date DESC
      `);
      return { type: 'disposals', data: rows };
    }

    // Default: summary
    const metrics = await this.getDashboardMetrics();
    return { type: 'summary', data: metrics };
  }
}

module.exports = AssetModel;
