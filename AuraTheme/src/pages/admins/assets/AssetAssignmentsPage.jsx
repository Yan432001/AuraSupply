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
  DatePicker,
  message,
  Tooltip
} from 'antd';
import {
  UserSwitchOutlined,
  RollbackOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const AssetAssignmentsPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Available assets for check-out
  const [availableAssets, setAvailableAssets] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm] = Form.useForm();

  // Return modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [returnForm] = Form.useForm();

  const fetchAssignments = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      };
      const res = await axios.get('/api/admin/assets/assignments', { params });
      if (res.data?.status) {
        setAssignments(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      message.error(t('failed_fetch_assignments', 'Failed to load asset assignments.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const res = await axios.get('/api/admin/assets', { params: { status: 'available', limit: 200 } });
      if (res.data?.status) {
        setAvailableAssets(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching available assets:', err);
    }
  };

  useEffect(() => {
    fetchAssignments(1, pagination.limit);
  }, [selectedStatus]);

  const openNewAssignModal = () => {
    fetchAvailableAssets();
    assignForm.resetFields();
    assignForm.setFieldsValue({
      assigned_date: dayjs(),
      condition_out: 'good'
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
        message.success(t('asset_assigned', 'Asset checked out successfully!'));
        setAssignModalOpen(false);
        fetchAssignments(1, pagination.limit);
      }
    } catch (err) {
      console.error('Save assign error:', err);
      message.error(err.response?.data?.message || err.message);
    }
  };

  const openReturnModal = (assignment) => {
    setActiveAssignment(assignment);
    returnForm.resetFields();
    returnForm.setFieldsValue({
      assignment_id: assignment.id,
      returned_date: dayjs(),
      condition_in: assignment.condition_out || 'good'
    });
    setReturnModalOpen(true);
  };

  const handleSaveReturn = async () => {
    try {
      const values = await returnForm.validateFields();
      const payload = {
        ...values,
        returned_date: values.returned_date.format('YYYY-MM-DD')
      };
      const res = await axios.post('/api/admin/assets/assignments/return', payload);
      if (res.data?.status) {
        message.success(t('asset_returned', 'Asset returned and marked as available!'));
        setReturnModalOpen(false);
        fetchAssignments(pagination.page, pagination.limit);
      }
    } catch (err) {
      console.error('Save return error:', err);
      message.error(err.response?.data?.message || err.message);
    }
  };

  const columns = [
    {
      title: t('asset', 'Asset'),
      key: 'asset',
      render: (_, r) => (
        <div>
          <Text strong style={{ color: '#2563eb' }}>{r.asset_code}</Text>
          <div>{r.asset_name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {[r.brand, r.model].filter(Boolean).join(' • ')}
          </div>
        </div>
      )
    },
    {
      title: t('custodian', 'Custodian / Employee'),
      key: 'custodian',
      render: (_, r) => (
        <div>
          <Text strong>{r.employee_name}</Text>
          {r.department_name && <div style={{ fontSize: 12, color: '#64748b' }}>{r.department_name}</div>}
        </div>
      )
    },
    {
      title: t('assigned_date', 'Assigned Date'),
      dataIndex: 'assigned_date',
      key: 'assigned_date',
      render: (d) => d ? new Date(d).toLocaleDateString() : '-'
    },
    {
      title: t('expected_return', 'Expected Return'),
      dataIndex: 'expected_return_date',
      key: 'expected_return_date',
      render: (d) => d ? new Date(d).toLocaleDateString() : <span style={{ color: '#94a3b8' }}>Open-ended</span>
    },
    {
      title: t('returned_date', 'Returned Date'),
      dataIndex: 'returned_date',
      key: 'returned_date',
      render: (d) => d ? new Date(d).toLocaleDateString() : '-'
    },
    {
      title: t('condition_out_in', 'Condition (Out / In)'),
      key: 'condition',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag color="cyan">Out: {r.condition_out || 'good'}</Tag>
          {r.condition_in && <Tag color="blue">In: {r.condition_in}</Tag>}
        </Space>
      )
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (st) => (
        st === 'active' ? (
          <Tag color="processing" icon={<ClockCircleOutlined />}>Active Checkout</Tag>
        ) : (
          <Tag color="success" icon={<CheckCircleOutlined />}>Returned</Tag>
        )
      )
    },
    {
      title: t('actions', 'Actions'),
      key: 'actions',
      align: 'center',
      render: (_, r) => (
        r.status === 'active' ? (
          <Button
            type="primary"
            size="small"
            icon={<RollbackOutlined />}
            onClick={() => openReturnModal(r)}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
          >
            {t('return_asset', 'Process Return')}
          </Button>
        ) : (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Completed</span>
        )
      )
    }
  ];

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('asset_assignments', 'Asset Check-Out & Check-In Custody Log')}
          </Title>
          <Text type="secondary">
            {t('asset_assignments_desc', 'Track equipment assigned to staff, custody handovers, return condition inspections, and return due dates.')}
          </Text>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openNewAssignModal}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
          >
            {t('new_assignment', 'Check Out Asset')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchAssignments(pagination.page, pagination.limit)}>
            {t('refresh', 'Refresh')}
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Select
          style={{ width: 180 }}
          value={selectedStatus}
          onChange={(val) => setSelectedStatus(val)}
        >
          <Option value="all">{t('all_assignments', 'All Statuses')}</Option>
          <Option value="active">{t('active_checkouts', 'Active Checkouts')}</Option>
          <Option value="returned">{t('returned_history', 'Returned History')}</Option>
        </Select>
      </div>

      <Table
        dataSource={assignments}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, limit) => fetchAssignments(page, limit)
        }}
      />

      {/* New Assignment Modal */}
      <Modal
        title={t('check_out_asset', 'Check Out / Assign Capital Asset')}
        open={assignModalOpen}
        onOk={handleSaveAssign}
        onCancel={() => setAssignModalOpen(false)}
        okText={t('confirm_assignment', 'Check Out Asset')}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="asset_id"
            label={t('select_available_asset', 'Select Available Asset')}
            rules={[{ required: true, message: 'Please select an asset' }]}
          >
            <Select showSearch placeholder="Search asset by name or code..." optionFilterProp="children">
              {availableAssets.map((a) => (
                <Option key={a.id} value={a.id}>
                  {a.asset_code} &mdash; {a.name} ({a.brand || 'No brand'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="employee_name"
            label={t('employee_custodian', 'Employee / Custodian Name')}
            rules={[{ required: true, message: 'Employee name is required' }]}
          >
            <Input placeholder="e.g. Alice Chen (Senior Developer)" />
          </Form.Item>

          <Form.Item name="department_name" label={t('department', 'Department / Cost Center')}>
            <Input placeholder="e.g. Engineering, Sales, Human Resources" />
          </Form.Item>

          <Form.Item name="assigned_date" label={t('checkout_date', 'Check-out Date')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="expected_return_date" label={t('expected_return_date', 'Expected Return Date (Optional)')}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="condition_out" label={t('condition_out', 'Condition at Check-out')}>
            <Select>
              <Option value="new">Brand New</Option>
              <Option value="excellent">Excellent</Option>
              <Option value="good">Good</Option>
              <Option value="fair">Fair</Option>
            </Select>
          </Form.Item>

          <Form.Item name="note" label={t('handover_notes', 'Handover Notes')}>
            <Input.TextArea rows={2} placeholder="Serial verification, accessories, packaging..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Return Modal */}
      <Modal
        title={t('check_in_asset', `Check In / Return Asset: ${activeAssignment?.asset_code} (${activeAssignment?.employee_name})`)}
        open={returnModalOpen}
        onOk={handleSaveReturn}
        onCancel={() => setReturnModalOpen(false)}
        okText={t('confirm_return', 'Confirm Return')}
      >
        <Form form={returnForm} layout="vertical">
          <Form.Item name="assignment_id" hidden><Input /></Form.Item>
          <Form.Item name="returned_date" label={t('return_date', 'Actual Return Date')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="condition_in" label={t('condition_in', 'Physical Condition Upon Return')} rules={[{ required: true }]}>
            <Select>
              <Option value="excellent">Excellent - No damage</Option>
              <Option value="good">Good - Normal wear</Option>
              <Option value="fair">Fair - Minor scuffs/cosmetics</Option>
              <Option value="poor">Poor - Requires servicing</Option>
              <Option value="damaged">Damaged - Unusable / Parts required</Option>
            </Select>
          </Form.Item>
          <Form.Item name="return_note" label={t('return_notes', 'Return Inspection Notes')}>
            <Input.TextArea rows={2} placeholder="Inspected charging port, screen, accessories returned..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AssetAssignmentsPage;
