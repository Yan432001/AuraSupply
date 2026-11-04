const db = require('../../config/utill/connection');
const { logError } = require('../../config/utill/logErr');
const { convertUnitToString } = require('../../utils/unitConverter');

/**
 * UnitsModel - Replicates unit functions from AURA_v1:
 * - bpas/models/admin/Settings_model.php
 * - bpas/models/Site.php
 */
class UnitsModel {
  /**
   * Retrieve all units with base unit join and usage counts
   * Replicates System_settings::getUnits()
   */
  static async getUnits() {
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
      GROUP BY u.id
      ORDER BY COALESCE(u.base_unit, u.id), u.base_unit IS NOT NULL, u.id ASC
    `);
    return rows;
  }

  /**
   * Retrieve all base units (where base_unit IS NULL or 0)
   * Replicates Site::getAllBaseUnits()
   */
  static async getAllBaseUnits() {
    const [rows] = await db.query(`
      SELECT id, code, name, base_unit, operator, unit_value, operation_value
      FROM aura_units
      WHERE base_unit IS NULL OR base_unit = 0
      ORDER BY name ASC
    `);
    return rows;
  }

  /**
   * Retrieve a base unit and all its sub-units ordered by id ASC
   * Replicates Site::getUnitsByBUID($base_unit)
   */
  static async getUnitsByBUID(baseUnitId) {
    const buId = parseInt(baseUnitId, 10);
    if (!buId) return [];

    const [rows] = await db.query(`
      SELECT id, code, name, base_unit, operator, unit_value, operation_value
      FROM aura_units
      WHERE id = ? OR base_unit = ?
      GROUP BY id
      ORDER BY (id = ?) DESC, id ASC
    `, [buId, buId, buId]);
    return rows;
  }

  /**
   * Retrieve only child sub-units for a given base_unit
   * Replicates Settings_model::getUnitChildren($base_unit)
   */
  static async getUnitChildren(baseUnitId) {
    const [rows] = await db.query(`
      SELECT id, code, name, base_unit, operator, unit_value, operation_value
      FROM aura_units
      WHERE base_unit = ?
      ORDER BY CAST(operation_value AS DECIMAL(15,4)) DESC, id ASC
    `, [baseUnitId]);
    return rows;
  }

  /**
   * Get single unit by ID
   * Replicates Site::getUnitByID($id)
   */
  static async getUnitByID(id) {
    const [rows] = await db.query(`
      SELECT u.*, b.name AS base_unit_name, b.code AS base_unit_code
      FROM aura_units u
      LEFT JOIN aura_units b ON b.id = u.base_unit
      WHERE u.id = ?
      LIMIT 1
    `, [id]);
    return rows[0] || null;
  }

  /**
   * Get single unit by code
   * Replicates Site::getUnitByCode($code)
   */
  static async getUnitByCode(code) {
    if (!code) return null;
    const [rows] = await db.query(
      'SELECT * FROM aura_units WHERE code = ? LIMIT 1',
      [String(code).trim()]
    );
    return rows[0] || null;
  }

  /**
   * Add a new unit
   * Replicates Settings_model::addUnit($data)
   */
  static async addUnit(data) {
    const isSubUnit = data.base_unit && parseInt(data.base_unit, 10) > 0;
    const buId = isSubUnit ? parseInt(data.base_unit, 10) : null;
    const op = isSubUnit ? (data.operator || '*') : null;
    const opVal = isSubUnit ? String(data.operation_value ?? '1').trim() : null;
    const unitVal = isSubUnit ? String(data.unit_value ?? opVal ?? '1').trim() : null;

    const [result] = await db.query(`
      INSERT INTO aura_units (code, name, base_unit, operator, unit_value, operation_value)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      String(data.code).trim(),
      String(data.name).trim(),
      buId,
      op,
      unitVal,
      opVal
    ]);

    return {
      id: result.insertId,
      code: String(data.code).trim(),
      name: String(data.name).trim(),
      base_unit: buId,
      operator: op,
      unit_value: unitVal,
      operation_value: opVal
    };
  }

  /**
   * Update an existing unit
   * Replicates Settings_model::updateUnit($id, $data)
   */
  static async updateUnit(id, data) {
    const isSubUnit = data.base_unit && parseInt(data.base_unit, 10) > 0;
    const buId = isSubUnit ? parseInt(data.base_unit, 10) : null;
    const op = isSubUnit ? (data.operator || '*') : null;
    const opVal = isSubUnit ? String(data.operation_value ?? '1').trim() : null;
    const unitVal = isSubUnit ? String(data.unit_value ?? opVal ?? '1').trim() : null;

    await db.query(`
      UPDATE aura_units SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        base_unit = ?,
        operator = ?,
        unit_value = ?,
        operation_value = ?
      WHERE id = ?
    `, [
      data.code ? String(data.code).trim() : null,
      data.name ? String(data.name).trim() : null,
      buId,
      op,
      unitVal,
      opVal,
      id
    ]);

    return this.getUnitByID(id);
  }

  /**
   * Delete a unit by ID
   * Replicates Settings_model::deleteUnit($id)
   */
  static async deleteUnit(id) {
    const [res] = await db.query('DELETE FROM aura_units WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }

  /**
   * Count products assigned to a unit
   */
  static async countProductsUsingUnit(id) {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS count FROM aura_products WHERE unit = ? OR sale_unit = ? OR purchase_unit = ?',
      [id, id, id]
    );
    return rows[0]?.count || 0;
  }

  /**
   * Get all units of a product
   * Replicates Settings_model::getAllUnitsOfProduct($product_id) & Site::getUnitByProId($id)
   */
  static async getAllUnitsOfProduct(productId) {
    const [pRows] = await db.query('SELECT id, unit FROM aura_products WHERE id = ? LIMIT 1', [productId]);
    if (!pRows.length) return [];

    const baseUnitId = pRows[0].unit;
    const [puRows] = await db.query(`
      SELECT pu.id, pu.product_id, pu.unit_id, pu.unit_qty, pu.unit_price,
             u.code, u.name, u.base_unit, u.operator, u.operation_value
      FROM aura_product_units pu
      LEFT JOIN aura_units u ON u.id = pu.unit_id
      WHERE pu.product_id = ?
      ORDER BY pu.unit_qty ASC
    `, [productId]);

    if (puRows.length > 0) return puRows;
    return baseUnitId ? this.getUnitsByBUID(baseUnitId) : [];
  }

  /**
   * Validate if a unit record exists for a product in aura_product_units
   * Replicates Settings_model::valid_UnitProduct($product_id, $unit_id)
   */
  static async validUnitProduct(productId, unitId) {
    const [rows] = await db.query(
      'SELECT * FROM aura_product_units WHERE product_id = ? AND unit_id = ? LIMIT 1',
      [productId, unitId]
    );
    return rows[0] || false;
  }

  /**
   * Get product unit with cost & price override
   * Replicates Site::getProductUnit($product_id, $unit_id)
   */
  static async getProductUnit(productId, unitId) {
    const [rows] = await db.query(`
      SELECT u.*, cp.cost, cp.price, cp.product_code
      FROM aura_units u
      LEFT JOIN aura_cost_price_by_units cp ON cp.unit_id = u.id AND cp.product_id = ?
      WHERE u.id = ?
      LIMIT 1
    `, [productId, unitId]);
    return rows[0] || null;
  }

  /**
   * Get price by unit and price group
   * Replicates Settings_model::getPriceByUnit($product_id, $unit_id, $group_id)
   */
  static async getPriceByUnit(productId, unitId, groupId = null) {
    try {
      if (groupId) {
        const [rows] = await db.query(`
          SELECT pp.id, pp.product_id, pp.price_group_id, pp.price, pp.unit_id
          FROM aura_product_prices pp
          WHERE pp.product_id = ? AND pp.unit_id = ? AND pp.price_group_id = ?
          LIMIT 1
        `, [productId, unitId, groupId]);
        if (rows.length > 0) return rows[0];
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Fallback price lookup when no price_group match exists
   * Replicates Settings_model::Else_GetPriceByUnit($product_id, $unit_id)
   */
  static async elseGetPriceByUnit(productId, unitId) {
    const [cpRows] = await db.query(`
      SELECT id, product_id, unit_id, price, cost, product_code
      FROM aura_cost_price_by_units
      WHERE product_id = ? AND unit_id = ?
      LIMIT 1
    `, [productId, unitId]);
    if (cpRows.length > 0) return cpRows[0];

    const [puRows] = await db.query(`
      SELECT id, product_id, unit_id, unit_price AS price, unit_qty
      FROM aura_product_units
      WHERE product_id = ? AND unit_id = ?
      LIMIT 1
    `, [productId, unitId]);
    if (puRows.length > 0) return puRows[0];

    const [pRows] = await db.query(
      'SELECT id AS product_id, unit AS unit_id, price, cost FROM aura_products WHERE id = ? LIMIT 1',
      [productId]
    );
    return pRows[0] || null;
  }

  /**
   * Product suggestions for multi-unit configuration
   * Replicates Settings_model::getProductNamesByMultiunit($term, $limit)
   */
  static async getProductNamesByMultiunit(term = '', limit = 10) {
    const q = `%${String(term).trim()}%`;
    const [rows] = await db.query(`
      SELECT p.id, p.code, p.name, p.unit, p.cost, p.price,
             u.name AS unit_name, u.code AS unit_code
      FROM aura_products p
      LEFT JOIN aura_units u ON u.id = p.unit
      WHERE p.type = 'standard'
        AND (p.name LIKE ? OR p.code LIKE ? OR CONCAT(p.name, ' (', p.code, ')') LIKE ?)
      LIMIT ?
    `, [q, q, q, parseInt(limit, 10) || 10]);

    for (const row of rows) {
      row.units = await this.getUnitsByBUID(row.unit);
    }
    return rows;
  }

  /**
   * Check if a unit barcode/product_code is already used by another product or unit
   */
  static async checkDuplicateUnitCode(productCode, excludeProductId = null) {
    if (!productCode) return false;
    const code = String(productCode).trim();

    const prodParams = [code];
    let prodSql = 'SELECT id, code, name FROM aura_products WHERE code = ?';
    if (excludeProductId) {
      prodSql += ' AND id != ?';
      prodParams.push(excludeProductId);
    }
    const [prodRows] = await db.query(`${prodSql} LIMIT 1`, prodParams);
    if (prodRows.length > 0) return prodRows[0];

    const cpParams = [code];
    let cpSql = 'SELECT id, product_id, unit_id, product_code FROM aura_cost_price_by_units WHERE product_code = ?';
    if (excludeProductId) {
      cpSql += ' AND product_id != ?';
      cpParams.push(excludeProductId);
    }
    const [cpRows] = await db.query(`${cpSql} LIMIT 1`, cpParams);
    return cpRows.length > 0 ? cpRows[0] : false;
  }

  /**
   * Get complete multi-unit configuration for a product
   * Replicates Site::getUnitByProId($id) & Products::edit($id) unit details
   */
  static async getProductUnitsDetails(productId) {
    const [productRows] = await db.query(`
      SELECT id, code, name, cost, price, unit, sale_unit, purchase_unit
      FROM aura_products
      WHERE id = ?
      LIMIT 1
    `, [productId]);

    if (!productRows.length) return null;

    const product = productRows[0];
    const baseUnitId = product.unit;
    if (!baseUnitId) {
      return {
        product,
        baseUnitId: null,
        totalBaseQty: 0,
        stockFormatted: '0',
        units: []
      };
    }

    const [units] = await db.query(`
      SELECT 
        u.id, 
        u.code, 
        u.name, 
        u.base_unit, 
        u.operator, 
        u.unit_value,
        u.operation_value,
        CASE WHEN u.id = ? THEN 1 ELSE COALESCE(CAST(u.operation_value AS DECIMAL(15,4)), 1) END AS unit_qty,
        COALESCE(cp.price, CASE WHEN u.id = ? THEN ? ELSE 0 END) AS unit_price,
        COALESCE(cp.cost, CASE WHEN u.id = ? THEN ? ELSE 0 END) AS unit_cost,
        cp.product_code AS unit_barcode
      FROM aura_units u
      LEFT JOIN aura_cost_price_by_units cp 
        ON cp.unit_id = u.id AND cp.product_id = ?
      WHERE u.id = ? OR u.base_unit = ?
      GROUP BY u.id
      ORDER BY (u.id = ?) DESC, u.id ASC
    `, [
      baseUnitId,
      baseUnitId, product.price || 0,
      baseUnitId, product.cost || 0,
      productId,
      baseUnitId, baseUnitId,
      baseUnitId
    ]);

    const [stockRows] = await db.query(
      'SELECT COALESCE(SUM(quantity), 0) AS total_base_qty FROM aura_warehouses_products WHERE product_id = ?',
      [productId]
    );
    const totalBaseQty = stockRows[0]?.total_base_qty || 0;
    const stockFormatted = convertUnitToString(totalBaseQty, units);

    return {
      product,
      baseUnitId,
      totalBaseQty,
      stockFormatted,
      units
    };
  }

  /**
   * Save multi-unit cost/price/barcode records for a product
   * Replicates Products_model::addProduct / updateProduct unit_datas & product_units persistence
   */
  static async saveProductUnits(productId, { unit, sale_unit, purchase_unit, unitPrices = [] }, externalConn = null) {
    const runner = externalConn || db;

    if (unit !== undefined || sale_unit !== undefined || purchase_unit !== undefined) {
      await runner.query(`
        UPDATE aura_products SET
          unit = COALESCE(?, unit),
          sale_unit = COALESCE(?, sale_unit),
          purchase_unit = COALESCE(?, purchase_unit)
        WHERE id = ?
      `, [unit || null, sale_unit || unit || null, purchase_unit || unit || null, productId]);
    }

    if (!Array.isArray(unitPrices) || unitPrices.length === 0) return;

    for (const item of unitPrices) {
      const unitId = item.unit_id || item.id;
      if (!unitId) continue;

      const cost = parseFloat(item.cost ?? item.unit_cost) || 0;
      const price = parseFloat(item.price ?? item.unit_price) || 0;
      const barcode = (item.product_code ?? item.unit_barcode ?? item.barcode ?? '').trim() || null;
      const unitQty = parseFloat(item.unit_qty || item.operation_value || 1) || 1;

      const [existingCp] = await runner.query(
        'SELECT id FROM aura_cost_price_by_units WHERE product_id = ? AND unit_id = ? LIMIT 1',
        [productId, unitId]
      );

      if (existingCp.length > 0) {
        await runner.query(`
          UPDATE aura_cost_price_by_units SET
            cost = ?,
            price = ?,
            product_code = ?
          WHERE id = ?
        `, [cost, price, barcode, existingCp[0].id]);
      } else {
        await runner.query(`
          INSERT INTO aura_cost_price_by_units (product_id, unit_id, cost, price, product_code)
          VALUES (?, ?, ?, ?, ?)
        `, [productId, unitId, cost, price, barcode]);
      }

      const [existingPu] = await runner.query(
        'SELECT id FROM aura_product_units WHERE product_id = ? AND unit_id = ? LIMIT 1',
        [productId, unitId]
      );

      if (existingPu.length > 0) {
        await runner.query(`
          UPDATE aura_product_units SET
            unit_qty = ?,
            unit_price = ?
          WHERE id = ?
        `, [unitQty, price, existingPu[0].id]);
      } else {
        await runner.query(`
          INSERT INTO aura_product_units (product_id, unit_id, unit_qty, unit_price)
          VALUES (?, ?, ?, ?)
        `, [productId, unitId, unitQty, price]);
      }
    }
  }
}

module.exports = UnitsModel;
