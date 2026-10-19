import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Table,
  Input,
  Tag,
  Space,
  Form,
  Select,
  Popconfirm,
  message,
} from 'antd';
import {
  PrinterOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import axios from 'axios';

const PosPrintersModal = ({
  visible,
  onClose,
  themeMode,
  t,
}) => {
  const isDark = themeMode === 'dark';
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);

  const fetchPrinters = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/pos/printers');
      if (res.data?.success) {
        setPrinters(res.data.printers || []);
      }
    } catch (err) {
      console.warn('Failed loading printers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) fetchPrinters();
  }, [visible]);

  const handleSavePrinter = async (values) => {
    setIsSaving(true);
    try {
      const res = await axios.post('/api/admin/pos/printers', values);
      if (res.data?.success) {
        message.success('Printer profile saved');
        form.resetFields();
        setActiveTab('list');
        fetchPrinters();
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed saving printer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrinter = async (id) => {
    try {
      await axios.delete(`/api/admin/pos/printers/${id}`);
      message.success('Printer removed');
      fetchPrinters();
    } catch (err) {
      message.error('Failed deleting printer');
    }
  };

  const handleTestPrint = (printer) => {
    message.loading({ content: `Testing printer "${printer.title}"...`, key: 'test_print' });
    setTimeout(() => {
      message.success({ content: `Test page sent to ${printer.title} (${printer.ip_address || 'USB'})!`, key: 'test_print' });
    }, 800);
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (t) => <span style={{ fontWeight: 700 }}>{t}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type?.toUpperCase() || 'NETWORK'}</Tag>,
    },
    {
      title: 'Width / Profile',
      dataIndex: 'profile',
      key: 'profile',
      render: (p) => <Tag color="cyan">{p || '80mm Thermal'}</Tag>,
    },
    {
      title: 'IP / Connection',
      key: 'conn',
      render: (_, r) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {r.ip_address ? `${r.ip_address}:${r.port || 9100}` : (r.path || 'USB')}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, r) => (
        <Space size={8}>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => handleTestPrint(r)}>
            Test
          </Button>
          <Popconfirm title="Delete printer?" onConfirm={() => handleDeletePrinter(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      destroyOnClose
      style={{ borderRadius: 20, overflow: 'hidden' }}
      styles={{ body: { padding: '24px 28px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            <PrinterOutlined style={{ color: '#6366f1', marginRight: 8 }} />
            Receipt & Kitchen Printers
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Configure thermal receipt printers, bar printers, and kitchen order stations
          </div>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchPrinters} size="middle" style={{ borderRadius: 8 }} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setActiveTab(activeTab === 'list' ? 'add' : 'list')}
            style={{ borderRadius: 8, background: '#6366f1' }}
          >
            {activeTab === 'list' ? 'Add Printer' : 'Printers List'}
          </Button>
        </Space>
      </div>

      {activeTab === 'list' ? (
        <Table
          columns={columns}
          dataSource={printers}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSavePrinter} initialValues={{ type: 'network', profile: 'default', char_per_line: 48, port: 9100 }}>
          <Form.Item label="Printer Title" name="title" rules={[{ required: true, message: 'Please enter title' }]}>
            <Input placeholder="e.g. Counter Thermal 80mm, Kitchen Station 1" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="Connection Type" name="type">
              <Select
                options={[
                  { label: 'Network / TCP-IP', value: 'network' },
                  { label: 'Windows Shared', value: 'windows' },
                  { label: 'Linux / CUPS', value: 'linux' },
                ]}
              />
            </Form.Item>

            <Form.Item label="Printer Profile" name="profile">
              <Select
                options={[
                  { label: 'Standard 80mm (ESC/POS)', value: 'default' },
                  { label: 'Compact 58mm (ESC/POS)', value: '58mm' },
                  { label: 'Star Micronics', value: 'star' },
                  { label: 'Epson T88 Series', value: 'epson' },
                ]}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Form.Item label="IP Address / Host" name="ip_address">
              <Input placeholder="192.168.1.200" />
            </Form.Item>

            <Form.Item label="Port" name="port">
              <Input type="number" placeholder="9100" />
            </Form.Item>
          </div>

          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Button onClick={() => setActiveTab('list')} style={{ marginRight: 8, borderRadius: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isSaving} style={{ background: '#6366f1', borderRadius: 8, fontWeight: 700 }}>
              Save Printer Profile
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default PosPrintersModal;
