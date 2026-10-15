import { useEffect, useState } from "react";

export function useTelegram() {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [startParam, setStartParam] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const webapp = (window as any).Telegram?.WebApp;
      if (webapp) {
        webapp.ready?.();
        webapp.expand?.();
        setTg(webapp);
        setUser(webapp.initDataUnsafe?.user || null);
      }

      // Check all possible places where Telegram or browser passes the start parameter:
      let foundParam: string | null = null;

      // 1. Direct Telegram WebApp initDataUnsafe.start_param
      if (webapp?.initDataUnsafe?.start_param) {
        foundParam = webapp.initDataUnsafe.start_param;
      }

      // 2. Telegram WebApp initData query string (start_param=...)
      if (!foundParam && webapp?.initData) {
        try {
          const initParams = new URLSearchParams(webapp.initData);
          foundParam = initParams.get("start_param") || initParams.get("tgWebAppStartParam");
        } catch (_) {}
      }

      // 3. window.location.hash (Telegram Web and Telegram Android/iOS WebApp pass in hash #tgWebAppData=...&tgWebAppStartParam=...)
      if (!foundParam && window.location.hash) {
        try {
          const hashString = window.location.hash.startsWith("#")
            ? window.location.hash.substring(1)
            : window.location.hash;
          const hashParams = new URLSearchParams(hashString);
          foundParam =
            hashParams.get("tgWebAppStartParam") ||
            hashParams.get("startapp") ||
            hashParams.get("start_param") ||
            hashParams.get("store") ||
            hashParams.get("store_slug");
        } catch (_) {}
      }

      // 4. window.location.search (?startapp=... or ?tgWebAppStartParam=...)
      if (!foundParam && window.location.search) {
        try {
          const searchParams = new URLSearchParams(window.location.search);
          foundParam =
            searchParams.get("tgWebAppStartParam") ||
            searchParams.get("startapp") ||
            searchParams.get("start_param") ||
            searchParams.get("store") ||
            searchParams.get("store_slug") ||
            searchParams.get("biller_id") ||
            searchParams.get("item");
        } catch (_) {}
      }

      if (foundParam) {
        setStartParam(foundParam);
      }
    }
  }, []);

  const triggerHaptic = (style: "light" | "medium" | "heavy" = "light") => {
    try {
      tg?.HapticFeedback?.impactOccurred?.(style);
    } catch {
      // Haptics not available outside Telegram mobile client
    }
  };

  return {
    tg,
    user,
    startParam,
    initData: tg?.initData,
    triggerHaptic,
    colorScheme: tg?.colorScheme || "dark",
    themeParams: tg?.themeParams || {},
  };
}

