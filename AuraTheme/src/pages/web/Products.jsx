import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Grid,
  Input,
  Row,
  Select,
  Slider,
  Space,
  Switch,
  Tag,
  Typography,
  message,
  notification,
  Spin,
  Empty,
  Table,
  Tooltip,
} from 'antd';
import {
  AppstoreOutlined,
  BarsOutlined,
  CloseOutlined,
  FilterOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  LoadingOutlined,
  SyncOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductQuickViewModal from '../../components/web/shared/ProductQuickViewModal';
import RetailProductCard from '../../components/web/shared/RetailProductCard';
import TelegramMiniAppModal from '../../components/web/shared/TelegramMiniAppModal';
import { fetchProducts, fetchCategories, fetchBrands, fetchShops, fetchBranches } from '../../utils/apiconfig';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { animateAddToCart } from '../../utils/helpers';
import { formatCurrency, publicTheme, calculateTierPrice } from '../../utils/webTheme';

const { useBreakpoint } = Grid;
const { Paragraph, Text, Title } = Typography;

const Products = () => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const { addToCart, addItem } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const [messageApi, contextHolder] = message.useMessage();
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const urlCategory = searchParams.get('category') || 'all';
  const urlShopId = searchParams.get('biller_id') || searchParams.get('shop_id') || searchParams.get('shop') || 'all';

  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [shopsList, setShopsList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchProducts({ limit: 500 }),
      fetchCategories(),
      fetchBrands(),
      fetchShops(),
      fetchBranches()
    ]).then(([pRes, cRes, bRes, sRes, brRes]) => {
      if (!isMounted) return;
      if (pRes?.success && Array.isArray(pRes.data)) setProductsList(pRes.data);
      if (cRes?.success && Array.isArray(cRes.data)) setCategoriesList(cRes.data);
      if (bRes?.success && Array.isArray(bRes.data)) setBrandsList(bRes.data);
      if (sRes?.success && Array.isArray(sRes.data)) setShopsList(sRes.data);
      if (brRes?.success && Array.isArray(brRes.data)) setBranchesList(brRes.data);
      setLoading(false);
    }).catch((err) => {
      console.warn('Products load notice:', err);
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const products = productsList;
  const shopCategories = categoriesList;
  const brands = brandsList.map((b) => b.name);
  const shops = shopsList;
  const branches = branchesList.map((b) => ({ id: b.id || b.name, name: b.name }));

  const [search, setSearch] = useState(urlQuery);
  const [category, setCategory] = useState(urlCategory);
  const [brand, setBrand] = useState('all');
  const [branch, setBranch] = useState('all');
  const [shopId, setShopId] = useState(urlShopId);
  const [stockOnly, setStockOnly] = useState(false);
  const [moqFilter, setMoqFilter] = useState('all'); // 'all' | 'low' (<=5) | 'bulk' (>5)
  const [priceRange, setPriceRange] = useState([0, 1600]);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid4'); // 'grid4' | 'grid6' | 'table'
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [previewProduct, setPreviewProduct] = useState(null);
  const [telegramProduct, setTelegramProduct] = useState(null);


  useEffect(() => {
    if (urlQuery !== undefined) setSearch(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (urlCategory && urlCategory !== 'all') setCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    if (urlShopId && urlShopId !== 'all') setShopId(urlShopId);
  }, [urlShopId]);

  const defaultInitialCount = viewMode === 'grid6' ? 18 : 12;
  const [visibleCount, setVisibleCount] = useState(defaultInitialCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (category !== 'all') count++;
    if (brand !== 'all') count++;
    if (branch !== 'all') count++;
    if (shopId !== 'all') count++;
    if (stockOnly) count++;
    if (moqFilter !== 'all') count++;
    if (priceRange[0] > 0 || priceRange[1] < 1600) count++;
    if (search.trim()) count++;
    return count;
  }, [category, brand, branch, shopId, stockOnly, moqFilter, priceRange, search]);

  const clearAllFilters = () => {
    setSearch('');
    setCategory('all');
    setBrand('all');
    setBranch('all');
    setShopId('all');
    setStockOnly(false);
    setMoqFilter('all');
    setPriceRange([0, 1600]);
    setSearchParams({});
  };

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    let list = products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query);
      const matchesCategory = category === 'all' || product.category === category;
      const matchesBrand = brand === 'all' || product.brand === brand;
      const matchesBranch = branch === 'all' || product.branch === branch;
      const matchesShop =
        shopId === 'all' ||
        Number(product.biller_id || product.shop_id || product.shopId) === Number(shopId) ||
        String(product.biller_id) === String(shopId);
      const matchesStock = !stockOnly || product.inStock;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      // MOQ calculation
      const inferredMoq = product.moq || (product.price > 100 ? 2 : 5);
      const matchesMoq =
        moqFilter === 'all' ||
        (moqFilter === 'low' && inferredMoq <= 5) ||
        (moqFilter === 'bulk' && inferredMoq > 5);

      return matchesSearch && matchesCategory && matchesBrand && matchesBranch && matchesShop && matchesStock && matchesPrice && matchesMoq;
    });

    // Sorting
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [search, category, brand, branch, shopId, stockOnly, moqFilter, priceRange, sortBy]);

  useEffect(() => {
    setVisibleCount(viewMode === 'grid6' ? 18 : 12);
  }, [category, brand, branch, shopId, stockOnly, moqFilter, priceRange, search, viewMode]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + (viewMode === 'grid6' ? 12 : 8), filteredProducts.length));
      setIsLoadingMore(false);
    }, 400);
  }, [isLoadingMore, viewMode, filteredProducts.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore && visibleCount < filteredProducts.length) {
          handleLoadMore();
        }
      },
      { rootMargin: '250px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, isLoadingMore, visibleCount, filteredProducts.length]);

  const handleShare = async (product) => {
    const shareUrl = `${window.location.origin}/products#${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.description, url: shareUrl });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      messageApi.success(t('product_link_copied', 'Product link copied to clipboard'));
    } catch {
      messageApi.info(t('product_link_ready', 'Product link ready'));
    }
  };

  const handleOrder = (product, triggerElement) => {
    animateAddToCart({
      triggerElement,
      productImage: product.image,
    });
    addToCart(product);

    notificationApi.success({
      message: `${product.name} ${t('added_to_cart_success', 'added to cart')}`,
      description: t('wholesale_item_recorded', 'Wholesale procurement item recorded. Bulk discounts will apply automatically.'),
      placement: 'bottomRight',
    });
  };

  const handleWishlist = (product) => {
    const added = toggleWishlist(product);
    messageApi.success(
      added ? `${product.name} ${t('added_to_bookmarks', 'added to procurement bookmarks')}` : `${product.name} ${t('removed_from_bookmarks', 'removed from bookmarks')}`
    );
  };

  const productColumnProps =
    viewMode === 'grid6'
      ? { xs: 12, sm: 8, md: 6, lg: 6, xl: 4, xxl: 4 }
      : { xs: 24, sm: 12, md: 8, lg: 8, xl: 6, xxl: 6 };

  // Reusable Filter Sidebar
  const filterPanel = (
    <Card
      style={{
        borderRadius: 22,
        border: `1px solid ${publicTheme.border}`,
        background: '#ffffff',
        boxShadow: publicTheme.lightShadow,
      }}
      styles={{ body: { padding: '20px 18px' } }}
    >
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ color: publicTheme.text, fontSize: 15 }}>
            {t('sourcing_filters', 'Sourcing Filters')}
          </Text>
          {activeFiltersCount > 0 && (
            <Button
              type="link"
              onClick={clearAllFilters}
              style={{ padding: 0, fontSize: 12, fontWeight: 700, color: publicTheme.primary }}
            >
              {t('reset', 'Reset')} ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Keyword Search */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, marginBottom: 6, textTransform: 'uppercase' }}>
            {t('product_or_sku', 'Product or SKU:')}
          </div>
          <Input
            prefix={<SearchOutlined style={{ color: publicTheme.subtext }} />}
            placeholder={t('search_equipment_placeholder', 'Search equipment, lot, brand...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: 12, height: 40 }}
          />
        </div>

        {/* Category Filter */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, marginBottom: 6, textTransform: 'uppercase' }}>
            {t('industry_category', 'Industry Category:')}
          </div>
          <Select
            value={category}
            onChange={setCategory}
            style={{ width: '100%' }}
            options={[
              { label: t('all_categories', 'All Categories'), value: 'all' },
              ...shopCategories.map((c) => ({ label: `${c.icon || '📦'} ${c.name}`, value: c.id })),
            ]}
          />
        </div>

        {/* Regional Warehouse Hub */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, marginBottom: 6, textTransform: 'uppercase' }}>
            {t('regional_logistics_hub', 'Regional Logistics Hub:')}
          </div>
          <Select
            value={branch}
            onChange={setBranch}
            style={{ width: '100%' }}
            options={[
              { label: t('all_logistics_hubs', 'All Logistics Hubs'), value: 'all' },
              ...branches.filter((b) => b.id !== 'all').map((b) => ({ label: `📍 ${b.name}`, value: b.id })),
            ]}
          />
        </div>

        {/* Verified Supplier / Store */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, marginBottom: 6, textTransform: 'uppercase' }}>
            {t('verified_supplier', 'Verified Supplier:')}
          </div>
          <Select
            value={shopId}
            onChange={setShopId}
            style={{ width: '100%' }}
            options={[
              { label: t('all_verified_suppliers', 'All Verified Suppliers'), value: 'all' },
              ...shops.map((s) => ({ label: `🏬 ${s.name}`, value: s.id })),
            ]}
          />
        </div>

        {/* Price Slider */}
        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${publicTheme.softBorder}`,
            background: publicTheme.cardMuted,
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: publicTheme.text, fontWeight: 700 }}>
              {t('wholesale_price_range', 'Wholesale Price Range')}
            </Text>
          </div>
          <Slider
            range
            min={0}
            max={1600}
            step={25}
            value={priceRange}
            onChange={setPriceRange}
            tooltip={{ formatter: (v) => formatCurrency(v) }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: publicTheme.subtext }}>
            <span>{formatCurrency(priceRange[0])}</span>
            <span>{formatCurrency(priceRange[1])}</span>
          </div>
        </div>

        {/* MOQ Filter */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, marginBottom: 6, textTransform: 'uppercase' }}>
            {t('minimum_order_qty', 'Minimum Order Qty (MOQ):')}
          </div>
          <Select
            value={moqFilter}
            onChange={setMoqFilter}
            style={{ width: '100%' }}
            options={[
              { label: t('any_moq', 'Any Minimum Order Quantity'), value: 'all' },
              { label: t('low_moq', 'Low MOQ (≤ 5 units / Samples)'), value: 'low' },
              { label: t('bulk_wholesale', 'Bulk Wholesale (> 5 units)'), value: 'bulk' },
            ]}
          />
        </div>

        {/* In-Stock Switch */}
        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${publicTheme.softBorder}`,
            background: publicTheme.cardMuted,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: publicTheme.text }}>
              {t('in_stock_ready', 'In-Stock Ready to Ship')}
            </div>
            <div style={{ fontSize: 11, color: publicTheme.subtext }}>
              {t('exclude_preorders', 'Exclude pre-orders and backorders')}
            </div>
          </div>
          <Switch checked={stockOnly} onChange={setStockOnly} />
        </div>
      </Space>
    </Card>
  );

  // Table Columns for Wholesale Procurement Table View
  const procurementTableColumns = [
    {
      title: t('product_sku', 'Product / SKU'),
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={record.image}
            alt={record.name}
            style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }}
          />
          <div>
            <div
              onClick={() => setPreviewProduct(record)}
              style={{ fontWeight: 800, fontSize: 13, color: publicTheme.primary, cursor: 'pointer' }}
            >
              {record.name}
            </div>
            <div style={{ fontSize: 11, color: publicTheme.subtext }}>
              {record.brand || record.shopName} • {record.badge || t('standard_sku', 'Standard SKU')}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t('industry', 'Industry'),
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag color="blue" style={{ borderRadius: 6, fontSize: 11 }}>{cat}</Tag>,
    },
    {
      title: t('moq', 'MOQ'),
      key: 'moq',
      render: (_, record) => (
        <span className="moq-pill">
          MOQ: {record.moq || (record.price > 100 ? '2' : '5')} {t('pcs', 'pcs')}
        </span>
      ),
    },
    {
      title: t('stock_status', 'Stock Status'),
      key: 'stock',
      render: (_, record) => (
        <Tag color={record.inStock ? 'green' : 'orange'} style={{ borderRadius: 6, fontSize: 11 }}>
          {record.inStock ? `✓ ${t('ready_in_hub', 'Ready in Hub')}` : t('lead_time_5d', 'Lead Time 5d')}
        </Tag>
      ),
    },
    {
      title: t('wholesale_tier_price', 'Wholesale Tier Price'),
      key: 'price',
      render: (_, record) => {
        const tier10 = calculateTierPrice(record.price, 10);
        return (
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: publicTheme.text }}>
              {formatCurrency(record.price)} <span style={{ fontSize: 10.5, fontWeight: 500, color: publicTheme.subtext }}>/ {t('pc', 'pc')}</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#10b981', fontWeight: 700 }}>
              10+ {t('pcs', 'pcs')}: {formatCurrency(tier10.unitPrice)} (-12%)
            </div>
          </div>
        );
      },
    },
    {
      title: t('action', 'Action'),
      key: 'action',
      render: (_, record) => (
        <Space size={6}>
          <Button
            type="primary"
            size="small"
            icon={<ShoppingCartOutlined />}
            onClick={(e) => handleOrder(record, e.currentTarget)}
            style={{
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 11.5,
              background: publicTheme.primary,
            }}
          >
            {t('order', 'Order')}
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setPreviewProduct(record)}
            style={{ borderRadius: 8 }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: '100%', paddingBottom: 48 }}>
      {contextHolder}
      {notificationContextHolder}

      {/* Toolbar Row */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 18,
          padding: '12px 18px',
          border: `1px solid ${publicTheme.border}`,
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!screens.lg && (
            <Button
              icon={<FilterOutlined />}
              onClick={() => setMobileFilterOpen(true)}
              style={{ borderRadius: 10, fontWeight: 700 }}
            >
              {t('filters', 'Filters')} {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
            </Button>
          )}

          {screens.lg && (
            <Button
              type="text"
              icon={filtersOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
              onClick={() => setFiltersOpen(!filtersOpen)}
              style={{ borderRadius: 8, fontWeight: 700, color: publicTheme.text }}
            >
              {filtersOpen ? t('hide_filters', 'Hide Filters') : t('show_filters', 'Show Filters')}
            </Button>
          )}

          <span style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text }}>
            <strong>{filteredProducts.length}</strong> {t('products_found', 'Products Found')}
          </span>
        </div>

        {/* View Switcher & Sorting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 170 }}
            options={[
              { value: 'featured', label: t('sort_recommended', '⭐ Recommended') },
              { value: 'price-low', label: t('price_low_to_high', '💵 Price: Low to High') },
              { value: 'price-high', label: t('price_high_to_low', '💎 Price: High to Low') },
              { value: 'rating', label: t('supplier_rating', '🏆 Supplier Rating') },
              { value: 'name', label: t('product_name', '🔤 Product Name') },
            ]}
          />

          {screens.md && (
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 2 }}>
              <Button
                type={viewMode === 'grid4' ? 'primary' : 'text'}
                size="small"
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('grid4')}
                style={{ borderRadius: 8, height: 28, width: 32, padding: 0 }}
                title={t('spacious_grid', 'Spacious Grid')}
              />
              <Button
                type={viewMode === 'grid6' ? 'primary' : 'text'}
                size="small"
                icon={<BarsOutlined />}
                onClick={() => setViewMode('grid6')}
                style={{ borderRadius: 8, height: 28, width: 32, padding: 0 }}
                title={t('dense_grid', 'Dense Grid')}
              />
              <Button
                type={viewMode === 'table' ? 'primary' : 'text'}
                size="small"
                icon={<TableOutlined />}
                onClick={() => setViewMode('table')}
                style={{ borderRadius: 8, height: 28, width: 32, padding: 0 }}
                title={t('procurement_table_view', 'Procurement Table View')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Layout: Sidebar + Product Grid / Table */}
      <Row gutter={[20, 20]}>
        {/* Desktop Filter Sidebar */}
        {screens.lg && filtersOpen && (
          <Col lg={6} xl={5}>
            {filterPanel}
          </Col>
        )}

        {/* Products Content Area */}
        <Col xs={24} lg={screens.lg && filtersOpen ? 18 : 24} xl={screens.lg && filtersOpen ? 19 : 24}>
          {loading ? (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: publicTheme.subtext, fontWeight: 600 }}>{t('loading_catalog', 'Loading wholesale catalog from database...')}</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card
              style={{
                borderRadius: 24,
                textAlign: 'center',
                padding: '60px 20px',
                border: `1px solid ${publicTheme.border}`,
                background: '#ffffff',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <Title level={3} style={{ color: publicTheme.text, margin: '0 0 8px' }}>
                {t('no_products_match_filters', 'No wholesale products match your filters')}
              </Title>
              <Paragraph style={{ color: publicTheme.subtext, marginBottom: 20 }}>
                {t('adjust_filters_hint', 'Try adjusting your search terms, price range, or category filter to discover available items.')}
              </Paragraph>
              <Button
                type="primary"
                onClick={clearAllFilters}
                style={{ borderRadius: 12, height: 42, fontWeight: 700, background: publicTheme.primary }}
              >
                {t('reset_all_filters', 'Reset All Filters')}
              </Button>
            </Card>
          ) : viewMode === 'table' && screens.md ? (
            /* B2B Procurement Table View */
            <Card
              style={{
                borderRadius: 20,
                border: `1px solid ${publicTheme.border}`,
                overflow: 'hidden',
                boxShadow: publicTheme.lightShadow,
              }}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                dataSource={filteredProducts.slice(0, visibleCount)}
                columns={procurementTableColumns}
                rowKey="id"
                pagination={false}
              />
            </Card>
          ) : (
            /* Grid View (Spacious or Dense) */
            <Row gutter={screens.xs ? [10, 10] : screens.sm ? [12, 12] : [16, 16]}>
              {filteredProducts.slice(0, visibleCount).map((product) => (
                <Col {...productColumnProps} key={product.id}>
                  <RetailProductCard
                    product={product}
                    onPreview={setPreviewProduct}
                    onOrder={handleOrder}
                    onWishlist={handleWishlist}
                    isWishlisted={wishlist.some((item) => item.id === product.id)}
                    onLike={() => messageApi.success(`You liked ${product.name}`)}
                    onShare={handleShare}
                    onOpenTelegram={(item) => setTelegramProduct(item)}
                  />
                </Col>
              ))}
            </Row>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} style={{ height: 16, width: '100%', margin: '12px 0' }} />

          {isLoadingMore && (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 30, color: publicTheme.primary }} spin />} />
              <div style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text, marginTop: 8 }}>
                {t('loading_more_products', 'Loading more products...')}
              </div>
            </div>
          )}

          {visibleCount < filteredProducts.length && !isLoadingMore && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Button
                size="large"
                icon={<SyncOutlined />}
                onClick={handleLoadMore}
                style={{
                  borderRadius: 999,
                  height: 44,
                  paddingInline: 28,
                  fontWeight: 800,
                  fontSize: 13,
                  background: '#ffffff',
                  borderColor: publicTheme.primary,
                  color: publicTheme.primary,
                  boxShadow: '0 4px 16px rgba(47, 111, 237, 0.12)',
                }}
              >
                {t('load_next_rows', 'Load next rows')} ({filteredProducts.length - visibleCount} {t('more', 'more')})
              </Button>
            </div>
          )}
        </Col>
      </Row>

      {/* Mobile Filters Drawer */}
      <Drawer
        title={t('wholesale_sourcing_filters', 'Wholesale Sourcing Filters')}
        placement="left"
        closable={false}
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        width={320}
        extra={<Button type="text" icon={<CloseOutlined />} onClick={() => setMobileFilterOpen(false)} />}
      >
        {filterPanel}
      </Drawer>

      {/* Product Quick View Modal */}
      <ProductQuickViewModal
        product={previewProduct}
        open={Boolean(previewProduct)}
        onClose={() => setPreviewProduct(null)}
        onOrder={handleOrder}
      />

      {/* Telegram Mini App Gateway Modal */}
      <TelegramMiniAppModal
        open={Boolean(telegramProduct)}
        onClose={() => setTelegramProduct(null)}
        product={telegramProduct}
        allProducts={products}
      />
    </div>
  );
};

export default Products;
