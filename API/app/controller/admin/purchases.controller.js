const db = require("../../config/utill/connection");
const { logError } = require("../../config/utill/logErr");

/**
 * GET /api/admin/purchases
 */
exports.getPurchases = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT 
        p.*,
        c.name AS supplier_name,
        c.email AS supplier_email,
        c.phone AS supplier_phone
      FROM aura_purchases p
      LEFT JOIN aura_companies c ON p.supplier_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (p.reference_no LIKE ? OR p.supplier LIKE ? OR c.name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (status && status !== 'all') {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY p.id DESC`;

    const numLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    const numOffset = (Math.max(parseInt(page) || 1, 1) - 1) * numLimit;
    query += ` LIMIT ${numLimit} OFFSET ${numOffset}`;

    const [rows] = await db.query(query, params);

    const [statsRows] = await db.query(`
      SELECT 
        COUNT(*) AS total_purchases,
        COALESCE(SUM(grand_total), 0) AS total_spend,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) AS received_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count
      FROM aura_purchases
    `);

    const stats = statsRows[0] || {};

    res.json({
      status: true,
      data: rows.map(p => ({
        id: p.id,
        key: p.id,
        referenceNo: p.reference_no,
        date: p.date,
        supplier: p.supplier || p.supplier_name || 'General Supplier',
        status: p.status || 'received',
        total: parseFloat(p.grand_total || 0),
        paid: parseFloat(p.paid || 0),
        balance: parseFloat(p.grand_total || 0) - parseFloat(p.paid || 0),
        payment_status: p.payment_status || 'due'
      })),
      metrics: {
        totalPurchases: parseInt(stats.total_purchases) || 0,
        totalSpend: parseFloat(stats.total_spend) || 0,
        received: parseInt(stats.received_count) || 0,
        pending: parseInt(stats.pending_count) || 0
      }
    });
  } catch (err) {
    logError("purchases.controller.getPurchases", err, res);
  }
};

/**
 * POST /api/admin/purchases
 * Create a new purchase with multi-unit conversion and warehouse stock ledger addition
 */
exports.createPurchase = async (req, res) => {
  try {
    const {
      reference_no,
      supplier_id = 1,
      supplier = 'General Supplier',
      warehouse_id = 1,
      note = '',
      status = 'received',
      payment_status = 'due',
      paid = 0,
      grand_total,
      items = []
    } = req.body;

    const { unitToBaseQty, convertToBasePrice } = require('../../utils/unitConverter');

    const refNo = reference_no || `PO-${Date.now().toString().slice(-6)}`;
    const calcGrandTotal = parseFloat(grand_total) || items.reduce((acc, it) => acc + (parseFloat(it.quantity || 1) * parseFloat(it.unit_cost || 0)), 0);

    const [purchaseRes] = await db.query(`
      INSERT INTO aura_purchases 
      (reference_no, supplier_id, supplier, warehouse_id, note, total, grand_total, paid, status, payment_status, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      refNo,
      parseInt(supplier_id) || 1,
      supplier,
      parseInt(warehouse_id) || 1,
      note,
      calcGrandTotal,
      calcGrandTotal,
      parseFloat(paid) || 0,
      status,
      payment_status
    ]);

    const newPurchaseId = purchaseRes.insertId;
    const whId = parseInt(warehouse_id) || 1;

    for (const item of items) {
      const prodId = parseInt(item.product_id) || 0;
      let unitId = item.product_unit_id || item.unit_id || null;
      let unitCode = item.product_unit_code || item.unit_code || null;
      let unitObj = null;

      if (unitId) {
        const [uRows] = await db.query('SELECT * FROM aura_units WHERE id = ?', [unitId]);
        if (uRows.length) {
          unitObj = uRows[0];
          unitCode = unitObj.code;
        }
      } else if (prodId) {
        const [pRows] = await db.query('SELECT p.purchase_unit, p.unit, u.code, u.operator, u.operation_value FROM aura_products p LEFT JOIN aura_units u ON u.id = COALESCE(p.purchase_unit, p.unit) WHERE p.id = ?', [prodId]);
        if (pRows.length && pRows[0].code) {
          unitId = pRows[0].purchase_unit || pRows[0].unit;
          unitCode = pRows[0].code;
          unitObj = pRows[0];
        }
      }

      const itemQty = parseFloat(item.quantity) || 1;
      const baseUnitQty = unitToBaseQty(itemQty, unitObj);
      const unitCost = parseFloat(item.unit_cost) || 0;
      const baseUnitCost = convertToBasePrice(unitCost, unitObj);
      const subtotal = parseFloat(item.subtotal || (itemQty * unitCost)) || 0;

      await db.query(`
        INSERT INTO aura_purchase_items 
        (purchase_id, product_id, product_code, product_name, product_unit_id, product_unit_code, warehouse_id, quantity, unit_quantity, unit_cost, real_unit_cost, net_unit_cost, base_unit_cost, subtotal, status, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        newPurchaseId,
        prodId,
        item.product_code || '',
        item.product_name || 'Item',
        unitId,
        unitCode,
        whId,
        itemQty,
        baseUnitQty,
        unitCost,
        unitCost,
        unitCost,
        baseUnitCost,
        subtotal,
        status
      ]);

      // If status is received, increment warehouse stock in base units
      if (status === 'received' && prodId) {
        const [existingStock] = await db.query(
          'SELECT id FROM aura_warehouses_products WHERE product_id = ? AND warehouse_id = ? LIMIT 1',
          [prodId, whId]
        );

        if (existingStock.length > 0) {
          await db.query(`
            UPDATE aura_warehouses_products 
            SET quantity = quantity + ? 
            WHERE product_id = ? AND warehouse_id = ?
          `, [baseUnitQty, prodId, whId]);
        } else {
          await db.query(`
            INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity)
            VALUES (?, ?, ?)
          `, [prodId, whId, baseUnitQty]);
        }
      }
    }

    res.status(201).json({
      status: true,
      message: 'Purchase created successfully',
      data: {
        id: newPurchaseId,
        referenceNo: refNo,
        grandTotal: calcGrandTotal,
        status
      }
    });
  } catch (err) {
    logError("purchases.controller.createPurchase", err, res);
  }
};

