import React, { useMemo, useState, useEffect } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Grid,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  message,
  Spin,
} from 'antd';
import {
  CloseOutlined,
  FilterOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  SendOutlined,
  ShopOutlined,
  StarFilled,
  CheckCircleFilled,
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchShops, fetchBranches, fetchProducts } from '../../utils/apiconfig';
import { mapShop, mapProduct } from '../../utils/dataMappers';
import { publicTheme } from '../../utils/webTheme';
import TelegramMiniAppModal from '../../components/web/shared/TelegramMiniAppModal';
import RetailShopCard from '../../components/web/shared/RetailShopCard';
import ShopQuickViewModal from '../../components/web/shared/ShopQuickViewModal';

const { useBreakpoint } = Grid;
const { Paragraph, Text, Title } = Typography;

export default function Shops() {
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [messageApi, contextHolder] = message.useMessage();

  const [search, setSearch] = useState(urlQuery);
  const [branch, setBranch] = useState('all');
  const [minRating, setMinRating] = useState('all');
  const [fastReplyOnly, setFastReplyOnly] = useState(false);
  const [shops, setShops] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      fetchShops(),
      fetchBranches(),
      fetchProducts({ limit: 500 }),
    ])
      .then(([shopsRes, branchesRes, productsRes]) => {
        if (!isMounted) return;
        const rawShops = shopsRes?.data || shopsRes?.shops || shopsRes?.stores || (Array.isArray(shopsRes) ? shopsRes : []);
        if (Array.isArray(rawShops)) {
          setShops(rawShops.map(mapShop).filter(Boolean));
        }
        const rawBranches = branchesRes?.data || branchesRes?.branches || (Array.isArray(branchesRes) ? branchesRes : []);
        if (Array.isArray(rawBranches)) {
          setBranches(rawBranches);
        }
        const rawProducts = productsRes?.data || productsRes?.products || (Array.isArray(productsRes) ? productsRes : []);
        if (Array.isArray(rawProducts)) {
          setProducts(rawProducts.map(mapProduct).filter(Boolean));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error loading shops from API:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const [previewShop, setPreviewShop] = useState(null);
  const [telegramShop, setTelegramShop] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [gridMode, setGridMode] = useState(6);
  const [wishlistedShopIds, setWishlistedShopIds] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_favorite_shops');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (urlQuery !== undefined) setSearch(urlQuery);
  }, [urlQuery]);

  const toggleShopWishlist = (shop) => {
    const isSaved = wishlistedShopIds.includes(shop.id);
    const updated = isSaved
      ? wishlistedShopIds.filter((id) => id !== shop.id)
      : [...wishlistedShopIds, shop.id];

    setWishlistedShopIds(updated);
    try {
      localStorage.setItem('aura_favorite_shops', JSON.stringify(updated));
    } catch {}

    if (isSaved) {
      messageApi.info(`${shop.name} removed from bookmarks`);
    } else {
      messageApi.success(`${shop.name} added to bookmarks`);
    }
  };

  const handleShare = async (shop) => {
    const shareUrl = `${window.location.origin}/shops/${shop.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shop.name, text: shop.summary, url: shareUrl });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      messageApi.success('Supplier profile link copied');
    } catch {
      messageApi.info('Link: ' + shareUrl);
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (branch !== 'all') count++;
    if (minRating !== 'all') count++;
    if (fastReplyOnly) count++;
    return count;
  }, [search, branch, minRating, fastReplyOnly]);

  const clearAllFilters = () => {
    setSearch('');
    setBranch('all');
    setMinRating('all');
    setFastReplyOnly(false);
    setSearchParams({});
  };

  const filteredShops = useMemo(() => {
    const query = search.toLowerCase().trim();

    return shops.filter((shop) => {
      if (shop.activeOnWebsite === false || shop.is_active === false) return false;

      const matchesSearch =
        !query ||
        shop.name?.toLowerCase().includes(query) ||
        shop.company?.toLowerCase().includes(query) ||
        shop.summary?.toLowerCase().includes(query) ||
        shop.tagline?.toLowerCase().includes(query) ||
        shop.city?.toLowerCase().includes(query) ||
        (shop.branch && shop.branch.toLowerCase().includes(query)) ||
        (shop.specialties && Array.isArray(shop.specialties) && shop.specialties.some((s) => s.toLowerCase().includes(query)));

      const matchesBranch = branch === 'all' || shop.branch === branch || shop.city === branch;
      const matchesRating = minRating === 'all' || (shop.rating || 0) >= Number(minRating);
      const matchesFastReply = !fastReplyOnly || (shop.responseTime && shop.responseTime.includes('5 min'));

      return matchesSearch && matchesBranch && matchesRating && matchesFastReply;
    });
  }, [shops, search, branch, minRating, fastReplyOnly]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Loading verified suppliers from database..." />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', paddingBottom: 48 }}>
      {contextHolder}

      {/* Filter and Search Bar */}
      <Card
        style={{
          borderRadius: 20,
          border: `1px solid ${publicTheme.border}`,
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          marginBottom: 24,
        }}
        styles={{ body: { padding: '14px 20px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: publicTheme.subtext }} />}
              placeholder="Search supplier name, specialty, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ borderRadius: 10, height: 40 }}
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              value={branch}
              onChange={setBranch}
              style={{ width: '100%', height: 40 }}
              options={[
                { label: 'All Logistics Hubs', value: 'all' },
                ...branches.filter((b) => b.id !== 'all').map((b) => ({ label: `📍 ${b.name}`, value: b.id || b.name })),
              ]}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={minRating}
              onChange={setMinRating}
              style={{ width: '100%', height: 40 }}
              options={[
                { label: 'All Ratings', value: 'all' },
                { label: '★ 4.8 & Above', value: '4.8' },
                { label: '★ 4.9 & Above', value: '4.9' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={7} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: publicTheme.subtext }}>
              Fast Dispatch (&lt; 5m):
            </span>
            <Switch checked={fastReplyOnly} onChange={setFastReplyOnly} />
            {activeFiltersCount > 0 && (
              <Button type="link" onClick={clearAllFilters} style={{ padding: 0, fontWeight: 700 }}>
                Reset
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Suppliers Grid */}
      {filteredShops.length === 0 ? (
        <Card
          style={{
            borderRadius: 22,
            textAlign: 'center',
            padding: '50px 20px',
            border: `1px solid ${publicTheme.border}`,
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 12 }}>🏬</div>
          <Title level={4} style={{ color: publicTheme.text }}>No suppliers matched your search criteria</Title>
          <Button type="primary" onClick={clearAllFilters} style={{ borderRadius: 10, marginTop: 12 }}>
            Reset Filters
          </Button>
        </Card>
      ) : (
        <Row gutter={screens.xs ? [12, 12] : screens.sm ? [14, 14] : [18, 18]} style={{ width: '100%' }}>
          {filteredShops.map((shop) => {
            const shopProducts = products.filter((p) => Number(p.biller_id || p.shop_id || p.shopId) === Number(shop.biller_id || shop.id));
            const isWishlisted = wishlistedShopIds.includes(shop.id);

            return (
              <Col xs={24} sm={12} md={8} lg={4} key={shop.id}>
                <RetailShopCard
                  shop={shop}
                  shopProducts={shopProducts}
                  gridMode={screens.xs ? 4 : 6}
                  onPreview={(s) => setPreviewShop(s)}
                  onWishlist={toggleShopWishlist}
                  isWishlisted={isWishlisted}
                  onLike={(s) => messageApi.success(`You liked ${s.name}!`)}
                  onShare={handleShare}
                  onOpenTelegram={(s) => setTelegramShop(s)}
                  onOpenEMenu={(s) => navigate(`/shop/menu/${s.slug || s.id}`)}
                />
              </Col>
            );
          })}
        </Row>
      )}

      {/* Quick View Modal */}
      <ShopQuickViewModal
        shop={previewShop}
        open={Boolean(previewShop)}
        onClose={() => setPreviewShop(null)}
        onOpenTelegram={(s) => setTelegramShop(s)}
        shopProducts={previewShop ? products.filter((p) => Number(p.biller_id || p.shop_id || p.shopId) === Number(previewShop.biller_id || previewShop.id)) : []}
      />

      {/* Telegram Gateway Modal */}
      <TelegramMiniAppModal
        open={Boolean(telegramShop)}
        onClose={() => setTelegramShop(null)}
        shop={telegramShop}
        allProducts={products}
      />
    </div>
  );
}
