import React, { useState, useEffect, useMemo } from 'react';
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
  Badge,
  Checkbox,
  Drawer,
  Timeline,
  Divider,
  Alert,
  Flex
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  SearchOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  HistoryOutlined,
  PoweroffOutlined,
  CrownOutlined,
  TeamOutlined,
  ShopOutlined,
  AuditOutlined,
  SettingOutlined,
  FilterOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Text, Title } = Typography;
const { Option } = Select;

// Standard ERP Module Registry for Permission Matrix
const PERMISSION_MODULES = [
  { key: 'inventory', label: 'Inventory & Catalog', description: 'Product listings, stock movements, and valuation' },
  { key: 'purchases', label: 'Purchases & Sourcing', description: 'Purchase orders, receiving, and vendor invoices' },
  { key: 'sales', label: 'Sales & Distribution', description: 'Wholesale sales orders, invoices, and deliveries' },
  { key: 'crm', label: 'Buyers & Suppliers (CRM)', description: 'Customer & vendor relationships from users table' },
  { key: 'accounts', label: 'General Accounting', description: 'Financial ledgers, payments, and account balances' },
  { key: 'hr', label: 'Human Resources', description: 'Staff directory, departments, and designations' },
  { key: 'attendance', label: 'Staff Attendance', description: 'Shift rosters, clock-in, and daily attendance' },
  { key: 'payroll', label: 'Payroll & Payslips', description: 'Salary calculations, deductions, and payouts' },
  { key: 'expenses', label: 'Operational Expenses', description: 'Operating expense vouchers and category logs' },
  { key: 'reports', label: 'Analytics & Reports', description: 'Business intelligence and tax audit reports' },
  { key: 'settings', label: 'System & Security Settings', description: 'Platform configurations, roles, and site info' },
  { key: 'notifications', label: 'Alerts & Notifications', description: 'Broadcast notices and low stock alerts' },
  { key: 'calendar', label: 'Events & Calendar', description: 'Corporate schedule and delivery reminders' }
];

const PERMISSION_ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'approve', label: 'Approve' },
  { key: 'export', label: 'Export' }
];

const ROLE_PRESETS = [
  { key: 'owner', label: 'Enterprise Owner', level: 1, color: 'purple', badge: 'LEVEL 1' },
  { key: 'admin', label: 'Administrator', level: 2, color: 'blue', badge: 'LEVEL 2' },
  { key: 'manager', label: 'Store Manager', level: 2, color: 'cyan', badge: 'LEVEL 2' },
  { key: 'salesman', label: 'Commercial Agent', level: 3, color: 'green', badge: 'LEVEL 3' },
  { key: 'staff', label: 'Operations Staff', level: 3, color: 'default', badge: 'LEVEL 3' },
  { key: 'cashier', label: 'POS Cashier', level: 3, color: 'gold', badge: 'LEVEL 3' },
  { key: 'stock', label: 'Warehouse Controller', level: 3, color: 'geekblue', badge: 'LEVEL 3' },
  { key: 'account', label: 'Senior Accountant', level: 3, color: 'magenta', badge: 'LEVEL 3' },
  { key: 'audit', label: 'Tax Auditor', level: 3, color: 'orange', badge: 'LEVEL 3' },
  { key: 'supplier', label: 'Verified Supplier', level: 4, color: 'volcano', badge: 'LEVEL 4' },
  { key: 'buyer', label: 'Commercial Buyer', level: 5, color: 'lime', badge: 'LEVEL 5' }
];

const getDefaultPermissionsForRole = (roleKey) => {
  const perms = {};
  PERMISSION_MODULES.forEach((mod) => {
    perms[mod.key] = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
  });

  if (roleKey === 'owner') {
    PERMISSION_MODULES.forEach((mod) => {
      perms[mod.key] = { view: true, create: true, edit: true, delete: true, approve: true, export: true };
    });
  } else if (roleKey === 'admin') {
    PERMISSION_MODULES.forEach((mod) => {
      perms[mod.key] = {
        view: true,
        create: true,
        edit: true,
        delete: mod.key !== 'settings',
        approve: true,
        export: true
      };
    });
  } else if (roleKey === 'manager') {
    ['inventory', 'purchases', 'sales', 'crm', 'attendance', 'reports'].forEach((m) => {
      perms[m] = { view: true, create: true, edit: true, delete: false, approve: true, export: true };
    });
  } else if (roleKey === 'salesman') {
    perms['sales'] = { view: true, create: true, edit: true, delete: false, approve: false, export: true };
    perms['crm'] = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
    perms['inventory'] = { view: true, create: false, edit: false, delete: false, approve: false, export: false };
    perms['calendar'] = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
  } else if (roleKey === 'cashier') {
    perms['sales'] = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
    perms['attendance'] = { view: true, create: false, edit: false, delete: false, approve: false, export: false };
  } else if (roleKey === 'stock') {
    perms['inventory'] = { view: true, create: true, edit: true, delete: false, approve: true, export: true };
    perms['purchases'] = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
  } else if (roleKey === 'account') {
    ['accounts', 'payroll', 'expenses', 'reports'].forEach((m) => {
      perms[m] = { view: true, create: true, edit: true, delete: false, approve: true, export: true };
    });
  } else if (roleKey === 'audit') {
    ['accounts', 'expenses', 'reports', 'inventory', 'sales'].forEach((m) => {
      perms[m] = { view: true, create: false, edit: false, delete: false, approve: false, export: true };
    });
  } else if (roleKey === 'supplier') {
    perms['purchases'] = { view: true, create: false, edit: true, delete: false, approve: false, export: false };
    perms['inventory'] = { view: true, create: false, edit: false, delete: false, approve: false, export: false };
  } else if (roleKey === 'buyer') {
    perms['sales'] = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
    perms['inventory'] = { view: true, create: false, edit: false, delete: false, approve: false, export: false };
  } else {
    // staff
    perms['inventory'] = { view: true, create: false, edit: false, delete: false, approve: false, export: false };
    perms['sales'] = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
    perms['attendance'] = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
  }

  return perms;
};

const UserManagement = () => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Create / Edit User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // Permission Matrix Modal
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [matrixUser, setMatrixUser] = useState(null);
  const [matrixPermissions, setMatrixPermissions] = useState({});
  const [savingMatrix, setSavingMatrix] = useState(false);

  // User Activity Drawer
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activityUser, setActivityUser] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users', {
        headers: getAuthHeader(),
        params: { search: searchText, role: selectedRole, status: selectedStatus, limit: 100 }
      });
      if (res.data?.success && res.data?.data) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load users from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchText, selectedRole, selectedStatus]);

  // Modal Open Handlers
  const handleOpenCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'staff',
      status: 'active'
    });
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
      role: user.role || 'staff',
      status: user.status || (user.active ? 'active' : 'inactive')
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await axios.put(`/api/admin/users/${editingUser.id}`, values, {
          headers: getAuthHeader()
        });
        message.success(`User @${editingUser.username} updated successfully!`);
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
    const targetStatus = checked ? 'active' : 'inactive';
    try {
      await axios.put(
        `/api/admin/users/${user.id}/status`,
        { status: targetStatus },
        { headers: getAuthHeader() }
      );
      message.success(`User @${user.username} status updated to ${targetStatus}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: targetStatus, active: checked ? 1 : 0 } : u))
      );
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to change status');
    }
  };

  const handleDeleteUser = async (id, username) => {
    try {
      await axios.delete(`/api/admin/users/${id}`, {
        headers: getAuthHeader()
      });
      message.success(`User @${username} removed`);
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Permission Matrix Handlers
  const handleOpenMatrix = (user) => {
    setMatrixUser(user);
    const existing = user.permissions || {};
    // Ensure all modules exist in structure
    const full = {};
    PERMISSION_MODULES.forEach((mod) => {
      full[mod.key] = {
        view: Boolean(existing[mod.key]?.view),
        create: Boolean(existing[mod.key]?.create),
        edit: Boolean(existing[mod.key]?.edit),
        delete: Boolean(existing[mod.key]?.delete),
        approve: Boolean(existing[mod.key]?.approve),
        export: Boolean(existing[mod.key]?.export)
      };
    });
    setMatrixPermissions(full);
    setIsMatrixOpen(true);
  };

  const handleTogglePermission = (moduleKey, actionKey, checked) => {
    setMatrixPermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || {}),
        [actionKey]: checked
      }
    }));
  };

  const handleApplyPreset = (presetKey) => {
    const preset = getDefaultPermissionsForRole(presetKey);
    setMatrixPermissions(preset);
    message.info(`Loaded default permission template for '${presetKey}'`);
  };

  const handleSelectAllPermissions = (enableAll) => {
    const next = {};
    PERMISSION_MODULES.forEach((mod) => {
      next[mod.key] = {
        view: enableAll,
        create: enableAll,
        edit: enableAll,
        delete: enableAll,
        approve: enableAll,
        export: enableAll
      };
    });
    setMatrixPermissions(next);
  };

  const handleSaveMatrix = async () => {
    if (!matrixUser) return;
    setSavingMatrix(true);
    try {
      await axios.put(
        `/api/admin/users/${matrixUser.id}`,
        { permissions: matrixPermissions },
        { headers: getAuthHeader() }
      );
      message.success(`Permission matrix saved for @${matrixUser.username}`);
      setIsMatrixOpen(false);
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSavingMatrix(false);
    }
  };

  // Activity Log Handlers
  const handleOpenActivity = async (user) => {
    setActivityUser(user);
    setIsActivityOpen(true);
    setLoadingActivity(true);
    try {
      const res = await axios.get(`/api/admin/users/${user.id}/activity`, {
        headers: getAuthHeader()
      });
      if (res.data?.success && res.data?.data) {
        setActivityLogs(res.data.data);
      } else {
        setActivityLogs([]);
      }
    } catch (err) {
      setActivityLogs([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Force Session Logout
  const handleForceLogout = async (user) => {
    try {
      await axios.put(
        `/api/admin/users/${user.id}/status`,
        { status: 'inactive' },
        { headers: getAuthHeader() }
      );
      message.success(`Revoked all active sessions for @${user.username}`);
      fetchUsers();
    } catch (err) {
      message.error('Failed to revoke session');
    }
  };

  const roleMetaMap = useMemo(() => {
    const map = {};
    ROLE_PRESETS.forEach((r) => {
      map[r.key] = r;
    });
    return map;
  }, []);

  const columns = [
    {
      title: t('user_account', 'User / Account'),
      key: 'account',
      render: (_, record) => {
        const fullName = [record.first_name, record.last_name].filter(Boolean).join(' ');
        const seed = (record.id % 70) + 1;
        const isSuper = record.role === 'owner' || record.level === 1;

        return (
          <Space orientation="horizontal" size={12}>
            <Avatar
              size={40}
              src={record.avatar || `https://i.pravatar.cc/80?img=${seed}`}
              icon={<UserOutlined />}
              style={{ border: isSuper ? '2px solid #7c3aed' : '1px solid #e2e8f0' }}
            />
            <div>
              <Flex orientation="horizontal" align="center" gap={6}>
                <Text strong style={{ color: adminTheme.text, fontSize: 13.5 }}>
                  {fullName || record.username}
                </Text>
                {isSuper && <CrownOutlined style={{ color: '#7c3aed' }} />}
              </Flex>
              <Text style={{ color: adminTheme.subtext, fontSize: 12, display: 'block' }}>
                @{record.username} &bull; {record.email}
              </Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: t('role_level', 'Role & Privilege Level'),
      dataIndex: 'role',
      key: 'role',
      render: (roleKey, record) => {
        const meta = roleMetaMap[roleKey?.toLowerCase()] || { label: roleKey, color: 'blue', badge: `L${record.level || 3}` };
        return (
          <Space orientation="horizontal" size={6} wrap>
            <Tag color={meta.color} style={{ borderRadius: 6, fontWeight: 700, textTransform: 'uppercase', fontSize: 11 }}>
              <SafetyCertificateOutlined style={{ marginRight: 4 }} />
              {meta.label || roleKey}
            </Tag>
            <Tag style={{ borderRadius: 6, fontSize: 10, fontWeight: 700, background: adminTheme.cardMuted }}>
              {meta.badge}
            </Tag>
          </Space>
        );
      }
    },
    {
      title: t('contact_phone', 'Contact / Phone'),
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (
        <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
          {phone || '—'}
        </Text>
      )
    },
    {
      title: t('status', 'Status'),
      key: 'status',
      width: 140,
      render: (_, record) => {
        const isActive = record.status === 'active' || record.active === 1;
        return (
          <Space orientation="horizontal" size={8}>
            <Switch
              checked={isActive}
              onChange={(checked) => handleToggleStatus(record, checked)}
              size="small"
              style={{ background: isActive ? '#16a34a' : '#94a3b8' }}
            />
            <Text style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#16a34a' : '#94a3b8' }}>
              {isActive ? t('active', 'ACTIVE') : t('inactive', 'SUSPENDED')}
            </Text>
          </Space>
        );
      }
    },
    {
      title: t('actions', 'Actions & Permissions'),
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space orientation="horizontal" size={4}>
          <Tooltip title={t('configure_permissions', 'Configure Permission Matrix')}>
            <Button
              type="text"
              size="small"
              icon={<SafetyCertificateOutlined style={{ color: '#7c3aed' }} />}
              onClick={() => handleOpenMatrix(record)}
            >
              {t('matrix', 'Matrix')}
            </Button>
          </Tooltip>

          <Tooltip title={t('view_audit', 'View User Activity Audit')}>
            <Button
              type="text"
              size="small"
              icon={<HistoryOutlined style={{ color: '#0284c7' }} />}
              onClick={() => handleOpenActivity(record)}
            />
          </Tooltip>

          <Tooltip title={t('edit_details_password', 'Edit Details & Password')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#2563eb' }} />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>

          <Tooltip title={t('force_terminate_session', 'Force Terminate Session')}>
            <Popconfirm
              title={t('force_logout', 'Force Logout')}
              description={t('force_logout_desc', 'Revoke active token and force @{username} to log in again?').replace('{username}', record.username)}
              onConfirm={() => handleForceLogout(record)}
              okText={t('force_logout', 'Force Logout')}
              cancelText={t('cancel', 'Cancel')}
            >
              <Button type="text" size="small" icon={<PoweroffOutlined style={{ color: '#ea580c' }} />} />
            </Popconfirm>
          </Tooltip>

          <Popconfirm
            title={t('delete_user_account', 'Delete User Account')}
            description={t('delete_user_desc', 'Permanently delete @{username}? Soft-delete will mark as deleted_at.').replace('{username}', record.username)}
            onConfirm={() => handleDeleteUser(record.id, record.username)}
            okText={t('delete', 'Delete')}
            cancelText={t('cancel', 'Cancel')}
            okButtonProps={{ danger: true }}
          >
            <Tooltip title={t('delete_account', 'Delete Account')}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* 1. Header Banner */}
      <Flex orientation="horizontal" justify="space-between" align="flex-start" wrap="wrap" gap={12}>
        <div>
          <Title level={3} style={{ margin: 0, color: adminTheme.text, fontWeight: 700 }}>
            {t('users_access_control', 'User Accounts & Access Control')}
          </Title>
          <Text style={{ color: adminTheme.subtext, fontSize: 13, marginTop: 4, display: 'block' }}>
            {t('users_directory_desc', 'Single Source of Truth: aura_users table. All role levels, authentication sessions, and granular module permissions are governed exclusively through this directory.')}
          </Text>
        </div>

        <Space orientation="horizontal" size={10} wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading} style={{ borderRadius: 10 }}>
            {t('refresh', 'Refresh')}
          </Button>
          <Button
            icon={<SafetyCertificateOutlined />}
            onClick={() => window.location.href = '/admins/access-control'}
            style={{ borderRadius: 10, borderColor: '#7c3aed', color: '#7c3aed', fontWeight: 600 }}
          >
            {t('role_governance_matrix', 'Role Governance & Matrix')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            style={{ borderRadius: 10, background: '#2563eb', borderColor: '#2563eb', fontWeight: 600 }}
          >
            {t('add_user', 'Invite User')}
          </Button>
        </Space>
      </Flex>

      {/* 2. Filter & Stats Bar */}
      <Card style={{ borderRadius: 16, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }} styles={{ body: { padding: '16px 20px' } }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <Input
              placeholder={t('search_users_placeholder', 'Search by username, full name, email, or phone...')}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ borderRadius: 10 }}
            />
          </Col>

          <Col xs={24} md={8}>
            <Space orientation="horizontal" size={8} wrap>
              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                style={{ width: 170 }}
                placeholder={t('filter_role', 'Filter Role')}
              >
                <Option value="all">{t('all_roles', 'All Roles')} ({ROLE_PRESETS.length})</Option>
                {ROLE_PRESETS.map((r) => (
                  <Option key={r.key} value={r.key}>
                    {t(r.key, r.label)} ({r.badge})
                  </Option>
                ))}
              </Select>

              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 130 }}
                placeholder={t('status', 'Status')}
              >
                <Option value="all">{t('all_status', 'All Status')}</Option>
                <Option value="active">{t('active', 'Active')}</Option>
                <Option value="inactive">{t('inactive', 'Suspended')}</Option>
              </Select>
            </Space>
          </Col>

          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
              <strong>{users.length}</strong> {t('operator_accounts_found', 'operator accounts found')}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 3. Main Users Data Table */}
      <Card style={{ borderRadius: 16, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 12, showSizeChanger: true }}
          size="middle"
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 4. User Create / Edit Modal */}
      <Modal
        title={
          <Flex orientation="horizontal" align="center" gap={8}>
            <UserOutlined style={{ color: '#2563eb' }} />
            <span>{editingUser ? `${t('edit_account', 'Edit Account')}: @${editingUser.username}` : t('invite_new_operator', 'Invite New Operator Account')}</span>
          </Flex>
        }
        open={isModalOpen}
        onOk={handleSaveUser}
        onCancel={() => setIsModalOpen(false)}
        okText={editingUser ? t('save_changes', 'Save Changes') : t('create_user', 'Create User')}
        cancelText={t('cancel', 'Cancel')}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 14 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="username"
                label={t('username', 'Username')}
                rules={[{ required: true, message: t('please_enter_username', 'Please enter username') }]}
              >
                <Input placeholder="e.g. john.doe" disabled={Boolean(editingUser)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label={t('email_address', 'Email Address')}
                rules={[
                  { required: true, message: t('please_enter_email', 'Please enter email') },
                  { type: 'email', message: t('valid_email_required', 'Valid email required') }
                ]}
              >
                <Input placeholder="john@aurasupply.biz" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="first_name" label={t('first_name', 'First Name')}>
                <Input placeholder={t('first_name', 'First Name')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" label={t('last_name', 'Last Name')}>
                <Input placeholder={t('last_name', 'Last Name')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="role"
                label={t('role_privilege_preset', 'Role & Privilege Preset')}
                rules={[{ required: true, message: t('please_select_role', 'Please select role') }]}
              >
                <Select placeholder={t('select_role_preset', 'Select role preset')}>
                  {ROLE_PRESETS.map((r) => (
                    <Option key={r.key} value={r.key}>
                      {t(r.key, r.label)} ({r.badge})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label={t('phone_number', 'Phone Number')}>
                <Input placeholder="e.g. 012 345 678" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="status"
                label={t('account_status', 'Account Status')}
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="active">{t('active', 'Active')}</Option>
                  <Option value="inactive">{t('inactive', 'Suspended')}</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label={editingUser ? t('reset_password_optional', 'Reset Password (optional)') : t('account_password', 'Account Password')}
                rules={editingUser ? [] : [{ required: true, message: t('password_is_required', 'Password is required') }]}
              >
                <Input.Password placeholder={t('at_least_6_chars', 'At least 6 characters')} prefix={<KeyOutlined />} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 5. Permission Matrix Modal (Module x View/Create/Edit/Delete/Approve/Export) */}
      <Modal
        title={
          <Flex orientation="horizontal" justify="space-between" align="center" style={{ width: '100%', paddingRight: 24 }}>
            <Flex orientation="horizontal" align="center" gap={8}>
              <SafetyCertificateOutlined style={{ color: '#7c3aed', fontSize: 18 }} />
              <span>Permission Matrix: @{matrixUser?.username} ({matrixUser?.role})</span>
            </Flex>
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700 }}>
              LEVEL {matrixUser?.level || 3}
            </Tag>
          </Flex>
        }
        open={isMatrixOpen}
        onOk={handleSaveMatrix}
        confirmLoading={savingMatrix}
        onCancel={() => setIsMatrixOpen(false)}
        width={860}
        okText="Save Permissions"
        destroyOnHidden
      >
        <Space direction="vertical" size={14} style={{ width: '100%', marginTop: 12 }}>
          {/* Preset Buttons Bar */}
          <Flex orientation="horizontal" justify="space-between" align="center" wrap="wrap" gap={8} style={{ background: adminTheme.cardMuted, padding: '10px 14px', borderRadius: 10 }}>
            <div>
              <Text strong style={{ fontSize: 12, marginRight: 8, color: adminTheme.text }}>
                Quick Presets:
              </Text>
              {['admin', 'manager', 'salesman', 'stock', 'account', 'buyer', 'supplier'].map((role) => (
                <Button
                  key={role}
                  size="small"
                  onClick={() => handleApplyPreset(role)}
                  style={{ marginRight: 4, borderRadius: 6, fontSize: 11.5 }}
                >
                  {role}
                </Button>
              ))}
            </div>

            <Space orientation="horizontal" size={6}>
              <Button size="small" icon={<CheckSquareOutlined />} onClick={() => handleSelectAllPermissions(true)}>
                Check All
              </Button>
              <Button size="small" icon={<BorderOutlined />} onClick={() => handleSelectAllPermissions(false)}>
                Clear All
              </Button>
            </Space>
          </Flex>

          {/* Matrix Grid */}
          <div style={{ maxHeight: 420, overflowY: 'auto', border: `1px solid ${adminTheme.border}`, borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: adminTheme.cardMuted, borderBottom: `1px solid ${adminTheme.border}` }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>ERP Module</th>
                  {PERMISSION_ACTIONS.map((act) => (
                    <th key={act.key} style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>
                      {act.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MODULES.map((mod, idx) => {
                  const modPerms = matrixPermissions[mod.key] || {};
                  return (
                    <tr
                      key={mod.key}
                      style={{
                        borderBottom: `1px solid ${adminTheme.border}`,
                        background: idx % 2 === 0 ? 'transparent' : adminTheme.cardMuted
                      }}
                    >
                      <td style={{ padding: '8px 14px' }}>
                        <Text strong style={{ color: adminTheme.text, display: 'block', fontSize: 12.5 }}>
                          {mod.label}
                        </Text>
                        <Text style={{ color: adminTheme.subtext, fontSize: 11 }}>
                          {mod.description}
                        </Text>
                      </td>
                      {PERMISSION_ACTIONS.map((act) => (
                        <td key={act.key} style={{ padding: '8px', textAlign: 'center' }}>
                          <Checkbox
                            checked={Boolean(modPerms[act.key])}
                            onChange={(e) => handleTogglePermission(mod.key, act.key, e.target.checked)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Alert
            type="info"
            showIcon
            message="Granular Access Enforcement"
            description="Permissions are saved directly into the user record in JSON format and verified on every server API request via the permission middleware."
          />
        </Space>
      </Modal>

      {/* 6. User Activity History Drawer */}
      <Drawer
        title={
          <Flex orientation="horizontal" align="center" gap={8}>
            <HistoryOutlined style={{ color: '#0284c7' }} />
            <span>Activity Log: @{activityUser?.username}</span>
          </Flex>
        }
        open={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        width={480}
      >
        {loadingActivity ? (
          <Text>Loading audit history...</Text>
        ) : activityLogs.length === 0 ? (
          <Alert message="No recorded activity yet for this account." type="info" />
        ) : (
          <Timeline
            items={activityLogs.map((log) => ({
              color: (log.action || '').includes('delete') ? 'red' : (log.action || '').includes('login') ? 'green' : 'blue',
              children: (
                <div>
                  <Flex orientation="horizontal" justify="space-between" align="center">
                    <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, fontSize: 10 }}>
                      {(log.action || 'ACTION').toUpperCase()}
                    </Tag>
                    <Text style={{ fontSize: 11, color: adminTheme.subtext }}>
                      {new Date(log.created_at).toLocaleString()}
                    </Text>
                  </Flex>
                  <Text style={{ fontSize: 12, color: adminTheme.text, display: 'block', marginTop: 4 }}>
                    Table: <code>{log.table_name}</code> (Record: {log.record_id || 'N/A'})
                  </Text>
                  <Text style={{ fontSize: 11, color: adminTheme.subtext }}>
                    IP: {log.ip_address || '127.0.0.1'}
                  </Text>
                </div>
              )
            }))}
          />
        )}
      </Drawer>
    </Space>
  );
};

export default UserManagement;
