const EMenuModel = require('../models/emenu.model');
const { sendOrderToShopGroup, getRecentDispatches } = require('../services/telegramNotification.service');
const pool = require('../config/utill/connection');

exports.getStoreList = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.id AS storeId, c.id AS biller_id, c.code, c.name, c.company,
             COALESCE(c.slug, c.store_slug, CONCAT('store-', c.id)) AS slug,
             c.address, c.phone, c.email, c.city, c.logo, c.banner,
             c.theme_color, c.currency_code, c.currency_symbol, c.tagline,
             c.rating, c.reviews_count, c.operating_hours,
             (SELECT COUNT(p.id) FROM aura_products p WHERE p.biller_id = c.id AND p.status = 1) AS products_count
      FROM aura_companies c
      WHERE c.group_name = 'biller' AND c.group_id IS NULL
      ORDER BY c.id ASC
    `);
    return res.status(200).json({ status: true, data: rows });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.resolveStore = async (req, res) => {
  try {
    const { identifier } = req.params;
    const store = await EMenuModel.getStoreByIdentifier(identifier);
    if (!store) {
      return res.status(404).json({ status: false, message: 'Store not found' });
    }
    return res.status(200).json({ status: true, data: store });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getStoreMenu = async (req, res) => {
  try {
    const { identifier } = req.params;
    const store = await EMenuModel.getStoreByIdentifier(identifier);
    if (!store) {
      return res.status(404).json({ status: false, message: 'Store not found' });
    }
    const menu = await EMenuModel.getStoreMenu(store.biller_id);
    return res.status(200).json({ status: true, store, data: menu });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.submitOrder = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { cartItems, customerData = {} } = req.body;

    if (!cartItems || !cartItems.length) {
      return res.status(400).json({ status: false, message: 'Cart cannot be empty' });
    }

    const store = await EMenuModel.getStoreByIdentifier(identifier);
    if (!store) {
      return res.status(404).json({ status: false, message: 'Store not found' });
    }

    const customerPayload = {
      ...customerData,
      storeName: store.company || store.name,
      telegramUsername: req.telegramUser ? req.telegramUser.username : null,
      telegramId: req.telegramUser ? req.telegramUser.id : null
    };

    const orderResult = await EMenuModel.createOrder(store.biller_id, customerPayload, cartItems);

    // Send formatted order notification to the shop's Telegram group!
    const dispatchInfo = await sendOrderToShopGroup({
      store,
      order: orderResult,
      customer: customerPayload,
      items: cartItems
    });

    return res.status(201).json({
      status: true,
      message: 'Order created and dispatched to shop group',
      data: {
        ...orderResult,
        dispatchInfo
      }
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

exports.getDispatches = async (req, res) => {
  try {
    const dispatches = getRecentDispatches();
    return res.json({ status: true, data: dispatches });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};
