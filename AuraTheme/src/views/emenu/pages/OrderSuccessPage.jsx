import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { exportSingleOrderPdf } from '../../../../utils/orderPdfExporter';
import { fetchStoreInfo } from '../services/emenuApi';
import { useHeaderHeight } from '../../../../hooks/useHeaderHeight';

export default function OrderSuccessPage() {
  const { state } = useLocation();
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { headerRef } = useHeaderHeight();
  const order = state?.order;
  const [store, setStore] = useState(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (storeSlug) {
      fetchStoreInfo(storeSlug)
        .then((res) => {
          if (res.status && res.data) {
            setStore(res.data);
          }
        })
        .catch(() => {});
    }
  }, [storeSlug]);

  const handleDownloadPdf = () => {
    if (!order) return;
    exportSingleOrderPdf(order, { storeName: store?.name || storeSlug });
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const storeName = store?.name || order?.store_name || storeSlug;
  const storePhone = store?.phone || '+855 23 888 999';
  const storeAddress = store?.address || 'Preah Norodom Blvd, Daun Penh, Phnom Penh';
  const openingHours = store?.opening_hours || '07:00 AM - 10:00 PM (Daily)';
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(storeAddress || storeName)}`;

  return (
    <div className="flex flex-col flex-1 max-w-xl mx-auto w-full pb-12 text-slate-800 dark:text-slate-100">
      {/* Sticky Success Page Header */}
      <header
        ref={headerRef}
        className="header app-sticky-header sticky top-0 z-[1000] px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800"
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">🧾 Order Confirmation</span>
          <span className="font-mono text-xs text-sky-600 dark:text-sky-400 font-semibold">
            {order?.referenceNo || ''}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/shop/${storeSlug}`)}
          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
        >
          Store Menu
        </button>
      </header>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Success Badge */}
        <div className="flex flex-col items-center justify-center text-center pt-2 space-y-2">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center text-3xl font-bold shadow-sm">
          ✓
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:white">
          Order Placed Successfully!
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          Your order{' '}
          <strong className="text-sky-600 dark:text-sky-400 font-mono text-sm">
            {order?.referenceNo || 'ORD-000123'}
          </strong>{' '}
          has been saved and sent to <span className="font-semibold">{storeName}</span> staff.
        </p>
      </div>

      {/* Order Status & Estimated Time */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400">Status</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {order?.status || 'Pending'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] uppercase font-bold text-slate-400">Estimated Time</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">⏱️ ~15 – 25 mins</p>
          </div>
        </div>

        {/* Ordered Items Summary */}
        {order?.items && order.items.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] uppercase font-bold text-slate-400">Items Ordered</span>
            <div className="space-y-1">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs py-0.5">
                  <span className="text-slate-700 dark:text-slate-300">
                    <b>{it.quantity || it.qty || 1}x</b> {it.name || it.product_name}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    ${Number(it.subtotal || (it.price * (it.quantity || 1))).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
              <span>Total Amount:</span>
              <span className="font-mono text-sky-600 dark:text-sky-400">
                ${Number(order.grandTotal || order.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Store Details & Contact */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>🏬</span>
          <span>{storeName} Contact &amp; Location</span>
        </h4>
        <div className="space-y-1 text-slate-600 dark:text-slate-300">
          <div>
            <b>📞 Phone:</b> <a href={`tel:${storePhone}`} className="text-sky-600 dark:text-sky-400 hover:underline">{storePhone}</a>
          </div>
          <div>
            <b>📍 Address:</b> {storeAddress}
          </div>
          <div>
            <b>🕒 Hours:</b> {openingHours}
          </div>
          <div className="pt-1">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              <span>🗺️ View on Google Maps</span>
              <span>&rarr;</span>
            </a>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 min-h-[44px] bg-red-600/90 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all border border-red-500 shadow-md active:scale-95 cursor-pointer"
        >
          <span>📄</span>
          <span>{downloaded ? 'Downloaded PDF!' : 'Download PDF Summary'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(`/shop/${storeSlug}`)}
          className="w-full sm:w-auto px-6 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 active:scale-95 transition-all text-center cursor-pointer"
        >
          Back to Store Menu
        </button>
      </div>
    </div>
  );
}
