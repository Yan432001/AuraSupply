import React from 'react';
import { Button, Card, Col, Image, Row, Space, Typography, Tag, message } from 'antd';
import {
  HeartOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  ShopOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { formatCurrency, publicTheme } from '../../utils/webTheme';

const { Paragraph, Text, Title } = Typography;

export default function Wishlist() {
  const navigate = useNavigate();
  const { addItem, addToCart } = useCart();
  const { wishlist, removeFromWishlist, wishlistItemCount, clearWishlist } = useWishlist();

  const handleMoveAllToCart = () => {
    if (wishlist.length === 0) return;
    wishlist.forEach((item) => {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.moq || 1,
      });
    });
    message.success(`Moved all ${wishlist.length} bookmarked products to your procurement cart!`);
    navigate('/cart');
  };

  const handleAddToCartSingle = (item) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.moq || 1,
    });
    message.success(`Added ${item.name} to cart!`);
  };

  if (wishlist.length === 0) {
    return (
      <div style={{ padding: '60px 0', maxWidth: 640, margin: '0 auto' }}>
        <Card
          style={{
            borderRadius: 24,
            textAlign: 'center',
            padding: '50px 24px',
            border: `1px solid ${publicTheme.border}`,
            background: '#ffffff',
            boxShadow: publicTheme.lightShadow,
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16, color: publicTheme.primary }}>
            <HeartOutlined />
          </div>
          <Title level={3} style={{ color: publicTheme.text, margin: '0 0 8px', fontWeight: 850 }}>
            Your Sourcing Shortlist is Empty
          </Title>
          <Paragraph style={{ color: publicTheme.subtext, marginBottom: 24, fontSize: 14 }}>
            Bookmark equipment, wholesale ingredients, packaging, and commercial supplies to compare and purchase in bulk.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/products')}
            style={{
              borderRadius: 14,
              height: 46,
              paddingInline: 28,
              background: publicTheme.primary,
              border: 'none',
              fontWeight: 700,
            }}
          >
            Explore Wholesale Catalog
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', paddingBottom: 56 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '32px 36px',
          borderRadius: 24,
          color: 'white',
          marginBottom: 28,
          boxShadow: publicTheme.shadow,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8', fontWeight: 800, marginBottom: 4 }}>
            Procurement Bookmarks
          </div>
          <Title level={2} style={{ color: '#ffffff', margin: 0, fontWeight: 850 }}>
            Sourcing Shortlist ({wishlistItemCount} Items)
          </Title>
        </div>

        <Space size={10}>
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={handleMoveAllToCart}
            style={{
              borderRadius: 12,
              height: 44,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #2f6fed 0%, #1d4ed8 100%)',
              border: 'none',
              paddingInline: 20,
            }}
          >
            Move All to Cart &rarr;
          </Button>
        </Space>
      </div>

      {/* Bookmarks Grid */}
      <Row gutter={[20, 20]}>
        {wishlist.map((item) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={item.id}>
            <Card
              hoverable
              style={{
                borderRadius: 20,
                border: `1px solid ${publicTheme.border}`,
                overflow: 'hidden',
                boxShadow: publicTheme.lightShadow,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
              styles={{ body: { padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
              cover={
                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Button
                    type="text"
                    shape="circle"
                    icon={<DeleteOutlined style={{ color: '#ef4444' }} />}
                    onClick={() => removeFromWishlist(item.id)}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(255,255,255,0.9)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                </div>
              }
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: publicTheme.subtext, textTransform: 'uppercase' }}>
                  {item.brand || item.shopName || 'Wholesale Supplier'}
                </div>
                <div
                  onClick={() => navigate(`/products/${item.id}`)}
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: publicTheme.text,
                    margin: '4px 0 10px',
                    cursor: 'pointer',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.name}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: publicTheme.primary }}>
                    {formatCurrency(item.price)}
                  </span>
                  <Tag color="green" style={{ borderRadius: 6, margin: 0 }}>
                    In Stock
                  </Tag>
                </div>

                <Button
                  type="primary"
                  block
                  icon={<ShoppingCartOutlined />}
                  onClick={() => handleAddToCartSingle(item)}
                  style={{
                    borderRadius: 10,
                    fontWeight: 700,
                    background: publicTheme.primary,
                  }}
                >
                  Add to Cart
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
