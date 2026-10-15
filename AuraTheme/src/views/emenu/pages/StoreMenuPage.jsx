import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';
import { useCart } from '../context/CartContext';
import { fetchStoreInfo, fetchCategories, fetchProducts, resolveBillerStore } from '../services/emenuApi';
import EMenuHeader from '../../../../components/emenu/EMenuHeader';

export default function StoreMenuPage() {
  const { storeSlug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { startParam, haptic } = useTelegram();
  const { addToCart, totalCount, totalAmount } = useCart();

  const [activeSlug, setActiveSlug] = useState(routeSlug);
  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Precedence Rule Resolution: start_param > URL query > URL path
  useEffect(() => {
    async function resolveRoute() {
      let resolvedStore = null;
      let resolvedBiller = null;

      if (startParam) {
        if (startParam.startsWith('store_')) resolvedStore = startParam.replace('store_', '');
        if (startParam.startsWith('biller_')) resolvedBiller = startParam.replace('biller_', '');
      }

      if (!resolvedStore && searchParams.get('store')) resolvedStore = searchParams.get('store');
      if (!resolvedBiller && searchParams.get('biller_id')) resolvedBiller = searchParams.get('biller_id');

      if (resolvedStore) {
        if (resolvedStore !== routeSlug) navigate(`/shop/${resolvedStore}`, { replace: true });
        setActiveSlug(resolvedStore);
        return;
      }

      if (resolvedBiller) {
        const res = await resolveBillerStore(resolvedBiller);
        if (res.status && res.slug) {
          navigate(`/shop/${res.slug}`, { replace: true });
          setActiveSlug(res.slug);
          return;
        }
      }

      if (routeSlug) setActiveSlug(routeSlug);
    }
    resolveRoute();
  }, [startParam, searchParams, routeSlug, navigate]);

  useEffect(() => {
    if (!activeSlug) return;
    setLoading(true);
    Promise.all([fetchStoreInfo(activeSlug), fetchCategories(activeSlug)])
      .then(([storeRes, catRes]) => {
        if (!storeRes.status || !storeRes.data) {
          navigate('/shop/not-found', { replace: true });
          return;
        }
        setStore(storeRes.data);
        setCategories(catRes.data || []);
      })
      .catch(() => navigate('/shop/not-found', { replace: true }))
      .finally(() => setLoading(false));
  }, [activeSlug, navigate]);

  useEffect(() => {
    if (!activeSlug) return;
    fetchProducts(activeSlug, { category: activeCategory || '', q: searchQuery }).then((res) => {
      if (res.status) setProducts(res.data || []);
    });
  }, [activeSlug, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* 1. Universal Sticky Header */}
      <EMenuHeader
        store={store}
        storeName={store?.name || store?.company}
        showBack={true}
        cartCount={totalCount}
        onCartClick={() => navigate(`/shop/${activeSlug}/checkout`)}
      />

      {/* 2. Store Banner & Branding (Scrollable) */}
      <div className="relative border-b border-zinc-100 dark:border-zinc-800 pb-3">
        {store?.banner && <img src={store.banner} alt="Banner" className="w-full h-32 object-cover" />}
        <div className="px-4 pt-3 flex items-center gap-3">
          {store?.logo && <img src={store.logo} alt="Logo" className="w-14 h-14 rounded-full border shadow-sm object-cover" />}
          <div>
            <h1 className="text-lg font-bold leading-tight">{store?.name || store?.company}</h1>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              Open Now
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sticky Search & Horizontal Categories (Below Header) */}
      <div
        className="app-sticky-tabs sticky-category-tabs border-b border-zinc-200 dark:border-zinc-800 space-y-2"
        style={{
          position: 'sticky',
          top: 'var(--header-height, 52px)',
          zIndex: 900,
          background: 'var(--tg-theme-bg-color, #ffffff)',
          paddingTop: '8px',
          paddingBottom: '8px',
          paddingLeft: '16px',
          paddingRight: '16px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
        }}
      >
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 px-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm outline-none focus:ring-2 ring-[var(--theme-accent)]"
        />
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => { haptic.impact('light'); setActiveCategory(null); }}
            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap rounded-full min-h-[44px] transition-colors ${
              activeCategory === null ? 'bg-[var(--theme-accent)] text-white' : 'bg-zinc-100 dark:bg-zinc-800'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { haptic.impact('light'); setActiveCategory(c.id); }}
              className={`px-4 py-2 text-xs font-semibold whitespace-nowrap rounded-full min-h-[44px] transition-colors ${
                activeCategory === c.id ? 'bg-[var(--theme-accent)] text-white' : 'bg-zinc-100 dark:bg-zinc-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Product Grid */}
      <div className="p-4 grid grid-cols-2 gap-3.5">
        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedProduct(p)}
            className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between p-2.5 bg-white dark:bg-zinc-800/40"
          >
            <img src={p.image || '/placeholder-product.png'} loading="lazy" alt={p.name} className="w-full h-28 object-cover rounded-lg mb-2" />
            <div>
              <p className="font-medium text-xs line-clamp-2">{p.name}</p>
              <p className="text-sm font-bold text-[var(--theme-accent)] mt-1">
                {store?.currency_symbol || '$'}{Number(p.price).toFixed(2)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                haptic.impact('medium');
                addToCart(p, 1);
              }}
              className="mt-2 w-full min-h-[44px] bg-zinc-100 dark:bg-zinc-700 hover:bg-[var(--theme-accent)] hover:text-white rounded-lg text-xs font-semibold"
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {/* 4. Bottom Sheet Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[1100] bg-black/40 flex items-end justify-center" onClick={() => setSelectedProduct(null)}>
          <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-t-2xl p-5 space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <img src={selectedProduct.image || '/placeholder-product.png'} alt="" className="w-full h-44 object-cover rounded-xl" />
            <h2 className="text-lg font-bold">{selectedProduct.name}</h2>
            <p className="text-xs text-zinc-500">{selectedProduct.details || 'Fresh item prepared upon ordering.'}</p>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-black text-[var(--theme-accent)]">
                {store?.currency_symbol || '$'}{Number(selectedProduct.price).toFixed(2)}
              </span>
              <button
                onClick={() => {
                  haptic.notification('success');
                  addToCart(selectedProduct, 1);
                  setSelectedProduct(null);
                }}
                className="px-5 min-h-[44px] bg-[var(--theme-accent)] text-white rounded-xl text-sm font-bold shadow"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Fixed Cart Footer */}
      {totalCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[1000] flex justify-center p-3">
          <div
            onClick={() => navigate(`/shop/${activeSlug}/checkout`)}
            className="w-full max-w-[456px] min-h-[48px] bg-[var(--theme-accent)] text-white rounded-2xl flex items-center justify-between px-4 shadow-xl cursor-pointer"
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs">{totalCount}</span>
              <span>View Cart</span>
            </div>
            <span className="font-extrabold text-sm">
              {store?.currency_symbol || '$'}{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}