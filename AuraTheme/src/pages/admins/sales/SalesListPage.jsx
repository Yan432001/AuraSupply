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
  Typography,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Tooltip,
  Dropdown,
  DatePicker,
  Divider,
  Spin
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
  CarOutlined,
  HistoryOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TableActionDropdown from '../../../components/common/TableActionDropdown';
import { formatCurrency } from '../../../utils/uiTheme';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = '/api/admin/sales';

const SalesListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const adminTheme = useAdminTheme();
  const themeTokens = adminTheme?.themeTokens || adminTheme;
  const isDark = adminTheme?.isDark;

  // State
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);

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

  // View Payments History Modal
  const [viewPaymentsVisible, setViewPaymentsVisible] = useState(false);
  const [selectedSaleForViewPayments, setSelectedSaleForViewPayments] = useState(null);
  const [salePayments, setSalePayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Add Delivery Modal
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [selectedSaleForDelivery, setSelectedSaleForDelivery] = useState(null);
  const [deliveryForm] = Form.useForm();
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

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

  // Open View Payments Modal
  const handleOpenViewPayments = async (sale) => {
    setSelectedSaleForViewPayments(sale);
    setViewPaymentsVisible(true);
    setLoadingPayments(true);
    try {
      const res = await axios.get(`${API_BASE}/${sale.id}`);
      if (res.data?.status && res.data.data) {
        setSalePayments(res.data.data.payments || []);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      message.error('Failed to load payments history');
    } finally {
      setLoadingPayments(false);
    }
  };

  // Delete Payment
  const handleDeletePayment = async (paymentId) => {
    if (!selectedSaleForViewPayments) return;
    try {
      const res = await axios.delete(`${API_BASE}/${selectedSaleForViewPayments.id}/payments/${paymentId}`);
      if (res.data?.status) {
        message.success(t('payment_deleted_success', 'Payment deleted and balance adjusted'));
        // reload
        handleOpenViewPayments(selectedSaleForViewPayments);
        fetchSales();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  // Open Add Delivery Modal
  const handleOpenAddDelivery = (sale) => {
    setSelectedSaleForDelivery(sale);
    deliveryForm.resetFields();
    deliveryForm.setFieldsValue({
      date: new Date().toISOString().slice(0, 10),
      do_reference_no: `DO-${sale.referenceNo}`,
      address: sale.customerDetails?.address || sale.customerAddress || '',
      status: 'delivering',
      delivered_by: '',
      note: ''
    });
    setDeliveryModalVisible(true);
  };

  // Submit Delivery
  const handleSubmitDelivery = async (values) => {
    if (!selectedSaleForDelivery) return;
    setSubmittingDelivery(true);
    try {
      const res = await axios.post(`${API_BASE}/${selectedSaleForDelivery.id}/deliveries`, values);
      if (res.data?.status) {
        message.success(t('delivery_created_success', 'Delivery order dispatched successfully!'));
        setDeliveryModalVisible(false);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to create delivery');
    } finally {
      setSubmittingDelivery(false);
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
      width: 180,
      render: (val, record) => (
        <a
          onClick={() => navigate(`/admins/sales/view/${record.id}`)}
          style={{ fontWeight: 600, color: '#2563eb' }}
        >
          {val}
        </a>
      )
    },
    {
      title: t('biller', 'Biller'),
      dataIndex: 'biller',
      key: 'biller',
      width: 160,
      render: (val) => val || '-'
    },
    {
      title: t('customer', 'Customer'),
      dataIndex: 'customer',
      key: 'customer',
      width: 200,
      render: (val, record) => (
        <div>
          <div style={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#1e293b' }}>{val}</div>
          {record.customerPhone && (
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.customerPhone}</div>
          )}
        </div>
      )
    },
    {
      title: t('warehouse', 'Warehouse'),
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 140
    },
    {
      title: t('grand_total', 'Grand Total'),
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      align: 'right',
      width: 130,
      render: (val) => <Text strong>{formatCurrency(val)}</Text>
    },
    {
      title: t('paid', 'Paid'),
      dataIndex: 'paid',
      key: 'paid',
      align: 'right',
      width: 120,
      render: (val) => (
        <span style={{ color: val > 0 ? '#16a34a' : '#64748b', fontWeight: 600 }}>
          {formatCurrency(val)}
        </span>
      )
    },
    {
      title: t('balance', 'Balance Due'),
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
      width: 120,
      render: (val) => (
        <span style={{ color: val > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
          {formatCurrency(val)}
        </span>
      )
    },
    {
      title: t('sale_status', 'Status'),
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
      width: 100,
      render: (_, record) => {
        const isCancelled = record.saleStatus === 'cancelled';
        const isFullyPaid = record.paymentStatus === 'paid';

        const actionMenuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: t('view_details', 'View Sale Details / Invoice'),
            onClick: () => navigate(`/admins/sales/view/${record.id}`)
          },
          {
            key: 'edit',
            icon: <EditOutlined style={{ color: '#2563eb' }} />,
            label: t('edit_sale', 'Edit Sale'),
            disabled: isCancelled,
            onClick: () => navigate(`/admins/sales/edit/${record.id}`)
          },
          {
            key: 'payment',
            icon: <DollarOutlined style={{ color: '#16a34a' }} />,
            label: t('add_payment', 'Record Customer Payment'),
            disabled: isFullyPaid || isCancelled,
            onClick: () => handleOpenPayment(record)
          },
          {
            key: 'view_payments',
            icon: <HistoryOutlined style={{ color: '#0284c7' }} />,
            label: t('view_payments', 'View Payments History'),
            onClick: () => handleOpenViewPayments(record)
          },
          {
            key: 'add_delivery',
            icon: <CarOutlined style={{ color: '#d97706' }} />,
            label: t('add_delivery', 'Add Delivery Dispatch'),
            disabled: isCancelled,
            onClick: () => handleOpenAddDelivery(record)
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

        return <TableActionDropdown items={actionMenuItems} />;
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
            style={{ background: '#337ab7', borderColor: '#2e6da4' }}
          >
            {t('add_sale', 'Add New Sale')}
          </Button>
        </Space>
      </div>

      {/* Submodule Navigation Switcher (AURA_v1 Concept: Sales vs Sales Orders) */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            style={{ borderRadius: 6, fontWeight: 600, background: '#337ab7', borderColor: '#2e6da4' }}
          >
            {t('commercial_sales', 'Commercial Sales (Invoices)')}
          </Button>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => navigate('/admins/sales/orders')}
            style={{ borderRadius: 6, fontWeight: 500 }}
          >
            {t('sales_orders', 'Sales Orders (SO)')}
          </Button>
        </div>
        <Space>
          <Button
            icon={<PlusOutlined />}
            onClick={() => navigate('/admins/sales/orders/add')}
            style={{ borderColor: '#0284c7', color: '#0284c7' }}
          >
            {t('add_sale_order', 'Add Sale Order')}
          </Button>
        </Space>
      </div>

      {/* Filters and Table Card */}
      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={5}>
              <Input
                placeholder={t('search_placeholder', 'Search by Invoice #, Customer, Note...')}
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
                <Option value="all">{t('all_status', 'All Statuses')}</Option>
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
                <Option value="due">{t('due', 'Due')}</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                value={posFilter}
                onChange={(val) => { setPosFilter(val); setPagination(p => ({ ...p, page: 1 })); }}
                style={{ width: '100%' }}
              >
                <Option value="all">{t('all_sales', 'Standard & POS')}</Option>
                <Option value="standard">{t('commercial_invoices', 'Commercial Sales')}</Option>
                <Option value="pos">{t('pos_retail', 'POS Counter Sales')}</Option>
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
            <Col xs={12} sm={6} md={3}>
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

      {/* View Payments History Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined style={{ color: '#0284c7' }} />
            <span>{t('payments_history', 'Payments History')} - {selectedSaleForViewPayments?.referenceNo}</span>
          </Space>
        }
        open={viewPaymentsVisible}
        onCancel={() => setViewPaymentsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewPaymentsVisible(false)}>
            {t('close', 'Close')}
          </Button>
        ]}
        width={750}
      >
        <Table
          dataSource={salePayments}
          rowKey="id"
          loading={loadingPayments}
          pagination={false}
          size="small"
          locale={{ emptyText: t('no_payments_recorded', 'No payments recorded for this invoice.') }}
          columns={[
            {
              title: t('date', 'Date'),
              dataIndex: 'date',
              key: 'date',
              render: (d) => d ? new Date(d).toLocaleDateString() : '-'
            },
            {
              title: t('reference_no', 'Reference No'),
              dataIndex: 'referenceNo',
              key: 'referenceNo',
              render: (r) => <Text strong>{r}</Text>
            },
            {
              title: t('paid_by', 'Paid By'),
              dataIndex: 'paidBy',
              key: 'paidBy',
              render: (p) => <Tag color="blue">{(p || 'cash').toUpperCase()}</Tag>
            },
            {
              title: t('amount', 'Amount'),
              dataIndex: 'amount',
              key: 'amount',
              align: 'right',
              render: (a) => <span style={{ color: '#16a34a', fontWeight: 600 }}>{formatCurrency(a)}</span>
            },
            {
              title: t('note', 'Note'),
              dataIndex: 'note',
              key: 'note',
              render: (n) => n || '-'
            },
            {
              title: '',
              key: 'action',
              width: 50,
              align: 'center',
              render: (_, record) => (
                <Popconfirm
                  title={t('confirm_delete_payment', 'Delete this payment record?')}
                  description={t('delete_payment_desc', 'This will increase the unpaid balance of the invoice.')}
                  onConfirm={() => handleDeletePayment(record.id)}
                  okText={t('delete', 'Delete')}
                  okType="danger"
                >
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              )
            }
          ]}
        />
      </Modal>

      {/* Add Delivery Modal */}
      <Modal
        title={
          <Space>
            <CarOutlined style={{ color: '#d97706' }} />
            <span>{t('dispatch_delivery', 'Dispatch Delivery Order')} - {selectedSaleForDelivery?.referenceNo}</span>
          </Space>
        }
        open={deliveryModalVisible}
        onCancel={() => setDeliveryModalVisible(false)}
        footer={null}
      >
        <Form
          form={deliveryForm}
          layout="vertical"
          onFinish={handleSubmitDelivery}
        >
          <Form.Item
            name="do_reference_no"
            label={t('do_reference_no', 'Delivery Order Reference No')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label={t('delivery_date', 'Dispatch Date')} rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label={t('status', 'Delivery Status')} rules={[{ required: true }]}>
                <Select>
                  <Option value="packing">{t('packing', 'Packing')}</Option>
                  <Option value="delivering">{t('delivering', 'Delivering / On the Way')}</Option>
                  <Option value="delivered">{t('delivered', 'Delivered to Customer')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label={t('delivery_address', 'Delivery Destination Address')}>
            <Input.TextArea rows={2} placeholder="Customer delivery address..." />
          </Form.Item>

          <Form.Item name="delivered_by" label={t('delivered_by', 'Driver / Logistics Courier')}>
            <Input placeholder="Courier name, driver phone..." />
          </Form.Item>

          <Form.Item name="note" label={t('delivery_note', 'Delivery Note')}>
            <Input placeholder="Special handling or delivery instructions..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDeliveryModalVisible(false)}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingDelivery}
              style={{ background: '#337ab7', borderColor: '#2e6da4' }}
            >
              {t('dispatch', 'Dispatch Order')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SalesListPage;
