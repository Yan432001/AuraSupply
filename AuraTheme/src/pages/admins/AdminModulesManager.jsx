import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Switch,
  Typography,
  Tag,
  Input,
  Button,
  Space,
  Flex,
  Badge,
  Alert,
  Tooltip,
  Divider,
  Statistic,
  Modal,
  Form,
  Collapse,
  message,
  Popconfirm
} from 'antd';
import {
  AppstoreOutlined,
  BuildOutlined,
  MedicineBoxOutlined,
  ReconciliationOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  MoneyCollectOutlined,
  HomeOutlined,
  BankOutlined,
  TeamOutlined,
  FileTextOutlined,
  GlobalOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  ExclamationCircleOutlined,
  SlidersOutlined,
  LockOutlined,
  UnlockOutlined,
  ApartmentOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { erpModules } from '../../data/erpModules';
import { useAdminModules } from '../../hooks/useAdminModules';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;

const moduleIconMap = {
  clinic: MedicineBoxOutlined,
  inventory: AppstoreOutlined,
  asset: BuildOutlined,
  procurement: ReconciliationOutlined,
  sales: ShoppingCartOutlined,
  pos: CreditCardOutlined,
  loans: MoneyCollectOutlined,
  property: HomeOutlined,
  accounting: BankOutlined,
  hr: TeamOutlined,
  payroll: FileTextOutlined,
  reports: FileTextOutlined,
  settings: SettingOutlined,
  'front-end': GlobalOutlined,
  cms: GlobalOutlined,
  crm: TeamOutlined
};

const moduleCategories = {
  asset: 'Core Operations',
  inventory: 'Core Operations',
  procurement: 'Core Operations',
  sales: 'Commerce & Orders',
  pos: 'Commerce & Orders',
  'front-end': 'Commerce & Orders',
  crm: 'Commerce & Orders',
  clinic: 'Healthcare & Clinical',
  accounting: 'Finance & Banking',
  loans: 'Finance & Banking',
  property: 'Real Estate & Property',
  hr: 'Human Resources',
  payroll: 'Human Resources',
  cms: 'Digital Content',
  reports: 'Analytics & Audits',
  settings: 'System Administration'
};

const categoryOrder = [
  'Core Operations',
  'Commerce & Orders',
  'Finance & Banking',
  'Healthcare & Clinical',
  'Human Resources',
  'Real Estate & Property',
  'Digital Content',
  'Analytics & Audits',
  'System Administration'
];

const categoryColors = {
  'Core Operations': { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  'Commerce & Orders': { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  'Finance & Banking': { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' },
  'Healthcare & Clinical': { bg: '#fdf2f8', border: '#fbcfe8', text: '#be185d' },
  'Human Resources': { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
  'Real Estate & Property': { bg: '#fefce8', border: '#fef08a', text: '#a16207' },
  'Digital Content': { bg: '#f0fdfa', border: '#99f6e4', text: '#0f766e' },
  'Analytics & Audits': { bg: '#f8fafc', border: '#cbd5e1', text: '#334155' },
  'System Administration': { bg: '#f1f5f9', border: '#94a3b8', text: '#1e293b' }
};

const AdminModulesManager = () => {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const {
    moduleState,
    isModuleOpen,
    toggleModule: contextToggleModule,
    enableAllModules,
    disableAllModules,
    resetModules,
    activeModulesCount,
    totalModulesCount
  } = useAdminModules();

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'open' | 'closed'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Backend Live Modules & License State
  const [dbModules, setDbModules] = useState([]);
  const [submoduleStates, setSubmoduleStates] = useState({});
  const [licenseData, setLicenseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [licenseForm] = Form.useForm();

  // Confirmation Modal State for Disabling a Module
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingDisableModule, setPendingDisableModule] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch modules and license from API
  const fetchModuleData = async () => {
    setLoading(true);
    try {
      const [modRes, licRes] = await Promise.allSettled([
        axios.get('/api/admin/modules', { headers: getAuthHeader() }),
        axios.get('/api/admin/modules/license', { headers: getAuthHeader() })
      ]);

      if (modRes.status === 'fulfilled' && modRes.value.data?.success) {
        const fetched = modRes.value.data.data?.modules || [];
        setDbModules(fetched);

        // Populate submodule states
        const subMap = {};
        fetched.forEach((m) => {
          if (m.submodules) {
            m.submodules.forEach((s) => {
              subMap[s.key] = s.enabled;
            });
          }
        });
        setSubmoduleStates(subMap);
      }

      if (licRes.status === 'fulfilled' && licRes.value.data?.success) {
        setLicenseData(licRes.value.data.data);
      }
    } catch (err) {
      console.warn('Backend module API unavailable, using local registry:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleData();
  }, []);

  // Merge local registry with dbModules
  const mergedModules = useMemo(() => {
    if (dbModules && dbModules.length > 0) {
      return dbModules.map((dbMod) => {
        const localMod = erpModules.find((m) => m.key === dbMod.key) || {};
        return {
          ...localMod,
          ...dbMod,
          category: dbMod.category || moduleCategories[dbMod.key] || 'Core Operations',
          enabled: isModuleOpen(dbMod.key),
          submodules: dbMod.submodules || localMod.submodules || []
        };
      });
    }
    return erpModules.map((m) => ({
      ...m,
      category: moduleCategories[m.key] || 'Core Operations',
      enabled: isModuleOpen(m.key),
      submodules: m.submodules || []
    }));
  }, [dbModules, isModuleOpen]);

  // Filter modules
  const filteredModules = useMemo(() => {
    return mergedModules.filter((m) => {
      const isOpen = isModuleOpen(m.key);
      const cat = m.category || moduleCategories[m.key] || 'Core Operations';

      // Status filter
      if (selectedFilter === 'open' && !isOpen) return false;
      if (selectedFilter === 'closed' && isOpen) return false;

      // Category filter
      if (selectedCategory !== 'all' && cat !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesLabel = (m.label || '').toLowerCase().includes(query);
        const matchesDesc = (m.description || '').toLowerCase().includes(query);
        const matchesKey = (m.key || '').toLowerCase().includes(query);
        const matchesCat = cat.toLowerCase().includes(query);
        if (!matchesLabel && !matchesDesc && !matchesKey && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [mergedModules, isModuleOpen, selectedFilter, selectedCategory, searchQuery]);

  // Group modules by category
  const groupedModules = useMemo(() => {
    const groups = {};
    categoryOrder.forEach((cat) => {
      groups[cat] = [];
    });

    filteredModules.forEach((m) => {
      const cat = m.category || moduleCategories[m.key] || 'Core Operations';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });

    return groups;
  }, [filteredModules]);

  // Handle module toggle request
  const handleToggleRequest = (moduleKey, targetState) => {
    if (moduleKey === 'settings' && !targetState) {
      message.error('Security Rule: Core System Administration cannot be disabled.');
      return;
    }

    if (!targetState) {
      // Disabling -> Open confirmation modal previewing consequences
      const mod = mergedModules.find((m) => m.key === moduleKey);
      setPendingDisableModule(mod);
      setConfirmModalOpen(true);
    } else {
      // Enabling -> Apply immediately
      applyModuleToggle(moduleKey, true);
    }
  };

  const applyModuleToggle = async (moduleKey, enabled) => {
    contextToggleModule(moduleKey, enabled);
    try {
      await axios.post(
        '/api/admin/modules/toggle',
        { module_key: moduleKey, enabled },
        { headers: getAuthHeader() }
      );
      message.success(`Module '${moduleKey}' ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      // Fallback silently if offline, local state is already synced
    }
  };

  const confirmDisableModule = () => {
    if (pendingDisableModule) {
      applyModuleToggle(pendingDisableModule.key, false);
      setConfirmModalOpen(false);
      setPendingDisableModule(null);
    }
  };

  // Handle submodule toggle
  const handleSubmoduleToggle = async (subKey, checked) => {
    setSubmoduleStates((prev) => ({ ...prev, [subKey]: checked }));
    try {
      await axios.post(
        '/api/admin/modules/submodule/toggle',
        { sub_module_key: subKey, enabled: checked },
        { headers: getAuthHeader() }
      );
      message.success(`Sub-module '${subKey}' ${checked ? 'enabled' : 'disabled'}`);
    } catch (err) {
      // Local state preserved
    }
  };

  // License update submission
  const handleLicenseSubmit = async () => {
    try {
      const values = await licenseForm.validateFields();
      const res = await axios.post('/api/admin/modules/license', values, {
        headers: getAuthHeader()
      });
      if (res.data?.success) {
        message.success('Enterprise license verified and updated successfully!');
        setLicenseModalOpen(false);
        fetchModuleData();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update license key');
    }
  };

  const cardStyle = {
    borderRadius: 16,
    border: `1px solid ${adminTheme.border}`,
    background: adminTheme.card,
    height: '100%',
    transition: 'all 0.25s ease'
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* 1. Header & Quick Actions */}
      <Flex orientation="horizontal" justify="space-between" align="flex-start" wrap="wrap" gap={16}>
        <div>
          <Flex align="center" gap={10}>
            <Title level={3} style={{ margin: 0, color: adminTheme.text, fontWeight: 700 }}>
              ERP Modules &amp; Feature Switchboard
            </Title>
            <Tag color="blue" style={{ borderRadius: 8, fontWeight: 700, padding: '2px 10px' }}>
              Single Users Database &bull; Real-time Sync
            </Tag>
          </Flex>
          <Text style={{ color: adminTheme.subtext, fontSize: 13, marginTop: 4, display: 'block' }}>
            Configure active ERP modules, assign sub-module capabilities, and monitor your enterprise platform license. Changes synchronize instantly to the left navigation bar and operational dashboards.
          </Text>
        </div>

        <Space size={10} wrap>
          <Button
            icon={<DashboardOutlined />}
            onClick={() => navigate('/admins/dashboard')}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            Dashboard
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={enableAllModules}
            style={{ borderRadius: 10, fontWeight: 600, background: '#16a34a', borderColor: '#16a34a' }}
          >
            Enable All Modules
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={disableAllModules}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            Disable Non-Core
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              resetModules();
              fetchModuleData();
            }}
            loading={loading}
            style={{ borderRadius: 10 }}
          >
            Refresh
          </Button>
        </Space>
      </Flex>

      {/* 2. Enterprise License Banner Card */}
      <Card
        style={{
          borderRadius: 16,
          border: '1px solid #bfdbfe',
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.05)'
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row gutter={[20, 16]} align="middle">
          <Col xs={24} md={14}>
            <Flex align="center" gap={14}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: '#2563eb',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 26,
                  boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)'
                }}
              >
                <SafetyCertificateOutlined />
              </div>
              <div>
                <Flex align="center" gap={8} wrap="wrap">
                  <Text strong style={{ fontSize: 16, color: '#1e3a8a' }}>
                    {licenseData?.license_name || 'Aura Enterprise Supply B2B'}
                  </Text>
                  <Tag color="success" style={{ borderRadius: 8, fontWeight: 700, padding: '2px 8px' }}>
                    ACTIVE ENTERPRISE
                  </Tag>
                  <Tag color="blue" style={{ borderRadius: 8, fontWeight: 600 }}>
                    {licenseData?.domain || 'aurasupply.biz'}
                  </Tag>
                </Flex>
                <Text style={{ color: '#475569', fontSize: 12.5, display: 'block', marginTop: 3 }}>
                  License Key: <code>{licenseData?.license_key || 'AURA-ENT-2026-X892-PRO'}</code> &bull; Unlimited Users &amp; Unlimited Multi-warehouses
                </Text>
              </div>
            </Flex>
          </Col>

          <Col xs={24} md={10} style={{ textAlign: 'right' }}>
            <Flex justify="flex-end" align="center" gap={16} wrap="wrap">
              <div style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 11, color: '#64748b', display: 'block' }}>VALIDITY PERIOD</Text>
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                  Until Dec 31, 2030 ({licenseData?.days_remaining || 1700} days left)
                </Text>
              </div>
              <Button
                icon={<KeyOutlined />}
                onClick={() => {
                  licenseForm.setFieldsValue({
                    license_key: licenseData?.license_key || 'AURA-ENT-2026-X892-PRO',
                    license_name: licenseData?.license_name || 'Aura Enterprise Supply B2B'
                  });
                  setLicenseModalOpen(true);
                }}
                style={{
                  borderRadius: 10,
                  fontWeight: 600,
                  borderColor: '#2563eb',
                  color: '#2563eb'
                }}
              >
                Update License
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* 3. System Statistics Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Total ERP Modules</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: adminTheme.text }}>
              {totalModulesCount}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>Available business modules</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Flex justify="space-between" align="center">
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Active &amp; Operational</Text>
              <EyeOutlined style={{ color: '#16a34a', fontSize: 16 }} />
            </Flex>
            <Title level={2} style={{ margin: '4px 0 0', color: '#16a34a' }}>
              {activeModulesCount}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>Visible in navigation &amp; APIs</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Flex justify="space-between" align="center">
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Disabled / Dormant</Text>
              <EyeInvisibleOutlined style={{ color: '#ea580c', fontSize: 16 }} />
            </Flex>
            <Title level={2} style={{ margin: '4px 0 0', color: totalModulesCount - activeModulesCount > 0 ? '#ea580c' : adminTheme.subtext }}>
              {totalModulesCount - activeModulesCount}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>Excluded from sidebar</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Active System Footprint</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#2563eb' }}>
              {Math.round((activeModulesCount / totalModulesCount) * 100)}%
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>Operating capacity</Text>
          </Card>
        </Col>
      </Row>

      {/* 4. Search and Category Filter Toolbar */}
      <Card style={cardStyle} styles={{ body: { padding: '16px 20px' } }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
              placeholder="Search modules (e.g. Sales, Inventory, POS, Clinic)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: 10 }}
            />
          </Col>

          <Col xs={24} md={8}>
            <Flex gap={8} wrap="wrap">
              <Button
                type={selectedFilter === 'all' ? 'primary' : 'default'}
                onClick={() => setSelectedFilter('all')}
                style={{ borderRadius: 8, fontSize: 12.5 }}
              >
                All ({totalModulesCount})
              </Button>
              <Button
                type={selectedFilter === 'open' ? 'primary' : 'default'}
                onClick={() => setSelectedFilter('open')}
                style={{
                  borderRadius: 8,
                  fontSize: 12.5,
                  ...(selectedFilter === 'open' ? { background: '#16a34a', borderColor: '#16a34a' } : {})
                }}
              >
                Active ({activeModulesCount})
              </Button>
              <Button
                type={selectedFilter === 'closed' ? 'primary' : 'default'}
                onClick={() => setSelectedFilter('closed')}
                style={{
                  borderRadius: 8,
                  fontSize: 12.5,
                  ...(selectedFilter === 'closed' ? { background: '#ea580c', borderColor: '#ea580c' } : {})
                }}
              >
                Disabled ({totalModulesCount - activeModulesCount})
              </Button>
            </Flex>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Flex justify="flex-end" gap={6} wrap="wrap">
              <Tag.CheckableTag
                checked={selectedCategory === 'all'}
                onChange={() => setSelectedCategory('all')}
                style={{ borderRadius: 8, fontSize: 12, padding: '3px 10px' }}
              >
                ALL CATEGORIES
              </Tag.CheckableTag>
              {categoryOrder.map((cat) => (
                <Tag.CheckableTag
                  key={cat}
                  checked={selectedCategory === cat}
                  onChange={() => setSelectedCategory(cat)}
                  style={{ borderRadius: 8, fontSize: 12, padding: '3px 10px' }}
                >
                  {cat}
                </Tag.CheckableTag>
              ))}
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* 5. Categorized Modules Grid */}
      {categoryOrder.map((catName) => {
        const catModules = groupedModules[catName] || [];
        if (catModules.length === 0) return null;

        const catTheme = categoryColors[catName] || { bg: '#f8fafc', border: '#e2e8f0', text: '#334155' };

        return (
          <div key={catName} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                background: catTheme.bg,
                border: `1px solid ${catTheme.border}`,
                borderRadius: 12,
                marginBottom: 16
              }}
            >
              <ApartmentOutlined style={{ color: catTheme.text, fontSize: 16 }} />
              <Text strong style={{ color: catTheme.text, fontSize: 14 }}>
                {catName}
              </Text>
              <Tag style={{ borderRadius: 6, margin: 0, fontWeight: 700, fontSize: 11 }}>
                {catModules.length} module{catModules.length > 1 ? 's' : ''}
              </Tag>
            </div>

            <Row gutter={[16, 16]}>
              {catModules.map((m) => {
                const isOpen = isModuleOpen(m.key);
                const IconComponent = moduleIconMap[m.key] || AppstoreOutlined;

                return (
                  <Col xs={24} sm={12} lg={8} key={m.key}>
                    <Card
                      style={{
                        ...cardStyle,
                        borderColor: isOpen ? adminTheme.border : '#fed7aa',
                        opacity: isOpen ? 1 : 0.85,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      styles={{ body: { padding: 20 } }}
                    >
                      {/* Top Accent Line */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: isOpen ? (m.accent || '#2563eb') : '#cbd5e1'
                        }}
                      />

                      {/* Header with Icon, Name, and Switch */}
                      <Flex justify="space-between" align="flex-start" style={{ marginBottom: 12 }}>
                        <Flex align="center" gap={12}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              background: isOpen ? `${m.accent || '#2563eb'}18` : adminTheme.cardMuted,
                              color: isOpen ? (m.accent || '#2563eb') : adminTheme.subtext,
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 22,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <IconComponent />
                          </div>

                          <div>
                            <Title level={5} style={{ margin: 0, color: adminTheme.text }}>
                              {m.label}
                            </Title>
                            <Tag
                              color={isOpen ? 'green' : 'default'}
                              style={{
                                borderRadius: 6,
                                fontSize: 11,
                                marginTop: 4,
                                padding: '1px 8px',
                                fontWeight: 600
                              }}
                            >
                              {isOpen ? 'ACTIVE / OPEN' : 'DISABLED / HIDDEN'}
                            </Tag>
                          </div>
                        </Flex>

                        <Flex vertical align="flex-end" gap={4}>
                          <Switch
                            checked={isOpen}
                            onChange={(checked) => handleToggleRequest(m.key, checked)}
                            checkedChildren="ON"
                            unCheckedChildren="OFF"
                            style={{
                              background: isOpen ? '#16a34a' : '#94a3b8'
                            }}
                          />
                        </Flex>
                      </Flex>

                      {/* Description */}
                      <Paragraph
                        style={{
                          color: adminTheme.subtext,
                          fontSize: 12.5,
                          lineHeight: 1.5,
                          minHeight: 38,
                          marginBottom: 12
                        }}
                        ellipsis={{ rows: 2 }}
                      >
                        {m.description || 'Enterprise module managing core business functions and operations.'}
                      </Paragraph>

                      {/* Collapsible Sub-modules Section */}
                      {m.submodules && m.submodules.length > 0 && (
                        <Collapse
                          ghost
                          size="small"
                          style={{ marginBottom: 12, background: adminTheme.cardMuted, borderRadius: 10 }}
                          items={[
                            {
                              key: '1',
                              label: (
                                <Flex justify="space-between" align="center" style={{ width: '100%', paddingRight: 8 }}>
                                  <Text style={{ fontSize: 12, color: adminTheme.text, fontWeight: 600 }}>
                                    Sub-modules &amp; Capabilities ({m.submodules.length})
                                  </Text>
                                  <Badge count={m.submodules.filter((s) => submoduleStates[s.key] !== false).length} style={{ backgroundColor: '#2563eb' }} />
                                </Flex>
                              ),
                              children: (
                                <Space orientation="vertical" size={10} orientationMargin={0} style={{ width: '100%' }}>
                                  {m.submodules.map((sub) => {
                                    const subActive = submoduleStates[sub.key] !== false;
                                    return (
                                      <Flex orientation="horizontal" key={sub.key} justify="space-between" align="center">
                                        <div style={{ paddingRight: 8 }}>
                                          <Text style={{ fontSize: 12, fontWeight: 500, color: adminTheme.text, display: 'block' }}>
                                            {sub.label}
                                          </Text>
                                          {sub.description && (
                                            <Text style={{ fontSize: 11, color: adminTheme.subtext }}>
                                              {sub.description}
                                            </Text>
                                          )}
                                        </div>
                                        <Switch
                                          size="small"
                                          disabled={!isOpen}
                                          checked={subActive && isOpen}
                                          onChange={(checked) => handleSubmoduleToggle(sub.key, checked)}
                                        />
                                      </Flex>
                                    );
                                  })}
                                </Space>
                              )
                            }
                          ]}
                        />
                      )}

                      {/* Footer Actions */}
                      <Divider style={{ margin: '10px 0' }} />
                      <Flex justify="space-between" align="center">
                        <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>
                          Key: <code>{m.key}</code>
                        </Text>
                        {isOpen ? (
                          <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/admins?module=${m.key}`)}
                            style={{ padding: 0, fontWeight: 600, color: m.accent || '#2563eb' }}
                          >
                            Explore Module
                          </Button>
                        ) : (
                          <Text type="secondary" style={{ fontSize: 11.5, fontStyle: 'italic' }}>
                            Inactive in Sidebar
                          </Text>
                        )}
                      </Flex>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        );
      })}

      {/* Confirmation Modal before Disabling a Module */}
      <Modal
        title={
          <Flex align="center" gap={8} style={{ color: '#dc2626' }}>
            <ExclamationCircleOutlined />
            <span>Confirm Module Deactivation</span>
          </Flex>
        }
        open={confirmModalOpen}
        onOk={confirmDisableModule}
        onCancel={() => {
          setConfirmModalOpen(false);
          setPendingDisableModule(null);
        }}
        okText="Yes, Deactivate Module"
        cancelText="Keep Enabled"
        okButtonProps={{ danger: true }}
      >
        {pendingDisableModule && (
          <Space direction="vertical" size={14} style={{ marginTop: 12, width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              message={
                <span>
                  You are about to turn off <strong>{pendingDisableModule.label}</strong> (<code>{pendingDisableModule.key}</code>).
                </span>
              }
              description="Deactivating this module will immediately hide its navigation menus from all non-superadmin users and exclude its analytical widgets from the Admin Dashboard."
            />

            {pendingDisableModule.submodules && pendingDisableModule.submodules.length > 0 && (
              <div>
                <Text strong style={{ fontSize: 12.5, display: 'block', marginBottom: 6 }}>
                  Affected Sub-modules ({pendingDisableModule.submodules.length}):
                </Text>
                <div style={{ maxHeight: 120, overflowY: 'auto', background: adminTheme.cardMuted, padding: '8px 12px', borderRadius: 8 }}>
                  {pendingDisableModule.submodules.map((s) => (
                    <Text key={s.key} style={{ fontSize: 12, color: adminTheme.subtext, display: 'block' }}>
                      &bull; {s.label} (<code>{s.key}</code>)
                    </Text>
                  ))}
                </div>
              </div>
            )}
            <Text style={{ fontSize: 12, color: adminTheme.subtext }}>
              You can re-enable this module at any time from this switchboard.
            </Text>
          </Space>
        )}
      </Modal>

      {/* License Update Modal */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <SafetyCertificateOutlined style={{ color: '#2563eb' }} />
            <span>Update Aura Enterprise License</span>
          </Flex>
        }
        open={licenseModalOpen}
        onOk={handleLicenseSubmit}
        onCancel={() => setLicenseModalOpen(false)}
        okText="Verify &amp; Activate License"
        destroyOnClose
      >
        <Form form={licenseForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="license_key"
            label="License Activation Key"
            rules={[{ required: true, message: 'Please enter enterprise license key' }]}
          >
            <Input prefix={<KeyOutlined />} placeholder="e.g. AURA-ENT-2026-X892-PRO" />
          </Form.Item>

          <Form.Item
            name="license_name"
            label="Licensed Organization Name"
            rules={[{ required: true, message: 'Please enter organization name' }]}
          >
            <Input placeholder="e.g. Aura Supply B2B Group" />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message="Enterprise License Benefits"
            description="Active license unlocks all 16 business modules, unlimited multi-warehouse instances, real-time audit logs, and priority security patches through 2030."
          />
        </Form>
      </Modal>
    </Space>
  );
};

export default AdminModulesManager;
