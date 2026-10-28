const db = require('../../config/dbPool');

function logError(context, err) {
  console.error(`[RewardsExchangeModel Error] [${context}]:`, err?.message || err);
}

class RewardsExchangeModel {
  /**
   * 1. Get metadata options (warehouses, customers with points, billers, reward rules, next ref, statuses)
   */
  static async getMetadataOptions() {
    try {
      // Warehouses
      const [warehouses] = await db.query(`
        SELECT id, name, code, address, phone 
        FROM aura_warehouses 
        ORDER BY name ASC
      `);

      // Customers with their current reward points balance
      const [customers] = await db.query(`
        SELECT id, name, company, phone, email, address, COALESCE(award_points, 0) AS award_points 
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

      // Pre-configured Reward Exchange Rules
      const [rewardRules] = await db.query(`
        SELECT 
          r.id,
          r.category,
          r.type,
          r.exchange_product_id,
          ep.code AS exchange_product_code,
          ep.name AS exchange_product_name,
          r.exchange_quantity,
          r.receive_product_id,
          rp.code AS receive_product_code,
          rp.name AS receive_product_name,
          r.receive_quantity,
          r.amount
        FROM aura_rewards r
        LEFT JOIN aura_products ep ON ep.id = r.exchange_product_id
        LEFT JOIN aura_products rp ON rp.id = r.receive_product_id
        ORDER BY r.id ASC
      `);

      // Next reference number: RWE{YY}/{0001}
      const yearShort = new Date().getFullYear().toString().slice(-2);
      const [lastRefRow] = await db.query(`
        SELECT reference_no, id 
        FROM aura_rewards_exchange 
        ORDER BY id DESC 
        LIMIT 1
      `);

      let nextNumber = 1;
      if (lastRefRow.length > 0 && lastRefRow[0].id) {
        nextNumber = parseInt(lastRefRow[0].id, 10) + 1;
      }
      const paddedNum = String(nextNumber).padStart(4, '0');
      const nextReference = `RWE${yearShort}/${paddedNum}`;

      const statuses = [
        { value: 'draft', label: 'Draft', color: 'default' },
        { value: 'pending', label: 'Pending', color: 'gold' },
        { value: 'approved', label: 'Approved', color: 'cyan' },
        { value: 'completed', label: 'Completed', color: 'green' },
        { value: 'cancelled', label: 'Cancelled', color: 'red' },
      ];

      const categories = [
        { value: 'customer', label: 'Customer' },
        { value: 'supplier', label: 'Supplier' },
      ];

      const exchangeTypes = [
        { value: 'points', label: 'Points Redemption (Redeem Points for Gifts)' },
        { value: 'product', label: 'Product Exchange (Exchange Product for Product)' },
        { value: 'money', label: 'Money Exchange (Points/Product to Cash)' },
      ];

      return {
        warehouses,
        customers,
        billers,
        rewardRules,
        nextReference,
        statuses,
        categories,
        exchangeTypes,
      };
    } catch (err) {
      logError('getMetadataOptions', err);
      throw err;
    }
  }

  /**
   * 2. Search exchangeable products with live warehouse stock balances
   */
  static async getExchangeableProducts(warehouseId, term = '', limit = 20) {
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
          p.price AS unit_price,
          p.cost AS unit_cost,
          p.unit AS product_unit_id,
          u.code AS product_unit_code,
          u.name AS product_unit_name,
          p.image,
          -- Points cost (defaulting to product price * 10 or 1 point if 0)
          GREATEST(1, ROUND(COALESCE(p.price, 1) * 10)) AS default_points,
          COALESCE(wp.quantity, p.quantity, 0) AS warehouse_stock,
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
      logError('getExchangeableProducts', err);
      throw err;
    }
  }

  /**
   * 3. List rewards exchange records with metrics, filters, and pagination
   */
  static async listRewardsExchange(filters = {}, pagination = {}) {
    try {
      const {
        search = '',
        category = '',
        type = '',
        status = '',
        warehouse_id = '',
        customer_id = '',
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
        whereClauses.push('(re.reference_no LIKE ? OR re.company LIKE ? OR re.customer LIKE ? OR re.note LIKE ?)');
        params.push(cleanSearch, cleanSearch, cleanSearch, cleanSearch);
      }

      if (category && category !== 'all') {
        whereClauses.push('re.category = ?');
        params.push(category);
      }

      if (type && type !== 'all') {
        whereClauses.push('re.type = ?');
        params.push(type);
      }

      if (status && status !== 'all') {
        whereClauses.push('re.status = ?');
        params.push(status);
      }

      if (warehouse_id && warehouse_id !== 'all') {
        whereClauses.push('re.warehouse_id = ?');
        params.push(warehouse_id);
      }

      if (customer_id && customer_id !== 'all') {
        whereClauses.push('(re.company_id = ? OR re.customer_id = ?)');
        params.push(customer_id, customer_id);
      }

      if (start_date) {
        whereClauses.push('DATE(re.date) >= ?');
        params.push(start_date);
      }

      if (end_date) {
        whereClauses.push('DATE(re.date) <= ?');
        params.push(end_date);
      }

      const whereSql = whereClauses.join(' AND ');

      // Total count query
      const [countRows] = await db.query(`
        SELECT COUNT(*) AS total
        FROM aura_rewards_exchange re
        WHERE ${whereSql}
      `, params);
      const totalRecords = countRows[0]?.total || 0;

      // Summary KPIs
      const [metricsRows] = await db.query(`
        SELECT 
          COUNT(*) AS total_exchanges,
          COALESCE(SUM(re.points_used), 0) AS total_points_redeemed,
          COALESCE(SUM(re.total_qty), 0) AS total_items_issued,
          COALESCE(SUM(CASE WHEN re.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_count,
          COALESCE(SUM(CASE WHEN re.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_count
        FROM aura_rewards_exchange re
        WHERE ${whereSql}
      `, params);

      // Data query
      const sql = `
        SELECT 
          re.id,
          re.date,
          re.reference_no,
          re.category,
          re.type,
          re.warehouse_id,
          w.name AS warehouse_name,
          re.company_id,
          re.company,
          re.customer_id,
          COALESCE(re.customer, re.company) AS customer_name,
          c.award_points AS current_customer_points,
          re.biller_id,
          re.biller,
          re.points_used,
          re.total_qty,
          re.grand_total,
          re.status,
          re.note,
          re.created_by,
          u.username AS creator_name,
          re.updated_at,
          (
            SELECT COUNT(*) 
            FROM aura_reward_exchange_items rei 
            WHERE rei.reward_exchange_id = re.id
          ) AS items_count
        FROM aura_rewards_exchange re
        LEFT JOIN aura_warehouses w ON w.id = re.warehouse_id
        LEFT JOIN aura_companies c ON c.id = COALESCE(re.customer_id, re.company_id)
        LEFT JOIN aura_users u ON u.id = re.created_by
        WHERE ${whereSql}
        ORDER BY re.id DESC
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
          total_exchanges: 0,
          total_points_redeemed: 0,
          total_items_issued: 0,
          completed_count: 0,
          pending_count: 0,
        },
      };
    } catch (err) {
      logError('listRewardsExchange', err);
      throw err;
    }
  }

  /**
   * 4. Get a single rewards exchange record by ID with full item details
   */
  static async getRewardsExchangeById(id) {
    try {
      const [headerRows] = await db.query(`
        SELECT 
          re.*,
          COALESCE(re.customer, re.company) AS customer_name,
          w.name AS warehouse_name,
          w.code AS warehouse_code,
          c.award_points AS current_customer_points,
          c.phone AS customer_phone,
          c.email AS customer_email,
          c.address AS customer_address,
          u.username AS creator_name
        FROM aura_rewards_exchange re
        LEFT JOIN aura_warehouses w ON w.id = re.warehouse_id
        LEFT JOIN aura_companies c ON c.id = COALESCE(re.customer_id, re.company_id)
        LEFT JOIN aura_users u ON u.id = re.created_by
        WHERE re.id = ?
        LIMIT 1
      `, [id]);

      if (headerRows.length === 0) {
        return null;
      }

      const exchange = headerRows[0];

      // Fetch items
      const [itemRows] = await db.query(`
        SELECT 
          rei.*,
          COALESCE(rei.product_id, rei.exchange_product_id) AS product_id,
          COALESCE(rei.product_code, rei.exchange_product_code) AS product_code,
          COALESCE(rei.product_name, rei.exchange_product_name) AS product_name,
          COALESCE(rei.quantity, rei.exchange_quantity) AS quantity,
          p.image,
          p.type AS product_type,
          u.name AS unit_name
        FROM aura_reward_exchange_items rei
        LEFT JOIN aura_products p ON p.id = COALESCE(rei.product_id, rei.exchange_product_id)
        LEFT JOIN aura_units u ON u.id = rei.exchange_product_unit_id
        WHERE rei.reward_exchange_id = ?
        ORDER BY rei.id ASC
      `, [id]);

      exchange.items = itemRows;
      return exchange;
    } catch (err) {
      logError('getRewardsExchangeById', err);
      throw err;
    }
  }

  /**
   * 5. Create a new rewards exchange transaction
   * - Validates customer points balance
   * - Saves header and items
   * - If status === 'completed', deducts customer points, updates physical inventory, logs movement
   */
  static async createRewardsExchange(payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        date = new Date().toISOString().slice(0, 19).replace('T', ' '),
        reference_no,
        category = 'customer',
        type = 'points',
        warehouse_id,
        customer_id,
        biller_id,
        status = 'completed',
        note = '',
        staff_note = '',
        items = [],
      } = payload;

      if (!customer_id) {
        throw new Error('Customer is required for rewards exchange.');
      }
      if (!warehouse_id) {
        throw new Error('Warehouse is required.');
      }
      if (!items || items.length === 0) {
        throw new Error('Please select at least one exchange or redemption item.');
      }

      // Fetch customer details with lock
      const [custRows] = await conn.query(`
        SELECT id, name, company, award_points 
        FROM aura_companies 
        WHERE id = ? 
        LIMIT 1 FOR UPDATE
      `, [customer_id]);

      if (custRows.length === 0) {
        throw new Error(`Customer with ID ${customer_id} not found.`);
      }

      const customerName = custRows[0].company && custRows[0].company !== '-'
        ? custRows[0].company
        : custRows[0].name;
      const customerPoints = parseFloat(custRows[0].award_points || 0);

      // Fetch biller details
      let billerId = biller_id;
      let billerName = '';
      if (!billerId) {
        const [defaultBiller] = await conn.query("SELECT id, name, company FROM aura_companies WHERE group_name = 'biller' ORDER BY id ASC LIMIT 1");
        if (defaultBiller.length > 0) {
          billerId = defaultBiller[0].id;
          billerName = defaultBiller[0].company && defaultBiller[0].company !== '-' ? defaultBiller[0].company : defaultBiller[0].name;
        } else {
          billerId = 1;
          billerName = 'Aura Supply';
        }
      } else {
        const [bRows] = await conn.query('SELECT name, company FROM aura_companies WHERE id = ? LIMIT 1', [billerId]);
        if (bRows.length > 0) {
          billerName = bRows[0].company && bRows[0].company !== '-' ? bRows[0].company : bRows[0].name;
        }
      }

      // Calculate total points and quantities
      let totalPoints = 0;
      let totalQty = 0;
      let grandTotal = 0;

      for (const item of items) {
        const qty = parseFloat(item.quantity || item.exchange_quantity || 1);
        const pts = parseFloat(item.points || 0);
        const price = parseFloat(item.unit_price || 0);

        totalQty += qty;
        totalPoints += (pts * qty);
        grandTotal += (price * qty);
      }

      // Validate customer points if points redemption type
      if (type === 'points' && totalPoints > 0) {
        if (customerPoints < totalPoints) {
          throw new Error(`Customer "${customerName}" has ${customerPoints} reward points available, but ${totalPoints} points are required for this redemption.`);
        }
      }

      // Check overselling settings
      const [settingRows] = await conn.query('SELECT overselling FROM aura_settings LIMIT 1');
      const allowOverselling = settingRows.length > 0 && settingRows[0].overselling === 1;

      // Validate warehouse stock if status is completed and overselling is disabled
      const shouldApplyDeductions = (status === 'completed');
      if (shouldApplyDeductions && !allowOverselling) {
        for (const item of items) {
          const prodId = item.product_id || item.exchange_product_id;
          const qty = parseFloat(item.quantity || item.exchange_quantity || 1);

          const [whStockRows] = await conn.query(`
            SELECT quantity FROM aura_warehouses_products 
            WHERE product_id = ? AND warehouse_id = ? 
            LIMIT 1 FOR UPDATE
          `, [prodId, warehouse_id]);

          const availableStock = parseFloat(whStockRows[0]?.quantity || 0);
          if (availableStock < qty) {
            throw new Error(`Insufficient warehouse stock for "${item.product_name || item.exchange_product_name}" (Available: ${availableStock}, Requested: ${qty}).`);
          }
        }
      }

      // Determine Reference Number
      let finalRef = reference_no;
      if (!finalRef || !finalRef.trim()) {
        const yearShort = new Date().getFullYear().toString().slice(-2);
        const [lastRow] = await conn.query('SELECT id FROM aura_rewards_exchange ORDER BY id DESC LIMIT 1 FOR UPDATE');
        const nextId = (lastRow[0]?.id || 0) + 1;
        finalRef = `RWE${yearShort}/${String(nextId).padStart(4, '0')}`;
      }

      // Insert Header
      const [insertHeader] = await conn.query(`
        INSERT INTO aura_rewards_exchange (
          date, reference_no, category, type, biller_id, biller,
          warehouse_id, project_id, company_id, company, customer_id, customer,
          grand_total, points_used, total_qty, paid, status,
          note, staff_note, currency, module_type, print_time, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        date,
        finalRef,
        category,
        type,
        billerId,
        billerName,
        warehouse_id,
        payload.project_id || 1,
        customer_id,
        customerName,
        customer_id,
        customerName,
        grandTotal,
        totalPoints,
        totalQty,
        grandTotal,
        status,
        note,
        staff_note,
        payload.currency || 'USD',
        'reward_exchange',
        0,
        user.id || 1,
      ]);

      const exchangeId = insertHeader.insertId;

      // Insert Items & Process Movement
      for (const item of items) {
        const prodId = item.product_id || item.exchange_product_id;
        const prodCode = item.product_code || item.exchange_product_code || '';
        const prodName = item.product_name || item.exchange_product_name || '';
        const qty = parseFloat(item.quantity || item.exchange_quantity || 1);
        const pts = parseFloat(item.points || 0);
        const itemTotalPoints = pts * qty;
        const unitPrice = parseFloat(item.unit_price || 0);
        const unitCost = parseFloat(item.unit_cost || item.purchase_unit_cost || 0);
        const subtotal = qty * unitPrice;
        const unitId = item.product_unit_id || item.exchange_product_unit_id || null;
        const unitCode = item.product_unit_code || item.exchange_product_unit_code || 'Unit';

        await conn.query(`
          INSERT INTO aura_reward_exchange_items (
            reward_id, reward_exchange_id, warehouse_id,
            exchange_product_id, exchange_product_code, exchange_product_name,
            exchange_quantity, exchange_unit_quantity, exchange_product_unit_id, exchange_product_unit_code,
            product_id, product_code, product_name, quantity,
            set_quantity, purchase_unit_cost, unit_price, real_unit_price, subtotal,
            points, total_points, cost, hide, free, foc
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.reward_id || 0,
          exchangeId,
          warehouse_id,
          prodId,
          prodCode,
          prodName,
          qty,
          qty,
          unitId,
          unitCode,
          prodId,
          prodCode,
          prodName,
          qty,
          1,
          unitCost,
          unitPrice,
          unitPrice,
          subtotal,
          pts,
          itemTotalPoints,
          unitCost,
          0,
          0,
          0,
        ]);

        // If completed, deduct stock and record stock movement
        if (shouldApplyDeductions) {
          // Warehouse stock
          const [existingWh] = await conn.query('SELECT id FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ? LIMIT 1', [prodId, warehouse_id]);
          if (existingWh.length > 0) {
            await conn.query('UPDATE aura_warehouses_products SET quantity = quantity - ? WHERE id = ?', [qty, existingWh[0].id]);
          } else {
            await conn.query('INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [prodId, warehouse_id, -qty]);
          }

          // Product total stock
          await conn.query(`
            UPDATE aura_products 
            SET quantity = quantity - ? 
            WHERE id = ?
          `, [qty, prodId]);

          // Stock movement audit
          await conn.query(`
            INSERT INTO aura_stock_movement (
              date, reference_no, transaction, transaction_id,
              warehouse_id, product_id, product_type, product_code, product_name,
              real_unit_cost, quantity, unit_quantity,
              unit_code, unit_id, user_id, actual_date
            ) VALUES (?, ?, 'Reward', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            date,
            finalRef,
            exchangeId,
            warehouse_id,
            prodId,
            item.product_type || 'standard',
            prodCode,
            prodName,
            unitCost,
            -qty,
            -qty,
            unitCode,
            unitId,
            user.id || 1,
            new Date().toISOString().slice(0, 10),
          ]);
        }
      }

      // Deduct Customer Points if completed
      if (shouldApplyDeductions && type === 'points' && totalPoints > 0) {
        await conn.query(`
          UPDATE aura_companies 
          SET award_points = GREATEST(0, award_points - ?) 
          WHERE id = ?
        `, [totalPoints, customer_id]);
      }

      await conn.commit();
      return { id: exchangeId, reference_no: finalRef };
    } catch (err) {
      await conn.rollback();
      logError('createRewardsExchange', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 6. Update rewards exchange transaction
   * - Safely reverses previous stock/points deductions before applying new values
   */
  static async updateRewardsExchange(id, payload, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Fetch current exchange record with lock
      const [currentRows] = await conn.query(`
        SELECT * FROM aura_rewards_exchange 
        WHERE id = ? 
        LIMIT 1 FOR UPDATE
      `, [id]);

      if (currentRows.length === 0) {
        throw new Error(`Rewards exchange #${id} not found.`);
      }

      const current = currentRows[0];
      const prevStatus = current.status;
      const prevPointsUsed = parseFloat(current.points_used || 0);
      const prevCustomerId = current.customer_id || current.company_id;
      const prevType = current.type;
      const prevWarehouseId = current.warehouse_id;

      // 2. Fetch current items
      const [prevItems] = await conn.query(`
        SELECT * FROM aura_reward_exchange_items 
        WHERE reward_exchange_id = ?
      `, [id]);

      // 3. Revert previous state if it was completed
      if (prevStatus === 'completed') {
        // Refund previous customer points
        if (prevType === 'points' && prevPointsUsed > 0 && prevCustomerId) {
          await conn.query(`
            UPDATE aura_companies 
            SET award_points = award_points + ? 
            WHERE id = ?
          `, [prevPointsUsed, prevCustomerId]);
        }

        // Restore previous inventory
        for (const item of prevItems) {
          const prodId = item.product_id || item.exchange_product_id;
          const qty = parseFloat(item.quantity || item.exchange_quantity || 0);

          const [existingWh] = await conn.query('SELECT id FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ? LIMIT 1', [prodId, prevWarehouseId]);
          if (existingWh.length > 0) {
            await conn.query('UPDATE aura_warehouses_products SET quantity = quantity + ? WHERE id = ?', [qty, existingWh[0].id]);
          } else {
            await conn.query('INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [prodId, prevWarehouseId, qty]);
          }

          await conn.query(`
            UPDATE aura_products 
            SET quantity = quantity + ? 
            WHERE id = ?
          `, [qty, prodId]);
        }

        // Remove previous stock movement records
        await conn.query(`
          DELETE FROM aura_stock_movement 
          WHERE transaction = 'Reward' AND transaction_id = ?
        `, [id]);
      }

      // 4. Validate and prepare new payload
      const {
        date = current.date,
        reference_no = current.reference_no,
        category = current.category,
        type = current.type,
        warehouse_id = current.warehouse_id,
        customer_id = current.customer_id,
        biller_id = current.biller_id,
        status = 'completed',
        note = current.note,
        staff_note = current.staff_note,
        items = [],
      } = payload;

      if (!items || items.length === 0) {
        throw new Error('Please select at least one exchange or redemption item.');
      }

      // Fetch customer details with lock
      const [custRows] = await conn.query(`
        SELECT id, name, company, award_points 
        FROM aura_companies 
        WHERE id = ? 
        LIMIT 1 FOR UPDATE
      `, [customer_id]);

      if (custRows.length === 0) {
        throw new Error(`Customer with ID ${customer_id} not found.`);
      }

      const customerName = custRows[0].company && custRows[0].company !== '-'
        ? custRows[0].company
        : custRows[0].name;
      const customerPoints = parseFloat(custRows[0].award_points || 0);

      // Calculate new totals
      let totalPoints = 0;
      let totalQty = 0;
      let grandTotal = 0;

      for (const item of items) {
        const qty = parseFloat(item.quantity || item.exchange_quantity || 1);
        const pts = parseFloat(item.points || 0);
        const price = parseFloat(item.unit_price || 0);

        totalQty += qty;
        totalPoints += (pts * qty);
        grandTotal += (price * qty);
      }

      // Check points balance if new status is completed
      const shouldApplyDeductions = (status === 'completed');
      if (shouldApplyDeductions && type === 'points' && totalPoints > 0) {
        if (customerPoints < totalPoints) {
          throw new Error(`Customer "${customerName}" has ${customerPoints} reward points available, but ${totalPoints} points are required for this redemption.`);
        }
      }

      // Check overselling settings
      const [settingRows] = await conn.query('SELECT overselling FROM aura_settings LIMIT 1');
      const allowOverselling = settingRows.length > 0 && settingRows[0].overselling === 1;

      // Validate stock
      if (shouldApplyDeductions && !allowOverselling) {
        for (const item of items) {
          const prodId = item.product_id || item.exchange_product_id;
          const qty = parseFloat(item.quantity || item.exchange_quantity || 1);

          const [whStockRows] = await conn.query(`
            SELECT quantity FROM aura_warehouses_products 
            WHERE product_id = ? AND warehouse_id = ? 
            LIMIT 1 FOR UPDATE
          `, [prodId, warehouse_id]);

          const availableStock = parseFloat(whStockRows[0]?.quantity || 0);
          if (availableStock < qty) {
            throw new Error(`Insufficient warehouse stock for "${item.product_name || item.exchange_product_name}" (Available: ${availableStock}, Requested: ${qty}).`);
          }
        }
      }

      // 5. Update Header
      await conn.query(`
        UPDATE aura_rewards_exchange 
        SET 
          date = ?,
          reference_no = ?,
          category = ?,
          type = ?,
          warehouse_id = ?,
          company_id = ?,
          company = ?,
          customer_id = ?,
          customer = ?,
          biller_id = ?,
          grand_total = ?,
          points_used = ?,
          total_qty = ?,
          status = ?,
          note = ?,
          staff_note = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        date,
        reference_no,
        category,
        type,
        warehouse_id,
        customer_id,
        customerName,
        customer_id,
        customerName,
        biller_id,
        grandTotal,
        totalPoints,
        totalQty,
        status,
        note,
        staff_note,
        user.id || 1,
        id,
      ]);

      // 6. Delete old items and reinsert new items
      await conn.query('DELETE FROM aura_reward_exchange_items WHERE reward_exchange_id = ?', [id]);

      for (const item of items) {
        const prodId = item.product_id || item.exchange_product_id;
        const prodCode = item.product_code || item.exchange_product_code || '';
        const prodName = item.product_name || item.exchange_product_name || '';
        const qty = parseFloat(item.quantity || item.exchange_quantity || 1);
        const pts = parseFloat(item.points || 0);
        const itemTotalPoints = pts * qty;
        const unitPrice = parseFloat(item.unit_price || 0);
        const unitCost = parseFloat(item.unit_cost || item.purchase_unit_cost || 0);
        const subtotal = qty * unitPrice;
        const unitId = item.product_unit_id || item.exchange_product_unit_id || null;
        const unitCode = item.product_unit_code || item.exchange_product_unit_code || 'Unit';

        await conn.query(`
          INSERT INTO aura_reward_exchange_items (
            reward_id, reward_exchange_id, warehouse_id,
            exchange_product_id, exchange_product_code, exchange_product_name,
            exchange_quantity, exchange_unit_quantity, exchange_product_unit_id, exchange_product_unit_code,
            product_id, product_code, product_name, quantity,
            set_quantity, purchase_unit_cost, unit_price, real_unit_price, subtotal,
            points, total_points, cost, hide, free, foc
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.reward_id || 0,
          id,
          warehouse_id,
          prodId,
          prodCode,
          prodName,
          qty,
          qty,
          unitId,
          unitCode,
          prodId,
          prodCode,
          prodName,
          qty,
          1,
          unitCost,
          unitPrice,
          unitPrice,
          subtotal,
          pts,
          itemTotalPoints,
          unitCost,
          0,
          0,
          0,
        ]);

        // Deduct inventory if completed
        if (shouldApplyDeductions) {
          const [existingWh] = await conn.query('SELECT id FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ? LIMIT 1', [prodId, warehouse_id]);
          if (existingWh.length > 0) {
            await conn.query('UPDATE aura_warehouses_products SET quantity = quantity - ? WHERE id = ?', [qty, existingWh[0].id]);
          } else {
            await conn.query('INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [prodId, warehouse_id, -qty]);
          }

          await conn.query(`
            UPDATE aura_products 
            SET quantity = quantity - ? 
            WHERE id = ?
          `, [qty, prodId]);

          await conn.query(`
            INSERT INTO aura_stock_movement (
              date, reference_no, transaction, transaction_id,
              warehouse_id, product_id, product_type, product_code, product_name,
              real_unit_cost, quantity, unit_quantity,
              unit_code, unit_id, user_id, actual_date
            ) VALUES (?, ?, 'Reward', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            date,
            reference_no,
            id,
            warehouse_id,
            prodId,
            item.product_type || 'standard',
            prodCode,
            prodName,
            unitCost,
            -qty,
            -qty,
            unitCode,
            unitId,
            user.id || 1,
            new Date().toISOString().slice(0, 10),
          ]);
        }
      }

      // Deduct Customer Points if completed
      if (shouldApplyDeductions && type === 'points' && totalPoints > 0) {
        await conn.query(`
          UPDATE aura_companies 
          SET award_points = GREATEST(0, award_points - ?) 
          WHERE id = ?
        `, [totalPoints, customer_id]);
      }

      await conn.commit();
      return { id, reference_no };
    } catch (err) {
      await conn.rollback();
      logError('updateRewardsExchange', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * 7. Delete rewards exchange transaction
   * - Cleanly restores points and inventory, then deletes items and header
   */
  static async deleteRewardsExchange(id, user = {}) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [currentRows] = await conn.query(`
        SELECT * FROM aura_rewards_exchange 
        WHERE id = ? 
        LIMIT 1 FOR UPDATE
      `, [id]);

      if (currentRows.length === 0) {
        throw new Error(`Rewards exchange #${id} not found.`);
      }

      const current = currentRows[0];
      const prevStatus = current.status;
      const prevPointsUsed = parseFloat(current.points_used || 0);
      const prevCustomerId = current.customer_id || current.company_id;
      const prevType = current.type;
      const prevWarehouseId = current.warehouse_id;

      // Fetch items
      const [prevItems] = await conn.query(`
        SELECT * FROM aura_reward_exchange_items 
        WHERE reward_exchange_id = ?
      `, [id]);

      // Restore points and stock if completed
      if (prevStatus === 'completed') {
        if (prevType === 'points' && prevPointsUsed > 0 && prevCustomerId) {
          await conn.query(`
            UPDATE aura_companies 
            SET award_points = award_points + ? 
            WHERE id = ?
          `, [prevPointsUsed, prevCustomerId]);
        }

        for (const item of prevItems) {
          const prodId = item.product_id || item.exchange_product_id;
          const qty = parseFloat(item.quantity || item.exchange_quantity || 0);

          const [existingWh] = await conn.query('SELECT id FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ? LIMIT 1', [prodId, prevWarehouseId]);
          if (existingWh.length > 0) {
            await conn.query('UPDATE aura_warehouses_products SET quantity = quantity + ? WHERE id = ?', [qty, existingWh[0].id]);
          } else {
            await conn.query('INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [prodId, prevWarehouseId, qty]);
          }

          await conn.query(`
            UPDATE aura_products 
            SET quantity = quantity + ? 
            WHERE id = ?
          `, [qty, prodId]);
        }

        await conn.query(`
          DELETE FROM aura_stock_movement 
          WHERE transaction = 'Reward' AND transaction_id = ?
        `, [id]);
      }

      // Delete items and header
      await conn.query('DELETE FROM aura_reward_exchange_items WHERE reward_exchange_id = ?', [id]);
      await conn.query('DELETE FROM aura_rewards_exchange WHERE id = ?', [id]);

      await conn.commit();
      return { success: true, message: `Reward exchange #${id} deleted successfully.` };
    } catch (err) {
      await conn.rollback();
      logError('deleteRewardsExchange', err);
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = RewardsExchangeModel;
