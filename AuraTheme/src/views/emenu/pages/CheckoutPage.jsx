import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';
import { useCart } from '../context/CartContext';
import { submitOrder, fetchStoreInfo } from '../services/emenuApi';
import OfflineWarningBanner from '../../../../components/common/OfflineWarningBanner';
import { useHeaderHeight } from '../../../../hooks/useHeaderHeight';

export default function CheckoutPage() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { webApp, initData, haptic } = useTelegram();
  const { cart, updateQuantity, clearCart, totalAmount } = useCart();
  const { headerRef } = useHeaderHeight();
  const [store, setStore] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStoreInfo(storeSlug).then((r) => r.status && setStore(r.data));
  }, [storeSlug]);

  // Hooking Telegram WebApp MainButton and BackButton
  useEffect(() => {
    if (!webApp) return;

    webApp.BackButton.show();
    webApp.BackButton.onClick(() => navigate(-1));

    if (cart.length > 0 && !submitting) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        webApp.MainButton.setText('OFFLINE - CONNECTION REQUIRED');
        webApp.MainButton.disable?.();
        webApp.MainButton.show();
      } else {
        webApp.MainButton.setText(`CHECKOUT (${store?.currency_symbol || '$'}${totalAmount.toFixed(2)})`);
        webApp.MainButton.enable?.();
        webApp.MainButton.show();
        webApp.MainButton.onClick(handleOrderSubmission);
      }
    } else {
      webApp.MainButton.hide();
    }

    return () => {
      webApp.BackButton.hide();
      webApp.MainButton.hide();
    };
  }, [webApp, cart, totalAmount, submitting, store]);

  const handleOrderSubmission = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert('You are currently offline. Please restore your internet connection to submit your order.');
      return;
    }
    if (submitting || cart.length === 0) return;
    setSubmitting(true);
    haptic.impact('heavy');

    const items = cart.map((c) => ({ id: c.id, quantity: c.quantity }));
    const res = await submitOrder(storeSlug, { items, note }, initData);

    if (res.status) {
      haptic.notification('success');
      clearCart();
      navigate(`/shop/${storeSlug}/success`, { state: { order: res.data }, replace: true });
    } else {
      haptic.notification('error');
      alert(res.message || 'Checkout failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-12">
      {/* Sticky Checkout Header */}
      <header
        ref={headerRef}
        className="header app-sticky-header sticky top-0 z-[1000] px-4 py-2.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'var(--tg-theme-bg-color, #ffffff)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
          paddingBottom: '8px',
          minHeight: 'var(--header-height, 52px)',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold cursor-pointer"
            aria-label="Back"
          >
            ←
          </button>
          <div>
            <h1 className="text-base font-bold leading-tight">Review Your Order</h1>
            <p className="text-[11px] text-zinc-500">{store?.name || storeSlug}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <OfflineWarningBanner variant="inline" style={{ borderRadius: 12 }} />
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {cart.map((item) => (
          <div key={item.id} className="py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{item.name}</p>
              <p className="text-xs text-zinc-500">
                {store?.currency_symbol || '$'}{Number(item.price).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { haptic.impact('light'); updateQuantity(item.id, item.quantity - 1); }}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold"
              >
                -
              </button>
              <span className="text-sm font-semibold">{item.quantity}</span>
              <button
                onClick={() => { haptic.impact('light'); updateQuantity(item.id, item.quantity + 1); }}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <textarea
        placeholder="Add special cooking instructions or notes..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs outline-none focus:ring-2 ring-[var(--theme-accent)]"
      />

      {/* Browser-only fallback trigger if not in Telegram runtime */}
      {!webApp && (
        <button
          onClick={handleOrderSubmission}
          disabled={submitting || (typeof navigator !== 'undefined' && !navigator.onLine)}
          className={`w-full min-h-[48px] font-bold rounded-xl shadow-lg transition-all ${
            typeof navigator !== 'undefined' && !navigator.onLine
              ? 'bg-slate-600 text-slate-300 cursor-not-allowed opacity-75'
              : 'bg-[var(--theme-accent)] text-white hover:opacity-95'
          }`}
        >
          {typeof navigator !== 'undefined' && !navigator.onLine
            ? 'Offline — Order Submissions Disabled'
            : submitting
            ? 'Submitting...'
            : `Place Order • $${totalAmount.toFixed(2)}`}
        </button>
      )}
    </div>
  );
}