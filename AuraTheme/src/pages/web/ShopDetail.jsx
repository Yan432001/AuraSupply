import React, { useMemo, useState, useEffect } from 'react';
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
  Spin,
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
import { fetchShopById, fetchProducts } from '../../utils/apiconfig';
import { mapShop, mapProduct } from '../../utils/dataMappers';
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
  const [shop, setShop] = useState(null);
  const [shopProducts, setShopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchShopById(shopId)
      .then((res) => {
        if (!isMounted) return;
        const rawShop = res?.data || res?.shop || res?.store || (res?.id ? res : null);
        if (rawShop && typeof rawShop === 'object') {
          const mapped = mapShop(rawShop);
          setShop(mapped);
          const storeBillerId = mapped.biller_id || mapped.id;
          return fetchProducts({ biller_id: storeBillerId, limit: 100 });
        }
        return null;
      })
      .then((pRes) => {
        if (!isMounted) return;
        const rawProds = pRes?.data || pRes?.products || (Array.isArray(pRes) ? pRes : []);
        if (Array.isArray(rawProds)) {
          setShopProducts(rawProds.map(mapProduct).filter(Boolean));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error fetching shop detail from API:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [shopId]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return shopProducts;
    return shopProducts.filter(
      (product) =>
        product.name?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
    );
  }, [search, shopProducts]);

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

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <Spin size="large" tip="Loading supplier profile and catalog from database..." />
      </div>
    );
  }

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
          Supplier Products ({filteredProducts.length})
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
      {filteredProducts.length === 0 ? (
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: '60px 20px', border: `1px solid ${publicTheme.border}` }}>
          <ShopOutlined style={{ fontSize: 44, color: '#94a3b8', marginBottom: 12 }} />
          <Title level={4} style={{ color: publicTheme.text, marginBottom: 6 }}>
            {search ? 'No products match your search keyword' : 'This store currently has no products published in its catalog.'}
          </Title>
          <Text style={{ color: publicTheme.subtext, display: 'block', marginBottom: 16 }}>
            {search ? 'Try clearing your search term to see other items.' : 'Check back later or browse other verified factory suppliers.'}
          </Text>
          {search ? (
            <Button onClick={() => setSearch('')}>Clear Search</Button>
          ) : (
            <Button type="primary" onClick={() => navigate('/shops')}>Explore All Suppliers</Button>
          )}
        </Card>
      ) : (
        <Row gutter={screens.xs ? [12, 12] : [16, 16]}>
          {filteredProducts.map((product) => (
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
      )}

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
        allProducts={shopProducts}
      />
    </div>
  );
}
