const { Bot, InlineKeyboard, Keyboard } = require('grammy');
let EMenuModel = null;
try {
  EMenuModel = require('../../API/app/models/emenu.model');
} catch (_) {}
const botToken = process.env.TELEGRAM_BOT_TOKEN || '8613686625:AAFe8-04LvQumEXZ8-MBjbNSDozba3E1lCw';
// Base application URL for Telegram Mini Apps and Web Menus
const webAppBaseUrl = (
  process.env.PUBLIC_APP_URL ||
  process.env.APP_URL ||
  process.env.WEBAPP_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

let bot = null;

/**
 * Universal safe inline button builder:
 * In Telegram Bot API, `web_app` buttons are ONLY allowed in 1-on-1 private chats
 * and MUST use HTTPS. In group chats, supergroups, channels, or with non-HTTPS URLs,
 * Telegram rejects the message with:
 * `400: Bad Request: BUTTON_TYPE_INVALID`
 * This helper dynamically outputs `webApp` for private HTTPS chats and `url` everywhere else.
 */
function addAppButton(keyboard, text, targetUrl) {
  const fullUrl = targetUrl.startsWith('http')
    ? targetUrl
    : `${webAppBaseUrl}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
  // Standard url buttons are 100% compliant with Telegram Bot API across private, group, and channel contexts
  // and completely eliminate '400 Bad Request: BUTTON_TYPE_INVALID'
  return keyboard.url(text, fullUrl);
}

// Master Available Stores Catalog across 8 Merchants:
// - Merchant 'Yin' owns 2 stores: 'sbc-store' & 'aura-bakery'
// - 7 other merchants own 1 store each (one store one merchant)
const ALL_AVAILABLE_STORES = [
  { id: 1, slug: 'sbc-store', name: 'Aura Specialty Coffee', emoji: '☕', merchant: 'Yin', tagline: 'Artisan Highland Roasts & Specialty Espresso' },
  { id: 2, slug: 'aura-bakery', name: 'Aura Artisan Bakery', emoji: '🥐', merchant: 'Yin', tagline: 'Fresh Sourdough, Viennoiserie & Pastries' },
  { id: 4, slug: 'aura-bistro', name: 'Aura French Bistro', emoji: '🍽️', merchant: 'Pierre Dubois', tagline: 'Classical French Gastronomy, Burgers & Steaks' },
  { id: 3, slug: 'aura-lounge', name: 'Botanical Lounge & Matcha', emoji: '🍵', merchant: 'Kenji Sato', tagline: 'Ceremonial Matcha, Herbal Tonics & Teas' },
  { id: 6, slug: 'nexus-mobile', name: 'Nexus Mobile & Gadgets', emoji: '📱', merchant: 'Alex Chen', tagline: 'Smartphones, Audio & Mobile Tech' },
  { id: 5, slug: 'aura-tech', name: 'Aura Automation Tech', emoji: '💻', merchant: 'David Kim', tagline: 'Smart Living, Workstations & Accessories' },
  { id: 7, slug: 'apex-pc', name: 'Apex PC & Workstation Hub', emoji: '🖥️', merchant: 'Elena Rostova', tagline: 'High-Performance Desktops & Computing' },
  { id: 8, slug: 'velour-apparel', name: 'Velour Minimalist Apparel', emoji: '👔', merchant: 'Marcus Vance', tagline: 'Contemporary Fashion & Tailoring' },
];

/**
 * Persistent Reply Keyboard located directly in the Telegram chat input box:
 * Enables the user to tap "🏬 Show All Stores" or individual store shortcuts anytime.
 */
function getInputBoxReplyKeyboard() {
  return new Keyboard()
    .text('🏬 Show All Stores')
    .row()
    .text('☕ Aura Coffee')
    .text('🥐 Aura Bakery')
    .row()
    .text('🍽️ French Bistro')
    .text('🍵 Botanical Lounge')
    .row()
    .text('📱 Nexus Mobile')
    .text('💻 Aura Tech')
    .row()
    .text('📋 My Orders')
    .text('ℹ️ Help')
    .resized()
    .persistent();
}

if (botToken) {
  bot = new Bot(botToken);

  // GrammY API transformer: intercepts and sanitizes any outgoing keyboard buttons
  // to unconditionally prevent 400 Bad Request: BUTTON_TYPE_INVALID or BUTTON_URL_INVALID
  bot.api.config.use(async (prev, method, payload, signal) => {
    if (payload?.reply_markup?.inline_keyboard && Array.isArray(payload.reply_markup.inline_keyboard)) {
      payload.reply_markup.inline_keyboard = payload.reply_markup.inline_keyboard.map((row) =>
        row.map((btn) => {
          if (!btn || typeof btn !== 'object') {
            return { text: 'Open', url: `${webAppBaseUrl}/shop` };
          }
          const text = btn.text || 'View';
          if (btn.callback_data) {
            return { text, callback_data: String(btn.callback_data).slice(0, 64) };
          }
          const rawUrl = btn.url || btn.web_app?.url || `${webAppBaseUrl}/shop`;
          const validUrl = rawUrl.startsWith('http') ? rawUrl : `${webAppBaseUrl}/${rawUrl.replace(/^\//, '')}`;
          return { text, url: validUrl };
        })
      );
    }

    try {
      return await prev(method, payload, signal);
    } catch (err) {
      const msg = err?.error?.message || err?.message || err?.description || String(err);
      if (
        (msg.includes('BUTTON_TYPE_INVALID') || msg.includes('BUTTON_URL_INVALID')) &&
        payload?.reply_markup
      ) {
        if (payload.reply_markup.inline_keyboard) {
          payload.reply_markup.inline_keyboard = payload.reply_markup.inline_keyboard.map((row) =>
            row.map((btn) => ({
              text: btn.text || 'Open',
              url: (btn.url && btn.url.startsWith('http')) ? btn.url : `${webAppBaseUrl}/shop`,
            }))
          );
        }
        try {
          return await prev(method, payload, signal);
        } catch (retryErr) {
          // If still fails with inline keyboard, strip reply_markup gracefully
          delete payload.reply_markup;
          return await prev(method, payload, signal);
        }
      }
      throw err;
    }
  });

  // Automatically enforce clean official bot description and commands
  (async () => {
    try {
      await bot.api.setMyDescription(
        'Official Aura Global E-Menu & Ordering Bot. Browse menus, order food & beverages, and receive real-time kitchen updates.'
      );
      await bot.api.setMyDescription(
        'Official Aura Global E-Menu & Ordering Bot. Browse menus, order food & beverages, and receive real-time kitchen updates.',
        { language_code: 'en' }
      );
      await bot.api.setMyShortDescription(
        'Aura Global E-Menu & Instant Telegram Ordering'
      );
      await bot.api.setMyShortDescription(
        'Aura Global E-Menu & Instant Telegram Ordering',
        { language_code: 'en' }
      );

      // Register official bot commands menu
      await bot.api.setMyCommands([
        { command: 'stores', description: 'Show All Stores' },
        { command: 'shops', description: 'Show All Stores' },
        { command: 'start', description: 'Start Bot & Show Stores' },
        { command: 'orders', description: 'View My Orders' },
        { command: 'help', description: 'How to use Aura E-Menu' },
      ]);

      // Set input box menu button to commands
      try {
        await bot.api.setChatMenuButton({
          menu_button: { type: 'commands' },
        });
      } catch (_) {}
    } catch (e) {
      console.warn('[Telegram Bot] Initialization sync notice:', e.message);
    }
  })();

  // Anti-Spam Middleware: Automatically drop & delete any spam links/promos
  bot.use(async (ctx, next) => {
    const text = ctx.message?.text || ctx.message?.caption || '';
    if (text) {
      const lower = text.toLowerCase();
      if (
        lower.includes('chatprovider_bot') ||
        lower.includes('ref_c39') ||
        lower.includes('chatgpt') ||
        lower.includes('xaitool') ||
        lower.includes('generai.org') ||
        lower.includes('undress') ||
        lower.includes('porn')
      ) {
        try {
          if (ctx.chat && ctx.message?.message_id) {
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);
          }
        } catch (_) {}
        return; // Halt processing spam messages
      }
    }
    return next();
  });

  // Reusable helper to display all available stores
  async function showAllStoresHandler(ctx) {
    const keyboard = new InlineKeyboard();

    // Top primary action bar: Open Full Stores Directory (Web App / URL)
    addAppButton(keyboard, '🏬 Open Full Stores Directory (Web App)', `${webAppBaseUrl}/shop`, ctx).row();

    // Individual store buttons with true links (2 per row for easy mobile tapping)
    ALL_AVAILABLE_STORES.forEach((s, idx) => {
      addAppButton(keyboard, `${s.emoji} ${s.name}`, `${webAppBaseUrl}/shop/${s.slug}`, ctx);
      if (idx % 2 === 1) keyboard.row();
    });

    if (ALL_AVAILABLE_STORES.length % 2 !== 0) keyboard.row();

    addAppButton(keyboard, '📖 Digital Web Menu (Bakery)', `${webAppBaseUrl}/shop/menu/aura-bakery`, ctx).row();
    addAppButton(keyboard, '📋 My Orders & Receipts', `${webAppBaseUrl}/shop/sbc-store`, ctx).row();
    addAppButton(keyboard, '🌐 Browse Global Website', `${webAppBaseUrl}/`, ctx);

    const messageText =
      `🏪 **Aura Global — All 8 Merchants & Stores:**\n\n` +
      `Browse menus, order online, or switch between stores directly inside Telegram:\n\n` +
      ALL_AVAILABLE_STORES.map(
        (s, idx) => `${idx + 1}. ${s.emoji} **${s.name}** (Merchant: *${s.merchant}*)\n   _${s.tagline}_\n   • TMA: \`${webAppBaseUrl}/shop/${s.slug}\`\n   • Digital Menu: \`${webAppBaseUrl}/shop/menu/${s.slug}\`\n`
      ).join('\n') +
      `\n👇 *Tap any store button below to launch its Telegram Mini App:*`;

    // Reply with inline keyboard and ensure input box keeps the Show All Stores shortcut keyboard
    return ctx.reply(messageText, {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  }

  // Helper to register user and send credentials directly to their personal chat
  async function registerAndSendCredentials(ctx, token = 'auth_telegram') {
    try {
      const TelegramAuthController = require('../../API/app/controller/tma/telegramAuth.controller');
      const result = await TelegramAuthController.handleBotStartAuth(token, ctx.from);
      if (result) {
        const { credentials } = result;
        const keyboard = new InlineKeyboard();
        addAppButton(keyboard, '🌐 Open Aura Global Website', `${webAppBaseUrl}/login?user=${credentials.username}`, ctx).row();
        addAppButton(keyboard, '🏬 Show All Stores', `${webAppBaseUrl}/shop`, ctx);

        return ctx.reply(
          `🎉 <b>Welcome to Aura Global, ${ctx.from.first_name || 'Member'}!</b>\n\n` +
          `Your member account has been registered in our database via Telegram Bot.\n\n` +
          `🔑 <b>Your Account Login Credentials:</b>\n` +
          `• <b>Username:</b> <code>${credentials.username}</code>\n` +
          `• <b>Password:</b> <code>${credentials.password}</code>\n` +
          `• <b>Telegram ID:</b> <code>${ctx.from.id}</code>\n\n` +
          `✨ <b>Account Privileges:</b>\n` +
          `• 🎁 <b>150 VIP Welcome Loyalty Points</b> credited!\n` +
          `• 🧾 Digital order receipts & fulfillment updates sent directly to this chat.\n\n` +
          `<i>Tap below to open the website logged in:</i>`,
          { reply_markup: keyboard, parse_mode: 'HTML' }
        );
      }
    } catch (authErr) {
      console.warn('[Telegram Bot] Auth handling notice:', authErr.message);
    }
  }

  // Helper to send individual store details with true verified links
  async function sendStoreDetails(ctx, targetSlug) {
    const store =
      ALL_AVAILABLE_STORES.find((s) => s.slug === targetSlug) ||
      (await EMenuModel.getStoreBySlug(targetSlug)) ||
      ALL_AVAILABLE_STORES[0];

    const storeName = store.name || store.company || targetSlug;
    const storeEmoji = store.emoji || '🏪';
    const storeMerchant = store.merchant || 'Aura Partner';
    const storeTagline = store.tagline || 'Digital Ordering & Menu';
    const webMenuUrl = `${webAppBaseUrl}/shop/${store.slug}`;
    const digitalMenuUrl = `${webAppBaseUrl}/shop/menu/${store.slug}`;
    const storeWebUrl = `${webAppBaseUrl}/shops/${store.id || store.slug}`;
    const tmaDirectLink = `https://t.me/aura_emenu_order_bot/menu?startapp=shop_${store.slug}`;

    const kb = new InlineKeyboard();
    addAppButton(kb, `🛍️ Launch ${storeName} TMA`, webMenuUrl, ctx).row();
    addAppButton(kb, `📖 Digital E-Menu (Web)`, digitalMenuUrl, ctx).row();
    addAppButton(kb, `🏪 Web Store Profile`, storeWebUrl, ctx).row();
    kb.text('🏬 Show All Stores', 'show_all_stores');
    addAppButton(kb, '📋 My Orders', `${webAppBaseUrl}/shop/${store.slug}`, ctx);

    return ctx.reply(
      `${storeEmoji} *${storeName}*\n` +
      `Merchant: *${storeMerchant}*\n` +
      `_${storeTagline}_\n\n` +
      `🔗 *Verified Direct Store Links:*\n` +
      `• 🛍️ *Telegram Mini App:* [Open Mini App](${webMenuUrl})\n` +
      `  \`${webMenuUrl}\`\n\n` +
      `• 📖 *Digital Web Menu:* [Open Web Menu](${digitalMenuUrl})\n` +
      `  \`${digitalMenuUrl}\`\n\n` +
      `• 🏪 *Store Website & Catalog:* [Open Profile](${storeWebUrl})\n` +
      `  \`${storeWebUrl}\`\n\n` +
      `• 🚀 *Direct Telegram Deep-link:*\n` +
      `  \`${tmaDirectLink}\`\n\n` +
      `👇 _Tap any button below to open instantly:_`,
      { reply_markup: kb, parse_mode: 'Markdown' }
    );
  }

  // Command: /start [param]
  bot.command('start', async (ctx) => {
    const rawParam = (ctx.match || '').trim();
    let targetStoreSlug = null;

    // Check if start parameter is an authentication / registration session token
    if (rawParam.startsWith('auth_') || rawParam.startsWith('reg_') || rawParam === 'register' || rawParam === 'login') {
      return registerAndSendCredentials(ctx, rawParam);
    }

    if (rawParam.startsWith('shop_')) {
      targetStoreSlug = rawParam.replace('shop_', '');
    } else if (rawParam.startsWith('store_')) {
      targetStoreSlug = rawParam.replace('store_', '');
    } else if (rawParam.startsWith('biller_')) {
      const billerId = rawParam.replace('biller_', '');
      const store = await EMenuModel.getStoreByBillerId(billerId);
      if (store) targetStoreSlug = store.slug;
    } else if (rawParam) {
      targetStoreSlug = rawParam;
    }

    if (targetStoreSlug) {
      return sendStoreDetails(ctx, targetStoreSlug);
    }

    // Default welcome: Provide direct store buttons and website links
    const keyboard = new InlineKeyboard();
    addAppButton(keyboard, '🏬 Open Full Stores Directory (Web App)', `${webAppBaseUrl}/shop`, ctx).row();

    ALL_AVAILABLE_STORES.forEach((s, idx) => {
      addAppButton(keyboard, `${s.emoji} ${s.name}`, `${webAppBaseUrl}/shop/${s.slug}`, ctx);
      if (idx % 2 === 1) keyboard.row();
    });

    if (ALL_AVAILABLE_STORES.length % 2 !== 0) keyboard.row();

    addAppButton(keyboard, '📋 My Orders & Receipts', `${webAppBaseUrl}/shop/sbc-store`, ctx).row();
    addAppButton(keyboard, '🌐 Browse Global Website', `${webAppBaseUrl}/`, ctx);

    await ctx.reply(
      `👋 **Welcome to Aura Global E-Menu & Telegram Mini App!**\n\n` +
      `Browse menus, order food & beverages, and receive kitchen preparation receipts in real time.\n\n` +
      ALL_AVAILABLE_STORES.map((s, idx) => `${idx + 1}. ${s.emoji} *${s.name}* — ${s.tagline}`).join('\n') +
      `\n\n_Tap any store button below to open its verified menu:_`,
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    );

    // Provide persistent input box keyboard with '🏬 Show All Stores' shortcut
    if (ctx.chat?.type === 'private') {
      try {
        await ctx.reply('✨ Tap **🏬 Show All Stores** in the input bar below anytime to browse all merchants:', {
          reply_markup: getInputBoxReplyKeyboard(),
          parse_mode: 'Markdown',
        });
      } catch (_) {}
    }
  });

  // Command: /shops or /stores -> Displays All Stores
  bot.command(['shops', 'stores'], showAllStoresHandler);

  // User message trigger for "Show All Stores" from input box keyboard or text
  bot.hears([
    '🏬 Show All Stores',
    'Show All Stores',
    /show all stores/i,
    /all stores/i,
    /^stores$/i,
    /^shops$/i,
  ], showAllStoresHandler);

  // Callback query trigger for all stores
  bot.callbackQuery('show_all_stores', async (ctx) => {
    await ctx.answerCallbackQuery();
    return showAllStoresHandler(ctx);
  });

  // Callback query trigger for specific store: store_<slug>
  bot.callbackQuery(/^store_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const slug = ctx.match[1];
    return sendStoreDetails(ctx, slug);
  });

  // Quick message triggers for input box keyboard buttons for ALL Stores (sends true verified links & buttons)
  bot.hears(/Aura Coffee|☕ Aura Coffee|sbc-store/i, (ctx) => sendStoreDetails(ctx, 'sbc-store'));
  bot.hears(/Aura Bakery|🥐 Aura Bakery|aura-bakery/i, (ctx) => sendStoreDetails(ctx, 'aura-bakery'));
  bot.hears(/French Bistro|🍽️ French Bistro|aura-bistro/i, (ctx) => sendStoreDetails(ctx, 'aura-bistro'));
  bot.hears(/Botanical Lounge|🍵 Botanical Lounge|aura-lounge/i, (ctx) => sendStoreDetails(ctx, 'aura-lounge'));
  bot.hears(/Nexus Mobile|📱 Nexus Mobile|nexus-mobile/i, (ctx) => sendStoreDetails(ctx, 'nexus-mobile'));
  bot.hears(/Aura Tech|💻 Aura Tech|aura-tech/i, (ctx) => sendStoreDetails(ctx, 'aura-tech'));
  bot.hears(/Apex PC|🖥️ Apex PC|apex-pc/i, (ctx) => sendStoreDetails(ctx, 'apex-pc'));
  bot.hears(/Velour Apparel|👔 Velour Apparel|velour-apparel/i, (ctx) => sendStoreDetails(ctx, 'velour-apparel'));

  // Command: /orders
  bot.command('orders', async (ctx) => {
    const keyboard = new InlineKeyboard();
    addAppButton(keyboard, '📋 View My Past Orders', `${webAppBaseUrl}/shop/sbc-store`, ctx).row();
    addAppButton(keyboard, '🏬 Show All Stores', `${webAppBaseUrl}/shop`, ctx);

    await ctx.reply(
      `🧾 **Your Past Orders & Receipts**\n\n` +
      `Check your live order statuses, order items, and delivery table information by launching the receipt viewer:`,
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    );
  });
  bot.hears(/My Orders|📋 My Orders/i, async (ctx) => {
    const keyboard = new InlineKeyboard();
    addAppButton(keyboard, '📋 View My Past Orders', `${webAppBaseUrl}/shop/sbc-store`, ctx).row();
    addAppButton(keyboard, '🏬 Show All Stores', `${webAppBaseUrl}/shop`, ctx);

    await ctx.reply(
      `🧾 **Your Past Orders & Receipts**\n\n` +
      `Check your live order statuses, order items, and delivery table information:`,
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    );
  });

  // Command: /help
  bot.command('help', async (ctx) => {
    const keyboard = new InlineKeyboard();
    addAppButton(keyboard, '🏬 Show All Stores', `${webAppBaseUrl}/shop`, ctx);

    await ctx.reply(
      `ℹ️ **How to use Aura E-Menu Mini App:**\n\n` +
      `1️⃣ Tap **🏬 Show All Stores** in your input bar to view all available stores.\n` +
      `2️⃣ Tap any store button to open the instant Telegram Mini App.\n` +
      `3️⃣ Add food, drinks, or gadgets to your cart.\n` +
      `4️⃣ Enter your table number or delivery address and tap **Place Order**.\n` +
      `5️⃣ The store's staff Telegram group receives the order instantly with customer contact and item breakdown!\n` +
      `6️⃣ Tap **My Orders** in the app to follow order preparation status.`,
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    );
  });
  bot.hears(/Help|ℹ️ Help/i, async (ctx) => {
    const keyboard = new InlineKeyboard();
    addAppButton(keyboard, '🏬 Show All Stores', `${webAppBaseUrl}/shop`, ctx);

    await ctx.reply(
      `ℹ️ **How to use Aura E-Menu Mini App:**\n\n` +
      `1️⃣ Tap **🏬 Show All Stores** in your input bar to view all available stores.\n` +
      `2️⃣ Tap any store button to open the instant Telegram Mini App.\n` +
      `3️⃣ Add food, drinks, or gadgets to your cart.\n` +
      `4️⃣ Enter your table number or delivery address and tap **Place Order**.\n` +
      `5️⃣ The store's staff Telegram group receives the order instantly!`,
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    );
  });

  // Command: /register (or callback query)
  bot.command('register', async (ctx) => {
    return registerAndSendCredentials(ctx, 'auth_register_cmd');
  });

  bot.callbackQuery('register_user', async (ctx) => {
    await ctx.answerCallbackQuery();
    return registerAndSendCredentials(ctx, 'auth_register_cb');
  });

  bot.catch((err) => {
    const errorMsg = err?.error?.message || err?.message || String(err);
    if (errorMsg.includes('409') || errorMsg.includes('Conflict') || errorMsg.includes('terminated by other getUpdates')) {
      console.log('[Telegram Bot] 409 Conflict: Another bot runner is actively polling. Local polling stopped gracefully.');
      try {
        bot.stop();
      } catch (_) {}
      return;
    }
    if (errorMsg.includes('BUTTON_TYPE_INVALID')) {
      console.log('[Telegram Bot] Handled BUTTON_TYPE_INVALID gracefully.');
      return;
    }
    console.log(`[Telegram Bot] Notice: ${errorMsg}`);
  });
}

module.exports = bot;
