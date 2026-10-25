import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Row,
  Col,
  Statistic,
  message,
  Popconfirm,
  Tooltip,
  Divider,
  Alert,
  Typography,
  Dropdown,
  Spin,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PrinterOutlined,
  DeleteOutlined,
  FileTextOutlined,
  EyeOutlined,
  EditOutlined,
  SwapOutlined,
  ArrowRightOutlined,
  CloseCircleOutlined,
  SendOutlined,
  InboxOutlined,
  WarningOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Option } = Select;
const { Text, Title } = Typography;

export default function BpasTransfersWorkspace({ embedded = false }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [stats, setStats] = useState({
    total_count: 0,
    count_pending: 0,
    count_approved: 0,
    count_in_transit: 0,
    count_partially_received: 0,
    count_completed: 0,
    count_cancelled: 0,
    total_grand_total: 0,
    total_in_transit_qty: 0,
  });
  const [pagination, setPagination] = useState({ current_page: 1, limit: 15, total_records: 0 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFromWh, setFilterFromWh] = useState('all');
  const [filterToWh, setFilterToWh] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Metadata
  const [metaWarehouses, setMetaWarehouses] = useState([]);

  // Modals
  // 1. Details Modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 2. Receive Modal
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [receiveTransferTarget, setReceiveTransferTarget] = useState(null);
  const [receiveForm] = Form.useForm();
  const [submittingReceive, setSubmittingReceive] = useState(false);
  const [receiveItemRows, setReceiveItemRows] = useState([]);

  // 3. Cancel Modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('aura_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch Metadata
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await axios.get('/api/admin/transfers/meta/options', { headers: getAuthHeaders() });
        if (res.data?.success) {
          setMetaWarehouses(res.data.data.warehouses || []);
        }
      } catch (err) {
        console.error('Error fetching transfer metadata:', err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch Transfers List
  const fetchTransfers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await axios.get('/api/admin/transfers', {
          params: {
            page,
            limit: pagination.limit,
            search: searchTerm,
            from_warehouse_id: filterFromWh,
            to_warehouse_id: filterToWh,
            status: filterStatus,
          },
          headers: getAuthHeaders(),
        });

        if (res.data?.success) {
          setTransfers(res.data.data || []);
          setStats(res.data.stats || {});
          setPagination(res.data.pagination || { current_page: page, limit: 15, total_records: 0 });
        }
      } catch (err) {
        message.error('Failed to load transfers');
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, filterFromWh, filterToWh, filterStatus, pagination.limit]
  );

  useEffect(() => {
    fetchTransfers(1);
  }, [fetchTransfers]);

  // Open Details Modal
  const handleOpenDetails = async (record) => {
    setLoadingDetail(true);
    setDetailModalVisible(true);
    try {
      const res = await axios.get(`/api/admin/transfers/${record.id}`, { headers: getAuthHeaders() });
      if (res.data?.success) {
        setSelectedTransfer(res.data.data);
      }
    } catch (err) {
      message.error('Failed to load transfer details');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Workflow Actions
  const handleApprove = async (id) => {
    try {
      const res = await axios.post(`/api/admin/transfers/${id}/approve`, {}, { headers: getAuthHeaders() });
      if (res.data?.success) {
        message.success('Transfer approved successfully');
        fetchTransfers(pagination.current_page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to approve transfer');
    }
  };

  const handleDispatch = async (id) => {
    try {
      const res = await axios.post(`/api/admin/transfers/${id}/dispatch`, {}, { headers: getAuthHeaders() });
      if (res.data?.success) {
        message.success('Transfer dispatched! Stock deducted and marked in-transit.');
        fetchTransfers(pagination.current_page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to dispatch transfer');
    }
  };

  // Open Receive Modal
  const handleOpenReceive = async (record) => {
    setReceiveTransferTarget(record);
    try {
      const res = await axios.get(`/api/admin/transfers/${record.id}`, { headers: getAuthHeaders() });
      if (res.data?.success) {
        const full = res.data.data;
        const initialRows = (full.items || []).map((item) => {
          const sent = parseFloat(item.quantity || 0);
          const already = parseFloat(item.received_quantity || 0);
          const remaining = Math.max(0, sent - already);
          return {
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_code: item.product_code,
            variant_name: item.variant_name,
            quantity: sent,
            remaining_to_receive: remaining,
            received_quantity: remaining,
            damaged_quantity: 0,
            shortage_quantity: 0,
          };
        });
        setReceiveItemRows(initialRows);
        receiveForm.setFieldsValue({ note: '', is_final: true });
        setReceiveModalVisible(true);
      }
    } catch (err) {
      message.error('Failed to load items for receipt');
    }
  };

  // Submit Receive
  const handleSubmitReceive = async (values) => {
    setSubmittingReceive(true);
    try {
      const payload = {
        note: values.note || '',
        is_final: values.is_final !== false,
        items: receiveItemRows.map((r) => ({
          id: r.id,
          product_id: r.product_id,
          received_quantity: parseFloat(r.received_quantity || 0),
          damaged_quantity: parseFloat(r.damaged_quantity || 0),
          shortage_quantity: parseFloat(r.shortage_quantity || 0),
        })),
      };

      const res = await axios.post(`/api/admin/transfers/${receiveTransferTarget.id}/receive`, payload, {
        headers: getAuthHeaders(),
      });
      if (res.data?.success) {
        message.success('Stock received and stocked into warehouse successfully!');
        setReceiveModalVisible(false);
        fetchTransfers(pagination.current_page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to receive transfer');
    } finally {
      setSubmittingReceive(false);
    }
  };

  // Handle Cancel
  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    setSubmittingCancel(true);
    try {
      const res = await axios.post(
        `/api/admin/transfers/${cancelTargetId}/cancel`,
        { reason: cancelReason },
        { headers: getAuthHeaders() }
      );
      if (res.data?.success) {
        message.success('Transfer cancelled successfully (stock reversed if dispatched)');
        setCancelModalVisible(false);
        setCancelReason('');
        setCancelTargetId(null);
        fetchTransfers(pagination.current_page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to cancel transfer');
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Status Badge Helper
  const getStatusTag = (status) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending Request</Tag>;
      case 'approved':
        return <Tag color="blue" icon={<CheckCircleOutlined />}>Approved Order</Tag>;
      case 'in_transit':
      case 'sent':
        return <Tag color="purple" icon={<SendOutlined />}>In Transit</Tag>;
      case 'partially_received':
        return <Tag color="gold" icon={<WarningOutlined />}>Partially Received</Tag>;
      case 'completed':
        return <Tag color="green" icon={<CheckCircleOutlined />}>Completed</Tag>;
      case 'cancelled':
        return <Tag color="red" icon={<CloseCircleOutlined />}>Cancelled</Tag>;
      case 'rejected':
        return <Tag color="volcano" icon={<CloseCircleOutlined />}>Rejected</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Action Menu
  const getActionMenu = (record) => {
    const items = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details & History',
        onClick: () => handleOpenDetails(record),
      },
    ];

    if (record.status === 'pending') {
      items.push({
        key: 'approve',
        icon: <CheckCircleOutlined style={{ color: '#2563eb' }} />,
        label: 'Approve Request',
        onClick: () => handleApprove(record.id),
      });
      items.push({
        key: 'dispatch',
        icon: <SendOutlined style={{ color: '#9333ea' }} />,
        label: 'Dispatch Stock Now',
        onClick: () => handleDispatch(record.id),
      });
    }

    if (record.status === 'approved') {
      items.push({
        key: 'dispatch',
        icon: <SendOutlined style={{ color: '#9333ea' }} />,
        label: 'Dispatch Stock',
        onClick: () => handleDispatch(record.id),
      });
    }

    if (['in_transit', 'sent', 'partially_received'].includes(record.status)) {
      items.push({
        key: 'receive',
        icon: <InboxOutlined style={{ color: '#16a34a' }} />,
        label: 'Receive Stock at Destination',
        onClick: () => handleOpenReceive(record),
      });
    }

    if (['draft', 'pending', 'approved'].includes(record.status)) {
      items.push({
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit Transfer',
        onClick: () => navigate(`/admins/transfers/edit/${record.id}`),
      });
    }

    items.push({
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'Print Voucher',
      onClick: () => {
        handleOpenDetails(record);
        setTimeout(() => window.print(), 500);
      },
    });

    if (!['completed', 'cancelled'].includes(record.status)) {
      items.push({
        type: 'divider',
      });
      items.push({
        key: 'cancel',
        danger: true,
        icon: <CloseCircleOutlined />,
        label: 'Cancel Transfer',
        onClick: () => {
          setCancelTargetId(record.id);
          setCancelModalVisible(true);
        },
      });
    }

    return { items };
  };

  // Table Columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (d) => (
        <div>
          <strong>{dayjs(d).format('YYYY-MM-DD')}</strong>
          <div style={{ fontSize: 11, color: adminTheme.subtext }}>{dayjs(d).format('HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Transfer No',
      dataIndex: 'transfer_no',
      key: 'transfer_no',
      width: 160,
      render: (t, r) => (
        <a
          onClick={() => handleOpenDetails(r)}
          style={{ fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
        >
          {t}
        </a>
      ),
    },
    {
      title: 'From Warehouse',
      key: 'from_warehouse',
      width: 180,
      render: (_, r) => (
        <div>
          <strong style={{ color: adminTheme.text }}>{r.from_warehouse_name}</strong>
          <div style={{ fontSize: 11, color: adminTheme.subtext }}>Code: {r.from_warehouse_code}</div>
        </div>
      ),
    },
    {
      title: '',
      key: 'arrow',
      width: 40,
      align: 'center',
      render: () => <ArrowRightOutlined style={{ color: '#94a3b8' }} />,
    },
    {
      title: 'To Warehouse',
      key: 'to_warehouse',
      width: 180,
      render: (_, r) => (
        <div>
          <strong style={{ color: adminTheme.text }}>{r.to_warehouse_name}</strong>
          <div style={{ fontSize: 11, color: adminTheme.subtext }}>Code: {r.to_warehouse_code}</div>
        </div>
      ),
    },
    {
      title: 'Items / Qty',
      key: 'items',
      align: 'center',
      width: 120,
      render: (_, r) => (
        <div>
          <Tag color="cyan">{r.items_count || 0} items</Tag>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>
            {Number(r.total_items_quantity || 0).toLocaleString()} units
          </div>
        </div>
      ),
    },
    {
      title: 'Grand Total',
      dataIndex: 'grand_total',
      key: 'grand_total',
      align: 'right',
      width: 130,
      render: (val) => <strong style={{ color: '#0284c7' }}>{formatCurrency(val)}</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (s) => getStatusTag(s),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      align: 'center',
      render: (_, r) => (
        <Dropdown menu={getActionMenu(r)} trigger={['click']}>
          <Button icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Header & Quick Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6} md={3}>
          <Card bodyStyle={{ padding: '14px 16px' }} style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
            <Statistic title="Total Transfers" value={stats.total_count || 0} valueStyle={{ fontWeight: 800, fontSize: 20 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card bodyStyle={{ padding: '14px 16px' }} style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
            <Statistic
              title="Pending Requests"
              value={stats.count_pending || 0}
              valueStyle={{ color: '#f59e0b', fontWeight: 800, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card bodyStyle={{ padding: '14px 16px' }} style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
            <Statistic
              title="Approved Orders"
              value={stats.count_approved || 0}
              valueStyle={{ color: '#2563eb', fontWeight: 800, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card bodyStyle={{ padding: '14px 16px' }} style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
            <Statistic
              title="In Transit"
              value={stats.count_in_transit || 0}
              valueStyle={{ color: '#9333ea', fontWeight: 800, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card bodyStyle={{ padding: '14px 16px' }} style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
            <Statistic
              title="Completed"
              value={stats.count_completed || 0}
              valueStyle={{ color: '#16a34a', fontWeight: 800, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card bodyStyle={{ padding: '14px 16px' }} style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
            <Statistic
              title="In-Transit Units"
              value={Number(stats.total_in_transit_qty || 0).toLocaleString()}
              valueStyle={{ color: '#0284c7', fontWeight: 800, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={5}>
          <Card bodyStyle={{ padding: '14px 16px' }} style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
            <Statistic
              title="Transferred Value"
              value={formatCurrency(stats.total_grand_total || 0)}
              valueStyle={{ color: '#16a34a', fontWeight: 800, fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. Filters & Actions Bar */}
      <Card style={{ background: adminTheme.surface, borderColor: adminTheme.border }} bodyStyle={{ padding: '14px 16px' }}>
        <Row justify="space-between" align="middle" gutter={[12, 12]}>
          <Col xs={24} md={18}>
            <Space wrap size={10}>
              <Input
                placeholder="Search transfer #, warehouse, product..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 260 }}
                allowClear
              />
              <Select
                placeholder="From Warehouse"
                value={filterFromWh}
                onChange={(v) => setFilterFromWh(v)}
                style={{ width: 170 }}
              >
                <Option value="all">All Source WH</Option>
                {metaWarehouses.map((w) => (
                  <Option key={w.id} value={w.id}>
                    {w.name}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="To Warehouse"
                value={filterToWh}
                onChange={(v) => setFilterToWh(v)}
                style={{ width: 170 }}
              >
                <Option value="all">All Dest WH</Option>
                {metaWarehouses.map((w) => (
                  <Option key={w.id} value={w.id}>
                    {w.name}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Status"
                value={filterStatus}
                onChange={(v) => setFilterStatus(v)}
                style={{ width: 160 }}
              >
                <Option value="all">All Statuses</Option>
                <Option value="pending">Pending</Option>
                <Option value="approved">Approved</Option>
                <Option value="in_transit">In Transit</Option>
                <Option value="partially_received">Partially Received</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
              <Button icon={<ReloadOutlined spin={loading} />} onClick={() => fetchTransfers(pagination.current_page)}>
                Refresh
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admins/transfers/add')}
              style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
            >
              Add Transfer
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 3. Main Transfers Table */}
      <Card style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
        <Table
          dataSource={transfers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current_page,
            pageSize: pagination.limit,
            total: pagination.total_records,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transfers`,
            onChange: (page) => fetchTransfers(page),
          }}
          scroll={{ x: 1050 }}
        />
      </Card>

      {/* MODAL 1: Transfer Details & Audit History */}
      <Modal
        title={
          <Space>
            <SwapOutlined style={{ color: '#2563eb' }} />
            <span>Transfer Voucher: {selectedTransfer?.transfer_no}</span>
            {selectedTransfer && getStatusTag(selectedTransfer.status)}
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print Voucher
          </Button>,
        ]}
        width={850}
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : selectedTransfer ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header Voucher Details */}
            <Row gutter={[16, 12]}>
              <Col span={12}>
                <Card size="small" title="Source (From)" style={{ background: '#f8fafc' }}>
                  <Text strong>{selectedTransfer.from_warehouse_name}</Text>
                  <div style={{ fontSize: 12, color: adminTheme.subtext }}>
                    Code: {selectedTransfer.from_warehouse_code}
                  </div>
                  {selectedTransfer.from_warehouse_address && (
                    <div style={{ fontSize: 12 }}>{selectedTransfer.from_warehouse_address}</div>
                  )}
                  {selectedTransfer.from_biller_company && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Entity: <strong>{selectedTransfer.from_biller_company}</strong>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Destination (To)" style={{ background: '#f8fafc' }}>
                  <Text strong>{selectedTransfer.to_warehouse_name}</Text>
                  <div style={{ fontSize: 12, color: adminTheme.subtext }}>
                    Code: {selectedTransfer.to_warehouse_code}
                  </div>
                  {selectedTransfer.to_warehouse_address && (
                    <div style={{ fontSize: 12 }}>{selectedTransfer.to_warehouse_address}</div>
                  )}
                  {selectedTransfer.to_biller_company && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Entity: <strong>{selectedTransfer.to_biller_company}</strong>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Items Table */}
            <Table
              dataSource={selectedTransfer.items || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Product',
                  key: 'prod',
                  render: (_, r) => (
                    <div>
                      <strong>{r.product_name}</strong>
                      {r.variant_name && <Tag color="blue" style={{ marginLeft: 6 }}>{r.variant_name}</Tag>}
                      <div style={{ fontSize: 11, color: adminTheme.subtext }}>Code: {r.product_code}</div>
                    </div>
                  ),
                },
                {
                  title: 'Sent Qty',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  align: 'center',
                  width: 90,
                  render: (q) => <strong>{q}</strong>,
                },
                {
                  title: 'Received',
                  dataIndex: 'received_quantity',
                  key: 'received_quantity',
                  align: 'center',
                  width: 90,
                  render: (q) => <Tag color="green">{q || 0}</Tag>,
                },
                {
                  title: 'Discrepancy',
                  key: 'diff',
                  align: 'center',
                  width: 120,
                  render: (_, r) => {
                    const dmg = parseFloat(r.damaged_quantity || 0);
                    const sht = parseFloat(r.shortage_quantity || 0);
                    if (dmg === 0 && sht === 0) return <Text type="secondary">-</Text>;
                    return (
                      <Space size={4}>
                        {dmg > 0 && <Tag color="red">Dmg: {dmg}</Tag>}
                        {sht > 0 && <Tag color="volcano">Short: {sht}</Tag>}
                      </Space>
                    );
                  },
                },
                {
                  title: 'Unit Cost',
                  dataIndex: 'unit_cost',
                  key: 'unit_cost',
                  align: 'right',
                  width: 110,
                  render: (c) => formatCurrency(c),
                },
                {
                  title: 'Subtotal',
                  dataIndex: 'subtotal',
                  key: 'subtotal',
                  align: 'right',
                  width: 120,
                  render: (s) => <strong>{formatCurrency(s)}</strong>,
                },
              ]}
            />

            {/* Summary Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, padding: '10px 0' }}>
              <div>Shipping: <strong>{formatCurrency(selectedTransfer.shipping)}</strong></div>
              <div>
                Grand Total:{' '}
                <strong style={{ color: '#16a34a', fontSize: 16 }}>
                  {formatCurrency(selectedTransfer.grand_total)}
                </strong>
              </div>
            </div>

            {selectedTransfer.note && (
              <Alert message="Notes / Remarks" description={selectedTransfer.note} type="info" showIcon />
            )}

            {/* Audit History Timeline */}
            <Divider orientation="left" style={{ margin: '12px 0' }}>
              Lifecycle History & Audit Trail
            </Divider>
            <Timeline
              items={(selectedTransfer.history || []).map((h) => ({
                color:
                  h.action === 'created'
                    ? 'gray'
                    : h.action === 'approved'
                    ? 'blue'
                    : h.action === 'dispatched'
                    ? 'purple'
                    : h.action.includes('received')
                    ? 'green'
                    : 'red',
                children: (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{h.action.toUpperCase()}</strong>
                      <span style={{ fontSize: 11, color: adminTheme.subtext }}>
                        {dayjs(h.created_at).format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </div>
                    <div style={{ fontSize: 12 }}>
                      By: <strong>{h.actor_fullname || h.actor_username || 'System'}</strong>
                    </div>
                    {h.note && <div style={{ fontSize: 12, color: adminTheme.subtext, marginTop: 2 }}>{h.note}</div>}
                  </div>
                ),
              }))}
            />
          </div>
        ) : null}
      </Modal>

      {/* MODAL 2: Receive Stock at Destination */}
      <Modal
        title={
          <Space>
            <InboxOutlined style={{ color: '#16a34a' }} />
            <span>Confirm Stock Receipt: {receiveTransferTarget?.transfer_no}</span>
          </Space>
        }
        open={receiveModalVisible}
        onCancel={() => setReceiveModalVisible(false)}
        onOk={() => receiveForm.submit()}
        confirmLoading={submittingReceive}
        okText="Confirm Receipt & Update Stock"
        width={750}
      >
        <Alert
          message="Receiving Procedure"
          description="Enter the actual verified quantities received at destination. Record any damaged or shortage units for audit transparency."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          dataSource={receiveItemRows}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Product',
              key: 'p',
              render: (_, r) => (
                <div>
                  <strong>{r.product_name}</strong>
                  <div style={{ fontSize: 11, color: adminTheme.subtext }}>Code: {r.product_code}</div>
                </div>
              ),
            },
            {
              title: 'Sent',
              dataIndex: 'quantity',
              key: 'qty',
              align: 'center',
              width: 70,
            },
            {
              title: 'Received Qty',
              key: 'received',
              width: 120,
              render: (_, r, idx) => (
                <InputNumber
                  min={0}
                  max={r.remaining_to_receive}
                  value={r.received_quantity}
                  onChange={(val) => {
                    const updated = [...receiveItemRows];
                    updated[idx].received_quantity = val || 0;
                    setReceiveItemRows(updated);
                  }}
                  style={{ width: '100%' }}
                />
              ),
            },
            {
              title: 'Damaged',
              key: 'damaged',
              width: 100,
              render: (_, r, idx) => (
                <InputNumber
                  min={0}
                  value={r.damaged_quantity}
                  onChange={(val) => {
                    const updated = [...receiveItemRows];
                    updated[idx].damaged_quantity = val || 0;
                    setReceiveItemRows(updated);
                  }}
                  style={{ width: '100%' }}
                />
              ),
            },
            {
              title: 'Shortage',
              key: 'shortage',
              width: 100,
              render: (_, r, idx) => (
                <InputNumber
                  min={0}
                  value={r.shortage_quantity}
                  onChange={(val) => {
                    const updated = [...receiveItemRows];
                    updated[idx].shortage_quantity = val || 0;
                    setReceiveItemRows(updated);
                  }}
                  style={{ width: '100%' }}
                />
              ),
            },
          ]}
        />

        <Form form={receiveForm} layout="vertical" onFinish={handleSubmitReceive} style={{ marginTop: 16 }}>
          <Form.Item name="note" label="Receipt Remarks">
            <Input.TextArea rows={2} placeholder="Receiver remarks, packing condition, driver note..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 3: Cancel Transfer Reason */}
      <Modal
        title="Cancel Transfer Confirmation"
        open={cancelModalVisible}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancelTargetId(null);
        }}
        onOk={handleConfirmCancel}
        confirmLoading={submittingCancel}
        okText="Confirm Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to cancel this transfer? If the transfer was already dispatched, in-transit stock will be
          automatically returned and reversed back into the source warehouse.
        </p>
        <Input.TextArea
          rows={3}
          placeholder="Please state cancellation reason..."
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
