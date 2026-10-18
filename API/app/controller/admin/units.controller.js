const db = require('../../config/utill/connection');
const { logError } = require('../../config/utill/logErr');
const { unitToBaseQty, baseToUnitQty, convertToBasePrice, convertFromBasePrice, convertUnitToString } = require('../../utils/unitConverter');

/**
 * GET /api/admin/units
 * Retrieve all units with base unit hierarchy and usage counts
 */
exports.getUnits = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id, 
        u.code, 
        u.name, 
        u.base_unit, 
        b.name AS base_unit_name, 
        b.code AS base_unit_code,
        u.operator, 
        u.unit_value, 
        u.operation_value,
        (SELECT COUNT(*) FROM aura_products p WHERE p.unit = u.id OR p.sale_unit = u.id OR p.purchase_unit = u.id) AS product_count,
        (SELECT COUNT(*) FROM aura_units sub WHERE sub.base_unit = u.id) AS sub_unit_count
      FROM aura_units u
      LEFT JOIN aura_units b ON b.id = u.base_unit
      ORDER BY COALESCE(u.base_unit, u.id), u.base_unit IS NOT NULL, u.id
    `);

    res.json({
      status: true,
      data: rows
    });
  } catch (err) {
    logError('units.controller.getUnits', err, res);
  }
};

/**
 * GET /api/admin/units/base
 * Retrieve only base units (where base_unit IS NULL or 0)
 */
exports.getBaseUnits = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, code, name 
      FROM aura_units 
      WHERE base_unit IS NULL OR base_unit = 0 
      ORDER BY name ASC
    `);

    res.json({
      status: true,
      data: rows
    });
  } catch (err) {
    logError('units.controller.getBaseUnits', err, res);
  }
};

/**
 * GET /api/admin/units/sub-units/:baseUnitId
 * Retrieve sub-units linked to a given base unit
 */
exports.getSubUnits = async (req, res) => {
  try {
    const { baseUnitId } = req.params;
    const [rows] = await db.query(`
      SELECT id, code, name, base_unit, operator, operation_value
      FROM aura_units
      WHERE base_unit = ?
      ORDER BY CAST(operation_value AS DECIMAL(15,4)) DESC
    `, [baseUnitId]);

    res.json({
      status: true,
      data: rows
    });
  } catch (err) {
    logError('units.controller.getSubUnits', err, res);
  }
};

/**
 * POST /api/admin/units
 * Create a new unit (either base unit or sub-unit with operator & operation_value)
 */
exports.createUnit = async (req, res) => {
  try {
    const { code, name, base_unit, operator, operation_value } = req.body;

    if (!code || !name) {
      return res.status(400).json({ status: false, message: 'Unit code and name are required' });
    }

    // Check duplicate code
    const [existing] = await db.query('SELECT id FROM aura_units WHERE code = ? LIMIT 1', [code.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ status: false, message: `Unit code '${code}' already exists` });
    }

    const isSubUnit = base_unit && parseInt(base_unit, 10) > 0;
    const buId = isSubUnit ? parseInt(base_unit, 10) : null;
    const op = isSubUnit ? (operator || '*') : null;
    const opVal = isSubUnit ? (operation_value || '1').toString() : null;

    const [result] = await db.query(`
      INSERT INTO aura_units (code, name, base_unit, operator, operation_value)
      VALUES (?, ?, ?, ?, ?)
    `, [code.trim(), name.trim(), buId, op, opVal]);

    res.status(201).json({
      status: true,
      message: 'Unit created successfully',
      data: { id: result.insertId, code, name, base_unit: buId, operator: op, operation_value: opVal }
    });
  } catch (err) {
    logError('units.controller.createUnit', err, res);
  }
};

/**
 * PUT /api/admin/units/:id
 * Update an existing unit
 */
exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, base_unit, operator, operation_value } = req.body;

    const [unit] = await db.query('SELECT * FROM aura_units WHERE id = ?', [id]);
    if (!unit.length) {
      return res.status(404).json({ status: false, message: 'Unit not found' });
    }

    // Check code duplication excluding self
    if (code) {
      const [duplicate] = await db.query('SELECT id FROM aura_units WHERE code = ? AND id != ? LIMIT 1', [code.trim(), id]);
      if (duplicate.length > 0) {
        return res.status(400).json({ status: false, message: `Unit code '${code}' is already used by another unit` });
      }
    }

    const isSubUnit = base_unit && parseInt(base_unit, 10) > 0;
    const buId = isSubUnit ? parseInt(base_unit, 10) : null;
    const op = isSubUnit ? (operator || '*') : null;
    const opVal = isSubUnit ? (operation_value || '1').toString() : null;

    await db.query(`
      UPDATE aura_units SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        base_unit = ?,
        operator = ?,
        operation_value = ?
      WHERE id = ?
    `, [code ? code.trim() : null, name ? name.trim() : null, buId, op, opVal, id]);

    res.json({
      status: true,
      message: 'Unit updated successfully'
    });
  } catch (err) {
    logError('units.controller.updateUnit', err, res);
  }
};

/**
 * DELETE /api/admin/units/:id
 * Delete unit with safety dependency checks
 */
exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any sub-units depend on this unit
    const [childUnits] = await db.query('SELECT COUNT(*) as count FROM aura_units WHERE base_unit = ?', [id]);
    if (childUnits[0]?.count > 0) {
      return res.status(400).json({
        status: false,
        message: 'Cannot delete unit because other sub-units depend on it as their base unit.'
      });
    }

    // Check if products use this unit
    const [products] = await db.query(
      'SELECT COUNT(*) as count FROM aura_products WHERE unit = ? OR sale_unit = ? OR purchase_unit = ?',
      [id, id, id]
    );
    if (products[0]?.count > 0) {
      return res.status(400).json({
        status: false,
        message: 'Cannot delete unit because it is currently assigned to existing products.'
      });
    }

    await db.query('DELETE FROM aura_units WHERE id = ?', [id]);

    res.json({
      status: true,
      message: 'Unit deleted successfully'
    });
  } catch (err) {
    logError('units.controller.deleteUnit', err, res);
  }
};

/**
 * GET /api/admin/products/:id/units
 * Retrieve multi-unit configuration and price overrides for a product
 * Exactly replicates Site::getUnitsDetailsByProduct in AURA_v1
 */
exports.getProductUnits = async (req, res) => {
  try {
    const { id: productId } = req.params;

    const [productRows] = await db.query(`
      SELECT id, code, name, cost, price, unit, sale_unit, purchase_unit 
      FROM aura_products 
      WHERE id = ?
    `, [productId]);

    if (!productRows.length) {
      return res.status(404).json({ status: false, message: 'Product not found' });
    }

    const product = productRows[0];
    const baseUnitId = product.unit;

    if (!baseUnitId) {
      return res.json({
        status: true,
        data: {
          product,
          baseUnit: null,
          units: []
        }
      });
    }

    // Fetch Base Unit + all derived sub-units
    const [units] = await db.query(`
      SELECT 
        u.id, 
        u.code, 
        u.name, 
        u.base_unit, 
        u.operator, 
        u.operation_value,
        CASE WHEN u.id = ? THEN 1 ELSE COALESCE(CAST(u.operation_value AS DECIMAL(15,4)), 1) END AS unit_qty,
        COALESCE(cp.price, CASE WHEN u.id = ? THEN ? ELSE NULL END) AS unit_price,
        COALESCE(cp.cost, CASE WHEN u.id = ? THEN ? ELSE NULL END) AS unit_cost,
        cp.product_code AS unit_barcode
      FROM aura_units u
      LEFT JOIN aura_cost_price_by_units cp 
        ON cp.unit_id = u.id AND cp.product_id = ?
      WHERE u.id = ? OR u.base_unit = ?
      ORDER BY (u.id = ?) DESC, CAST(u.operation_value AS DECIMAL(15,4)) DESC
    `, [
      baseUnitId,
      baseUnitId, product.price || 0,
      baseUnitId, product.cost || 0,
      productId,
      baseUnitId, baseUnitId,
      baseUnitId
    ]);

    // Format human-readable string representation of default stock
    const [stockRows] = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) AS total_base_qty FROM aura_warehouses_products WHERE product_id = ?',
      [productId]
    );
    const totalBaseQty = stockRows[0]?.total_base_qty || 0;
    const stockString = convertUnitToString(totalBaseQty, units);

    res.json({
      status: true,
      data: {
        product,
        baseUnitId,
        totalBaseQty,
        stockFormatted: stockString,
        units
      }
    });
  } catch (err) {
    logError('units.controller.getProductUnits', err, res);
  }
};

/**
 * PUT /api/admin/products/:id/units
 * Save multi-unit pricing and packaging barcodes for a product
 */
exports.saveProductUnits = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { unit, sale_unit, purchase_unit, unitPrices = [] } = req.body;

    // Update product base units
    await db.query(`
      UPDATE aura_products SET
        unit = COALESCE(?, unit),
        sale_unit = COALESCE(?, sale_unit),
        purchase_unit = COALESCE(?, purchase_unit)
      WHERE id = ?
    `, [unit, sale_unit, purchase_unit, productId]);

    // Update or insert cost_price_by_units & product_units for each defined unit
    for (const item of unitPrices) {
      if (!item.unit_id) continue;

      const unitId = item.unit_id;
      const cost = parseFloat(item.cost) || 0;
      const price = parseFloat(item.price) || 0;
      const barcode = item.product_code || item.barcode || null;
      const unitQty = parseFloat(item.unit_qty || item.operation_value || 1);

      // Check existing cost_price_by_units
      const [existingCp] = await db.query(
        'SELECT id FROM aura_cost_price_by_units WHERE product_id = ? AND unit_id = ? LIMIT 1',
        [productId, unitId]
      );

      if (existingCp.length > 0) {
        await db.query(`
          UPDATE aura_cost_price_by_units SET
            cost = ?,
            price = ?,
            product_code = ?
          WHERE id = ?
        `, [cost, price, barcode, existingCp[0].id]);
      } else {
        await db.query(`
          INSERT INTO aura_cost_price_by_units (product_id, unit_id, cost, price, product_code)
          VALUES (?, ?, ?, ?, ?)
        `, [productId, unitId, cost, price, barcode]);
      }

      // Check existing aura_product_units
      const [existingPu] = await db.query(
        'SELECT id FROM aura_product_units WHERE product_id = ? AND unit_id = ? LIMIT 1',
        [productId, unitId]
      );

      if (existingPu.length > 0) {
        await db.query(`
          UPDATE aura_product_units SET
            unit_qty = ?,
            unit_price = ?
          WHERE id = ?
        `, [unitQty, price, existingPu[0].id]);
      } else {
        await db.query(`
          INSERT INTO aura_product_units (product_id, unit_id, unit_qty, unit_price)
          VALUES (?, ?, ?, ?)
        `, [productId, unitId, unitQty, price]);
      }
    }

    res.json({
      status: true,
      message: 'Product multi-unit configuration saved successfully'
    });
  } catch (err) {
    logError('units.controller.saveProductUnits', err, res);
  }
};
