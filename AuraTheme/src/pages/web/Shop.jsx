import React, { useMemo, useState, useEffect } from 'react';
import { Badge, Button, Card, Col, Drawer, Flex, Grid, Input, Row, Space, Tag, Typography, notification, Spin, Alert, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  AppstoreOutlined,
  CloseOutlined,
  RightOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import FilterSidebar from '../../components/web/shared/FilterSidebar';
import ProductCard from '../../components/web/shared/ProductCard';
import MarketplaceOrderRail from '../../components/web/shared/MarketplaceOrderRail';
import { fetchProducts, fetchCategories, fetchShops } from '../../utils/apiconfig';
import { mapProduct, mapCategory, mapShop } from '../../utils/dataMappers';
import { useCart } from '../../contexts/CartContext';
import { formatCompact, formatCurrency, publicTheme } from '../../utils/webTheme';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const SectionContainer = ({ title, children, onSeeMore, compact }) => (
  <div
    style={{
      background: publicTheme.cardBackground,
      borderRadius: 28,
      padding: compact ? '16px' : '24px',
      marginBottom: 24,
      boxShadow: publicTheme.lightShadow,
      border: `1px solid ${publicTheme.border}`,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
      <Title level={3} style={{ margin: 0, fontSize: compact ? 18 : 20, color: publicTheme.text, fontWeight: 700 }}>
        {title}
      </Title>
      {onSeeMore && (
        <Button
          type="link"
          style={{
            color: publicTheme.primary,
            fontWeight: 600,
            padding: 0,
            fontSize: 13,
          }}
          onClick={onSeeMore}
        >
          See more <RightOutlined style={{ fontSize: 10 }} />
        </Button>
      )}
    </div>
    {children}
  </div>
);

const Shop = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [notificationApi, notificationContextHolder] = notification.useNotification();

  // Dynamic API state
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [shopsList, setShopsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedSellers, setSelectedSellers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  const screens = useBreakpoint();

  const loadData = () => {
    setLoading(true);
    setFetchError(null);

    Promise.allSettled([
      fetchProducts({ limit: 120 }),
      fetchCategories(),
      fetchShops(),
    ])
      .then(([prodRes, catRes, shopRes]) => {
        let hasError = false;

        // Products
        const rawProds = prodRes.status === 'fulfilled' ? (prodRes.value?.data || prodRes.value?.products || (Array.isArray(prodRes.value) ? prodRes.value : [])) : [];
        if (Array.isArray(rawProds) && rawProds.length > 0) {
          setProductsList(rawProds.map(mapProduct).filter(Boolean));
        } else if (prodRes.status === 'fulfilled' && prodRes.value?.data?.products && Array.isArray(prodRes.value.data.products)) {
          setProductsList(prodRes.value.data.products.map(mapProduct).filter(Boolean));
        } else {
          hasError = true;
          setFetchError(prodRes.value?.error || 'Failed to load products from database');
        }

        // Categories
        const rawCats = catRes.status === 'fulfilled' ? (catRes.value?.data || catRes.value?.categories || (Array.isArray(catRes.value) ? catRes.value : [])) : [];
        if (Array.isArray(rawCats)) {
          setCategoriesList(rawCats.map(mapCategory).filter(Boolean));
        }

        // Shops
        const rawShops = shopRes.status === 'fulfilled' ? (shopRes.value?.data || shopRes.value?.shops || shopRes.value?.stores || (Array.isArray(shopRes.value) ? shopRes.value : [])) : [];
        if (Array.isArray(rawShops)) {
          setShopsList(rawShops.map(mapShop).filter(Boolean));
        }
      })
      .catch((err) => {
        setFetchError(err.message || 'Error connecting to API server');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
    notificationApi.success({
      message: (
        <span style={{ fontWeight: 800, fontSize: 14 }}>
          {product.name} Added to Cart!
        </span>
      ),
      description: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, marginBottom: 8 }}>
          <img
            src={product.image}
            alt=""
            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/uploads/no_image.png'; }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#2563eb' }}>
              ${Number(product.price).toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Item ready for checkout</div>
          </div>
        </div>
      ),
      actions: (
        <Space size={8}>
          <Button size="small" onClick={() => notificationApi.destroy()} style={{ borderRadius: 8, fontSize: 12 }}>
            Continue
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              notificationApi.destroy();
              navigate('/cart');
            }}
            style={{
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              background: '#2563eb',
              borderColor: '#2563eb',
            }}
          >
            View Cart &amp; Checkout →
          </Button>
        </Space>
      ),
      duration: 5,
      placement: 'topRight',
    });
  };

  const gridGutter = screens.xs ? [10, 10] : screens.sm ? [12, 12] : [18, 18];

  const columnConfig = {
    xs: 12,
    sm: 8,
    md: 8,
    lg: 8,
    xl: 6,
    xxl: 6,
  };

  const activeFiltersCount = useMemo(
    () =>
      [
        selectedCategory !== 'all',
        selectedSubcategory !== null,
        selectedBranch !== 'all',
        selectedSellers.length > 0,
        priceRange[0] > 0 || priceRange[1] < 5000,
      ].filter(Boolean).length,
    [selectedCategory, selectedSubcategory, selectedBranch, selectedSellers, priceRange]
  );

  const filteredProducts = useMemo(
    () =>
      productsList.filter((product) => {
        const matchCategory =
          selectedCategory === 'all' ||
          String(product.categoryId) === String(selectedCategory) ||
          product.category === selectedCategory;
        const matchSubcategory =
          !selectedSubcategory || product.subcategory === selectedSubcategory;
        const matchBranch =
          selectedBranch === 'all' || product.branch === selectedBranch;
        const matchSeller =
          selectedSellers.length === 0 ||
          selectedSellers.includes(product.biller_id) ||
          selectedSellers.includes(product.seller);
        const matchSearch =
          (product.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
          (product.description || '').toLowerCase().includes(searchText.toLowerCase());
        const matchPrice =
          product.price >= priceRange[0] && product.price <= priceRange[1];

        return matchCategory && matchSubcategory && matchBranch && matchSeller && matchSearch && matchPrice;
      }),
    [productsList, selectedCategory, selectedSubcategory, selectedBranch, selectedSellers, searchText, priceRange]
  );

  const featuredProducts = useMemo(() => filteredProducts.slice(0, 6), [filteredProducts]);

  const toggleFavorite = (productId) => {
    setFavorites((previous) => {
      const updated = new Set(previous);
      if (updated.has(productId)) {
        updated.delete(productId);
      } else {
        updated.add(productId);
      }
      return updated;
    });
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory(null);
    setSelectedBranch('all');
    setSelectedSellers([]);
    setPriceRange([0, 5000]);
    setSearchText('');
  };

  const filterSidebar = (
    <FilterSidebar
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      selectedSubcategory={selectedSubcategory}
      setSelectedSubcategory={setSelectedSubcategory}
      selectedBranch={selectedBranch}
      setSelectedBranch={setSelectedBranch}
      selectedSellers={selectedSellers}
      setSelectedSellers={setSelectedSellers}
      priceRange={priceRange}
      setPriceRange={setPriceRange}
      categories={categoriesList}
      sellers={shopsList}
    />
  );

  return (
    <div style={{ minHeight: '100vh', padding: screens.xs ? '12px' : '24px' }}>
      {notificationContextHolder}
      <Card
        className="frosted-panel stagger-rise"
        style={{
          borderRadius: 34,
          border: `1px solid ${publicTheme.border}`,
          boxShadow: publicTheme.shadow,
          background: publicTheme.heroBackground,
          overflow: 'hidden',
          marginBottom: 24,
        }}
        styles={{ body: { padding: screens.xs ? 18 : 26 } }}
      >
        <Row gutter={[18, 18]} align="middle">
          <Col xs={24} lg={14}>
            <Tag style={{ borderRadius: 999, border: 'none', background: publicTheme.pill, color: publicTheme.primary, fontWeight: 700, padding: '8px 14px', marginBottom: 12 }}>
              Supplier chain marketplace
            </Tag>
            <Title level={1} style={{ marginTop: 0, marginBottom: 10, color: publicTheme.text, fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.1 }}>
              Source business-ready products for warehousing, service, and operations teams.
            </Title>
            <Paragraph style={{ color: publicTheme.subtext, fontSize: 16, display: 'block', marginBottom: 18 }}>
              Search verified suppliers, compare hub availability, and move from sourcing filters into RFQ-ready product cards built for B2B buyers.
            </Paragraph>
            <Space size={10} wrap>
              <Tag style={{ margin: 0, borderRadius: 999, background: 'rgba(255,255,255,0.8)', color: publicTheme.text, border: `1px solid ${publicTheme.softBorder}`, padding: '8px 12px' }}>
                {formatCompact(filteredProducts.length)} visible items
              </Tag>
              <Tag style={{ margin: 0, borderRadius: 999, background: 'rgba(255,255,255,0.8)', color: publicTheme.text, border: `1px solid ${publicTheme.softBorder}`, padding: '8px 12px' }}>
                {formatCompact(productsList.filter((item) => item.inStock).length)} in stock
              </Tag>
              <Tag style={{ margin: 0, borderRadius: 999, background: 'rgba(255,255,255,0.8)', color: publicTheme.text, border: `1px solid ${publicTheme.softBorder}`, padding: '8px 12px' }}>
                {shopsList.length} verified stores
              </Tag>
            </Space>
          </Col>
          <Col xs={24} lg={10}>
            <MarketplaceOrderRail />
          </Col>
        </Row>
      </Card>

      {/* Error state */}
      {fetchError && (
        <Alert
          type="error"
          showIcon
          message="Catalog Connection Error"
          description={fetchError}
          action={
            <Button size="small" danger onClick={loadData} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
          style={{ marginBottom: 24, borderRadius: 16 }}
        />
      )}

      {/* Main Content Layout */}
      <Row gutter={[24, 24]}>
        {/* Desktop Sidebar */}
        <Col xs={0} md={8} lg={6}>
          {filterSidebar}
        </Col>

        {/* Products Grid */}
        <Col xs={24} md={16} lg={18}>
          {/* Search bar & quick filter toggles */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <Input
              size="large"
              placeholder="Search products by title, SKU, or specs..."
              prefix={<SearchOutlined style={{ color: publicTheme.subtext }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ flex: 1, minWidth: 220, borderRadius: 16 }}
              allowClear
            />
            <Button
              size="large"
              icon={<AppstoreOutlined />}
              onClick={() => setFilterDrawerVisible(true)}
              className="lg:hidden"
              style={{ borderRadius: 16 }}
            >
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>

          {/* Quick Metrics Bar */}
          <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
            <Col xs={12} md={8}>
              <Card style={{ borderRadius: 20, border: `1px solid ${publicTheme.border}`, background: publicTheme.cardBackground }} styles={{ body: { padding: 14 } }}>
                <ShoppingCartOutlined style={{ fontSize: 18, color: publicTheme.primary, marginBottom: 6 }} />
                <Title level={4} style={{ margin: 0, color: publicTheme.text }}>{formatCompact(productsList.filter((item) => item.inStock).length)}</Title>
                <Text style={{ color: publicTheme.subtext, fontSize: 12 }}>Ready-to-ship items</Text>
              </Card>
            </Col>
            <Col xs={12} md={8}>
              <Card style={{ borderRadius: 20, border: `1px solid ${publicTheme.border}`, background: publicTheme.cardBackground }} styles={{ body: { padding: 14 } }}>
                <ThunderboltOutlined style={{ fontSize: 18, color: publicTheme.primary, marginBottom: 6 }} />
                <Title level={4} style={{ margin: 0, color: publicTheme.text }}>{activeFiltersCount}</Title>
                <Text style={{ color: publicTheme.subtext, fontSize: 12 }}>Active filters</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ borderRadius: 20, border: `1px solid ${publicTheme.border}`, background: publicTheme.cardBackground }} styles={{ body: { padding: 14 } }}>
                <AppstoreOutlined style={{ fontSize: 18, color: publicTheme.primary, marginBottom: 6 }} />
                <Title level={4} style={{ margin: 0, color: publicTheme.text }}>{filteredProducts.length}</Title>
                <Text style={{ color: publicTheme.subtext, fontSize: 12 }}>Items matching search</Text>
              </Card>
            </Col>
          </Row>

          {/* Loading state */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: publicTheme.subtext, fontWeight: 600 }}>Loading real products catalog...</div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <SectionContainer title={`Catalog Products (${filteredProducts.length})`} compact={screens.xs}>
              <Row gutter={gridGutter}>
                {filteredProducts.map((product) => (
                  <Col {...columnConfig} key={product.id}>
                    <ProductCard
                      product={product}
                      isFavorite={favorites.has(product.id)}
                      onToggleFavorite={toggleFavorite}
                      onAddToCart={handleAddToCart}
                    />
                  </Col>
                ))}
              </Row>
            </SectionContainer>
          ) : (
            <Card style={{ borderRadius: 24, textAlign: 'center', padding: '40px 20px', border: `1px solid ${publicTheme.border}` }}>
              <Empty
                description={
                  <div style={{ marginTop: 12 }}>
                    <Text strong style={{ fontSize: 16, display: 'block', color: publicTheme.text }}>
                      No products found
                    </Text>
                    <Text style={{ color: publicTheme.subtext, fontSize: 13 }}>
                      No supplier items match your current filter and search settings.
                    </Text>
                  </div>
                }
              />
              {activeFiltersCount > 0 && (
                <Button
                  onClick={handleClearFilters}
                  style={{ background: publicTheme.ribbon, border: 'none', color: 'white', height: 40, borderRadius: 14, fontWeight: 700, marginTop: 16 }}
                >
                  Reset all filters
                </Button>
              )}
            </Card>
          )}
        </Col>
      </Row>

      {/* Mobile Filters Drawer */}
      <Drawer
        title="Source Products Filters"
        placement="left"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        width={screens.xs ? '88%' : 360}
      >
        {filterSidebar}
      </Drawer>
    </div>
  );
};

export default Shop;
