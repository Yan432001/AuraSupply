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
  SwapOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  FileExcelOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';
import BpasAddCostAdjustmentPage from './BpasAddCostAdjustmentPage';
import BpasEditCostAdjustmentPage from './BpasEditCostAdjustmentPage';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function BpasCostAdjustmentsWorkspace({ embedded = false }) {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Mode: 'list' | 'add' | 'edit'
  const [pageMode, setPageMode] = useState('list');
  const [editingId, setEditingId] = useState(null);

  // Data States
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total_adjustments: 0,
    completed_adjustments: 0,
    total_revaluation: 0,
    total_items_adjusted: 0,
    avg_cost_delta: 0
  });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterReason, setFilterReason] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDates, setFilterDates] = useState(null);

  // Metadata
  const [warehouses, setWarehouses] = useState([]);
  const [standardReasons, setStandardReasons] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // Detail / Voucher Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const printRef = useRef(null);

  // Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || localStorage.getItem('aura_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Fetch Metadata Options
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await axios.get('/api/admin/products/cost_adjustments/meta/options', {
          headers: getAuthHeaders()
        });
        if (res.data?.success && res.data?.data) {
          setWarehouses(res.data.data.warehouses || []);
          setStandardReasons(res.data.data.standardReasons || []);
          setStatuses(res.data.data.statuses || []);
        }
      } catch (err) {
        console.error('Error fetching cost adjustment options:', err);
      }
    };
    fetchMeta();
  }, []);

  // 2. Fetch Cost Adjustments List
  const fetchRecords = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pagination.pageSize,
          search: filterSearch.trim(),
          warehouse_id: filterWarehouse,
          reason: filterReason,
          status: filterStatus
        };

        if (filterDates && filterDates[0] && filterDates[1]) {
          params.start_date = filterDates[0].format('YYYY-MM-DD');
          params.end_date = filterDates[1].format('YYYY-MM-DD');
        }

        const res = await axios.get('/api/admin/products/cost_adjustments', {
          params,
          headers: getAuthHeaders()
        });

        if (res.data?.success) {
          setRecords(res.data.data || []);
          setStats(res.data.stats || {});
          if (res.data.pagination) {
            setPagination((prev) => ({
              ...prev,
              current: res.data.pagination.current,
              total: res.data.pagination.total
            }));
          }
        }
      } catch (err) {
        message.error('Failed to load cost adjustments');
      } finally {
        setLoading(false);
      }
    },
    [filterSearch, filterWarehouse, filterReason, filterStatus, filterDates, pagination.pageSize]
  );

  useEffect(() => {
    fetchRecords(1);
  }, [fetchRecords]);

  // 3. Actions
  const handleOpenDetail = async (record) => {
    setLoadingDetail(true);
    setIsDetailModalOpen(true);
    try {
      const res = await axios.get(`/api/admin/products/cost_adjustments/${record.id}`, {
        headers: getAuthHeaders()
      });
      if (res.data?.success) {
        setSelectedRecord(res.data.data);
      } else {
        message.error('Failed to load adjustment details');
      }
    } catch (err) {
      message.error('Failed to load voucher details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenEdit = (record) => {
    setEditingId(record.id);
    setPageMode('edit');
  };

  const handleDeleteRecord = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/products/cost_adjustments/${id}`, {
        headers: getAuthHeaders()
      });
      if (res.data?.success) {
        message.success('Cost adjustment deleted and product costs reverted successfully!');
        try {
          localStorage.removeItem('aura_admin_live_products_v2');
          window.dispatchEvent(new CustomEvent('aura_live_products_updated'));
        } catch (_) {}
        fetchRecords(pagination.current);
      } else {
        message.error(res.data?.message || 'Failed to delete adjustment');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete adjustment');
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (records.length === 0) {
      message.warning('No records to export');
      return;
    }
    const headers = [
      'Reference No',
      'Date',
      'Warehouse',
      'Biller',
      'Reason',
      'Status',
      'Products Count',
      'Total Valuation Impact',
      'Created By',
      'Note'
    ];
    const rows = records.map((r) => [
      `"${r.reference_no}"`,
      r.date ? dayjs(r.date).format('YYYY-MM-DD HH:mm') : '',
      `"${r.warehouse_name || ''}"`,
      `"${r.biller_name || ''}"`,
      `"${r.reason || ''}"`,
      r.status || 'completed',
      r.items_count || 0,
      Number(r.total_valuation_change || 0).toFixed(2),
      `"${r.creator_fullname || r.creator_username || ''}"`,
      `"${(r.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cost_Adjustments_${dayjs().format('YYYYMMDD_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print voucher
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '', 'width=900,height=650');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cost Adjustment Voucher - ${selectedRecord?.reference_no}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }
            h2 { margin: 0 0 4px 0; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; }
            th { background: #f1f5f9; text-align: left; }
            .text-right { text-align: right; }
            .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; }
            .sign-box { border-top: 1px solid #94a3b8; width: 180px; text-align: center; padding-top: 6px; font-size: 12px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Render Add Page
  if (pageMode === 'add') {
    return (
      <BpasAddCostAdjustmentPage
        onBack={() => setPageMode('list')}
        onSuccess={() => {
          setPageMode('list');
          fetchRecords(1);
        }}
      />
    );
  }

  // Render Edit Page
  if (pageMode === 'edit') {
    return (
      <BpasEditCostAdjustmentPage
        adjustmentId={editingId}
        onBack={() => {
          setEditingId(null);
          setPageMode('list');
        }}
        onSuccess={() => {
          setEditingId(null);
          setPageMode('list');
          fetchRecords(pagination.current);
        }}
      />
    );
  }

  // Status tag helper
  const renderStatusTag = (status) => {
    switch (status) {
      case 'completed':
        return <Tag color="green" icon={<CheckCircleOutlined />}>Completed</Tag>;
      case 'pending':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>;
      case 'draft':
        return <Tag color="default">Draft</Tag>;
      case 'cancelled':
        return <Tag color="red" icon={<CloseCircleOutlined />}>Cancelled / Reverted</Tag>;
      default:
        return <Tag color="blue">{status}</Tag>;
    }
  };

  // Table Columns
  const columns = [
    {
      title: 'Reference No',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 150,
      render: (ref, r) => (
        <a
          onClick={() => handleOpenDetail(r)}
          style={{ fontWeight: 800, color: '#2563eb', cursor: 'pointer' }}
        >
          {ref}
        </a>
      )
    },
    {
      title: 'Date & Time',
      dataIndex: 'date',
      key: 'date',
      width: 145,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '—')
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      render: (wh) => (
        <Space size={4}>
          <ApartmentOutlined style={{ color: '#2563eb' }} />
          <span>{wh || 'HQ Warehouse'}</span>
        </Space>
      )
    },
    {
      title: 'Adjustment Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (rsn) => (
        <Tag color="cyan" style={{ fontWeight: 600 }}>
          {rsn || 'General Revaluation'}
        </Tag>
      )
    },
    {
      title: 'Items',
      dataIndex: 'items_count',
      key: 'items_count',
      width: 80,
      align: 'center',
      render: (cnt) => <Tag color="blue" style={{ fontWeight: 700 }}>{cnt || 0}</Tag>
    },
    {
      title: 'Valuation Impact',
      dataIndex: 'total_valuation_change',
      key: 'total_valuation_change',
      width: 150,
      align: 'right',
      render: (val) => {
        const v = Number(val) || 0;
        if (v > 0) {
          return (
            <span style={{ color: '#16a34a', fontWeight: 800 }}>
              +{formatCurrency(v)}
            </span>
          );
        } else if (v < 0) {
          return (
            <span style={{ color: '#dc2626', fontWeight: 800 }}>
              -{formatCurrency(Math.abs(v))}
            </span>
          );
        }
        return <span style={{ color: '#64748b' }}>$0.00</span>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (st) => renderStatusTag(st)
    },
    {
      title: 'Created By',
      dataIndex: 'creator_fullname',
      key: 'created_by',
      width: 130,
      render: (name, r) => (
        <Space size={4}>
          <UserOutlined style={{ color: '#64748b' }} />
          <span>{name || r.creator_username || 'Admin'}</span>
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, r) => {
        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Voucher Details',
            onClick: () => handleOpenDetail(r)
          },
          {
            key: 'edit',
            icon: <EditOutlined style={{ color: '#2563eb' }} />,
            label: 'Edit Adjustment',
            onClick: () => handleOpenEdit(r)
          },
          {
            key: 'print',
            icon: <PrinterOutlined />,
            label: 'Print Voucher',
            onClick: () => handleOpenDetail(r)
          },
          {
            type: 'divider'
          },
          {
            key: 'delete',
            icon: <DeleteOutlined style={{ color: '#ef4444' }} />,
            danger: true,
            label: (
              <Popconfirm
                title="Delete & Revert Cost Adjustment?"
                description="This will restore product costs back to their previous levels and safely reverse valuation adjustments."
                onConfirm={() => handleDeleteRecord(r.id)}
                okText="Yes, Revert & Delete"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <span>Delete & Revert</span>
              </Popconfirm>
            )
          }
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      }
    }
  ];

  const content = (
    <div>
      {/* 1. Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, border: `1px solid ${adminTheme.border}` }}
            styles={{ body: { padding: '14px 18px' } }}
          >
            <Statistic
              title={<span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>TOTAL COST ADJUSTMENTS</span>}
              value={stats.total_adjustments || pagination.total || 0}
              prefix={<FileTextOutlined style={{ color: '#2563eb' }} />}
              valueStyle={{ fontWeight: 800, color: '#0f172a', fontSize: 22 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, border: `1px solid ${adminTheme.border}` }}
            styles={{ body: { padding: '14px 18px' } }}
          >
            <Statistic
              title={<span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>ACTIVE REVALUATION IMPACT</span>}
              value={Math.abs(stats.total_revaluation || 0)}
              precision={2}
              prefix={Number(stats.total_revaluation || 0) >= 0 ? '+$' : '-$'}
              valueStyle={{
                fontWeight: 900,
                color: Number(stats.total_revaluation || 0) >= 0 ? '#16a34a' : '#dc2626',
                fontSize: 22
              }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, border: `1px solid ${adminTheme.border}` }}
            styles={{ body: { padding: '14px 18px' } }}
          >
            <Statistic
              title={<span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>TOTAL PRODUCTS REVALUED</span>}
              value={stats.total_items_adjusted || 0}
              prefix={<DollarOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ fontWeight: 800, color: '#0f172a', fontSize: 22 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} md={6}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, border: `1px solid ${adminTheme.border}` }}
            styles={{ body: { padding: '14px 18px' } }}
          >
            <Statistic
              title={<span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>COMPLETED STATUS</span>}
              value={stats.completed_adjustments || 0}
              suffix={`/ ${stats.total_adjustments || 0}`}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ fontWeight: 800, color: '#10b981', fontSize: 22 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. Filter Bar & Quick Actions */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: 16,
          border: `1px solid ${adminTheme.border}`
        }}
        styles={{ body: { padding: '14px 18px' } }}
      >
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap size={10}>
              <Input
                placeholder="Search reference, reason, note..."
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                onPressEnter={() => fetchRecords(1)}
                style={{ width: 220 }}
                allowClear
              />

              <Select
                value={filterWarehouse}
                onChange={(val) => setFilterWarehouse(val)}
                style={{ width: 170 }}
              >
                <Option value="all">All Warehouses</Option>
                {warehouses.map((w) => (
                  <Option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </Option>
                ))}
              </Select>

              <Select
                value={filterReason}
                onChange={(val) => setFilterReason(val)}
                style={{ width: 180 }}
              >
                <Option value="all">All Reasons</Option>
                {standardReasons.map((r) => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Select>

              <Select
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
                style={{ width: 130 }}
              >
                <Option value="all">All Statuses</Option>
                <Option value="completed">Completed</Option>
                <Option value="pending">Pending</Option>
                <Option value="draft">Draft</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>

              <RangePicker
                style={{ width: 220 }}
                value={filterDates}
                onChange={(dates) => setFilterDates(dates)}
              />

              <Button icon={<ReloadOutlined />} onClick={() => fetchRecords(1)}>
                Reset
              </Button>
            </Space>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space size={8}>
              <Button icon={<FileExcelOutlined />} onClick={handleExportCsv}>
                Export CSV
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setPageMode('add')}
                style={{ background: '#2563eb', fontWeight: 700 }}
              >
                New Cost Adjustment
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 3. Main Data Table */}
      <Table
        dataSource={records}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '15', '25', '50'],
          onChange: (p, ps) => {
            setPagination((prev) => ({ ...prev, current: p, pageSize: ps }));
            fetchRecords(p);
          }
        }}
        size="middle"
        style={{
          border: `1px solid ${adminTheme.border}`,
          borderRadius: 12,
          overflow: 'hidden'
        }}
      />

      {/* 4. Voucher / Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarOutlined style={{ color: '#2563eb', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 800 }}>
              Cost Adjustment Voucher - {selectedRecord?.reference_no}
            </span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => {
          setIsDetailModalOpen(false);
          setSelectedRecord(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint} style={{ background: '#2563eb' }}>
            Print Voucher
          </Button>
        ]}
        width={850}
      >
        <Spin spinning={loadingDetail}>
          {selectedRecord && (
            <div ref={printRef}>
              {/* Header Details */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: 18, color: '#0f172a' }}>Aura Inventory Cost Adjustment</h2>
                    <div><strong>Reference:</strong> {selectedRecord.reference_no}</div>
                    <div><strong>Date:</strong> {dayjs(selectedRecord.date).format('YYYY-MM-DD HH:mm:ss')}</div>
                    <div><strong>Warehouse:</strong> {selectedRecord.warehouse_name || 'HQ Warehouse'}</div>
                    {selectedRecord.biller_name && <div><strong>Biller:</strong> {selectedRecord.biller_name}</div>}
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <div><strong>Status:</strong> {renderStatusTag(selectedRecord.status)}</div>
                    <div style={{ marginTop: 4 }}><strong>Reason:</strong> <Tag color="cyan">{selectedRecord.reason}</Tag></div>
                    <div style={{ marginTop: 4 }}><strong>Created By:</strong> {selectedRecord.creator_fullname || selectedRecord.creator_username || 'Admin'}</div>
                    {selectedRecord.note && (
                      <div style={{ marginTop: 6, fontStyle: 'italic', color: '#64748b' }}>
                        Note: {selectedRecord.note}
                      </div>
                    )}
                  </Col>
                </Row>
              </div>

              {/* Items Table */}
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
                    render: (_, __, i) => i + 1
                  },
                  {
                    title: 'Product & SKU',
                    key: 'prod',
                    render: (_, r) => (
                      <div>
                        <strong>{r.product_name}</strong>
                        <div><Tag color="blue" style={{ fontSize: 10 }}>{r.product_code}</Tag> {r.variant_name && <Tag color="purple">{r.variant_name}</Tag>}</div>
                      </div>
                    )
                  },
                  {
                    title: 'On-Hand Stock',
                    dataIndex: 'on_hand_quantity',
                    align: 'right',
                    render: (q, r) => `${Number(q || 0).toLocaleString()} ${r.unit_code || 'Unit'}`
                  },
                  {
                    title: 'Old Cost',
                    dataIndex: 'old_cost',
                    align: 'right',
                    render: (c) => formatCurrency(c || 0)
                  },
                  {
                    title: 'Adjusted Cost',
                    dataIndex: 'new_cost',
                    align: 'right',
                    render: (c) => <strong style={{ color: '#2563eb' }}>{formatCurrency(c || 0)}</strong>
                  },
                  {
                    title: 'Difference',
                    dataIndex: 'cost_difference',
                    align: 'right',
                    render: (d) => {
                      const num = Number(d) || 0;
                      return (
                        <strong style={{ color: num > 0 ? '#16a34a' : num < 0 ? '#dc2626' : '#64748b' }}>
                          {num > 0 ? `+${formatCurrency(num)}` : formatCurrency(num)}
                        </strong>
                      );
                    }
                  },
                  {
                    title: 'Valuation Impact',
                    dataIndex: 'valuation_change',
                    align: 'right',
                    render: (v) => {
                      const num = Number(v) || 0;
                      return (
                        <strong style={{ color: num > 0 ? '#16a34a' : num < 0 ? '#dc2626' : '#64748b' }}>
                          {num > 0 ? `+${formatCurrency(num)}` : formatCurrency(num)}
                        </strong>
                      );
                    }
                  }
                ]}
              />

              {/* Total Valuation Impact Box */}
              <div style={{ marginTop: 16, background: '#f8fafc', padding: '12px 16px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Total Net Valuation Change:</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: Number(selectedRecord.total_valuation_change || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                  {Number(selectedRecord.total_valuation_change || 0) >= 0 ? '+' : ''}{formatCurrency(selectedRecord.total_valuation_change || 0)}
                </span>
              </div>

              {/* Audit Trail */}
              {selectedRecord.history && selectedRecord.history.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 13, color: '#475569' }}>Audit Trail History:</h4>
                  <Table
                    dataSource={selectedRecord.history}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: 'Timestamp',
                        dataIndex: 'created_at',
                        width: 160,
                        render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss')
                      },
                      {
                        title: 'Action',
                        dataIndex: 'action_type',
                        width: 100,
                        render: (a) => <Tag color="blue">{a?.toUpperCase()}</Tag>
                      },
                      {
                        title: 'Audit Description',
                        dataIndex: 'description'
                      },
                      {
                        title: 'Operator',
                        dataIndex: 'creator_name',
                        width: 120,
                        render: (u) => u || 'Admin'
                      }
                    ]}
                  />
                </div>
              )}

              {/* Signatures for Print */}
              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ borderTop: '1px solid #94a3b8', width: 180, textAlign: 'center', paddingTop: 6, fontSize: 12 }}>
                  Prepared By
                </div>
                <div style={{ borderTop: '1px solid #94a3b8', width: 180, textAlign: 'center', paddingTop: 6, fontSize: 12 }}>
                  Inventory Controller
                </div>
                <div style={{ borderTop: '1px solid #94a3b8', width: 180, textAlign: 'center', paddingTop: 6, fontSize: 12 }}>
                  Finance / Manager Approved
                </div>
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div style={{ padding: '16px 20px 30px 20px' }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarOutlined style={{ color: '#2563eb' }} />
          <span>Product Cost Adjustments</span>
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Audit, adjust, and update purchase costs and inventory asset valuation records.
        </Text>
      </div>
      {content}
    </div>
  );
}
