import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Grid,
  Input,
  Row,
  Space,
  Tag,
  Typography,
  message,
  notification,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  SearchOutlined,
  SendOutlined,
  StarFilled,
  CheckCircleFilled,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ProductQuickViewModal from '../../components/web/shared/ProductQuickViewModal';
import RetailProductCard from '../../components/web/shared/RetailProductCard';
import TelegramMiniAppModal from '../../components/web/shared/TelegramMiniAppModal';
import { products, shops } from '../../data/shopData';
import simpleData from '../../../../data/simpleData';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { animateAddToCart } from '../../utils/helpers';
import { publicTheme } from '../../utils/webTheme';

const { useBreakpoint } = Grid;
const { Paragraph, Text, Title } = Typography;

export default function ShopDetail() {
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const { shopId } = useParams();
  const { addToCart, addItem } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const [messageApi, contextHolder] = message.useMessage();
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [search, setSearch] = useState('');
  const [previewProduct, setPreviewProduct] = useState(null);
  const [telegramModal, setTelegramModal] = useState({ open: false, shop: null, product: null });

  // Resolve shop from simpleData or legacy shops
  const shop = useMemo(() => {
    const foundStore = (simpleData.stores || []).find(
      (s) => s.slug === shopId || String(s.id) === String(shopId)
    );
    if (foundStore) {
      return {
        id: foundStore.slug,
        slug: foundStore.slug,
        storeId: foundStore.id,
        name: foundStore.name,
        company: foundStore.company,
        summary: foundStore.tagline || 'Artisan store with live Telegram Mini App E-Menu ordering.',
        address: foundStore.address,
        rating: foundStore.rating || 4.9,
        reviews: foundStore.reviewsCount || 140,
        followers: 12400,
        responseTime: 'within 5 min',
        heroImage: foundStore.banner || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=400&fit=crop',
        logoText: foundStore.name.slice(0, 2),
        logo: foundStore.logo,
        telegram_group_name: foundStore.telegram_group_name || 'Kitchen Staff Group',
        specialties: ['Telegram E-Menu', 'Live Kitchen Dispatch', 'Instant Checkout'],
        established: '2022',
      };
    }
    return shops.find((item) => item.id === shopId || item.slug === shopId) || shops[0];
  }, [shopId]);

  const shopProducts = useMemo(() => {
    const query = search.toLowerCase();
    const simpleProducts = (simpleData.products || [])
      .filter((p) => {
        if (!shop) return false;
        if (shop.storeId) return Number(p.biller_id) === Number(shop.storeId);
        return false;
      })
      .map((p) => ({
        id: `sp-${p.id}`,
        name: p.name,
        price: p.price,
        image: p.image,
        brand: shop.name,
        category: p.category_id === 1 ? 'Coffee' : p.category_id === 2 ? 'Teas' : p.category_id === 3 ? 'Bakery' : 'Specialty',
        description: p.details || p.name,
        features: ['Freshly Prepared', 'Telegram Direct Dispatch'],
        inStock: true,
        rating: 4.9,
        reviews: 28,
        shopId: shop.slug,
      }));

    const legacyProducts = products.filter(
      (product) => product.shopId === shopId || product.shopId === shop?.id
    );

    const merged = [...simpleProducts, ...legacyProducts];
    return merged.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        (product.brand && product.brand.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query))
    );
  }, [search, shopId, shop]);

  const handleOrder = (product, triggerElement) => {
    animateAddToCart({
      triggerElement,
      productImage: product.image,
    });
    addToCart(product);
    notificationApi.success({
      message: `${product.name} added to cart`,
      description: `Wholesale procurement item recorded.`,
      placement: 'bottomRight',
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      messageApi.success('Storefront link copied!');
    }
  };

  if (!shop) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Title level={3}>Supplier not found</Title>
        <Button type="primary" onClick={() => navigate('/shops')}>Back to Suppliers</Button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', paddingBottom: 56 }}>
      {contextHolder}
      {notificationContextHolder}

      {/* Supplier Profile Banner */}
      <Card
        style={{
          borderRadius: 24,
          border: `1px solid ${publicTheme.border}`,
          overflow: 'hidden',
          marginBottom: 28,
          boxShadow: publicTheme.shadow,
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ height: 200, position: 'relative', overflow: 'hidden' }}>
          <img
            src={shop.heroImage || shop.banner}
            alt={shop.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.75) 0%, transparent 70%)',
            }}
          />
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/shops')}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.85)',
              fontWeight: 700,
            }}
          >
            All Suppliers
          </Button>
        </div>

        <div style={{ padding: '24px 28px', background: '#ffffff' }}>
          <Row gutter={[24, 20]} align="middle" justify="space-between">
            <Col xs={24} md={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar
                  size={64}
                  src={shop.logo}
                  style={{
                    background: publicTheme.primary,
                    fontWeight: 800,
                    fontSize: 22,
                    border: '3px solid #ffffff',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  }}
                >
                  {shop.logoText || shop.name.slice(0, 2)}
                </Avatar>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Title level={2} style={{ margin: 0, fontWeight: 850, color: publicTheme.text }}>
                      {shop.name}
                    </Title>
                    <span className="verified-supplier-pill">
                      <CheckCircleFilled /> Verified Factory Store
                    </span>
                  </div>
                  <Text style={{ color: publicTheme.subtext, fontSize: 13 }}>
                    {shop.summary}
                  </Text>
                </div>
              </div>

              {/* Meta stats */}
              <div style={{ display: 'flex', gap: 18, marginTop: 16, flexWrap: 'wrap', fontSize: 12.5, color: publicTheme.subtext }}>
                <span><EnvironmentOutlined style={{ color: publicTheme.primary }} /> {shop.address || shop.branch || 'Phnom Penh'}</span>
                <span><StarFilled style={{ color: '#f59e0b' }} /> <strong>{shop.rating || 4.9}</strong> ({shop.reviews || 140} reviews)</span>
                <span><ClockCircleOutlined style={{ color: '#10b981' }} /> Response: {shop.responseTime || 'under 5 min'}</span>
              </div>
            </Col>

            <Col xs={24} md={8} style={{ textAlign: screens.xs ? 'left' : 'right' }}>
              <Space wrap size={10}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => setTelegramModal({ open: true, shop, product: null })}
                  style={{
                    borderRadius: 12,
                    height: 44,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #2f6fed 0%, #1d4ed8 100%)',
                    border: 'none',
                  }}
                >
                  Telegram Mini App
                </Button>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                  style={{ borderRadius: 12, height: 44 }}
                />
              </Space>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Supplier Catalog Toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 18,
          padding: '12px 20px',
          border: `1px solid ${publicTheme.border}`,
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: publicTheme.text }}>
          Supplier Products ({shopProducts.length})
        </div>

        <Input
          prefix={<SearchOutlined style={{ color: publicTheme.subtext }} />}
          placeholder="Filter supplier catalog..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: screens.xs ? '100%' : 260, borderRadius: 10 }}
        />
      </div>

      {/* Product Grid */}
      <Row gutter={screens.xs ? [12, 12] : [16, 16]}>
        {shopProducts.map((product) => (
          <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
            <RetailProductCard
              product={product}
              onPreview={setPreviewProduct}
              onOrder={handleOrder}
              onWishlist={toggleWishlist}
              isWishlisted={wishlist.some((item) => item.id === product.id)}
            />
          </Col>
        ))}
      </Row>

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={previewProduct}
        open={Boolean(previewProduct)}
        onClose={() => setPreviewProduct(null)}
        onOrder={handleOrder}
      />

      {/* Telegram Gateway Modal */}
      <TelegramMiniAppModal
        open={telegramModal.open}
        onClose={() => setTelegramModal({ open: false, shop: null, product: null })}
        shop={telegramModal.shop}
        allProducts={products}
      />
    </div>
  );
}
