import React from 'react';
import { Button, Card, Grid, Space, Tag, Typography } from 'antd';
import {
  CheckCircleFilled,
  HeartFilled,
  HeartOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { branches, sellers } from '../../../data/shopData';
import { formatCurrency, publicTheme } from '../../../utils/webTheme';

const { useBreakpoint } = Grid;
const { Paragraph, Text, Title } = Typography;

const readProductNumber = (productId) => Number(String(productId).replace(/[^0-9]/g, '')) || 1;

const getOrderMeta = (product) => {
  const seed = readProductNumber(product.id);
  return {
    minOrder: product.price > 1200 ? 1 : product.price > 500 ? 2 : 4 + (seed % 4),
    leadTime: product.inStock ? 2 + (seed % 4) : 7 + (seed % 5),
    responseRate: 91 + (seed % 7),
  };
};

const ProductCard = ({
  product,
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
}) => {
  const screens = useBreakpoint();
  const isPhone = !screens.sm;
  const isTablet = screens.sm && !screens.lg;
  const isCompact = !screens.lg;

  const seller = sellers.find((item) => item.id === product.seller);
  const branch = branches.find((item) => item.id === product.branch);
  const orderMeta = getOrderMeta(product);
  const discountPercent = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <Card
      hoverable
      className="app-product-card retail-product-card-wrapper"
      style={{
        borderRadius: isPhone ? 18 : isTablet ? 22 : 28,
        overflow: 'hidden',
        border: `1px solid ${publicTheme.border}`,
        background: publicTheme.cardBackground,
        boxShadow: publicTheme.lightShadow,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      styles={{
        body: {
          padding: isPhone ? 10 : isTablet ? 12 : 18,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
      cover={
        <div
          style={{
            paddingTop: isPhone ? 8 : isTablet ? 10 : 16,
            paddingLeft: isPhone ? 8 : isTablet ? 10 : 16,
            paddingRight: isPhone ? 8 : isTablet ? 10 : 16,
            paddingBottom: 0,
          }}
        >
          <div
            style={{
              position: 'relative',
              borderRadius: isPhone ? 14 : isTablet ? 18 : 24,
              overflow: 'hidden',
              background: publicTheme.cardMuted,
              aspectRatio: '1 / 1',
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            <div
              style={{
                position: 'absolute',
                top: isPhone ? 6 : 10,
                left: isPhone ? 6 : 10,
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              {discountPercent > 0 && (
                <Tag
                  style={{
                    margin: 0,
                    borderRadius: 999,
                    border: 'none',
                    background: publicTheme.ribbon,
                    color: 'white',
                    fontWeight: 700,
                    fontSize: isPhone ? 9 : 11,
                    padding: isPhone ? '1px 5px' : '2px 8px',
                  }}
                >
                  -{discountPercent}%
                </Tag>
              )}
              <Tag
                style={{
                  margin: 0,
                  borderRadius: 999,
                  border: 'none',
                  background: 'rgba(255,255,255,0.92)',
                  color: publicTheme.text,
                  fontWeight: 700,
                  fontSize: isPhone ? 9 : 11,
                  padding: isPhone ? '1px 5px' : '2px 8px',
                }}
              >
                MOQ {orderMeta.minOrder}
              </Tag>
            </div>

            <Button
              type="text"
              shape="circle"
              icon={
                isFavorite ? (
                  <HeartFilled style={{ color: publicTheme.danger, fontSize: isPhone ? 13 : 15 }} />
                ) : (
                  <HeartOutlined style={{ fontSize: isPhone ? 13 : 15 }} />
                )
              }
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite?.(product.id);
              }}
              style={{
                position: 'absolute',
                top: isPhone ? 6 : 10,
                right: isPhone ? 6 : 10,
                width: isPhone ? 30 : 38,
                height: isPhone ? 30 : 38,
                background: 'rgba(255,255,255,0.92)',
                color: isFavorite ? publicTheme.danger : publicTheme.subtext,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              }}
            />

            {!product.inStock && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.85)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Tag
                  style={{
                    margin: 0,
                    borderRadius: 999,
                    border: 'none',
                    background: publicTheme.danger,
                    color: 'white',
                    fontWeight: 700,
                    padding: isPhone ? '4px 8px' : '8px 14px',
                    fontSize: isPhone ? 10 : 12,
                  }}
                >
                  Backorder only
                </Tag>
              </div>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <Tag
              style={{
                margin: 0,
                borderRadius: 999,
                border: 'none',
                background: 'rgba(20,92,114,0.12)',
                color: publicTheme.primary,
                fontWeight: 700,
                fontSize: isPhone ? 9 : 11,
                padding: isPhone ? '0 5px' : '1px 8px',
              }}
            >
              Verified
            </Tag>
            <Text style={{ color: publicTheme.subtext, fontSize: isPhone ? 10 : 12 }}>
              {branch?.name}
            </Text>
          </div>

          <Title
            level={4}
            style={{
              margin: isPhone ? '2px 0 4px' : '6px 0 6px',
              color: publicTheme.text,
              fontSize: isPhone ? 13 : isTablet ? 14 : 17,
              lineHeight: 1.28,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: isPhone ? 32 : isTablet ? 36 : 42,
            }}
          >
            {product.name}
          </Title>

          {/* Sourcing Metrics */}
          {isPhone ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 6px',
                background: publicTheme.cardMuted,
                borderRadius: 8,
                fontSize: 10,
                color: publicTheme.text,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              <span>⚡ {orderMeta.leadTime}d</span>
              <span>💬 {orderMeta.responseRate}%</span>
              <span>⭐ {product.rating}</span>
            </div>
          ) : (
            <div
              style={{
                borderRadius: 14,
                background: publicTheme.cardMuted,
                border: `1px solid ${publicTheme.softBorder}`,
                padding: isTablet ? 8 : 12,
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, textAlign: 'center' }}>
                <div>
                  <Text style={{ display: 'block', fontSize: 10, color: publicTheme.subtext }}>Lead time</Text>
                  <Text strong style={{ color: publicTheme.text, fontSize: isTablet ? 11 : 13 }}>{orderMeta.leadTime}d</Text>
                </div>
                <div>
                  <Text style={{ display: 'block', fontSize: 10, color: publicTheme.subtext }}>Response</Text>
                  <Text strong style={{ color: publicTheme.text, fontSize: isTablet ? 11 : 13 }}>{orderMeta.responseRate}%</Text>
                </div>
                <div>
                  <Text style={{ display: 'block', fontSize: 10, color: publicTheme.subtext }}>Rating</Text>
                  <Text strong style={{ color: publicTheme.text, fontSize: isTablet ? 11 : 13 }}>{product.rating}/5</Text>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          {/* Price & Stock */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <Text strong style={{ color: publicTheme.primary, fontSize: isPhone ? 16 : isTablet ? 18 : 22, lineHeight: 1 }}>
                {formatCurrency(product.price)}
              </Text>
              {product.originalPrice && product.originalPrice > product.price && (
                <Text delete style={{ color: publicTheme.subtext, display: 'block', fontSize: isPhone ? 10 : 11 }}>
                  {formatCurrency(product.originalPrice)}
                </Text>
              )}
            </div>

            <Tag
              style={{
                margin: 0,
                borderRadius: 999,
                border: 'none',
                background: product.inStock ? 'rgba(33,122,89,0.14)' : 'rgba(198,81,75,0.14)',
                color: product.inStock ? publicTheme.success : publicTheme.danger,
                fontWeight: 700,
                fontSize: isPhone ? 9 : 11,
                padding: isPhone ? '1px 5px' : '2px 8px',
              }}
            >
              {product.inStock ? 'In stock' : 'Restock'}
            </Tag>
          </div>

          {/* Action Button */}
          <Button
            type="primary"
            block
            icon={<ShoppingCartOutlined style={{ fontSize: isPhone ? 12 : 14 }} />}
            onClick={(event) => {
              event.stopPropagation();
              onAddToCart?.(product);
            }}
            style={{
              background: publicTheme.ribbon,
              border: 'none',
              borderRadius: isPhone ? 10 : 14,
              height: isPhone ? 32 : isTablet ? 36 : 42,
              fontWeight: 700,
              fontSize: isPhone ? 11 : 13,
            }}
          >
            {isPhone ? '+ RFQ' : 'Start RFQ'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
