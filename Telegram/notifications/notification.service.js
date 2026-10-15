const axios = require('axios');
const telegramStoreConfigService = require('../stores/storeConfig.service');

// In-memory record of recent telegram dispatches & queue
const recentDispatches = [];
const dispatchQueue = [];
let isQueueProcessing = false;

/**
 * Format date in readable format: "26 Sep 2026, 14:30"
 */
function formatOrderDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Escape HTML special characters for safe Telegram parse_mode: HTML
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Generates the clean formatted HTML invoice for the Store's Telegram Group
 */
function buildStoreGroupInvoiceMessage({ store, order, customer = {}, items = [] }) {
  const storeName = escapeHtml(store.name || store.company || 'Store');
  const orderRef = order.referenceNo || order.reference_no || `ORD-${String(order.id || 1001).padStart(6, '0')}`;
  
  const customerName = escapeHtml(customer.name || customer.customerName || 'Telegram Guest');
  let customerTelegram = customer.username || customer.telegramUsername || '';
  if (customerTelegram && !customerTelegram.startsWith('@')) customerTelegram = `@${customerTelegram}`;
  customerTelegram = escapeHtml(customerTelegram || '@guest');
  
  const customerPhone = escapeHtml(customer.phone || 'N/A');
  const addressOrTable = escapeHtml(customer.address || (customer.orderType === 'dine_in' ? 'Table #01 (Dine-In)' : 'Counter Pickup'));
  const paymentMethod = escapeHtml(order.paymentMethod || order.payment_method || 'Cash / Telegram Pay');

  // Format product list with options, quantities, prices, and subtotals
  const productsFormatted = items.map((item, idx) => {
    const qty = item.quantity || item.qty || 1;
    const price = Number(item.price || item.unit_price || 0);
    const subtotal = Number(item.subtotal || qty * price);
    const name = escapeHtml(item.name || item.product_name || `Product #${item.id || idx + 1}`);
    
    let optionsText = '';
    if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
      const opts = Object.entries(item.selectedOptions)
        .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`)
        .join(', ');
      optionsText = `\n   <i>Options: ${opts}</i>`;
    } else if (item.optionsText) {
      optionsText = `\n   <i>Options: ${escapeHtml(item.optionsText)}</i>`;
    }

    return `${idx + 1}. <b>${name}</b>${optionsText}\n   Qty: <b>${qty}x</b> &bull; Unit: $${price.toFixed(2)} &bull; Subtotal: <b>$${subtotal.toFixed(2)}</b>`;
  }).join('\n\n');

  const subtotal = Number(order.subtotal || items.reduce((s, it) => s + Number(it.price || 0) * (it.quantity || it.qty || 1), 0)).toFixed(2);
  const deliveryFee = Number(order.deliveryFee !== undefined ? order.deliveryFee : (customer.orderType === 'delivery' ? 2.00 : 0.00)).toFixed(2);
  const discount = Number(order.discount || 0).toFixed(2);
  const total = Number(order.grandTotal || order.total || (Number(subtotal) + Number(deliveryFee) - Number(discount))).toFixed(2);
  const customerNote = escapeHtml(customer.note || order.note || 'None');
  const orderDate = formatOrderDate(order.createdAt || order.date);
  const status = (order.status || 'Pending').toUpperCase();

  return [
    `🧾 <b>STORE ORDER INVOICE</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `<b>Order #:</b> <code>${orderRef}</code>`,
    `<b>Date & Time:</b> ${orderDate}`,
    `<b>Store:</b> 🏬 ${storeName}`,
    ``,
    `👤 <b>CUSTOMER DETAILS</b>`,
    `• <b>Name:</b> ${customerName}`,
    `• <b>Telegram:</b> ${customerTelegram}`,
    `• <b>Phone:</b> ${customerPhone}`,
    `• <b>Location:</b> 📍 ${addressOrTable}`,
    ``,
    `📦 <b>ITEMS ORDERED</b>`,
    productsFormatted,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Subtotal: $${subtotal}`,
    `Delivery Fee: $${deliveryFee}`,
    Number(discount) > 0 ? `Discount: -$${discount}` : null,
    `<b>GRAND TOTAL: $${total}</b>`,
    `<b>Payment:</b> 💳 ${paymentMethod}`,
    `<b>Order Note:</b> 📝 <i>${customerNote}</i>`,
    ``,
    `📌 <b>Current Status:</b> <b>${status}</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `<i>Tap an action below to update order status in real time:</i>`
  ].filter(Boolean).join('\n');
}

/**
 * Inline keyboard buttons for the Store Group:
 * Accept, Reject, Preparing, Completed
 */
function buildStoreGroupInlineKeyboard(orderRef) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Accept', callback_data: `ord_status:${orderRef}:Confirmed` },
        { text: '👨‍🍳 Preparing', callback_data: `ord_status:${orderRef}:Preparing` },
      ],
      [
        { text: '📦 Completed', callback_data: `ord_status:${orderRef}:Completed` },
        { text: '❌ Reject', callback_data: `ord_status:${orderRef}:Cancelled` },
      ]
    ]
  };
}

/**
 * Sends a request with up to maxRetries attempts and exponential backoff
 */
async function sendTelegramRequestWithRetry(url, payload, maxRetries = 3) {
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    attempt += 1;
    try {
      const response = await axios.post(url, payload, { timeout: 8000 });
      if (response.data && response.data.ok) {
        return { success: true, result: response.data.result, attempts: attempt };
      }
      lastError = new Error(response.data?.description || 'Telegram ok: false');
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const description = err.response?.data?.description || err.message;

      // If rate limited, wait retry_after if provided
      if (status === 429) {
        const retryAfter = (err.response?.data?.parameters?.retry_after || 2) * 1000;
        await new Promise((r) => setTimeout(r, retryAfter));
      } else {
        // Backoff delay: 400ms, 800ms, 1600ms
        await new Promise((r) => setTimeout(r, attempt * 400));
      }
    }
  }

  return {
    success: false,
    error: lastError?.response?.data?.description || lastError?.message || 'Failed after retries',
    attempts: attempt,
  };
}

/**
 * Background worker loop: processes queue items without blocking HTTP checkout response
 */
async function processQueue() {
  if (isQueueProcessing) return;
  isQueueProcessing = true;

  while (dispatchQueue.length > 0) {
    const task = dispatchQueue.shift();
    try {
      await executeOrderDispatch(task);
    } catch (err) {
      console.error('[Telegram Queue Worker] Execution error:', err.message);
    }
  }

  isQueueProcessing = false;
}

/**
 * Dispatches invoice directly to Store's dedicated Telegram group chat
 */
async function executeOrderDispatch(task) {
  const { store, order, customer, items } = task;
  const storeSlug = store.slug || order.store_slug || 'sbc-store';
  const orderRef = order.referenceNo || order.reference_no;

  // 1. Load THAT store's active config (using THAT store's dedicated bot and group)
  const storeConfig = telegramStoreConfigService.getActiveStoreConfig(storeSlug);
  const botToken = storeConfig.botToken;
  const targetGroupId = storeConfig.groupId || store.telegram_group_chat_id || store.telegram_group_id;
  const botUsername = storeConfig.botUsername || '@aura_emenu_order_bot';

  const telegramApiBase = `https://api.telegram.org/bot${botToken}`;

  const dispatchRecord = {
    id: `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderRef,
    storeSlug,
    storeName: store.name || storeConfig.storeName,
    botUsername,
    targetGroupId,
    timestamp: new Date().toISOString(),
    groupStatus: 'pending',
    errors: [],
  };

  // 2. Dispatch strictly to STORE GROUP CHAT
  if (targetGroupId && storeConfig.telegram_enabled !== false) {
    const groupText = buildStoreGroupInvoiceMessage({ store, order, customer, items });
    const groupKeyboard = buildStoreGroupInlineKeyboard(orderRef);

    const groupResult = await sendTelegramRequestWithRetry(
      `${telegramApiBase}/sendMessage`,
      {
        chat_id: targetGroupId,
        text: groupText,
        parse_mode: 'HTML',
        reply_markup: groupKeyboard,
      },
      3
    );

    if (groupResult.success) {
      order.notify_group_status = 'sent';
      order.group_message_id = groupResult.result?.message_id;
      dispatchRecord.groupStatus = 'sent';
      dispatchRecord.groupMessageId = groupResult.result?.message_id;
      console.log(`[Telegram Group Dispatch] Sent invoice ${orderRef} to store group ${targetGroupId} via ${botUsername}`);
    } else {
      order.notify_group_status = 'failed';
      order.notify_error = `Group dispatch failed: ${groupResult.error}`;
      dispatchRecord.groupStatus = 'failed';
      dispatchRecord.errors.push(`Group: ${groupResult.error}`);
      console.warn(`[Telegram Group Dispatch] Failed sending to group ${targetGroupId}:`, groupResult.error);
    }
  } else {
    order.notify_group_status = 'skipped';
    dispatchRecord.groupStatus = 'skipped (no group ID or disabled)';
  }

  // Record dispatch log
  recentDispatches.unshift(dispatchRecord);
  if (recentDispatches.length > 100) recentDispatches.pop();

  // Log in store routing logs
  telegramStoreConfigService.addLog({
    id: `ord_${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    storeSlug,
    storeName: store.name || storeConfig.storeName,
    groupId: targetGroupId,
    groupTitle: storeConfig.groupTitle || `${storeSlug} Orders Group`,
    botUsername,
    orderRef,
    customerName: customer.name || 'Customer',
    location: customer.address || 'Table',
    itemsCount: items.length,
    grandTotal: order.grandTotal || order.total,
    status: order.notify_group_status === 'sent' ? 'Delivered to Store Group' : 'Delivery Failed',
    type: 'ORDER_INVOICE',
    groupStatus: order.notify_group_status,
    error: order.notify_error,
  });

  return dispatchRecord;
}

/**
 * Main public entry point: queues order notification in the background
 * Keeps checkout fast (<50ms)!
 */
function sendOrderToShopGroup({ store, order, customer = {}, items = [] }) {
  const task = { store, order, customer, items };
  
  // Set initial status on order object immediately
  order.notify_group_status = 'pending';

  // Add to background queue
  dispatchQueue.push(task);

  // Trigger processing asynchronously in next tick
  setImmediate(() => {
    processQueue().catch((err) => console.error('[Telegram Queue] Worker error:', err));
  });

  return {
    queued: true,
    notification_status: 'queued',
    orderRef: order.referenceNo || order.reference_no,
  };
}

/**
 * Retries failed notification manually
 */
async function retryOrderNotification(order, store) {
  const task = {
    store: store || { slug: order.store_slug, name: order.store_name },
    order,
    customer: order.customer || {},
    items: order.items || [],
  };
  return await executeOrderDispatch(task);
}

module.exports = {
  sendOrderToShopGroup,
  retryOrderNotification,
  buildStoreGroupInvoiceMessage,
  buildStoreGroupInlineKeyboard,
};
