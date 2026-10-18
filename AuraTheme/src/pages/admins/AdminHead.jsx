import React from 'react';
import { Avatar, Badge, Button, Dropdown, Flex, Input, Layout, Modal, Tooltip, Typography, message } from 'antd';
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
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage, useTranslation, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext';
import ThemeSettings from '../../contexts/ThemeSettings';
import { getModuleByKey } from '../../data/erpModules';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useHeaderHeight } from '../../hooks/useHeaderHeight';
import OfflineWarningBanner from '../../components/common/OfflineWarningBanner';

const { Header } = Layout;
const { Text, Title } = Typography;

const pageTitles = {
  '/admins/dashboard': 'Command Center',
  '/admins/profile': 'My User Profile',
  '/admins/products': 'Inventory Control',
  '/admins/users': 'Access Control',
  '/admins/orders': 'Orders Management',
  '/admins/qrcode': 'Store QR Code Generator',
  '/admins/qr-generator': 'Store QR Code Generator',
  '/admins/modules': 'ERP Modules Switchboard',
  '/admins/branches': 'Branches & Multiple Billers',
  '/admins/settings/branches': 'Branches & Multiple Billers',
  '/admins/billers': 'Multiple Billers Management',
  '/admins/settings/billers': 'Multiple Billers Management',
};

const Head = ({ collapsed, setCollapsed, isMobile, showModuleMenu }) => {
  const adminTheme = useAdminTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { themeMode, toggleThemeMode, customSettings, toggleTransparentSystem } = useTheme();
  const isGlassActive = Boolean(customSettings?.transparentSystem?.enabled);
  const { headerRef } = useHeaderHeight();
  const { currentLanguage, activeLanguage, setLanguage, languages } = useLanguage();
  const { t } = useTranslation();

  const headerBgColor = adminTheme.headerBg || (themeMode === 'dark' ? 'rgba(11, 17, 30, 0.88)' : 'rgba(255, 255, 255, 0.92)');
  const headerTextColor = adminTheme.headerColor || adminTheme.text;
  const headerSubtextColor = adminTheme.headerSubtext || adminTheme.subtext;
  const headerBorderColor = adminTheme.headerBorder || adminTheme.border || 'rgba(255, 255, 255, 0.08)';
  const headerButtonBg = adminTheme.headerButtonBg || (themeMode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.03)');

  const iconButtonStyle = {
    width: 34,
    height: 34,
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: headerTextColor,
    border: `1px solid ${headerBorderColor}`,
    background: headerButtonBg,
    transition: 'all 0.18s ease',
  };

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      Modal.confirm({
        title: t('logout', 'Sign Out Confirmation'),
        content: t('confirm_logout', 'Are you sure you want to log out of the Aura ERP administration portal?'),
        okText: t('yes_logout', 'Yes, Sign Out'),
        okType: 'danger',
        cancelText: t('cancel', 'Cancel'),
        onOk: () => {
          logout();
        }
      });
    } else if (key === 'profile') {
      navigate('/admins/profile');
    } else if (key === 'theme-transparent') {
      navigate('/admins/profile?tab=appearance');
    } else if (key === 'settings') {
      navigate('/admins/settings/system');
    }
  };

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

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: t('profile', 'My Profile') },
    {
      key: 'theme-transparent',
      icon: <BgColorsOutlined />,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>{t('transparent_theme_settings', 'Transparent Theme Settings')}</span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 4,
              background: isGlassActive
                ? (adminTheme.isDark ? 'rgba(47, 111, 237, 0.25)' : 'rgba(47, 111, 237, 0.12)')
                : (adminTheme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
              color: isGlassActive ? adminTheme.primary : adminTheme.subtext,
              fontWeight: 700,
            }}
          >
            {isGlassActive ? 'GLASS ON' : 'OFF'}
          </span>
        </div>
      ),
    },
    { key: 'settings', icon: <SettingOutlined />, label: t('settings', 'Settings') },
    {
      key: 'change_language_sub',
      icon: <GlobalOutlined />,
      label: t('change_language', 'Change Language'),
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
    { key: 'logout', icon: <LogoutOutlined />, label: t('logout', 'Sign Out'), danger: true },
  ];

  const pageKey = location.pathname.replace('/admins/', '').replace(/\//g, '_');
  const currentTitle = t(pageKey, pageTitles[location.pathname] || 'ERP Workspace');
  const dashboardModuleKey = new URLSearchParams(location.search).get('module');
  const activeMod = dashboardModuleKey ? getModuleByKey(dashboardModuleKey) : null;
  const headerTitle =
    location.pathname === '/admins/dashboard' && activeMod
      ? `${t(dashboardModuleKey, activeMod.label)} ${t('controller', 'Controller')}`
      : currentTitle;

  const firstName = user?.name?.split(' ')[0] || t('admin', 'Admin');
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? t('good_morning', 'Good Morning') : hour < 18 ? t('good_afternoon', 'Good Afternoon') : t('good_evening', 'Good Evening');
  const greeting =
    location.pathname === '/admins/dashboard'
      ? `${timeGreeting}, ${firstName}`
      : headerTitle;

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  return (
    <>
      <OfflineWarningBanner />
      <Header
        ref={headerRef}
        className="header app-sticky-header admin-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: headerBgColor,
          color: headerTextColor,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
          paddingBottom: '6px',
          paddingLeft: isMobile ? 12 : 20,
          paddingRight: isMobile ? 12 : 20,
          height: 58,
          minHeight: 58,
          lineHeight: 'normal',
          borderBottom: `1px solid ${headerBorderColor}`,
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '100vw',
          overflow: 'hidden',
          transition: 'background 0.22s ease, color 0.22s ease, border-color 0.22s ease',
        }}
      >
        <Flex justify="space-between" align="center" style={{ width: '100%' }} gap={12}>
          {/* Left Context & Menu Toggle */}
          <Flex align="center" gap={10} style={{ minWidth: 0 }}>
            {/* Menu Toggle: Drawer on Mobile/Tablet, Collapsible Sidebar on Desktop */}
            {showModuleMenu && (
              <Tooltip title={isMobile ? t('open_menu', 'Open Navigation Menu') : (collapsed ? t('expand_sidebar', 'Expand Sidebar (Ctrl+B)') : t('collapse_sidebar', 'Collapse Sidebar (Ctrl+B)'))}>
                <Button
                  type="text"
                  icon={isMobile ? <MenuOutlined style={{ fontSize: 16 }} /> : (collapsed ? <MenuUnfoldOutlined style={{ fontSize: 16 }} /> : <MenuFoldOutlined style={{ fontSize: 16 }} />)}
                  onClick={setCollapsed}
                  style={iconButtonStyle}
                />
              </Tooltip>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: adminTheme.primary,
                  boxShadow: `0 0 8px ${adminTheme.primary}cc`,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <Title
                level={5}
                style={{
                  margin: 0,
                  color: headerTextColor,
                  whiteSpace: 'nowrap',
                  fontSize: 14.5,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                }}
              >
                {greeting}
              </Title>
              {!isMobile && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: adminTheme.primary,
                    background: `${adminTheme.primary}18`,
                    border: `1px solid ${adminTheme.primary}33`,
                    padding: '1.5px 7px',
                    borderRadius: 999,
                    letterSpacing: '0.04em',
                  }}
                >
                  LIVE
                </span>
              )}
            </div>
          </Flex>

          {/* Center Command Search Bar */}
          {!isMobile && (
            <Input
              prefix={<SearchOutlined style={{ color: headerSubtextColor, fontSize: 13.5, marginRight: 4 }} />}
              suffix={
                <kbd
                  style={{
                    color: headerSubtextColor,
                    fontSize: 10,
                    border: `1px solid ${headerBorderColor}`,
                    borderRadius: 5,
                    padding: '2px 6px',
                    background: headerButtonBg,
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}
                >
                  Ctrl /
                </kbd>
              }
              placeholder={t('search_aura_erp_placeholder', 'Search Aura ERP modules & records...')}
              style={{
                flex: 1,
                maxWidth: 340,
                height: 36,
                borderRadius: 9,
                background: adminTheme.headerInputBg || headerButtonBg,
                border: `1px solid ${headerBorderColor}`,
                color: headerTextColor,
                fontSize: 12.5,
              }}
            />
          )}

          {/* Right Action Rail */}
          <Flex align="center" gap={7}>
            {/* Live Storefront Button (Sophisticated Glass Look) */}
            <Tooltip title={t('open_live_storefront', 'Open Live Storefront (Base URL)')}>
              <Button
                type="text"
                onClick={() => window.open('/', '_blank')}
                style={{
                  height: 34,
                  borderRadius: 9,
                  background: themeMode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: themeMode === 'dark' ? '#34d399' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: isMobile ? '0 8px' : '0 11px',
                  fontWeight: 600,
                  fontSize: 12,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)',
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
                {!isMobile && <span>{t('storefront', 'Storefront')}</span>}
                <ExportOutlined style={{ fontSize: 10, opacity: 0.8 }} />
              </Button>
            </Tooltip>

            {/* Utility Icons */}
            {!isMobile && (
              <Tooltip title={t('fullscreen', 'Fullscreen')}>
                <Button type="text" icon={<ExpandOutlined style={{ fontSize: 14 }} />} onClick={handleFullscreen} style={iconButtonStyle} />
              </Tooltip>
            )}

            <Tooltip title={themeMode === 'dark' ? t('switch_to_light_mode', 'Switch to light mode') : t('switch_to_dark_mode', 'Switch to dark mode')}>
              <Button
                type="text"
                icon={themeMode === 'dark' ? <SunOutlined style={{ fontSize: 14 }} /> : <MoonOutlined style={{ fontSize: 14 }} />}
                onClick={toggleThemeMode}
                style={iconButtonStyle}
              />
            </Tooltip>

            <ThemeSettings buttonStyle={iconButtonStyle} />

            <Tooltip title={isGlassActive ? 'Transparent Glass Mode: ON (Click to disable)' : 'Transparent Glass Mode: OFF (Click to enable)'}>
              <Button
                type="text"
                onClick={() => toggleTransparentSystem()}
                style={{
                  ...iconButtonStyle,
                  border: isGlassActive ? `1.5px solid ${adminTheme.primary}` : iconButtonStyle.border,
                  background: isGlassActive
                    ? (themeMode === 'dark' ? 'rgba(47, 111, 237, 0.22)' : 'rgba(47, 111, 237, 0.12)')
                    : iconButtonStyle.background,
                  color: isGlassActive ? adminTheme.primary : iconButtonStyle.color,
                  boxShadow: isGlassActive ? `0 0 10px ${adminTheme.primary}40` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                icon={
                  <span style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    💎
                  </span>
                }
              />
            </Tooltip>

            {/* Language Switcher Dropdown (AURA_v1 Concept) */}
            <Dropdown menu={{ items: languageMenuItems }} trigger={['click']} placement="bottomRight">
              <Button
                style={{
                  height: 34,
                  borderRadius: 9,
                  background: headerButtonBg,
                  border: `1px solid ${headerBorderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: isMobile ? '0 8px' : '0 10px',
                  color: headerTextColor,
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.18s ease',
                }}
              >
                <span style={{ fontSize: 15, display: 'inline-flex', alignItems: 'center' }}>
                  {activeLanguage?.flag || '🌐'}
                </span>
                {!isMobile && (
                  <span style={{ maxWidth: 90 }} className="truncate">
                    {activeLanguage?.native || activeLanguage?.name || 'Language'}
                  </span>
                )}
                <DownOutlined style={{ fontSize: 8.5, opacity: 0.6 }} />
              </Button>
            </Dropdown>

            <Tooltip title={t('modules', 'ERP Modules Switchboard')}>
              <Button
                type="text"
                icon={<ControlOutlined style={{ fontSize: 14 }} />}
                onClick={() => navigate('/admins/modules')}
                style={iconButtonStyle}
              />
            </Tooltip>

            <Badge dot offset={[-4, 4]}>
              <Tooltip title="Notifications">
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 14 }} />}
                  style={iconButtonStyle}
                />
              </Tooltip>
            </Badge>

            {/* User Profile Chip (Upgraded Beautiful Image UI & Online Status) */}
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight" trigger={['click']}>
              <div
                style={{
                  height: 36,
                  padding: isMobile ? '0 4px' : '0 10px 0 4px',
                  borderRadius: 999,
                  border: `1px solid ${headerBorderColor}`,
                  background: headerButtonBg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    size={28}
                    src={user?.avatar || undefined}
                    icon={<UserOutlined style={{ fontSize: 13 }} />}
                    style={{
                      border: '1.5px solid #f97316',
                      boxShadow: '0 2px 6px rgba(249, 115, 22, 0.25)',
                      background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    }}
                  />
                  {/* Verified Online Active Indicator */}
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
                {!isMobile && (
                  <div style={{ lineHeight: 1.15 }}>
                    <Text strong style={{ display: 'block', fontSize: 12, color: headerTextColor, fontWeight: 700 }}>
                      {user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.username || 'Admin User'))}
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
                        {(user?.group_name || user?.role || (user?.isOwner ? 'Owner' : (user?.isAdmin ? 'Admin' : 'Staff'))).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                <DownOutlined style={{ fontSize: 8.5, opacity: 0.6, marginLeft: 2, color: headerTextColor }} />
              </div>
            </Dropdown>
          </Flex>
        </Flex>
      </Header>
    </>
  );
};

export default Head;
