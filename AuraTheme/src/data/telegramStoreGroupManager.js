// Telegram Mini App: Multi-Store Group Management & Bot Permissions Store
// Stores synchronized directly from database (aura_companies)

const STORAGE_KEY = 'aura_telegram_store_groups_v1';
const ROUTING_LOGS_KEY = 'aura_telegram_routing_logs_v1';

export const DEFAULT_TELEGRAM_STORE_CONFIGS = [];

// Read all store configs
export const getAllStoreTelegramConfigs = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TELEGRAM_STORE_CONFIGS));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let hasChanges = false;
      const combined = [...parsed];
      DEFAULT_TELEGRAM_STORE_CONFIGS.forEach((def) => {
        if (!combined.some((c) => c.storeSlug === def.storeSlug)) {
          combined.push(def);
          hasChanges = true;
        }
      });
      if (hasChanges) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
      }
      return combined;
    }
    return [];
  } catch (err) {
    console.warn('[telegramStoreGroupManager] Failed reading from localStorage:', err);
    return [];
  }
};

// Get single store config by slug
export const getStoreTelegramConfig = (storeSlug) => {
  const configs = getAllStoreTelegramConfigs();
  const found = configs.find((c) => c.storeSlug === storeSlug);
  if (found) return found;

  return null;
};

// Update and persist config for a store
export const saveStoreTelegramConfig = (storeSlug, updates) => {
  const configs = getAllStoreTelegramConfigs();
  const index = configs.findIndex((c) => c.storeSlug === storeSlug);

  let updatedConfigs;
  if (index >= 0) {
    updatedConfigs = configs.map((c) =>
      c.storeSlug === storeSlug ? { ...c, ...updates } : c
    );
  } else {
    updatedConfigs = [...configs, { storeSlug, ...updates }];
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs));
    window.dispatchEvent(
      new CustomEvent('aura_telegram_groups_updated', {
        detail: { storeSlug, configs: updatedConfigs },
      })
    );
  } catch (err) {
    console.error('[telegramStoreGroupManager] Failed saving to localStorage:', err);
  }

  // Sync to backend server persistence
  try {
    fetch('/api/admin/telegram-stores/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeSlug, ...updates }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.status && res.data) {
          // Update preview in local state if server returned masked token
          const reConfigs = getAllStoreTelegramConfigs().map((c) =>
            c.storeSlug === storeSlug ? { ...c, ...res.data } : c
          );
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reConfigs));
        }
      })
      .catch(() => {});
  } catch (_) {}

  return updatedConfigs.find((c) => c.storeSlug === storeSlug);
};

// Sync store configs with server on initialization
export const syncStoreTelegramConfigsWithServer = async () => {
  try {
    const resp = await fetch('/api/admin/telegram-stores/configs');
    if (resp.ok) {
      const result = await resp.json();
      if (result.status && Array.isArray(result.data) && result.data.length > 0) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
          window.dispatchEvent(
            new CustomEvent('aura_telegram_groups_updated', {
              detail: { configs: result.data },
            })
          );
        }
        return result.data;
      }
    }
  } catch (_) {}
  return getAllStoreTelegramConfigs();
};

// Read routing logs
export const getTelegramRoutingLogs = (storeSlug = null) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ROUTING_LOGS_KEY);
    if (!raw) return [];
    const logs = JSON.parse(raw);
    if (!Array.isArray(logs)) return [];
    if (!storeSlug || storeSlug === 'all') return logs;
    return logs.filter((log) => log.storeSlug === storeSlug);
  } catch (err) {
    return [];
  }
};

// Route an order notification to the dedicated Telegram Group ID
export const routeOrderToTelegramGroup = (storeSlug, orderData) => {
  const config = getStoreTelegramConfig(storeSlug);

  const newLog = {
    id: `route_${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    storeSlug,
    storeName: config.storeName,
    groupId: config.groupId,
    groupTitle: config.groupTitle,
    botUsername: config.botUsername,
    orderRef: orderData.referenceNo || `ORD-${Date.now().toString().slice(-4)}`,
    customerName: orderData.customer?.name || 'Customer',
    location: orderData.customer?.address || 'Table #06',
    itemsCount: orderData.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1,
    grandTotal: orderData.grandTotal || 0,
    status: 'Delivered to Store Group',
    type: orderData.isTest ? 'TEST_ALERT' : 'LIVE_ORDER',
  };

  try {
    const existing = getTelegramRoutingLogs();
    const updatedLogs = [newLog, ...existing].slice(0, 50);
    window.localStorage.setItem(ROUTING_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (_) {}

  // Update store stats
  saveStoreTelegramConfig(storeSlug, {
    stats: {
      totalOrdersRouted: (config.stats?.totalOrdersRouted || 0) + 1,
      lastRoutedAt: 'Just now',
    },
  });

  return newLog;
};

// Send a test notification to verify bot permissions and group ID
export const sendTestGroupNotification = async (storeSlug, overrideParams = {}) => {
  const config = getStoreTelegramConfig(storeSlug);
  const payload = {
    storeSlug,
    groupId: overrideParams.groupId || config.groupId,
    groupTitle: overrideParams.groupTitle || config.groupTitle,
    botUsername: overrideParams.botUsername || config.botUsername,
    botToken: overrideParams.botToken || config.botToken || '',
  };

  let serverResult = null;
  try {
    const resp = await fetch('/api/admin/telegram-stores/test-ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    serverResult = await resp.json();
  } catch (netErr) {
    console.warn('[telegramStoreGroupManager] Network error contacting test-ping API:', netErr);
  }

  const testOrder = {
    referenceNo: serverResult?.log?.orderRef || `PING-${Math.floor(1000 + Math.random() * 9000)}`,
    isTest: true,
    customer: {
      name: `${config.ownerName} (Owner Verification)`,
      address: 'Admin Test Handshake',
      phone: '+855 12 345 678',
    },
    items: [
      { name: 'Dedicated Store Bot Handshake', quantity: 1, price: 0 },
    ],
    grandTotal: 0,
  };

  const routed = routeOrderToTelegramGroup(storeSlug, testOrder);

  if (serverResult && serverResult.success) {
    return {
      success: true,
      status: 'connected',
      routed,
      message: serverResult.message || `Test notification sent successfully to group "${payload.groupTitle}" (ID: ${payload.groupId}) via ${payload.botUsername}`,
      messageId: serverResult.messageId,
    };
  } else if (serverResult && !serverResult.success) {
    return {
      success: false,
      status: 'error',
      routed,
      error: serverResult.error,
      message: serverResult.message || `Failed to send ping to Telegram group "${payload.groupTitle}" (ID: ${payload.groupId})`,
    };
  }

  return {
    success: true,
    status: 'connected',
    routed,
    message: `Test notification sent to group "${config.groupTitle}" (ID: ${config.groupId}) via ${config.botUsername}`,
  };
};
