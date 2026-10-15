const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db, access_token_key } = require('../../config/utill/helper');
const { sendSuccess, sendError } = require('../../config/utill/response');
const tokenService = require('../../services/token.service');
const accessControlService = require('../../services/accessControl.service');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';
const ACCESS_TOKEN_EXPIRY = '4h';

/**
 * POST /api/web/auth/register
 * Public Website Self-Registration for Customers and Suppliers
 *
 * Rules:
 *   - Only allowed for roles where aura_groups.allow_web_register = 1
 *   - Customer: status = 'active'
 *   - Supplier: status = 'pending' (requires_approval = 1, requires admin approval in /admins)
 *   - Hashed with bcrypt, password_algo = 'bcrypt', register_source = 'website'
 *   - Creates aura_user_profiles row
 *   - Issues email_verify token
 */
exports.register = async (req, res) => {
  try {
    const {
      name,
      company,
      phone,
      email,
      password,
      role = 'customer',
      address,
      business_type,
      vat_no
    } = req.body;

    if (!name || !email || !password || !phone) {
      return sendError(res, 'Name, email, phone number, and password are required', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role.trim().toLowerCase();

    // Check if role is allowed to register on the website
    const [groups] = await db.query(
      'SELECT id, name, level, allow_web_register, allow_web_login, requires_approval FROM aura_groups WHERE LOWER(name) = ? LIMIT 1',
      [cleanRole]
    );

    if (!groups || groups.length === 0 || Number(groups[0].allow_web_register) !== 1) {
      return sendError(res, `Self-registration for role '${role}' is not permitted.`, 400);
    }

    const group = groups[0];

    // Check unique email and username
    const [existing] = await db.query(
      'SELECT id, email, username FROM aura_users WHERE (LOWER(email) = ? OR LOWER(username) = ?) AND deleted_at IS NULL LIMIT 1',
      [cleanEmail, cleanEmail]
    );
    if (existing && existing.length > 0) {
      return sendError(res, 'An account with this email address already exists. Please sign in instead.', 409);
    }

    // Generate clean username from name/email
    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
    const uniqueSuffix = Math.floor(100 + Math.random() * 900);
    const username = `${baseUsername}_${uniqueSuffix}`;

    const hash = await bcrypt.hash(password, 10);

    // Determine initial status based on approval requirement
    const initialStatus = Number(group.requires_approval) === 1 ? 'pending' : 'active';

    // Insert into aura_users
    const [userResult] = await db.query(`
      INSERT INTO aura_users (
        username, email, password, password_algo, group_id,
        first_name, company, phone, status, register_source,
        active, created_at
      ) VALUES (?, ?, ?, 'bcrypt', ?, ?, ?, ?, ?, 'website', ?, NOW())
    `, [
      username,
      cleanEmail,
      hash,
      group.id,
      name.trim(),
      company ? company.trim() : null,
      phone.trim(),
      initialStatus,
      initialStatus === 'active' ? 1 : 0
    ]);

    const newUserId = userResult.insertId;

    // Create aura_user_profiles row
    await db.query(`
      INSERT INTO aura_user_profiles (
        user_id, contact_person, business_type, vat_no, address, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      newUserId,
      name.trim(),
      business_type || null,
      vat_no || null,
      address || null
    ]);

    // Issue email verification token (valid for 24h)
    const { plainToken } = await tokenService.issueToken({
      userId: newUserId,
      type: 'email_verify',
      area: 'website',
      expiresInSeconds: 86400
    });

    const isPending = initialStatus === 'pending';
    const message = isPending
      ? 'Supplier application submitted successfully! Your account is pending review by our operations team.'
      : 'Account registered successfully! You may now sign in.';

    return sendSuccess(res, {
      userId: newUserId,
      username,
      email: cleanEmail,
      role: group.name,
      status: initialStatus,
      requiresApproval: isPending,
      verificationToken: plainToken
    }, message, null, 201);
  } catch (err) {
    console.error('[Web Register Error]', err);
    return sendError(res, 'Registration failed due to a server error', 500, err.message);
  }
};

/**
 * POST /api/web/auth/login
 * Public Website Login for Buyers (Customers) and Suppliers
 *
 * Rules:
 *   - allow_web_login = 1 only. Staff accounts CANNOT log in on the website!
 *   - Migrated customers/suppliers have password '!': return prompt to use forgot-password
 *   - Checks website permission keys (web.catalog.view, web.rfq.create, web.orders.view, web.products.manage)
 */
exports.login = async (req, res) => {
  try {
    const { login, password, remember_me = false } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (!login || !password) {
      return sendError(res, 'Email or username and password are required', 400);
    }

    const cleanLogin = login.trim().toLowerCase();

    // Query aura_users joined with aura_groups and aura_user_profiles
    const [users] = await db.query(`
      SELECT u.id, u.username, u.email, u.password, u.password_algo, u.group_id,
             u.status, u.first_name, u.company, u.phone, u.failed_login_count, u.locked_until,
             g.name AS group_name, g.description AS group_description, g.level AS group_level,
             g.allow_web_login, g.allow_admin_login,
             p.company_kh, p.vat_no, p.address
      FROM aura_users u
      JOIN aura_groups g ON g.id = u.group_id
      LEFT JOIN aura_user_profiles p ON p.user_id = u.id
      WHERE (LOWER(u.username) = ? OR LOWER(u.email) = ?) AND u.deleted_at IS NULL
      LIMIT 1
    `, [cleanLogin, cleanLogin]);

    if (!users || users.length === 0) {
      await db.query(`
        INSERT INTO aura_login_attempts (login, ip_address, area, time)
        VALUES (?, ?, 'website', NOW())
      `, [cleanLogin, ipAddress]);
      return sendError(res, 'Invalid credentials', 401);
    }

    const user = users[0];

    // Enforce Website Login Access
    if (Number(user.allow_web_login) !== 1) {
      return sendError(
        res,
        'Staff accounts cannot log in to the public website. Please sign in via the administrative portal at /admins.',
        403
      );
    }

    // Check Account Status
    if (user.status === 'pending') {
      return sendError(
        res,
        'Your supplier account is pending verification and approval by our procurement team.',
        403,
        { status: 'pending' }
      );
    }

    if (user.status !== 'active') {
      return sendError(res, `Account is currently ${user.status}. Please contact support.`, 403);
    }

    // Check Migrated Accounts with '!' placeholder password
    if (user.password === '!') {
      return sendError(
        res,
        'Your account was migrated from our catalog records. Please set your password using "Forgot Password".',
        400,
        { requiresPasswordReset: true }
      );
    }

    // Password verification
    let passwordMatches = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      const sha1Hash = crypto.createHash('sha1').update(password).digest('hex');
      if (sha1Hash === user.password) {
        passwordMatches = true;
      }
    }

    if (!passwordMatches) {
      await db.query(`
        INSERT INTO aura_login_attempts (login, ip_address, area, time)
        VALUES (?, ?, 'website', NOW())
      `, [cleanLogin, ipAddress]);
      return sendError(res, 'Invalid email or password', 401);
    }

    // Record login in aura_user_logins (area='website', success=1)
    await db.query(`
      INSERT INTO aura_user_logins (user_id, area, success, ip_address, user_agent, time)
      VALUES (?, 'website', 1, ?, ?, NOW())
    `, [user.id, ipAddress, userAgent]);

    await db.query(`
      UPDATE aura_users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?
    `, [ipAddress, user.id]);

    // Issue JWT access token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      group_id: user.group_id,
      role: user.group_name,
      level: user.group_level,
      area: 'website'
    };
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

    // Issue refresh token
    const { plainToken: refreshToken } = await tokenService.issueToken({
      userId: user.id,
      type: 'refresh',
      area: 'website',
      expiresInSeconds: remember_me ? 30 * 24 * 3600 : 7 * 24 * 3600,
      ipAddress,
      userAgent
    });

    // Fetch allowed website permission keys (e.g. web.catalog.view, web.rfq.create, web.orders.view, web.products.manage)
    const allowedPermissions = await accessControlService.getUserAllowedPermissions(user.id, user.group_id, user.group_level);

    return sendSuccess(res, {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.first_name,
        company: user.company,
        phone: user.phone,
        role: user.group_name,
        level: user.group_level
      },
      permissions: allowedPermissions
    }, 'Welcome back to Aura Supply B2B');
  } catch (err) {
    console.error('[Web Login Error]', err);
    return sendError(res, 'Authentication failed due to server error', 500, err.message);
  }
};

/**
 * POST /api/web/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return sendError(res, 'Verification token is required', 400);

    const tokenRow = await tokenService.validateToken(token, 'email_verify', 'website');
    if (!tokenRow) {
      return sendError(res, 'Invalid or expired verification token', 400);
    }

    await db.query('UPDATE aura_users SET email_verified_at = NOW() WHERE id = ?', [tokenRow.user_id]);
    await tokenService.markTokenUsed(tokenRow.id);

    return sendSuccess(res, null, 'Email address successfully verified.');
  } catch (err) {
    return sendError(res, 'Verification failed', 500, err.message);
  }
};
