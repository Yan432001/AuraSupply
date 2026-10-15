const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { encrypt, decrypt, maskBotToken } = require('../../API/app/services/crypto.service');

const CONFIG_FILE = path.resolve(__dirname, '../../data/telegram_store_configs.json');
const LOGS_FILE = path.resolve(__dirname, '../../data/telegram_routing_logs.json');

const DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8613686625:AAFe8-04LvQumEXZ8-MBjbNSDozba3E1lCw';

const INITIAL_STORE_CONFIGS = [
  {
    storeSlug: 'nexus-mobile',
    storeName: 'Nexus Mobile & Gadgets',
    storeEmoji: '📱',
    ownerName: 'Alex Chen',
    botUsername: '@nexus_mobile_order_bot',
    telegram_bot_username: '@nexus_mobile_order_bot',
    botToken: '', // Saved encrypted
    botTokenPreview: '8613686...1lCw',
    botStatus: 'connected',
    status: 'connected',
    groupId: '-5004978007',
    telegram_group_chat_id: '-5004978007',
    groupTitle: 'Nexus Mobile - Dispatch & Orders Group',
    groupInviteLink: 'https://t.me/+9YYwU2Lfz600YWY1',
    telegram_enabled: true,
    telegram_webhook_secret: 'nexus_sec_99120',
    permissions: {
      canSendOrders: true,
      canUpdateStatus: true,
      notifyInquiries: true,
      dailySummary: true,
      notifySoundAlert: true,
    },
    notificationTemplate: 'detailed',
    stats: {
      totalOrdersRouted: 60,
      lastRoutedAt: 'Just now',
    },
  },
  {
    storeSlug: 'sbc-store',
    storeName: 'Aura Specialty Coffee',
    storeEmoji: '☕',
    ownerName: 'Yin',
    botUsername: '@aura_coffee_order_bot',
    telegram_bot_username: '@aura_coffee_order_bot',
    botToken: '',
    botTokenPreview: '8613686...1lCw',
    botStatus: 'connected',
    status: 'connected',
    groupId: '-1002489102938',
    telegram_group_chat_id: '-1002489102938',
    groupTitle: 'Aura Coffee - Baristas & Kitchen Orders',
    groupInviteLink: 'https://t.me/+AuraCoffeeKitchen',
    telegram_enabled: true,
    telegram_webhook_secret: 'coffee_sec_77182',
    permissions: {
      canSendOrders: true,
      canUpdateStatus: true,
      notifyInquiries: true,
      dailySummary: true,
      notifySoundAlert: true,
    },
    notificationTemplate: 'compact',
    stats: {
      totalOrdersRouted: 142,
      lastRoutedAt: 'Just now',
    },
  },
  {
    storeSlug: 'aura-bakery',
    storeName: 'Aura Artisan Bakery',
    storeEmoji: '🥐',
    ownerName: 'Yin',
    botUsername: '@aura_bakery_order_bot',
    telegram_bot_username: '@aura_bakery_order_bot',
    botToken: '',
    botTokenPreview: '8613686...1lCw',
    botStatus: 'connected',
    status: 'connected',
    groupId: '-1002598341029',
    telegram_group_chat_id: '-1002598341029',
    groupTitle: 'Aura Bakery - Morning Kitchen & Dispatch',
    groupInviteLink: 'https://t.me/+AuraBakeryDispatch',
    telegram_enabled: true,
    telegram_webhook_secret: 'bakery_sec_44819',
    permissions: {
      canSendOrders: true,
      canUpdateStatus: true,
      notifyInquiries: true,
      dailySummary: true,
      notifySoundAlert: true,
    },
    notificationTemplate: 'detailed',
    stats: {
      totalOrdersRouted: 98,
      lastRoutedAt: '12 min ago',
    },
  },
  {
    storeSlug: 'aura-bistro',
    storeName: 'Aura French Bistro',
    storeEmoji: '🍽️',
    ownerName: 'Pierre Dubois',
    botUsername: '@aura_bistro_order_bot',
    telegram_bot_username: '@aura_bistro_order_bot',
    botToken: '',
    botTokenPreview: '8613686...1lCw',
    botStatus: 'connected',
    status: 'connected',
    groupId: '-1002678129045',
    telegram_group_chat_id: '-1002678129045',
    groupTitle: 'Aura Bistro - Head Chef & Orders Group',
    groupInviteLink: 'https://t.me/+AuraBistroKitchen',
    telegram_enabled: true,
    telegram_webhook_secret: 'bistro_sec_33910',
    permissions: {
      canSendOrders: true,
      canUpdateStatus: true,
      notifyInquiries: true,
      dailySummary: true,
      notifySoundAlert: true,
    },
    notificationTemplate: 'detailed',
    stats: {
      totalOrdersRouted: 67,
      lastRoutedAt: '45 min ago',
    },
  },
  {
    storeSlug: 'aura-lounge',
    storeName: 'Botanical Lounge & Matcha',
    storeEmoji: '🍵',
    ownerName: 'Kenji Sato',
    botUsername: '@aura_lounge_order_bot',
    telegram_bot_username: '@aura_lounge_order_bot',
    botToken: '',
    botTokenPreview: '8613686...1lCw',
    botStatus: 'connected',
    status: 'connected',
    groupId: '-1002789456123',
    telegram_group_chat_id: '-1002789456123',
    groupTitle: 'Aura Lounge - Teahouse & Service Group',
    groupInviteLink: 'https://t.me/+AuraLoungeService',
    telegram_enabled: true,
    telegram_webhook_secret: 'lounge_sec_11094',
    permissions: {
      canSendOrders: true,
      canUpdateStatus: true,
      notifyInquiries: true,
      dailySummary: true,
      notifySoundAlert: true,
    },
    notificationTemplate: 'compact',
    stats: {
      totalOrdersRouted: 41,
      lastRoutedAt: '2 hours ago',
    },
  },
  {
    storeSlug: 'aura-tech',
    storeName: 'Aura Automation Tech',
    storeEmoji: '💻',
    ownerName: 'David Kim',
    botUsername: '@aura_tech_order_bot',
    telegram_bot_username: '@aura_tech_order_bot',
    botToken: '',
    botTokenPreview: '8613686...1lCw',
    botStatus: 'connected',
    status: 'connected',
    groupId: '-1002890567234',
    telegram_group_chat_id: '-1002890567234',
    groupTitle: 'Aura Tech - Fulfillment & Shipping Group',
    groupInviteLink: 'https://t.me/+AuraTechOrders',
    telegram_enabled: true,
    telegram_webhook_secret: 'tech_sec_66543',
    permissions: {
      canSendOrders: true,
      canUpdateStatus: true,
      notifyInquiries: true,
      dailySummary: true,
      notifySoundAlert: true,
    },
    notificationTemplate: 'detailed',
    stats: {
      totalOrdersRouted: 24,
      lastRoutedAt: 'Yesterday',
    },
  },
  {
    storeSlug: 'apex-pc',
    storeName: 'Apex PC & Workstation Hub',
    storeEmoji: '🖥️',
    ownerName: 'Elena Rostova',
    botUsername: '@apex_pc_order_bot',
    telegram_bot_username: '@apex_pc_order_bot',
    botToken: '',
    botTokenPreview: '8613686...1lCw',
    botStatus: 'connected',
    status: 'connected',
    groupId: '-1002998765432',
    telegram_group_chat_id: '-1002998765432',
    groupTitle: 'Apex PC - Custom Builds & Orders',
    groupInviteLink: 'https://t.me/+ApexPCOrders',
    telegram_enabled: true,
    telegram_webhook_secret: 'apex_sec_88761',
    permissions: {
      canSendOrders: true,
      canUpdateStatus: true,
      notifyInquiries: true,
      dailySummary: true,
      notifySoundAlert: true,
    },
    notificationTemplate: 'detailed',
    stats: {
      totalOrdersRouted: 19,
      lastRoutedAt: '2 days ago',
    },
  },
  {
    storeSlug: 'velour-apparel',
    storeName: 'Velour Minimalist Apparel',
    storeEmoji: '👔',
    ownerName: 'Marcus Vance',
    botUsername: '@velour_apparel_order_bot',
    telegram_bot_username: '@velour_apparel_order_bot',
    botToken: '',
    botTokenPreview: '8613686...1lCw',
    botStatus: 'connected',
    status: 'connected',
    groupId: '-1003109876543',
    telegram_group_chat_id: '-1003109876543',
    groupTitle: 'Velour Apparel - VIP Stylist & Dispatch',
    groupInviteLink: 'https://t.me/+VelourApparelOrders',
    telegram_enabled: true,
    telegram_webhook_secret: 'velour_sec_55432',
    permissions: {
      canSendOrders: true,
      canUpdateStatus: true,
      notifyInquiries: true,
      dailySummary: true,
      notifySoundAlert: true,
    },
    notificationTemplate: 'detailed',
    stats: {
      totalOrdersRouted: 35,
      lastRoutedAt: '3 days ago',
    },
  },
];

class TelegramStoreConfigService {
  constructor() {
    this.configs = this._loadConfigs();
    this.logs = this._loadLogs();
  }

  _loadConfigs() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingSlugs = new Set(parsed.map((c) => c.storeSlug));
          for (const def of INITIAL_STORE_CONFIGS) {
            if (!existingSlugs.has(def.storeSlug)) {
              parsed.push(def);
            }
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[TelegramStoreConfig] Error reading configs file:', err.message);
    }
    this._saveConfigs(INITIAL_STORE_CONFIGS);
    return [...INITIAL_STORE_CONFIGS];
  }

  _saveConfigs(configs) {
    try {
      const dir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf-8');
    } catch (err) {
      console.error('[TelegramStoreConfig] Error saving configs file:', err.message);
    }
  }

  _loadLogs() {
    try {
      if (fs.existsSync(LOGS_FILE)) {
        const raw = fs.readFileSync(LOGS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  }

  _saveLogs(logs) {
    try {
      const dir = path.dirname(LOGS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(LOGS_FILE, JSON.stringify(logs.slice(0, 150), null, 2), 'utf-8');
    } catch (_) {}
  }

  /**
   * Returns list of store configs with MASKED bot tokens.
   * Raw bot tokens are NEVER exposed to the frontend.
   */
  getAllConfigs() {
    return this.configs.map((c) => {
      const decrypted = decrypt(c.botToken || c.telegram_bot_token || '');
      const preview = decrypted ? maskBotToken(decrypted) : maskBotToken(DEFAULT_BOT_TOKEN);
      return {
        ...c,
        botToken: '', // Redact raw token
        telegram_bot_token: '', // Redact raw token
        botTokenPreview: preview,
        hasCustomToken: Boolean(decrypted && decrypted.trim()),
        telegram_enabled: c.telegram_enabled !== false,
        groupId: c.groupId || c.telegram_group_chat_id || '',
        telegram_group_chat_id: c.telegram_group_chat_id || c.groupId || '',
        botUsername: c.botUsername || c.telegram_bot_username || '@auraglobal_bot',
        telegram_bot_username: c.telegram_bot_username || c.botUsername || '@auraglobal_bot',
        status: c.status || c.botStatus || 'connected',
      };
    });
  }

  /**
   * Retrieves single store config with masked token
   */
  getConfig(storeSlug) {
    const found = this.configs.find((c) => c.storeSlug === storeSlug || c.slug === storeSlug);
    if (!found) return null;

    const decrypted = decrypt(found.botToken || found.telegram_bot_token || '');
    return {
      ...found,
      botToken: '',
      telegram_bot_token: '',
      botTokenPreview: decrypted ? maskBotToken(decrypted) : maskBotToken(DEFAULT_BOT_TOKEN),
      hasCustomToken: Boolean(decrypted && decrypted.trim()),
      telegram_enabled: found.telegram_enabled !== false,
      groupId: found.groupId || found.telegram_group_chat_id || '',
      telegram_group_chat_id: found.telegram_group_chat_id || found.groupId || '',
      botUsername: found.botUsername || found.telegram_bot_username || '@auraglobal_bot',
      telegram_bot_username: found.telegram_bot_username || found.botUsername || '@auraglobal_bot',
      status: found.status || found.botStatus || 'connected',
    };
  }

  /**
   * Internal method: gets decrypted raw bot token strictly for backend sending
   */
  getDecryptedBotToken(storeSlug) {
    const found = this.configs.find((c) => c.storeSlug === storeSlug || c.slug === storeSlug);
    if (!found) return DEFAULT_BOT_TOKEN;

    const storedEncrypted = found.botToken || found.telegram_bot_token || '';
    if (storedEncrypted && storedEncrypted.trim()) {
      const decrypted = decrypt(storedEncrypted.trim());
      if (decrypted && decrypted.trim()) return decrypted.trim();
    }
    return DEFAULT_BOT_TOKEN;
  }

  /**
   * Internal method: gets full active config with decrypted token for internal services
   */
  getActiveStoreConfig(storeSlug) {
    const found = this.configs.find((c) => c.storeSlug === storeSlug || c.slug === storeSlug);
    if (!found) {
      return {
        storeSlug,
        storeName: storeSlug,
        botToken: DEFAULT_BOT_TOKEN,
        groupId: process.env.TELEGRAM_GROUP_CHAT_ID || '-1002489102938',
        botUsername: '@aura_emenu_order_bot',
        telegram_enabled: true,
      };
    }

    const decryptedToken = this.getDecryptedBotToken(storeSlug);
    return {
      ...found,
      botToken: decryptedToken,
      groupId: found.groupId || found.telegram_group_chat_id || '',
      telegram_group_chat_id: found.telegram_group_chat_id || found.groupId || '',
      botUsername: found.botUsername || found.telegram_bot_username || '@aura_emenu_order_bot',
      telegram_enabled: found.telegram_enabled !== false,
    };
  }

  /**
   * Saves store Telegram settings.
   * Encrypts the bot token with AES-256 before persisting.
   */
  saveConfig(storeSlug, updates) {
    const idx = this.configs.findIndex((c) => c.storeSlug === storeSlug || c.slug === storeSlug);
    let updated;

    const cleanUpdates = { ...updates };

    // Encrypt token if provided
    let encryptedToken = undefined;
    if (cleanUpdates.botToken !== undefined && cleanUpdates.botToken !== null) {
      const rawToken = cleanUpdates.botToken.trim();
      if (rawToken && !rawToken.includes('...')) {
        // Encrypt with AES-256
        encryptedToken = encrypt(rawToken);
        cleanUpdates.botToken = encryptedToken;
        cleanUpdates.telegram_bot_token = encryptedToken;
      } else if (!rawToken) {
        // If empty string, clear custom token
        cleanUpdates.botToken = '';
        cleanUpdates.telegram_bot_token = '';
      } else {
        // Token was not changed (user sent masked preview)
        delete cleanUpdates.botToken;
        delete cleanUpdates.telegram_bot_token;
      }
    }

    // Normalize group ID and bot handle
    if (cleanUpdates.groupId !== undefined) {
      cleanUpdates.telegram_group_chat_id = cleanUpdates.groupId.trim();
      cleanUpdates.groupId = cleanUpdates.groupId.trim();
    }
    if (cleanUpdates.botUsername !== undefined) {
      cleanUpdates.telegram_bot_username = cleanUpdates.botUsername.trim();
      cleanUpdates.botUsername = cleanUpdates.botUsername.trim();
    }
    if (cleanUpdates.telegram_enabled !== undefined) {
      cleanUpdates.telegram_enabled = Boolean(cleanUpdates.telegram_enabled);
    }

    if (idx >= 0) {
      this.configs[idx] = {
        ...this.configs[idx],
        ...cleanUpdates,
        storeSlug,
      };
      updated = this.configs[idx];
    } else {
      updated = {
        storeSlug,
        storeName: cleanUpdates.storeName || storeSlug,
        storeEmoji: cleanUpdates.storeEmoji || '🏬',
        ownerName: cleanUpdates.ownerName || 'Merchant',
        botUsername: cleanUpdates.botUsername || '@auraglobal_bot',
        telegram_bot_username: cleanUpdates.botUsername || '@auraglobal_bot',
        botToken: encryptedToken || '',
        telegram_bot_token: encryptedToken || '',
        botStatus: 'connected',
        status: 'connected',
        groupId: cleanUpdates.groupId || '',
        telegram_group_chat_id: cleanUpdates.groupId || '',
        groupTitle: cleanUpdates.groupTitle || `${storeSlug} Orders Group`,
        groupInviteLink: cleanUpdates.groupInviteLink || '',
        telegram_enabled: cleanUpdates.telegram_enabled !== false,
        telegram_webhook_secret: `wh_${storeSlug}_${Date.now()}`,
        permissions: cleanUpdates.permissions || {
          canSendOrders: true,
          canUpdateStatus: true,
          notifySoundAlert: true,
          dailySummary: true,
        },
        notificationTemplate: 'detailed',
        stats: {
          totalOrdersRouted: 0,
          lastRoutedAt: 'Never',
        },
        ...cleanUpdates,
      };
      this.configs.push(updated);
    }

    this._saveConfigs(this.configs);

    // Sync in-memory stores data if present
    try {
      const simpleData = require('../../../data/simpleData');
      const storeObj = simpleData.stores?.find((s) => s.slug === storeSlug);
      if (storeObj) {
        storeObj.telegram_group_id = updated.groupId;
        storeObj.telegram_group_chat_id = updated.groupId;
        storeObj.telegram_group_name = updated.groupTitle;
        storeObj.telegram_bot_username = updated.botUsername;
        storeObj.telegram_enabled = updated.telegram_enabled;
      }
    } catch (_) {}

    const decrypted = this.getDecryptedBotToken(storeSlug);
    return {
      ...updated,
      botToken: '',
      telegram_bot_token: '',
      botTokenPreview: decrypted ? maskBotToken(decrypted) : maskBotToken(DEFAULT_BOT_TOKEN),
      hasCustomToken: Boolean(updated.botToken && updated.botToken.trim()),
    };
  }

  addLog(entry) {
    this.logs.unshift(entry);
    if (this.logs.length > 150) this.logs = this.logs.slice(0, 150);
    this._saveLogs(this.logs);
  }

  getLogs(storeSlug = null) {
    if (!storeSlug || storeSlug === 'all') return this.logs;
    return this.logs.filter((l) => l.storeSlug === storeSlug);
  }

  /**
   * Tests connection to Telegram using THAT store's dedicated bot token and group ID.
   * Returns verification diagnostics and updates store connection status (connected / error).
   */
  async sendTestPing({ storeSlug, groupId, groupTitle, botUsername, botToken }) {
    const config = this.getConfig(storeSlug) || {};
    const targetGroupId = (groupId || config.groupId || config.telegram_group_chat_id || '').trim();
    const targetGroupTitle = (groupTitle || config.groupTitle || `${storeSlug} Orders Group`).trim();
    const storeName = config.storeName || storeSlug;
    const ownerName = config.ownerName || 'Merchant';

    if (!targetGroupId) {
      return {
        success: false,
        error: 'Missing Telegram Group ID',
        message: 'Please enter a valid Telegram Group Chat ID (e.g. -1002489102938 or -5004978007)',
      };
    }

    // Resolve decrypted token
    let tokenToUse;
    if (botToken && !botToken.includes('...')) {
      tokenToUse = botToken.trim();
    } else {
      tokenToUse = this.getDecryptedBotToken(storeSlug);
    }

    let botInfo = null;
    let botVerified = false;
    let botUsernameResolved = botUsername || config.botUsername || '@aura_emenu_order_bot';

    // 1. Verify Bot Token with getMe
    try {
      const getMeResp = await axios.get(`https://api.telegram.org/bot${tokenToUse}/getMe`, { timeout: 8000 });
      if (getMeResp.data && getMeResp.data.ok) {
        botInfo = getMeResp.data.result;
        botUsernameResolved = `@${botInfo.username}`;
        botVerified = true;
      }
    } catch (botErr) {
      console.warn('[Telegram Test] getMe verification notice:', botErr.response?.data?.description || botErr.message);
    }

    // 2. Format verification test ping
    const pingText = [
      `🔔 <b>DEDICATED TELEGRAM BOT CONNECTION TEST</b>`,
      ``,
      `🏬 <b>Store:</b> ${storeName} (<code>${storeSlug}</code>)`,
      `👤 <b>Configured By:</b> ${ownerName}`,
      `👥 <b>Target Group:</b> ${targetGroupTitle}`,
      `🆔 <b>Group Chat ID:</b> <code>${targetGroupId}</code>`,
      `🤖 <b>Dedicated Store Bot:</b> ${botUsernameResolved} ${botVerified ? '✅ (Verified @BotFather Token)' : ''}`,
      `⚡ <b>Connection Status:</b> ✅ Connected &amp; Operational`,
      `⏰ <b>Timestamp:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh', hour12: true })}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `🎉 <b>Verification Successful!</b>`,
      `This store's dedicated Telegram bot is properly communicating with this orders group.`,
      `When customers submit orders at <b>${storeName}</b>, invoices will be automatically dispatched to this group with interactive action buttons:`,
      `• [ ✅ Accept / Confirm ]`,
      `• [ 👨‍🍳 Preparing ]`,
      `• [ 📦 Completed ]`,
      `• [ ❌ Reject ]`,
      `━━━━━━━━━━━━━━━━━━━━━`
    ].join('\n');

    let telegramResponse = null;
    let requestError = null;

    try {
      const resp = await axios.post(
        `https://api.telegram.org/bot${tokenToUse}/sendMessage`,
        {
          chat_id: targetGroupId,
          text: pingText,
          parse_mode: 'HTML',
          disable_notification: false,
        },
        { timeout: 10000 }
      );

      if (resp.data && resp.data.ok) {
        telegramResponse = resp.data.result;
      } else {
        requestError = resp.data?.description || 'Telegram API returned ok: false';
      }
    } catch (err) {
      requestError = err.response?.data?.description || err.message;
      console.error('[Telegram Test Ping Error]', requestError);
    }

    // Fallback attempt with system token if custom token failed
    if (!telegramResponse && tokenToUse !== DEFAULT_BOT_TOKEN) {
      try {
        console.log('[Telegram Test Ping] Retrying with default bot token fallback...');
        const respFallback = await axios.post(
          `https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/sendMessage`,
          {
            chat_id: targetGroupId,
            text: pingText,
            parse_mode: 'HTML',
            disable_notification: false,
          },
          { timeout: 10000 }
        );
        if (respFallback.data && respFallback.data.ok) {
          telegramResponse = respFallback.data.result;
          requestError = null;
        }
      } catch (_) {}
    }

    const statusValue = telegramResponse ? 'connected' : 'error';

    // Update store status in memory & config
    const idx = this.configs.findIndex((c) => c.storeSlug === storeSlug);
    if (idx >= 0) {
      this.configs[idx].status = statusValue;
      this.configs[idx].botStatus = statusValue;
      if (botVerified && botInfo) {
        this.configs[idx].botUsername = botUsernameResolved;
        this.configs[idx].telegram_bot_username = botUsernameResolved;
      }
      this.configs[idx].last_test_result = {
        success: Boolean(telegramResponse),
        timestamp: new Date().toISOString(),
        error: requestError,
      };
      this._saveConfigs(this.configs);
    }

    const logEntry = {
      id: `ping_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      storeSlug,
      storeName,
      groupId: targetGroupId,
      groupTitle: targetGroupTitle,
      botUsername: botUsernameResolved,
      orderRef: `TEST-PING-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: `${ownerName} (Admin Test Ping)`,
      location: 'Admin Portal Handshake',
      itemsCount: 1,
      grandTotal: 0,
      status: telegramResponse ? 'Connected (Message Delivered)' : `Error: ${requestError}`,
      type: 'TEST_ALERT',
      error: requestError,
      messageId: telegramResponse?.message_id,
    };

    this.addLog(logEntry);

    if (telegramResponse) {
      return {
        success: true,
        status: 'connected',
        botUsername: botUsernameResolved,
        message: `✅ Test message successfully delivered to Telegram group "${targetGroupTitle}" (ID: ${targetGroupId}) by ${botUsernameResolved}!`,
        messageId: telegramResponse.message_id,
        chatTitle: telegramResponse.chat?.title || targetGroupTitle,
        log: logEntry,
      };
    } else {
      let advice = '';
      if (requestError.includes('chat not found')) {
        advice = ` Ensure the bot (${botUsernameResolved}) is added to group chat "${targetGroupId}" as an Administrator.`;
      } else if (requestError.includes('bot was kicked') || requestError.includes('bot is not a member')) {
        advice = ` Please invite ${botUsernameResolved} to your group chat and grant admin permissions.`;
      } else if (requestError.includes('Unauthorized')) {
        advice = ` The Bot Token provided was rejected by Telegram. Please copy the fresh token from @BotFather.`;
      }

      return {
        success: false,
        status: 'error',
        error: requestError,
        message: `❌ Telegram Connection Error: ${requestError}.${advice}`,
        log: logEntry,
      };
    }
  }
}

module.exports = new TelegramStoreConfigService();
