import { useState, useEffect, useMemo, useCallback } from 'react';

export function useStoreCart(storeSlug, storeName = '') {
  // Global cart storage key persists the active store and items
  const STORAGE_KEY = 'aura_tma_active_cart';

  const [cartState, setCartState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          storeSlug: parsed.storeSlug || storeSlug,
          storeName: parsed.storeName || storeName,
          items: Array.isArray(parsed.items) ? parsed.items : [],
          orderType: parsed.orderType || 'dine_in'
        };
      }
    } catch (_) {}
    return {
      storeSlug: storeSlug || 'sbc-store',
      storeName: storeName || 'Aura Store',
      items: [],
      orderType: 'dine_in'
    };
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartState));
    } catch (_) {}
  }, [cartState]);

  // Check if cart has items from a different store
  const isDifferentStore = useMemo(() => {
    return (
      storeSlug &&
      cartState.storeSlug &&
      cartState.storeSlug.toLowerCase() !== storeSlug.toLowerCase() &&
      cartState.items.length > 0
    );
  }, [storeSlug, cartState.storeSlug, cartState.items.length]);

  const currentCartStoreSlug = cartState.storeSlug;
  const currentCartStoreName = cartState.storeName;

  /**
   * Add a product with selected options/variants and quantity
   */
  const addItem = useCallback(
    (product, selectedOptions = {}, quantity = 1, optionsPriceDelta = 0) => {
      const qty = Math.max(1, parseInt(quantity, 10) || 1);
      const unitPrice = Number((Number(product.price || 0) + Number(optionsPriceDelta || 0)).toFixed(2));
      const optionsKey = Object.entries(selectedOptions || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('|');
      const itemKey = `${product.id}_${optionsKey || 'default'}`;

      const optionsText = Object.entries(selectedOptions || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

      setCartState((prev) => {
        // If adding to a new store, reset items to prevent mixing stores
        const isNewStore = prev.storeSlug !== storeSlug;
        const currentItems = isNewStore ? [] : prev.items;

        const existingIndex = currentItems.findIndex((it) => it.itemKey === itemKey);
        let updatedItems;

        if (existingIndex >= 0) {
          updatedItems = currentItems.map((it, idx) =>
            idx === existingIndex
              ? {
                  ...it,
                  quantity: it.quantity + qty,
                  subtotal: Number(((it.quantity + qty) * it.price).toFixed(2))
                }
              : it
          );
        } else {
          updatedItems = [
            ...currentItems,
            {
              itemKey,
              id: product.id,
              code: product.code,
              name: product.name,
              image: product.image,
              price: unitPrice,
              basePrice: Number(product.price),
              quantity: qty,
              subtotal: Number((unitPrice * qty).toFixed(2)),
              selectedOptions,
              optionsText
            }
          ];
        }

        return {
          storeSlug: storeSlug || prev.storeSlug,
          storeName: storeName || prev.storeName,
          items: updatedItems,
          orderType: prev.orderType || 'dine_in'
        };
      });
    },
    [storeSlug, storeName]
  );

  /**
   * Adjust item quantity (+1, -1)
   */
  const updateQuantity = useCallback((itemKey, delta) => {
    setCartState((prev) => {
      const updated = prev.items
        .map((it) => {
          if (it.itemKey === itemKey) {
            const nextQty = it.quantity + delta;
            return nextQty > 0
              ? {
                  ...it,
                  quantity: nextQty,
                  subtotal: Number((nextQty * it.price).toFixed(2))
                }
              : null;
          }
          return it;
        })
        .filter(Boolean);

      return {
        ...prev,
        items: updated
      };
    });
  }, []);

  /**
   * Remove item completely
   */
  const removeItem = useCallback((itemKey) => {
    setCartState((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.itemKey !== itemKey)
    }));
  }, []);

  /**
   * Clear the entire cart
   */
  const clearCart = useCallback(() => {
    setCartState((prev) => ({
      ...prev,
      items: []
    }));
  }, []);

  /**
   * Recreate / restore cart completely from a previous order
   */
  const restoreCartFromOrder = useCallback(
    (orderItems = [], targetOrderType = 'dine_in', targetSlug = storeSlug, targetName = storeName) => {
      const formattedItems = orderItems.map((it, idx) => {
        const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
        const unitPrice = Number(it.price || 0);
        const selectedOptions = it.selectedOptions || {};
        const optionsKey = Object.entries(selectedOptions)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${v}`)
          .join('|');
        const itemKey = `${it.productId || it.id || idx}_${optionsKey || 'default'}`;
        const optionsText = Object.entries(selectedOptions)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');

        return {
          itemKey,
          id: it.productId || it.id || idx,
          code: it.code || `PRD-${idx}`,
          name: it.name,
          image: it.image || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&h=500&fit=crop',
          price: unitPrice,
          basePrice: unitPrice,
          quantity: qty,
          subtotal: Number((unitPrice * qty).toFixed(2)),
          selectedOptions,
          optionsText
        };
      });

      setCartState({
        storeSlug: targetSlug || storeSlug,
        storeName: targetName || storeName,
        items: formattedItems,
        orderType: targetOrderType || 'dine_in'
      });
    },
    [storeSlug, storeName]
  );

  /**
   * Switch to a new store and clear the cart
   */
  const clearAndSwitchStore = useCallback((newStoreSlug, newStoreName) => {
    setCartState({
      storeSlug: newStoreSlug,
      storeName: newStoreName || newStoreSlug,
      items: [],
      orderType: 'dine_in'
    });
  }, []);

  /**
   * Set fulfillment order type ('dine_in' | 'takeaway' | 'delivery')
   */
  const setOrderType = useCallback((type) => {
    setCartState((prev) => ({
      ...prev,
      orderType: type
    }));
  }, []);

  // Recalculate totals
  const items = cartState.items;
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const subtotal = useMemo(
    () => Number(items.reduce((sum, item) => sum + Number(item.subtotal || item.price * item.quantity), 0).toFixed(2)),
    [items]
  );

  const deliveryFee = cartState.orderType === 'delivery' ? 2.00 : 0.00;
  const discount = 0.00;
  const total = Number((subtotal + deliveryFee - discount).toFixed(2));

  return {
    cart: items,
    items,
    itemCount,
    subtotal,
    deliveryFee,
    discount,
    total,
    orderType: cartState.orderType,
    setOrderType,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    clearAndSwitchStore,
    restoreCartFromOrder,
    isDifferentStore,
    currentCartStoreSlug,
    currentCartStoreName
  };
}
