/**
 * BaseModel
 * Base model class providing CRUD interface to MySQL and in-memory mock data
 */

const { db } = require('../../config/utill/helper');

class BaseModel {
  constructor(schema = {}) {
    this.table = schema.table || '';
    this.primaryKey = schema.primaryKey || ['id'];
    this.columns = schema.columns || [];
    this.hidden = schema.hidden || [];
  }

  /**
   * Helper to format selected projection columns (prevents bloated SELECT *)
   * @param {string[]|string} select
   * @returns {string}
   */
  _formatProjection(select) {
    if (!select) return '*';
    if (Array.isArray(select)) {
      return select.map(c => `\`${c.replace(/`/g, '')}\``).join(', ');
    }
    return String(select);
  }

  /**
   * Safe Order By Sanitizer
   * Validates column and direction to block SQL injection
   */
  _sanitizeOrderBy(orderBy) {
    if (!orderBy) return '';
    const parts = String(orderBy).trim().split(/\s+/);
    const col = parts[0].replace(/[^a-zA-Z0-9_]/g, '');
    const dir = parts[1] && parts[1].toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    return `ORDER BY \`${col}\` ${dir}`;
  }

  async find(id, options = {}) {
    const pk = this.primaryKey[0] || 'id';
    const select = this._formatProjection(options.select);
    const [rows] = await db.query(`SELECT ${select} FROM \`${this.table}\` WHERE \`${pk}\` = ? LIMIT 1`, [id]);
    return rows?.[0] || null;
  }

  async findById(id, options = {}) {
    return this.find(id, options);
  }

  async findOne(conditions = {}, options = {}) {
    const select = this._formatProjection(options.select);
    const keys = Object.keys(conditions);
    if (!keys.length) {
      const [rows] = await db.query(`SELECT ${select} FROM \`${this.table}\` LIMIT 1`);
      return rows?.[0] || null;
    }
    const where = keys.map(k => `\`${k.replace(/`/g, '')}\` = ?`).join(' AND ');
    const values = keys.map(k => conditions[k]);
    const [rows] = await db.query(`SELECT ${select} FROM \`${this.table}\` WHERE ${where} LIMIT 1`, values);
    return rows?.[0] || null;
  }

  /**
   * High-Performance Paginated Query
   * Supports:
   *   - Column projection options.select = ['id', 'code', 'price'] (Index Covering scan)
   *   - Keyset Cursor pagination options.cursor = 105 (O(1) seek without OFFSET scan)
   *   - Sanitized order by
   */
  async findAll(conditions = {}, options = {}) {
    const select = this._formatProjection(options.select);
    const keys = Object.keys(conditions);
    const whereClauses = [];
    const values = [];

    // Filter conditions
    if (keys.length) {
      for (const k of keys) {
        whereClauses.push(`\`${k.replace(/`/g, '')}\` = ?`);
        values.push(conditions[k]);
      }
    }

    // Keyset Cursor Seek (B-Tree Seek: 0 Filesort)
    if (options.cursor && !isNaN(options.cursor)) {
      const pk = this.primaryKey[0] || 'id';
      const isAsc = options.orderBy && options.orderBy.toUpperCase().includes('ASC');
      whereClauses.push(`\`${pk}\` ${isAsc ? '>' : '<'} ?`);
      values.push(Number(options.cursor));
    }

    let sql = `SELECT ${select} FROM \`${this.table}\``;
    if (whereClauses.length) {
      sql += ` WHERE ` + whereClauses.join(' AND ');
    }

    if (options.orderBy) {
      sql += ` ` + this._sanitizeOrderBy(options.orderBy);
    }

    if (options.limit) {
      sql += ` LIMIT ${Math.min(Number(options.limit), 500)}`;
      if (options.offset && !options.cursor) {
        sql += ` OFFSET ${Number(options.offset)}`;
      }
    }

    const [rows] = await db.query(sql, values);
    return rows || [];
  }

  async create(data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const [res] = await db.query(sql, Object.values(data));
    return res;
  }

  async update(id, data) {
    const pk = this.primaryKey[0] || 'id';
    const keys = Object.keys(data);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const sql = `UPDATE ${this.table} SET ${setClause} WHERE ${pk} = ?`;
    const [res] = await db.query(sql, [...Object.values(data), id]);
    return res;
  }

  async delete(id) {
    const pk = this.primaryKey[0] || 'id';
    const sql = `DELETE FROM ${this.table} WHERE ${pk} = ?`;
    const [res] = await db.query(sql, [id]);
    return res;
  }

  async count(conditions = {}) {
    const keys = Object.keys(conditions);
    let sql = `SELECT COUNT(*) as count FROM ${this.table}`;
    const values = [];
    if (keys.length) {
      sql += ` WHERE ` + keys.map(k => `${k} = ?`).join(' AND ');
      values.push(...keys.map(k => conditions[k]));
    }
    const [rows] = await db.query(sql, values);
    return rows?.[0]?.count || 0;
  }

  async query(sql, params) {
    return db.query(sql, params);
  }
}

module.exports = BaseModel;
