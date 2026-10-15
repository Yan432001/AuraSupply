import React from 'react';
import { Avatar, Badge, Button, Dropdown, Flex, Input, Layout, Tooltip, Typography } from 'antd';
import {
  BellOutlined,
  ExpandOutlined,
  LogoutOutlined,
  MenuOutlined,
  MoonOutlined,
  SearchOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined,
  ControlOutlined,
  ShopOutlined,
  DownOutlined,
  CheckOutlined,
  GlobalOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeSettings from '../../contexts/ThemeSettings';
import { getModuleByKey } from '../../data/erpModules';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useBranchesAndBillers } from '../../hooks/useBranchesAndBillers';
import { useHeaderHeight } from '../../hooks/useHeaderHeight';
import OfflineWarningBanner from '../../components/common/OfflineWarningBanner';

const { Header } = Layout;
const { Text, Title } = Typography;

const pageTitles = {
  '/admins/dashboard': 'Command Center',
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
  const { themeMode, toggleThemeMode } = useTheme();
  const { branches, billers, activeBranch, setActiveBranchId } = useBranchesAndBillers();
  const { headerRef } = useHeaderHeight();

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

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: logout },
  ];

  const branchMenuItems = [
    {
      key: 'header',
      type: 'group',
      label: 'Switch Store Branch & Biller Context',
    },
    ...branches.map((b) => {
      const linkedBiller = billers.find((bil) => bil.id === b.biller_id);
      const isSelected = activeBranch?.id === b.id;
      return {
        key: `branch-${b.id}`,
        icon: isSelected ? <CheckOutlined style={{ color: '#16a34a' }} /> : <ShopOutlined style={{ color: '#2563eb' }} />,
        label: (
          <div style={{ padding: '2px 0' }}>
            <div style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? '#2563eb' : undefined }}>
              {b.name}
            </div>
            <div style={{ fontSize: 11, color: adminTheme.subtext }}>
              Biller: {linkedBiller?.trading_name || linkedBiller?.company_name || 'Central'} &bull; {b.city}
            </div>
          </div>
        ),
        onClick: () => setActiveBranchId(b.id),
      };
    }),
    { type: 'divider' },
    {
      key: 'manage-branches',
      icon: <SettingOutlined />,
      label: <span style={{ fontWeight: 600 }}>Manage All Branches &amp; Billers</span>,
      onClick: () => navigate('/admins/settings/branches'),
    },
  ];

  const currentTitle = pageTitles[location.pathname] || 'ERP Workspace';
  const dashboardModuleKey = new URLSearchParams(location.search).get('module');
  const headerTitle =
    location.pathname === '/admins/dashboard' && dashboardModuleKey
      ? `${getModuleByKey(dashboardModuleKey).label} Controller`
      : currentTitle;

  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const greeting =
    location.pathname === '/admins/dashboard'
      ? `Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}`
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
          transition: 'background 0.22s ease, color 0.22s ease, border-color 0.22s ease',
        }}
      >
        <Flex justify="space-between" align="center" style={{ width: '100%' }} gap={12}>
          {/* Left Context & Menu Toggle */}
          <Flex align="center" gap={10} style={{ minWidth: 0 }}>
            {/* Mobile Drawer Trigger only (Collapse sidebar button deleted for desktop) */}
            {isMobile && showModuleMenu && (
              <Tooltip title="Open menu">
                <Button
                  type="text"
                  icon={<MenuOutlined style={{ fontSize: 15 }} />}
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
                    color: '#60a5fa',
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
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
              placeholder="Search Aura ERP modules & records..."
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
            <Tooltip title="Open Live Storefront (Base URL)">
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
                {!isMobile && <span>Storefront</span>}
                <ExportOutlined style={{ fontSize: 10, opacity: 0.8 }} />
              </Button>
            </Tooltip>

            {/* Active Branch / Multiple Biller Context Dropdown */}
            <Dropdown menu={{ items: branchMenuItems }} trigger={['click']} placement="bottomRight">
              <Button
                style={{
                  height: 34,
                  borderRadius: 9,
                  background: headerButtonBg,
                  border: `1px solid ${headerBorderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 10px',
                  color: headerTextColor,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    background: adminTheme.sidebarActiveBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShopOutlined style={{ color: adminTheme.primary, fontSize: 11 }} />
                </div>
                <span style={{ fontWeight: 600, fontSize: 12, maxWidth: isMobile ? 110 : 150, color: headerTextColor }} className="truncate">
                  {activeBranch?.name || 'Select Branch'}
                </span>
                <DownOutlined style={{ fontSize: 8.5, opacity: 0.6, color: headerTextColor }} />
              </Button>
            </Dropdown>

            {/* Utility Icons */}
            {!isMobile && (
              <Tooltip title="Fullscreen">
                <Button type="text" icon={<ExpandOutlined style={{ fontSize: 14 }} />} onClick={handleFullscreen} style={iconButtonStyle} />
              </Tooltip>
            )}

            <Tooltip title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <Button
                type="text"
                icon={themeMode === 'dark' ? <SunOutlined style={{ fontSize: 14 }} /> : <MoonOutlined style={{ fontSize: 14 }} />}
                onClick={toggleThemeMode}
                style={iconButtonStyle}
              />
            </Tooltip>

            <ThemeSettings buttonStyle={iconButtonStyle} />

            <Tooltip title="ERP Modules Switchboard (Open/Close Modules)">
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
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
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
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80'}
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
                      {user?.name || 'Admin User'}
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
                        SUPER ADMIN
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
