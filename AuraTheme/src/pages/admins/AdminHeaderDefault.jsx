import React from 'react';
import { Layout, Tooltip, Typography, Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckCircleFilled,
  SettingOutlined,
  CloseOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import { buildModulePath, getDefaultMenuKey, resolveActiveModuleAndMenu } from '../../data/erpModules';
import ErpModuleSidebar from '../../components/web/shared/ErpModuleSidebar';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';
import AuraLogo from '../../components/common/AuraLogo';

const { Sider } = Layout;
const { Text } = Typography;

const HeaderDefault = ({ collapsed, setCollapsed, onMenuClick, isMobile }) => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  
  // Active module and menu detection
  const resolved = resolveActiveModuleAndMenu(location.pathname, location.search);
  const activeModuleKey = resolved.moduleKey || 'dashboard';
  const activeMenuKey = resolved.menuKey;

  const handleNavigate = (moduleKey, menuKey) => {
    navigate(buildModulePath(moduleKey, menuKey));
    if (onMenuClick) {
      onMenuClick();
    }
  };

  // Dedicated clean layout for Mobile Navigation Drawer (no Sider breakpoint conflicts)
  if (isMobile) {
    return (
      <div
        style={{
          background: adminTheme.sidebar,
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header with Close Button */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
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
            onClick={() => {
              if (onMenuClick) onMenuClick();
              navigate('/admins');
            }}
          >
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
                {t('command_hub', 'COMMAND HUB')}
              </span>
            </div>
          </div>

          <Tooltip title={t('close_menu', 'Close navigation')}>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined style={{ fontSize: 16 }} />}
              onClick={() => {
                if (onMenuClick) onMenuClick();
                else if (setCollapsed) setCollapsed(false);
              }}
              aria-label={t('close_menu', 'Close navigation')}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                color: adminTheme.subtext,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Tooltip>
        </div>

        {/* Quick POS Terminal Launcher */}
        <div style={{ padding: '8px 12px 6px', flexShrink: 0 }}>
          <button
            onClick={() => {
              if (onMenuClick) onMenuClick();
              navigate('/admins/pos');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(16, 185, 129, 0.35)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.22) 100%)',
              color: '#10b981',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)',
            }}
          >
            <CreditCardOutlined style={{ fontSize: 16 }} />
            <span>{t('pos_terminal', 'POS Terminal')}</span>
          </button>
        </div>

        {/* Scrollable Modules Navigation */}
        <div
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '10px 8px 16px',
            WebkitOverflowScrolling: 'touch',
          }}
          className="erp-sidebar-scroll"
        >
          <ErpModuleSidebar
            collapsed={false}
            activeModuleKey={activeModuleKey}
            activeMenuKey={activeMenuKey}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Bottom Dock / System Telemetry */}
        <div
          style={{
            flexShrink: 0,
            minHeight: 52,
            padding: '10px 12px 12px',
            borderTop: `1px solid ${adminTheme.sidebarBorder}`,
            background: adminTheme.isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              {t('erp_core_modules', 'ERP Core: 15 Modules')}
            </Text>
          </div>
          <Tooltip title={t('settings_and_modules', 'Settings & Modules')}>
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined style={{ fontSize: 13 }} />}
              onClick={() => {
                if (onMenuClick) onMenuClick();
                navigate('/admins/modules');
              }}
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
      </div>
    );
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      collapsedWidth={72}
      width={264}
      trigger={null}
      style={{
        background: adminTheme.sidebar,
        height: '100vh',
        maxHeight: '100vh',
        position: 'fixed',
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
              title={t('command_center', 'Aura ERP Command Center')}
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
                  {t('command_hub', 'COMMAND HUB')}
                </span>
              </div>
            </div>
          )}
        </div>

        {(!collapsed || isMobile) && (
          <Tooltip title={isMobile ? t('close_menu', 'Close menu') : t('collapse_sidebar', 'Collapse sidebar (Ctrl+B)')}>
            <Button
              type="text"
              size="small"
              icon={isMobile ? <CloseOutlined style={{ fontSize: 15 }} /> : <MenuFoldOutlined style={{ fontSize: 14 }} />}
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

      {/* Quick POS Terminal Launcher */}
      <div style={{ padding: collapsed ? '8px 8px 4px' : '8px 12px 6px', flexShrink: 0 }}>
        <Tooltip title={t('pos_terminal', 'Open POS Terminal')} placement="right">
          <button
            onClick={() => navigate('/admins/pos')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10,
              padding: collapsed ? '9px 0' : '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(16, 185, 129, 0.35)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.22) 100%)',
              color: '#10b981',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.24) 0%, rgba(5, 150, 105, 0.36) 100%)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.22) 100%)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
            }}
          >
            <CreditCardOutlined style={{ fontSize: 16 }} />
            {!collapsed && <span>{t('pos_terminal', 'POS Terminal')}</span>}
          </button>
        </Tooltip>
      </div>

      {/* Scrollable Modules Navigation */}
      <div
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          height: 'calc(100vh - 170px)',
          maxHeight: 'calc(100vh - 170px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '10px 8px' : '10px 6px 12px 10px',
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
            <Tooltip title={t('expand_sidebar', 'Expand Sidebar')} placement="right">
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
            <Tooltip title={t('erp_status_all_operational', 'ERP System Status: All 15 Modules Operational')} placement="right">
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
                {t('erp_core_modules', 'ERP Core: 15 Modules')}
              </Text>
            </div>
            <Tooltip title={t('settings_and_modules', 'Settings & Modules')}>
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