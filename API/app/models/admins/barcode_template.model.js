const pool = require('../../config/dbPool');

class BarcodeTemplateModel {
  static async getTemplates() {
    const [rows] = await pool.query(`
      SELECT 
        id, name, width_mm, height_mm, columns, 
        show_name, show_price, show_sku, show_barcode_text, 
        is_default, created_at, updated_at
      FROM barcode_label_templates
      ORDER BY is_default DESC, id ASC
    `);
    return rows.map(r => ({
      ...r,
      width_mm: parseFloat(r.width_mm),
      height_mm: parseFloat(r.height_mm),
      columns: parseInt(r.columns),
      show_name: !!r.show_name,
      show_price: !!r.show_price,
      show_sku: !!r.show_sku,
      show_barcode_text: !!r.show_barcode_text,
      is_default: !!r.is_default
    }));
  }

  static async getTemplateById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM barcode_label_templates WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      width_mm: parseFloat(r.width_mm),
      height_mm: parseFloat(r.height_mm),
      columns: parseInt(r.columns),
      show_name: !!r.show_name,
      show_price: !!r.show_price,
      show_sku: !!r.show_sku,
      show_barcode_text: !!r.show_barcode_text,
      is_default: !!r.is_default
    };
  }

  static async createTemplate({
    name,
    width_mm = 50,
    height_mm = 30,
    columns = 1,
    show_name = 1,
    show_price = 1,
    show_sku = 1,
    show_barcode_text = 1,
    is_default = 0
  }) {
    if (is_default) {
      await pool.query('UPDATE barcode_label_templates SET is_default = 0');
    }

    const [result] = await pool.query(`
      INSERT INTO barcode_label_templates 
      (name, width_mm, height_mm, columns, show_name, show_price, show_sku, show_barcode_text, is_default, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [name, width_mm, height_mm, columns, show_name ? 1 : 0, show_price ? 1 : 0, show_sku ? 1 : 0, show_barcode_text ? 1 : 0, is_default ? 1 : 0]);

    return this.getTemplateById(result.insertId);
  }

  static async updateTemplate(id, data) {
    if (data.is_default) {
      await pool.query('UPDATE barcode_label_templates SET is_default = 0 WHERE id != ?', [id]);
    }

    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.width_mm !== undefined) { fields.push('width_mm = ?'); values.push(data.width_mm); }
    if (data.height_mm !== undefined) { fields.push('height_mm = ?'); values.push(data.height_mm); }
    if (data.columns !== undefined) { fields.push('columns = ?'); values.push(data.columns); }
    if (data.show_name !== undefined) { fields.push('show_name = ?'); values.push(data.show_name ? 1 : 0); }
    if (data.show_price !== undefined) { fields.push('show_price = ?'); values.push(data.show_price ? 1 : 0); }
    if (data.show_sku !== undefined) { fields.push('show_sku = ?'); values.push(data.show_sku ? 1 : 0); }
    if (data.show_barcode_text !== undefined) { fields.push('show_barcode_text = ?'); values.push(data.show_barcode_text ? 1 : 0); }
    if (data.is_default !== undefined) { fields.push('is_default = ?'); values.push(data.is_default ? 1 : 0); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE barcode_label_templates SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return this.getTemplateById(id);
  }

  static async deleteTemplate(id) {
    const [result] = await pool.query('DELETE FROM barcode_label_templates WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = BarcodeTemplateModel;
