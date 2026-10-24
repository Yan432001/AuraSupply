/**
 * Public Website Authentication & Session Controller
 * Ported strictly from CodeIgniter 3 AURA_v1 (bpas/controllers/Main.php & models/shop/Shop_model.php)
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db, access_token_key } = require('../../config/utill/helper');
const { sendSuccess, sendError } = require('../../config/utill/response');
const tokenService = require('../../services/token.service');
const accessControlService = require('../../services/accessControl.service');
const sessionService = require('../../services/session.service');
const authConfig = require('../../config/auth.config');
const ShopAuth_Model = require('../../models/web/shopAuth.model');

const JWT_SECRET = process.env.JWT_SECRET || access_token_key || 'AURA_ERP_SECRET_TOKEN_2026';
const ACCESS_TOKEN_EXPIRY = '4h';

/**
 * POST /api/web/auth/register
 * Public Website Self-Registration for Customers and Suppliers
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
    const existing = await ShopAuth_Model.findCustomerByIdentity(cleanEmail);
    if (existing) {
      return sendError(res, 'An account with this email address already exists. Please sign in instead.', 409);
    }

    // Generate clean username from name/email
    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
    const uniqueSuffix = Math.floor(100 + Math.random() * 900);
    const username = `${baseUsername}_${uniqueSuffix}`;

    const hash = await bcrypt.hash(password, 10);
    const initialStatus = Number(group.requires_approval) === 1 ? 'pending' : 'active';

    const newUserId = await ShopAuth_Model.registerCustomer({
      username,
      email: cleanEmail,
      passwordHash: hash,
      groupId: group.id,
      firstName: name.trim(),
      company: company ? company.trim() : null,
      phone: phone.trim(),
      status: initialStatus,
      active: initialStatus === 'active' ? 1 : 0,
      businessType: business_type,
      vatNo: vat_no,
      address
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
      requiresApproval: isPending
    }, message, null, 201);
  } catch (err) {
    console.error('[Web Register Error]', err);
    return sendError(res, 'Registration failed due to a server error', 500, err.message);
  }
};

/**
 * POST /api/web/auth/login
 * Public Website Login for Buyers (Customers) and Suppliers
 */
exports.login = async (req, res) => {
  try {
    const { login, username, email, password, remember = false, remember_me = false } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const isRemember = Boolean(remember || remember_me);

    const rawLogin = login || username || email;
    if (!rawLogin || !password) {
      return sendError(res, 'Email or username and password are required', 400);
    }

    const cleanLogin = rawLogin.trim().toLowerCase();
    const user = await ShopAuth_Model.findCustomerByIdentity(cleanLogin);

    if (!user) {
      await db.query(`
        INSERT INTO aura_login_attempts (login, ip_address, area, time)
        VALUES (?, ?, 'website', UNIX_TIMESTAMP())
      `, [cleanLogin, ipAddress]);
      return sendError(res, 'Invalid credentials', 401);
    }

    // Enforce Website Login Access (Staff cannot log in on public website)
    if (Number(user.allow_web_login) !== 1) {
      return sendError(
        res,
        'Staff accounts cannot log in to the public website. Please sign in via the administrative portal at /admins.',
        403,
        { code: 'FORBIDDEN_STAFF_ON_WEB' }
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

    if (user.status !== 'active' || user.active === 0) {
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
    let needsUpgrade = false;

    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'))) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      const sha1Hash = crypto.createHash('sha1').update(password).digest('hex');
      if (sha1Hash === user.password) {
        passwordMatches = true;
        needsUpgrade = true;
      }
    }

    if (!passwordMatches) {
      await db.query(`
        INSERT INTO aura_login_attempts (login, ip_address, area, time)
        VALUES (?, ?, 'website', UNIX_TIMESTAMP())
      `, [cleanLogin, ipAddress]);
      return sendError(res, 'Invalid email or password', 401);
    }

    if (needsUpgrade) {
      const newHash = await bcrypt.hash(password, 10);
      await db.query("UPDATE aura_users SET password = ?, password_algo = 'bcrypt' WHERE id = ?", [newHash, user.id]);
    }

    // Record login in aura_user_logins (area='website', success=1)
    await db.query(`
      INSERT INTO aura_user_logins (user_id, login, area, success, ip_address, user_agent, time)
      VALUES (?, ?, 'website', 1, ?, ?, NOW())
    `, [user.id, user.username, ipAddress, userAgent]);

    await db.query(`
      UPDATE aura_users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?
    `, [ipAddress, user.id]);

    // Issue JWT access token
    const tokenPayload = {
      id: user.id,
      user_id: user.id,
      username: user.username,
      email: user.email,
      group_id: user.group_id,
      role: user.group_name || 'customer',
      level: user.group_level,
      area: 'website'
    };

    const tokenExpiry = isRemember ? '30d' : ACCESS_TOKEN_EXPIRY;
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: tokenExpiry });

    // Register active website session & inactivity tracking
    await sessionService.registerSession({
      userId: user.id,
      token: accessToken,
      area: 'website',
      remember: isRemember,
      ipAddress,
      userAgent
    });

    // Set secure HttpOnly, SameSite website session cookie
    sessionService.setSessionCookie(res, 'web', accessToken, isRemember);

    // Fetch allowed website permission keys
    const allowedPermissions = await accessControlService.getUserAllowedPermissions(user.id, user.group_id, user.group_level);

    const customerUserData = {
      id: user.id,
      user_id: user.id,
      username: user.username,
      email: user.email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      company: user.company,
      phone: user.phone,
      avatar: user.avatar,
      role: user.group_name || 'customer',
      group_name: user.group_name || 'customer',
      group_id: user.group_id,
      level: user.group_level,
      address: user.address,
      vat_no: user.vat_no
    };

    return sendSuccess(res, {
      token: accessToken,
      access_token: accessToken,
      user: customerUserData,
      profile: customerUserData,
      permissions: allowedPermissions
    }, 'Welcome back to Aura Supply B2B');
  } catch (err) {
    console.error('[Web Login Error]', err);
    return sendError(res, 'Authentication failed due to server error', 500, err.message);
  }
};

/**
 * GET /api/web/auth/session or GET /api/web/auth/profile
 * Return website customer profile
 */
exports.profile = async (req, res) => {
  try {
    const userId = req.user_id || req.user?.id;
    if (!userId) {
      return sendError(res, 'Unauthenticated', 401);
    }

    const customer = await ShopAuth_Model.findCustomerById(userId);
    if (!customer) {
      sessionService.clearSessionCookie(res, 'web');
      return sendError(res, 'Customer account not found', 404);
    }

    if (req.token) {
      sessionService.touchActivity(req.token);
    }

    const customerData = {
      id: customer.id,
      user_id: customer.id,
      username: customer.username,
      email: customer.email,
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.username,
      first_name: customer.first_name,
      last_name: customer.last_name,
      company: customer.company,
      phone: customer.phone,
      avatar: customer.avatar,
      role: customer.group_name || 'customer',
      group_name: customer.group_name || 'customer',
      group_id: customer.group_id,
      level: customer.group_level,
      address: customer.address,
      vat_no: customer.vat_no,
      business_type: customer.business_type
    };

    return sendSuccess(res, {
      user: customerData,
      profile: customerData,
      authenticated: true
    });
  } catch (err) {
    console.error('[Web Profile Error]', err);
    return sendError(res, 'Failed to fetch customer profile', 500, err.message);
  }
};

/**
 * POST /api/web/auth/logout
 * Website customer logout
 */
exports.logout = async (req, res) => {
  try {
    const token = req.token || req.headers.authorization?.replace('Bearer ', '') || req.cookies?.[authConfig.session.webCookieName];
    if (token) {
      await sessionService.revokeSession(token);
    }

    sessionService.clearSessionCookie(res, 'web');
    return sendSuccess(res, null, 'Logged out successfully from website session');
  } catch (err) {
    return sendError(res, 'Failed to logout', 500, err.message);
  }
};

/**
 * POST /api/web/auth/activity
 * Website user activity heartbeat
 */
exports.activity = async (req, res) => {
  const token = req.token || req.headers.authorization?.replace('Bearer ', '') || req.cookies?.[authConfig.session.webCookieName];
  if (token) {
    sessionService.touchActivity(token);
  }
  return sendSuccess(res, { timestamp: Date.now() });
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
