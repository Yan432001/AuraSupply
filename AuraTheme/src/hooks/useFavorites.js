import { useState, useEffect, useCallback, useMemo } from 'react';
import { message } from 'antd';

const FAVORITES_STORAGE_KEY = 'aura_menu_favorites';

/**
 * useFavorites
 * Persistent hook managing bookmarked favorites stored in localStorage.
 * Synchronizes across components and provides toggle, count, and filtering capabilities.
 */
export function useFavorites() {
  const [favoritesMap, setFavoritesMap] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      // Migrate legacy key if exists
      const legacySaved = localStorage.getItem('aura_web_menu_favs');
      if (legacySaved) {
        return JSON.parse(legacySaved);
      }
    } catch (_) {}
    return {};
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesMap));
    } catch (_) {}
  }, [favoritesMap]);

  // Check if an item is favorited
  const isFavorite = useCallback(
    (itemId) => {
      if (!itemId) return false;
      return Boolean(favoritesMap[String(itemId)]);
    },
    [favoritesMap]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    (itemId, itemName = '', event) => {
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }

      if (!itemId) return;
      const key = String(itemId);

      setFavoritesMap((prev) => {
        const next = { ...prev };
        const willBeFavorited = !next[key];

        if (willBeFavorited) {
          next[key] = true;
          message.success(
            itemName ? `Added "${itemName}" to Favorites! ❤️` : 'Added to Favorites! ❤️'
          );
        } else {
          delete next[key];
          message.info(
            itemName ? `Removed "${itemName}" from Favorites` : 'Removed from Favorites'
          );
        }
        return next;
      });
    },
    []
  );

  // Total count of favorited items
  const favoritesCount = useMemo(() => {
    return Object.keys(favoritesMap).length;
  }, [favoritesMap]);

  return {
    favoritesMap,
    isFavorite,
    toggleFavorite,
    favoritesCount,
    setFavoritesMap,
  };
}

export default useFavorites;
