import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Tooltip,
  Modal,
  Form,
  Row,
  Col,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Drawer,
  Descriptions,
  Badge,
  Divider,
  Progress
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  BarcodeOutlined,
  UserSwitchOutlined,
  SwapOutlined,
  ToolOutlined,
  StopOutlined,
  CheckCircleOutlined,
  QrcodeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Text, Title } = Typography;
const { Option } = Select;

const AssetRegisterPage = ({ onAddNewAsset }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [categories, setCategories] = useState([]);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');

  // Modals & Drawers state
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [activeAsset, setActiveAsset] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm] = Form.useForm();

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm] = Form.useForm();

  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [maintenanceForm] = Form.useForm();

  const [disposalModalOpen, setDisposalModalOpen] = useState(false);
  const [disposalForm] = Form.useForm();

  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeAsset, setBarcodeAsset] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/admin/assets/categories');
      if (res.data?.status) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch assets list
  const fetchAssets = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: searchText || undefined,
        category_id: selectedCategory || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        condition: selectedCondition !== 'all' ? selectedCondition : undefined
      };
      const res = await axios.get('/api/admin/assets', { params });
      if (res.data?.status) {
        setAssets(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      message.error(t('failed_fetch_assets', 'Failed to load asset records.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAssets(1, pagination.limit);
  }, [selectedCategory, selectedStatus, selectedCondition]);

  const handleSearch = () => {
    fetchAssets(1, pagination.limit);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedCategory(null);
    setSelectedStatus('all');
    setSelectedCondition('all');
    fetchAssets(1, pagination.limit);
  };

  // View Details Drawer
  const openDetailDrawer = async (assetRecord) => {
    setActiveAsset(assetRecord);
    setDetailDrawerOpen(true);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`/api/admin/assets/${assetRecord.id}`);
      if (res.data?.status && res.data.data) {
        setActiveAsset(res.data.data);
      }
    } catch (err) {
      console.error('Error loading full asset detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Edit Asset
  const openEditModal = (asset) => {
    setActiveAsset(asset);
    editForm.setFieldsValue({
      name: asset.name,
      asset_code: asset.asset_code,
      category_id: asset.category_id,
      brand: asset.brand,
      model: asset.model,
      serial_number: asset.serial_number,
      barcode: asset.barcode,
      purchase_date: asset.purchase_date ? dayjs(asset.purchase_date) : null,
      purchase_cost: asset.purchase_cost,
      residual_value: asset.residual_value,
      useful_life_months: asset.useful_life_months,
      location_name: asset.location_name,
      department_name: asset.department_name,
      condition: asset.condition,
      status: asset.status,
      warranty_start: asset.warranty_start ? dayjs(asset.warranty_start) : null,
      warranty_end: asset.warranty_end ? dayjs(asset.warranty_end) : null,
      note: asset.note
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      const payload = {
        ...values,
        purchase_date: values.purchase_date ? values.purchase_date.format('YYYY-MM-DD') : null,
        warranty_start: values.warranty_start ? values.warranty_start.format('YYYY-MM-DD') : null,
        warranty_end: values.warranty_end ? values.warranty_end.format('YYYY-MM-DD') : null
      };
      const res = await axios.put(`/api/admin/assets/${activeAsset.id}`, payload);
      if (res.data?.status) {
        message.success(t('asset_updated_success', 'Asset updated successfully!'));
        setEditModalOpen(false);
        fetchAssets(pagination.page, pagination.limit);
      }
    } catch (err) {
      console.error('Save edit error:', err);
      message.error(err.response?.data?.message || err.message);
    }
  };

  // Delete Asset
  const handleDeleteAsset = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/assets/${id}`);
      if (res.data?.status) {
        message.success(res.data.message || t('asset_deleted', 'Asset removed or archived.'));
        fetchAssets(pagination.page, pagination.limit);
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message);
    }
  };

  // Assign Modal
  const openAssignModal = (asset) => {
    setActiveAsset(asset);
    assignForm.resetFields();
    assignForm.setFieldsValue({
      asset_id: asset.id,
      assigned_date: dayjs(),
      condition_out: asset.condition || 'good'
    });
    setAssignModalOpen(true);
  };

  const handleSaveAssign = async () => {
    try {
      const values = await assignForm.validateFields();
      const payload = {
        ...values,
        assigned_date: values.assigned_date.format('YYYY-MM-DD'),
        expected_return_date: values.expected_return_date ? values.expected_return_date.format('YYYY-MM-DD') : null
      };
      const res = await axios.post('/api/admin/assets/assignments', payload);
      if (res.data?.status) {
        message.success(t('asset_assigned_success', 'Asset checked out successfully!'));
        setAssignModalOpen(false);
        fetchAssets(pagination.page, pagination.limit);
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message);
    }
  };

  // Transfer Modal
  const openTransferModal = (asset) => {
    setActiveAsset(asset);
    transferForm.resetFields();
    transferForm.setFieldsValue({
      asset_id: asset.id,
      transfer_date: dayjs(),
      from_location: asset.location_name,
      from_department: asset.department_name
    });
    setTransferModalOpen(true);
  };

  const handleSaveTransfer = async () => {
    try {
      const values = await transferForm.validateFields();
      const payload = {
        ...values,
        transfer_date: values.transfer_date.format('YYYY-MM-DD')
      };
      const res = await axios.post('/api/admin/assets/transfers', payload);
      if (res.data?.status) {
        message.success(t('transfer_logged_success', 'Asset transfer logged successfully!'));
        setTransferModalOpen(false);
        fetchAssets(pagination.page, pagination.limit);
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message);
    }
  };

  // Maintenance Modal
  const openMaintenanceModal = (asset) => {
    setActiveAsset(asset);
    maintenanceForm.resetFields();
    maintenanceForm.setFieldsValue({
      asset_id: asset.id,
      maintenance_type: 'preventive',
      priority: 'medium',
      scheduled_date: dayjs(),
      set_asset_in_maintenance: true
    });
    setMaintenanceModalOpen(true);
  };

  const handleSaveMaintenance = async () => {
    try {
      const values = await maintenanceForm.validateFields();
      const payload = {
        ...values,
        scheduled_date: values.scheduled_date.format('YYYY-MM-DD')
      };
      const res = await axios.post('/api/admin/assets/maintenances', payload);
      if (res.data?.status) {
        message.success(t('maintenance_scheduled_success', 'Maintenance work order created!'));
        setMaintenanceModalOpen(false);
        fetchAssets(pagination.page, pagination.limit);
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message);
    }
  };

  // Disposal Modal
  const openDisposalModal = (asset) => {
    setActiveAsset(asset);
    disposalForm.resetFields();
    disposalForm.setFieldsValue({
      asset_id: asset.id,
      disposal_date: dayjs(),
      disposal_method: 'sale',
      sale_amount: 0
    });
    setDisposalModalOpen(true);
  };

  const handleSaveDisposal = async () => {
    try {
      const values = await disposalForm.validateFields();
      const payload = {
        ...values,
        disposal_date: values.disposal_date.format('YYYY-MM-DD')
      };
      const res = await axios.post('/api/admin/assets/disposals', payload);
      if (res.data?.status) {
        message.success(t('asset_disposed_success', 'Asset retired / disposed successfully!'));
        setDisposalModalOpen(false);
        fetchAssets(pagination.page, pagination.limit);
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message);
    }
  };

  // Barcode / QR Modal
  const openBarcodeModal = (asset) => {
    setBarcodeAsset(asset);
    setBarcodeModalOpen(true);
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const map = {
      available: { color: 'success', text: 'Available' },
      assigned: { color: 'blue', text: 'Assigned' },
      maintenance: { color: 'orange', text: 'Maintenance' },
      disposed: { color: 'default', text: 'Disposed / Retired' }
    };
    const c = map[status] || { color: 'default', text: status };
    return <Tag color={c.color}>{c.text}</Tag>;
  };

  // Condition Badge Helper
  const renderConditionBadge = (cond) => {
    const map = {
      new: { color: 'green', text: 'Brand New' },
      excellent: { color: 'cyan', text: 'Excellent' },
      good: { color: 'blue', text: 'Good' },
      fair: { color: 'gold', text: 'Fair' },
      poor: { color: 'warning', text: 'Poor' },
      damaged: { color: 'error', text: 'Damaged' }
    };
    const c = map[cond] || { color: 'default', text: cond };
    return <Tag color={c.color}>{c.text}</Tag>;
  };

  const columns = [
    {
      title: t('asset_code', 'Asset Code'),
      dataIndex: 'asset_code',
      key: 'asset_code',
      width: 150,
      render: (code, record) => (
        <a onClick={() => openDetailDrawer(record)} style={{ fontWeight: 600, color: '#2563eb' }}>
          {code}
        </a>
      )
    },
    {
      title: t('asset_name', 'Asset Name & Model'),
      key: 'name',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{r.name}</Text>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {[r.brand, r.model].filter(Boolean).join(' • ') || 'No brand/model'}
          </div>
        </div>
      )
    },
    {
      title: t('category', 'Category'),
      dataIndex: 'category_name',
      key: 'category_name',
      render: (cat) => <Tag color="geekblue">{cat || 'General'}</Tag>
    },
    {
      title: t('serial_barcode', 'Serial / Barcode'),
      key: 'serial',
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          {r.serial_number && <div><strong>SN:</strong> {r.serial_number}</div>}
          {r.barcode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <strong>BC:</strong> {r.barcode}
              <Tooltip title={t('view_barcode', 'View Barcode')}>
                <BarcodeOutlined style={{ color: '#2563eb', cursor: 'pointer' }} onClick={() => openBarcodeModal(r)} />
              </Tooltip>
            </div>
          )}
          {!r.serial_number && !r.barcode && <span style={{ color: '#94a3b8' }}>&mdash;</span>}
        </div>
      )
    },
    {
      title: t('cost_valuation', 'Cost & Book Value'),
      key: 'valuation',
      align: 'right',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#16a34a' }}>
            ${(parseFloat(r.current_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Cost: ${(parseFloat(r.purchase_cost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      )
    },
    {
      title: t('location_dept', 'Location & Custody'),
      key: 'custody',
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          <div><strong>Loc:</strong> {r.location_name || 'Central Store'}</div>
          {r.assigned_to ? (
            <div style={{ color: '#2563eb' }}><strong>User:</strong> {r.assigned_to}</div>
          ) : (
            <Tag color="green" style={{ fontSize: 11, padding: '0 4px', margin: '2px 0 0 0' }}>Unassigned</Tag>
          )}
        </div>
      )
    },
    {
      title: t('condition', 'Condition'),
      dataIndex: 'condition',
      key: 'condition',
      align: 'center',
      render: (cond) => renderConditionBadge(cond)
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => renderStatusBadge(status)
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      align: 'center',
      width: 140,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title={t('view_details', 'View Asset Details')}>
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetailDrawer(r)} />
          </Tooltip>
          <Tooltip title={t('edit_asset', 'Edit Asset')}>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)} />
          </Tooltip>
          {r.status === 'available' && (
            <Tooltip title={t('assign_asset', 'Check Out / Assign')}>
              <Button size="small" icon={<UserSwitchOutlined />} style={{ color: '#2563eb' }} onClick={() => openAssignModal(r)} />
            </Tooltip>
          )}
          {r.status !== 'disposed' && (
            <>
              <Tooltip title={t('transfer_asset', 'Transfer Location')}>
                <Button size="small" icon={<SwapOutlined />} onClick={() => openTransferModal(r)} />
              </Tooltip>
              <Tooltip title={t('maintenance', 'Schedule Maintenance')}>
                <Button size="small" icon={<ToolOutlined />} onClick={() => openMaintenanceModal(r)} />
              </Tooltip>
              <Tooltip title={t('retire_dispose', 'Dispose / Retire')}>
                <Button size="small" icon={<StopOutlined />} style={{ color: '#ea580c' }} onClick={() => openDisposalModal(r)} />
              </Tooltip>
            </>
          )}
          <Popconfirm
            title={t('confirm_delete', 'Are you sure you want to delete or archive this asset?')}
            onConfirm={() => handleDeleteAsset(r.id)}
            okText={t('yes', 'Yes')}
            cancelText={t('no', 'No')}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 8 }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('fixed_assets_register', 'Fixed Capital Asset Register')}
          </Title>
          <Text type="secondary">
            {t('fixed_assets_desc', 'Track equipment identity, depreciation metrics, custodian assignments, and lifecycle movements.')}
          </Text>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => onAddNewAsset ? onAddNewAsset() : null}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
          >
            {t('add_asset', 'Register New Asset')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchAssets(pagination.page, pagination.limit)}>
            {t('refresh', 'Refresh')}
          </Button>
        </Space>
      </div>

      {/* 2. Filter Bar */}
      <Card size="small" style={{ marginBottom: 16, background: '#f8fafc', borderColor: '#e2e8f0' }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder={t('search_asset_placeholder', 'Search code, name, serial, barcode, user...')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder={t('category', 'Category')}
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              allowClear
            >
              {categories.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
            >
              <Option value="all">{t('all_statuses', 'All Statuses')}</Option>
              <Option value="available">{t('available', 'Available')}</Option>
              <Option value="assigned">{t('assigned', 'Assigned')}</Option>
              <Option value="maintenance">{t('maintenance', 'Maintenance')}</Option>
              <Option value="disposed">{t('disposed', 'Disposed / Retired')}</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={selectedCondition}
              onChange={(val) => setSelectedCondition(val)}
            >
              <Option value="all">{t('all_conditions', 'All Conditions')}</Option>
              <Option value="new">{t('new', 'Brand New')}</Option>
              <Option value="excellent">{t('excellent', 'Excellent')}</Option>
              <Option value="good">{t('good', 'Good')}</Option>
              <Option value="fair">{t('fair', 'Fair')}</Option>
              <Option value="poor">{t('poor', 'Poor')}</Option>
              <Option value="damaged">{t('damaged', 'Damaged')}</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Space>
              <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
                {t('filter', 'Filter')}
              </Button>
              <Button onClick={handleResetFilters}>
                {t('reset', 'Reset')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 3. Assets Table */}
      <Table
        dataSource={assets}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['15', '30', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} assets`,
          onChange: (page, limit) => fetchAssets(page, limit)
        }}
      />

      {/* 4. Asset Detail Drawer */}
      <Drawer
        title={
          <Space>
            <EyeOutlined style={{ color: '#2563eb' }} />
            <span>{activeAsset?.name || 'Asset Details'} ({activeAsset?.asset_code})</span>
          </Space>
        }
        placement="right"
        width={680}
        onClose={() => setDetailDrawerOpen(false)}
        open={detailDrawerOpen}
      >
        {activeAsset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Status & Valuation Header */}
            <Card size="small" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">{t('current_book_value', 'Net Book Value')}</Text>
                  <Title level={3} style={{ margin: '4px 0 0 0', color: '#16a34a' }}>
                    ${(parseFloat(activeAsset.current_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Title>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <div>{renderStatusBadge(activeAsset.status)}</div>
                  <div style={{ marginTop: 6 }}>{renderConditionBadge(activeAsset.condition)}</div>
                </Col>
              </Row>
            </Card>

            {/* Asset Identity Specifications */}
            <Descriptions title={t('specifications', 'Equipment Specifications')} bordered size="small" column={2}>
              <Descriptions.Item label={t('asset_code', 'Asset Code')}>{activeAsset.asset_code}</Descriptions.Item>
              <Descriptions.Item label={t('category', 'Category')}>{activeAsset.category_name || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('brand', 'Brand')}>{activeAsset.brand || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('model', 'Model')}>{activeAsset.model || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('serial_number', 'Serial Number')}>{activeAsset.serial_number || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('barcode', 'Barcode')}>{activeAsset.barcode || '-'}</Descriptions.Item>
            </Descriptions>

            {/* Financial & Depreciation */}
            <Descriptions title={t('financials_depreciation', 'Financials & Straight-Line Amortization')} bordered size="small" column={2}>
              <Descriptions.Item label={t('purchase_date', 'Purchase Date')}>
                {activeAsset.purchase_date ? new Date(activeAsset.purchase_date).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('purchase_cost', 'Acquisition Cost')}>
                ${(parseFloat(activeAsset.purchase_cost) || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label={t('residual_value', 'Salvage / Residual')}>
                ${(parseFloat(activeAsset.residual_value) || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label={t('useful_life', 'Useful Life')}>
                {activeAsset.useful_life_months} months
              </Descriptions.Item>
              <Descriptions.Item label={t('accumulated_depr', 'Accumulated Depr')}>
                ${(parseFloat(activeAsset.accumulated_depreciation) || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label={t('depreciation_method', 'Method')}>
                {activeAsset.depreciation_method || 'Straight Line'}
              </Descriptions.Item>
            </Descriptions>

            {/* Custody & Location */}
            <Descriptions title={t('custody_location', 'Custody & Assignment')} bordered size="small" column={2}>
              <Descriptions.Item label={t('location', 'Location')}>{activeAsset.location_name || 'Central Facility'}</Descriptions.Item>
              <Descriptions.Item label={t('department', 'Department')}>{activeAsset.department_name || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('assigned_to', 'Current Custodian')}>{activeAsset.assigned_to || 'None'}</Descriptions.Item>
              <Descriptions.Item label={t('assigned_date', 'Assignment Date')}>
                {activeAsset.assigned_date ? new Date(activeAsset.assigned_date).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('warranty_period', 'Warranty')}>
                {activeAsset.warranty_end ? `Expires ${new Date(activeAsset.warranty_end).toLocaleDateString()}` : 'No warranty recorded'}
              </Descriptions.Item>
              <Descriptions.Item label={t('note', 'Notes')}>{activeAsset.note || '-'}</Descriptions.Item>
            </Descriptions>

            {/* Related History Tables */}
            {activeAsset.assignments && activeAsset.assignments.length > 0 && (
              <div>
                <Title level={5}>{t('assignment_history', 'Assignment History')}</Title>
                <Table
                  dataSource={activeAsset.assignments}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'Employee', dataIndex: 'employee_name', key: 'employee_name' },
                    { title: 'Dept', dataIndex: 'department_name', key: 'department_name' },
                    { title: 'Assigned', dataIndex: 'assigned_date', key: 'assigned_date', render: d => d ? new Date(d).toLocaleDateString() : '-' },
                    { title: 'Returned', dataIndex: 'returned_date', key: 'returned_date', render: d => d ? new Date(d).toLocaleDateString() : <Tag color="blue">Active</Tag> }
                  ]}
                />
              </div>
            )}

            {activeAsset.maintenances && activeAsset.maintenances.length > 0 && (
              <div>
                <Title level={5}>{t('maintenance_history', 'Maintenance History')}</Title>
                <Table
                  dataSource={activeAsset.maintenances}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'Ref', dataIndex: 'reference_no', key: 'reference_no' },
                    { title: 'Title', dataIndex: 'title', key: 'title' },
                    { title: 'Technician', dataIndex: 'technician', key: 'technician' },
                    { title: 'Cost', dataIndex: 'cost', key: 'cost', render: c => `$${parseFloat(c || 0).toFixed(2)}` },
                    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag>{s}</Tag> }
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 5. Edit Asset Modal */}
      <Modal
        title={t('edit_asset', 'Edit Capital Asset')}
        open={editModalOpen}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalOpen(false)}
        width={720}
        okText={t('save_changes', 'Save Changes')}
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label={t('asset_name', 'Asset Name')} rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="asset_code" label={t('asset_code', 'Asset Code')} rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="category_id" label={t('category', 'Category')}>
                <Select allowClear>
                  {categories.map((c) => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="brand" label={t('brand', 'Brand')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="model" label={t('model', 'Model')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="serial_number" label={t('serial_number', 'Serial Number')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="barcode" label={t('barcode', 'Barcode')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="purchase_date" label={t('purchase_date', 'Purchase Date')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="purchase_cost" label={t('purchase_cost', 'Purchase Cost ($)')}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="residual_value" label={t('residual_value', 'Salvage Value ($)')}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="useful_life_months" label={t('useful_life_months', 'Useful Life (Months)')}>
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="location_name" label={t('location', 'Location / Facility')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="department_name" label={t('department', 'Department')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="condition" label={t('condition', 'Condition')}>
                <Select>
                  <Option value="new">Brand New</Option>
                  <Option value="excellent">Excellent</Option>
                  <Option value="good">Good</Option>
                  <Option value="fair">Fair</Option>
                  <Option value="poor">Poor</Option>
                  <Option value="damaged">Damaged</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label={t('status', 'Status')}>
                <Select>
                  <Option value="available">Available</Option>
                  <Option value="assigned">Assigned</Option>
                  <Option value="maintenance">Maintenance</Option>
                  <Option value="disposed">Disposed / Retired</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="warranty_start" label={t('warranty_start', 'Warranty Start')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warranty_end" label={t('warranty_end', 'Warranty Expiration')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label={t('note', 'Notes / Asset Description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 6. Assign Asset Modal */}
      <Modal
        title={t('check_out_asset', `Check Out / Assign Asset: ${activeAsset?.name} (${activeAsset?.asset_code})`)}
        open={assignModalOpen}
        onOk={handleSaveAssign}
        onCancel={() => setAssignModalOpen(false)}
        okText={t('assign', 'Confirm Assignment')}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item name="asset_id" hidden><Input /></Form.Item>
          <Form.Item name="employee_name" label={t('employee_name', 'Employee / Custodian Name')} rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. John Smith (Lead Architect)" />
          </Form.Item>
          <Form.Item name="department_name" label={t('department', 'Department')}>
            <Input placeholder="e.g. IT / Engineering" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assigned_date" label={t('assigned_date', 'Assignment Date')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expected_return_date" label={t('expected_return', 'Expected Return (Optional)')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="condition_out" label={t('condition_out', 'Condition at Check-out')}>
            <Select>
              <Option value="new">Brand New</Option>
              <Option value="excellent">Excellent</Option>
              <Option value="good">Good</Option>
              <Option value="fair">Fair</Option>
            </Select>
          </Form.Item>
          <Form.Item name="note" label={t('note', 'Check-out Handover Notes')}>
            <Input.TextArea rows={2} placeholder="Accessories included, charger, serial tags verified..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 7. Transfer Location Modal */}
      <Modal
        title={t('transfer_asset_location', `Transfer Asset: ${activeAsset?.asset_code}`)}
        open={transferModalOpen}
        onOk={handleSaveTransfer}
        onCancel={() => setTransferModalOpen(false)}
        okText={t('execute_transfer', 'Log Transfer')}
      >
        <Form form={transferForm} layout="vertical">
          <Form.Item name="asset_id" hidden><Input /></Form.Item>
          <Form.Item name="transfer_date" label={t('transfer_date', 'Transfer Date')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_location" label={t('from_location', 'From Location')}>
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_location" label={t('to_location', 'To Destination Location')} rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. Branch 2 - Tech Room" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_department" label={t('from_dept', 'From Department')}>
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_department" label={t('to_dept', 'To Department')}>
                <Input placeholder="e.g. Warehouse Operations" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label={t('transfer_reason', 'Transfer Reason')}>
            <Input.TextArea rows={2} placeholder="Office relocation, reallocation of equipment..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 8. Maintenance Work Order Modal */}
      <Modal
        title={t('schedule_maintenance', `Schedule Maintenance: ${activeAsset?.asset_code}`)}
        open={maintenanceModalOpen}
        onOk={handleSaveMaintenance}
        onCancel={() => setMaintenanceModalOpen(false)}
        okText={t('create_work_order', 'Create Work Order')}
      >
        <Form form={maintenanceForm} layout="vertical">
          <Form.Item name="asset_id" hidden><Input /></Form.Item>
          <Form.Item name="title" label={t('service_title', 'Service / Maintenance Title')} rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. Annual Boiler Descaling & Valve Replacement" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="maintenance_type" label={t('type', 'Maintenance Type')}>
                <Select>
                  <Option value="preventive">Preventive</Option>
                  <Option value="corrective">Corrective</Option>
                  <Option value="calibration">Calibration</Option>
                  <Option value="inspection">Inspection</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label={t('priority', 'Priority')}>
                <Select>
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="scheduled_date" label={t('scheduled_date', 'Scheduled Date')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cost" label={t('est_cost', 'Estimated Cost ($)')}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="technician" label={t('technician', 'Assigned Technician / Vendor')}>
            <Input placeholder="e.g. In-house Tech or External Vendor" />
          </Form.Item>
          <Form.Item name="description" label={t('description', 'Service Instructions')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 9. Disposal Modal */}
      <Modal
        title={t('dispose_retire_asset', `Retire / Dispose Asset: ${activeAsset?.asset_code}`)}
        open={disposalModalOpen}
        onOk={handleSaveDisposal}
        onCancel={() => setDisposalModalOpen(false)}
        okText={t('confirm_disposal', 'Confirm Retirement')}
        okButtonProps={{ danger: true }}
      >
        <Form form={disposalForm} layout="vertical">
          <Form.Item name="asset_id" hidden><Input /></Form.Item>
          <Card size="small" style={{ marginBottom: 16, background: '#fff7ed', borderColor: '#fed7aa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">{t('book_value_at_disposal', 'Current Net Book Value:')}</Text>
              <Text strong>${(parseFloat(activeAsset?.current_value) || 0).toFixed(2)}</Text>
            </div>
          </Card>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="disposal_method" label={t('disposal_method', 'Disposal Method')} rules={[{ required: true }]}>
                <Select>
                  <Option value="sale">Sale / Auction</Option>
                  <Option value="scrap">Scrap / Recycled</Option>
                  <Option value="damaged">Write-off (Damaged)</Option>
                  <Option value="donate">Donation</Option>
                  <Option value="trade_in">Trade-in</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sale_amount" label={t('sale_proceeds', 'Sale Proceeds ($)')}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="disposal_date" label={t('disposal_date', 'Disposal Date')} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="buyer_name" label={t('buyer_name', 'Buyer / Recipient')}>
                <Input placeholder="Buyer name or scrap yard..." />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label={t('reason', 'Disposal Reason & Authorization')}>
            <Input.TextArea rows={2} placeholder="End of economic useful life, irreparable damage..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 10. Barcode Modal */}
      <Modal
        title={t('asset_barcode_tag', 'Asset Identification Tag')}
        open={barcodeModalOpen}
        onCancel={() => setBarcodeModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setBarcodeModalOpen(false)}>
            {t('close', 'Close')}
          </Button>,
          <Button key="print" type="primary" onClick={() => window.print()}>
            {t('print_tag', 'Print Tag')}
          </Button>
        ]}
      >
        {barcodeAsset && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ border: '2px dashed #94a3b8', padding: 24, borderRadius: 8, display: 'inline-block', background: '#f8fafc' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{barcodeAsset.name}</div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                {[barcodeAsset.brand, barcodeAsset.model].filter(Boolean).join(' • ')}
              </div>
              <div style={{ fontSize: 28, letterSpacing: 4, fontFamily: 'monospace', fontWeight: 800, margin: '16px 0', color: '#1e293b' }}>
                {barcodeAsset.barcode || barcodeAsset.asset_code}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Code: <strong>{barcodeAsset.asset_code}</strong> | SN: <strong>{barcodeAsset.serial_number || 'N/A'}</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default AssetRegisterPage;
