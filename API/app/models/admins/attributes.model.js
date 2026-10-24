const { db } = require('../../config/utill/helper');
const { logError } = require('../../config/utill/logErr');

/**
 * Reusable Product Attributes & Values Model
 */
class AttributesModel {
  /**
   * Get all attributes with their associated values
   */
  static async getAllAttributesWithValues() {
    try {
      const [attributes] = await db.query(`
        SELECT id, name, code, created_at, updated_at
        FROM aura_attributes
        ORDER BY name ASC
      `);

      if (!attributes || attributes.length === 0) return [];

      const [values] = await db.query(`
        SELECT id, attribute_id, value, color_code, sort_order
        FROM aura_attribute_values
        ORDER BY sort_order ASC, value ASC
      `);

      const valuesByAttrId = {};
      values.forEach(v => {
        if (!valuesByAttrId[v.attribute_id]) valuesByAttrId[v.attribute_id] = [];
        valuesByAttrId[v.attribute_id].push(v);
      });

      return attributes.map(a => ({
        ...a,
        values: valuesByAttrId[a.id] || []
      }));
    } catch (err) {
      logError('AttributesModel.getAllAttributesWithValues', err, null);
      throw err;
    }
  }

  /**
   * Create an attribute
   */
  static async createAttribute({ name, code }) {
    try {
      const cleanName = (name || '').trim();
      const cleanCode = (code || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (!cleanName) throw new Error('Attribute name is required.');

      const [existing] = await db.query('SELECT id FROM aura_attributes WHERE code = ? LIMIT 1', [cleanCode]);
      if (existing.length > 0) throw new Error(`Attribute with code '${cleanCode}' already exists.`);

      const [res] = await db.query('INSERT INTO aura_attributes (name, code) VALUES (?, ?)', [cleanName, cleanCode]);
      return { id: res.insertId, name: cleanName, code: cleanCode, values: [] };
    } catch (err) {
      logError('AttributesModel.createAttribute', err, null);
      throw err;
    }
  }

  /**
   * Update an attribute
   */
  static async updateAttribute(id, { name, code }) {
    try {
      const cleanName = (name || '').trim();
      if (!cleanName) throw new Error('Attribute name is required.');

      const fields = ['name = ?'];
      const values = [cleanName];

      if (code) {
        const cleanCode = code.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        fields.push('code = ?');
        values.push(cleanCode);
      }
      values.push(id);

      await db.query(`UPDATE aura_attributes SET ${fields.join(', ')} WHERE id = ?`, values);
      return true;
    } catch (err) {
      logError('AttributesModel.updateAttribute', err, null);
      throw err;
    }
  }

  /**
   * Delete an attribute
   */
  static async deleteAttribute(id) {
    try {
      // Check if used in product variants
      const [used] = await db.query('SELECT 1 FROM aura_product_variant_values WHERE attribute_id = ? LIMIT 1', [id]);
      if (used.length > 0) {
        throw new Error('Cannot delete attribute because it is in use by one or more product variants.');
      }

      await db.query('DELETE FROM aura_attribute_values WHERE attribute_id = ?', [id]);
      await db.query('DELETE FROM aura_attributes WHERE id = ?', [id]);
      return true;
    } catch (err) {
      logError('AttributesModel.deleteAttribute', err, null);
      throw err;
    }
  }

  /**
   * Add a value to an attribute
   */
  static async addValue({ attribute_id, value, color_code = null, sort_order = 0 }) {
    try {
      const cleanVal = (value || '').trim();
      if (!cleanVal) throw new Error('Attribute value is required.');

      const [existing] = await db.query(
        'SELECT id FROM aura_attribute_values WHERE attribute_id = ? AND LOWER(value) = LOWER(?) LIMIT 1',
        [attribute_id, cleanVal]
      );
      if (existing.length > 0) throw new Error(`Value '${cleanVal}' already exists for this attribute.`);

      const [res] = await db.query(`
        INSERT INTO aura_attribute_values (attribute_id, value, color_code, sort_order)
        VALUES (?, ?, ?, ?)
      `, [attribute_id, cleanVal, color_code || null, parseInt(sort_order) || 0]);

      return {
        id: res.insertId,
        attribute_id,
        value: cleanVal,
        color_code: color_code || null,
        sort_order: parseInt(sort_order) || 0
      };
    } catch (err) {
      logError('AttributesModel.addValue', err, null);
      throw err;
    }
  }

  /**
   * Delete an attribute value
   */
  static async deleteValue(valueId) {
    try {
      const [used] = await db.query('SELECT 1 FROM aura_product_variant_values WHERE attribute_value_id = ? LIMIT 1', [valueId]);
      if (used.length > 0) {
        throw new Error('Cannot delete attribute value because it is referenced by existing product variants.');
      }

      await db.query('DELETE FROM aura_attribute_values WHERE id = ?', [valueId]);
      return true;
    } catch (err) {
      logError('AttributesModel.deleteValue', err, null);
      throw err;
    }
  }

  /**
   * Generate Cartesian product of variant combinations from attributes
   * @param {Array<{ name: string, values: string[] }>} attributeSelections
   * @param {string} baseSku - e.g. "TSHIRT-01"
   * @param {number} basePrice
   * @param {number} baseCost
   */
  static generateCombinations(attributeSelections = [], baseSku = 'PRD', basePrice = 0, baseCost = 0) {
    if (!Array.isArray(attributeSelections) || attributeSelections.length === 0) return [];

    // Filter valid attributes with non-empty values
    const valid = attributeSelections.filter(a => a && a.name && Array.isArray(a.values) && a.values.length > 0);
    if (valid.length === 0) return [];

    // Cartesian product helper
    const cartesian = (arrays) => arrays.reduce((acc, curr) => acc.flatMap(c => curr.map(n => [...c, n])), [[]]);

    const valueArrays = valid.map(a => a.values.map(val => ({
      attributeName: a.name,
      value: typeof val === 'object' ? (val.value || val.name) : String(val)
    })));

    const combinations = cartesian(valueArrays);

    return combinations.map((combo, idx) => {
      const nameParts = combo.map(c => c.value);
      const variantName = nameParts.join(' / ');

      // Build attributes dictionary e.g. { "Color": "Red", "Size": "Small" }
      const attrDict = {};
      combo.forEach(c => {
        attrDict[c.attributeName] = c.value;
      });

      // Generate clean unique SKU suffix
      const skuSuffix = nameParts.map(p => p.replace(/[^a-zA-Z0-9]+/g, '').toUpperCase()).join('-');
      const generatedSku = `${baseSku}-${skuSuffix}`;

      return {
        id: `gen_${Date.now()}_${idx}`,
        name: variantName,
        sku: generatedSku,
        barcode: generatedSku,
        attributes: attrDict,
        price: parseFloat(basePrice) || 0,
        cost: parseFloat(baseCost) || 0,
        quantity: 0,
        status: 1
      };
    });
  }
}

module.exports = AttributesModel;
