const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");

/**
 * Website & Shop Authentication Model
 * Ported from CodeIgniter 3 AURA_v1 (bpas/models/shop/Shop_model.php)
 */
class ShopAuth_Model {
  /**
   * Find website customer / buyer / supplier by username or email
   */
  static async findCustomerByIdentity(identity) {
    try {
      const cleanIdentity = identity.trim().toLowerCase();
      const sql = `
        SELECT u.id, u.username, u.email, u.password, u.password_algo, u.salt, u.group_id,
               u.status, u.active, u.first_name, u.last_name, u.company, u.phone, u.avatar,
               u.failed_login_count, u.locked_until, u.deleted_at,
               g.name AS group_name, g.description AS group_description, g.level AS group_level,
               g.allow_web_login, g.allow_admin_login,
               p.company_kh, p.vat_no, p.address, p.business_type
        FROM aura_users u
        JOIN aura_groups g ON g.id = u.group_id
        LEFT JOIN aura_user_profiles p ON p.user_id = u.id
        WHERE (LOWER(u.username) = ? OR LOWER(u.email) = ?) AND u.deleted_at IS NULL
        LIMIT 1
      `;
      const [rows] = await db.query(sql, [cleanIdentity, cleanIdentity]);
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
      logError("ShopAuth_Model.findCustomerByIdentity", err, null);
      throw err;
    }
  }

  /**
   * Find website customer by ID with full profile data
   */
  static async findCustomerById(userId) {
    try {
      const sql = `
        SELECT u.id, u.username, u.email, u.group_id,
               u.status, u.active, u.first_name, u.last_name, u.company, u.phone, u.avatar,
               g.name AS group_name, g.level AS group_level,
               p.company_kh, p.vat_no, p.address, p.business_type
        FROM aura_users u
        JOIN aura_groups g ON g.id = u.group_id
        LEFT JOIN aura_user_profiles p ON p.user_id = u.id
        WHERE u.id = ? AND u.deleted_at IS NULL
        LIMIT 1
      `;
      const [rows] = await db.query(sql, [userId]);
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
      logError("ShopAuth_Model.findCustomerById", err, null);
      throw err;
    }
  }

  /**
   * Register a new customer / buyer / supplier
   */
  static async registerCustomer(data) {
    try {
      const sqlUser = `
        INSERT INTO aura_users (
          username, email, password, password_algo, group_id,
          first_name, last_name, company, phone, status, register_source,
          active, created_at
        ) VALUES (?, ?, ?, 'bcrypt', ?, ?, ?, ?, ?, ?, 'website', ?, NOW())
      `;
      const [result] = await db.query(sqlUser, [
        data.username,
        data.email,
        data.passwordHash,
        data.groupId,
        data.firstName,
        data.lastName || '',
        data.company || null,
        data.phone,
        data.status,
        data.active
      ]);

      const newUserId = result.insertId;

      const sqlProfile = `
        INSERT INTO aura_user_profiles (
          user_id, contact_person, business_type, vat_no, address, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `;
      await db.query(sqlProfile, [
        newUserId,
        `${data.firstName} ${data.lastName || ''}`.trim(),
        data.businessType || null,
        data.vatNo || null,
        data.address || null
      ]);

      return newUserId;
    } catch (err) {
      logError("ShopAuth_Model.registerCustomer", err, null);
      throw err;
    }
  }

  /**
   * Update customer profile
   */
  static async updateCustomerProfile(userId, profileData) {
    try {
      if (profileData.first_name || profileData.phone || profileData.company) {
        await db.query(`
          UPDATE aura_users
          SET first_name = COALESCE(?, first_name),
              last_name = COALESCE(?, last_name),
              phone = COALESCE(?, phone),
              company = COALESCE(?, company),
              updated_at = NOW()
          WHERE id = ?
        `, [profileData.first_name, profileData.last_name, profileData.phone, profileData.company, userId]);
      }

      await db.query(`
        INSERT INTO aura_user_profiles (user_id, contact_person, vat_no, address, updated_at)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          contact_person = COALESCE(VALUES(contact_person), contact_person),
          vat_no = COALESCE(VALUES(vat_no), vat_no),
          address = COALESCE(VALUES(address), address),
          updated_at = NOW()
      `, [userId, profileData.name || null, profileData.vat_no || null, profileData.address || null]);

      return true;
    } catch (err) {
      logError("ShopAuth_Model.updateCustomerProfile", err, null);
      throw err;
    }
  }
}

module.exports = ShopAuth_Model;
