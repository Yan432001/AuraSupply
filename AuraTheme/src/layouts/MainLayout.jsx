import React, { useEffect } from 'react';
import { Layout, Grid, ConfigProvider, App as AntApp } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCartOutlined } from '@ant-design/icons';
import Header from '../components/web/common/Header';
import Footer from '../components/web/common/Footer';
import MobileBottomNav from '../components/web/common/MobileBottomNav';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useHeaderHeight } from '../hooks/useHeaderHeight';
import { publicTheme } from '../utils/webTheme';

const { Content } = Layout;
const { useBreakpoint } = Grid;

// Fixed, immutable website color theme — completely decoupled from /admins settings
const websiteThemeConfig = {
  token: {
    colorPrimary: publicTheme.primary,
    colorLink: publicTheme.primary,
    colorSuccess: publicTheme.success,
    colorWarning: publicTheme.warning,
    colorError: publicTheme.danger,
    colorInfo: publicTheme.secondary,
    colorTextBase: publicTheme.text,
    colorTextSecondary: publicTheme.subtext,
    colorBgBase: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorBgContainer: '#ffffff',
    colorBorder: 'rgba(226, 232, 240, 0.85)',
    borderRadius: 14,
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Button: {
      colorPrimary: publicTheme.primary,
      borderRadius: 12,
    },
    Card: {
      colorBgContainer: '#ffffff',
      borderRadiusLG: 18,
    },
  },
};

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { cartItemCount, cartTotal } = useCart();
  const { headerRef } = useHeaderHeight();
  const { t } = useTranslation();
  const currentPage = location.pathname;

  // Enforce website theme isolation: ensure admin theme styles or dark classes never leak onto the public website
  useEffect(() => {
    const adminStyle = document.getElementById('aura-admin-theme-vars');
    if (adminStyle) {
      adminStyle.remove();
    }
    document.documentElement.classList.remove('theme-dark', 'dark', 'admin-dark', 'admin-active');
    document.documentElement.classList.add('theme-light', 'light');
    document.documentElement.setAttribute('data-mode', 'light');
    document.documentElement.setAttribute('data-theme', 'default');
    document.documentElement.style.colorScheme = 'light';

    document.body.classList.remove('theme-dark', 'dark', 'admin-dark', 'admin-active');
    document.body.classList.add('theme-light', 'light');
    document.body.setAttribute('data-mode', 'light');
    document.body.setAttribute('data-theme', 'default');
    document.body.style.colorScheme = 'light';
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#0f172a';
  }, [location.pathname]);

  return (
    <ConfigProvider theme={websiteThemeConfig}>
      <AntApp>
        <Layout
          style={{
            minHeight: '100vh',
            background: '#ffffff',
            position: 'relative',
          }}
        >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 10% 8%, rgba(47, 111, 237, 0.04), transparent 30%), radial-gradient(circle at 90% 4%, rgba(255, 122, 61, 0.03), transparent 26%), linear-gradient(180deg, #ffffff 0%, #f8fafc 48%, #ffffff 100%)',
        }}
      />

      <Layout.Header
        ref={headerRef}
        className="header app-sticky-header"
        style={{
          padding: 0,
          background: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: 'auto',
          lineHeight: 'normal',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Header currentPage={currentPage} />
      </Layout.Header>

      <Content style={{ flex: 1, position: 'relative', zIndex: 1, width: '100%' }}>
        <div
          style={{
            width: '100%',
            minHeight: 'calc(100vh - 84px - 180px)',
            padding: screens.xs ? '10px 8px 80px' : screens.lg ? '20px 28px 56px' : '14px 16px 40px',
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </div>
      </Content>

      <Footer />

      {/* Fixed Mobile Bottom Navigation for Phone Screens */}
      <MobileBottomNav />

      {/* Floating Cart Indicator for Tablet & Desktop when browsing with items */}
      {cartItemCount > 0 && currentPage !== '/cart' && !screens.xs && (
        <button
          type="button"
          onClick={() => navigate('/cart')}
          aria-label="View Cart"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 999,
            padding: '12px 22px',
            boxShadow: '0 12px 30px rgba(37, 99, 235, 0.4), 0 4px 10px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: 14,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ShoppingCartOutlined style={{ fontSize: 18 }} />
            <span
              style={{
                position: 'absolute',
                top: -8,
                right: -10,
                background: '#ef4444',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 900,
                borderRadius: 999,
                padding: '1px 5px',
                minWidth: 16,
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {cartItemCount}
            </span>
          </div>
          <span>{t('view_cart', 'View Cart')}</span>
          <span style={{ opacity: 0.6, fontWeight: 700 }}>•</span>
          <span>${cartTotal.toFixed(2)}</span>
        </button>
      )}
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
};

export default MainLayout;
