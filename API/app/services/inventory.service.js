/**
 * CENTRAL INVENTORY & STOCK MOVEMENT SERVICE
 * ==========================================
 * Strict Replication and Upgrade of AURA_v1 Core Inventory Engine (Site.php & Bpas.php)
 * 
 * Provides unified, atomic algorithms for:
 * 1. Unit conversion (unitToBaseQty, baseToUnitQty, convertToBasePrice, convertFromBasePrice)
 * 2. Warehouse Stock balances & multi-variant tracking
 * 3. Overselling rules & verification (Global aura_settings.overselling + Warehouse-level aura_warehouses.overselling)
 * 4. Stock Movement Ledger (aura_stock_movement as single source of truth)
 * 5. Trigger-safe updates (leveraging MySQL insertStock, updateStock, deleteStock triggers)
 */

const pool = require('../config/dbPool');

/**
 * 1. UNIT CONVERSION ALGORITHMS (Site.php lines 440-514)
 */

/**
 * Convert quantity from a given unit to the product's base unit quantity
 * @param {number} qty - Quantity in the given unit
 * @param {object} unit - Unit object with { operator, operation_value }
 * @returns {number} Quantity in base unit
 */
function unitToBaseQty(qty, unit) {
  const q = parseFloat(qty) || 0;
  if (!unit || !unit.operator || !unit.operation_value) {
    return q;
  }
  const opVal = parseFloat(unit.operation_value) || 1;
  switch (unit.operator) {
    case '*':
      return q * opVal;
    case '/':
      return opVal !== 0 ? q / opVal : q;
    case '+':
      return q + opVal;
    case '-':
      return q - opVal;
    default:
      return q;
  }
}

/**
 * Convert quantity from base unit to a target unit quantity
 * @param {number} qty - Quantity in base unit
 * @param {object} unit - Unit object with { operator, operation_value }
 * @returns {number} Quantity in target unit
 */
function baseToUnitQty(qty, unit) {
  const q = parseFloat(qty) || 0;
  if (!unit || !unit.operator || !unit.operation_value) {
    return q;
  }
  const opVal = parseFloat(unit.operation_value) || 1;
  switch (unit.operator) {
    case '*':
      return opVal !== 0 ? q / opVal : q;
    case '/':
      return q * opVal;
    case '+':
      return q - opVal;
    case '-':
      return q + opVal;
    default:
      return q;
  }
}

/**
 * Convert price/cost to base unit price/cost
 * @param {number} value - Unit price or cost
 * @param {object} unit - Unit object with { operator, operation_value }
 * @returns {number} Base unit price or cost
 */
function convertToBasePrice(value, unit) {
  const val = parseFloat(value) || 0;
  if (!unit || !unit.operator || !unit.operation_value) {
    return val;
  }
  const opVal = parseFloat(unit.operation_value) || 1;
  switch (unit.operator) {
    case '*':
      return opVal !== 0 ? val / opVal : val;
    case '/':
      return val * opVal;
    case '+':
      return val - opVal;
    case '-':
      return val + opVal;
    default:
      return val;
  }
}

/**
 * Convert base price/cost to target unit price/cost
 * @param {number} baseValue - Price or cost in base unit
 * @param {object} unit - Unit object with { operator, operation_value }
 * @returns {number} Price or cost in target unit
 */
function convertFromBasePrice(baseValue, unit) {
  const val = parseFloat(baseValue) || 0;
  if (!unit || !unit.operator || !unit.operation_value) {
    return val;
  }
  const opVal = parseFloat(unit.operation_value) || 1;
  switch (unit.operator) {
    case '*':
      return val * opVal;
    case '/':
      return opVal !== 0 ? val / opVal : val;
    case '+':
      return val + opVal;
    case '-':
      return val - opVal;
    default:
      return val;
  }
}

/**
 * Retrieve unit object for a product
 * @param {number} productId 
 * @param {number} unitId 
 * @param {object} [connection] 
 */
async function getProductUnit(productId, unitId, connection = null) {
  const conn = connection || pool;
  if (unitId) {
    const [units] = await conn.query('SELECT * FROM aura_units WHERE id = ? LIMIT 1', [unitId]);
    if (units.length > 0) return units[0];
  }
  if (productId) {
    const [pUnits] = await conn.query(
      `SELECT u.* FROM aura_products p 
       JOIN aura_units u ON u.id = COALESCE(p.unit, p.sale_unit) 
       WHERE p.id = ? LIMIT 1`,
      [productId]
    );
    if (pUnits.length > 0) return pUnits[0];
  }
  return { id: 1, code: 'Unit', name: 'Unit', operator: '*', operation_value: 1 };
}

/**
 * 2. SETTINGS & WAREHOUSE CONFIGURATION
 */

/**
 * Get global ERP settings
 * @param {object} [connection]
 */
async function getSettings(connection = null) {
  const conn = connection || pool;
  const [rows] = await conn.query(
    'SELECT setting_id, overselling, default_warehouse, accounting_method, default_currency FROM aura_settings LIMIT 1'
  );
  return rows[0] || {
    setting_id: 1,
    overselling: 0,
    default_warehouse: 1,
    accounting_method: 0,
    default_currency: 'USD'
  };
}

/**
 * Get warehouse details
 * @param {number} warehouseId 
 * @param {object} [connection]
 */
async function getWarehouse(warehouseId, connection = null) {
  const conn = connection || pool;
  const [rows] = await conn.query(
    'SELECT id, code, name, overselling, saleable FROM aura_warehouses WHERE id = ? LIMIT 1',
    [warehouseId]
  );
  return rows[0] || null;
}

/**
 * Determine if overselling is allowed for a given warehouse
 * Replicated strictly from Site.php:
 * (!$this->Settings->overselling || ($this->Settings->overselling && !$warehouse->overselling))
 * 
 * Rules:
 * - If global overselling == 0 => NO overselling anywhere
 * - If global overselling == 1 => Allowed unless warehouse.overselling == 0
 * 
 * @param {number} warehouseId 
 * @param {object} [connection]
 * @returns {Promise<boolean>} true if overselling is allowed, false if blocked
 */
async function canOversell(warehouseId, connection = null) {
  const settings = await getSettings(connection);
  const globalOversell = parseInt(settings.overselling, 10) === 1;
  if (!globalOversell) return false;

  if (warehouseId) {
    const warehouse = await getWarehouse(warehouseId, connection);
    if (warehouse && warehouse.overselling !== null) {
      return parseInt(warehouse.overselling, 10) === 1;
    }
  }
  return true;
}

/**
 * 3. WAREHOUSE STOCK BALANCES
 */

/**
 * Retrieve current Quantity On Hand (QOH) for a product in a warehouse
 * Directly queries aura_warehouses_products (and optionally variants)
 * 
 * @param {number} productId 
 * @param {number} warehouseId 
 * @param {number|null} [optionId]
 * @param {object} [connection]
 * @returns {Promise<number>} Available stock in base unit
 */
async function getWarehouseStock(productId, warehouseId, optionId = null, connection = null) {
  const conn = connection || pool;
  if (optionId && optionId > 0) {
    const [rows] = await conn.query(
      `SELECT COALESCE(quantity, 0) AS qoh 
       FROM aura_warehouses_products_variants 
       WHERE product_id = ? AND warehouse_id = ? AND option_id = ? LIMIT 1`,
      [productId, warehouseId, optionId]
    );
    if (rows.length > 0) return parseFloat(rows[0].qoh) || 0;
  }

  const [rows] = await conn.query(
    `SELECT COALESCE(quantity, 0) AS qoh 
     FROM aura_warehouses_products 
     WHERE product_id = ? AND warehouse_id = ? LIMIT 1`,
    [productId, warehouseId]
  );
  return rows.length > 0 ? (parseFloat(rows[0].qoh) || 0) : 0;
}

/**
 * Retrieve total company-wide stock for a product across all warehouses
 * @param {number} productId 
 * @param {object} [connection]
 */
async function getProductStock(productId, connection = null) {
  const conn = connection || pool;
  const [rows] = await conn.query(
    'SELECT COALESCE(quantity, 0) AS qoh, type, name, code FROM aura_products WHERE id = ? LIMIT 1',
    [productId]
  );
  return rows[0] || { qoh: 0, type: 'standard', name: '', code: '' };
}

/**
 * 4. OVERSELLING CHECK ALGORITHM (Site.php line 9531: stockMovement_isOverselling)
 * 
 * Checks if deducting the requested quantity would result in negative stock.
 * If overselling is blocked, throws an error with detailed message.
 * 
 * @param {object} params
 * @param {number} params.productId
 * @param {number} params.warehouseId
 * @param {number} params.requestedBaseQty - Base unit quantity to deduct (> 0)
 * @param {number|null} [params.optionId]
 * @param {string} [params.productName]
 * @param {object} [connection]
 */
async function checkOverselling({ productId, warehouseId, requestedBaseQty, optionId = null, productName = '' }, connection = null) {
  const conn = connection || pool;
  const prod = await getProductStock(productId, conn);

  // Service and digital products never track physical inventory or oversell
  if (prod.type === 'service' || prod.type === 'digital') {
    return false;
  }

  const allowed = await canOversell(warehouseId, conn);
  if (allowed) {
    return false; // Overselling permitted by configuration
  }

  const currentQOH = await getWarehouseStock(productId, warehouseId, optionId, conn);
  const remaining = currentQOH - requestedBaseQty;

  if (remaining < 0) {
    const wh = await getWarehouse(warehouseId, conn);
    const whName = wh ? wh.name : `Warehouse #${warehouseId}`;
    const pName = productName || prod.name || `Product #${productId}`;
    const err = new Error(
      `Insufficient inventory for "${pName}" in ${whName}. Available: ${currentQOH}, Requested: ${requestedBaseQty}. Negative stock is disallowed.`
    );
    err.code = 'ERR_OVERSELLING_BLOCKED';
    err.statusCode = 400;
    err.details = {
      product_id: productId,
      warehouse_id: warehouseId,
      option_id: optionId,
      available: currentQOH,
      requested: requestedBaseQty,
      remaining
    };
    throw err;
  }

  return false;
}

/**
 * 5. STOCK MOVEMENT LEDGER (Single Source of Truth)
 * 
 * Inserts a movement row into aura_stock_movement.
 * Note: The MySQL triggers (`insertStock`, `updateStock`, `deleteStock`) automatically recalculate
 * `aura_products.quantity`, `aura_warehouses_products.quantity`, and variant quantities!
 * 
 * @param {object} data
 * @param {string} [data.date] - Defaults to NOW()
 * @param {string} data.reference_no
 * @param {string} data.transaction - 'Sale', 'POS', 'Purchase', 'Transfer', 'QuantityAdjustment', 'UsingStock', 'Opening', etc.
 * @param {number} data.transaction_id
 * @param {number} data.warehouse_id
 * @param {number} data.product_id
 * @param {string} [data.product_type] - 'standard', 'combo', 'service', etc.
 * @param {string} [data.product_code]
 * @param {string} [data.product_name]
 * @param {number} [data.real_unit_cost]
 * @param {number} data.quantity - Signed Base Unit quantity (negative for out, positive for in)
 * @param {number} [data.unit_quantity] - Transaction unit quantity
 * @param {string} [data.unit_code]
 * @param {number} [data.unit_id]
 * @param {number|null} [data.option_id]
 * @param {string|null} [data.serial_no]
 * @param {string|null} [data.expiry]
 * @param {number} [data.user_id]
 * @param {object} connection - Active database connection (required for atomic transaction)
 */
async function recordStockMovement(data, connection) {
  if (!connection) {
    throw new Error('Active database connection is required for recordStockMovement transaction atomicity');
  }

  // Ensure warehouse row exists so trigger can update it
  await connection.query(
    `INSERT INTO aura_warehouses_products (product_id, warehouse_id, quantity, avg_cost)
     VALUES (?, ?, 0, ?)
     ON DUPLICATE KEY UPDATE product_id = product_id`,
    [data.product_id, data.warehouse_id, parseFloat(data.real_unit_cost || 0)]
  );

  if (data.option_id && data.option_id > 0) {
    await connection.query(
      `INSERT INTO aura_warehouses_products_variants (option_id, product_id, warehouse_id, quantity)
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE option_id = option_id`,
      [data.option_id, data.product_id, data.warehouse_id]
    );
  }

  const [res] = await connection.query(
    `INSERT INTO aura_stock_movement (
      date, reference_no, transaction, transaction_id, warehouse_id,
      product_id, product_type, product_code, product_name, real_unit_cost,
      quantity, unit_quantity, unit_code, unit_id, option_id,
      serial_no, expiry, user_id, actual_date
    ) VALUES (
      COALESCE(?, NOW()), ?, ?, ?, ?,
      ?, COALESCE(?, 'standard'), ?, ?, ?,
      ?, ?, COALESCE(?, 'pcs'), COALESCE(?, 1), ?,
      ?, ?, COALESCE(?, 1), NOW()
    )`,
    [
      data.date || null,
      data.reference_no,
      data.transaction,
      data.transaction_id,
      data.warehouse_id,
      data.product_id,
      data.product_type || 'standard',
      data.product_code || '',
      data.product_name || '',
      parseFloat(data.real_unit_cost || 0),
      parseFloat(data.quantity),
      parseFloat(data.unit_quantity !== undefined ? data.unit_quantity : Math.abs(data.quantity)),
      data.unit_code || 'pcs',
      data.unit_id || 1,
      data.option_id || null,
      data.serial_no || null,
      data.expiry || null,
      data.user_id || 1
    ]
  );

  return res.insertId;
}

/**
 * Delete stock movements for a specific transaction
 * Replicated from Site::delete_stock_movement($transaction, $transaction_id)
 * Trigger `deleteStock` will automatically recalculate balances!
 * 
 * @param {string} transaction 
 * @param {number} transactionId 
 * @param {object} connection 
 */
async function deleteStockMovement(transaction, transactionId, connection) {
  if (!connection) {
    throw new Error('Active database connection is required for deleteStockMovement');
  }

  const [res] = await connection.query(
    'DELETE FROM aura_stock_movement WHERE transaction = ? AND transaction_id = ?',
    [transaction, transactionId]
  );
  return res.affectedRows;
}

/**
 * Synchronize Opening Stock for any warehouse product that has no stock_movement rows
 * @param {object} [connection]
 */
async function syncMissingOpeningStock(connection = null) {
  const conn = connection || pool;
  const [missing] = await conn.query(`
    SELECT wp.product_id, wp.warehouse_id, wp.quantity, p.code, p.name, p.cost, p.type, p.unit
    FROM aura_warehouses_products wp
    JOIN aura_products p ON p.id = wp.product_id
    LEFT JOIN aura_stock_movement sm ON sm.product_id = wp.product_id AND sm.warehouse_id = wp.warehouse_id
    WHERE sm.id IS NULL AND wp.quantity > 0
  `);

  let seededCount = 0;
  for (const m of missing) {
    await conn.query(
      `INSERT INTO aura_stock_movement (
        date, reference_no, transaction, transaction_id, warehouse_id,
        product_id, product_type, product_code, product_name, real_unit_cost,
        quantity, unit_quantity, unit_code, unit_id, user_id, actual_date
      ) VALUES (
        NOW(), 'OPENING-SYNC', 'Opening', 0, ?,
        ?, ?, ?, ?, ?,
        ?, ?, 'pcs', ?, 1, NOW()
      )`,
      [
        m.warehouse_id,
        m.product_id,
        m.type || 'standard',
        m.code,
        m.name,
        parseFloat(m.cost || 0),
        parseFloat(m.quantity),
        parseFloat(m.quantity),
        m.unit || 1
      ]
    );
    seededCount++;
  }
  return seededCount;
}

module.exports = {
  unitToBaseQty,
  baseToUnitQty,
  convertToBasePrice,
  convertFromBasePrice,
  getProductUnit,
  getSettings,
  getWarehouse,
  canOversell,
  getWarehouseStock,
  getProductStock,
  checkOverselling,
  recordStockMovement,
  deleteStockMovement,
  syncMissingOpeningStock
};
