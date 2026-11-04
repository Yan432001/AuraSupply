import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Dropdown,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
  Typography,
  Badge,
  Divider,
  Tabs,
  Empty
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  ArrowRightOutlined,
  DollarOutlined,
  DollarCircleOutlined,
  FilterOutlined,
  FileTextOutlined,
  PrinterOutlined,
  MoreOutlined,
  ExportOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { formatCurrency } from '../../../utils/uiTheme';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useTranslation } from '../../../contexts/LanguageContext';
import SaleOrderDetailModal from './SaleOrderDetailModal';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function SalesOrdersListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const adminTheme = useAdminTheme();
  const isDark = adminTheme?.isDark;

  // Data states
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCollected: 0,
    totalBalance: 0,
    approvedCount: 0,
    pendingCount: 0,
    completedCount: 0
  });

  // Metadata dropdowns
  const [metadata, setMetadata] = useState({
    warehouses: [],
    billers: [],
    customers: []
  });

  // Filters
  const [search, setSearch] = useState('');
  const [saleStatus, setSaleStatus] = useState('all');
  const [orderStatus, setOrderStatus] = useState('all');
  const [warehouseId, setWarehouseId] = useState('all');
  const [billerId, setBillerId] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  // Modals
  const [viewOrderId, setViewOrderId] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Deposit modal
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [targetOrderForDeposit, setTargetOrderForDeposit] = useState(null);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositForm] = Form.useForm();

  // Status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetOrderForStatus, setTargetOrderForStatus] = useState(null);
  const [statusForm] = Form.useForm();
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Convert to sale
  const [convertingId, setConvertingId] = useState(null);

  // Fetch metadata options
  const fetchMetadata = async () => {
    try {
      const res = await axios.get('/api/admin/sales_orders/meta/options');
      if (res.data?.status && res.data?.data) {
        setMetadata({
          warehouses: res.data.data.warehouses || [],
          billers: res.data.data.billers || [],
          customers: res.data.data.customers || []
        });
      }
    } catch (err) {
      console.warn('Failed to load sales order metadata:', err.message);
    }
  };

  // Fetch sales orders list
  const fetchOrders = useCallback(async (p = pagination.page) => {
    setLoading(true);
    try {
      const params = {
        page: p,
        limit: pagination.limit,
        search: search.trim(),
        sale_status: saleStatus,
        order_status: orderStatus,
        warehouse_id: warehouseId,
        biller_id: billerId
      };
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const res = await axios.get('/api/admin/sales_orders', { params });
      if (res.data?.status) {
        setOrders(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  }, [search, saleStatus, orderStatus, warehouseId, billerId, dateRange, pagination.limit]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  // Convert Sale Order to Commercial Sale
  const handleConvertToSale = async (order) => {
    setConvertingId(order.id);
    try {
      const res = await axios.post(`/api/admin/sales_orders/${order.id}/convert-to-sale`);
      if (res.data?.status) {
        message.success(res.data.message || 'Sale Order successfully converted to Commercial Sale!');
        fetchOrders(pagination.page);
        if (res.data?.data?.saleId) {
          Modal.confirm({
            title: 'Sale Order Converted',
            content: `Converted to Sale #${res.data.data.referenceNo}. Would you like to view the invoice now?`,
            okText: 'View Invoice',
            cancelText: 'Stay on Orders',
            onOk: () => navigate(`/admins/sales/${res.data.data.saleId}`)
          });
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to convert sale order');
    } finally {
      setConvertingId(null);
    }
  };

  // Delete sale order
  const handleDeleteOrder = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/sales_orders/${id}`);
      if (res.data?.status) {
        message.success(t('order_deleted', 'Sales order deleted successfully'));
        fetchOrders(pagination.page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete sales order');
    }
  };

  // Open Deposit Modal
  const handleOpenDepositModal = (order) => {
    setTargetOrderForDeposit(order);
    const balance = Math.max(0, parseFloat(order.grand_total || 0) - parseFloat(order.paid || 0));
    depositForm.setFieldsValue({
      amount: balance,
      date: dayjs(),
      paid_by: 'cash',
      note: `Deposit for ${order.reference_no}`
    });
    setDepositModalOpen(true);
  };

  // Submit Deposit
  const handleSubmitDeposit = async (values) => {
    if (!targetOrderForDeposit) return;
    setSubmittingDeposit(true);
    try {
      const res = await axios.post(`/api/admin/sales_orders/${targetOrderForDeposit.id}/deposits`, {
        amount: values.amount,
        date: values.date?.format('YYYY-MM-DD HH:mm:ss') || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        paid_by: values.paid_by,
        note: values.note
      });
      if (res.data?.status) {
        message.success('Deposit payment recorded successfully!');
        setDepositModalOpen(false);
        fetchOrders(pagination.page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to record deposit');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  // Open Status Modal
  const handleOpenStatusModal = (order) => {
    setTargetOrderForStatus(order);
    statusForm.setFieldsValue({
      order_status: order.order_status || 'pending',
      sale_status: order.sale_status || 'order',
      note: ''
    });
    setStatusModalOpen(true);
  };

  // Submit Status
  const handleSubmitStatus = async (values) => {
    if (!targetOrderForStatus) return;
    setSubmittingStatus(true);
    try {
      const res = await axios.put(`/api/admin/sales_orders/${targetOrderForStatus.id}/status`, values);
      if (res.data?.status) {
        message.success('Order status updated successfully');
        setStatusModalOpen(false);
        fetchOrders(pagination.page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Status Badges
  const renderOrderStatusTag = (status) => {
    switch (status) {
      case 'approved':
        return <Tag color="green" icon={<CheckCircleOutlined />}>APPROVED</Tag>;
      case 'rejected':
        return <Tag color="red" icon={<CloseCircleOutlined />}>REJECTED</Tag>;
      default:
        return <Tag color="orange" icon={<ClockCircleOutlined />}>PENDING</Tag>;
    }
  };

  const renderSaleStatusTag = (status) => {
    switch (status) {
      case 'completed':
        return <Tag color="geekblue">COMPLETED</Tag>;
      case 'canceled':
        return <Tag color="default">CANCELED</Tag>;
      default:
        return <Tag color="purple">ORDER</Tag>;
    }
  };

  const renderPaymentStatusTag = (status, balance) => {
    if (balance <= 0) return <Tag color="success">PAID</Tag>;
    if (status === 'partial') return <Tag color="cyan">PARTIAL</Tag>;
    return <Tag color="error">PENDING</Tag>;
  };

  // Columns
  const columns = [
    {
      title: t('date', 'Date'),
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (val) => val ? dayjs(val).format('DD/MM/YYYY') : '—'
    },
    {
      title: t('reference_no', 'Reference No'),
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 170,
      render: (val, record) => (
        <a
          onClick={() => {
            setViewOrderId(record.id);
            setIsViewModalOpen(true);
          }}
          style={{ fontWeight: 700, color: isDark ? '#60a5fa' : '#2563eb' }}
        >
          {val}
        </a>
      )
    },
    {
      title: t('customer', 'Customer'),
      dataIndex: 'customer',
      key: 'customer',
      render: (val, record) => (
        <div>
          <div style={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#1e293b' }}>{val}</div>
          {record.customer_phone && (
            <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>Tel: {record.customer_phone}</div>
          )}
        </div>
      )
    },
    {
      title: t('biller', 'Biller'),
      dataIndex: 'biller',
      key: 'biller',
      responsive: ['lg'],
      render: (val) => <span style={{ fontSize: 12.5 }}>{val || '—'}</span>
    },
    {
      title: t('warehouse', 'Warehouse'),
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      responsive: ['md'],
      render: (val) => <span style={{ fontSize: 12.5 }}>{val || '—'}</span>
    },
    {
      title: t('grand_total', 'Grand Total'),
      dataIndex: 'grand_total',
      key: 'grand_total',
      align: 'right',
      width: 125,
      render: (val) => (
        <Text strong style={{ color: isDark ? '#4ade80' : '#15803d' }}>
          {formatCurrency(val)}
        </Text>
      )
    },
    {
      title: t('paid_deposit', 'Paid / Deposit'),
      dataIndex: 'paid',
      key: 'paid',
      align: 'right',
      width: 115,
      render: (val) => (
        <span style={{ color: parseFloat(val) > 0 ? (isDark ? '#38bdf8' : '#0284c7') : '#94a3b8' }}>
          {formatCurrency(val)}
        </span>
      )
    },
    {
      title: t('balance', 'Balance'),
      dataIndex: 'balance',
      key: 'balance',
      align: 'right',
      width: 115,
      render: (val) => {
        const num = parseFloat(val || 0);
        return (
          <span style={{ fontWeight: num > 0 ? 700 : 500, color: num > 0 ? (isDark ? '#f87171' : '#dc2626') : '#94a3b8' }}>
            {formatCurrency(num)}
          </span>
        );
      }
    },
    {
      title: t('approval_status', 'Order Status'),
      dataIndex: 'order_status',
      key: 'order_status',
      align: 'center',
      width: 130,
      render: (val) => renderOrderStatusTag(val)
    },
    {
      title: t('sale_status', 'Sale Status'),
      dataIndex: 'sale_status',
      key: 'sale_status',
      align: 'center',
      width: 120,
      render: (val) => renderSaleStatusTag(val)
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      align: 'center',
      width: 90,
      render: (_, record) => {
        const isCompleted = record.sale_status === 'completed';
        const isApproved = record.order_status === 'approved';

        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: t('view_details', 'View Order Details'),
            onClick: () => {
              setViewOrderId(record.id);
              setIsViewModalOpen(true);
            }
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('edit_order', 'Edit Sale Order'),
            disabled: isCompleted,
            onClick: () => navigate(`/admins/sales/orders/edit/${record.id}`)
          },
          {
            type: 'divider'
          },
          {
            key: 'convert',
            icon: <ArrowRightOutlined style={{ color: '#16a34a' }} />,
            label: <span style={{ color: '#16a34a', fontWeight: 600 }}>{t('convert_to_sale', 'Convert to Sale (Invoice)')}</span>,
            disabled: isCompleted,
            onClick: () => handleConvertToSale(record)
          },
          {
            key: 'status',
            icon: <CheckCircleOutlined />,
            label: t('update_status', 'Approve / Reject Status'),
            onClick: () => handleOpenStatusModal(record)
          },
          {
            key: 'deposit',
            icon: <DollarCircleOutlined />,
            label: t('add_deposit', 'Add Deposit Payment'),
            disabled: isCompleted,
            onClick: () => handleOpenDepositModal(record)
          },
          {
            type: 'divider'
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            danger: true,
            disabled: isCompleted,
            label: (
              <Popconfirm
                title="Delete Sale Order"
                description={`Are you sure you want to delete order ${record.reference_no}?`}
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDeleteOrder(record.id)}
              >
                <span>{t('delete', 'Delete')}</span>
              </Popconfirm>
            )
          }
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button size="small" type="text" icon={<MoreOutlined style={{ fontSize: 16 }} />} />
          </Dropdown>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: isDark ? '#0b1120' : '#f8fafc' }}>
      {/* Top Header & Navigation Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            <ShoppingCartOutlined style={{ marginRight: 10, color: isDark ? '#38bdf8' : '#2563eb' }} />
            {t('sales_orders_title', 'Sales Orders (SO)')}
          </Title>
          <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 13 }}>
            {t('sales_orders_desc', 'Track customer orders, advance deposits, approval status, and convert to Commercial Sales.')}
          </Text>
        </div>

        <Space wrap size={10}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchOrders(pagination.page)}
            loading={loading}
            style={{ borderRadius: 8 }}
          >
            {t('refresh', 'Refresh')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admins/sales/orders/add')}
            style={{
              borderRadius: 8,
              background: '#0284c7',
              borderColor: '#0284c7',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
            }}
          >
            {t('add_sale_order', 'Add Sale Order')}
          </Button>
        </Space>
      </div>

      {/* Submodule Navigation Switcher (AURA_v1 Concept: Sales vs Sales Orders) */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<ShoppingCartOutlined />}
            onClick={() => navigate('/admins/sales')}
            style={{ borderRadius: 6, fontWeight: 500 }}
          >
            {t('commercial_sales', 'Commercial Sales (Invoices)')}
          </Button>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            style={{ borderRadius: 6, fontWeight: 600, background: '#0284c7', borderColor: '#0284c7' }}
          >
            {t('sales_orders', 'Sales Orders (SO)')}
          </Button>
        </div>
      </div>

      {/* KPI Telemetry Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6} lg={6}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>TOTAL ORDERS</span>}
              value={metrics.totalOrders}
              prefix={<FileTextOutlined style={{ color: '#3b82f6', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>TOTAL ORDER VALUE</span>}
              value={metrics.totalRevenue}
              precision={2}
              prefix="$"
              valueStyle={{ fontWeight: 800, color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7' }}>DEPOSITS COLLECTED</span>}
              value={metrics.totalCollected}
              precision={2}
              prefix="$"
              valueStyle={{ fontWeight: 800, color: '#0284c7' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card
            size="small"
            style={{
              borderRadius: 10,
              background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>PENDING APPROVAL</span>}
              value={metrics.pendingCount}
              prefix={<ClockCircleOutlined style={{ color: '#d97706', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 800, color: '#d97706' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter Strip */}
      <Card
        bordered={false}
        style={{
          borderRadius: 10,
          marginBottom: 16,
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'
        }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder={t('search_so_placeholder', 'Search Ref, Customer, Biller...')}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => fetchOrders(1)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={orderStatus}
              onChange={(val) => setOrderStatus(val)}
              placeholder="Approval Status"
            >
              <Option value="all">All Approval</Option>
              <Option value="approved">Approved</Option>
              <Option value="pending">Pending</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={saleStatus}
              onChange={(val) => setSaleStatus(val)}
              placeholder="Sale Status"
            >
              <Option value="all">All Statuses</Option>
              <Option value="order">Order Active</Option>
              <Option value="completed">Completed</Option>
              <Option value="canceled">Canceled</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={warehouseId}
              onChange={(val) => setWarehouseId(val)}
              placeholder="Warehouse"
            >
              <Option value="all">All Warehouses</Option>
              {metadata.warehouses.map(w => (
                <Option key={w.id} value={w.id}>{w.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              format="YYYY-MM-DD"
            />
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card
        bordered={false}
        style={{
          borderRadius: 10,
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (p, l) => {
              setPagination(prev => ({ ...prev, page: p, limit: l }));
              fetchOrders(p);
            },
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} Sales Orders`
          }}
          locale={{ emptyText: <Empty description="No Sales Orders found matching current criteria" /> }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* View Detail Modal */}
      {isViewModalOpen && (
        <SaleOrderDetailModal
          orderId={viewOrderId}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewOrderId(null);
          }}
          onConvertToSale={() => {
            setIsViewModalOpen(false);
            fetchOrders(pagination.page);
          }}
        />
      )}

      {/* Record Deposit Modal */}
      <Modal
        title={`Add Customer Deposit: ${targetOrderForDeposit?.reference_no}`}
        open={depositModalOpen}
        onCancel={() => setDepositModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={depositForm} layout="vertical" onFinish={handleSubmitDeposit}>
          <Form.Item name="amount" label="Deposit Amount ($)" rules={[{ required: true, message: 'Please enter amount' }]}>
            <InputNumber min={0.01} step={1} style={{ width: '100%' }} size="large" />
          </Form.Item>
          <Form.Item name="date" label="Payment Date" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paid_by" label="Payment Method" rules={[{ required: true }]}>
            <Select>
              <Option value="cash">Cash</Option>
              <Option value="bank_transfer">ABA / Bank Transfer</Option>
              <Option value="cheque">Cheque</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="note" label="Payment Note">
            <Input.TextArea rows={2} placeholder="Reference number or check voucher notes..." />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDepositModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submittingDeposit}>
              Record Deposit
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        title={`Update Order Status: ${targetOrderForStatus?.reference_no}`}
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={statusForm} layout="vertical" onFinish={handleSubmitStatus}>
          <Form.Item name="order_status" label="Approval Status" rules={[{ required: true }]}>
            <Select>
              <Option value="approved">Approved</Option>
              <Option value="pending">Pending</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Form.Item>
          <Form.Item name="sale_status" label="Sales Order Status" rules={[{ required: true }]}>
            <Select>
              <Option value="order">Order Active</Option>
              <Option value="completed">Completed</Option>
              <Option value="canceled">Canceled</Option>
            </Select>
          </Form.Item>
          <Form.Item name="note" label="Status Audit Note">
            <Input.TextArea rows={3} placeholder="Reason for status change or manager approval notes..." />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setStatusModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submittingStatus}>
              Save Status
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
