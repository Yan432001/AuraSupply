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
  InputNumber,
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
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExportOutlined,
  RollbackOutlined,
  ShoppingOutlined,
  ShopOutlined,
  SendOutlined,
  FileDoneOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { formatCurrency } from '../../utils/uiTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function BpasConsignmentsWorkspace({ embedded = false }) {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({
    total_count: 0,
    total_dispatched_qty: 0,
    total_sold_qty: 0,
    total_returned_qty: 0,
    total_remaining_qty: 0,
    total_amount: 0,
    completed_count: 0,
    active_count: 0,
  });

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState(null);

  // Metadata
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Return Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnForm] = Form.useForm();
  const [returnItems, setReturnItems] = useState([]);

  // Sales Modal
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [salesSubmitting, setSalesSubmitting] = useState(false);
  const [salesForm] = Form.useForm();
  const [salesItems, setSalesItems] = useState([]);

  // Fetch Metadata Options
  const fetchMetadata = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/consignments/meta/options');
      if (res.data?.success && res.data.data) {
        setWarehouses(res.data.data.warehouses || []);
        setCustomers(res.data.data.customers || []);
      }
    } catch (err) {
      console.warn('Failed to load consignment metadata:', err.message);
    }
  }, []);

  // Fetch Consignments List
  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        search: filterSearch,
        warehouse_id: filterWarehouse,
        customer_id: filterCustomer,
        status: filterStatus,
      };

      if (filterDateRange && filterDateRange.length === 2) {
        params.start_date = filterDateRange[0].format('YYYY-MM-DD');
        params.end_date = filterDateRange[1].format('YYYY-MM-DD');
      }

      const res = await axios.get('/api/admin/consignments', { params });
      if (res.data?.success) {
        setRecords(res.data.data.data || []);
        setPagination(res.data.data.pagination || { page, limit: 15, total: 0 });
        if (res.data.data.summary) {
          setSummary(res.data.data.summary);
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load consignments records');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filterSearch, filterWarehouse, filterCustomer, filterStatus, filterDateRange]);

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
      const res = await axios.get(`/api/admin/consignments/${record.id}`);
      if (res.data?.success) {
        setSelectedRecord(res.data.data);
      }
    } catch (err) {
      message.error('Failed to load detailed consignment voucher');
    } finally {
      setDetailLoading(false);
    }
  };

  // Delete Consignment
  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/consignments/${id}`);
      if (res.data?.success) {
        message.success('Consignment voucher deleted and dispatched inventory safely reversed.');
        fetchRecords(pagination.page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete consignment voucher');
    }
  };

  // Open Record Return Modal
  const handleOpenReturnModal = async (record) => {
    try {
      const res = await axios.get(`/api/admin/consignments/${record.id}`);
      if (res.data?.success) {
        const fullRec = res.data.data;
        setSelectedRecord(fullRec);

        // Prepopulate return items with remaining salable balance
        const itemsToReturn = (fullRec.items || [])
          .filter(it => parseFloat(it.balance_quantity) > 0)
          .map(it => ({
            consignment_item_id: it.id,
            product_id: it.product_id,
            product_name: it.product_name,
            product_code: it.product_code,
            product_unit_code: it.product_unit_code || 'Unit',
            max_returnable: parseFloat(it.balance_quantity || 0),
            return_quantity: 0,
            unit_cost: it.unit_cost || 0,
          }));

        setReturnItems(itemsToReturn);
        returnForm.setFieldsValue({
          date: dayjs(),
          note: '',
        });
        setIsReturnModalOpen(true);
      }
    } catch (err) {
      message.error('Failed to open return dialogue');
    }
  };

  // Submit Consignment Return
  const handleSubmitReturn = async () => {
    const validItems = returnItems.filter(it => parseFloat(it.return_quantity) > 0);
    if (validItems.length === 0) {
      message.error('Please specify a return quantity greater than 0 for at least one product.');
      return;
    }

    setReturnSubmitting(true);
    try {
      const values = returnForm.getFieldsValue();
      const payload = {
        date: values.date ? values.date.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        note: values.note || '',
        items: validItems.map(it => ({
          consignment_item_id: it.consignment_item_id,
          product_id: it.product_id,
          return_quantity: parseFloat(it.return_quantity),
          unit_cost: it.unit_cost,
        })),
      };

      const res = await axios.post(`/api/admin/consignments/${selectedRecord.id}/returns`, payload);
      if (res.data?.success) {
        message.success('Consignment return processed! Stock returned to warehouse.');
        setIsReturnModalOpen(false);
        fetchRecords(pagination.page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit consignment return');
    } finally {
      setReturnSubmitting(false);
    }
  };

  // Open Record Sales Modal
  const handleOpenSalesModal = async (record) => {
    try {
      const res = await axios.get(`/api/admin/consignments/${record.id}`);
      if (res.data?.success) {
        const fullRec = res.data.data;
        setSelectedRecord(fullRec);

        const itemsToSell = (fullRec.items || [])
          .filter(it => parseFloat(it.balance_quantity) > 0)
          .map(it => ({
            consignment_item_id: it.id,
            product_id: it.product_id,
            product_name: it.product_name,
            product_code: it.product_code,
            product_unit_code: it.product_unit_code || 'Unit',
            max_salable: parseFloat(it.balance_quantity || 0),
            sale_quantity: 0,
            unit_price: it.unit_price || 0,
          }));

        setSalesItems(itemsToSell);
        salesForm.setFieldsValue({ note: '' });
        setIsSalesModalOpen(true);
      }
    } catch (err) {
      message.error('Failed to open sales dialogue');
    }
  };

  // Submit Consignment Sales
  const handleSubmitSales = async () => {
    const validItems = salesItems.filter(it => parseFloat(it.sale_quantity) > 0);
    if (validItems.length === 0) {
      message.error('Please specify a sale quantity greater than 0 for at least one product.');
      return;
    }

    setSalesSubmitting(true);
    try {
      const payload = {
        items: validItems.map(it => ({
          consignment_item_id: it.consignment_item_id,
          sale_quantity: parseFloat(it.sale_quantity),
        })),
      };

      const res = await axios.post(`/api/admin/consignments/${selectedRecord.id}/sales`, payload);
      if (res.data?.success) {
        message.success('Reported consignment sales recorded successfully.');
        setIsSalesModalOpen(false);
        fetchRecords(pagination.page);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to record consignment sales');
    } finally {
      setSalesSubmitting(false);
    }
  };

  // Print voucher
  const handlePrint = () => {
    window.print();
  };

  // Render Status Tag
  const renderStatusTag = (status) => {
    switch (status) {
      case 'completed':
        return <Tag color="green" icon={<CheckCircleOutlined />}>COMPLETED</Tag>;
      case 'dispatched':
        return <Tag color="blue" icon={<SendOutlined />}>DISPATCHED</Tag>;
      case 'partially_sold':
        return <Tag color="geekblue" icon={<ShoppingOutlined />}>PARTIALLY SOLD</Tag>;
      case 'partially_returned':
        return <Tag color="purple" icon={<RollbackOutlined />}>PARTIALLY RETURNED</Tag>;
      case 'approved':
        return <Tag color="cyan" icon={<CheckCircleOutlined />}>APPROVED</Tag>;
      case 'pending':
        return <Tag color="gold" icon={<ClockCircleOutlined />}>PENDING</Tag>;
      case 'draft':
        return <Tag color="default">DRAFT</Tag>;
      case 'cancelled':
        return <Tag color="red" icon={<CloseCircleOutlined />}>CANCELLED</Tag>;
      default:
        return <Tag>{status?.toUpperCase() || 'UNKNOWN'}</Tag>;
    }
  };

  // Columns definition
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (date) => (
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {date ? dayjs(date).format('YYYY-MM-DD') : '-'}
        </span>
      ),
    },
    {
      title: 'Reference No',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 170,
      render: (ref, row) => (
        <Space orientation="vertical" size={2}>
          <span
            onClick={() => handleOpenDetail(row)}
            style={{ fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
          >
            {ref || `CSM-${row.id}`}
          </span>
          {row.destination && (
            <span style={{ fontSize: 11, color: adminTheme.subtext }}>
              Dest: {row.destination}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: 'Customer / Consignee',
      dataIndex: 'customer',
      key: 'customer',
      render: (cust, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{cust || '-'}</div>
          {row.customer_company && row.customer_company !== '-' && (
            <div style={{ fontSize: 11, color: adminTheme.subtext }}>{row.customer_company}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Source Warehouse',
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
      title: 'Dispatched',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      width: 105,
      align: 'right',
      render: (qty) => (
        <span style={{ fontWeight: 700, color: '#2563eb' }}>
          {parseFloat(qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Sold',
      dataIndex: 'total_sale_qty',
      key: 'total_sale_qty',
      width: 90,
      align: 'right',
      render: (qty) => (
        <span style={{ fontWeight: 600, color: '#059669' }}>
          {parseFloat(qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Returned',
      dataIndex: 'total_return_qty',
      key: 'total_return_qty',
      width: 95,
      align: 'right',
      render: (qty) => (
        <span style={{ fontWeight: 600, color: '#7c3aed' }}>
          {parseFloat(qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Remaining',
      dataIndex: 'remaining_qty',
      key: 'remaining_qty',
      width: 105,
      align: 'right',
      render: (qty) => (
        <span style={{ fontWeight: 700, color: parseFloat(qty) > 0 ? '#d97706' : '#64748b' }}>
          {parseFloat(qty || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Grand Total',
      dataIndex: 'grand_total',
      key: 'grand_total',
      width: 120,
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
      width: 130,
      align: 'center',
      render: (st) => renderStatusTag(st),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      align: 'center',
      render: (_, row) => (
        <Space size={2}>
          <Tooltip title="View Consignment Note">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: '#2563eb' }} />}
              onClick={() => handleOpenDetail(row)}
            />
          </Tooltip>
          {parseFloat(row.remaining_qty) > 0 && (
            <>
              <Tooltip title="Record Reported Sales">
                <Button
                  type="text"
                  size="small"
                  icon={<ShoppingOutlined style={{ color: '#059669' }} />}
                  onClick={() => handleOpenSalesModal(row)}
                />
              </Tooltip>
              <Tooltip title="Return Goods to Warehouse">
                <Button
                  type="text"
                  size="small"
                  icon={<RollbackOutlined style={{ color: '#7c3aed' }} />}
                  onClick={() => handleOpenReturnModal(row)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="Edit Consignment">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => navigate(`/admins/products/consignments/edit/${row.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete & Revert Consignment"
            description="Are you sure you want to delete this consignment? Dispatched stock will be safely returned to the warehouse."
            onConfirm={() => handleDelete(row.id)}
            okText="Yes, Revert Stock"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Consignment">
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
      {/* 1. Header Toolbar */}
      {!embedded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShopOutlined style={{ color: '#2563eb' }} />
              Consignments Management
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Dispatch, track consigned inventory at customer stores, record sales, and process returns.
            </Text>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admins/products/consignments/add')}
              style={{ fontWeight: 600, background: '#2563eb' }}
            >
              Add Consignment
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
        <Col xs={24} sm={12} md={4}>
          <Card bordered={false} style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: adminTheme.subtext }}>Total Vouchers</span>}
              value={summary.total_count}
              prefix={<ShopOutlined style={{ color: '#2563eb', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 800, color: adminTheme.text, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Card bordered={false} style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: adminTheme.subtext }}>Dispatched Units</span>}
              value={summary.total_dispatched_qty}
              precision={0}
              prefix={<SendOutlined style={{ color: '#2563eb', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 800, color: '#2563eb', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Card bordered={false} style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: adminTheme.subtext }}>Sold by Consignee</span>}
              value={summary.total_sold_qty}
              precision={0}
              prefix={<CheckCircleOutlined style={{ color: '#059669', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 800, color: '#059669', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Card bordered={false} style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: adminTheme.subtext }}>Returned to Depots</span>}
              value={summary.total_returned_qty}
              precision={0}
              prefix={<RollbackOutlined style={{ color: '#7c3aed', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 800, color: '#7c3aed', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Card bordered={false} style={{ background: adminTheme.surface, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, color: adminTheme.subtext }}>Outstanding Balance</span>}
              value={summary.total_remaining_qty}
              precision={0}
              prefix={<ClockCircleOutlined style={{ color: '#d97706', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 800, color: '#d97706', fontSize: 20 }}
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
              placeholder="Search reference, customer, destination..."
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
              value={filterCustomer}
              onChange={(val) => setFilterCustomer(val)}
              placeholder="Filter Customer / Consignee"
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">All Customers</Option>
              {customers.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.company && c.company !== '-' ? c.company : c.name}
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
              <Option value="dispatched">Dispatched</Option>
              <Option value="partially_sold">Partially Sold</Option>
              <Option value="partially_returned">Partially Returned</Option>
              <Option value="completed">Completed</Option>
              <Option value="pending">Pending</Option>
              <Option value="draft">Draft</Option>
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
                setFilterCustomer('all');
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

      {/* 4. Consignments Table */}
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
          scroll={{ x: 1100 }}
          size="middle"
        />
      </Card>

      {/* 5. Consignment Detail Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileTextOutlined style={{ color: '#2563eb', fontSize: 20 }} />
            <span>Consignment Note - {selectedRecord?.reference_no || `#${selectedRecord?.id}`}</span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={950}
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
              navigate(`/admins/products/consignments/edit/${selectedRecord?.id}`);
            }}
          >
            Edit Consignment
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
            {/* Header info */}
            <div style={{ border: `1px solid ${adminTheme.border}`, borderRadius: 8, padding: 16, background: '#f8fafc' }}>
              <Row gutter={[16, 12]}>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Reference Number:</Text>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#2563eb' }}>
                    {selectedRecord.reference_no}
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Dispatch Date:</Text>
                  <div style={{ fontWeight: 600 }}>
                    {selectedRecord.date ? dayjs(selectedRecord.date).format('YYYY-MM-DD') : '-'}
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Status:</Text>
                  <div>{renderStatusTag(selectedRecord.status)}</div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Customer / Consignee:</Text>
                  <div style={{ fontWeight: 600 }}>
                    {selectedRecord.customer_company || selectedRecord.customer}
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Source Warehouse:</Text>
                  <div style={{ fontWeight: 600 }}>
                    {selectedRecord.warehouse_name} ({selectedRecord.warehouse_code})
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Destination / Store:</Text>
                  <div style={{ fontWeight: 600 }}>{selectedRecord.destination || '-'}</div>
                </Col>
              </Row>
            </div>

            {/* Items Table */}
            <div>
              <Title level={5} style={{ margin: '8px 0 12px 0' }}>Consigned Products & Balance Breakdown</Title>
              <Table
                dataSource={selectedRecord.items || []}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  { title: '#', key: 'idx', width: 45, render: (_, __, i) => i + 1 },
                  {
                    title: 'Product',
                    key: 'prod',
                    render: (_, it) => (
                      <div>
                        <div style={{ fontWeight: 600 }}>{it.product_name}</div>
                        <div style={{ fontSize: 12, color: adminTheme.subtext }}>
                          SKU: {it.product_code} | Unit: {it.product_unit_code}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: 'Dispatched',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 95,
                    align: 'right',
                    render: (q) => <strong>{parseFloat(q).toLocaleString()}</strong>,
                  },
                  {
                    title: 'Sold',
                    dataIndex: 'sale_qty',
                    key: 'sale_qty',
                    width: 85,
                    align: 'right',
                    render: (q) => <span style={{ color: '#059669', fontWeight: 600 }}>{parseFloat(q || 0).toLocaleString()}</span>,
                  },
                  {
                    title: 'Returned',
                    dataIndex: 'return_qty',
                    key: 'return_qty',
                    width: 90,
                    align: 'right',
                    render: (q) => <span style={{ color: '#7c3aed', fontWeight: 600 }}>{parseFloat(q || 0).toLocaleString()}</span>,
                  },
                  {
                    title: 'Balance',
                    dataIndex: 'balance_quantity',
                    key: 'balance_quantity',
                    width: 90,
                    align: 'right',
                    render: (q) => <span style={{ color: '#d97706', fontWeight: 700 }}>{parseFloat(q || 0).toLocaleString()}</span>,
                  },
                  {
                    title: 'Unit Price',
                    dataIndex: 'unit_price',
                    key: 'unit_price',
                    width: 100,
                    align: 'right',
                    render: (p) => formatCurrency(parseFloat(p || 0)),
                  },
                  {
                    title: 'Subtotal',
                    dataIndex: 'subtotal',
                    key: 'subtotal',
                    width: 110,
                    align: 'right',
                    render: (st) => <strong>{formatCurrency(parseFloat(st || 0))}</strong>,
                  },
                ]}
              />
            </div>

            {/* Returns History if any */}
            {selectedRecord.returns && selectedRecord.returns.length > 0 && (
              <div>
                <Title level={5} style={{ margin: '8px 0 12px 0' }}>Processed Returns History</Title>
                <Table
                  dataSource={selectedRecord.returns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Date', dataIndex: 'date', key: 'date', render: (d) => dayjs(d).format('YYYY-MM-DD') },
                    { title: 'Return Ref', dataIndex: 'reference_no', key: 'ref', render: (r) => <Tag color="purple">{r}</Tag> },
                    { title: 'Units Returned', dataIndex: 'total_returned_qty', key: 'qty', align: 'right', render: (q) => <strong>{parseFloat(q).toLocaleString()}</strong> },
                    { title: 'Value', dataIndex: 'grand_total', key: 'total', align: 'right', render: (t) => formatCurrency(Math.abs(parseFloat(t || 0))) },
                    { title: 'Notes', dataIndex: 'note', key: 'note' },
                  ]}
                />
              </div>
            )}

            {selectedRecord.note && (
              <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: 6 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Notes / Terms:</Text>
                <div>{selectedRecord.note}</div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* 6. Return Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RollbackOutlined style={{ color: '#7c3aed', fontSize: 18 }} />
            <span>Process Consignment Return - {selectedRecord?.reference_no}</span>
          </div>
        }
        open={isReturnModalOpen}
        onCancel={() => setIsReturnModalOpen(false)}
        onOk={handleSubmitReturn}
        confirmLoading={returnSubmitting}
        okText="Confirm & Return to Warehouse"
        okButtonProps={{ style: { background: '#7c3aed' } }}
        width={750}
      >
        <Paragraph type="secondary" style={{ fontSize: 13 }}>
          Specify quantities of unsold consignment items being returned into <strong>{selectedRecord?.warehouse_name}</strong>. Stock will be restored automatically.
        </Paragraph>
        <Form form={returnForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Return Date" name="date" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Return Notes / Reason" name="note">
                <Input placeholder="Reason for return..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Table
          dataSource={returnItems}
          rowKey="consignment_item_id"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Product',
              key: 'prod',
              render: (_, it) => (
                <div>
                  <strong>{it.product_name}</strong>
                  <div style={{ fontSize: 11, color: adminTheme.subtext }}>SKU: {it.product_code}</div>
                </div>
              ),
            },
            {
              title: 'Max Returnable',
              dataIndex: 'max_returnable',
              key: 'max',
              width: 120,
              align: 'right',
              render: (q) => <Tag color="orange">{q}</Tag>,
            },
            {
              title: 'Returning Qty',
              key: 'retQty',
              width: 140,
              render: (_, it, idx) => (
                <InputNumber
                  min={0}
                  max={it.max_returnable}
                  value={it.return_quantity}
                  onChange={(val) => {
                    const updated = [...returnItems];
                    updated[idx].return_quantity = val || 0;
                    setReturnItems(updated);
                  }}
                  style={{ width: '100%', borderColor: '#7c3aed' }}
                />
              ),
            },
          ]}
        />
      </Modal>

      {/* 7. Sales Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingOutlined style={{ color: '#059669', fontSize: 18 }} />
            <span>Record Consignee Reported Sales - {selectedRecord?.reference_no}</span>
          </div>
        }
        open={isSalesModalOpen}
        onCancel={() => setIsSalesModalOpen(false)}
        onOk={handleSubmitSales}
        confirmLoading={salesSubmitting}
        okText="Record Sales"
        okButtonProps={{ style: { background: '#059669' } }}
        width={750}
      >
        <Paragraph type="secondary" style={{ fontSize: 13 }}>
          Record the quantities sold by consignee <strong>{selectedRecord?.customer}</strong>. This updates the consignment balance and reconciliation status.
        </Paragraph>
        <Table
          dataSource={salesItems}
          rowKey="consignment_item_id"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Product',
              key: 'prod',
              render: (_, it) => (
                <div>
                  <strong>{it.product_name}</strong>
                  <div style={{ fontSize: 11, color: adminTheme.subtext }}>SKU: {it.product_code}</div>
                </div>
              ),
            },
            {
              title: 'Unsold Balance',
              dataIndex: 'max_salable',
              key: 'max',
              width: 120,
              align: 'right',
              render: (q) => <Tag color="blue">{q}</Tag>,
            },
            {
              title: 'Sold Quantity',
              key: 'saleQty',
              width: 140,
              render: (_, it, idx) => (
                <InputNumber
                  min={0}
                  max={it.max_salable}
                  value={it.sale_quantity}
                  onChange={(val) => {
                    const updated = [...salesItems];
                    updated[idx].sale_quantity = val || 0;
                    setSalesItems(updated);
                  }}
                  style={{ width: '100%', borderColor: '#059669' }}
                />
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
