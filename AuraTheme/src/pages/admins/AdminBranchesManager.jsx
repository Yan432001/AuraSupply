import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Input,
  Tag,
  Space,
  Flex,
  Modal,
  Form,
  Select,
  Switch,
  Typography,
  Tabs,
  Badge,
  Tooltip,
  Divider,
  Popconfirm,
  message,
  Statistic,
} from 'antd';
import {
  ShopOutlined,
  BankOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  QrcodeOutlined,
  StarFilled,
  SyncOutlined,
  CreditCardOutlined,
  DollarOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  ControlOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useBranchesAndBillers } from '../../hooks/useBranchesAndBillers';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const AdminBranchesManager = () => {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const {
    branches,
    billers,
    activeBranchId,
    activeBranch,
    setActiveBranchId,
    addBranch,
    updateBranch,
    deleteBranch,
    toggleBranchStatus,
    setDefaultBranch,
    addBiller,
    updateBiller,
    deleteBiller,
    toggleBillerStatus,
    setDefaultBiller,
    syncFromStores,
  } = useBranchesAndBillers();

  const [activeTab, setActiveTab] = useState('branches');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBillerFilter, setSelectedBillerFilter] = useState('all');
  const [selectedCityFilter, setSelectedCityFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Branch Modal State
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm] = Form.useForm();

  // Biller Modal State
  const [billerModalVisible, setBillerModalVisible] = useState(false);
  const [editingBiller, setEditingBiller] = useState(null);
  const [billerForm] = Form.useForm();

  const cardStyle = {
    borderRadius: 16,
    border: `1px solid ${adminTheme.border}`,
    background: adminTheme.card,
  };

  // Safe form population
  useEffect(() => {
    if (branchModalVisible) {
      if (editingBranch) {
        branchForm.setFieldsValue({
          name: editingBranch.name,
          code: editingBranch.code,
          shop_type: editingBranch.shop_type,
          biller_id: editingBranch.biller_id,
          store_slug: editingBranch.store_slug,
          city: editingBranch.city,
          address: editingBranch.address,
          phone: editingBranch.phone,
          email: editingBranch.email,
          manager_name: editingBranch.manager_name,
          operating_hours: editingBranch.operating_hours,
          registers_count: editingBranch.registers_count || 2,
          is_active: editingBranch.is_active !== false,
          is_default: Boolean(editingBranch.is_default),
        });
      } else {
        branchForm.resetFields();
        branchForm.setFieldsValue({
          registers_count: 2,
          is_active: true,
          is_default: false,
          city: 'Phnom Penh',
          operating_hours: '7:00 AM - 9:00 PM',
          biller_id: billers[0]?.id || 1,
        });
      }
    }
  }, [branchModalVisible, editingBranch, billers, branchForm]);

  useEffect(() => {
    if (billerModalVisible) {
      if (editingBiller) {
        billerForm.setFieldsValue({
          company_name: editingBiller.company_name,
          trading_name: editingBiller.trading_name,
          code: editingBiller.code,
          vat_tin: editingBiller.vat_tin,
          invoice_prefix: editingBiller.invoice_prefix,
          next_invoice_no: editingBiller.next_invoice_no,
          tax_rate: editingBiller.tax_rate,
          currency_code: editingBiller.currency_code,
          exchange_rate_khr: editingBiller.exchange_rate_khr,
          bank_name: editingBiller.bank_name,
          bank_account_no: editingBiller.bank_account_no,
          bank_account_name: editingBiller.bank_account_name,
          bakong_id: editingBiller.bakong_id,
          phone: editingBiller.phone,
          email: editingBiller.email,
          address: editingBiller.address,
          is_active: editingBiller.is_active !== false,
          is_default: Boolean(editingBiller.is_default),
        });
      } else {
        billerForm.resetFields();
        billerForm.setFieldsValue({
          tax_rate: 10,
          currency_code: 'USD',
          exchange_rate_khr: 4100,
          is_active: true,
          is_default: false,
        });
      }
    }
  }, [billerModalVisible, editingBiller, billerForm]);

  // Cities list
  const cities = useMemo(() => {
    const set = new Set();
    branches.forEach((b) => {
      if (b.city) set.add(b.city);
    });
    return ['all', ...Array.from(set)];
  }, [branches]);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      if (selectedBillerFilter !== 'all' && Number(b.biller_id) !== Number(selectedBillerFilter)) {
        return false;
      }
      if (selectedCityFilter !== 'all' && b.city !== selectedCityFilter) {
        return false;
      }
      if (selectedStatusFilter === 'active' && !b.is_active) return false;
      if (selectedStatusFilter === 'inactive' && b.is_active) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesCode = (b.code || '').toLowerCase().includes(q);
        const matchesAddress = (b.address || '').toLowerCase().includes(q);
        const matchesManager = (b.manager_name || '').toLowerCase().includes(q);
        const matchesType = (b.shop_type || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesAddress && !matchesManager && !matchesType) {
          return false;
        }
      }
      return true;
    });
  }, [branches, selectedBillerFilter, selectedCityFilter, selectedStatusFilter, searchQuery]);

  // Filtered billers
  const filteredBillers = useMemo(() => {
    return billers.filter((bil) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = bil.company_name.toLowerCase().includes(q);
        const matchesTrading = (bil.trading_name || '').toLowerCase().includes(q);
        const matchesCode = (bil.code || '').toLowerCase().includes(q);
        const matchesTin = (bil.vat_tin || '').toLowerCase().includes(q);
        if (!matchesName && !matchesTrading && !matchesCode && !matchesTin) {
          return false;
        }
      }
      return true;
    });
  }, [billers, searchQuery]);

  // Overall Statistics
  const totalSalesToday = useMemo(() => {
    return branches.reduce((sum, b) => sum + (Number(b.today_sales) || 0), 0);
  }, [branches]);

  const totalOrdersToday = useMemo(() => {
    return branches.reduce((sum, b) => sum + (Number(b.today_orders) || 0), 0);
  }, [branches]);

  const totalRegisters = useMemo(() => {
    return branches.reduce((sum, b) => sum + (Number(b.registers_count) || 2), 0);
  }, [branches]);

  // Handlers
  const handleOpenCreateBranch = () => {
    setEditingBranch(null);
    setBranchModalVisible(true);
  };

  const handleOpenEditBranch = (record) => {
    setEditingBranch(record);
    setBranchModalVisible(true);
  };

  const handleSaveBranch = async () => {
    try {
      const values = await branchForm.validateFields();
      if (editingBranch) {
        updateBranch(editingBranch.id, values);
        message.success(`Branch "${values.name}" updated successfully.`);
      } else {
        addBranch(values);
        message.success(`New branch "${values.name}" created successfully.`);
      }
      setBranchModalVisible(false);
    } catch (err) {
      console.warn('Branch form validation error:', err);
    }
  };

  const handleOpenCreateBiller = () => {
    setEditingBiller(null);
    setBillerModalVisible(true);
  };

  const handleOpenEditBiller = (record) => {
    setEditingBiller(record);
    setBillerModalVisible(true);
  };

  const handleSaveBiller = async () => {
    try {
      const values = await billerForm.validateFields();
      if (editingBiller) {
        updateBiller(editingBiller.id, values);
        message.success(`Biller "${values.company_name}" updated successfully.`);
      } else {
        addBiller(values);
        message.success(`Corporate Biller "${values.company_name}" created successfully.`);
      }
      setBillerModalVisible(false);
    } catch (err) {
      console.warn('Biller form validation error:', err);
    }
  };

  // Branch Table Columns
  const branchColumns = [
    {
      title: 'Branch & Store Info',
      key: 'branch_info',
      render: (_, record) => {
        const linkedBiller = billers.find((bil) => bil.id === record.biller_id);
        const isCurrentActive = activeBranchId === record.id;
        return (
          <Flex align="center" gap={12}>
            {record.logo ? (
              <img
                src={record.logo}
                alt={record.name}
                style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#2563eb18',
                  color: '#2563eb',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 18,
                }}
              >
                <ShopOutlined />
              </div>
            )}
            <div>
              <Flex align="center" gap={6}>
                <Text strong style={{ color: adminTheme.text, fontSize: 13.5 }}>
                  {record.name}
                </Text>
                {record.is_default && (
                  <Tag color="gold" style={{ fontSize: 10, borderRadius: 4, margin: 0, padding: '0 4px' }}>
                    HEADQUARTERS
                  </Tag>
                )}
                {isCurrentActive && (
                  <Tag color="green" style={{ fontSize: 10, borderRadius: 4, margin: 0, padding: '0 4px' }}>
                    ACTIVE SESSION
                  </Tag>
                )}
              </Flex>
              <Flex align="center" gap={8} style={{ marginTop: 2 }}>
                <Tag color="blue" style={{ fontSize: 11, borderRadius: 6, margin: 0 }}>
                  {record.code}
                </Tag>
                <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>
                  {record.shop_type || 'Specialty Cafe'}
                </Text>
              </Flex>
              {linkedBiller && (
                <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block', marginTop: 2 }}>
                  Biller: <strong>{linkedBiller.trading_name || linkedBiller.company_name}</strong>
                </Text>
              )}
            </div>
          </Flex>
        );
      },
    },
    {
      title: 'Location & Address',
      key: 'location',
      render: (_, record) => (
        <div>
          <Flex align="center" gap={4}>
            <EnvironmentOutlined style={{ color: '#2563eb', fontSize: 12 }} />
            <Text strong style={{ fontSize: 12, color: adminTheme.text }}>
              {record.city || 'Phnom Penh'}
            </Text>
          </Flex>
          <Text style={{ fontSize: 11.5, color: adminTheme.subtext, display: 'block', maxWidth: 220 }} ellipsis>
            {record.address || 'Cambodia'}
          </Text>
          <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block' }}>
            Hours: {record.operating_hours || '7:00 AM - 9:00 PM'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Contact & Manager',
      key: 'contact',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: 12, color: adminTheme.text, display: 'block', fontWeight: 600 }}>
            {record.manager_name || 'Branch Manager'}
          </Text>
          <Flex align="center" gap={4}>
            <PhoneOutlined style={{ color: adminTheme.subtext, fontSize: 11 }} />
            <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>{record.phone || 'N/A'}</Text>
          </Flex>
          <Flex align="center" gap={4}>
            <MailOutlined style={{ color: adminTheme.subtext, fontSize: 11 }} />
            <Text style={{ fontSize: 11, color: adminTheme.subtext, maxWidth: 140 }} ellipsis>
              {record.email || 'N/A'}
            </Text>
          </Flex>
        </div>
      ),
    },
    {
      title: 'POS & Operations',
      key: 'pos_ops',
      render: (_, record) => (
        <div>
          <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
            {record.registers_count || 2} POS Registers
          </Tag>
          <div style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 11, color: adminTheme.subtext }}>Today Sales: </Text>
            <Text strong style={{ fontSize: 12, color: '#16a34a' }}>
              ${Number(record.today_sales || 0).toFixed(2)}
            </Text>
          </div>
          <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block' }}>
            Orders: {record.today_orders || 0} bills
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Flex vertical gap={4} align="flex-start">
          <Switch
            checked={record.is_active}
            onChange={() => toggleBranchStatus(record.id)}
            checkedChildren="OPEN"
            unCheckedChildren="CLOSED"
            style={{ background: record.is_active ? '#16a34a' : '#94a3b8' }}
          />
          <Text style={{ fontSize: 10.5, color: adminTheme.subtext }}>
            {record.is_active ? 'Active in POS' : 'Deactivated'}
          </Text>
        </Flex>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size={6} wrap>
          <Tooltip title="Switch to this Branch context">
            <Button
              size="small"
              type={activeBranchId === record.id ? 'primary' : 'default'}
              icon={<CheckOutlined />}
              onClick={() => setActiveBranchId(record.id)}
              style={activeBranchId === record.id ? { background: '#16a34a', borderColor: '#16a34a' } : {}}
            >
              {activeBranchId === record.id ? 'Selected' : 'Select'}
            </Button>
          </Tooltip>

          <Tooltip title="Edit Branch">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditBranch(record)}
            />
          </Tooltip>

          {record.store_slug && (
            <Tooltip title="View E-Menu / TMA QR">
              <Button
                size="small"
                icon={<QrcodeOutlined />}
                onClick={() => navigate(`/admins?module=data&section=qrcode`)}
              />
            </Tooltip>
          )}

          {!record.is_default && (
            <Popconfirm
              title="Delete this branch?"
              description="Associated sales and stock history will remain intact."
              onConfirm={() => deleteBranch(record.id)}
              okText="Yes, Delete"
              cancelText="Cancel"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Biller Table Columns
  const billerColumns = [
    {
      title: 'Biller / Legal Entity',
      key: 'biller_info',
      render: (_, record) => {
        const linkedCount = branches.filter((b) => b.biller_id === record.id).length;
        return (
          <div>
            <Flex align="center" gap={8}>
              <Text strong style={{ color: adminTheme.text, fontSize: 13.5 }}>
                {record.company_name}
              </Text>
              {record.is_default && (
                <Tag color="gold" style={{ fontSize: 10, borderRadius: 4, margin: 0, padding: '0 4px' }}>
                  DEFAULT BILLER
                </Tag>
              )}
            </Flex>
            <Flex align="center" gap={8} style={{ marginTop: 2 }}>
              <Tag color="purple" style={{ fontSize: 11, borderRadius: 6, margin: 0 }}>
                {record.code}
              </Tag>
              <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>
                Trading as: <strong>{record.trading_name || record.company_name}</strong>
              </Text>
            </Flex>
            <Tag color="blue" style={{ fontSize: 10.5, borderRadius: 6, marginTop: 4 }}>
              Linked to {linkedCount} Shop Branches
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Tax & VAT Information',
      key: 'tax_info',
      render: (_, record) => (
        <div>
          <Flex align="center" gap={6}>
            <Text style={{ fontSize: 11, color: adminTheme.subtext }}>VAT TIN:</Text>
            <Tag color="green" style={{ fontFamily: 'monospace', fontWeight: 700, margin: 0 }}>
              {record.vat_tin || 'Not Registered'}
            </Tag>
          </Flex>
          <div style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 11, color: adminTheme.subtext }}>Invoice Prefix: </Text>
            <Text strong style={{ fontSize: 12, color: adminTheme.text, fontFamily: 'monospace' }}>
              {record.invoice_prefix || 'INV-'}
            </Text>
            <Text style={{ fontSize: 11, color: adminTheme.subtext }}> (Next: #{record.next_invoice_no || 1001})</Text>
          </div>
          <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block' }}>
            VAT Rate: {record.tax_rate || 10}%
          </Text>
        </div>
      ),
    },
    {
      title: 'Banking & Bakong KHQR',
      key: 'banking',
      render: (_, record) => (
        <div>
          <Flex align="center" gap={6}>
            <BankOutlined style={{ color: '#2563eb', fontSize: 12 }} />
            <Text strong style={{ fontSize: 12, color: adminTheme.text }}>
              {record.bank_name || 'Bank'}
            </Text>
          </Flex>
          <Text style={{ fontSize: 11.5, color: adminTheme.subtext, display: 'block', fontFamily: 'monospace' }}>
            A/C: {record.bank_account_no || 'N/A'}
          </Text>
          {record.bakong_id && (
            <Tag color="geekblue" style={{ fontSize: 10.5, borderRadius: 4, marginTop: 2 }}>
              Bakong: {record.bakong_id}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Currency & Exchange',
      key: 'currency',
      render: (_, record) => (
        <div>
          <Tag color="gold" style={{ fontWeight: 700, borderRadius: 6 }}>
            {record.currency_code || 'USD'} ({record.currency_symbol || '$'})
          </Tag>
          <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block', marginTop: 4 }}>
            KHR Rate: 1 USD = {record.exchange_rate_khr || 4100} KHR
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          onChange={() => toggleBillerStatus(record.id)}
          checkedChildren="ACTIVE"
          unCheckedChildren="INACTIVE"
          style={{ background: record.is_active ? '#16a34a' : '#94a3b8' }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Edit Biller">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditBiller(record)}
            />
          </Tooltip>

          {!record.is_default && (
            <Tooltip title="Set as Default Invoicing Entity">
              <Button
                size="small"
                onClick={() => setDefaultBiller(record.id)}
              >
                Set Default
              </Button>
            </Tooltip>
          )}

          {!record.is_default && (
            <Popconfirm
              title="Delete this legal biller?"
              description="Make sure to reassign linked branches before deleting."
              onConfirm={() => deleteBiller(record.id)}
              okText="Yes, Delete"
              cancelText="Cancel"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* 1. Header Banner */}
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
        <div>
          <Flex align="center" gap={10}>
            <Title level={3} style={{ margin: 0, color: adminTheme.text }}>
              Multi-Shop &amp; Multiple Biller Management
            </Title>
            <Tag color="blue" style={{ borderRadius: 8, fontWeight: 700, padding: '2px 10px' }}>
              Multi-Tenant POS &amp; ERP
            </Tag>
          </Flex>
          <Text style={{ color: adminTheme.subtext, fontSize: 13, marginTop: 4, display: 'block' }}>
            Control physical store branches, franchise shops, registers, and multiple corporate legal billers for invoicing, VAT taxation, and Bakong KHQR settlements.
          </Text>
        </div>

        <Space size={10} wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateBranch}
            style={{ borderRadius: 10, fontWeight: 600, background: '#2563eb' }}
          >
            + New Branch / Shop
          </Button>

          <Button
            icon={<PlusOutlined />}
            onClick={handleOpenCreateBiller}
            style={{ borderRadius: 10, fontWeight: 600, borderColor: '#7c3aed', color: '#7c3aed' }}
          >
            + New Biller Entity
          </Button>

          <Button
            icon={<SyncOutlined />}
            onClick={() => {
              syncFromStores();
              message.success('Synced with live E-Menu & TMA store catalog.');
            }}
            style={{ borderRadius: 10 }}
          >
            Sync E-Menu Stores
          </Button>
        </Space>
      </Flex>

      {/* 2. Top Metric Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Flex justify="space-between" align="center">
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Total Store Branches</Text>
              <ShopOutlined style={{ color: '#2563eb', fontSize: 16 }} />
            </Flex>
            <Title level={2} style={{ margin: '4px 0 0', color: adminTheme.text }}>
              {branches.length}
            </Title>
            <Text style={{ color: '#16a34a', fontSize: 11.5 }}>
              {branches.filter((b) => b.is_active).length} Active &bull; {branches.filter((b) => !b.is_active).length} Inactive
            </Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Flex justify="space-between" align="center">
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Corporate Billers</Text>
              <BankOutlined style={{ color: '#7c3aed', fontSize: 16 }} />
            </Flex>
            <Title level={2} style={{ margin: '4px 0 0', color: '#7c3aed' }}>
              {billers.length}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>Legal Invoicing Entities</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Flex justify="space-between" align="center">
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>POS Cashier Registers</Text>
              <CreditCardOutlined style={{ color: '#0284c7', fontSize: 16 }} />
            </Flex>
            <Title level={2} style={{ margin: '4px 0 0', color: '#0284c7' }}>
              {totalRegisters}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>Configured Terminals</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Flex justify="space-between" align="center">
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>Today In-Store Revenue</Text>
              <DollarOutlined style={{ color: '#16a34a', fontSize: 16 }} />
            </Flex>
            <Title level={2} style={{ margin: '4px 0 0', color: '#16a34a' }}>
              ${totalSalesToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>
              {totalOrdersToday} Invoices processed
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 3. Currently Selected Branch Alert / Quick Bar */}
      {activeBranch && (
        <Card style={{ ...cardStyle, borderColor: '#bfdbfe', background: '#eff6ff' }} styles={{ body: { padding: '14px 20px' } }}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Flex align="center" gap={12}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#2563eb',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 18,
                }}
              >
                <ShopOutlined />
              </div>
              <div>
                <Flex align="center" gap={8}>
                  <Text strong style={{ fontSize: 14, color: '#1e3a8a' }}>
                    Active ERP Branch Session: {activeBranch.name} ({activeBranch.code})
                  </Text>
                  {activeBranch.is_default && (
                    <Tag color="gold" style={{ fontSize: 10.5 }}>Headquarters</Tag>
                  )}
                </Flex>
                <Text style={{ fontSize: 12, color: '#3b82f6' }}>
                  Legal Biller: <strong>{billers.find((bil) => bil.id === activeBranch.biller_id)?.company_name || 'Central Entity'}</strong> &bull; Location: {activeBranch.address}
                </Text>
              </div>
            </Flex>

            <Space size={10}>
              <Button
                type="primary"
                onClick={() => navigate('/admins/dashboard')}
                style={{ background: '#2563eb', borderRadius: 8, fontWeight: 600 }}
              >
                View Branch Dashboard
              </Button>
            </Space>
          </Flex>
        </Card>
      )}

      {/* 4. Main Tabs Navigation */}
      <Card style={cardStyle} styles={{ body: { padding: 20 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'branches',
              label: (
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                  <ShopOutlined /> Store Branches &amp; Shops ({branches.length})
                </span>
              ),
              children: (
                <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
                  {/* Search and Filters Toolbar */}
                  <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} md={8}>
                      <Input
                        prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
                        placeholder="Search branches by name, code, manager, address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        allowClear
                        style={{ borderRadius: 8 }}
                      />
                    </Col>

                    <Col xs={24} md={6}>
                      <Select
                        style={{ width: '100%' }}
                        value={selectedBillerFilter}
                        onChange={setSelectedBillerFilter}
                        placeholder="Filter by Biller Entity"
                      >
                        <Option value="all">All Corporate Billers ({billers.length})</Option>
                        {billers.map((bil) => (
                          <Option key={bil.id} value={bil.id}>
                            {bil.trading_name || bil.company_name} ({bil.code})
                          </Option>
                        ))}
                      </Select>
                    </Col>

                    <Col xs={12} md={5}>
                      <Select
                        style={{ width: '100%' }}
                        value={selectedCityFilter}
                        onChange={setSelectedCityFilter}
                        placeholder="Filter by City"
                      >
                        <Option value="all">All Cities</Option>
                        {cities.filter((c) => c !== 'all').map((city) => (
                          <Option key={city} value={city}>
                            {city}
                          </Option>
                        ))}
                      </Select>
                    </Col>

                    <Col xs={12} md={5}>
                      <Select
                        style={{ width: '100%' }}
                        value={selectedStatusFilter}
                        onChange={setSelectedStatusFilter}
                        placeholder="Filter Status"
                      >
                        <Option value="all">All Status</Option>
                        <Option value="active">Active Only</Option>
                        <Option value="inactive">Inactive Only</Option>
                      </Select>
                    </Col>
                  </Row>

                  <Table
                    columns={branchColumns}
                    dataSource={filteredBranches}
                    rowKey="id"
                    pagination={{ pageSize: 8, showSizeChanger: true }}
                    style={{ marginTop: 8 }}
                  />
                </Space>
              ),
            },
            {
              key: 'billers',
              label: (
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                  <BankOutlined /> Multiple Billers &amp; Corporate Entities ({billers.length})
                </span>
              ),
              children: (
                <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
                  <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <Input
                      prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
                      placeholder="Search billers by company name, VAT TIN, code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      allowClear
                      style={{ maxWidth: 360, borderRadius: 8 }}
                    />

                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenCreateBiller}
                      style={{ borderRadius: 8, background: '#7c3aed', borderColor: '#7c3aed', fontWeight: 600 }}
                    >
                      + Add Legal Biller Entity
                    </Button>
                  </Flex>

                  <Table
                    columns={billerColumns}
                    dataSource={filteredBillers}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                    style={{ marginTop: 8 }}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* 5. CREATE / EDIT BRANCH MODAL */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <ShopOutlined style={{ color: '#2563eb' }} />
            <span>{editingBranch ? 'Edit Store Branch' : 'Create New Store Branch'}</span>
          </Flex>
        }
        open={branchModalVisible}
        onCancel={() => setBranchModalVisible(false)}
        onOk={handleSaveBranch}
        okText={editingBranch ? 'Save Changes' : 'Create Branch'}
        width={680}
        forceRender
        destroyOnHidden={false}
      >
        <Form form={branchForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Branch / Shop Name"
                rules={[{ required: true, message: 'Please enter branch name' }]}
              >
                <Input placeholder="e.g. Daun Penh Flagship Store" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="code"
                label="Branch Code"
                rules={[{ required: true, message: 'Please enter code' }]}
              >
                <Input placeholder="e.g. BR-008" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="biller_id"
                label="Assigned Corporate Biller (Invoicing Entity)"
                rules={[{ required: true, message: 'Please select biller' }]}
              >
                <Select placeholder="Select Biller">
                  {billers.map((bil) => (
                    <Option key={bil.id} value={bil.id}>
                      {bil.trading_name || bil.company_name} ({bil.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shop_type" label="Shop / Outlet Type">
                <Select placeholder="Select Type">
                  <Option value="Flagship Cafe">Flagship Cafe</Option>
                  <Option value="Bakery Bistro">Bakery Bistro</Option>
                  <Option value="Botanical Teahouse">Botanical Teahouse</Option>
                  <Option value="Express Kiosk">Express Kiosk</Option>
                  <Option value="Waterfront Cafe">Waterfront Cafe</Option>
                  <Option value="Depot & Roastery">Depot &amp; Roastery</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="city" label="City / Province">
                <Input placeholder="e.g. Phnom Penh" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="address" label="Full Physical Address">
                <Input placeholder="e.g. Street 302, BKK1, Phnom Penh" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="manager_name" label="Branch Manager">
                <Input placeholder="e.g. Sokha Chan" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="phone" label="Contact Phone">
                <Input placeholder="e.g. +855 12 345 678" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="email" label="Contact Email">
                <Input placeholder="e.g. branch@auraglobal.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="store_slug" label="E-Menu / TMA Slug">
                <Input placeholder="e.g. daun-penh-cafe" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="operating_hours" label="Operating Hours">
                <Input placeholder="e.g. 6:30 AM - 9:00 PM" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="registers_count" label="Cashier Registers">
                <Select>
                  <Option value={1}>1 Register</Option>
                  <Option value={2}>2 Registers</Option>
                  <Option value={3}>3 Registers</Option>
                  <Option value={4}>4 Registers</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_active" label="Operational Status" valuePropName="checked">
                <Switch checkedChildren="OPEN / ACTIVE" unCheckedChildren="DEACTIVATED" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_default" label="Primary Headquarters" valuePropName="checked">
                <Switch checkedChildren="PRIMARY" unCheckedChildren="STANDARD" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 6. CREATE / EDIT BILLER MODAL */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <BankOutlined style={{ color: '#7c3aed' }} />
            <span>{editingBiller ? 'Edit Corporate Biller Entity' : 'Add Corporate Biller Entity'}</span>
          </Flex>
        }
        open={billerModalVisible}
        onCancel={() => setBillerModalVisible(false)}
        onOk={handleSaveBiller}
        okText={editingBiller ? 'Save Biller' : 'Create Biller'}
        width={680}
        forceRender
        destroyOnHidden={false}
      >
        <Form form={billerForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="company_name"
                label="Legal Corporate Name"
                rules={[{ required: true, message: 'Please enter company name' }]}
              >
                <Input placeholder="e.g. Aura Specialty Coffee Co., Ltd." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="code"
                label="Biller Code"
                rules={[{ required: true, message: 'Please enter code' }]}
              >
                <Input placeholder="e.g. BIL-005" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="trading_name" label="Trading / Brand Name">
                <Input placeholder="e.g. Aura Coffee" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vat_tin"
                label="Tax Identification / VAT TIN"
                rules={[{ required: true, message: 'Please enter VAT TIN' }]}
              >
                <Input placeholder="e.g. K008-90218734" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="invoice_prefix" label="Invoice Prefix">
                <Input placeholder="e.g. INV-ASC-" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="next_invoice_no" label="Next Invoice #">
                <Input type="number" placeholder="e.g. 5001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax_rate" label="Standard Tax Rate (%)">
                <Input type="number" suffix="%" placeholder="10" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bank_name" label="Bank Name">
                <Input placeholder="e.g. ABA Bank" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bank_account_no" label="Bank Account Number">
                <Input placeholder="e.g. 001 849 204" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bank_account_name" label="Bank Account Name">
                <Input placeholder="e.g. AURA SPECIALTY COFFEE CO LTD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bakong_id" label="Bakong KHQR Identifier">
                <Input placeholder="e.g. aura_coffee@ababank" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="currency_code" label="Base Currency">
                <Select>
                  <Option value="USD">USD ($)</Option>
                  <Option value="KHR">KHR (៛)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="exchange_rate_khr" label="1 USD to KHR Rate">
                <Input type="number" placeholder="4100" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="phone" label="Billing Phone">
                <Input placeholder="+855 12 345 678" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Official Registered Address">
            <Input placeholder="No. 128, Preah Norodom Blvd, Daun Penh, Phnom Penh, Cambodia" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_active" label="Status" valuePropName="checked">
                <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_default" label="Default Company Entity" valuePropName="checked">
                <Switch checkedChildren="DEFAULT" unCheckedChildren="SECONDARY" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
};

export default AdminBranchesManager;
