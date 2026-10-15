import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeftOutlined,
  CloseOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  MessageOutlined,
  StarFilled,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  CarOutlined,
  ClockCircleOutlined,
  RightOutlined,
  PlusOutlined,
  MinusOutlined,
  PlayCircleFilled,
  EyeOutlined,
  ThunderboltFilled,
  CompassOutlined,
  FileTextOutlined,
  LikeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { formatCurrency } from '../../utils/webTheme';
import { isImageDeleted, deleteProductImage, restoreProductImage } from '../../data/menuImageManager';

/**
 * Flexible Product Normalizer
 * Enriches any product object (food, drink, clothing, mobile, PC, gadget, etc.)
 * with comprehensive Taobao-style product details, gallery, SKU variants,
 * specifications, delivery policies, shop details, and customer reviews.
 */
export function normalizeTaobaoProduct(rawProduct) {
  if (!rawProduct) return null;

  const id = rawProduct.id || 'prod-item-1';
  const name = rawProduct.name || rawProduct.title || 'Specialty Artisan Item';
  const price = Number(rawProduct.price || 9.99);
  const originalPrice = Number(rawProduct.originalPrice || (price * 1.25).toFixed(2));
  const discountPercent = Math.max(5, Math.round(((originalPrice - price) / originalPrice) * 100));

  const category = (rawProduct.category || '').toLowerCase();
  const subcategory = (rawProduct.subcategory || '').toLowerCase();
  const rawDesc = rawProduct.description || rawProduct.details || 'Premium handcrafted item made with the finest sourced materials.';

  // 1. Gallery Images & Video
  let images = [];
  if (Array.isArray(rawProduct.images) && rawProduct.images.length > 0) {
    images = rawProduct.images.filter(Boolean);
  } else if (rawProduct.image) {
    images = [rawProduct.image];
  }
  if (images.length === 0) {
    images = ['/assets/uploads/no_image.png'];
  }

  // Optional video preview URL
  const videoUrl = rawProduct.video || null;

  // 2. Product Category Specific Variants (SKU structure)
  const isFoodDrink = category.includes('coffee') || category.includes('bakery') || category.includes('dining') || rawProduct.biller_id || rawProduct.category_id;
  const isFashion = category.includes('fashion') || category.includes('apparel');
  const isTech = category.includes('smartphones') || category.includes('computers') || category.includes('equipment');

  let variantGroups = [];

  if (isFoodDrink) {
    variantGroups = [
      {
        name: 'Size / Portion',
        options: [
          { name: 'Regular (12oz)', priceDelta: 0, inStock: true },
          { name: 'Large (16oz)', priceDelta: 0.75, inStock: true },
          { name: 'Pitcher / Sharing', priceDelta: 3.50, inStock: false },
        ],
      },
      {
        name: 'Artisan Milk',
        options: [
          { name: 'Fresh Cow Milk', priceDelta: 0, inStock: true },
          { name: 'Oat Milk (+0.60)', priceDelta: 0.60, inStock: true },
          { name: 'Almond Milk (+0.60)', priceDelta: 0.60, inStock: true },
          { name: 'Soy Milk', priceDelta: 0.50, inStock: true },
        ],
      },
      {
        name: 'Ice & Temperature',
        options: [
          { name: 'Normal Ice', priceDelta: 0, inStock: true },
          { name: 'Less Ice', priceDelta: 0, inStock: true },
          { name: 'Hot (Steamed)', priceDelta: 0, inStock: true },
        ],
      },
    ];
  } else if (isFashion) {
    variantGroups = [
      {
        name: 'Color Selection',
        options: [
          { name: 'Obsidian Black', priceDelta: 0, inStock: true, image: images[0] },
          { name: 'Titanium Slate', priceDelta: 0, inStock: true, image: images[1] || images[0] },
          { name: 'Warm Cream', priceDelta: 0, inStock: true, image: images[2] || images[0] },
          { name: 'Vintage Indigo', priceDelta: 5.0, inStock: false },
        ],
      },
      {
        name: 'Size',
        options: [
          { name: 'S (38)', priceDelta: 0, inStock: true },
          { name: 'M (40)', priceDelta: 0, inStock: true },
          { name: 'L (42)', priceDelta: 0, inStock: true },
          { name: 'XL (44)', priceDelta: 0, inStock: true },
          { name: 'XXL (46)', priceDelta: 2.0, inStock: false },
        ],
      },
    ];
  } else if (isTech) {
    variantGroups = [
      {
        name: 'Storage & Configuration',
        options: [
          { name: '256GB Standard', priceDelta: 0, inStock: true },
          { name: '512GB High Speed', priceDelta: 150, inStock: true },
          { name: '1TB Pro Max Edition', priceDelta: 320, inStock: true },
          { name: '2TB Studio Liquid', priceDelta: 600, inStock: false },
        ],
      },
      {
        name: 'Color Finish',
        options: [
          { name: 'Desert Titanium', priceDelta: 0, inStock: true, image: images[0] },
          { name: 'Natural Titanium', priceDelta: 0, inStock: true, image: images[1] || images[0] },
          { name: 'Black Titanium', priceDelta: 0, inStock: true, image: images[2] || images[0] },
        ],
      },
    ];
  } else {
    variantGroups = [
      {
        name: 'Option Type',
        options: [
          { name: 'Standard Edition', priceDelta: 0, inStock: true },
          { name: 'Premium Bundle (+Gift)', priceDelta: 4.50, inStock: true },
          { name: 'Limited Collector Edition', priceDelta: 12.00, inStock: false },
        ],
      },
    ];
  }

  // 3. Specifications Table Key-Values
  const specifications = [
    { label: 'Brand / Roaster', value: rawProduct.seller || rawProduct.brand || 'Aura Specialty Official' },
    { label: 'Product Code', value: rawProduct.code || `SKU-${id.replace('prod-', '').toUpperCase()}` },
    { label: 'Category', value: rawProduct.category || 'Specialty & Lifestyle' },
    { label: 'Origin', value: isFoodDrink ? 'Highland Estate (1,600m ASL)' : isFashion ? 'Okayama, Japan' : 'Cupertino / Global' },
    { label: 'Net Content / Weight', value: isFoodDrink ? '350ml / 12 fl oz' : isFashion ? '320 GSM Heavyweight' : '221 grams' },
    { label: 'Certification', value: 'ISO 22000 & Organic Certified' },
    { label: 'Shelf Life / Warranty', value: isFoodDrink ? 'Consume fresh within 2 hours' : '12 Months Official Brand Warranty' },
  ];

  // 4. Shop info
  const shopName = rawProduct.storeName || (rawProduct.seller ? rawProduct.seller.replace('-', ' ').toUpperCase() : 'Aura Flagship Store');
  const shop = {
    name: shopName,
    logo: rawProduct.storeLogo || null,
    rating: 4.96,
    followers: '28.4k',
    totalSales: '142k+ items',
    badge: 'Official Brand Partner',
  };

  // 5. Authentic Reviews
  const reviewsList = Array.isArray(rawProduct.reviewsList) && rawProduct.reviewsList.length > 0
    ? rawProduct.reviewsList
    : [];

  return {
    ...rawProduct,
    id,
    name,
    price,
    originalPrice,
    discountPercent,
    images,
    videoUrl,
    description: rawDesc,
    variantGroups,
    specifications,
    shop,
    reviewsList,
    rating: rawProduct.rating || 4.9,
    salesCount: rawProduct.reviews ? `${rawProduct.reviews * 18}+ sold` : '850+ sold',
    stockCount: rawProduct.inStock === false ? 0 : 54,
    tags: rawProduct.tags || ['Free Shipping', 'Best Seller', 'Official Store', 'Authentic'],
  };
}

/**
 * TaobaoProductDetail
 * Complete Taobao-style product detail screen.
 * - Mobile-first: Fits small phones (320px–430px) without horizontal scrolling
 * - Desktop: Automatically expands cleanly into a rich 2-column layout (gallery left, specs right)
 * - Supports Telegram theme variables for light and dark modes
 */
export default function TaobaoProductDetail({
  product: initialProduct,
  onClose,
  onAddToCart,
  onBuyNow,
  isModal = false,
  triggerHaptic,
}) {
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const { wishlist, toggleWishlist } = useWishlist();
  const { totalItems = 0 } = useCart();

  // Normalized product
  const product = useMemo(() => normalizeTaobaoProduct(initialProduct), [initialProduct]);

  if (!product) return null;

  // Active Gallery Slide & Video playing state
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState(product.images[0]);
  const [deliveryMethod, setDeliveryMethod] = useState('delivery'); // 'delivery' | 'pickup'
  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);
  const [mediaVersion, setMediaVersion] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const handler = () => setMediaVersion((v) => v + 1);
    window.addEventListener('aura_menu_image_updated', handler);
    return () => window.removeEventListener('aura_menu_image_updated', handler);
  }, []);

  const storeSlug = product.shopSlug || product.storeSlug || product.shopId || 'sbc-store';
  const isCurrentImageDeleted = isImageDeleted(product.id, storeSlug);

  // Touch Swipe tracking for Gallery Carousel
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartXRef.current - touchEndX;
    const diffY = touchStartYRef.current - touchEndY;

    // Detect horizontal swipe if delta X > delta Y and delta X > 35px
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        // Swiped left -> next slide
        triggerHaptic?.('light');
        setActiveSlide((prev) => (prev + 1) % product.images.length);
        setIsVideoPlaying(false);
      } else {
        // Swiped right -> prev slide
        triggerHaptic?.('light');
        setActiveSlide((prev) => (prev - 1 + product.images.length) % product.images.length);
        setIsVideoPlaying(false);
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // SKU / Variant Selection state
  const [selectedVariants, setSelectedVariants] = useState(() => {
    const initial = {};
    product.variantGroups.forEach((grp, idx) => {
      // Pick first available in-stock option
      const firstAvailable = grp.options.find((o) => o.inStock) || grp.options[0];
      initial[grp.name] = firstAvailable?.name || '';
    });
    return initial;
  });

  const [quantity, setQuantity] = useState(1);
  const [isSkuDrawerOpen, setIsSkuDrawerOpen] = useState(false);
  const [skuDrawerAction, setSkuDrawerAction] = useState('cart'); // 'cart' | 'buy'
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'specs' | 'reviews' | 'recommended'
  const [isFavorite, setIsFavorite] = useState(() => {
    if (Array.isArray(wishlist)) {
      return wishlist.some((w) => String(w.id) === String(product.id));
    }
    return false;
  });

  // Calculate dynamic price based on selected SKU options
  const dynamicPrice = useMemo(() => {
    let delta = 0;
    product.variantGroups.forEach((grp) => {
      const selectedName = selectedVariants[grp.name];
      const opt = grp.options.find((o) => o.name === selectedName);
      if (opt && opt.priceDelta) delta += Number(opt.priceDelta);
    });
    return Number((product.price + delta).toFixed(2));
  }, [product.price, product.variantGroups, selectedVariants]);

  // Dynamic preview image if variant has image attached
  const currentPreviewImage = useMemo(() => {
    for (const grp of product.variantGroups) {
      const selectedName = selectedVariants[grp.name];
      const opt = grp.options.find((o) => o.name === selectedName);
      if (opt && opt.image) return opt.image;
    }
    return product.images[activeSlide] || product.images[0];
  }, [product.images, activeSlide, product.variantGroups, selectedVariants]);

  // Handle SKU Option Click
  const handleSelectOption = (groupName, option) => {
    if (!option.inStock) return;
    triggerHaptic?.('light');
    setSelectedVariants((prev) => ({
      ...prev,
      [groupName]: option.name,
    }));
    if (option.image) {
      const idx = product.images.indexOf(option.image);
      if (idx >= 0) setActiveSlide(idx);
    }
  };

  // Toggle Favorite
  const handleToggleFav = (e) => {
    e?.stopPropagation?.();
    triggerHaptic?.('medium');
    setIsFavorite((prev) => !prev);
    toggleWishlist?.(product);
    message.success(!isFavorite ? 'Saved to Favorites ❤️' : 'Removed from Favorites');
  };

  // Share Product Link
  const handleShare = () => {
    triggerHaptic?.('light');
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      message.success('Product link copied to clipboard! 🔗');
    }
  };

  // Open SKU Drawer for "Add to Cart" or "Buy Now"
  const handleOpenSkuDrawer = (action = 'cart') => {
    triggerHaptic?.('light');
    setSkuDrawerAction(action);
    setIsSkuDrawerOpen(true);
  };

  // Confirm SKU Selection and Execute Action
  const handleConfirmSkuAction = () => {
    triggerHaptic?.('success');
    const orderItem = {
      ...product,
      price: dynamicPrice,
      quantity,
      selectedVariants,
      image: currentPreviewImage,
      subtotal: Number((dynamicPrice * quantity).toFixed(2)),
    };

    if (skuDrawerAction === 'buy') {
      onBuyNow?.(orderItem);
      message.success(`Proceeding to checkout with ${quantity}x "${product.name}"!`);
    } else {
      onAddToCart?.(orderItem);
      message.success(`Added ${quantity}x "${product.name}" to Cart! 🛍️`);
    }

    setIsSkuDrawerOpen(false);
  };

  // Scroll to section tab
  const handleTabChange = (tabKey) => {
    triggerHaptic?.('light');
    setActiveTab(tabKey);
    const targetEl = document.getElementById(`taobao-tab-${tabKey}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      style={{
        background: 'var(--tg-theme-bg-color, #ffffff)',
        color: 'var(--tg-theme-text-color, #0f172a)',
      }}
      className={`w-full min-h-screen flex flex-col font-sans relative pb-20 selection:bg-[var(--tg-theme-button-color,#2F6FED)] selection:text-white ${
        isModal ? 'max-w-[430px] mx-auto' : 'w-full'
      }`}
    >
      {/* ======================================================== */}
      {/* 1. TOP FLOATING NAVIGATION BAR (Desktop & Mobile Header) */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 px-3 py-2 flex items-center justify-between bg-[var(--tg-theme-bg-color,#ffffff)]/90 backdrop-blur-md border-b border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]/70">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              if (onClose) onClose();
              else navigate(-1);
            }}
            aria-label="Back"
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] hover:opacity-90 flex items-center justify-center text-[var(--tg-theme-text-color,#0f172a)] transition active:scale-95 cursor-pointer border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]"
          >
            {isModal ? <CloseOutlined style={{ fontSize: 13 }} /> : <ArrowLeftOutlined style={{ fontSize: 13 }} />}
          </button>
          <span className="text-[13px] font-bold text-[var(--tg-theme-text-color,#0f172a)] truncate max-w-[200px] xs:max-w-[260px]">
            {product.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share product"
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] hover:opacity-90 flex items-center justify-center text-[var(--tg-theme-text-color,#0f172a)] transition active:scale-95 cursor-pointer border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]"
            title="Share Product"
          >
            <ShareAltOutlined style={{ fontSize: 13 }} />
          </button>

          {/* Cart Icon with Live Badge */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              navigate('/cart');
            }}
            aria-label="View Cart"
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] hover:opacity-90 flex items-center justify-center text-[var(--tg-theme-text-color,#0f172a)] transition active:scale-95 cursor-pointer relative border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]"
            title="View Cart"
          >
            <ShoppingCartOutlined style={{ fontSize: 14 }} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* DESKTOP 2-COLUMN vs MOBILE 1-COLUMN WRAPPER              */}
      {/* ======================================================== */}
      <div className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 lg:gap-8 lg:p-6">
        {/* ====================================================== */}
        {/* LEFT COLUMN (ON DESKTOP): IMAGE GALLERY & STORY        */}
        {/* ====================================================== */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          {/* Main Gallery Carousel with Touch Swiping */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative w-full aspect-square bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] overflow-hidden lg:rounded-2xl shadow-2xs select-none touch-pan-y"
          >
            {/* Slide: Video vs Image */}
            {activeSlide === 0 && isVideoPlaying && product.videoUrl ? (
              <div className="w-full h-full relative bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={product.videoUrl}
                  autoPlay
                  controls
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setIsVideoPlaying(false)}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold z-20 backdrop-blur-xs cursor-pointer active:scale-95"
                >
                  ✕ Close Video
                </button>
              </div>
            ) : isCurrentImageDeleted ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-6 text-center select-none">
                <CameraOutlined style={{ fontSize: 36 }} className="text-slate-400 mb-2" />
                <span className="text-sm font-bold text-slate-600">Product Image Deleted</span>
                <span className="text-xs text-slate-400 mt-1">Image removed from digital menu & synced with store manager</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    restoreProductImage(product.id, storeSlug);
                    message.success(`Restored image for "${product.name}"!`);
                  }}
                  className="mt-3.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <ReloadOutlined style={{ fontSize: 11 }} />
                  <span>Restore Image</span>
                </button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setZoomImage(currentPreviewImage);
                  setIsZoomOpen(true);
                }}
                className="w-full h-full cursor-zoom-in group relative"
              >
                <img
                  src={currentPreviewImage}
                  alt={product.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/uploads/no_image.png';
                  }}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                />

                {/* Direct Delete Image Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProductImage(product.id, storeSlug, product.name, currentPreviewImage);
                    message.success(`Deleted image for "${product.name}" from E-Menu!`);
                  }}
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 backdrop-blur-xs transition z-20 cursor-pointer shadow-sm active:scale-95"
                  title="Delete image directly"
                >
                  <DeleteOutlined style={{ fontSize: 10 }} />
                  <span>Del Image</span>
                </button>

                {/* Video Play Pill Button overlay on slide 0 */}
                {activeSlide === 0 && product.videoUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoPlaying(true);
                    }}
                    className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md backdrop-blur-xs transition active:scale-95 cursor-pointer z-10"
                  >
                    <PlayCircleFilled className="text-amber-400 text-sm" />
                    <span>Watch Video Demo</span>
                  </button>
                )}

                {/* Floating Tap to Zoom Indicator */}
                <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <EyeOutlined />
                </div>
              </div>
            )}

            {/* Bottom-Right Counter (Taobao signature e.g. 1/6) */}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white font-mono text-[11px] font-bold backdrop-blur-xs shadow-xs pointer-events-none z-10">
              {activeSlide + 1} / {product.images.length}
            </div>

            {/* Subtle swipe direction hints on left/right for desktop hover */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic?.('light');
                    setActiveSlide((prev) => (prev - 1 + product.images.length) % product.images.length);
                    setIsVideoPlaying(false);
                  }}
                  className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 text-white items-center justify-center transition active:scale-90 z-10 cursor-pointer backdrop-blur-xs"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic?.('light');
                    setActiveSlide((prev) => (prev + 1) % product.images.length);
                    setIsVideoPlaying(false);
                  }}
                  className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 text-white items-center justify-center transition active:scale-90 z-10 cursor-pointer backdrop-blur-xs"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Row */}
          <div className="px-3 lg:px-0 flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  triggerHaptic?.('light');
                  setActiveSlide(idx);
                  setIsVideoPlaying(false);
                }}
                className={`relative w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl overflow-hidden border-2 transition active:scale-95 cursor-pointer shrink-0 ${
                  activeSlide === idx
                    ? 'border-[var(--tg-theme-button-color,#2F6FED)] shadow-xs scale-102'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
                {idx === 0 && product.videoUrl && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/75 text-amber-300 text-[8px] font-black text-center py-0.5">
                    VIDEO
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: PRICE, SKU, DELIVERY, DETAILS, REVIEWS   */}
        {/* ====================================================== */}
        <div className="lg:col-span-6 flex flex-col space-y-3.5 px-3 lg:px-0 pt-2 lg:pt-0">
          {/* ==================================================== */}
          {/* 2. PRICE & TITLE SECTION                             */}
          {/* ==================================================== */}
          <div className="p-3.5 rounded-2xl bg-[var(--tg-theme-section-bg-color,#ffffff)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xs space-y-2">
            {/* Price Row with Old Price and Discount */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[length:var(--font-small)] font-bold text-rose-500 font-mono">$</span>
              <span className="font-mono font-bold text-[length:var(--font-price)] text-rose-600 leading-none">
                {dynamicPrice.toFixed(2)}
              </span>
              <span className="font-mono text-[length:var(--font-small)] text-slate-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[length:var(--font-small)] font-black bg-rose-500 text-white shadow-2xs">
                -{product.discountPercent}% OFF
              </span>
            </div>

            {/* Product Title (Max 2 lines) */}
            <h1 className="font-bold text-[length:var(--font-title)] text-[var(--tg-theme-text-color,#0f172a)] leading-snug line-clamp-2">
              {product.name}
            </h1>

            {/* Tags Ribbon */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {product.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[length:var(--font-small)] font-semibold bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] text-[var(--tg-theme-button-color,#2F6FED)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats: Sales count, Rating, Stock */}
            <div className="flex items-center justify-between text-[length:var(--font-small)] text-[var(--tg-theme-hint-color,#64748b)] pt-2 border-t border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
              <div className="flex items-center gap-1">
                <StarFilled className="text-amber-400 text-xs" />
                <span className="font-bold text-[var(--tg-theme-text-color,#0f172a)]">{product.rating}</span>
                <span>({product.reviewsList.length * 40}+ reviews)</span>
              </div>
              <div>Sales: <strong className="text-[var(--tg-theme-text-color,#0f172a)] font-mono">{product.salesCount}</strong></div>
              <div>Stock: <strong className="text-emerald-600 font-bold">{product.stockCount > 0 ? `${product.stockCount} in stock` : 'Out of stock'}</strong></div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* 3. VARIANTS / SKU SELECTOR CARD                      */}
          {/* ==================================================== */}
          <div className="p-3.5 rounded-2xl bg-[var(--tg-theme-section-bg-color,#ffffff)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[length:var(--font-title)] font-bold text-[var(--tg-theme-text-color,#0f172a)] uppercase tracking-wider">
                Select Variants &amp; Options
              </span>
              <span className="text-[length:var(--font-small)] text-[var(--tg-theme-button-color,#2F6FED)] font-semibold">
                Selected: {Object.values(selectedVariants).filter(Boolean).join(', ')}
              </span>
            </div>

            {/* Variant Option Groups */}
            {product.variantGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <span className="text-[length:var(--font-small)] font-bold text-[var(--tg-theme-hint-color,#64748b)]">
                  {group.name}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {group.options.map((opt, oIdx) => {
                    const isSelected = selectedVariants[group.name] === opt.name;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        disabled={!opt.inStock}
                        onClick={() => handleSelectOption(group.name, opt)}
                        className={`min-h-[36px] px-2.5 py-1 rounded-xl text-[length:var(--font-base)] font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                          !opt.inStock
                            ? 'bg-slate-100 text-slate-400 line-through opacity-50 cursor-not-allowed border border-dashed border-slate-200'
                            : isSelected
                            ? 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] font-semibold shadow-2xs border border-transparent'
                            : 'bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] hover:opacity-90'
                        }`}
                      >
                        {opt.image && (
                          <img src={opt.image} alt="" className="w-4 h-4 rounded object-cover" />
                        )}
                        <span>{opt.name}</span>
                        {!opt.inStock && <span className="text-[9px] uppercase font-bold">(Out)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantity Stepper */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
              <span className="text-[length:var(--font-base)] font-bold text-[var(--tg-theme-text-color,#0f172a)]">Purchase Quantity</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.('light');
                    setQuantity((q) => Math.max(1, q - 1));
                  }}
                  className="w-8 h-8 rounded-lg bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-center font-bold text-xs active:scale-90 transition cursor-pointer"
                >
                  <MinusOutlined style={{ fontSize: 10 }} />
                </button>
                <span className="font-mono font-bold text-[length:var(--font-base)] w-7 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.('light');
                    setQuantity((q) => q + 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-center font-bold text-xs active:scale-90 transition cursor-pointer"
                >
                  <PlusOutlined style={{ fontSize: 10 }} />
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* 4. DELIVERY & SERVICE GUARANTEES                     */}
          {/* ==================================================== */}
          <div className="p-3.5 rounded-2xl bg-[var(--tg-theme-section-bg-color,#ffffff)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xs space-y-2.5 text-[length:var(--font-base)]">
            {/* Pickup or Delivery Option Toggle */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
              <span className="text-[length:var(--font-small)] font-bold text-[var(--tg-theme-hint-color,#64748b)]">
                Fulfillment Mode
              </span>
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)]">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.('light');
                    setDeliveryMethod('delivery');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[length:var(--font-small)] font-bold transition cursor-pointer ${
                    deliveryMethod === 'delivery'
                      ? 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-2xs'
                      : 'text-[var(--tg-theme-hint-color,#64748b)] hover:text-[var(--tg-theme-text-color,#0f172a)]'
                  }`}
                >
                  🚀 Delivery
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.('light');
                    setDeliveryMethod('pickup');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[length:var(--font-small)] font-bold transition cursor-pointer ${
                    deliveryMethod === 'pickup'
                      ? 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-2xs'
                      : 'text-[var(--tg-theme-hint-color,#64748b)] hover:text-[var(--tg-theme-text-color,#0f172a)]'
                  }`}
                >
                  🛍️ Self-Pickup
                </button>
              </div>
            </div>

            {/* Delivery fee & Estimated time */}
            <div className="flex items-start gap-2">
              <CarOutlined className="text-[var(--tg-theme-button-color,#2F6FED)] text-sm shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-[var(--tg-theme-text-color,#0f172a)] leading-tight text-[length:var(--font-base)]">
                  {deliveryMethod === 'delivery'
                    ? 'Delivery: Free Standard Shipping (Over $20)'
                    : 'Pickup: Ready in 15 mins at Counter'}
                </p>
                <p className="text-[length:var(--font-small)] text-[var(--tg-theme-hint-color,#64748b)]">
                  {deliveryMethod === 'delivery'
                    ? 'Est. arrival: 25-35 mins (Express) · Next-day (Courier)'
                    : 'Show order QR at pickup counter upon arrival'}
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="pt-2 border-t border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-between text-[length:var(--font-small)]">
              <span className="text-[var(--tg-theme-hint-color,#64748b)]">Payment:</span>
              <span className="font-semibold text-[var(--tg-theme-text-color,#0f172a)]">
                Telegram Pay · ABA KHQR · Card · Cash on Delivery
              </span>
            </div>

            {/* Guarantee Badges */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] text-[length:var(--font-small)] text-[var(--tg-theme-hint-color,#64748b)]">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <SafetyCertificateOutlined /> 7-Day Return
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-semibold text-blue-600">
                <CheckCircleFilled /> 100% Authentic
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-semibold text-purple-600">
                <ThunderboltFilled /> Damage Coverage
              </span>
            </div>
          </div>

          {/* ==================================================== */}
          {/* 5. SHOP INFO CARD                                    */}
          {/* ==================================================== */}
          <div className="p-3.5 rounded-2xl bg-[var(--tg-theme-section-bg-color,#ffffff)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={product.shop.logo}
                alt=""
                className="w-10 h-10 rounded-full object-cover ring-1 ring-[var(--tg-theme-secondary-bg-color,#cbd5e1)] shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-[length:var(--font-title)] text-[var(--tg-theme-text-color,#0f172a)] truncate">
                  {product.shop.name}
                </h4>
                <p className="text-[length:var(--font-small)] text-[var(--tg-theme-hint-color,#64748b)] flex items-center gap-1">
                  <StarFilled className="text-amber-400 text-[10px]" />
                  <span className="font-bold text-[var(--tg-theme-text-color,#0f172a)]">{product.shop.rating}</span>
                  <span>· {product.shop.followers} fans</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('light');
                navigate('/shops');
              }}
              className="px-3 py-1.5 rounded-xl text-[length:var(--font-small)] font-bold bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] hover:opacity-90 text-[var(--tg-theme-button-color,#2F6FED)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] transition active:scale-95 cursor-pointer shrink-0"
            >
              Visit Shop
            </button>
          </div>

          {/* ==================================================== */}
          {/* 6. REVIEWS CARD & RATINGS                            */}
          {/* ==================================================== */}
          <div id="taobao-tab-reviews" className="p-3.5 rounded-2xl bg-[var(--tg-theme-section-bg-color,#ffffff)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[length:var(--font-title)] text-[var(--tg-theme-text-color,#0f172a)]">
                Buyer Reviews ({product.reviewsList.length * 40}+)
              </h3>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('light');
                  setIsAllReviewsModalOpen(true);
                }}
                className="text-[length:var(--font-small)] text-[var(--tg-theme-button-color,#2F6FED)] font-bold flex items-center gap-0.5 cursor-pointer hover:underline"
              >
                <span>View all reviews</span>
                <RightOutlined style={{ fontSize: 9 }} />
              </button>
            </div>

            {/* Top 2 Reviews Preview */}
            <div className="space-y-2.5">
              {product.reviewsList.slice(0, 2).map((rev) => (
                <div key={rev.id} className="space-y-1 text-[length:var(--font-base)] p-2 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)]/50">
                  <div className="flex items-center justify-between text-[length:var(--font-small)]">
                    <div className="flex items-center gap-1.5">
                      <img src={rev.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      <span className="font-bold text-[var(--tg-theme-text-color,#0f172a)]">{rev.author}</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded font-semibold">Verified</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{rev.date}</span>
                  </div>

                  <p className="text-[length:var(--font-base)] text-[var(--tg-theme-text-color,#334155)] leading-relaxed">
                    {rev.comment}
                  </p>

                  {rev.photos.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      {rev.photos.map((ph, pi) => (
                        <img
                          key={pi}
                          src={ph}
                          alt=""
                          onClick={() => {
                            setZoomImage(ph);
                            setIsZoomOpen(true);
                          }}
                          className="w-12 h-12 rounded-lg object-cover cursor-zoom-in border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View All Reviews Link */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('light');
                  setIsAllReviewsModalOpen(true);
                }}
                className="text-[11.5px] font-bold text-[var(--tg-theme-button-color,#2F6FED)] hover:opacity-80 py-1"
              >
                Read all {product.reviewsList.length * 40}+ customer reviews →
              </button>
            </div>
          </div>

          {/* ==================================================== */}
          {/* 7. NAVIGATION TABS: DETAILS | SPECS | RECOMMENDED   */}
          {/* ==================================================== */}
          <div className="sticky top-[48px] z-30 bg-[var(--tg-theme-bg-color,#ffffff)]/95 backdrop-blur-md p-1 rounded-xl border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-around text-[length:var(--font-base)] font-bold">
            {[
              { id: 'details', label: 'Details' },
              { id: 'specs', label: 'Specifications' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'recommended', label: 'Recommended' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTabChange(t.id)}
                className={`flex-1 py-1.5 text-center rounded-lg transition cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] shadow-2xs'
                    : 'text-[var(--tg-theme-hint-color,#64748b)] hover:text-[var(--tg-theme-text-color,#0f172a)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Specifications Table */}
          <div id="taobao-tab-specs" className="p-3.5 rounded-2xl bg-[var(--tg-theme-section-bg-color,#ffffff)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xs space-y-2">
            <h3 className="font-bold text-[length:var(--font-title)] text-[var(--tg-theme-text-color,#0f172a)]">
              Product Specifications
            </h3>
            <div className="grid grid-cols-1 divide-y divide-[var(--tg-theme-secondary-bg-color,#e2e8f0)] text-[length:var(--font-base)]">
              {product.specifications.map((spec, sIdx) => (
                <div key={sIdx} className="py-1.5 flex items-center justify-between">
                  <span className="text-[length:var(--font-small)] text-[var(--tg-theme-hint-color,#64748b)]">{spec.label}</span>
                  <span className="font-bold text-[var(--tg-theme-text-color,#0f172a)] text-right max-w-[220px] truncate">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Long Description & Vertical Detail Imagery (Taobao style) */}
          <div id="taobao-tab-details" className="p-3.5 rounded-2xl bg-[var(--tg-theme-section-bg-color,#ffffff)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xs space-y-3">
            <h3 className="font-bold text-[length:var(--font-title)] text-[var(--tg-theme-text-color,#0f172a)]">
              Product Graphic Story &amp; Details
            </h3>
            <p className="text-[length:var(--font-base)] text-[var(--tg-theme-text-color,#334155)] leading-relaxed">
              {product.description}
            </p>

            {/* Vertically Stacked Detail Images */}
            <div className="space-y-2 pt-2">
              {product.images.map((detailImg, di) => (
                <div key={di} className="w-full rounded-xl overflow-hidden shadow-2xs">
                  <img
                    src={detailImg}
                    alt=""
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ==================================================== */}
          {/* 8. RECOMMENDED PRODUCTS ("YOU MAY ALSO LIKE")        */}
          {/* ==================================================== */}
          <div id="taobao-tab-recommended" className="p-3.5 rounded-2xl bg-[var(--tg-theme-section-bg-color,#ffffff)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xs space-y-2.5">
            <h3 className="font-bold text-[length:var(--font-title)] text-[var(--tg-theme-text-color,#0f172a)]">
              You May Also Like
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Specialty Cold Brew', price: 4.5, img: product.images[1] || product.images[0] },
                { name: 'Artisan Butter Pastry', price: 3.2, img: product.images[2] || product.images[0] },
              ].map((rec, ri) => (
                <div
                  key={ri}
                  onClick={() => {
                    triggerHaptic?.('light');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-2 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)]/60 border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] cursor-pointer active:scale-98 transition space-y-1"
                >
                  <img src={rec.img} alt="" className="w-full h-20 rounded-lg object-cover" />
                  <p className="font-bold text-[length:var(--font-base)] truncate text-[var(--tg-theme-text-color,#0f172a)]">
                    {rec.name}
                  </p>
                  <p className="font-mono font-bold text-[length:var(--font-price)] text-rose-600">
                    ${rec.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 9. STICKY BOTTOM ACTION BAR (TAOBAO SIGNATURE)           */}
      {/* ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--tg-theme-bg-color,#ffffff)]/95 backdrop-blur-md border-t border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] px-3 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Left Icons: Shop, Chat, Favorite */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('light');
                navigate('/shops');
              }}
              className="flex flex-col items-center justify-center w-10 h-10 min-w-[40px] text-slate-500 hover:text-[var(--tg-theme-text-color,#0f172a)] active:scale-90 transition cursor-pointer"
              title="Shop"
            >
              <ShopOutlined className="text-sm" />
              <span className="text-[length:var(--font-small)] font-semibold mt-0.5">Shop</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('light');
                message.info('Opening Customer Support chat with ' + product.shop.name);
              }}
              className="flex flex-col items-center justify-center w-10 h-10 min-w-[40px] text-slate-500 hover:text-[var(--tg-theme-text-color,#0f172a)] active:scale-90 transition cursor-pointer"
              title="Chat"
            >
              <MessageOutlined className="text-sm" />
              <span className="text-[length:var(--font-small)] font-semibold mt-0.5">Chat</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFav}
              className={`flex flex-col items-center justify-center w-10 h-10 min-w-[40px] active:scale-90 transition cursor-pointer ${
                isFavorite ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
              }`}
              title="Favorite"
            >
              {isFavorite ? <HeartFilled className="text-sm" /> : <HeartOutlined className="text-sm" />}
              <span className="text-[length:var(--font-small)] font-semibold mt-0.5">Fav</span>
            </button>
          </div>

          {/* Right Action Buttons: "Add to Cart" + "Buy Now" */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              type="button"
              onClick={() => handleOpenSkuDrawer('cart')}
              className="flex-1 max-w-[140px] min-h-[42px] px-3 py-1.5 rounded-xl font-bold text-[length:var(--font-base)] bg-amber-500 hover:bg-amber-600 text-white shadow-2xs active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
            >
              <ShoppingCartOutlined />
              <span>Add to Cart</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSkuDrawer('buy')}
              className="flex-1 max-w-[140px] min-h-[42px] px-3 py-1.5 rounded-xl font-bold text-[length:var(--font-base)] bg-rose-500 hover:bg-rose-600 text-white shadow-xs active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
            >
              <ThunderboltFilled />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 10. SKU & VARIANT BOTTOM SHEET DRAWER                    */}
      {/* ======================================================== */}
      {isSkuDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-3">
          <div className="w-full max-w-[430px] rounded-t-2xl sm:rounded-2xl p-4 space-y-3.5 bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#0f172a)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] shadow-2xl max-h-[85vh] flex flex-col justify-between overflow-y-auto">
            {/* Sheet Handle */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            {/* Header: Product Preview, Price, Close */}
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentPreviewImage}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover ring-1 ring-[var(--tg-theme-secondary-bg-color,#cbd5e1)] shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-mono font-bold text-rose-600 text-[length:var(--font-price)]">
                    ${dynamicPrice.toFixed(2)}
                  </div>
                  <p className="text-[length:var(--font-small)] text-[var(--tg-theme-hint-color,#64748b)] truncate">
                    Selected: {Object.values(selectedVariants).filter(Boolean).join(', ')}
                  </p>
                  <p className="text-[length:var(--font-small)] text-emerald-600 font-bold">
                    In Stock ({product.stockCount} left)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSkuDrawerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <CloseOutlined />
              </button>
            </div>

            {/* Variant Option Groups */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {product.variantGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  <span className="text-[length:var(--font-small)] font-bold text-[var(--tg-theme-hint-color,#64748b)]">
                    {group.name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {group.options.map((opt, oIdx) => {
                      const isSelected = selectedVariants[group.name] === opt.name;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={!opt.inStock}
                          onClick={() => handleSelectOption(group.name, opt)}
                          className={`min-h-[38px] px-3 py-1.5 rounded-xl text-[length:var(--font-base)] font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                            !opt.inStock
                              ? 'bg-slate-100 text-slate-400 line-through opacity-50 cursor-not-allowed border border-dashed border-slate-200'
                              : isSelected
                              ? 'bg-[var(--tg-theme-button-color,#2F6FED)] text-[var(--tg-theme-button-text-color,#ffffff)] font-semibold shadow-2xs'
                              : 'bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] text-[var(--tg-theme-text-color,#334155)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] hover:opacity-90'
                          }`}
                        >
                          {opt.image && <img src={opt.image} alt="" className="w-4 h-4 rounded object-cover" />}
                          <span>{opt.name}</span>
                          {opt.priceDelta > 0 && <span className="font-mono text-[length:var(--font-small)]">(+${opt.priceDelta.toFixed(2)})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quantity */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
                <span className="text-[length:var(--font-base)] font-bold text-[var(--tg-theme-text-color,#0f172a)]">Purchase Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                  >
                    <MinusOutlined style={{ fontSize: 10 }} />
                  </button>
                  <span className="font-mono font-bold text-[length:var(--font-base)] w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                  >
                    <PlusOutlined style={{ fontSize: 10 }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Confirm CTA */}
            <button
              type="button"
              onClick={handleConfirmSkuAction}
              className={`w-full min-h-[44px] py-2.5 rounded-xl font-bold text-[length:var(--font-base)] text-white shadow-md transition active:scale-[0.98] cursor-pointer ${
                skuDrawerAction === 'buy' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {skuDrawerAction === 'buy' ? `Confirm & Buy Now ($${(dynamicPrice * quantity).toFixed(2)})` : `Confirm Add to Cart ($${(dynamicPrice * quantity).toFixed(2)})`}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 11. FULL-SCREEN IMAGE LIGHTBOX ZOOM MODAL                */}
      {/* ======================================================== */}
      {isZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-3 animate-fadeIn"
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-base hover:bg-white/30"
          >
            <CloseOutlined />
          </button>
          <img
            src={zoomImage}
            alt=""
            className="max-w-full max-h-[80vh] object-contain rounded-xl"
          />
          <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-md">
            {product.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomImage(img);
                }}
                className={`w-12 h-12 rounded-lg object-cover cursor-pointer border-2 ${
                  zoomImage === img ? 'border-amber-400' : 'border-transparent opacity-60'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 12. ALL BUYER REVIEWS MODAL / BOTTOM SHEET               */}
      {/* ======================================================== */}
      {isAllReviewsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAllReviewsModalOpen(false);
          }}
        >
          <div className="w-full max-w-[430px] sm:max-w-lg bg-[var(--tg-theme-bg-color,#ffffff)] rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)]">
            {/* Header */}
            <div className="p-3.5 border-b border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[14px] text-[var(--tg-theme-text-color,#0f172a)]">
                  Customer Reviews ({product.reviewsList.length * 40}+)
                </h3>
                <p className="text-[11px] text-[var(--tg-theme-hint-color,#64748b)]">
                  ⭐ {product.rating} Overall · 98.4% Recommended
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAllReviewsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)] flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <CloseOutlined />
              </button>
            </div>

            {/* Reviews List */}
            <div className="p-3.5 space-y-3 overflow-y-auto flex-1">
              {product.reviewsList.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)]/50 border border-[var(--tg-theme-secondary-bg-color,#e2e8f0)] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={rev.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <span className="font-bold text-[12px] text-[var(--tg-theme-text-color,#0f172a)] block leading-tight">
                          {rev.author}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          Verified Buyer · {rev.variant}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">{rev.date}</span>
                  </div>

                  <p className="text-[12px] text-[var(--tg-theme-text-color,#334155)] leading-relaxed">
                    {rev.comment}
                  </p>

                  {rev.photos.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      {rev.photos.map((ph, pi) => (
                        <img
                          key={pi}
                          src={ph}
                          alt=""
                          onClick={() => {
                            setZoomImage(ph);
                            setIsZoomOpen(true);
                          }}
                          className="w-14 h-14 rounded-lg object-cover cursor-zoom-in border border-slate-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
