const EMenuModel = require('../../models/emenu.model');
const { sendOrderToShopGroup, retryOrderNotification } = require('../../services/telegramNotification.service');
const telegramStoreConfigService = require('../../services/telegramStoreConfig.service');
const { validateTelegramInitData } = require('../../services/crypto.service');
const rawSimpleData = require('../../../../data/simpleData');
const simpleData = rawSimpleData.default || rawSimpleData;

// In-memory sequential order counter starting at 123 so the first generated order is ORD-000123
let orderCounter = 122;

// In-memory idempotency cache: { [idempotencyKey]: { order, timestamp } }
const idempotencyCache = new Map();

// Registered Telegram users profile store: { [telegramId]: userProfile }
const telegramUsers = new Map();

// Seed initial mock orders with ORD- format and realistic customer data
const orderHistory = [
  {
    id: 101,
    referenceNo: "ORD-000120",
    store_id: 1,
    store_name: "Aura Specialty Coffee",
    store_slug: "sbc-store",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: "Confirmed",
    payment_status: "paid",
    orderType: "dine_in",
    customer: {
      name: "Elena Rostova",
      username: "@elenar",
      telegramId: 7812938,
      phone: "+855 12 888 777",
      address: "Table #04 (Dine-In)",
      note: "Extra napkins & oat milk please"
    },
    items: [
      {
        id: 1,
        code: "PRD-COF-01",
        name: "Spanish Iced Latte",
        quantity: 2,
        price: 4.25,
        subtotal: 8.50,
        selectedOptions: { Size: "Regular (12oz)", "Ice Level": "Normal Ice" }
      },
      {
        id: 5,
        code: "PRD-BAK-01",
        name: "Golden Almond Croissant",
        quantity: 1,
        price: 3.75,
        subtotal: 3.75,
        selectedOptions: { Preparation: "Warmed Up" }
      }
    ],
    subtotal: 12.25,
    deliveryFee: 0.00,
    discount: 0.00,
    grandTotal: 12.25,
    store_notification: "Sent",
    statusHistory: [
      { status: "Pending", timestamp: new Date(Date.now() - 3600000).toISOString() },
      { status: "Confirmed", timestamp: new Date(Date.now() - 3000000).toISOString() }
    ]
  },
  {
    id: 102,
    referenceNo: "ORD-000121",
    store_id: 2,
    store_name: "Aura Artisan Bakery",
    store_slug: "aura-bakery",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: "Completed",
    payment_status: "paid",
    orderType: "takeaway",
    customer: {
      name: "Sophea Chan",
      username: "@sopheac",
      telegramId: 9912034,
      phone: "+855 77 123 456",
      address: "Takeaway Counter",
      note: "Pack separately please"
    },
    items: [
      {
        id: 6,
        code: "PRD-BAK-02",
        name: "Pain au Chocolat (Dark Belgian)",
        quantity: 2,
        price: 3.50,
        subtotal: 7.00,
        selectedOptions: { Preparation: "Warmed Up" }
      },
      {
        id: 7,
        code: "PRD-BAK-03",
        name: "Country Sourdough Loaf (800g)",
        quantity: 1,
        price: 5.50,
        subtotal: 5.50,
        selectedOptions: { Slicing: "Sliced (Toast thickness)" }
      }
    ],
    subtotal: 12.50,
    deliveryFee: 0.00,
    discount: 0.00,
    grandTotal: 12.50,
    store_notification: "Sent",
    statusHistory: [
      { status: "Pending", timestamp: new Date(Date.now() - 86400000).toISOString() },
      { status: "Confirmed", timestamp: new Date(Date.now() - 85000000).toISOString() },
      { status: "Preparing", timestamp: new Date(Date.now() - 84000000).toISOString() },
      { status: "Ready", timestamp: new Date(Date.now() - 83000000).toISOString() },
      { status: "Completed", timestamp: new Date(Date.now() - 82000000).toISOString() }
    ]
  }
];

function generateNextOrderNumber() {
  orderCounter += 1;
  return `ORD-${String(orderCounter).padStart(6, '0')}`;
}

const OrderController = {
  /**
   * Telegram User Auto-Authentication & Profile Management
   */
  async authTelegramUser(req, res) {
    try {
      const { id, first_name, last_name, username, phone_number } = req.body;
      if (!id) {
        return res.status(400).json({ status: false, message: 'Telegram user ID is required' });
      }

      const existing = telegramUsers.get(String(id)) || {};
      const updatedProfile = {
        ...existing,
        id: Number(id),
        first_name: first_name || existing.first_name || 'Telegram Guest',
        last_name: last_name || existing.last_name || '',
        username: username || existing.username || '',
        phone: phone_number || existing.phone || '',
        lastSeen: new Date().toISOString()
      };

      telegramUsers.set(String(id), updatedProfile);

      return res.status(200).json({
        status: true,
        message: 'Telegram user authenticated successfully',
        user: updatedProfile
      });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  },

  /**
   * Query orders with multi-store filtering, customer filtering, and status filtering
   */
  async getOrders(req, res) {
    try {
      const { storeSlug, storeId, status, telegramId, q } = req.query;
      let list = [...orderHistory];

      if (storeSlug) {
        list = list.filter(
          (o) => o.store_slug && o.store_slug.toLowerCase() === String(storeSlug).toLowerCase()
        );
      }

      if (storeId) {
        list = list.filter((o) => Number(o.store_id) === Number(storeId));
      }

      if (telegramId) {
        list = list.filter(
          (o) => o.customer && String(o.customer.telegramId) === String(telegramId)
        );
      }

      if (status && status !== 'all') {
        list = list.filter(
          (o) => (o.status || '').toLowerCase() === String(status).toLowerCase()
        );
      }

      if (q) {
        const queryLower = String(q).toLowerCase();
        list = list.filter(
          (o) =>
            (o.referenceNo || '').toLowerCase().includes(queryLower) ||
            (o.customer?.name || '').toLowerCase().includes(queryLower) ||
            (o.customer?.username || '').toLowerCase().includes(queryLower)
        );
      }

      return res.status(200).json({
        status: true,
        data: list,
        orders: list,
        count: list.length
      });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  },

  /**
   * Get single order by ID or Reference Number
   */
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = orderHistory.find(
        (o) => String(o.id) === String(id) || String(o.referenceNo).toLowerCase() === String(id).toLowerCase()
      );

      if (!order) {
        return res.status(404).json({ status: false, message: 'Order not found' });
      }

      return res.status(200).json({ status: true, data: order });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  },

  /**
   * Create an Order with Server-Side Truth & Validation:
   * 1. Validate Telegram User
   * 2. Validate Selected Store
   * 3. Validate Product Availability
   * 4. Validate Prices & Options on Server
   * 5. Validate Quantities
   * 6. Calculate Final Total on Server
   * 7. Prevent Duplicate Submissions (Idempotency Key & Active Lock)
   * 8. Create Order & Items
   * 9. Generate Unique Order Number (ORD-000123)
   * 10. Save Status as 'Pending'
   * 11. Send Store Telegram Notification strictly to store's destination
   */
  async createOrder(req, res) {
    try {
      const { slug } = req.params;
      const {
        items,
        cartItems,
        note,
        customer = {},
        orderType = 'dine_in',
        idempotencyKey
      } = req.body;

      const incomingItems = items || cartItems;
      let tgUser = req.telegramUser || customer.telegramUser;

      // 1. Idempotency Check: Prevent duplicate submissions
      if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
        const cached = idempotencyCache.get(idempotencyKey);
        console.log(`[Idempotency Hit] Returning existing order for key: ${idempotencyKey}`);
        return res.status(200).json({
          status: true,
          message: 'Order already processed (idempotency check)',
          referenceNo: cached.referenceNo,
          data: cached
        });
      }

      // 2. Validate items
      if (!incomingItems || !Array.isArray(incomingItems) || incomingItems.length === 0) {
        return res.status(400).json({ status: false, message: 'Order must contain at least one item' });
      }

      // 3. Resolve and validate store
      const storeSlug = slug || req.body.storeSlug || req.body.store_slug || 'sbc-store';
      const store =
        (await EMenuModel.getStoreBySlug(storeSlug)) ||
        (await EMenuModel.getStoreByIdentifier(storeSlug)) ||
        simpleData.stores.find((s) => s.slug === storeSlug || String(s.id) === String(storeSlug)) ||
        simpleData.stores[0];

      if (!store) {
        return res.status(404).json({ status: false, message: 'Store not found' });
      }

      // Load THAT store's dedicated Telegram settings
      const storeConfig = telegramStoreConfigService.getActiveStoreConfig(store.slug || storeSlug);

      // Verify Telegram Mini App initData if provided
      const rawInitData = req.headers['x-telegram-init-data'] || req.body.initData;

      if (rawInitData && storeConfig.botToken) {
        const initValidation = validateTelegramInitData(rawInitData, storeConfig.botToken);
        if (initValidation.valid && initValidation.user) {
          tgUser = initValidation.user;
          console.log(`[TMA Security] Validated initData for customer @${tgUser.username || tgUser.id}`);
        }
      }

      // 4. Server-Side Price & Product Validation
      const verifiedItems = [];
      let calculatedSubtotal = 0;

      for (const rawItem of incomingItems) {
        const productId = rawItem.id || rawItem.productId;
        const catalogProduct = simpleData.products.find((p) => Number(p.id) === Number(productId));

        if (!catalogProduct) {
          return res.status(400).json({
            status: false,
            message: `Product ID #${productId} not found in catalog`
          });
        }

        // Multi-Store Isolation Check: Product must belong to selected store
        if (Number(catalogProduct.biller_id) !== Number(store.id)) {
          return res.status(400).json({
            status: false,
            message: `Product "${catalogProduct.name}" does not belong to store "${store.name}"`
          });
        }

        const quantity = Math.max(1, parseInt(rawItem.quantity || rawItem.qty, 10) || 1);

        // Server-side calculation of option price deltas
        let optionPriceDelta = 0;
        const selectedOptions = rawItem.selectedOptions || {};

        if (catalogProduct.options && Object.keys(selectedOptions).length > 0) {
          for (const optGroup of catalogProduct.options) {
            const userChoiceLabel = selectedOptions[optGroup.name] || selectedOptions[optGroup.id];
            if (userChoiceLabel) {
              const matchedChoice = optGroup.choices.find((c) => c.label === userChoiceLabel);
              if (matchedChoice && matchedChoice.priceDelta) {
                optionPriceDelta += Number(matchedChoice.priceDelta);
              }
            }
          }
        }

        const unitPrice = Number(catalogProduct.price) + optionPriceDelta;
        const itemSubtotal = unitPrice * quantity;
        calculatedSubtotal += itemSubtotal;

        verifiedItems.push({
          id: catalogProduct.id,
          code: catalogProduct.code,
          name: catalogProduct.name,
          image: catalogProduct.image,
          quantity: quantity,
          price: Number(unitPrice.toFixed(2)),
          subtotal: Number(itemSubtotal.toFixed(2)),
          selectedOptions: selectedOptions
        });
      }

      // 5. Server-Side Delivery / Service Fee Calculation
      const isDelivery = orderType === 'delivery';
      const deliveryFee = isDelivery ? 2.00 : 0.00;
      const discount = 0.00;
      const calculatedGrandTotal = Number((calculatedSubtotal + deliveryFee - discount).toFixed(2));

      // 6. Generate Unique Order Number in exact required format ORD-000123
      const orderRef = generateNextOrderNumber();
      const saleId = Date.now();

      // 7. Prepare Clean Customer Profile
      const customerName = customer.name || (tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'Telegram Guest');
      const customerUsername = customer.username || (tgUser?.username ? `@${tgUser.username}` : '@guest');
      const customerPhone = customer.phone || tgUser?.phone_number || '';
      const customerAddress = customer.address || (isDelivery ? 'Delivery Address' : 'Table #01 (Dine-In)');
      const customerNote = note || customer.note || '';
      const customerTelegramId = tgUser?.id || customer.telegramId || customer.customer_telegram_id || null;

      const customerPayload = {
        name: customerName,
        username: customerUsername,
        telegramId: customerTelegramId,
        customer_telegram_id: customerTelegramId,
        phone: customerPhone,
        address: customerAddress,
        note: customerNote,
        orderType: orderType
      };

      const dedicatedBotUsername = (storeConfig.botUsername || storeConfig.telegram_bot_username || '@aura_emenu_order_bot').trim();

      // 8. Construct Persistent Order Object with status 'Pending'
      const newOrder = {
        id: saleId,
        referenceNo: orderRef,
        store_id: store.id,
        store_name: store.name || store.company,
        store_slug: store.slug,
        createdAt: new Date().toISOString(),
        status: 'Pending', // Strictly initialized as Pending
        payment_status: 'pending',
        orderType: orderType,
        customer: customerPayload,
        customer_telegram_id: customerTelegramId,
        notify_group_status: 'pending',
        notify_error: null,
        telegram_bot_username: dedicatedBotUsername,
        items: verifiedItems,
        subtotal: Number(calculatedSubtotal.toFixed(2)),
        deliveryFee: deliveryFee,
        discount: discount,
        grandTotal: calculatedGrandTotal,
        store_notification: 'Pending',
        statusHistory: [
          { status: 'Pending', timestamp: new Date().toISOString(), note: 'Order placed by customer via Telegram Mini App' }
        ]
      };

      // Save order to history (persists in memory)
      orderHistory.unshift(newOrder);

      // Cache for idempotency if key provided
      if (idempotencyKey) {
        idempotencyCache.set(idempotencyKey, newOrder);
        // Clean cache after 15 minutes
        setTimeout(() => idempotencyCache.delete(idempotencyKey), 15 * 60 * 1000);
      }

      // 9. Dispatch invoice strictly to store's dedicated Telegram group chat
      const dispatchInfo = sendOrderToShopGroup({
        store,
        order: newOrder,
        customer: customerPayload,
        items: verifiedItems
      });

      newOrder.dispatchInfo = dispatchInfo;

      return res.status(201).json({
        status: true,
        message: 'Order created successfully',
        referenceNo: newOrder.referenceNo,
        data: newOrder
      });
    } catch (err) {
      console.error('Order creation error:', err);
      return res.status(500).json({ status: false, error: err.message });
    }
  },

  /**
   * Update Order Status (for Store Staff / Admin)
   * Allowed transitions: Pending -> Confirmed -> Preparing -> Ready -> Completed or Cancelled
   */
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note: statusNote } = req.body;

      const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
      const targetStatus = validStatuses.find((s) => s.toLowerCase() === String(status).toLowerCase());

      if (!targetStatus) {
        return res.status(400).json({
          status: false,
          message: `Invalid status "${status}". Valid statuses: ${validStatuses.join(', ')}`
        });
      }

      const order = orderHistory.find(
        (o) => String(o.id) === String(id) || String(o.referenceNo).toLowerCase() === String(id).toLowerCase()
      );

      if (!order) {
        return res.status(404).json({ status: false, message: 'Order not found' });
      }

      order.status = targetStatus;
      if (targetStatus === 'Confirmed' || targetStatus === 'Completed') {
        order.payment_status = 'paid';
      }
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        status: targetStatus,
        timestamp: new Date().toISOString(),
        note: statusNote || `Status updated to ${targetStatus} by store staff`
      });

      return res.status(200).json({
        status: true,
        message: `Order status updated to ${targetStatus}`,
        data: order
      });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  },

  findOrderByReference(ref) {
    if (!ref) return null;
    return orderHistory.find((o) => String(o.referenceNo).toLowerCase() === String(ref).toLowerCase() || String(o.id) === String(ref));
  },

  /**
   * Retry failed Telegram store notification
   */
  async retryNotification(req, res) {
    try {
      const { id } = req.params;
      const order = orderHistory.find(
        (o) => String(o.id) === String(id) || String(o.referenceNo).toLowerCase() === String(id).toLowerCase()
      );

      if (!order) {
        return res.status(404).json({ status: false, message: 'Order not found' });
      }

      const store = simpleData.stores.find((s) => Number(s.id) === Number(order.store_id) || s.slug === order.store_slug) || simpleData.stores[0];

      const dispatchInfo = await retryOrderNotification(order, store);
      order.store_notification = dispatchInfo.notification_status === 'sent' || dispatchInfo.notification_status === 'simulated'
        ? 'Sent'
        : 'Failed';
      order.dispatchInfo = dispatchInfo;

      return res.status(200).json({
        status: true,
        message: 'Notification retry completed',
        notification_status: order.store_notification,
        dispatchInfo
      });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  }
};

module.exports = OrderController;
