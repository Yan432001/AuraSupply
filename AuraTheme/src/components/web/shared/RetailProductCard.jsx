import React from 'react';
import { Button, Card, Flex, Grid, Space, Tag, Typography } from 'antd';
import {
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
  LikeOutlined,
  SendOutlined,
  ShareAltOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { formatCurrency, publicTheme } from '../../../utils/webTheme';

const { useBreakpoint } = Grid;
const { Paragraph, Text, Title } = Typography;

const RetailProductCard = ({
  product,
  onPreview,
  onQuickView,
  onOrder,
  onAddToCart,
  onWishlist,
  onToggleWishlist,
  isWishlisted = false,
  onLike,
  onShare,
  onOpenTelegram,
}) => {
  const screens = useBreakpoint();
  const isPhone = !screens.sm;
  const isTablet = screens.sm && !screens.lg;
  const isCompact = !screens.lg; // phone or tablet

  const handleView = onPreview || onQuickView;
  const handleAdd = onOrder || onAddToCart;
  const handleWish = onWishlist || onToggleWishlist;

  return (
    <Card
      hoverable
      className="app-product-card retail-product-card-wrapper hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] transition-all duration-300"
      style={{
        borderRadius: isPhone ? 18 : isTablet ? 22 : 26,
        border: `1px solid ${publicTheme.border}`,
        background: publicTheme.cardBackground,
        boxShadow: isPhone
          ? '0 4px 16px -2px rgba(15, 23, 42, 0.07), 0 2px 6px -1px rgba(0, 0, 0, 0.04)'
          : publicTheme.lightShadow,
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      styles={{
        body: {
          padding: isPhone ? 10 : isTablet ? 12 : 16,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
      cover={
        <div
          style={{
            paddingTop: isPhone ? 8 : isTablet ? 10 : 14,
            paddingLeft: isPhone ? 8 : isTablet ? 10 : 14,
            paddingRight: isPhone ? 8 : isTablet ? 10 : 14,
            paddingBottom: 0,
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleView?.(product)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                handleView?.(product);
              }
            }}
            style={{
              position: 'relative',
              borderRadius: isPhone ? 14 : isTablet ? 16 : 20,
              overflow: 'hidden',
              aspectRatio: '1 / 1',
              background: publicTheme.cardMuted,
              cursor: 'pointer',
            }}
          >
            <img
              data-product-image="true"
              src={product.image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Brand / Category Pill and Promo Badge */}
            <div
              style={{
                position: 'absolute',
                top: isPhone ? 6 : 8,
                left: isPhone ? 6 : 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                zIndex: 2,
                alignItems: 'flex-start',
              }}
            >
              {product.badge && (
                <span
                  style={{
                    borderRadius: 999,
                    background: product.badge.includes('🔥')
                      ? '#ef4444'
                      : product.badge.includes('⚡')
                      ? '#f59e0b'
                      : product.badge.includes('Price')
                      ? '#10b981'
                      : '#2F6FED',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 'var(--font-small)',
                    padding: '2px 8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    display: 'inline-block',
                    width: 'fit-content',
                    lineHeight: 1.3,
                  }}
                >
                  {product.badge}
                </span>
              )}

              {product.brand && (
                <Tag
                  style={{
                    margin: 0,
                    borderRadius: 999,
                    border: 'none',
                    background: 'rgba(255,255,255,0.92)',
                    color: publicTheme.primary,
                    fontWeight: 700,
                    fontSize: 'var(--font-small)',
                    padding: isPhone ? '1px 6px' : '2px 8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {product.brand}
                </Tag>
              )}
            </div>

            {/* Quick Favorite / Wishlist Heart Button */}
            <Button
              type="text"
              shape="circle"
              icon={
                isWishlisted ? (
                  <HeartFilled style={{ color: publicTheme.danger, fontSize: isPhone ? 13 : 15 }} />
                ) : (
                  <HeartOutlined style={{ color: publicTheme.subtext, fontSize: isPhone ? 13 : 15 }} />
                )
              }
              onClick={(event) => {
                event.stopPropagation();
                handleWish?.(product);
              }}
              style={{
                position: 'absolute',
                top: isPhone ? 6 : 8,
                right: isPhone ? 6 : 8,
                width: isPhone ? 30 : 34,
                height: isPhone ? 30 : 34,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
              }}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            />

            {/* Quick View Button */}
            <Button
              type="text"
              shape="circle"
              icon={<EyeOutlined style={{ fontSize: isPhone ? 12 : 14, color: publicTheme.text }} />}
              onClick={(event) => {
                event.stopPropagation();
                handleView?.(product);
              }}
              style={{
                position: 'absolute',
                right: isPhone ? 6 : 8,
                bottom: isPhone ? 6 : 8,
                width: isPhone ? 30 : 34,
                height: isPhone ? 30 : 34,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
              }}
              title="Quick preview"
            />
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Title & Info */}
        <div style={{ marginBottom: isPhone ? 6 : 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text
              style={{
                color: publicTheme.primary,
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              ✓ {product.shopName || product.brand || 'Aura Partner'}
            </Text>
            <span className="moq-pill" style={{ fontSize: 9.5, padding: '1px 6px' }}>
              MOQ: {product.moq || (product.price > 100 ? '2' : '5')}
            </span>
          </div>

          <Title
            level={4}
            style={{
              margin: isPhone ? '2px 0 4px' : '4px 0 6px',
              color: publicTheme.text,
              fontSize: 'var(--font-title)',
              lineHeight: 1.28,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: isPhone ? 34 : isTablet ? 36 : 40,
            }}
          >
            {product.name}
          </Title>
        </div>

        {/* Price & Stock */}
        <Flex
          justify="space-between"
          align="flex-end"
          gap={6}
          style={{ marginBottom: isPhone ? 8 : 10, marginTop: 'auto' }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <Text
                strong
                style={{
                  display: 'block',
                  color: publicTheme.primary,
                  fontSize: 'var(--font-price)',
                  fontWeight: 850,
                  lineHeight: 1.1,
                }}
              >
                {formatCurrency(product.price)}
              </Text>
              <span style={{ fontSize: 10, color: publicTheme.subtext, fontWeight: 600 }}>/ unit</span>
            </div>

            {product.originalPrice && product.originalPrice > product.price ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Text
                  delete
                  style={{
                    color: publicTheme.subtext,
                    fontSize: 'var(--font-small)',
                  }}
                >
                  {formatCurrency(product.originalPrice)}
                </Text>
                <span
                  style={{
                    color: '#ef4444',
                    fontWeight: 800,
                    fontSize: 'var(--font-small)',
                  }}
                >
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 9.5, color: '#10b981', fontWeight: 700, marginTop: 2 }}>
                Tier: Save 12% on 10+
              </div>
            )}
          </div>

          <Tag
            style={{
              margin: 0,
              borderRadius: 999,
              border: 'none',
              background: product.inStock ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: product.inStock ? '#059669' : '#dc2626',
              fontWeight: 700,
              fontSize: 10.5,
              padding: isPhone ? '1px 6px' : '2px 8px',
            }}
          >
            {product.inStock ? 'In Stock' : 'Lead Time 5d'}
          </Tag>
        </Flex>

        {/* Action Buttons: Small Order button and compact icon-only action buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            width: '100%',
            marginTop: 'auto',
            paddingTop: 8,
          }}
        >
          <Button
            type="primary"
            size="small"
            icon={<ShoppingCartOutlined style={{ fontSize: 12 }} />}
            onClick={(event) => handleAdd?.(product, event.currentTarget)}
            style={{
              flex: 1,
              borderRadius: 8,
              background: '#2F6FED',
              borderColor: '#2F6FED',
              fontWeight: 700,
              fontSize: 'var(--font-small)',
              height: isPhone ? 28 : 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '0 8px',
            }}
          >
            Order
          </Button>

          <Button
            size="small"
            icon={<SendOutlined style={{ color: '#2481cc', fontSize: 12 }} />}
            onClick={(event) => {
              event.stopPropagation();
              onOpenTelegram?.(product);
            }}
            style={{
              width: isPhone ? 28 : 30,
              height: isPhone ? 28 : 30,
              minWidth: isPhone ? 28 : 30,
              borderRadius: 8,
              padding: 0,
              background: 'rgba(36, 129, 204, 0.08)',
              border: '1px solid rgba(36, 129, 204, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Telegram E-Menu"
          />

          <Button
            size="small"
            icon={
              isWishlisted ? (
                <HeartFilled style={{ color: publicTheme.danger, fontSize: 12 }} />
              ) : (
                <HeartOutlined style={{ color: publicTheme.text, fontSize: 12 }} />
              )
            }
            onClick={(event) => {
              event.stopPropagation();
              handleWish?.(product);
            }}
            style={{
              width: isPhone ? 28 : 30,
              height: isPhone ? 28 : 30,
              minWidth: isPhone ? 28 : 30,
              borderRadius: 8,
              padding: 0,
              border: `1px solid ${publicTheme.softBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          />

          <Button
            size="small"
            icon={<LikeOutlined style={{ fontSize: 12, color: publicTheme.subtext }} />}
            onClick={(event) => {
              event.stopPropagation();
              onLike?.(product);
            }}
            style={{
              width: isPhone ? 28 : 30,
              height: isPhone ? 28 : 30,
              minWidth: isPhone ? 28 : 30,
              borderRadius: 8,
              padding: 0,
              border: `1px solid ${publicTheme.softBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Like product"
          />

          <Button
            size="small"
            icon={<ShareAltOutlined style={{ fontSize: 12, color: publicTheme.subtext }} />}
            onClick={(event) => {
              event.stopPropagation();
              onShare?.(product);
            }}
            style={{
              width: isPhone ? 28 : 30,
              height: isPhone ? 28 : 30,
              minWidth: isPhone ? 28 : 30,
              borderRadius: 8,
              padding: 0,
              border: `1px solid ${publicTheme.softBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Share product"
          />
        </div>
      </div>
    </Card>
  );
};

export default RetailProductCard;
