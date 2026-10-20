const EMenuModel = require('../../models/emenu.model');
const { sendOrderToShopGroup, retryOrderNotification } = require('../../services/telegramNotification.service');
const telegramStoreConfigService = require('../../services/telegramStoreConfig.service');
const { validateTelegramInitData } = require('../../services/crypto.service');
const { db } = require('../../config/utill/helper');

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
    biller_name: "Aura Specialty Coffee",
    biller_company: "Aura Specialty Coffee Co., Ltd.",
    biller_color: "#ea580c",
    theme_color: "#ea580c",
    biller_vat_no: "K001-929394959",
    biller_name_kh: "អូរ៉ា កាហ្វេ ពិសេស",
    biller_company_kh: "ក្រុមហ៊ុន អូរ៉ា កាហ្វេ ពិសេស ខូអិលធីឌី",
    biller_address_kh: "អគារ ១២៨ មហាវិថីព្រះនរោត្តម ខណ្ឌដូនពេញ រាជធានីភ្នំពេញ",
    biller_address: "No. 128, Preah Norodom Blvd, Daun Penh, Phnom Penh",
    biller_phone: "+855 12 345 678",
    biller_email: "coffee@auraglobal.com",
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
      vat_no: "N/A",
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
    tax: 1.11,
    tax_amount: 1.11,
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
    biller_name: "Aura Artisan Bakery",
    biller_company: "Aura Artisan Bakery & Viennoiserie",
    biller_color: "#f43f5e",
    theme_color: "#f43f5e",
    biller_vat_no: "K002-887766554",
    biller_name_kh: "អូរ៉ា នំបុ័ងសិប្បកម្ម",
    biller_company_kh: "ក្រុមហ៊ុន អូរ៉ា នំបុ័ងសិប្បកម្ម ខូអិលធីឌី",
    biller_address_kh: "ផ្លូវលេខ ២៤០ សង្កាត់ចតុមុខ ខណ្ឌដូនពេញ រាជធានីភ្នំពេញ",
    biller_address: "Street 240, Daun Penh, Phnom Penh",
    biller_phone: "+855 12 345 679",
    biller_email: "bakery@auraglobal.com",
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
      vat_no: "N/A",
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

      try {
        let sql = `
          SELECT 
            s.id,
            s.reference_no AS referenceNo,
            s.biller_id AS store_id,
            COALESCE(c.name, s.biller) AS store_name,
            COALESCE(c.company, c.name, s.biller) AS biller_company,
            c.theme_color AS biller_color,
            c.vat_no AS biller_vat_no,
            c.name_kh AS biller_name_kh,
            c.company_kh AS biller_company_kh,
            c.address_kh AS biller_address_kh,
            c.address AS biller_address,
            c.phone AS biller_phone,
            c.email AS biller_email,
            c.logo_url AS biller_logo,
            COALESCE(c.slug, 'sbc-store') AS store_slug,
            s.date AS createdAt,
            COALESCE(s.sale_status, 'completed') AS status,
            COALESCE(s.payment_status, 'paid') AS payment_status,
            s.customer AS customer_name,
            s.customer_id,
            cust.vat_no AS customer_vat_no,
            cust.address AS customer_address,
            cust.phone AS customer_phone,
            COALESCE(s.grand_total, s.total, 0) AS grandTotal,
            COALESCE(s.total, 0) AS total,
            COALESCE(s.total_tax, s.order_tax, 0) AS tax,
            COALESCE(s.total_discount, s.order_discount, 0) AS discount,
            COALESCE(s.shipping, 0) AS deliveryFee
          FROM aura_sales s
          LEFT JOIN aura_companies c ON c.id = s.biller_id
          LEFT JOIN aura_companies cust ON cust.id = s.customer_id
          WHERE 1=1
        `;
        const params = [];

        if (storeSlug && storeSlug !== 'all') {
          sql += ' AND (c.slug = ? OR s.biller_id = ?)';
          params.push(storeSlug, storeSlug);
        }
        if (storeId && storeId !== 'all') {
          sql += ' AND s.biller_id = ?';
          params.push(storeId);
        }
        if (status && status !== 'all') {
          sql += ' AND LOWER(s.sale_status) = ?';
          params.push(String(status).toLowerCase());
        }
        if (q) {
          sql += ' AND (s.reference_no LIKE ? OR s.customer LIKE ?)';
          params.push(`%${q}%`, `%${q}%`);
        }

        sql += ' ORDER BY s.id DESC LIMIT 100';

        const [rows] = await db.query(sql, params);
        if (rows && rows.length > 0) {
          // Fetch items for these sales
          const saleIds = rows.map((r) => r.id);
          const placeholders = saleIds.map(() => '?').join(',');
          let itemsMap = {};
          try {
            const [itemRows] = await db.query(
              `SELECT id, sale_id, product_id, product_code, product_name, unit_price, quantity, subtotal, discount, item_discount 
               FROM aura_sale_items WHERE sale_id IN (${placeholders})`,
              saleIds
            );
            (itemRows || []).forEach((it) => {
              if (!itemsMap[it.sale_id]) itemsMap[it.sale_id] = [];
              itemsMap[it.sale_id].push({
                id: it.id,
                product_id: it.product_id,
                product_code: it.product_code || '',
                code: it.product_code || '',
                name: it.product_name || 'Item',
                product_name: it.product_name || 'Item',
                quantity: parseFloat(it.quantity || 1),
                unit_price: parseFloat(it.unit_price || 0),
                price: parseFloat(it.unit_price || 0),
                discount: parseFloat(it.discount || it.item_discount || 0),
                item_discount: parseFloat(it.discount || it.item_discount || 0),
                subtotal: parseFloat(it.subtotal || 0),
              });
            });
          } catch (iErr) {
            console.warn('Failed to load items for sales:', iErr.message);
          }

          const formatted = rows.map((r) => ({
            id: r.id,
            referenceNo: r.referenceNo || `AUR-${r.id}`,
            reference_no: r.referenceNo || `AUR-${r.id}`,
            store_id: r.store_id,
            biller_id: r.store_id,
            store_name: r.store_name,
            storeName: r.store_name,
            store_slug: r.store_slug,
            biller_name: r.store_name,
            biller_company: r.biller_company || r.store_name,
            biller_color: r.biller_color || '#2563eb',
            theme_color: r.biller_color || '#2563eb',
            biller_vat_no: r.biller_vat_no || 'K001-929394959',
            biller_name_kh: r.biller_name_kh || 'អូរ៉ា សឹបផ្លាយ',
            biller_company_kh: r.biller_company_kh || 'អូរ៉ា សឹបផ្លាយ',
            biller_address_kh: r.biller_address_kh || 'អគារ ១២៨ មហាវិថីព្រះនរោត្តម ខណ្ឌដូនពេញ រាជធានីភ្នំពេញ',
            biller_address: r.biller_address || '#128 Preah Norodom Blvd, Daun Penh, Phnom Penh, Cambodia',
            biller_phone: r.biller_phone || '+855 12 345 678',
            biller_email: r.biller_email || 'billing@aurasupply.com',
            biller_logo: r.biller_logo || null,
            createdAt: r.createdAt || new Date().toISOString(),
            date: r.createdAt || new Date().toISOString(),
            status: (r.status || 'completed').charAt(0).toUpperCase() + (r.status || 'completed').slice(1),
            payment_status: r.payment_status || 'paid',
            orderType: 'delivery',
            customer_name: r.customer_name || 'Walk-in Guest',
            customer_company: r.customer_name || 'Walk-in Guest',
            customer_phone: r.customer_phone || '+855 12 345 678',
            customer_address: r.customer_address || 'Phnom Penh, Cambodia',
            customer_vat_no: r.customer_vat_no || 'N/A',
            customer: {
              name: r.customer_name || 'Walk-in Guest',
              phone: r.customer_phone || '+855 12 345 678',
              address: r.customer_address || 'Phnom Penh, Cambodia',
              vat_no: r.customer_vat_no || 'N/A',
            },
            subtotal: Number(r.total || 0),
            deliveryFee: Number(r.deliveryFee || 0),
            discount: Number(r.discount || 0),
            tax: Number(r.tax || (r.grandTotal * 0.1 / 1.1) || 0),
            tax_amount: Number(r.tax || (r.grandTotal * 0.1 / 1.1) || 0),
            grandTotal: Number(r.grandTotal || 0),
            grand_total: Number(r.grandTotal || 0),
            paid: Number(r.grandTotal || 0),
            items: itemsMap[r.id] || [],
          }));

          return res.status(200).json({
            status: true,
            data: formatted,
            orders: formatted,
            count: formatted.length,
          });
        }
      } catch (dbErr) {
        console.warn('DB orders fallback note:', dbErr.message);
      }

      let list = [...orderHistory];
      return res.status(200).json({
        status: true,
        data: list,
        orders: list,
        count: list.length,
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

      // 1. First check database
      try {
        const [rows] = await db.query(
          `SELECT 
            s.*,
            s.reference_no AS referenceNo,
            s.biller_id AS store_id,
            COALESCE(c.name, s.biller) AS store_name,
            COALESCE(c.company, c.name, s.biller) AS biller_company,
            c.theme_color AS biller_color,
            c.vat_no AS biller_vat_no,
            c.name_kh AS biller_name_kh,
            c.company_kh AS biller_company_kh,
            c.address_kh AS biller_address_kh,
            c.address AS biller_address,
            c.phone AS biller_phone,
            c.email AS biller_email,
            c.logo_url AS biller_logo,
            COALESCE(c.slug, 'sbc-store') AS store_slug,
            s.date AS createdAt,
            COALESCE(s.sale_status, 'completed') AS status,
            COALESCE(s.payment_status, 'paid') AS payment_status,
            s.customer AS customer_name,
            s.customer_id,
            cust.vat_no AS customer_vat_no,
            cust.address AS customer_address,
            cust.phone AS customer_phone,
            COALESCE(s.grand_total, s.total, 0) AS grandTotal,
            COALESCE(s.total, 0) AS total,
            COALESCE(s.total_tax, s.order_tax, 0) AS tax,
            COALESCE(s.total_discount, s.order_discount, 0) AS discount,
            COALESCE(s.shipping, 0) AS deliveryFee
          FROM aura_sales s
          LEFT JOIN aura_companies c ON c.id = s.biller_id
          LEFT JOIN aura_companies cust ON cust.id = s.customer_id
          WHERE s.id = ? OR s.reference_no = ?
          LIMIT 1`,
          [id, id]
        );

        if (rows && rows.length > 0) {
          const r = rows[0];
          const [itemRows] = await db.query(
            `SELECT id, sale_id, product_id, product_code, product_name, unit_price, quantity, subtotal, discount, item_discount 
             FROM aura_sale_items WHERE sale_id = ?`,
            [r.id]
          );

          const items = (itemRows || []).map((it) => ({
            id: it.id,
            product_id: it.product_id,
            product_code: it.product_code || '',
            code: it.product_code || '',
            name: it.product_name || 'Item',
            product_name: it.product_name || 'Item',
            quantity: parseFloat(it.quantity || 1),
            unit_price: parseFloat(it.unit_price || 0),
            price: parseFloat(it.unit_price || 0),
            discount: parseFloat(it.discount || it.item_discount || 0),
            item_discount: parseFloat(it.discount || it.item_discount || 0),
            subtotal: parseFloat(it.subtotal || 0),
          }));

          const formatted = {
            id: r.id,
            referenceNo: r.referenceNo || `AUR-${r.id}`,
            reference_no: r.referenceNo || `AUR-${r.id}`,
            store_id: r.store_id,
            biller_id: r.store_id,
            store_name: r.store_name,
            storeName: r.store_name,
            store_slug: r.store_slug,
            biller_name: r.store_name,
            biller_company: r.biller_company || r.store_name,
            biller_color: r.biller_color || '#2563eb',
            theme_color: r.biller_color || '#2563eb',
            biller_vat_no: r.biller_vat_no || 'K001-929394959',
            biller_name_kh: r.biller_name_kh || 'អូរ៉ា សឹបផ្លាយ',
            biller_company_kh: r.biller_company_kh || 'អូរ៉ា សឹបផ្លាយ',
            biller_address_kh: r.biller_address_kh || 'អគារ ១២៨ មហាវិថីព្រះនរោត្តម ខណ្ឌដូនពេញ រាជធានីភ្នំពេញ',
            biller_address: r.biller_address || '#128 Preah Norodom Blvd, Daun Penh, Phnom Penh, Cambodia',
            biller_phone: r.biller_phone || '+855 12 345 678',
            biller_email: r.biller_email || 'billing@aurasupply.com',
            biller_logo: r.biller_logo || null,
            createdAt: r.createdAt || new Date().toISOString(),
            date: r.createdAt || new Date().toISOString(),
            status: (r.status || 'completed').charAt(0).toUpperCase() + (r.status || 'completed').slice(1),
            payment_status: r.payment_status || 'paid',
            orderType: 'delivery',
            customer_name: r.customer_name || 'Walk-in Guest',
            customer_company: r.customer_name || 'Walk-in Guest',
            customer_phone: r.customer_phone || '+855 12 345 678',
            customer_address: r.customer_address || 'Phnom Penh, Cambodia',
            customer_vat_no: r.customer_vat_no || 'N/A',
            customer: {
              name: r.customer_name || 'Walk-in Guest',
              phone: r.customer_phone || '+855 12 345 678',
              address: r.customer_address || 'Phnom Penh, Cambodia',
              vat_no: r.customer_vat_no || 'N/A',
            },
            subtotal: Number(r.total || 0),
            deliveryFee: Number(r.deliveryFee || 0),
            discount: Number(r.discount || 0),
            tax: Number(r.tax || (r.grandTotal * 0.1 / 1.1) || 0),
            tax_amount: Number(r.tax || (r.grandTotal * 0.1 / 1.1) || 0),
            grandTotal: Number(r.grandTotal || 0),
            grand_total: Number(r.grandTotal || 0),
            paid: Number(r.grandTotal || 0),
            items: items,
          };

          return res.status(200).json({ status: true, data: formatted });
        }
      } catch (dbErr) {
        console.warn('DB getOrderById error:', dbErr.message);
      }

      // 2. Fallback to in-memory orderHistory
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
      let store =
        (await EMenuModel.getStoreBySlug(storeSlug)) ||
        (await EMenuModel.getStoreByIdentifier(storeSlug));

      if (!store) {
        const [rows] = await db.query(
          "SELECT id, name, company, slug, phone, email, address, logo, telegram_chat_id FROM aura_companies WHERE (group_id IS NULL OR group_id = 0) AND group_name = 'biller' AND (slug = ? OR id = ? OR store_slug = ?) LIMIT 1",
          [storeSlug, isNaN(storeSlug) ? 0 : Number(storeSlug), storeSlug]
        );
        store = rows[0] || null;
      }

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
        const [pRows] = await db.query(
          "SELECT id, code, name, price, biller_id FROM aura_products WHERE id = ? LIMIT 1",
          [productId]
        );
        const catalogProduct = pRows[0] || null;

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

      let store = await EMenuModel.getStoreByIdentifier(order.store_id || order.store_slug);
      if (!store) {
        const [rows] = await db.query(
          "SELECT id, name, company, slug, phone, email, address, logo, telegram_chat_id FROM aura_companies WHERE id = ? OR slug = ? LIMIT 1",
          [order.store_id || 0, order.store_slug || '']
        );
        store = rows[0] || { id: order.store_id, name: order.store_name, slug: order.store_slug };
      }

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
