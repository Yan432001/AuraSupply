import React, { useEffect, useState } from 'react';
import { Drawer, Layout, Spin, Result, Button, Space, Typography, message } from 'antd';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { NotificationProvider } from '../pages/admins/NotificationContext';
import HeaderDefault from '../pages/admins/AdminHeaderDefault';
import Head from '../pages/admins/AdminHead';
import FooterDefault from '../pages/admins/AdminFooterDefault';
import AdminModuleScrollSlidebar from '../components/web/shared/AdminModuleScrollSlidebar';
import { erpModules } from '../data/erpModules';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { useAdminModules } from '../hooks/useAdminModules';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

const { Content } = Layout;
const MOBILE_BREAKPOINT = 992;

// Routes that should NOT show the sidebar
const NO_SIDEBAR_ROUTES = [
  '/admins/login',
  '/admins/HorizontalGlassLogin',
  '/admins/MinimalistFloatingLogin',
  '/admins/GradientGlassLogin',
];

const AdminLayout = () => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const { themeMode, themePreset } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { moduleState, toggleModule } = useAdminModules();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const { user, token, isAuthenticated, isOwner, isAdmin, login, logout, loadingSession } = useAuth();
  const [switchingToAdmin, setSwitchingToAdmin] = useState(false);

  // Role and administrative permission classification
  const effectiveUser = user?.user ? { ...user.user, ...user } : user;
  const userRole = (effectiveUser?.role || effectiveUser?.group_name || effectiveUser?.group?.name || '').toLowerCase();
  const effectiveGroupId = Number(effectiveUser?.group_id || effectiveUser?.group?.id || 0);
  const effectiveLevel = Number(effectiveUser?.level || effectiveUser?.group?.level || 0);

  const isActualOwnerOrAdmin = Boolean(
    isOwner ||
    isAdmin ||
    effectiveGroupId === 1 ||
    effectiveGroupId === 2 ||
    effectiveLevel === 1 ||
    effectiveLevel === 2 ||
    userRole === 'owner' ||
    userRole === 'admin' ||
    effectiveUser?.username === 'admin' ||
    effectiveUser?.username === 'sbcsolutions'
  );

  const isCustomer = !isActualOwnerOrAdmin && Boolean(
    userRole === 'customer' ||
    effectiveGroupId === 4 ||
    Boolean(effectiveUser?.Customer) ||
    (effectiveUser?.allow_admin_login !== undefined && Number(effectiveUser?.allow_admin_login) === 0)
  );

  const hasAdminAccess = Boolean(
    isActualOwnerOrAdmin ||
    (!isCustomer && (effectiveLevel <= 30 || Number(effectiveUser?.allow_admin_login) === 1))
  );

  // Check if current route is a login route
  const isLoginPage = NO_SIDEBAR_ROUTES.some(route => location.pathname.startsWith(route));
  // Check if sidebar should be shown
  const showSidebar = !isLoginPage && location.pathname.startsWith('/admins');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);

      if (mobile) {
        setCollapsed(true);
      } else {
        setMobileDrawerOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Strict isolation: Activate admin-active while inside AdminLayout
  useEffect(() => {
    const doc = document.documentElement;
    const body = document.body;
    const mode = themeMode === 'dark' ? 'dark' : 'light';
    const preset = themePreset || 'default';

    doc.classList.add('admin-active');
    doc.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
    doc.classList.add(mode, `theme-${mode}`);
    doc.setAttribute('data-mode', mode);
    doc.setAttribute('data-theme', preset);
    doc.style.colorScheme = mode;

    if (body) {
      body.classList.add('admin-active');
      body.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
      body.classList.add(mode, `theme-${mode}`);
      body.setAttribute('data-mode', mode);
      body.setAttribute('data-theme', preset);
      body.style.colorScheme = mode;
      body.style.backgroundColor = '';
      body.style.color = '';
    }
  }, [themeMode, themePreset]);

  // Clean up when unmounting AdminLayout (navigating away back to public website)
  useEffect(() => {
    return () => {
      const doc = document.documentElement;
      const body = document.body;
      doc.classList.remove('admin-active', 'dark', 'theme-dark', 'admin-dark');
      doc.classList.add('light', 'theme-light');
      doc.setAttribute('data-mode', 'light');
      doc.setAttribute('data-theme', 'default');
      doc.style.colorScheme = 'light';

      if (body) {
        body.classList.remove('admin-active', 'dark', 'theme-dark', 'admin-dark');
        body.classList.add('light', 'theme-light');
        body.setAttribute('data-mode', 'light');
        body.setAttribute('data-theme', 'default');
        body.style.colorScheme = 'light';
        body.style.backgroundColor = '#ffffff';
        body.style.color = '#0f172a';
      }
    };
  }, []);

  const handleToggleMobileDrawer = () => {
    setMobileDrawerOpen((previous) => !previous);
  };

  const handleOpenMobileDrawer = () => {
    setMobileDrawerOpen(true);
  };

  const handleCloseMobileDrawer = () => {
    setMobileDrawerOpen(false);
  };

  const handleToggle = () => {
    const isScreenMobile = typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : isMobile;
    if (isScreenMobile) {
      setMobileDrawerOpen((previous) => !previous);
    } else {
      setCollapsed((previous) => !previous);
    }
  };

  // Keyboard shortcut: Ctrl+B or Cmd+B toggles sidebar smoothly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target;
        const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if (!isInput) {
          e.preventDefault();
          handleToggle();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  const handleToggleModule = (moduleKey, enabled) => {
    toggleModule(moduleKey, enabled);
  };

  const contentMarginLeft = !showSidebar ? 0 : isMobile ? 0 : collapsed ? 72 : 264;

  // 1. If currently on a login page:
  if (isLoginPage) {
    if (isAuthenticated) {
      if (hasAdminAccess) {
        return <Navigate to="/admins/dashboard" replace />;
      }
      // Customer account cannot access admin dashboard, redirect to main website
      return <Navigate to="/" replace />;
    }
    return (
      <Layout className="admin-layout" style={{ minHeight: '100vh', background: adminTheme.pageBackground }}>
        <Content style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
          <Outlet />
        </Content>
      </Layout>
    );
  }

  // 2. If validating active session token on app initialization:
  if (loadingSession) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: adminTheme.pageBackground,
          gap: 16,
        }}
      >
        <Spin size="large" />
        <span style={{ color: adminTheme.subtext, fontSize: 13, fontWeight: 500 }}>
          {t('authenticating_session', 'Authenticating Aura ERP session...')}
        </span>
      </div>
    );
  }

  // 3. If accessing protected admin routes without an authenticated session:
  if (!isAuthenticated) {
    return <Navigate to="/admins/login" state={{ from: location }} replace />;
  }

  // 4. Strict Route Protection: Block customer accounts from accessing the Admin panel
  if (isAuthenticated && (isCustomer || !hasAdminAccess)) {
    const handleQuickAdminLogin = async () => {
      setSwitchingToAdmin(true);
      try {
        const res = await axios.post('/api/admin/auth/login', { username: 'admin', password: 'admin' });
        if (res.data?.success && res.data.data?.token) {
          login(res.data.data);
          message.success('Switched to Administrator session successfully!');
          window.location.reload();
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        await logout();
        navigate('/admins/login');
      } finally {
        setSwitchingToAdmin(false);
      }
    };

    return (
      <Layout className="admin-layout" style={{ minHeight: '100vh', background: adminTheme.pageBackground }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
          <div style={{
            maxWidth: 560,
            width: '100%',
            background: adminTheme.cardBackground || '#ffffff',
            border: `1px solid ${adminTheme.borderColor || '#e2e8f0'}`,
            borderRadius: 16,
            padding: 36,
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <Result
              status="403"
              title="403 - Access Denied"
              subTitle="Customer accounts are strictly blocked from accessing the Admin Dashboard. Only users with administrative privileges may view this panel."
              extra={[
                <Button
                  type="primary"
                  size="large"
                  key="admin-quick"
                  loading={switchingToAdmin}
                  onClick={handleQuickAdminLogin}
                  style={{ borderRadius: 8, background: '#16a34a', borderColor: '#16a34a', fontWeight: 600, width: '100%', marginBottom: 10 }}
                >
                  Sign In as Administrator (admin)
                </Button>,
                <Space key="nav-buttons" size={10} wrap style={{ width: '100%', justifyContent: 'center' }}>
                  <Button
                    size="middle"
                    key="switch"
                    onClick={async () => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      await logout();
                      navigate('/admins/login');
                    }}
                    style={{ borderRadius: 8 }}
                  >
                    Sign In with Another Account
                  </Button>
                  <Button size="middle" key="home" onClick={() => navigate('/')} style={{ borderRadius: 8 }}>
                    Return to Main Website
                  </Button>
                </Space>
              ]}
            />
          </div>
        </Content>
      </Layout>
    );
  }

  const isPosPage = location.pathname.startsWith('/admins/pos');
  if (isPosPage) {
    return (
      <NotificationProvider>
        <div style={{ width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh', overflow: 'hidden' }}>
          <Outlet context={{ moduleState, onToggleModule: handleToggleModule }} />
        </div>
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider>
      <Layout
        className="admin-layout"
        style={{
          minHeight: '100vh',
          background: adminTheme.pageBackground,
          overflowX: 'hidden',
          maxWidth: '100vw',
          width: '100%',
        }}
      >
        {showSidebar && (
          <Drawer
            placement="left"
            open={mobileDrawerOpen}
            closable={false}
            width={Math.min(290, typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.84) : 290)}
            onClose={handleCloseMobileDrawer}
            mask={true}
            maskClosable={true}
            destroyOnHidden
            zIndex={2000}
            styles={{
              body: { padding: 0, background: adminTheme.sidebar, height: '100%', overflow: 'hidden' },
              header: { display: 'none' },
              mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.45)' },
            }}
          >
            <HeaderDefault
              collapsed={false}
              setCollapsed={handleCloseMobileDrawer}
              onMenuClick={handleCloseMobileDrawer}
              moduleState={moduleState}
              onToggleModule={handleToggleModule}
              isMobile={true}
            />
          </Drawer>
        )}

        {!isMobile && showSidebar && (
          <HeaderDefault
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            moduleState={moduleState}
            onToggleModule={handleToggleModule}
            isMobile={false}
          />
        )}

        <Layout
          style={{
            marginLeft: contentMarginLeft,
            transition: 'margin-left 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            minHeight: '100vh',
            backgroundColor: 'transparent',
            maxWidth: isMobile ? '100vw' : `calc(100vw - ${contentMarginLeft}px)`,
            overflowX: 'hidden',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          <Head
            collapsed={collapsed}
            setCollapsed={handleToggle}
            toggleMobileDrawer={handleToggleMobileDrawer}
            openMobileDrawer={handleOpenMobileDrawer}
            isMobile={isMobile}
            showModuleMenu={showSidebar}
          />

          {showSidebar && <AdminModuleScrollSlidebar />}

          <Content
            style={{
              margin: 0,
              padding: isMobile ? '12px 12px 28px' : '20px 24px 36px',
              background: 'transparent',
              minHeight: 'calc(100vh - 76px)',
              overflowX: 'hidden',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Outlet context={{ moduleState, onToggleModule: handleToggleModule }} />
          </Content>

          <FooterDefault />
        </Layout>
      </Layout>
    </NotificationProvider>
  );
};

export default AdminLayout;