import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import simpleData from '../../../data/simpleData';
import AuraLogo from '../components/common/AuraLogo';

const SELLER_SLUG_MAP = {
  'seller-1': 'sbc-store',
  'seller-2': 'aura-bakery',
  'seller-3': 'aura-lounge',
  'seller-4': 'aura-bistro',
  'seller-5': 'aura-tech',
  'seller-6': 'sbc-store',
};

const resolveStoreSlug = (raw) => {
  if (!raw) return 'sbc-store';
  if (SELLER_SLUG_MAP[raw]) return SELLER_SLUG_MAP[raw];
  const found = (simpleData.stores || []).find(
    (s) => s.slug === raw || String(s.id) === String(raw) || s.name?.toLowerCase() === raw?.toLowerCase()
  );
  return found?.slug || raw;
};

export default function TelegramEntry() {
  const { startParam } = useTelegram();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Robust param extraction: check startParam hook, then URL search & hash directly
    let param = startParam;
    if (!param && typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      const hashString = (window.location.hash || '').replace(/^#/, '');
      const hash = new URLSearchParams(hashString);

      param =
        search.get('startapp') ||
        search.get('tgWebAppStartParam') ||
        search.get('start_param') ||
        hash.get('tgWebAppStartParam') ||
        hash.get('startapp') ||
        hash.get('start_param') ||
        search.get('store') ||
        search.get('store_slug') ||
        search.get('biller_id') ||
        search.get('item');
    }

    if (!param) {
      navigate('/shop/sbc-store', { replace: true });
      return;
    }

    // 1. Direct item link: item_<id>
    if (param.startsWith('item_')) {
      const productId = param.replace('item_', '');
      const simpleProd = (simpleData.products || []).find((p) => String(p.id) === String(productId));
      if (simpleProd) {
        const store = (simpleData.stores || []).find((s) => s.id === simpleProd.biller_id);
        const slug = store ? store.slug : 'sbc-store';
        navigate(`/shop/${slug}?item=${productId}`, { replace: true });
        return;
      }
      navigate(`/shop/sbc-store?item=${productId}`, { replace: true });
      return;
    }

    // 2. Combined shop & item: shop_<shopId>_item_<productId>
    if (param.startsWith('shop_') && param.includes('_item_')) {
      const withoutPrefix = param.replace('shop_', '');
      const [shopSlug, productId] = withoutPrefix.split('_item_');
      const resolvedSlug = resolveStoreSlug(shopSlug);
      navigate(`/shop/${resolvedSlug}?item=${productId}`, { replace: true });
      return;
    }

    // 3. Shop deep link: shop_<shopId>
    if (param.startsWith('shop_')) {
      const shopSlug = param.replace('shop_', '');
      const resolvedSlug = resolveStoreSlug(shopSlug);
      navigate(`/shop/${resolvedSlug}`, { replace: true });
      return;
    }

    // 4. Biller deep links: biller_<id>
    if (param.startsWith('biller_')) {
      const billerId = param.replace('biller_', '');
      const store = (simpleData.stores || []).find((s) => String(s.id) === String(billerId));
      navigate(`/shop/${store?.slug || 'sbc-store'}`, { replace: true });
      return;
    }

    // 5. Store slug prefix: store_<slug>
    if (param.startsWith('store_')) {
      const storeSlug = param.replace('store_', '');
      const resolvedSlug = resolveStoreSlug(storeSlug);
      navigate(`/shop/${resolvedSlug}`, { replace: true });
      return;
    }

    // 6. Direct slug or fallback
    const resolvedSlug = resolveStoreSlug(param);
    navigate(`/shop/${resolvedSlug}`, { replace: true });
  }, [startParam, navigate, location.pathname, location.search]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] flex-1">
      <div className="w-14 h-14 rounded-2xl bg-white p-2.5 flex items-center justify-center shadow-lg shadow-blue-500/15 mb-3 animate-pulse border border-blue-100">
        <AuraLogo size={36} showText={false} />
      </div>
      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500 mb-3" />
      <p className="text-xs font-bold text-slate-700 tracking-wide">
        Connecting to Aura Supply...
      </p>
    </div>
  );
}
