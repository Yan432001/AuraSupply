/**
 * Unit Conversion and Measurement Utility for Aura ERP (Frontend)
 * Replicated from AURA_v1:
 * - themes/default/admin/assets/js/core.js (unitToBaseQty, baseToUnitQty)
 * - themes/default/admin/assets/js/purchases.js (multi-unit cost/qty recalculation)
 * - bpas/models/Site.php & bpas/libraries/Bpas.php
 */

/**
 * Convert quantity from a specific unit to base unit quantity
 * Replicated from core.js unitToBaseQty(qty, unitObj)
 *
 * @param {number|string} qty - Quantity in the selected unit
 * @param {object} unitObj - Unit object with { operator, operation_value }
 * @returns {number} Quantity in base unit
 */
export function unitToBaseQty(qty, unitObj) {
  const q = parseFloat(qty);
  if (Number.isNaN(q)) return 0;
  if (!unitObj || !unitObj.operator || unitObj.operation_value === undefined || unitObj.operation_value === null) {
    return q;
  }

  const opVal = parseFloat(unitObj.operation_value);
  if (Number.isNaN(opVal)) return q;

  switch (unitObj.operator) {
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
 * Convert quantity from base unit to a specific unit quantity
 * Replicated from core.js baseToUnitQty(qty, unitObj)
 *
 * @param {number|string} qty - Quantity in base unit
 * @param {object} unitObj - Unit object with { operator, operation_value }
 * @returns {number} Quantity in target unit
 */
export function baseToUnitQty(qty, unitObj) {
  const q = parseFloat(qty);
  if (Number.isNaN(q)) return 0;
  if (!unitObj || !unitObj.operator || unitObj.operation_value === undefined || unitObj.operation_value === null) {
    return q;
  }

  const opVal = parseFloat(unitObj.operation_value);
  if (Number.isNaN(opVal)) return q;

  switch (unitObj.operator) {
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
 * Convert unit price/cost to base unit price/cost
 * Replicated from Site::convertToBase($unit, $value)
 *
 * @param {number|string} value - Price or cost per selected unit
 * @param {object} unitObj - Unit object with { operator, operation_value }
 * @returns {number} Price or cost per base unit
 */
export function convertToBasePrice(value, unitObj) {
  const val = parseFloat(value) || 0;
  if (!unitObj || !unitObj.operator || !unitObj.operation_value) {
    return val;
  }

  const opVal = parseFloat(unitObj.operation_value) || 1;
  switch (unitObj.operator) {
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
 * Convert base unit price/cost to a specific unit price/cost
 * Replicated from purchases.js #punit change & Site::convertCostingToBase($value, $unit)
 *
 * @param {number|string} baseValue - Price or cost per base unit
 * @param {object} unitObj - Unit object with { operator, operation_value }
 * @returns {number} Price or cost for target unit
 */
export function convertFromBasePrice(baseValue, unitObj) {
  const val = parseFloat(baseValue) || 0;
  if (!unitObj || !unitObj.operator || !unitObj.operation_value) {
    return val;
  }

  const opVal = parseFloat(unitObj.operation_value) || 1;
  switch (unitObj.operator) {
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
 * Decompose a base quantity into human-readable packaging units
 * Replicated from Bpas::convert_unit_2_string($item_code, $qty)
 *
 * @param {number|string} baseQty - Total quantity in base unit
 * @param {Array} units - Array of units [{ name, code, unit_qty, operation_value }]
 * @returns {string} e.g. "2 Case, 2 Can"
 */
export function convertUnitToString(baseQty, units = []) {
  let qty = parseFloat(baseQty) || 0;
  if (qty === 0) return '0';

  const isNegative = qty < 0;
  qty = Math.abs(qty);

  if (!Array.isArray(units) || units.length === 0) {
    return `${isNegative ? '-' : ''}${qty}`;
  }

  const sortedUnits = [...units].sort(
    (a, b) =>
      parseFloat(b.unit_qty || b.operation_value || 1) -
      parseFloat(a.unit_qty || a.operation_value || 1)
  );

  const parts = [];
  for (let i = 0; i < sortedUnits.length; i++) {
    const u = sortedUnits[i];
    const uQty = parseFloat(u.unit_qty || u.operation_value || 1);
    const uName = u.name || u.code || 'Unit';

    if (qty <= 0) break;

    if (qty >= uQty && uQty > 0) {
      const whole = Math.floor(qty / uQty);
      if (whole > 0) {
        parts.push(`${whole} ${uName}`);
        qty = +(qty % uQty).toFixed(4);
      }
    } else if (i === sortedUnits.length - 1 && qty > 0) {
      parts.push(`${qty} ${uName}`);
      qty = 0;
    }
  }

  if (parts.length === 0 && qty > 0) {
    parts.push(`${qty} ${sortedUnits[sortedUnits.length - 1]?.name || 'Unit'}`);
  }

  const result = parts.join(', ');
  return isNegative ? `-(${result})` : result;
}

/**
 * Format human-readable conversion formula for a unit
 */
export function formatUnitFormula(unitObj, baseUnitLabel = 'Base Unit') {
  if (!unitObj || !unitObj.base_unit) {
    return `1 ${unitObj?.name || unitObj?.code || 'Unit'} = 1.0 (Root)`;
  }
  const op = unitObj.operator || '*';
  const opVal = unitObj.operation_value || '1';
  const computedBaseQty = unitToBaseQty(1, { operator: op, operation_value: opVal });
  return `1 ${unitObj.name || unitObj.code || 'Unit'} = 1 ${op} ${opVal} = ${computedBaseQty} ${baseUnitLabel}`;
}
