import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Dropdown,
  Modal,
  Spin,
  Badge,
  Alert
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
  MoreOutlined,
  DollarOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  ShoppingOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { formatCurrency } from '../../utils/uiTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function BpasStockReceivedWorkspace({ embedded = false }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({
    total_count: 0,
    total_received_quantity: 0,
    total_received_amount: 0,
    completed_count: 0,
    pending_count: 0,
    partial_count: 0,
  });

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState(null);

  // Metadata
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Fetch Metadata Options
  const fetchMetadata = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/stock_received/meta/options');
      if (res.data?.success && res.data.data) {
        setWarehouses(res.data.data.warehouses || []);
        setSuppliers(res.data.data.suppliers || []);
        setStatuses(res.data.data.statuses || []);
      }
    } catch (err) {
      console.warn('Failed to load stock received metadata:', err.message);
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
        supplier_id: filterSupplier,
        status: filterStatus,
      };

      if (filterDateRange && filterDateRange.length === 2) {
        params.start_date = filterDateRange[0].format('YYYY-MM-DD');
        params.end_date = filterDateRange[1].format('YYYY-MM-DD');
      }

      const res = await axios.get('/api/admin/stock_received', { params });
      if (res.data?.success) {
        setRecords(res.data.data.data || []);
        setPagination(res.data.data.pagination || { page, limit: 15, total: 0 });
        if (res.data.data.summary) {
          setSummary(res.data.data.summary);
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load stock received records');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filterSearch, filterWarehouse, filterSupplier, filterStatus, filterDateRange]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchRecords(1);
  }, [fetchRecords]);

  // Open Detail / GRN Modal
  const handleOpenDetail = async (record) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/admin/stock_received/${record.id}`);
      if (res.data?.success) {
        setSelectedRecord(res.data.data);
      }
    } catch (err) {
      message.error('Failed to load detailed receipt voucher');
    } finally {
      setDetailLoading(false);
    }
  };

  // Delete / Revert Receipt
  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/stock_received/${id}`);
      if (res.data?.success) {
        message.success('Stock received voucher deleted and stock successfully reversed.');
        fetchRecords(pagination.page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete stock receipt voucher');
    }
  };

  // Print Note
  const handlePrint = () => {
    window.print();
  };

  // Status Badge Component
  const renderStatusTag = (status) => {
    switch (status) {
      case 'completed':
      case 'received':
        return <Tag color="green" icon={<CheckCircleOutlined />}>{status.toUpperCase()}</Tag>;
      case 'partial':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>PARTIAL</Tag>;
      case 'pending':
        return <Tag color="gold" icon={<ClockCircleOutlined />}>PENDING</Tag>;
      case 'cancelled':
        return <Tag color="red" icon={<CloseCircleOutlined />}>CANCELLED</Tag>;
      default:
        return <Tag>{status?.toUpperCase() || 'UNKNOWN'}</Tag>;
    }
  };

  // Table Columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (date) => (
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'}
        </span>
      ),
    },
    {
      title: 'Receipt Reference',
      dataIndex: 're_reference_no',
      key: 're_reference_no',
      width: 160,
      render: (ref, row) => (
        <Space orientation="vertical" size={2}>
          <span
            onClick={() => handleOpenDetail(row)}
            style={{ fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
          >
            {ref || `STR-${row.id}`}
          </span>
          {row.si_reference_no && (
            <span style={{ fontSize: 11, color: adminTheme.subtext }}>
              Inv: {row.si_reference_no}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: 'Purchase Order Ref',
      dataIndex: 'pu_reference_no',
      key: 'pu_reference_no',
      width: 150,
      render: (poRef) => (
        poRef ? (
          <Tag color="cyan" style={{ fontWeight: 600 }}>{poRef}</Tag>
        ) : (
          <span style={{ color: adminTheme.subtext, fontSize: 12 }}>Direct Receipt</span>
        )
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (supplier, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{supplier || '-'}</div>
          {row.supplier_company && row.supplier_company !== '-' && (
            <div style={{ fontSize: 11, color: adminTheme.subtext }}>{row.supplier_company}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      width: 170,
      render: (wh, row) => (
        <Tag color="blue" icon={<ApartmentOutlined />}>
          {wh || `Warehouse #${row.warehouse_id}`}
        </Tag>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items_count',
      key: 'items_count',
      width: 90,
      align: 'center',
      render: (count) => <Badge count={count} showZero color="#64748b" />,
    },
    {
      title: 'Received Qty',
      dataIndex: 'total_qty',
      key: 'total_qty',
      width: 120,
      align: 'right',
      render: (qty) => (
        <span style={{ fontWeight: 700, color: '#059669', fontSize: 14 }}>
          {parseFloat(qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Total Value',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 130,
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 700, color: '#1e293b' }}>
          {formatCurrency(parseFloat(amount || 0))}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (st) => renderStatusTag(st),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      align: 'center',
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="View Goods Received Note (GRN)">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: '#2563eb' }} />}
              onClick={() => handleOpenDetail(row)}
            />
          </Tooltip>
          <Tooltip title="Edit Receipt Voucher">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => navigate(`/admins/products/stock_received/edit/${row.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete & Revert Stock Receipt"
            description="Are you sure you want to delete this receipt? Received quantities will be deducted from warehouse stock."
            onConfirm={() => handleDelete(row.id)}
            okText="Yes, Revert Stock"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Receipt">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Header Toolbar (when not embedded) */}
      {!embedded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <InboxOutlined style={{ color: '#2563eb' }} />
              Stock Received Management (GRN)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Track supplier purchase order arrivals, delivery notes, and warehouse stock receipts.
            </Text>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admins/products/stock_received/add')}
              style={{ fontWeight: 600, background: '#2563eb' }}
            >
              Add Stock Received
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchRecords(pagination.page)}
            >
              Refresh
            </Button>
          </Space>
        </div>
      )}

      {/* 2. Key Metrics Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 13, color: adminTheme.subtext }}>Total Stock Receipts</span>}
              value={summary.total_count}
              prefix={<InboxOutlined style={{ color: '#2563eb', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 800, color: adminTheme.text }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 13, color: adminTheme.subtext }}>Total Units Received</span>}
              value={summary.total_received_quantity}
              precision={0}
              prefix={<CheckCircleOutlined style={{ color: '#059669', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 800, color: '#059669' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 13, color: adminTheme.subtext }}>Received Value</span>}
              value={summary.total_received_amount}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#d97706', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 800, color: '#d97706' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 13, color: adminTheme.subtext }}>Completed / Fully Received</span>}
              value={summary.completed_count}
              suffix={`/ ${summary.total_count}`}
              prefix={<CheckCircleOutlined style={{ color: '#3b82f6', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 800, color: '#3b82f6' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 3. Filter & Search Controls */}
      <Card
        bordered={false}
        bodyStyle={{ padding: '14px 18px' }}
        style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search reference, supplier, PO..."
              prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onPressEnter={() => fetchRecords(1)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              style={{ width: '100%' }}
              value={filterWarehouse}
              onChange={(val) => setFilterWarehouse(val)}
              placeholder="Filter Warehouse"
            >
              <Option value="all">All Warehouses</Option>
              {warehouses.map((wh) => (
                <Option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              style={{ width: '100%' }}
              value={filterSupplier}
              onChange={(val) => setFilterSupplier(val)}
              placeholder="Filter Supplier"
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">All Suppliers</Option>
              {suppliers.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.company && s.company !== '-' ? s.company : s.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              placeholder="Status"
            >
              <Option value="all">All Statuses</Option>
              <Option value="completed">Completed</Option>
              <Option value="received">Received</Option>
              <Option value="partial">Partial</Option>
              <Option value="pending">Pending</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} style={{ display: 'flex', gap: 8 }}>
            <Button
              type="primary"
              onClick={() => fetchRecords(1)}
              style={{ flex: 1, background: '#2563eb' }}
            >
              Filter
            </Button>
            <Button
              onClick={() => {
                setFilterSearch('');
                setFilterWarehouse('all');
                setFilterSupplier('all');
                setFilterStatus('all');
                setFilterDateRange(null);
                fetchRecords(1);
              }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 4. Receipts Table */}
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ background: adminTheme.surface, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '15', '25', '50'],
            onChange: (page, limit) => {
              setPagination(prev => ({ ...prev, page, limit }));
              fetchRecords(page);
            },
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* 5. Detail & Goods Received Note (GRN) Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileTextOutlined style={{ color: '#2563eb', fontSize: 20 }} />
            <span>Goods Received Note (GRN) - {selectedRecord?.re_reference_no || `STR-${selectedRecord?.id}`}</span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="edit"
            type="default"
            icon={<EditOutlined />}
            onClick={() => {
              setIsDetailModalOpen(false);
              navigate(`/admins/products/stock_received/edit/${selectedRecord?.id}`);
            }}
          >
            Edit Receipt
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            style={{ background: '#2563eb' }}
          >
            Print Note
          </Button>,
        ]}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : selectedRecord ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header Voucher Card */}
            <div style={{ border: `1px solid ${adminTheme.border}`, borderRadius: 8, padding: 16, background: '#f8fafc' }}>
              <Row gutter={[16, 12]}>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Receipt Reference:</Text>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#2563eb' }}>
                    {selectedRecord.re_reference_no}
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Received Date:</Text>
                  <div style={{ fontWeight: 600 }}>
                    {dayjs(selectedRecord.date).format('YYYY-MM-DD HH:mm')}
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Receipt Status:</Text>
                  <div>{renderStatusTag(selectedRecord.status)}</div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Destination Warehouse:</Text>
                  <div style={{ fontWeight: 600 }}>
                    {selectedRecord.warehouse_name} ({selectedRecord.warehouse_code})
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Supplier Name:</Text>
                  <div style={{ fontWeight: 600 }}>
                    {selectedRecord.supplier_company || selectedRecord.supplier}
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Linked Purchase Order:</Text>
                  <div style={{ fontWeight: 600 }}>
                    {selectedRecord.pu_reference_no || selectedRecord.purchase_reference_no || 'Direct Receipt (None)'}
                  </div>
                </Col>
                {selectedRecord.si_reference_no && (
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Supplier Invoice Ref:</Text>
                    <div style={{ fontWeight: 600 }}>{selectedRecord.si_reference_no}</div>
                  </Col>
                )}
                {selectedRecord.dn_reference && (
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Delivery Note Ref:</Text>
                    <div style={{ fontWeight: 600 }}>{selectedRecord.dn_reference}</div>
                  </Col>
                )}
                {selectedRecord.truck && (
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Vehicle / Truck:</Text>
                    <div style={{ fontWeight: 600 }}>{selectedRecord.truck}</div>
                  </Col>
                )}
              </Row>
            </div>

            {/* Items Table */}
            <div>
              <Title level={5} style={{ margin: '8px 0 12px 0' }}>Received Product Items</Title>
              <Table
                dataSource={selectedRecord.items || []}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: '#',
                    key: 'index',
                    width: 45,
                    render: (_, __, i) => i + 1,
                  },
                  {
                    title: 'Product (Code & Name)',
                    key: 'product',
                    render: (_, it) => (
                      <div>
                        <span style={{ fontWeight: 600 }}>{it.product_name}</span>
                        <div style={{ fontSize: 12, color: adminTheme.subtext }}>
                          SKU: {it.product_code} {it.product_unit_code && `(${it.product_unit_code})`}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: 'Batch / Expiry',
                    key: 'batch',
                    width: 140,
                    render: (_, it) => (
                      <div style={{ fontSize: 12 }}>
                        {it.batch_no && <div><strong>Batch:</strong> {it.batch_no}</div>}
                        {it.expiry && <div><strong>Exp:</strong> {dayjs(it.expiry).format('YYYY-MM-DD')}</div>}
                        {!it.batch_no && !it.expiry && <span style={{ color: adminTheme.subtext }}>-</span>}
                      </div>
                    ),
                  },
                  {
                    title: 'Ordered',
                    dataIndex: 'quantity_ordered',
                    key: 'quantity_ordered',
                    width: 85,
                    align: 'right',
                    render: (q) => q ? parseFloat(q).toLocaleString() : '-',
                  },
                  {
                    title: 'Received',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 95,
                    align: 'right',
                    render: (q) => (
                      <span style={{ fontWeight: 700, color: '#059669' }}>
                        {parseFloat(q || 0).toLocaleString()}
                      </span>
                    ),
                  },
                  {
                    title: 'Rejected',
                    dataIndex: 'quantity_rejected',
                    key: 'quantity_rejected',
                    width: 85,
                    align: 'right',
                    render: (q) => (
                      parseFloat(q) > 0 ? (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>{parseFloat(q)}</span>
                      ) : (
                        '-'
                      )
                    ),
                  },
                  {
                    title: 'Unit Cost',
                    dataIndex: 'unit_cost',
                    key: 'unit_cost',
                    width: 100,
                    align: 'right',
                    render: (c) => formatCurrency(parseFloat(c || 0)),
                  },
                  {
                    title: 'Subtotal',
                    dataIndex: 'subtotal',
                    key: 'subtotal',
                    width: 110,
                    align: 'right',
                    render: (st) => (
                      <span style={{ fontWeight: 700 }}>{formatCurrency(parseFloat(st || 0))}</span>
                    ),
                  },
                ]}
              />
            </div>

            {/* Note & Remarks */}
            {selectedRecord.note && (
              <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: 6 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Note / Remarks:</Text>
                <div>{selectedRecord.note}</div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
