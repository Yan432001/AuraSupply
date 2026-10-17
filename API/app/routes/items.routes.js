/**
 * HIGH-VOLUME ERP ITEMS & RBAC ROUTES
 * ===================================
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const itemsController = require('../controllers/items.controller');
const { checkPermission } = require('../middleware/rbac.middleware');
const { query } = require('../config/dbPool');

const JWT_SECRET = process.env.JWT_SECRET || 'AURA_ERP_SECRET_TOKEN_2026';

/**
 * Lightweight Auth Hydrator Middleware
 * Populates req.user from JWT bearer token, session, or internal auth.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded?.id || decoded?.user_id || decoded?.data?.profile?.id || decoded?.data?.id;
      } catch {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Invalid or expired token.'
        });
      }
    } else if (req.session && req.session.user_id) {
      userId = req.session.user_id;
    } else if (process.env.NODE_ENV !== 'production' && req.headers['x-user-id']) {
      userId = req.headers['x-user-id'];
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required. No bearer token provided.'
      });
    }

    // Hydrate user core identity from `users`
    const [rows] = await query(
      'SELECT id, uuid, username, email, first_name, last_name, status, is_system_admin FROM users WHERE id = :id AND deleted_at IS NULL LIMIT 1',
      { id: userId }
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User account not found.'
      });
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'User account is inactive or suspended.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Items Route Auth Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication processing error.'
    });
  }
}

// ==========================================
// ITEM ENDPOINTS PROTECTED BY RBAC
// ==========================================

// GET /api/items — Paginated Item Catalog (Sub-50ms)
router.get(
  '/api/items',
  authenticate,
  checkPermission('INVENTORY', 'view'),
  itemsController.getItems
);

// PUT /api/items/:id — Transactional Row-Locked Update
router.put(
  '/api/items/:id',
  authenticate,
  checkPermission('INVENTORY', 'update'),
  itemsController.updateItem
);

module.exports = router;
