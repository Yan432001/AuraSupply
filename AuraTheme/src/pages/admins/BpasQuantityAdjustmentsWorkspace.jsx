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
  Dropdown,
  Spin
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
  ArrowUpOutlined,
  ArrowDownOutlined,
  ToolOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';
import BpasAddQuantityAdjustmentPage from './BpasAddQuantityAdjustmentPage';
import BpasEditQuantityAdjustmentPage from './BpasEditQuantityAdjustmentPage';
import BpasViewAdjustmentModal from './BpasViewAdjustmentModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function BpasQuantityAdjustmentsWorkspace({ embedded = false }) {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();

  // Mode: 'list' | 'add' | 'edit'
  const [pageMode, setPageMode] = useState('list');
  const [editingId, setEditingId] = useState(null);

  // Data States
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterBiller, setFilterBiller] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDates, setFilterDates] = useState(null);

  // Metadata
  const [warehouses, setWarehouses] = useState([]);
  const [billers, setBillers] = useState([]);

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // 1. Fetch Metadata Options
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await axios.get('/api/admin/products/quantity_adjustments/meta/options');
        if (res.data?.success) {
          setWarehouses(res.data.data.warehouses || []);
          setBillers(res.data.data.billers || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeta();
  }, []);

  // 2. Fetch Records
  const fetchRecords = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pagination.pageSize,
          search: filterSearch.trim(),
          warehouse_id: filterWarehouse,
          biller_id: filterBiller,
          type: filterType
        };

        if (filterDates && filterDates[0] && filterDates[1]) {
          params.start_date = filterDates[0].format('YYYY-MM-DD');
          params.end_date = filterDates[1].format('YYYY-MM-DD');
        }

        const res = await axios.get('/api/admin/products/quantity_adjustments', { params });
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
        message.error('Failed to load quantity adjustments');
      } finally {
        setLoading(false);
      }
    },
    [filterSearch, filterWarehouse, filterBiller, filterType, filterDates, pagination.pageSize]
  );

  useEffect(() => {
    fetchRecords(1);
  }, [fetchRecords]);

  // 3. Actions
  const handleOpenDetail = async (record) => {
    try {
      const res = await axios.get(`/api/admin/products/quantity_adjustments/${record.id}`);
      if (res.data?.success) {
        setSelectedRecord(res.data.data);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      message.error('Failed to load voucher details');
    }
  };

  const handleOpenEdit = (record) => {
    setEditingId(record.id);
    setPageMode('edit');
  };

  const handleDeleteRecord = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/products/quantity_adjustments/${id}`);
      if (res.data?.success) {
        message.success('Adjustment deleted and inventory stock reversed successfully!');
        fetchRecords(pagination.current);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete adjustment');
    }
  };

  const handleExportCsv = () => {
    if (records.length === 0) {
      message.warning('No records to export');
      return;
    }
    const headers = ['Date', 'Reference No', 'Warehouse', 'Biller', 'Items Count', 'Additions', 'Subtractions', 'Net Qty', 'Created By', 'Note'];
    const rows = records.map((r) => [
      r.date ? dayjs(r.date).format('YYYY-MM-DD HH:mm') : '',
      `"${r.reference_no}"`,
      `"${r.warehouse_name || ''}"`,
      `"${r.biller_name || ''}"`,
      r.items_count || 0,
      r.total_addition_qty || 0,
      r.total_subtraction_qty || 0,
      r.net_quantity || 0,
      `"${r.creator_fullname || r.creator_username || ''}"`,
      `"${(r.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quantity_Adjustments_${dayjs().format('YYYYMMDD_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If in Add Mode
  if (pageMode === 'add') {
    return (
      <BpasAddQuantityAdjustmentPage
        onBack={() => setPageMode('list')}
        onSuccess={() => {
          setPageMode('list');
          fetchRecords(1);
        }}
      />
    );
  }

  // If in Edit Mode
  if (pageMode === 'edit') {
    return (
      <BpasEditQuantityAdjustmentPage
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

  // Columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '—')
    },
    {
      title: 'Reference No',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 160,
      render: (ref, r) => (
        <a
          onClick={() => handleOpenDetail(r)}
          style={{ fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
        >
          {ref}
        </a>
      )
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      render: (wh) => (
        <Space size={4}>
          <ApartmentOutlined style={{ color: '#2563eb' }} />
          <span>{wh || '—'}</span>
        </Space>
      )
    },
    {
      title: 'Biller / Branch',
      dataIndex: 'biller_name',
      key: 'biller_name',
      render: (b) => b || '—'
    },
    {
      title: 'Items',
      dataIndex: 'items_count',
      key: 'items_count',
      width: 80,
      align: 'center',
      render: (cnt) => <Tag color="blue">{cnt}</Tag>
    },
    {
      title: 'Adjustments (Add / Sub)',
      key: 'breakdown',
      width: 180,
      render: (_, r) => (
        <Space size={6}>
          {Number(r.total_addition_qty) > 0 && (
            <Tag color="green" style={{ fontWeight: 700 }}>
              +{Number(r.total_addition_qty)}
            </Tag>
          )}
          {Number(r.total_subtraction_qty) > 0 && (
            <Tag color="red" style={{ fontWeight: 700 }}>
              -{Number(r.total_subtraction_qty)}
            </Tag>
          )}
          {Number(r.total_addition_qty) === 0 && Number(r.total_subtraction_qty) === 0 && (
            <span style={{ color: '#94a3b8' }}>0</span>
          )}
        </Space>
      )
    },
    {
      title: 'Net Qty',
      dataIndex: 'net_quantity',
      key: 'net_quantity',
      width: 100,
      align: 'right',
      render: (net) => {
        const n = Number(net) || 0;
        return (
          <strong style={{ color: n > 0 ? '#16a34a' : n < 0 ? '#dc2626' : '#64748b' }}>
            {n > 0 ? `+${n}` : n}
          </strong>
        );
      }
    },
    {
      title: 'Created By',
      dataIndex: 'creator_fullname',
      key: 'created_by',
      render: (name, r) => (
        <Space size={4}>
          <UserOutlined style={{ color: '#64748b' }} />
          <span>{name || r.creator_username || 'Admin'}</span>
        </Space>
      )
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (n) => n || '—'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
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
                title="Cancel & Delete Adjustment?"
                description="This will safely reverse all stock changes back to warehouse balances."
                onConfirm={() => handleDeleteRecord(r.id)}
                okText="Yes, Delete"
                cancelText="No"
              >
                <span>Delete & Reverse Stock</span>
              </Popconfirm>
            )
          }
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button size="small" icon={<MoreOutlined />}>
              Actions
            </Button>
          </Dropdown>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Top KPI Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: adminTheme?.card || '#ffffff', borderColor: adminTheme?.border || '#e2e8f0' }}>
            <Statistic
              title={<span style={{ color: adminTheme?.subtext || '#64748b' }}>Total Adjustments</span>}
              value={stats.total_adjustments || records.length || 0}
              prefix={<ToolOutlined style={{ color: '#2563eb' }} />}
              valueStyle={{ fontWeight: 800, color: adminTheme?.text || '#0f172a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: adminTheme?.card || '#ffffff', borderColor: adminTheme?.border || '#e2e8f0' }}>
            <Statistic
              title={<span style={{ color: adminTheme?.subtext || '#64748b' }}>Total Added Quantity</span>}
              value={stats.total_added_qty || 0}
              prefix={<ArrowUpOutlined style={{ color: '#16a34a' }} />}
              valueStyle={{ fontWeight: 800, color: '#16a34a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: adminTheme?.card || '#ffffff', borderColor: adminTheme?.border || '#e2e8f0' }}>
            <Statistic
              title={<span style={{ color: adminTheme?.subtext || '#64748b' }}>Total Subtracted Quantity</span>}
              value={stats.total_subtracted_qty || 0}
              prefix={<ArrowDownOutlined style={{ color: '#dc2626' }} />}
              valueStyle={{ fontWeight: 800, color: '#dc2626' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: adminTheme?.card || '#ffffff', borderColor: adminTheme?.border || '#e2e8f0' }}>
            <Statistic
              title={<span style={{ color: adminTheme?.subtext || '#64748b' }}>Net Quantity Difference</span>}
              value={(Number(stats.total_added_qty) || 0) - (Number(stats.total_subtracted_qty) || 0)}
              prefix={<SwapOutlined style={{ color: '#6366f1' }} />}
              valueStyle={{
                fontWeight: 800,
                color:
                  (Number(stats.total_added_qty) || 0) - (Number(stats.total_subtracted_qty) || 0) >= 0
                    ? '#16a34a'
                    : '#dc2626'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. Filter & Toolbar */}
      <Card
        size="small"
        style={{ borderRadius: 12, border: `1px solid ${adminTheme?.border || '#e2e8f0'}` }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} lg={16}>
            <Space wrap size={8}>
              <Input
                placeholder="Search reference, product, note..."
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
                  <Option key={w.id} value={String(w.id)}>
                    {w.name}
                  </Option>
                ))}
              </Select>

              <Select
                value={filterBiller}
                onChange={(val) => setFilterBiller(val)}
                style={{ width: 150 }}
              >
                <Option value="all">All Billers</Option>
                {billers.map((b) => (
                  <Option key={b.id} value={String(b.id)}>
                    {b.company && b.company !== '-' ? b.company : b.name}
                  </Option>
                ))}
              </Select>

              <Select
                value={filterType}
                onChange={(val) => setFilterType(val)}
                style={{ width: 130 }}
              >
                <Option value="all">All Types</Option>
                <Option value="addition">Addition (+)</Option>
                <Option value="subtraction">Subtraction (-)</Option>
              </Select>

              <RangePicker
                style={{ width: 220 }}
                value={filterDates}
                onChange={(d) => setFilterDates(d)}
              />

              <Button icon={<SearchOutlined />} onClick={() => fetchRecords(1)}>
                Filter
              </Button>
            </Space>
          </Col>

          <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
            <Space size={8}>
              <Button icon={<FileExcelOutlined />} onClick={handleExportCsv}>
                Export CSV
              </Button>
              <Button icon={<ReloadOutlined spin={loading} />} onClick={() => fetchRecords(pagination.current)}>
                Sync
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setPageMode('add')}
                style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
              >
                Add Adjustment
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 3. Table */}
      <Table
        rowKey="id"
        dataSource={records}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} adjustments`,
          onChange: (page) => fetchRecords(page)
        }}
        bordered
        size="middle"
      />

      {/* 4. Voucher Detail Modal */}
      <BpasViewAdjustmentModal
        open={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecord(null);
        }}
        adjustment={selectedRecord}
      />
    </div>
  );
}
