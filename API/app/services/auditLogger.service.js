const { db } = require('../config/utill/helper');

/**
 * Log administrative activity to `aura_activity_logs`
 * Tracks user_id, username, role, action, table_name, record_id, old/new values, IP, and user_agent
 */
async function logActivity({ req, action, tableName, recordId = null, oldValues = null, newValues = null }) {
  try {
    const user = req?.user || {};
    const userId = user.id || null;
    const username = user.username || 'system';
    const role = user.role || 'system';
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = (req?.headers?.['user-agent'] || '').slice(0, 255);

    const sql = `
      INSERT INTO aura_activity_logs (
        user_id, username, role, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await db.query(sql, [
      userId,
      username,
      role,
      action.toLowerCase(),
      tableName,
      recordId ? String(recordId) : null,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      String(ip).slice(0, 45),
      userAgent
    ]);
  } catch (err) {
    console.warn('[Audit Logger] Non-blocking warning logging activity:', err.message);
  }
}

module.exports = {
  logActivity
};
