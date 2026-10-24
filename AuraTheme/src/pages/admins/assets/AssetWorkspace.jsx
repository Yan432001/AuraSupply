import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Badge } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  PlusCircleOutlined,
  TagsOutlined,
  UserSwitchOutlined,
  SwapOutlined,
  ToolOutlined,
  CalculatorOutlined,
  StopOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../contexts/LanguageContext';

// Sub-components
import AssetDashboard from './AssetDashboard';
import AssetRegisterPage from './AssetRegisterPage';
import AddAssetPage from './AddAssetPage';
import AssetCategoriesPage from './AssetCategoriesPage';
import AssetAssignmentsPage from './AssetAssignmentsPage';
import AssetTransfersPage from './AssetTransfersPage';
import AssetMaintenancePage from './AssetMaintenancePage';
import AssetDepreciationPage from './AssetDepreciationPage';
import AssetDisposalPage from './AssetDisposalPage';
import AssetReportsPage from './AssetReportsPage';

const { Title, Text } = Typography;

const AssetWorkspace = ({ initialTab = 'dashboard' }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const menuKey = searchParams.get('menu');
  const tabParam = searchParams.get('tab');

  // Map sidebar menuKey to activeTab
  const resolveTab = () => {
    if (tabParam) return tabParam;
    if (menuKey === 'assets-list' || menuKey === 'list-assets') return 'register';
    if (menuKey === 'add-asset' || menuKey === 'create-asset') return 'add-asset';
    if (menuKey === 'asset-depreciation' || menuKey === 'asset-evaluation') return 'depreciation';
    if (menuKey === 'asset-expenses' || menuKey === 'asset-stock-using') return 'maintenance';
    return initialTab || 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(resolveTab());

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [location.search]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    const params = new URLSearchParams(location.search);
    params.set('tab', key);
    navigate({ search: params.toString() }, { replace: true });
  };

  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <DashboardOutlined /> {t('asset_dashboard', 'Dashboard')}
        </span>
      ),
      children: <AssetDashboard onNavigateTab={handleTabChange} />
    },
    {
      key: 'register',
      label: (
        <span>
          <AppstoreOutlined /> {t('asset_register', 'Asset Register')}
        </span>
      ),
      children: <AssetRegisterPage onAddNewAsset={() => handleTabChange('add-asset')} />
    },
    {
      key: 'add-asset',
      label: (
        <span>
          <PlusCircleOutlined style={{ color: '#16a34a' }} /> {t('add_asset', 'Register Asset')}
        </span>
      ),
      children: (
        <AddAssetPage
          onSuccess={() => handleTabChange('register')}
          onCancel={() => handleTabChange('register')}
        />
      )
    },
    {
      key: 'categories',
      label: (
        <span>
          <TagsOutlined /> {t('categories', 'Categories')}
        </span>
      ),
      children: <AssetCategoriesPage />
    },
    {
      key: 'assignments',
      label: (
        <span>
          <UserSwitchOutlined /> {t('custody_assignments', 'Assignments & Returns')}
        </span>
      ),
      children: <AssetAssignmentsPage />
    },
    {
      key: 'transfers',
      label: (
        <span>
          <SwapOutlined /> {t('transfers', 'Transfers')}
        </span>
      ),
      children: <AssetTransfersPage />
    },
    {
      key: 'maintenance',
      label: (
        <span>
          <ToolOutlined /> {t('maintenance', 'Maintenance')}
        </span>
      ),
      children: <AssetMaintenancePage />
    },
    {
      key: 'depreciation',
      label: (
        <span>
          <CalculatorOutlined style={{ color: '#d97706' }} /> {t('depreciation_amortization', 'Depreciation Engine')}
        </span>
      ),
      children: <AssetDepreciationPage />
    },
    {
      key: 'disposals',
      label: (
        <span>
          <StopOutlined style={{ color: '#dc2626' }} /> {t('disposals_scrap', 'Disposals & Scrap')}
        </span>
      ),
      children: <AssetDisposalPage />
    },
    {
      key: 'reports',
      label: (
        <span>
          <BarChartOutlined /> {t('asset_reports', 'Financial Reports')}
        </span>
      ),
      children: <AssetReportsPage />
    }
  ];

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Workspace Header */}
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
          {t('asset_management_system', 'Fixed Asset & Equipment Management System')}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {t('asset_workspace_desc', 'Enterprise fixed capital register, straight-line depreciation amortization, equipment custody tracking, maintenance servicing, and scrap write-offs.')}
        </Text>
      </div>

      <Card
        bodyStyle={{ padding: '16px 20px' }}
        style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          type="line"
          size="large"
          tabBarStyle={{ marginBottom: 20 }}
        />
      </Card>
    </div>
  );
};

export default AssetWorkspace;
