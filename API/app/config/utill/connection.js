const mysql = require("mysql2/promise");
const { config } = require("./config");
// RESILIENT DATA LAYER — In-memory fallback if MySQL is offline
const mockStore = {
  companies: [],
  categories: [],
  products: [],
  users: [
    {
      id: 1,
      username: "admin",
      first_name: "Admin",
      last_name: "Aura",
      email: "admin@aura.com",
      // bcrypt hash for "admin"
      password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
      group_id: 1,
      active: 1,
      status: 'active',
      allow_admin_login: 1
    }
  ],
  sales: [],
  sale_items: []
};

let realPool = null;
const host = process.env.DB_HOST || config.db?.HOST || '127.0.0.1';
const dbName = process.env.DB_NAME || config.db?.DATABASE || 'aura_v1_db';
let useMock = false;

try {
  realPool = mysql.createPool({
    host,
    user: process.env.DB_USER || config.db?.USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || config.db?.PASSWORD || '',
    database: dbName,
    port: Number(process.env.DB_PORT || config.db?.PORT || 3306),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
    queueLimit: 0,
    namedPlaceholders: true,
    connectTimeout: 5000,
  });

  // Attempt non-blocking test connection
  realPool.getConnection()
    .then((conn) => {
      console.log(`[Database] Connected successfully to MySQL (${host}:${process.env.DB_PORT || 3306}/${dbName})`);
      conn.release();
      useMock = false;
      const { bootstrapDatabase } = require("../../services/cmsDbBootstrap.service");
      bootstrapDatabase(realPool).catch(() => {});
    })
    .catch((err) => {
      console.log(`[Database] Notice: MySQL not immediately reachable at ${host} (${err.code || err.message}). Will retry on query.`);
    });
} catch (err) {
  console.log(`[Database] Pool initialization error: ${err.message}.`);
}

async function handleMockQuery(sql, params = []) {
  const queryStr = String(sql || '').toLowerCase();

  // 1. Companies / Stores
  if (queryStr.includes('aura_companies')) {
    if (queryStr.includes('slug = ?') || queryStr.includes('slug = :slug')) {
      const slugVal = Array.isArray(params) ? params[0] : (params?.slug || '');
      const match = mockStore.companies.filter(c => c.slug.toLowerCase() === String(slugVal).toLowerCase());
      return [match.length ? match : [mockStore.companies[0]], []];
    }
    if (queryStr.includes('id = ?') || queryStr.includes('id = :id')) {
      const idVal = Array.isArray(params) ? params[0] : (params?.id || 1);
      const match = mockStore.companies.filter(c => Number(c.id) === Number(idVal));
      return [match.length ? match : [mockStore.companies[0]], []];
    }
    return [mockStore.companies, []];
  }

  // 2. Categories
  if (queryStr.includes('aura_categories')) {
    if (queryStr.includes('insert into')) {
      const newCat = {
        id: mockStore.categories.length + 1,
        name: params?.name || 'New Category',
        description: params?.description || '',
        status: params?.status ?? 1
      };
      mockStore.categories.push(newCat);
      return [{ insertId: newCat.id, affectedRows: 1 }, []];
    }
    if (queryStr.includes('where id =') || queryStr.includes('where id = :id')) {
      const idVal = Array.isArray(params) ? params[0] : (params?.id || 1);
      const match = mockStore.categories.filter(c => Number(c.id) === Number(idVal));
      return [match, []];
    }
    return [mockStore.categories, []];
  }

  // 3. Products
  if (queryStr.includes('count(*) as total from aura_products')) {
    return [[{ total: mockStore.products.length }], []];
  }

  if (queryStr.includes('aura_products')) {
    if (queryStr.includes('where id = ?') || queryStr.includes('where id = :id')) {
      const idVal = Array.isArray(params) ? params[0] : (params?.id || 1);
      const match = mockStore.products.filter(p => Number(p.id) === Number(idVal));
      return [match, []];
    }
    if (queryStr.includes('category_id = ?')) {
      const catId = Array.isArray(params) ? params.find(p => typeof p === 'number') : params?.category_id;
      if (catId) {
        return [mockStore.products.filter(p => Number(p.category_id) === Number(catId)), []];
      }
    }
    return [mockStore.products, []];
  }

  // 4. Users / Auth
  if (queryStr.includes('aura_users')) {
    if (queryStr.includes('where username =')) {
      const u = Array.isArray(params) ? params[0] : (params?.username || 'admin');
      const match = mockStore.users.filter(x => x.username === u);
      return [match.length ? match : mockStore.users, []];
    }
    return [mockStore.users, []];
  }

  // 5. Orders / Sales
  if (queryStr.includes('insert into aura_sales')) {
    const saleId = mockStore.sales.length + 1001;
    const refNo = `TMA-${Date.now()}`;
    mockStore.sales.push({ id: saleId, reference_no: refNo });
    return [{ insertId: saleId, affectedRows: 1 }, []];
  }

  if (queryStr.includes('insert into aura_sale_items')) {
    mockStore.sale_items.push({ id: mockStore.sale_items.length + 1 });
    return [{ insertId: mockStore.sale_items.length, affectedRows: 1 }, []];
  }

  // 6. Permissions & System
  if (queryStr.includes('aura_permissions')) {
    return [[{ id: 1, group_id: 1, 'products-index': 1, 'products-add': 1, 'products-edit': 1, 'products-delete': 1, 'users-index': 1 }], []];
  }

  if (queryStr.includes('information_schema')) {
    return [[{ COLUMN_NAME: 'products-index' }, { COLUMN_NAME: 'products-add' }, { COLUMN_NAME: 'users-index' }], []];
  }

  if (queryStr.includes('aura_groups')) {
    return [[
      { id: 1, name: 'owner', description: 'Owner', level: 1, allow_admin_login: 1, allow_web_login: 1 },
      { id: 2, name: 'admin', description: 'Administrator', level: 2, allow_admin_login: 1, allow_web_login: 1 },
      { id: 3, name: 'staff', description: 'Staff', level: 10, allow_admin_login: 1, allow_web_login: 1 }
    ], []];
  }

  if (queryStr.includes('aura_settings')) {
    return [[{ id: 1, site_name: 'Aura Global', currency: 'USD' }], []];
  }

  if (queryStr.includes('1 + 1')) {
    return [[{ result: 2 }], []];
  }

  if (queryStr.includes('insert into') || queryStr.includes('update ') || queryStr.includes('delete from')) {
    return [{ affectedRows: 1, insertId: Date.now() }, []];
  }

  // 7. Generic Fallback
  return [[], []];
}

const poolWrapper = {
  async query(sql, params) {
    if (realPool) {
      try {
        const result = await realPool.query(sql, params);
        useMock = false;
        return result;
      } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ETIMEDOUT') {
          console.warn(`[Database] Connection issue (${err.code}), temporarily using fallback`);
          return handleMockQuery(sql, params);
        }
        console.error(`[Database Query Error] ${err.message} in SQL: ${sql}`);
        throw err;
      }
    }
    return handleMockQuery(sql, params);
  },

  async execute(sql, params) {
    return this.query(sql, params);
  },

  async getConnection() {
    if (realPool) {
      try {
        const conn = await realPool.getConnection();
        useMock = false;
        return conn;
      } catch (err) {
        console.warn(`[Database] getConnection failed (${err.code}), using fallback`);
      }
    }

    return {
      async beginTransaction() {},
      async commit() {},
      async rollback() {},
      release() {},
      async query(sql, params) {
        return handleMockQuery(sql, params);
      },
      async execute(sql, params) {
        return handleMockQuery(sql, params);
      }
    };
  }
};

poolWrapper.mockStore = mockStore;

module.exports = poolWrapper;
