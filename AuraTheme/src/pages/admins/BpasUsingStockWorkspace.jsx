import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
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
  Typography,
  Badge,
  Alert,
  Spin,
  Dropdown
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  RollbackOutlined,
  PrinterOutlined,
  FileTextOutlined,
  BarcodeOutlined,
  ApartmentOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  MoreOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function BpasUsingStockWorkspace({ embedded = false }) {
  const { adminTheme } = useAdminTheme();
  const { t } = useTranslation();

  // 1. Data States
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // 2. Filter States
  const [filterSearch, setFilterSearch] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterBiller, setFilterBiller] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDates, setFilterDates] = useState(null);

  // 3. Metadata States
  const [metadata, setMetadata] = useState({
    warehouses: [],
    billers: [],
    employees: [],
    units: [],
    nextReferenceNo: '',
    nextReturnRef: ''
  });

  // 4. Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnParentRecord, setReturnParentRecord] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnNote, setReturnNote] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Form State
  const [form] = Form.useForm();
  const [formWarehouseId, setFormWarehouseId] = useState(1);
  const [formItems, setFormItems] = useState([]);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Product Autocomplete inside Form
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  // -------------------------------------------------------------
  // Load Metadata
  // -------------------------------------------------------------
  const fetchMetadata = async () => {
    try {
      const res = await axios.get('/api/admin/products/using_stock/meta/options');
      if (res.data?.success && res.data?.data) {
        setMetadata(res.data.data);
      }
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // -------------------------------------------------------------
  // Fetch Using Stock Records
  // -------------------------------------------------------------
  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: filterSearch.trim() || undefined,
        warehouse_id: filterWarehouse !== 'all' ? filterWarehouse : undefined,
        biller_id: filterBiller !== 'all' ? filterBiller : undefined,
        type: filterType !== 'all' ? filterType : undefined,
        start_date: filterDates?.[0] ? filterDates[0].format('YYYY-MM-DD') : undefined,
        end_date: filterDates?.[1] ? filterDates[1].format('YYYY-MM-DD') : undefined
      };

      const res = await axios.get('/api/admin/products/using_stock', { params });
      if (res.data?.success) {
        setRecords(res.data.data || []);
        setStats(res.data.stats || {});
        if (res.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            current: res.data.pagination.page,
            total: res.data.pagination.total
          }));
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch using stock list');
    } finally {
      setLoading(false);
    }
  }, [filterSearch, filterWarehouse, filterBiller, filterType, filterDates, pagination.pageSize]);

  // Debounced search on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords(1);
    }, 280);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  // -------------------------------------------------------------
  // Product Search inside Add/Edit Form
  // -------------------------------------------------------------
  const searchAvailableProducts = useCallback(async (term, warehouseId) => {
    if (!warehouseId) return;
    setSearchingProducts(true);
    try {
      const res = await axios.get('/api/admin/products/using_stock/products', {
        params: { warehouse_id: warehouseId, search: term, limit: 25 }
      });
      if (res.data?.success) {
        setAvailableProducts(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching available products:', err);
    } finally {
      setSearchingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (isAddModalOpen) {
      const timer = setTimeout(() => {
        searchAvailableProducts(productSearchTerm, formWarehouseId);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [productSearchTerm, formWarehouseId, isAddModalOpen, searchAvailableProducts]);

  // Add Item to Form Table
  const handleSelectProduct = (product) => {
    if (!product) return;
    setFormItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.product_id === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIdx].qty_use || 1;
        const maxStock = parseFloat(product.warehouse_stock) || 0;
        if (currentQty + 1 > maxStock) {
          message.warning(`Cannot exceed available warehouse stock (${maxStock} ${product.unit_name || 'units'})`);
          return prev;
        }
        updated[existingIdx].qty_use = currentQty + 1;
        message.info(`Increased quantity for "${product.name}"`);
        return updated;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          code: product.code,
          name: product.name,
          cost: parseFloat(product.cost) || 0,
          warehouse_stock: parseFloat(product.warehouse_stock) || 0,
          qty_use: 1,
          unit: product.unit_name || 'Unit',
          product_unit_id: product.unit || 1,
          reason: ''
        }
      ];
    });
    setProductSearchTerm('');
  };

  const handleUpdateItemQty = (productId, newQty) => {
    const qty = Math.max(0.01, parseFloat(newQty) || 1);
    setFormItems((prev) =>
      prev.map((item) => {
        if (item.product_id !== productId) return item;
        if (qty > item.warehouse_stock && !isEditMode) {
          message.warning(`Quantity exceeds current stock (${item.warehouse_stock})!`);
        }
        return { ...item, qty_use: qty };
      })
    );
  };

  const handleRemoveFormItem = (productId) => {
    setFormItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  // Form Totals
  const formTotals = useMemo(() => {
    const totalItems = formItems.length;
    const totalQty = formItems.reduce((sum, item) => sum + (parseFloat(item.qty_use) || 0), 0);
    const totalCost = formItems.reduce((sum, item) => sum + ((parseFloat(item.qty_use) || 0) * (parseFloat(item.cost) || 0)), 0);
    return { totalItems, totalQty, totalCost };
  }, [formItems]);

  // -------------------------------------------------------------
  // Open Add Modal
  // -------------------------------------------------------------
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
    setFormItems([]);
    setFormWarehouseId(metadata.warehouses?.[0]?.id || 1);
    form.setFieldsValue({
      date: dayjs(),
      reference_no: metadata.nextReferenceNo,
      warehouse_id: metadata.warehouses?.[0]?.id || 1,
      biller_id: metadata.billers?.[0]?.id || 3,
      employee_id: metadata.employees?.[0]?.id || 1,
      note: ''
    });
    searchAvailableProducts('', metadata.warehouses?.[0]?.id || 1);
    setIsAddModalOpen(true);
  };

  // -------------------------------------------------------------
  // Open Edit Modal
  // -------------------------------------------------------------
  const handleOpenEdit = async (record) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/products/using_stock/${record.id}`);
      if (!res.data?.success) throw new Error(res.data?.message);
      const detail = res.data.data;

      setIsEditMode(true);
      setEditingId(detail.id);
      form.resetFields();
      setFormWarehouseId(detail.warehouse_id);

      form.setFieldsValue({
        date: detail.date ? dayjs(detail.date) : dayjs(),
        reference_no: detail.reference_no,
        warehouse_id: detail.warehouse_id,
        biller_id: detail.biller_id,
        employee_id: detail.employee_id,
        note: detail.note
      });

      setFormItems(
        (detail.items || []).map((i) => ({
          product_id: i.product_id,
          code: i.code,
          name: i.product_name,
          cost: parseFloat(i.cost) || 0,
          warehouse_stock: (parseFloat(i.current_warehouse_stock) || 0) + (parseFloat(i.qty_use) || 0),
          qty_use: parseFloat(i.qty_use) || 1,
          unit: i.unit || 'Unit',
          product_unit_id: i.product_unit_id || 1,
          reason: i.reason || i.description || ''
        }))
      );

      searchAvailableProducts('', detail.warehouse_id);
      setIsAddModalOpen(true);
    } catch (err) {
      message.error(err.message || 'Failed to load record for editing');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Submit Add / Edit Form
  // -------------------------------------------------------------
  const handleSaveForm = async () => {
    try {
      const values = await form.validateFields();
      if (formItems.length === 0) {
        message.warning('Please add at least one product item to consume.');
        return;
      }

      setSubmittingForm(true);
      const payload = {
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        reference_no: values.reference_no,
        warehouse_id: values.warehouse_id,
        biller_id: values.biller_id,
        employee_id: values.employee_id,
        note: values.note,
        items: formItems.map((item) => ({
          product_id: item.product_id,
          qty_use: parseFloat(item.qty_use) || 1,
          cost: parseFloat(item.cost) || 0,
          unit: item.unit,
          product_unit_id: item.product_unit_id,
          reason: item.reason
        }))
      };

      if (isEditMode && editingId) {
        await axios.put(`/api/admin/products/using_stock/${editingId}`, payload);
        message.success('Stock usage record updated successfully.');
      } else {
        await axios.post('/api/admin/products/using_stock', payload);
        message.success('Stock usage record created successfully.');
      }

      setIsAddModalOpen(false);
      fetchRecords(pagination.current);
      fetchMetadata();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmittingForm(false);
    }
  };

  // -------------------------------------------------------------
  // Delete / Cancel Record
  // -------------------------------------------------------------
  const handleDeleteRecord = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/products/using_stock/${id}`);
      if (res.data?.success) {
        message.success(res.data.message || 'Record deleted and stock restored successfully.');
        fetchRecords(pagination.current);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete record');
    }
  };

  // -------------------------------------------------------------
  // View Details Modal
  // -------------------------------------------------------------
  const handleOpenDetail = async (record) => {
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`/api/admin/products/using_stock/${record.id}`);
      if (res.data?.success) {
        setSelectedRecord(res.data.data);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch details');
    } finally {
      setLoadingDetail(false);
    }
  };

  // -------------------------------------------------------------
  // Stock Return Modal
  // -------------------------------------------------------------
  const handleOpenReturn = async (record) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/products/using_stock/${record.id}`);
      if (!res.data?.success) throw new Error(res.data?.message);
      const detail = res.data.data;

      setReturnParentRecord(detail);
      setReturnItems(
        (detail.items || []).map((i) => ({
          product_id: i.product_id,
          code: i.code,
          name: i.product_name,
          cost: parseFloat(i.cost) || 0,
          used_qty: parseFloat(i.qty_use) || 0,
          qty_return: parseFloat(i.qty_use) || 0, // default to returning full used qty
          unit: i.unit || 'Unit',
          reason: 'Leftover stock return'
        }))
      );
      setReturnNote(`Stock return against ${detail.reference_no}`);
      setIsReturnModalOpen(true);
    } catch (err) {
      message.error(err.message || 'Failed to initialize return');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReturn = async () => {
    if (!returnParentRecord) return;
    const itemsToReturn = returnItems.filter((i) => (parseFloat(i.qty_return) || 0) > 0);
    if (itemsToReturn.length === 0) {
      message.warning('Please enter a return quantity > 0 for at least one item.');
      return;
    }

    setSubmittingReturn(true);
    try {
      const payload = {
        date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        note: returnNote,
        items: itemsToReturn.map((i) => ({
          product_id: i.product_id,
          qty_return: parseFloat(i.qty_return),
          reason: i.reason
        }))
      };

      const res = await axios.post(`/api/admin/products/using_stock/${returnParentRecord.id}/return`, payload);
      if (res.data?.success) {
        message.success('Stock return recorded and inventory restored!');
        setIsReturnModalOpen(false);
        fetchRecords(pagination.current);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to record return');
    } finally {
      setSubmittingReturn(false);
    }
  };

  // -------------------------------------------------------------
  // Table Columns
  // -------------------------------------------------------------
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-')
    },
    {
      title: 'Reference No',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 170,
      render: (ref, r) => (
        <div>
          <strong style={{ color: '#2563eb' }}>{ref}</strong>
          {r.using_reference_no && (
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Ref: {r.using_reference_no}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type) => (
        <Tag color={type === 'return' ? 'volcano' : 'green'} style={{ fontWeight: 700, textTransform: 'uppercase' }}>
          {type === 'return' ? 'Stock Return' : 'Stock Use'}
        </Tag>
      )
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse_name',
      key: 'warehouse_name',
      render: (wh) => (
        <Space size={4}>
          <ApartmentOutlined style={{ color: '#2563eb' }} />
          <span>{wh || '-'}</span>
        </Space>
      )
    },
    {
      title: 'Biller / Branch',
      dataIndex: 'biller_company',
      key: 'biller_company',
      render: (bc, r) => bc || r.biller_name || '-'
    },
    {
      title: 'Issued To / Employee',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (emp, r) => (
        <Space size={4}>
          <UserOutlined style={{ color: '#64748b' }} />
          <span>{emp || (r.employee_first_name ? `${r.employee_first_name} ${r.employee_last_name || ''}` : 'Admin')}</span>
        </Space>
      )
    },
    {
      title: 'Items Summary',
      dataIndex: 'items_summary',
      key: 'items_summary',
      ellipsis: true,
      render: (summary, r) => (
        <Tooltip title={summary}>
          <span style={{ fontSize: 12 }}>
            <Badge count={r.items_count || 1} style={{ backgroundColor: '#2563eb', marginRight: 6 }} />
            {summary || 'Consumable stock items'}
          </span>
        </Tooltip>
      )
    },
    {
      title: 'Total Qty',
      dataIndex: 'total_qty_used',
      key: 'total_qty_used',
      width: 100,
      align: 'right',
      render: (qty, r) => (
        <strong style={{ color: r.type === 'return' ? '#d97706' : '#0f172a' }}>
          {parseFloat(qty).toFixed(2)}
        </strong>
      )
    },
    {
      title: 'Total Cost',
      dataIndex: 'total_cost',
      key: 'total_cost',
      width: 120,
      align: 'right',
      render: (cost) => <strong style={{ color: '#16a34a' }}>{formatCurrency(cost)}</strong>
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (n) => n || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, r) => {
        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Voucher Details',
            onClick: () => handleOpenDetail(r)
          },
          ...(r.type === 'use' ? [
            {
              key: 'return',
              icon: <RollbackOutlined style={{ color: '#d97706' }} />,
              label: 'Return Stock',
              onClick: () => handleOpenReturn(r)
            },
            {
              key: 'edit',
              icon: <EditOutlined style={{ color: '#2563eb' }} />,
              label: 'Edit Stock Usage',
              onClick: () => handleOpenEdit(r)
            }
          ] : []),
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
                title="Cancel & Delete Stock Usage?"
                description="This will restore all consumed quantities back to the warehouse inventory."
                onConfirm={() => handleDeleteRecord(r.id)}
                okText="Yes, Delete"
                cancelText="No"
              >
                <span>Delete & Restore Stock</span>
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
    <div className="bpas-using-stock-workspace" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 
        =========================================================================
        TOP METRIC STATISTIC STRIP
        =========================================================================
      */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
            <Statistic
              title={<span style={{ color: adminTheme.subtext }}>Total Stock Consumptions</span>}
              value={stats.count_use || 0}
              prefix={<FileTextOutlined style={{ color: '#2563eb' }} />}
              valueStyle={{ fontWeight: 800, color: adminTheme.text }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
            <Statistic
              title={<span style={{ color: adminTheme.subtext }}>Total Value Used</span>}
              value={stats.total_use_cost || 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#16a34a' }} />}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ fontWeight: 800, color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
            <Statistic
              title={<span style={{ color: adminTheme.subtext }}>Stock Returns</span>}
              value={stats.count_return || 0}
              prefix={<RollbackOutlined style={{ color: '#d97706' }} />}
              valueStyle={{ fontWeight: 800, color: '#d97706' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ background: adminTheme.surface, borderColor: adminTheme.border }}>
            <Statistic
              title={<span style={{ color: adminTheme.subtext }}>Total Returned Value</span>}
              value={stats.total_return_cost || 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#d97706' }} />}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ fontWeight: 800, color: '#d97706' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 
        =========================================================================
        MAIN WORKSPACE CARD & FILTER BAR
        =========================================================================
      */}
      <Card
        title={
          <Space>
            <ApartmentOutlined style={{ color: '#2563eb', fontSize: 18 }} />
            <span style={{ fontWeight: 800, fontSize: 16 }}>Using Stock Management</span>
            <Tag color="blue">AURA_v1 Engine</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchRecords(1)}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd} style={{ background: '#2563eb', fontWeight: 600 }}>
              Add Using Stock
            </Button>
          </Space>
        }
        style={{ background: adminTheme.surface, borderColor: adminTheme.border }}
      >
        {/* Filters */}
        <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Search reference, note, product..."
              prefix={<SearchOutlined />}
              allowClear
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filterWarehouse}
              onChange={(val) => setFilterWarehouse(val)}
              style={{ width: '100%' }}
              placeholder="Warehouse"
            >
              <Option value="all">All Warehouses</Option>
              {metadata.warehouses?.map((w) => (
                <Option key={w.id} value={w.id}>
                  {w.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filterBiller}
              onChange={(val) => setFilterBiller(val)}
              style={{ width: '100%' }}
              placeholder="Biller"
            >
              <Option value="all">All Billers</Option>
              {metadata.billers?.map((b) => (
                <Option key={b.id} value={b.id}>
                  {b.company || b.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={filterType}
              onChange={(val) => setFilterType(val)}
              style={{ width: '100%' }}
            >
              <Option value="all">All Types</Option>
              <Option value="use">Stock Usage (use)</Option>
              <Option value="return">Stock Return (return)</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={filterDates}
              onChange={(d) => setFilterDates(d)}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>

        {/* Table */}
        <Table
          dataSource={records}
          rowKey="id"
          columns={columns}
          loading={loading}
          size="middle"
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '15', '25', '50', '100'],
            onChange: (p, s) => {
              setPagination((prev) => ({ ...prev, current: p, pageSize: s }));
              fetchRecords(p);
            }
          }}
        />
      </Card>

      {/* 
        =========================================================================
        ADD / EDIT STOCK USAGE MODAL FORM (matches AURA_v1 add_using_stock.php)
        =========================================================================
      */}
      <Modal
        title={
          <Space>
            {isEditMode ? <EditOutlined style={{ color: '#2563eb' }} /> : <PlusOutlined style={{ color: '#2563eb' }} />}
            <span style={{ fontWeight: 800 }}>
              {isEditMode ? `Edit Using Stock #${editingId}` : 'Add Using Stock (Store Consumption)'}
            </span>
          </Space>
        }
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        width={980}
        confirmLoading={submittingForm}
        onOk={handleSaveForm}
        okText={isEditMode ? 'Update Stock Usage' : 'Save & Deduct Stock'}
      >
        <Form form={form} layout="vertical">
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="date"
                label="Usage Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="reference_no"
                label="Reference No"
                rules={[{ required: true, message: 'Reference number is required' }]}
              >
                <Input placeholder="e.g. SU26/0001" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                name="warehouse_id"
                label="Source Warehouse"
                rules={[{ required: true, message: 'Please select warehouse' }]}
              >
                <Select
                  onChange={(val) => {
                    setFormWarehouseId(val);
                    searchAvailableProducts(productSearchTerm, val);
                  }}
                >
                  {metadata.warehouses?.map((w) => (
                    <Option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="biller_id" label="Biller / Branch">
                <Select>
                  {metadata.billers?.map((b) => (
                    <Option key={b.id} value={b.id}>
                      {b.company || b.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Form.Item name="employee_id" label="Authorized Staff / Issued To">
                <Select placeholder="Select Employee">
                  {metadata.employees?.map((e) => (
                    <Option key={e.id} value={e.id}>
                      {e.username} ({e.first_name || ''} {e.last_name || ''})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="note" label="Usage Purpose / Note">
                <Input placeholder="e.g. Store internal consumption, kitchen supply, or maintenance" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0 16px 0' }} />

          {/* Product Auto-complete Selector */}
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 14 }}>
            <label style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
              <BarcodeOutlined style={{ color: '#2563eb', marginRight: 6 }} />
              Scan Barcode or Search Products in Warehouse:
            </label>
            <Select
              showSearch
              placeholder="Type product name, barcode, or code to add..."
              style={{ width: '100%' }}
              filterOption={false}
              onSearch={(val) => setProductSearchTerm(val)}
              onChange={(val) => {
                const prod = availableProducts.find((p) => p.id === val);
                handleSelectProduct(prod);
              }}
              notFoundContent={searchingProducts ? <Spin size="small" /> : 'No products found'}
            >
              {availableProducts.map((p) => (
                <Option key={p.id} value={p.id} disabled={p.warehouse_stock <= 0}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      <strong>{p.name}</strong> ({p.code})
                    </span>
                    <Space size={8}>
                      <Tag color={p.warehouse_stock > 0 ? 'green' : 'red'}>
                        QOH: {p.warehouse_stock} {p.unit_name || ''}
                      </Tag>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>{formatCurrency(p.cost)}</span>
                    </Space>
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          {/* Line Items Table (#toTable) */}
          <Table
            dataSource={formItems}
            rowKey="product_id"
            size="small"
            pagination={false}
            columns={[
              {
                title: 'Product (Code - Name)',
                dataIndex: 'name',
                key: 'name',
                render: (name, r) => (
                  <div>
                    <strong>{name}</strong>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Code: {r.code}</div>
                  </div>
                )
              },
              {
                title: 'Stock (QOH)',
                dataIndex: 'warehouse_stock',
                key: 'warehouse_stock',
                width: 110,
                render: (stock) => <Tag color="blue">{stock}</Tag>
              },
              {
                title: 'Cost',
                dataIndex: 'cost',
                key: 'cost',
                width: 100,
                render: (c) => formatCurrency(c)
              },
              {
                title: 'Quantity to Use',
                dataIndex: 'qty_use',
                key: 'qty_use',
                width: 140,
                render: (qty, r) => (
                  <InputNumber
                    min={0.01}
                    max={r.warehouse_stock || 9999}
                    step={1}
                    value={qty}
                    onChange={(val) => handleUpdateItemQty(r.product_id, val)}
                    style={{ width: '100%' }}
                  />
                )
              },
              {
                title: 'Unit',
                dataIndex: 'unit',
                key: 'unit',
                width: 90
              },
              {
                title: 'Reason / Note',
                dataIndex: 'reason',
                key: 'reason',
                render: (reason, r) => (
                  <Input
                    placeholder="Item purpose..."
                    value={reason}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormItems((prev) =>
                        prev.map((i) => (i.product_id === r.product_id ? { ...i, reason: val } : i))
                      );
                    }}
                  />
                )
              },
              {
                title: 'Subtotal',
                key: 'subtotal',
                width: 110,
                align: 'right',
                render: (_, r) => <strong>{formatCurrency(r.qty_use * r.cost)}</strong>
              },
              {
                title: '',
                key: 'del',
                width: 50,
                align: 'center',
                render: (_, r) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveFormItem(r.product_id)}
                  />
                )
              }
            ]}
          />

          {/* Totals Strip */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
              padding: '10px 16px',
              background: '#f1f5f9',
              borderRadius: 6
            }}
          >
            <div>
              Total Line Items: <strong>{formTotals.totalItems}</strong> | Total Units: <strong>{formTotals.totalQty.toFixed(2)}</strong>
            </div>
            <div style={{ fontSize: 16 }}>
              Total Usage Value: <strong style={{ color: '#16a34a' }}>{formatCurrency(formTotals.totalCost)}</strong>
            </div>
          </div>
        </Form>
      </Modal>

      {/* 
        =========================================================================
        STOCK RETURN MODAL (return_using_stock.php)
        =========================================================================
      */}
      <Modal
        title={
          <Space>
            <RollbackOutlined style={{ color: '#d97706' }} />
            <span style={{ fontWeight: 800 }}>
              Return Stock from #{returnParentRecord?.reference_no}
            </span>
          </Space>
        }
        open={isReturnModalOpen}
        onCancel={() => setIsReturnModalOpen(false)}
        width={800}
        confirmLoading={submittingReturn}
        onOk={handleSaveReturn}
        okText="Confirm Return & Restore Stock"
      >
        <Alert
          type="info"
          showIcon
          message="Specify the leftover quantities being returned to the warehouse. Returned items will be re-added to inventory."
          style={{ marginBottom: 14 }}
        />

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Return Note / Reason:</label>
          <Input value={returnNote} onChange={(e) => setReturnNote(e.target.value)} />
        </div>

        <Table
          dataSource={returnItems}
          rowKey="product_id"
          size="small"
          pagination={false}
          columns={[
            {
              title: 'Product',
              dataIndex: 'name',
              key: 'name',
              render: (name, r) => (
                <div>
                  <strong>{name}</strong>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{r.code}</div>
                </div>
              )
            },
            {
              title: 'Original Used',
              dataIndex: 'used_qty',
              key: 'used_qty',
              width: 120,
              render: (used, r) => `${used} ${r.unit}`
            },
            {
              title: 'Qty to Return',
              dataIndex: 'qty_return',
              key: 'qty_return',
              width: 140,
              render: (val, r) => (
                <InputNumber
                  min={0}
                  max={r.used_qty}
                  step={1}
                  value={val}
                  onChange={(v) => {
                    const safe = Math.min(r.used_qty, Math.max(0, parseFloat(v) || 0));
                    setReturnItems((prev) =>
                      prev.map((item) => (item.product_id === r.product_id ? { ...item, qty_return: safe } : item))
                    );
                  }}
                  style={{ width: '100%' }}
                />
              )
            },
            {
              title: 'Restored Value',
              key: 'val',
              width: 110,
              align: 'right',
              render: (_, r) => <strong>{formatCurrency((r.qty_return || 0) * r.cost)}</strong>
            }
          ]}
        />
      </Modal>

      {/* 
        =========================================================================
        DETAIL & PRINT VOUCHER MODAL (print_using_stock.php)
        =========================================================================
      */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#2563eb' }} />
            <span>Stock Usage Voucher Details</span>
          </Space>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={850}
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
      >
        {loadingDetail || !selectedRecord ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div className="using-stock-voucher" style={{ padding: '4px 8px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b' }}>
                  {selectedRecord.biller_company || selectedRecord.biller_name || 'AURA Enterprise'}
                </h3>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Warehouse: <strong>{selectedRecord.warehouse_name}</strong> ({selectedRecord.warehouse_code})
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Tag color={selectedRecord.type === 'return' ? 'volcano' : 'green'} style={{ fontSize: 13, padding: '2px 8px' }}>
                  {selectedRecord.type === 'return' ? 'STOCK RETURN' : 'STOCK USAGE'}
                </Tag>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>
                  {selectedRecord.reference_no}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {dayjs(selectedRecord.date).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
            </div>

            {/* Issued info */}
            <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text type="secondary">Issued To / Staff: </Text>
                <strong>{selectedRecord.employee_name || 'Admin'}</strong>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text type="secondary">Recorded By: </Text>
                <strong>{selectedRecord.creator_name || 'Admin'}</strong>
              </Col>
              {selectedRecord.note && (
                <Col span={24}>
                  <Text type="secondary">Purpose / Note: </Text>
                  <span>{selectedRecord.note}</span>
                </Col>
              )}
            </Row>

            {/* Items Table */}
            <Table
              dataSource={selectedRecord.items || []}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: '#',
                  key: 'idx',
                  width: 40,
                  render: (_, __, idx) => idx + 1
                },
                {
                  title: 'Product Code',
                  dataIndex: 'code',
                  key: 'code',
                  width: 120
                },
                {
                  title: 'Product Name',
                  dataIndex: 'product_name',
                  key: 'product_name'
                },
                {
                  title: 'Quantity Used',
                  dataIndex: 'qty_use',
                  key: 'qty_use',
                  width: 120,
                  align: 'right',
                  render: (qty, r) => `${qty} ${r.unit || ''}`
                },
                {
                  title: 'Unit Cost',
                  dataIndex: 'cost',
                  key: 'cost',
                  width: 110,
                  align: 'right',
                  render: (c) => formatCurrency(c)
                },
                {
                  title: 'Subtotal',
                  key: 'subtotal',
                  width: 120,
                  align: 'right',
                  render: (_, r) => <strong>{formatCurrency(r.qty_use * r.cost)}</strong>
                }
              ]}
            />

            {/* Total Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <div style={{ width: 250, borderTop: '2px solid #e2e8f0', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
                  <span>Total Value:</span>
                  <strong style={{ color: '#16a34a' }}>{formatCurrency(selectedRecord.total_cost)}</strong>
                </div>
              </div>
            </div>

            {/* Signature blocks */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, textAlign: 'center' }}>
              <div style={{ width: 180 }}>
                <div style={{ borderBottom: '1px solid #cbd5e1', height: 40 }}></div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600 }}>Prepared By</div>
              </div>
              <div style={{ width: 180 }}>
                <div style={{ borderBottom: '1px solid #cbd5e1', height: 40 }}></div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600 }}>Issued By</div>
              </div>
              <div style={{ width: 180 }}>
                <div style={{ borderBottom: '1px solid #cbd5e1', height: 40 }}></div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600 }}>Received By</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
