const db = require('../../config/dbPool');

function logError(context, err) {
  console.error(`[PurchaseRequestsModel Error] [${context}]:`, err?.message || err);
}

class PurchaseRequestsModel {
  /**
   * 1. Get metadata options (warehouses, departments, suppliers, billers, next ref, statuses)
   */
  static async getMetadataOptions() {
    try {
      // Warehouses
      const [warehouses] = await db.query(`
        SELECT id, name, code, address, phone 
        FROM aura_warehouses 
        ORDER BY name ASC
      `);

      // HR Departments
      const [departments] = await db.query(`
        SELECT id, name, code, description 
        FROM aura_hr_departments 
        ORDER BY name ASC
      `);

      // Suppliers
      const [suppliers] = await db.query(`
        SELECT id, name, company, phone, email 
        FROM aura_companies 
        WHERE group_name = 'supplier' 
        ORDER BY CASE WHEN company = '-' OR company IS NULL THEN name ELSE company END ASC
      `);

      // Billers
      const [billers] = await db.query(`
        SELECT id, name, company, phone, email 
        FROM aura_companies 
        WHERE group_name = 'biller' 
        ORDER BY CASE WHEN company = '-' OR company IS NULL THEN name ELSE company END ASC
      `);

      // Next reference: PR{YY}/{0001}
      const yearShort = new Date().getFullYear().toString().slice(-2);
      const [lastRefRow] = await db.query(`
        SELECT reference_no, id 
        FROM aura_purchases_request 
        ORDER BY id DESC 
        LIMIT 1
      `);

      let nextNumber = 1;
      if (lastRefRow.length > 0 && lastRefRow[0].id) {
        nextNumber = parseInt(lastRefRow[0].id, 10) + 1;
      }
      const paddedNum = String(nextNumber).padStart(4, '0');
      const nextReference = `PR${yearShort}/${paddedNum}`;

      const statuses = [
        { value: 'pending', label: 'Pending Approval', color: 'gold' },
        { value: 'approved', label: 'Approved', color: 'green' },
        { value: 'rejected', label: 'Rejected', color: 'red' },
        { value: 'completed', label: 'Completed / Converted', color: 'cyan' },
        { value: 'cancelled', label: 'Cancelled', color: 'default' },
      ];

      return {
        warehouses,
        departments,
        suppliers,
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
   * 2. Search products for purchase request with live QOH (Quantity On Hand)
   */
  static async searchProducts(warehouseId, term = '', limit = 20) {
    try {
      const conditions = ["(p.type = 'standard' OR p.type IS NULL OR p.type = 'service')"];
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
          COALESCE(p.cost, 0) AS unit_cost,
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
        LIMIT ${parseInt(limit, 10) || 20}
      `;

      const [rows] = await db.query(sql, params);
      return rows;
    } catch (err) {
      logError('searchProducts', err);
      throw err;
    }
  }

  /**
   * 3. List purchase requests with filters, pagination, and KPI metrics
   */
  static async listPurchaseRequests(filters = {}, pagination = {}) {
    try {
      const {
        search = '',
        status = '',
        warehouse_id = '',
        department_id = '',
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
        whereClauses.push('(pr.reference_no LIKE ? OR pr.supplier LIKE ? OR pr.purpose LIKE ? OR pr.note LIKE ?)');
        params.push(cleanSearch, cleanSearch, cleanSearch, cleanSearch);
      }

      if (status && status !== 'all') {
        if (status === 'pending') {
          whereClauses.push("(pr.status = 'pending' OR pr.status = 'requested' OR pr.status IS NULL)");
        } else {
          whereClauses.push('pr.status = ?');
          params.push(status);
        }
      }

      if (warehouse_id && warehouse_id !== 'all') {
        whereClauses.push('pr.warehouse_id = ?');
        params.push(warehouse_id);
      }

      if (department_id && department_id !== 'all') {
        whereClauses.push('pr.department_id = ?');
        params.push(department_id);
      }

      if (supplier_id && supplier_id !== 'all') {
        whereClauses.push('pr.supplier_id = ?');
        params.push(supplier_id);
      }

      if (start_date) {
        whereClauses.push('DATE(pr.date) >= ?');
        params.push(start_date);
      }

      if (end_date) {
        whereClauses.push('DATE(pr.date) <= ?');
        params.push(end_date);
      }

      const whereSql = whereClauses.join(' AND ');

      // Total count query
      const [countRows] = await db.query(`
        SELECT COUNT(*) AS total
        FROM aura_purchases_request pr
        WHERE ${whereSql}
      `, params);
      const totalRecords = countRows[0]?.total || 0;

      // Summary KPIs
      const [metricsRows] = await db.query(`
        SELECT 
          COUNT(*) AS total_requests,
          COALESCE(SUM(CASE WHEN pr.status = 'pending' OR pr.status = 'requested' OR pr.status IS NULL THEN 1 ELSE 0 END), 0) AS pending_count,
          COALESCE(SUM(CASE WHEN pr.status = 'approved' THEN 1 ELSE 0 END), 0) AS approved_count,
          COALESCE(SUM(CASE WHEN pr.status = 'rejected' OR pr.status = 'reject' THEN 1 ELSE 0 END), 0) AS rejected_count,
          COALESCE(SUM(CASE WHEN pr.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_count,
          COALESCE(SUM(pr.total_qty), 0) AS total_requested_qty,
          COALESCE(SUM(pr.grand_total), 0) AS total_estimated_amount
        FROM aura_purchases_request pr
        WHERE ${whereSql}
      `, params);

      // Data query
      const sql = `
        SELECT 
          pr.id,
          pr.date,
          pr.reference_no,
          pr.warehouse_id,
          w.name AS warehouse_name,
          pr.department_id,
          COALESCE(d.name, pr.department, '-') AS department_name,
          pr.supplier_id,
          pr.supplier,
          pr.biller_id,
          b.company AS biller_name,
          pr.purpose,
          pr.required_date,
          pr.required_date_text,
          pr.deadline,
          pr.total_qty,
          pr.grand_total,
          pr.status,
          pr.note,
          pr.created_by,
          u_creator.username AS creator_username,
          CONCAT(COALESCE(u_creator.first_name, ''), ' ', COALESCE(u_creator.last_name, '')) AS creator_fullname,
          pr.approved_by,
          CONCAT(COALESCE(u_approver.first_name, ''), ' ', COALESCE(u_approver.last_name, '')) AS approver_fullname,
          pr.approved_date,
          pr.rejected_by,
          CONCAT(COALESCE(u_rejecter.first_name, ''), ' ', COALESCE(u_rejecter.last_name, '')) AS rejecter_fullname,
          pr.rejected_date,
          (
            SELECT COUNT(*) 
            FROM aura_purchase_request_items pri 
            WHERE pri.purchase_id = pr.id
          ) AS items_count
        FROM aura_purchases_request pr
        LEFT JOIN aura_warehouses w ON w.id = pr.warehouse_id
        LEFT JOIN aura_hr_departments d ON d.id = pr.department_id
        LEFT JOIN aura_companies b ON b.id = pr.biller_id
        LEFT JOIN aura_users u_creator ON u_creator.id = pr.created_by
        LEFT JOIN aura_users u_approver ON u_approver.id = pr.approved_by
        LEFT JOIN aura_users u_rejecter ON u_rejecter.id = pr.rejected_by
        WHERE ${whereSql}
        ORDER BY pr.id DESC
        LIMIT ? OFFSET ?
      `;

      const [rows] = await db.query(sql, [...params, limit, offset]);

      return {
        data: rows,
        pagination: {
          page,
          limit,
          total: totalRecords,
          totalPages: Math.ceil(totalRecords / limit) || 1,
        },
        metrics: metricsRows[0] || {
          total_requests: 0,
          pending_count: 0,
          approved_count: 0,
          rejected_count: 0,
          completed_count: 0,
          total_requested_qty: 0,
          total_estimated_amount: 0,
        },
      };
    } catch (err) {
      logError('listPurchaseRequests', err);
      throw err;
    }
  }

  /**
   * 4. Get a single purchase request by ID with full item details
   */
  static async getPurchaseRequestById(id) {
    try {
      const [headerRows] = await db.query(`
        SELECT 
          pr.*,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          COALESCE(d.name, pr.department, '-') AS department_name,
          b.company AS biller_name,
          s.company AS supplier_company,
          s.phone AS supplier_phone,
          s.email AS supplier_email,
          u_creator.username AS creator_username,
          CONCAT(COALESCE(u_creator.first_name, ''), ' ', COALESCE(u_creator.last_name, '')) AS creator_fullname,
          u_approver.username AS approver_username,
          CONCAT(COALESCE(u_approver.first_name, ''), ' ', COALESCE(u_approver.last_name, '')) AS approver_fullname,
          u_rejecter.username AS rejecter_username,
          CONCAT(COALESCE(u_rejecter.first_name, ''), ' ', COALESCE(u_rejecter.last_name, '')) AS rejecter_fullname
        FROM aura_purchases_request pr
        LEFT JOIN aura_warehouses w ON w.id = pr.warehouse_id
        LEFT JOIN aura_hr_departments d ON d.id = pr.department_id
        LEFT JOIN aura_companies b ON b.id = pr.biller_id
        LEFT JOIN aura_companies s ON s.id = pr.supplier_id
        LEFT JOIN aura_users u_creator ON u_creator.id = pr.created_by
        LEFT JOIN aura_users u_approver ON u_approver.id = pr.approved_by
        LEFT JOIN aura_users u_rejecter ON u_rejecter.id = pr.rejected_by
        WHERE pr.id = ?
        LIMIT 1
      `, [id]);

      if (headerRows.length === 0) {
        return null;
      }

      const request = headerRows[0];

      // Fetch Items
      const [itemRows] = await db.query(`
        SELECT 
          pri.*,
          COALESCE(pri.unit_quantity, pri.quantity) AS requested_quantity,
          p.image,
          p.type AS product_type,
          u.name AS unit_name,
          COALESCE(wp.quantity, p.quantity, 0) AS current_warehouse_qoh
        FROM aura_purchase_request_items pri
        LEFT JOIN aura_products p ON p.id = pri.product_id
        LEFT JOIN aura_units u ON u.id = pri.product_unit_id
        LEFT JOIN aura_warehouses_products wp ON (wp.product_id = pri.product_id AND wp.warehouse_id = pri.warehouse_id)
        WHERE pri.purchase_id = ?
        ORDER BY pri.id ASC
      `, [id]);

      request.items = itemRows;
      return request;
    } catch (err) {
      logError('getPurchaseRequestById', err);
      throw err;
    }
  }

  /**
   * 5. Create a new purchase request
   */
  static async createPurchaseRequest(payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        date = new Date().toISOString().slice(0, 19).replace('T', ' '),
        reference_no,
        warehouse_id,
        department_id,
        supplier_id,
        biller_id,
        purpose = '',
        required_date,
        required_date_text = '',
        deadline,
        status = 'pending',
        note = '',
        items = [],
      } = payload;

      if (!warehouse_id) {
        throw new Error('Destination warehouse is required.');
      }
      if (!items || items.length === 0) {
        throw new Error('Please add at least one product to the purchase request.');
      }

      // Department lookup
      let departmentName = '';
      if (department_id) {
        const [depRows] = await conn.query('SELECT name FROM aura_hr_departments WHERE id = ? LIMIT 1', [department_id]);
        if (depRows.length > 0) {
          departmentName = depRows[0].name;
        }
      }

      // Supplier lookup
      let finalSupplierId = supplier_id || 1;
      let supplierName = 'General Supplier';
      if (supplier_id) {
        const [supRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ? LIMIT 1', [supplier_id]);
        if (supRows.length > 0) {
          supplierName = supRows[0].company && supRows[0].company !== '-' ? supRows[0].company : supRows[0].name;
        }
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
        const [lastRow] = await conn.query('SELECT id FROM aura_purchases_request ORDER BY id DESC LIMIT 1 FOR UPDATE');
        const nextId = (lastRow[0]?.id || 0) + 1;
        finalRef = `PR${yearShort}/${String(nextId).padStart(4, '0')}`;
      }

      // Calculate totals
      let totalQty = 0;
      let grandTotal = 0;
      for (const item of items) {
        const qty = parseFloat(item.quantity || 1);
        const cost = parseFloat(item.unit_cost || 0);
        totalQty += qty;
        grandTotal += (qty * cost);
      }

      // Insert Header
      const [insertHeader] = await conn.query(`
        INSERT INTO aura_purchases_request (
          date, reference_no, warehouse_id, department_id, department,
          supplier_id, supplier, biller_id, project_id,
          purpose, required_date, required_date_text, deadline,
          status, total, total_qty, grand_total, paid,
          note, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        date,
        finalRef,
        warehouse_id,
        department_id || null,
        departmentName,
        finalSupplierId,
        supplierName,
        finalBillerId,
        payload.project_id || 1,
        purpose,
        required_date || null,
        required_date_text || '',
        deadline || date,
        status,
        grandTotal,
        totalQty,
        grandTotal,
        0,
        note,
        user.id || 1,
      ]);

      const requestId = insertHeader.insertId;

      // Insert Items
      for (const item of items) {
        const prodId = item.product_id;
        const prodCode = item.product_code || '';
        const prodName = item.product_name || '';
        const qty = parseFloat(item.quantity || 1);
        const unitCost = parseFloat(item.unit_cost || 0);
        const subtotal = qty * unitCost;
        const unitId = item.product_unit_id || null;
        const unitCode = item.product_unit_code || 'Unit';
        const qoh = parseFloat(item.qoh || item.current_warehouse_qoh || 0);
        const desc = item.description || '';

        await conn.query(`
          INSERT INTO aura_purchase_request_items (
            purchase_id, product_id, product_code, product_name,
            quantity, unit_quantity, product_unit_id, product_unit_code,
            unit_cost, net_unit_cost, real_unit_cost, subtotal,
            warehouse_id, qoh, description, status, date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          requestId,
          prodId,
          prodCode,
          prodName,
          qty,
          qty,
          unitId,
          unitCode,
          unitCost,
          unitCost,
          unitCost,
          subtotal,
          warehouse_id,
          qoh,
          desc,
          status,
          date.slice(0, 10),
        ]);
      }

      await conn.commit();
      return { id: requestId, reference_no: finalRef };
    } catch (err) {
      await conn.rollback();
      logError('createPurchaseRequest', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 6. Update purchase request
   */
  static async updatePurchaseRequest(id, payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [currentRows] = await conn.query(`
        SELECT * FROM aura_purchases_request 
        WHERE id = ? 
        LIMIT 1 FOR UPDATE
      `, [id]);

      if (currentRows.length === 0) {
        throw new Error(`Purchase request #${id} not found.`);
      }

      const current = currentRows[0];

      // Prevent modifications to completed / converted requests
      if (current.status === 'completed') {
        throw new Error(`Purchase request #${id} is already completed/converted and cannot be modified.`);
      }

      const {
        date = current.date,
        reference_no = current.reference_no,
        warehouse_id = current.warehouse_id,
        department_id = current.department_id,
        supplier_id = current.supplier_id,
        biller_id = current.biller_id,
        purpose = current.purpose,
        required_date = current.required_date,
        required_date_text = current.required_date_text,
        deadline = current.deadline,
        status = current.status,
        note = current.note,
        items = [],
      } = payload;

      if (!items || items.length === 0) {
        throw new Error('Please add at least one product to the purchase request.');
      }

      // Department lookup
      let departmentName = current.department;
      if (department_id) {
        const [depRows] = await conn.query('SELECT name FROM aura_hr_departments WHERE id = ? LIMIT 1', [department_id]);
        if (depRows.length > 0) {
          departmentName = depRows[0].name;
        }
      }

      // Supplier lookup
      let supplierName = current.supplier;
      if (supplier_id) {
        const [supRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ? LIMIT 1', [supplier_id]);
        if (supRows.length > 0) {
          supplierName = supRows[0].company && supRows[0].company !== '-' ? supRows[0].company : supRows[0].name;
        }
      }

      // Calculate totals
      let totalQty = 0;
      let grandTotal = 0;
      for (const item of items) {
        const qty = parseFloat(item.quantity || 1);
        const cost = parseFloat(item.unit_cost || 0);
        totalQty += qty;
        grandTotal += (qty * cost);
      }

      // Update Header
      await conn.query(`
        UPDATE aura_purchases_request 
        SET 
          date = ?,
          reference_no = ?,
          warehouse_id = ?,
          department_id = ?,
          department = ?,
          supplier_id = ?,
          supplier = ?,
          biller_id = ?,
          purpose = ?,
          required_date = ?,
          required_date_text = ?,
          deadline = ?,
          status = ?,
          total = ?,
          total_qty = ?,
          grand_total = ?,
          note = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        date,
        reference_no,
        warehouse_id,
        department_id || null,
        departmentName,
        supplier_id || current.supplier_id,
        supplierName,
        biller_id || current.biller_id,
        purpose,
        required_date || null,
        required_date_text || '',
        deadline || date,
        status,
        grandTotal,
        totalQty,
        grandTotal,
        note,
        user.id || 1,
        id,
      ]);

      // Re-sync items
      await conn.query('DELETE FROM aura_purchase_request_items WHERE purchase_id = ?', [id]);

      for (const item of items) {
        const prodId = item.product_id;
        const prodCode = item.product_code || '';
        const prodName = item.product_name || '';
        const qty = parseFloat(item.quantity || 1);
        const unitCost = parseFloat(item.unit_cost || 0);
        const subtotal = qty * unitCost;
        const unitId = item.product_unit_id || null;
        const unitCode = item.product_unit_code || 'Unit';
        const qoh = parseFloat(item.qoh || item.current_warehouse_qoh || 0);
        const desc = item.description || '';

        await conn.query(`
          INSERT INTO aura_purchase_request_items (
            purchase_id, product_id, product_code, product_name,
            quantity, unit_quantity, product_unit_id, product_unit_code,
            unit_cost, net_unit_cost, real_unit_cost, subtotal,
            warehouse_id, qoh, description, status, date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          prodId,
          prodCode,
          prodName,
          qty,
          qty,
          unitId,
          unitCode,
          unitCost,
          unitCost,
          unitCost,
          subtotal,
          warehouse_id,
          qoh,
          desc,
          status,
          new Date(date).toISOString().slice(0, 10),
        ]);
      }

      await conn.commit();
      return { id, reference_no };
    } catch (err) {
      await conn.rollback();
      logError('updatePurchaseRequest', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 7. Delete purchase request
   */
  static async deletePurchaseRequest(id, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [currentRows] = await conn.query(`
        SELECT status FROM aura_purchases_request 
        WHERE id = ? 
        LIMIT 1 FOR UPDATE
      `, [id]);

      if (currentRows.length === 0) {
        throw new Error(`Purchase request #${id} not found.`);
      }

      if (currentRows[0].status === 'completed') {
        throw new Error(`Cannot delete completed/converted purchase request #${id}.`);
      }

      await conn.query('DELETE FROM aura_purchase_request_items WHERE purchase_id = ?', [id]);
      await conn.query('DELETE FROM aura_purchases_request WHERE id = ?', [id]);

      await conn.commit();
      return { success: true, message: `Purchase request #${id} deleted successfully.` };
    } catch (err) {
      await conn.rollback();
      logError('deletePurchaseRequest', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 8. Approve purchase request
   */
  static async approvePurchaseRequest(id, user = {}) {
    try {
      const [res] = await db.query(`
        UPDATE aura_purchases_request 
        SET 
          status = 'approved',
          approved_by = ?,
          approved_date = NOW(),
          rejected_by = NULL,
          rejected_date = NULL,
          updated_at = NOW()
        WHERE id = ?
      `, [user.id || 1, id]);

      if (res.affectedRows === 0) {
        throw new Error(`Purchase request #${id} not found.`);
      }

      await db.query(`UPDATE aura_purchase_request_items SET status = 'approved' WHERE purchase_id = ?`, [id]);

      return { id, status: 'approved' };
    } catch (err) {
      logError('approvePurchaseRequest', err);
      throw err;
    }
  }

  /**
   * 9. Reject purchase request
   */
  static async rejectPurchaseRequest(id, user = {}, reason = '') {
    try {
      const [res] = await db.query(`
        UPDATE aura_purchases_request 
        SET 
          status = 'rejected',
          rejected_by = ?,
          rejected_date = NOW(),
          note = CASE WHEN ? != '' THEN CONCAT(COALESCE(note, ''), ' [Rejection Reason: ', ?, ']') ELSE note END,
          updated_at = NOW()
        WHERE id = ?
      `, [user.id || 1, reason, reason, id]);

      if (res.affectedRows === 0) {
        throw new Error(`Purchase request #${id} not found.`);
      }

      await db.query(`UPDATE aura_purchase_request_items SET status = 'rejected' WHERE purchase_id = ?`, [id]);

      return { id, status: 'rejected' };
    } catch (err) {
      logError('rejectPurchaseRequest', err);
      throw err;
    }
  }

  /**
   * 10. Unapprove / Revert purchase request to pending
   */
  static async unapprovePurchaseRequest(id, user = {}) {
    try {
      const [res] = await db.query(`
        UPDATE aura_purchases_request 
        SET 
          status = 'pending',
          approved_by = NULL,
          approved_date = NULL,
          rejected_by = NULL,
          rejected_date = NULL,
          updated_at = NOW()
        WHERE id = ?
      `, [id]);

      if (res.affectedRows === 0) {
        throw new Error(`Purchase request #${id} not found.`);
      }

      await db.query(`UPDATE aura_purchase_request_items SET status = 'pending' WHERE purchase_id = ?`, [id]);

      return { id, status: 'pending' };
    } catch (err) {
      logError('unapprovePurchaseRequest', err);
      throw err;
    }
  }
}

module.exports = PurchaseRequestsModel;
