import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Button,
  Card,
  Space,
  Table,
  Tag,
  Typography,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
  Tooltip,
  Row,
  Col,
  Badge
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  SearchOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAdminTheme } from '../../hooks/useAdminTheme';

const { Text, Title } = Typography;
const { Option } = Select;

const roleBadgeColor = {
  owner: 'purple',
  admin: 'blue',
  branch: 'cyan',
  salesman: 'green',
  employee: 'default',
  audit: 'orange',
  cashier: 'gold',
  stock: 'geekblue'
};

const UserManagement = () => {
  const adminTheme = useAdminTheme();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users', {
        headers: getAuthHeader(),
        params: { search: searchText, limit: 100 }
      });
      if (res.data?.success || res.data?.data) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load users with auth, trying public/fallback:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/admin/roles', {
        headers: getAuthHeader()
      });
      if (res.data?.success && res.data?.data) {
        setRoles(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load roles:', err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [searchText]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ group_id: 2, active: 1 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      group_id: user.group_id,
      active: user.active
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await axios.put(`/api/admin/users/${editingUser.id}`, values, {
          headers: getAuthHeader()
        });
        message.success(`User @${values.username || editingUser.username} updated successfully!`);
      } else {
        await axios.post('/api/admin/users', values, {
          headers: getAuthHeader()
        });
        message.success(`Operator @${values.username} created successfully!`);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (user, checked) => {
    try {
      await axios.put(
        `/api/admin/users/${user.id}/status`,
        { active: checked ? 1 : 0 },
        { headers: getAuthHeader() }
      );
      message.success(`Account for @${user.username} is now ${checked ? 'Active' : 'Deactivated'}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: checked ? 1 : 0 } : u))
      );
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to change status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/users/${id}`, {
        headers: getAuthHeader()
      });
      message.success('User account removed permanently');
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (selectedRole !== 'all' && String(u.group_id) !== String(selectedRole)) {
      return false;
    }
    return true;
  });

  const columns = [
    {
      title: 'Operator Account',
      key: 'account',
      render: (_, record) => {
        const fullName = [record.first_name, record.last_name].filter(Boolean).join(' ');
        const seed = (record.id % 70) + 1;
        return (
          <Space size={12}>
            <Avatar size={38} src={record.avatar || `https://i.pravatar.cc/80?img=${seed}`} icon={<UserOutlined />} />
            <div>
              <Text strong style={{ display: 'block', color: adminTheme.text }}>
                {fullName || record.username}
              </Text>
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>
                @{record.username} &bull; {record.email}
              </Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: 'Role & Privilege Level',
      dataIndex: 'role',
      key: 'role',
      render: (roleName, record) => {
        const color = roleBadgeColor[roleName?.toLowerCase()] || 'blue';
        return (
          <Tag color={color} style={{ borderRadius: 6, fontWeight: 700, textTransform: 'uppercase', fontSize: 11 }}>
            <SafetyCertificateOutlined style={{ marginRight: 4 }} />
            {roleName || 'Operator'}
          </Tag>
        );
      }
    },
    {
      title: 'Phone / Contact',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (
        <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
          {phone || '—'}
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      width: 120,
      render: (active, record) => (
        <Space size={8}>
          <Switch
            checked={Boolean(active)}
            onChange={(checked) => handleToggleStatus(record, checked)}
            size="small"
          />
          <Text style={{ fontSize: 12, color: active ? '#16a34a' : '#94a3b8' }}>
            {active ? 'Active' : 'Suspended'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="Edit Role & Details">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#2563eb' }} />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete User"
            description={`Are you sure you want to permanently delete @${record.username}?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Account">
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
          <Title level={4} style={{ margin: 0, color: adminTheme.text }}>
            User Management &amp; Access Control
          </Title>
          <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
            Sole source of truth: <code>aura_users</code> &amp; <code>aura_groups</code>. All privileges derive strictly from the users database.
          </Text>
        </div>
        <Space size={8}>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            style={{ borderRadius: 10, background: '#2563eb', borderColor: '#2563eb' }}
          >
            Invite Operator
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 16, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }} styles={{ body: { padding: 20 } }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <Space size={10} wrap>
            <Input
              placeholder="Search by username, name, email, or phone..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300, borderRadius: 10 }}
            />
            <Select
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: 180 }}
            >
              <Option value="all">All Roles ({roles.length})</Option>
              {roles.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.description || r.name}
                </Option>
              ))}
            </Select>
          </Space>
          <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>
            {filteredUsers.length} operator accounts registered
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
          scroll={{ x: 680 }}
        />
      </Card>

      {/* User Form Modal */}
      <Modal
        title={editingUser ? `Edit Operator @${editingUser.username}` : 'Invite New Operator'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText={editingUser ? 'Save Changes' : 'Create Account'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please enter username' }]}
              >
                <Input placeholder="e.g. john.doe" disabled={Boolean(editingUser)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Valid email required' }
                ]}
              >
                <Input placeholder="john@aurasupply.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="first_name" label="First Name">
                <Input placeholder="First Name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" label="Last Name">
                <Input placeholder="Last Name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="group_id"
                label="Assigned Role (aura_groups)"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role">
                  {roles.map((r) => (
                    <Option key={r.id} value={r.id}>
                      {r.description || r.name} ({r.name})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input placeholder="e.g. 012 888 999" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="password"
            label={editingUser ? 'Reset Password (leave empty to keep current)' : 'Account Password'}
            rules={editingUser ? [] : [{ required: true, message: 'Password is required' }]}
          >
            <Input.Password placeholder="At least 6 characters" prefix={<KeyOutlined />} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default UserManagement;
