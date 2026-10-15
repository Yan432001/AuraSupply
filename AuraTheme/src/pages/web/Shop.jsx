import React, { useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Drawer, Flex, Grid, Input, Row, Space, Tag, Typography, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  AppstoreOutlined,
  CloseOutlined,
  RightOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import FilterSidebar from '../../components/shared/FilterSidebar';
import ProductCard from '../../components/shared/ProductCard';
import MarketplaceOrderRail from '../../components/shared/MarketplaceOrderRail';
import { products, shopCategories } from '../../data/shopData';
import { useCart } from '../../contexts/CartContext';
import { formatCompact, formatCurrency, publicTheme } from '../../utils/webTheme';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const categories = [
  { id: 'all', label: 'All lines' },
  ...shopCategories.map((category) => ({ id: category.id, label: category.name })),
];

const spotlightSections = [
  { id: 'equipment', title: 'Equipment and automation' },
  { id: 'packaging', title: 'Packaging and dispatch' },
  { id: 'safety', title: 'Safety and compliance' },
];

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedSellers, setSelectedSellers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  const screens = useBreakpoint();

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
      products.filter((product) => {
        const matchCategory = selectedCategory === 'all' || product.category === selectedCategory;
        const matchSubcategory = !selectedSubcategory || product.subcategory === selectedSubcategory;
        const matchBranch = selectedBranch === 'all' || product.branch === selectedBranch;
        const matchSeller = selectedSellers.length === 0 || selectedSellers.includes(product.seller);
        const matchSearch =
          product.name.toLowerCase().includes(searchText.toLowerCase()) ||
          product.description.toLowerCase().includes(searchText.toLowerCase());
        const matchPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

        return matchCategory && matchSubcategory && matchBranch && matchSeller && matchSearch && matchPrice;
      }),
    [selectedCategory, selectedSubcategory, selectedBranch, selectedSellers, searchText, priceRange]
  );

  const featuredProducts = useMemo(() => filteredProducts.slice(0, 6), [filteredProducts]);
  const bestVisiblePrice = useMemo(
    () => (filteredProducts.length ? Math.min(...filteredProducts.map((product) => product.price)) : 0),
    [filteredProducts]
  );

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
    />
  );

  return (
    <div style={{ minHeight: '100vh' }}>
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
            <Title level={1} style={{ marginTop: 0, marginBottom: 10, color: publicTheme.text, fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.06 }}>
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
                {formatCompact(products.filter((item) => item.inStock).length)} in stock
              </Tag>
              <Tag style={{ margin: 0, borderRadius: 999, background: 'rgba(255,255,255,0.8)', color: publicTheme.text, border: `1px solid ${publicTheme.softBorder}`, padding: '8px 12px' }}>
                Multi-device ready
              </Tag>
            </Space>
          </Col>

          <Col xs={24} lg={10}>
            <MarketplaceOrderRail
              visibleProducts={filteredProducts.length}
              inStockProducts={products.filter((item) => item.inStock).length}
              activeFiltersCount={activeFiltersCount}
              topPrice={bestVisiblePrice}
              onOpenFilters={() => setFilterDrawerVisible(true)}
            />
          </Col>
        </Row>
      </Card>

      <Card
        style={{
          borderRadius: 28,
          border: `1px solid ${publicTheme.border}`,
          background: publicTheme.cardBackground,
          boxShadow: publicTheme.lightShadow,
          marginBottom: 24,
        }}
        styles={{ body: { padding: 18 } }}
      >
        <Flex vertical gap={14}>
          <Input
            placeholder="Search products, supplier offers, or warehouse needs"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            prefix={<SearchOutlined style={{ color: publicTheme.subtext }} />}
            style={{
              height: 48,
              borderRadius: 999,
              background: '#ffffff',
              border: `1px solid ${publicTheme.softBorder}`,
            }}
          />
          <Flex justify="space-between" align="center" gap={12} wrap="wrap">
            <Space size={10} wrap>
              <Tag style={{ margin: 0, borderRadius: 999, background: publicTheme.cardMuted, color: publicTheme.text, border: `1px solid ${publicTheme.softBorder}`, padding: '6px 12px' }}>
                {activeFiltersCount} filters active
              </Tag>
              <Tag style={{ margin: 0, borderRadius: 999, background: publicTheme.cardMuted, color: publicTheme.text, border: `1px solid ${publicTheme.softBorder}`, padding: '6px 12px' }}>
                Best visible offer {formatCurrency(bestVisiblePrice)}
              </Tag>
            </Space>
            <Badge count={activeFiltersCount} size="small">
              <Button
                onClick={() => setFilterDrawerVisible(true)}
                style={{ height: 42, borderRadius: 16, background: publicTheme.ribbon, border: 'none', color: 'white', fontWeight: 700 }}
              >
                Open filters
              </Button>
            </Badge>
          </Flex>
        </Flex>
      </Card>

      <div className="responsive-scroll-row" style={{ marginBottom: 24 }}>
        <Space size={10} wrap={!screens.md}>
          {categories.map((category) => (
            <Button
              key={category.id}
              style={{
                height: 42,
                borderRadius: 999,
                fontSize: 13,
                fontWeight: selectedCategory === category.id ? 700 : 500,
                background: selectedCategory === category.id ? publicTheme.ribbon : 'rgba(255,255,255,0.8)',
                color: selectedCategory === category.id ? 'white' : publicTheme.text,
                border: selectedCategory === category.id ? 'none' : `1px solid ${publicTheme.softBorder}`,
              }}
              onClick={() => {
                setSelectedCategory(category.id);
                setSelectedSubcategory(null);
              }}
            >
              {category.label}
            </Button>
          ))}
        </Space>
      </div>

      <Row gutter={[18, 18]}>
        {screens.lg && (
          <Col lg={7} xl={6}>
            <div style={{ position: 'sticky', top: 102 }}>{filterSidebar}</div>
          </Col>
        )}

        <Col xs={24} lg={17} xl={18}>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Card style={{ borderRadius: 24, border: `1px solid ${publicTheme.border}`, background: publicTheme.cardBackground, boxShadow: publicTheme.lightShadow }} styles={{ body: { padding: 18 } }}>
                <AppstoreOutlined style={{ fontSize: 22, color: publicTheme.primary, marginBottom: 12 }} />
                <Title level={4} style={{ margin: 0, color: publicTheme.text }}>{formatCompact(filteredProducts.length)}</Title>
                <Text style={{ color: publicTheme.subtext }}>Items visible after filters</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ borderRadius: 24, border: `1px solid ${publicTheme.border}`, background: publicTheme.cardBackground, boxShadow: publicTheme.lightShadow }} styles={{ body: { padding: 18 } }}>
                <ShoppingCartOutlined style={{ fontSize: 22, color: publicTheme.primary, marginBottom: 12 }} />
                <Title level={4} style={{ margin: 0, color: publicTheme.text }}>{formatCompact(products.filter((item) => item.inStock).length)}</Title>
                <Text style={{ color: publicTheme.subtext }}>Ready-to-ship items</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card style={{ borderRadius: 24, border: `1px solid ${publicTheme.border}`, background: publicTheme.cardBackground, boxShadow: publicTheme.lightShadow }} styles={{ body: { padding: 18 } }}>
                <ThunderboltOutlined style={{ fontSize: 22, color: publicTheme.primary, marginBottom: 12 }} />
                <Title level={4} style={{ margin: 0, color: publicTheme.text }}>{activeFiltersCount || 1}</Title>
                <Text style={{ color: publicTheme.subtext }}>Review controls active</Text>
              </Card>
            </Col>
          </Row>

          {searchText || activeFiltersCount > 0 ? (
            <SectionContainer title={`Filtered results: ${filteredProducts.length}`} compact={screens.xs}>
              {filteredProducts.length > 0 ? (
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
              ) : (
                <div style={{ textAlign: 'center', padding: 50 }}>
                  <SearchOutlined style={{ fontSize: 48, marginBottom: 16, color: '#9fb0b9' }} />
                  <Text style={{ color: publicTheme.subtext, display: 'block', marginBottom: 24 }}>
                    No supplier lines matched the current search and filter stack.
                  </Text>
                  <Button
                    onClick={handleClearFilters}
                    style={{ background: publicTheme.ribbon, border: 'none', color: 'white', height: 44, borderRadius: 16, fontWeight: 700 }}
                  >
                    Reset filters
                  </Button>
                </div>
              )}
            </SectionContainer>
          ) : (
            <>
              <SectionContainer title="Recommended sourcing lines" onSeeMore={() => setSelectedCategory('all')} compact={screens.xs}>
                <Row gutter={gridGutter}>
                  {featuredProducts.map((product) => (
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

              {spotlightSections.map((section) => (
                <SectionContainer
                  key={section.id}
                  title={section.title}
                  onSeeMore={() => setSelectedCategory(section.id)}
                  compact={screens.xs}
                >
                  <Row gutter={gridGutter}>
                    {products
                      .filter((product) => product.category === section.id)
                      .slice(0, 6)
                      .map((product) => (
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
              ))}
            </>
          )}
        </Col>
      </Row>

      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>Source Products</span>
            {activeFiltersCount > 0 && (
              <Button type="link" onClick={handleClearFilters} style={{ color: publicTheme.primary, padding: 0 }}>
                Clear All
              </Button>
            )}
          </div>
        }
        placement="right"
        closable={false}
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        width={screens.xs ? 320 : 360}
        styles={{
          header: {
            padding: '20px 24px',
            borderBottom: `1px solid ${publicTheme.softBorder}`,
          },
          body: { padding: 24 },
        }}
        extra={<Button type="text" icon={<CloseOutlined />} onClick={() => setFilterDrawerVisible(false)} />}
      >
        {filterSidebar}
        <Button
          type="primary"
          block
          size="large"
          style={{
            marginTop: 24,
            background: publicTheme.ribbon,
            border: 'none',
            borderRadius: 16,
            height: 48,
            fontWeight: 700,
          }}
          onClick={() => setFilterDrawerVisible(false)}
        >
          Show {filteredProducts.length} Products
        </Button>
      </Drawer>
    </div>
  );
};

export default Shop;
