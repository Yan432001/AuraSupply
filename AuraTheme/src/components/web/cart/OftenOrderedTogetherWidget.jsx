import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Button, Tag, Typography, Space, message, Tooltip } from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  StarFilled,
  ShoppingOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { useCart } from '../../../contexts/CartContext';
import { products } from '../../../data/shopData';

const { Text, Title } = Typography;

// Complementary category synergy mapping
const categorySynergies = {
  equipment: ['packaging', 'safety', 'components'],
  packaging: ['packaging', 'equipment', 'safety'],
  safety: ['safety', 'facilities', 'equipment'],
  facilities: ['safety', 'facilities', 'office'],
  office: ['office', 'facilities', 'components'],
  components: ['equipment', 'components', 'safety'],
  coffee: ['bakery', 'coffee', 'food'],
  bakery: ['coffee', 'bakery', 'food'],
  food: ['coffee', 'bakery', 'food'],
};

// Default high-converting complementary items if cart items have no specific category
const fallbackFeaturedIds = ['prod-5', 'prod-4', 'prod-7', 'prod-6'];

export default function OftenOrderedTogetherWidget({ className = '', style = {} }) {
  const { cart, addToCart } = useCart();
  const [addedItemIds, setAddedItemIds] = useState(new Set());
  const [isAddingAll, setIsAddingAll] = useState(false);

  // Derive all active complementary recommendations based on current cart
  const recommendations = useMemo(() => {
    if (!cart || cart.length === 0) return [];

    const cartIds = new Set(cart.map((item) => String(item.id)));
    const cartCategories = new Set(
      cart.map((item) => (item.category || '').toLowerCase()).filter(Boolean)
    );

    // Build target categories from synergies
    const targetCategories = new Set();
    cartCategories.forEach((cat) => {
      const synergies = categorySynergies[cat] || [];
      synergies.forEach((s) => targetCategories.add(s));
    });

    // Score and filter candidate products
    const candidates = products
      .filter((p) => !cartIds.has(String(p.id)) && p.inStock !== false)
      .map((product) => {
        let score = 0;
        let pairingReason = 'Popular add-on';

        const pCat = (product.category || '').toLowerCase();
        if (targetCategories.has(pCat)) {
          score += 15;
          if (cartCategories.has('equipment') && pCat === 'packaging') {
            pairingReason = 'Essential for shipping & labeling';
            score += 10;
          } else if (cartCategories.has('packaging') && pCat === 'packaging') {
            pairingReason = '94% bought with packaging';
            score += 12;
          } else if (cartCategories.has('equipment') && pCat === 'safety') {
            pairingReason = 'Operator safety pairing';
            score += 8;
          } else if (cartCategories.has('safety') && pCat === 'safety') {
            pairingReason = 'Complete site compliance kit';
            score += 10;
          } else {
            pairingReason = 'Frequently paired together';
          }
        }

        // Boost for high reviews & ratings
        score += (product.rating || 4.5) * 2;
        score += Math.min((product.reviews || 0) / 10, 5);

        // Prefer affordable add-ons (< $500)
        if (product.price < 400) score += 5;

        return {
          ...product,
          score,
          pairingReason,
        };
      });

    candidates.sort((a, b) => b.score - a.score);

    // Return top 3 complementary items
    const topMatches = candidates.slice(0, 3);

    // If less than 3, backfill from fallback items
    if (topMatches.length < 3) {
      fallbackFeaturedIds.forEach((id) => {
        if (topMatches.length >= 3) return;
        if (!cartIds.has(id) && !topMatches.some((p) => p.id === id)) {
          const fallbackProd = products.find((p) => p.id === id);
          if (fallbackProd) {
            topMatches.push({
              ...fallbackProd,
              pairingReason: 'Frequently paired add-on',
            });
          }
        }
      });
    }

    return topMatches;
  }, [cart]);

  // If no items in cart or no suggestions available, don't display
  if (!cart || cart.length === 0 || recommendations.length === 0) {
    return null;
  }

  const handleAddItem = (product) => {
    addToCart(product);
    setAddedItemIds((prev) => new Set([...prev, product.id]));
    message.success(`Added ${product.name} to cart!`);

    // Reset button checkmark after 2.5 seconds
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2500);
  };

  const handleAddAllRecommendations = () => {
    setIsAddingAll(true);
    recommendations.forEach((item) => {
      addToCart(item);
      setAddedItemIds((prev) => new Set([...prev, item.id]));
    });
    message.success(`Added ${recommendations.length} complementary items to cart!`);
    setTimeout(() => {
      setIsAddingAll(false);
    }, 1800);
  };

  const totalBundlePrice = recommendations.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0
  );

  return (
    <Card
      className={`often-ordered-together-widget ${className}`}
      style={{
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.05)',
        marginTop: 20,
        overflow: 'hidden',
        ...style,
      }}
      styles={{ body: { padding: '20px 22px' } }}
    >
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              fontSize: 18,
              boxShadow: '0 3px 8px rgba(217, 119, 6, 0.15)',
              flexShrink: 0,
            }}
          >
            <ThunderboltOutlined />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title
                level={4}
                style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}
              >
                Often Ordered Together
              </Title>
              <Tag
                color="orange"
                style={{
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 8px',
                  border: 'none',
                }}
              >
                RECOMMENDED
              </Tag>
            </div>
            <Text style={{ fontSize: 12.5, color: '#64748b' }}>
              Frequently paired by buyers with items in your cart
            </Text>
          </div>
        </div>

        {/* Bundle All Button */}
        {recommendations.length > 1 && (
          <Button
            type="primary"
            size="small"
            icon={<GiftOutlined />}
            loading={isAddingAll}
            onClick={handleAddAllRecommendations}
            style={{
              borderRadius: 10,
              height: 32,
              fontSize: 12,
              fontWeight: 700,
              background: '#0f172a',
              borderColor: '#0f172a',
              padding: '0 14px',
            }}
          >
            Add All 3 Items (${totalBundlePrice.toFixed(2)})
          </Button>
        )}
      </div>

      {/* Suggested Products Grid */}
      <Row gutter={[14, 14]}>
        {recommendations.map((product) => {
          const isAdded = addedItemIds.has(product.id);
          const hasDiscount = product.originalPrice && product.originalPrice > product.price;

          return (
            <Col xs={24} sm={12} md={8} key={product.id}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                className="hover:border-blue-300 hover:shadow-md"
              >
                {/* Pairing Reason Tag */}
                <div style={{ marginBottom: 10, minHeight: 22 }}>
                  <Tag
                    style={{
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#2563eb',
                      background: '#eff6ff',
                      border: '1px solid #dbeafe',
                      margin: 0,
                    }}
                  >
                    ⚡ {product.pairingReason}
                  </Tag>
                </div>

                {/* Product Info Row */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 12,
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: '#ffffff',
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#1e293b',
                        lineHeight: 1.3,
                        marginBottom: 4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={product.name}
                    >
                      {product.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <StarFilled style={{ color: '#eab308', fontSize: 11 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>
                        {product.rating || 4.8}
                      </span>
                      {product.reviews && (
                        <span style={{ fontSize: 10.5, color: '#94a3b8' }}>
                          ({product.reviews})
                        </span>
                      )}
                    </div>

                    {product.brand && (
                      <div style={{ fontSize: 10.5, color: '#64748b' }}>
                        By {product.brand}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing & Add to Cart button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    borderTop: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                      ${Number(product.price).toFixed(2)}
                    </div>
                    {hasDiscount && (
                      <div
                        style={{
                          fontSize: 11,
                          color: '#94a3b8',
                          textDecoration: 'line-through',
                        }}
                      >
                        ${Number(product.originalPrice).toFixed(2)}
                      </div>
                    )}
                  </div>

                  <Button
                    type={isAdded ? 'primary' : 'default'}
                    size="small"
                    icon={isAdded ? <CheckOutlined /> : <PlusOutlined />}
                    onClick={() => handleAddItem(product)}
                    style={{
                      borderRadius: 10,
                      height: 32,
                      fontSize: 12,
                      fontWeight: 700,
                      background: isAdded ? '#10b981' : '#ffffff',
                      borderColor: isAdded ? '#10b981' : '#2563eb',
                      color: isAdded ? '#ffffff' : '#2563eb',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    {isAdded ? 'Added' : 'Add'}
                  </Button>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Free Shipping incentive banner */}
      <div
        style={{
          marginTop: 14,
          padding: '8px 14px',
          borderRadius: 10,
          background: 'rgba(239, 246, 255, 0.7)',
          border: '1px dashed #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 11.5, color: '#1e40af', fontWeight: 600 }}>
          💡 <strong>Pro Tip:</strong> Orders over $100 automatically qualify for Free Standard Delivery!
        </span>
        <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700 }}>
          Items ship together in 1 consolidated dispatch
        </span>
      </div>
    </Card>
  );
}
