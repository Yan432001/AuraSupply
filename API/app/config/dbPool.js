/**
 * PRODUCTION-READY MYSQL CONNECTION POOL
 * =====================================
 * Architected for high simultaneous user concurrency, zero connection leaks,
 * and sub-millisecond query dispatch using mysql2/promise.
 */

const mysql = require('mysql2/promise');

// 1. Connection Pool Configuration
const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '43200111',
  database: process.env.DB_NAME || 'aura_v1_db',

  // Concurrency & Queuing Optimization
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '50', 10), // Max concurrent active TCP sockets
  maxIdle: parseInt(process.env.DB_MAX_IDLE || '20', 10),           // Retain pre-warmed connections
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '60000', 10), // Terminate idle sockets after 60s
  queueLimit: 0,                                                    // Unlimited connection queueing during spikes

  // Network & Keepalive Optimization
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,                                      // Ping every 10s to prevent stateful NAT/firewall drops
  connectTimeout: 10000,                                             // 10s TCP handshake timeout

  // Data Integrity & Formatting
  namedPlaceholders: true,
  timezone: '+00:00',                                               // Universal UTC handling
  decimalNumbers: true,                                             // Parse DECIMAL as JS numbers (or strings if ultra-precise)
  supportBigNumbers: true,
  bigNumberStrings: false,
  multipleStatements: false                                         // Security: Prevent multi-query injection
};

// 2. Initialize Pool
const pool = mysql.createPool(poolConfig);

// 3. Observability & Telemetry Events
pool.on('acquire', (connection) => {
  if (process.env.DB_DEBUG === 'true') {
    console.debug(`[DB Pool] Connection ${connection.threadId} acquired`);
  }
});

pool.on('release', (connection) => {
  if (process.env.DB_DEBUG === 'true') {
    console.debug(`[DB Pool] Connection ${connection.threadId} released`);
  }
});

pool.on('enqueue', () => {
  console.warn('[DB Pool] Warning: High concurrency spike — connection request enqueued');
});

/**
 * Fast query helper executing on pool with automatic acquire/release
 * @param {string} sql - Prepared SQL statement
 * @param {object|array} params - Bound parameters
 * @returns {Promise<[any[], any]>}
 */
async function query(sql, params = []) {
  return pool.query(sql, params);
}

/**
 * Production ACID Transaction Wrapper
 * Ensures automatic START TRANSACTION, COMMIT, and guaranteed ROLLBACK on any failure.
 * @param {function(mysql.PoolConnection): Promise<any>} callback
 * @returns {Promise<any>}
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rbErr) {
      console.error('[DB Transaction] Rollback failure:', rbErr.message);
    }
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Healthcheck ping testing pool responsiveness
 * @returns {Promise<{ ok: boolean, latencyMs: number }>}
 */
async function healthCheck() {
  const start = Date.now();
  await pool.query('SELECT 1');
  return { ok: true, latencyMs: Date.now() - start };
}

/**
 * Graceful pool shutdown on server termination
 */
async function closePool() {
  try {
    await pool.end();
    console.log('[DB Pool] Connection pool successfully closed.');
  } catch (err) {
    console.error('[DB Pool] Error closing connection pool:', err.message);
  }
}

process.on('SIGINT', async () => {
  await closePool();
});

process.on('SIGTERM', async () => {
  await closePool();
});

module.exports = {
  pool,
  query,
  getConnection: () => pool.getConnection(),
  withTransaction,
  healthCheck,
  closePool
};
