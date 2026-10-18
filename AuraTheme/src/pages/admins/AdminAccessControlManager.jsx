import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Input,
  Tag,
  Space,
  Flex,
  Modal,
  Form,
  Select,
  Switch,
  Typography,
  Tabs,
  Badge,
  Tooltip,
  Divider,
  Popconfirm,
  message,
  Statistic,
  Alert,
  Checkbox,
  Drawer,
  Empty,
  Collapse
} from 'antd';
import {
  SafetyCertificateOutlined,
  UsergroupAddOutlined,
  KeyOutlined,
  ShopOutlined,
  AuditOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckOutlined,
  CrownOutlined,
  SaveOutlined,
  UserOutlined,
  LockOutlined,
  FilterOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

export default function AdminAccessControlManager({ initialTab = 'groups' }) {
  const adminTheme = useAdminTheme();
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------------------------------
  // STATE: Groups & Roles
  // --------------------------------------------------------------------------
  const [groups, setGroups] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [groupForm] = Form.useForm();

  // --------------------------------------------------------------------------
  // STATE: Permission Matrix
  // --------------------------------------------------------------------------
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [permissionKeys, setPermissionKeys] = useState([]);
  const [groupPermissions, setGroupPermissions] = useState(new Set());
  const [initialGroupPermissions, setInitialGroupPermissions] = useState(new Set());
  const [permissionSearch, setPermissionSearch] = useState('');
  const [permissionAreaFilter, setPermissionAreaFilter] = useState('all');
  const [savingPermissions, setSavingPermissions] = useState(false);

  // --------------------------------------------------------------------------
  // STATE: Pending Suppliers
  // --------------------------------------------------------------------------
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // --------------------------------------------------------------------------
  // STATE: User Overrides & Branches
  // --------------------------------------------------------------------------
  const [usersList, setUsersList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [selectedUserForBranches, setSelectedUserForBranches] = useState(null);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [userAssignedBranchIds, setUserAssignedBranchIds] = useState([]);
  const [userDefaultBillerId, setUserDefaultBillerId] = useState(null);
  const [savingBranches, setSavingBranches] = useState(false);

  const [selectedUserForOverrides, setSelectedUserForOverrides] = useState(null);
  const [overrideDrawerVisible, setOverrideDrawerVisible] = useState(false);
  const [userOverrides, setUserOverrides] = useState([]);
  const [savingOverrideKey, setSavingOverrideKey] = useState(null);

  // --------------------------------------------------------------------------
  // STATE: Telemetry & Logs
  // --------------------------------------------------------------------------
  const [loginLogs, setLoginLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logAreaFilter, setLogAreaFilter] = useState('all');
  const [logStatusFilter, setLogStatusFilter] = useState('all');

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // --------------------------------------------------------------------------
  // DATA FETCHING
  // --------------------------------------------------------------------------
  const fetchGroups = async () => {
    try {
      const res = await axios.get('/api/admin/access/groups', { headers: getAuthHeader() });
      if (res.data?.success) {
        setGroups(res.data.data || []);
        if (!selectedGroupId && res.data.data?.length > 0) {
          // Select admin or manager by default for the matrix tab
          const defaultGrp = res.data.data.find(g => g.level === 2) || res.data.data[0];
          setSelectedGroupId(defaultGrp.id);
        }
      }
    } catch (err) {
      console.warn('Error fetching groups:', err.message);
    }
  };

  const fetchPermissionKeys = async () => {
    try {
      const res = await axios.get('/api/admin/access/permission-keys', { headers: getAuthHeader() });
      if (res.data?.success) {
        setPermissionKeys(res.data.data?.catalog || []);
      }
    } catch (err) {
      console.warn('Error fetching permission keys:', err.message);
    }
  };

  const fetchGroupPermissions = async (groupId) => {
    if (!groupId) return;
    try {
      const res = await axios.get(`/api/admin/access/groups/${groupId}/permissions`, { headers: getAuthHeader() });
      if (res.data?.success) {
        const keySet = new Set(res.data.data?.permissions || []);
        setGroupPermissions(keySet);
        setInitialGroupPermissions(new Set(keySet));
      }
    } catch (err) {
      console.warn('Error fetching group permissions:', err.message);
    }
  };

  const fetchPendingSuppliers = async () => {
    try {
      const res = await axios.get('/api/admin/access/suppliers/pending', { headers: getAuthHeader() });
      if (res.data?.success) {
        setPendingSuppliers(res.data.data || []);
      }
    } catch (err) {
      console.warn('Error fetching pending suppliers:', err.message);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get('/api/admin/access/branches', { headers: getAuthHeader() });
      if (res.data?.success) {
        setBranchesList(res.data.data || []);
      }
    } catch (err) {
      console.warn('Error fetching branches:', err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users', {
        headers: getAuthHeader(),
        params: { limit: 100 }
      });
      if (res.data?.success) {
        setUsersList(res.data.data || []);
      }
    } catch (err) {
      console.warn('Error fetching users:', err.message);
    }
  };

  const fetchLogs = async () => {
    try {
      const [loginRes, auditRes] = await Promise.all([
        axios.get('/api/admin/access/logs/logins', {
          headers: getAuthHeader(),
          params: { area: logAreaFilter === 'all' ? undefined : logAreaFilter, limit: 50 }
        }),
        axios.get('/api/admin/access/logs/audit-trails', {
          headers: getAuthHeader(),
          params: { limit: 50 }
        })
      ]);
      if (loginRes.data?.success) setLoginLogs(loginRes.data.data || []);
      if (auditRes.data?.success) setAuditLogs(auditRes.data.data || []);
    } catch (err) {
      console.warn('Error fetching logs:', err.message);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchGroups(),
      fetchPermissionKeys(),
      fetchPendingSuppliers(),
      fetchBranches(),
      fetchUsers(),
      fetchLogs()
    ]);
    if (selectedGroupId) {
      await fetchGroupPermissions(selectedGroupId);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupPermissions(selectedGroupId);
    }
  }, [selectedGroupId]);

  // --------------------------------------------------------------------------
  // HANDLERS: Group Policies
  // --------------------------------------------------------------------------
  const handleToggleGroupSwitch = async (group, field, checked) => {
    try {
      await axios.put(
        `/api/admin/access/groups/${group.id}`,
        { [field]: checked ? 1 : 0 },
        { headers: getAuthHeader() }
      );
      message.success(`Updated ${field} for role '${group.name}'`);
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, [field]: checked ? 1 : 0 } : g));
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update group policy');
    }
  };

  const handleOpenEditGroup = (group) => {
    setEditingGroup(group);
    groupForm.setFieldsValue({
      name: group.name,
      description: group.description,
      level: group.level,
      allow_admin_login: Boolean(group.allow_admin_login),
      allow_web_login: Boolean(group.allow_web_login),
      allow_web_register: Boolean(group.allow_web_register),
      requires_approval: Boolean(group.requires_approval)
    });
    setGroupModalVisible(true);
  };

  const handleSaveGroupModal = async () => {
    try {
      const values = await groupForm.validateFields();
      await axios.put(
        `/api/admin/access/groups/${editingGroup.id}`,
        values,
        { headers: getAuthHeader() }
      );
      message.success(`Group '${editingGroup.name}' updated successfully!`);
      setGroupModalVisible(false);
      fetchGroups();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Failed to save group');
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: Permission Matrix
  // --------------------------------------------------------------------------
  const selectedGroup = useMemo(() => {
    return groups.find(g => g.id === Number(selectedGroupId));
  }, [groups, selectedGroupId]);

  const isOwnerSelected = selectedGroup?.level === 1;

  // Filtered permission catalogue
  const filteredCatalog = useMemo(() => {
    const search = permissionSearch.trim().toLowerCase();
    return permissionKeys
      .filter(item => {
        if (permissionAreaFilter !== 'all' && item.area !== permissionAreaFilter) return false;
        if (!search) return true;
        return (
          item.permission_key.toLowerCase().includes(search) ||
          item.module.toLowerCase().includes(search) ||
          item.action.toLowerCase().includes(search) ||
          (item.label && item.label.toLowerCase().includes(search))
        );
      });
  }, [permissionKeys, permissionSearch, permissionAreaFilter]);

  // Group filtered catalog by module
  const catalogByModule = useMemo(() => {
    const groups = {};
    filteredCatalog.forEach(pk => {
      const mod = pk.module || 'general';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(pk);
    });
    return groups;
  }, [filteredCatalog]);

  const handleToggleSinglePermission = (key, checked) => {
    setGroupPermissions(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleToggleModulePermissions = (moduleKeys, enable) => {
    setGroupPermissions(prev => {
      const next = new Set(prev);
      moduleKeys.forEach(k => {
        if (enable) next.add(k.permission_key);
        else next.delete(k.permission_key);
      });
      return next;
    });
  };

  const handleSaveGroupPermissions = async () => {
    if (!selectedGroupId || isOwnerSelected) return;
    setSavingPermissions(true);
    try {
      const keysArray = Array.from(groupPermissions);
      await axios.put(
        `/api/admin/access/groups/${selectedGroupId}/permissions`,
        { permissions: keysArray },
        { headers: getAuthHeader() }
      );
      message.success(`Saved ${keysArray.length} permissions for role '${selectedGroup?.name}'`);
      setInitialGroupPermissions(new Set(groupPermissions));
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const hasUnsavedMatrixChanges = useMemo(() => {
    if (groupPermissions.size !== initialGroupPermissions.size) return true;
    for (let k of groupPermissions) {
      if (!initialGroupPermissions.has(k)) return true;
    }
    return false;
  }, [groupPermissions, initialGroupPermissions]);

  // --------------------------------------------------------------------------
  // HANDLERS: Supplier Approval
  // --------------------------------------------------------------------------
  const handleApproveSupplier = async (supplierId, username) => {
    setActionLoadingId(supplierId);
    try {
      await axios.put(`/api/admin/access/suppliers/${supplierId}/approve`, {}, { headers: getAuthHeader() });
      message.success(`Supplier @${username} approved successfully! Account is now active.`);
      fetchPendingSuppliers();
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to approve supplier');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSupplier = async (supplierId, username) => {
    setActionLoadingId(supplierId);
    try {
      await axios.put(
        `/api/admin/access/suppliers/${supplierId}/reject`,
        { reason: 'Application does not meet commercial criteria' },
        { headers: getAuthHeader() }
      );
      message.info(`Supplier @${username} application rejected.`);
      fetchPendingSuppliers();
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to reject supplier');
    } finally {
      setActionLoadingId(null);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: User Branch Assignments
  // --------------------------------------------------------------------------
  const handleOpenUserBranches = async (u) => {
    setSelectedUserForBranches(u);
    setUserAssignedBranchIds([]);
    setUserDefaultBillerId(null);
    setBranchModalVisible(true);
    try {
      const res = await axios.get(`/api/admin/access/users/${u.id}/branches`, { headers: getAuthHeader() });
      if (res.data?.success) {
        const branches = res.data.data?.branches || [];
        setUserAssignedBranchIds(branches.map(b => b.id));
        const def = branches.find(b => b.is_default);
        if (def) setUserDefaultBillerId(def.id);
      }
    } catch (err) {
      console.warn('Error fetching user branches:', err.message);
    }
  };

  const handleSaveUserBranches = async () => {
    if (!selectedUserForBranches) return;
    setSavingBranches(true);
    try {
      await axios.put(
        `/api/admin/access/users/${selectedUserForBranches.id}/branches`,
        {
          branchIds: userAssignedBranchIds,
          defaultBillerId: userDefaultBillerId || (userAssignedBranchIds[0] || null)
        },
        { headers: getAuthHeader() }
      );
      message.success(`Branch scoping updated for @${selectedUserForBranches.username}`);
      setBranchModalVisible(false);
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to update branches');
    } finally {
      setSavingBranches(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: User Overrides
  // --------------------------------------------------------------------------
  const handleOpenUserOverrides = async (u) => {
    setSelectedUserForOverrides(u);
    setOverrideDrawerVisible(true);
    try {
      const res = await axios.get(`/api/admin/access/users/${u.id}/overrides`, { headers: getAuthHeader() });
      if (res.data?.success) {
        setUserOverrides(res.data.data?.overrides || []);
      }
    } catch (err) {
      console.warn('Error fetching overrides:', err.message);
    }
  };

  const handleSetUserOverride = async (key, effect) => {
    if (!selectedUserForOverrides) return;
    setSavingOverrideKey(key);
    try {
      await axios.put(
        `/api/admin/access/users/${selectedUserForOverrides.id}/overrides`,
        { permissionKey: key, effect },
        { headers: getAuthHeader() }
      );
      message.success(`Override for '${key}' set to '${effect}'`);
      const res = await axios.get(`/api/admin/access/users/${selectedUserForOverrides.id}/overrides`, { headers: getAuthHeader() });
      if (res.data?.success) {
        setUserOverrides(res.data.data?.overrides || []);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save override');
    } finally {
      setSavingOverrideKey(null);
    }
  };

  // --------------------------------------------------------------------------
  // STYLES
  // --------------------------------------------------------------------------
  const cardStyle = {
    borderRadius: 14,
    border: `1px solid ${adminTheme.sidebarBorder || 'rgba(255, 255, 255, 0.08)'}`,
    background: adminTheme.card || '#ffffff',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden'
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Header Banner & KPIs */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
        <div>
          <Flex align="center" gap={10}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 22,
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
            }}>
              <SafetyCertificateOutlined />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, color: adminTheme.text, fontWeight: 700 }}>
                {t('access_control_governance', 'Access Control & Role Governance')}
              </Title>
              <Text style={{ color: adminTheme.subtext, fontSize: 13 }}>
                {t('access_control_desc', 'Multi-tier privilege matrix • Single-source aura_users • Strict branch scoping • Real-time audit trails')}
              </Text>
            </div>
          </Flex>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={refreshAll}
            style={{ borderRadius: 8 }}
          >
            {t('refresh_telemetry', 'Refresh Telemetry')}
          </Button>
        </Space>
      </Flex>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<Text style={{ color: adminTheme.subtext, fontSize: 12, fontWeight: 600 }}>ROLE PROFILES</Text>}
              value={groups.length}
              prefix={<UsergroupAddOutlined style={{ color: '#6366f1', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: adminTheme.text }}
            />
            <Text style={{ color: adminTheme.subtext, fontSize: 11 }}>Configured in aura_groups</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<Text style={{ color: adminTheme.subtext, fontSize: 12, fontWeight: 600 }}>PERMISSION KEYS</Text>}
              value={permissionKeys.length || 777}
              prefix={<KeyOutlined style={{ color: '#10b981', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: adminTheme.text }}
            />
            <Text style={{ color: adminTheme.subtext, fontSize: 11 }}>Normalized action tokens</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<Text style={{ color: adminTheme.subtext, fontSize: 12, fontWeight: 600 }}>PENDING SUPPLIERS</Text>}
              value={pendingSuppliers.length}
              prefix={<ShopOutlined style={{ color: pendingSuppliers.length > 0 ? '#ef4444' : '#6b7280', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: pendingSuppliers.length > 0 ? '#ef4444' : adminTheme.text }}
            />
            <Text style={{ color: adminTheme.subtext, fontSize: 11 }}>Awaiting verification</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={cardStyle} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<Text style={{ color: adminTheme.subtext, fontSize: 12, fontWeight: 600 }}>ACTIVE BRANCHES</Text>}
              value={branchesList.length}
              prefix={<ApartmentOutlined style={{ color: '#0284c7', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: adminTheme.text }}
            />
            <Text style={{ color: adminTheme.subtext, fontSize: 11 }}>Stores / billers in aura_companies</Text>
          </Card>
        </Col>
      </Row>

      {/* 2. Main Tab Navigation */}
      <Card style={cardStyle} bodyStyle={{ padding: '16px 20px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="line"
          items={[
            {
              key: 'groups',
              label: (
                <Space>
                  <UsergroupAddOutlined />
                  <span>{t('roles_group_policies', 'Roles & Group Policies')}</span>
                  <Badge count={groups.length} style={{ backgroundColor: '#6366f1' }} />
                </Space>
              ),
              children: (
                <div style={{ marginTop: 8 }}>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <div>
                      <Title level={5} style={{ margin: 0, color: adminTheme.text }}>
                        {t('defined_system_roles_title', 'Defined System Roles & Ingress Rules')}
                      </Title>
                      <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>
                        {t('defined_system_roles_desc', 'Control which user roles may access the Administrative ERP (/admins) vs Customer Web Portal (/shop), and registration approval policies.')}
                      </Text>
                    </div>
                  </Flex>

                  <Table
                    dataSource={groups}
                    rowKey="id"
                    pagination={false}
                    bordered
                    columns={[
                      {
                        title: t('role_id_name', 'Role ID & Name'),
                        key: 'name',
                        width: 200,
                        render: (_, record) => (
                          <Flex vertical>
                            <Flex align="center" gap={6}>
                              <Text strong style={{ color: adminTheme.text, textTransform: 'capitalize' }}>
                                {t(record.name?.toLowerCase(), record.name)}
                              </Text>
                              {record.level === 1 && (
                                <Tooltip title={t('owner_bypass_tooltip', 'Enterprise Owner - Bypasses all permissions')}>
                                  <CrownOutlined style={{ color: '#f59e0b' }} />
                                </Tooltip>
                              )}
                            </Flex>
                            <Text style={{ color: adminTheme.subtext, fontSize: 11 }}>
                              {record.description || t('system_defined_role', 'System defined role')}
                            </Text>
                          </Flex>
                        )
                      },
                      {
                        title: t('privilege_level', 'Privilege Level'),
                        dataIndex: 'level',
                        key: 'level',
                        width: 140,
                        align: 'center',
                        render: (lvl) => {
                          const color = lvl === 1 ? 'purple' : lvl === 2 ? 'blue' : lvl === 3 ? 'cyan' : lvl === 4 ? 'orange' : 'green';
                          return (
                            <Tag color={color} style={{ fontWeight: 700, borderRadius: 6, fontSize: 11 }}>
                              {t('level', 'LEVEL')} {lvl} {lvl === 1 ? `(${t('owner', 'OWNER')})` : ''}
                            </Tag>
                          );
                        }
                      },
                      {
                        title: t('admin_login_perm', 'Admin Login (/admins)'),
                        key: 'allow_admin_login',
                        width: 180,
                        align: 'center',
                        render: (_, record) => (
                          <Flex align="center" justify="center" gap={8}>
                            <Switch
                              checked={Boolean(record.allow_admin_login)}
                              disabled={record.level === 1}
                              onChange={(val) => handleToggleGroupSwitch(record, 'allow_admin_login', val)}
                            />
                            <Text style={{ fontSize: 11, color: record.allow_admin_login ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                              {record.allow_admin_login ? t('allowed', 'Allowed') : t('blocked', 'Blocked')}
                            </Text>
                          </Flex>
                        )
                      },
                      {
                        title: t('web_login_perm', 'Web Login (/shop)'),
                        key: 'allow_web_login',
                        width: 170,
                        align: 'center',
                        render: (_, record) => (
                          <Flex align="center" justify="center" gap={8}>
                            <Switch
                              checked={Boolean(record.allow_web_login)}
                              onChange={(val) => handleToggleGroupSwitch(record, 'allow_web_login', val)}
                            />
                            <Text style={{ fontSize: 11, color: record.allow_web_login ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                              {record.allow_web_login ? t('allowed', 'Allowed') : t('blocked', 'Blocked')}
                            </Text>
                          </Flex>
                        )
                      },
                      {
                        title: t('public_register', 'Public Register'),
                        key: 'allow_web_register',
                        width: 160,
                        align: 'center',
                        render: (_, record) => (
                          <Flex align="center" justify="center" gap={8}>
                            <Switch
                              checked={Boolean(record.allow_web_register)}
                              onChange={(val) => handleToggleGroupSwitch(record, 'allow_web_register', val)}
                            />
                            <Text style={{ fontSize: 11, color: record.allow_web_register ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                              {record.allow_web_register ? t('public', 'Public') : t('closed', 'Closed')}
                            </Text>
                          </Flex>
                        )
                      },
                      {
                        title: t('requires_approval', 'Requires Approval'),
                        key: 'requires_approval',
                        width: 170,
                        align: 'center',
                        render: (_, record) => (
                          <Flex align="center" justify="center" gap={8}>
                            <Switch
                              checked={Boolean(record.requires_approval)}
                              onChange={(val) => handleToggleGroupSwitch(record, 'requires_approval', val)}
                            />
                            <Text style={{ fontSize: 11, color: record.requires_approval ? '#ea580c' : '#94a3b8', fontWeight: 600 }}>
                              {record.requires_approval ? t('required', 'Required') : t('auto_active', 'Auto-Active')}
                            </Text>
                          </Flex>
                        )
                      },
                      {
                        title: t('active_users', 'Active Users'),
                        dataIndex: 'user_count',
                        key: 'user_count',
                        width: 120,
                        align: 'center',
                        render: (cnt) => (
                          <Tag style={{ borderRadius: 6, fontWeight: 700 }}>
                            {cnt || 0} {t('users', 'Users')}
                          </Tag>
                        )
                      },
                      {
                        title: t('actions', 'Actions'),
                        key: 'actions',
                        width: 220,
                        align: 'center',
                        render: (_, record) => (
                          <Space>
                            <Button
                              size="small"
                              icon={<KeyOutlined />}
                              onClick={() => {
                                setSelectedGroupId(record.id);
                                setActiveTab('matrix');
                              }}
                              style={{ borderRadius: 6 }}
                            >
                              {t('permissions', 'Permissions')}
                            </Button>
                            <Button
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleOpenEditGroup(record)}
                              style={{ borderRadius: 6 }}
                            >
                              {t('policy', 'Policy')}
                            </Button>
                          </Space>
                        )
                      }
                    ]}
                  />
                </div>
              )
            },
            {
              key: 'matrix',
              label: (
                <Space>
                  <KeyOutlined />
                  <span>{t('permission_matrix', 'Permission Matrix (777 Keys)')}</span>
                  {hasUnsavedMatrixChanges && (
                    <Badge dot style={{ backgroundColor: '#f59e0b' }} />
                  )}
                </Space>
              ),
              children: (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Matrix Toolbar */}
                  <Card style={{ background: adminTheme.cardMuted || 'rgba(0,0,0,0.02)', borderRadius: 10 }}>
                    <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                      <Space size={16} wrap>
                        <div>
                          <Text style={{ fontSize: 11, fontWeight: 700, color: adminTheme.subtext, display: 'block', textTransform: 'uppercase' }}>
                            Target Role / Group
                          </Text>
                          <Select
                            value={selectedGroupId}
                            onChange={(val) => setSelectedGroupId(val)}
                            style={{ width: 220 }}
                          >
                            {groups.map(g => (
                              <Option key={g.id} value={g.id}>
                                <Space>
                                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{g.name}</span>
                                  <Tag color={g.level === 1 ? 'purple' : 'blue'} style={{ fontSize: 10, margin: 0 }}>
                                    L{g.level}
                                  </Tag>
                                </Space>
                              </Option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <Text style={{ fontSize: 11, fontWeight: 700, color: adminTheme.subtext, display: 'block', textTransform: 'uppercase' }}>
                            Search Action Key
                          </Text>
                          <Input
                            placeholder="Search (e.g. products, sales, add)..."
                            prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
                            value={permissionSearch}
                            onChange={e => setPermissionSearch(e.target.value)}
                            allowClear
                            style={{ width: 240, borderRadius: 6 }}
                          />
                        </div>

                        <div>
                          <Text style={{ fontSize: 11, fontWeight: 700, color: adminTheme.subtext, display: 'block', textTransform: 'uppercase' }}>
                            Ingress Area
                          </Text>
                          <Select
                            value={permissionAreaFilter}
                            onChange={setPermissionAreaFilter}
                            style={{ width: 140 }}
                          >
                            <Option value="all">All Areas</Option>
                            <Option value="admin">Admin ERP</Option>
                            <Option value="web">Web Portal</Option>
                          </Select>
                        </div>
                      </Space>

                      {!isOwnerSelected && (
                        <Space>
                          <Button
                            onClick={() => {
                              filteredCatalog.forEach(pk => handleToggleSinglePermission(pk.permission_key, true));
                            }}
                            size="small"
                          >
                            Select All Visible
                          </Button>
                          <Button
                            onClick={() => {
                              filteredCatalog.forEach(pk => handleToggleSinglePermission(pk.permission_key, false));
                            }}
                            size="small"
                          >
                            Clear Visible
                          </Button>
                          <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={savingPermissions}
                            disabled={!hasUnsavedMatrixChanges}
                            onClick={handleSaveGroupPermissions}
                            style={{ borderRadius: 6, background: '#16a34a', borderColor: '#16a34a' }}
                          >
                            Save {groupPermissions.size} Permissions
                          </Button>
                        </Space>
                      )}
                    </Flex>
                  </Card>

                  {/* Owner Full Bypass Notice */}
                  {isOwnerSelected ? (
                    <Alert
                      type="success"
                      showIcon
                      icon={<CrownOutlined style={{ fontSize: 24, color: '#7c3aed' }} />}
                      message={<Text strong style={{ fontSize: 15 }}>Enterprise Owner (Level 1) - Complete Unrestricted Authority</Text>}
                      description={
                        <div>
                          By core architectural design, the <b>Enterprise Owner</b> tier bypasses all individual permission evaluations via <Tag color="purple">aura_user_can()</Tag>.
                          All 777 operational endpoints, submodules, financial reports, and administrative switches are permanently accessible to users in this group.
                        </div>
                      }
                      style={{ borderRadius: 12, padding: 20 }}
                    />
                  ) : (
                    <div>
                      {hasUnsavedMatrixChanges && (
                        <Alert
                          type="warning"
                          showIcon
                          message="You have unsaved permission modifications. Click 'Save Permissions' to persist your changes to aura_group_permissions."
                          style={{ marginBottom: 16, borderRadius: 8 }}
                        />
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {Object.keys(catalogByModule).length === 0 ? (
                          <Empty description="No permission keys match the current filter" />
                        ) : (
                          Object.entries(catalogByModule).map(([modName, items]) => {
                            const allModuleKeysActive = items.every(pk => groupPermissions.has(pk.permission_key));
                            const someModuleKeysActive = items.some(pk => groupPermissions.has(pk.permission_key));
                            const activeCount = items.filter(pk => groupPermissions.has(pk.permission_key)).length;

                            return (
                              <Card
                                key={modName}
                                size="small"
                                style={{
                                  borderRadius: 10,
                                  border: `1px solid ${adminTheme.sidebarBorder || 'rgba(0,0,0,0.08)'}`,
                                  background: adminTheme.card
                                }}
                                title={
                                  <Flex justify="space-between" align="center">
                                    <Space>
                                      <Checkbox
                                        checked={allModuleKeysActive}
                                        indeterminate={someModuleKeysActive && !allModuleKeysActive}
                                        onChange={(e) => handleToggleModulePermissions(items, e.target.checked)}
                                      />
                                      <Text strong style={{ textTransform: 'uppercase', fontSize: 13, color: adminTheme.text }}>
                                        {modName}
                                      </Text>
                                    </Space>
                                    <Tag color={activeCount > 0 ? 'blue' : 'default'} style={{ borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                                      {activeCount} / {items.length} Enabled
                                    </Tag>
                                  </Flex>
                                }
                              >
                                <Row gutter={[10, 10]}>
                                  {items.map(pk => {
                                    const isChecked = groupPermissions.has(pk.permission_key);
                                    return (
                                      <Col xs={24} sm={12} md={8} lg={6} key={pk.permission_key}>
                                        <div
                                          onClick={() => handleToggleSinglePermission(pk.permission_key, !isChecked)}
                                          style={{
                                            padding: '8px 12px',
                                            borderRadius: 8,
                                            border: isChecked ? `1px solid ${adminTheme.primary}` : `1px solid ${adminTheme.sidebarBorder || 'rgba(0,0,0,0.06)'}`,
                                            background: isChecked ? adminTheme.sidebarActiveBg : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.15s ease'
                                          }}
                                        >
                                          <Space size={8} style={{ overflow: 'hidden' }}>
                                            <Checkbox
                                              checked={isChecked}
                                              onChange={(e) => handleToggleSinglePermission(pk.permission_key, e.target.checked)}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <div style={{ overflow: 'hidden' }}>
                                              <Text style={{ fontSize: 12, fontWeight: isChecked ? 600 : 400, display: 'block' }} className="truncate">
                                                {pk.action || pk.permission_key}
                                              </Text>
                                              <Text style={{ fontSize: 10, color: adminTheme.subtext, display: 'block' }} className="truncate">
                                                {pk.permission_key}
                                              </Text>
                                            </div>
                                          </Space>

                                          <Tag color={pk.area === 'web' ? 'cyan' : 'geekblue'} style={{ fontSize: 9, margin: 0, padding: '0 4px' }}>
                                            {pk.area}
                                          </Tag>
                                        </div>
                                      </Col>
                                    );
                                  })}
                                </Row>
                              </Card>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'pending-suppliers',
              label: (
                <Space>
                  <ShopOutlined />
                  <span>{t('supplier_approvals', 'Pending Supplier Approvals')}</span>
                  {pendingSuppliers.length > 0 && (
                    <Badge count={pendingSuppliers.length} style={{ backgroundColor: '#ef4444' }} />
                  )}
                </Space>
              ),
              children: (
                <div style={{ marginTop: 8 }}>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <div>
                      <Title level={5} style={{ margin: 0, color: adminTheme.text }}>
                        {t('supplier_verification_queue', 'Supplier Verification Queue')}
                      </Title>
                      <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>
                        {t('supplier_verification_desc', 'New suppliers registered via the B2B web portal are held in pending status until approved by an administrator in accordance with security policies.')}
                      </Text>
                    </div>
                  </Flex>

                  {pendingSuppliers.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={t('no_suppliers_awaiting_review', 'No suppliers currently awaiting review. All supplier accounts are verified!')}
                    />
                  ) : (
                    <Table
                      dataSource={pendingSuppliers}
                      rowKey="id"
                      bordered
                      pagination={{ pageSize: 10 }}
                      columns={[
                        {
                          title: t('applicant_supplier', 'Applicant / Supplier'),
                          key: 'applicant',
                          render: (_, record) => (
                            <Flex vertical>
                              <Text strong style={{ color: adminTheme.text, fontSize: 13.5 }}>
                                {record.name || record.username}
                              </Text>
                              <Text style={{ color: adminTheme.subtext, fontSize: 11 }}>
                                @{record.username} &bull; ID: #{record.id}
                              </Text>
                            </Flex>
                          )
                        },
                        {
                          title: t('company_business', 'Company / Business'),
                          dataIndex: 'company',
                          key: 'company',
                          render: (comp) => (
                            <Text strong style={{ color: '#2563eb' }}>
                              {comp || t('independent_vendor', 'Independent Vendor')}
                            </Text>
                          )
                        },
                        {
                          title: t('contact_details', 'Contact Details'),
                          key: 'contact',
                          render: (_, record) => (
                            <Flex vertical>
                              <Text style={{ fontSize: 12 }}>{record.email}</Text>
                              <Text style={{ fontSize: 11, color: adminTheme.subtext }}>{record.phone || t('no_phone_provided', 'No phone provided')}</Text>
                            </Flex>
                          )
                        },
                        {
                          title: t('registered_at', 'Registered At'),
                          dataIndex: 'created_at',
                          key: 'created_at',
                          render: (dt) => (
                            <Text style={{ fontSize: 12 }}>
                              {dt ? new Date(dt).toLocaleString() : t('recent', 'Recent')}
                            </Text>
                          )
                        },
                        {
                          title: t('status', 'Status'),
                          dataIndex: 'status',
                          key: 'status',
                          render: (st) => (
                            <Tag color="volcano" style={{ fontWeight: 700, borderRadius: 6 }}>
                              {t('pending_approval', 'PENDING APPROVAL')}
                            </Tag>
                          )
                        },
                        {
                          title: t('decision_action', 'Decision Action'),
                          key: 'actions',
                          align: 'center',
                          render: (_, record) => (
                            <Space>
                              <Button
                                type="primary"
                                size="small"
                                icon={<CheckOutlined />}
                                loading={actionLoadingId === record.id}
                                onClick={() => handleApproveSupplier(record.id, record.username)}
                                style={{ background: '#16a34a', borderColor: '#16a34a', borderRadius: 6 }}
                              >
                                {t('approve', 'Approve')}
                              </Button>
                              <Popconfirm
                                title={t('reject_supplier', 'Reject Supplier')}
                                description={t('confirm_reject_supplier', "Are you sure you want to decline this supplier's application?")}
                                onConfirm={() => handleRejectSupplier(record.id, record.username)}
                                okText={t('yes_reject', 'Yes, Reject')}
                                cancelText={t('cancel', 'Cancel')}
                              >
                                <Button
                                  danger
                                  size="small"
                                  icon={<CloseCircleOutlined />}
                                  loading={actionLoadingId === record.id}
                                  style={{ borderRadius: 6 }}
                                >
                                  {t('reject', 'Reject')}
                                </Button>
                              </Popconfirm>
                            </Space>
                          )
                        }
                      ]}
                    />
                  )}
                </div>
              )
            },
            {
              key: 'branch-scoping',
              label: (
                <Space>
                  <ApartmentOutlined />
                  <span>{t('branch_scoping', 'Branch Assignment & Per-User Overrides')}</span>
                </Space>
              ),
              children: (
                <div style={{ marginTop: 8 }}>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <div>
                      <Title level={5} style={{ margin: 0, color: adminTheme.text }}>
                        {t('user_branch_boundaries_title', 'User Branch Boundaries & Individual Permission Overrides')}
                      </Title>
                      <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>
                        Assign which branch stores (<Tag color="blue">aura_user_billers</Tag>) an operator may transact in, or set granular per-user overrides (<Tag color="cyan">aura_user_permissions</Tag> where deny wins).
                      </Text>
                    </div>
                  </Flex>

                  <Table
                    dataSource={usersList}
                    rowKey="id"
                    bordered
                    pagination={{ pageSize: 12 }}
                    columns={[
                      {
                        title: 'User',
                        key: 'user',
                        render: (_, record) => (
                          <Space orientation="horizontal" size={10}>
                            <div style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              background: '#e0e7ff',
                              color: '#4338ca',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700
                            }}>
                              {record.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <Text strong style={{ color: adminTheme.text, display: 'block' }}>
                                {record.first_name ? `${record.first_name} ${record.last_name || ''}` : record.username}
                              </Text>
                              <Text style={{ color: adminTheme.subtext, fontSize: 11 }}>
                                @{record.username} &bull; {record.email}
                              </Text>
                            </div>
                          </Space>
                        )
                      },
                      {
                        title: 'Role',
                        dataIndex: 'role',
                        key: 'role',
                        render: (role, record) => (
                          <Tag color={record.level === 1 ? 'purple' : 'blue'} style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                            {role || 'staff'}
                          </Tag>
                        )
                      },
                      {
                        title: 'Assigned Branches',
                        key: 'branches_count',
                        render: (_, record) => (
                          <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600 }}>
                            <ShopOutlined style={{ marginRight: 4 }} />
                            Multi-Branch Enabled
                          </Tag>
                        )
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: (st) => (
                          <Tag color={st === 'active' ? 'green' : 'default'} style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                            {st || 'active'}
                          </Tag>
                        )
                      },
                      {
                        title: 'Governance Actions',
                        key: 'actions',
                        align: 'center',
                        render: (_, record) => (
                          <Space>
                            <Button
                              size="small"
                              icon={<ShopOutlined />}
                              onClick={() => handleOpenUserBranches(record)}
                              style={{ borderRadius: 6 }}
                            >
                              Assign Branches
                            </Button>
                            <Button
                              size="small"
                              icon={<LockOutlined />}
                              onClick={() => handleOpenUserOverrides(record)}
                              style={{ borderRadius: 6 }}
                            >
                              Overrides
                            </Button>
                          </Space>
                        )
                      }
                    ]}
                  />
                </div>
              )
            },
            {
              key: 'telemetry',
              label: (
                <Space>
                  <HistoryOutlined />
                  <span>{t('audit_trails', 'Security Telemetry & Audit Logs')}</span>
                </Space>
              ),
              children: (
                <div style={{ marginTop: 8 }}>
                  <Tabs
                    type="card"
                    items={[
                      {
                        key: 'logins',
                        label: 'Login Telemetry & Lockouts',
                        children: (
                          <div style={{ marginTop: 12 }}>
                            <Table
                              dataSource={loginLogs}
                              rowKey="id"
                              bordered
                              pagination={{ pageSize: 12 }}
                              columns={[
                                {
                                  title: 'Timestamp',
                                  dataIndex: 'login_at',
                                  key: 'login_at',
                                  width: 180,
                                  render: (t) => <Text style={{ fontSize: 12 }}>{t ? new Date(t).toLocaleString() : 'Just now'}</Text>
                                },
                                {
                                  title: 'Username / Account',
                                  dataIndex: 'username',
                                  key: 'username',
                                  render: (un) => <Text strong style={{ color: adminTheme.text }}>@{un}</Text>
                                },
                                {
                                  title: 'Ingress Area',
                                  dataIndex: 'area',
                                  key: 'area',
                                  width: 120,
                                  render: (area) => (
                                    <Tag color={area === 'admin' ? 'blue' : 'green'} style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                                      {area}
                                    </Tag>
                                  )
                                },
                                {
                                  title: 'Result Status',
                                  dataIndex: 'success',
                                  key: 'success',
                                  width: 140,
                                  render: (sc) => (
                                    <Tag color={Number(sc) === 1 ? 'green' : 'red'} style={{ fontWeight: 700 }}>
                                      {Number(sc) === 1 ? 'SUCCESS (200)' : 'FAILED / REJECTED'}
                                    </Tag>
                                  )
                                },
                                {
                                  title: 'IP Address',
                                  dataIndex: 'ip_address',
                                  key: 'ip_address',
                                  render: (ip) => <Text code>{ip || '127.0.0.1'}</Text>
                                },
                                {
                                  title: 'User Agent / Client',
                                  dataIndex: 'user_agent',
                                  key: 'user_agent',
                                  render: (ua) => <Text style={{ fontSize: 11, color: adminTheme.subtext }} className="truncate">{ua || 'Mozilla'}</Text>
                                }
                              ]}
                            />
                          </div>
                        )
                      },
                      {
                        key: 'audits',
                        label: 'Data Modification Audit Trail (aura_user_audit_trails)',
                        children: (
                          <div style={{ marginTop: 12 }}>
                            <Table
                              dataSource={auditLogs}
                              rowKey="id"
                              bordered
                              pagination={{ pageSize: 12 }}
                              columns={[
                                {
                                  title: 'Timestamp',
                                  dataIndex: 'created_at',
                                  key: 'created_at',
                                  width: 180,
                                  render: (t) => <Text style={{ fontSize: 12 }}>{t ? new Date(t).toLocaleString() : 'Just now'}</Text>
                                },
                                {
                                  title: 'Operator',
                                  key: 'operator',
                                  render: (_, record) => (
                                    <Text strong style={{ color: adminTheme.text }}>
                                      @{record.username || `User #${record.user_id}`}
                                    </Text>
                                  )
                                },
                                {
                                  title: 'Action Code',
                                  dataIndex: 'action',
                                  key: 'action',
                                  render: (act) => (
                                    <Tag color="purple" style={{ fontWeight: 700 }}>
                                      {act}
                                    </Tag>
                                  )
                                },
                                {
                                  title: 'Target Table',
                                  dataIndex: 'table_name',
                                  key: 'table_name',
                                  render: (tbl) => <Text code style={{ color: '#2563eb' }}>{tbl}</Text>
                                },
                                {
                                  title: 'Record ID',
                                  dataIndex: 'record_id',
                                  key: 'record_id',
                                  width: 100,
                                  render: (id) => <Tag>#{id}</Tag>
                                },
                                {
                                  title: 'Client IP',
                                  dataIndex: 'ip_address',
                                  key: 'ip_address',
                                  width: 140,
                                  render: (ip) => <Text code>{ip || '127.0.0.1'}</Text>
                                }
                              ]}
                            />
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* 3. Modal: Edit Group Policies */}
      <Modal
        title={`Edit Ingress & Role Policy: ${editingGroup?.name}`}
        open={groupModalVisible}
        onCancel={() => setGroupModalVisible(false)}
        onOk={handleSaveGroupModal}
        destroyOnHidden
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item name="description" label="Role Description">
            <Input.TextArea rows={2} placeholder="Explain this role's purpose..." />
          </Form.Item>

          <Form.Item name="level" label="Privilege Level (1 = Highest, 5 = Public)">
            <Select>
              <Option value={1}>Level 1 (Enterprise Owner - Bypasses all permissions)</Option>
              <Option value={2}>Level 2 (Executive Admin & General Manager)</Option>
              <Option value={3}>Level 3 (Operational Staff, Sales, Stock, Cashier)</Option>
              <Option value={4}>Level 4 (Commercial Suppliers & Vendors)</Option>
              <Option value={5}>Level 5 (B2B Commercial Buyers & Customers)</Option>
            </Select>
          </Form.Item>

          <Divider style={{ margin: '12px 0' }} />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="allow_admin_login" label="Allow Admin Login" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="allow_web_login" label="Allow Web Login" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="allow_web_register" label="Public Registration" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="requires_approval" label="Requires Approval" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 4. Modal: Assign Branches to User */}
      <Modal
        title={`Configure Branch Scoping: @${selectedUserForBranches?.username}`}
        open={branchModalVisible}
        onCancel={() => setBranchModalVisible(false)}
        onOk={handleSaveUserBranches}
        confirmLoading={savingBranches}
        destroyOnHidden
      >
        <Text style={{ color: adminTheme.subtext, fontSize: 12, display: 'block', marginBottom: 14 }}>
          Select which branches/stores from <Text code>aura_companies</Text> this user is authorized to manage and transact with.
        </Text>

        <Checkbox.Group
          value={userAssignedBranchIds}
          onChange={(checkedVals) => setUserAssignedBranchIds(checkedVals)}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {branchesList.map(b => (
            <div
              key={b.id}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: userAssignedBranchIds.includes(b.id) ? `1px solid ${adminTheme.primary}` : `1px solid ${adminTheme.sidebarBorder || 'rgba(0,0,0,0.08)'}`,
                background: userAssignedBranchIds.includes(b.id) ? adminTheme.sidebarActiveBg : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Checkbox value={b.id}>
                <Space>
                  <Text strong>{b.name}</Text>
                  <Tag color="blue">{b.company_type || 'store'}</Tag>
                </Space>
              </Checkbox>
              <Text style={{ fontSize: 11, color: adminTheme.subtext }}>{b.city || 'HQ'}</Text>
            </div>
          ))}
        </Checkbox.Group>
      </Modal>

      {/* 5. Drawer: Granular User Overrides */}
      <Drawer
        title={`User Permission Overrides: @${selectedUserForOverrides?.username}`}
        open={overrideDrawerVisible}
        onClose={() => setOverrideDrawerVisible(false)}
        width={540}
      >
        <Alert
          type="info"
          showIcon
          message="Deny Wins Precedence"
          description="A user-level 'deny' override permanently overrides any group allowance. An 'allow' override grants access even if the group does not have it."
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Text strong>Active Individual Overrides:</Text>
          {userOverrides.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No specific individual overrides configured. User inherits group rights." />
          ) : (
            userOverrides.map(ov => (
              <div
                key={ov.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <Text strong style={{ display: 'block' }}>{ov.permission_key}</Text>
                  <Text style={{ fontSize: 11, color: adminTheme.subtext }}>Configured override</Text>
                </div>
                <Space>
                  <Tag color={ov.effect === 'deny' ? 'red' : 'green'} style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    {ov.effect}
                  </Tag>
                  <Button
                    size="small"
                    danger
                    onClick={() => handleSetUserOverride(ov.permission_key, 'clear')}
                    loading={savingOverrideKey === ov.permission_key}
                  >
                    Clear
                  </Button>
                </Space>
              </div>
            ))
          )}
        </div>
      </Drawer>
    </div>
  );
}
