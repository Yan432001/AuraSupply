import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  App,
  Avatar,
  Badge,
  Button,
  Dropdown,
  Flex,
  Input,
  Layout,
  Modal,
  Tooltip,
  Typography,
  message,
  Grid,
  Tag,
  Divider,
} from 'antd';
import {
  BellOutlined,
  ExpandOutlined,
  LogoutOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SearchOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined,
  ControlOutlined,
  DownOutlined,
  CheckOutlined,
  GlobalOutlined,
  ExportOutlined,
  BgColorsOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  HomeOutlined,
  AppstoreOutlined,
  ClearOutlined,
  RightOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage, useTranslation, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext';
import ThemeSettings from '../../contexts/ThemeSettings';
import { erpModules, flattenMenuItems, getModuleByKey, buildModulePath } from '../../data/erpModules';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useHeaderHeight } from '../../hooks/useHeaderHeight';
import OfflineWarningBanner from '../../components/common/OfflineWarningBanner';

const { Header } = Layout;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const pageTitles = {
  '/admins/dashboard': 'Command Center',
  '/admins/profile': 'My User Profile',
  '/admins/products': 'Inventory Control',
  '/admins/settings/units': 'Units & Measurements',
  '/admins/units': 'Units & Measurements',
  '/admins/users': 'Access Control & Roles',
  '/admins/orders': 'Orders Management',
  '/admins/qrcode': 'Store QR Code Generator',
  '/admins/qr-generator': 'Store QR Code Generator',
  '/admins/modules': 'ERP Modules Switchboard',
  '/admins/branches': 'Branches & Billers',
  '/admins/settings/branches': 'Branches & Billers',
  '/admins/billers': 'Multiple Billers Management',
  '/admins/settings/billers': 'Multiple Billers Management',
  '/admins/front-end': 'Website & Storefront CMS',
  '/admins/cms': 'Website & Storefront CMS',
};

const defaultNotifications = [
  {
    id: 1,
    title: 'Aura Enterprise License Verified',
    desc: 'All 25 ERP modules unlocked with unlimited multi-branch permissions.',
    time: '5m ago',
    type: 'success',
    read: false,
  },
  {
    id: 2,
    title: 'Low Stock SKU Warning',
    desc: '12 products in Main Warehouse are below minimum reorder points.',
    time: '28m ago',
    type: 'warning',
    read: false,
  },
  {
    id: 3,
    title: 'Bakong KHQR Gateway Active',
    desc: 'NBC real-time settlement webhook verified and transacting live.',
    time: '1h ago',
    type: 'info',
    read: false,
  },
  {
    id: 4,
    title: 'Automated Snapshot Complete',
    desc: 'Database backup successfully archived to local storage repository.',
    time: '4h ago',
    type: 'success',
    read: true,
  },
];

const Head = ({
  collapsed,
  setCollapsed,
  toggleMobileDrawer,
  openMobileDrawer,
  isMobile,
  showModuleMenu,
}) => {
  const screens = useBreakpoint();
  const { modal } = App.useApp ? App.useApp() : {};
  const adminTheme = useAdminTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { themeMode, toggleThemeMode, customSettings, toggleTransparentSystem } = useTheme();
  const isGlassActive = Boolean(customSettings?.transparentSystem?.enabled);
  const { headerRef } = useHeaderHeight();
  const { currentLanguage, activeLanguage, setLanguage, languages } = useLanguage();
  const { t } = useTranslation();

  // Responsive device checks combining Antd breakpoints, window width, and props
  const isDesktop = typeof window !== 'undefined'
    ? window.innerWidth >= 992
    : (screens.lg ?? !isMobile);
  const isTabletOrDesktop = typeof window !== 'undefined'
    ? window.innerWidth >= 768
    : (screens.md ?? !isMobile);
  const isSmallMobile = typeof window !== 'undefined'
    ? window.innerWidth < 576
    : (screens.xs ?? false);

  // Search Palette State
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const searchInputRef = useRef(null);

  // Notifications State
  const [notifications, setNotifications] = useState(defaultNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Keyboard platform detect (Mac vs Windows)
  const isMac = typeof window !== 'undefined' && navigator.platform ? navigator.platform.toUpperCase().indexOf('MAC') >= 0 : false;
  const shortcutKeyLabel = isMac ? '⌘K' : 'Ctrl K';

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K or "/" to search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === '/' && !searchModalOpen) {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        const isEditing = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable;
        if (!isEditing) {
          e.preventDefault();
          setSearchModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen]);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [searchModalOpen]);

  // Dynamic Theme Colors
  const headerBgColor = adminTheme.headerBg || (themeMode === 'dark' ? 'rgba(11, 17, 30, 0.82)' : 'rgba(255, 255, 255, 0.82)');
  const headerTextColor = adminTheme.headerColor || adminTheme.text;
  const headerSubtextColor = adminTheme.headerSubtext || adminTheme.subtext;
  const headerBorderColor = adminTheme.headerBorder || adminTheme.border || 'rgba(226, 232, 240, 0.8)';
  const headerButtonBg = adminTheme.headerButtonBg || (themeMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)');

  const iconButtonStyle = {
    width: 36,
    height: 36,
    minWidth: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: headerTextColor,
    border: `1px solid ${headerBorderColor}`,
    background: headerButtonBg,
    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
    cursor: 'pointer',
    padding: 0,
  };

  // Sign out confirmation
  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      const confirmFn = modal?.confirm || Modal.confirm;
      confirmFn({
        title: t('logout', 'Sign Out Confirmation'),
        content: t('confirm_logout', 'Are you sure you want to log out of the Aura ERP administration portal?'),
        okText: t('yes_logout', 'Yes, Sign Out'),
        okType: 'danger',
        cancelText: t('cancel', 'Cancel'),
        onOk: () => {
          logout();
        },
      });
    } else if (key === 'profile') {
      navigate('/admins/profile');
    } else if (key === 'theme-transparent') {
      toggleTransparentSystem?.();
    } else if (key === 'settings') {
      navigate('/admins/settings/system');
    } else if (key === 'mobile-dark-mode') {
      toggleThemeMode?.();
    } else if (key === 'mobile-storefront') {
      window.open('/', '_blank');
    } else if (key === 'mobile-switchboard') {
      navigate('/admins/modules');
    }
  };

  // Language Dropdown Items
  const langList = Array.isArray(languages) && languages.length ? languages : SUPPORTED_LANGUAGES;
  const languageMenuItems = langList.map((lang) => {
    const isSelected = lang.code === currentLanguage;
    return {
      key: `lang-${lang.code}`,
      icon: <span style={{ fontSize: 16 }}>{lang.flag}</span>,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, minWidth: 150, padding: '2px 0' }}>
          <div>
            <div style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? adminTheme.primary : undefined, fontSize: 13 }}>
              {lang.native}
            </div>
            <div style={{ fontSize: 11, color: adminTheme.subtext }}>
              {lang.name}
            </div>
          </div>
          {isSelected && <CheckOutlined style={{ color: adminTheme.primary, fontSize: 12 }} />}
        </div>
      ),
      onClick: () => {
        setLanguage(lang.code);
        try {
          message.destroy();
          message.success(`Language switched to ${lang.native} (${lang.name})`);
        } catch (_) {}
      },
    };
  });

  // User Profile Menu Items (Responsive for mobile & desktop)
  const userMenuItems = useMemo(() => {
    const items = [
      {
        key: 'header-user-info',
        disabled: true,
        label: (
          <div style={{ padding: '6px 2px 8px', borderBottom: `1px solid ${headerBorderColor}` }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: headerTextColor }}>
              {user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'Admin User')}
            </div>
            <div style={{ fontSize: 11, color: adminTheme.subtext, marginTop: 2 }}>
              {(user?.group_name || user?.role || (user?.isOwner ? 'Owner' : user?.isAdmin ? 'Admin' : 'Staff')).toUpperCase()} &bull; {user?.email || 'admin@aura.erp'}
            </div>
          </div>
        ),
      },
      { key: 'profile', icon: <UserOutlined style={{ fontSize: 14 }} />, label: t('profile', 'My Profile') },
    ];

    if (!isTabletOrDesktop) {
      items.push(
        {
          key: 'mobile-dark-mode',
          icon: themeMode === 'dark' ? <SunOutlined style={{ color: '#f59e0b', fontSize: 14 }} /> : <MoonOutlined style={{ fontSize: 14 }} />,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span>{themeMode === 'dark' ? t('light_mode', 'Light Mode') : t('dark_mode', 'Dark Mode')}</span>
              <Tag color={themeMode === 'dark' ? 'gold' : 'blue'} style={{ margin: 0, fontSize: 10, borderRadius: 4, fontWeight: 700 }}>
                {themeMode === 'dark' ? 'DARK' : 'LIGHT'}
              </Tag>
            </div>
          ),
        },
        {
          key: 'theme-transparent',
          icon: <span style={{ fontSize: 14 }}>💎</span>,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span>{t('transparent_glass_mode', 'Glass System')}</span>
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: isGlassActive
                    ? (themeMode === 'dark' ? 'rgba(47, 111, 237, 0.25)' : 'rgba(47, 111, 237, 0.12)')
                    : (themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
                  color: isGlassActive ? adminTheme.primary : adminTheme.subtext,
                  fontWeight: 700,
                }}
              >
                {isGlassActive ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
          ),
        },
        {
          key: 'mobile-storefront',
          icon: <ExportOutlined style={{ color: '#10b981', fontSize: 14 }} />,
          label: t('open_live_storefront', 'Live Storefront Website'),
        },
        {
          key: 'mobile-switchboard',
          icon: <ControlOutlined style={{ color: adminTheme.primary, fontSize: 14 }} />,
          label: t('modules_switchboard', 'Modules Switchboard'),
        }
      );
    } else {
      items.push({
        key: 'theme-transparent',
        icon: <BgColorsOutlined style={{ fontSize: 14 }} />,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span>{t('transparent_theme_settings', 'Transparent Theme')}</span>
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 4,
                background: isGlassActive
                  ? (themeMode === 'dark' ? 'rgba(47, 111, 237, 0.25)' : 'rgba(47, 111, 237, 0.12)')
                  : (themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
                color: isGlassActive ? adminTheme.primary : adminTheme.subtext,
                fontWeight: 700,
              }}
            >
              {isGlassActive ? 'GLASS ON' : 'OFF'}
            </span>
          </div>
        ),
      });
    }

    items.push(
      { key: 'settings', icon: <SettingOutlined style={{ fontSize: 14 }} />, label: t('settings', 'System Settings') },
      {
        key: 'change_language_sub',
        icon: <GlobalOutlined style={{ fontSize: 14 }} />,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span>{t('change_language', 'Language')}</span>
            <span style={{ fontSize: 11, color: adminTheme.subtext }}>{activeLanguage?.native || 'English'}</span>
          </div>
        ),
        children: langList.map((l) => ({
          key: `sub-lang-${l.code}`,
          icon: <span style={{ fontSize: 14 }}>{l.flag}</span>,
          label: `${l.native} (${l.name})`,
          onClick: () => {
            setLanguage(l.code);
            try {
              message.destroy();
              message.success(`Language switched to ${l.native} (${l.name})`);
            } catch (_) {}
          },
        })),
      },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined style={{ fontSize: 14 }} />, label: t('logout', 'Sign Out'), danger: true }
    );

    return items;
  }, [
    isTabletOrDesktop,
    user,
    headerBorderColor,
    headerTextColor,
    adminTheme,
    t,
    themeMode,
    isGlassActive,
    activeLanguage,
    langList,
    setLanguage,
  ]);

  // Breadcrumbs Computation
  const breadcrumbsList = useMemo(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const modParam = searchParams.get('module');

    if (path === '/admins' || path === '/admins/' || path === '/admins/dashboard') {
      if (modParam) {
        const mod = getModuleByKey(modParam);
        return [
          { label: 'Aura ERP', path: '/admins/dashboard' },
          { label: mod?.label || 'Module', path: `/admins/dashboard?module=${modParam}` },
          { label: t('controller', 'Controller') },
        ];
      }
      return [
        { label: 'Aura ERP', path: '/admins/dashboard' },
        { label: t('command_center', 'Command Center') },
      ];
    }

    if (path.startsWith('/admins/products')) {
      return [
        { label: 'Aura ERP', path: '/admins/dashboard' },
        { label: t('inventory', 'Inventory'), path: '/admins/dashboard?module=inventory' },
        { label: t('products_catalog', 'Products Catalog') },
      ];
    }

    if (path.startsWith('/admins/settings/units') || path === '/admins/units') {
      return [
        { label: 'Aura ERP', path: '/admins/dashboard' },
        { label: t('settings', 'Settings'), path: '/admins/modules' },
        { label: t('units_measurements', 'Units & Measurements') },
      ];
    }

    if (path.startsWith('/admins/branches') || path.startsWith('/admins/settings/branches')) {
      return [
        { label: 'Aura ERP', path: '/admins/dashboard' },
        { label: t('settings', 'Settings'), path: '/admins/modules' },
        { label: t('branches_billers', 'Branches & Billers') },
      ];
    }

    if (path.startsWith('/admins/billers') || path.startsWith('/admins/settings/billers')) {
      return [
        { label: 'Aura ERP', path: '/admins/dashboard' },
        { label: t('settings', 'Settings'), path: '/admins/modules' },
        { label: t('billers', 'Multiple Billers') },
      ];
    }

    if (path.startsWith('/admins/modules')) {
      return [
        { label: 'Aura ERP', path: '/admins/dashboard' },
        { label: t('settings', 'Settings'), path: '/admins/modules' },
        { label: t('modules_switchboard', 'Modules Switchboard') },
      ];
    }

    if (path.startsWith('/admins/users')) {
      return [
        { label: 'Aura ERP', path: '/admins/dashboard' },
        { label: t('administration', 'Administration') },
        { label: t('access_control', 'Access Control & Roles') },
      ];
    }

    if (path.startsWith('/admins/front-end') || path.startsWith('/admins/cms')) {
      return [
        { label: 'Aura ERP', path: '/admins/dashboard' },
        { label: t('storefront', 'Storefront CMS') },
        { label: t('cms_manager', 'CMS Manager') },
      ];
    }

    if (path.startsWith('/admins/profile')) {
      return [
        { label: 'Aura ERP', path: '/admins/dashboard' },
        { label: t('user_account', 'User Account') },
        { label: t('my_profile', 'My Profile') },
      ];
    }

    const currentTitle = pageTitles[path] || 'ERP Workspace';
    return [
      { label: 'Aura ERP', path: '/admins/dashboard' },
      { label: currentTitle },
    ];
  }, [location.pathname, location.search, t]);

  const currentPageTitle = breadcrumbsList[breadcrumbsList.length - 1]?.label || 'Command Center';

  // Omnibar Index of All Searchable Modules, Menus, and Pages
  const allSearchItems = useMemo(() => {
    const list = [];

    // Core Top-level Admin Pages
    list.push(
      { type: 'page', title: 'Command Center Dashboard', subtitle: 'Live telemetry, analytics & system health', path: '/admins/dashboard', category: 'General' },
      { type: 'page', title: 'Inventory Products Control', subtitle: 'Product catalog, barcode labels, and units', path: '/admins/products', category: 'Inventory' },
      { type: 'page', title: 'Units & Measurements (AURA_v1)', subtitle: 'Unit conversions, packaging ratios & base units', path: '/admins/settings/units', category: 'Settings' },
      { type: 'page', title: 'Store Branches & Billers', subtitle: 'Multi-branch setup, tax TIN and invoicing billers', path: '/admins/branches', category: 'Settings' },
      { type: 'page', title: 'Access Control & Permissions', subtitle: 'User roles, 777 permissions matrix and audit logs', path: '/admins/users', category: 'Administration' },
      { type: 'page', title: 'ERP Modules Switchboard', subtitle: 'Open/close modules and license activation gates', path: '/admins/modules', category: 'Settings' },
      { type: 'page', title: 'Storefront CMS & Web Pages', subtitle: 'Banners, slides, and public e-commerce settings', path: '/admins/front-end', category: 'Web & CMS' },
      { type: 'page', title: 'My User Profile', subtitle: 'Account preferences, avatar, and security credentials', path: '/admins/profile', category: 'General' }
    );

    // ERP Modules & Nested Submenus
    erpModules.forEach((mod) => {
      list.push({
        type: 'module',
        moduleKey: mod.key,
        title: `${mod.label} Module`,
        subtitle: mod.description,
        path: buildModulePath(mod.key, null),
        category: 'ERP Modules',
      });

      const leaves = flattenMenuItems(mod.menus || []);
      leaves.forEach((leaf) => {
        list.push({
          type: 'navigation',
          moduleKey: mod.key,
          menuKey: leaf.key,
          title: leaf.label,
          subtitle: `${mod.label} > ${leaf.groupPath?.join(' > ') || 'Catalog'}`,
          path: leaf.route || buildModulePath(mod.key, leaf.key),
          category: mod.label,
        });
      });
    });

    return list;
  }, []);

  // Filtered Search Results
  const filteredSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allSearchItems.filter((item) => {
      // Category filter
      if (searchCategory === 'modules' && item.type !== 'module') return false;
      if (searchCategory === 'settings' && item.category !== 'Settings' && item.category !== 'Administration') return false;
      if (searchCategory === 'navigation' && item.type !== 'navigation' && item.type !== 'page') return false;

      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [allSearchItems, searchQuery, searchCategory]);

  const handleSelectSearchResult = (path) => {
    setSearchModalOpen(false);
    navigate(path);
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    message.success(t('all_notifications_read', 'All notifications marked as read'));
  };

  const handleNotificationClick = (item) => {
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    if (item.type === 'warning') {
      navigate('/admins/products');
    } else if (item.title.includes('License')) {
      navigate('/admins/modules');
    }
  };

  // Notifications Popover Render
  const notificationsMenuContent = (
    <div
      style={{
        width: 330,
        maxWidth: 'calc(100vw - 24px)',
        background: adminTheme.card,
        borderRadius: 14,
        border: `1px solid ${headerBorderColor}`,
        boxShadow: themeMode === 'dark' ? '0 16px 40px rgba(0, 0, 0, 0.45)' : '0 16px 40px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${headerBorderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ color: adminTheme.text, fontSize: 13.5 }}>
            {t('notifications', 'System Notifications')}
          </Text>
          {unreadCount > 0 && (
            <Tag color="processing" style={{ borderRadius: 999, fontSize: 10.5, margin: 0, fontWeight: 700 }}>
              {unreadCount} NEW
            </Tag>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={handleMarkAllNotificationsRead}
            style={{ padding: 0, fontSize: 11.5, fontWeight: 600, color: adminTheme.primary }}
          >
            Mark read
          </Button>
        )}
      </div>

      <div style={{ maxHeight: 310, overflowY: 'auto', padding: '6px 0' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: adminTheme.subtext, fontSize: 12 }}>
            No recent alerts
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.read;
            const icon =
              item.type === 'success' ? (
                <CheckCircleOutlined style={{ color: '#10b981', fontSize: 15 }} />
              ) : item.type === 'warning' ? (
                <WarningOutlined style={{ color: '#f59e0b', fontSize: 15 }} />
              ) : (
                <InfoCircleOutlined style={{ color: '#0a84ff', fontSize: 15 }} />
              );

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  background: isUnread
                    ? themeMode === 'dark'
                      ? 'rgba(47, 111, 237, 0.08)'
                      : 'rgba(47, 111, 237, 0.04)'
                    : 'transparent',
                  borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    themeMode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isUnread
                    ? themeMode === 'dark'
                      ? 'rgba(47, 111, 237, 0.08)'
                      : 'rgba(47, 111, 237, 0.04)'
                    : 'transparent';
                }}
              >
                <div style={{ marginTop: 2 }}>{icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <Text
                      strong={isUnread}
                      style={{
                        fontSize: 12.5,
                        color: isUnread ? adminTheme.text : adminTheme.subtext,
                        lineHeight: 1.25,
                      }}
                      className="truncate"
                    >
                      {item.title}
                    </Text>
                    <span style={{ fontSize: 10, color: adminTheme.subtext, flexShrink: 0 }}>{item.time}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: adminTheme.subtext,
                      marginTop: 3,
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          padding: '8px 14px',
          borderTop: `1px solid ${headerBorderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
        }}
      >
        <Button
          type="text"
          size="small"
          onClick={() => {
            setNotifications([]);
            message.info('All notifications cleared');
          }}
          icon={<ClearOutlined />}
          style={{ fontSize: 11, color: adminTheme.subtext }}
        >
          Clear All
        </Button>
        <Button
          type="link"
          size="small"
          onClick={() => navigate('/admins/dashboard')}
          style={{ fontSize: 11, fontWeight: 600, color: adminTheme.primary }}
        >
          View Telemetry
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <OfflineWarningBanner />

      {/* 1. STICKY GLASSMORPHISM HEADER */}
      <Header
        ref={headerRef}
        className="header app-sticky-header admin-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: headerBgColor,
          color: headerTextColor,
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)',
          paddingBottom: '4px',
          paddingLeft: isTabletOrDesktop ? 20 : 12,
          paddingRight: isTabletOrDesktop ? 20 : 12,
          height: 58,
          minHeight: 58,
          lineHeight: 'normal',
          borderBottom: `1px solid ${headerBorderColor}`,
          boxShadow:
            themeMode === 'dark'
              ? '0 4px 20px -2px rgba(0, 0, 0, 0.45)'
              : '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '100vw',
          overflow: 'hidden',
          transition: 'background 0.22s ease, color 0.22s ease, border-color 0.22s ease',
        }}
      >
        <Flex justify="space-between" align="center" style={{ width: '100%' }} gap={10}>
          {/* ================================================================= */}
          {/* 2. LEFT SECTION: MENU TOGGLE & BREADCRUMBS / TITLE               */}
          {/* ================================================================= */}
          <Flex align="center" gap={10} style={{ minWidth: 0, flexShrink: 1 }}>
            {/* Menu Toggle: Drawer on Mobile/Tablet, Collapsible Sider on Desktop */}
            {showModuleMenu && (
              <Tooltip
                title={
                  !isDesktop
                    ? null
                    : collapsed
                    ? t('expand_sidebar', 'Expand Sidebar (Ctrl+B)')
                    : t('collapse_sidebar', 'Collapse Sidebar (Ctrl+B)')
                }
              >
                <button
                  type="button"
                  aria-label={collapsed ? t('expand_sidebar', 'Expand Sidebar') : t('collapse_sidebar', 'Collapse Sidebar')}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDesktop) {
                      if (toggleMobileDrawer) {
                        toggleMobileDrawer();
                      } else if (openMobileDrawer) {
                        openMobileDrawer();
                      } else if (setCollapsed) {
                        setCollapsed();
                      }
                    } else if (setCollapsed) {
                      setCollapsed();
                    }
                  }}
                  className="admin-header-btn"
                  style={iconButtonStyle}
                >
                  {!isDesktop ? (
                    <MenuOutlined style={{ fontSize: 16 }} />
                  ) : collapsed ? (
                    <MenuUnfoldOutlined style={{ fontSize: 16 }} />
                  ) : (
                    <MenuFoldOutlined style={{ fontSize: 16 }} />
                  )}
                </button>
              </Tooltip>
            )}

            {/* Context Breadcrumbs & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              {/* Live Active Pulse Dot */}
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: adminTheme.primary,
                  boxShadow: `0 0 8px ${adminTheme.primary}`,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />

              {/* Breadcrumbs for Tablet/Desktop */}
              {isDesktop && breadcrumbsList.length > 1 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: headerSubtextColor }}>
                  <span
                    onClick={() => navigate('/admins/dashboard')}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: headerSubtextColor,
                      fontWeight: 500,
                    }}
                  >
                    <HomeOutlined style={{ fontSize: 12 }} />
                    <span>Aura</span>
                  </span>
                  <span style={{ opacity: 0.4 }}>/</span>
                  {breadcrumbsList.slice(1, -1).map((crumb, idx) => (
                    <React.Fragment key={idx}>
                      <span
                        onClick={() => crumb.path && navigate(crumb.path)}
                        style={{
                          cursor: crumb.path ? 'pointer' : 'default',
                          color: headerSubtextColor,
                          fontWeight: 500,
                        }}
                      >
                        {crumb.label}
                      </span>
                      <span style={{ opacity: 0.4 }}>/</span>
                    </React.Fragment>
                  ))}
                  <Text
                    strong
                    style={{
                      color: headerTextColor,
                      fontSize: 13.5,
                      fontWeight: 700,
                      maxWidth: 240,
                    }}
                    className="truncate"
                  >
                    {currentPageTitle}
                  </Text>
                </div>
              ) : (
                /* Mobile & Small Screen Clean Legible Title */
                <Text
                  strong
                  style={{
                    margin: 0,
                    color: headerTextColor,
                    fontSize: isSmallMobile ? 14 : 15,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    maxWidth: isSmallMobile ? 135 : 190,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={currentPageTitle}
                >
                  {currentPageTitle}
                </Text>
              )}

              {/* Status Badge Tag on Desktop */}
              {isDesktop && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: adminTheme.primary,
                    background: `${adminTheme.primary}18`,
                    border: `1px solid ${adminTheme.primary}33`,
                    padding: '1.5px 7px',
                    borderRadius: 999,
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                  }}
                >
                  LIVE
                </span>
              )}
            </div>
          </Flex>

          {/* ================================================================= */}
          {/* 3. CENTER: ADAPTIVE SEARCH BAR (Desktop Only)                    */}
          {/* ================================================================= */}
          {isTabletOrDesktop ? (
            <div
              onClick={() => setSearchModalOpen(true)}
              style={{
                flex: 1,
                maxWidth: 320,
                height: 36,
                borderRadius: 10,
                background: adminTheme.headerInputBg || headerButtonBg,
                border: `1px solid ${headerBorderColor}`,
                color: headerSubtextColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 10px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = adminTheme.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = headerBorderColor;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <SearchOutlined style={{ color: headerSubtextColor, fontSize: 13.5 }} />
                <span style={{ fontSize: 12, color: headerSubtextColor }} className="truncate">
                  {t('search_aura_erp_placeholder', 'Search ERP modules, pages...')}
                </span>
              </div>
              <kbd
                style={{
                  color: headerSubtextColor,
                  fontSize: 10,
                  border: `1px solid ${headerBorderColor}`,
                  borderRadius: 5,
                  padding: '1px 5px',
                  background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  flexShrink: 0,
                }}
              >
                {shortcutKeyLabel}
              </kbd>
            </div>
          ) : null}

          {/* ================================================================= */}
          {/* 4. RIGHT SECTION: CLEAN ACTION ICONS & USER PROFILE DROPDOWN     */}
          {/* ================================================================= */}
          <Flex align="center" gap={isTabletOrDesktop ? 6 : 5} style={{ flexShrink: 0 }}>
            {/* Search Icon Trigger on Mobile Viewports */}
            {!isTabletOrDesktop && (
              <Tooltip title={t('search_erp', 'Search ERP (Ctrl+K)')}>
                <button
                  type="button"
                  aria-label="Search ERP"
                  onClick={() => setSearchModalOpen(true)}
                  className="admin-header-btn"
                  style={iconButtonStyle}
                >
                  <SearchOutlined style={{ fontSize: 15 }} />
                </button>
              </Tooltip>
            )}

            {/* Open POS Terminal Button */}
            <Tooltip title="Open Fullscreen POS Cashier Terminal (/admins/pos)">
              <Button
                type="primary"
                onClick={() => navigate('/admins/pos')}
                style={{
                  height: 35,
                  borderRadius: 9,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  borderColor: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: isTabletOrDesktop ? '0 12px' : '0 8px',
                  fontWeight: 700,
                  fontSize: 12,
                  boxShadow: '0 2px 10px rgba(37, 99, 235, 0.25)',
                  transition: 'all 0.18s ease',
                }}
              >
                <CreditCardOutlined style={{ fontSize: 13 }} />
                <span>POS</span>
                {isTabletOrDesktop && <span>Terminal</span>}
              </Button>
            </Tooltip>

            {/* Desktop-Only Action Icons to keep Mobile Header Clean */}
            {isTabletOrDesktop && (
              <>
                {/* Live Storefront Quick Link */}
                <Tooltip title={t('open_live_storefront', 'Open Live Storefront Website')}>
                  <Button
                    type="text"
                    onClick={() => window.open('/', '_blank')}
                    style={{
                      height: 36,
                      borderRadius: 10,
                      background: themeMode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: themeMode === 'dark' ? '#34d399' : '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0 11px',
                      fontWeight: 600,
                      fontSize: 12,
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <span
                      style={{
                        width: 6.5,
                        height: 6.5,
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 6px #10b981',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span>{t('storefront', 'Storefront')}</span>
                    <ExportOutlined style={{ fontSize: 10.5, opacity: 0.8 }} />
                  </Button>
                </Tooltip>

                {/* Fullscreen Button */}
                {isDesktop && (
                  <Tooltip title={t('fullscreen', 'Toggle Fullscreen')}>
                    <button
                      type="button"
                      aria-label="Toggle Fullscreen"
                      onClick={handleFullscreen}
                      className="admin-header-btn"
                      style={iconButtonStyle}
                    >
                      <ExpandOutlined style={{ fontSize: 14 }} />
                    </button>
                  </Tooltip>
                )}

                {/* Light / Dark Mode Toggle Button */}
                <Tooltip
                  title={
                    themeMode === 'dark'
                      ? t('switch_to_light_mode', 'Switch to light mode')
                      : t('switch_to_dark_mode', 'Switch to dark mode')
                  }
                >
                  <button
                    type="button"
                    aria-label="Toggle Theme Mode"
                    onClick={toggleThemeMode}
                    className="admin-header-btn"
                    style={iconButtonStyle}
                  >
                    {themeMode === 'dark' ? (
                      <SunOutlined style={{ fontSize: 14.5, color: '#f59e0b' }} />
                    ) : (
                      <MoonOutlined style={{ fontSize: 14 }} />
                    )}
                  </button>
                </Tooltip>

                {/* Theme Settings Color Palette Modal Picker */}
                <ThemeSettings buttonStyle={iconButtonStyle} />

                {/* Transparent Glass Mode Toggle (💎) */}
                <Tooltip
                  title={
                    isGlassActive
                      ? 'Transparent Glass Mode: ON (Click to disable)'
                      : 'Transparent Glass Mode: OFF (Click to enable)'
                  }
                >
                  <button
                    type="button"
                    aria-label="Toggle Glass Theme"
                    onClick={() => toggleTransparentSystem()}
                    className="admin-header-btn"
                    style={{
                      ...iconButtonStyle,
                      border: isGlassActive ? `1.5px solid ${adminTheme.primary}` : iconButtonStyle.border,
                      background: isGlassActive
                        ? themeMode === 'dark'
                          ? 'rgba(47, 111, 237, 0.22)'
                          : 'rgba(47, 111, 237, 0.12)'
                        : iconButtonStyle.background,
                      color: isGlassActive ? adminTheme.primary : iconButtonStyle.color,
                      boxShadow: isGlassActive ? `0 0 10px ${adminTheme.primary}40` : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, lineHeight: 1 }}>💎</span>
                  </button>
                </Tooltip>

                {/* Language Switcher Dropdown */}
                <Dropdown menu={{ items: languageMenuItems }} trigger={['click']} placement="bottomRight">
                  <Button
                    style={{
                      height: 36,
                      borderRadius: 10,
                      background: headerButtonBg,
                      border: `1px solid ${headerBorderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '0 9px',
                      color: headerTextColor,
                      fontSize: 12,
                      fontWeight: 600,
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <span style={{ fontSize: 15, display: 'inline-flex', alignItems: 'center' }}>
                      {activeLanguage?.flag || '🌐'}
                    </span>
                    <span style={{ maxWidth: 80 }} className="truncate">
                      {activeLanguage?.native || activeLanguage?.name || 'Lang'}
                    </span>
                    <DownOutlined style={{ fontSize: 8.5, opacity: 0.6 }} />
                  </Button>
                </Dropdown>

                {/* ERP Modules Switchboard Quick Link */}
                <Tooltip title={t('modules', 'ERP Modules Switchboard')}>
                  <button
                    type="button"
                    aria-label="ERP Modules Switchboard"
                    onClick={() => navigate('/admins/modules')}
                    className="admin-header-btn"
                    style={iconButtonStyle}
                  >
                    <ControlOutlined style={{ fontSize: 14 }} />
                  </button>
                </Tooltip>
              </>
            )}

            {/* Interactive Notifications Bell Dropdown */}
            <Dropdown
              popupRender={() => notificationsMenuContent}
              trigger={['click']}
              placement="bottomRight"
            >
              <div>
                <Badge count={unreadCount} overflowCount={9} size="small" offset={[-2, 3]}>
                  <Tooltip title={t('notifications', 'Notifications')}>
                    <button
                      type="button"
                      aria-label="Notifications"
                      className="admin-header-btn"
                      style={iconButtonStyle}
                    >
                      <BellOutlined style={{ fontSize: 14.5 }} />
                    </button>
                  </Tooltip>
                </Badge>
              </div>
            </Dropdown>

            {/* User Profile Menu Chip (Responsive: Full on Desktop, Compact on Mobile) */}
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
              trigger={['click']}
              overlayStyle={{ maxWidth: 'calc(100vw - 20px)' }}
            >
              <div
                style={{
                  height: 36,
                  padding: isTabletOrDesktop ? '0 10px 0 4px' : '0 4px',
                  borderRadius: 999,
                  border: `1px solid ${headerBorderColor}`,
                  background: headerButtonBg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                {/* User Avatar with Live Online Status Indicator */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    size={28}
                    src={user?.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '' ? user.avatar : null}
                    icon={<UserOutlined style={{ fontSize: 13 }} />}
                    style={{
                      border: '1.5px solid #f97316',
                      boxShadow: '0 2px 6px rgba(249, 115, 22, 0.25)',
                      background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 8.5,
                      height: 8.5,
                      borderRadius: '50%',
                      background: '#10b981',
                      border: `1.5px solid ${themeMode === 'dark' ? '#0b111e' : '#ffffff'}`,
                      boxShadow: '0 0 6px #10b981',
                    }}
                  />
                </div>

                {/* Desktop Text Labels: Name & Role Badge (Hidden on Mobile) */}
                {isTabletOrDesktop && (
                  <div style={{ lineHeight: 1.15 }}>
                    <Text
                      strong
                      style={{
                        display: 'block',
                        fontSize: 12,
                        color: headerTextColor,
                        fontWeight: 700,
                        maxWidth: 110,
                      }}
                      className="truncate"
                    >
                      {user?.name ||
                        (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'Admin User')}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <span
                        style={{
                          fontSize: 8.5,
                          fontWeight: 700,
                          color: '#f97316',
                          background: 'rgba(249, 115, 22, 0.12)',
                          padding: '0.5px 4px',
                          borderRadius: 3,
                          letterSpacing: '0.03em',
                        }}
                      >
                        {(
                          user?.group_name ||
                          user?.role ||
                          (user?.isOwner ? 'Owner' : user?.isAdmin ? 'Admin' : 'Staff')
                        ).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                <DownOutlined style={{ fontSize: 8.5, opacity: 0.6, marginLeft: isTabletOrDesktop ? 1 : 0, color: headerTextColor }} />
              </div>
            </Dropdown>
          </Flex>
        </Flex>
      </Header>

      {/* ===================================================================== */}
      {/* 5. SEARCH OMNIBAR MODAL (Triggered by Search Bar / Mobile Icon / Ctrl+K) */}
      {/* ===================================================================== */}
      <Modal
        open={searchModalOpen}
        onCancel={() => setSearchModalOpen(false)}
        footer={null}
        closable={false}
        width={620}
        destroyOnHidden
        className="admin-search-dialog"
        style={{ top: 40, maxWidth: 'calc(100vw - 20px)' }}
        styles={{
          mask: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0, 0, 0, 0.45)' },
          content: {
            background: adminTheme.card,
            borderRadius: 16,
            padding: 0,
            overflow: 'hidden',
            border: `1px solid ${headerBorderColor}`,
          },
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Search Input Bar */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${headerBorderColor}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <SearchOutlined style={{ fontSize: 18, color: adminTheme.primary }} />
            <Input
              ref={searchInputRef}
              placeholder={t('search_command_placeholder', 'Search ERP modules, settings, catalog, or actions...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="borderless"
              allowClear
              style={{
                fontSize: 15,
                color: adminTheme.text,
                padding: 0,
                fontWeight: 500,
              }}
            />
            <Tag
              onClick={() => setSearchModalOpen(false)}
              style={{
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 11,
                padding: '2px 7px',
                color: adminTheme.subtext,
                background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                border: 'none',
              }}
            >
              ESC
            </Tag>
          </div>

          {/* Quick Category Chips */}
          <div
            style={{
              padding: '10px 20px',
              borderBottom: `1px solid ${headerBorderColor}`,
              display: 'flex',
              gap: 8,
              background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
              overflowX: 'auto',
            }}
          >
            {[
              { key: 'all', label: `All (${filteredSearchResults.length})` },
              { key: 'modules', label: 'ERP Modules' },
              { key: 'navigation', label: 'Navigation & Pages' },
              { key: 'settings', label: 'Settings & Admin' },
            ].map((cat) => {
              const isActive = searchCategory === cat.key;
              return (
                <button
                  type="button"
                  key={cat.key}
                  onClick={() => setSearchCategory(cat.key)}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '4px 12px',
                    fontSize: 11.5,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    background: isActive ? adminTheme.primary : themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    color: isActive ? '#ffffff' : adminTheme.subtext,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Result List */}
          <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px 12px' }}>
            {filteredSearchResults.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: adminTheme.subtext }}>
                <SearchOutlined style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>No results found for "{searchQuery}"</div>
                <div style={{ fontSize: 11.5, marginTop: 4, opacity: 0.8 }}>
                  Try searching for "inventory", "sales", "units", "branches", or "settings".
                </div>
              </div>
            ) : (
              filteredSearchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchResult(item.path)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 4,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      themeMode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background:
                          item.type === 'module'
                            ? '#2563eb18'
                            : item.type === 'page'
                            ? '#10b98118'
                            : '#7c3aed18',
                        color:
                          item.type === 'module'
                            ? '#2563eb'
                            : item.type === 'page'
                            ? '#10b981'
                            : '#7c3aed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      {item.type === 'module' ? (
                        <AppstoreOutlined />
                      ) : item.type === 'page' ? (
                        <HomeOutlined />
                      ) : (
                        <RightOutlined />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: adminTheme.text,
                        }}
                        className="truncate"
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: adminTheme.subtext,
                          marginTop: 2,
                        }}
                        className="truncate"
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <Tag
                      style={{
                        borderRadius: 6,
                        fontSize: 10.5,
                        margin: 0,
                        fontWeight: 600,
                        color: adminTheme.subtext,
                      }}
                    >
                      {item.category}
                    </Tag>
                    <ArrowRightOutlined style={{ fontSize: 11, opacity: 0.5, color: adminTheme.subtext }} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer Hotkey Hints */}
          <div
            style={{
              padding: '10px 20px',
              borderTop: `1px solid ${headerBorderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
              fontSize: 11,
              color: adminTheme.subtext,
            }}
          >
            <span>
              Navigation shortcut: <kbd style={{ fontFamily: 'monospace', fontWeight: 700 }}>Enter</kbd> to select
            </span>
            <span>
              Close: <kbd style={{ fontFamily: 'monospace', fontWeight: 700 }}>ESC</kbd>
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Head;
