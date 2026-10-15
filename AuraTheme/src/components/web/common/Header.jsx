import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Flex,
  Grid,
  Input,
  Row,
  Col,
  Dropdown,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  AppstoreOutlined,
  ArrowRightOutlined,
  BookOutlined,
  CoffeeOutlined,
  CompassOutlined,
  DownOutlined,
  HeartOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuOutlined,
  SearchOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  StarFilled,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { useWishlist } from '../../../contexts/WishlistContext';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchProducts, fetchShops } from '../../../utils/apiconfig';
import { formatCurrency, publicTheme } from '../../../utils/webTheme';
import OfflineWarningBanner from '../../common/OfflineWarningBanner';
import AuraLogo from '../../common/AuraLogo';

const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

// Universal website service topics
const serviceItems = [
  { id: 'srv-1', title: 'Telegram Mini App & E-Menu Deployment', description: 'Turnkey digital menu with table QR ordering and automated Telegram kitchen dispatch.', tag: 'E-Menu', path: '/service' },
  { id: 'srv-2', title: 'Specialty Coffee Wholesale & Roastery', description: 'Direct-trade single-origin beans, custom espresso roasting, and barista training.', tag: 'Roastery', path: '/service' },
  { id: 'srv-3', title: 'Artisan Bakery & Viennoiserie Supply', description: 'Daily fresh supply of 72-hour sourdough loaves and French butter croissants.', tag: 'Bakery', path: '/service' },
  { id: 'srv-4', title: 'Kitchen Display System & POS Integration', description: 'Real-time order ticket routing, kitchen status stepper, and offline sync.', tag: 'POS / KDS', path: '/service' },
  { id: 'srv-5', title: 'Private Catering & Mobile Espresso Bars', description: 'Pop-up coffee carts and bespoke pastry grazing tables for corporate events.', tag: 'Catering', path: '/service' },
  { id: 'srv-6', title: 'Franchise & Partner Onboarding', description: 'End-to-end store setup, digital catalog digitization, and 24/7 technical SLA.', tag: 'Onboarding', path: '/service' },
];

// Universal website learning tracks
const learnItems = [
  { id: 'lrn-1', title: 'Business Basics & Operations', description: 'Understand pricing, customer trust, operations, and small business management.', tag: '7 courses', path: '/learn' },
  { id: 'lrn-2', title: 'Shop Setup & Product Publishing', description: 'Learn shop onboarding, SKU publishing, order flow, and Telegram E-Menu automation.', tag: '9 courses', path: '/learn' },
  { id: 'lrn-3', title: 'Education and School Community', description: 'Learning paths for students, school communities, and educational teams.', tag: '6 courses', path: '/learn' },
  { id: 'lrn-4', title: 'Startup Guide: 12 Steps to Launch', description: 'A guided checklist for launching a shop and setting up your first warehouse products.', tag: 'Guide', path: '/learn' },
  { id: 'lrn-5', title: 'Seller Resources & Playbooks', description: 'Templates, playbooks, and operating procedures to help teams run their sourcing better.', tag: '24 files', path: '/learn' },
];

// Universal website pages
const websitePages = [
  { id: 'pg-1', title: 'Home', path: '/', description: 'Aura Supply portal overview, featured shops and highlights' },
  { id: 'pg-2', title: 'Shops Directory', path: '/shops', description: 'Directory of all verified shops, warehouse systems, and packaging suppliers' },
  { id: 'pg-3', title: 'Products Catalog', path: '/products', description: 'Browse and filter all available equipment, spare parts, and supplies' },
  { id: 'pg-4', title: 'Services & Solutions', path: '/service', description: 'Digital E-Menu setup, wholesale coffee/bakery supply, POS integration, and event catering' },
  { id: 'pg-5', title: 'Learning Academy', path: '/learn', description: 'Courses, onboarding tracks, and operational playbooks' },
  { id: 'pg-6', title: 'Operations Portal', path: '/admins/dashboard', description: 'Management dashboard for sales, inventory, and system settings' },
  { id: 'pg-7', title: 'Web E-Menu (Our Tasty Foods)', path: '/shop/menu/aura-bakery', description: 'Interactive website contactless digital e-menu with table ordering' },
  { id: 'pg-8', title: 'Wishlist', path: '/wishlist', description: 'Your saved products and bookmarked equipment' },
  { id: 'pg-9', title: 'Cart & Orders', path: '/cart', description: 'Review your items and proceed to order fulfillment' },
];

const Header = ({ currentPage }) => {
  const { cartItemCount, cartTotal = 0 } = useCart();
  const { wishlistItemCount } = useWishlist();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [searchParams] = useSearchParams();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'shops' | 'products' | 'services' | 'learn' | 'pages'

  const searchContainerRef = useRef(null);
  
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isPhone = screens.xs !== undefined ? (screens.xs && !screens.sm) : windowWidth < 576;
  const isTablet = screens.sm !== undefined ? (screens.sm && !screens.lg) : (windowWidth >= 576 && windowWidth < 992);
  const isDesktop = !isPhone && !isTablet;
  const isMobile = isPhone;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [selectedStoreFilter, setSelectedStoreFilter] = useState('all');
  const [dbProducts, setDbProducts] = useState([]);
  const [dbShops, setDbShops] = useState([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchShops(), fetchProducts({ limit: 100 })])
      .then(([sRes, pRes]) => {
        if (!isMounted) return;
        if (sRes?.success && Array.isArray(sRes.data)) setDbShops(sRes.data);
        if (pRes?.success && Array.isArray(pRes.data)) setDbProducts(pRes.data);
      })
      .catch((err) => console.warn('Header catalog load error:', err));
    return () => { isMounted = false; };
  }, []);

  // Consolidated Master Catalog of all products across all stores
  const allStoresCatalog = useMemo(() => {
    const storeMap = new Map();
    dbShops.forEach((st) => {
      storeMap.set(st.id, st);
      storeMap.set(st.slug, st);
    });

    return dbProducts.map((p) => {
      const store =
        storeMap.get(p.shop_id) ||
        storeMap.get(p.biller_id) ||
        { name: p.brand || 'Aura Partner', slug: 'sbc-store', emoji: '🏪' };

      const storeName = store.name || p.brand || 'Aura Partner';
      const storeSlug = store.slug || 'sbc-store';
      const storeEmoji =
        store.emoji ||
        (storeName.includes('Bakery')
          ? '🥐'
          : storeName.includes('Coffee')
          ? '☕'
          : storeName.includes('Bistro')
          ? '🍽️'
          : storeName.includes('Lounge')
          ? '🍵'
          : storeName.includes('Mobile')
          ? '📱'
          : storeName.includes('PC')
          ? '🖥️'
          : storeName.includes('Tech')
          ? '💻'
          : '🏪');

      return {
        id: `store_prod_${p.id}`,
        rawId: p.id,
        name: p.name,
        price: Number(p.price || 0),
        image:
          p.image ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        category: p.category || 'Supplies',
        brand: storeName,
        storeName,
        storeSlug,
        storeEmoji,
        isStoreItem: true,
        description: p.description || p.details || `Specialty item available from ${storeName}.`,
        targetUrl: `/products/${p.id}`,
        menuUrl: `/shop/menu/${storeSlug}`,
      };
    });
  }, [dbProducts, dbShops]);

  // Universal Global Search Computation across all entities
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        shops: dbShops.slice(0, 3),
        products: allStoresCatalog.slice(0, 5),
        services: serviceItems.slice(0, 2),
        learn: learnItems.slice(0, 2),
        pages: websitePages.slice(0, 3),
        matchedStoreNames: [],
        total: 0,
        isDefaultSuggestions: true,
      };
    }

    const matchedShops = (dbShops || []).filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.summary?.toLowerCase().includes(q) ||
        s.tagline?.toLowerCase().includes(q) ||
        (s.branch && s.branch.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.specialties && Array.isArray(s.specialties) && s.specialties.some((spec) => spec.toLowerCase().includes(q)))
    );

    // Filter products across all stores
    const matchedProducts = allStoresCatalog.filter((p) => {
      const matchesQ =
        p.name.toLowerCase().includes(q) ||
        p.storeName.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesStore =
        selectedStoreFilter === 'all' ||
        p.storeSlug === selectedStoreFilter ||
        p.storeName === selectedStoreFilter;

      return matchesQ && matchesStore;
    });

    // Unique stores represented in the matched products
    const storeMap = new Map();
    allStoresCatalog
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.storeName.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
      )
      .forEach((p) => {
        if (!storeMap.has(p.storeSlug)) {
          storeMap.set(p.storeSlug, {
            slug: p.storeSlug,
            name: p.storeName,
            emoji: p.storeEmoji,
          });
        }
      });
    const matchedStoreNames = Array.from(storeMap.values());

    const matchedServices = serviceItems.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tag.toLowerCase().includes(q)
    );

    const matchedLearn = learnItems.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tag.toLowerCase().includes(q)
    );

    const matchedPages = websitePages.filter(
      (pg) =>
        pg.title.toLowerCase().includes(q) ||
        pg.description.toLowerCase().includes(q) ||
        pg.path.toLowerCase().includes(q)
    );

    const total =
      matchedShops.length +
      matchedProducts.length +
      matchedServices.length +
      matchedLearn.length +
      matchedPages.length;

    return {
      shops: matchedShops,
      simpleStores: simpleStoreMatches,
      products: matchedProducts,
      matchedStoreNames,
      services: matchedServices,
      learn: matchedLearn,
      pages: matchedPages,
      total,
      isDefaultSuggestions: false,
    };
  }, [searchQuery, allStoresCatalog, selectedStoreFilter]);

  const navItems = useMemo(
    () => [
      { key: '/', icon: <HomeOutlined />, label: 'Home' },
      { key: '/shops', icon: <ShopOutlined />, label: 'Shops' },
      { key: '/products', icon: <AppstoreOutlined />, label: 'Products' },
      { key: '/service', icon: <TeamOutlined />, label: 'Service' },
      { key: '/learn', icon: <BookOutlined />, label: 'Learn' },
    ],
    []
  );

  const quickLinks = [
    { key: '/wishlist', icon: <HeartOutlined />, label: 'Wishlist' },
    { key: '/cart', icon: <ShoppingCartOutlined />, label: 'Cart' },
  ];

  const mobileShortcuts = [
    { key: '/shops', icon: <ShopOutlined />, label: 'Shops' },
    { key: '/products', icon: <AppstoreOutlined />, label: 'Products' },
    { key: '/service', icon: <TeamOutlined />, label: 'Support' },
  ];

  const handleMenuClick = ({ key }) => {
    switch (key) {
      case 'profile':
        navigate('/profile');
        break;
      case 'login':
        navigate('/login');
        break;
      case 'signup':
        navigate('/login?tab=register');
        break;
      case 'admins':
        navigate('/admins/dashboard');
        break;
      case 'logout':
        logout();
        navigate('/');
        break;
      default:
        break;
    }
    setDrawerVisible(false);
  };

  const userMenuItems = useMemo(() => {
    if (user) {
      return [
        {
          key: 'user-info',
          disabled: true,
          label: (
            <div style={{ padding: '2px 0' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: publicTheme.text }}>{user.name}</div>
              <div style={{ fontSize: 11, color: publicTheme.subtext }}>{user.email || user.role || 'Member'}</div>
            </div>
          ),
        },
        { type: 'divider' },
        {
          key: 'profile',
          icon: <UserOutlined style={{ color: publicTheme.primary }} />,
          label: 'My Profile & Settings',
        },
        {
          key: 'admins',
          icon: <ThunderboltOutlined style={{ color: '#f59e0b' }} />,
          label: 'Operations & ERP Portal',
        },
        { type: 'divider' },
        {
          key: 'logout',
          icon: <LogoutOutlined style={{ color: '#ef4444' }} />,
          label: 'Sign Out of Workspace',
          danger: true,
        },
      ];
    }
    return [
      {
        key: 'guest-info',
        disabled: true,
        label: (
          <div style={{ padding: '2px 0' }}>
            <div style={{ fontWeight: 800, fontSize: 12.5, color: publicTheme.text }}>Guest Workspace</div>
            <div style={{ fontSize: 11, color: publicTheme.subtext }}>Public Catalog & Ordering Mode</div>
          </div>
        ),
      },
      { type: 'divider' },
      {
        key: 'login',
        icon: <LoginOutlined style={{ color: publicTheme.primary }} />,
        label: 'Sign In to Workspace',
      },
      {
        key: 'signup',
        icon: <UserAddOutlined style={{ color: '#10b981' }} />,
        label: 'Create Account / Register',
      },
      {
        key: 'admins',
        icon: <ThunderboltOutlined style={{ color: '#f59e0b' }} />,
        label: 'ERP Operations Portal (/admins)',
      },
    ];
  }, [user]);

  const handleSelectResult = (targetUrl) => {
    setIsSearchFocused(false);
    setSearchVisible(false);
    navigate(targetUrl);
  };

  const handlePerformGlobalSearch = (queryToUse) => {
    const q = (queryToUse || searchQuery).trim();
    if (!q) return;
    setIsSearchFocused(false);
    setSearchVisible(false);

    // If query matches shops better, route to /shops?q=..., otherwise /products?q=...
    if (searchResults.shops.length > 0 && searchResults.products.length === 0) {
      navigate(`/shops?q=${encodeURIComponent(q)}`);
    } else {
      navigate(`/products?q=${encodeURIComponent(q)}`);
    }
  };

  const renderNavLink = (item) => {
    const active =
      currentPage === item.key || (item.key !== '/' && currentPage.startsWith(item.key));

    return (
      <Link
        key={item.key}
        to={item.key}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 999,
          color: active ? publicTheme.primary : publicTheme.text,
          background: active ? publicTheme.pill : 'transparent',
          fontWeight: active ? 700 : 500,
          fontSize: 'var(--font-base)',
        }}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>
    );
  };

  // Render the Universal Search Result Dropdown Menu
  const renderSearchDropdown = () => {
    if (!isSearchFocused) return null;

    const {
      shops: sList,
      products: pList,
      matchedStoreNames,
      services: svList,
      learn: lList,
      pages: pgList,
      total,
      isDefaultSuggestions,
    } = searchResults;

    return (
      <div
        style={{
          position: 'absolute',
          top: isPhone ? 40 : 46,
          right: 0,
          left: isPhone ? 0 : 'auto',
          width: isPhone ? '100%' : isTablet ? 420 : 520,
          maxHeight: isPhone ? 420 : 540,
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: isPhone ? 16 : 22,
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.22)',
          border: `1px solid ${publicTheme.softBorder}`,
          zIndex: 1200,
          padding: isPhone ? 10 : 14,
        }}
      >
        {/* Header & Category Pills */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, letterSpacing: '0.04em' }}>
              {isDefaultSuggestions
                ? '⭐ POPULAR PRODUCTS & STORES'
                : `🔍 FOUND ${pList.length} PRODUCTS ACROSS STORES (${total} TOTAL)`}
            </span>
            {searchQuery && (
              <span
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStoreFilter('all');
                }}
                style={{ fontSize: 11, color: publicTheme.primary, cursor: 'pointer', fontWeight: 700 }}
              >
                Clear All
              </span>
            )}
          </div>

          <Space size={4} wrap style={{ paddingInline: 2, marginBottom: matchedStoreNames?.length > 1 ? 8 : 0 }}>
            {[
              { id: 'all', label: `All (${total})` },
              { id: 'products', label: `Products (${pList.length})` },
              { id: 'shops', label: `Stores (${sList.length})` },
              { id: 'services', label: `Services (${svList.length})` },
              { id: 'learn', label: `Learn (${lList.length})` },
              { id: 'pages', label: `Pages (${pgList.length})` },
            ].map((cat) => (
              <Tag
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 999,
                  background: activeCategory === cat.id ? publicTheme.primary : publicTheme.cardMuted,
                  color: activeCategory === cat.id ? '#ffffff' : publicTheme.text,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 9px',
                }}
              >
                {cat.label}
              </Tag>
            ))}
          </Space>

          {/* Secondary Quick Store Filter Chips if multi-store results */}
          {matchedStoreNames && matchedStoreNames.length > 1 && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${publicTheme.softBorder}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: publicTheme.subtext, marginBottom: 4, textTransform: 'uppercase' }}>
                Filter by Merchant / Store:
              </div>
              <Space size={4} wrap>
                <Tag
                  onClick={() => setSelectedStoreFilter('all')}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 999,
                    background: selectedStoreFilter === 'all' ? '#0f172a' : '#f1f5f9',
                    color: selectedStoreFilter === 'all' ? '#ffffff' : '#475569',
                    border: 'none',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  All Stores
                </Tag>
                {matchedStoreNames.map((st) => (
                  <Tag
                    key={st.slug}
                    onClick={() => setSelectedStoreFilter(selectedStoreFilter === st.slug ? 'all' : st.slug)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 999,
                      background: selectedStoreFilter === st.slug ? publicTheme.primary : publicTheme.cardMuted,
                      color: selectedStoreFilter === st.slug ? '#ffffff' : publicTheme.text,
                      border: 'none',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {st.emoji} {st.name}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
        </div>

        {/* Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* 1. PRODUCTS ACROSS ALL STORES */}
          {(activeCategory === 'all' || activeCategory === 'products') && pList.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: publicTheme.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🛍️ Products Across All Stores ({pList.length})
                </span>
                <span
                  onClick={() => handlePerformGlobalSearch()}
                  style={{ fontSize: 11, fontWeight: 700, color: publicTheme.primary, cursor: 'pointer' }}
                >
                  View All →
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {pList.slice(0, activeCategory === 'products' ? 12 : 6).map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectResult(prod.targetUrl)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 14,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: `1px solid ${publicTheme.softBorder}`,
                      background: '#ffffff',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = publicTheme.cardMuted;
                      e.currentTarget.style.borderColor = publicTheme.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = publicTheme.softBorder;
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <img
                        src={prod.image}
                        alt={prod.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&fit=crop';
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: `1px solid ${publicTheme.softBorder}`,
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prod.name}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 6,
                              background: 'rgba(47, 111, 237, 0.08)',
                              color: publicTheme.primary,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            {prod.storeEmoji} {prod.storeName}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: publicTheme.subtext, marginTop: 2 }}>
                          <span style={{ fontWeight: 800, color: '#A31D1D', marginRight: 6 }}>
                            ${Number(prod.price).toFixed(2)}
                          </span>
                          <span>• {prod.category}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <Tag
                        style={{
                          borderRadius: 999,
                          background: prod.isStoreItem ? 'rgba(163, 29, 29, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: prod.isStoreItem ? '#A31D1D' : publicTheme.success,
                          border: 'none',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        {prod.isStoreItem ? 'Open Menu' : 'Product'}
                      </Tag>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. SHOPS & STORES */}
          {(activeCategory === 'all' || activeCategory === 'shops') && sList.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.primary, padding: '4px 8px', textTransform: 'uppercase' }}>
                🏪 Stores & Merchants ({sList.length})
              </div>
              {sList.slice(0, 3).map((shop) => (
                <div
                  key={shop.id}
                  onClick={() => handleSelectResult(`/shops/${shop.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = publicTheme.cardMuted)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar size={34} style={{ background: publicTheme.ribbon, fontWeight: 800, flexShrink: 0 }}>
                      {shop.logoText || shop.name.slice(0, 2)}
                    </Avatar>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {shop.name}
                      </div>
                      <div style={{ fontSize: 11, color: publicTheme.subtext }}>
                        {shop.branch} • <StarFilled style={{ color: publicTheme.warning }} /> {shop.rating}
                      </div>
                    </div>
                  </div>
                  <Tag style={{ borderRadius: 999, background: 'rgba(47, 111, 237, 0.1)', color: publicTheme.primary, border: 'none', fontSize: 10, fontWeight: 700 }}>
                    Store
                  </Tag>
                </div>
              ))}
            </div>
          )}

          {/* SERVICES */}
          {(activeCategory === 'all' || activeCategory === 'services') && svList.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.primary, padding: '4px 8px' }}>
                SERVICES & TECHNICAL SUPPORT
              </div>
              {svList.slice(0, 2).map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => handleSelectResult(srv.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = publicTheme.cardMuted)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: publicTheme.pill, display: 'flex', alignItems: 'center', justifyContent: 'center', color: publicTheme.primary, flexShrink: 0 }}>
                      <ToolOutlined />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {srv.title}
                      </div>
                      <div style={{ fontSize: 11, color: publicTheme.subtext, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {srv.description}
                      </div>
                    </div>
                  </div>
                  <Tag style={{ borderRadius: 999, background: 'rgba(255, 122, 61, 0.1)', color: publicTheme.accent, border: 'none', fontSize: 10, fontWeight: 700 }}>
                    Service
                  </Tag>
                </div>
              ))}
            </div>
          )}

          {/* LEARN */}
          {(activeCategory === 'all' || activeCategory === 'learn') && lList.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.primary, padding: '4px 8px' }}>
                LEARNING ACADEMY
              </div>
              {lList.slice(0, 2).map((lrn) => (
                <div
                  key={lrn.id}
                  onClick={() => handleSelectResult(lrn.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = publicTheme.cardMuted)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(240, 180, 41, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: publicTheme.warning, flexShrink: 0 }}>
                      <BookOutlined />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lrn.title}
                      </div>
                      <div style={{ fontSize: 11, color: publicTheme.subtext, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lrn.description}
                      </div>
                    </div>
                  </div>
                  <Tag style={{ borderRadius: 999, background: 'rgba(240, 180, 41, 0.15)', color: publicTheme.warning, border: 'none', fontSize: 10, fontWeight: 700 }}>
                    {lrn.tag}
                  </Tag>
                </div>
              ))}
            </div>
          )}

          {/* PAGES */}
          {(activeCategory === 'all' || activeCategory === 'pages') && pgList.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.primary, padding: '4px 8px' }}>
                WEBSITE DIRECT NAVIGATION
              </div>
              {pgList.slice(0, 3).map((page) => (
                <div
                  key={page.id}
                  onClick={() => handleSelectResult(page.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = publicTheme.cardMuted)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: publicTheme.cardMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', color: publicTheme.subtext, flexShrink: 0 }}>
                      <CompassOutlined />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: publicTheme.text }}>
                        {page.title}
                      </div>
                      <div style={{ fontSize: 11, color: publicTheme.subtext }}>
                        {page.path}
                      </div>
                    </div>
                  </div>
                  <ArrowRightOutlined style={{ color: publicTheme.subtext, fontSize: 12 }} />
                </div>
              ))}
            </div>
          )}

          {total === 0 && !isDefaultSuggestions && (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: publicTheme.subtext }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
              <div style={{ fontWeight: 700 }}>No results found for "{searchQuery}"</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Try searching for warehouse, scanners, safety, packaging, or support.
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action to Search All */}
        {searchQuery.trim() && (
          <div
            onClick={() => handlePerformGlobalSearch()}
            style={{
              marginTop: 10,
              padding: '10px 14px',
              borderRadius: 12,
              background: publicTheme.pill,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: publicTheme.primary,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            <span>Search all categories for "{searchQuery}"</span>
            <ArrowRightOutlined />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <OfflineWarningBanner />
      {/* Top B2B Supply Info Strip (Desktop & Tablet) */}
      {!isPhone && (
        <div
          style={{
            background: '#0f172a',
            color: '#94a3b8',
            fontSize: 11.5,
            padding: '5px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f8fafc', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Aura B2B Logistics Hubs: Phnom Penh • Bangkok • Rayong • Daun Penh
            </span>
            <span style={{ color: '#334155' }}>•</span>
            <span style={{ color: '#cbd5e1' }}>Direct Wholesale Sourcing & Multi-Store Automated Dispatch</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>📞 Sourcing Hotline: <strong style={{ color: '#f8fafc' }}>+855 12 345 678</strong></span>
            <span style={{ color: '#334155' }}>|</span>
            <a href="https://t.me/aura_emenu_order_bot" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', fontWeight: 700 }}>
              Telegram Bot Direct
            </a>
            <span style={{ color: '#334155' }}>|</span>
            <Link to="/service" style={{ color: '#fb923c', fontWeight: 700 }}>
              Request Quote (RFQ)
            </Link>
          </div>
        </div>
      )}
      {isPhone ? (
        /* Phone View: Clean Modern Single-Row Header (< 576px) */
        <div style={{ padding: '6px 8px 6px', background: '#ffffff' }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 14,
              background: '#ffffff',
              border: `1px solid ${publicTheme.softBorder}`,
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            {/* 1. Logo on the left */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <AuraLogo size={28} showText={true} subtitle="B2B SUPPLY" textColor={publicTheme.text} />
            </Link>

            {/* 2. Search Box in the middle */}
            <div ref={searchContainerRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onPressEnter={() => handlePerformGlobalSearch()}
                placeholder="Search products across all stores..."
                prefix={<SearchOutlined style={{ color: publicTheme.primary, fontSize: 13, marginRight: 2 }} />}
                allowClear
                style={{
                  width: '100%',
                  height: 34,
                  borderRadius: 999,
                  border: `1px solid ${publicTheme.softBorder}`,
                  background: 'rgba(240, 244, 255, 0.75)',
                  fontSize: 'var(--font-base)',
                  paddingLeft: 8,
                }}
              />
              {renderSearchDropdown()}
            </div>

            {/* Right Action Icons: 3. Menu (hamburger) & 4. Account/Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {/* Menu (hamburger) icon */}
              <Button
                type="text"
                aria-label="Open Menu"
                icon={<MenuOutlined style={{ fontSize: 15, color: publicTheme.text }} />}
                onClick={() => setDrawerVisible(true)}
                style={{
                  height: 34,
                  width: 34,
                  minWidth: 34,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: publicTheme.cardMuted,
                  border: `1px solid ${publicTheme.softBorder}`,
                }}
              />

              {/* Account/Profile icon on the right */}
              <Button
                type="text"
                aria-label="User Account"
                icon={<UserOutlined style={{ fontSize: 15, color: publicTheme.text }} />}
                onClick={() => {
                  if (user) {
                    navigate('/profile');
                  } else {
                    navigate('/login');
                  }
                }}
                style={{
                  height: 34,
                  width: 34,
                  minWidth: 34,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: user ? publicTheme.pill : publicTheme.cardMuted,
                  border: `1px solid ${user ? publicTheme.primary : publicTheme.softBorder}`,
                }}
              />
            </div>
          </div>
        </div>
      ) : isTablet ? (
        /* Tablet View: Balanced Compact 2-Row Header (576px - 991px) */
        <div style={{ padding: '8px 12px 8px', background: '#ffffff' }}>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 16,
              background: '#ffffff',
              border: `1px solid ${publicTheme.softBorder}`,
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Row 1: Tablet Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
                <AuraLogo size={32} showText={true} subtitle="B2B MARKET" textColor={publicTheme.text} />
              </Link>

              <div ref={searchContainerRef} style={{ position: 'relative', flex: 1, maxWidth: 340, marginLeft: 6, marginRight: 6 }}>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onPressEnter={() => handlePerformGlobalSearch()}
                  placeholder="Search products across all stores (e.g. Croissant, Latte)..."
                  prefix={<SearchOutlined style={{ color: publicTheme.primary, fontSize: 13 }} />}
                  allowClear
                  style={{
                    width: '100%',
                    height: 36,
                    borderRadius: 999,
                    border: `1px solid ${publicTheme.softBorder}`,
                    background: 'rgba(240, 244, 255, 0.75)',
                    fontSize: 'var(--font-base)',
                  }}
                />
                {renderSearchDropdown()}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <Badge count={wishlistItemCount} size="small">
                  <Button
                    type="text"
                    icon={<HeartOutlined style={{ fontSize: 14, color: publicTheme.text }} />}
                    onClick={() => navigate('/wishlist')}
                    style={{
                      height: 34,
                      width: 34,
                      minWidth: 34,
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 11,
                      background: publicTheme.cardMuted,
                      border: `1px solid ${publicTheme.softBorder}`,
                    }}
                  />
                </Badge>

                <Badge count={cartItemCount} size="small">
                  <Button
                    type="text"
                    data-cart-target="true"
                    icon={<ShoppingCartOutlined style={{ fontSize: 14, color: publicTheme.text }} />}
                    onClick={() => navigate('/cart')}
                    style={{
                      height: 34,
                      width: 34,
                      minWidth: 34,
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 11,
                      background: publicTheme.cardMuted,
                      border: `1px solid ${publicTheme.softBorder}`,
                    }}
                  />
                </Badge>

                <Dropdown
                  menu={{
                    items: userMenuItems,
                    onClick: handleMenuClick,
                  }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    style={{
                      height: 34,
                      padding: '0 8px',
                      borderRadius: 11,
                      background: publicTheme.cardMuted,
                      border: `1px solid ${publicTheme.softBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Avatar icon={<UserOutlined />} size={22} style={{ background: publicTheme.primary }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: publicTheme.text, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user ? user.name : 'Guest'}
                    </span>
                  </Button>
                </Dropdown>

                <Button
                  type="text"
                  icon={<MenuOutlined style={{ fontSize: 14 }} />}
                  onClick={() => setDrawerVisible(true)}
                  style={{
                    height: 34,
                    width: 34,
                    minWidth: 34,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 11,
                    background: publicTheme.cardMuted,
                    border: `1px solid ${publicTheme.softBorder}`,
                  }}
                />
              </div>
            </div>

            {/* Row 2: Tablet Navigation Pills */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {navItems.map((item) => {
                const active =
                  currentPage === item.key || (item.key !== '/' && currentPage.startsWith(item.key));
                return (
                  <Link
                    key={item.key}
                    to={item.key}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 13px',
                      borderRadius: 999,
                      color: active ? '#ffffff' : publicTheme.text,
                      background: active ? publicTheme.primary : publicTheme.cardMuted,
                      fontWeight: active ? 700 : 600,
                      fontSize: 'var(--font-base)',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      boxShadow: active ? '0 4px 10px rgba(47, 111, 237, 0.22)' : 'none',
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <Button
                type="text"
                icon={<ThunderboltOutlined style={{ fontSize: 12 }} />}
                onClick={() => navigate('/admins/dashboard')}
                style={{
                  height: 28,
                  borderRadius: 999,
                  padding: '0 10px',
                  fontSize: 'var(--font-small)',
                  fontWeight: 600,
                  color: publicTheme.subtext,
                  background: 'transparent',
                  border: `1px dashed ${publicTheme.softBorder}`,
                }}
              >
                Portal
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop View (>= 992px) */
        <div style={{ padding: '8px 16px 8px', background: '#ffffff' }}>
          <div
            style={{
              padding: '10px 18px',
              borderRadius: 18,
              background: '#ffffff',
              border: `1px solid ${publicTheme.border}`,
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
            }}
          >
            <Row align="middle" justify="space-between" gutter={[12, 12]}>
              <Col xs={14} md={6} style={{ display: 'flex', alignItems: 'center' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                  <AuraLogo size={38} showText={true} subtitle="B2B SUPPLY" textColor={publicTheme.text} />
                </Link>
              </Col>

              <Col md={9} lg={8} style={{ display: 'flex', justifyContent: 'center' }}>
                <Flex
                  align="center"
                  gap={6}
                  style={{
                    padding: 5,
                    borderRadius: 999,
                    background: publicTheme.cardMuted,
                    border: `1px solid ${publicTheme.softBorder}`,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  {navItems.map((item) => renderNavLink(item))}
                </Flex>
              </Col>

              <Col xs={10} md={9} lg={10}>
                <Flex justify="flex-end" align="center" gap={10} wrap="wrap">
                  {/* Desktop Universal Search Box */}
                  <div ref={searchContainerRef} style={{ position: 'relative' }}>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onPressEnter={() => handlePerformGlobalSearch()}
                      placeholder="Search wholesale products, stores, categories..."
                      prefix={<SearchOutlined style={{ color: publicTheme.subtext }} />}
                      allowClear
                      style={{
                        width: screens.lg ? 330 : 250,
                        height: 40,
                        borderRadius: 999,
                        background: publicTheme.cardMuted,
                        border: `1px solid ${publicTheme.softBorder}`,
                        fontSize: 'var(--font-base)',
                      }}
                    />
                    {renderSearchDropdown()}
                  </div>

                  {screens.lg && (
                    <Button
                      icon={<ThunderboltOutlined />}
                      onClick={() => navigate('/admins/dashboard')}
                      style={{
                        height: 40,
                        borderRadius: 999,
                        paddingInline: 16,
                        background: publicTheme.ribbon,
                        border: 'none',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 'var(--font-base)',
                      }}
                    >
                      Operations Portal
                    </Button>
                  )}

                  <Badge count={wishlistItemCount} size="small">
                    <Button
                      icon={<HeartOutlined />}
                      onClick={() => navigate('/wishlist')}
                      style={{
                        height: 40,
                        width: 40,
                        borderRadius: 14,
                        background: publicTheme.cardMuted,
                        border: `1px solid ${publicTheme.softBorder}`,
                      }}
                    />
                  </Badge>

                  <Button
                    data-cart-target="true"
                    icon={<ShoppingCartOutlined style={{ color: cartItemCount > 0 ? publicTheme.primary : 'inherit' }} />}
                    onClick={() => navigate('/cart')}
                    style={{
                      height: 40,
                      borderRadius: 14,
                      paddingInline: 14,
                      background: cartItemCount > 0 ? 'rgba(47, 111, 237, 0.08)' : publicTheme.cardMuted,
                      border: `1px solid ${cartItemCount > 0 ? 'rgba(47, 111, 237, 0.3)' : publicTheme.softBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      color: cartItemCount > 0 ? publicTheme.primary : publicTheme.text,
                      fontWeight: 700,
                    }}
                  >
                    <span>Cart</span>
                    {cartItemCount > 0 && (
                      <Badge
                        count={cartItemCount}
                        style={{ backgroundColor: publicTheme.primary, boxShadow: 'none' }}
                      />
                    )}
                    {cartTotal > 0 && (
                      <span style={{ fontWeight: 800, marginLeft: 2, color: publicTheme.text }}>
                        {formatCurrency(cartTotal)}
                      </span>
                    )}
                  </Button>

                  <Dropdown
                    menu={{
                      items: userMenuItems,
                      onClick: handleMenuClick,
                    }}
                    placement="bottomRight"
                    trigger={['click']}
                  >
                    <Button
                      style={{
                        height: 40,
                        borderRadius: 14,
                        paddingInline: 10,
                        background: publicTheme.cardMuted,
                        border: `1px solid ${publicTheme.softBorder}`,
                      }}
                    >
                      <Space>
                        <Avatar icon={<UserOutlined />} size={26} style={{ background: publicTheme.primary }} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: publicTheme.text }}>
                            {user ? user.name : 'Guest'}
                          </div>
                          <div style={{ fontSize: 'var(--font-small)', color: publicTheme.subtext }}>
                            {user ? 'Workspace ready' : 'Sign in'}
                          </div>
                        </div>
                      </Space>
                    </Button>
                  </Dropdown>
                </Flex>
              </Col>
            </Row>
          </div>
        </div>
      )}

      {/* Responsive Navigation Drawer */}
      <Drawer
        title={
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleMenuClick,
            }}
            trigger={['click']}
            placement="bottomLeft"
          >
            <div
              role="button"
              tabIndex={0}
              aria-label="Workspace & Account Selector"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '7px 10px',
                borderRadius: 12,
                background: 'rgba(47, 111, 237, 0.05)',
                border: `1px solid ${publicTheme.softBorder || 'rgba(0,0,0,0.08)'}`,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(47, 111, 237, 0.1)';
                e.currentTarget.style.borderColor = publicTheme.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(47, 111, 237, 0.05)';
                e.currentTarget.style.borderColor = publicTheme.softBorder || 'rgba(0,0,0,0.08)';
              }}
            >
              <Space size={10} style={{ minWidth: 0, flex: 1 }}>
                <Avatar
                  icon={<UserOutlined />}
                  size={32}
                  style={{
                    background: publicTheme.primary,
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${publicTheme.primary}44`,
                  }}
                />
                <div style={{ textAlign: 'left', lineHeight: 1.25, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 13,
                      color: publicTheme.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user ? `${user.name}'s workspace` : 'Guest workspace'}
                  </div>
                  <div style={{ fontSize: 10.5, color: publicTheme.primary, fontWeight: 600 }}>
                    {user ? (user.role || 'Active Member') : 'Tap to switch or sign in ▾'}
                  </div>
                </div>
              </Space>
              <DownOutlined style={{ fontSize: 11, color: publicTheme.primary, flexShrink: 0, marginLeft: 6 }} />
            </div>
          </Dropdown>
        }
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        styles={{
          body: { padding: '16px' },
          header: { padding: '12px 14px' },
        }}
        width={screens.xs ? 280 : 320}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {/* Workspace Quick Mode Card inside drawer */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 14,
              background: user ? 'rgba(47, 111, 237, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px solid ${publicTheme.softBorder}`,
              marginBottom: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🏢 Workspace Mode
              </span>
              <Tag color={user ? 'blue' : 'default'} style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10.5 }}>
                {user ? 'Authenticated' : 'Guest Mode'}
              </Tag>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {!user ? (
                <>
                  <Button
                    size="small"
                    type="primary"
                    icon={<LoginOutlined />}
                    onClick={() => {
                      navigate('/login');
                      setDrawerVisible(false);
                    }}
                    style={{ flex: 1, borderRadius: 8, fontWeight: 700, fontSize: 12 }}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="small"
                    icon={<UserAddOutlined />}
                    onClick={() => {
                      navigate('/login?tab=register');
                      setDrawerVisible(false);
                    }}
                    style={{ flex: 1, borderRadius: 8, fontSize: 12 }}
                  >
                    Register
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="small"
                    icon={<UserOutlined />}
                    onClick={() => {
                      navigate('/profile');
                      setDrawerVisible(false);
                    }}
                    style={{ flex: 1, borderRadius: 8, fontWeight: 600, fontSize: 12 }}
                  >
                    Profile
                  </Button>
                  <Button
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={() => {
                      navigate('/admins/dashboard');
                      setDrawerVisible(false);
                    }}
                    style={{ flex: 1, borderRadius: 8, fontWeight: 600, fontSize: 12 }}
                  >
                    ERP Portal
                  </Button>
                </>
              )}
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 6px' }}>
            Navigation
          </div>
          {navItems.map((item) => (
            <Button
              key={item.key}
              block
              onClick={() => {
                navigate(item.key);
                setDrawerVisible(false);
              }}
              icon={item.icon}
              style={{
                height: 42,
                borderRadius: 12,
                textAlign: 'left',
                justifyContent: 'flex-start',
                background: currentPage === item.key ? publicTheme.pill : 'transparent',
                color: currentPage === item.key ? publicTheme.primary : publicTheme.text,
                borderColor: currentPage === item.key ? publicTheme.border : 'transparent',
                fontWeight: currentPage === item.key ? 700 : 500,
                fontSize: 13,
              }}
            >
              {item.label}
            </Button>
          ))}

          <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 6px 4px' }}>
            Quick Shortcuts
          </div>
          <Button
            block
            icon={<HeartOutlined />}
            onClick={() => {
              navigate('/wishlist');
              setDrawerVisible(false);
            }}
            style={{
              height: 42,
              borderRadius: 12,
              textAlign: 'left',
              justifyContent: 'space-between',
              display: 'flex',
              alignItems: 'center',
              fontSize: 13,
            }}
          >
            <span>Saved Wishlist</span>
            {wishlistItemCount > 0 && <Tag color="blue">{wishlistItemCount}</Tag>}
          </Button>

          <Button
            block
            icon={<ShoppingCartOutlined />}
            onClick={() => {
              navigate('/cart');
              setDrawerVisible(false);
            }}
            style={{
              height: 42,
              borderRadius: 12,
              textAlign: 'left',
              justifyContent: 'space-between',
              display: 'flex',
              alignItems: 'center',
              fontSize: 13,
            }}
          >
            <span>Cart & Orders</span>
            {cartItemCount > 0 && <Tag color="blue">{cartItemCount}</Tag>}
          </Button>

          <Button
            block
            icon={<ThunderboltOutlined />}
            onClick={() => {
              navigate('/admins/dashboard');
              setDrawerVisible(false);
            }}
            style={{
              height: 42,
              borderRadius: 12,
              textAlign: 'left',
              justifyContent: 'flex-start',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Operations Portal
          </Button>

          <div style={{ fontSize: 11, fontWeight: 800, color: publicTheme.subtext, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 6px 4px' }}>
            Account
          </div>
          {user ? (
            <>
              <Button
                block
                icon={<UserOutlined />}
                onClick={() => {
                  navigate('/profile');
                  setDrawerVisible(false);
                }}
                style={{
                  height: 42,
                  borderRadius: 12,
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  fontSize: 13,
                }}
              >
                My Profile ({user.name})
              </Button>
              <Button
                block
                danger
                onClick={() => {
                  logout();
                  navigate('/');
                  setDrawerVisible(false);
                }}
                style={{
                  height: 42,
                  borderRadius: 12,
                  fontSize: 13,
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Button
                block
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => {
                  navigate('/login');
                  setDrawerVisible(false);
                }}
                style={{
                  height: 42,
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Sign In to Account
              </Button>
              <Button
                block
                icon={<UserAddOutlined />}
                onClick={() => {
                  navigate('/login?tab=register');
                  setDrawerVisible(false);
                }}
                style={{
                  height: 40,
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Register New Account
              </Button>
            </Space>
          )}
        </Space>
      </Drawer>
    </>
  );

};

export default Header;
