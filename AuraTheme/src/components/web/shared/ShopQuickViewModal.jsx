import React, { useState } from 'react';
import { Avatar, Button, Col, Grid, Modal, Row, Tag, Typography, message, Tooltip } from 'antd';
import {
  CoffeeOutlined,
  SendOutlined,
  ShopOutlined,
  StarFilled,
  EnvironmentOutlined,
  SafetyCertificateFilled,
  ShareAltOutlined,
  RightOutlined,
  CloseOutlined,
  ThunderboltFilled,
  CheckCircleFilled,
  ShoppingOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  HeartFilled,
  CopyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatCompact, formatCurrency, publicTheme } from '../../../utils/webTheme';
import { BOTFATHER_CONFIG } from './TelegramMiniAppModal';
import { products as masterProducts } from '../../../data/shopData';
import { useWishlist } from '../../../contexts/WishlistContext';

const { Paragraph, Text, Title } = Typography;
const { useBreakpoint } = Grid;

const FALLBACK_BANNERS = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1400&fit=crop&q=80',
];

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

const ShopQuickViewModal = ({ shop, open, onClose, onOpenTelegram, shopProducts = [] }) => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { isWishlisted: checkIsWishlisted, toggleWishlist } = useWishlist() || {};

  if (!shop) {
    return null;
  }

  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  // Resolve banner image with robust fallbacks
  const bannerImage =
    shop.heroImage ||
    shop.banner ||
    shop.image ||
    FALLBACK_BANNERS[0];

  // Resolve logo
  const logoSrc = shop.logo || shop.logoUrl;
  const logoText =
    shop.logoText ||
    (shop.name
      ? shop.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'SH');

  // Resolve products for this shop (match shopId, seller, slug, or name)
  const effectiveProducts =
    shopProducts && shopProducts.length > 0
      ? shopProducts
      : (masterProducts || []).filter(
          (p) =>
            p.shopId === shop.id ||
            p.seller === shop.id ||
            p.storeSlug === shop.slug ||
            p.shopName === shop.name
        );

  // If still empty, supply the top items from masterProducts so catalog is never blank
  const displayProducts =
    effectiveProducts.length > 0
      ? effectiveProducts
      : (masterProducts || []).slice(0, 6);

  const filteredDisplayProducts =
    activeTab === 'discount'
      ? displayProducts.filter((p) => p.originalPrice && p.originalPrice > p.price)
      : activeTab === 'instock'
      ? displayProducts.filter((p) => p.inStock !== false)
      : displayProducts;

  const handleVisitShop = () => {
    onClose?.();
    navigate(`/shops/${shop.id || shop.slug || 1}`);
  };

  const handleShareShop = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const shopRef = shop.id || shop.slug || 'store';
    const shareUrl = `${window.location.origin}/shops/${shopRef}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop.name,
          text: shop.summary || shop.description || `Discover ${shop.name} on Aura Global!`,
          url: shareUrl,
        });
        return;
      } catch (_) {}
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      message.success(`🔗 ${shop.name} link copied to clipboard!`);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isFavorited = checkIsWishlisted?.(shop.id);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={isMobile ? '100vw' : 1160}
      centered={!isMobile}
      destroyOnHidden
      zIndex={1300}
      style={
        isMobile
          ? {
              top: 0,
              margin: 0,
              paddingBottom: 0,
              maxWidth: '100vw',
              height: '100vh',
            }
          : {}
      }
      closeIcon={
        <div
          style={{
            width: isMobile ? 32 : 36,
            height: isMobile ? 32 : 36,
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.25s ease',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
          className="hover:scale-105 active:scale-95"
        >
          <CloseOutlined style={{ fontSize: isMobile ? 12 : 13 }} />
        </div>
      }
      styles={{
        body: {
          padding: 0,
          overflow: 'hidden',
          borderRadius: isMobile ? 0 : 24,
          maxHeight: isMobile ? '100vh' : '92vh',
          height: isMobile ? '100vh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
        },
        content: {
          padding: 0,
          borderRadius: isMobile ? 0 : 24,
          overflow: 'hidden',
          boxShadow: '0 30px 80px -15px rgba(15, 23, 42, 0.45), 0 0 1px 1px rgba(47, 111, 237, 0.2)',
          border: isMobile ? 'none' : '1px solid rgba(47, 111, 237, 0.16)',
          height: isMobile ? '100vh' : 'auto',
        },
      }}
      title={null}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          background: '#ffffff',
          overflowY: 'auto',
          maxHeight: isMobile ? '100vh' : '92vh',
          height: isMobile ? '100vh' : 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="no-scrollbar"
      >
        {/* ======================================================== */}
        {/* 1. EXPANSIVE CINEMATIC HERO COVER BANNER                 */}
        {/* ======================================================== */}
        <div
          style={{
            position: 'relative',
            height: isMobile ? 180 : 270,
            width: '100%',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            flexShrink: 0,
          }}
        >
          <img
            src={bannerImage}
            alt={shop.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_BANNERS[0];
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'brightness(0.88) contrast(1.05)',
              transform: 'scale(1.01)',
              transition: 'transform 0.5s ease',
            }}
          />

          {/* Ambient Lighting Gradients */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.5) 45%, rgba(15, 23, 42, 0.94) 100%)',
            }}
          />

          {/* Top-Left Trust Badges */}
          <div
            style={{
              position: 'absolute',
              top: isMobile ? 12 : 18,
              left: isMobile ? 12 : 22,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 6 : 8,
              flexWrap: 'nowrap',
              maxWidth: isMobile ? 'calc(100% - 60px)' : 'auto',
              overflow: 'hidden',
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(47, 111, 237, 0.95)',
                color: '#ffffff',
                padding: isMobile ? '3px 8px' : '5px 13px',
                borderRadius: 999,
                fontSize: isMobile ? 10 : 11,
                fontWeight: 800,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(47, 111, 237, 0.4)',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              <SafetyCertificateFilled style={{ fontSize: isMobile ? 11 : 13 }} />
              <span>{isMobile ? 'VERIFIED' : 'VERIFIED MERCHANT'}</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(16, 185, 129, 0.95)',
                color: '#ffffff',
                padding: isMobile ? '3px 8px' : '5px 12px',
                borderRadius: 999,
                fontSize: isMobile ? 10 : 11,
                fontWeight: 700,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 0 6px #ffffff',
                }}
              />
              <span>{isMobile ? 'OPEN' : 'OPEN NOW'}</span>
            </div>

            <div
              style={{
                display: isMobile ? 'none' : 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              <ClockCircleOutlined style={{ fontSize: 11 }} />
              <span>{shop.operating_hours || '6:30 AM - 8:30 PM'}</span>
            </div>
          </div>

          {/* Top-Right Est. Badge (Hidden on mobile to prevent overlapping close button) */}
          {!isMobile && (
            <div
              style={{
                position: 'absolute',
                top: 18,
                right: 66,
                background: 'rgba(255, 255, 255, 0.94)',
                color: '#0f172a',
                padding: '5px 14px',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                zIndex: 2,
              }}
            >
              Est. {shop.established || '2019'}
            </div>
          )}

          {/* Bottom Identity & Quick Action Strip */}
          <div
            style={{
              position: 'absolute',
              bottom: isMobile ? 12 : 18,
              left: isMobile ? 14 : 24,
              right: isMobile ? 14 : 24,
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'flex-end',
              justifyContent: 'space-between',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 8 : 14,
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
              <Avatar
                size={isMobile ? 48 : 76}
                src={logoSrc}
                onError={() => false}
                style={{
                  background: publicTheme.ribbon || '#2F6FED',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: isMobile ? 16 : 28,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                  border: isMobile ? '2.5px solid #ffffff' : '3.5px solid #ffffff',
                  flexShrink: 0,
                }}
              >
                {logoText}
              </Avatar>

              <div>
                <Title
                  level={2}
                  style={{
                    color: '#ffffff',
                    margin: 0,
                    fontWeight: 900,
                    textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                    lineHeight: 1.2,
                    fontSize: isMobile ? 16 : 25,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {shop.name}
                </Title>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 6 : 10,
                    color: 'rgba(255,255,255,0.95)',
                    fontSize: isMobile ? 11 : 12.5,
                    marginTop: 3,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <EnvironmentOutlined style={{ color: '#93c5fd', fontSize: isMobile ? 11 : 13 }} />
                    <strong>
                      {shop.branch
                        ? shop.branch.replace(/-/g, ' ').toUpperCase()
                        : 'CENTRAL HUB'}
                    </strong>
                  </span>
                  <span style={{ opacity: 0.6 }}>•</span>
                  {shop.established && (
                    <>
                      <span>Est. {shop.established}</span>
                      <span style={{ opacity: 0.6 }}>•</span>
                    </>
                  )}
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#fde047',
                      fontWeight: 800,
                    }}
                  >
                    <StarFilled />
                    <span>{shop.rating || '4.9'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                      ({shop.reviews || 160}+ verified reviews)
                    </span>
                  </span>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#86efac',
                      fontWeight: 700,
                    }}
                  >
                    <ThunderboltFilled />
                    <span>{shop.responseTime || '< 15m reply'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Top-Right CTAs */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <Button
                  type="primary"
                  icon={<ShopOutlined />}
                  onClick={handleVisitShop}
                  style={{
                    borderRadius: 12,
                    background: '#2F6FED',
                    borderColor: '#2F6FED',
                    fontWeight: 800,
                    fontSize: 13.5,
                    height: 42,
                    padding: '0 20px',
                    boxShadow: '0 4px 16px rgba(47, 111, 237, 0.45)',
                  }}
                >
                  Visit Shop Page
                </Button>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={handleShareShop}
                  style={{
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderColor: 'transparent',
                    fontWeight: 700,
                    fontSize: 13,
                    height: 42,
                    padding: '0 16px',
                    color: '#0f172a',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  }}
                >
                  {copied ? 'Copied! ✓' : 'Share'}
                </Button>
                {toggleWishlist && (
                  <Tooltip title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}>
                    <Button
                      icon={
                        isFavorited ? (
                          <HeartFilled style={{ color: publicTheme.danger }} />
                        ) : (
                          <HeartOutlined />
                        )
                      }
                      onClick={() => toggleWishlist(shop)}
                      style={{
                        borderRadius: 12,
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderColor: 'transparent',
                        height: 42,
                        width: 42,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                      }}
                    />
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. BODY CONTENT (EXPANSIVE 2-COLUMN LUXURY LAYOUT)       */}
        {/* ======================================================== */}
        <div
          style={{
            padding: isMobile ? '12px 14px 28px' : '26px 32px 32px',
            width: '100%',
            background: '#f8fafc',
          }}
        >
          <Row gutter={isMobile ? [14, 14] : [26, 26]} style={{ width: '100%', margin: 0 }}>
            {/* ---------------------------------------------------- */}
            {/* LEFT COLUMN: Overview, Metrics & Telegram Card       */}
            {/* ---------------------------------------------------- */}
            <Col xs={24} lg={9} style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
                {/* 4 Performance Metric Cards in 2x2 Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isMobile ? 8 : 12 }}>
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: isMobile ? 12 : 16,
                      padding: isMobile ? '8px 10px' : '14px 16px',
                      border: `1px solid ${publicTheme.softBorder}`,
                      boxShadow: '0 2px 8px rgba(47, 111, 237, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? 9.5 : 11,
                        color: publicTheme.subtext,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Store Rating
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 15 : 20,
                        fontWeight: 900,
                        color: '#f59e0b',
                        marginTop: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <StarFilled style={{ fontSize: isMobile ? 13 : 15 }} />
                      <span>{shop.rating || '4.9'}</span>
                      <span style={{ fontSize: isMobile ? 10 : 11.5, fontWeight: 600, color: publicTheme.subtext }}>
                        / 5.0
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: isMobile ? 12 : 16,
                      padding: isMobile ? '8px 10px' : '14px 16px',
                      border: `1px solid ${publicTheme.softBorder}`,
                      boxShadow: '0 2px 8px rgba(47, 111, 237, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? 9.5 : 11,
                        color: publicTheme.subtext,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Followers
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 15 : 20,
                        fontWeight: 900,
                        color: publicTheme.text,
                        marginTop: 3,
                      }}
                    >
                      {formatCompact(shop.followers || 12400)}
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: isMobile ? 12 : 16,
                      padding: isMobile ? '8px 10px' : '14px 16px',
                      border: `1px solid ${publicTheme.softBorder}`,
                      boxShadow: '0 2px 8px rgba(47, 111, 237, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? 9.5 : 11,
                        color: publicTheme.subtext,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Live Catalog
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 15 : 20,
                        fontWeight: 900,
                        color: '#2563eb',
                        marginTop: 3,
                      }}
                    >
                      {displayProducts.length} items
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: isMobile ? 12 : 16,
                      padding: isMobile ? '8px 10px' : '14px 16px',
                      border: `1px solid ${publicTheme.softBorder}`,
                      boxShadow: '0 2px 8px rgba(47, 111, 237, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? 9.5 : 11,
                        color: publicTheme.subtext,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Dispatch Speed
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 13 : 16,
                        fontWeight: 900,
                        color: '#10b981',
                        marginTop: 3,
                      }}
                    >
                      {shop.responseTime || '< 15 mins'}
                    </div>
                  </div>
                </div>

                {/* About Store & Overview Card */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 18,
                    padding: '16px 20px',
                    border: `1px solid ${publicTheme.softBorder}`,
                    boxShadow: '0 2px 8px rgba(47, 111, 237, 0.04)',
                  }}
                >
                  <Paragraph
                    style={{
                      fontSize: 'var(--font-base)',
                      color: '#475569',
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {shop.summary ||
                      shop.description ||
                      'Official authorized flagship store providing enterprise-grade supply chain, warehouse automation hardware, and direct dispatch materials.'}
                  </Paragraph>

                  {/* Specialties Pills */}
                  {shop.specialties && shop.specialties.length > 0 && (
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: `1px dashed ${publicTheme.softBorder}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: publicTheme.subtext,
                          marginBottom: 8,
                        }}
                      >
                        Specialties &amp; Categories:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {shop.specialties.map((spec) => (
                          <Tag
                            key={spec}
                            style={{
                              margin: 0,
                              borderRadius: 8,
                              background: 'rgba(47, 111, 237, 0.08)',
                              borderColor: 'rgba(47, 111, 237, 0.2)',
                              color: '#2F6FED',
                              fontSize: 11.5,
                              fontWeight: 700,
                              padding: '3px 9px',
                            }}
                          >
                            {spec}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Store Contact & Address Strip */}
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: `1px dashed ${publicTheme.softBorder}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      fontSize: 12,
                      color: '#64748b',
                    }}
                  >
                    {shop.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <EnvironmentOutlined style={{ color: '#2F6FED' }} />
                        <span style={{ color: '#334155' }}>{shop.address}</span>
                      </div>
                    )}
                    {shop.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <PhoneOutlined style={{ color: '#10b981' }} />
                        <span style={{ color: '#334155' }}>{shop.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Telegram Bot Integration Card */}
                <div
                  style={{
                    borderRadius: 18,
                    padding: '16px 18px',
                    background:
                      'linear-gradient(135deg, rgba(36, 129, 204, 0.08) 0%, rgba(47, 111, 237, 0.12) 100%)',
                    border: '1px solid rgba(36, 129, 204, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: '#2481cc',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        boxShadow: '0 4px 12px rgba(36, 129, 204, 0.35)',
                        flexShrink: 0,
                      }}
                    >
                      <SendOutlined />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        Telegram Menu
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>
                        Instant Ordering &amp; Kitchen Updates
                      </div>
                    </div>
                  </div>

                  <Space size={6}>
                    <Button
                      onClick={() => {
                        onClose?.();
                        const targetSlug = shop?.slug || (shop?.id === 'seller-2' ? 'aura-bakery' : (shop?.id === 'seller-1' ? 'sbc-store' : shop?.id || 'aura-bakery'));
                        navigate(`/shop/menu/${targetSlug}`);
                      }}
                      style={{
                        background: '#A31D1D',
                        borderColor: '#A31D1D',
                        color: 'white',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 12,
                        height: 34,
                        padding: '0 12px',
                        flexShrink: 0,
                      }}
                    >
                      E-Menu 🍽️
                    </Button>

                    <Button
                      type="primary"
                      onClick={() => {
                        onClose?.();
                        onOpenTelegram?.(shop);
                      }}
                      style={{
                        background: '#2481cc',
                        borderColor: '#2481cc',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 12,
                        height: 34,
                        padding: '0 14px',
                        flexShrink: 0,
                      }}
                    >
                      Open Bot ↗
                    </Button>
                  </Space>
                </div>
              </div>
            </Col>

            {/* ---------------------------------------------------- */}
            {/* RIGHT COLUMN: Featured Products & Direct Actions     */}
            {/* ---------------------------------------------------- */}
            <Col xs={24} lg={15} style={{ padding: isMobile ? 0 : '0 0 0 10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
                {/* Products Section Header with Filter Pills */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#2F6FED',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Store Catalog Preview
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: publicTheme.text }}>
                      Featured Products ({displayProducts.length})
                    </div>
                  </div>

                  {/* Filter tabs: All / In Stock / Deals */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[
                      { key: 'all', label: 'All Items' },
                      { key: 'instock', label: 'In Stock' },
                      { key: 'discount', label: 'Deals & Offers' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                          borderRadius: 999,
                          padding: '4px 12px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border:
                            activeTab === tab.key
                              ? '1px solid #2F6FED'
                              : '1px solid #e2e8f0',
                          background:
                            activeTab === tab.key ? '#2F6FED' : '#ffffff',
                          color: activeTab === tab.key ? '#ffffff' : '#64748b',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                    <Button
                      type="link"
                      onClick={handleVisitShop}
                      style={{
                        fontWeight: 800,
                        color: '#2F6FED',
                        padding: '0 4px',
                        fontSize: 12.5,
                      }}
                    >
                      View All <RightOutlined style={{ fontSize: 10 }} />
                    </Button>
                  </div>
                </div>

                {/* Products Grid (Spacious 3-columns on desktop, 2-cols on tablet, 1-col on phone) */}
                {filteredDisplayProducts.length === 0 ? (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: 18,
                      padding: '40px 20px',
                      textAlign: 'center',
                      border: `1px solid ${publicTheme.softBorder}`,
                    }}
                  >
                    <ShoppingOutlined style={{ fontSize: 36, color: '#94a3b8', marginBottom: 8 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: publicTheme.text }}>
                      No items matched this filter
                    </div>
                    <Button
                      type="default"
                      onClick={() => setActiveTab('all')}
                      style={{ borderRadius: 10, marginTop: 12 }}
                    >
                      Show All Items
                    </Button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile
                        ? '1fr'
                        : isTablet
                        ? 'repeat(2, 1fr)'
                        : 'repeat(3, 1fr)',
                      gap: 14,
                    }}
                  >
                    {filteredDisplayProducts.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onClose?.();
                          navigate(`/products#${item.id}`);
                        }}
                        style={{
                          background: '#ffffff',
                          borderRadius: 16,
                          border: `1px solid ${publicTheme.softBorder}`,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: isMobile ? 'row' : 'column',
                          boxShadow: '0 2px 8px rgba(47, 111, 237, 0.04)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          gap: isMobile ? 14 : 0,
                          padding: isMobile ? 12 : 0,
                        }}
                        className="hover:shadow-md hover:border-[#2F6FED]/40 hover:-translate-y-0.5"
                      >
                        {/* Image Container with robust onError fallback */}
                        <div
                          style={{
                            position: 'relative',
                            width: isMobile ? 90 : '100%',
                            height: isMobile ? 90 : 125,
                            background: '#f1f5f9',
                            borderRadius: isMobile ? 12 : 0,
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={item.image || FALLBACK_PRODUCT_IMAGE}
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease',
                            }}
                          />

                          {/* Brand Pill */}
                          {item.brand && (
                            <span
                              style={{
                                position: 'absolute',
                                top: 6,
                                left: 6,
                                background: 'rgba(255, 255, 255, 0.95)',
                                color: '#1e293b',
                                fontSize: 9.5,
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: 6,
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                              }}
                            >
                              {item.brand}
                            </span>
                          )}

                          {/* Discount / In-Stock Tag */}
                          {item.originalPrice && item.originalPrice > item.price ? (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: 6,
                                left: 6,
                                background: '#ef4444',
                                color: '#ffffff',
                                fontSize: 9,
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: 5,
                              }}
                            >
                              {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                            </span>
                          ) : null}

                          <span
                            style={{
                              position: 'absolute',
                              bottom: 6,
                              right: 6,
                              background:
                                item.inStock !== false
                                  ? 'rgba(16, 185, 129, 0.95)'
                                  : 'rgba(239, 68, 68, 0.95)',
                              color: '#ffffff',
                              fontSize: 9,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 5,
                            }}
                          >
                            {item.inStock !== false ? 'In stock' : 'Pre-order'}
                          </span>
                        </div>

                        {/* Product Card Details */}
                        <div
                          style={{
                            padding: isMobile ? 0 : '10px 12px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 12.5,
                                fontWeight: 800,
                                color: publicTheme.text,
                                lineHeight: 1.35,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                minHeight: isMobile ? 'auto' : 34,
                              }}
                              title={item.name}
                            >
                              {item.name}
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              display: 'flex',
                              alignItems: 'baseline',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: 14.5,
                                  fontWeight: 900,
                                  color: '#2F6FED',
                                }}
                              >
                                {formatCurrency(item.price)}
                              </span>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    color: '#94a3b8',
                                    textDecoration: 'line-through',
                                    marginLeft: 5,
                                  }}
                                >
                                  {formatCurrency(item.originalPrice)}
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                color: '#f59e0b',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                              }}
                            >
                              <StarFilled style={{ fontSize: 10 }} />
                              {item.rating || '4.9'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Verified Fulfillment Partner Info Strip */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    padding: '14px 18px',
                    border: `1px solid ${publicTheme.softBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 14,
                    marginTop: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CheckCircleFilled style={{ color: '#10b981', fontSize: 18 }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: publicTheme.text }}>
                        Verified Aura Fulfillment Network
                      </div>
                      <div style={{ fontSize: 11, color: publicTheme.subtext }}>
                        Guaranteed authentic stock, real-time inventory sync &amp; instant Telegram dispatch.
                      </div>
                    </div>
                  </div>
                  <Tag
                    color="blue"
                    style={{
                      borderRadius: 8,
                      fontWeight: 800,
                      margin: 0,
                      fontSize: 11,
                      padding: '2px 8px',
                    }}
                  >
                    Direct Sync
                  </Tag>
                </div>

                {/* Bottom Primary Actions */}
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <Button
                    type="primary"
                    icon={<ShopOutlined />}
                    size="large"
                    onClick={handleVisitShop}
                    style={{
                      flex: 2,
                      borderRadius: 14,
                      background: '#2F6FED',
                      borderColor: '#2F6FED',
                      fontWeight: 800,
                      fontSize: 14,
                      height: 46,
                      boxShadow: '0 6px 18px rgba(47, 111, 237, 0.35)',
                    }}
                  >
                    Visit Shop Page
                  </Button>

                  <Button
                    icon={<CoffeeOutlined style={{ color: '#A31D1D' }} />}
                    size="large"
                    onClick={() => {
                      onClose?.();
                      const targetSlug = shop?.slug || (shop?.id === 'seller-2' ? 'aura-bakery' : (shop?.id === 'seller-1' ? 'sbc-store' : shop?.id || 'aura-bakery'));
                      navigate(`/shop/menu/${targetSlug}`);
                    }}
                    style={{
                      flex: 1.5,
                      borderRadius: 14,
                      borderColor: 'rgba(163, 29, 29, 0.35)',
                      color: '#A31D1D',
                      fontWeight: 800,
                      fontSize: 13.5,
                      height: 46,
                      background: 'rgba(163, 29, 29, 0.08)',
                    }}
                  >
                    Digital E-Menu
                  </Button>

                  <Button
                    icon={<SendOutlined style={{ color: '#2481cc' }} />}
                    size="large"
                    onClick={() => {
                      onClose?.();
                      onOpenTelegram?.(shop);
                    }}
                    style={{
                      flex: 1.5,
                      borderRadius: 14,
                      borderColor: 'rgba(36, 129, 204, 0.4)',
                      color: '#2481cc',
                      fontWeight: 800,
                      fontSize: 13.5,
                      height: 46,
                      background: 'rgba(36, 129, 204, 0.08)',
                    }}
                  >
                    Telegram E-Menu
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </Modal>
  );
};

export default ShopQuickViewModal;
