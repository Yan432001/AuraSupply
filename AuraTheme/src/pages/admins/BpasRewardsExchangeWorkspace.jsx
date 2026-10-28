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
  Badge
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
  GiftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  TrophyOutlined,
  ShoppingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { formatCurrency } from '../../utils/uiTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function BpasRewardsExchangeWorkspace({ embedded = false }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [metrics, setMetrics] = useState({
    total_exchanges: 0,
    total_points_redeemed: 0,
    total_items_issued: 0,
    completed_count: 0,
    pending_count: 0,
  });

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState(null);

  // Metadata
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Fetch Metadata
  const fetchMetadata = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/rewards_exchange/meta/options');
      if (res.data?.success && res.data.data) {
        setWarehouses(res.data.data.warehouses || []);
        setCustomers(res.data.data.customers || []);
      }
    } catch (err) {
      console.warn('Failed to load rewards exchange metadata:', err.message);
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
        customer_id: filterCustomer,
        type: filterType,
        status: filterStatus,
      };

      if (filterDateRange && filterDateRange.length === 2) {
        params.start_date = filterDateRange[0].format('YYYY-MM-DD');
        params.end_date = filterDateRange[1].format('YYYY-MM-DD');
      }

      const res = await axios.get('/api/admin/rewards_exchange', { params });
      if (res.data?.success) {
        setRecords(res.data.data.data || []);
        setPagination(res.data.data.pagination || { page, limit: 15, total: 0 });
        if (res.data.data.metrics) {
          setMetrics(res.data.data.metrics);
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load rewards exchange records');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filterSearch, filterWarehouse, filterCustomer, filterType, filterStatus, filterDateRange]);

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
      const res = await axios.get(`/api/admin/rewards_exchange/${record.id}`);
      if (res.data?.success) {
        setSelectedRecord(res.data.data);
      }
    } catch (err) {
      message.error('Failed to load detailed exchange voucher');
    } finally {
      setDetailLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/rewards_exchange/${id}`);
      if (res.data?.success) {
        message.success('Rewards exchange deleted and customer points & inventory safely restored.');
        fetchRecords(pagination.page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete exchange record');
    }
  };

  // Status tag styling
  const renderStatusTag = (status) => {
    switch (status) {
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      case 'approved':
        return <Tag icon={<CheckCircleOutlined />} color="cyan">Approved</Tag>;
      case 'pending':
        return <Tag icon={<ClockCircleOutlined />} color="warning">Pending</Tag>;
      case 'cancelled':
        return <Tag icon={<CloseCircleOutlined />} color="error">Cancelled</Tag>;
      default:
        return <Tag color="default">{status || 'Draft'}</Tag>;
    }
  };

  // Type tag styling
  const renderTypeTag = (type) => {
    switch (type) {
      case 'points':
        return <Tag icon={<TrophyOutlined />} color="gold">Points Redemption</Tag>;
      case 'product':
        return <Tag icon={<GiftOutlined />} color="purple">Product Exchange</Tag>;
      case 'money':
        return <Tag color="green">Cash/Money</Tag>;
      default:
        return <Tag color="blue">{type}</Tag>;
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
        <Space orientation="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{dayjs(d).format('YYYY-MM-DD')}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(d).format('HH:mm')}</Text>
        </Space>
      ),
    },
    {
      title: 'Reference No',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 160,
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
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (name, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 13 }}>{name || 'General Customer'}</Text>
          {record.current_customer_points !== undefined && (
            <Tag color="gold" style={{ fontSize: 11, padding: '0 6px', borderRadius: 10 }}>
              <TrophyOutlined style={{ marginRight: 4 }} />
              {record.current_customer_points} Points Available
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      render: (wh) => (
        <Space size={4}>
          <ApartmentOutlined style={{ color: '#8c8c8c' }} />
          <span>{wh || '-'}</span>
        </Space>
      ),
    },
    {
      title: 'Exchange Type',
      dataIndex: 'type',
      key: 'type',
      width: 160,
      render: (t) => renderTypeTag(t),
    },
    {
      title: 'Points Redeemed',
      dataIndex: 'points_used',
      key: 'points_used',
      align: 'right',
      width: 150,
      render: (pts) => (
        <span style={{ fontWeight: 700, color: '#d97706', fontSize: 14 }}>
          {parseFloat(pts || 0).toLocaleString()} pts
        </span>
      ),
    },
    {
      title: 'Items & Qty',
      key: 'items_summary',
      align: 'center',
      width: 120,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{parseFloat(r.total_qty || 0)} units</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>({r.items_count || 1} item{r.items_count > 1 ? 's' : ''})</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s) => renderStatusTag(s),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 140,
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="View Rewards Voucher">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleOpenDetail(record)}
            />
          </Tooltip>

          <Tooltip title="Edit Exchange">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#2563eb' }} />}
              onClick={() => {
                const targetUrl = `/admins/products/rewards_exchange/edit/${record.id}`;
                navigate(targetUrl);
              }}
            />
          </Tooltip>

          <Tooltip title="Delete & Restore Points">
            <Popconfirm
              title="Delete Rewards Exchange?"
              description="Customer redeemed points and warehouse stock will be safely refunded and restored."
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: embedded ? '0' : '20px' }}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Total Exchanges</span>}
              value={metrics.total_exchanges || 0}
              prefix={<GiftOutlined style={{ color: '#2563eb', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#1e293b' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Points Redeemed</span>}
              value={metrics.total_points_redeemed || 0}
              suffix="pts"
              prefix={<TrophyOutlined style={{ color: '#d97706', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#d97706' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Items Issued</span>}
              value={metrics.total_items_issued || 0}
              suffix="units"
              prefix={<ShoppingOutlined style={{ color: '#10b981', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#10b981' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Completed</span>}
              value={metrics.completed_count || 0}
              prefix={<CheckCircleOutlined style={{ color: '#059669', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#059669' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Pending</span>}
              value={metrics.pending_count || 0}
              prefix={<ClockCircleOutlined style={{ color: '#eab308', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#eab308' }}
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
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrophyOutlined style={{ fontSize: 22, color: '#d97706' }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                  Rewards Exchange & Point Redemption
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Manage customer loyalty points exchange, ring catalog redemptions, and physical stock issues
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
                style={{ background: '#d97706', borderColor: '#d97706', fontWeight: 600 }}
                onClick={() => navigate('/admins/products/rewards_exchange/add')}
              >
                Add Rewards Exchange
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filter Controls */}
        <Row gutter={[12, 12]} style={{ marginBottom: 18, background: '#f8fafc', padding: 14, borderRadius: 10 }}>
          <Col xs={24} sm={12} md={6} lg={5}>
            <Input
              placeholder="Search Ref, Customer, Note..."
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
              showSearch
              filterOption={(input, opt) => (opt?.children || '').toLowerCase().includes(input.toLowerCase())}
              placeholder="All Customers"
              value={filterCustomer}
              onChange={(val) => setFilterCustomer(val)}
            >
              <Option value="all">All Customers</Option>
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.company && c.company !== '-' ? `${c.company} (${c.name})` : c.name}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={3}>
            <Select
              style={{ width: '100%' }}
              placeholder="All Types"
              value={filterType}
              onChange={(val) => setFilterType(val)}
            >
              <Option value="all">All Types</Option>
              <Option value="points">Points Redemption</Option>
              <Option value="product">Product Exchange</Option>
              <Option value="money">Money Exchange</Option>
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
              <Option value="draft">Draft</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={5}>
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
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            Print Voucher
          </Button>
        ]}
        width={800}
        title={
          <Space>
            <TrophyOutlined style={{ color: '#d97706' }} />
            <span>Rewards Exchange Voucher: {selectedRecord?.reference_no}</span>
          </Space>
        }
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="Loading exchange voucher details..." />
          </div>
        ) : selectedRecord ? (
          <div>
            {/* Header info */}
            <div style={{
              background: '#f8fafc',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              border: '1px solid #e2e8f0'
            }}>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Text type="secondary">Customer:</Text>
                  <div><Text strong style={{ fontSize: 15 }}>{selectedRecord.customer_name}</Text></div>
                  {selectedRecord.customer_phone && <div><Text type="secondary">Phone: {selectedRecord.customer_phone}</Text></div>}
                  {selectedRecord.customer_address && <div><Text type="secondary">Address: {selectedRecord.customer_address}</Text></div>}
                  <div style={{ marginTop: 6 }}>
                    <Tag color="gold">Current Balance: {selectedRecord.current_customer_points || 0} pts</Tag>
                  </div>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Text type="secondary">Voucher Details:</Text>
                  <div><Text strong>{selectedRecord.reference_no}</Text></div>
                  <div><Text type="secondary">Date: {dayjs(selectedRecord.date).format('YYYY-MM-DD HH:mm')}</Text></div>
                  <div><Text type="secondary">Warehouse: {selectedRecord.warehouse_name}</Text></div>
                  <div style={{ marginTop: 6 }}>
                    {renderStatusTag(selectedRecord.status)}
                    <span style={{ marginLeft: 6 }}>{renderTypeTag(selectedRecord.type)}</span>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Items Table */}
            <Title level={5} style={{ marginBottom: 10 }}>Redemption & Exchange Items</Title>
            <Table
              dataSource={selectedRecord.items || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Product',
                  key: 'prod',
                  render: (_, it) => (
                    <div>
                      <Text strong>{it.product_name || it.exchange_product_name}</Text>
                      <div><Text type="secondary" style={{ fontSize: 12 }}>{it.product_code || it.exchange_product_code}</Text></div>
                    </div>
                  )
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  align: 'center',
                  width: 100,
                  render: (q) => <Text strong>{parseFloat(q || 1)}</Text>
                },
                {
                  title: 'Points Cost',
                  dataIndex: 'points',
                  align: 'right',
                  width: 120,
                  render: (p) => <span style={{ color: '#d97706', fontWeight: 600 }}>{parseFloat(p || 0)} pts</span>
                },
                {
                  title: 'Total Points',
                  dataIndex: 'total_points',
                  align: 'right',
                  width: 140,
                  render: (tp) => <Text strong style={{ color: '#d97706', fontSize: 14 }}>{parseFloat(tp || 0).toLocaleString()} pts</Text>
                }
              ]}
              summary={(pageData) => {
                const totalPoints = pageData.reduce((acc, it) => acc + parseFloat(it.total_points || 0), 0);
                const totalQty = pageData.reduce((acc, it) => acc + parseFloat(it.quantity || 0), 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 700 }}>
                      <Table.Summary.Cell index={0}>Grand Total</Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="center">{totalQty} units</Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                      <Table.Summary.Cell index={3} align="right" style={{ color: '#d97706', fontSize: 15 }}>
                        {totalPoints.toLocaleString()} pts
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />

            {/* Notes */}
            {selectedRecord.note && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Notes:</Text>
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, marginTop: 4 }}>
                  <Text>{selectedRecord.note}</Text>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
