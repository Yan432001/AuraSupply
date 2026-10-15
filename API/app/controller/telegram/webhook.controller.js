const axios = require('axios');
const telegramStoreConfigService = require('../../services/telegramStoreConfig.service');
const rawSimpleData = require('../../../../data/simpleData');
const simpleData = rawSimpleData.default || rawSimpleData;

// Reference to order history from order controller
let orderControllerRef = null;
try {
  orderControllerRef = require('../tma/order.controller');
} catch (_) {}

/**
 * Handles incoming Telegram Webhook updates for a specific store
 * Route: POST /api/telegram/webhook/:storeSlug/:secretToken
 */
exports.handleStoreWebhook = async (req, res) => {
  const { storeSlug, secretToken } = req.params;
  const update = req.body;

  // Immediately respond 200 OK to Telegram
  res.status(200).json({ ok: true });

  if (!update) return;

  const storeConfig = telegramStoreConfigService.getActiveStoreConfig(storeSlug);
  const botToken = storeConfig.botToken;
  const telegramApi = `https://api.telegram.org/bot${botToken}`;

  try {
    // 1. Handle Callback Queries (from inline buttons in the group chat)
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = cb.data || '';
      const chatId = cb.message?.chat?.id;
      const messageId = cb.message?.message_id;

      if (data.startsWith('ord_status:')) {
        const [, orderRef, targetStatus] = data.split(':');
        console.log(`[Telegram Webhook] Status update for ${orderRef} -> ${targetStatus} from @${cb.from?.username || cb.from?.id}`);

        let order = null;
        if (orderControllerRef?.findOrderByReference) {
          order = orderControllerRef.findOrderByReference(orderRef);
        }

        if (order) {
          const oldStatus = order.status;
          order.status = targetStatus;
          if (targetStatus === 'Confirmed' || targetStatus === 'Completed') {
            order.payment_status = 'paid';
          }
          if (!order.statusHistory) order.statusHistory = [];
          order.statusHistory.push({
            status: targetStatus,
            timestamp: new Date().toISOString(),
            by: `@${cb.from?.username || cb.from?.first_name || 'Staff'}`
          });

          // Acknowledge callback query with feedback banner
          try {
            await axios.post(`${telegramApi}/answerCallbackQuery`, {
              callback_query_id: cb.id,
              text: `✅ Order ${orderRef} updated to: ${targetStatus}`,
              show_alert: false
            });
          } catch (_) {}

          // Update message inline keyboard in group to show new status
          try {
            const originalText = cb.message?.text || '';
            const statusLineRegex = /Current Status:\s*(\w+)/i;
            const updatedText = originalText.replace(statusLineRegex, `Current Status: ${targetStatus.toUpperCase()}`);

            const updatedKeyboard = {
              inline_keyboard: [
                [
                  { text: targetStatus === 'Confirmed' ? '✅ Accepted' : '✅ Accept', callback_data: `ord_status:${orderRef}:Confirmed` },
                  { text: targetStatus === 'Preparing' ? '👨‍🍳 Preparing (Active)' : '👨‍🍳 Preparing', callback_data: `ord_status:${orderRef}:Preparing` }
                ],
                [
                  { text: targetStatus === 'Completed' ? '📦 Completed (Done)' : '📦 Completed', callback_data: `ord_status:${orderRef}:Completed` },
                  { text: targetStatus === 'Cancelled' ? '❌ Rejected (Done)' : '❌ Reject', callback_data: `ord_status:${orderRef}:Cancelled` }
                ]
              ]
            };

            await axios.post(`${telegramApi}/editMessageReplyMarkup`, {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: updatedKeyboard
            });
          } catch (editErr) {
            console.warn('[Telegram Webhook] editMessageReplyMarkup notice:', editErr.message);
          }
        } else {
          try {
            await axios.post(`${telegramApi}/answerCallbackQuery`, {
              callback_query_id: cb.id,
              text: `Order ${orderRef} updated to ${targetStatus}.`,
              show_alert: false
            });
          } catch (_) {}
        }
      } else if (data.startsWith('test_ack:')) {
        try {
          await axios.post(`${telegramApi}/answerCallbackQuery`, {
            callback_query_id: cb.id,
            text: '🎉 Connection verified & ready for orders!',
            show_alert: true
          });
        } catch (_) {}
      }
    }

    // 2. Handle /start command from customer (e.g. /start order_ORD-000123)
    if (update.message?.text?.startsWith('/start')) {
      const msg = update.message;
      const customerId = msg.from?.id;
      const startParam = msg.text.split(' ')[1] || '';

      const storeName = storeConfig.storeName || storeSlug;
      let replyText = `👋 Hello ${escape(msg.from?.first_name || 'Guest')}!\n\nWelcome to <b>${escape(storeName)}</b>.\n\nYour Telegram account is now connected to receive live order receipts, kitchen preparation alerts, and status updates!`;

      if (startParam.startsWith('order_')) {
        const orderRef = startParam.replace('order_', '');
        replyText += `\n\n🧾 Tracking <b>${escape(orderRef)}</b> — you will receive automated invoice updates here.`;
      }

      const baseUrl = (
        process.env.PUBLIC_APP_URL ||
        process.env.APP_URL ||
        process.env.WEBAPP_URL ||
        'http://localhost:3000'
      ).replace(/\/$/, '');
      const webAppUrl = `${baseUrl}/shop/${storeSlug}`;
      const digitalMenuUrl = `${baseUrl}/shop/menu/${storeSlug}`;

      const actionButton = { text: `🛍️ Browse ${storeName} TMA`, url: webAppUrl };
      const menuButton = { text: `📖 Digital Menu`, url: digitalMenuUrl };

      try {
        await axios.post(`${telegramApi}/sendMessage`, {
          chat_id: customerId,
          text: replyText,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [actionButton, menuButton]
            ]
          }
        });
      } catch (startErr) {
        console.warn('[Telegram Webhook] /start response notice:', startErr.message);
      }
    }
  } catch (err) {
    console.error('[Telegram Webhook Error]', err.message);
  }
};

function escape(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
