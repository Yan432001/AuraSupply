import React, { useState, useEffect } from 'react';
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
  Dropdown,
  DatePicker
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined,
  EyeOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  DownOutlined,
  ShoppingOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  CreditCardOutlined,
  AuditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../../../utils/uiTheme';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = '/api/admin/sales';

const SalesListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { themeTokens } = useAdminTheme();

  // State
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalPaid: 0,
    totalBalance: 0,
    completedCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    posCount: 0,
    standardCount: 0
  });

  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [posFilter, setPosFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalRecords: 0 });

  // Metadata
  const [metadata, setMetadata] = useState({
    customers: [],
    billers: [],
    warehouses: []
  });

  // Quick Payment Modal
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);
  const [paymentForm] = Form.useForm();
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Fetch Metadata
  const fetchMetadata = async () => {
    try {
      const res = await axios.get(`${API_BASE}/meta/options`);
      if (res.data?.status && res.data.data) {
        setMetadata(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load sales metadata:', err);
    }
  };

  // Fetch Sales
  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE, {
        params: {
          search: searchText,
          sale_status: statusFilter,
          payment_status: paymentStatusFilter,
          pos_type: posFilter,
          warehouse_id: warehouseFilter,
          customer_id: customerFilter,
          page: pagination.page,
          limit: pagination.limit
        }
      });

      if (res.data?.status) {
        setSales(res.data.data || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            totalRecords: res.data.pagination.totalRecords,
            page: res.data.pagination.page
          }));
        }
      }
    } catch (err) {
      message.error(t('failed_to_load_sales', 'Failed to load sales records'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [statusFilter, paymentStatusFilter, posFilter, warehouseFilter, customerFilter, pagination.page, pagination.limit]);

  // Handle Search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchSales();
  };

  // Open Quick Payment Modal
  const handleOpenPayment = (sale) => {
    setSelectedSaleForPayment(sale);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      amount: sale.balance > 0 ? sale.balance : 0,
      paid_by: 'cash',
      date: new Date().toISOString().slice(0, 10),
      reference_no: `PAY-${sale.referenceNo}-${Date.now().toString().slice(-4)}`
    });
    setPaymentModalVisible(true);
  };

  // Submit Quick Payment
  const handleSubmitPayment = async (values) => {
    if (!selectedSaleForPayment) return;
    setSubmittingPayment(true);
    try {
      const res = await axios.post(`${API_BASE}/${selectedSaleForPayment.id}/payments`, values);
      if (res.data?.status) {
        message.success(t('payment_recorded_success', 'Payment recorded successfully!'));
        setPaymentModalVisible(false);
        fetchSales();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Status Change / Cancel Sale
  const handleCancelSale = async (saleId) => {
    try {
      const res = await axios.put(`${API_BASE}/${saleId}/status`, { status: 'cancelled' });
      if (res.data?.status) {
        message.success(t('sale_cancelled_reversal', 'Sale cancelled and warehouse inventory reversed successfully!'));
        fetchSales();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to cancel sale');
    }
  };

  // Safe Delete Sale
  const handleDeleteSale = async (saleId) => {
    try {
      const res = await axios.delete(`${API_BASE}/${saleId}`);
      if (res.data?.status) {
        message.success(res.data.message || t('sale_deleted', 'Sale deleted successfully'));
        fetchSales();
      }
    } catch (err) {
      Modal.error({
        title: t('cannot_delete_sale', 'Cannot Delete Sale Invoice'),
        content: err.response?.data?.message || err.message,
        okText: t('close', 'Close')
      });
    }
  };

  // Helpers
  const getSaleStatusTag = (status) => {
    switch (status) {
      case 'completed':
        return <Tag color="green" icon={<CheckCircleOutlined />}>{t('completed', 'Completed')}</Tag>;
      case 'pending':
        return <Tag color="gold" icon={<WarningOutlined />}>{t('pending', 'Pending')}</Tag>;
      case 'cancelled':
        return <Tag color="error" icon={<CloseCircleOutlined />}>{t('cancelled', 'Cancelled')}</Tag>;
      default:
        return <Tag color="blue">{status}</Tag>;
    }
  };

  const getPaymentStatusTag = (payStatus) => {
    switch (payStatus) {
      case 'paid':
        return <Tag color="green" icon={<CheckCircleOutlined />}>{t('paid', 'Paid')}</Tag>;
      case 'partial':
        return <Tag color="orange">{t('partial', 'Partial')}</Tag>;
      case 'due':
      case 'unpaid':
        return <Tag color="red">{t('due', 'Due')}</Tag>;
      default:
        return <Tag color="default">{payStatus || 'Due'}</Tag>;
    }
  };

  // Columns definition
  const columns = [
    {
      title: t('date', 'Date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (val) => val ? new Date(val).toLocaleDateString() : '-'
    },
    {
      title: t('invoice_no', 'Invoice No'),
      dataIndex: 'referenceNo',
      key: 'referenceNo',
      width: 170,
      render: (text, record) => (
        <a
          onClick={() => navigate(`/admins/sales/view/${record.id}`)}
          style={{ fontWeight: 600, color: themeTokens.colorPrimary }}
        >
          {text}
        </a>
      )
    },
    {
      title: t('customer', 'Customer'),
      dataIndex: 'customer',
      key: 'customer',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.customerPhone && (
            <div><Text type="secondary" style={{ fontSize: 11 }}>{record.customerPhone}</Text></div>
          )}
        </div>
      )
    },
    {
      title: t('type', 'Type'),
      dataIndex: 'pos',
      key: 'pos',
      width: 100,
      render: (isPos) => isPos ? <Tag color="purple">POS</Tag> : <Tag color="blue">Commercial</Tag>
    },
    {
      title: t('warehouse', 'Warehouse'),
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 140,
      render: (text) => <Text type="secondary">{text}</Text>
    },
    {
      title: t('grand_total', 'Grand Total'),
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      align: 'right',
      width: 130,
      render: (val) => <Text strong style={{ fontSize: 14 }}>{formatCurrency(val)}</Text>
    },
    {
      title: t('paid', 'Paid'),
      dataIndex: 'paid',
      key: 'paid',
      align: 'right',
      width: 120,
      render: (val) => <Text style={{ color: '#16a34a' }}>{formatCurrency(val)}</Text>
    },
    {
      title: t('balance', 'Balance Due'),
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
      width: 120,
      render: (val) => (
        <Text style={{ color: val > 0 ? '#dc2626' : '#16a34a', fontWeight: val > 0 ? 600 : 400 }}>
          {formatCurrency(val)}
        </Text>
      )
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'saleStatus',
      key: 'saleStatus',
      width: 120,
      render: (val) => getSaleStatusTag(val)
    },
    {
      title: t('payment', 'Payment'),
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 110,
      render: (val) => getPaymentStatusTag(val)
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      align: 'center',
      width: 150,
      render: (_, record) => {
        const isCancelled = record.saleStatus === 'cancelled';
        const isFullyPaid = record.paymentStatus === 'paid';

        const actionMenuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: t('view_details', 'View Sale Details'),
            onClick: () => navigate(`/admins/sales/view/${record.id}`)
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('edit_sale', 'Edit Sale'),
            disabled: isCancelled,
            onClick: () => navigate(`/admins/sales/edit/${record.id}`)
          },
          {
            key: 'payment',
            icon: <DollarOutlined />,
            label: t('add_payment', 'Record Customer Payment'),
            disabled: isFullyPaid || isCancelled,
            onClick: () => handleOpenPayment(record)
          },
          {
            type: 'divider'
          },
          {
            key: 'cancel',
            icon: <CloseCircleOutlined />,
            label: t('cancel_sale', 'Cancel Sale (Restore Stock)'),
            danger: true,
            disabled: isCancelled,
            onClick: () => {
              Modal.confirm({
                title: t('confirm_cancel_sale', 'Cancel Sale Invoice?'),
                content: t('cancel_sale_warning', 'Cancelling this sale will automatically reverse deducted warehouse stock and mark the invoice as cancelled.'),
                okText: t('yes_cancel_sale', 'Yes, Cancel Sale'),
                okType: 'danger',
                onOk: () => handleCancelSale(record.id)
              });
            }
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: t('delete', 'Delete Sale'),
            danger: true,
            disabled: record.saleStatus === 'completed' || record.paid > 0,
            onClick: () => {
              Modal.confirm({
                title: t('confirm_delete_sale', 'Permanently Delete Sale?'),
                content: t('delete_sale_desc', 'This action will permanently delete this pending/draft sale record.'),
                okText: t('delete', 'Delete'),
                okType: 'danger',
                onOk: () => handleDeleteSale(record.id)
              });
            }
          }
        ];

        return (
          <Space orientation="horizontal" size="small">
            <Tooltip title={t('view', 'View Details')}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: themeTokens.colorPrimary }} />}
                onClick={() => navigate(`/admins/sales/view/${record.id}`)}
              />
            </Tooltip>
            <Tooltip title={t('edit', 'Edit')}>
              <Button
                type="text"
                size="small"
                disabled={isCancelled}
                icon={<EditOutlined style={{ color: '#2563eb' }} />}
                onClick={() => navigate(`/admins/sales/edit/${record.id}`)}
              />
            </Tooltip>
            {!isFullyPaid && !isCancelled && (
              <Tooltip title={t('add_payment', 'Add Payment')}>
                <Button
                  type="text"
                  size="small"
                  icon={<DollarOutlined style={{ color: '#d97706' }} />}
                  onClick={() => handleOpenPayment(record)}
                />
              </Tooltip>
            )}
            <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
              <Button type="text" size="small" icon={<DownOutlined style={{ fontSize: 10 }} />} />
            </Dropdown>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: themeTokens.colorBgLayout || '#f8fafc' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: themeTokens.colorTextHeading }}>
            {t('sales_management', 'Sales & Invoices Management')}
          </Title>
          <Text type="secondary">
            {t('sales_management_desc', 'Manage commercial sales, customer invoices, payments, inventory fulfillment, and POS counter transactions.')}
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => { fetchSales(); fetchMetadata(); }}
            loading={loading}
          >
            {t('refresh', 'Refresh')}
          </Button>
          <Button
            icon={<ShopOutlined />}
            onClick={() => navigate('/admins/pos')}
          >
            {t('open_pos', 'Open POS Terminal')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admins/sales/add')}
            style={{ background: themeTokens.colorPrimary }}
          >
            {t('add_sale', 'Add New Sale')}
          </Button>
        </Space>
      </div>

      {/* Metrics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={t('total_sales', 'Total Sales')}
              value={metrics.totalSales}
              prefix={<AuditOutlined style={{ color: themeTokens.colorPrimary }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={t('total_revenue', 'Total Sales Revenue')}
              value={metrics.totalRevenue}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#2563eb' }} />}
              formatter={(val) => formatCurrency(val)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={t('total_collected', 'Total Collected')}
              value={metrics.totalPaid}
              precision={2}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
              formatter={(val) => formatCurrency(val)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={t('outstanding_receivables', 'Receivables Due')}
              value={metrics.totalBalance}
              precision={2}
              prefix={<WarningOutlined style={{ color: '#dc2626' }} />}
              formatter={(val) => formatCurrency(val)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={t('completed_orders', 'Completed Sales')}
              value={metrics.completedCount}
              suffix={`/ ${metrics.totalSales}`}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Table Card */}
      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder={t('search_sale_placeholder', 'Search invoice #, customer, phone, note...')}
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setPagination(p => ({ ...p, page: 1 })); }}
                style={{ width: '100%' }}
              >
                <Option value="all">{t('all_statuses', 'All Statuses')}</Option>
                <Option value="completed">{t('completed', 'Completed')}</Option>
                <Option value="pending">{t('pending', 'Pending')}</Option>
                <Option value="cancelled">{t('cancelled', 'Cancelled')}</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                value={paymentStatusFilter}
                onChange={(val) => { setPaymentStatusFilter(val); setPagination(p => ({ ...p, page: 1 })); }}
                style={{ width: '100%' }}
              >
                <Option value="all">{t('all_payments', 'All Payments')}</Option>
                <Option value="paid">{t('paid', 'Paid')}</Option>
                <Option value="partial">{t('partial', 'Partial')}</Option>
                <Option value="due">{t('due', 'Due / Unpaid')}</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                value={posFilter}
                onChange={(val) => { setPosFilter(val); setPagination(p => ({ ...p, page: 1 })); }}
                style={{ width: '100%' }}
              >
                <Option value="all">{t('all_types', 'All Types')}</Option>
                <Option value="standard">{t('commercial_only', 'Commercial Sales')}</Option>
                <Option value="pos">{t('pos_only', 'POS Sales')}</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                value={customerFilter}
                onChange={(val) => { setCustomerFilter(val); setPagination(p => ({ ...p, page: 1 })); }}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="children"
              >
                <Option value="all">{t('all_customers', 'All Customers')}</Option>
                {metadata.customers.map(c => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                value={warehouseFilter}
                onChange={(val) => { setWarehouseFilter(val); setPagination(p => ({ ...p, page: 1 })); }}
                style={{ width: '100%' }}
              >
                <Option value="all">{t('all_warehouses', 'All Warehouses')}</Option>
                {metadata.warehouses.map(w => (
                  <Option key={w.id} value={w.id}>{w.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={2}>
              <Button type="primary" onClick={handleSearch} icon={<FilterOutlined />}>
                {t('filter', 'Filter')}
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={sales}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.totalRecords,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, limit) => setPagination({ ...pagination, page, limit })
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Record Customer Payment Modal */}
      <Modal
        title={
          <Space>
            <DollarOutlined style={{ color: '#16a34a' }} />
            <span>{t('record_customer_payment', 'Record Customer Payment')} - {selectedSaleForPayment?.referenceNo}</span>
          </Space>
        }
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">{t('total_amount', 'Total Invoice')}: </Text>
          <Text strong>{formatCurrency(selectedSaleForPayment?.grandTotal || 0)}</Text>
          <span style={{ margin: '0 8px' }}>|</span>
          <Text type="secondary">{t('already_paid', 'Already Paid')}: </Text>
          <Text style={{ color: '#16a34a' }}>{formatCurrency(selectedSaleForPayment?.paid || 0)}</Text>
          <span style={{ margin: '0 8px' }}>|</span>
          <Text type="secondary">{t('balance_due', 'Balance Due')}: </Text>
          <Text strong style={{ color: '#dc2626' }}>{formatCurrency(selectedSaleForPayment?.balance || 0)}</Text>
        </div>

        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleSubmitPayment}
        >
          <Form.Item
            name="amount"
            label={t('payment_amount', 'Payment Amount ($)')}
            rules={[{ required: true, message: 'Please enter payment amount' }]}
          >
            <InputNumber min={0.01} step={1} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paid_by" label={t('payment_method', 'Payment Method')} rules={[{ required: true }]}>
                <Select>
                  <Option value="cash">{t('cash', 'Cash')}</Option>
                  <Option value="bank_transfer">{t('bank_transfer', 'Bank Transfer')}</Option>
                  <Option value="khqr">{t('khqr', 'ABA KHQR')}</Option>
                  <Option value="cheque">{t('cheque', 'Cheque')}</Option>
                  <Option value="credit_card">{t('credit_card', 'Credit Card')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date" label={t('date', 'Payment Date')} rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="reference_no" label={t('reference_no', 'Payment Receipt Reference')}>
            <Input placeholder="PAY-SALE-XXXX" />
          </Form.Item>

          <Form.Item name="cheque_no" label={t('cheque_or_bank_ref', 'Cheque / Bank Reference No')}>
            <Input placeholder="Optional bank transfer reference..." />
          </Form.Item>

          <Form.Item name="note" label={t('note', 'Note')}>
            <Input.TextArea rows={2} placeholder="Optional payment remarks..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setPaymentModalVisible(false)}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingPayment}
              style={{ background: '#16a34a' }}
            >
              {t('save_payment', 'Save Payment')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SalesListPage;
