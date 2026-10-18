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

// 1. Check current active register for user/biller
exports.getCurrentRegister = async (req, res) => {
  try {
    const userId = req.query.user_id || req.user?.id || 1;
    
    // Find latest open register for this cashier
    const [rows] = await pool.query(
      `SELECT r.*, u.username as cashier_username, u.first_name, u.last_name 
       FROM aura_pos_register r
       LEFT JOIN aura_users u ON u.id = r.user_id
       WHERE r.user_id = ? AND r.status = 'open' 
       ORDER BY r.id DESC LIMIT 1`,
      [userId]
    );

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
    const { cash_in_hand, user_id, note, biller_id, warehouse_id } = req.body;
    const uid = user_id || 1;
    const cashAmount = parseFloat(cash_in_hand) || 0;

    // Verify if already has an open register
    const [existing] = await pool.query(
      "SELECT id FROM aura_pos_register WHERE user_id = ? AND status = 'open' LIMIT 1",
      [uid]
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: 'Register is already open',
        register_id: existing[0].id
      });
    }

    const [result] = await pool.query(
      `INSERT INTO aura_pos_register 
       (date, user_id, cash_in_hand, status, note, pushed) 
       VALUES (NOW(), ?, ?, 'open', ?, 0)`,
      [uid, cashAmount, note || '']
    );

    const [newReg] = await pool.query(
      "SELECT * FROM aura_pos_register WHERE id = ?",
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

    if (!register_id) {
      return res.status(400).json({ success: false, message: 'Register ID is required' });
    }

    const cashSubmitted = parseFloat(total_cash_submitted) || 0;
    const cardSlips = parseInt(total_cc_slips_submitted, 10) || 0;
    const cheques = parseInt(total_cheques_submitted, 10) || 0;
    const uid = closed_by || 1;

    // Fetch register to calculate totals
    const [regs] = await pool.query("SELECT * FROM aura_pos_register WHERE id = ?", [register_id]);
    if (regs.length === 0) {
      return res.status(404).json({ success: false, message: 'Register not found' });
    }
    const register = regs[0];

    // Compute sales in period
    const [salesSummary] = await pool.query(
      `SELECT COALESCE(SUM(paid), 0) as total_cash
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
        register_id
      ]
    );

    const [updated] = await pool.query("SELECT * FROM aura_pos_register WHERE id = ?", [register_id]);

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

// 5. Products Catalog Feed for POS (with units and categories)
exports.getPosProducts = async (req, res) => {
  try {
    const { category_id, search } = req.query;

    let query = `
      SELECT 
        p.id, 
        p.code, 
        p.name, 
        p.price, 
        p.cost, 
        p.quantity, 
        p.image, 
        p.category_id, 
        p.unit as unit_id,
        p.sale_unit,
        c.name as category_name,
        u.name as unit_name,
        u.code as unit_code
      FROM aura_products p
      LEFT JOIN aura_categories c ON c.id = p.category_id
      LEFT JOIN aura_units u ON u.id = p.unit
      WHERE 1=1
    `;

    const params = [];

    if (category_id && category_id !== 'all') {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    if (search && search.trim()) {
      query += ` AND (p.name LIKE ? OR p.code LIKE ? OR p.item_code LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY p.id DESC LIMIT 300`;

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

    const uid = user_id || 1;
    const cid = customer_id || 1;
    const cname = customer_name || 'Walk-in Customer';
    const bid = biller_id || 1;
    const wid = warehouse_id || 1;

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

        // Stock deduction
        await connection.query(
          `UPDATE aura_products SET quantity = GREATEST(0, quantity - ?) WHERE id = ?`,
          [baseQtyToDeduct, item.id]
        );
      }
    }

    // 3. Record payment in aura_payments
    const finalPaid = parseFloat(paid_amount) || parseFloat(grand_total) || 0;
    await connection.query(
      `INSERT INTO aura_payments 
       (date, sale_id, reference_no, amount, paid_by, type, created_by, note, pos_paid) 
       VALUES (NOW(), ?, ?, ?, ?, 'received', ?, ?, ?)`,
      [
        saleId,
        `PAY-${referenceNo}`,
        finalPaid,
        paid_by || 'Cash',
        uid,
        payment_note || 'POS Receipt Checkout',
        finalPaid
      ]
    );

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
        paid_amount: finalPaid,
        change_amount: Math.max(0, finalPaid - (parseFloat(grand_total) || 0)),
        paid_by: paid_by || 'Cash',
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
    const { status, user_id, limit = 50 } = req.query;
    let query = `
      SELECT r.*, u.username as cashier_username, u.first_name, u.last_name, u.email as cashier_email
      FROM aura_pos_register r
      LEFT JOIN aura_users u ON u.id = r.user_id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }
    if (user_id) {
      query += ` AND r.user_id = ?`;
      params.push(user_id);
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
    const limit = parseInt(req.query.limit || '50', 10);
    const [sales] = await pool.query(`
      SELECT s.*, u.username as cashier_username
      FROM aura_sales s
      LEFT JOIN aura_users u ON u.id = s.created_by
      WHERE s.pos = 1 OR s.pos IS NULL
      ORDER BY s.id DESC LIMIT ?
    `, [limit]);

    return res.json({
      success: true,
      sales
    });
  } catch (error) {
    console.error('[POS] getPosSales error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 18. Get POS Settings
exports.getPosSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM aura_pos_settings LIMIT 1');
    return res.json({
      success: true,
      settings: rows[0] || {}
    });
  } catch (error) {
    console.error('[POS] getPosSettings error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 19. Update POS Settings
exports.updatePosSettings = async (req, res) => {
  try {
    const settings = req.body;
    await pool.query(`
      UPDATE aura_pos_settings SET ? WHERE pos_id = 1
    `, [settings]);
    return res.json({ success: true, message: 'POS settings updated successfully' });
  } catch (error) {
    console.error('[POS] updatePosSettings error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
