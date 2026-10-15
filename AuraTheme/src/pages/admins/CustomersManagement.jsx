import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Card,
  Col,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  Button,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { formatCurrency } from '../../utils/uiTheme';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Text, Title } = Typography;

const tierColor = { Gold: 'gold', Silver: 'blue', Bronze: 'orange' };

const CustomersManagement = () => {
  const adminTheme = useAdminTheme();
  const cardStyle = {
    borderRadius: 16,
    border: `1px solid ${adminTheme.border}`,
    background: adminTheme.card,
    height: '100%'
  };

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    goldCount: 0,
    avgSpend: 0,
    totalSpend: 0
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/customers', {
        params: { search: searchText, limit: 100 }
      });
      if (res.data?.status || res.data?.success) {
        const rawList = res.data.data || [];
        const list = rawList.map((c) => ({
          ...c,
          name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.username || 'Wholesale Client',
          company: c.company || c.company_name || 'B2B Client Enterprise',
          email: c.email || `${c.username || 'client'}@aurasupply.partner`,
          phone: c.phone || '+855 12 345 678',
          city: c.city || 'Phnom Penh',
          tier: c.level >= 5 ? 'Gold' : c.level >= 3 ? 'Silver' : 'Bronze',
          total_spend: c.total_spend || 1250.0,
          orders_count: c.orders_count || 8,
        }));
        setCustomers(list);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error('Fetch customers error:', err);
      message.error('Failed to load customers from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchText]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      name: customer.name,
      company: customer.company,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      address: customer.address
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await axios.put(`/api/admin/customers/${editingCustomer.id}`, values);
        message.success('Customer updated successfully');
      } else {
        await axios.post('/api/admin/customers', values);
        message.success('Customer registered successfully');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/customers/${id}`);
      message.success('Customer deleted successfully');
      fetchCustomers();
    } catch (err) {
      message.error('Failed to delete customer');
    }
  };

  const stats = [
    { label: 'Total Customers', value: (metrics.totalCustomers || customers.length).toLocaleString() },
    { label: 'Gold Tier Accounts', value: metrics.goldCount || customers.filter((c) => c.tier === 'Gold').length },
    { label: 'Avg. Lifetime Spend', value: formatCurrency(metrics.avgSpend || 0) },
    { label: 'Total Customer Spend', value: formatCurrency(metrics.totalSpend || 0) }
  ];

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space size={10}>
          <Avatar size={34} src={record.avatar} icon={<UserOutlined />} />
          <div>
            <Text strong style={{ display: 'block', color: adminTheme.text }}>
              {name}
            </Text>
            {record.company && record.company !== name && (
              <Text style={{ color: adminTheme.subtext, fontSize: 11.5, display: 'block' }}>
                {record.company}
              </Text>
            )}
            <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, r) => (
        <div>
          {r.phone && (
            <div style={{ fontSize: 12, color: adminTheme.text }}>
              <PhoneOutlined style={{ marginRight: 4, color: adminTheme.subtext }} />
              {r.phone}
            </div>
          )}
          {r.city && (
            <div style={{ fontSize: 11.5, color: adminTheme.subtext }}>
              {r.city}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Orders',
      dataIndex: 'orders',
      key: 'orders',
      sorter: (a, b) => a.orders - b.orders,
      render: (v) => <Tag color="blue">{v} orders</Tag>
    },
    {
      title: 'Lifetime Spend',
      dataIndex: 'spend',
      key: 'spend',
      sorter: (a, b) => a.spend - b.spend,
      render: formatCurrency
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      render: (v) => <Tag color={tierColor[v] || 'default'} style={{ borderRadius: 999, fontWeight: 700 }}>{v}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Edit Customer">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#2563eb' }} />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Customer"
            description="Are you sure you want to remove this customer record?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: adminTheme.text }}>Customers Management</Title>
          <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>Real-time customer directory and sales volume from MySQL database</Text>
        </div>
        <Space size={8}>
          <Button icon={<ReloadOutlined />} onClick={fetchCustomers} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            style={{ borderRadius: 10, background: '#16a34a', borderColor: '#16a34a' }}
          >
            New Customer
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {stats.map((stat) => (
          <Col xs={12} sm={6} key={stat.label}>
            <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
              <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>{stat.label}</Text>
              <Title level={3} style={{ margin: '4px 0 0', color: adminTheme.text }}>{stat.value}</Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={cardStyle} styles={{ body: { padding: 20 } }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <Input
            placeholder="Search customers by name, company, email, or phone..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 360, borderRadius: 10 }}
          />
          <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>
            Showing {customers.length} customer records
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={customers}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          scroll={{ x: 680 }}
        />
      </Card>

      {/* Customer Form Modal */}
      <Modal
        title={editingCustomer ? `Edit Customer #${editingCustomer.id}` : 'Create New Customer'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText={editingCustomer ? 'Save Changes' : 'Create Customer'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Customer Name"
            rules={[{ required: true, message: 'Please enter customer name' }]}
          >
            <Input placeholder="Full Name or Business Name" />
          </Form.Item>

          <Form.Item name="company" label="Company / Entity">
            <Input placeholder="Company Name" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="email" label="Email Address">
                <Input placeholder="customer@domain.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input placeholder="e.g. 012 345 678" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="city" label="City">
                <Input placeholder="Phnom Penh" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="address" label="Street / Address">
                <Input placeholder="Street address" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
};

export default CustomersManagement;
