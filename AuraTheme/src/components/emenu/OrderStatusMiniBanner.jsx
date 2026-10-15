import React, { useState, useEffect } from 'react';
import {
  BellFilled,
  BellOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { notification, message } from 'antd';

export const ORDER_STORAGE_KEY = 'aura_emenu_active_order';
export const ORDER_DISMISSED_KEY = 'aura_emenu_order_dismissed';

export const createDefaultMockOrder = (storeName = 'Aura Specialty Coffee') => ({
  referenceNo: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
  storeName: storeName || 'Aura Specialty Coffee',
  status: 'Preparing',
  placedAt: Date.now(),
  itemsCount: 2,
  grandTotal: 9.50,
});

// Crisp audio chime via Web Audio API (cross-browser, zero external asset dependency)
const playReadyChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // First high note (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second celebratory note (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.15, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.65);
  } catch (_) {}
};

/**
 * OrderStatusMiniBanner
 * Persistent mini-banner at the top of the menu screen showing current order status
 * (e.g., 'Preparing', 'Ready for Pickup') with real-time mock updates.
 */
export default function OrderStatusMiniBanner({
  order: propOrder,
  onOrderUpdate,
  storeName,
  triggerHaptic,
  className = '',
}) {
  const [order, setOrder] = useState(() => {
    if (propOrder) return propOrder;
    try {
      const isDismissed = sessionStorage.getItem(ORDER_DISMISSED_KEY);
      if (isDismissed) return null;
      const saved = localStorage.getItem(ORDER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);

      // Seed an active order in 'Preparing' state so the banner is persistently visible
      const initial = createDefaultMockOrder(storeName);
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    } catch {
      return null;
    }
  });

  const [notifyMe, setNotifyMe] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Synchronize when prop changes
  useEffect(() => {
    if (propOrder) {
      setOrder(propOrder);
    }
  }, [propOrder]);

  // Listen to external custom events
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem(ORDER_STORAGE_KEY);
        setOrder(saved ? JSON.parse(saved) : null);
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('aura_order_updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('aura_order_updated', handleStorage);
    };
  }, []);

  // Real-time mock progression: automatically transition 'Preparing' -> 'Ready for Pickup'
  useEffect(() => {
    if (!order || order.status === 'Ready' || order.status === 'Ready for Pickup' || order.status === 'Completed') {
      return;
    }

    const timer = setTimeout(() => {
      const updated = {
        ...order,
        status: 'Ready for Pickup',
        readyAt: Date.now(),
      };
      setOrder(updated);
      try {
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('aura_order_updated'));
      } catch {}

      onOrderUpdate?.(updated);
      triggerHaptic?.('success');
      playReadyChime();

      if (notifyMe) {
        notification.success({
          message: 'Order Ready for Pickup! 🔔',
          description: `Your order #${order.referenceNo || 'ORD-9821'} is prepared and hot at ${order.storeName || storeName || 'the counter'}! Please collect your items.`,
          placement: 'top',
          duration: 8,
        });
      }
    }, 10000); // 10s mock progression

    return () => clearTimeout(timer);
  }, [order, notifyMe, storeName, triggerHaptic, onOrderUpdate]);

  const handleSimulateReady = () => {
    triggerHaptic?.('success');
    playReadyChime();
    const updated = {
      ...(order || createDefaultMockOrder(storeName)),
      status: 'Ready for Pickup',
      readyAt: Date.now(),
    };
    setOrder(updated);
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(updated));
      sessionStorage.removeItem(ORDER_DISMISSED_KEY);
      window.dispatchEvent(new Event('aura_order_updated'));
    } catch {}
    onOrderUpdate?.(updated);
    message.success('Real-time Mock Update: Order is now Ready for Pickup! 🎉');
  };

  const handleResetMockOrder = () => {
    triggerHaptic?.('medium');
    const resetOrder = createDefaultMockOrder(storeName);
    setOrder(resetOrder);
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(resetOrder));
      sessionStorage.removeItem(ORDER_DISMISSED_KEY);
      window.dispatchEvent(new Event('aura_order_updated'));
    } catch {}
    onOrderUpdate?.(resetOrder);
    message.info('Restarted live mock progression: Order # ' + resetOrder.referenceNo + ' (Preparing)');
  };

  const handleDismiss = () => {
    triggerHaptic?.('light');
    try {
      localStorage.removeItem(ORDER_STORAGE_KEY);
      sessionStorage.setItem(ORDER_DISMISSED_KEY, 'true');
      window.dispatchEvent(new Event('aura_order_updated'));
    } catch {}
    setOrder(null);
    onOrderUpdate?.(null);
  };

  if (!order) {
    return (
      <div className={`w-full px-3 py-1 flex items-center justify-end bg-slate-900/90 text-white text-[11px] ${className}`}>
        <button
          type="button"
          onClick={handleResetMockOrder}
          className="text-blue-300 hover:text-white underline cursor-pointer text-[10.5px] font-bold"
        >
          ⚡ Simulate Active Order
        </button>
      </div>
    );
  }

  const isReady = order.status === 'Ready' || order.status === 'Ready for Pickup';
  const statusText = isReady ? 'Ready for Pickup' : (order.status || 'Preparing');

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full z-40 transition-all duration-300 ${className}`}
    >
      <div
        className={`px-3 sm:px-4 py-2 sm:py-2.5 transition-colors duration-300 shadow-md border-b ${
          isReady
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-emerald-500 text-white'
            : 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-blue-900/60 text-white'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2.5">
          {/* Left: Icon + Status Text + Ref # */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none"
            title="Click to view order details & progress"
          >
            {/* Pulsing Status Dot / Animated Icon */}
            <div className="relative flex items-center justify-center shrink-0">
              <span
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm shadow-inner ${
                  isReady
                    ? 'bg-white text-emerald-600 animate-bounce'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                }`}
              >
                {isReady ? '🎉' : '⏳'}
              </span>
              {!isReady && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              )}
            </div>

            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                  {statusText}
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                    isReady
                      ? 'bg-emerald-950/40 text-emerald-100 border border-emerald-400/30'
                      : 'bg-blue-900/70 text-blue-200 border border-blue-400/30'
                  }`}
                >
                  #{order.referenceNo || 'ORD-9821'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/80 m-0 truncate">
                {isReady
                  ? '🔔 Prepared and ready! Please collect at counter.'
                  : 'Kitchen preparing your items · ~5-8 mins remaining'}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Quick Simulate Button (if still preparing) */}
            {!isReady && (
              <button
                type="button"
                onClick={handleSimulateReady}
                className="hidden xs:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white text-[11px] font-bold border border-white/20 transition active:scale-95 cursor-pointer min-h-[36px]"
                title="Mock instant status update for testing"
              >
                <ThunderboltFilled className="text-amber-400 text-[11px]" />
                <span>Ready</span>
              </button>
            )}

            {/* Notification Toggle (min 40px hit area) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('light');
                setNotifyMe(!notifyMe);
                message.info(
                  !notifyMe
                    ? '🔔 Notifications active for this order'
                    : 'Order alerts silenced'
                );
              }}
              className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition active:scale-90 cursor-pointer ${
                notifyMe
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
              title={notifyMe ? 'Notifications Enabled' : 'Notifications Muted'}
              aria-label="Toggle notifications"
            >
              {notifyMe ? (
                <BellFilled className="text-sm text-amber-300" />
              ) : (
                <BellOutlined className="text-sm text-white/60" />
              )}
            </button>

            {/* Dismiss when done (min 40px hit area) */}
            {isReady && (
              <button
                type="button"
                onClick={handleDismiss}
                className="px-3 py-1.5 min-h-[40px] rounded-xl bg-white/20 hover:bg-white/30 text-white text-[12px] font-bold transition active:scale-95 cursor-pointer flex items-center justify-center"
                title="Dismiss order banner"
              >
                Done ✓
              </button>
            )}
          </div>
        </div>

        {/* Expanded Progress Stepper */}
        {isExpanded && (
          <div className="max-w-4xl mx-auto pt-2.5 pb-1 border-t border-white/15 mt-2 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs">
              <div className="flex flex-col items-center gap-1">
                <CheckCircleFilled className="text-emerald-400 text-sm" />
                <span className="font-bold text-white">1. Order Placed</span>
                <span className="text-[10px] text-white/60">Sent to Kitchen</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                {isReady ? (
                  <CheckCircleFilled className="text-emerald-400 text-sm" />
                ) : (
                  <ClockCircleFilled className="text-amber-400 text-sm animate-spin" />
                )}
                <span className={`font-bold ${isReady ? 'text-white' : 'text-amber-300'}`}>
                  2. Preparing
                </span>
                <span className="text-[10px] text-white/60">Chefs working</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                {isReady ? (
                  <CheckCircleFilled className="text-emerald-300 text-sm animate-pulse" />
                ) : (
                  <ClockCircleFilled className="text-white/30 text-sm" />
                )}
                <span className={`font-bold ${isReady ? 'text-emerald-200' : 'text-white/50'}`}>
                  3. Ready for Pickup
                </span>
                <span className="text-[10px] text-white/60">Counter pickup</span>
              </div>
            </div>

            {/* Store & items summary + mock controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/80 pt-1.5 border-t border-white/10 mt-1">
              <div className="flex items-center gap-3">
                {order.storeName && <span>Store: <strong className="text-white">{order.storeName}</strong></span>}
                {order.itemsCount && <span>Items: <strong className="text-white">{order.itemsCount}</strong></span>}
                {order.grandTotal && <span>Total: <strong className="text-white">${Number(order.grandTotal).toFixed(2)}</strong></span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetMockOrder}
                  className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white text-[10.5px] font-semibold transition active:scale-95 cursor-pointer"
                  title="Restart live progression from Preparing"
                >
                  ↺ Restart Mock
                </button>
                {!isReady && (
                  <button
                    type="button"
                    onClick={handleSimulateReady}
                    className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 text-[10.5px] font-bold transition active:scale-95 cursor-pointer"
                  >
                    ⚡ Fast Forward to Ready
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
