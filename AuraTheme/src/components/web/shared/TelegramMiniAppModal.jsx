import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Col,
  Modal,
  QRCode,
  Row,
  Tag,
  message,
} from 'antd';
import {
  CheckCircleFilled,
  CloseOutlined,
  CopyOutlined,
  DownloadOutlined,
  SendOutlined,
  StarFilled,
} from '@ant-design/icons';
import { formatCurrency } from '../../../utils/webTheme';
import simpleData from '../../../../data/simpleData';
import { sellers } from '../../../data/shopData';
import AuraLogo from '../../common/AuraLogo';

// Telegram staff & kitchen dispatch channels per shop
export const shopTelegramGroups = {
  'seller-1': '☕ Apex Warehouse Staff Group',
  'seller-2': '📦 Vector Packaging Dispatch Group',
  'seller-3': '🛡️ ShieldWorks Compliance Group',
  'seller-4': '🏢 Prime Facility Service Group',
  'seller-5': '📑 Northstar Office Orders Group',
  'seller-6': '⚡ Gridline Components Tech Group',
  'sbc-store': '☕ Aura Specialty Coffee Bar Group',
  'aura-bakery': '🥐 Aura Artisan Bakery Kitchen Group',
  'aura-bistro': '🥗 Aura Bistro Kitchen Orders Group',
  'aura-lounge': '🍵 Aura Botanical Lounge Orders Group',
  'aura-tech': '⚡ Aura Tech Store Fulfillment Group',
};

// Registered Bot identity
export const BOTFATHER_CONFIG = {
  botUsername: 'aura_emenu_order_bot',
  botName: 'Aura Supply',
  botToken: '8613686625:AAFe8-04LvQumEXZ8-MBjbNSDozba3E1lCw',
  webAppName: 'menu',
  registeredVia: '@BotFather',
  command: '/start',
};

/**
 * TelegramMiniAppModal
 * Clean, shop-focused Telegram Mini App launcher with scannable QR code and deep-link.
 */
export default function TelegramMiniAppModal({
  open,
  onClose,
  shop,
  product,
}) {
  const navigate = useNavigate();

  // Derive target shop if only product is provided
  const targetShop = useMemo(() => {
    const SELLER_SLUG_MAP = {
      'seller-1': 'sbc-store',
      'seller-2': 'aura-bakery',
      'seller-3': 'aura-lounge',
      'seller-4': 'aura-bistro',
      'seller-5': 'aura-tech',
      'seller-6': 'sbc-store',
    };

    if (shop) {
      const resolvedSlug =
        shop.slug ||
        SELLER_SLUG_MAP[shop.id] ||
        (simpleData.stores || []).find(
          (s) =>
            s.id === shop.id ||
            s.slug === shop.id ||
            s.name?.toLowerCase() === shop.name?.toLowerCase()
        )?.slug ||
        'sbc-store';

      const matchedStore = (simpleData.stores || []).find((s) => s.slug === resolvedSlug);

      return {
        ...shop,
        id: shop.id || resolvedSlug,
        slug: resolvedSlug,
        name: shop.name || matchedStore?.name || 'Aura Store',
        rating: shop.rating || matchedStore?.rating || 4.9,
        branch: shop.branch || 'phnom-penh',
        heroImage: shop.heroImage || shop.banner || matchedStore?.banner,
        logo: shop.logo || matchedStore?.logo,
        logoText: shop.logoText || shop.name?.slice(0, 2) || matchedStore?.name?.slice(0, 2) || 'AS',
      };
    }
    if (product) {
      const prodStore =
        (simpleData.stores || []).find(
          (s) =>
            s.id === product.biller_id ||
            s.slug === product.shopSlug ||
            s.id === product.shopId ||
            s.name?.toLowerCase() === product.shopName?.toLowerCase()
        ) ||
        (sellers || []).find(
          (s) =>
            s.id === product.shopId ||
            s.slug === product.shopSlug ||
            s.name?.toLowerCase() === product.shopName?.toLowerCase()
        );
      const prodSlug = product.shopSlug || prodStore?.slug || product.shopId || 'nexus-mobile';
      return {
        id: product.shopId || prodSlug,
        slug: prodSlug,
        name: product.shopName || prodStore?.name || (product.category === 'Phones' || product.category === 'Electronics' ? 'Nexus Mobile & Gadgets' : 'Aura Specialty Store'),
        rating: prodStore?.rating || 4.9,
        branch: prodStore?.branch || 'phnom-penh',
        heroImage: prodStore?.heroImage || prodStore?.banner || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=800&fit=crop',
        logoText: 'NM',
      };
    }
    return {
      id: 'sbc-store',
      slug: 'sbc-store',
      name: 'Aura Specialty Coffee',
      rating: 4.9,
      branch: 'phnom-penh',
      heroImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
      logoText: 'AS',
    };
  }, [shop, product]);

  // Construct Telegram deep-link start parameter
  const startParam = useMemo(() => {
    if (product) {
      return `item_${product.id}`;
    }
    if (targetShop) {
      const slug = targetShop.slug || 'sbc-store';
      return `shop_${slug}`;
    }
    return 'shop_sbc-store';
  }, [product, targetShop]);

  const directBotLink = `https://t.me/${BOTFATHER_CONFIG.botUsername}/menu?startapp=${startParam}`;
  const targetGroup =
    shopTelegramGroups[targetShop?.slug] ||
    shopTelegramGroups[targetShop?.id] ||
    'Kitchen Dispatch Staff Group';

  const handleLaunchTelegram = () => {
    window.open(directBotLink, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directBotLink);
    message.success('Telegram direct bot link copied!');
  };

  const qrCodeContainerRef = useRef(null);

  // Helper to draw rounded rectangle on canvas
  const drawRoundedRect = (ctx, x, y, w, h, r, fill, stroke, strokeWidth = 1) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  };

  /**
   * Generates and downloads a clean, beautiful QR image with the Shop Name and Telegram branding
   */
  const handleDownloadQrCode = () => {
    if (!qrCodeContainerRef.current) return;
    const qrCanvas = qrCodeContainerRef.current.querySelector('canvas');
    if (!qrCanvas) {
      message.error('QR code canvas not ready yet');
      return;
    }

    try {
      const W = 560;
      const H = 660;
      const card = document.createElement('canvas');
      card.width = W;
      card.height = H;
      const ctx = card.getContext('2d');

      // 1. Soft canvas background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, W, H);

      // 2. White card container with rounded corners and border
      const pad = 18;
      const cardX = pad;
      const cardY = pad;
      const cardW = W - pad * 2;
      const cardH = H - pad * 2;
      const radius = 26;

      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, radius, '#ffffff', '#e2e8f0', 2);

      // 3. Shop / Product Title Header
      const headerY = cardY + 28;
      const shopName = product ? product.name : (targetShop?.name || 'Aura Specialty Store');
      const subtitle = product
        ? `${targetShop?.name || 'Aura'} • $${Number(product.price).toFixed(2)} • Telegram Mini App`
        : `${targetShop?.branch ? targetShop.branch.toUpperCase() : 'SPECIALTY STORE'} • TELEGRAM MINI APP`;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Subtle blue pill tag
      const tagText = product ? 'TELEGRAM PRODUCT' : 'TELEGRAM E-MENU';
      drawRoundedRect(ctx, W / 2 - 80, headerY, 160, 24, 12, '#f0f9ff', '#bae6fd', 1);
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(tagText, W / 2, headerY + 12);

      // Shop Name (Primary Heading)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const truncatedName = shopName.length > 30 ? shopName.slice(0, 29) + '...' : shopName;
      ctx.fillText(truncatedName, W / 2, headerY + 54);

      // Subtitle (Branch / Category)
      ctx.fillStyle = '#64748b';
      ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(subtitle, W / 2, headerY + 80);

      // 4. Centered QR Code Box
      const qrBoxSize = 370;
      const qrBoxX = (W - qrBoxSize) / 2;
      const qrBoxY = headerY + 104;

      drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 22, '#f8fafc', '#e2e8f0', 1.5);

      const qrSize = 320;
      const qrX = qrBoxX + (qrBoxSize - qrSize) / 2;
      const qrY = qrBoxY + (qrBoxSize - qrSize) / 2;

      drawRoundedRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 16, '#ffffff', '#e2e8f0', 1);
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      // 5. Bottom Instructions
      const bottomY = qrBoxY + qrBoxSize + 24;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Scan with Phone / Telegram', W / 2, bottomY);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Aura Telegram Mini App • Instant Menu & Order', W / 2, bottomY + 24);

      // Trigger download
      const pngUrl = card.toDataURL('image/png');
      const link = document.createElement('a');
      const safeTitle = (product ? product.name : (targetShop?.name || 'Shop')).replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `QR_${safeTitle}.png`;
      link.href = pngUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('QR Code image downloaded!');
    } catch (err) {
      console.error('Error rendering QR image:', err);
      const rawUrl = qrCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR_${targetShop?.slug || 'shop'}.png`;
      link.href = rawUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('QR Code image downloaded!');
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      closable={false}
      closeIcon={null}
      footer={null}
      width={560}
      centered
      destroyOnHidden
      styles={{
        content: {
          padding: 0,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 30px 90px rgba(0,0,0,0.3)',
          border: '1px solid rgba(36, 129, 204, 0.25)',
        },
      }}
    >
      {/* Top Telegram Identity Bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1d74b8 0%, #229ED9 60%, #3ba2e8 100%)',
          padding: '16px 20px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              flexShrink: 0,
              padding: 2,
            }}
            title="Aura Global Official Website Logo"
          >
            <AuraLogo size={34} showText={false} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>{targetShop?.name || 'Aura'}</span>
              <CheckCircleFilled style={{ color: '#4ade80', fontSize: 14 }} />
              <Tag
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  margin: 0,
                  padding: '1px 8px',
                }}
              >
                Verified
              </Tag>
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Telegram Mini App • {product ? 'Item Product Link' : 'Shop Directory Link'}
            </div>
          </div>
        </div>

        <Button
          type="text"
          shape="circle"
          icon={<CloseOutlined style={{ fontSize: 14, color: '#ffffff' }} />}
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.18)',
            border: 'none',
          }}
          title="Close modal"
        />
      </div>

      {/* Main Content */}
      <div style={{ padding: '24px 24px 20px', background: '#ffffff' }}>
        {/* Target Item or Shop Spotlight Card */}
        {product ? (
          <Card
            style={{
              borderRadius: 20,
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              border: '1px solid #bae6fd',
              marginBottom: 20,
            }}
            styles={{ body: { padding: 14 } }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 14,
                  objectFit: 'cover',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Tag color="blue" style={{ borderRadius: 999, fontWeight: 700, margin: 0, fontSize: 10 }}>
                    TELEGRAM PRODUCT ITEM
                  </Tag>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{targetShop?.name}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {product.name}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0284c7', marginTop: 4 }}>
                  {formatCurrency(product.price)}
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card
            style={{
              borderRadius: 20,
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              border: '1px solid #bae6fd',
              marginBottom: 20,
            }}
            styles={{ body: { padding: 14 } }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <Avatar
                size={64}
                src={targetShop?.logo}
                style={{
                  background: '#2481cc',
                  fontWeight: 800,
                  fontSize: 20,
                  boxShadow: '0 4px 12px rgba(36, 129, 204, 0.3)',
                }}
              >
                {targetShop?.logoText || targetShop?.name?.slice(0, 2) || 'AS'}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Tag color="blue" style={{ borderRadius: 999, fontWeight: 700, margin: 0, fontSize: 10 }}>
                    TELEGRAM SHOP
                  </Tag>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    <StarFilled style={{ color: '#f59e0b' }} /> {targetShop?.rating || 4.9}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {targetShop?.name}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Direct orders dispatched to: <strong>{targetGroup}</strong>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Primary Action & QR Code Section */}
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} sm={14}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                Launch directly inside Telegram to customize items, add to cart, and place orders with real-time status updates.
              </div>

              <Button
                type="primary"
                icon={<SendOutlined />}
                size="large"
                onClick={handleLaunchTelegram}
                style={{
                  height: 44,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 14,
                  boxShadow: '0 10px 24px rgba(36, 129, 204, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                Launch Telegram
              </Button>

              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyLink}
                style={{
                  height: 38,
                  borderRadius: 12,
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                Copy Telegram Link
              </Button>
            </div>
          </Col>

          {/* Scannable Telegram QR Code */}
          <Col xs={24} sm={10} style={{ textAlign: 'center' }}>
            <div
              style={{
                background: '#f8fafc',
                padding: '14px 14px 12px 14px',
                borderRadius: 20,
                border: '1px solid #e2e8f0',
                display: 'inline-block',
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
              }}
            >
              <div ref={qrCodeContainerRef} style={{ display: 'flex', justifyContent: 'center' }}>
                <QRCode
                  value={directBotLink}
                  size={140}
                  bordered={false}
                  icon="https://telegram.org/img/t_logo.png"
                  iconSize={28}
                />
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginTop: 8 }}>
                Scan with Phone / Telegram
              </div>

              {/* Download QR Image Button */}
              <Button
                type="primary"
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleDownloadQrCode}
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  fontWeight: 800,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #1d74b8 0%, #2481cc 100%)',
                  border: 'none',
                  color: '#ffffff',
                  width: '100%',
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(36, 129, 204, 0.35)',
                  cursor: 'pointer',
                }}
              >
                Download QR Image
              </Button>
            </div>
          </Col>
        </Row>
      </div>
    </Modal>
  );
}
