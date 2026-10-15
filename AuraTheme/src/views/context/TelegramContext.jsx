import React, { createContext, useContext, useEffect, useState } from 'react';

const TelegramContext = createContext({
  webApp: null,
  user: null,
  initData: '',
  colorScheme: 'light',
  haptic: {
    impact: () => {},
    notification: () => {}
  }
});

export const TelegramProvider = ({ children }) => {
  const [tg, setTg] = useState(null);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    if (app) {
      try { app.ready?.(); } catch (_) {}
      try { app.expand?.(); } catch (_) {}
      setTg(app);
    }
  }, []);

  const value = {
    webApp: tg,
    user: tg?.initDataUnsafe?.user || null,
    initData: tg?.initData || '',
    startParam: tg?.initDataUnsafe?.start_param || '',
    colorScheme: tg?.colorScheme || 'light',
    haptic: {
      impact: (style = 'medium') => tg?.HapticFeedback?.impactOccurred(style),
      notification: (type = 'success') => tg?.HapticFeedback?.notificationOccurred(type)
    }
  };

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
};

export const useTelegram = () => useContext(TelegramContext);