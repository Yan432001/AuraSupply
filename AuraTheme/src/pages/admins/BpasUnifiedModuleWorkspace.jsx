import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Typography,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Divider,
  Dropdown,
  DatePicker,
  Flex,
  Alert
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  WarningOutlined,
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
  CheckOutlined,
  ShopOutlined,
  BranchesOutlined,
  FileTextOutlined,
  CalendarOutlined,
  EllipsisOutlined,
  FilterOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  BankOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getMenuByKey, getModuleByKey } from '../../data/erpModules';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Text, Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Map menu keys and module keys to backend entity endpoints
const MENU_TO_ENTITY_MAP = {
  // Procurement
  'purchases-list': 'purchases',
  'purchases': 'purchases',
  'purchase-request-list': 'purchase_requests',
  'purchase-request-add': 'purchase_requests',
  'purchase-order-list': 'purchase_orders',
  'purchase-order-add': 'purchase_orders',
  'purchase-returns': 'purchase_returns',
  'ap-requested': 'purchases',

  // Sales
  'sales-invoices': 'sales',
  'sales': 'sales',
  'quotes': 'quotes',
  'sales-orders': 'sales_orders',
  'shipping-request': 'deliveries',
  'delivery-note': 'deliveries',
  'sale-returns': 'sale_returns',
  'maintenance': 'sales',
  'consignment-sales': 'sales',
  'monthly-auto-invoice': 'sales',

  // POS
  'pos-sales': 'pos_sales',
  'list_pos': 'pos_sales',
  'list-pos': 'pos_sales',
  'list_POS': 'pos_sales',
  'pos-settings': 'pos_sales',
  'pos-screen': 'pos_sales',
  'gift-cards': 'gift_cards',
  'member-cards': 'gift_cards',
  'member-coupon': 'gift_cards',
  'pos-customer-stocks': 'sales',

  // Expenses & Finance
  'expenses': 'expenses',
  'asset-expenses': 'expenses',
  'expense-categories': 'expense_categories',
  'cash-book': 'cash_accounts',
  'cash-accounts': 'cash_accounts',
  'journals': 'sales',
  'transactions': 'sales',
  'receivables': 'sales',
  'payables': 'purchases',

  // Loans & Pawns
  'loan-list': 'loans',
  'loans': 'loans',
  'loan-applications': 'loans',
  'missed-repayments': 'loans',
  'borrowers': 'borrowers',
  'loan-products': 'loans',
  'loan-calculator': 'loans',
  'pawns': 'pawns',
  'installments': 'installments',

  // Assets
  'assets-list': 'assets',
  'assets': 'assets',
  'assets-add': 'assets',
  'asset-depreciation': 'assets',
  'asset-evaluation': 'assets',

  // HR & Attendance & Payroll
  'employees': 'employees',
  'departments': 'departments',
  'positions': 'positions',
  'employee-groups': 'employees',
  'recruitment': 'employees',
  'attendances': 'attendances',
  'roster': 'attendances',
  'check-in-outs': 'attendances',
  'take-leaves': 'leaves',
  'salaries': 'payrolls',
  'pre-salaries': 'payrolls',
  'payslips': 'payrolls',
  'cash-advances': 'cash_advances',
  'benefits': 'payrolls',

  // Inventory Controls
  'stock-counts': 'stock_counts',
  'quantity-adjustments': 'adjustments',
  'stock-received': 'purchases',
  'transfers': 'transfers',
  'stock-using': 'adjustments',
  'consignments': 'sales',
  'warehouses': 'warehouses',

  // Specialty: Clinic & School & Property
  'patients': 'patients',
  'consultation': 'consultations',
  'opd': 'patients',
  'ipd-patient': 'patients',
  'prescription': 'prescriptions',
  'medicines': 'purchases',
  'admissions': 'admissions',
  'students': 'students',
  'property-list': 'properties',
  'property-sales': 'properties',
  'property-blocks': 'properties'
};

const MODULE_DEFAULT_ENTITY_MAP = {
  procurement: 'purchases',
  sales: 'sales',
  pos: 'pos_sales',
  loans: 'loans',
  asset: 'assets',
  accounting: 'expenses',
  hr: 'employees',
  payroll: 'payrolls',
  inventory: 'adjustments',
  clinic: 'patients',
  property: 'properties',
  reports: 'sales'
};

const BpasUnifiedModuleWorkspace = () => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const moduleKey = searchParams.get('module') || 'procurement';
  const menuKey = searchParams.get('menu') || 'purchases-list';

  // Resolve entity name
  const entityName = useMemo(() => {
    return MENU_TO_ENTITY_MAP[menuKey] || MODULE_DEFAULT_ENTITY_MAP[moduleKey] || 'purchases';
  }, [menuKey, moduleKey]);

  const moduleConfig = useMemo(() => getModuleByKey(moduleKey) || {}, [moduleKey]);
  const menuConfig = useMemo(() => getMenuByKey(moduleKey, menuKey) || {}, [moduleKey, menuKey]);

  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [billerFilter, setBillerFilter] = useState('all');
  const [metrics, setMetrics] = useState({
    totalCount: 0,
    totalAmount: 0,
    completedCount: 0,
    pendingCount: 0
  });

  // Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        biller_id: billerFilter !== 'all' ? billerFilter : undefined
      };

      const res = await axios.get(`/api/admin/erp/entity/${entityName}`, { params });
      if (res.data?.status) {
        setData(res.data.data || []);
        setTotal(res.data.total || 0);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.warn(`[BPAS Workspace] Notice loading entity ${entityName}:`, err.message);
      // Fallback data
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchData();
  }, [entityName, statusFilter, billerFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page, pageSize]);

  // Handle Quick Status Update
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axios.put(`/api/admin/erp/entity/${entityName}/${id}`, { status: newStatus });
      message.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      message.error(`Failed to update status: ${err.message}`);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/erp/entity/${entityName}/${id}`);
      message.success('Record removed successfully');
      fetchData();
    } catch (err) {
      message.error(`Failed to remove: ${err.message}`);
    }
  };

  // Handle Create Form Submit
  const handleCreateSubmit = async (values) => {
    setSubmitting(true);
    try {
      await axios.post(`/api/admin/erp/entity/${entityName}`, values);
      message.success(`New ${entityName} record saved successfully!`);
      setCreateModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      message.error(`Failed to create: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!data.length) {
      message.warning('No records available to export.');
      return;
    }
    const headers = Object.keys(data[0]).filter(k => k !== 'key');
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${entityName}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Export completed successfully');
  };

  // Status Badge Mapper (BPAS ERP color standard)
  const renderStatusTag = (status) => {
    const s = String(status || 'pending').toLowerCase();
    if (['completed', 'paid', 'received', 'active', 'delivered', 'approved', 'present'].includes(s)) {
      return <Tag color="success" style={{ borderRadius: 6, fontWeight: 600 }}>{s.toUpperCase()}</Tag>;
    }
    if (['pending', 'ordered', 'due', 'draft', 'ordered'].includes(s)) {
      return <Tag color="warning" style={{ borderRadius: 6, fontWeight: 600 }}>{s.toUpperCase()}</Tag>;
    }
    if (['partial', 'transferring', 'processing'].includes(s)) {
      return <Tag color="processing" style={{ borderRadius: 6, fontWeight: 600 }}>{s.toUpperCase()}</Tag>;
    }
    if (['cancelled', 'rejected', 'overdue', 'expired', 'inactive'].includes(s)) {
      return <Tag color="error" style={{ borderRadius: 6, fontWeight: 600 }}>{s.toUpperCase()}</Tag>;
    }
    return <Tag style={{ borderRadius: 6 }}>{s.toUpperCase()}</Tag>;
  };

  // Dynamic Columns based on entity
  const columns = useMemo(() => {
    const base = [
      {
        title: t('reference_no', 'Reference / ID'),
        dataIndex: 'reference_no',
        key: 'reference_no',
        width: 170,
        render: (ref, record) => (
          <Space orientation="vertical" size={2}>
            <a
              onClick={() => {
                setSelectedRecord(record);
                setViewModalVisible(true);
              }}
              style={{ fontWeight: 700, color: '#2563eb' }}
            >
              {ref || record.do_reference_no || `#${record.id}`}
            </a>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.date ? String(record.date).substring(0, 10) : t('active', 'Active')}
            </Text>
          </Space>
        )
      },
      {
        title: t('customer', 'Partner / Customer / Staff'),
        key: 'partner',
        render: (_, record) => {
          const partnerName = record.supplier || record.customer || record.name || record.employee_name || record.first_name || 'Commercial Partner';
          const partnerPhone = record.phone || record.email || record.company || record.biller;
          return (
            <Space orientation="vertical" size={2}>
              <Text strong style={{ fontSize: 13.5 }}>{partnerName}</Text>
              {partnerPhone && <Text type="secondary" style={{ fontSize: 11 }}>{partnerPhone}</Text>}
            </Space>
          );
        }
      },
      {
        title: t('branches', 'Branch / Location'),
        dataIndex: 'biller',
        key: 'biller',
        render: (biller, record) => (
          <Tag icon={<BranchesOutlined />} style={{ borderRadius: 4 }}>
            {biller || record.warehouse_name || 'Main HQ Store'}
          </Tag>
        )
      },
      {
        title: t('grand_total', 'Grand Total'),
        key: 'grand_total',
        align: 'right',
        render: (_, record) => {
          const amount = record.grand_total || record.amount || record.price || record.net_salary || record.total || record.principal_amount || 0;
          const paid = record.paid || 0;
          return (
            <div style={{ textAlign: 'right' }}>
              <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                {formatCurrency(amount)}
              </Text>
              {record.paid !== undefined && (
                <div style={{ fontSize: 11, color: '#16a34a' }}>
                  {t('paid', 'Paid')}: {formatCurrency(paid)}
                </div>
              )}
            </div>
          );
        }
      },
      {
        title: t('status', 'Status'),
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        render: (status, record) => renderStatusTag(status || record.sale_status || record.payment_status)
      },
      {
        title: t('actions', 'Actions'),
        key: 'actions',
        align: 'center',
        width: 140,
        render: (_, record) => {
          const menuItems = [
            {
              key: 'view',
              icon: <EyeOutlined />,
              label: t('view', 'View Details'),
              onClick: () => {
                setSelectedRecord(record);
                setViewModalVisible(true);
              }
            },
            {
              key: 'approve',
              icon: <CheckCircleOutlined style={{ color: '#16a34a' }} />,
              label: t('completed', 'Mark Approved / Paid'),
              onClick: () => handleStatusUpdate(record.id, 'completed')
            },
            {
              key: 'pending',
              icon: <WarningOutlined style={{ color: '#ea580c' }} />,
              label: t('pending', 'Mark Pending'),
              onClick: () => handleStatusUpdate(record.id, 'pending')
            },
            {
              type: 'divider'
            },
            {
              key: 'delete',
              icon: <DeleteOutlined style={{ color: '#dc2626' }} />,
              danger: true,
              label: t('delete', 'Delete Record'),
              onClick: () => handleDelete(record.id)
            }
          ];

          return (
            <Space size={6}>
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined style={{ color: '#2563eb' }} />}
                onClick={() => {
                  setSelectedRecord(record);
                  setViewModalVisible(true);
                }}
              />
              <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                <Button size="small" type="text" icon={<EllipsisOutlined />} />
              </Dropdown>
            </Space>
          );
        }
      }
    ];

    return base;
  }, [entityName, t]);

  const rawTitle = menuConfig?.label || moduleConfig?.label || entityName.replace(/_/g, ' ').toUpperCase();
  const displayTitle = t(menuKey, t(moduleKey, rawTitle));
  const displayDesc = t(`${menuKey}_desc`, menuConfig?.description) || t(`${moduleKey}_desc`, moduleConfig?.description) || 'Manage enterprise database records in real-time.';

  return (
    <div style={{ padding: '20px 24px', minHeight: '100vh', background: adminTheme.isDark ? '#0f172a' : '#f8fafc' }}>
      {/* 1. Header Banner & KPIs */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          background: adminTheme.isDark ? '#1e293b' : '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          marginBottom: 20
        }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={12}>
            <Space orientation="vertical" size={4}>
              <Flex align="center" gap={10}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: moduleConfig.accent ? `${moduleConfig.accent}18` : '#2563eb18',
                    color: moduleConfig.accent || '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22
                  }}
                >
                  <AppstoreOutlined />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 700, color: adminTheme.isDark ? '#f8fafc' : '#0f172a' }}>
                    {displayTitle}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {t('modules', 'ERP Module')}: <Tag color="blue">{t(moduleConfig.key || moduleKey, moduleConfig.label || moduleKey)}</Tag> &bull; {t('overview', 'Active Data Layer')}
                  </Text>
                </div>
              </Flex>
              <Text type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
                {displayDesc}
              </Text>
            </Space>
          </Col>

          {/* Quick Metrics (BPAS Header Counter Standard) */}
          <Col xs={24} md={12}>
            <Row gutter={12} justify="end">
              <Col span={6}>
                <Card size="small" style={{ borderRadius: 10, background: adminTheme.isDark ? '#334155' : '#f1f5f9', border: 'none', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('total', 'TOTAL VOLUME')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>{metrics.totalCount}</div>
                </Card>
              </Col>
              <Col span={7}>
                <Card size="small" style={{ borderRadius: 10, background: adminTheme.isDark ? '#334155' : '#f1f5f9', border: 'none', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('grand_total', 'TOTAL VALUE')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{formatCurrency(metrics.totalAmount)}</div>
                </Card>
              </Col>
              <Col span={5}>
                <Card size="small" style={{ borderRadius: 10, background: adminTheme.isDark ? '#334155' : '#f1f5f9', border: 'none', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('active', 'ACTIVE')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{metrics.completedCount}</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ borderRadius: 10, background: adminTheme.isDark ? '#334155' : '#f1f5f9', border: 'none', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('pending', 'PENDING / DUE')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ea580c' }}>{metrics.pendingCount}</div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 2. Filter & Action Control Toolbar */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          background: adminTheme.isDark ? '#1e293b' : '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          marginBottom: 20
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row gutter={[16, 12]} align="middle" justify="space-between">
          <Col xs={24} lg={14}>
            <Flex wrap="wrap" gap={10} align="center">
              <Input
                placeholder={`${t('search', 'Search')} ${displayTitle}...`}
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                style={{ width: 220, borderRadius: 8 }}
              />

              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                placeholder={t('status', 'Status')}
              >
                <Option value="all">{t('all', 'All Statuses')}</Option>
                <Option value="completed">{t('completed', 'Completed / Active')}</Option>
                <Option value="received">{t('stock_received', 'Received / Stocked')}</Option>
                <Option value="pending">{t('pending', 'Pending / Draft')}</Option>
                <Option value="paid">{t('paid', 'Paid')}</Option>
                <Option value="due">{t('balance', 'Due / Overdue')}</Option>
              </Select>

              <Select
                value={billerFilter}
                onChange={setBillerFilter}
                style={{ width: 170 }}
                placeholder={t('branches', 'Branch / Biller')}
              >
                <Option value="all">{t('branches', 'All Branches')}</Option>
                <Option value="1">Aura Global HQ</Option>
                <Option value="2">SBC Solutions Store</Option>
              </Select>

              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchData()}
                loading={loading}
                style={{ borderRadius: 8 }}
              >
                {t('refresh', 'Sync')}
              </Button>
            </Flex>
          </Col>

          <Col xs={24} lg={10} style={{ textAlign: 'right' }}>
            <Space wrap>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportCSV}
                style={{ borderRadius: 8 }}
              >
                {t('export', 'Export CSV')}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  form.resetFields();
                  setCreateModalVisible(true);
                }}
                style={{
                  borderRadius: 8,
                  background: '#2563eb',
                  fontWeight: 600
                }}
              >
                {t('add', 'Add')} {displayTitle}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 3. Main Data Table */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          background: adminTheme.isDark ? '#1e293b' : '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="key"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showTotal: (tot, range) => `${range[0]}-${range[1]} of ${tot} records`
          }}
          scroll={{ x: 800 }}
          style={{ borderRadius: 16, overflow: 'hidden' }}
        />
      </Card>

      {/* 4. Add Record Modal */}
      <Modal
        title={`${t('create_new', 'Create New')} ${displayTitle}`}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        destroyOnHidden
        centered
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubmit}
          initialValues={{
            status: 'completed',
            biller: 'Aura Global HQ',
            date: new Date().toISOString().substring(0, 10),
            grand_total: 150.00
          }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('partner_customer_staff_name', 'Partner / Customer / Supplier / Staff Name')}
                name="name"
                rules={[{ required: true, message: t('enter_name', 'Please enter name') }]}
              >
                <Input placeholder="e.g. SBC Solutions Partner" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('reference_code', 'Reference Code')}
                name="reference_no"
              >
                <Input placeholder={t('auto_generated_empty', 'Auto-generated if left empty')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={t('branch_biller', 'Branch / Biller')} name="biller">
                <Select>
                  <Option value="Aura Global HQ">Aura Global HQ</Option>
                  <Option value="SBC Storefront">SBC Storefront</Option>
                  <Option value="Main Distribution Warehouse">Main Distribution Warehouse</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('transaction_status', 'Transaction Status')} name="status">
                <Select>
                  <Option value="completed">{t('completed', 'Completed / Active')}</Option>
                  <Option value="received">{t('received', 'Received')}</Option>
                  <Option value="pending">{t('pending', 'Pending')}</Option>
                  <Option value="paid">{t('paid', 'Paid')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('amount_value', 'Amount / Value ($)')}
                name="grand_total"
                rules={[{ required: true, message: t('enter_amount', 'Please enter amount') }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('date', 'Date')} name="date">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t('operational_notes', 'Operational Notes / Description')} name="note">
            <Input.TextArea rows={3} placeholder={t('notes_terms_placeholder', 'Notes, terms, payment details...')} />
          </Form.Item>

          <Flex justify="end" gap={10} style={{ marginTop: 20 }}>
            <Button onClick={() => setCreateModalVisible(false)}>{t('cancel', 'Cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ background: '#2563eb' }}>
              {t('save_record', 'Save Record')}
            </Button>
          </Flex>
        </Form>
      </Modal>

      {/* 5. View Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#2563eb' }} />
            <span>{t('document_details', 'Document Details')} &bull; {selectedRecord?.reference_no || `#${selectedRecord?.id}`}</span>
          </Space>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>{t('close', 'Close')}</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            {t('print_document', 'Print Document')}
          </Button>
        ]}
        width={680}
        centered
      >
        {selectedRecord && (
          <div style={{ padding: '10px 0' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('document_type', 'DOCUMENT TYPE')}</Text>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{displayTitle}</div>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('status', 'STATUS')}</Text>
                <div>{renderStatusTag(selectedRecord.status || selectedRecord.sale_status)}</div>
              </Col>

              <Divider style={{ margin: '8px 0' }} />

              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('partner_beneficiary', 'PARTNER / BENEFICIARY')}</Text>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {selectedRecord.supplier || selectedRecord.customer || selectedRecord.name || selectedRecord.employee_name || 'General Enterprise'}
                </div>
                <Text type="secondary">{selectedRecord.phone || selectedRecord.email || ''}</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('branch_warehouse', 'BRANCH / WAREHOUSE')}</Text>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {selectedRecord.biller || selectedRecord.warehouse_name || 'HQ Location'}
                </div>
              </Col>

              <Divider style={{ margin: '8px 0' }} />

              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('total_value', 'TOTAL VALUE')}</Text>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {formatCurrency(selectedRecord.grand_total || selectedRecord.amount || selectedRecord.price || 0)}
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('paid_amount', 'PAID AMOUNT')}</Text>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>
                  {formatCurrency(selectedRecord.paid || 0)}
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('balance_due', 'BALANCE DUE')}</Text>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#ea580c' }}>
                  {formatCurrency((selectedRecord.grand_total || selectedRecord.amount || 0) - (selectedRecord.paid || 0))}
                </div>
              </Col>

              <Divider style={{ margin: '8px 0' }} />

              <Col span={24}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('transaction_notes', 'TRANSACTION NOTES / OBSERVATIONS')}</Text>
                <div style={{ background: adminTheme.isDark ? '#334155' : '#f8fafc', padding: 12, borderRadius: 8, marginTop: 4 }}>
                  {selectedRecord.note || t('no_remarks_attached', 'No additional remarks attached to this record.')}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BpasUnifiedModuleWorkspace;
