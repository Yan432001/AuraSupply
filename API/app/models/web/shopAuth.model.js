const { db } = require("../../config/utill/helper");
const { logError } = require("../../config/utill/logErr");

/**
 * Website & Shop Authentication Model
 * Single Source of Truth: aura_users (All profile data consolidated directly in aura_users)
 */
class ShopAuth_Model {
  /**
   * Find website customer / buyer / supplier by username or email
   */
  static async findCustomerByIdentity(identity) {
    try {
      const cleanIdentity = identity.trim().toLowerCase();
      const sql = `
        SELECT u.id, u.uuid, u.username, u.email, u.password, u.password_hash, u.password_algo, u.salt, u.group_id,
               u.status, u.active, u.first_name, u.last_name, u.company, u.phone, u.avatar, u.avatar_url,
               u.failed_login_count, u.locked_until, u.deleted_at,
               g.name AS group_name, g.description AS group_description, g.level AS group_level,
               g.allow_web_login, g.allow_admin_login,
               u.company_kh, u.vat_no, u.address, u.business_type, u.contact_person, u.city, u.country
        FROM aura_users u
        JOIN aura_groups g ON g.id = u.group_id
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
        SELECT u.id, u.uuid, u.username, u.email, u.group_id,
               u.status, u.active, u.first_name, u.last_name, u.company, u.phone, u.avatar, u.avatar_url,
               g.name AS group_name, g.level AS group_level,
               u.company_kh, u.vat_no, u.address, u.business_type, u.contact_person, u.city, u.country
        FROM aura_users u
        JOIN aura_groups g ON g.id = u.group_id
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
   * Register a new customer / buyer / supplier directly into aura_users
   */
  static async registerCustomer(data) {
    try {
      const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      const sqlUser = `
        INSERT INTO aura_users (
          uuid, username, email, password, password_hash, password_algo, group_id,
          first_name, last_name, company, phone, status, register_source,
          active, contact_person, business_type, vat_no, address, created_at
        ) VALUES (UUID(), ?, ?, ?, ?, 'bcrypt', ?, ?, ?, ?, ?, ?, 'website', ?, ?, ?, ?, ?, NOW())
      `;
      const [result] = await db.query(sqlUser, [
        data.username,
        data.email,
        data.passwordHash,
        data.passwordHash,
        data.groupId,
        data.firstName,
        data.lastName || '',
        data.company || null,
        data.phone,
        data.status,
        data.active,
        fullName || data.username,
        data.businessType || null,
        data.vatNo || null,
        data.address || null
      ]);

      return result.insertId;
    } catch (err) {
      logError("ShopAuth_Model.registerCustomer", err, null);
      throw err;
    }
  }

  /**
   * Update customer profile directly in aura_users
   */
  static async updateCustomerProfile(userId, profileData) {
    try {
      const updates = [];
      const params = [];

      if (profileData.username) {
        updates.push('username = ?');
        params.push(profileData.username.trim());
      }
      if (profileData.first_name !== undefined) {
        updates.push('first_name = ?');
        params.push(profileData.first_name ? profileData.first_name.trim() : null);
      }
      if (profileData.last_name !== undefined) {
        updates.push('last_name = ?');
        params.push(profileData.last_name ? profileData.last_name.trim() : null);
      }
      if (profileData.phone !== undefined) {
        updates.push('phone = ?');
        params.push(profileData.phone ? profileData.phone.trim() : null);
      }
      if (profileData.company !== undefined) {
        updates.push('company = ?');
        params.push(profileData.company ? profileData.company.trim() : null);
      }
      if (profileData.name || profileData.contact_person) {
        updates.push('contact_person = ?');
        params.push((profileData.contact_person || profileData.name).trim());
      }
      if (profileData.vat_no !== undefined) {
        updates.push('vat_no = ?');
        params.push(profileData.vat_no ? profileData.vat_no.trim() : null);
      }
      if (profileData.address !== undefined) {
        updates.push('address = ?');
        params.push(profileData.address ? profileData.address.trim() : null);
      }
      if (profileData.business_type !== undefined) {
        updates.push('business_type = ?');
        params.push(profileData.business_type ? profileData.business_type.trim() : null);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        params.push(userId);
        await db.query(`UPDATE aura_users SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      return true;
    } catch (err) {
      logError("ShopAuth_Model.updateCustomerProfile", err, null);
      throw err;
    }
  }
}

module.exports = ShopAuth_Model;
