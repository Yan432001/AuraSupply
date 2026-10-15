import React from 'react';
import { Layout, Tooltip, Typography, Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckCircleFilled,
  SettingOutlined,
} from '@ant-design/icons';
import { buildModulePath, getDefaultMenuKey } from '../../data/erpModules';
import ErpModuleSidebar from '../../components/web/shared/ErpModuleSidebar';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import AuraLogo from '../../components/common/AuraLogo';

const { Sider } = Layout;
const { Text } = Typography;

const HeaderDefault = ({ collapsed, setCollapsed, onMenuClick, isMobile }) => {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  
  // Active module and menu detection
  let activeModuleKey = null;
  let activeMenuKey = null;

  if (location.pathname === '/admins' || location.pathname === '/admins/') {
    // Default to first module or null for dashboard
    activeModuleKey = searchParams.get('module') || null;
  } else if (location.pathname === '/admins/dashboard') {
    activeModuleKey = searchParams.get('module') || null;
  } else if (location.pathname.startsWith('/admins/products')) {
    activeModuleKey = 'inventory';
  } else if (location.pathname.startsWith('/admins/users')) {
    activeModuleKey = 'hr';
  } else if (location.pathname.startsWith('/admins/reports')) {
    activeModuleKey = 'reports';
  } else if (location.pathname.startsWith('/admins/settings')) {
    activeModuleKey = 'settings';
  } else if (location.pathname.startsWith('/admins/modules')) {
    activeModuleKey = 'settings';
    activeMenuKey = 'module-settings';
  } else if (location.pathname.startsWith('/admins/branches') || location.pathname.startsWith('/admins/settings/branches')) {
    activeModuleKey = 'settings';
    activeMenuKey = 'branches';
  } else if (location.pathname.startsWith('/admins/billers') || location.pathname.startsWith('/admins/settings/billers')) {
    activeModuleKey = 'settings';
    activeMenuKey = 'billers';
  } else if (location.pathname.startsWith('/admins/qrcode') || location.pathname.startsWith('/admins/qr-generator')) {
    activeModuleKey = 'cms';
  }

  // Detect active menu if not already set
  if (!activeMenuKey) {
    if (location.pathname.startsWith('/admins/qrcode') || location.pathname.startsWith('/admins/qr-generator')) {
      activeMenuKey = 'cms-qrcode';
    } else if (location.pathname === '/admins' || location.pathname === '/admins/') {
      activeMenuKey = searchParams.get('menu') || (activeModuleKey ? getDefaultMenuKey(activeModuleKey) : null);
    } else if (location.pathname === '/admins/dashboard') {
      activeMenuKey = searchParams.get('menu') || (activeModuleKey ? getDefaultMenuKey(activeModuleKey) : null);
    } else if (location.pathname.startsWith('/admins/settings')) {
      // Extract the menu key from the URL path
      const pathParts = location.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      // Map URL segments to menu keys
      if (lastPart === 'categories') {
        activeMenuKey = 'categories';
      } else if (lastPart === 'users') {
        activeMenuKey = 'users';
      } else if (lastPart === 'system') {
        activeMenuKey = 'system-settings';
      } else if (lastPart === 'modules') {
        activeMenuKey = 'module-settings';
      } else {
        activeMenuKey = 'system-settings'; // Default for settings
      }
    }
  }

  const handleNavigate = (moduleKey, menuKey) => {
    navigate(buildModulePath(moduleKey, menuKey));
    if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      breakpoint="lg"
      collapsedWidth={72}
      width={264}
      trigger={null}
      style={{
        background: adminTheme.sidebar,
        height: '100vh',
        maxHeight: '100vh',
        position: isMobile ? 'relative' : 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        borderRight: `1px solid ${adminTheme.sidebarBorder}`,
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.08)',
        zIndex: 1001,
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Inner Flex Wrapper for guaranteed scroll slidebar bounding */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          maxHeight: '100vh',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '12px 10px' : '12px 14px',
            borderBottom: `1px solid ${adminTheme.sidebarBorder}`,
            minHeight: 58,
            height: 58,
            boxSizing: 'border-box',
          }}
        >
        <div
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            userSelect: 'none',
          }}
          onClick={() => navigate('/admins')}
        >
          {collapsed ? (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.16), rgba(59, 130, 246, 0.08))',
                border: '1px solid rgba(249, 115, 22, 0.28)',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.18)',
                transition: 'all 0.2s ease',
              }}
              title="Aura ERP Command Center"
            >
              <AuraLogo size={24} showText={false} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.16), rgba(59, 130, 246, 0.08))',
                  border: '1px solid rgba(249, 115, 22, 0.24)',
                  boxShadow: '0 3px 12px rgba(249, 115, 22, 0.14)',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                <AuraLogo size={23} showText={false} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: adminTheme.text,
                    }}
                  >
                    AURA
                  </span>
                  <span style={{ color: '#f97316', fontWeight: 900, fontSize: 16 }}>.</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#f97316',
                      background: 'rgba(249, 115, 22, 0.12)',
                      border: '1px solid rgba(249, 115, 22, 0.25)',
                      padding: '1px 5px',
                      borderRadius: 4,
                      letterSpacing: '0.04em',
                    }}
                  >
                    ERP
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    color: adminTheme.subtext,
                    textTransform: 'uppercase',
                  }}
                >
                  COMMAND HUB
                </span>
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <Tooltip title="Collapse sidebar (Ctrl+B)">
            <Button
              type="text"
              size="small"
              icon={<MenuFoldOutlined style={{ fontSize: 14 }} />}
              onClick={() => setCollapsed?.(true)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                color: adminTheme.subtext,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Tooltip>
        )}
      </div>

      {/* Scrollable Modules Navigation */}
      <div
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          height: 'calc(100vh - 118px)',
          maxHeight: 'calc(100vh - 118px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '10px 8px' : '12px 6px 12px 10px',
          scrollBehavior: 'smooth',
        }}
        className="erp-sidebar-scroll"
      >
        <ErpModuleSidebar
          collapsed={collapsed}
          activeModuleKey={activeModuleKey}
          activeMenuKey={activeMenuKey}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Bottom Dock / System Telemetry */}
      <div
        style={{
          flexShrink: 0,
          minHeight: 54,
          padding: collapsed ? '10px 8px 12px' : '10px 12px 12px',
          borderTop: `1px solid ${adminTheme.sidebarBorder}`,
          background: adminTheme.isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Tooltip title="Expand Sidebar" placement="right">
              <Button
                type="text"
                size="small"
                icon={<MenuUnfoldOutlined style={{ fontSize: 15 }} />}
                onClick={() => setCollapsed?.(false)}
                style={{
                  width: 40,
                  height: 36,
                  borderRadius: 10,
                  color: adminTheme.subtext,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Tooltip>
            <Tooltip title="ERP System Status: All 15 Modules Operational" placement="right">
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  margin: '4px auto 0',
                }}
              />
            </Tooltip>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 8,
              background: adminTheme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                  display: 'inline-block',
                }}
              />
              <Text style={{ fontSize: 11, fontWeight: 600, color: adminTheme.subtext }}>
                ERP Core: 15 Modules
              </Text>
            </div>
            <Tooltip title="Settings & Modules">
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined style={{ fontSize: 13 }} />}
                onClick={() => navigate('/admins/modules')}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  color: adminTheme.subtext,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              />
            </Tooltip>
          </div>
        )}
      </div>
      </div>
    </Sider>
  );
};

export default HeaderDefault;