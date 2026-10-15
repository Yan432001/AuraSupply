# Aura Supply B2B & E-Menu: Telegram Concept Controller

This directory (`c:\AuraSupply\Telegram`) centralizes and governs all Telegram-related capabilities across the Aura ERP and B2B platform.

---

## 1. Directory Structure

```
c:\AuraSupply\Telegram\
├── index.js                      # Master unified entry point & service exporter
├── bot\
│   └── bot.service.js            # GrammY Bot engine (/start, /stores, /menu, persistent keyboards)
├── webhook\
│   ├── webhook.controller.js     # Processes Telegram updates & inline buttons (Confirm, Cook, Done)
│   └── webhook.route.js          # Express route handler: /api/telegram/webhook/:storeSlug/:secret
├── notifications\
│   └── notification.service.js   # Formats and dispatches HTML order invoices to merchant staff groups
├── stores\
│   ├── storeConfig.service.js    # Multi-store dedicated bot tokens, chat IDs, topic threads
│   ├── stores.controller.js      # REST API controller for Telegram store configurations
│   └── stores.route.js           # Routes for /api/admin/telegram-stores and /api/tma/telegram-stores
├── auth\
│   ├── telegramAuth.controller.js# Telegram Mini App user account generation & personal credentials
│   └── telegramAuth.middleware.js# HMAC-SHA256 cryptographic initData validation
└── README.md                     # This architectural blueprint
```

---

## 2. Interaction with Front End (`AuraTheme`) and Back End (`API`)

### A. Front End UI (`c:\AuraSupply\AuraTheme`)
- **Telegram Mini App (TMA) Client**:
  - `AuraTheme/src/views/context/TelegramContext.jsx`: Provides Telegram WebApp context (`window.Telegram.WebApp`), user identity, theme detection (`light`/`dark`), and haptic feedback.
  - `AuraTheme/src/hooks/useTelegram.js`: React hook for Telegram actions (MainButton, BackButton, showAlert, sendData).
  - `AuraTheme/src/components/web/shared/TelegramMiniAppModal.jsx`: Modal QR code and deep links to launch Telegram bots.
  - `AuraTheme/src/views/TelegramEntry.jsx`: Entry point when opened inside Telegram WebApp (`t.me/aura_emenu_order_bot`).
- **ERP Admin Settings**:
  - Store managers configure bot tokens, staff group chat IDs, and test-ping their Telegram groups under `/admins/modules` and store settings.

### B. Back End Control (`c:\AuraSupply\API`)
- Core REST API endpoints process catalog data, user accounts, and sales orders.
- When a customer places an order via WebApp or E-Menu:
  1. `API/app/controller/tma/order.controller.js` creates the order.
  2. It calls `Telegram.dispatchOrderNotification(order)` from `c:\AuraSupply\Telegram`.
  3. The notification service formats an HTML invoice and sends it directly to the designated store's Telegram staff group.
  4. Staff in the group can click **[✅ Accept]**, **[👨‍🍳 Preparing]**, or **[📦 Completed]** inline buttons.
  5. Telegram hits the webhook router in `Telegram/webhook/webhook.route.js`, updating the order in real time.

---

## 3. How to Start the Telegram Bot

From `server.js` or any script:

```javascript
const Telegram = require('./Telegram');

// Start bot polling daemon (safe, non-blocking)
Telegram.startBot({
  onStart: (botInfo) => {
    console.log(`Bot running as @${botInfo.username}`);
  }
});
```

---

## 4. Multi-Store Telegram Routing

Each merchant store can have a dedicated Telegram Bot and Group Chat ID:
- **Aura Specialty Coffee** (`sbc-store`) $\rightarrow$ Kitchen Orders Group (`-1002489102938`)
- **Aura Artisan Bakery** (`aura-bakery`) $\rightarrow$ Dispatch Group (`-1002598341029`)
- **Nexus Mobile & Gadgets** (`nexus-mobile`) $\rightarrow$ Orders Group (`-5004978007`)
- **Botanical Lounge** (`aura-lounge`) $\rightarrow$ Baristas Group

All configurations are saved and managed in `data/telegram_store_configs.json`.
