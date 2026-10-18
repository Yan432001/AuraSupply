/**
 * Unit Conversion and Measurement Utility for Aura ERP
 * Strictly replicated from AURA_v1 (Site.php & Bpas.php)
 */

/**
 * Convert quantity from a specific unit to base unit quantity
 * Replicated from Site::unitToBaseQty($qty, $unit)
 * 
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
 * Convert quantity from base unit to a specific unit quantity
 * Replicated from Site::baseToUnitQty($qty, $unit)
 * 
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
 * Convert unit price/cost to base unit price/cost
 * Replicated from Site::convertToBase($unit, $value)
 * 
 * E.g. If 1 Case (24 cans) costs $24, base unit (1 can) costs $24 / 24 = $1
 * 
 * @param {object} unit - Unit object with { operator, operation_value }
 * @param {number} value - Price or cost per unit
 * @returns {number} Price or cost per base unit
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
 * Convert base unit price/cost to a specific unit price/cost
 * Replicated from Site::convertCostingToBase($value, $unit)
 * 
 * E.g. If 1 can costs $1, 1 Case (24 cans) costs $1 * 24 = $24
 * 
 * @param {number} baseValue - Price or cost per base unit
 * @param {object} unit - Unit object with { operator, operation_value }
 * @returns {number} Price or cost for target unit
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
 * Decompose a base quantity into human-readable packaging units
 * Replicated from Bpas::convert_unit_2_string($item_code, $qty)
 * 
 * @param {number} baseQty - Total quantity in base unit
 * @param {Array} units - Array of units sorted descending by conversion multiplier
 *                        e.g. [{ name: 'Case', unit_qty: 24 }, { name: 'Can', unit_qty: 1 }]
 * @returns {string} e.g. "2 Case, 2 Can"
 */
function convertUnitToString(baseQty, units = []) {
  let qty = parseFloat(baseQty) || 0;
  if (qty === 0) return '0';

  const isNegative = qty < 0;
  qty = Math.abs(qty);

  if (!units || units.length === 0) {
    return `${isNegative ? '-' : ''}${qty}`;
  }

  // Ensure units are sorted in descending order of conversion ratio
  const sortedUnits = [...units].sort((a, b) => (parseFloat(b.unit_qty || b.operation_value || 1) - parseFloat(a.unit_qty || a.operation_value || 1)));

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

module.exports = {
  unitToBaseQty,
  baseToUnitQty,
  convertToBasePrice,
  convertFromBasePrice,
  convertUnitToString,
};
