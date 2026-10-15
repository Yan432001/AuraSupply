const EMenuModel = require('../models/emenu.model');
const { sendOrderToShopGroup, getRecentDispatches } = require('../services/telegramNotification.service');
const rawSimpleData = require('../../../data/simpleData');
const simpleData = rawSimpleData.default || rawSimpleData;

exports.getStoreList = async (req, res) => {
  try {
    return res.status(200).json({ status: true, data: simpleData.stores });
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
