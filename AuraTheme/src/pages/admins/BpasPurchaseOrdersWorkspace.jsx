import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
  Row,
  Col,
  Statistic,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  Typography,
  Modal,
  Spin,
  Badge,
  Form
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  AuditOutlined,
  RollbackOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  InboxOutlined,
  LinkOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { formatCurrency } from '../../utils/uiTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function BpasPurchaseOrdersWorkspace({ embedded = false }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [metrics, setMetrics] = useState({
    total_orders: 0,
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    completed_count: 0,
    total_ordered_qty: 0,
    total_order_amount: 0,
  });

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOrderStatus, setFilterOrderStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState(null);

  // Metadata
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Rejection Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Fetch Metadata
  const fetchMetadata = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/purchase_orders/meta/options');
      if (res.data?.success && res.data.data) {
        setWarehouses(res.data.data.warehouses || []);
        setSuppliers(res.data.data.suppliers || []);
      }
    } catch (err) {
      console.warn('Failed to load purchase orders metadata:', err.message);
    }
  }, []);

  // Fetch Records
  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        search: filterSearch,
        warehouse_id: filterWarehouse,
        supplier_id: filterSupplier,
        status: filterStatus,
        order_status: filterOrderStatus,
      };
      if (filterDateRange && filterDateRange[0] && filterDateRange[1]) {
        params.start_date = filterDateRange[0].format('YYYY-MM-DD');
        params.end_date = filterDateRange[1].format('YYYY-MM-DD');
      }

      const res = await axios.get('/api/admin/purchase_orders', { params });
      if (res.data?.success) {
        const { data, pagination: pag, kpis } = res.data.data;
        setRecords(data || []);
        setPagination({
          page: pag.page,
          limit: pag.limit,
          total: pag.totalRecords,
          totalPages: pag.totalPages,
        });
        if (kpis) {
          setMetrics(kpis);
        }
      }
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
      message.error(err.response?.data?.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filterSearch, filterWarehouse, filterSupplier, filterStatus, filterOrderStatus, filterDateRange]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchRecords(1);
  }, [fetchRecords]);

  // Open Detail / Print Modal
  const handleOpenDetail = async (record) => {
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setSelectedRecord(record);
    try {
      const res = await axios.get(`/api/admin/purchase_orders/${record.id}`);
      if (res.data?.success) {
        setSelectedRecord(res.data.data);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load purchase order details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Quick Approve
  const handleApprove = async (id) => {
    try {
      const res = await axios.post(`/api/admin/purchase_orders/${id}/approve`);
      if (res.data?.success) {
        message.success('Purchase order approved successfully.');
        fetchRecords(pagination.page);
        if (selectedRecord && selectedRecord.id === id) {
          handleOpenDetail({ id });
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to approve purchase order');
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  // Submit Reject
  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('Please enter a rejection reason.');
      return;
    }
    setRejectLoading(true);
    try {
      const res = await axios.post(`/api/admin/purchase_orders/${rejectingId}/reject`, {
        reason: rejectReason.trim(),
      });
      if (res.data?.success) {
        message.success('Purchase order rejected.');
        setIsRejectModalOpen(false);
        fetchRecords(pagination.page);
        if (selectedRecord && selectedRecord.id === rejectingId) {
          handleOpenDetail({ id: rejectingId });
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to reject purchase order');
    } finally {
      setRejectLoading(false);
    }
  };

  // Unapprove Order (revert to pending)
  const handleUnapprove = async (id) => {
    try {
      const res = await axios.post(`/api/admin/purchase_orders/${id}/unapprove`);
      if (res.data?.success) {
        message.success('Purchase order reverted to pending.');
        fetchRecords(pagination.page);
        if (selectedRecord && selectedRecord.id === id) {
          handleOpenDetail({ id });
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to unapprove purchase order');
    }
  };

  // Delete Order
  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/purchase_orders/${id}`);
      if (res.data?.success) {
        message.success('Purchase order deleted successfully.');
        fetchRecords(pagination.page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete purchase order');
    }
  };

  // Status tag styling
  const renderStatusTag = (status) => {
    switch (status) {
      case 'approved':
        return <Tag icon={<CheckCircleOutlined />} color="success">Approved</Tag>;
      case 'pending':
        return <Tag icon={<ClockCircleOutlined />} color="warning">Pending Approval</Tag>;
      case 'rejected':
        return <Tag icon={<CloseCircleOutlined />} color="error">Rejected</Tag>;
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="blue">Completed</Tag>;
      case 'cancelled':
        return <Tag color="default">Cancelled</Tag>;
      default:
        return <Tag color="gold">{status || 'Pending'}</Tag>;
    }
  };

  // Goods receipt tag
  const renderReceiptTag = (orderStatus, received) => {
    if (received == 1 || orderStatus === 'completed') {
      return <Tag color="green" icon={<InboxOutlined />}>Received</Tag>;
    }
    if (orderStatus === 'partial') {
      return <Tag color="processing" icon={<InboxOutlined />}>Partial Receipt</Tag>;
    }
    return <Tag color="default">Pending Receipt</Tag>;
  };

  // Table Columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (d) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{dayjs(d).format('YYYY-MM-DD')}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(d).format('HH:mm')}</Text>
        </Space>
      ),
    },
    {
      title: 'Reference No',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 150,
      render: (ref, record) => (
        <a
          href="#view"
          onClick={(e) => {
            e.preventDefault();
            handleOpenDetail(record);
          }}
          style={{ fontWeight: 600, color: '#2563eb' }}
        >
          {ref}
        </a>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (sup, r) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <ShopOutlined style={{ color: '#8c8c8c' }} />
            <Text strong style={{ fontSize: 13 }}>{sup || 'General Supplier'}</Text>
          </Space>
          {r.purchase_ref && (
            <Text type="secondary" style={{ fontSize: 11 }}>Ref: {r.purchase_ref}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      width: 160,
      render: (wh) => (
        <Space size={4}>
          <ApartmentOutlined style={{ color: '#8c8c8c' }} />
          <span>{wh || '-'}</span>
        </Space>
      ),
    },
    {
      title: 'Linked PR',
      key: 'pr_link',
      width: 140,
      render: (_, r) => {
        if (r.purchase_request_ref) {
          return (
            <Tag color="purple" icon={<LinkOutlined />} style={{ borderRadius: 6 }}>
              {r.purchase_request_ref}
            </Tag>
          );
        }
        return <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
      },
    },
    {
      title: 'Ordered Qty',
      dataIndex: 'total_qty',
      key: 'total_qty',
      align: 'center',
      width: 130,
      render: (qty, r) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{parseFloat(qty || 0).toLocaleString()} units</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>({r.items_count || 1} line item{r.items_count > 1 ? 's' : ''})</Text>
        </Space>
      ),
    },
    {
      title: 'Grand Total',
      dataIndex: 'grand_total',
      key: 'grand_total',
      align: 'right',
      width: 140,
      render: (val) => (
        <Text strong style={{ color: '#16a34a', fontSize: 14 }}>
          {formatCurrency(val || 0)}
        </Text>
      ),
    },
    {
      title: 'Approval',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 140,
      render: (st) => renderStatusTag(st),
    },
    {
      title: 'Receipt',
      key: 'receipt_status',
      align: 'center',
      width: 130,
      render: (_, r) => renderReceiptTag(r.order_status, r.received),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 170,
      render: (_, record) => {
        const isApproved = record.status === 'approved';
        const isPending = record.status === 'pending' || !record.status;
        const isRejected = record.status === 'rejected';
        const hasReceipt = record.received == 1 || record.order_status === 'completed';

        return (
          <Space size={4}>
            <Tooltip title="View / Print PO">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleOpenDetail(record)}
              />
            </Tooltip>

            {isPending && (
              <>
                <Tooltip title="Approve Purchase Order">
                  <Button
                    type="text"
                    size="small"
                    style={{ color: '#16a34a' }}
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleApprove(record.id)}
                  />
                </Tooltip>
                <Tooltip title="Reject Purchase Order">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleOpenRejectModal(record.id)}
                  />
                </Tooltip>
              </>
            )}

            {isApproved && !hasReceipt && (
              <Tooltip title="Revert Approval to Pending">
                <Button
                  type="text"
                  size="small"
                  style={{ color: '#ca8a04' }}
                  icon={<RollbackOutlined />}
                  onClick={() => handleUnapprove(record.id)}
                />
              </Tooltip>
            )}

            {isRejected && (
              <Tooltip title="Reopen / Revert to Pending">
                <Button
                  type="text"
                  size="small"
                  style={{ color: '#2563eb' }}
                  icon={<RollbackOutlined />}
                  onClick={() => handleUnapprove(record.id)}
                />
              </Tooltip>
            )}

            {!hasReceipt && (
              <Tooltip title="Edit Purchase Order">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/admins/purchases_orders/edit/${record.id}`)}
                />
              </Tooltip>
            )}

            {!hasReceipt && (
              <Popconfirm
                title="Delete Purchase Order"
                description={`Are you sure you want to delete PO ${record.reference_no}?`}
                onConfirm={() => handleDelete(record.id)}
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: embedded ? '0' : '20px' }}>
      {/* 1. Header & KPI Cards */}
      <div style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={embedded ? 4 : 3} style={{ margin: 0 }}>
              <ShoppingCartOutlined style={{ marginRight: 8, color: '#2563eb' }} />
              Purchase Orders Management
            </Title>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              Issue confirmed supplier purchase orders, track approval workflows, and prepare for Goods Receiving.
            </Paragraph>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchRecords(pagination.page)}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/admins/purchases_orders/add')}
                style={{ background: '#2563eb' }}
              >
                Add Purchase Order
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Metrics Row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card bordered={false} className="shadow-sm" style={{ borderRadius: 10, background: '#f8fafc' }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Total Orders</Text>}
                value={metrics.total_orders || 0}
                prefix={<FileTextOutlined style={{ color: '#2563eb', marginRight: 6 }} />}
                valueStyle={{ fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card bordered={false} className="shadow-sm" style={{ borderRadius: 10, background: '#fefce8' }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Pending Approval</Text>}
                value={metrics.pending_count || 0}
                prefix={<ClockCircleOutlined style={{ color: '#ca8a04', marginRight: 6 }} />}
                valueStyle={{ color: '#ca8a04', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card bordered={false} className="shadow-sm" style={{ borderRadius: 10, background: '#f0fdf4' }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Approved Orders</Text>}
                value={metrics.approved_count || 0}
                prefix={<CheckCircleOutlined style={{ color: '#16a34a', marginRight: 6 }} />}
                valueStyle={{ color: '#16a34a', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card bordered={false} className="shadow-sm" style={{ borderRadius: 10, background: '#eff6ff' }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Total Qty Ordered</Text>}
                value={metrics.total_ordered_qty || 0}
                precision={0}
                suffix="units"
                valueStyle={{ color: '#1d4ed8', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={24} md={16} lg={8}>
            <Card bordered={false} className="shadow-sm" style={{ borderRadius: 10, background: '#faf5ff' }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Total Order Value</Text>}
                value={metrics.total_order_amount || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#7e22ce', fontWeight: 800 }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 2. Filter Bar */}
      <Card
        bordered={false}
        className="shadow-sm"
        style={{ borderRadius: 12, marginBottom: 16, background: '#ffffff' }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search reference, supplier, note..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onPressEnter={() => fetchRecords(1)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={filterWarehouse}
              onChange={(val) => setFilterWarehouse(val)}
              placeholder="Warehouse"
            >
              <Option value="all">All Warehouses</Option>
              {warehouses.map((w) => (
                <Option key={w.id} value={w.id}>{w.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={filterSupplier}
              onChange={(val) => setFilterSupplier(val)}
              placeholder="Supplier"
            >
              <Option value="all">All Suppliers</Option>
              {suppliers.map((s) => (
                <Option key={s.id} value={s.id}>{s.company && s.company !== '-' ? s.company : s.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              placeholder="Approval Status"
            >
              <Option value="all">All Approvals</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              style={{ width: '100%' }}
              value={filterOrderStatus}
              onChange={(val) => setFilterOrderStatus(val)}
              placeholder="Receipt Status"
            >
              <Option value="all">All Receipts</Option>
              <Option value="pending">Pending Receipt</Option>
              <Option value="partial">Partial</Option>
              <Option value="completed">Received</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={filterDateRange}
              onChange={(dates) => setFilterDateRange(dates)}
              format="YYYY-MM-DD"
            />
          </Col>
        </Row>
      </Card>

      {/* 3. Table */}
      <Card
        bordered={false}
        className="shadow-sm"
        style={{ borderRadius: 12, background: '#ffffff' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['15', '25', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
            onChange: (page, limit) => {
              setPagination(prev => ({ ...prev, page, limit }));
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 4. Detail / Print View Modal */}
      <Modal
        title={null}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        {detailLoading || !selectedRecord ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12, color: '#6b7280' }}>Loading purchase order document...</div>
          </div>
        ) : (
          <div id="printable-po-modal" style={{ padding: '10px 15px' }}>
            {/* Header / Biller info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: 16 }}>
              <div>
                <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                  {selectedRecord.biller_name || 'AURA GLOBAL SUPPLY & DISTRIBUTION'}
                </Title>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  {selectedRecord.biller_address || 'Phnom Penh, Cambodia'}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tel: {selectedRecord.biller_phone || '+855 23 888 999'} | Email: {selectedRecord.biller_email || 'procurement@auraglobal.com'}
                </Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Title level={3} style={{ margin: 0, color: '#2563eb', letterSpacing: 1 }}>
                  PURCHASE ORDER
                </Title>
                <Tag color="blue" style={{ fontSize: 13, fontWeight: 700, padding: '4px 10px', marginTop: 4 }}>
                  {selectedRecord.reference_no}
                </Tag>
                <div style={{ marginTop: 4 }}>
                  {renderStatusTag(selectedRecord.status)}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 20 }}>
              <Col span={12}>
                <Card size="small" title={<Text strong>Supplier Details</Text>} style={{ height: '100%', background: '#f8fafc' }}>
                  <Text strong style={{ fontSize: 14 }}>{selectedRecord.supplier_company || selectedRecord.supplier}</Text>
                  {selectedRecord.supplier_contact_name && (
                    <div><Text type="secondary">Attn: {selectedRecord.supplier_contact_name}</Text></div>
                  )}
                  {selectedRecord.supplier_phone && (
                    <div><Text type="secondary">Phone: {selectedRecord.supplier_phone}</Text></div>
                  )}
                  {selectedRecord.supplier_email && (
                    <div><Text type="secondary">Email: {selectedRecord.supplier_email}</Text></div>
                  )}
                  {selectedRecord.supplier_address && (
                    <div><Text type="secondary">Address: {selectedRecord.supplier_address}</Text></div>
                  )}
                  {selectedRecord.supplier_vat_no && (
                    <div><Text type="secondary">VAT/Tax ID: {selectedRecord.supplier_vat_no}</Text></div>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title={<Text strong>Order & Delivery Specs</Text>} style={{ height: '100%', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">Order Date:</Text>
                    <Text strong>{dayjs(selectedRecord.date).format('YYYY-MM-DD HH:mm')}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">Deliver To Warehouse:</Text>
                    <Text strong>{selectedRecord.warehouse_name || '-'}</Text>
                  </div>
                  {selectedRecord.purchase_request_ref && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text type="secondary">Source Purchase Request:</Text>
                      <Tag color="purple">{selectedRecord.purchase_request_ref}</Tag>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">Expected Delivery:</Text>
                    <Text strong>{selectedRecord.deadline ? dayjs(selectedRecord.deadline).format('YYYY-MM-DD') : 'Standard Delivery'}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">Payment Term:</Text>
                    <Text>{selectedRecord.payment_term ? `${selectedRecord.payment_term} Days` : 'Due upon invoice'}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Goods Receipt Status:</Text>
                    {renderReceiptTag(selectedRecord.order_status, selectedRecord.received)}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Items Table */}
            <Table
              dataSource={selectedRecord.items || []}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
              columns={[
                {
                  title: '#',
                  render: (_, __, idx) => idx + 1,
                  width: 45,
                  align: 'center',
                },
                {
                  title: 'Product Description',
                  dataIndex: 'product_name',
                  key: 'product_name',
                  render: (name, item) => (
                    <div>
                      <Text strong>{name}</Text>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        Code: {item.product_code || '-'} {item.remarks ? `| Note: ${item.remarks}` : ''}
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Unit',
                  dataIndex: 'product_unit_code',
                  key: 'product_unit_code',
                  width: 80,
                  align: 'center',
                  render: (u) => u || 'Unit',
                },
                {
                  title: 'Ordered',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 90,
                  align: 'center',
                  render: (qty) => <Text strong>{parseFloat(qty || 0).toLocaleString()}</Text>,
                },
                {
                  title: 'Received',
                  dataIndex: 'quantity_received',
                  key: 'quantity_received',
                  width: 90,
                  align: 'center',
                  render: (rec) => (
                    <Text style={{ color: parseFloat(rec || 0) > 0 ? '#16a34a' : '#9ca3af' }}>
                      {parseFloat(rec || 0).toLocaleString()}
                    </Text>
                  ),
                },
                {
                  title: 'Balance',
                  dataIndex: 'quantity_balance',
                  key: 'quantity_balance',
                  width: 90,
                  align: 'center',
                  render: (bal, r) => {
                    const balance = r.quantity_balance !== undefined ? r.quantity_balance : (r.quantity - (r.quantity_received || 0));
                    return <Text strong>{parseFloat(balance || 0).toLocaleString()}</Text>;
                  },
                },
                {
                  title: 'Unit Cost',
                  dataIndex: 'unit_cost',
                  key: 'unit_cost',
                  width: 100,
                  align: 'right',
                  render: (cost) => formatCurrency(cost || 0),
                },
                {
                  title: 'Discount',
                  dataIndex: 'item_discount',
                  key: 'item_discount',
                  width: 80,
                  align: 'right',
                  render: (disc) => formatCurrency(disc || 0),
                },
                {
                  title: 'Subtotal',
                  dataIndex: 'subtotal',
                  key: 'subtotal',
                  width: 110,
                  align: 'right',
                  render: (sub) => <Text strong>{formatCurrency(sub || 0)}</Text>,
                },
              ]}
            />

            {/* Financial Summary & Notes */}
            <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
              <Col span={14}>
                {selectedRecord.note && (
                  <Card size="small" title={<Text strong>Order Notes / Instructions</Text>} style={{ background: '#f8fafc', marginBottom: 12 }}>
                    <Paragraph style={{ margin: 0, fontSize: 13 }}>{selectedRecord.note}</Paragraph>
                  </Card>
                )}

                {/* Approval Audit Trail */}
                <Card size="small" title={<Text strong>Audit Trail</Text>} style={{ background: '#f8fafc' }}>
                  <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
                    <div>
                      <Text type="secondary">Created by: </Text>
                      <Text strong>{selectedRecord.creator_fullname || selectedRecord.creator_username || 'Administrator'}</Text>
                    </div>
                    {selectedRecord.approved_by && (
                      <div>
                        <Text type="secondary">Approved by: </Text>
                        <Text strong style={{ color: '#16a34a' }}>{selectedRecord.approver_fullname || selectedRecord.approver_username || 'Authorized Officer'}</Text>
                        <Text type="secondary"> on {dayjs(selectedRecord.approved_date).format('YYYY-MM-DD HH:mm')}</Text>
                      </div>
                    )}
                    {selectedRecord.rejected_by && (
                      <div>
                        <Text type="secondary">Rejected by: </Text>
                        <Text strong style={{ color: '#dc2626' }}>{selectedRecord.rejecter_fullname || selectedRecord.rejecter_username || 'Administrator'}</Text>
                        <Text type="secondary"> on {dayjs(selectedRecord.rejected_date).format('YYYY-MM-DD HH:mm')}</Text>
                        {selectedRecord.reject_reason && (
                          <div style={{ color: '#dc2626', marginTop: 2 }}>Reason: {selectedRecord.reject_reason}</div>
                        )}
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>

              <Col span={10}>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text type="secondary">Items Total:</Text>
                    <Text strong>{formatCurrency(selectedRecord.total || 0)}</Text>
                  </div>
                  {parseFloat(selectedRecord.order_discount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">Order Discount:</Text>
                      <Text style={{ color: '#dc2626' }}>-{formatCurrency(selectedRecord.order_discount)}</Text>
                    </div>
                  )}
                  {parseFloat(selectedRecord.order_tax || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">Order Tax:</Text>
                      <Text>+{formatCurrency(selectedRecord.order_tax)}</Text>
                    </div>
                  )}
                  {parseFloat(selectedRecord.shipping || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary">Shipping / Freight:</Text>
                      <Text>+{formatCurrency(selectedRecord.shipping)}</Text>
                    </div>
                  )}
                  <Divider style={{ margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 15 }}>Grand Total:</Text>
                    <Text strong style={{ fontSize: 20, color: '#16a34a' }}>
                      {formatCurrency(selectedRecord.grand_total || 0)}
                    </Text>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Actions in Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <Button onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={() => window.print()}
              >
                Print PO Note
              </Button>
              {selectedRecord.status === 'pending' && (
                <>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenRejectModal(selectedRecord.id);
                    }}
                  >
                    Reject Order
                  </Button>
                  <Button
                    type="primary"
                    style={{ background: '#16a34a' }}
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleApprove(selectedRecord.id)}
                  >
                    Approve Order
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 5. Rejection Reason Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#dc2626' }} />
            <span>Reject Purchase Order</span>
          </Space>
        }
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        onOk={handleConfirmReject}
        confirmLoading={rejectLoading}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <Paragraph type="secondary">
          Please provide a reason for rejecting this purchase order. The requester and procurement team will be notified.
        </Paragraph>
        <TextArea
          rows={4}
          placeholder="e.g., Exceeds department budget allocation, supplier quotation expired, duplicate order..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
