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

  async find(id) {
    const pk = this.primaryKey[0] || 'id';
    const [rows] = await db.query(`SELECT * FROM ${this.table} WHERE ${pk} = ? LIMIT 1`, [id]);
    return rows?.[0] || null;
  }

  async findById(id) {
    return this.find(id);
  }

  async findOne(conditions = {}) {
    const keys = Object.keys(conditions);
    if (!keys.length) {
      const [rows] = await db.query(`SELECT * FROM ${this.table} LIMIT 1`);
      return rows?.[0] || null;
    }
    const where = keys.map(k => `${k} = ?`).join(' AND ');
    const values = keys.map(k => conditions[k]);
    const [rows] = await db.query(`SELECT * FROM ${this.table} WHERE ${where} LIMIT 1`, values);
    return rows?.[0] || null;
  }

  async findAll(conditions = {}, options = {}) {
    const keys = Object.keys(conditions);
    let sql = `SELECT * FROM ${this.table}`;
    const values = [];

    if (keys.length) {
      sql += ` WHERE ` + keys.map(k => `${k} = ?`).join(' AND ');
      values.push(...keys.map(k => conditions[k]));
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${Number(options.limit)}`;
      if (options.offset) {
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
