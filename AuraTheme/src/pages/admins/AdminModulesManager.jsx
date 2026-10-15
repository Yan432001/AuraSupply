import React, { useState, useMemo } from 'react';
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
  App,
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
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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
};

const moduleCategories = {
  asset: 'Core Operations',
  inventory: 'Core Operations',
  procurement: 'Core Operations',
  sales: 'Commerce & Orders',
  pos: 'Commerce & Orders',
  'front-end': 'Commerce & Orders',
  clinic: 'Healthcare & Clinical',
  accounting: 'Finance & Banking',
  loans: 'Finance & Banking',
  property: 'Real Estate & Property',
  hr: 'Human Resources',
  payroll: 'Human Resources',
  cms: 'Digital Content',
  reports: 'Analytics & Audits',
  settings: 'System Administration',
};

const AdminModulesManager = () => {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const {
    moduleState,
    isModuleOpen,
    toggleModule,
    enableAllModules,
    disableAllModules,
    resetModules,
    activeModulesCount,
    totalModulesCount,
  } = useAdminModules();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'open' | 'closed'
  const [selectedCategory, setSelectedCategory] = useState('all');

  const cardStyle = {
    borderRadius: 16,
    border: `1px solid ${adminTheme.border}`,
    background: adminTheme.card,
    height: '100%',
    transition: 'all 0.25s ease',
  };

  const categories = useMemo(() => {
    const set = new Set();
    erpModules.forEach((m) => {
      const cat = moduleCategories[m.key] || 'General';
      set.add(cat);
    });
    return ['all', ...Array.from(set)];
  }, []);

  const filteredModules = useMemo(() => {
    return erpModules.filter((m) => {
      const isOpen = isModuleOpen(m.key);
      const cat = moduleCategories[m.key] || 'General';

      // Status filter
      if (selectedFilter === 'open' && !isOpen) return false;
      if (selectedFilter === 'closed' && isOpen) return false;

      // Category filter
      if (selectedCategory !== 'all' && cat !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesLabel = m.label.toLowerCase().includes(query);
        const matchesDesc = (m.description || '').toLowerCase().includes(query);
        const matchesKey = m.key.toLowerCase().includes(query);
        const matchesCat = cat.toLowerCase().includes(query);
        if (!matchesLabel && !matchesDesc && !matchesKey && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [erpModules, isModuleOpen, selectedFilter, selectedCategory, searchQuery]);

  const handleToggle = (moduleKey, checked) => {
    toggleModule(moduleKey, checked);
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* 1. Header Banner */}
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
        <div>
          <Flex align="center" gap={10}>
            <Title level={3} style={{ margin: 0, color: adminTheme.text }}>
              ERP Modules &amp; Feature Switchboard
            </Title>
            <Tag color="blue" style={{ borderRadius: 8, fontWeight: 700, padding: '2px 10px' }}>
              Real-time Sync
            </Tag>
          </Flex>
          <Text style={{ color: adminTheme.subtext, fontSize: 13, marginTop: 4, display: 'block' }}>
            Control module visibility across the entire ERP platform. Toggling a module off immediately hides its menu items from the sidebar and removes its widgets, charts, and metrics from the Admin Dashboard.
          </Text>
        </div>

        <Space size={10} wrap>
          <Button
            icon={<DashboardOutlined />}
            onClick={() => navigate('/admins/dashboard')}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            Go to Dashboard
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={enableAllModules}
            style={{ borderRadius: 10, fontWeight: 600, background: '#16a34a' }}
          >
            Open All Modules
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={disableAllModules}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            Close Non-Core
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={resetModules}
            style={{ borderRadius: 10 }}
          >
            Reset Defaults
          </Button>
        </Space>
      </Flex>

      {/* 2. Key Metrics Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Total System Modules</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: adminTheme.text }}>
              {totalModulesCount}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>Configurable ERP modules</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Flex justify="space-between" align="center">
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Active &amp; Visible</Text>
              <EyeOutlined style={{ color: '#16a34a', fontSize: 16 }} />
            </Flex>
            <Title level={2} style={{ margin: '4px 0 0', color: '#16a34a' }}>
              {activeModulesCount}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>
              Shown in sidebar &amp; dashboard
            </Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Flex justify="space-between" align="center">
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Closed &amp; Hidden</Text>
              <EyeInvisibleOutlined style={{ color: '#ea580c', fontSize: 16 }} />
            </Flex>
            <Title level={2} style={{ margin: '4px 0 0', color: totalModulesCount - activeModulesCount > 0 ? '#ea580c' : adminTheme.subtext }}>
              {totalModulesCount - activeModulesCount}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>
              Hidden from menus &amp; charts
            </Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Live System Status</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#2563eb' }}>
              {Math.round((activeModulesCount / totalModulesCount) * 100)}%
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>Active system coverage</Text>
          </Card>
        </Col>
      </Row>

      {/* 3. Notice / Tip Box */}
      {totalModulesCount - activeModulesCount > 0 && (
        <Alert
          type="info"
          showIcon
          message={
            <span>
              <strong>{totalModulesCount - activeModulesCount} module(s) currently closed:</strong> Closed modules (e.g. Assets) have been hidden from the left sidebar and excluded from the Admin Dashboard charts. Toggle any switch below to immediately restore visibility.
            </span>
          }
          style={{ borderRadius: 12 }}
        />
      )}

      {/* 4. Filter & Search Toolbar */}
      <Card style={cardStyle} styles={{ body: { padding: '16px 20px' } }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
              placeholder="Search by module name or keywords (e.g. Assets, Inventory, Sales)..."
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
                All ({erpModules.length})
              </Button>
              <Button
                type={selectedFilter === 'open' ? 'primary' : 'default'}
                onClick={() => setSelectedFilter('open')}
                style={{ borderRadius: 8, fontSize: 12.5, ...(selectedFilter === 'open' ? { background: '#16a34a' } : {}) }}
              >
                Open Only ({activeModulesCount})
              </Button>
              <Button
                type={selectedFilter === 'closed' ? 'primary' : 'default'}
                onClick={() => setSelectedFilter('closed')}
                style={{ borderRadius: 8, fontSize: 12.5, ...(selectedFilter === 'closed' ? { background: '#ea580c' } : {}) }}
              >
                Closed Only ({totalModulesCount - activeModulesCount})
              </Button>
            </Flex>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Flex justify="flex-end" gap={6} wrap="wrap">
              {categories.map((cat) => (
                <Tag.CheckableTag
                  key={cat}
                  checked={selectedCategory === cat}
                  onChange={() => setSelectedCategory(cat)}
                  style={{
                    borderRadius: 8,
                    fontSize: 12,
                    padding: '3px 10px',
                    marginRight: 0,
                    textTransform: cat === 'all' ? 'uppercase' : 'none',
                  }}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </Tag.CheckableTag>
              ))}
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* 5. Modules Grid */}
      <Row gutter={[16, 16]}>
        {filteredModules.map((m) => {
          const isOpen = isModuleOpen(m.key);
          const IconComponent = moduleIconMap[m.key] || AppstoreOutlined;
          const category = moduleCategories[m.key] || 'General';

          return (
            <Col xs={24} sm={12} lg={8} key={m.key}>
              <Card
                style={{
                  ...cardStyle,
                  borderColor: isOpen ? adminTheme.border : '#fca5a5',
                  opacity: isOpen ? 1 : 0.78,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                styles={{ body: { padding: 20 } }}
              >
                {/* Active Indicator Top Line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: isOpen ? (m.accent || '#2563eb') : '#cbd5e1',
                  }}
                />

                {/* Module Header & Switch */}
                <Flex justify="space-between" align="flex-start" style={{ marginBottom: 14 }}>
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
                        fontSize: 20,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <IconComponent />
                    </div>

                    <div>
                      <Flex align="center" gap={8}>
                        <Title level={5} style={{ margin: 0, color: adminTheme.text }}>
                          {m.label}
                        </Title>
                        {m.key === 'asset' && (
                          <Tag color="purple" style={{ fontSize: 10.5, borderRadius: 6, margin: 0 }}>
                            Assets
                          </Tag>
                        )}
                      </Flex>
                      <Tag
                        color={isOpen ? 'green' : 'default'}
                        style={{
                          borderRadius: 6,
                          fontSize: 11,
                          marginTop: 4,
                          padding: '1px 8px',
                          fontWeight: 600,
                        }}
                      >
                        {isOpen ? 'ACTIVE / OPEN' : 'CLOSED / HIDDEN'}
                      </Tag>
                    </div>
                  </Flex>

                  {/* The Primary Open/Close Switch */}
                  <Flex vertical align="flex-end" gap={4}>
                    <Switch
                      checked={isOpen}
                      onChange={(checked) => handleToggle(m.key, checked)}
                      checkedChildren="OPEN"
                      unCheckedChildren="CLOSED"
                      style={{
                        background: isOpen ? '#16a34a' : '#94a3b8',
                      }}
                    />
                    <Text style={{ fontSize: 11, color: adminTheme.subtext }}>
                      {isOpen ? 'Visible in menu' : 'Hidden from menu'}
                    </Text>
                  </Flex>
                </Flex>

                {/* Module Description */}
                <Paragraph
                  style={{
                    color: adminTheme.subtext,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    minHeight: 38,
                    marginBottom: 12,
                  }}
                  ellipsis={{ rows: 2 }}
                >
                  {m.description || 'Module controls core business entities and operational records.'}
                </Paragraph>

                {/* Module Metadata / KPI */}
                <Flex
                  justify="space-between"
                  align="center"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: adminTheme.cardMuted,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block' }}>
                      {m.kpiLabel || 'Active Metrics'}
                    </Text>
                    <Text strong style={{ fontSize: 13, color: adminTheme.text }}>
                      {m.kpiValue || 'Available'}
                    </Text>
                  </div>

                  <Tag
                    style={{
                      borderRadius: 6,
                      fontSize: 11,
                      margin: 0,
                      background: adminTheme.card,
                      borderColor: adminTheme.border,
                      color: adminTheme.subtext,
                    }}
                  >
                    {category}
                  </Tag>
                </Flex>

                {/* Submodules count & Direct View button */}
                <Flex justify="space-between" align="center">
                  <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>
                    {m.menus?.length || 0} sub-menus &bull; {m.submodules?.length || 0} sub-features
                  </Text>

                  {isOpen ? (
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/admins?module=${m.key}`)}
                      style={{ padding: 0, fontWeight: 600, color: m.accent || '#2563eb' }}
                    >
                      Open Module
                    </Button>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 11.5, fontStyle: 'italic' }}>
                      Hidden in Sidebar
                    </Text>
                  )}
                </Flex>
              </Card>
            </Col>
          );
        })}
      </Row>

      {filteredModules.length === 0 && (
        <Card style={cardStyle} styles={{ body: { padding: 48, textAlign: 'center' } }}>
          <Title level={4} style={{ color: adminTheme.subtext }}>
            No modules match your filter
          </Title>
          <Text style={{ color: adminTheme.subtext }}>
            Try resetting your search query or selecting a different category filter.
          </Text>
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
                setSelectedCategory('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      )}
    </Space>
  );
};

export default AdminModulesManager;
