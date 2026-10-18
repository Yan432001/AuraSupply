import React from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NetworkStatusProvider } from './contexts/NetworkStatusContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Base Web Layout & Pages
import MainLayout from './layouts/MainLayout';
import Home from './pages/web/Home';
import Shops from './pages/web/Shops';
import ShopDetail from './pages/web/ShopDetail';
import Products from './pages/web/Products';
import ProductDetailPage from './pages/web/ProductDetailPage';
import Service from './pages/web/Service';
import Learn from './pages/web/Learn';
import Profile from './pages/web/Profile';
import Cart from './pages/web/Cart';
import Wishlist from './pages/web/Wishlist';
import Login from './pages/web/Login';
import Register from './pages/web/Register';

// Admin Layout & Pages
import AdminLayout from './layouts/AdminLayout';
import CategoriesPage from './pages/admins/CategoriesPage';
import AdminDashboardRouter from './pages/admins/AdminDashboardRouter';
import AdminProducts from './pages/admins/AdminProducts';
import AdminUsers from './pages/admins/AdminUsers';
import CustomersManagement from './pages/admins/CustomersManagement';
import OrdersManagement from './pages/admins/OrdersManagement';
import SalesAnalytics from './pages/admins/SalesAnalytics';
import RevenueAnalytics from './pages/admins/RevenueAnalytics';
import CustomerAnalytics from './pages/admins/CustomerAnalytics';
import SalesReport from './pages/admins/SalesReport';
import InventoryReport from './pages/admins/InventoryReport';
import UserManagement from './pages/admins/UserManagement';
import AdminQrCodeGeneratorPage from './pages/admins/AdminQrCodeGeneratorPage';
import AdminModulesManager from './pages/admins/AdminModulesManager';
import AdminBranchesManager from './pages/admins/AdminBranchesManager';
import AdminAccessControlManager from './pages/admins/AdminAccessControlManager';
import AdminFrontEndManager from './pages/admins/AdminFrontEndManager';
import AdminProfile from './pages/admins/AdminProfile';
import ModernAuraLogin from './pages/admins/auth/ModernAuraLogin';
import { AdminModulesProvider } from './contexts/AdminModulesContext';

// E-Menu Telegram Mini App Layout & Views
import EMenuLayout from './pages/emenu/EMenuLayout';
import EMenuPage from './views/EMenuPage';
import WebEMenuPage from './views/WebEMenuPage';
import TelegramEntry from './views/TelegramEntry';
import StoreNotFound from './views/StoreNotFound';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// Admin Theme Wrapper
const AdminThemeWrapper = ({ children }) => {
  const { currentTheme } = useTheme();
  return (
    <ConfigProvider theme={currentTheme}>
      <AntApp>
        {children}
      </AntApp>
    </ConfigProvider>
  );
};

const ThemedAdminLayout = () => (
  <ThemeProvider>
    <AdminThemeWrapper>
      <AdminLayout />
    </AdminThemeWrapper>
  </ThemeProvider>
);

const AppContent = () => {
  return (
    <Routes>
      {/* 1. Telegram Deep-Link Entry */}
      <Route path="/tg" element={<TelegramEntry />} />
      <Route path="/menu" element={<TelegramEntry />} />

      {/* Dedicated Website E-Menu Routes (Design matched to Our Tasty Foods mockup) */}
      <Route path="/shop/menu" element={<WebEMenuPage />} />
      <Route path="/shop/menu/:storeSlug" element={<WebEMenuPage />} />

      {/* 2. Isolated Multi-Store E-Menu Routes (No Base Header/Footer) */}
      <Route path="/shop" element={<EMenuLayout />}>
        <Route index element={<TelegramEntry />} />
        <Route path="not-found" element={<StoreNotFound />} />
        <Route path="by-biller/:billerId" element={<EMenuPage />} />
        <Route path=":storeSlug" element={<EMenuPage />} />
      </Route>

      {/* 2b. Redirect legacy /tma routes directly to official E-Menu */}
      <Route path="/tma" element={<Navigate to="/shop" replace />} />
      <Route path="/tma/:storeSlug" element={<EMenuPage />} />

      {/* 3. Base Customer-Facing Website Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="sourcing" element={<Navigate to="/products" replace />} />
        <Route path="shops" element={<Shops />} />
        <Route path="shops/:shopId" element={<ShopDetail />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="service" element={<Service />} />
        <Route path="community" element={<Navigate to="/service" replace />} />
        <Route path="learn" element={<Learn />} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="cart" element={<Cart />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* 4. Admin Management Routes */}
      <Route path="/admins" element={<ThemedAdminLayout />}>
        <Route index element={<AdminDashboardRouter />} />
        <Route path="login" element={<ModernAuraLogin />} />
        <Route path="dashboard" element={<AdminDashboardRouter />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/add" element={<AdminProducts />} />
        <Route path="products/import" element={<AdminProducts />} />
        <Route path="products/print_barcodes" element={<AdminProducts />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="customers" element={<CustomersManagement />} />
        <Route path="orders" element={<OrdersManagement />} />
        <Route path="qrcode" element={<AdminQrCodeGeneratorPage />} />
        <Route path="qr-generator" element={<AdminQrCodeGeneratorPage />} />
        <Route path="analytics/sales" element={<SalesAnalytics />} />
        <Route path="analytics/revenue" element={<RevenueAnalytics />} />
        <Route path="analytics/customers" element={<CustomerAnalytics />} />
        <Route path="reports/sales" element={<SalesReport />} />
        <Route path="reports/inventory" element={<InventoryReport />} />
        <Route path="settings" element={<AdminDashboardRouter />} />
        <Route path="settings/system" element={<AdminDashboardRouter />} />
        <Route path="settings/categories" element={<CategoriesPage />} />
        <Route path="settings/users" element={<UserManagement />} />
        <Route path="access-control" element={<AdminAccessControlManager />} />
        <Route path="settings/access" element={<AdminAccessControlManager />} />
        <Route path="settings/roles" element={<AdminAccessControlManager initialTab="groups" />} />
        <Route path="settings/permissions" element={<AdminAccessControlManager initialTab="matrix" />} />
        <Route path="modules" element={<AdminModulesManager />} />
        <Route path="settings/modules" element={<AdminModulesManager />} />
        <Route path="branches" element={<AdminBranchesManager />} />
        <Route path="settings/branches" element={<AdminBranchesManager />} />
        <Route path="billers" element={<AdminBranchesManager />} />
        <Route path="settings/billers" element={<AdminBranchesManager />} />
        <Route path="frontend" element={<AdminFrontEndManager />} />
        <Route path="storefront" element={<AdminFrontEndManager />} />
        <Route path="cms" element={<AdminDashboardRouter />} />
        <Route path="data" element={<AdminDashboardRouter />} />
        <Route path="patients" element={<AdminDashboardRouter />} />
        <Route path="*" element={<AdminDashboardRouter />} />
      </Route>

      {/* 5. Catch-All Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <NetworkStatusProvider>
    <AuthProvider>
      <LanguageProvider>
        <AdminModulesProvider>
          <WishlistProvider>
            <CartProvider>
              <Router>
                <AntApp>
                  <AppContent />
                </AntApp>
              </Router>
            </CartProvider>
          </WishlistProvider>
        </AdminModulesProvider>
      </LanguageProvider>
    </AuthProvider>
  </NetworkStatusProvider>
);

export default App;