import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Select,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Row,
  Col,
  message,
  Tooltip
} from 'antd';
import {
  ToolOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const AssetMaintenancePage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [maintenances, setMaintenances] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Modals
  const [assets, setAssets] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [activeMaintenance, setActiveMaintenance] = useState(null);
  const [updateForm] = Form.useForm();

  const fetchMaintenances = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        priority: selectedPriority !== 'all' ? selectedPriority : undefined,
        maintenance_type: selectedType !== 'all' ? selectedType : undefined
      };
      const res = await axios.get('/api/admin/assets/maintenances', { params });
      if (res.data?.status) {
        setMaintenances(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching maintenance records:', err);
      message.error(t('failed_fetch_maintenance', 'Failed to load maintenance records.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await axios.get('/api/admin/assets', { params: { limit: 200 } });
      if (res.data?.status) {
        setAssets(res.data.data?.filter(a => a.status !== 'disposed') || []);
      }
    } catch (err) {
      console.error('Error fetching assets for maintenance:', err);
    }
  };

  useEffect(() => {
    fetchMaintenances(1, pagination.limit);
  }, [selectedStatus, selectedPriority, selectedType]);

  const openCreateModal = () => {
    fetchAssets();
    createForm.resetFields();
    createForm.setFieldsValue({
      maintenance_type: 'preventive',
      priority: 'medium',
      scheduled_date: dayjs(),
      cost: 0,
      set_asset_in_maintenance: false
    });
    setCreateModalOpen(true);
  };

  const handleSaveCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = {
        ...values,
        scheduled_date: values.scheduled_date.format('YYYY-MM-DD')
      };
      const res = await axios.post('/api/admin/assets/maintenances', payload);
      if (res.data?.status) {
        message.success(t('maintenance_created', 'Maintenance work order created!'));
        setCreateModalOpen(false);
        fetchMaintenances(1, pagination.limit);
      }
    } catch (err) {
      console.error('Save maintenance error:', err);
      message.error(err.response?.data?.message || err.message);
    }
  };

  const openUpdateModal = (record) => {
    setActiveMaintenance(record);
    updateForm.resetFields();
    updateForm.setFieldsValue({
      status: record.status,
      completed_date: record.completed_date ? dayjs(record.completed_date) : dayjs(),
      cost: record.cost,
      parts_replaced: record.parts_replaced,
      technician: record.technician,
      description: record.description
    });
    setUpdateModalOpen(true);
  };

  const handleSaveUpdate = async () => {
    try {
      const values = await updateForm.validateFields();
      const payload = {
        ...values,
        completed_date: values.status === 'completed' && values.completed_date ? values.completed_date.format('YYYY-MM-DD') : null
      };
      const res = await axios.put(`/api/admin/assets/maintenances/${activeMaintenance.id}`, payload);
      if (res.data?.status) {
        message.success(t('maintenance_updated', 'Maintenance work order updated!'));
        setUpdateModalOpen(false);
        fetchMaintenances(pagination.page, pagination.limit);
      }
    } catch (err) {
      console.error('Update maintenance error:', err);
      message.error(err.response?.data?.message || err.message);
    }
  };

  const renderPriority = (p) => {
    const map = { urgent: 'error', high: 'warning', medium: 'processing', low: 'default' };
    return <Tag color={map[p] || 'default'}>{p?.toUpperCase()}</Tag>;
  };

  const renderStatus = (st) => {
    const map = {
      pending: <Tag color="warning" icon={<ClockCircleOutlined />}>Scheduled</Tag>,
      in_progress: <Tag color="processing" icon={<ToolOutlined />}>In Progress</Tag>,
      completed: <Tag color="success" icon={<CheckCircleOutlined />}>Completed</Tag>,
      cancelled: <Tag color="default">Cancelled</Tag>
    };
    return map[st] || <Tag>{st}</Tag>;
  };

  const columns = [
    {
      title: t('reference_no', 'Work Order #'),
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 140,
      render: (ref) => <Tag color="blue" style={{ fontWeight: 600 }}>{ref}</Tag>
    },
    {
      title: t('asset', 'Target Equipment'),
      key: 'asset',
      render: (_, r) => (
        <div>
          <Text strong style={{ color: '#2563eb' }}>{r.asset_code}</Text>
          <div>{r.asset_name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Loc: {r.location_name || 'Central'}</div>
        </div>
      )
    },
    {
      title: t('maintenance_title', 'Service Title & Type'),
      key: 'title',
      render: (_, r) => (
        <div>
          <Text strong>{r.title}</Text>
          <div>
            <Tag color="purple">{r.maintenance_type?.toUpperCase()}</Tag>
            {renderPriority(r.priority)}
          </div>
        </div>
      )
    },
    {
      title: t('technician_vendor', 'Technician / Vendor'),
      dataIndex: 'technician',
      key: 'technician',
      render: (tech) => tech || <span style={{ color: '#94a3b8' }}>Unassigned</span>
    },
    {
      title: t('scheduled_date', 'Schedule / Completion'),
      key: 'dates',
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          <div>Sched: {r.scheduled_date ? new Date(r.scheduled_date).toLocaleDateString() : '-'}</div>
          {r.completed_date && (
            <div style={{ color: '#16a34a' }}>Done: {new Date(r.completed_date).toLocaleDateString()}</div>
          )}
        </div>
      )
    },
    {
      title: t('service_cost', 'Cost ($)'),
      dataIndex: 'cost',
      key: 'cost',
      align: 'right',
      render: (c) => (
        <span style={{ fontWeight: 600 }}>
          ${(parseFloat(c) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (st) => renderStatus(st)
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      align: 'center',
      render: (_, r) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => openUpdateModal(r)}
        >
          {t('update', 'Update')}
        </Button>
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('preventive_corrective_maintenance', 'Equipment Maintenance & Servicing Work Orders')}
          </Title>
          <Text type="secondary">
            {t('maintenance_desc', 'Track routine calibrations, emergency repair work orders, parts replacement, and technician service costs.')}
          </Text>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
          >
            {t('schedule_work_order', 'Schedule Work Order')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchMaintenances(pagination.page, pagination.limit)}>
            {t('refresh', 'Refresh')}
          </Button>
        </Space>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Select
          style={{ width: 160 }}
          value={selectedStatus}
          onChange={(val) => setSelectedStatus(val)}
        >
          <Option value="all">{t('all_statuses', 'All Statuses')}</Option>
          <Option value="pending">{t('pending', 'Scheduled')}</Option>
          <Option value="in_progress">{t('in_progress', 'In Progress')}</Option>
          <Option value="completed">{t('completed', 'Completed')}</Option>
          <Option value="cancelled">{t('cancelled', 'Cancelled')}</Option>
        </Select>

        <Select
          style={{ width: 160 }}
          value={selectedPriority}
          onChange={(val) => setSelectedPriority(val)}
        >
          <Option value="all">{t('all_priorities', 'All Priorities')}</Option>
          <Option value="low">{t('low', 'Low')}</Option>
          <Option value="medium">{t('medium', 'Medium')}</Option>
          <Option value="high">{t('high', 'High')}</Option>
          <Option value="urgent">{t('urgent', 'Urgent')}</Option>
        </Select>

        <Select
          style={{ width: 160 }}
          value={selectedType}
          onChange={(val) => setSelectedType(val)}
        >
          <Option value="all">{t('all_types', 'All Types')}</Option>
          <Option value="preventive">{t('preventive', 'Preventive')}</Option>
          <Option value="corrective">{t('corrective', 'Corrective')}</Option>
          <Option value="calibration">{t('calibration', 'Calibration')}</Option>
          <Option value="inspection">{t('inspection', 'Inspection')}</Option>
        </Select>
      </div>

      <Table
        dataSource={maintenances}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, limit) => fetchMaintenances(page, limit)
        }}
      />

      {/* Create Maintenance Modal */}
      <Modal
        title={t('schedule_maintenance_work_order', 'Schedule Maintenance Work Order')}
        open={createModalOpen}
        onOk={handleSaveCreate}
        onCancel={() => setCreateModalOpen(false)}
        width={680}
        okText={t('create_order', 'Create Work Order')}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="asset_id"
            label={t('select_equipment', 'Select Target Equipment')}
            rules={[{ required: true, message: 'Please select an asset' }]}
          >
            <Select showSearch placeholder="Search equipment by code or name..." optionFilterProp="children">
              {assets.map((a) => (
                <Option key={a.id} value={a.id}>
                  {a.asset_code} &mdash; {a.name} ({a.location_name || 'Central'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label={t('work_order_title', 'Work Order Title')}
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input placeholder="e.g. 5,000hr Hydraulic Inspection & Filter Replacement" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="maintenance_type" label={t('maintenance_type', 'Maintenance Type')}>
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
              <Form.Item name="cost" label={t('estimated_cost', 'Estimated Cost ($)')}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="technician" label={t('technician_vendor', 'Assigned Technician / Service Center')}>
            <Input placeholder="Internal Technician or External Vendor" />
          </Form.Item>

          <Form.Item name="description" label={t('service_instructions', 'Service Instructions')}>
            <Input.TextArea rows={2} placeholder="Scope of work, required lubricants, safety precautions..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Maintenance Modal */}
      <Modal
        title={t('update_maintenance_status', `Update Work Order: ${activeMaintenance?.reference_no} (${activeMaintenance?.asset_code})`)}
        open={updateModalOpen}
        onOk={handleSaveUpdate}
        onCancel={() => setUpdateModalOpen(false)}
        width={640}
        okText={t('save_update', 'Save Updates')}
      >
        <Form form={updateForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label={t('work_order_status', 'Status')} rules={[{ required: true }]}>
                <Select>
                  <Option value="pending">Scheduled / Pending</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="completed_date" label={t('completed_date', 'Completed Date (if finished)')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cost" label={t('final_incurred_cost', 'Final Incurred Cost ($)')}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="technician" label={t('servicing_technician', 'Servicing Technician / Vendor')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="parts_replaced" label={t('parts_replaced', 'Parts Replaced / Materials Consumed')}>
            <Input placeholder="e.g. O-rings, air filter, grouphead silicone gasket" />
          </Form.Item>

          <Form.Item name="description" label={t('technician_notes', 'Technician Service Notes')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AssetMaintenancePage;
