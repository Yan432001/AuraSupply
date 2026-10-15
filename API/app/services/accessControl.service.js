const { db } = require('../config/utill/helper');

/**
 * Check if a user has a specific permission key using SQL aura_user_can()
 * @param {number} userId
 * @param {string} permissionKey
 * @returns {Promise<boolean>}
 */
async function userCan(userId, permissionKey) {
  if (!userId || !permissionKey) return false;
  try {
    const [rows] = await db.query(
      'SELECT aura_user_can(?, ?) AS allowed',
      [userId, permissionKey]
    );
    return rows && rows.length > 0 && Number(rows[0].allowed) === 1;
  } catch (err) {
    console.error(`[userCan check error for user ${userId}, key ${permissionKey}]:`, err.message);
    return false;
  }
}

/**
 * Get all active permission keys allowed for a user
 * Evaluates:
 *   1. Owner (level = 1) -> all keys allowed
 *   2. Group rights (aura_group_permissions where allowed = 1)
 *   3. User overrides (aura_user_permissions where effect = 'allow' or 'deny', deny wins)
 * @param {number} userId
 * @param {number} groupId
 * @param {number} groupLevel
 * @returns {Promise<string[]>}
 */
async function getUserAllowedPermissions(userId, groupId, groupLevel) {
  try {
    // 1. Owner bypass (level 1)
    if (Number(groupLevel) === 1) {
      const [allKeys] = await db.query(
        'SELECT permission_key FROM aura_permission_keys WHERE is_active = 1'
      );
      return allKeys.map(k => k.permission_key);
    }

    // 2. Base group permissions
    const [groupPerms] = await db.query(`
      SELECT gp.permission_key
      FROM aura_group_permissions gp
      JOIN aura_permission_keys pk ON pk.permission_key = gp.permission_key
      WHERE gp.group_id = ? AND gp.allowed = 1 AND pk.is_active = 1
    `, [groupId]);

    const allowedSet = new Set(groupPerms.map(p => p.permission_key));

    // 3. User-specific overrides (aura_user_permissions)
    const [overrides] = await db.query(
      'SELECT permission_key, effect FROM aura_user_permissions WHERE user_id = ?',
      [userId]
    );

    for (const ov of overrides) {
      if (ov.effect === 'deny') {
        allowedSet.delete(ov.permission_key); // Deny always wins
      } else if (ov.effect === 'allow') {
        allowedSet.add(ov.permission_key);
      }
    }

    return Array.from(allowedSet);
  } catch (err) {
    console.error('[getUserAllowedPermissions error]:', err.message);
    return [];
  }
}

/**
 * Get allowed branches / stores / shops for a user
 * If level <= 2 (owner/admin), user has access to ALL active branches.
 * Otherwise, returns branches assigned in aura_user_billers.
 * @param {number} userId
 * @param {number} groupLevel
 * @returns {Promise<Array<{ id: number, name: string, code: string, company_type: string, is_default: boolean }>>}
 */
async function getUserAllowedBranches(userId, groupLevel) {
  try {
    if (Number(groupLevel) <= 2) {
      // Owner or Admin sees every active branch/store/shop
      const [allBranches] = await db.query(`
        SELECT id, name, code, company_type, status, 1 AS is_default
        FROM aura_companies
        WHERE company_type IN ('branch','store','shop','warehouse','biller')
          AND status = 'active'
          AND deleted_at IS NULL
        ORDER BY id ASC
      `);
      return allBranches;
    }

    // Standard staff: query assigned branches via aura_user_billers
    const [assigned] = await db.query(`
      SELECT c.id, c.name, c.code, c.company_type, c.status, ub.is_default
      FROM aura_user_billers ub
      JOIN aura_companies c ON c.id = ub.biller_id
      WHERE ub.user_id = ?
        AND c.status = 'active'
        AND c.deleted_at IS NULL
      ORDER BY ub.is_default DESC, c.id ASC
    `, [userId]);

    return assigned;
  } catch (err) {
    console.error('[getUserAllowedBranches error]:', err.message);
    return [];
  }
}

/**
 * Log an action to aura_user_audit_trails
 */
async function logAuditTrail({
  userId,
  tableName,
  action,
  recordId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null
}) {
    const eventVal = ['insert', 'update', 'delete'].includes(String(action || '').toLowerCase())
      ? String(action).toLowerCase()
      : (action === 'create' ? 'insert' : (action === 'delete' || action === 'remove' ? 'delete' : 'update'));

    await db.query(`
      INSERT INTO aura_user_audit_trails (
        user_id, table_name, event, old_values, new_values, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      userId || null,
      tableName || 'system',
      eventVal,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress || null
    ]);
  } catch (err) {
    // Fail silently so auditing never crashes transaction
    console.warn('[AuditTrail log warning]:', err.message);
  }
}

module.exports = {
  userCan,
  getUserAllowedPermissions,
  getUserAllowedBranches,
  logAuditTrail
};
