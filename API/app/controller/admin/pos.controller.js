/**
 * POS CONTROLLER & REGISTER MANAGEMENT
 * =====================================
 * Replicating AURA_v1 POS module logic:
 * - Register lifecycle: open register, shift telemetry, close register with cash reconciliation
 * - Real-time product catalog with multi-unit packaging support
 * - Customer list & quick add
 * - POS sale checkout with multi-payment tender, inventory stock decrement, and receipt data
 */

const { pool } = require('../../config/dbPool');

// Scoping Helper: Super Admin & Admin have full access across all billers/warehouses.
// Standard biller/branch users are strictly scoped to their assigned biller_id and warehouse_id.
async function resolveScope(req) {
  let user = req.user;
  if (!user) {
    const rawUid = req.headers['x-user-id'] || req.query.user_id || req.body?.user_id;
    if (rawUid) {
      const [uRows] = await pool.query(
        `SELECT u.id, u.username, u.group_id, u.biller_id, u.warehouse_id, g.name as role 
         FROM aura_users u 
         LEFT JOIN aura_groups g ON g.id = u.group_id 
         WHERE u.id = ? LIMIT 1`,
        [rawUid]
      );
      if (uRows && uRows.length > 0) user = uRows[0];
    }
  }

  const isSuperAdmin = user && (
    Number(user.group_id) === 1 || 
    Number(user.group_id) === 2 || 
    user.role === 'owner' || 
    user.role === 'admin' || 
    user.role === 'developer' ||
    user.Owner || 
    user.Admin
  );

  let billerId = null;
  let warehouseId = null;

  if (isSuperAdmin) {
    billerId = req.query.biller_id ? Number(req.query.biller_id) : (req.body?.biller_id ? Number(req.body.biller_id) : null);
    warehouseId = req.query.warehouse_id ? Number(req.query.warehouse_id) : (req.body?.warehouse_id ? Number(req.body.warehouse_id) : null);
  } else {
    billerId = user?.biller_id ? Number(user.biller_id) : null;
    warehouseId = user?.warehouse_id ? Number(user.warehouse_id) : null;
  }

  return {
    user,
    userId: user?.id || (req.query.user_id || req.body?.user_id || 1),
    isSuperAdmin: !!isSuperAdmin,
    billerId,
    warehouseId,
  };
}

// 1. Check current active register for user/biller
exports.getCurrentRegister = async (req, res) => {
  try {
    const scope = await resolveScope(req);
    const userId = req.query.user_id || scope.userId;
    
    let sql = `
      SELECT r.*, u.username as cashier_username, u.first_name, u.last_name,
             c.name as biller_name, c.company as biller_company,
             w.name as warehouse_name, w.code as warehouse_code
      FROM aura_pos_register r
      LEFT JOIN aura_users u ON u.id = r.user_id
      LEFT JOIN aura_companies c ON c.id = r.biller_id
      LEFT JOIN aura_warehouses w ON w.id = r.warehouse_id
      WHERE r.status = 'open'
    `;
    const params = [];

    if (!scope.isSuperAdmin && scope.billerId) {
      sql += ` AND (r.biller_id = ? OR r.user_id = ?)`;
      params.push(scope.billerId, userId);
    } else {
      sql += ` AND r.user_id = ?`;
      params.push(userId);
    }

    sql += ` ORDER BY r.id DESC LIMIT 1`;

    const [rows] = await pool.query(sql, params);

    if (rows.length > 0) {
      return res.json({
        success: true,
        isOpen: true,
        register: rows[0]
      });
    }

    return res.json({
      success: true,
      isOpen: false,
      register: null
    });
  } catch (error) {
    console.error('[POS] getCurrentRegister error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Open Cash Register Session
exports.openRegister = async (req, res) => {
  try {
    const scope = await resolveScope(req);
    const { cash_in_hand, user_id, note } = req.body;
    const uid = user_id || scope.userId;
    const cashAmount = parseFloat(cash_in_hand) || 0;

    // Enforce scoping
    let bid = scope.isSuperAdmin ? (req.body.biller_id || null) : scope.billerId;
    let wid = scope.isSuperAdmin ? (req.body.warehouse_id || null) : scope.warehouseId;

    // If warehouseId not provided but biller is set, resolve default warehouse for biller
    if (!wid && bid) {
      const [bRows] = await pool.query('SELECT warehouse_id FROM aura_companies WHERE id = ? LIMIT 1', [bid]);
      if (bRows.length > 0 && bRows[0].warehouse_id) wid = bRows[0].warehouse_id;
    }

    // Verify if already has an open register
    let checkSql = "SELECT id FROM aura_pos_register WHERE user_id = ? AND status = 'open' LIMIT 1";
    const checkParams = [uid];
    if (!scope.isSuperAdmin && scope.billerId) {
      checkSql = "SELECT id FROM aura_pos_register WHERE (user_id = ? OR biller_id = ?) AND status = 'open' LIMIT 1";
      checkParams.push(scope.billerId);
    }

    const [existing] = await pool.query(checkSql, checkParams);

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: 'Register is already open',
        register_id: existing[0].id
      });
    }

    const [result] = await pool.query(
      `INSERT INTO aura_pos_register 
       (date, user_id, biller_id, warehouse_id, cash_in_hand, status, note, pushed) 
       VALUES (NOW(), ?, ?, ?, ?, 'open', ?, 0)`,
      [uid, bid, wid, cashAmount, note || '']
    );

    const [newReg] = await pool.query(
      `SELECT r.*, c.name as biller_name, w.name as warehouse_name
       FROM aura_pos_register r
       LEFT JOIN aura_companies c ON c.id = r.biller_id
       LEFT JOIN aura_warehouses w ON w.id = r.warehouse_id
       WHERE r.id = ?`,
      [result.insertId]
    );

    return res.json({
      success: true,
      message: 'Register opened successfully',
      register: newReg[0]
    });
  } catch (error) {
    console.error('[POS] openRegister error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Register Shift Summary & Reconciliation Data
exports.getRegisterSummary = async (req, res) => {
  try {
    const registerId = req.params.id || req.query.register_id;
    const userId = req.query.user_id || 1;

    let register;
    if (registerId) {
      const [regs] = await pool.query("SELECT * FROM aura_pos_register WHERE id = ?", [registerId]);
      register = regs[0];
    } else {
      const [regs] = await pool.query(
        "SELECT * FROM aura_pos_register WHERE user_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
        [userId]
      );
      register = regs[0];
    }

    if (!register) {
      return res.status(404).json({ success: false, message: 'No open register found' });
    }

    const openTime = register.date;
    const cashInHand = parseFloat(register.cash_in_hand) || 0;

    // Aggregate completed POS sales created since register open
    const [salesSummary] = await pool.query(
      `SELECT 
         COUNT(id) as total_bills,
         COALESCE(SUM(grand_total), 0) as total_sales,
         COALESCE(SUM(paid), 0) as total_paid
       FROM aura_sales 
       WHERE date >= ? AND (created_by = ? OR ? = 1) AND pos = 1 AND sale_status != 'returned'`,
      [openTime, register.user_id, register.user_id]
    );

    // Aggregate payments by tender type since register open
    const [payments] = await pool.query(
      `SELECT 
         paid_by,
         COALESCE(SUM(amount), 0) as paid_amount,
         COUNT(id) as count
       FROM aura_payments 
       WHERE date >= ? AND (created_by = ? OR ? = 1)
       GROUP BY paid_by`,
      [openTime, register.user_id, register.user_id]
    );

    let cashSales = 0;
    let cardSales = 0;
    let khqrSales = 0;
    let chequeSales = 0;
    let otherSales = 0;

    payments.forEach(p => {
      const method = (p.paid_by || '').toLowerCase();
      const amt = parseFloat(p.paid_amount) || 0;
      if (method.includes('cash')) {
        cashSales += amt;
      } else if (method.includes('card') || method.includes('visa') || method.includes('master')) {
        cardSales += amt;
      } else if (method.includes('khqr') || method.includes('aba') || method.includes('acleda') || method.includes('bakong') || method.includes('wing')) {
        khqrSales += amt;
      } else if (method.includes('cheque')) {
        chequeSales += amt;
      } else {
        otherSales += amt;
      }
    });

    const expectedCashInDrawer = cashInHand + cashSales;

    return res.json({
      success: true,
      register,
      summary: {
        register_id: register.id,
        opened_at: register.date,
        cash_in_hand: cashInHand,
        total_bills: salesSummary[0]?.total_bills || 0,
        total_sales: parseFloat(salesSummary[0]?.total_sales || 0),
        cash_sales: cashSales,
        card_sales: cardSales,
        khqr_sales: khqrSales,
        cheque_sales: chequeSales,
        other_sales: otherSales,
        expected_cash: expectedCashInDrawer,
        breakdown_payments: payments
      }
    });
  } catch (error) {
    console.error('[POS] getRegisterSummary error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Close Cash Register
exports.closeRegister = async (req, res) => {
  try {
    const {
      register_id,
      total_cash_submitted,
      total_cc_slips_submitted,
      total_cheques_submitted,
      note,
      closed_by
    } = req.body;

    const uid = closed_by || 1;
    const cashSubmitted = parseFloat(total_cash_submitted) || 0;
    const cardSlips = parseInt(total_cc_slips_submitted, 10) || 0;
    const cheques = parseInt(total_cheques_submitted, 10) || 0;

    let register;
    if (register_id) {
      const [regs] = await pool.query("SELECT * FROM aura_pos_register WHERE id = ?", [register_id]);
      register = regs[0];
    } else {
      const [regs] = await pool.query(
        "SELECT * FROM aura_pos_register WHERE user_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
        [uid]
      );
      register = regs[0];
    }

    if (!register) {
      return res.status(404).json({ success: false, message: 'No open register found to close' });
    }

    const regId = register.id;

    // Compute sales in period
    const [salesSummary] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_cash
       FROM aura_payments 
       WHERE date >= ? AND (created_by = ? OR ? = 1) AND LOWER(paid_by) LIKE '%cash%'`,
      [register.date, register.user_id, register.user_id]
    );

    const calculatedCashSales = parseFloat(salesSummary[0]?.total_cash || 0);
    const expectedCash = (parseFloat(register.cash_in_hand) || 0) + calculatedCashSales;

    await pool.query(
      `UPDATE aura_pos_register SET
         status = 'close',
         closed_at = NOW(),
         total_cash = ?,
         total_cash_submitted = ?,
         total_cc_slips = ?,
         total_cc_slips_submitted = ?,
         total_cheques = ?,
         total_cheques_submitted = ?,
         note = ?,
         closed_by = ?
       WHERE id = ?`,
      [
        expectedCash,
        cashSubmitted,
        cardSlips,
        cardSlips,
        cheques,
        cheques,
        note || '',
        uid,
        regId
      ]
    );

    const [updated] = await pool.query("SELECT * FROM aura_pos_register WHERE id = ?", [regId]);

    return res.json({
      success: true,
      message: 'Register closed successfully',
      difference: cashSubmitted - expectedCash,
      register: updated[0]
    });
  } catch (error) {
    console.error('[POS] closeRegister error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Products Catalog Feed for POS (with units and categories, scoped by warehouse & biller)
exports.getPosProducts = async (req, res) => {
  try {
    const scope = await resolveScope(req);
    const { category_id, search } = req.query;

    const warehouseId = scope.warehouseId || (req.query.warehouse_id ? Number(req.query.warehouse_id) : 1);
    const billerId = scope.billerId || (req.query.biller_id ? Number(req.query.biller_id) : null);

    let query = `
      SELECT 
        p.id, 
        p.code, 
        p.name, 
        p.price, 
        p.cost, 
        COALESCE(wp.quantity, p.quantity, 0) as quantity, 
        p.image, 
        p.category_id, 
        p.unit as unit_id,
        p.sale_unit,
        p.biller_id,
        c.name as category_name,
        u.name as unit_name,
        u.code as unit_code
      FROM aura_products p
      LEFT JOIN aura_categories c ON c.id = p.category_id
      LEFT JOIN aura_units u ON u.id = p.unit
      LEFT JOIN (
        SELECT product_id, SUM(quantity) as quantity
        FROM aura_warehouses_products
        WHERE warehouse_id = ?
        GROUP BY product_id
      ) wp ON wp.product_id = p.id
      WHERE 1=1
    `;

    const params = [warehouseId];

    if (billerId) {
      query += ` AND (p.biller_id IS NULL OR p.biller_id = ? OR p.biller_id = 0)`;
      params.push(billerId);
    }

    if (category_id && category_id !== 'all') {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    if (search && search.trim()) {
      query += ` AND (p.name LIKE ? OR p.code LIKE ? OR p.item_code LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const limit = parseInt(req.query.limit || '300', 10);
    query += ` GROUP BY p.id ORDER BY p.id DESC LIMIT ?`;
    params.push(limit);

    const [products] = await pool.query(query, params);

    // Fetch multi-units for each product
    const productIds = products.map(p => p.id);
    let multiUnitsMap = {};

    if (productIds.length > 0) {
      const [unitRows] = await pool.query(
        `SELECT pu.product_id, pu.unit_id, pu.unit_qty, pu.unit_price, u.name as unit_name, u.code as unit_code, u.operator, u.operation_value
         FROM aura_product_units pu
         JOIN aura_units u ON u.id = pu.unit_id
         WHERE pu.product_id IN (?)`,
        [productIds]
      );

      unitRows.forEach(row => {
        if (!multiUnitsMap[row.product_id]) {
          multiUnitsMap[row.product_id] = [];
        }
        multiUnitsMap[row.product_id].push(row);
      });
    }

    const items = products.map(p => ({
      ...p,
      price: parseFloat(p.price) || 0,
      cost: parseFloat(p.cost) || 0,
      quantity: parseFloat(p.quantity) || 0,
      image_url: p.image && p.image !== 'no_image.png' 
        ? (p.image.startsWith('http') || p.image.startsWith('/assets') ? p.image : `/assets/uploads/${p.image}`)
        : null,
      units: [
        {
          unit_id: p.unit_id || 1,
          unit_name: p.unit_name || 'Piece',
          unit_code: p.unit_code || 'pcs',
          unit_qty: 1,
          unit_price: parseFloat(p.price) || 0,
          operation_value: 1
        },
        ...(multiUnitsMap[p.id] || []).map(u => ({
          unit_id: u.unit_id,
          unit_name: u.unit_name,
          unit_code: u.unit_code,
          unit_qty: parseFloat(u.unit_qty) || 1,
          unit_price: parseFloat(u.unit_price) > 0 ? parseFloat(u.unit_price) : (parseFloat(p.price) * (parseFloat(u.operation_value) || 1)),
          operation_value: parseFloat(u.operation_value) || parseFloat(u.unit_qty) || 1
        }))
      ]
    }));

    return res.json({
      success: true,
      count: items.length,
      products: items
    });
  } catch (error) {
    console.error('[POS] getPosProducts error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. POS Categories Feed
exports.getPosCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      `SELECT c.id, c.code, c.name, COUNT(p.id) as product_count 
       FROM aura_categories c
       LEFT JOIN aura_products p ON p.category_id = c.id
       GROUP BY c.id, c.code, c.name
       ORDER BY product_count DESC, c.name ASC`
    );

    return res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('[POS] getPosCategories error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Customers List
exports.getPosCustomers = async (req, res) => {
  try {
    const [customers] = await pool.query(
      `SELECT id, name, company, phone, email 
       FROM aura_companies 
       WHERE group_name = 'customer' 
       ORDER BY id ASC LIMIT 100`
    );

    return res.json({
      success: true,
      customers
    });
  } catch (error) {
    console.error('[POS] getPosCustomers error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Quick Add Customer
exports.addPosCustomer = async (req, res) => {
  try {
    const { name, phone, email, company } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO aura_companies (group_id, group_name, customer_group_id, customer_group_name, name, company, phone, email) 
       VALUES (3, 'customer', 1, 'General', ?, ?, ?, ?)`,
      [name.trim(), company || name.trim(), phone || '', email || '']
    );

    return res.json({
      success: true,
      customer: {
        id: result.insertId,
        name: name.trim(),
        phone: phone || '',
        company: company || name.trim()
      }
    });
  } catch (error) {
    console.error('[POS] addPosCustomer error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Checkout & Complete POS Sale
exports.checkoutPosSale = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      customer_id,
      customer_name,
      biller_id,
      warehouse_id,
      items,
      subtotal,
      discount_amount,
      tax_amount,
      shipping_amount,
      grand_total,
      paid_amount,
      paid_by,
      payment_note,
      user_id
    } = req.body;

    const scope = await resolveScope(req);
    const uid = user_id || scope.userId;
    const cid = customer_id || 1;
    const cname = customer_name || 'Walk-in Customer';
    let bid = scope.isSuperAdmin ? (biller_id || 1) : (scope.billerId || biller_id || 1);
    let wid = scope.isSuperAdmin ? (warehouse_id || 1) : (scope.warehouseId || warehouse_id || 1);

    if (!wid && bid) {
      const [bRows] = await connection.query('SELECT warehouse_id FROM aura_companies WHERE id = ? LIMIT 1', [bid]);
      if (bRows.length > 0 && bRows[0].warehouse_id) wid = bRows[0].warehouse_id;
    }

    // Generate Unique Invoice Ref (Format: POS-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceNo = `POS-${dateStr}-${randomSuffix}`;

    // 1. Insert into aura_sales
    const [saleResult] = await connection.query(
      `INSERT INTO aura_sales 
       (date, reference_no, customer_id, customer, biller_id, warehouse_id, 
        total, product_discount, order_discount, total_discount, 
        product_tax, order_tax, total_tax, shipping, grand_total, 
        paid, sale_status, payment_status, pos, created_by, note)
       VALUES (NOW(), ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?, ?, ?, ?, 'completed', 'paid', 1, ?, ?)`,
      [
        referenceNo,
        cid,
        cname,
        bid,
        wid,
        parseFloat(subtotal) || 0,
        parseFloat(discount_amount) || 0,
        parseFloat(discount_amount) || 0,
        parseFloat(tax_amount) || 0,
        parseFloat(tax_amount) || 0,
        parseFloat(shipping_amount) || 0,
        parseFloat(grand_total) || 0,
        parseFloat(paid_amount) || parseFloat(grand_total) || 0,
        uid,
        payment_note || 'POS Terminal Sale'
      ]
    );

    const saleId = saleResult.insertId;

    // 2. Insert items into aura_sale_items and decrement product stock
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const itemQty = parseFloat(item.quantity) || 1;
        const itemPrice = parseFloat(item.unit_price || item.price) || 0;
        const subtotalItem = itemQty * itemPrice;
        const unitRatio = parseFloat(item.operation_value) || 1;
        const baseQtyToDeduct = itemQty * unitRatio;

        await connection.query(
          `INSERT INTO aura_sale_items 
           (sale_id, product_id, product_code, product_name, product_type, 
            unit_price, net_unit_price, quantity, warehouse_id, item_tax, 
            subtotal, real_unit_price, product_unit_id, product_unit_code, unit_quantity) 
           VALUES (?, ?, ?, ?, 'standard', ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
          [
            saleId,
            item.id,
            item.code || '',
            item.name,
            itemPrice,
            itemPrice,
            itemQty,
            wid,
            subtotalItem,
            itemPrice,
            item.unit_id || 1,
            item.unit_code || 'pcs',
            baseQtyToDeduct
          ]
        );

        // Overall product stock deduction
        await connection.query(
          `UPDATE aura_products SET quantity = GREATEST(0, quantity - ?) WHERE id = ?`,
          [baseQtyToDeduct, item.id]
        );

        // Per-warehouse stock deduction
        if (wid) {
          await connection.query(
            `INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity)
             VALUES (?, ?, -?)
             ON DUPLICATE KEY UPDATE quantity = quantity - ?`,
            [item.id, wid, baseQtyToDeduct, baseQtyToDeduct]
          );
        }
      }
    }

    // 3. Record payments in aura_payments (Multi-tender split or single payment)
    const paymentRecords = Array.isArray(req.body.payments) && req.body.payments.length > 0
      ? req.body.payments
      : [{
          amount: parseFloat(paid_amount) || parseFloat(grand_total) || 0,
          paid_by: paid_by || 'Cash',
          note: payment_note || 'POS Receipt Checkout',
          cc_no: req.body.cc_no || '',
          cc_holder: req.body.cc_holder || '',
          paying_gift_card_no: req.body.member_card_no || '',
          cheque_no: req.body.cheque_no || ''
        }];

    let totalPaidSum = 0;
    for (let idx = 0; idx < paymentRecords.length; idx++) {
      const p = paymentRecords[idx];
      const pAmt = parseFloat(p.amount) || 0;
      totalPaidSum += pAmt;
      const payRef = `PAY-${referenceNo}-${idx + 1}`;

      await connection.query(
        `INSERT INTO aura_payments 
         (date, biller_id, sale_id, reference_no, amount, paid_by, type, created_by, note, pos_paid, cc_no, cc_holder, cheque_no) 
         VALUES (NOW(), ?, ?, ?, ?, ?, 'received', ?, ?, ?, ?, ?, ?)`,
        [
          bid,
          saleId,
          payRef,
          pAmt,
          p.paid_by || 'Cash',
          uid,
          p.note || payment_note || 'POS Tender',
          pAmt,
          p.cc_no || p.paying_gift_card_no || '',
          p.cc_holder || '',
          p.cheque_no || ''
        ]
      );
    }

    await connection.commit();

    return res.json({
      success: true,
      message: 'Sale completed successfully',
      invoice: {
        sale_id: saleId,
        reference_no: referenceNo,
        date: new Date().toISOString(),
        customer: cname,
        subtotal: parseFloat(subtotal) || 0,
        discount_amount: parseFloat(discount_amount) || 0,
        tax_amount: parseFloat(tax_amount) || 0,
        shipping_amount: parseFloat(shipping_amount) || 0,
        grand_total: parseFloat(grand_total) || 0,
        paid_amount: totalPaidSum,
        change_amount: Math.max(0, totalPaidSum - (parseFloat(grand_total) || 0)),
        paid_by: paymentRecords.map(p => p.paid_by).join(', ') || 'Cash',
        payments: paymentRecords,
        items: items || []
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('[POS] checkoutPosSale error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// 10. List All POS Registers (Shift History)
exports.getRegistersList = async (req, res) => {
  try {
    const scope = await resolveScope(req);
    const { status, user_id, biller_id, limit = 50 } = req.query;
    let query = `
      SELECT r.*, u.username as cashier_username, u.first_name, u.last_name, u.email as cashier_email,
             c.name as biller_name, c.company as biller_company,
             w.name as warehouse_name, w.code as warehouse_code
      FROM aura_pos_register r
      LEFT JOIN aura_users u ON u.id = r.user_id
      LEFT JOIN aura_companies c ON c.id = r.biller_id
      LEFT JOIN aura_warehouses w ON w.id = r.warehouse_id
      WHERE 1=1
    `;
    const params = [];

    if (!scope.isSuperAdmin && scope.billerId) {
      query += ` AND (r.biller_id = ? OR r.user_id = ?)`;
      params.push(scope.billerId, scope.userId);
    } else {
      if (biller_id) {
        query += ` AND r.biller_id = ?`;
        params.push(biller_id);
      }
      if (user_id) {
        query += ` AND r.user_id = ?`;
        params.push(user_id);
      }
    }

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY r.id DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const [rows] = await pool.query(query, params);
    return res.json({
      success: true,
      registers: rows
    });
  } catch (error) {
    console.error('[POS] getRegistersList error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Today's Sale Report Breakdown
exports.getTodaySaleReport = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    // Sales breakdown
    const [salesRows] = await pool.query(`
      SELECT 
        COUNT(s.id) as total_invoices,
        COALESCE(SUM(s.grand_total), 0) as total_sales,
        COALESCE(SUM(s.paid), 0) as total_paid
      FROM aura_sales s
      WHERE DATE(s.date) = ?
    `, [today]);

    // Payment methods breakdown
    const [paymentRows] = await pool.query(`
      SELECT 
        p.paid_by,
        COALESCE(SUM(p.amount), 0) as total_amount
      FROM aura_payments p
      WHERE DATE(p.date) = ?
      GROUP BY p.paid_by
    `, [today]);

    // Expenses
    const [expenseRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM aura_expenses
      WHERE DATE(date) = ?
    `, [today]);

    let cashSales = 0;
    let cardSales = 0;
    let abaSales = 0;
    let chequeSales = 0;

    paymentRows.forEach(p => {
      const type = (p.paid_by || '').toLowerCase();
      if (type.includes('cash')) cashSales += parseFloat(p.total_amount);
      else if (type.includes('card') || type.includes('cc') || type.includes('stripe')) cardSales += parseFloat(p.total_amount);
      else if (type.includes('aba') || type.includes('khqr')) abaSales += parseFloat(p.total_amount);
      else if (type.includes('cheque') || type.includes('ch')) chequeSales += parseFloat(p.total_amount);
    });

    return res.json({
      success: true,
      date: today,
      total_invoices: salesRows[0]?.total_invoices || 0,
      total_sales: parseFloat(salesRows[0]?.total_sales) || 0,
      cash_sales: cashSales,
      card_sales: cardSales,
      aba_sales: abaSales,
      cheque_sales: chequeSales,
      expenses: parseFloat(expenseRows[0]?.total_expenses) || 0,
      net_sales: (parseFloat(salesRows[0]?.total_sales) || 0) - (parseFloat(expenseRows[0]?.total_expenses) || 0)
    });
  } catch (error) {
    console.error('[POS] getTodaySaleReport error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Today's Profit Estimate
exports.getTodayProfit = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query(`
      SELECT 
        COALESCE(SUM(si.subtotal), 0) as gross_revenue,
        COALESCE(SUM(si.quantity * COALESCE(p.cost, si.unit_price * 0.7)), 0) as total_cost
      FROM aura_sale_items si
      JOIN aura_sales s ON s.id = si.sale_id
      LEFT JOIN aura_products p ON p.id = si.product_id
      WHERE DATE(s.date) = ?
    `, [today]);

    const gross = parseFloat(rows[0]?.gross_revenue) || 0;
    const cost = parseFloat(rows[0]?.total_cost) || 0;
    const profit = gross - cost;

    return res.json({
      success: true,
      date: today,
      gross_revenue: gross,
      total_cost: cost,
      net_profit: profit,
      margin_percentage: gross > 0 ? ((profit / gross) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('[POS] getTodayProfit error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 13. Add POS Drawer Expense
exports.addPosExpense = async (req, res) => {
  try {
    const { amount, note, category_id = 1, paid_by = 'Cash', warehouse_id = 1, user_id = 1 } = req.body;
    const expenseAmount = parseFloat(amount) || 0;
    const ref = `EXP-${Date.now().toString().slice(-6)}`;

    const [result] = await pool.query(`
      INSERT INTO aura_expenses 
      (date, reference, amount, paid_by, note, created_by, warehouse_id, category_id, grand_total, payment_status)
      VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 'paid')
    `, [ref, expenseAmount, paid_by, note || 'POS Drawer Expense', user_id, warehouse_id, category_id, expenseAmount]);

    return res.json({
      success: true,
      message: 'Expense added successfully',
      id: result.insertId,
      reference: ref,
      amount: expenseAmount
    });
  } catch (error) {
    console.error('[POS] addPosExpense error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 14. Suspend Sale (Hold Bill)
exports.suspendSale = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { customer_id = 2, customer = 'General Customer', suspend_note = '', items = [], total = 0, biller_id = 1, warehouse_id = 1, user_id = 1 } = req.body;
    const ref = `SUS-${Date.now().toString().slice(-6)}`;

    const [billResult] = await connection.query(`
      INSERT INTO aura_suspended_bills
      (date, refer, customer_id, customer, count, total, biller_id, warehouse_id, created_by, suspend_note)
      VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [ref, customer_id, customer, items.length, parseFloat(total) || 0, biller_id, warehouse_id, user_id, suspend_note]);

    const suspendId = billResult.insertId;

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const qty = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.unit_price || item.price) || 0;
        await connection.query(`
          INSERT INTO aura_suspended_items
          (suspend_id, product_id, product_code, product_name, unit_price, quantity, subtotal, product_unit_code)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [suspendId, item.id, item.code || '', item.name, price, qty, qty * price, item.unit_code || 'pcs']);
      }
    }

    await connection.commit();
    return res.json({
      success: true,
      message: 'Bill suspended successfully',
      suspend_id: suspendId,
      reference: ref
    });
  } catch (error) {
    await connection.rollback();
    console.error('[POS] suspendSale error:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// 15. Get Suspended Sales (Held Bills)
exports.getSuspendedSales = async (req, res) => {
  try {
    const [bills] = await pool.query(`
      SELECT b.*, u.username as cashier_username
      FROM aura_suspended_bills b
      LEFT JOIN aura_users u ON u.id = b.created_by
      ORDER BY b.id DESC LIMIT 50
    `);

    // Fetch items for each bill
    for (const b of bills) {
      const [items] = await pool.query(`
        SELECT * FROM aura_suspended_items WHERE suspend_id = ?
      `, [b.id]);
      b.items = items;
    }

    return res.json({
      success: true,
      bills
    });
  } catch (error) {
    console.error('[POS] getSuspendedSales error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 16. Delete Suspended Sale
exports.deleteSuspendedSale = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM aura_suspended_items WHERE suspend_id = ?', [id]);
    await pool.query('DELETE FROM aura_suspended_bills WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Suspended bill deleted' });
  } catch (error) {
    console.error('[POS] deleteSuspendedSale error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 17. Get Recent POS Sales (Invoices History)
exports.getPosSales = async (req, res) => {
  try {
    const scope = await resolveScope(req);
    const limit = parseInt(req.query.limit || '50', 10);
    const { biller_id, warehouse_id } = req.query;

    let query = `
      SELECT s.*, u.username as cashier_username,
             c.name as biller_name, c.company as biller_company,
             w.name as warehouse_name, w.code as warehouse_code
      FROM aura_sales s
      LEFT JOIN aura_users u ON u.id = s.created_by
      LEFT JOIN aura_companies c ON c.id = s.biller_id
      LEFT JOIN aura_warehouses w ON w.id = s.warehouse_id
      WHERE (s.pos = 1 OR s.pos IS NULL)
    `;
    const params = [];

    if (!scope.isSuperAdmin && scope.billerId) {
      query += ` AND s.biller_id = ?`;
      params.push(scope.billerId);
    } else {
      if (biller_id) {
        query += ` AND s.biller_id = ?`;
        params.push(biller_id);
      }
      if (warehouse_id) {
        query += ` AND s.warehouse_id = ?`;
        params.push(warehouse_id);
      }
    }

    query += ` ORDER BY s.id DESC LIMIT ?`;
    params.push(limit);

    const [sales] = await pool.query(query, params);

    return res.json({
      success: true,
      sales
    });
  } catch (error) {
    console.error('[POS] getPosSales error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 18. Get POS Settings & Hardware / Configuration Master Data
exports.getPosSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM aura_pos_settings LIMIT 1');
    
    // Fetch billers with linked warehouse
    const [billers] = await pool.query(`
      SELECT c.id, c.name, c.company, c.code, c.warehouse_id, w.name as warehouse_name, w.code as warehouse_code
      FROM aura_companies c
      LEFT JOIN aura_warehouses w ON w.id = c.warehouse_id
      WHERE (c.group_name = 'biller' OR c.company_type = 'branch') AND (c.status = 'active' OR c.status IS NULL)
      ORDER BY c.id ASC
    `);

    // Fetch active warehouses
    const [warehouses] = await pool.query(`
      SELECT id, name, code, address FROM aura_warehouses ORDER BY id ASC
    `);

    // Fetch catalog categories
    const [categories] = await pool.query(`
      SELECT id, name, code FROM aura_categories ORDER BY name ASC
    `);

    // Fetch customer directory
    const [customers] = await pool.query(`
      SELECT id, name, company, phone FROM aura_companies WHERE group_name = 'customer' ORDER BY id ASC LIMIT 100
    `);

    return res.json({
      success: true,
      settings: rows[0] || {},
      billers,
      warehouses,
      categories,
      customers
    });
  } catch (error) {
    console.error('[POS] getPosSettings error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 19. Update POS Settings (Matching AURA_v1 Pos.php settings update)
exports.updatePosSettings = async (req, res) => {
  try {
    const rawSettings = req.body || {};
    
    // Allowed columns in aura_pos_settings
    const [columns] = await pool.query('DESCRIBE aura_pos_settings');
    const validFields = new Set(columns.map(c => c.Field));
    
    const updateData = {};
    for (const [key, val] of Object.entries(rawSettings)) {
      if (validFields.has(key) && key !== 'pos_id') {
        updateData[key] = val;
      }
    }

    if (Object.keys(updateData).length > 0) {
      const keys = Object.keys(updateData);
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = keys.map(k => updateData[k]);
      values.push(1); // WHERE pos_id = 1

      await pool.query(`UPDATE aura_pos_settings SET ${setClause} WHERE pos_id = ?`, values);
    }

    const [updated] = await pool.query('SELECT * FROM aura_pos_settings WHERE pos_id = 1');
    return res.json({
      success: true,
      message: 'POS settings updated successfully',
      settings: updated[0] || {}
    });
  } catch (error) {
    console.error('[POS] updatePosSettings error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 20. MEMBER CARDS & LOYALTY (Matching AURA_v1 member_cards.php)
// =========================================================================
exports.getMemberCards = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const search = req.query.search ? `%${req.query.search}%` : null;

    let query = `
      SELECT g.*, c.name as customer_name, c.phone as customer_phone
      FROM aura_gift_cards g
      LEFT JOIN aura_companies c ON c.id = g.customer_id
    `;
    const params = [];

    if (search) {
      query += ` WHERE g.card_no LIKE ? OR g.customer LIKE ? OR c.name LIKE ? OR c.phone LIKE ?`;
      params.push(search, search, search, search);
    }

    query += ` ORDER BY g.id DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, cards: rows });
  } catch (error) {
    console.error('[POS] getMemberCards error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMemberCard = async (req, res) => {
  try {
    const { card_no, value, discount, customer_id, customer, expiry } = req.body;
    const cardNum = card_no || Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
    const val = parseFloat(value) || 0;
    const disc = parseFloat(discount) || 0;
    const exp = expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [result] = await pool.query(`
      INSERT INTO aura_gift_cards (date, card_no, value, discount, customer_id, customer, balance, expiry, created_by)
      VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
    `, [cardNum, val, disc, customer_id || null, customer || '-', val, exp, req.user?.id || 1]);

    const [created] = await pool.query('SELECT * FROM aura_gift_cards WHERE id = ?', [result.insertId]);
    return res.json({ success: true, message: 'Member Card issued successfully', card: created[0] });
  } catch (error) {
    console.error('[POS] addMemberCard error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.validateMemberCard = async (req, res) => {
  try {
    const { card_no } = req.body;
    if (!card_no) return res.status(400).json({ success: false, message: 'Card number is required' });

    const [rows] = await pool.query(`
      SELECT g.*, c.name as customer_name, c.phone as customer_phone
      FROM aura_gift_cards g
      LEFT JOIN aura_companies c ON c.id = g.customer_id
      WHERE g.card_no = ? AND (g.expiry IS NULL OR g.expiry >= CURDATE())
      LIMIT 1
    `, [card_no.trim()]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member card not found or expired' });
    }

    const card = rows[0];
    return res.json({
      success: true,
      card,
      balance: parseFloat(card.balance) || 0,
      discount_percentage: parseFloat(card.discount) || 0
    });
  } catch (error) {
    console.error('[POS] validateMemberCard error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 21. COUPONS & PROMOTION VOUCHERS (Matching AURA_v1 coupon.php)
// =========================================================================
exports.getCoupons = async (req, res) => {
  try {
    const [coupons] = await pool.query(`
      SELECT cp.*, c.name as customer_name
      FROM aura_coupon cp
      LEFT JOIN aura_companies c ON c.id = cp.customer_id
      ORDER BY cp.id DESC LIMIT 50
    `);
    return res.json({ success: true, coupons });
  } catch (error) {
    console.error('[POS] getCoupons error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addCoupon = async (req, res) => {
  try {
    const { card_no, value, expiry, customer_id, customer } = req.body;
    const code = card_no || 'COUPON-' + Math.floor(1000 + Math.random() * 9000);
    const val = parseFloat(value) || 0;
    const exp = expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [result] = await pool.query(`
      INSERT INTO aura_coupon (date, card_no, value, used, customer_id, customer, expiry, created_by)
      VALUES (NOW(), ?, ?, 0, ?, ?, ?, ?)
    `, [code, val, customer_id || null, customer || '-', exp, req.user?.id || 1]);

    const [created] = await pool.query('SELECT * FROM aura_coupon WHERE id = ?', [result.insertId]);
    return res.json({ success: true, message: 'Coupon created successfully', coupon: created[0] });
  } catch (error) {
    console.error('[POS] addCoupon error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required' });

    const [rows] = await pool.query(`
      SELECT * FROM aura_coupon 
      WHERE card_no = ? AND used = 0 AND (expiry IS NULL OR expiry >= CURDATE())
      LIMIT 1
    `, [code.trim()]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid, used, or expired coupon code' });
    }

    const coupon = rows[0];
    return res.json({
      success: true,
      coupon,
      discount_value: parseFloat(coupon.value) || 0
    });
  } catch (error) {
    console.error('[POS] validateCoupon error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 22. CUSTOMER STOCKS (Matching AURA_v1 customer_stocks.php)
// =========================================================================
exports.getCustomerStocks = async (req, res) => {
  try {
    const customerId = req.query.customer_id;
    let query = `
      SELECT cs.*, c.name as customer_name, c.phone as customer_phone,
             w.name as warehouse_name
      FROM aura_customer_stocks cs
      LEFT JOIN aura_companies c ON c.id = cs.customer_id
      LEFT JOIN aura_warehouses w ON w.id = cs.warehouse_id
    `;
    const params = [];
    if (customerId) {
      query += ` WHERE cs.customer_id = ?`;
      params.push(customerId);
    }
    query += ` ORDER BY cs.id DESC LIMIT 50`;

    const [stocks] = await pool.query(query, params);

    // Fetch items for each customer stock
    for (const stock of stocks) {
      const [items] = await pool.query(`
        SELECT csi.*, p.name as product_name, p.code as product_code, p.image as product_image
        FROM aura_customer_stock_items csi
        LEFT JOIN aura_products p ON p.id = csi.product_id
        WHERE csi.customer_stock_id = ?
      `, [stock.id]);
      stock.items = items;
    }

    return res.json({ success: true, customer_stocks: stocks });
  } catch (error) {
    console.error('[POS] getCustomerStocks error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addCustomerStock = async (req, res) => {
  try {
    const { customer_id, customer, items, note, warehouse_id, table_id } = req.body;
    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and items are required' });
    }

    const ref = 'CS-' + Date.now();
    const [result] = await pool.query(`
      INSERT INTO aura_customer_stocks (date, reference_no, customer_id, customer, warehouse_id, table_id, note, created_by, status)
      VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [ref, customer_id, customer || '-', warehouse_id || 1, table_id || null, note || '', req.user?.id || 1]);

    const stockId = result.insertId;

    for (const it of items) {
      await pool.query(`
        INSERT INTO aura_customer_stock_items 
        (customer_stock_id, product_id, quantity, warehouse_id, product_unit_code, serial_no)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [stockId, it.product_id || it.id, it.quantity || 1, warehouse_id || 1, it.unit_name || 'Unit', it.serial_no || '']);
    }

    return res.json({ success: true, message: 'Customer stock deposited successfully', stock_id: stockId, reference_no: ref });
  } catch (error) {
    console.error('[POS] addCustomerStock error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.redeemCustomerStock = async (req, res) => {
  try {
    const { stock_item_id, redeem_quantity } = req.body;
    const qty = parseFloat(redeem_quantity) || 1;

    const [rows] = await pool.query(`SELECT * FROM aura_customer_stock_items WHERE id = ?`, [stock_item_id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Stock item not found' });

    const item = rows[0];
    const rem = parseFloat(item.quantity) - qty;
    if (rem < 0) return res.status(400).json({ success: false, message: 'Redeem quantity exceeds deposited quantity' });

    if (rem === 0) {
      await pool.query(`UPDATE aura_customer_stock_items SET quantity = 0 WHERE id = ?`, [stock_item_id]);
    } else {
      await pool.query(`UPDATE aura_customer_stock_items SET quantity = ? WHERE id = ?`, [rem, stock_item_id]);
    }

    return res.json({ success: true, message: 'Customer stock item redeemed successfully', remaining: rem });
  } catch (error) {
    console.error('[POS] redeemCustomerStock error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 23. PRINTERS CONFIGURATION (Matching AURA_v1 printers.php)
// =========================================================================
exports.getPrinters = async (req, res) => {
  try {
    const [printers] = await pool.query('SELECT * FROM aura_printers ORDER BY id ASC');
    return res.json({ success: true, printers });
  } catch (error) {
    console.error('[POS] getPrinters error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.savePrinter = async (req, res) => {
  try {
    const { id, title, type, profile, char_per_line, path, ip_address, port } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Printer title is required' });

    if (id) {
      await pool.query(`
        UPDATE aura_printers SET title=?, type=?, profile=?, char_per_line=?, path=?, ip_address=?, port=?
        WHERE id = ?
      `, [title, type || 'network', profile || 'default', char_per_line || 48, path || '', ip_address || '', port || 9100, id]);
      return res.json({ success: true, message: 'Printer profile updated successfully' });
    } else {
      const [result] = await pool.query(`
        INSERT INTO aura_printers (title, type, profile, char_per_line, path, ip_address, port)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [title, type || 'network', profile || 'default', char_per_line || 48, path || '', ip_address || '', port || 9100]);
      return res.json({ success: true, message: 'Printer profile created successfully', id: result.insertId });
    }
  } catch (error) {
    console.error('[POS] savePrinter error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePrinter = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM aura_printers WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Printer profile deleted' });
  } catch (error) {
    console.error('[POS] deletePrinter error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 24. SALE RECEIPT DETAILS (For Standard, Dual, Tri-Currency & Kitchen Printing)
// =========================================================================
exports.getSaleReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const [sales] = await pool.query(`
      SELECT s.*, 
             u.username as cashier_username, u.first_name as cashier_first_name, u.last_name as cashier_last_name,
             c.name as customer_name, c.phone as customer_phone, c.address as customer_address,
             b.name as biller_name, b.company as biller_company, b.address as biller_address, b.phone as biller_phone, b.logo as biller_logo
      FROM aura_sales s
      LEFT JOIN aura_users u ON u.id = s.created_by
      LEFT JOIN aura_companies c ON c.id = s.customer_id
      LEFT JOIN aura_companies b ON b.id = s.biller_id
      WHERE s.id = ?
      LIMIT 1
    `, [id]);

    if (sales.length === 0) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    const sale = sales[0];

    const [items] = await pool.query(`
      SELECT si.*, p.name as product_name, p.code as product_code, p.image as product_image
      FROM aura_sale_items si
      LEFT JOIN aura_products p ON p.id = si.product_id
      WHERE si.sale_id = ?
    `, [id]);

    const [payments] = await pool.query(`
      SELECT * FROM aura_payments WHERE sale_id = ? ORDER BY id ASC
    `, [id]);

    return res.json({
      success: true,
      sale,
      items,
      payments
    });
  } catch (error) {
    console.error('[POS] getSaleReceipt error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
