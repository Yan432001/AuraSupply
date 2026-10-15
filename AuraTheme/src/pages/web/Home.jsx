import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Typography,
  Row,
  Col,
  Card,
  Button,
  Avatar,
  Grid,
  Space,
  message,
  Spin,
  Tag,
  Input,
  Select,
} from 'antd';
import {
  ArrowRightOutlined,
  SendOutlined,
  ShopOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  CustomerServiceOutlined,
  FireOutlined,
  ThunderboltOutlined,
  LockOutlined,
  SyncOutlined,
  StarFilled,
  HeartOutlined,
  HeartFilled,
  PlusOutlined,
  CheckOutlined,
  ShareAltOutlined,
  LoadingOutlined,
  CalculatorOutlined,
  GlobalOutlined,
  FileProtectOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, fetchCategories, fetchShops, fetchShopSettings } from '../../utils/apiconfig';
import { useCart } from '../../contexts/CartContext';

import { useWishlist } from '../../contexts/WishlistContext';
import { publicTheme, formatCurrency, formatCompact } from '../../utils/webTheme';
import { animateAddToCart } from '../../utils/helpers';
import TelegramMiniAppModal, { BOTFATHER_CONFIG } from '../../components/web/shared/TelegramMiniAppModal';
import RetailProductCard from '../../components/web/shared/RetailProductCard';
import RetailShopCard from '../../components/web/shared/RetailShopCard';
import ProductQuickViewModal from '../../components/web/shared/ProductQuickViewModal';
import ShopQuickViewModal from '../../components/web/shared/ShopQuickViewModal';
import PromotionPosterSlider from '../../components/web/shared/PromotionPosterSlider';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const useCountdown = (hours = 24) => {
  const [target] = useState(() => Date.now() + hours * 60 * 60 * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = Math.max(target - now, 0);
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

export default function Home() {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const countdown = useCountdown(18);
  const { addItem, addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRetailCategory, setActiveRetailCategory] = useState('all');
  const [telegramShop, setTelegramShop] = useState(null);
  const [previewShop, setPreviewShop] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [telegramProduct, setTelegramProduct] = useState(null);

  // Real Database Data State
  const [shops, setShops] = useState([]);
  const [retailProducts, setRetailProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storefrontSettings, setStorefrontSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchShops(),
      fetchProducts({ limit: 100 }),
      fetchCategories(),
      fetchShopSettings()
    ]).then(([shopsRes, prodsRes, catsRes, settingsRes]) => {
      if (!isMounted) return;
      if (shopsRes?.success && Array.isArray(shopsRes.data)) {
        setShops(shopsRes.data);
      }
      if (prodsRes?.success && Array.isArray(prodsRes.data)) {
        setRetailProducts(prodsRes.data);
      }
      if (catsRes?.success && Array.isArray(catsRes.data)) {
        setCategories(catsRes.data);
      }
      if (settingsRes?.success && settingsRes.data) {
        setStorefrontSettings(settingsRes.data);
      }
      setLoading(false);
    }).catch((err) => {
      console.warn('Home data load notice:', err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  // Shop favorites & wishlist
  const [wishlistedShopIds, setWishlistedShopIds] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_favorite_shops');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleShopWishlist = (shop) => {
    const isSaved = wishlistedShopIds.includes(shop.id);
    const updated = isSaved
      ? wishlistedShopIds.filter((id) => id !== shop.id)
      : [...wishlistedShopIds, shop.id];

    setWishlistedShopIds(updated);
    try {
      localStorage.setItem('aura_favorite_shops', JSON.stringify(updated));
    } catch {}

    if (isSaved) {
      message.info(`${shop.name} removed from favorites`);
    } else {
      message.success(`${shop.name} added to favorites`);
    }
  };

  const stores = shops;
  const products = retailProducts;

  const handleOpenTelegramModal = (storeOrShop) => {
    if (!storeOrShop) return;

    const resolvedSlug =
      storeOrShop.slug ||
      storeOrShop.store_slug ||
      storeOrShop.id ||
      'sbc-store';

    const matchedStore = (shops || []).find((s) => s.slug === resolvedSlug || s.id === storeOrShop.id);

    setTelegramShop({
      ...storeOrShop,
      id: storeOrShop.id || resolvedSlug,
      slug: resolvedSlug,
      name: storeOrShop.name || matchedStore?.name || 'Aura Store',

      branch: storeOrShop.branch || 'phnom-penh',
      rating: storeOrShop.rating || matchedStore?.rating || 4.9,
      followers: storeOrShop.followers || 12400,
      heroImage:
        storeOrShop.heroImage ||
        storeOrShop.banner ||
        matchedStore?.banner ||
        '/assets/uploads/no_image.png',
      logo: storeOrShop.logo || matchedStore?.logo,
      logoText: storeOrShop.logoText || storeOrShop.name?.slice(0, 2)?.toUpperCase() || 'AS',
      summary:
        storeOrShop.summary ||
        storeOrShop.tagline ||
        matchedStore?.tagline ||
        'Digital contactless dining and takeaway e-menu.',
      specialties: ['E-Menu', 'Online Order', 'Telegram Mini App'],
      responseTime: storeOrShop.responseTime || 'instant',
    });
  };

  const handleShareShop = async (storeOrShop, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const shopId = storeOrShop.id || storeOrShop.slug;
    const shareUrl = `${window.location.origin}/shops/${shopId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeOrShop.name,
          text: storeOrShop.summary || `Check out ${storeOrShop.name} on Aura Global!`,
          url: shareUrl,
        });
        return;
      } catch (_) {}
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      message.success(`🔗 ${storeOrShop.name} link copied to clipboard!`);
    }
  };

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter((p) => Number(p.category_id) === Number(activeCategory));
  }, [products, activeCategory]);


  const discountedProducts = useMemo(() => {
    return retailProducts.filter((p) => p.originalPrice && p.originalPrice > p.price);
  }, [retailProducts]);

  const handleOrderRetailProduct = (product, triggerElement) => {
    animateAddToCart({
      triggerElement,
      productImage: product.image,
    });
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
    message.success(`${product.name} added to cart!`);
  };

  const handleShareProduct = async (product) => {
    const shareUrl = `${window.location.origin}/products#${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.description, url: shareUrl });
        return;
      } catch (_) {}
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      message.success(`Product link copied to clipboard!`);
    }
  };


  return (
    <div style={{ width: '100%', paddingBottom: 48 }}>
      {/* 1. Premier B2B Storefront Hero */}
      <div
        className="stagger-rise b2b-grid-backdrop"
        style={{
          width: '100%',
          borderRadius: 28,
          background: publicTheme.heroBackground,
          border: `1px solid ${publicTheme.border}`,
          boxShadow: publicTheme.shadow,
          position: 'relative',
          overflow: 'hidden',
          padding: screens.xs ? '32px 20px 28px' : screens.md ? '48px 44px' : '56px 52px',
          marginBottom: 36,
        }}
      >
        {/* Decorative Ambient Accents */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            top: -80,
            right: -60,
            background: publicTheme.primary,
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.12,
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            bottom: -60,
            left: '25%',
            background: publicTheme.accent,
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.09,
            pointerEvents: 'none',
          }}
        />

        <Row gutter={[40, 36]} align="middle" style={{ position: 'relative', zIndex: 1 }}>
          <Col xs={24} lg={13}>
            {/* Header Kicker Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(47, 111, 237, 0.08)', border: '1px solid rgba(47, 111, 237, 0.2)', marginBottom: 18 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: publicTheme.primary,
                  boxShadow: `0 0 10px ${publicTheme.primary}`,
                }}
              />
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: publicTheme.primary,
                  textTransform: 'uppercase',
                }}
              >
                Premier B2B Supply & Multi-Store E-Menu Platform
              </span>
            </div>

            <Title
              level={1}
              style={{
                color: publicTheme.text,
                fontSize: screens.xs ? 28 : screens.md ? 42 : 46,
                fontWeight: 850,
                lineHeight: 1.14,
                letterSpacing: '-0.025em',
                marginBottom: 16,
              }}
            >
              Wholesale Sourcing, <span style={{ color: publicTheme.primary }}>Automated Dispatch</span> & Commercial Supply
            </Title>

            <Paragraph
              style={{
                color: publicTheme.subtext,
                fontSize: 14.5,
                lineHeight: 1.6,
                maxWidth: 580,
                marginBottom: 24,
              }}
            >
              Connect directly with verified regional roasters, artisan bakeries, and industrial equipment manufacturers. Enjoy volume tier discounts, escrow payment protection, and automated Telegram kitchen ticket dispatch.
            </Paragraph>

            {/* Main Action Buttons */}
            <Space wrap size={12} style={{ width: screens.xs ? '100%' : 'auto' }}>
              <Button
                type="primary"
                size="large"
                icon={<ShopOutlined />}
                onClick={() => navigate('/products')}
                style={{
                  height: 48,
                  width: screens.xs ? '100%' : 'auto',
                  borderRadius: 14,
                  background: publicTheme.primary,
                  borderColor: publicTheme.primary,
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 14,
                  paddingInline: 24,
                  boxShadow: '0 10px 24px rgba(47, 111, 237, 0.28)',
                }}
              >
                Browse Wholesale Catalog
              </Button>
              <Button
                size="large"
                icon={<SendOutlined />}
                onClick={() => handleOpenTelegramModal(stores[0] || shops[0])}
                style={{
                  height: 48,
                  width: screens.xs ? '100%' : 'auto',
                  borderRadius: 14,
                  background: '#ffffff',
                  borderColor: publicTheme.border,
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: 14,
                  paddingInline: 22,
                }}
              >
                Launch Telegram E-Menu
              </Button>
            </Space>

            {/* Quick Metrics */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: screens.xs ? 14 : 28,
                marginTop: 32,
                paddingTop: 24,
                borderTop: `1px solid ${publicTheme.softBorder}`,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontSize: 22, fontWeight: 850, color: publicTheme.text }}>18,500+</div>
                <div style={{ fontSize: 11.5, color: publicTheme.subtext }}>Verified SKUs</div>
              </div>
              <div style={{ width: 1, height: 28, background: publicTheme.softBorder }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 850, color: publicTheme.primary }}>99.4%</div>
                <div style={{ fontSize: 11.5, color: publicTheme.subtext }}>Fulfillment Rate</div>
              </div>
              <div style={{ width: 1, height: 28, background: publicTheme.softBorder }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 850, color: publicTheme.accent }}>&lt; 2 hrs</div>
                <div style={{ fontSize: 11.5, color: publicTheme.subtext }}>Warehouse Dispatch</div>
              </div>
              <div style={{ width: 1, height: 28, background: publicTheme.softBorder }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 850, color: '#10b981' }}>4 Hubs</div>
                <div style={{ fontSize: 11.5, color: publicTheme.subtext }}>Regional Network</div>
              </div>
            </div>
          </Col>

          {/* Dynamic Promotion Poster Slider */}
          <Col xs={24} lg={11}>
            <PromotionPosterSlider />
          </Col>
        </Row>
      </div>

      {/* 2. B2B Trust & Supply Assurance Bar */}
      <div style={{ marginBottom: 36 }}>
        <Row gutter={[16, 16]}>
          {[
            {
              icon: <FileProtectOutlined style={{ fontSize: 24, color: publicTheme.primary }} />,
              title: 'Escrow Buyer Protection',
              desc: 'Funds safely held until quality inspection & sign-off. Net-30 credit available.',
            },
            {
              icon: <SafetyCertificateOutlined style={{ fontSize: 24, color: '#10b981' }} />,
              title: 'Factory-Audited Quality',
              desc: 'ISO 9001 and HACCP compliance certified on all regional wholesale lots.',
            },
            {
              icon: <RocketOutlined style={{ fontSize: 24, color: publicTheme.accent }} />,
              title: 'Express Cross-Border Logistics',
              desc: 'Direct overland and air freight routing between Phnom Penh, Bangkok, and Rayong.',
            },
            {
              icon: <SendOutlined style={{ fontSize: 24, color: '#38bdf8' }} />,
              title: 'Turnkey Telegram E-Menu',
              desc: 'Instant QR code digital table ordering with sub-second kitchen ticket delivery.',
            },
          ].map((pillar, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <div
                className="b2b-card"
                style={{
                  background: '#ffffff',
                  borderRadius: 20,
                  padding: '20px 18px',
                  border: `1px solid ${publicTheme.softBorder}`,
                  boxShadow: publicTheme.lightShadow,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'rgba(240, 244, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {pillar.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: publicTheme.text, marginBottom: 4 }}>
                    {pillar.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: publicTheme.subtext, lineHeight: 1.5 }}>
                    {pillar.desc}
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* 4. Verified Supplier Stores Network */}
      <div style={{ width: '100%', marginBottom: screens.xs ? 28 : 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: screens.xs ? 'flex-start' : 'flex-end', marginBottom: screens.xs ? 12 : 20, flexDirection: screens.xs ? 'column' : 'row', gap: screens.xs ? 6 : 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: publicTheme.primary, textTransform: 'uppercase', marginBottom: 4 }}>
              Vetted Supplier Network
            </div>
            <Title level={screens.xs ? 3 : 2} style={{ margin: 0, fontWeight: 850, color: publicTheme.text }}>
              Verified Manufacturers & Stores
            </Title>
            <Paragraph style={{ color: publicTheme.subtext, fontSize: 13, margin: '4px 0 0' }}>
              Direct factory stores with live Telegram Mini App dispatch, local warehouse inventory, and fast response times.
            </Paragraph>
          </div>
          <Button
            type="link"
            onClick={() => navigate('/shops')}
            style={{ fontWeight: 700, color: publicTheme.primary, padding: 0 }}
          >
            All Suppliers ({shops.length}) <ArrowRightOutlined />
          </Button>
        </div>

        {/* 6-Card Responsive Grid matching Shops Page */}
        <Row gutter={screens.xs ? [12, 12] : screens.sm ? [14, 14] : [18, 18]} style={{ width: '100%' }}>
          {shops.map((shop) => {
            const shopProducts = retailProducts.filter((p) => Number(p.biller_id || p.shop_id || p.shopId) === Number(shop.biller_id || shop.id));
            const isWishlisted = wishlistedShopIds.includes(shop.id);

            return (
              <Col xs={24} sm={12} md={8} lg={4} key={shop.id}>
                <RetailShopCard
                  shop={shop}
                  shopProducts={shopProducts}
                  gridMode={screens.xs ? 4 : 6}
                  onPreview={(s) => setPreviewShop(s)}
                  onWishlist={toggleShopWishlist}
                  isWishlisted={isWishlisted}
                  onLike={(s) => message.success(`You liked ${s.name}!`)}
                  onShare={handleShareShop}
                  onOpenTelegram={(s) => handleOpenTelegramModal(s)}
                  onOpenEMenu={(s) => navigate(`/shop/menu/${s.slug || s.id}`)}
                />
              </Col>
            );
          })}
        </Row>
      </div>

      {/* 5. Flash Wholesale Deals & Volume Discounts */}
      <div style={{ width: '100%', marginBottom: screens.xs ? 28 : 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 'var(--font-small)', fontWeight: 800, letterSpacing: '0.06em', color: publicTheme.danger, textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FireOutlined style={{ color: publicTheme.danger }} />
              Limited-Time Wholesale Price Drops
            </div>
            <Title level={screens.xs ? 3 : 2} style={{ margin: 0, fontWeight: 850, color: publicTheme.text }}>
              Volume Procurement Deals
            </Title>
            <Paragraph style={{ color: publicTheme.subtext, fontSize: 'var(--font-base)', margin: '4px 0 0' }}>
              Specialty equipment, direct-trade micro-lots, and packaging supplies with exclusive wholesale discounts.
            </Paragraph>
          </div>
          <Button
            type="link"
            onClick={() => navigate('/products')}
            style={{ fontWeight: 700, color: publicTheme.primary, padding: 0 }}
          >
            All Volume Deals ({discountedProducts.length}) <ArrowRightOutlined />
          </Button>
        </div>

        {/* Discount Products Grid */}
        <Row gutter={screens.xs ? [12, 12] : [18, 18]} style={{ width: '100%' }}>
          {discountedProducts.slice(0, screens.xs ? 4 : 6).map((product) => (
            <Col xs={24} sm={12} md={8} lg={4} key={product.id}>
              <RetailProductCard
                product={product}
                onPreview={setPreviewProduct}
                onQuickView={setPreviewProduct}
                onOrder={handleOrderRetailProduct}
                onAddToCart={handleOrderRetailProduct}
                onWishlist={toggleWishlist}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlist.some((item) => item.id === product.id)}
                onLike={() => message.success(`❤️ Liked ${product.name}`)}
                onShare={handleShareProduct}
                onOpenTelegram={(item) => setTelegramProduct(item)}
              />
            </Col>
          ))}
        </Row>
      </div>

      {/* Product Quick View Modal */}
      <ProductQuickViewModal
        product={previewProduct}
        open={Boolean(previewProduct)}
        onClose={() => setPreviewProduct(null)}
        onOrder={handleOrderRetailProduct}
      />

      {/* Shop Quick View Modal */}
      <ShopQuickViewModal
        shop={previewShop}
        open={Boolean(previewShop)}
        onClose={() => setPreviewShop(null)}
        onOpenTelegram={(s) => handleOpenTelegramModal(s)}
        shopProducts={previewShop ? retailProducts.filter((p) => Number(p.biller_id || p.shop_id || p.shopId) === Number(previewShop.biller_id || previewShop.id)) : []}
      />

      {/* Telegram Mini App Gateway Modal */}
      <TelegramMiniAppModal
        open={Boolean(telegramShop || telegramProduct)}
        onClose={() => {
          setTelegramShop(null);
          setTelegramProduct(null);
        }}
        shop={telegramShop}
        product={telegramProduct}
        allProducts={retailProducts}
      />
    </div>
  );
}
