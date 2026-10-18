import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Button,
  Card,
  Col,
  Flex,
  Grid,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip as AntTooltip,
} from 'antd';
import { formatCurrency } from '../../utils/uiTheme';
import {
  ApiOutlined,
  CheckCircleFilled,
  CloudServerOutlined,
  CloudSyncOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  GlobalOutlined,
  LockOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SyncOutlined,
  TeamOutlined,
  ToolOutlined,
  WarningOutlined,
  QrcodeOutlined,
  ControlOutlined,
  BuildOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  MedicineBoxOutlined,
  ReconciliationOutlined,
  BankOutlined,
  CheckOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useAdminModules } from '../../hooks/useAdminModules';
import { useTranslation } from '../../contexts/LanguageContext';
import { erpModules } from '../../data/erpModules';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

// Base KPI telemetry cards
const baseKpiCards = [
  { title: 'ERP System Uptime', value: '99.9%', sub: 'Last 30 days', icon: <CloudServerOutlined />, colorKey: 'orange', bars: [8, 14, 10, 22, 16, 26, 18, 30, 20, 34, 24, 40] },
  { title: 'API Status', value: 'Healthy', sub: 'All operational', icon: <ApiOutlined />, colorKey: 'teal', bars: [20, 10, 26, 12, 30, 14, 24, 10, 28, 16, 22, 12] },
  { title: 'Active Modules', value: 'Dynamic', sub: 'Configured in Switchboard', icon: <ControlOutlined />, colorKey: 'green', bars: [12, 18, 14, 24, 12, 20, 16, 26, 14, 22, 18, 28] },
  { title: 'Background Jobs', value: 'Running', sub: '12/12 jobs healthy', icon: <ClusterOutlined />, colorKey: 'teal', bars: [10, 10, 10, 34, 10, 10, 10, 10, 10, 10, 10, 10] },
];

// All possible module storage allocations
const allStorageByModule = [
  { moduleKey: 'inventory', module: 'Inventory', gb: 280 },
  { moduleKey: 'sales', module: 'Sales', gb: 260 },
  { moduleKey: 'asset', module: 'Assets', gb: 195, highlight: true },
  { moduleKey: 'accounting', module: 'Accounting', gb: 140 },
  { moduleKey: 'hr', module: 'HR & Staff', gb: 68 },
  { moduleKey: 'payroll', module: 'Payroll', gb: 120 },
  { moduleKey: 'procurement', module: 'Procurement', gb: 260 },
  { moduleKey: 'pos', module: 'POS Register', gb: 95 },
  { moduleKey: 'clinic', module: 'Clinic OPD', gb: 155 },
  { moduleKey: 'cms', module: 'Website CMS', gb: 220 },
];

// All module uptime records
const allModuleUptime = [
  { moduleKey: 'inventory', module: 'Inventory Engine', uptime: '99.9%', ok: true },
  { moduleKey: 'sales', module: 'Sales & Invoicing', uptime: '99.8%', ok: true },
  { moduleKey: 'asset', module: 'Assets & Equipment', uptime: '99.7%', ok: true },
  { moduleKey: 'accounting', module: 'Accounting Sync', uptime: '98.5%', ok: true },
  { moduleKey: 'hr', module: 'HR Module', uptime: '99.2%', ok: true },
  { moduleKey: 'payroll', module: 'Payroll Engine', uptime: '99.9%', ok: true },
  { moduleKey: 'procurement', module: 'Procurement Sync', uptime: '97.2%', ok: true },
  { moduleKey: 'pos', module: 'POS Registers', uptime: '99.8%', ok: true },
  { moduleKey: 'clinic', module: 'Clinic Services', uptime: '99.5%', ok: true },
  { moduleKey: 'cms', module: 'Website CMS Sync', uptime: '100%', ok: true },
];

// Specific module chart datasets
const assetChartData = [
  { category: 'Machinery', value: 240, maintenance: 8 },
  { category: 'Fitouts', value: 180, maintenance: 4 },
  { category: 'Vehicles', value: 115, maintenance: 6 },
  { category: 'IT & POS', value: 85, maintenance: 2 },
  { category: 'Furniture', value: 45, maintenance: 1 },
];

const inventoryChartData = [
  { month: 'Jan', stockIn: 4200, stockOut: 3800, inventoryVal: 185 },
  { month: 'Feb', stockIn: 4600, stockOut: 4100, inventoryVal: 195 },
  { month: 'Mar', stockIn: 5100, stockOut: 4700, inventoryVal: 210 },
  { month: 'Apr', stockIn: 4800, stockOut: 4600, inventoryVal: 205 },
  { month: 'May', stockIn: 5400, stockOut: 5200, inventoryVal: 225 },
  { month: 'Jun', stockIn: 6100, stockOut: 5800, inventoryVal: 240 },
];

const salesChartData = [
  { month: 'Jan', directSales: 32000, onlineOrders: 18000, invoices: 14000 },
  { month: 'Feb', directSales: 35000, onlineOrders: 21000, invoices: 16000 },
  { month: 'Mar', directSales: 41000, onlineOrders: 26000, invoices: 19000 },
  { month: 'Apr', directSales: 38000, onlineOrders: 24000, invoices: 18000 },
  { month: 'May', directSales: 48000, onlineOrders: 31000, invoices: 22000 },
  { month: 'Jun', directSales: 54000, onlineOrders: 36000, invoices: 27000 },
];

const posHourlyData = [
  { hour: '8 AM', khqr: 45, cash: 32, card: 12 },
  { hour: '10 AM', khqr: 120, cash: 65, card: 35 },
  { hour: '12 PM', khqr: 210, cash: 95, card: 70 },
  { hour: '2 PM', khqr: 140, cash: 60, card: 40 },
  { hour: '4 PM', khqr: 190, cash: 85, card: 55 },
  { hour: '6 PM', khqr: 240, cash: 110, card: 80 },
  { hour: '8 PM', khqr: 110, cash: 45, card: 25 },
];

const clinicActivityData = [
  { day: 'Mon', opd: 84, ipd: 14, pharmacy: 95 },
  { day: 'Tue', opd: 92, ipd: 16, pharmacy: 104 },
  { day: 'Wed', opd: 110, ipd: 19, pharmacy: 125 },
  { day: 'Thu', opd: 88, ipd: 12, pharmacy: 98 },
  { day: 'Fri', opd: 102, ipd: 18, pharmacy: 115 },
  { day: 'Sat', opd: 130, ipd: 22, pharmacy: 142 },
  { day: 'Sun', opd: 75, ipd: 10, pharmacy: 80 },
];

const cmsTrafficData = [
  { day: 'Mon', pageviews: 2450, qrScans: 620, articles: 480 },
  { day: 'Tue', pageviews: 3100, qrScans: 740, articles: 560 },
  { day: 'Wed', pageviews: 2950, qrScans: 810, articles: 510 },
  { day: 'Thu', pageviews: 3400, qrScans: 890, articles: 640 },
  { day: 'Fri', pageviews: 4200, qrScans: 1120, articles: 780 },
  { day: 'Sat', pageviews: 5600, qrScans: 1650, articles: 980 },
  { day: 'Sun', pageviews: 5200, qrScans: 1540, articles: 920 },
];

const accountingAgingData = [
  { bucket: 'Current', receivable: 142000, payable: 88000 },
  { bucket: '1-30 Days', receivable: 65000, payable: 42000 },
  { bucket: '31-60 Days', receivable: 28000, payable: 18000 },
  { bucket: '61-90 Days', receivable: 14000, payable: 8000 },
  { bucket: '90+ Days', receivable: 6500, payable: 3200 },
];

const MiniBars = ({ data, color }) => (
  <Flex align="flex-end" gap={3} style={{ height: 32 }}>
    {data.map((v, i) => (
      <div key={i} style={{ width: 4, height: v, borderRadius: 2, background: color, opacity: 0.35 + (i / data.length) * 0.65 }} />
    ))}
  </Flex>
);

const AdminDashboard = () => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const chartHeight = isMobile ? 220 : 260;

  const {
    moduleState,
    isModuleOpen,
    toggleModule,
    activeModulesCount,
    totalModulesCount,
  } = useAdminModules();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const [liveStats, setLiveStats] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`/api/admin/dashboard?range=${dateRange}`, { headers });
      if (res.data?.success && res.data?.data) {
        setDashboardData(res.data.data);
        setLiveStats(res.data.data.kpis);
        setRecentOrders(res.data.data.recentTransactions || []);
      } else if (res.data?.status) {
        setLiveStats(res.data.stats);
        setRecentOrders(res.data.recentOrders || []);
      }
    } catch (err) {
      console.warn('Dashboard stats fetch notice:', err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const c = {
    teal: adminTheme.systemTeal,
    orange: adminTheme.systemOrange,
    orangeSoft: adminTheme.systemOrangeSoft,
    green: '#16a34a',
    greenSoft: 'rgba(22,163,74,0.14)',
    red: '#dc2626',
    redSoft: 'rgba(220,38,38,0.14)',
    gold: '#f0b429',
    blue: '#2563eb',
    purple: '#7c3aed',
    dark: adminTheme.text,
  };

  const cardStyle = {
    borderRadius: 16,
    border: `1px solid ${adminTheme.border}`,
    background: adminTheme.card,
    height: '100%',
  };

  // Dynamically filter storage allocation and uptime based on OPEN modules
  const visibleStorage = useMemo(() => {
    return allStorageByModule.filter((m) => isModuleOpen(m.moduleKey));
  }, [isModuleOpen]);

  const maxStorage = useMemo(() => {
    if (!visibleStorage.length) return 100;
    return Math.max(...visibleStorage.map((m) => m.gb));
  }, [visibleStorage]);

  const visibleUptime = useMemo(() => {
    return allModuleUptime.filter((m) => isModuleOpen(m.moduleKey));
  }, [isModuleOpen]);

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      {/* 1. Dashboard Top Header & Switchboard Gateway */}
      <Flex justify="space-between" align={isMobile ? 'flex-start' : 'center'} wrap="wrap" gap={14}>
        <div>
          <Title level={4} style={{ margin: 0, color: adminTheme.text, fontSize: isMobile ? 19 : 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {t('erp_command_center_title', 'Aura ERP Command Center & Module Analytics')}
          </Title>
          <Text style={{ color: adminTheme.subtext, fontSize: isMobile ? 13.5 : 12.5, fontWeight: 500 }}>
            {t('live_telemetry_modules_active', 'Live telemetry • {active} of {total} Modules Active').replace('{active}', activeModulesCount).replace('{total}', totalModulesCount)}
          </Text>
        </div>

        <Flex gap={10} wrap="wrap" style={{ width: isMobile ? '100%' : 'auto', marginTop: isMobile ? 4 : 0 }}>
          {/* Main button to open Module Switchboard Page */}
          <Button
            type="primary"
            icon={<ControlOutlined />}
            onClick={() => navigate('/admins/modules')}
            style={{
              flex: isMobile ? '1 1 100%' : 'none',
              height: isMobile ? 42 : 36,
              fontSize: isMobile ? 14 : 13,
              fontWeight: 700,
              background: adminTheme.primary,
              borderColor: adminTheme.primary,
              borderRadius: 10,
              boxShadow: `0 2px 10px ${adminTheme.primary}44`,
            }}
          >
            {t('modules_switchboard', 'Modules Switchboard')} ({activeModulesCount}/{totalModulesCount})
          </Button>

          <Button
            icon={<GlobalOutlined />}
            onClick={() => navigate('/admins?module=data&section=dashboard')}
            style={{
              flex: isMobile ? '1 1 calc(50% - 5px)' : 'none',
              height: isMobile ? 38 : 36,
              fontSize: isMobile ? 13 : 12.5,
              fontWeight: 600,
              borderRadius: 10,
            }}
          >
            {t('website_cms', 'Website CMS')}
          </Button>

          <Button
            icon={<QrcodeOutlined />}
            onClick={() => navigate('/admins?module=data&section=qrcode')}
            style={{
              flex: isMobile ? '1 1 calc(50% - 5px)' : 'none',
              height: isMobile ? 38 : 36,
              fontSize: isMobile ? 13 : 12.5,
              fontWeight: 600,
              borderRadius: 10,
              borderColor: '#0284c7',
              color: '#0284c7',
            }}
          >
            {t('store_qr', 'Store QR')}
          </Button>

          <Tag
            icon={<CheckCircleFilled />}
            style={{
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'center' : 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              margin: 0,
              borderRadius: 8,
              border: 'none',
              background: c.greenSoft,
              color: c.green,
              padding: isMobile ? '8px 14px' : '6px 12px',
              fontSize: isMobile ? 13 : 12,
              fontWeight: 700,
            }}
          >
            {t('all_systems_healthy', 'All Systems Healthy')}
          </Tag>
        </Flex>
      </Flex>

      {/* 2. Top System KPI Cards */}
      <Row gutter={[16, 16]}>
        {baseKpiCards.map((item, idx) => {
          const displayVal = idx === 2 ? `${activeModulesCount} / ${totalModulesCount}` : (idx === 1 || idx === 3 ? t(item.value, item.value) : item.value);
          return (
            <Col xs={24} sm={12} xl={6} key={item.title}>
              <Card
                style={{
                  ...cardStyle,
                  borderRadius: 16,
                  boxShadow: adminTheme.isDark ? '0 4px 16px rgba(0, 0, 0, 0.25)' : '0 2px 10px rgba(15, 23, 42, 0.04)',
                }}
                styles={{ body: { padding: isMobile ? '18px 18px 16px' : 18 } }}
              >
                <Flex justify="space-between" align="flex-start">
                  <div>
                    <Text style={{ color: adminTheme.subtext, fontSize: isMobile ? 13.5 : 12.5, fontWeight: 600 }}>
                      {t(item.title, item.title)}
                    </Text>
                    <div style={{ margin: '5px 0 2px', color: adminTheme.text, fontSize: isMobile ? 26 : 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                      {displayVal}
                    </div>
                    <Text style={{ color: adminTheme.subtext, fontSize: isMobile ? 12.5 : 11.5, fontWeight: 500 }}>
                      {t(item.sub, item.sub)}
                    </Text>
                  </div>
                  <div
                    style={{
                      width: isMobile ? 42 : 36,
                      height: isMobile ? 42 : 36,
                      borderRadius: 12,
                      background: `${c[item.colorKey]}1a`,
                      color: c[item.colorKey],
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: isMobile ? 20 : 17,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                </Flex>
                <div style={{ marginTop: 12 }}>
                  <MiniBars data={item.bars} color={c[item.colorKey]} />
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* 3b. Live ERP Core KPIs (Direct from MySQL aura_v1_db) */}
      <Card style={cardStyle} styles={{ body: { padding: 22 } }}>
        {/* Top Header: Title + Date Range Selector + Refresh */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 18 }}>
          <div>
            <Title level={5} style={{ margin: 0, color: adminTheme.text, fontWeight: 700 }}>
              📊 {t('live_erp_telemetry_performance', 'Live ERP Telemetry & Performance')}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
              {t('centralized_operational_data_desc', 'Centralized operational data aggregated solely across MySQL tables (Single source: aura_users)')}
            </Text>
          </div>

          <Flex align="center" gap={8} wrap="wrap">
            {/* Date-Range Preset Filter */}
            <Space size={4}>
              {[
                { key: 'today', label: t('today', 'Today') },
                { key: '7d', label: t('7_days', '7 Days') },
                { key: 'month', label: t('this_month', 'This Month') },
                { key: 'all', label: t('all_time', 'All Time') },
              ].map(p => (
                <Button
                  key={p.key}
                  size="small"
                  type={dateRange === p.key ? 'primary' : 'default'}
                  onClick={() => setDateRange(p.key)}
                  style={{
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    ...(dateRange === p.key ? { background: '#2563eb' } : { borderColor: adminTheme.border })
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </Space>

            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={loadingStats}
              onClick={fetchStats}
              style={{ borderRadius: 8, fontSize: 12 }}
            >
              {t('refresh', 'Refresh')}
            </Button>
          </Flex>
        </Flex>

        {/* Quick Action Buttons */}
        <div style={{ marginBottom: 18, padding: '10px 14px', background: adminTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)', borderRadius: 12, border: `1px solid ${adminTheme.border}` }}>
          <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: adminTheme.subtext }}>
              ⚡ {t('quick_actions', 'Quick Actions')}:
            </Text>
            <Space size={8} wrap>
              <Button
                size="small"
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => navigate('/admins/orders')}
                style={{ background: '#2563eb', borderRadius: 8, fontSize: 12, fontWeight: 600 }}
              >
                + {t('new_sale', 'New Sale')}
              </Button>
              <Button
                size="small"
                icon={<ReconciliationOutlined />}
                onClick={() => navigate('/admins?module=procurement')}
                style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}
              >
                + {t('new_purchase', 'New Purchase')}
              </Button>
              <Button
                size="small"
                icon={<AppstoreOutlined />}
                onClick={() => navigate('/admins/products')}
                style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}
              >
                + {t('add_product', 'Add Product')}
              </Button>
              <Button
                size="small"
                icon={<TeamOutlined />}
                onClick={() => navigate('/admins/settings/users')}
                style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}
              >
                + {t('add_user', 'Add User')}
              </Button>
            </Space>
          </Flex>
        </div>

        {/* Soft-Tinted KPI Grid */}
        <Row gutter={[16, 16]}>
          {/* Card 1: Sales Revenue */}
          <Col xs={24} sm={12} xl={6}>
            <div style={{
              padding: isMobile ? '16px 14px' : '16px',
              background: adminTheme.isDark ? 'rgba(22, 163, 74, 0.12)' : '#f0fdf4',
              borderRadius: 14,
              border: '1px solid rgba(22, 163, 74, 0.22)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                <Text style={{ color: '#15803d', fontSize: isMobile ? 13 : 12, fontWeight: 700 }}>{t('sales', 'Sales Revenue')}</Text>
                <Tag color="green" style={{ borderRadius: 6, margin: 0, fontWeight: 700, fontSize: 11 }}>+14.2%</Tag>
              </Flex>
              <div style={{ margin: '2px 0 4px', color: '#16a34a', fontWeight: 800, fontSize: isMobile ? 24 : 22, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {formatCurrency(liveStats?.revenue?.value || liveStats?.totalRevenue || 117000)}
              </div>
              <Text style={{ fontSize: isMobile ? 12 : 11.5, color: adminTheme.subtext, fontWeight: 500 }}>
                {liveStats?.orders?.value || liveStats?.totalSales || 384} {t('orders', 'wholesale orders')}
              </Text>
            </div>
          </Col>

          {/* Card 2: Procurement Spend */}
          <Col xs={24} sm={12} xl={6}>
            <div style={{
              padding: isMobile ? '16px 14px' : '16px',
              background: adminTheme.isDark ? 'rgba(2, 132, 199, 0.12)' : '#f0f9ff',
              borderRadius: 14,
              border: '1px solid rgba(2, 132, 199, 0.22)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                <Text style={{ color: '#0369a1', fontSize: isMobile ? 13 : 12, fontWeight: 700 }}>{t('purchases', 'Procurement Spend')}</Text>
                <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 700, fontSize: 11 }}>-3.8%</Tag>
              </Flex>
              <div style={{ margin: '2px 0 4px', color: '#0284c7', fontWeight: 800, fontSize: isMobile ? 24 : 22, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {formatCurrency(liveStats?.purchases?.value || 61000)}
              </div>
              <Text style={{ fontSize: isMobile ? 12 : 11.5, color: adminTheme.subtext, fontWeight: 500 }}>
                {t('suppliers', 'Supplier purchase settlements')}
              </Text>
            </div>
          </Col>

          {/* Card 3: Commercial Network (Buyers & Suppliers) */}
          <Col xs={24} sm={12} xl={6}>
            <div style={{
              padding: isMobile ? '16px 14px' : '16px',
              background: adminTheme.isDark ? 'rgba(124, 58, 237, 0.12)' : '#f5f3ff',
              borderRadius: 14,
              border: '1px solid rgba(124, 58, 237, 0.22)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                <Text style={{ color: '#6d28d9', fontSize: isMobile ? 13 : 12, fontWeight: 700 }}>{t('customers', 'B2B Network')}</Text>
                <Tag color="purple" style={{ borderRadius: 6, margin: 0, fontWeight: 700, fontSize: 11 }}>{t('active', 'Live')}</Tag>
              </Flex>
              <div style={{ margin: '2px 0 4px', color: '#7c3aed', fontWeight: 800, fontSize: isMobile ? 24 : 22, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {liveStats?.customers?.value || 35} / {liveStats?.suppliers?.value || 9}
              </div>
              <Text style={{ fontSize: isMobile ? 12 : 11.5, color: adminTheme.subtext, fontWeight: 500 }}>
                {liveStats?.customers?.value || 35} {t('customers', 'Buyers')} &bull; {liveStats?.suppliers?.value || 9} {t('suppliers', 'Suppliers')}
              </Text>
            </div>
          </Col>

          {/* Card 4: Inventory & Operations */}
          <Col xs={24} sm={12} xl={6}>
            <div style={{
              padding: isMobile ? '16px 14px' : '16px',
              background: adminTheme.isDark ? 'rgba(234, 88, 12, 0.12)' : '#fff7ed',
              borderRadius: 14,
              border: '1px solid rgba(234, 88, 12, 0.22)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                <Text style={{ color: '#c2410c', fontSize: isMobile ? 13 : 12, fontWeight: 700 }}>{t('inventory', 'Stock Valuation')}</Text>
                <Tag color="orange" style={{ borderRadius: 6, margin: 0, fontWeight: 700, fontSize: 11 }}>12.4K Units</Tag>
              </Flex>
              <div style={{ margin: '2px 0 4px', color: '#ea580c', fontWeight: 800, fontSize: isMobile ? 24 : 22, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {formatCurrency(liveStats?.stockValuation?.value || 665000)}
              </div>
              <Text style={{ fontSize: isMobile ? 12 : 11.5, color: adminTheme.subtext, fontWeight: 500 }}>
                {liveStats?.products?.value || liveStats?.totalProducts || 12450} {t('products', 'Catalog SKUs')}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 4. Filter Toolbar for Module Charts */}
      <Card style={cardStyle} styles={{ body: { padding: '12px 18px' } }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
          <Flex align="center" gap={8}>
            <Text strong style={{ color: adminTheme.text, fontSize: 13 }}>
              {t('filter', 'Filter Module Charts')}:
            </Text>
            <Space size={6} wrap>
              {[
                { key: 'all', label: `${t('all', 'All Active')} (${activeModulesCount})` },
                { key: 'operations', label: t('operations', 'Operations & Assets') },
                { key: 'commerce', label: t('pos', 'Commerce & POS') },
                { key: 'health', label: t('clinic', 'Clinic OPD') },
                { key: 'finance', label: t('finance_banking', 'Finance & Accounting') },
                { key: 'content', label: t('cms', 'Digital CMS') },
              ].map((f) => (
                <Button
                  key={f.key}
                  size="small"
                  type={activeCategoryFilter === f.key ? 'primary' : 'default'}
                  onClick={() => setActiveCategoryFilter(f.key)}
                  style={{
                    borderRadius: 8,
                    fontSize: 12,
                    ...(activeCategoryFilter === f.key ? { background: '#2563eb' } : {}),
                  }}
                >
                  {f.label}
                </Button>
              ))}
            </Space>
          </Flex>

          <Button
            type="link"
            size="small"
            icon={<ControlOutlined />}
            onClick={() => navigate('/admins/modules')}
            style={{ fontWeight: 600 }}
          >
            Configure Open/Close Switches
          </Button>
        </Flex>
      </Card>

      {/* ==================================================================== */}
      {/* 5. MODULE DATA CHARTS (Dynamically Rendered / Hidden When Closed)    */}
      {/* ==================================================================== */}

      <Row gutter={[16, 16]}>
        {/* ------------------------------------------------------------------ */}
        {/* A. ASSETS MODULE CHART                                            */}
        {/* Ex: If Assets is closed, this entire card is completely hidden!   */}
        {/* ------------------------------------------------------------------ */}
        {isModuleOpen('asset') && (activeCategoryFilter === 'all' || activeCategoryFilter === 'operations') && (
          <Col xs={24} xl={12}>
            <Card
              style={cardStyle}
              styles={{ body: { padding: 20 } }}
              title={
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={8}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#4567ff18', color: '#4567ff', display: 'grid', placeItems: 'center' }}>
                      <BuildOutlined />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: adminTheme.text }}>Fixed Assets &amp; Equipment Valuation</span>
                      <Text style={{ display: 'block', fontSize: 11.5, color: adminTheme.subtext, fontWeight: 'normal' }}>
                        Asset master records, depreciation &amp; maintenance
                      </Text>
                    </div>
                  </Flex>
                  <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700 }}>
                    Assets Active
                  </Tag>
                </Flex>
              }
            >
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Total Asset Value</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>$665,000</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Tracked Assets</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#2563eb' }}>684 Units</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Maintenance Due</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#ea580c' }}>4 Items</Title>
                </Col>
              </Row>

              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={assetChartData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: `1px solid ${adminTheme.border}`, background: adminTheme.card, color: adminTheme.text }}
                    formatter={(val, name) => [name === 'value' ? `$${val}k Valuation` : `${val} Scheduled`, name === 'value' ? 'Net Book Value' : 'Maintenance']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar dataKey="value" name="Net Book Value ($K)" fill="#4567ff" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="maintenance" name="Maintenance Cycles" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* B. INVENTORY MODULE CHART                                         */}
        {/* ------------------------------------------------------------------ */}
        {isModuleOpen('inventory') && (activeCategoryFilter === 'all' || activeCategoryFilter === 'operations') && (
          <Col xs={24} xl={12}>
            <Card
              style={cardStyle}
              styles={{ body: { padding: 20 } }}
              title={
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={8}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0a84ff18', color: '#0a84ff', display: 'grid', placeItems: 'center' }}>
                      <AppstoreOutlined />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: adminTheme.text }}>Inventory Movement &amp; Stock Flow</span>
                      <Text style={{ display: 'block', fontSize: 11.5, color: adminTheme.subtext, fontWeight: 'normal' }}>
                        Inbound receiving, outbound dispatch &amp; stock valuation
                      </Text>
                    </div>
                  </Flex>
                  <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700 }}>
                    Inventory Active
                  </Tag>
                </Flex>
              }
            >
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Stock SKUs</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>12,450</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Stock In (Mo.)</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#16a34a' }}>6,100 pcs</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Low Stock Warning</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#dc2626' }}>12 SKUs</Title>
                </Col>
              </Row>

              <ResponsiveContainer width="100%" height={chartHeight}>
                <ComposedChart data={inventoryChartData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${adminTheme.border}`, background: adminTheme.card, color: adminTheme.text }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar dataKey="stockIn" name="Stock Inbound (Units)" fill="#0a84ff" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="stockOut" name="Stock Dispatched" stroke="#ea580c" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* C. SALES & ORDERS MODULE CHART                                    */}
        {/* ------------------------------------------------------------------ */}
        {isModuleOpen('sales') && (activeCategoryFilter === 'all' || activeCategoryFilter === 'commerce') && (
          <Col xs={24} xl={12}>
            <Card
              style={cardStyle}
              styles={{ body: { padding: 20 } }}
              title={
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={8}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#18a95718', color: '#18a957', display: 'grid', placeItems: 'center' }}>
                      <ShoppingCartOutlined />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: adminTheme.text }}>Commercial Sales &amp; Invoices</span>
                      <Text style={{ display: 'block', fontSize: 11.5, color: adminTheme.subtext, fontWeight: 'normal' }}>
                        Invoiced revenue, storefront orders &amp; dispatch
                      </Text>
                    </div>
                  </Flex>
                  <Tag color="green" style={{ borderRadius: 6, fontWeight: 700 }}>
                    Sales Active
                  </Tag>
                </Flex>
              }
            >
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Monthly Gross</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>$117,000</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Online Growth</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#16a34a' }}>+28.4%</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Active Orders</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#2563eb' }}>384</Title>
                </Col>
              </Row>

              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={salesChartData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: `1px solid ${adminTheme.border}`, background: adminTheme.card, color: adminTheme.text }}
                    formatter={(val) => [`$${val.toLocaleString()}`, 'Revenue']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Area type="monotone" dataKey="directSales" name="Direct Sales ($)" stroke="#18a957" fill="#18a957" fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="onlineOrders" name="Online & TMA ($)" stroke="#0a84ff" fill="#0a84ff" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* D. POINT OF SALE (POS) MODULE CHART                                */}
        {/* ------------------------------------------------------------------ */}
        {isModuleOpen('pos') && (activeCategoryFilter === 'all' || activeCategoryFilter === 'commerce') && (
          <Col xs={24} xl={12}>
            <Card
              style={cardStyle}
              styles={{ body: { padding: 20 } }}
              title={
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={8}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f2994a18', color: '#f2994a', display: 'grid', placeItems: 'center' }}>
                      <CreditCardOutlined />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: adminTheme.text }}>POS Cashier Velocity &amp; Payment Mix</span>
                      <Text style={{ display: 'block', fontSize: 11.5, color: adminTheme.subtext, fontWeight: 'normal' }}>
                        Live register throughput: Bakong KHQR, Cash &amp; Cards
                      </Text>
                    </div>
                  </Flex>
                  <Tag color="orange" style={{ borderRadius: 6, fontWeight: 700 }}>
                    POS Active
                  </Tag>
                </Flex>
              }
            >
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Active Registers</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>14 Lanes</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Bakong KHQR Mix</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#2563eb' }}>62%</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Peak Speed</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#16a34a' }}>240 tx/hr</Title>
                </Col>
              </Row>

              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={posHourlyData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${adminTheme.border}`, background: adminTheme.card, color: adminTheme.text }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar dataKey="khqr" name="Bakong KHQR" fill="#0284c7" stackId="a" />
                  <Bar dataKey="cash" name="Cash" fill="#16a34a" stackId="a" />
                  <Bar dataKey="card" name="Card" fill="#f59e0b" stackId="a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* E. CLINIC & HEALTHCARE MODULE CHART                                */}
        {/* ------------------------------------------------------------------ */}
        {isModuleOpen('clinic') && (activeCategoryFilter === 'all' || activeCategoryFilter === 'health') && (
          <Col xs={24} xl={12}>
            <Card
              style={cardStyle}
              styles={{ body: { padding: 20 } }}
              title={
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={8}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ef5b5b18', color: '#ef5b5b', display: 'grid', placeItems: 'center' }}>
                      <MedicineBoxOutlined />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: adminTheme.text }}>Clinic Patient Flow &amp; Pharmacy</span>
                      <Text style={{ display: 'block', fontSize: 11.5, color: adminTheme.subtext, fontWeight: 'normal' }}>
                        OPD consultations, IPD bed admissions &amp; pharmacy
                      </Text>
                    </div>
                  </Flex>
                  <Tag color="volcano" style={{ borderRadius: 6, fontWeight: 700 }}>
                    Clinic Active
                  </Tag>
                </Flex>
              }
            >
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Patients Today</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>184</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Bed Occupancy</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#2563eb' }}>86%</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Prescriptions</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#16a34a' }}>142</Title>
                </Col>
              </Row>

              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={clinicActivityData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${adminTheme.border}`, background: adminTheme.card, color: adminTheme.text }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar dataKey="opd" name="OPD Visits" fill="#ef5b5b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ipd" name="IPD Inpatients" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pharmacy" name="Pharmacy Issues" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* F. WEBSITE CMS & STOREFRONT ENGAGEMENT CHART                       */}
        {/* ------------------------------------------------------------------ */}
        {isModuleOpen('cms') && (activeCategoryFilter === 'all' || activeCategoryFilter === 'content') && (
          <Col xs={24} xl={12}>
            <Card
              style={cardStyle}
              styles={{ body: { padding: 20 } }}
              title={
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={8}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#2563eb18', color: '#2563eb', display: 'grid', placeItems: 'center' }}>
                      <GlobalOutlined />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: adminTheme.text }}>Website CMS &amp; Store QR Scans</span>
                      <Text style={{ display: 'block', fontSize: 11.5, color: adminTheme.subtext, fontWeight: 'normal' }}>
                        Live visitor traffic, store counter scans &amp; blog readership
                      </Text>
                    </div>
                  </Flex>
                  <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700 }}>
                    CMS Active
                  </Tag>
                </Flex>
              }
            >
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Weekly Visits</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>26,850</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>QR Menu Scans</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#2563eb' }}>7,420</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Khmer Reader %</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#16a34a' }}>54%</Title>
                </Col>
              </Row>

              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={cmsTrafficData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${adminTheme.border}`, background: adminTheme.card, color: adminTheme.text }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Area type="monotone" dataKey="pageviews" name="Pageviews" stroke="#2563eb" fill="#2563eb" fillOpacity={0.16} strokeWidth={2} />
                  <Area type="monotone" dataKey="qrScans" name="Store QR Scans" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.12} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* G. ACCOUNTING & AR/AP AGING CHART                                  */}
        {/* ------------------------------------------------------------------ */}
        {isModuleOpen('accounting') && (activeCategoryFilter === 'all' || activeCategoryFilter === 'finance') && (
          <Col xs={24} xl={12}>
            <Card
              style={cardStyle}
              styles={{ body: { padding: 20 } }}
              title={
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={8}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#5b6cff18', color: '#5b6cff', display: 'grid', placeItems: 'center' }}>
                      <BankOutlined />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: adminTheme.text }}>Accounting AR/AP Aging &amp; Liquidity</span>
                      <Text style={{ display: 'block', fontSize: 11.5, color: adminTheme.subtext, fontWeight: 'normal' }}>
                        Customer receivables vs supplier payables schedule
                      </Text>
                    </div>
                  </Flex>
                  <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 700 }}>
                    Accounting Active
                  </Tag>
                </Flex>
              }
            >
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Open Receivables</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#16a34a' }}>$255,500</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Open Payables</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#ea580c' }}>$159,200</Title>
                </Col>
                <Col span={8}>
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>Net Liquidity</Text>
                  <Title level={4} style={{ margin: '2px 0 0', color: '#2563eb' }}>+$96,300</Title>
                </Col>
              </Row>

              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={accountingAgingData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: adminTheme.subtext }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: `1px solid ${adminTheme.border}`, background: adminTheme.card, color: adminTheme.text }}
                    formatter={(val) => [`$${val.toLocaleString()}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar dataKey="receivable" name="Receivable (AR)" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="payable" name="Payable (AP)" fill="#dc2626" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}
      </Row>

      {/* ==================================================================== */}
      {/* 6. CROSS-MODULE SYSTEM TELEMETRY (Storage & Uptime)                 */}
      {/* Dynamic rows: ONLY open modules appear here!                        */}
      {/* ==================================================================== */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card style={cardStyle} styles={{ body: { padding: 20 } }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
              <Flex align="center" gap={8}>
                <DatabaseOutlined style={{ color: c.teal }} />
                <Title level={5} style={{ margin: 0, color: adminTheme.text }}>
                  Storage Allocation by Active Modules (GB)
                </Title>
              </Flex>
              <Text style={{ fontSize: 12, color: adminTheme.subtext }}>
                {visibleStorage.length} Active Modules Tracked
              </Text>
            </Flex>

            {visibleStorage.length > 0 ? (
              <Row gutter={[10, 10]}>
                {visibleStorage.map((item) => (
                  <Col xs={12} sm={8} md={6} lg={Math.max(3, Math.floor(24 / Math.max(1, visibleStorage.length)))} key={item.moduleKey}>
                    <Flex vertical align="center" gap={8}>
                      <div
                        style={{
                          width: '100%',
                          height: 150,
                          borderRadius: 10,
                          background: adminTheme.cardMuted,
                          position: 'relative',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'flex-end',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: `${(item.gb / maxStorage) * 100}%`,
                            background: item.highlight ? c.orange : c.teal,
                            borderRadius: '10px 10px 0 0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            paddingTop: 8,
                          }}
                        >
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>
                            {item.gb} GB
                          </Text>
                        </div>
                      </div>
                      <Text style={{ color: adminTheme.subtext, fontSize: 11, textAlign: 'center' }}>
                        {item.module}
                      </Text>
                    </Flex>
                  </Col>
                ))}
              </Row>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: adminTheme.subtext }}>
                No active modules configured. Open modules in the Switchboard.
              </div>
            )}

            {/* Module Uptime Grid (Only Active Modules) */}
            <Row gutter={[10, 10]} style={{ marginTop: 20 }}>
              {visibleUptime.map((item) => (
                <Col xs={24} sm={12} md={8} key={item.moduleKey}>
                  <Flex
                    justify="space-between"
                    align="center"
                    style={{ padding: '10px 12px', borderRadius: 10, background: adminTheme.cardMuted }}
                  >
                    <div>
                      <Text style={{ color: adminTheme.text, fontSize: 12, fontWeight: 600, display: 'block' }}>
                        {item.module}
                      </Text>
                      <Text style={{ color: adminTheme.subtext, fontSize: 11 }}>Uptime: {item.uptime}</Text>
                    </div>
                    {item.ok ? (
                      <CheckCircleFilled style={{ color: c.green, fontSize: 15 }} />
                    ) : (
                      <ExclamationCircleFilled style={{ color: c.red, fontSize: 15 }} />
                    )}
                  </Flex>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Quick Actions & Security */}
        <Col xs={24} xl={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card style={cardStyle} styles={{ body: { padding: 20 } }}>
              <Flex align="center" gap={8} style={{ marginBottom: 14 }}>
                <ControlOutlined style={{ color: '#2563eb' }} />
                <Title level={5} style={{ margin: 0, color: adminTheme.text }}>
                  ERP Modules Switchboard
                </Title>
              </Flex>
              <Text style={{ color: adminTheme.subtext, fontSize: 12, display: 'block', marginBottom: 12 }}>
                Quickly toggle features on or off. Disabled modules immediately disappear from the sidebar menu and dashboard charts.
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {erpModules.slice(0, 5).map((m) => {
                  const isOpen = isModuleOpen(m.key);
                  return (
                    <Flex
                      key={m.key}
                      justify="space-between"
                      align="center"
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: adminTheme.cardMuted,
                      }}
                    >
                      <Flex align="center" gap={8}>
                        <span style={{ color: m.accent || '#2563eb', fontWeight: 600, fontSize: 13 }}>
                          {m.label}
                        </span>
                        {m.key === 'asset' && (
                          <Tag color="purple" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                            Assets
                          </Tag>
                        )}
                      </Flex>
                      <Button
                        size="small"
                        type={isOpen ? 'text' : 'primary'}
                        style={
                          isOpen
                            ? { color: '#16a34a', fontWeight: 700, fontSize: 11 }
                            : { background: '#ea580c', borderColor: '#ea580c', fontSize: 11, borderRadius: 6 }
                        }
                        onClick={() => toggleModule(m.key, !isOpen)}
                      >
                        {isOpen ? 'ACTIVE' : 'RE-OPEN'}
                      </Button>
                    </Flex>
                  );
                })}
              </div>

              <Button
                block
                type="dashed"
                icon={<ControlOutlined />}
                onClick={() => navigate('/admins/modules')}
                style={{ marginTop: 14, borderRadius: 8, fontWeight: 600 }}
              >
                Open Full Switchboard ({totalModulesCount} Modules)
              </Button>
            </Card>

            <Card style={cardStyle} styles={{ body: { padding: 20 } }}>
              <Flex align="center" gap={8} style={{ marginBottom: 14 }}>
                <CloudSyncOutlined style={{ color: c.teal }} />
                <Title level={5} style={{ margin: 0, color: adminTheme.text }}>Quick IT Actions</Title>
              </Flex>
              <Row gutter={[10, 14]}>
                {[
                  { label: 'Restart ERP', icon: <ReloadOutlined /> },
                  { label: 'Sync Inventory', icon: <SyncOutlined /> },
                  { label: 'Clear Cache', icon: <DeleteOutlined /> },
                  { label: 'Schedule Run', icon: <ScheduleOutlined /> },
                  { label: 'Stop Jobs', icon: <PauseCircleOutlined /> },
                  { label: 'Audit Assets', icon: <BuildOutlined /> },
                ].map((action) => (
                  <Col span={8} key={action.label}>
                    <Flex vertical align="center" gap={6}>
                      <Button
                        shape="circle"
                        icon={action.icon}
                        style={{ width: 42, height: 42, background: c.dark, color: adminTheme.card, border: 'none', fontSize: 15 }}
                      />
                      <Text style={{ color: adminTheme.subtext, fontSize: 10.5, textAlign: 'center', lineHeight: 1.2 }}>
                        {action.label}
                      </Text>
                    </Flex>
                  </Col>
                ))}
              </Row>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
};

export default AdminDashboard;
