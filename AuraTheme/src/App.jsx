import React from 'react';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import PosTerminal from './pages/admins/pos/PosTerminal';
import PosSettingsPage from './pages/admins/pos/PosSettingsPage';
import PosViewBill from './pages/admins/pos/PosViewBill';
import PosKitchenDisplay from './pages/admins/pos/PosKitchenDisplay';
import BpasPurchasesWorkspace from './pages/admins/BpasPurchasesWorkspace';
import AccountingWorkspace from './pages/admins/accounting/AccountingWorkspace';
import AssetWorkspace from './pages/admins/assets/AssetWorkspace';
import SalesListPage from './pages/admins/sales/SalesListPage';
import AddSalePage from './pages/admins/sales/AddSalePage';
import EditSalePage from './pages/admins/sales/EditSalePage';
import SaleDetailPage from './pages/admins/sales/SaleDetailPage';
import BpasTransfersWorkspace from './pages/admins/BpasTransfersWorkspace';
import BpasAddTransferPage from './pages/admins/BpasAddTransferPage';
import BpasEditTransferPage from './pages/admins/BpasEditTransferPage';
import BpasCostAdjustmentsWorkspace from './pages/admins/BpasCostAdjustmentsWorkspace';
import BpasAddCostAdjustmentPage from './pages/admins/BpasAddCostAdjustmentPage';
import BpasEditCostAdjustmentPage from './pages/admins/BpasEditCostAdjustmentPage';
import BpasStockReceivedWorkspace from './pages/admins/BpasStockReceivedWorkspace';
import BpasAddStockReceivedPage from './pages/admins/BpasAddStockReceivedPage';
import BpasEditStockReceivedPage from './pages/admins/BpasEditStockReceivedPage';
import BpasConsignmentsWorkspace from './pages/admins/BpasConsignmentsWorkspace';
import BpasAddConsignmentPage from './pages/admins/BpasAddConsignmentPage';
import BpasEditConsignmentPage from './pages/admins/BpasEditConsignmentPage';
import BpasRewardsExchangeWorkspace from './pages/admins/BpasRewardsExchangeWorkspace';
import BpasAddRewardsExchangePage from './pages/admins/BpasAddRewardsExchangePage';
import BpasEditRewardsExchangePage from './pages/admins/BpasEditRewardsExchangePage';
import BpasPurchaseRequestsWorkspace from './pages/admins/BpasPurchaseRequestsWorkspace';
import BpasAddPurchaseRequestPage from './pages/admins/BpasAddPurchaseRequestPage';
import BpasEditPurchaseRequestPage from './pages/admins/BpasEditPurchaseRequestPage';
import BpasPurchaseOrdersWorkspace from './pages/admins/BpasPurchaseOrdersWorkspace';
import BpasAddPurchaseOrderPage from './pages/admins/BpasAddPurchaseOrderPage';
import BpasEditPurchaseOrderPage from './pages/admins/BpasEditPurchaseOrderPage';
import { AdminModulesProvider } from './contexts/AdminModulesContext';

// E-Menu Telegram Mini App Layout & Views
import EMenuLayout from './pages/emenu/EMenuLayout';
import EMenuPage from './views/EMenuPage';
import WebEMenuPage from './views/WebEMenuPage';
import TelegramEntry from './views/TelegramEntry';
import StoreNotFound from './views/StoreNotFound';

// Protected Route Component for Website Customer & B2B Portal
const WebProtectedRoute = ({ children }) => {
  const { isWebAuthenticated, webUser, user, loadingSession } = useAuth();
  const location = useLocation();

  if (loadingSession) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const hasAccess = Boolean(isWebAuthenticated || webUser || (user && !location.pathname.startsWith('/admins')));
  return hasAccess ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

const ProtectedRoute = WebProtectedRoute;

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

const AdminRedirect = () => {
  const loc = useLocation();
  const sub = loc.pathname.replace(/^\/admin(?:\/|$)/, '');
  const target = `/admins/${sub}${loc.search}`;
  return <Navigate to={target} replace />;
};

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

      {/* Standalone Fullscreen POS Secondary & Kitchen Displays */}
      <Route path="/pos/view-bill" element={<PosViewBill />} />
      <Route path="/pos/kitchen" element={<PosKitchenDisplay />} />

      {/* 4. Admin Management Routes */}
      <Route path="/admins" element={<ThemedAdminLayout />}>
        <Route index element={<AdminDashboardRouter />} />
        <Route path="login" element={<ModernAuraLogin />} />
        <Route path="dashboard" element={<AdminDashboardRouter />} />
        <Route path="pos" element={<PosTerminal />} />
        <Route path="pos/settings" element={<PosSettingsPage />} />
        <Route path="pos/view-bill" element={<PosViewBill />} />
        <Route path="pos/kitchen" element={<PosKitchenDisplay />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/add" element={<AdminProducts />} />
        <Route path="products/import" element={<AdminProducts />} />
        <Route path="products/print_barcodes" element={<AdminProducts />} />
        <Route path="products/using_stock" element={<AdminProducts />} />
        <Route path="products/using-stock" element={<AdminProducts />} />
        <Route path="products/quantity_adjustments" element={<AdminProducts />} />
        <Route path="products/quantity-adjustments" element={<AdminProducts />} />
        <Route path="products/add_adjustment" element={<AdminProducts />} />
        <Route path="products/edit_adjustment/:id" element={<AdminProducts />} />
        <Route path="products/cost_adjustments" element={<AdminProducts />} />
        <Route path="products/cost-adjustments" element={<AdminProducts />} />
        <Route path="products/cost_adjustments/add" element={<BpasAddCostAdjustmentPage />} />
        <Route path="products/cost-adjustments/add" element={<BpasAddCostAdjustmentPage />} />
        <Route path="products/cost_adjustments/edit/:id" element={<BpasEditCostAdjustmentPage />} />
        <Route path="products/cost-adjustments/edit/:id" element={<BpasEditCostAdjustmentPage />} />
        <Route path="products/stock_received" element={<AdminProducts />} />
        <Route path="products/stock-received" element={<AdminProducts />} />
        <Route path="products/stock_received/add" element={<BpasAddStockReceivedPage />} />
        <Route path="products/stock-received/add" element={<BpasAddStockReceivedPage />} />
        <Route path="products/stock_received/edit/:id" element={<BpasEditStockReceivedPage />} />
        <Route path="products/stock-received/edit/:id" element={<BpasEditStockReceivedPage />} />
        <Route path="products/consignments" element={<AdminProducts />} />
        <Route path="products/consignments/add" element={<BpasAddConsignmentPage />} />
        <Route path="products/consignments/edit/:id" element={<BpasEditConsignmentPage />} />
        <Route path="products/rewards_exchange" element={<AdminProducts />} />
        <Route path="products/rewards-exchange" element={<AdminProducts />} />
        <Route path="products/rewards_exchange/add" element={<BpasAddRewardsExchangePage />} />
        <Route path="products/rewards-exchange/add" element={<BpasAddRewardsExchangePage />} />
        <Route path="products/rewards_exchange/edit/:id" element={<BpasEditRewardsExchangePage />} />
        <Route path="products/rewards-exchange/edit/:id" element={<BpasEditRewardsExchangePage />} />
        <Route path="products/purchase_requests" element={<AdminProducts />} />
        <Route path="products/purchase-requests" element={<AdminProducts />} />
        <Route path="products/purchase_requests/add" element={<BpasAddPurchaseRequestPage />} />
        <Route path="products/purchase-requests/add" element={<BpasAddPurchaseRequestPage />} />
        <Route path="products/purchase_requests/edit/:id" element={<BpasEditPurchaseRequestPage />} />
        <Route path="products/purchase-requests/edit/:id" element={<BpasEditPurchaseRequestPage />} />
        <Route path="products/purchase_orders" element={<AdminProducts />} />
        <Route path="products/purchase-orders" element={<AdminProducts />} />
        <Route path="products/purchase_orders/add" element={<BpasAddPurchaseOrderPage />} />
        <Route path="products/purchase-orders/add" element={<BpasAddPurchaseOrderPage />} />
        <Route path="products/purchase_orders/edit/:id" element={<BpasEditPurchaseOrderPage />} />
        <Route path="products/purchase-orders/edit/:id" element={<BpasEditPurchaseOrderPage />} />
        <Route path="products/purchases_orders" element={<AdminProducts />} />
        <Route path="products/purchases-orders" element={<AdminProducts />} />
        <Route path="products/purchases_orders/add" element={<BpasAddPurchaseOrderPage />} />
        <Route path="products/purchases-orders/add" element={<BpasAddPurchaseOrderPage />} />
        <Route path="products/purchases_orders/edit/:id" element={<BpasEditPurchaseOrderPage />} />
        <Route path="products/purchases-orders/edit/:id" element={<BpasEditPurchaseOrderPage />} />
        <Route path="cost_adjustments" element={<BpasCostAdjustmentsWorkspace />} />
        <Route path="cost_adjustments/add" element={<BpasAddCostAdjustmentPage />} />
        <Route path="cost_adjustments/edit/:id" element={<BpasEditCostAdjustmentPage />} />
        <Route path="stock_received" element={<BpasStockReceivedWorkspace />} />
        <Route path="stock-received" element={<BpasStockReceivedWorkspace />} />
        <Route path="stock_received/add" element={<BpasAddStockReceivedPage />} />
        <Route path="stock-received/add" element={<BpasAddStockReceivedPage />} />
        <Route path="stock_received/edit/:id" element={<BpasEditStockReceivedPage />} />
        <Route path="stock-received/edit/:id" element={<BpasEditStockReceivedPage />} />
        <Route path="consignments" element={<BpasConsignmentsWorkspace />} />
        <Route path="consignments/add" element={<BpasAddConsignmentPage />} />
        <Route path="consignments/edit/:id" element={<BpasEditConsignmentPage />} />
        <Route path="rewards_exchange" element={<BpasRewardsExchangeWorkspace />} />
        <Route path="rewards-exchange" element={<BpasRewardsExchangeWorkspace />} />
        <Route path="rewards_exchange/add" element={<BpasAddRewardsExchangePage />} />
        <Route path="rewards-exchange/add" element={<BpasAddRewardsExchangePage />} />
        <Route path="rewards_exchange/edit/:id" element={<BpasEditRewardsExchangePage />} />
        <Route path="rewards-exchange/edit/:id" element={<BpasEditRewardsExchangePage />} />
        <Route path="purchase_requests" element={<BpasPurchaseRequestsWorkspace />} />
        <Route path="purchase-requests" element={<BpasPurchaseRequestsWorkspace />} />
        <Route path="purchase_requests/add" element={<BpasAddPurchaseRequestPage />} />
        <Route path="purchase-requests/add" element={<BpasAddPurchaseRequestPage />} />
        <Route path="purchase_requests/edit/:id" element={<BpasEditPurchaseRequestPage />} />
        <Route path="purchase-requests/edit/:id" element={<BpasEditPurchaseRequestPage />} />
        <Route path="purchases_orders" element={<BpasPurchaseOrdersWorkspace />} />
        <Route path="purchases-orders" element={<BpasPurchaseOrdersWorkspace />} />
        <Route path="purchases_orders/add" element={<BpasAddPurchaseOrderPage />} />
        <Route path="purchases-orders/add" element={<BpasAddPurchaseOrderPage />} />
        <Route path="purchases_orders/edit/:id" element={<BpasEditPurchaseOrderPage />} />
        <Route path="purchases-orders/edit/:id" element={<BpasEditPurchaseOrderPage />} />
        <Route path="purchase_orders" element={<BpasPurchaseOrdersWorkspace />} />
        <Route path="purchase-orders" element={<BpasPurchaseOrdersWorkspace />} />
        <Route path="purchase_orders/add" element={<BpasAddPurchaseOrderPage />} />
        <Route path="purchase-orders/add" element={<BpasAddPurchaseOrderPage />} />
        <Route path="purchase_orders/edit/:id" element={<BpasEditPurchaseOrderPage />} />
        <Route path="purchase-orders/edit/:id" element={<BpasEditPurchaseOrderPage />} />
        <Route path="transfers" element={<BpasTransfersWorkspace />} />
        <Route path="transfers/add" element={<BpasAddTransferPage />} />
        <Route path="transfers/edit/:id" element={<BpasEditTransferPage />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="customers" element={<CustomersManagement />} />
        <Route path="purchases" element={<BpasPurchasesWorkspace />} />
        <Route path="purchases/add" element={<BpasPurchasesWorkspace />} />
        <Route path="accounting" element={<AccountingWorkspace initialTab="dashboard" />} />
        <Route path="accounting/accounts" element={<AccountingWorkspace initialTab="accounts" />} />
        <Route path="accounting/journals" element={<AccountingWorkspace initialTab="journals" />} />
        <Route path="accounting/journals/add" element={<AccountingWorkspace initialTab="add-journal" />} />
        <Route path="accounting/ledger" element={<AccountingWorkspace initialTab="ledger" />} />
        <Route path="accounting/cash-bank" element={<AccountingWorkspace initialTab="cash-bank" />} />
        <Route path="accounting/ar" element={<AccountingWorkspace initialTab="ar" />} />
        <Route path="accounting/ap" element={<AccountingWorkspace initialTab="ap" />} />
        <Route path="accounting/reports" element={<AccountingWorkspace initialTab="reports" />} />
        <Route path="assets" element={<AssetWorkspace initialTab="dashboard" />} />
        <Route path="assets/register" element={<AssetWorkspace initialTab="register" />} />
        <Route path="assets/add" element={<AssetWorkspace initialTab="add-asset" />} />
        <Route path="assets/categories" element={<AssetWorkspace initialTab="categories" />} />
        <Route path="assets/assignments" element={<AssetWorkspace initialTab="assignments" />} />
        <Route path="assets/transfers" element={<AssetWorkspace initialTab="transfers" />} />
        <Route path="assets/maintenance" element={<AssetWorkspace initialTab="maintenance" />} />
        <Route path="assets/depreciation" element={<AssetWorkspace initialTab="depreciation" />} />
        <Route path="assets/disposals" element={<AssetWorkspace initialTab="disposals" />} />
        <Route path="assets/reports" element={<AssetWorkspace initialTab="reports" />} />
        <Route path="sales" element={<SalesListPage />} />
        <Route path="sales/add" element={<AddSalePage />} />
        <Route path="sales/edit/:id" element={<EditSalePage />} />
        <Route path="sales/view/:id" element={<SaleDetailPage />} />
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

      {/* 5. Admin Prefix Fallback (/admin -> /admins) */}
      <Route path="/admin/*" element={<AdminRedirect />} />
      <Route path="/admin" element={<Navigate to="/admins" replace />} />

      {/* 6. Catch-All Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <Router>
    <NetworkStatusProvider>
      <AuthProvider>
        <LanguageProvider>
          <AdminModulesProvider>
            <WishlistProvider>
              <CartProvider>
                <AntApp>
                  <AppContent />
                </AntApp>
              </CartProvider>
            </WishlistProvider>
          </AdminModulesProvider>
        </LanguageProvider>
      </AuthProvider>
    </NetworkStatusProvider>
  </Router>
);

export default App;