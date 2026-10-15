import React, { useEffect, useState } from 'react';
import { Drawer, Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import { NotificationProvider } from '../pages/admins/NotificationContext';
import HeaderDefault from '../pages/admins/AdminHeaderDefault';
import Head from '../pages/admins/AdminHead';
import FooterDefault from '../pages/admins/AdminFooterDefault';
import AdminModuleScrollSlidebar from '../components/web/shared/AdminModuleScrollSlidebar';
import { erpModules } from '../data/erpModules';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { useAdminModules } from '../hooks/useAdminModules';

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
  const location = useLocation();
  const { moduleState, toggleModule } = useAdminModules();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Check if sidebar should be shown
  const showSidebar = location.pathname.startsWith('/admins') && 
    !NO_SIDEBAR_ROUTES.some(route => location.pathname.startsWith(route));

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

  // Strict isolation: Activate admin-active while inside AdminLayout, cleanly restore default light mode on exit
  useEffect(() => {
    const doc = document.documentElement;
    const body = document.body;
    const mode = localStorage.getItem('admin-theme') || 'light';
    const preset = localStorage.getItem('admin-theme-preset') || 'default';

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
    }

    return () => {
      // Clean up when navigating away from AdminLayout back to the public website
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

  const handleToggle = () => {
    if (isMobile) {
      setMobileDrawerOpen((previous) => !previous);
    } else {
      setCollapsed((previous) => !previous);
    }
  };

  const handleToggleModule = (moduleKey, enabled) => {
    toggleModule(moduleKey, enabled);
  };

  const contentMarginLeft = !showSidebar ? 0 : isMobile ? 0 : collapsed ? 72 : 264;

  return (
    <NotificationProvider>
      <Layout
        className="admin-layout"
        style={{
          minHeight: '100vh',
          background: adminTheme.pageBackground,
        }}
      >
        {isMobile && showSidebar && (
          <Drawer
            placement="left"
            open={mobileDrawerOpen}
            closable={false}
            width={264}
            onClose={() => setMobileDrawerOpen(false)}
            styles={{
              body: { padding: 0, background: adminTheme.sidebar },
              header: { display: 'none' },
            }}
          >
            <HeaderDefault
              collapsed={false}
              setCollapsed={() => {}}
              onMenuClick={() => setMobileDrawerOpen(false)}
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
            transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            minHeight: '100vh',
            backgroundColor: 'transparent',
          }}
        >
          <Head
            collapsed={collapsed}
            setCollapsed={handleToggle}
            isMobile={isMobile}
            showModuleMenu={showSidebar}
          />

          {showSidebar && <AdminModuleScrollSlidebar />}

          <Content
            style={{
              margin: 0,
              padding: isMobile ? 16 : 24,
              background: 'transparent',
              minHeight: 'calc(100vh - 76px)',
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