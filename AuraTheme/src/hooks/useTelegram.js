import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export function useTelegram() {
  const [tgInstance, setTgInstance] = useState(() => window.Telegram?.WebApp || null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!tgInstance && window.Telegram?.WebApp) {
      setTgInstance(window.Telegram.WebApp);
    }
    const interval = setInterval(() => {
      if (window.Telegram?.WebApp) {
        setTgInstance(window.Telegram.WebApp);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [tgInstance]);

  const tg = tgInstance || window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      const isInTelegram = Boolean(
        tg.initData ||
        window.TelegramWebviewProxy !== undefined ||
        (window.external && 'notify' in window.external) ||
        (typeof window !== 'undefined' && window.self !== window.top)
      );

      if (isInTelegram) {
        try {
          tg.ready?.();
        } catch (_) {}
        try {
          tg.expand?.();
        } catch (_) {}
        try {
          if (typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('6.2')) {
            tg.enableClosingConfirmation?.();
          }
        } catch (_) {}
      }

      // Only apply Telegram colorScheme attribute when inside Telegram Mini App routes
      const isEmenuPath = typeof window !== 'undefined' && (
        window.location.pathname.startsWith('/shop') ||
        window.location.pathname.startsWith('/tg') ||
        window.location.pathname.startsWith('/menu')
      );

      if (isEmenuPath && tg.colorScheme) {
        document.documentElement.setAttribute('data-theme', tg.colorScheme);
        if (tg.colorScheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  }, [tg]);

  const rawUser = tg?.initDataUnsafe?.user;

  // Auto-sync or retrieve Telegram user profile
  useEffect(() => {
    const userToSync = rawUser || {
      id: 999123,
      first_name: 'Telegram User',
      last_name: '',
      username: 'telegram_guest',
      phone_number: '+855 12 345 678'
    };

    setProfile(userToSync);

    // Call server to store / update Telegram user profile automatically
    axios
      .post('/api/tma/auth', {
        id: userToSync.id,
        first_name: userToSync.first_name,
        last_name: userToSync.last_name,
        username: userToSync.username,
        phone_number: userToSync.phone_number
      })
      .then((res) => {
        if (res.data?.status && res.data.user) {
          setProfile(res.data.user);
        }
      })
      .catch((err) => console.warn('Telegram profile auto-sync notice:', err.message));
  }, [rawUser]);

  const startParam = useMemo(() => {
    if (tg?.initDataUnsafe?.start_param) {
      return String(tg.initDataUnsafe.start_param).trim();
    }
    const params = new URLSearchParams(window.location.search);
    const fromSearch =
      params.get('tgWebAppStartParam') ||
      params.get('startapp') ||
      params.get('start_param') ||
      params.get('start') ||
      params.get('shop') ||
      params.get('store') ||
      params.get('biller_id');
    if (fromSearch) return String(fromSearch).trim();

    // Check hash for telegram parameters (e.g. #tgWebAppData=...&tgWebAppStartParam=...)
    if (window.location.hash) {
      try {
        const hashStr = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hashStr);
        const fromHash =
          hashParams.get('tgWebAppStartParam') ||
          hashParams.get('startapp') ||
          hashParams.get('start_param') ||
          hashParams.get('start');
        if (fromHash) return String(fromHash).trim();
      } catch (_) {}
    }
    return null;
  }, [tg, tg?.initDataUnsafe?.start_param]);

  const triggerHaptic = (style = 'light') => {
    try {
      if (tg?.HapticFeedback) {
        if (style === 'light' || style === 'medium' || style === 'heavy') {
          tg.HapticFeedback.impactOccurred(style);
        } else if (style === 'success' || style === 'warning' || style === 'error') {
          tg.HapticFeedback.notificationOccurred(style);
        }
      }
    } catch (_) {}
  };

  return {
    tg,
    user: profile || rawUser,
    initData: tg?.initData,
    startParam,
    colorScheme: tg?.colorScheme || 'light',
    themeParams: tg?.themeParams || {},
    MainButton: tg?.MainButton,
    BackButton: tg?.BackButton,
    triggerHaptic
  };
}
