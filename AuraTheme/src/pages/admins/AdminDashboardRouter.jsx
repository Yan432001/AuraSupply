import React from 'react';
import { useLocation } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import ModuleWorkspace from './ModuleWorkspace';
import SystemSettings from './SystemSettings';
import Patients from './Patients';
import AdminCmsManager from './cms/AdminCmsManager';
import AdminSimpleDataManager from './AdminSimpleDataManager';
import AdminProductsManager from './AdminProductsManager';
import BpasInventoryWorkspace from './BpasInventoryWorkspace';
import BpasPurchasesWorkspace from './BpasPurchasesWorkspace';
import AdminModulesManager from './AdminModulesManager';
import AdminBranchesManager from './AdminBranchesManager';
import AdminFrontEndManager from './AdminFrontEndManager';
import { useAdminModules } from '../../hooks/useAdminModules';
import { useTranslation } from '../../contexts/LanguageContext';
import { Result, Button } from 'antd';
import { LockOutlined, ControlOutlined } from '@ant-design/icons';
import { getModuleByKey } from '../../data/erpModules';

import OrdersManagement from './OrdersManagement';
import SalesListPage from './sales/SalesListPage';
import AddSalePage from './sales/AddSalePage';
import CustomersManagement from './CustomersManagement';
import UserManagement from './UserManagement';
import AdminAccessControlManager from './AdminAccessControlManager';
import CategoriesPage from './CategoriesPage';
import UnitsManagement from './UnitsManagement';
import InventoryReport from './InventoryReport';
import SalesReport from './SalesReport';
import PosSettingsPage from './pos/PosSettingsPage';
import AccountingWorkspace from './accounting/AccountingWorkspace';
import AssetWorkspace from './assets/AssetWorkspace';
import AdminErrorBoundary from '../../components/common/AdminErrorBoundary';

const AdminDashboardRouter = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hasModule = searchParams.has('module');
  const moduleKey = searchParams.get('module');
  const menuKey = searchParams.get('menu');
  const hasSection = searchParams.has('section');
  const { isModuleOpen, toggleModule } = useAdminModules();

  const renderContent = () => {
    // If module is 'modules' or menu is 'module-settings', render AdminModulesManager
    if (moduleKey === 'modules' || menuKey === 'module-settings' || menuKey === 'modules') {
      return <AdminModulesManager />;
    }

  // If module is 'branches' or menu is 'branches' / 'billers', render AdminBranchesManager
  if (
    moduleKey === 'branches' ||
    moduleKey === 'billers' ||
    menuKey === 'branches' ||
    menuKey === 'billers' ||
    menuKey === 'shops' ||
    (moduleKey === 'settings' && (menuKey === 'branches' || menuKey === 'billers' || menuKey === 'warehouses'))
  ) {
    return <AdminBranchesManager />;
  }

  // Access Control & Role Governance (aura_groups, aura_permission_keys, aura_user_billers, aura_user_permissions)
  if (
    moduleKey === 'access' ||
    moduleKey === 'access-control' ||
    moduleKey === 'roles' ||
    moduleKey === 'permissions' ||
    menuKey === 'access-control' ||
    menuKey === 'permissions' ||
    menuKey === 'group-permissions' ||
    menuKey === 'user-groups' ||
    menuKey === 'roles' ||
    menuKey === 'supplier-approvals' ||
    menuKey === 'audit-trails' ||
    (moduleKey === 'settings' && (menuKey === 'access-control' || menuKey === 'permissions' || menuKey === 'roles' || menuKey === 'user-groups'))
  ) {
    const tab = menuKey === 'supplier-approvals'
      ? 'pending-suppliers'
      : (menuKey === 'permissions' || menuKey === 'group-permissions')
      ? 'matrix'
      : menuKey === 'audit-trails'
      ? 'telemetry'
      : 'groups';
    return <AdminAccessControlManager initialTab={tab} />;
  }

  // If module is 'front-end' or 'frontend' or any front-office menu, render AdminFrontEndManager
  if (
    moduleKey === 'front-end' ||
    moduleKey === 'frontend' ||
    menuKey === 'shop-control' ||
    menuKey === 'store-products' ||
    menuKey === 'website-display' ||
    menuKey === 'slider-settings' ||
    menuKey === 'list-pages' ||
    menuKey === 'shop-settings' ||
    menuKey === 'frontend-overview' ||
    menuKey === 'telegram-groups' ||
    menuKey === 'telegram'
  ) {
    return <AdminFrontEndManager initialTab={menuKey} />;
  }

  // Guard for closed modules
  if (moduleKey && !isModuleOpen(moduleKey)) {
    const modConfig = getModuleByKey(moduleKey);
    return (
      <div style={{ padding: '40px 24px' }}>
        <Result
          status="warning"
          icon={<LockOutlined style={{ color: '#ea580c' }} />}
          title={t('module_closed_title', `Module "${t(moduleKey, modConfig?.label || moduleKey)}" is Currently Closed`)}
          subTitle={t('module_closed_desc', 'This module has been deactivated in the ERP Modules Switchboard. Its sidebar menu and dashboard widgets are hidden.')}
          extra={[
            <Button
              type="primary"
              key="enable"
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
              onClick={() => toggleModule(moduleKey, true)}
            >
              {t('reopen_module', `Re-open ${t(moduleKey, modConfig?.label || moduleKey)} Module`)}
            </Button>,
            <Button
              key="manage"
              icon={<ControlOutlined />}
              onClick={() => {
                const params = new URLSearchParams(location.search);
                params.set('module', 'modules');
                window.location.search = params.toString();
              }}
            >
              {t('open_module_switchboard', 'Open Module Switchboard')}
            </Button>,
          ]}
        />
      </div>
    );
  }

  // Inventory & Products (BPAS Inventory Concept UI)
  if (
    moduleKey === 'inventory' ||
    menuKey === 'products' ||
    menuKey === 'add-product' ||
    menuKey === 'import-products' ||
    menuKey === 'print-barcodes' ||
    menuKey === 'stock-counts' ||
    menuKey === 'stock_counts' ||
    moduleKey === 'stock-counts' ||
    moduleKey === 'stock_counts' ||
    menuKey === 'count_stock' ||
    moduleKey === 'quantity-adjustments' ||
    moduleKey === 'quantity_adjustments' ||
    menuKey === 'quantity-adjustments' ||
    menuKey === 'quantity_adjustments' ||
    menuKey === 'add_adjustment' ||
    menuKey === 'add-adjustment' ||
    menuKey === 'cost-adjustments' ||
    moduleKey === 'using-stock' ||
    moduleKey === 'using_stock' ||
    menuKey === 'using-stock' ||
    menuKey === 'using_stock' ||
    menuKey === 'stock-received' ||
    menuKey === 'transfers' ||
    menuKey === 'consignments' ||
    menuKey === 'rewards-exchange'
  ) {
    return <BpasInventoryWorkspace />;
  }

  // Purchases & Procurement (AURA_v1 BPAS Procurement UI)
  if (
    moduleKey === 'procurement' ||
    moduleKey === 'purchases' ||
    menuKey === 'purchases' ||
    menuKey === 'purchases-list' ||
    menuKey === 'add-purchase' ||
    menuKey === 'purchase-orders' ||
    menuKey === 'purchase-requests' ||
    menuKey === 'report-purchases' ||
    menuKey === 'report-daily-purchases'
  ) {
    return <BpasPurchasesWorkspace />;
  }

  // Accounting & General Ledger (AURA_v1 BPAS Accounting Architecture)
  if (
    moduleKey === 'accounting' ||
    moduleKey === 'accounts' ||
    menuKey === 'accounting' ||
    menuKey === 'chart-of-accounts' ||
    menuKey === 'journal-entries' ||
    menuKey === 'general-ledger' ||
    menuKey === 'ledger' ||
    menuKey === 'cash-book' ||
    menuKey === 'bank-reconcile' ||
    menuKey === 'balance-sheet' ||
    menuKey === 'profit-loss' ||
    menuKey === 'trial-balance' ||
    menuKey === 'ar-ap-aging' ||
    menuKey === 'accounts-receivable' ||
    menuKey === 'accounts-payable' ||
    menuKey === 'financial-reports'
  ) {
    return <AccountingWorkspace />;
  }

  // Fixed Assets & Equipment Management (AURA_v1)
  if (
    moduleKey === 'asset' ||
    moduleKey === 'assets' ||
    menuKey === 'assets' ||
    menuKey === 'assets-list' ||
    menuKey === 'list-assets' ||
    menuKey === 'add-asset' ||
    menuKey === 'asset-depreciation' ||
    menuKey === 'asset-evaluation' ||
    menuKey === 'asset-expenses' ||
    menuKey === 'asset-stock-using' ||
    menuKey === 'asset-categories' ||
    menuKey === 'asset-assignments' ||
    menuKey === 'asset-transfers' ||
    menuKey === 'asset-maintenance' ||
    menuKey === 'asset-disposals' ||
    menuKey === 'asset-reports'
  ) {
    return <AssetWorkspace />;
  }

  // Categories
  if (menuKey === 'categories' || (moduleKey === 'settings' && menuKey === 'categories')) {
    return <CategoriesPage />;
  }

  // Units of Measurement Management (AURA_v1)
  if (menuKey === 'units' || (moduleKey === 'settings' && menuKey === 'units')) {
    return <UnitsManagement />;
  }

  // Add Sale Page
  if (menuKey === 'add-sale' || menuKey === 'create-sale') {
    return <AddSalePage />;
  }

  // Sales Orders, Commercial Invoices & POS Sales
  if (
    moduleKey === 'sales' ||
    menuKey === 'sales' ||
    menuKey === 'sales-list' ||
    menuKey === 'list-sales' ||
    menuKey === 'sales-orders' ||
    menuKey === 'sales-invoices' ||
    menuKey === 'pos-sales' ||
    menuKey === 'list_pos' ||
    menuKey === 'list-pos' ||
    menuKey === 'list_POS' ||
    (moduleKey === 'pos' && (menuKey === 'list_pos' || menuKey === 'list-pos' || menuKey === 'list_POS' || menuKey === 'pos-sales'))
  ) {
    return <SalesListPage />;
  }

  // Legacy Orders Management Fallback
  if (menuKey === 'orders') {
    return <OrdersManagement />;
  }

  // Customers & Clients
  if (
    menuKey === 'customers' ||
    menuKey === 'report-customers' ||
    (moduleKey === 'people' && menuKey === 'customers')
  ) {
    return <CustomersManagement />;
  }

  // Users, Roles & Employees
  if (
    menuKey === 'users' ||
    menuKey === 'user-groups' ||
    menuKey === 'employees' ||
    (moduleKey === 'settings' && menuKey === 'users') ||
    (moduleKey === 'hr' && menuKey === 'employees')
  ) {
    return <UserManagement />;
  }

  // Inventory & Stock Reports
  if (
    menuKey === 'report-stock-value' ||
    menuKey === 'report-product-quantity' ||
    menuKey === 'inventory-report'
  ) {
    return <InventoryReport />;
  }

  // Sales Reports
  if (
    menuKey === 'report-sales' ||
    menuKey === 'report-sale-items' ||
    menuKey === 'sales-report'
  ) {
    return <SalesReport />;
  }

  // If module is 'data' or has 'section', render the Simple Data Management UI
  if (moduleKey === 'data' || hasSection || menuKey === 'simple-data' || menuKey === 'data-manager') {
    return <AdminSimpleDataManager />;
  }

  // If module is 'cms' or menu is cms-*, render the Website CMS Admin Panel
  if (moduleKey === 'cms' || (menuKey && menuKey.startsWith('cms'))) {
    return <AdminSimpleDataManager />;
  }

  // If no module is specified, show the dashboard
  if (!hasModule) {
    return <AdminDashboard />;
  }
  
  // If the menu is 'pos-settings', render dedicated PosSettingsPage matching AURA_v1
  if (menuKey === 'pos-settings') {
    return <PosSettingsPage />;
  }

  // If the menu is 'system-settings' or 'settings', render SystemSettings
  if (menuKey === 'system-settings' || menuKey === 'settings') {
    return <SystemSettings />;
  }
  
  // If the menu is 'patients', render the Patients component
  if (menuKey === 'patients') {
    return <Patients />;
  }
  
  // Default: render ModuleWorkspace for other menus
  return <ModuleWorkspace />;
  };

  return (
    <AdminErrorBoundary>
      {renderContent()}
    </AdminErrorBoundary>
  );
};

export default AdminDashboardRouter;