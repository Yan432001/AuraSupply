/**
 * ==============================================================================
 * AURA TELEGRAM CONCEPT CONTROLLER (c:\AuraSupply\Telegram\index.js)
 * ==============================================================================
 * Central management module for all Telegram services across the Aura platform:
 *  1. Telegram Bot (GrammY): Interactive commands, persistent keyboards, catalog launch
 *  2. Telegram Notifications: Real-time HTML invoices & order slips sent to staff groups
 *  3. Telegram Webhooks: Interactive callback query processing (confirm, prepare, complete, reject)
 *  4. Telegram Multi-Store Configurations: Bot tokens, group chat IDs, topic threads
 *  5. Telegram Mini App (TMA) Auth: Cryptographic initData verification (HMAC-SHA256)
 * ==============================================================================
 */

const botService = require('./bot/bot.service');
const notificationService = require('./notifications/notification.service');
const storeConfigService = require('./stores/storeConfig.service');
const webhookController = require('./webhook/webhook.controller');
const webhookRoute = require('./webhook/webhook.route');
const storesRoute = require('./stores/stores.route');

/**
 * Initialize and start the Telegram Bot polling daemon
 * Safe against connection conflicts, runs non-blocking
 */
async function startBot(options = {}) {
  try {
    if (!botService || !botService.start) {
      console.log('[Telegram Controller] Bot service not configured.');
      return null;
    }

    botService.start({
      onStart: (botInfo) => {
        console.log(`[Telegram Controller] 🚀 Bot started successfully as @${botInfo.username}`);
        if (options.onStart) options.onStart(botInfo);
      }
    }).catch((err) => {
      console.log(`[Telegram Controller] ⚠️ Notice: Bot polling conflict or disabled: ${err.message}`);
    });

    return botService;
  } catch (err) {
    console.warn(`[Telegram Controller] Bot startup notice: ${err.message}`);
    return null;
  }
}

/**
 * Dispatch an order invoice to the appropriate store staff group
 */
async function dispatchOrderNotification(orderPayload) {
  return notificationService.sendStoreGroupInvoice(orderPayload);
}

/**
 * Send a general notification/alert to a Telegram chat/group
 */
async function sendAlert(chatId, messageText, options = {}) {
  return notificationService.sendSimpleNotification(chatId, messageText, options);
}

/**
 * Get active configuration for a store (bot token, chat ID, webhook secret)
 */
function getStoreConfig(storeSlug) {
  return storeConfigService.getActiveStoreConfig(storeSlug);
}

/**
 * Get all configured store bots
 */
function getAllStoreConfigs() {
  return storeConfigService.getAllStoreConfigs();
}

module.exports = {
  // Core Bot Instance & Lifecycle
  bot: botService,
  startBot,

  // Services
  notifications: notificationService,
  dispatchOrderNotification,
  sendAlert,
  stores: storeConfigService,
  getStoreConfig,
  getAllStoreConfigs,

  // Webhooks
  webhookController,
  webhookRoute,
  storesRoute
};
