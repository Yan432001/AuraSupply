import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { message, notification } from 'antd';
import {
  DownOutlined,
  CloseOutlined,
  PlusOutlined,
  MinusOutlined,
  CheckOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  BellOutlined,
  BellFilled,
  StarFilled,
  HeartOutlined,
  HeartFilled,
  DeleteOutlined,
  CameraOutlined,
  ReloadOutlined,
  PictureOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useTelegram } from '../hooks/useTelegram';
import { useFavorites } from '../hooks/useFavorites';
import { useHeaderHeight } from '../hooks/useHeaderHeight';
import MenuSearchBar, { HighlightMatch } from '../components/emenu/MenuSearchBar';
import OrderStatusMiniBanner from '../components/emenu/OrderStatusMiniBanner';
import ProductDetailModal from '../components/emenu/ProductDetailModal';
import TaobaoProductDetail from '../components/common/TaobaoProductDetail';
import { routeOrderToTelegramGroup, getStoreTelegramConfig, getAllStoreTelegramConfigs } from '../data/telegramStoreGroupManager';
import {
  isImageDeleted,
  deleteProductImage,
  restoreProductImage,
  isStoreLogoDeleted,
  deleteStoreLogo,
  restoreStoreLogo,
  getStoreDeletedCount,
} from '../data/menuImageManager';

// Website Default Theme aligned with Aura publicTheme
// Primary: #2F6FED, Secondary: #5B8DEF, Accent: #FF7A3D
const SHOP_THEMES = {
  'sbc-store': {
    name: 'Aura Specialty Coffee',
    bg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: 'border-slate-200/80',
    accent: '#2F6FED',
    accentHover: '#255bc2',
    accentBtn: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] hover:opacity-95 text-white shadow-md shadow-[#2F6FED]/25 font-bold',
    pillActive: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] text-white shadow-md shadow-[#2F6FED]/25 font-bold border-none',
    pillInactive: 'bg-slate-100/90 text-slate-600 border border-slate-200/80 hover:border-[#2F6FED]/40 hover:text-[#2F6FED] font-semibold',
    priceText: 'text-[#2F6FED]',
    badgeText: 'text-[#2F6FED]',
  },
  'aura-lounge': {
    name: 'Aura Botanical Lounge & Matcha',
    bg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: 'border-slate-200/80',
    accent: '#2F6FED',
    accentHover: '#255bc2',
    accentBtn: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] hover:opacity-95 text-white shadow-md shadow-[#2F6FED]/25 font-bold',
    pillActive: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] text-white shadow-md shadow-[#2F6FED]/25 font-bold border-none',
    pillInactive: 'bg-slate-100/90 text-slate-600 border border-slate-200/80 hover:border-[#2F6FED]/40 hover:text-[#2F6FED] font-semibold',
    priceText: 'text-[#2F6FED]',
    badgeText: 'text-[#2F6FED]',
  },
  'aura-bistro': {
    name: 'Aura French Bistro',
    bg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: 'border-slate-200/80',
    accent: '#2F6FED',
    accentHover: '#255bc2',
    accentBtn: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] hover:opacity-95 text-white shadow-md shadow-[#2F6FED]/25 font-bold',
    pillActive: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] text-white shadow-md shadow-[#2F6FED]/25 font-bold border-none',
    pillInactive: 'bg-slate-100/90 text-slate-600 border border-slate-200/80 hover:border-[#2F6FED]/40 hover:text-[#2F6FED] font-semibold',
    priceText: 'text-[#2F6FED]',
    badgeText: 'text-[#2F6FED]',
  },
  'aura-bakery': {
    name: 'Aura Artisan Bakery',
    bg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: 'border-slate-200/80',
    accent: '#2F6FED',
    accentHover: '#255bc2',
    accentBtn: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] hover:opacity-95 text-white shadow-md shadow-[#2F6FED]/25 font-bold',
    pillActive: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] text-white shadow-md shadow-[#2F6FED]/25 font-bold border-none',
    pillInactive: 'bg-slate-100/90 text-slate-600 border border-slate-200/80 hover:border-[#2F6FED]/40 hover:text-[#2F6FED] font-semibold',
    priceText: 'text-[#2F6FED]',
    badgeText: 'text-[#2F6FED]',
  },
  'aura-tech': {
    name: 'Aura Tech & Smart Living',
    bg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: 'border-slate-200/80',
    accent: '#2F6FED',
    accentHover: '#255bc2',
    accentBtn: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] hover:opacity-95 text-white shadow-md shadow-[#2F6FED]/25 font-bold',
    pillActive: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] text-white shadow-md shadow-[#2F6FED]/25 font-bold border-none',
    pillInactive: 'bg-slate-100/90 text-slate-600 border border-slate-200/80 hover:border-[#2F6FED]/40 hover:text-[#2F6FED] font-semibold',
    priceText: 'text-[#2F6FED]',
    badgeText: 'text-[#2F6FED]',
  },
  'nexus-mobile': {
    name: 'Nexus Mobile & Gadgets',
    bg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: 'border-slate-200/80',
    accent: '#2F6FED',
    accentHover: '#255bc2',
    accentBtn: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] hover:opacity-95 text-white shadow-md shadow-[#2F6FED]/25 font-bold',
    pillActive: 'bg-gradient-to-r from-[#2F6FED] to-[#5B8DEF] text-white shadow-md shadow-[#2F6FED]/25 font-bold border-none',
    pillInactive: 'bg-slate-100/90 text-slate-600 border border-slate-200/80 hover:border-[#2F6FED]/40 hover:text-[#2F6FED] font-semibold',
    priceText: 'text-[#2F6FED]',
    badgeText: 'text-[#2F6FED]',
  },
};

export default function EMenuPage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { tg, triggerHaptic } = useTelegram();
  const { headerRef } = useHeaderHeight();

  // Extract active store slug with seller mapping
  const currentSlug = useMemo(() => {
    let raw = params.storeSlug;
    if (!raw) {
      const parts = location.pathname.split('/');
      if (parts[1] === 'shop' && parts[2] && parts[2] !== 'not-found') {
        raw = parts[2];
      }
    }
    return raw || 'sbc-store';
  }, [params.storeSlug, location.pathname]);

  const activeTheme = useMemo(() => {
    return SHOP_THEMES[currentSlug] || SHOP_THEMES['sbc-store'];
  }, [currentSlug]);

  // Ensure Telegram WebApp BackButton is hidden
  useEffect(() => {
    try {
      tg?.BackButton?.hide?.();
    } catch (_) {}
  }, [tg]);

  // Stores & Catalog State
  const [currentStore, setCurrentStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Favorites Persistence
  const { isFavorite, toggleFavorite, favoritesCount } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Cart State
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_emenu_cart_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Table & Dining Context
  const [diningMode, setDiningMode] = useState('delivery');
  const [customerLocation, setCustomerLocation] = useState('Table #06');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('Telegram Customer');
  const [customerPhone, setCustomerPhone] = useState('+855 12 345 678');
  const [customerNote, setCustomerNote] = useState('');
  const [hasClaimedCoupon, setHasClaimedCoupon] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Customization Modal (`Opt`)
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Regular');
  const [selectedMilk, setSelectedMilk] = useState('Standard');
  const [selectedIce, setSelectedIce] = useState('Normal Ice');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [customizeQty, setCustomizeQty] = useState(1);

  // Taobao-style Product Detail Modal state for Telegram Mini App
  const [detailProduct, setDetailProduct] = useState(null);

  // Media deletion synchronization state
  const [mediaVersion, setMediaVersion] = useState(0);

  useEffect(() => {
    const handleMediaChange = () => setMediaVersion((v) => v + 1);
    window.addEventListener('aura_menu_image_updated', handleMediaChange);
    return () => window.removeEventListener('aura_menu_image_updated', handleMediaChange);
  }, []);

  const handleDeleteProductImage = (prod, e) => {
    e?.stopPropagation?.();
    triggerHaptic?.('medium');
    deleteProductImage(prod.id, currentSlug, prod.name, prod.image);
    message.success(`Image for "${prod.name}" deleted directly from E-Menu & synced to Telegram Store Manager!`);
  };

  const handleRestoreProductImage = (prod, e) => {
    e?.stopPropagation?.();
    triggerHaptic?.('light');
    restoreProductImage(prod.id, currentSlug);
    message.success(`Image for "${prod.name}" restored in E-Menu!`);
  };

  const handleToggleStoreLogo = (e) => {
    e?.stopPropagation?.();
    triggerHaptic?.('medium');
    const isDeleted = isStoreLogoDeleted(currentSlug);
    if (isDeleted) {
      restoreStoreLogo(currentSlug);
      message.success(`Restored logo for ${currentStore?.name || 'store'} in E-Menu!`);
    } else {
      deleteStoreLogo(currentSlug, currentStore?.name, currentStore?.logo);
      message.success(`Deleted logo for ${currentStore?.name || 'store'} from E-Menu & synced to Telegram Store Manager!`);
    }
  };

  // Active Order & 'Notify Me' status changes
  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_emenu_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [notifyMeEnabled, setNotifyMeEnabled] = useState(true);

  // Monitor order status changes: trigger push notification / in-app alert when status becomes 'ready'
  useEffect(() => {
    if (!activeOrder || activeOrder.status === 'Ready' || activeOrder.status === 'Completed') return;

    // Transition order to Ready
    const timer = setTimeout(() => {
      const updated = { ...activeOrder, status: 'Ready' };
      setActiveOrder(updated);
      try {
        localStorage.setItem('aura_emenu_active_order', JSON.stringify(updated));
      } catch {}

      if (notifyMeEnabled) {
        triggerHaptic?.('success');
        try {
          if (tg && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('6.2') && typeof tg.showPopup === 'function') {
            tg.showPopup({
              title: 'Order Ready for Pickup! 🔔',
              message: `Your order #${activeOrder.referenceNo} is prepared and ready at ${currentStore?.name || 'the counter'}!`,
              buttons: [{ type: 'ok' }],
            });
          }
        } catch (_) {}
        notification.success({
          message: 'Order Ready for Pickup! 🔔',
          description: `Your order #${activeOrder.referenceNo} has been prepared by the kitchen team. Please collect your items at the counter!`,
          duration: 10,
          placement: 'top',
        });
      }
    }, 12000);

    return () => clearTimeout(timer);
  }, [activeOrder, notifyMeEnabled, tg, triggerHaptic, currentStore]);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('aura_emenu_cart_v2', JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);

  // Fetch Store Details & Products
  const fetchStoreData = useCallback(async (slug) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/tma/store/${slug}`);
      if (res.data?.status && res.data.store) {
        setCurrentStore(res.data.store);
        setCategories(res.data.categories || []);
        setProducts(res.data.products || []);
      } else {
        message.error(res.data?.message || 'Store not found');
      }
    } catch (err) {
      console.warn(`Error loading store ${slug}:`, err);
      message.error('Failed to load store menu from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreData(currentSlug);
  }, [currentSlug, fetchStoreData]);

  // Handle Direct Product Deep Link (?item=1 or startapp=item_1)
  useEffect(() => {
    const paramsQuery = new URLSearchParams(location.search);
    const targetItemId = paramsQuery.get('item');
    if (targetItemId && products.length > 0) {
      const found = products.find((p) => String(p.id) === String(targetItemId));
      if (found) {
        setCustomizingProduct(found);
        setSelectedSize('Regular');
        setSelectedMilk('Fresh Cow Milk');
        setSelectedIce('Normal Ice');
        setCustomizeQty(1);

        // Smooth scroll to product
        setTimeout(() => {
          const el = document.getElementById(`product-${targetItemId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [location.search, products]);

  // Map category ID to category name for fast category-based search
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.name || '';
    });
    return map;
  }, [categories]);

  // Total favorites count for current store items
  const currentStoreFavoritesCount = useMemo(() => {
    return products.filter((p) => isFavorite(p.id)).length;
  }, [products, isFavorite]);

  // Filter products by selected category, favorites bookmark filter, and real-time search query
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Real-time search query by product name (also checks details/category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const nameMatches = (p.name || '').toLowerCase().includes(q);
        const detailsMatches = (p.details || '').toLowerCase().includes(q);
        const catName = (categoryMap[p.category_id] || '').toLowerCase();
        const catMatches = catName.includes(q);
        return nameMatches || detailsMatches || catMatches;
      });

      if (showFavoritesOnly) {
        list = list.filter((p) => isFavorite(p.id));
      }

      // Sort matches with exact/prefix name matches first for fast product finding
      list.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName);
      });

      return list;
    }

    if (showFavoritesOnly) {
      list = list.filter((p) => isFavorite(p.id));
    } else if (selectedCategory !== null) {
      list = list.filter((p) => p.category_id === selectedCategory);
    }

    return list;
  }, [products, selectedCategory, searchQuery, categoryMap, showFavoritesOnly, isFavorite]);

  // Open Customization Modal
  const openCustomizer = (product) => {
    triggerHaptic?.('light');
    setCustomizingProduct(product);
    setSelectedSize('Regular');
    setSelectedMilk('Fresh Cow Milk');
    setSelectedIce('Normal Ice');
    setSpecialInstructions('');
    setCustomizeQty(1);
  };

  // Quick Direct Add to Cart
  const handleDirectAddToCart = (product) => {
    triggerHaptic?.('medium');
    const existingIdx = cart.findIndex((item) => item.id === product.id && (!item.options || Object.keys(item.options).length === 0));
    if (existingIdx >= 0) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].subtotal = Number(
        (updated[existingIdx].quantity * updated[existingIdx].price).toFixed(2)
      );
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          code: product.code,
          name: product.name,
          image: product.image,
          price: Number(Number(product.price).toFixed(2)),
          quantity: 1,
          subtotal: Number(Number(product.price).toFixed(2)),
          options: {},
        },
      ]);
    }
    message.success({ content: `Added ${product.name}!`, duration: 1 });
  };

  // Add Customized to Cart
  const handleAddCustomizedToCart = () => {
    if (!customizingProduct) return;
    triggerHaptic?.('success');
    let priceAdj = 0;
    if (selectedSize.includes('+$1') || selectedSize.includes('+$0.75')) priceAdj += 0.75;
    if (selectedMilk.includes('+$0.60')) priceAdj += 0.6;

    const unitPrice = Number((Number(customizingProduct.price) + priceAdj).toFixed(2));
    const subtotal = Number((unitPrice * customizeQty).toFixed(2));

    const options = {
      Size: selectedSize,
      Milk: selectedMilk,
      Ice: selectedIce,
      Note: specialInstructions.trim() || undefined,
    };

    setCart([
      ...cart,
      {
        id: customizingProduct.id,
        code: customizingProduct.code,
        name: customizingProduct.name,
        image: customizingProduct.image,
        price: unitPrice,
        quantity: customizeQty,
        subtotal,
        options,
      },
    ]);

    setCustomizingProduct(null);
    message.success(`Added ${customizeQty}x ${customizingProduct.name}!`);
  };

  // Add to Cart / Buy Now from Taobao Product Detail
  const handleAddToCartFromDetail = (item) => {
    triggerHaptic?.('success');
    const qty = item.quantity || 1;
    const price = Number(item.price || item.subtotal / qty);
    const options = item.selectedVariants || {};

    setCart((prev) => [
      ...prev,
      {
        id: item.id,
        code: item.code || `SKU-${item.id}`,
        name: item.name,
        image: item.image,
        price,
        quantity: qty,
        subtotal: Number((price * qty).toFixed(2)),
        options,
      },
    ]);
  };

  const handleBuyNowFromDetail = (item) => {
    handleAddToCartFromDetail(item);
    setDetailProduct(null);
    setIsCartOpen(true);
  };

  // Cart Quantity Modifiers
  const handleUpdateCartQty = (idx, delta) => {
    triggerHaptic?.('light');
    const updated = [...cart];
    updated[idx].quantity += delta;
    if (updated[idx].quantity <= 0) {
      updated.splice(idx, 1);
    } else {
      updated[idx].subtotal = Number(
        (updated[idx].quantity * updated[idx].price).toFixed(2)
      );
    }
    setCart(updated);
  };

  // Cart Financials
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const cartDiscount = useMemo(() => {
    if (hasClaimedCoupon) {
      return Number((cartSubtotal * 0.2).toFixed(2));
    }
    return 0;
  }, [cartSubtotal, hasClaimedCoupon]);

  const deliveryFee = diningMode === 'delivery' ? 1.5 : 0;
  const cartGrandTotal = Math.max(0, cartSubtotal - cartDiscount + deliveryFee).toFixed(2);
  const totalItemCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  // Submit Order to Kitchen & Telegram
  const handleConfirmOrder = async () => {
    if (cart.length === 0 || isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    triggerHaptic?.('heavy');

    const idempotencyKey = `ord_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const payload = {
      storeSlug: currentSlug,
      idempotencyKey,
      orderType: diningMode,
      couponCode: hasClaimedCoupon ? 'FIRST20' : '',
      discountAmount: cartDiscount,
      deliveryFee,
      grandTotal: parseFloat(cartGrandTotal),
      customer: {
        name: customerName || 'Telegram Guest',
        username: tg?.initDataUnsafe?.user?.username || '@telegram_user',
        phone: customerPhone || '+855 12 345 678',
        address: `${customerLocation} (${diningMode.toUpperCase()})`,
        note: customerNote || `Telegram Mini App Order`,
        telegramId: tg?.initDataUnsafe?.user?.id || 9841203,
      },
      items: cart.map((it) => ({
        id: it.id,
        productId: it.id,
        code: it.code,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        subtotal: it.subtotal,
        options: it.options,
      })),
    };

    try {
      const res = await axios.post(`/api/tma/shop/${currentSlug}/orders`, payload);
      if (res.data?.status && res.data.data) {
        const orderData = {
          referenceNo: res.data.data.referenceNo,
          storeName: currentStore?.name,
          status: 'Preparing',
          placedAt: Date.now(),
        };
        // Route notification to this store's dedicated Telegram group
        routeOrderToTelegramGroup(currentSlug, {
          ...payload,
          referenceNo: res.data.data.referenceNo,
        });

        setActiveOrder(orderData);
        try {
          localStorage.setItem('aura_emenu_active_order', JSON.stringify(orderData));
          sessionStorage.removeItem('aura_emenu_order_dismissed');
          window.dispatchEvent(new Event('aura_order_updated'));
        } catch (_) {}

        setCart([]);
        setIsCartOpen(false);
        message.success(`Order placed & routed to Telegram Kitchen Group! Ref: ${res.data.data.referenceNo}`);
        try {
          if (tg && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('6.2') && typeof tg.showPopup === 'function') {
            tg.showPopup({
              title: 'Order Confirmed! 🎉',
              message: `Your order #${res.data.data.referenceNo} has been routed to the Telegram Kitchen group for ${currentStore?.name}. You'll receive a 'Ready' notification when your order is prepared!`,
              buttons: [{ type: 'ok' }],
            });
          }
        } catch (_) {}
      } else {
        // Fallback local placement with group notification
        const refNo = `ORD-${Date.now().toString().slice(-4)}`;
        const orderData = {
          referenceNo: refNo,
          storeName: currentStore?.name,
          status: 'Preparing',
          placedAt: Date.now(),
        };
        routeOrderToTelegramGroup(currentSlug, { ...payload, referenceNo: refNo });
        setActiveOrder(orderData);
        try {
          localStorage.setItem('aura_emenu_active_order', JSON.stringify(orderData));
          sessionStorage.removeItem('aura_emenu_order_dismissed');
          window.dispatchEvent(new Event('aura_order_updated'));
        } catch (_) {}
        setCart([]);
        setIsCartOpen(false);
        message.success(`Order placed & routed to Telegram Kitchen Group! Ref: ${refNo}`);
      }
    } catch (err) {
      // In offline / preview mode, ensure local order is placed and group notified
      const refNo = `ORD-${Date.now().toString().slice(-4)}`;
      const orderData = {
        referenceNo: refNo,
        storeName: currentStore?.name,
        status: 'Preparing',
        placedAt: Date.now(),
      };
      routeOrderToTelegramGroup(currentSlug, { ...payload, referenceNo: refNo });
      setActiveOrder(orderData);
      try {
        localStorage.setItem('aura_emenu_active_order', JSON.stringify(orderData));
        sessionStorage.removeItem('aura_emenu_order_dismissed');
        window.dispatchEvent(new Event('aura_order_updated'));
      } catch (_) {}
      setCart([]);
      setIsCartOpen(false);
      message.success(`Order placed & routed to Telegram Kitchen Group! Ref: ${refNo}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // 8 Total Merchants across website:
  // - Merchant 'Yin' owns 2 stores: 'sbc-store' & 'aura-bakery'
  // - 7 other merchants own 1 store each (simple merchant: 1 store 1 merchant)
  const MERCHANT_OWNER_MAP = {
    'sbc-store': { owner: 'Yin', storeCount: 2 },
    'aura-bakery': { owner: 'Yin', storeCount: 2 },
    'aura-bistro': { owner: 'Pierre Dubois', storeCount: 1 },
    'aura-lounge': { owner: 'Kenji Sato', storeCount: 1 },
    'nexus-mobile': { owner: 'Alex Chen', storeCount: 1 },
    'aura-tech': { owner: 'David Kim', storeCount: 1 },
    'apex-pc': { owner: 'Elena Rostova', storeCount: 1 },
    'velour-apparel': { owner: 'Marcus Vance', storeCount: 1 },
  };

  const currentStoreOwner = MERCHANT_OWNER_MAP[currentSlug]?.owner || 'Yin';
  const [storeSwitchScope, setStoreSwitchScope] = useState('owner'); // 'owner' | 'all'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Master catalog of all 8 merchants across the website
  const allEightMerchantStores = useMemo(() => {
    return [
      { slug: 'sbc-store', name: 'Specialty Coffee', fullName: 'Aura Specialty Coffee', emoji: '☕', owner: 'Yin' },
      { slug: 'aura-bakery', name: 'Artisan Bakery', fullName: 'Aura Artisan Bakery', emoji: '🥐', owner: 'Yin' },
      { slug: 'aura-bistro', name: 'French Bistro', fullName: 'Aura French Bistro', emoji: '🍽️', owner: 'Pierre Dubois' },
      { slug: 'aura-lounge', name: 'Botanical Lounge & Matcha', fullName: 'Aura Botanical Lounge', emoji: '🍵', owner: 'Kenji Sato' },
      { slug: 'nexus-mobile', name: 'Nexus Mobile & Gadgets', fullName: 'Nexus Mobile & Gadgets', emoji: '📱', owner: 'Alex Chen' },
      { slug: 'aura-tech', name: 'Tech & Workstations', fullName: 'Aura Automation Tech', emoji: '💻', owner: 'David Kim' },
      { slug: 'apex-pc', name: 'Apex PC Hub', fullName: 'Apex PC & Workstation Hub', emoji: '🖥️', owner: 'Elena Rostova' },
      { slug: 'velour-apparel', name: 'Velour Apparel', fullName: 'Velour Minimalist Apparel', emoji: '👔', owner: 'Marcus Vance' },
    ];
  }, []);

  // Filtered store options: either current merchant's stores (Yin has 2, others have 1) or all 8 merchants
  const storeOptions = useMemo(() => {
    if (storeSwitchScope === 'all') {
      return allEightMerchantStores;
    }
    const ownerStores = allEightMerchantStores.filter((st) => st.owner === currentStoreOwner);
    return ownerStores.length > 0 ? ownerStores : allEightMerchantStores.slice(0, 2);
  }, [storeSwitchScope, currentStoreOwner, allEightMerchantStores]);

  return (
    <div
      style={{
        background: 'var(--tg-theme-bg-color, #ffffff)',
        color: 'var(--tg-theme-text-color, #0f172a)',
      }}
      className="w-full max-w-[430px] mx-auto min-h-screen font-sans flex flex-col relative pb-20 overflow-x-clip selection:bg-[var(--tg-theme-button-color,#2F6FED)] selection:text-white"
    >
      {/* ======================================================== */}
      {/* 0. PERSISTENT MINI-BANNER AT TOP (REAL-TIME ORDER STATUS) */}
      {/* ======================================================== */}
      <OrderStatusMiniBanner
        order={activeOrder}
        onOrderUpdate={setActiveOrder}
        storeName={currentStore?.name}
        triggerHaptic={triggerHaptic}
        className="sticky top-0 z-40"
      />

      {/* ======================================================== */}
      {/* 1. NATIVE MOBILE APP TOP BAR (COMPACT & SLEEK)           */}
      {/* ======================================================== */}
      <header
        ref={headerRef}
        className="header app-sticky-header px-3 py-2 flex items-center justify-between"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'var(--tg-theme-bg-color, #ffffff)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
          paddingBottom: '8px',
          minHeight: 'var(--header-height, 52px)',
          borderBottom: '1px solid var(--tg-theme-secondary-bg-color, #e2e8f0)',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
        }}
      >
        {/* Left: Store Avatar + Name + Dining location */}
        <div
          onClick={() => setIsLocationModalOpen(true)}
          className="flex items-center gap-2.5 cursor-pointer select-none active:opacity-80 transition min-w-0"
        >
          <div className="relative group shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-[var(--tg-theme-button-color,#2F6FED)]/30 bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] shadow-2xs relative">
              {isStoreLogoDeleted(currentSlug) ? (
                <div className="w-full h-full bg-blue-50 text-[var(--tg-theme-button-color,#2F6FED)] font-black text-[11px] flex items-center justify-center text-center p-0.5">
                  {currentStore?.name?.slice(0, 2)?.toUpperCase() || 'EM'}
                </div>
              ) : (
                <img
                  src={
                    currentStore?.logo ||
                    '/assets/uploads/no_image.png'
                  }
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      '/assets/uploads/no_image.png';
                  }}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Direct Logo Delete / Restore Button */}
            {!isStoreLogoDeleted(currentSlug) ? (
              <button
                type="button"
                onClick={handleToggleStoreLogo}
                title="Delete store logo"
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[8px] shadow-xs cursor-pointer transition active:scale-90 border border-white"
              >
                <DeleteOutlined style={{ fontSize: 7 }} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleStoreLogo}
                title="Restore store logo"
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--tg-theme-button-color,#2F6FED)] text-white flex items-center justify-center text-[8px] shadow-xs cursor-pointer transition active:scale-90 border border-white"
              >
                <ReloadOutlined style={{ fontSize: 7 }} />
              </button>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="font-bold text-[length:var(--font-title)] text-[var(--tg-theme-text-color,#0f172a)] tracking-tight leading-tight truncate">
              {currentStore?.name || activeTheme.name}
            </h1>
            <p className="text-[length:var(--font-small)] font-medium text-[var(--tg-theme-hint-color,#64748b)] flex items-center gap-1 pt-0.5 truncate">
              <span>{customerLocation} • {diningMode}</span>
              <span className="text-[length:var(--font-small)] bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] text-[var(--tg-theme-button-color,#2F6FED)] px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5 shrink-0 border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
                <span>Switch</span>
                <DownOutlined style={{ fontSize: 6 }} />
              </span>
            </p>
          </div>
        </div>

        {/* Right: Layout Switcher + Compact Cart Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 1-Tap Toggle between 2-Column Grid and Compact List */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              setViewMode(viewMode === 'grid' ? 'list' : 'grid');
            }}
            aria-label={viewMode === 'grid' ? 'Switch to compact list view' : 'Switch to 2-column grid view'}
            title={viewMode === 'grid' ? 'Switch to List' : 'Switch to Grid'}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] hover:opacity-90 text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-center text-sm cursor-pointer active:scale-95 transition"
          >
            {viewMode === 'grid' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
          </button>

          {/* Cart Bag trigger */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] font-bold text-[length:var(--font-base)] flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
          >
            <span className="text-sm">🛍️</span>
            <span className="font-mono text-xs">{totalItemCount}</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. REAL-TIME COMPACT SEARCH BAR                           */}
      {/* ======================================================== */}
      <div className="px-3 pt-1.5 pb-1 bg-[var(--tg-theme-bg-color,#ffffff)]">
        <MenuSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder={`Search ${currentStore?.name || 'menu'}...`}
          totalMatches={filteredProducts.length}
          totalItems={products.length}
          accentColor={activeTheme.accent || 'var(--tg-theme-button-color,#2F6FED)'}
          showQuickTags={false}
        />
      </div>

      {/* ======================================================== */}
      {/* 3. STICKY CATEGORY TABS (SLEEK & CLEAN MOBILE UI)        */}
      {/* ======================================================== */}
      <div
        className="app-sticky-tabs sticky-category-tabs px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none"
        style={{
          position: 'sticky',
          top: 'var(--header-height, 52px)',
          zIndex: 900,
          background: 'var(--tg-theme-bg-color, #ffffff)',
          borderBottom: '1px solid var(--tg-theme-secondary-bg-color, #e2e8f0)',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
        }}
      >
        {/* All Items Tab */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('light');
            setShowFavoritesOnly(false);
            setSelectedCategory(null);
          }}
          className={`h-8 px-3 rounded-full text-[12px] transition-all whitespace-nowrap cursor-pointer active:scale-95 shrink-0 flex items-center justify-center ${
            !showFavoritesOnly && selectedCategory === null
              ? 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] font-semibold shadow-2xs'
              : 'bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)]/80 text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]/60 font-medium hover:opacity-90'
          }`}
        >
          <span>All</span>
          <span className="ml-1 text-[10.5px] opacity-75 font-mono">({products.length})</span>
        </button>

        {/* Favorites Filter Tab */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('light');
            setShowFavoritesOnly(!showFavoritesOnly);
            setSelectedCategory(null);
          }}
          className={`h-8 px-2.5 rounded-full text-[12px] transition-all whitespace-nowrap cursor-pointer active:scale-95 shrink-0 flex items-center justify-center gap-1 ${
            showFavoritesOnly
              ? 'bg-rose-500 text-white font-semibold shadow-2xs'
              : 'bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)]/80 text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]/60 font-medium hover:opacity-90'
          }`}
          title="Filter bookmarked favorites"
        >
          <HeartFilled className={showFavoritesOnly ? 'text-white' : 'text-rose-500'} style={{ fontSize: 10 }} />
          <span>Favorites</span>
          {currentStoreFavoritesCount > 0 && (
            <span className="ml-0.5 text-[10.5px] opacity-75 font-mono">({currentStoreFavoritesCount})</span>
          )}
        </button>

        {/* Dynamic Category Tabs */}
        {categories.map((cat) => {
          const isSelected = !showFavoritesOnly && selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                triggerHaptic?.('light');
                setShowFavoritesOnly(false);
                setSelectedCategory(cat.id);
              }}
              className={`h-8 px-3 rounded-full text-[12px] transition-all whitespace-nowrap cursor-pointer active:scale-95 shrink-0 flex items-center justify-center ${
                isSelected
                  ? 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] font-semibold shadow-2xs'
                  : 'bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)]/80 text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]/60 font-medium hover:opacity-90'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* SECTION TITLE & ITEM COUNT                              */}
      {/* ======================================================== */}
      <div className="px-3 pt-2 pb-0.5 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[var(--tg-theme-text-color,#0f172a)] tracking-tight">
          {showFavoritesOnly
            ? 'Bookmarked Favorites'
            : selectedCategory !== null
            ? categoryMap[selectedCategory] || 'Menu Items'
            : searchQuery
            ? `Search: "${searchQuery}"`
            : 'Menu Items'}
        </h2>
        <span className="text-[11.5px] text-[var(--tg-theme-hint-color,#64748b)] font-medium">
          {filteredProducts.length} items
        </span>
      </div>

      {/* ======================================================== */}
      {/* 4. PRODUCTS: COMPACT 2-COLUMN GRID OR COMPACT LIST       */}
      {/* ======================================================== */}
      <main className="px-2.5 py-2 flex-1 bg-[var(--tg-theme-secondary-bg-color,#f8fafc)]/50">
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <div className="animate-spin text-2xl">☕</div>
            <p className="text-[13px] text-[var(--tg-theme-hint-color,#64748b)] font-medium">Loading menu...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-[var(--tg-theme-hint-color,#64748b)] text-[13px] space-y-2 px-4">
            <span className="text-2xl block mb-1">{showFavoritesOnly ? '❤️' : '🔍'}</span>
            <p className="font-bold text-[var(--tg-theme-text-color,#0f172a)] text-[14px]">
              {showFavoritesOnly
                ? 'No favorites bookmarked yet'
                : searchQuery
                ? `No items matching "${searchQuery}"`
                : 'No items found'}
            </p>
            <p className="text-[12px]">
              {showFavoritesOnly
                ? 'Tap the heart icon on any product card to bookmark it in your favorites list.'
                : searchQuery
                ? 'Try searching by a different product name or category.'
                : 'Select another category above.'}
            </p>
            {(searchQuery || showFavoritesOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowFavoritesOnly(false);
                }}
                className="mt-2 min-h-[40px] px-4 py-2 rounded-xl bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] text-[13px] font-bold transition cursor-pointer"
              >
                {showFavoritesOnly ? 'Browse All Menu Items' : 'Clear Search'}
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ============================================== */
          /* 4A. COMPACT 2-COLUMN GRID (NATIVE MOBILE APP)  */
          /* ============================================== */
          <div className="grid grid-cols-2 gap-2">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                id={`product-${prod.id}`}
                className="bg-[var(--tg-theme-section-bg-color,#ffffff)] rounded-xl border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] p-2 flex flex-col justify-between shadow-2xs hover:shadow-xs transition"
              >
                {/* Product Image Slot */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailProduct(prod)}
                  className="relative h-24 w-full rounded-lg overflow-hidden bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] cursor-pointer group"
                >
                  {isImageDeleted(prod.id, currentSlug) ? (
                    <div className="w-full h-full bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-1 text-center select-none">
                      <CameraOutlined style={{ fontSize: 16 }} className="text-slate-400 mb-0.5" />
                      <span className="text-[9.5px] font-bold text-slate-500">Image Deleted</span>
                      <span className="text-[8.5px] text-slate-400">Tap to edit</span>
                    </div>
                  ) : (
                    <img
                      src={prod.image}
                      alt={prod.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          '/assets/uploads/no_image.png';
                      }}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {/* Direct Delete Image Button */}
                  {!isImageDeleted(prod.id, currentSlug) ? (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteProductImage(prod, e)}
                      className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 hover:bg-rose-600 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-0.5 transition active:scale-90 z-10 cursor-pointer shadow-xs min-h-[24px]"
                      title="Delete image directly"
                    >
                      <DeleteOutlined style={{ fontSize: 8 }} />
                      <span>Del</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleRestoreProductImage(prod, e)}
                      className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold flex items-center gap-0.5 transition active:scale-90 z-10 cursor-pointer shadow-xs min-h-[24px]"
                      title="Restore product image"
                    >
                      <ReloadOutlined style={{ fontSize: 8 }} />
                      <span>Restore</span>
                    </button>
                  )}

                  {/* Bookmark Favorites Button (min 40px hit area) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic?.('light');
                      toggleFavorite(prod.id, prod.name, e);
                    }}
                    aria-label={isFavorite(prod.id) ? `Remove ${prod.name} from favorites` : `Bookmark ${prod.name} to favorites`}
                    className={`absolute top-0.5 right-0.5 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center transition-all duration-150 z-10 cursor-pointer active:scale-90`}
                    title={isFavorite(prod.id) ? 'Bookmarked in Favorites' : 'Bookmark to Favorites'}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs ${
                        isFavorite(prod.id)
                          ? 'bg-rose-50 text-rose-500 border border-rose-200'
                          : 'bg-white/90 backdrop-blur-xs text-slate-400 border border-slate-200/80 hover:text-rose-500'
                      }`}
                    >
                      {isFavorite(prod.id) ? (
                        <HeartFilled className="text-rose-500" style={{ fontSize: 11 }} />
                      ) : (
                        <HeartOutlined style={{ fontSize: 11 }} />
                      )}
                    </span>
                  </button>

                  {/* Price Tag Badge */}
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-[var(--tg-theme-bg-color,#ffffff)]/95 backdrop-blur-xs font-mono font-bold text-[length:var(--font-price)] text-[var(--tg-theme-button-color,#2F6FED)] shadow-xs border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
                    ${Number(prod.price).toFixed(2)}
                  </div>
                </div>

                {/* Product Title & Description */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailProduct(prod)}
                  className="pt-1.5 pb-1 space-y-0.5 cursor-pointer text-left"
                >
                  <h3 className="font-semibold text-[length:var(--font-title)] leading-tight text-[var(--tg-theme-text-color,#0f172a)] line-clamp-1 hover:text-[var(--tg-theme-button-color,#2F6FED)] transition">
                    <HighlightMatch text={prod.name} query={searchQuery} />
                  </h3>
                  <p className="text-[length:var(--font-small)] text-[var(--tg-theme-hint-color,#64748b)] line-clamp-1 leading-normal">
                    {prod.details || 'Handcrafted fresh daily.'}
                  </p>
                </div>

                {/* Card Action Buttons: Small "Detail" + "+ Add" */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setDetailProduct(prod)}
                    className="min-h-[30px] h-[30px] px-2 py-1 rounded-lg bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] hover:opacity-90 text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] text-[length:var(--font-small)] font-semibold text-center active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Detail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectAddToCart(prod)}
                    className="min-h-[30px] h-[30px] px-2 py-1 rounded-lg text-[length:var(--font-small)] font-bold text-center active:scale-95 transition cursor-pointer bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-xs flex items-center justify-center"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ============================================== */
          /* 4B. COMPACT LIST VIEW (NATIVE MOBILE APP)      */
          /* ============================================== */
          <div className="space-y-2">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                id={`product-${prod.id}`}
                className="bg-[var(--tg-theme-section-bg-color,#ffffff)] rounded-xl border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] p-2 flex items-center justify-between gap-2.5 shadow-2xs hover:shadow-xs transition"
              >
                {/* Left: Thumbnail (64x64) */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailProduct(prod)}
                  className="relative w-16 h-16 min-w-[64px] min-h-[64px] rounded-lg overflow-hidden bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] cursor-pointer shrink-0"
                >
                  {isImageDeleted(prod.id, currentSlug) ? (
                    <div className="w-full h-full bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-0.5 text-center">
                      <CameraOutlined style={{ fontSize: 14 }} />
                      <span className="text-[8px] font-bold mt-0.5">Deleted</span>
                    </div>
                  ) : (
                    <img
                      src={prod.image}
                      alt={prod.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          '/assets/uploads/no_image.png';
                      }}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Direct Delete Image Button in List View */}
                  {!isImageDeleted(prod.id, currentSlug) ? (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteProductImage(prod, e)}
                      className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded-sm bg-black/60 hover:bg-rose-600 backdrop-blur-xs text-white text-[8px] font-bold flex items-center gap-0.5 transition active:scale-90 z-10 cursor-pointer shadow-2xs"
                      title="Delete image directly"
                    >
                      <DeleteOutlined style={{ fontSize: 7 }} />
                      <span>Del</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleRestoreProductImage(prod, e)}
                      className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-bold flex items-center gap-0.5 transition active:scale-90 z-10 cursor-pointer shadow-2xs"
                      title="Restore product image"
                    >
                      <ReloadOutlined style={{ fontSize: 7 }} />
                      <span>Res</span>
                    </button>
                  )}
                </div>

                {/* Middle: Name, details, price */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailProduct(prod)}
                  className="flex-1 min-w-0 cursor-pointer text-left"
                >
                  <h3 className="font-semibold text-[length:var(--font-title)] text-[var(--tg-theme-text-color,#0f172a)] leading-tight truncate">
                    <HighlightMatch text={prod.name} query={searchQuery} />
                  </h3>
                  <p className="text-[length:var(--font-small)] text-[var(--tg-theme-hint-color,#64748b)] truncate pt-0.5">
                    {prod.details || 'Handcrafted fresh daily.'}
                  </p>
                  <div className="font-mono font-bold text-[length:var(--font-price)] text-[var(--tg-theme-button-color,#2F6FED)] pt-1">
                    ${Number(prod.price).toFixed(2)}
                  </div>
                </div>

                {/* Right: Actions (Favorites, Detail, Add) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic?.('light');
                      toggleFavorite(prod.id, prod.name, e);
                    }}
                    className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-lg flex items-center justify-center cursor-pointer transition active:scale-90 text-slate-400 hover:text-rose-500"
                    title={isFavorite(prod.id) ? 'Remove Favorite' : 'Add Favorite'}
                  >
                    {isFavorite(prod.id) ? (
                      <HeartFilled className="text-rose-500" style={{ fontSize: 13 }} />
                    ) : (
                      <HeartOutlined style={{ fontSize: 13 }} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailProduct(prod)}
                    className="min-h-[30px] h-[30px] px-2.5 py-1 rounded-lg bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] text-[length:var(--font-small)] font-semibold active:scale-95 transition cursor-pointer flex items-center justify-center"
                  >
                    Detail
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectAddToCart(prod)}
                    className="min-h-[30px] h-[30px] px-3 py-1 rounded-lg bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] text-[length:var(--font-small)] font-bold active:scale-95 transition cursor-pointer flex items-center justify-center shadow-xs"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 5. STICKY BOTTOM BAR FOR CART / CHECKOUT                 */}
      {/* ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-[1000] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-center pointer-events-none">
        <div className="w-full max-w-[430px] pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('medium');
              setIsCartOpen(true);
            }}
            className="w-full min-h-[46px] py-2.5 px-4 rounded-xl text-[var(--tg-theme-button-text-color,#ffffff)] bg-[var(--tg-theme-button-color,#2F6FED)] font-bold text-[14px] flex items-center justify-between shadow-lg shadow-black/10 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🛍️</span>
              <span className="text-[13px] sm:text-[14px]">View Basket ({totalItemCount})</span>
            </div>
            <span className="font-mono text-[14px] font-bold">${cartGrandTotal}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. LOCATION & BRANCH PICKER BOTTOM SHEET MODAL           */}
      {/* ======================================================== */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-3">
          <div className="w-full max-w-[430px] rounded-t-2xl sm:rounded-2xl p-4 space-y-3.5 bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#0f172a)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xl">
            {/* Sheet Handle */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-1 border-b border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
              <h3 className="font-bold text-[16px] text-[var(--tg-theme-text-color,#0f172a)]">
                Dining Location &amp; Branch
              </h3>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--tg-theme-hint-color,#64748b)] hover:text-[var(--tg-theme-text-color,#0f172a)]"
              >
                <CloseOutlined />
              </button>
            </div>

            {/* Dining Mode */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider">
                Dining Option
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[13px]">
                {[
                  { id: 'dine_in', label: '🍽️ Dine-in' },
                  { id: 'takeaway', label: '🛍️ Takeaway' },
                  { id: 'delivery', label: '🛵 Delivery' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDiningMode(mode.id)}
                    className={`min-h-[40px] py-2 px-2 rounded-xl font-semibold transition text-center cursor-pointer ${
                      diningMode === mode.id
                        ? 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-xs'
                        : 'bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] hover:opacity-90'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Number */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider">
                Table Number
              </span>
              <select
                value={customerLocation}
                onChange={(e) => setCustomerLocation(e.target.value)}
                className="w-full h-10 min-h-[40px] px-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] text-[13px] font-semibold text-[var(--tg-theme-text-color,#0f172a)] outline-none focus:border-[var(--tg-theme-button-color,#2F6FED)]"
              >
                {[
                  'Table #01',
                  'Table #02',
                  'Table #06',
                  'Table #08',
                  'Table #12 (Window)',
                  'Terrace #03',
                  'Bar Counter',
                  'VIP Lounge',
                ].map((t) => (
                  <option key={t} value={t} className="bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#0f172a)]">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Switch Store / Branch */}
            <div className="space-y-1 pt-1.5 border-t border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider">
                  Switch Store
                </span>
                <div className="flex items-center p-0.5 bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] rounded-lg text-[10.5px] font-bold">
                  <button
                    type="button"
                    onClick={() => setStoreSwitchScope('owner')}
                    className={`min-h-[28px] px-2 py-0.5 rounded-md transition cursor-pointer ${
                      storeSwitchScope === 'owner' ? 'bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-button-color,#2F6FED)] shadow-2xs' : 'text-[var(--tg-theme-hint-color,#64748b)]'
                    }`}
                  >
                    {currentStoreOwner === 'Yin' ? 'Yin (2)' : `${currentStoreOwner.split(' ')[0]}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreSwitchScope('all')}
                    className={`min-h-[28px] px-2 py-0.5 rounded-md transition cursor-pointer ${
                      storeSwitchScope === 'all' ? 'bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-button-color,#2F6FED)] shadow-2xs' : 'text-[var(--tg-theme-hint-color,#64748b)]'
                    }`}
                  >
                    8 Stores
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[12px] max-h-48 overflow-y-auto pr-0.5 scrollbar-thin">
                {storeOptions.map((st) => (
                  <button
                    key={st.slug}
                    type="button"
                    onClick={() => {
                      setIsLocationModalOpen(false);
                      if (st.slug !== currentSlug) {
                        navigate(`/shop/${st.slug}`);
                        message.success(`Switched store to ${st.fullName || st.name}!`);
                      }
                    }}
                    className={`min-h-[42px] p-2 rounded-xl font-semibold text-left transition flex items-center justify-between gap-1 cursor-pointer active:scale-95 ${
                      currentSlug === st.slug
                        ? 'bg-blue-50/80 text-[var(--tg-theme-button-color,#2F6FED)] border border-[var(--tg-theme-button-color,#2F6FED)]/40 shadow-2xs'
                        : 'bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">{st.emoji}</span>
                      <div className="truncate">
                        <span className="block truncate text-[12px]">{st.name}</span>
                        {storeSwitchScope === 'all' && (
                          <span className="block text-[9.5px] text-[var(--tg-theme-hint-color,#64748b)] truncate">
                            {st.owner}
                          </span>
                        )}
                      </div>
                    </div>
                    {currentSlug === st.slug && (
                      <span className="text-[10px] text-[var(--tg-theme-button-color,#2F6FED)] font-bold shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Telegram Mini App Link */}
            <div className="pt-1 border-t border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
              <div
                onClick={() => {
                  const link = `https://t.me/aura_emenu_order_bot/menu?startapp=shop_${currentSlug}`;
                  navigator.clipboard.writeText(link);
                  message.success('Copied link: ' + link);
                }}
                className="min-h-[40px] p-2 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-between text-[12px] cursor-pointer hover:opacity-90 transition active:scale-98"
              >
                <span className="text-[var(--tg-theme-button-color,#2F6FED)] font-medium text-[11px] truncate max-w-[260px]">
                  Mini App Link ({currentStore?.name || currentSlug})
                </span>
                <span className="text-[10.5px] font-bold text-[var(--tg-theme-text-color,#0f172a)] shrink-0 ml-1.5 bg-[var(--tg-theme-bg-color,#ffffff)] px-2 py-0.5 rounded border border-[var(--tg-theme-secondary-bg-color,#cbd5e1)]">
                  Copy
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLocationModalOpen(false)}
              className="w-full min-h-[42px] py-2 rounded-xl text-[13px] font-bold bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-xs transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. PRODUCT CUSTOMIZER BOTTOM SHEET ("Opt")               */}
      {/* ======================================================== */}
      {customizingProduct && (
        <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-3">
          <div className="w-full max-w-[430px] rounded-t-2xl sm:rounded-2xl p-4 space-y-3.5 bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#0f172a)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Sheet Handle */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-1.5 border-b border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
              <h3 className="font-bold text-[16px] text-[var(--tg-theme-text-color,#0f172a)]">
                Customize Item
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    triggerHaptic?.('light');
                    toggleFavorite(customizingProduct.id, customizingProduct.name, e);
                  }}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition cursor-pointer"
                  title={isFavorite(customizingProduct.id) ? 'Bookmarked in Favorites' : 'Bookmark to Favorites'}
                >
                  {isFavorite(customizingProduct.id) ? (
                    <HeartFilled className="text-rose-500 text-sm" />
                  ) : (
                    <HeartOutlined className="text-sm text-[var(--tg-theme-hint-color,#64748b)]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizingProduct(null)}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--tg-theme-hint-color,#64748b)] hover:text-[var(--tg-theme-text-color,#0f172a)]"
                >
                  <CloseOutlined />
                </button>
              </div>
            </div>

            {/* Product Summary Header */}
            <div className="flex items-center justify-between gap-2.5 p-2.5 bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] rounded-xl border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
              <div className="flex items-center gap-2.5 min-w-0">
                {isImageDeleted(customizingProduct.id, currentSlug) ? (
                  <div className="w-12 h-12 rounded-lg bg-slate-200 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 select-none">
                    <CameraOutlined style={{ fontSize: 14 }} />
                    <span className="text-[8px] font-bold mt-0.5">Deleted</span>
                  </div>
                ) : (
                  <img
                    src={customizingProduct.image}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        '/assets/uploads/no_image.png';
                    }}
                    className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-100"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-[14px] text-[var(--tg-theme-text-color,#0f172a)] truncate">
                    {customizingProduct.name}
                  </h4>
                  <span className="font-mono text-[14px] font-bold text-[var(--tg-theme-button-color,#2F6FED)]">
                    Base: ${Number(customizingProduct.price).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Direct Image Delete / Restore Action */}
              <div className="shrink-0">
                {!isImageDeleted(customizingProduct.id, currentSlug) ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteProductImage(customizingProduct)}
                    className="min-h-[34px] px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs"
                    title="Delete image directly"
                  >
                    <DeleteOutlined style={{ fontSize: 10 }} />
                    <span>Del Img</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRestoreProductImage(customizingProduct)}
                    className="min-h-[34px] px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[var(--tg-theme-button-color,#2F6FED)] border border-blue-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs"
                    title="Restore image"
                  >
                    <ReloadOutlined style={{ fontSize: 10 }} />
                    <span>Restore</span>
                  </button>
                )}
              </div>
            </div>

            {/* Portion / Size */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider block">
                Portion / Size
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                {['Regular (12oz)', 'Large (16oz) (+$0.75)'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-h-[40px] py-2 px-2 rounded-xl font-semibold transition text-center cursor-pointer ${
                      selectedSize === size
                        ? 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-xs'
                        : 'bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] hover:opacity-90'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Milk / Base */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider block">
                Artisan Milk
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                {['Fresh Cow Milk', 'Oat Milk (+$0.60)', 'Almond Milk (+$0.60)', 'Skim Milk'].map((milk) => (
                  <button
                    key={milk}
                    type="button"
                    onClick={() => setSelectedMilk(milk)}
                    className={`min-h-[40px] py-2 px-2 rounded-xl font-semibold transition text-center cursor-pointer ${
                      selectedMilk === milk
                        ? 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-xs'
                        : 'bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] hover:opacity-90'
                    }`}
                  >
                    {milk}
                  </button>
                ))}
              </div>
            </div>

            {/* Ice & Temperature */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider block">
                Ice &amp; Temp
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[12px]">
                {['Hot', 'Less Ice', 'Normal Ice'].map((ice) => (
                  <button
                    key={ice}
                    type="button"
                    onClick={() => setSelectedIce(ice)}
                    className={`min-h-[40px] py-2 px-2 rounded-xl font-semibold transition text-center cursor-pointer ${
                      selectedIce === ice
                        ? 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-xs'
                        : 'bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] hover:opacity-90'
                    }`}
                  >
                    {ice}
                  </button>
                ))}
              </div>
            </div>

            {/* Chef Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider block">
                Barista / Chef Notes
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Extra hot, no sugar..."
                className="w-full h-10 min-h-[40px] px-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] text-[13px] text-[var(--tg-theme-text-color,#0f172a)] placeholder:text-[var(--tg-theme-hint-color,#94a3b8)] outline-none focus:border-[var(--tg-theme-button-color,#2F6FED)]"
              />
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[13px] font-bold text-[var(--tg-theme-text-color,#0f172a)]">Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizeQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-center font-bold text-[var(--tg-theme-text-color,#0f172a)] active:scale-95 transition cursor-pointer"
                >
                  <MinusOutlined style={{ fontSize: 11 }} />
                </button>
                <span className="font-mono font-bold text-[14px] text-[var(--tg-theme-text-color,#0f172a)] w-7 text-center">
                  {customizeQty}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomizeQty((q) => q + 1)}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-center font-bold text-[var(--tg-theme-text-color,#0f172a)] active:scale-95 transition cursor-pointer"
                >
                  <PlusOutlined style={{ fontSize: 11 }} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddCustomizedToCart}
              className="w-full min-h-[44px] py-2.5 rounded-xl text-[13px] font-bold shadow-sm cursor-pointer bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] transition active:scale-[0.98]"
            >
              Add to Basket
            </button>

            {/* Direct Item Link */}
            <div className="pt-0.5 text-center">
              <button
                type="button"
                onClick={() => {
                  const itemLink = `https://t.me/aura_emenu_order_bot/menu?startapp=item_${customizingProduct.id}`;
                  navigator.clipboard.writeText(itemLink);
                  message.success('Copied Direct Item Link: ' + itemLink);
                }}
                className="text-[11px] text-[var(--tg-theme-hint-color,#64748b)] hover:text-[var(--tg-theme-button-color,#2F6FED)] transition cursor-pointer"
              >
                🔗 Copy Direct Item Link: <span className="font-mono font-bold">item_{customizingProduct.id}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. BASKET & CHECKOUT BOTTOM SHEET DRAWER                 */}
      {/* ======================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-3">
          <div className="w-full max-w-[430px] rounded-t-2xl sm:rounded-2xl p-4 space-y-3.5 bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#0f172a)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xl max-h-[88vh] flex flex-col justify-between">
            {/* Sheet Handle */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shrink-0">
              <h3 className="font-bold text-[16px] text-[var(--tg-theme-text-color,#0f172a)]">
                Your Basket ({totalItemCount})
              </h3>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--tg-theme-hint-color,#64748b)] hover:text-[var(--tg-theme-text-color,#0f172a)]"
              >
                <CloseOutlined />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-1.5">
                  <span className="text-3xl block">🛍️</span>
                  <p className="font-bold text-[14px] text-[var(--tg-theme-text-color,#0f172a)]">
                    Your basket is empty
                  </p>
                  <p className="text-[12px] text-[var(--tg-theme-hint-color,#64748b)]">
                    Add menu items to place an order.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-between gap-2.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={item.image}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              '/assets/uploads/no_image.png';
                          }}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-200"
                        />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-[13px] sm:text-[14px] text-[var(--tg-theme-text-color,#0f172a)] leading-tight truncate">
                            {item.name}
                          </h4>
                          <span className="text-[13px] font-mono font-bold text-[var(--tg-theme-button-color,#2F6FED)]">
                            ${item.price.toFixed(2)}
                          </span>
                          {item.options && Object.keys(item.options).length > 0 && (
                            <p className="text-[10.5px] text-[var(--tg-theme-hint-color,#64748b)] truncate">
                              {Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper with 40px Hit Targets */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(idx, -1)}
                          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-[var(--tg-theme-bg-color,#ffffff)] border border-[var(--tg-theme-secondary-bg-color,#cbd5e1)] flex items-center justify-center font-bold text-[14px] text-[var(--tg-theme-text-color,#0f172a)] active:scale-90 transition"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-[13px] w-6 text-center text-[var(--tg-theme-text-color,#0f172a)]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(idx, 1)}
                          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-[var(--tg-theme-bg-color,#ffffff)] border border-[var(--tg-theme-secondary-bg-color,#cbd5e1)] flex items-center justify-center font-bold text-[14px] text-[var(--tg-theme-text-color,#0f172a)] active:scale-90 transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* VIP 20% Discount */}
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[9.5px] font-bold uppercase text-[var(--tg-theme-button-color,#2F6FED)]">
                        Promo Code: FIRST20
                      </span>
                      <p className="text-[12px] font-semibold text-[var(--tg-theme-text-color,#0f172a)]">
                        20% VIP Order Discount
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setHasClaimedCoupon(!hasClaimedCoupon);
                        message.info(hasClaimedCoupon ? 'Coupon removed' : '20% discount applied!');
                      }}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer transition active:scale-95 ${
                        hasClaimedCoupon
                          ? 'bg-emerald-500 text-white font-bold'
                          : 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] hover:opacity-90'
                      }`}
                    >
                      {hasClaimedCoupon ? 'Claimed ✓' : 'Apply'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary & Submit */}
            {cart.length > 0 && (
              <div className="pt-2 border-t border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] space-y-2.5 shrink-0">
                <div className="space-y-1 text-[13px]">
                  <div className="flex justify-between text-[var(--tg-theme-hint-color,#64748b)]">
                    <span>Subtotal:</span>
                    <span className="font-mono text-[var(--tg-theme-text-color,#0f172a)] font-semibold">
                      ${cartSubtotal.toFixed(2)}
                    </span>
                  </div>
                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold text-[13px]">
                      <span>Discount (20%):</span>
                      <span className="font-mono">-${cartDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-[var(--tg-theme-hint-color,#64748b)] text-[13px]">
                      <span>Delivery ({customerLocation}):</span>
                      <span className="font-mono text-[var(--tg-theme-text-color,#0f172a)] font-semibold">
                        ${deliveryFee.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[14px] font-bold pt-1 border-t border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] text-[var(--tg-theme-text-color,#0f172a)]">
                    <span>Total Amount:</span>
                    <span className="font-mono text-[14px] font-bold text-[var(--tg-theme-button-color,#2F6FED)]">
                      ${cartGrandTotal}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmittingOrder}
                  onClick={handleConfirmOrder}
                  className="w-full min-h-[46px] py-2.5 rounded-xl text-[13px] sm:text-[14px] font-bold shadow-md cursor-pointer bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] transition active:scale-[0.98]"
                >
                  {isSubmittingOrder ? 'Sending to Kitchen...' : `Place Order ($${cartGrandTotal})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* 8. TAOBAO-STYLE PRODUCT DETAIL MODAL (TELEGRAM MINI APP) */}
      {/* ======================================================== */}
      <ProductDetailModal
        open={Boolean(detailProduct)}
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={handleAddToCartFromDetail}
        onBuyNow={handleBuyNowFromDetail}
        triggerHaptic={triggerHaptic}
      />
    </div>
  );
}
