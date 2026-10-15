const express = require('express');
const router = express.Router();
const StoreController = require('../../controller/tma/store.controller');
const OrderController = require('../../controller/tma/order.controller');
const TelegramAuthController = require('../../controller/tma/telegramAuth.controller');
const { verifyTelegramWebAppData } = require('../../middleware/telegramAuth.middleware');

// Telegram user authentication & bot registration
router.post('/auth', OrderController.authTelegramUser);
router.post('/telegram-auth/init', TelegramAuthController.initSession);
router.get('/telegram-auth/check', TelegramAuthController.checkSession);
router.post('/telegram-auth/direct-register', TelegramAuthController.directRegister);

// Store selection endpoints
router.get('/stores', StoreController.getStores);
router.get('/shops', StoreController.getStores);

// Public tenant read endpoints
router.get('/shop/:slug', StoreController.getStore);
router.get('/shop/:slug/categories', StoreController.getCategories);
router.get('/shop/:slug/products', StoreController.getProducts);
router.get('/biller/:id/store', StoreController.resolveBiller);

router.get('/store/:slug', StoreController.getStore);
router.get('/store/:slug/categories', StoreController.getCategories);
router.get('/store/:slug/products', StoreController.getProducts);
router.get('/store/:slug/catalog', StoreController.getProducts);

// Orders query endpoints
router.get('/orders', OrderController.getOrders);
router.get('/orders/:id', OrderController.getOrderById);
router.get('/shop/:slug/orders', OrderController.getOrders);
router.get('/store/:slug/orders', OrderController.getOrders);

// Order status update & retry notification endpoints
router.put('/orders/:id/status', OrderController.updateOrderStatus);
router.patch('/orders/:id/status', OrderController.updateOrderStatus);
router.post('/orders/:id/status', OrderController.updateOrderStatus);
router.post('/orders/:id/retry-notification', OrderController.retryNotification);

// Secure checkout (Permits conditional local testing or strict initData enforcement)
const authMiddleware = (req, res, next) => {
  if (req.headers['x-telegram-init-data']) {
    return verifyTelegramWebAppData(req, res, next);
  }
  // If Telegram user payload is in body or local development
  if (req.body?.customer?.telegramId) {
    req.telegramUser = {
      id: req.body.customer.telegramId,
      first_name: req.body.customer.name || 'Telegram User',
      username: req.body.customer.username?.replace('@', '') || ''
    };
  }
  next();
};

router.post('/orders', authMiddleware, OrderController.createOrder);
router.post('/shop/:slug/orders', authMiddleware, OrderController.createOrder);
router.post('/store/:slug/order', authMiddleware, OrderController.createOrder);
router.post('/checkout', authMiddleware, OrderController.createOrder);

module.exports = router;
