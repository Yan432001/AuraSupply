import React, { useMemo, useState, useEffect } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Flex,
  Grid,
  Input,
  Row,
  Space,
  Tag,
  Typography,
  Spin,
  Alert,
  Empty,
} from 'antd';
import {
  AppstoreOutlined,
  FireOutlined,
  GiftOutlined,
  RightOutlined,
  RocketOutlined,
  SearchOutlined,
  ShopOutlined,
  StarFilled,
  ThunderboltOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, fetchShops, fetchCategories } from '../../utils/apiconfig';
import { mapProduct, mapShop, mapCategory } from '../../utils/dataMappers';
import { formatCurrency, publicTheme } from '../../utils/webTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const shopTheme = {
  primary: '#ff6a1a',
  secondary: '#ff8d3a',
  soft: '#fff4eb',
  pale: '#fff9f4',
  dark: '#552100',
  border: 'rgba(255, 122, 48, 0.14)',
  shadow: '0 20px 48px rgba(255, 106, 26, 0.14)',
};

const MarketplaceTile = ({ product, compact = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      onClick={() => navigate(`/products/${product.slug || product.id}`)}
      style={{
        borderRadius: compact ? 20 : 24,
        border: `1px solid ${shopTheme.border}`,
        background: '#ffffff',
        boxShadow: '0 10px 28px rgba(85, 33, 0, 0.06)',
        height: '100%',
        overflow: 'hidden',
      }}
      styles={{ body: { padding: compact ? 14 : 16 } }}
      cover={
        <div style={{ position: 'relative', aspectRatio: compact ? '1 / 1' : '4 / 3', background: shopTheme.pale }}>
          <img
            src={product.image}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/assets/uploads/no_image.png';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {product.category && (
            <Tag
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                margin: 0,
                borderRadius: 999,
                border: 'none',
                background: 'rgba(255,255,255,0.92)',
                color: shopTheme.primary,
                fontWeight: 700,
              }}
            >
              {product.category}
            </Tag>
          )}
        </div>
      }
    >
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Text style={{ fontSize: 12, color: publicTheme.subtext }}>
          {product.storeName || t('verified_supplier', 'Verified Supplier')}
        </Text>
        <Title
          level={4}
          style={{
            margin: 0,
            fontSize: compact ? 14 : 16,
            lineHeight: 1.25,
            color: publicTheme.text,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: compact ? 36 : 40,
          }}
        >
          {product.name}
        </Title>
        <Flex justify="space-between" align="baseline">
          <Text strong style={{ color: shopTheme.primary, fontSize: compact ? 16 : 18 }}>
            {formatCurrency(product.price)}
          </Text>
          {product.originalPrice && (
            <Text delete style={{ color: publicTheme.subtext, fontSize: 12 }}>
              {formatCurrency(product.originalPrice)}
            </Text>
          )}
        </Flex>
      </Space>
    </Card>
  );
};

export default function ShopHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const [productsList, setProductsList] = useState([]);
  const [sellersList, setSellersList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const promoCards = [
    {
      title: t('flash_deals', 'Flash deals'),
      text: t('flash_deals_desc', 'Fast discounts across top warehouse and workplace products.'),
      accent: 'linear-gradient(135deg, #ff6a1a 0%, #ff8d3a 100%)',
    },
    {
      title: t('factory_direct', 'Factory direct'),
      text: t('factory_direct_desc', 'Browse supplier-led offers with more aggressive marketplace pricing.'),
      accent: 'linear-gradient(135deg, #ff8447 0%, #ffb067 100%)',
    },
  ];

  const quickChannels = [
    { title: t('new_arrivals', 'New arrivals'), icon: <RocketOutlined /> },
    { title: t('hot_suppliers', 'Hot suppliers'), icon: <FireOutlined /> },
    { title: t('bundle_promos', 'Bundle promos'), icon: <GiftOutlined /> },
    { title: t('shop_floors', 'Shop floors'), icon: <ShopOutlined /> },
    { title: t('trending_tools', 'Trending tools'), icon: <ThunderboltOutlined /> },
    { title: t('all_categories', 'All categories'), icon: <AppstoreOutlined /> },
  ];

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.allSettled([
      fetchProducts({ limit: 60 }),
      fetchShops(),
      fetchCategories(),
    ])
      .then(([prodRes, shopRes, catRes]) => {
        if (prodRes.status === 'fulfilled' && prodRes.value?.success && Array.isArray(prodRes.value.data)) {
          setProductsList(prodRes.value.data.map(mapProduct));
        } else if (prodRes.status === 'fulfilled' && prodRes.value?.data?.products && Array.isArray(prodRes.value.data.products)) {
          setProductsList(prodRes.value.data.products.map(mapProduct));
        } else {
          setError(prodRes.value?.error || t('could_not_load_catalog', 'Could not load products catalog'));
        }

        if (shopRes.status === 'fulfilled' && shopRes.value?.success && Array.isArray(shopRes.value.data)) {
          setSellersList(shopRes.value.data.map(mapShop));
        }

        if (catRes.status === 'fulfilled' && catRes.value?.success && Array.isArray(catRes.value.data)) {
          setCategoriesList(catRes.value.data.map(mapCategory));
        }
      })
      .catch((err) => {
        setError(err.message || t('network_error_shop', 'Network error fetching shop data'));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const hotProducts = useMemo(() => {
    if (!searchQuery.trim()) return productsList.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return productsList.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
  }, [productsList, searchQuery]);

  return (
    <div style={{ minHeight: '100vh', padding: screens.xs ? '12px' : '24px' }}>
      {/* Hero Welcome Banner */}
      <Card
        style={{
          borderRadius: 36,
          border: `1px solid ${shopTheme.border}`,
          background: 'linear-gradient(135deg, #fff7f2 0%, #ffffff 58%, #fff0e6 100%)',
          boxShadow: shopTheme.shadow,
          marginBottom: 24,
          overflow: 'hidden',
        }}
        styles={{ body: { padding: screens.xs ? 18 : 24 } }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Flex justify="space-between" align={screens.md ? 'center' : 'flex-start'} vertical={!screens.md} gap={12}>
            <div>
              <Tag
                style={{
                  margin: 0,
                  borderRadius: 999,
                  border: 'none',
                  background: shopTheme.soft,
                  color: shopTheme.primary,
                  fontWeight: 700,
                  padding: '8px 14px',
                }}
              >
                {t('marketplace_homepage', 'Marketplace homepage')}
              </Tag>
              <Title level={1} style={{ margin: '12px 0 6px', color: shopTheme.dark, fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.05 }}>
                {t('shop_home_title', 'Shop with a brighter, faster discovery page.')}
              </Title>
              <Paragraph style={{ margin: 0, color: '#7a4b2f', maxWidth: 720, fontSize: 16 }}>
                {t('shop_home_desc', 'Bold search, category navigation, supplier channels, and dense product discovery connected live to real database inventory.')}
              </Paragraph>
            </div>
            <Space wrap>
              <Button
                type="primary"
                onClick={() => navigate('/shop')}
                style={{
                  height: 46,
                  borderRadius: 999,
                  background: publicTheme.ribbon,
                  border: 'none',
                  fontWeight: 700,
                }}
              >
                {t('open_full_catalog', 'Open Full Catalog')}
              </Button>
              <Button
                onClick={() => navigate('/shops')}
                style={{
                  height: 46,
                  borderRadius: 999,
                  borderColor: shopTheme.border,
                  color: shopTheme.primary,
                  fontWeight: 700,
                }}
              >
                {t('all_verified_stores', 'All Verified Stores')} ({sellersList.length})
              </Button>
            </Space>
          </Flex>

          <Flex gap={12} wrap="wrap">
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: shopTheme.primary }} />}
              placeholder={t('search_hot_deals_placeholder', 'Search hot products, suppliers, and category deals')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: screens.xs ? '100%' : 320,
                height: 52,
                borderRadius: 999,
                border: `2px solid ${shopTheme.primary}`,
                background: '#ffffff',
              }}
              allowClear
            />
            <Button
              type="primary"
              size="large"
              onClick={() => navigate(`/shop?q=${encodeURIComponent(searchQuery)}`)}
              style={{
                height: 52,
                borderRadius: 999,
                paddingInline: 26,
                background: 'linear-gradient(135deg, #ff6a1a 0%, #ff914d 100%)',
                border: 'none',
                fontWeight: 800,
              }}
            >
              {t('search_shop', 'Search Shop')}
            </Button>
          </Flex>

          <div className="responsive-scroll-row">
            <Space size={10} wrap={!screens.md}>
              {quickChannels.map((item) => (
                <Button
                  key={item.title}
                  onClick={() => navigate('/shop')}
                  style={{
                    height: 42,
                    borderRadius: 999,
                    background: '#ffffff',
                    border: `1px solid ${shopTheme.border}`,
                    color: shopTheme.primary,
                    fontWeight: 700,
                    boxShadow: '0 8px 18px rgba(255, 106, 26, 0.08)',
                  }}
                  icon={item.icon}
                >
                  {item.title}
                </Button>
              ))}
            </Space>
          </div>
        </Space>
      </Card>

      {/* Error state */}
      {error && (
        <Alert
          type="error"
          showIcon
          message="Catalog Loading Error"
          description={error}
          action={
            <Button size="small" danger onClick={loadData} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
          style={{ marginBottom: 24, borderRadius: 16 }}
        />
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: publicTheme.subtext, fontWeight: 600 }}>{t('loading_marketplace_discovery', 'Loading marketplace discovery...')}</div>
        </div>
      ) : (
        <>
          {/* Top Rail: Categories, Promo Zone, Seller Spotlight */}
          <Row gutter={[18, 18]} style={{ marginBottom: 24 }}>
            {/* Categories Showcase */}
            <Col xs={24} lg={6}>
              <Card
                style={{
                  borderRadius: 28,
                  border: `1px solid ${shopTheme.border}`,
                  background: '#ffffff',
                  boxShadow: shopTheme.shadow,
                  height: '100%',
                }}
                styles={{ body: { padding: 18 } }}
              >
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Text strong style={{ color: shopTheme.primary, fontSize: 16 }}>
                    {t('top_categories', 'Top categories')}
                  </Text>
                  {categoriesList.slice(0, 6).map((category) => (
                    <Flex
                      key={category.id}
                      justify="space-between"
                      align="center"
                      onClick={() => navigate(`/shop?category_id=${category.id}`)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 16,
                        background: shopTheme.pale,
                        border: `1px solid ${shopTheme.border}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <Text strong style={{ color: publicTheme.text, display: 'block' }}>
                          {category.name}
                        </Text>
                        <Text style={{ color: publicTheme.subtext, fontSize: 12 }}>
                          {category.code}
                        </Text>
                      </div>
                      <RightOutlined style={{ color: shopTheme.primary }} />
                    </Flex>
                  ))}
                </Space>
              </Card>
            </Col>

            {/* Promo Middle Banner */}
            <Col xs={24} lg={12}>
              <Card
                style={{
                  borderRadius: 30,
                  border: 'none',
                  background: 'linear-gradient(135deg, #ff6a1a 0%, #ff8240 48%, #ffb46f 100%)',
                  boxShadow: shopTheme.shadow,
                  height: '100%',
                }}
                styles={{ body: { padding: screens.xs ? 20 : 28 } }}
              >
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} md={14}>
                    <Space direction="vertical" size={14}>
                      <Tag
                        style={{
                          width: 'fit-content',
                          margin: 0,
                          borderRadius: 999,
                          border: 'none',
                          background: 'rgba(255,255,255,0.18)',
                          color: 'white',
                          fontWeight: 700,
                        }}
                      >
                        {t('marketplace_promo_zone', 'Marketplace promo zone')}
                      </Tag>
                      <Title level={2} style={{ margin: 0, color: 'white', lineHeight: 1.05 }}>
                        {t('promo_banner_title', 'Big visuals, hot offers, and fast shopping entry points.')}
                      </Title>
                      <Paragraph style={{ margin: 0, color: 'rgba(255,255,255,0.86)', fontSize: 15 }}>
                        {t('promo_banner_desc', 'Discover live commercial equipment, specialty beverages, and packaging direct from verified stores.')}
                      </Paragraph>
                      <Space wrap>
                        <Button
                          size="large"
                          onClick={() => navigate('/shop')}
                          style={{
                            height: 46,
                            borderRadius: 999,
                            background: '#ffffff',
                            color: shopTheme.primary,
                            border: 'none',
                            fontWeight: 800,
                          }}
                        >
                          {t('shop_flash_sale', 'Shop flash sale')}
                        </Button>
                      </Space>
                    </Space>
                  </Col>
                  <Col xs={24} md={10}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      {promoCards.map((card) => (
                        <div
                          key={card.title}
                          style={{
                            borderRadius: 22,
                            padding: 16,
                            background: 'rgba(255,255,255,0.14)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.22)',
                            color: 'white',
                          }}
                        >
                          <Title level={4} style={{ margin: '0 0 6px', color: 'white', fontSize: 16 }}>
                            {card.title}
                          </Title>
                          <Paragraph style={{ margin: 0, color: 'rgba(255,255,255,0.82)', fontSize: 13 }}>
                            {card.text}
                          </Paragraph>
                        </div>
                      ))}
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Seller Spotlight */}
            <Col xs={24} lg={6}>
              <Space direction="vertical" size={18} style={{ width: '100%' }}>
                <Card
                  style={{
                    borderRadius: 28,
                    border: `1px solid ${shopTheme.border}`,
                    background: '#ffffff',
                    boxShadow: shopTheme.shadow,
                  }}
                  styles={{ body: { padding: 18 } }}
                >
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    <Text strong style={{ color: shopTheme.primary }}>{t('hot_rankings', 'Hot rankings')}</Text>
                    {productsList.slice(0, 4).map((product, index) => (
                      <Flex
                        key={product.id}
                        align="center"
                        gap={12}
                        onClick={() => navigate(`/products/${product.slug || product.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: index === 0 ? shopTheme.primary : shopTheme.soft,
                            color: index === 0 ? 'white' : shopTheme.primary,
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 800,
                          }}
                        >
                          {index + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong ellipsis style={{ display: 'block', color: publicTheme.text }}>
                            {product.name}
                          </Text>
                          <Text style={{ color: publicTheme.subtext, fontSize: 12 }}>
                            {formatCurrency(product.price)}
                          </Text>
                        </div>
                      </Flex>
                    ))}
                  </Space>
                </Card>

                <Card
                  style={{
                    borderRadius: 28,
                    border: `1px solid ${shopTheme.border}`,
                    background: 'linear-gradient(135deg, #fff3e8 0%, #fffaf5 100%)',
                    boxShadow: shopTheme.shadow,
                  }}
                  styles={{ body: { padding: 18 } }}
                >
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    <Text strong style={{ color: shopTheme.primary }}>{t('verified_store_partners', 'Verified Store Partners')}</Text>
                    {sellersList.slice(0, 3).map((seller) => (
                      <Flex
                        key={seller.id}
                        justify="space-between"
                        align="center"
                        onClick={() => navigate(`/shops/${seller.id || seller.slug}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div>
                          <Text strong style={{ display: 'block', color: publicTheme.text }}>
                            {seller.name}
                          </Text>
                          <Text style={{ color: publicTheme.subtext, fontSize: 12 }}>
                            {seller.city || 'Phnom Penh'}
                          </Text>
                        </div>
                        <Space size={4}>
                          <StarFilled style={{ color: '#ff9b44' }} />
                          <Text strong style={{ color: shopTheme.primary }}>{seller.rating}</Text>
                        </Space>
                      </Flex>
                    ))}
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>

          {/* Flash Sale Picks */}
          <Card
            style={{
              borderRadius: 30,
              border: `1px solid ${shopTheme.border}`,
              background: '#ffffff',
              boxShadow: shopTheme.shadow,
              marginBottom: 24,
            }}
            styles={{ body: { padding: screens.xs ? 18 : 24 } }}
          >
            <Flex justify="space-between" align={screens.xs ? 'flex-start' : 'center'} vertical={screens.xs} gap={10} style={{ marginBottom: 18 }}>
              <div>
                <Title level={3} style={{ margin: 0, color: publicTheme.text }}>
                  {t('flash_sale_picks', 'Flash sale picks')}
                </Title>
                <Paragraph style={{ margin: '6px 0 0', color: publicTheme.subtext }}>
                  {t('flash_sale_picks_desc', 'Live commercial catalog products currently available for order.')}
                </Paragraph>
              </div>
              <Button
                type="link"
                onClick={() => navigate('/shop')}
                style={{ color: shopTheme.primary, fontWeight: 700, padding: 0 }}
              >
                {t('go_to_full_catalog', 'Go to full catalog')} <RightOutlined />
              </Button>
            </Flex>

            {hotProducts.length > 0 ? (
              <Row gutter={[16, 16]}>
                {hotProducts.map((product) => (
                  <Col xs={12} md={8} xl={6} key={product.id}>
                    <MarketplaceTile product={product} compact />
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description={t('no_products_found', 'No products found')} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
