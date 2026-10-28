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
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { formatCurrency } from '../../utils/uiTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function BpasPurchaseRequestsWorkspace({ embedded = false }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [metrics, setMetrics] = useState({
    total_requests: 0,
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    completed_count: 0,
    total_requested_qty: 0,
    total_estimated_amount: 0,
  });

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState(null);

  // Metadata
  const [warehouses, setWarehouses] = useState([]);
  const [departments, setDepartments] = useState([]);
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
      const res = await axios.get('/api/admin/purchase_requests/meta/options');
      if (res.data?.success && res.data.data) {
        setWarehouses(res.data.data.warehouses || []);
        setDepartments(res.data.data.departments || []);
        setSuppliers(res.data.data.suppliers || []);
      }
    } catch (err) {
      console.warn('Failed to load purchase requests metadata:', err.message);
    }
  }, []);

  // Fetch List
  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        search: filterSearch,
        warehouse_id: filterWarehouse,
        department_id: filterDepartment,
        supplier_id: filterSupplier,
        status: filterStatus,
      };

      if (filterDateRange && filterDateRange.length === 2) {
        params.start_date = filterDateRange[0].format('YYYY-MM-DD');
        params.end_date = filterDateRange[1].format('YYYY-MM-DD');
      }

      const res = await axios.get('/api/admin/purchase_requests', { params });
      if (res.data?.success) {
        setRecords(res.data.data.data || []);
        setPagination(res.data.data.pagination || { page, limit: 15, total: 0 });
        if (res.data.data.metrics) {
          setMetrics(res.data.data.metrics);
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filterSearch, filterWarehouse, filterDepartment, filterSupplier, filterStatus, filterDateRange]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchRecords(1);
  }, [fetchRecords]);

  // Open Detail Modal
  const handleOpenDetail = async (record) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/admin/purchase_requests/${record.id}`);
      if (res.data?.success) {
        setSelectedRecord(res.data.data);
      }
    } catch (err) {
      message.error('Failed to load detailed purchase request voucher');
    } finally {
      setDetailLoading(false);
    }
  };

  // Approve Request
  const handleApprove = async (id) => {
    try {
      const res = await axios.post(`/api/admin/purchase_requests/${id}/approve`);
      if (res.data?.success) {
        message.success('Purchase request approved successfully.');
        fetchRecords(pagination.page);
        if (selectedRecord && selectedRecord.id === id) {
          handleOpenDetail({ id });
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to approve purchase request');
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  // Submit Rejection
  const handleSubmitReject = async () => {
    if (!rejectingId) return;
    setRejectLoading(true);
    try {
      const res = await axios.post(`/api/admin/purchase_requests/${rejectingId}/reject`, { reason: rejectReason });
      if (res.data?.success) {
        message.success('Purchase request rejected.');
        setIsRejectModalOpen(false);
        fetchRecords(pagination.page);
        if (selectedRecord && selectedRecord.id === rejectingId) {
          handleOpenDetail({ id: rejectingId });
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to reject purchase request');
    } finally {
      setRejectLoading(false);
    }
  };

  // Unapprove Request (revert to pending)
  const handleUnapprove = async (id) => {
    try {
      const res = await axios.post(`/api/admin/purchase_requests/${id}/unapprove`);
      if (res.data?.success) {
        message.success('Purchase request reverted to pending.');
        fetchRecords(pagination.page);
        if (selectedRecord && selectedRecord.id === id) {
          handleOpenDetail({ id });
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to unapprove purchase request');
    }
  };

  // Delete Request
  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/purchase_requests/${id}`);
      if (res.data?.success) {
        message.success('Purchase request deleted successfully.');
        fetchRecords(pagination.page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete purchase request');
    }
  };

  // Status tag styling
  const renderStatusTag = (status) => {
    switch (status) {
      case 'approved':
        return <Tag icon={<CheckCircleOutlined />} color="success">Approved</Tag>;
      case 'pending':
      case 'requested':
        return <Tag icon={<ClockCircleOutlined />} color="warning">Pending Approval</Tag>;
      case 'rejected':
      case 'reject':
        return <Tag icon={<CloseCircleOutlined />} color="error">Rejected</Tag>;
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="cyan">Completed / PO Created</Tag>;
      case 'cancelled':
        return <Tag color="default">Cancelled</Tag>;
      default:
        return <Tag color="gold">{status || 'Pending'}</Tag>;
    }
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
      title: 'Department & Purpose',
      key: 'dep_purpose',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Space size={6}>
            <Tag color="geekblue" style={{ borderRadius: 8, fontSize: 11 }}>
              {r.department_name || 'General'}
            </Tag>
            <Text strong style={{ fontSize: 13 }}>{r.purpose || 'Stock Replenishment'}</Text>
          </Space>
          {r.required_date_text && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              Required: {r.required_date_text}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Destination Warehouse',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      width: 180,
      render: (wh) => (
        <Space size={4}>
          <ApartmentOutlined style={{ color: '#8c8c8c' }} />
          <span>{wh || '-'}</span>
        </Space>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 160,
      render: (sup) => (
        <Space size={4}>
          <ShopOutlined style={{ color: '#8c8c8c' }} />
          <span>{sup || 'General Supplier'}</span>
        </Space>
      ),
    },
    {
      title: 'Items & Qty',
      key: 'qty_summary',
      align: 'center',
      width: 130,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 14 }}>{parseFloat(r.total_qty || 0).toLocaleString()} units</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>({r.items_count || 1} line item{r.items_count > 1 ? 's' : ''})</Text>
        </Space>
      ),
    },
    {
      title: 'Est. Amount',
      dataIndex: 'grand_total',
      key: 'grand_total',
      align: 'right',
      width: 130,
      render: (amt) => (
        <Text strong style={{ color: '#0f172a', fontSize: 13 }}>
          {formatCurrency(parseFloat(amt || 0))}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (s) => renderStatusTag(s),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 160,
      render: (_, record) => {
        const isApproved = record.status === 'approved';
        const isRejected = record.status === 'rejected' || record.status === 'reject';
        const isCompleted = record.status === 'completed';

        return (
          <Space size={4}>
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleOpenDetail(record)}
              />
            </Tooltip>

            {/* Quick Approval / Rejection buttons */}
            {!isApproved && !isCompleted && (
              <Tooltip title="Approve Request">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                  onClick={() => handleApprove(record.id)}
                />
              </Tooltip>
            )}

            {!isRejected && !isCompleted && !isApproved && (
              <Tooltip title="Reject Request">
                <Button
                  type="text"
                  icon={<CloseCircleOutlined style={{ color: '#ef4444' }} />}
                  onClick={() => handleOpenRejectModal(record.id)}
                />
              </Tooltip>
            )}

            {isApproved && (
              <Tooltip title="Revert to Pending">
                <Button
                  type="text"
                  icon={<RollbackOutlined style={{ color: '#d97706' }} />}
                  onClick={() => handleUnapprove(record.id)}
                />
              </Tooltip>
            )}

            {!isCompleted && (
              <Tooltip title="Edit Request">
                <Button
                  type="text"
                  icon={<EditOutlined style={{ color: '#2563eb' }} />}
                  onClick={() => navigate(`/admins/products/purchase_requests/edit/${record.id}`)}
                />
              </Tooltip>
            )}

            {!isCompleted && (
              <Tooltip title="Delete Request">
                <Popconfirm
                  title="Delete Purchase Request?"
                  description="Are you sure you want to delete this purchase request?"
                  okText="Yes, Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: embedded ? '0' : '20px' }}>
      {/* KPI Statistic Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Total Requests</span>}
              value={metrics.total_requests || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#2563eb', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#1e293b' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Pending Approval</span>}
              value={metrics.pending_count || 0}
              prefix={<ClockCircleOutlined style={{ color: '#d97706', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#d97706' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Approved</span>}
              value={metrics.approved_count || 0}
              prefix={<CheckCircleOutlined style={{ color: '#10b981', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#10b981' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Rejected</span>}
              value={metrics.rejected_count || 0}
              prefix={<CloseCircleOutlined style={{ color: '#ef4444', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#ef4444' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Requested Units</span>}
              value={metrics.total_requested_qty || 0}
              suffix="units"
              prefix={<FileTextOutlined style={{ color: '#6366f1', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#6366f1' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Est. Value</span>}
              value={metrics.total_estimated_amount || 0}
              prefix={<span style={{ fontSize: 14, color: '#059669', marginRight: 4 }}>$</span>}
              precision={2}
              valueStyle={{ fontWeight: 700, color: '#059669' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Workspace Card */}
      <Card
        bordered={false}
        style={{
          borderRadius: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          background: '#fff'
        }}
      >
        {/* Header Toolbar */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 18 }} gutter={[12, 12]}>
          <Col xs={24} sm={12}>
            <Space align="center" size={10}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShoppingCartOutlined style={{ fontSize: 22, color: '#2563eb' }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                  Purchase Requests Management
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Internal material requisition, department demand planning, and multi-tier approval workflow
                </Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
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
                style={{ background: '#2563eb', borderColor: '#2563eb', fontWeight: 600 }}
                onClick={() => navigate('/admins/products/purchase_requests/add')}
              >
                Add Purchase Request
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filter Toolbar */}
        <Row gutter={[12, 12]} style={{ marginBottom: 18, background: '#f8fafc', padding: 14, borderRadius: 10 }}>
          <Col xs={24} sm={12} md={6} lg={5}>
            <Input
              placeholder="Search Ref, Supplier, Purpose..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onPressEnter={() => fetchRecords(1)}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="All Warehouses"
              value={filterWarehouse}
              onChange={(val) => setFilterWarehouse(val)}
            >
              <Option value="all">All Warehouses</Option>
              {warehouses.map(w => (
                <Option key={w.id} value={w.id}>{w.name}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="All Departments"
              value={filterDepartment}
              onChange={(val) => setFilterDepartment(val)}
            >
              <Option value="all">All Departments</Option>
              {departments.map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, opt) => (opt?.children || '').toLowerCase().includes(input.toLowerCase())}
              placeholder="All Suppliers"
              value={filterSupplier}
              onChange={(val) => setFilterSupplier(val)}
            >
              <Option value="all">All Suppliers</Option>
              {suppliers.map(s => (
                <Option key={s.id} value={s.id}>{s.company && s.company !== '-' ? `${s.company} (${s.name})` : s.name}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="All Statuses"
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
            >
              <Option value="all">All Statuses</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={filterDateRange}
              onChange={(dates) => setFilterDateRange(dates)}
            />
          </Col>
        </Row>

        {/* Data Table */}
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
            pageSizeOptions: ['10', '15', '25', '50'],
            onChange: (p, ps) => {
              setPagination(prev => ({ ...prev, page: p, limit: ps }));
              fetchRecords(p);
            },
          }}
          style={{ borderRadius: 8 }}
        />
      </Card>

      {/* Detail Voucher Modal */}
      <Modal
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          selectedRecord && selectedRecord.status !== 'approved' && selectedRecord.status !== 'completed' && (
            <Button
              key="approve"
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{ background: '#10b981', borderColor: '#10b981' }}
              onClick={() => handleApprove(selectedRecord.id)}
            >
              Approve Request
            </Button>
          ),
          selectedRecord && selectedRecord.status === 'approved' && (
            <Button
              key="unapprove"
              icon={<RollbackOutlined />}
              onClick={() => handleUnapprove(selectedRecord.id)}
            >
              Revert to Pending
            </Button>
          ),
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            Print Requisition
          </Button>
        ]}
        width={850}
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: '#2563eb' }} />
            <span>Purchase Request Voucher: {selectedRecord?.reference_no}</span>
          </Space>
        }
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="Loading purchase requisition details..." />
          </div>
        ) : selectedRecord ? (
          <div>
            {/* Header Voucher Card */}
            <div style={{
              background: '#f8fafc',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              border: '1px solid #e2e8f0'
            }}>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Text type="secondary">Requisition Information:</Text>
                  <div><Text strong style={{ fontSize: 16 }}>{selectedRecord.purpose || 'Stock Replenishment'}</Text></div>
                  <div><Text type="secondary">Department: </Text><Tag color="blue">{selectedRecord.department_name}</Tag></div>
                  <div><Text type="secondary">Requested By: </Text><Text strong>{selectedRecord.creator_fullname || selectedRecord.creator_username || 'Staff'}</Text></div>
                  {selectedRecord.required_date_text && (
                    <div><Text type="secondary">Target Delivery: </Text><Text strong>{selectedRecord.required_date_text}</Text></div>
                  )}
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Text type="secondary">Voucher Details:</Text>
                  <div><Text strong style={{ fontSize: 15 }}>{selectedRecord.reference_no}</Text></div>
                  <div><Text type="secondary">Request Date: {dayjs(selectedRecord.date).format('YYYY-MM-DD HH:mm')}</Text></div>
                  <div><Text type="secondary">Destination Warehouse: {selectedRecord.warehouse_name}</Text></div>
                  <div><Text type="secondary">Suggested Supplier: {selectedRecord.supplier || 'General Supplier'}</Text></div>
                  <div style={{ marginTop: 6 }}>
                    {renderStatusTag(selectedRecord.status)}
                  </div>
                </Col>
              </Row>

              {/* Approval History Banner */}
              {(selectedRecord.approved_by || selectedRecord.rejected_by) && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #cbd5e1' }}>
                  {selectedRecord.approved_by && (
                    <Text type="success" style={{ fontSize: 12 }}>
                      <CheckCircleOutlined style={{ marginRight: 4 }} />
                      Approved by {selectedRecord.approver_fullname || selectedRecord.approver_username || 'Manager'} on {dayjs(selectedRecord.approved_date).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  )}
                  {selectedRecord.rejected_by && (
                    <Text type="danger" style={{ fontSize: 12 }}>
                      <CloseCircleOutlined style={{ marginRight: 4 }} />
                      Rejected by {selectedRecord.rejecter_fullname || selectedRecord.rejecter_username || 'Manager'} on {dayjs(selectedRecord.rejected_date).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  )}
                </div>
              )}
            </div>

            {/* Requested Items Table */}
            <Title level={5} style={{ marginBottom: 10 }}>Requested Products & Quantities</Title>
            <Table
              dataSource={selectedRecord.items || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Product Information',
                  key: 'prod',
                  render: (_, it) => (
                    <div>
                      <Text strong>{it.product_name}</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Code: {it.product_code} | Unit: {it.product_unit_code || 'Unit'}
                        </Text>
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Warehouse QOH',
                  key: 'qoh',
                  align: 'center',
                  width: 130,
                  render: (_, it) => (
                    <Tag color={it.current_warehouse_qoh > 0 ? 'blue' : 'default'}>
                      {parseFloat(it.current_warehouse_qoh || it.qoh || 0)} in stock
                    </Tag>
                  )
                },
                {
                  title: 'Requested Qty',
                  dataIndex: 'quantity',
                  align: 'center',
                  width: 120,
                  render: (q) => <Text strong style={{ fontSize: 14 }}>{parseFloat(q || 1)}</Text>
                },
                {
                  title: 'Unit Cost',
                  dataIndex: 'unit_cost',
                  align: 'right',
                  width: 120,
                  render: (c) => formatCurrency(parseFloat(c || 0))
                },
                {
                  title: 'Subtotal',
                  dataIndex: 'subtotal',
                  align: 'right',
                  width: 130,
                  render: (st) => <Text strong style={{ fontSize: 13 }}>{formatCurrency(parseFloat(st || 0))}</Text>
                }
              ]}
              summary={(pageData) => {
                const totalUnits = pageData.reduce((acc, it) => acc + parseFloat(it.quantity || 0), 0);
                const totalAmt = pageData.reduce((acc, it) => acc + parseFloat(it.subtotal || 0), 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 700 }}>
                      <Table.Summary.Cell index={0}>Grand Total Requisition</Table.Summary.Cell>
                      <Table.Summary.Cell index={1} />
                      <Table.Summary.Cell index={2} align="center">{totalUnits.toLocaleString()} units</Table.Summary.Cell>
                      <Table.Summary.Cell index={3} />
                      <Table.Summary.Cell index={4} align="right" style={{ color: '#0f172a', fontSize: 14 }}>
                        {formatCurrency(totalAmt)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />

            {/* Note */}
            {selectedRecord.note && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Request Remarks / Business Need:</Text>
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, marginTop: 4 }}>
                  <Text>{selectedRecord.note}</Text>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ef4444' }} />
            <span>Reject Purchase Request</span>
          </Space>
        }
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        onOk={handleSubmitReject}
        confirmLoading={rejectLoading}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <Paragraph type="secondary">
          Please provide a reason for rejecting this purchase request. This will be visible to the requester and recorded in the audit trail.
        </Paragraph>
        <TextArea
          rows={3}
          placeholder="e.g. Budget exceeded for current quarter; re-submit next month..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
