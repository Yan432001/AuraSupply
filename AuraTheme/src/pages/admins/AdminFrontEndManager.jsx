import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Typography,
  Modal,
  Form,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Divider,
  Alert,
  Flex,
  Tabs,
  Rate,
  Avatar,
  Radio,
  Drawer,
} from 'antd';
import {
  GlobalOutlined,
  ShopOutlined,
  AppstoreOutlined,
  PictureOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  ExportOutlined,
  CoffeeOutlined,
  ThunderboltOutlined,
  FireOutlined,
  SettingOutlined,
  DollarOutlined,
  SlidersOutlined,
  SendOutlined,
  ShoppingOutlined,
  CrownOutlined,
  SaveOutlined,
  BgColorsOutlined,
  LinkOutlined,
  CheckOutlined,
  BellOutlined,
  CopyOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  getAllStoreTelegramConfigs,
  getStoreTelegramConfig,
  saveStoreTelegramConfig,
  sendTestGroupNotification,
  getTelegramRoutingLogs,
  syncStoreTelegramConfigsWithServer,
} from '../../data/telegramStoreGroupManager';
import { fetchCategories, fetchBranches, fetchShops, fetchProducts, fetchBanners, fetchShopSettings } from '../../utils/apiconfig';

const FRONTEND_STORES_KEY = 'aura_frontend_stores_v3';
const FRONTEND_SETTINGS_KEY = 'aura_frontend_settings_v2';
const FRONTEND_SLIDES_KEY = 'aura_frontend_slides_v2';
const FRONTEND_PAGES_KEY = 'aura_frontend_pages_v2';
const LIVE_PRODUCTS_KEY = 'aura_admin_live_products_v2';

const getLiveStores = () => {
  try {
    const raw = localStorage.getItem(FRONTEND_STORES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveLiveStores = (st) => {
  try {
    localStorage.setItem(FRONTEND_STORES_KEY, JSON.stringify(st));
  } catch (_) {}
};
const getStorefrontSettings = () => {
  try {
    const raw = localStorage.getItem(FRONTEND_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { announcement: { enabled: true, text: 'Aura Supply Storefront' }, branding: { siteTitle: 'Aura Supply' } };
  } catch {
    return { announcement: { enabled: true, text: 'Aura Supply Storefront' }, branding: { siteTitle: 'Aura Supply' } };
  }
};
const saveStorefrontSettings = (s) => {
  try {
    localStorage.setItem(FRONTEND_SETTINGS_KEY, JSON.stringify(s));
  } catch (_) {}
};
const getHeroSlides = () => {
  try {
    const raw = localStorage.getItem(FRONTEND_SLIDES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveHeroSlides = (sl) => {
  try {
    localStorage.setItem(FRONTEND_SLIDES_KEY, JSON.stringify(sl));
  } catch (_) {}
};
const getPublicPages = () => {
  try {
    const raw = localStorage.getItem(FRONTEND_PAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const savePublicPages = (p) => {
  try {
    localStorage.setItem(FRONTEND_PAGES_KEY, JSON.stringify(p));
  } catch (_) {}
};
const getLiveProducts = () => {
  try {
    const raw = localStorage.getItem(LIVE_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveLiveProducts = (p) => {
  try {
    localStorage.setItem(LIVE_PRODUCTS_KEY, JSON.stringify(p));
  } catch (_) {}
};
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { formatCurrency } from '../../utils/uiTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function AdminFrontEndManager({ initialTab }) {
  const [shopCategories, setShopCategories] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchCategories().then(res => { if (res?.success && Array.isArray(res.data)) setShopCategories(res.data); });
    fetchBranches().then(res => { if (res?.success && Array.isArray(res.data)) setBranches(res.data); });
    fetchShops().then(res => { if (res?.success && Array.isArray(res.data) && res.data.length > 0) setStores(res.data); });
    fetchProducts({ limit: 100 }).then(res => { if (res?.success && Array.isArray(res.data) && res.data.length > 0) setProducts(res.data); });
    fetchBanners().then(res => { if (res?.success && Array.isArray(res.data) && res.data.length > 0) setSlides(res.data); });
  }, []);
  const adminTheme = useAdminTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Tab handling
  const tabFromQuery = searchParams.get('menu');
  const getEffectiveTab = () => {
    if (tabFromQuery === 'shop-control' || tabFromQuery === 'stores') return 'stores';
    if (tabFromQuery === 'store-products' || tabFromQuery === 'products') return 'products';
    if (tabFromQuery === 'telegram-groups' || tabFromQuery === 'telegram') return 'telegram';
    if (tabFromQuery === 'website-display' || tabFromQuery === 'display') return 'display';
    if (tabFromQuery === 'slider-settings' || tabFromQuery === 'sliders') return 'sliders';
    if (tabFromQuery === 'list-pages' || tabFromQuery === 'pages') return 'pages';
    return initialTab || 'stores';
  };

  const [activeTab, setActiveTab] = useState(getEffectiveTab);

  useEffect(() => {
    const eff = getEffectiveTab();
    if (eff !== activeTab) {
      setActiveTab(eff);
    }
  }, [tabFromQuery]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('module', 'front-end');
    if (key === 'stores') newParams.set('menu', 'shop-control');
    else if (key === 'products') newParams.set('menu', 'store-products');
    else if (key === 'telegram') newParams.set('menu', 'telegram-groups');
    else if (key === 'display') newParams.set('menu', 'website-display');
    else if (key === 'sliders') newParams.set('menu', 'slider-settings');
    else if (key === 'pages') newParams.set('menu', 'list-pages');
    setSearchParams(newParams);
  };

  // State
  const [stores, setStores] = useState(getLiveStores);
  const [products, setProducts] = useState(getLiveProducts);
  const [settings, setSettings] = useState(getStorefrontSettings);
  const [telegramConfigs, setTelegramConfigs] = useState(getAllStoreTelegramConfigs);
  const [routingLogs, setRoutingLogs] = useState(() => getTelegramRoutingLogs('all'));
  const [slides, setSlides] = useState(getHeroSlides);
  const [pages, setPages] = useState(getPublicPages);

  // Modals & Drawers
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [storeForm] = Form.useForm();

  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm] = Form.useForm();

  const [slideModalVisible, setSlideModalVisible] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideForm] = Form.useForm();

  // Filters for Products Tab
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [productSearchText, setProductSearchText] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');

  // Search for Stores Tab
  const [storeSearchText, setStoreSearchText] = useState('');

  // Synchronize on external changes
  useEffect(() => {
    // Sync store telegram configs with server on mount
    syncStoreTelegramConfigsWithServer().then((serverConfigs) => {
      if (serverConfigs && Array.isArray(serverConfigs)) {
        setTelegramConfigs(serverConfigs);
      }
    });

    const handleStoresUpdated = (e) => setStores(e.detail);
    const handleProductsUpdated = (e) => setProducts(e.detail);
    const handleSettingsUpdated = (e) => setSettings(e.detail);
    const handleSlidesUpdated = (e) => setSlides(e.detail);
    const handlePagesUpdated = (e) => setPages(e.detail);
    const handleTelegramUpdated = (e) => {
      if (e.detail?.configs) {
        setTelegramConfigs(e.detail.configs);
      } else {
        setTelegramConfigs(getAllStoreTelegramConfigs());
      }
      setRoutingLogs(getTelegramRoutingLogs('all'));
    };

    window.addEventListener('aura_frontend_stores_updated', handleStoresUpdated);
    window.addEventListener('aura_live_products_updated', handleProductsUpdated);
    window.addEventListener('aura_frontend_settings_updated', handleSettingsUpdated);
    window.addEventListener('aura_frontend_slides_updated', handleSlidesUpdated);
    window.addEventListener('aura_frontend_pages_updated', handlePagesUpdated);
    window.addEventListener('aura_telegram_groups_updated', handleTelegramUpdated);

    // Fetch live MySQL data on mount
    fetch('/api/shops')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data) && j.data.length > 0) {
          const live = j.data.map((s, idx) => ({
            ...s,
            activeOnWebsite: s.is_active !== false && s.status !== 'inactive',
            featuredOnHome: s.is_featured || idx < 4,
            isFlagship: idx === 0,
            order: idx + 1,
            openHours: '07:00 AM - 10:00 PM',
            deliveryAvailable: true,
            telegramBot: '@auraglobal_bot',
            contactPhone: s.phone || '+855 12 345 678',
          }));
          setStores(live);
          saveLiveStores(live);
        }
      })
      .catch((err) => console.warn('FrontEndManager live shops notice:', err.message));

    fetch('/api/products?limit=250')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data?.products) && j.data.products.length > 0) {
          setProducts(j.data.products);
          saveLiveProducts(j.data.products);
        }
      })
      .catch((err) => console.warn('FrontEndManager live products notice:', err.message));

    fetch('/api/banners')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data) && j.data.length > 0) {
          setSlides(j.data);
          saveHeroSlides(j.data);
        }
      })
      .catch((err) => console.warn('FrontEndManager live banners notice:', err.message));

    return () => {
      window.removeEventListener('aura_frontend_stores_updated', handleStoresUpdated);
      window.removeEventListener('aura_live_products_updated', handleProductsUpdated);
      window.removeEventListener('aura_frontend_settings_updated', handleSettingsUpdated);
      window.removeEventListener('aura_frontend_slides_updated', handleSlidesUpdated);
      window.removeEventListener('aura_frontend_pages_updated', handlePagesUpdated);
      window.removeEventListener('aura_telegram_groups_updated', handleTelegramUpdated);
    };
  }, []);

  // ==========================================
  // STORE CONTROLLER ACTIONS
  // ==========================================
  const handleToggleStoreActive = (storeId, active) => {
    const updated = stores.map((s) => (s.id === storeId ? { ...s, activeOnWebsite: active } : s));
    setStores(updated);
    saveLiveStores(updated);
    message.success(`Store ${active ? 'activated on' : 'hidden from'} customer website`);
  };

  const handleToggleStoreFeatured = (storeId, featured) => {
    const updated = stores.map((s) => (s.id === storeId ? { ...s, featuredOnHome: featured } : s));
    setStores(updated);
    saveLiveStores(updated);
    message.success(`Store ${featured ? 'marked as Featured on Homepage' : 'unfeatured'}`);
  };

  const handleOpenStoreModal = (store = null) => {
    setEditingStore(store);
    if (store) {
      storeForm.setFieldsValue({
        name: store.name,
        slug: store.slug || store.id,
        branch: store.branch || 'phnom-penh',
        summary: store.summary,
        specialties: (store.specialties || []).join(', '),
        logo: store.logo,
        heroImage: store.heroImage,
        openHours: store.openHours || '07:00 AM - 10:00 PM',
        contactPhone: store.contactPhone || '+855 23 888 101',
        telegramBot: store.telegramBot || '@auraglobal_bot',
        activeOnWebsite: store.activeOnWebsite !== false,
        featuredOnHome: !!store.featuredOnHome,
        isFlagship: !!store.isFlagship,
      });
    } else {
      storeForm.resetFields();
      storeForm.setFieldsValue({
        activeOnWebsite: true,
        featuredOnHome: false,
        isFlagship: false,
        branch: 'phnom-penh',
        openHours: '07:30 AM - 09:30 PM',
        telegramBot: '@auraglobal_bot',
      });
    }
    setStoreModalVisible(true);
  };

  const handleSaveStore = () => {
    storeForm.validateFields().then((vals) => {
      const specArray = vals.specialties
        ? vals.specialties.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      if (editingStore) {
        const updated = stores.map((s) =>
          s.id === editingStore.id
            ? {
                ...s,
                ...vals,
                specialties: specArray,
              }
            : s
        );
        setStores(updated);
        saveLiveStores(updated);
        message.success('Store details updated successfully');
      } else {
        const newId = vals.slug || `store-${Date.now()}`;
        const newStore = {
          id: newId,
          slug: vals.slug || newId,
          ...vals,
          specialties: specArray,
          rating: 5.0,
          reviews: 1,
          followers: 120,
          responseTime: 'within 5 min',
        };
        const updated = [newStore, ...stores];
        setStores(updated);
        saveLiveStores(updated);
        message.success('New Store created and added to Front End directory');
      }
      setStoreModalVisible(false);
    });
  };

  const handleDeleteStore = (storeId) => {
    const updated = stores.filter((s) => s.id !== storeId);
    setStores(updated);
    saveLiveStores(updated);
    message.success('Store removed from website');
  };

  // Jump from Store card directly to Products tab filtered by that store
  const handleInspectStoreProducts = (storeId) => {
    setSelectedStoreFilter(storeId);
    setActiveTab('products');
    const newParams = new URLSearchParams(searchParams);
    newParams.set('module', 'front-end');
    newParams.set('menu', 'store-products');
    setSearchParams(newParams);
  };

  // ==========================================
  // PRODUCTS OF STORE ACTIONS
  // ==========================================
  const handleToggleProductVisibility = (productId, visible) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, visibleOnWebsite: visible } : p
    );
    setProducts(updated);
    saveLiveProducts(updated);
    message.success(`Product ${visible ? 'now visible' : 'hidden'} on storefront`);
  };

  const handleToggleProductFeatured = (productId, featured) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, featured: featured } : p
    );
    setProducts(updated);
    saveLiveProducts(updated);
    message.success(`Product ${featured ? 'featured on website homepage' : 'unfeatured'}`);
  };

  const handleToggleProductStock = (productId, inStock) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, inStock: inStock } : p
    );
    setProducts(updated);
    saveLiveProducts(updated);
    message.success(`Product status marked as ${inStock ? 'In Stock' : 'Out of Stock'}`);
  };

  const handleOpenProductModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      productForm.setFieldsValue({
        name: product.name,
        seller: product.seller || product.shopId,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        badge: product.badge || '',
        image: product.image,
        inStock: product.inStock !== false,
        visibleOnWebsite: product.visibleOnWebsite !== false,
        featured: !!product.featured,
        description: product.description,
      });
    } else {
      productForm.resetFields();
      productForm.setFieldsValue({
        seller: selectedStoreFilter !== 'all' ? selectedStoreFilter : stores[0]?.id || 'sbc-store',
        category: 'coffee',
        price: 4.5,
        inStock: true,
        visibleOnWebsite: true,
        featured: false,
        badge: '✨ New Arrival',
      });
    }
    setProductModalVisible(true);
  };

  const handleSaveProduct = () => {
    productForm.validateFields().then((vals) => {
      const linkedStore = stores.find((s) => s.id === vals.seller);
      if (editingProduct) {
        const updated = products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                ...vals,
                shopId: vals.seller,
                shopName: linkedStore?.name || p.shopName,
              }
            : p
        );
        setProducts(updated);
        saveLiveProducts(updated);
        message.success('Store product updated successfully');
      } else {
        const newProduct = {
          id: `prod-${Date.now()}`,
          ...vals,
          shopId: vals.seller,
          shopName: linkedStore?.name || 'Aura Verified Store',
          rating: 5.0,
          reviews: 1,
          features: ['Storefront exclusive', 'Guaranteed quality'],
        };
        const updated = [newProduct, ...products];
        setProducts(updated);
        saveLiveProducts(updated);
        message.success('New product assigned to store catalog and published');
      }
      setProductModalVisible(false);
    });
  };

  const handleDeleteProduct = (productId) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveLiveProducts(updated);
    message.success('Product deleted from catalog');
  };

  // ==========================================
  // WEBSITE DISPLAY SETTINGS
  // ==========================================
  const handleSaveDisplaySettings = () => {
    saveStorefrontSettings(settings);
    message.success('Website display and theme settings saved!');
  };

  // ==========================================
  // HERO SLIDERS ACTIONS
  // ==========================================
  const handleOpenSlideModal = (slide = null) => {
    setEditingSlide(slide);
    if (slide) {
      slideForm.setFieldsValue({
        title: slide.title,
        subtitle: slide.subtitle,
        badge: slide.badge,
        image: slide.image,
        buttonText: slide.buttonText,
        link: slide.link,
        targetShop: slide.targetShop,
        active: slide.active !== false,
      });
    } else {
      slideForm.resetFields();
      slideForm.setFieldsValue({
        active: true,
        buttonText: 'Order Now',
        link: '/shops',
        badge: 'Featured Special',
      });
    }
    setSlideModalVisible(true);
  };

  const handleSaveSlide = () => {
    slideForm.validateFields().then((vals) => {
      if (editingSlide) {
        const updated = slides.map((s) =>
          s.id === editingSlide.id ? { ...s, ...vals } : s
        );
        setSlides(updated);
        saveHeroSlides(updated);
        message.success('Hero slide updated');
      } else {
        const newSlide = {
          id: Date.now(),
          order: slides.length + 1,
          ...vals,
        };
        const updated = [...slides, newSlide];
        setSlides(updated);
        saveHeroSlides(updated);
        message.success('New hero slide added to homepage');
      }
      setSlideModalVisible(false);
    });
  };

  const handleDeleteSlide = (slideId) => {
    const updated = slides.filter((s) => s.id !== slideId);
    setSlides(updated);
    saveHeroSlides(updated);
    message.success('Slide removed');
  };

  const handleToggleSlideActive = (slideId, active) => {
    const updated = slides.map((s) => (s.id === slideId ? { ...s, active } : s));
    setSlides(updated);
    saveHeroSlides(updated);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchStore =
        selectedStoreFilter === 'all' ||
        p.seller === selectedStoreFilter ||
        p.shopId === selectedStoreFilter;
      const matchCategory =
        selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
      const matchSearch =
        !productSearchText ||
        p.name.toLowerCase().includes(productSearchText.toLowerCase()) ||
        p.id.toLowerCase().includes(productSearchText.toLowerCase());
      const matchStock =
        stockStatusFilter === 'all' ||
        (stockStatusFilter === 'in_stock' && p.inStock !== false) ||
        (stockStatusFilter === 'out_of_stock' && p.inStock === false);
      return matchStore && matchCategory && matchSearch && matchStock;
    });
  }, [products, selectedStoreFilter, selectedCategoryFilter, productSearchText, stockStatusFilter]);

  // Filtered Stores
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      if (!storeSearchText) return true;
      const q = storeSearchText.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.summary && s.summary.toLowerCase().includes(q))
      );
    });
  }, [stores, storeSearchText]);

  // Statistics
  const totalStoresCount = stores.length;
  const activeStoresCount = stores.filter((s) => s.activeOnWebsite !== false).length;
  const featuredStoresCount = stores.filter((s) => s.featuredOnHome).length;
  const totalProductsCount = products.length;
  const activeProductsCount = products.filter((p) => p.visibleOnWebsite !== false).length;
  const featuredProductsCount = products.filter((p) => p.featured).length;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* Top Banner / Header Control Room */}
      <Card
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(30, 27, 75, 0.25)',
          color: '#ffffff',
        }}
        styles={{ body: { padding: '24px 28px' } }}
      >
        <Row gutter={[24, 20]} align="middle" justify="space-between">
          <Col xs={24} lg={14}>
            <Flex align="center" gap={12} wrap="wrap" style={{ marginBottom: 8 }}>
              <Tag
                color="gold"
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                <CrownOutlined style={{ marginRight: 6 }} />
                OWNER STOREFRONT CONTROL ROOM
              </Tag>
              <Tag color="cyan" style={{ borderRadius: 20, padding: '2px 10px' }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                Live Website Sync Active
              </Tag>
            </Flex>
            <Title level={2} style={{ color: '#ffffff', margin: '4px 0 8px', fontWeight: 800 }}>
              Front End Website &amp; Multi-Store Management
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, maxWidth: 640, margin: 0 }}>
              Full master controller for the public customer website. Manage which stores appear on the storefront,
              control products and prices per store, configure homepage hero sliders, announcement banners, and test live storefronts.
            </Paragraph>
          </Col>

          <Col xs={24} lg={10}>
            <Flex justify="flex-end" gap={12} wrap="wrap">
              <Button
                type="primary"
                size="large"
                icon={<GlobalOutlined />}
                onClick={() => window.open('/', '_blank')}
                style={{
                  borderRadius: 12,
                  height: 44,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
              >
                Visit Public Website <ExportOutlined style={{ fontSize: 12 }} />
              </Button>
            </Flex>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '20px 0' }} />

        {/* Realtime KPI Bar */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={4}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Total Stores</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                {totalStoresCount}
              </div>
            </div>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Active on Web</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80', marginTop: 4 }}>
                {activeStoresCount} <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>/ {totalStoresCount}</span>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Featured Stores</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
                {featuredStoresCount}
              </div>
            </div>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Catalog SKUs</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                {totalProductsCount}
              </div>
            </div>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Active Web SKUs</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa', marginTop: 4 }}>
                {activeProductsCount}
              </div>
            </div>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Featured Products</Text>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f472b6', marginTop: 4 }}>
                {featuredProductsCount}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Main Tabs Navigation */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        size="large"
        style={{
          background: adminTheme.card,
          borderRadius: 16,
          padding: '16px 20px',
          border: `1px solid ${adminTheme.border}`,
        }}
        items={[
          {
            key: 'stores',
            label: (
              <span>
                <ShopOutlined style={{ marginRight: 6 }} />
                Stores Controller ({stores.length})
              </span>
            ),
            children: (
              <StoresControllerTab
                stores={filteredStores}
                searchText={storeSearchText}
                onSearchChange={setStoreSearchText}
                onToggleActive={handleToggleStoreActive}
                onToggleFeatured={handleToggleStoreFeatured}
                onEditStore={handleOpenStoreModal}
                onDeleteStore={handleDeleteStore}
                onInspectProducts={handleInspectStoreProducts}
                onAddStore={() => handleOpenStoreModal(null)}
                adminTheme={adminTheme}
              />
            ),
          },
          {
            key: 'products',
            label: (
              <span>
                <AppstoreOutlined style={{ marginRight: 6 }} />
                Products of Store ({filteredProducts.length})
              </span>
            ),
            children: (
              <ProductsControllerTab
                products={filteredProducts}
                stores={stores}
                selectedStoreFilter={selectedStoreFilter}
                onSelectStoreFilter={setSelectedStoreFilter}
                selectedCategoryFilter={selectedCategoryFilter}
                onSelectCategoryFilter={setSelectedCategoryFilter}
                searchText={productSearchText}
                onSearchChange={setProductSearchText}
                stockStatusFilter={stockStatusFilter}
                onStockStatusFilterChange={setStockStatusFilter}
                onToggleVisibility={handleToggleProductVisibility}
                onToggleFeatured={handleToggleProductFeatured}
                onToggleStock={handleToggleProductStock}
                onEditProduct={handleOpenProductModal}
                onDeleteProduct={handleDeleteProduct}
                onAddProduct={() => handleOpenProductModal(null)}
                adminTheme={adminTheme}
              />
            ),
          },
          {
            key: 'telegram',
            label: (
              <span>
                <SendOutlined style={{ marginRight: 6, color: '#0284c7' }} />
                Telegram Groups &amp; Bots ({telegramConfigs.length})
              </span>
            ),
            children: (
              <TelegramGroupsControllerTab
                configs={telegramConfigs}
                onRefreshConfigs={() => setTelegramConfigs(getAllStoreTelegramConfigs())}
                routingLogs={routingLogs}
                adminTheme={adminTheme}
              />
            ),
          },
          {
            key: 'display',
            label: (
              <span>
                <BgColorsOutlined style={{ marginRight: 6 }} />
                Website Display &amp; Themes
              </span>
            ),
            children: (
              <WebsiteDisplayTab
                settings={settings}
                setSettings={setSettings}
                onSave={handleSaveDisplaySettings}
                adminTheme={adminTheme}
              />
            ),
          },
          {
            key: 'sliders',
            label: (
              <span>
                <PictureOutlined style={{ marginRight: 6 }} />
                Hero Sliders &amp; Banners ({slides.length})
              </span>
            ),
            children: (
              <HeroSlidersTab
                slides={slides}
                onToggleActive={handleToggleSlideActive}
                onEditSlide={handleOpenSlideModal}
                onDeleteSlide={handleDeleteSlide}
                onAddSlide={() => handleOpenSlideModal(null)}
                adminTheme={adminTheme}
              />
            ),
          },
          {
            key: 'pages',
            label: (
              <span>
                <FileTextOutlined style={{ marginRight: 6 }} />
                Website Pages &amp; Info ({pages.length})
              </span>
            ),
            children: (
              <WebsitePagesTab
                pages={pages}
                setPages={setPages}
                adminTheme={adminTheme}
              />
            ),
          },
        ]}
      />

      {/* ======================================================== */}
      {/* STORE CREATE / EDIT MODAL */}
      {/* ======================================================== */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <ShopOutlined style={{ color: '#2563eb', fontSize: 18 }} />
            <span>{editingStore ? 'Edit Store Channel' : 'Add New Store / Branch Storefront'}</span>
          </Flex>
        }
        open={storeModalVisible}
        onCancel={() => setStoreModalVisible(false)}
        onOk={handleSaveStore}
        okText={editingStore ? 'Save Store' : 'Create Store'}
        width={720}
        destroyOnHidden={false}
      >
        <Form form={storeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="name"
                label="Store Display Name"
                rules={[{ required: true, message: 'Please enter store name' }]}
              >
                <Input placeholder="e.g. Aura Specialty Coffee Roasters" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="slug"
                label="Store Slug (URL Identifier)"
                rules={[{ required: true, message: 'Please enter unique slug' }]}
              >
                <Input placeholder="e.g. aura-specialty-coffee" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="branch" label="Linked Branch Location">
                <Select>
                  {branches.map((b) => (
                    <Option key={b.id} value={b.id}>
                      {b.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="openHours" label="Operating Hours">
                <Input placeholder="e.g. 07:00 AM - 10:00 PM" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="summary" label="Store Description / Tagline">
            <TextArea rows={2} placeholder="Direct-trade highland espresso roasts, iced lattes, and bakery pairings." />
          </Form.Item>

          <Form.Item name="specialties" label="Specialty Badges (comma separated)">
            <Input placeholder="e.g. Highland Roasts, Pour-Over V60, Cold Brews" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="logo" label="Logo Image URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="heroImage" label="Hero Banner Image URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contactPhone" label="Contact Phone">
                <Input placeholder="+855 12 345 678" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="telegramBot" label="Telegram Bot Handle">
                <Input placeholder="@auraglobal_bot" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0 16px' }} />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="activeOnWebsite" label="Show on Website" valuePropName="checked">
                <Switch checkedChildren="Live" unCheckedChildren="Hidden" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="featuredOnHome" label="Featured on Homepage" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isFlagship" label="Flagship Store" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ======================================================== */}
      {/* PRODUCT CREATE / EDIT MODAL */}
      {/* ======================================================== */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <AppstoreOutlined style={{ color: '#10b981', fontSize: 18 }} />
            <span>{editingProduct ? 'Edit Store Product' : 'Add Product to Store Catalog'}</span>
          </Flex>
        }
        open={productModalVisible}
        onCancel={() => setProductModalVisible(false)}
        onOk={handleSaveProduct}
        okText={editingProduct ? 'Save Product' : 'Create Product'}
        width={680}
        destroyOnHidden={false}
      >
        <Form form={productForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="name"
                label="Product Title"
                rules={[{ required: true, message: 'Please enter product title' }]}
              >
                <Input placeholder="e.g. Highland Arabica Whole Beans 250g" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="seller"
                label="Assigned Store / Seller"
                rules={[{ required: true, message: 'Please select store' }]}
              >
                <Select placeholder="Select store">
                  {stores.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select>
                  {shopCategories.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="Selling Price ($)" rules={[{ required: true }]}>
                <InputNumber min={0.1} step={0.5} style={{ width: '100%' }} prefix="$" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="originalPrice" label="Original Price (Before discount)">
                <InputNumber min={0.1} step={0.5} style={{ width: '100%' }} prefix="$" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="badge" label="Promotional Badge Tag">
                <Select allowClear placeholder="Select badge">
                  <Option value="✨ New Arrival">✨ New Arrival</Option>
                  <Option value="🔥 Hot Deal">🔥 Hot Deal</Option>
                  <Option value="👑 Bestseller">👑 Bestseller</Option>
                  <Option value="🌿 Organic">🌿 Organic</Option>
                  <Option value="⚡ 20% OFF">⚡ 20% OFF</Option>
                  <Option value="🏆 Award Winning">🏆 Award Winning</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="image" label="Image URL">
                <Input placeholder="/assets/uploads/image.png or https://..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Product Description">
            <TextArea rows={2} placeholder="Tasting notes, provenance, ingredients, warranty, etc." />
          </Form.Item>

          <Divider style={{ margin: '12px 0 16px' }} />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="visibleOnWebsite" label="Storefront Visible" valuePropName="checked">
                <Switch checkedChildren="Live" unCheckedChildren="Hidden" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="featured" label="Feature on Homepage" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="inStock" label="Stock Available" valuePropName="checked">
                <Switch checkedChildren="In Stock" unCheckedChildren="Sold Out" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ======================================================== */}
      {/* HERO SLIDE MODAL */}
      {/* ======================================================== */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <PictureOutlined style={{ color: '#8b5cf6', fontSize: 18 }} />
            <span>{editingSlide ? 'Edit Hero Slider Slide' : 'Add New Homepage Slide'}</span>
          </Flex>
        }
        open={slideModalVisible}
        onCancel={() => setSlideModalVisible(false)}
        onOk={handleSaveSlide}
        okText={editingSlide ? 'Save Slide' : 'Add Slide'}
        width={680}
        destroyOnHidden={false}
      >
        <Form form={slideForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Headline / Main Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Artisanal Specialty Coffee & Roastery" />
          </Form.Item>

          <Form.Item name="subtitle" label="Subtitle / Description">
            <TextArea rows={2} placeholder="Direct-trade highland Arabica, signature espresso roasts..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="badge" label="Badge Tag">
                <Input placeholder="e.g. ☕ Single Origin Roastery" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="buttonText" label="Call to Action Button Text">
                <Input placeholder="e.g. Order Coffee Online" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="image" label="Slide Background Image URL" rules={[{ required: true }]}>
                <Input placeholder="/assets/uploads/image.png or https://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="link" label="Target Link URL">
                <Input placeholder="/shops/sbc-store or /products" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="active" label="Slide Active on Homepage" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Draft" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

// ========================================================
// TAB 1: STORES CONTROLLER COMPONENT
// ========================================================
function StoresControllerTab({
  stores,
  searchText,
  onSearchChange,
  onToggleActive,
  onToggleFeatured,
  onEditStore,
  onDeleteStore,
  onInspectProducts,
  onAddStore,
  adminTheme,
}) {
  const columns = [
    {
      title: 'Store / Brand',
      key: 'store',
      render: (_, record) => (
        <Flex align="center" gap={12}>
          <Avatar
            src={record.logo}
            shape="square"
            size={46}
            style={{
              background: '#3b82f6',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {record.logoText || record.name.slice(0, 2).toUpperCase()}
          </Avatar>
          <div>
            <Flex align="center" gap={6}>
              <Text strong style={{ fontSize: 14.5, color: adminTheme.text }}>
                {record.name}
              </Text>
              {record.isFlagship && (
                <Tag color="gold" style={{ margin: 0, fontSize: 10.5, fontWeight: 700 }}>
                  👑 FLAGSHIP
                </Tag>
              )}
            </Flex>
            <Text style={{ fontSize: 11.5, color: adminTheme.subtext, display: 'block' }}>
              Slug: <code style={{ color: '#2563eb' }}>{record.slug || record.id}</code> &bull;{' '}
              {record.branch}
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Specialties & Tagline',
      key: 'summary',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: 12, color: adminTheme.subtext, display: 'block', maxWidth: 280 }} ellipsis>
            {record.summary}
          </Text>
          <div style={{ marginTop: 4 }}>
            {(record.specialties || []).slice(0, 2).map((sp) => (
              <Tag key={sp} color="blue" style={{ fontSize: 10.5, borderRadius: 6, margin: '2px 4px 2px 0' }}>
                {sp}
              </Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Hours & Bot',
      key: 'hours',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: 12, color: adminTheme.text, display: 'block' }}>
            ⏰ {record.openHours || '07:00 AM - 10:00 PM'}
          </Text>
          <Text style={{ fontSize: 11, color: '#0284c7' }}>
            🤖 {record.telegramBot || '@auraglobal_bot'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Website Live Status',
      key: 'activeOnWebsite',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Switch
            checked={record.activeOnWebsite !== false}
            onChange={(checked) => onToggleActive(record.id, checked)}
            checkedChildren="Visible"
            unCheckedChildren="Hidden"
            style={{
              background: record.activeOnWebsite !== false ? '#10b981' : undefined,
            }}
          />
          <Text style={{ fontSize: 11, color: adminTheme.subtext }}>
            {record.activeOnWebsite !== false ? 'Live on /shops' : 'Hidden from public'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Featured on Homepage',
      key: 'featuredOnHome',
      render: (_, record) => (
        <Tooltip title="Toggle whether this store appears in the Homepage Featured Carousel">
          <Button
            type={record.featuredOnHome ? 'primary' : 'default'}
            size="small"
            icon={record.featuredOnHome ? <StarFilled style={{ color: '#fbbf24' }} /> : <StarOutlined />}
            onClick={() => onToggleFeatured(record.id, !record.featuredOnHome)}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              background: record.featuredOnHome ? '#fef3c7' : undefined,
              borderColor: record.featuredOnHome ? '#f59e0b' : undefined,
              color: record.featuredOnHome ? '#b45309' : undefined,
            }}
          >
            {record.featuredOnHome ? 'Featured' : 'Standard'}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Manage catalog products specifically for this store">
            <Button
              size="small"
              icon={<AppstoreOutlined />}
              onClick={() => onInspectProducts(record.id)}
              style={{ borderRadius: 8, fontWeight: 600, color: '#2563eb', borderColor: '#93c5fd' }}
            >
              Catalog
            </Button>
          </Tooltip>

          <Tooltip title={`Open Digital E-Menu (/shop/menu/${record.slug || record.id})`}>
            <Button
              size="small"
              icon={<CoffeeOutlined />}
              onClick={() => window.open(`/shop/menu/${record.slug || record.id}`, '_blank')}
              style={{ borderRadius: 8, fontWeight: 600, color: '#A31D1D', borderColor: '#fca5a5' }}
            >
              E-Menu
            </Button>
          </Tooltip>

          <Tooltip title={`Open Telegram Mini App (t.me/...startapp=shop_${record.slug || record.id})`}>
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={() => window.open(`https://t.me/aura_emenu_order_bot/menu?startapp=shop_${record.slug || record.id}`, '_blank')}
              style={{ borderRadius: 8, fontWeight: 600, color: '#0284c7', borderColor: '#bae6fd' }}
            >
              Telegram
            </Button>
          </Tooltip>

          <Tooltip title="Direct link: Open store customer page in new tab">
            <Button
              size="small"
              icon={<ExportOutlined />}
              onClick={() => window.open(`/shops/${record.id}`, '_blank')}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>

          <Tooltip title="Edit store branding and settings">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEditStore(record)}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>

          <Popconfirm
            title="Remove store from website?"
            description="This will remove the store showcase from the public directory."
            onConfirm={() => onDeleteStore(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <Flex align="center" gap={12}>
          <Input
            prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
            placeholder="Search stores by name, slug, specialty..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: 320, borderRadius: 10 }}
            allowClear
          />
          <Text style={{ fontSize: 13, color: adminTheme.subtext }}>
            Showing <b>{stores.length}</b> stores &amp; brand channels
          </Text>
        </Flex>

        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddStore}
            style={{
              borderRadius: 10,
              background: '#2563eb',
              border: 'none',
              fontWeight: 600,
            }}
          >
            Add New Store Channel
          </Button>
        </Space>
      </Flex>

      <Table
        columns={columns}
        dataSource={stores}
        rowKey="id"
        pagination={{ pageSize: 8, showSizeChanger: true }}
        size="middle"
        scroll={{ x: 800 }}
      />
    </Space>
  );
}

// ========================================================
// TAB 2: PRODUCTS OF STORE CONTROLLER COMPONENT
// ========================================================
function ProductsControllerTab({
  products,
  stores,
  selectedStoreFilter,
  onSelectStoreFilter,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  searchText,
  onSearchChange,
  stockStatusFilter,
  onStockStatusFilterChange,
  onToggleVisibility,
  onToggleFeatured,
  onToggleStock,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
  adminTheme,
}) {
  const columns = [
    {
      title: 'Product Title & SKU',
      key: 'name',
      render: (_, record) => (
        <Flex align="center" gap={12}>
          <Avatar
            src={record.image}
            shape="square"
            size={48}
            style={{ borderRadius: 10, border: '1px solid #e2e8f0', objectFit: 'cover' }}
          />
          <div>
            <Text strong style={{ fontSize: 14, color: adminTheme.text, display: 'block' }}>
              {record.name}
            </Text>
            <Flex align="center" gap={6} style={{ marginTop: 2 }}>
              <Tag style={{ fontSize: 10.5, borderRadius: 4, margin: 0 }}>
                {record.id}
              </Tag>
              {record.badge && (
                <Tag color="orange" style={{ fontSize: 10.5, borderRadius: 4, margin: 0, fontWeight: 600 }}>
                  {record.badge}
                </Tag>
              )}
            </Flex>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Assigned Store',
      key: 'store',
      render: (_, record) => {
        const store = stores.find((s) => s.id === record.seller || s.id === record.shopId);
        return (
          <div>
            <Tag color="purple" style={{ fontSize: 12, borderRadius: 6, fontWeight: 600 }}>
              <ShopOutlined style={{ marginRight: 4 }} />
              {store?.name || record.shopName || 'Global Catalog'}
            </Tag>
            <div style={{ fontSize: 11, color: adminTheme.subtext, marginTop: 2 }}>
              Category: <b>{record.category}</b>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Store Price',
      key: 'price',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 14.5, color: '#16a34a' }}>
            {formatCurrency(record.price)}
          </Text>
          {record.originalPrice && record.originalPrice > record.price && (
            <Text delete style={{ fontSize: 11, color: adminTheme.subtext, marginLeft: 6 }}>
              {formatCurrency(record.originalPrice)}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Storefront Visible',
      key: 'visible',
      render: (_, record) => (
        <Switch
          checked={record.visibleOnWebsite !== false}
          onChange={(checked) => onToggleVisibility(record.id, checked)}
          checkedChildren="Live"
          unCheckedChildren="Hidden"
          size="small"
        />
      ),
    },
    {
      title: 'Featured (Home)',
      key: 'featured',
      render: (_, record) => (
        <Tooltip title="Toggle feature on website homepage Trending / Deals rail">
          <Button
            type="text"
            icon={
              record.featured ? (
                <StarFilled style={{ color: '#fbbf24', fontSize: 18 }} />
              ) : (
                <StarOutlined style={{ color: adminTheme.subtext, fontSize: 18 }} />
              )
            }
            onClick={() => onToggleFeatured(record.id, !record.featured)}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Inventory Stock',
      key: 'stock',
      render: (_, record) => (
        <Switch
          checked={record.inStock !== false}
          onChange={(checked) => onToggleStock(record.id, checked)}
          checkedChildren="In Stock"
          unCheckedChildren="Sold Out"
          size="small"
          style={{
            background: record.inStock !== false ? '#10b981' : '#ef4444',
          }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Edit price, badge, description">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEditProduct(record)}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>

          <Popconfirm
            title="Delete product from store catalog?"
            onConfirm={() => onDeleteProduct(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Filters Bar */}
      <Card
        style={{
          borderRadius: 12,
          background: adminTheme.cardMuted,
          border: `1px solid ${adminTheme.border}`,
        }}
        styles={{ body: { padding: '14px 18px' } }}
      >
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Text style={{ fontSize: 12, color: adminTheme.subtext, display: 'block', marginBottom: 4 }}>
              🏬 Filter by Store Channel:
            </Text>
            <Select
              value={selectedStoreFilter}
              onChange={onSelectStoreFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">🌟 All Stores ({products.length} Products)</Option>
              {stores.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name} ({products.filter((p) => p.seller === s.id || p.shopId === s.id).length})
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Text style={{ fontSize: 12, color: adminTheme.subtext, display: 'block', marginBottom: 4 }}>
              🏷️ Category:
            </Text>
            <Select
              value={selectedCategoryFilter}
              onChange={onSelectCategoryFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Categories</Option>
              {shopCategories.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Text style={{ fontSize: 12, color: adminTheme.subtext, display: 'block', marginBottom: 4 }}>
              📦 Stock Status:
            </Text>
            <Select
              value={stockStatusFilter}
              onChange={onStockStatusFilterChange}
              style={{ width: '100%' }}
            >
              <Option value="all">All Statuses</Option>
              <Option value="in_stock">In Stock Only</Option>
              <Option value="out_of_stock">Sold Out Only</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Text style={{ fontSize: 12, color: adminTheme.subtext, display: 'block', marginBottom: 4 }}>
              🔍 Search Product:
            </Text>
            <Flex gap={8}>
              <Input
                prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
                placeholder="Product title, SKU..."
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                allowClear
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAddProduct}
                style={{
                  borderRadius: 10,
                  background: '#10b981',
                  border: 'none',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                Add SKU
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true }}
        size="middle"
        scroll={{ x: 860 }}
      />
    </Space>
  );
}

// ========================================================
// TAB 3: WEBSITE DISPLAY & THEMES COMPONENT
// ========================================================
function WebsiteDisplayTab({ settings, setSettings, onSave, adminTheme }) {
  const handleAnnouncementChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      announcement: {
        ...prev.announcement,
        [key]: value,
      },
    }));
  };

  const handleSectionToggle = (key, checked) => {
    setSettings((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: checked,
      },
    }));
  };

  const handleThemeChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value,
      },
    }));
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* Announcement Bar Settings */}
      <Card
        title={
          <Flex align="center" gap={8}>
            <ThunderboltOutlined style={{ color: '#f59e0b' }} />
            <span>Website Header Announcement Banner</span>
          </Flex>
        }
        extra={
          <Switch
            checked={settings.announcement?.enabled !== false}
            onChange={(checked) => handleAnnouncementChange('enabled', checked)}
            checkedChildren="Active"
            unCheckedChildren="Disabled"
          />
        }
        style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}` }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Text style={{ fontSize: 13, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
              Announcement Message (Appears at the very top of customer website):
            </Text>
            <TextArea
              rows={2}
              value={settings.announcement?.text || ''}
              onChange={(e) => handleAnnouncementChange('text', e.target.value)}
              placeholder="e.g. Free Delivery on all orders over $25 | Order via Telegram Mini App"
            />
          </Col>

          <Col xs={24} md={10}>
            <Text style={{ fontSize: 13, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
              Banner Background Color:
            </Text>
            <Space wrap>
              {[
                { label: 'Emerald Green', color: '#059669' },
                { label: 'Royal Blue', color: '#2563eb' },
                { label: 'Sunset Amber', color: '#d97706' },
                { label: 'Velvet Purple', color: '#7c3aed' },
                { label: 'Charcoal Black', color: '#18181b' },
              ].map((c) => (
                <Button
                  key={c.color}
                  size="small"
                  onClick={() => handleAnnouncementChange('bgColor', c.color)}
                  style={{
                    borderRadius: 8,
                    background: c.color,
                    color: '#ffffff',
                    border:
                      settings.announcement?.bgColor === c.color ? '2px solid #ffffff' : 'none',
                    fontWeight: settings.announcement?.bgColor === c.color ? 700 : 500,
                  }}
                >
                  {c.label}
                </Button>
              ))}
            </Space>

            <div style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 12, color: adminTheme.subtext, display: 'block', marginBottom: 4 }}>
                Target Link:
              </Text>
              <Input
                value={settings.announcement?.link || '/shops'}
                onChange={(e) => handleAnnouncementChange('link', e.target.value)}
                placeholder="/shops or /shop/menu"
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Homepage Sections Controller */}
      <Card
        title={
          <Flex align="center" gap={8}>
            <SlidersOutlined style={{ color: '#2563eb' }} />
            <span>Homepage Section Visibility Controls</span>
          </Flex>
        }
        style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}` }}
      >
        <Text style={{ color: adminTheme.subtext, fontSize: 13, display: 'block', marginBottom: 16 }}>
          Enable or disable specific content blocks on the customer homepage:
        </Text>

        <Row gutter={[20, 16]}>
          {[
            { key: 'heroSlider', label: 'Hero Slides & Promo Carousel', desc: 'Top rotating banners with CTA buttons' },
            { key: 'featuredStores', label: 'Featured Multi-Store Showcase', desc: 'Horizontal cards of flagship cafes & stores' },
            { key: 'popularCategories', label: 'Popular Categories Rail', desc: 'Coffee, Bakery, Dining, Tech gadgets' },
            { key: 'trendingProducts', label: 'Trending Store Products', desc: 'Featured SKUs from across all stores' },
            { key: 'telegramBanner', label: 'Telegram Mini App Bar', desc: 'Direct QR code and 1-click bot ordering launch' },
            { key: 'customerReviews', label: 'Customer Testimonials', desc: 'Verified customer feedback and star ratings' },
            { key: 'branchLocations', label: 'Multi-Branch Map & Locations', desc: 'Store opening hours and physical addresses' },
          ].map((sec) => (
            <Col xs={24} sm={12} key={sec.key}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: adminTheme.cardMuted,
                  border: `1px solid ${adminTheme.border}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: adminTheme.text }}>{sec.label}</div>
                  <div style={{ fontSize: 11, color: adminTheme.subtext }}>{sec.desc}</div>
                </div>
                <Switch
                  checked={settings.sections?.[sec.key] !== false}
                  onChange={(checked) => handleSectionToggle(sec.key, checked)}
                />
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Storefront Layout & Currency */}
      <Card
        title={
          <Flex align="center" gap={8}>
            <SettingOutlined style={{ color: '#10b981' }} />
            <span>Storefront Layout, Currency &amp; Ordering Preferences</span>
          </Flex>
        }
        style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}` }}
      >
        <Row gutter={[20, 16]}>
          <Col xs={24} md={8}>
            <Text style={{ fontSize: 13, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
              Default Products Grid Mode:
            </Text>
            <Radio.Group
              value={settings.theme?.layoutMode || 'grid'}
              onChange={(e) => handleThemeChange('layoutMode', e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="grid">Grid (4 Columns)</Radio.Button>
              <Radio.Button value="compact">Compact List</Radio.Button>
            </Radio.Group>
          </Col>

          <Col xs={24} md={8}>
            <Text style={{ fontSize: 13, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
              Currency Display:
            </Text>
            <Radio.Group
              value={settings.theme?.currency || 'USD'}
              onChange={(e) => handleThemeChange('currency', e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="USD">USD ($)</Radio.Button>
              <Radio.Button value="KHR">KHR (៛)</Radio.Button>
              <Radio.Button value="DUAL">Dual ($ &amp; ៛)</Radio.Button>
            </Radio.Group>
          </Col>

          <Col xs={24} md={8}>
            <Text style={{ fontSize: 13, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
              Direct Telegram Bot Ordering:
            </Text>
            <Switch
              checked={settings.theme?.directTelegramOrder !== false}
              onChange={(checked) => handleThemeChange('directTelegramOrder', checked)}
              checkedChildren="Enabled"
              unCheckedChildren="Disabled"
            />
            <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block', marginTop: 4 }}>
              Direct checkout redirects cart to Telegram Bot
            </Text>
          </Col>
        </Row>
      </Card>

      <Flex justify="flex-end">
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={onSave}
          style={{
            borderRadius: 12,
            height: 44,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            border: 'none',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            padding: '0 24px',
          }}
        >
          Save All Display Settings
        </Button>
      </Flex>
    </Space>
  );
}

// ========================================================
// TAB 4: HERO SLIDERS & BANNERS COMPONENT
// ========================================================
function HeroSlidersTab({
  slides,
  onToggleActive,
  onEditSlide,
  onDeleteSlide,
  onAddSlide,
  adminTheme,
}) {
  const columns = [
    {
      title: 'Slide Preview & Title',
      key: 'title',
      render: (_, record) => (
        <Flex align="center" gap={14}>
          <img
            src={record.image}
            alt={record.title}
            style={{
              width: 90,
              height: 54,
              borderRadius: 8,
              objectFit: 'cover',
              border: '1px solid #cbd5e1',
            }}
          />
          <div>
            <Tag color="purple" style={{ fontSize: 10.5, borderRadius: 4, margin: '0 0 4px 0' }}>
              {record.badge || 'Slide'}
            </Tag>
            <Text strong style={{ fontSize: 14, color: adminTheme.text, display: 'block' }}>
              {record.title}
            </Text>
            <Text style={{ fontSize: 11.5, color: adminTheme.subtext }} ellipsis>
              {record.subtitle}
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Call to Action',
      key: 'cta',
      render: (_, record) => (
        <div>
          <Tag color="blue" style={{ fontSize: 11.5, fontWeight: 600 }}>
            {record.buttonText || 'Explore'}
          </Tag>
          <div style={{ fontSize: 11, color: adminTheme.subtext, marginTop: 4 }}>
            Link: <code style={{ color: '#2563eb' }}>{record.link}</code>
          </div>
        </div>
      ),
    },
    {
      title: 'Active Status',
      key: 'active',
      render: (_, record) => (
        <Switch
          checked={record.active !== false}
          onChange={(checked) => onToggleActive(record.id, checked)}
          checkedChildren="Live"
          unCheckedChildren="Draft"
          size="small"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEditSlide(record)}
            style={{ borderRadius: 8 }}
          />
          <Popconfirm
            title="Delete slide from hero carousel?"
            onConfirm={() => onDeleteSlide(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <Text style={{ color: adminTheme.subtext, fontSize: 13 }}>
          Manage dynamic hero slider carousels and promotional campaign banners on the website homepage.
        </Text>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddSlide}
          style={{
            borderRadius: 10,
            background: '#8b5cf6',
            border: 'none',
            fontWeight: 600,
          }}
        >
          Add Hero Slide
        </Button>
      </Flex>

      <Table
        columns={columns}
        dataSource={slides}
        rowKey="id"
        pagination={false}
        size="middle"
      />
    </Space>
  );
}

// ========================================================
// TAB 5: WEBSITE PAGES COMPONENT
// ========================================================
function WebsitePagesTab({ pages, setPages, adminTheme }) {
  const [editingPage, setEditingPage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleEdit = (page) => {
    setEditingPage(page);
    form.setFieldsValue(page);
    setModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then((vals) => {
      const updated = pages.map((p) =>
        p.id === editingPage.id ? { ...p, ...vals, lastUpdated: new Date().toISOString().slice(0, 10) } : p
      );
      setPages(updated);
      savePublicPages(updated);
      message.success('Page saved');
      setModalVisible(false);
    });
  };

  const columns = [
    {
      title: 'Page Title & Slug',
      key: 'title',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 14, color: adminTheme.text }}>
            {record.title}
          </Text>
          <div style={{ fontSize: 11, color: adminTheme.subtext, marginTop: 2 }}>
            URL: <code style={{ color: '#2563eb' }}>/{record.slug}</code>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={v === 'published' ? 'green' : 'orange'} style={{ textTransform: 'capitalize' }}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Views',
      dataIndex: 'views',
      key: 'views',
      render: (v) => <Text style={{ fontWeight: 600 }}>{v?.toLocaleString() || 0}</Text>,
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ borderRadius: 8 }}
          >
            Edit
          </Button>
          <Button
            size="small"
            icon={<ExportOutlined />}
            onClick={() => window.open(`/${record.slug}`, '_blank')}
            style={{ borderRadius: 8 }}
          />
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Table columns={columns} dataSource={pages} rowKey="id" pagination={false} size="middle" />

      <Modal
        title="Edit Content Page"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        destroyOnHidden={false}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Page Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="URL Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Input />
          </Form.Item>
          <Form.Item name="summary" label="Summary / Excerpt">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

// ========================================================
// TAB: TELEGRAM MULTI-STORE GROUP MANAGEMENT & BOT PERMISSIONS
// ========================================================
function TelegramGroupsControllerTab({ configs, onRefreshConfigs, routingLogs, adminTheme }) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [modalTestResult, setModalTestResult] = useState(null);
  const [form] = Form.useForm();
  const [sendingTestMap, setSendingTestMap] = useState({});

  const handleOpenEdit = (config) => {
    setEditingConfig(config);
    setModalTestResult(null);
    form.setFieldsValue({
      storeName: config.storeName,
      groupTitle: config.groupTitle,
      groupId: config.groupId || config.telegram_group_chat_id,
      botUsername: config.botUsername || config.telegram_bot_username || '@auraglobal_bot',
      botToken: '', // Never display raw token
      groupInviteLink: config.groupInviteLink || '',
      telegram_enabled: config.telegram_enabled !== false,
      canSendOrders: config.permissions?.canSendOrders !== false,
      canUpdateStatus: config.permissions?.canUpdateStatus !== false,
      notifySoundAlert: config.permissions?.notifySoundAlert !== false,
      dailySummary: config.permissions?.dailySummary !== false,
    });
    setEditModalVisible(true);
  };

  const handleSaveModal = async () => {
    try {
      const vals = await form.validateFields();
      saveStoreTelegramConfig(editingConfig.storeSlug, {
        groupTitle: vals.groupTitle?.trim(),
        groupId: vals.groupId?.trim(),
        telegram_group_chat_id: vals.groupId?.trim(),
        botUsername: vals.botUsername?.trim(),
        telegram_bot_username: vals.botUsername?.trim(),
        botToken: vals.botToken?.trim() || undefined,
        telegram_enabled: vals.telegram_enabled,
        groupInviteLink: vals.groupInviteLink?.trim(),
        permissions: {
          canSendOrders: vals.canSendOrders,
          canUpdateStatus: vals.canUpdateStatus,
          notifySoundAlert: vals.notifySoundAlert,
          dailySummary: vals.dailySummary,
        },
      });
      message.success(`Dedicated Telegram settings saved for ${editingConfig.storeName}`);
      setEditModalVisible(false);
      onRefreshConfigs();
    } catch (_) {}
  };

  const handleSendTest = async (storeSlug) => {
    setSendingTestMap((prev) => ({ ...prev, [storeSlug]: true }));
    try {
      const res = await sendTestGroupNotification(storeSlug);
      setSendingTestMap((prev) => ({ ...prev, [storeSlug]: false }));
      if (res.success) {
        message.success({
          content: res.message,
          duration: 6,
        });
      } else {
        message.error({
          content: res.message || res.error || 'Failed sending test ping to Telegram',
          duration: 8,
        });
      }
      onRefreshConfigs();
    } catch (err) {
      setSendingTestMap((prev) => ({ ...prev, [storeSlug]: false }));
      message.error(`Test connection error: ${err.message}`);
    }
  };

  const handleTestFromModal = async () => {
    if (!editingConfig) return;
    try {
      const vals = await form.validateFields();
      const storeSlug = editingConfig.storeSlug;
      setSendingTestMap((prev) => ({ ...prev, [storeSlug]: true }));
      setModalTestResult(null);

      // Save latest inputs first
      saveStoreTelegramConfig(storeSlug, {
        groupTitle: vals.groupTitle?.trim(),
        groupId: vals.groupId?.trim(),
        telegram_group_chat_id: vals.groupId?.trim(),
        botUsername: vals.botUsername?.trim(),
        telegram_bot_username: vals.botUsername?.trim(),
        botToken: vals.botToken?.trim() || undefined,
        telegram_enabled: vals.telegram_enabled,
        groupInviteLink: vals.groupInviteLink?.trim(),
      });

      const res = await sendTestGroupNotification(storeSlug, {
        groupId: vals.groupId?.trim(),
        groupTitle: vals.groupTitle?.trim(),
        botUsername: vals.botUsername?.trim(),
        botToken: vals.botToken?.trim() || undefined,
      });

      setSendingTestMap((prev) => ({ ...prev, [storeSlug]: false }));
      setModalTestResult(res);

      if (res.success) {
        message.success({
          content: res.message,
          duration: 6,
        });
      } else {
        message.error({
          content: res.message || res.error,
          duration: 8,
        });
      }
      onRefreshConfigs();
    } catch (_) {}
  };

  const columns = [
    {
      title: 'Store Channel',
      key: 'store',
      render: (_, record) => (
        <Flex align="center" gap={12}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            {record.storeEmoji || '🏬'}
          </div>
          <div>
            <Flex align="center" gap={6}>
              <Text strong style={{ fontSize: 14.5, color: adminTheme.text }}>
                {record.storeName}
              </Text>
              {record.telegram_enabled === false ? (
                <Tag color="default" style={{ fontSize: 10, margin: 0 }}>Disabled</Tag>
              ) : (
                <Tag color="success" style={{ fontSize: 10, margin: 0 }}>Active</Tag>
              )}
            </Flex>
            <Text style={{ fontSize: 11.5, color: adminTheme.subtext, display: 'block', marginTop: 2 }}>
              Slug: <code style={{ color: '#2563eb' }}>{record.storeSlug}</code> &bull; Owner:{' '}
              <b>{record.ownerName || 'Yin'}</b>
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Dedicated Telegram Group Chat',
      key: 'group',
      render: (_, record) => (
        <div>
          <Flex align="center" gap={6}>
            <Text strong style={{ fontSize: 13, color: adminTheme.text }}>
              {record.groupTitle || 'Group Not Named'}
            </Text>
          </Flex>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag
              color="blue"
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: 11.5,
                borderRadius: 6,
                padding: '2px 8px',
                margin: 0,
              }}
            >
              ID: {record.groupId || record.telegram_group_chat_id || 'Not Set'}
            </Tag>
            <Tooltip title="Copy Group ID">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined style={{ fontSize: 11 }} />}
                onClick={() => {
                  navigator.clipboard.writeText(record.groupId || record.telegram_group_chat_id);
                  message.success(`Group ID copied!`);
                }}
              />
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: 'Dedicated Bot & Status',
      key: 'bot',
      render: (_, record) => {
        const isConnected = record.status === 'connected' || record.botStatus === 'connected';
        return (
          <div>
            <Text strong style={{ fontSize: 13, color: '#0284c7', display: 'block' }}>
              🤖 {record.botUsername || record.telegram_bot_username || '@aura_emenu_order_bot'}
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Tag
                color={isConnected ? 'green' : 'error'}
                style={{ fontSize: 10.5, borderRadius: 6, fontWeight: 700, margin: 0 }}
              >
                {isConnected ? (
                  <>
                    <CheckCircleOutlined style={{ marginRight: 4 }} />
                    Connected
                  </>
                ) : (
                  <>
                    <CloseCircleOutlined style={{ marginRight: 4 }} />
                    Connection Error
                  </>
                )}
              </Tag>
              <Tooltip title="Token encrypted with AES-256 at rest">
                <Tag color="default" style={{ fontSize: 10, borderRadius: 6, margin: 0, fontFamily: 'monospace' }}>
                  🔒 {record.botTokenPreview || '8613686...1lCw'}
                </Tag>
              </Tooltip>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Bot Permissions',
      key: 'permissions',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Tag color={record.permissions?.canSendOrders !== false ? 'cyan' : 'default'} style={{ fontSize: 10.5, borderRadius: 6, margin: 0 }}>
            ✓ Kitchen Tickets
          </Tag>
          <Tag color={record.permissions?.canUpdateStatus !== false ? 'geekblue' : 'default'} style={{ fontSize: 10.5, borderRadius: 6, margin: 0 }}>
            ✓ Group Status Actions
          </Tag>
          <Tag color={record.permissions?.notifySoundAlert !== false ? 'gold' : 'default'} style={{ fontSize: 10.5, borderRadius: 6, margin: 0 }}>
            ✓ Sound Alerts
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Orders Routed',
      key: 'stats',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 14, color: '#10b981', display: 'block' }}>
            {record.stats?.totalOrdersRouted || 0} Tickets
          </Text>
          <Text style={{ fontSize: 11, color: adminTheme.subtext }}>
            Last: {record.stats?.lastRoutedAt || 'Never'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Send a verification test message to this store's Telegram Group">
            <Button
              size="small"
              icon={<ThunderboltFilled style={{ color: '#0284c7' }} />}
              loading={sendingTestMap[record.storeSlug]}
              onClick={() => handleSendTest(record.storeSlug)}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Test Connection
            </Button>
          </Tooltip>

          <Button
            type="primary"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleOpenEdit(record)}
            style={{ borderRadius: 8, fontWeight: 600, background: '#2563eb' }}
          >
            Settings
          </Button>

          <Tooltip title="Open bot in Telegram">
            <Button
              size="small"
              icon={<ExportOutlined />}
              onClick={() =>
                window.open(
                  `https://t.me/${(record.botUsername || record.telegram_bot_username || '@aura_emenu_order_bot').replace('@', '')}?startgroup=true`,
                  '_blank'
                )
              }
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* Intro Banner */}
      <Card
        style={{
          borderRadius: 14,
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          border: 'none',
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row gutter={[20, 16]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Tag color="gold" style={{ fontWeight: 800, borderRadius: 20, padding: '2px 10px', marginBottom: 8 }}>
              DEDICATED TELEGRAM BOTS &amp; MULTI-GROUP ROUTING
            </Tag>
            <Title level={3} style={{ color: '#ffffff', margin: '4px 0 6px', fontWeight: 800 }}>
              Independent Store Bots &amp; Groups
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13.5, margin: 0, maxWidth: 720 }}>
              Each store has its own dedicated Telegram Bot token and dedicated Telegram staff Group Chat.
              When a customer submits an order, THAT store&apos;s bot dispatches the itemized invoice to the store group and directly to the customer.
            </Paragraph>
          </Col>

          <Col xs={24} md={8}>
            <Flex justify="flex-end" gap={10} wrap="wrap">
              <Button
                type="primary"
                icon={<LinkOutlined />}
                onClick={() => window.open('https://t.me/BotFather', '_blank')}
                style={{
                  borderRadius: 10,
                  height: 40,
                  fontWeight: 700,
                  background: '#ffffff',
                  color: '#0284c7',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                Create Bot on @BotFather
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* Stores & Groups Table */}
      <Table
        columns={columns}
        dataSource={configs}
        rowKey="storeSlug"
        pagination={false}
        size="middle"
        scroll={{ x: 920 }}
      />

      {/* Real-time Order Routing Log */}
      <Card
        title={
          <Flex align="center" gap={8}>
            <ThunderboltFilled style={{ color: '#10b981' }} />
            <span>Recent Telegram Order Invoice Activity</span>
          </Flex>
        }
        extra={
          <Button size="small" icon={<ReloadOutlined />} onClick={onRefreshConfigs}>
            Refresh Logs
          </Button>
        }
        style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}` }}
      >
        <Table
          dataSource={routingLogs}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
          columns={[
            {
              title: 'Time',
              dataIndex: 'timestamp',
              key: 'timestamp',
              render: (t) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{t}</span>,
            },
            {
              title: 'Order Ref',
              dataIndex: 'orderRef',
              key: 'orderRef',
              render: (r, row) => (
                <Tag color={row.type === 'TEST_ALERT' ? 'purple' : 'green'} style={{ fontWeight: 700 }}>
                  {r}
                </Tag>
              ),
            },
            {
              title: 'Store Channel',
              dataIndex: 'storeName',
              key: 'storeName',
              render: (n) => <Text strong>{n}</Text>,
            },
            {
              title: 'Target Telegram Group ID',
              key: 'group',
              render: (_, row) => (
                <div>
                  <Text style={{ fontSize: 12, display: 'block' }}>{row.groupTitle}</Text>
                  <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {row.groupId}
                  </Tag>
                </div>
              ),
            },
            {
              title: 'Customer & Address',
              key: 'cust',
              render: (_, row) => (
                <Text style={{ fontSize: 12 }}>
                  {row.customerName} ({row.location})
                </Text>
              ),
            },
            {
              title: 'Grand Total',
              dataIndex: 'grandTotal',
              key: 'grandTotal',
              render: (tot) => (
                <Text strong style={{ color: '#10b981' }}>
                  ${Number(tot).toFixed(2)}
                </Text>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (st) => (
                <Tag color="cyan" style={{ fontWeight: 600 }}>
                  {st}
                </Tag>
              ),
            },
          ]}
        />
      </Card>

      {/* Edit Group ID & Dedicated Bot Settings Modal */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <SettingOutlined style={{ color: '#0284c7', fontSize: 18 }} />
            <span>Dedicated Telegram Settings: {editingConfig?.storeName}</span>
          </Flex>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        width={680}
        destroyOnHidden={false}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="test"
            icon={<ThunderboltFilled style={{ color: '#0284c7' }} />}
            loading={Boolean(editingConfig && sendingTestMap[editingConfig.storeSlug])}
            onClick={handleTestFromModal}
            style={{ borderRadius: 8, fontWeight: 600, borderColor: '#0284c7', color: '#0284c7' }}
          >
            Test Connection
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSaveModal}
            style={{ borderRadius: 8, fontWeight: 700, background: '#059669', borderColor: '#059669' }}
          >
            Save Store Telegram Settings
          </Button>,
        ]}
      >
        {/* Step-by-Step Setup Guide */}
        <div
          style={{
            background: adminTheme?.cardMuted || '#f8fafc',
            border: `1px solid ${adminTheme?.border || '#e2e8f0'}`,
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
          }}
        >
          <Text strong style={{ color: adminTheme?.text || '#0f172a', display: 'block', marginBottom: 6, fontSize: 12.5 }}>
            📋 How to Setup This Store&apos;s Dedicated Telegram Bot:
          </Text>
          <div style={{ fontSize: 12, color: adminTheme?.subtext || '#475569', lineHeight: 1.6 }}>
            <div><b>1.</b> Create bot on <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: '#0284c7' }}>@BotFather</a> with <code>/newbot</code> and copy the Bot Token.</div>
            <div><b>2.</b> Create a Telegram group for this store&apos;s kitchen/staff and add your new bot to it.</div>
            <div><b>3.</b> Make the bot an <b>Administrator</b> in the group (grant permission to post messages).</div>
            <div><b>4.</b> Add <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: '#0284c7' }}>@userinfobot</a> to the group or send <code>/getid</code> to find the Group Chat ID (e.g. <code>-1002489102938</code>).</div>
            <div><b>5.</b> Paste the Bot Token &amp; Group Chat ID below, then click <b>Test Connection</b>!</div>
          </div>
        </div>

        {modalTestResult && (
          <Alert
            type={modalTestResult.success ? 'success' : 'error'}
            message={modalTestResult.success ? 'Handshake Succeeded' : 'Connection Error'}
            description={modalTestResult.message || modalTestResult.error}
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Row gutter={16} align="middle">
            <Col span={16}>
              <Form.Item name="telegram_enabled" label="Store Telegram Ordering &amp; Invoices" valuePropName="checked">
                <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'right', paddingBottom: 24 }}>
                <Text style={{ fontSize: 11, color: adminTheme.subtext }}>
                  Status:{' '}
                  <b style={{ color: editingConfig?.status === 'connected' ? '#10b981' : '#ef4444' }}>
                    {editingConfig?.status === 'connected' ? 'Connected' : 'Unverified'}
                  </b>
                </Text>
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="groupId"
                label="Store Telegram Group Chat ID"
                rules={[{ required: true, message: 'Please enter unique Group ID' }]}
                extra="Starts with -100 or -5 (e.g. -1002489102938). Required for kitchen invoices."
              >
                <Input placeholder="-1002489102938" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="botUsername" label="Dedicated Bot Username" rules={[{ required: true }]}>
                <Input placeholder="@aura_coffee_order_bot" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="groupTitle" label="Telegram Group Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Aura Coffee - Kitchen & Baristas Orders" />
          </Form.Item>

          <Form.Item
            name="botToken"
            label="Dedicated Bot API Token"
            extra={
              <span style={{ fontSize: 11, color: '#64748b' }}>
                🔒 <b>Encrypted at rest (AES-256):</b> Leave blank to keep existing token{' '}
                <code style={{ color: '#2563eb' }}>{editingConfig?.botTokenPreview || '8613686...1lCw'}</code>. Full token is never shown.
              </span>
            }
          >
            <Input.Password placeholder="Enter new bot token from @BotFather (or leave blank to keep current)" />
          </Form.Item>

          <Form.Item name="groupInviteLink" label="Group Chat Invite Link (Optional)">
            <Input placeholder="https://t.me/+AbCdEfGhIjK" />
          </Form.Item>

          <Divider style={{ margin: '12px 0 16px' }} />
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            Automated Invoice Dispatch &amp; Notification Settings:
          </Text>

          <Row gutter={[16, 12]}>
            <Col span={12}>
              <Form.Item name="canSendOrders" label="Dispatch Invoices to Store Group" valuePropName="checked">
                <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="canUpdateStatus" label="Interactive Group Status Actions" valuePropName="checked">
                <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notifySoundAlert" label="Sound Alert on New Invoice" valuePropName="checked">
                <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dailySummary" label="Daily Shift Summary" valuePropName="checked">
                <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
}
