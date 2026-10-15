/**
 * Telegram WebApp Compatibility Patch & Polyfill
 * Prevents version compatibility crashes when running on Telegram client version 6.0
 * (e.g., "Method showPopup is not supported in version 6.0", "Method enableClosingConfirmation is not supported in version 6.0")
 */

export function patchTelegramWebApp(webApp) {
  if (!webApp || webApp.__isPatchedForV60) return;
  webApp.__isPatchedForV60 = true;

  const isSupported = (minVersion) => {
    try {
      if (typeof webApp.isVersionAtLeast === 'function') {
        return Boolean(webApp.isVersionAtLeast(minVersion));
      }
      const currentVer = parseFloat(webApp.version || '6.0');
      const targetVer = parseFloat(minVersion);
      return currentVer >= targetVer;
    } catch (_) {
      return false;
    }
  };

  // 1. Safe showPopup (introduced in v6.2)
  const origShowPopup = webApp.showPopup;
  webApp.showPopup = function (params, callback) {
    if (isSupported('6.2') && typeof origShowPopup === 'function') {
      try {
        return origShowPopup.call(webApp, params, callback);
      } catch (err) {
        console.warn('[Telegram.WebApp] Safe fallback for showPopup:', err.message);
      }
    }
    // Safe fallback for v6.0: do NOT throw error
    if (typeof callback === 'function') {
      const defaultButtonId =
        (params?.buttons && params.buttons[0]?.id) ||
        (params?.buttons && params.buttons[0]?.type) ||
        'ok';
      setTimeout(() => {
        try {
          callback(defaultButtonId);
        } catch (_) {}
      }, 50);
    }
  };

  // 2. Safe showAlert (introduced in v6.2)
  const origShowAlert = webApp.showAlert;
  webApp.showAlert = function (message, callback) {
    if (isSupported('6.2') && typeof origShowAlert === 'function') {
      try {
        return origShowAlert.call(webApp, message, callback);
      } catch (err) {
        console.warn('[Telegram.WebApp] Safe fallback for showAlert:', err.message);
      }
    }
    if (typeof callback === 'function') {
      setTimeout(() => {
        try {
          callback();
        } catch (_) {}
      }, 50);
    }
  };

  // 3. Safe showConfirm (introduced in v6.2)
  const origShowConfirm = webApp.showConfirm;
  webApp.showConfirm = function (message, callback) {
    if (isSupported('6.2') && typeof origShowConfirm === 'function') {
      try {
        return origShowConfirm.call(webApp, message, callback);
      } catch (err) {
        console.warn('[Telegram.WebApp] Safe fallback for showConfirm:', err.message);
      }
    }
    if (typeof callback === 'function') {
      setTimeout(() => {
        try {
          callback(true);
        } catch (_) {}
      }, 50);
    }
  };

  // 4. Safe enableClosingConfirmation (introduced in v6.2)
  const origEnableClosingConfirmation = webApp.enableClosingConfirmation;
  webApp.enableClosingConfirmation = function () {
    if (isSupported('6.2') && typeof origEnableClosingConfirmation === 'function') {
      try {
        return origEnableClosingConfirmation.call(webApp);
      } catch (_) {}
    }
  };

  // 5. Safe disableClosingConfirmation (introduced in v6.2)
  const origDisableClosingConfirmation = webApp.disableClosingConfirmation;
  webApp.disableClosingConfirmation = function () {
    if (isSupported('6.2') && typeof origDisableClosingConfirmation === 'function') {
      try {
        return origDisableClosingConfirmation.call(webApp);
      } catch (_) {}
    }
  };

  // 6. Safe requestWriteAccess (introduced in v6.9)
  const origRequestWriteAccess = webApp.requestWriteAccess;
  webApp.requestWriteAccess = function (callback) {
    if (isSupported('6.9') && typeof origRequestWriteAccess === 'function') {
      try {
        return origRequestWriteAccess.call(webApp, callback);
      } catch (_) {}
    }
    if (typeof callback === 'function') {
      setTimeout(() => {
        try {
          callback(true);
        } catch (_) {}
      }, 50);
    }
  };

  // 7. Safe requestContact (introduced in v6.9)
  const origRequestContact = webApp.requestContact;
  webApp.requestContact = function (callback) {
    if (isSupported('6.9') && typeof origRequestContact === 'function') {
      try {
        return origRequestContact.call(webApp, callback);
      } catch (_) {}
    }
    if (typeof callback === 'function') {
      setTimeout(() => {
        try {
          callback(false);
        } catch (_) {}
      }, 50);
    }
  };
}

export function patchTelegramWebView(webView) {
  if (!webView || webView.__isPatched) return;
  webView.__isPatched = true;

  const origPostEvent = webView.postEvent;
  webView.postEvent = function (eventType, callback, eventData) {
    if (typeof callback !== 'function') {
      callback = function () {};
    }

    const hasProxy = typeof window.TelegramWebviewProxy !== 'undefined';
    const hasExternal = Boolean(window.external && 'notify' in window.external);
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (hasProxy || hasExternal || isIframe) {
      if (typeof origPostEvent === 'function') {
        try {
          return origPostEvent.call(webView, eventType, callback, eventData);
        } catch (_) {}
      }
    }

    // Running in standard browser (outside Telegram webview):
    // Silently execute callback without spamming [Telegram.WebView] > postEvent console logs
    try {
      callback();
    } catch (_) {}
  };
}

// Auto-patch when loaded
if (typeof window !== 'undefined') {
  const applyAllPatches = () => {
    if (window.Telegram?.WebApp) {
      patchTelegramWebApp(window.Telegram.WebApp);
    }
    if (window.Telegram?.WebView) {
      patchTelegramWebView(window.Telegram.WebView);
    }
  };

  applyAllPatches();

  // Periodic poll to ensure patch attaches as soon as Telegram script finishes loading
  const patchTimer = setInterval(() => {
    if (window.Telegram?.WebApp || window.Telegram?.WebView) {
      applyAllPatches();
      clearInterval(patchTimer);
    }
  }, 30);
  setTimeout(() => clearInterval(patchTimer), 5000);
}

