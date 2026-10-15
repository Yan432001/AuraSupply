import React from 'react';
import TaobaoProductDetail from '../common/TaobaoProductDetail';

export default function ProductDetailModal({
  open,
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  triggerHaptic,
}) {
  if (!open || !product) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/70 backdrop-blur-xs transition-opacity animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-[430px] sm:max-w-xl h-full sm:h-auto sm:max-h-[92vh] bg-[var(--tg-theme-bg-color,#ffffff)] rounded-t-2xl sm:rounded-2xl overflow-y-auto shadow-2xl flex flex-col">
        <TaobaoProductDetail
          product={product}
          onClose={onClose}
          onAddToCart={onAddToCart}
          onBuyNow={onBuyNow}
          isModal={true}
          triggerHaptic={triggerHaptic}
        />
      </div>
    </div>
  );
}
