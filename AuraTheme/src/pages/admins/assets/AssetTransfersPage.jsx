import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message
} from 'antd';
import {
  SwapOutlined,
  PlusOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

const AssetTransfersPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });

  // Assets list for dropdown
  const [assets, setAssets] = useState([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchTransfers = async (page = pagination.page, limit = pagination.limit) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/assets/transfers', { params: { page, limit } });
      if (res.data?.status) {
        setTransfers(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      message.error(t('failed_fetch_transfers', 'Failed to load transfer logs.'));
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
      console.error('Error fetching assets for transfers:', err);
    }
  };

  useEffect(() => {
    fetchTransfers(1, pagination.limit);
  }, []);

  const openNewTransferModal = () => {
    fetchAssets();
    form.resetFields();
    form.setFieldsValue({
      transfer_date: dayjs()
    });
    setTransferModalOpen(true);
  };

  const handleAssetSelect = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      form.setFieldsValue({
        from_location: asset.location_name || 'Central Facility',
        from_department: asset.department_name || 'General'
      });
    }
  };

  const handleSaveTransfer = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        transfer_date: values.transfer_date.format('YYYY-MM-DD')
      };
      const res = await axios.post('/api/admin/assets/transfers', payload);
      if (res.data?.status) {
        message.success(t('transfer_recorded', 'Asset transfer logged and location updated!'));
        setTransferModalOpen(false);
        fetchTransfers(1, pagination.limit);
      }
    } catch (err) {
      console.error('Save transfer error:', err);
      message.error(err.response?.data?.message || err.message);
    }
  };

  const columns = [
    {
      title: t('reference_no', 'Reference #'),
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 150,
      render: (ref) => <Tag color="blue" style={{ fontWeight: 600 }}>{ref}</Tag>
    },
    {
      title: t('asset', 'Target Equipment'),
      key: 'asset',
      render: (_, r) => (
        <div>
          <Text strong style={{ color: '#2563eb' }}>{r.asset_code}</Text>
          <div>{r.asset_name}</div>
        </div>
      )
    },
    {
      title: t('location_movement', 'Facility Movement'),
      key: 'movement',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color="default">{r.from_location || 'Central'}</Tag>
          <ArrowRightOutlined style={{ color: '#2563eb' }} />
          <Tag color="cyan" style={{ fontWeight: 600 }}>{r.to_location}</Tag>
        </div>
      )
    },
    {
      title: t('department_change', 'Department Transfer'),
      key: 'dept_movement',
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          {r.from_department} &rarr; <strong>{r.to_department || r.from_department}</strong>
        </div>
      )
    },
    {
      title: t('transfer_date', 'Transfer Date'),
      dataIndex: 'transfer_date',
      key: 'transfer_date',
      render: (d) => d ? new Date(d).toLocaleDateString() : '-'
    },
    {
      title: t('reason', 'Transfer Reason'),
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (text) => text || <span style={{ color: '#94a3b8' }}>&mdash;</span>
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (s) => <Tag color="success">{s?.toUpperCase()}</Tag>
    }
  ];

  return (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('asset_transfers_log', 'Inter-Branch & Facility Asset Transfers')}
          </Title>
          <Text type="secondary">
            {t('asset_transfers_desc', 'Audit trail of equipment dispatches, branch movements, and department reassignments.')}
          </Text>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openNewTransferModal}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
          >
            {t('log_new_transfer', 'Dispatch Transfer')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchTransfers(pagination.page, pagination.limit)}>
            {t('refresh', 'Refresh')}
          </Button>
        </Space>
      </div>

      <Table
        dataSource={transfers}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, limit) => fetchTransfers(page, limit)
        }}
      />

      <Modal
        title={t('dispatch_asset_transfer', 'Log Inter-Branch / Location Asset Transfer')}
        open={transferModalOpen}
        onOk={handleSaveTransfer}
        onCancel={() => setTransferModalOpen(false)}
        okText={t('execute_transfer', 'Confirm Dispatch')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="asset_id"
            label={t('select_asset', 'Select Target Equipment')}
            rules={[{ required: true, message: 'Please select an asset' }]}
          >
            <Select
              showSearch
              placeholder="Search equipment by code or name..."
              optionFilterProp="children"
              onChange={handleAssetSelect}
            >
              {assets.map((a) => (
                <Option key={a.id} value={a.id}>
                  {a.asset_code} &mdash; {a.name} ({a.location_name || 'Central'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="transfer_date" label={t('transfer_date', 'Dispatch / Transfer Date')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="from_location" label={t('current_location', 'Current Location')} style={{ flex: 1 }}>
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="to_location"
              label={t('destination_facility', 'Destination Facility')}
              rules={[{ required: true, message: 'Destination is required' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="e.g. Branch 2, Store Bar, Lab 4" />
            </Form.Item>
          </Space>

          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item name="from_department" label={t('current_department', 'Current Department')} style={{ flex: 1 }}>
              <Input disabled />
            </Form.Item>
            <Form.Item name="to_department" label={t('target_department', 'Target Department')} style={{ flex: 1 }}>
              <Input placeholder="e.g. Operations, IT, Finance" />
            </Form.Item>
          </Space>

          <Form.Item name="reason" label={t('transfer_justification', 'Transfer Purpose / Logistics Reason')}>
            <Input.TextArea rows={2} placeholder="Equipment reallocation, facility upgrade, seasonal demand..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AssetTransfersPage;
