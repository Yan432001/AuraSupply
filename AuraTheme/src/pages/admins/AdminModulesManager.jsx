import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Switch,
  Typography,
  Tag,
  Input,
  Button,
  Space,
  Flex,
  Badge,
  Alert,
  Tooltip,
  Divider,
  Statistic,
  Modal,
  Drawer,
  Form,
  Collapse,
  Table,
  Checkbox,
  Radio,
  message,
  Popconfirm
} from 'antd';
import {
  AppstoreOutlined,
  BuildOutlined,
  MedicineBoxOutlined,
  ReconciliationOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  MoneyCollectOutlined,
  HomeOutlined,
  BankOutlined,
  TeamOutlined,
  FileTextOutlined,
  GlobalOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  ExclamationCircleOutlined,
  SlidersOutlined,
  LockOutlined,
  UnlockOutlined,
  ApartmentOutlined,
  FilterOutlined,
  PlusOutlined,
  SafetyOutlined,
  SaveOutlined,
  DeleteOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { erpModules } from '../../data/erpModules';
import { useAdminModules } from '../../hooks/useAdminModules';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTranslation } from '../../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;

const moduleIconMap = {
  clinic: MedicineBoxOutlined,
  inventory: AppstoreOutlined,
  asset: BuildOutlined,
  procurement: ReconciliationOutlined,
  sales: ShoppingCartOutlined,
  pos: CreditCardOutlined,
  loans: MoneyCollectOutlined,
  property: HomeOutlined,
  accounting: BankOutlined,
  hr: TeamOutlined,
  payroll: FileTextOutlined,
  reports: FileTextOutlined,
  settings: SettingOutlined,
  'front-end': GlobalOutlined,
  cms: GlobalOutlined,
  crm: TeamOutlined
};

const moduleCategories = {
  asset: 'Core Operations',
  inventory: 'Core Operations',
  procurement: 'Core Operations',
  sales: 'Commerce & Orders',
  pos: 'Commerce & Orders',
  'front-end': 'Commerce & Orders',
  crm: 'Commerce & Orders',
  clinic: 'Healthcare & Clinical',
  accounting: 'Finance & Banking',
  loans: 'Finance & Banking',
  property: 'Real Estate & Property',
  hr: 'Human Resources',
  payroll: 'Human Resources',
  cms: 'Digital Content',
  reports: 'Analytics & Audits',
  settings: 'System Administration'
};

const categoryOrder = [
  'Core Operations',
  'Commerce & Orders',
  'Finance & Banking',
  'Healthcare & Clinical',
  'Human Resources',
  'Real Estate & Property',
  'Digital Content',
  'Analytics & Audits',
  'System Administration'
];

const AdminModulesManager = () => {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    moduleState,
    isModuleOpen,
    toggleModule: contextToggleModule,
    enableAllModules,
    disableAllModules,
    resetModules,
    activeModulesCount,
    totalModulesCount
  } = useAdminModules();

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'open' | 'closed'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Backend Live Modules & License State
  const [dbModules, setDbModules] = useState([]);
  const [submoduleStates, setSubmoduleStates] = useState({});
  const [licenseData, setLicenseData] = useState(null);
  const [loading, setLoading] = useState(false);

  // License Verification & Gate State
  const [isLicenseVerified, setIsLicenseVerified] = useState(
    () => sessionStorage.getItem('aura_license_verified') === 'true'
  );
  const [verifiedLicenseKey, setVerifiedLicenseKey] = useState(
    () => sessionStorage.getItem('aura_license_key') || ''
  );
  const [licenseAuthModalOpen, setLicenseAuthModalOpen] = useState(false);
  const [licenseAuthSubmitting, setLicenseAuthSubmitting] = useState(false);
  const [pendingModuleAction, setPendingModuleAction] = useState(null); // { key, label, targetState }
  const [licenseAuthForm] = Form.useForm();

  // Standalone Enterprise License Update Modal
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [licenseForm] = Form.useForm();

  // Confirmation Modal State for Disabling a Module
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingDisableModule, setPendingDisableModule] = useState(null);

  // Module Permissions Drawer & Management State
  const [permissionsDrawerOpen, setPermissionsDrawerOpen] = useState(false);
  const [selectedModuleForPerms, setSelectedModuleForPerms] = useState(null);
  const [modulePermsData, setModulePermsData] = useState({ keys: [], groups: [], matrix: {} });
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const [permSearchQuery, setPermSearchQuery] = useState('');
  const [permAreaFilter, setPermAreaFilter] = useState('all'); // 'all' | 'admin' | 'website'

  // Create Permission Modal State
  const [createPermModalOpen, setCreatePermModalOpen] = useState(false);
  const [creatingPerm, setCreatingPerm] = useState(false);
  const [createPermForm] = Form.useForm();

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (verifiedLicenseKey) {
      headers['x-license-key'] = verifiedLicenseKey;
    }
    return headers;
  };

  // Fetch modules and license from API
  const fetchModuleData = async () => {
    setLoading(true);
    try {
      const [modRes, licRes] = await Promise.allSettled([
        axios.get('/api/admin/modules', { headers: getAuthHeader() }),
        axios.get('/api/admin/modules/license', { headers: getAuthHeader() })
      ]);

      if (modRes.status === 'fulfilled' && modRes.value.data?.success) {
        const fetched = modRes.value.data.data?.modules || [];
        setDbModules(fetched);

        const subMap = {};
        fetched.forEach((m) => {
          if (m.submodules) {
            m.submodules.forEach((s) => {
              subMap[s.key] = s.enabled;
            });
          }
        });
        setSubmoduleStates(subMap);
      }

      if (licRes.status === 'fulfilled' && licRes.value.data?.success) {
        const lic = licRes.value.data.data;
        setLicenseData(lic);
        if (lic?.is_valid && !verifiedLicenseKey) {
          setVerifiedLicenseKey(lic.license_key);
          setIsLicenseVerified(true);
          sessionStorage.setItem('aura_license_verified', 'true');
          sessionStorage.setItem('aura_license_key', lic.license_key);
        }
      }
    } catch (err) {
      console.warn('Backend module API unavailable, using local registry:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleData();
  }, []);

  // Merge local registry with dbModules
  const mergedModules = useMemo(() => {
    if (dbModules && dbModules.length > 0) {
      return dbModules.map((dbMod) => {
        const localMod = erpModules.find((m) => m.key === dbMod.key) || {};
        return {
          ...localMod,
          ...dbMod,
          category: dbMod.category || moduleCategories[dbMod.key] || 'Core Operations',
          enabled: isModuleOpen(dbMod.key),
          submodules: dbMod.submodules || localMod.submodules || []
        };
      });
    }
    return erpModules.map((m) => ({
      ...m,
      category: moduleCategories[m.key] || 'Core Operations',
      enabled: isModuleOpen(m.key),
      submodules: m.submodules || []
    }));
  }, [dbModules, isModuleOpen]);

  // Filter modules
  const filteredModules = useMemo(() => {
    return mergedModules.filter((m) => {
      const isOpen = isModuleOpen(m.key);
      const cat = m.category || moduleCategories[m.key] || 'Core Operations';

      // Status filter
      if (selectedFilter === 'open' && !isOpen) return false;
      if (selectedFilter === 'closed' && isOpen) return false;

      // Category filter
      if (selectedCategory !== 'all' && cat !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesLabel = (m.label || '').toLowerCase().includes(query);
        const matchesDesc = (m.description || '').toLowerCase().includes(query);
        const matchesKey = (m.key || '').toLowerCase().includes(query);
        const matchesCat = cat.toLowerCase().includes(query);
        if (!matchesLabel && !matchesDesc && !matchesKey && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [mergedModules, isModuleOpen, selectedFilter, selectedCategory, searchQuery]);

  // Group modules by category
  const groupedModules = useMemo(() => {
    const groups = {};
    categoryOrder.forEach((cat) => {
      groups[cat] = [];
    });

    filteredModules.forEach((m) => {
      const cat = m.category || moduleCategories[m.key] || 'Core Operations';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });

    return groups;
  }, [filteredModules]);

  // --------------------------------------------------------------------------
  // LICENSE ACTIVATION GATE: Check License Key on Open or Close Module
  // --------------------------------------------------------------------------
  const handleToggleRequest = (moduleKey, targetState) => {
    const mod = mergedModules.find((m) => m.key === moduleKey);

    if (moduleKey === 'settings' && !targetState) {
      message.error(t('security_cannot_disable_settings', 'Security Rule: Core System Administration cannot be disabled.'));
      return;
    }

    // MANDATORY REQUIREMENT:
    // "if user open or close module is check License Activation Key true can submit update modules"
    if (!isLicenseVerified) {
      setPendingModuleAction({
        key: moduleKey,
        label: mod?.label || moduleKey,
        targetState
      });
      licenseAuthForm.setFieldsValue({
        user_name: 'aura_erp',
        license_key: licenseData?.license_key || 'hianyan@v1'
      });
      setLicenseAuthModalOpen(true);
      return;
    }

    if (!targetState) {
      // Disabling -> Open confirmation modal previewing consequences
      setPendingDisableModule(mod);
      setConfirmModalOpen(true);
    } else {
      // Enabling -> Apply immediately with verified license
      applyModuleToggle(moduleKey, true, verifiedLicenseKey);
    }
  };

  // Submit and verify license from the gate modal
  const handleVerifyLicenseAndSubmitAction = async () => {
    try {
      const values = await licenseAuthForm.validateFields();
      setLicenseAuthSubmitting(true);

      const res = await axios.post('/api/admin/modules/verify-license', values, {
        headers: getAuthHeader()
      });

      if (res.data?.success && res.data.data?.valid) {
        message.success(t('license_verified_success', 'License Activation Key verified successfully!'));
        const verifiedKey = values.license_key.trim();
        setIsLicenseVerified(true);
        setVerifiedLicenseKey(verifiedKey);
        sessionStorage.setItem('aura_license_verified', 'true');
        sessionStorage.setItem('aura_license_key', verifiedKey);
        setLicenseAuthModalOpen(false);

        // Now submit the pending module update
        if (pendingModuleAction) {
          const { key, targetState } = pendingModuleAction;
          setPendingModuleAction(null);

          if (!targetState) {
            const mod = mergedModules.find((m) => m.key === key);
            setPendingDisableModule(mod);
            setConfirmModalOpen(true);
          } else {
            await applyModuleToggle(key, true, verifiedKey, values.user_name);
          }
        }
      } else {
        message.error(t('invalid_license_key', 'Invalid License Activation Key. Module update denied.'));
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || t('license_verification_failed', 'License verification failed. Please enter a valid activation key.');
      message.error(errMsg);
    } finally {
      setLicenseAuthSubmitting(false);
    }
  };

  // Execute module state update
  const applyModuleToggle = async (moduleKey, enabled, keyOverride, userOverride) => {
    const keyToSend = keyOverride || verifiedLicenseKey || licenseData?.license_key || 'hianyan@v1';
    const userToSend = userOverride || 'aura_erp';

    contextToggleModule(moduleKey, enabled);
    try {
      const res = await axios.post(
        '/api/admin/modules/toggle',
        {
          module_key: moduleKey,
          enabled,
          license_key: keyToSend,
          user_name: userToSend
        },
        {
          headers: {
            ...getAuthHeader(),
            'x-license-key': keyToSend
          }
        }
      );
      if (res.data?.success) {
        message.success(
          t('module_updated_status', `Module '${moduleKey}' successfully ${enabled ? 'opened (enabled)' : 'closed (disabled)'}`)
        );
        fetchModuleData();
      }
    } catch (err) {
      // If unauthorized due to license key
      if (err.response?.status === 403) {
        setIsLicenseVerified(false);
        sessionStorage.removeItem('aura_license_verified');
        message.error(err.response?.data?.message || t('license_required_to_toggle', 'License Activation Key required to open or close ERP modules.'));
      } else {
        message.error(err.response?.data?.message || t('failed_to_toggle_module', 'Failed to toggle module status'));
      }
      // Revert frontend state on failure
      contextToggleModule(moduleKey, !enabled);
    }
  };

  const confirmDisableModule = () => {
    if (pendingDisableModule) {
      applyModuleToggle(pendingDisableModule.key, false, verifiedLicenseKey);
      setConfirmModalOpen(false);
      setPendingDisableModule(null);
    }
  };

  // Handle submodule toggle
  const handleSubmoduleToggle = async (subKey, checked) => {
    setSubmoduleStates((prev) => ({ ...prev, [subKey]: checked }));
    try {
      await axios.post(
        '/api/admin/modules/submodule/toggle',
        { sub_module_key: subKey, enabled: checked },
        { headers: getAuthHeader() }
      );
      message.success(t('submodule_toggled', `Sub-module '${subKey}' ${checked ? 'enabled' : 'disabled'}`));
    } catch (err) {
      message.error(t('submodule_toggle_failed', 'Failed to toggle sub-module'));
    }
  };

  // Standalone License update submission
  const handleLicenseSubmit = async () => {
    try {
      const values = await licenseForm.validateFields();
      const res = await axios.post('/api/admin/modules/license', values, {
        headers: getAuthHeader()
      });
      if (res.data?.success) {
        message.success(t('license_updated_success', 'Enterprise license verified and updated successfully!'));
        setLicenseModalOpen(false);
        setIsLicenseVerified(true);
        setVerifiedLicenseKey(values.license_key);
        sessionStorage.setItem('aura_license_verified', 'true');
        sessionStorage.setItem('aura_license_key', values.license_key);
        fetchModuleData();
      }
    } catch (err) {
      message.error(err.response?.data?.message || t('failed_to_update_license', 'Failed to update license key'));
    }
  };

  // --------------------------------------------------------------------------
  // MODULE PERMISSIONS MANAGEMENT ("can create permission in module")
  // --------------------------------------------------------------------------
  const openModulePermissions = async (module) => {
    setSelectedModuleForPerms(module);
    setPermissionsDrawerOpen(true);
    setLoadingPerms(true);
    setPermSearchQuery('');
    setPermAreaFilter('all');
    try {
      const res = await axios.get(`/api/admin/modules/${module.key}/permissions`, {
        headers: getAuthHeader()
      });
      if (res.data?.success) {
        setModulePermsData(res.data.data);
      }
    } catch (err) {
      message.error(t('failed_load_permissions', 'Failed to load module permissions'));
    } finally {
      setLoadingPerms(false);
    }
  };

  // Toggle group permission cell in matrix
  const handleMatrixCellToggle = (permKey, groupId, checked) => {
    setModulePermsData((prev) => {
      const newMatrix = { ...(prev.matrix || {}) };
      if (!newMatrix[permKey]) newMatrix[permKey] = {};
      newMatrix[permKey] = {
        ...newMatrix[permKey],
        [groupId]: checked
      };
      return {
        ...prev,
        matrix: newMatrix
      };
    });
  };

  // Save full permissions matrix for this module
  const handleSaveModulePermissions = async () => {
    if (!selectedModuleForPerms) return;
    setSavingPerms(true);
    try {
      const res = await axios.put(
        `/api/admin/modules/${selectedModuleForPerms.key}/permissions`,
        { matrix: modulePermsData.matrix },
        { headers: getAuthHeader() }
      );
      if (res.data?.success) {
        message.success(t('permissions_saved_success', `Permissions matrix for '${selectedModuleForPerms.label}' updated successfully!`));
      }
    } catch (err) {
      message.error(err.response?.data?.message || t('failed_save_permissions', 'Failed to save module permissions'));
    } finally {
      setSavingPerms(false);
    }
  };

  // Create new permission in this module
  const handleCreatePermissionSubmit = async () => {
    if (!selectedModuleForPerms) return;
    try {
      const values = await createPermForm.validateFields();
      setCreatingPerm(true);

      const res = await axios.post(
        `/api/admin/modules/${selectedModuleForPerms.key}/permissions`,
        values,
        { headers: getAuthHeader() }
      );

      if (res.data?.success) {
        message.success(t('permission_created_success', `Permission '${res.data.data?.permission_key}' successfully created in module '${selectedModuleForPerms.label}'!`));
        setCreatePermModalOpen(false);
        createPermForm.resetFields();
        // Reload permissions
        openModulePermissions(selectedModuleForPerms);
      }
    } catch (err) {
      message.error(err.response?.data?.message || t('failed_create_permission', 'Failed to create permission in module'));
    } finally {
      setCreatingPerm(false);
    }
  };

  // Delete permission key
  const handleDeletePermission = async (permKey) => {
    if (!selectedModuleForPerms) return;
    try {
      const res = await axios.delete(
        `/api/admin/modules/${selectedModuleForPerms.key}/permissions/${encodeURIComponent(permKey)}`,
        { headers: getAuthHeader() }
      );
      if (res.data?.success) {
        message.success(t('permission_deleted_success', `Permission '${permKey}' removed.`));
        openModulePermissions(selectedModuleForPerms);
      }
    } catch (err) {
      message.error(err.response?.data?.message || t('failed_delete_permission', 'Failed to delete permission'));
    }
  };

  // Filtered permission keys in drawer
  const filteredPermissionKeys = useMemo(() => {
    const list = modulePermsData.keys || [];
    return list.filter((k) => {
      if (permAreaFilter !== 'all' && k.area !== permAreaFilter) return false;
      if (permSearchQuery.trim()) {
        const q = permSearchQuery.toLowerCase().trim();
        const matchesKey = (k.permission_key || '').toLowerCase().includes(q);
        const matchesLabel = (k.label || '').toLowerCase().includes(q);
        const matchesAction = (k.action || '').toLowerCase().includes(q);
        return matchesKey || matchesLabel || matchesAction;
      }
      return true;
    });
  }, [modulePermsData.keys, permAreaFilter, permSearchQuery]);

  const cardStyle = {
    borderRadius: 16,
    border: `1px solid ${adminTheme.border}`,
    background: adminTheme.card,
    height: '100%',
    transition: 'all 0.25s ease'
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* 1. Header & Quick Actions */}
      <Flex orientation="horizontal" justify="space-between" align="flex-start" wrap="wrap" gap={16}>
        <div>
          <Flex align="center" gap={10}>
            <Title level={3} style={{ margin: 0, color: adminTheme.text, fontWeight: 700 }}>
              {t('erp_modules_switchboard', 'ERP Modules & Feature Switchboard')}
            </Title>
            <Tag style={{ borderRadius: 8, fontWeight: 700, padding: '2px 10px', color: adminTheme.primary, background: `${adminTheme.primary}18`, borderColor: `${adminTheme.primary}33` }}>
              {t('single_users_db_sync', 'Single Users Database • Real-time Sync')}
            </Tag>
          </Flex>
          <Text style={{ color: adminTheme.subtext, fontSize: 13, marginTop: 4, display: 'block' }}>
            {t('erp_modules_subtitle', 'Configure active ERP modules, assign sub-module capabilities, manage per-module permissions, and enforce enterprise license authentication. Changes synchronize instantly to navigation, APIs, and database tables.')}
          </Text>
        </div>

        <Space size={10} wrap>
          <Button
            icon={<DashboardOutlined />}
            onClick={() => navigate('/admins/dashboard')}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            {t('dashboard', 'Dashboard')}
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              if (!isLicenseVerified) {
                setPendingModuleAction({ key: 'all', label: 'All Modules', targetState: true });
                setLicenseAuthModalOpen(true);
              } else {
                enableAllModules();
              }
            }}
            style={{ borderRadius: 10, fontWeight: 600, background: '#16a34a', borderColor: '#16a34a' }}
          >
            {t('enable_all_modules', 'Enable All Modules')}
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => {
              if (!isLicenseVerified) {
                setPendingModuleAction({ key: 'all_non_core', label: 'Non-Core Modules', targetState: false });
                setLicenseAuthModalOpen(true);
              } else {
                disableAllModules();
              }
            }}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            {t('disable_non_core', 'Disable Non-Core')}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              resetModules();
              fetchModuleData();
            }}
            loading={loading}
            style={{ borderRadius: 10 }}
          >
            {t('refresh', 'Refresh')}
          </Button>
        </Space>
      </Flex>

      {/* 2. Enterprise License Banner Card */}
      <Card
        style={{
          borderRadius: 16,
          border: `1px solid ${adminTheme.primary}33`,
          background: adminTheme.isDark
            ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
            : `linear-gradient(135deg, ${adminTheme.primary}12 0%, #f0fdf4 100%)`,
          boxShadow: `0 4px 14px ${adminTheme.primary}15`
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row gutter={[20, 16]} align="middle">
          <Col xs={24} md={14}>
            <Flex align="center" gap={14}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: adminTheme.primary,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 26,
                  boxShadow: `0 6px 16px ${adminTheme.primary}44`
                }}
              >
                <SafetyCertificateOutlined />
              </div>
              <div>
                <Flex align="center" gap={8} wrap="wrap">
                  <Text strong style={{ fontSize: 16, color: adminTheme.isDark ? '#f8fafc' : '#0f172a' }}>
                    {licenseData?.license_name || 'Aura Enterprise Supply B2B'}
                  </Text>
                  <Tag color={isLicenseVerified ? 'success' : 'warning'} style={{ borderRadius: 8, fontWeight: 700, padding: '2px 8px' }}>
                    {isLicenseVerified ? t('active_enterprise', 'ACTIVE & VERIFIED') : t('activation_pending', 'ACTIVATION REQUIRED')}
                  </Tag>
                  <Tag style={{ borderRadius: 8, fontWeight: 600, color: adminTheme.primary, background: `${adminTheme.primary}18`, borderColor: `${adminTheme.primary}33` }}>
                    {licenseData?.domain || 'aurasupply.biz'}
                  </Tag>
                </Flex>
                <Text style={{ color: adminTheme.subtext, fontSize: 12.5, display: 'block', marginTop: 3 }}>
                  {t('license_key', 'License Key')}: <code>{verifiedLicenseKey || licenseData?.license_key || 'hianyan@v1'}</code> &bull; {t('unlimited_users_warehouses', 'Unlimited Users & Unlimited Multi-warehouses')}
                </Text>
              </div>
            </Flex>
          </Col>

          <Col xs={24} md={10} style={{ textAlign: 'right' }}>
            <Flex justify="flex-end" align="center" gap={16} wrap="wrap">
              <div style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block' }}>{t('validity_period', 'VALIDITY PERIOD')}</Text>
                <Text strong style={{ fontSize: 14, color: adminTheme.text }}>
                  {t('until_date_days_left', 'Until Dec 31, 2030 ({days} days left)').replace('{days}', licenseData?.days_remaining || 1720)}
                </Text>
              </div>
              <Button
                icon={<KeyOutlined />}
                onClick={() => {
                  licenseForm.setFieldsValue({
                    license_key: verifiedLicenseKey || licenseData?.license_key || 'AURA-ENT-2026-X892-PRO',
                    license_name: licenseData?.license_name || 'Aura Enterprise Supply B2B',
                    user_name: 'aura_erp'
                  });
                  setLicenseModalOpen(true);
                }}
                style={{
                  borderRadius: 10,
                  fontWeight: 600,
                  borderColor: adminTheme.primary,
                  color: adminTheme.primary
                }}
              >
                {t('update_license', 'Update License')}
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* 3. System Statistics Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>{t('total_erp_modules', 'Total ERP Modules')}</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: adminTheme.text }}>
              {totalModulesCount}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>{t('available_business_modules', 'Available business modules')}</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Flex justify="space-between" align="center">
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>{t('active_and_operational', 'Active & Operational')}</Text>
              <EyeOutlined style={{ color: '#16a34a', fontSize: 16 }} />
            </Flex>
            <Title level={2} style={{ margin: '4px 0 0', color: '#16a34a' }}>
              {activeModulesCount}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>{t('visible_in_nav_apis', 'Visible in navigation & APIs')}</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Flex justify="space-between" align="center">
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>{t('disabled_dormant', 'Disabled / Dormant')}</Text>
              <EyeInvisibleOutlined style={{ color: '#ea580c', fontSize: 16 }} />
            </Flex>
            <Title level={2} style={{ margin: '4px 0 0', color: totalModulesCount - activeModulesCount > 0 ? '#ea580c' : adminTheme.subtext }}>
              {totalModulesCount - activeModulesCount}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>{t('excluded_from_sidebar', 'Excluded from sidebar')}</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>{t('active_system_footprint', 'Active System Footprint')}</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#2563eb' }}>
              {Math.round((activeModulesCount / totalModulesCount) * 100)}%
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>{t('operating_capacity', 'Operating capacity')}</Text>
          </Card>
        </Col>
      </Row>

      {/* 4. Search and Category Filter Toolbar */}
      <Card style={cardStyle} styles={{ body: { padding: '16px 20px' } }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
              placeholder={t('search_modules_placeholder', 'Search modules (e.g. Sales, Inventory, POS, Clinic)...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: 10 }}
            />
          </Col>

          <Col xs={24} md={8}>
            <Flex gap={8} wrap="wrap">
              <Button
                type={selectedFilter === 'all' ? 'primary' : 'default'}
                onClick={() => setSelectedFilter('all')}
                style={{ borderRadius: 8, fontSize: 12.5 }}
              >
                {t('all', 'All')} ({totalModulesCount})
              </Button>
              <Button
                type={selectedFilter === 'open' ? 'primary' : 'default'}
                onClick={() => setSelectedFilter('open')}
                style={{
                  borderRadius: 8,
                  fontSize: 12.5,
                  ...(selectedFilter === 'open' ? { background: '#16a34a', borderColor: '#16a34a' } : {})
                }}
              >
                {t('active', 'Active')} ({activeModulesCount})
              </Button>
              <Button
                type={selectedFilter === 'closed' ? 'primary' : 'default'}
                onClick={() => setSelectedFilter('closed')}
                style={{
                  borderRadius: 8,
                  fontSize: 12.5,
                  ...(selectedFilter === 'closed' ? { background: '#ea580c', borderColor: '#ea580c' } : {})
                }}
              >
                {t('disabled', 'Disabled')} ({totalModulesCount - activeModulesCount})
              </Button>
            </Flex>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Flex justify="flex-end" gap={6} wrap="wrap">
              <Tag.CheckableTag
                checked={selectedCategory === 'all'}
                onChange={() => setSelectedCategory('all')}
                style={{ borderRadius: 8, fontSize: 12, padding: '3px 10px' }}
              >
                {t('all_categories', 'ALL CATEGORIES')}
              </Tag.CheckableTag>
              {categoryOrder.map((cat) => (
                <Tag.CheckableTag
                  key={cat}
                  checked={selectedCategory === cat}
                  onChange={() => setSelectedCategory(cat)}
                  style={{ borderRadius: 8, fontSize: 12, padding: '3px 10px' }}
                >
                  {t(cat, cat)}
                </Tag.CheckableTag>
              ))}
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* 5. Categorized Card Modules Grid */}
      {categoryOrder.map((catName) => {
        const catModules = groupedModules[catName] || [];
        if (catModules.length === 0) return null;

        const isDark = adminTheme.isDark;
        const primary = adminTheme.primary;
        const catHeaderBg = isDark ? 'rgba(255, 255, 255, 0.04)' : `${primary}08`;
        const catHeaderBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : `${primary}22`;
        const catHeaderColor = isDark ? '#f8fafc' : adminTheme.text;

        return (
          <div key={catName} style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 16px',
                background: catHeaderBg,
                border: `1px solid ${catHeaderBorder}`,
                borderRadius: 12,
                marginBottom: 16
              }}
            >
              <ApartmentOutlined style={{ color: primary, fontSize: 16 }} />
              <Text strong style={{ color: catHeaderColor, fontSize: 14 }}>
                {t(catName, catName)}
              </Text>
              <Tag style={{ borderRadius: 6, margin: 0, fontWeight: 700, fontSize: 11, background: `${primary}18`, color: primary, border: `1px solid ${primary}33` }}>
                {catModules.length} {t('modules', 'modules')}
              </Tag>
            </div>

            <Row gutter={[16, 16]}>
              {catModules.map((m) => {
                const isOpen = isModuleOpen(m.key);
                const IconComponent = moduleIconMap[m.key] || AppstoreOutlined;

                return (
                  <Col xs={24} sm={12} lg={8} key={m.key}>
                    <Card
                      style={{
                        ...cardStyle,
                        borderColor: isOpen ? `${primary}44` : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                        opacity: isOpen ? 1 : 0.85,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      styles={{ body: { padding: 20 } }}
                    >
                      {/* Top Accent Line */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: isOpen ? (m.accent || primary) : (isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1')
                        }}
                      />

                      {/* Header with Icon, Name, and License-gated Switch */}
                      <Flex justify="space-between" align="flex-start" style={{ marginBottom: 12 }}>
                        <Flex align="center" gap={12}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              background: isOpen ? `${m.accent || primary}18` : adminTheme.cardMuted,
                              color: isOpen ? (m.accent || primary) : adminTheme.subtext,
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 22,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <IconComponent />
                          </div>

                          <div>
                            <Title level={5} style={{ margin: 0, color: adminTheme.text }}>
                              {t(m.label, m.label)}
                            </Title>
                            <Tag
                              color={isOpen ? 'green' : 'default'}
                              style={{
                                borderRadius: 6,
                                fontSize: 11,
                                marginTop: 4,
                                padding: '1px 8px',
                                fontWeight: 600
                              }}
                            >
                              {isOpen ? t('active_open', 'ACTIVE / OPEN') : t('disabled_hidden', 'DISABLED / CLOSED')}
                            </Tag>
                          </div>
                        </Flex>

                        <Flex vertical align="flex-end" gap={4}>
                          <Tooltip title={isLicenseVerified ? t('toggle_module_state', 'Click to open or close module') : t('license_required_click', 'License Activation Key required to toggle')}>
                            <Switch
                              checked={isOpen}
                              onChange={(checked) => handleToggleRequest(m.key, checked)}
                              checkedChildren="ON"
                              unCheckedChildren="OFF"
                              style={{
                                background: isOpen ? '#16a34a' : '#94a3b8'
                              }}
                            />
                          </Tooltip>
                        </Flex>
                      </Flex>

                      {/* Description */}
                      <Paragraph
                        style={{
                          color: adminTheme.subtext,
                          fontSize: 12.5,
                          lineHeight: 1.5,
                          minHeight: 38,
                          marginBottom: 12
                        }}
                        ellipsis={{ rows: 2 }}
                      >
                        {t(m.description, m.description || 'Enterprise module managing core business functions and operations.')}
                      </Paragraph>

                      {/* Collapsible Sub-modules Section */}
                      {m.submodules && m.submodules.length > 0 && (
                        <Collapse
                          ghost
                          size="small"
                          style={{ marginBottom: 12, background: adminTheme.cardMuted, borderRadius: 10 }}
                          items={[
                            {
                              key: '1',
                              label: (
                                <Flex justify="space-between" align="center" style={{ width: '100%', paddingRight: 8 }}>
                                  <Text style={{ fontSize: 12, color: adminTheme.text, fontWeight: 600 }}>
                                    {t('submodules_and_capabilities', 'Sub-modules & Capabilities')} ({m.submodules.length})
                                  </Text>
                                  <Badge count={m.submodules.filter((s) => submoduleStates[s.key] !== false).length} style={{ backgroundColor: primary }} />
                                </Flex>
                              ),
                              children: (
                                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                  {m.submodules.map((sub) => {
                                    const subActive = submoduleStates[sub.key] !== false;
                                    return (
                                      <Flex key={sub.key} justify="space-between" align="center">
                                        <div style={{ paddingRight: 8 }}>
                                          <Text style={{ fontSize: 12, fontWeight: 500, color: adminTheme.text, display: 'block' }}>
                                            {t(sub.label, sub.label)}
                                          </Text>
                                          {sub.description && (
                                            <Text style={{ fontSize: 11, color: adminTheme.subtext }}>
                                              {t(sub.description, sub.description)}
                                            </Text>
                                          )}
                                        </div>
                                        <Switch
                                          size="small"
                                          disabled={!isOpen}
                                          checked={subActive && isOpen}
                                          onChange={(checked) => handleSubmoduleToggle(sub.key, checked)}
                                        />
                                      </Flex>
                                    );
                                  })}
                                </Space>
                              )
                            }
                          ]}
                        />
                      )}

                      {/* Footer Actions: Permissions Manager & Navigation */}
                      <Divider style={{ margin: '10px 0' }} />
                      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                        <Button
                          size="small"
                          icon={<SafetyCertificateOutlined />}
                          onClick={() => openModulePermissions(m)}
                          style={{
                            borderRadius: 8,
                            fontSize: 11.5,
                            fontWeight: 600,
                            borderColor: primary,
                            color: primary
                          }}
                        >
                          {t('module_permissions', 'Permissions')}
                        </Button>

                        {isOpen ? (
                          <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/admins?module=${m.key}`)}
                            style={{ padding: 0, fontWeight: 600, color: primary }}
                          >
                            {t('explore_module', 'Explore Module')}
                          </Button>
                        ) : (
                          <Text type="secondary" style={{ fontSize: 11.5, fontStyle: 'italic' }}>
                            {t('inactive_in_sidebar', 'Inactive in Sidebar')}
                          </Text>
                        )}
                      </Flex>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        );
      })}

      {/* ---------------------------------------------------------------------- */}
      {/* LICENSE ACTIVATION KEY AUTHENTICATION MODAL (ON MODULE OPEN / CLOSE) */}
      {/* ---------------------------------------------------------------------- */}
      <Modal
        title={
          <Flex align="center" gap={8} style={{ color: '#2563eb' }}>
            <KeyOutlined style={{ fontSize: 20 }} />
            <span>{t('license_activation_key_required', 'License Activation Key Verification')}</span>
          </Flex>
        }
        open={licenseAuthModalOpen}
        onOk={handleVerifyLicenseAndSubmitAction}
        onCancel={() => {
          setLicenseAuthModalOpen(false);
          setPendingModuleAction(null);
        }}
        confirmLoading={licenseAuthSubmitting}
        okText={t('verify_and_submit_update', 'Verify & Submit Module Update')}
        cancelText={t('cancel', 'Cancel')}
        destroyOnClose
      >
        <Space direction="vertical" size={14} style={{ width: '100%', marginTop: 12 }}>
          <Alert
            type="info"
            showIcon
            message={
              <span>
                {t('security_module_activation_gate', 'Security Gate: Enterprise License Required')}
              </span>
            }
            description={
              <span>
                {t('license_gate_desc', 'Opening or closing ERP modules requires verification with a valid Enterprise License Activation Key. Please enter your Administrator credentials to authenticate this action.')}
                {pendingModuleAction && (
                  <div style={{ marginTop: 8, fontWeight: 600, color: '#1d4ed8' }}>
                    {t('action_target', 'Pending Action')}: {pendingModuleAction.targetState ? t('open_module', 'Open (Enable)') : t('close_module', 'Close (Disable)')} &bull; {pendingModuleAction.label} (<code>{pendingModuleAction.key}</code>)
                  </div>
                )}
              </span>
            }
          />

          <Form form={licenseAuthForm} layout="vertical" orientation="vertical">
            <Form.Item
              name="user_name"
              label={t('admin_user_name', 'Administrator Username')}
              initialValue="aura_erp"
              rules={[{ required: true, message: t('enter_username_msg', 'Please enter Administrator username') }]}
            >
              <Input prefix={<TeamOutlined />} placeholder="e.g. aura_erp" />
            </Form.Item>

            <Form.Item
              name="license_key"
              label={t('license_activation_key', 'License Activation Key')}
              rules={[{ required: true, message: t('enter_license_key_msg', 'Please enter License Activation Key') }]}
              extra={
                <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>
                  {t('hint_master_key', 'AURA_v1 Master Key')}: <code>hianyan@v1</code> {t('or_enterprise_key', 'or active Enterprise Key')} (<code>AURA-ENT-2026-X892-PRO</code>)
                </Text>
              }
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Enter License Activation Key (e.g. hianyan@v1)" />
            </Form.Item>
          </Form>
        </Space>
      </Modal>

      {/* ---------------------------------------------------------------------- */}
      {/* CONFIRMATION MODAL BEFORE DISABLING A MODULE */}
      {/* ---------------------------------------------------------------------- */}
      <Modal
        title={
          <Flex align="center" gap={8} style={{ color: '#dc2626' }}>
            <ExclamationCircleOutlined />
            <span>{t('confirm_module_deactivation', 'Confirm Module Deactivation')}</span>
          </Flex>
        }
        open={confirmModalOpen}
        onOk={confirmDisableModule}
        onCancel={() => {
          setConfirmModalOpen(false);
          setPendingDisableModule(null);
        }}
        okText={t('yes_deactivate_module', 'Yes, Deactivate Module')}
        cancelText={t('keep_enabled', 'Keep Enabled')}
        okButtonProps={{ danger: true }}
      >
        {pendingDisableModule && (
          <Space direction="vertical" size={14} style={{ marginTop: 12, width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              message={
                <span>
                  {t('about_to_turn_off', 'You are about to turn off')} <strong>{t(pendingDisableModule.label, pendingDisableModule.label)}</strong> (<code>{pendingDisableModule.key}</code>).
                </span>
              }
              description={t('deactivate_module_desc', 'Deactivating this module will immediately hide its navigation menus from all non-superadmin users and exclude its analytical widgets from the Admin Dashboard.')}
            />

            {pendingDisableModule.submodules && pendingDisableModule.submodules.length > 0 && (
              <div>
                <Text strong style={{ fontSize: 12.5, display: 'block', marginBottom: 6 }}>
                  {t('affected_submodules', 'Affected Sub-modules')} ({pendingDisableModule.submodules.length}):
                </Text>
                <div style={{ maxHeight: 120, overflowY: 'auto', background: adminTheme.cardMuted, padding: '8px 12px', borderRadius: 8 }}>
                  {pendingDisableModule.submodules.map((s) => (
                    <Text key={s.key} style={{ fontSize: 12, color: adminTheme.subtext, display: 'block' }}>
                      &bull; {t(s.label, s.label)} (<code>{s.key}</code>)
                    </Text>
                  ))}
                </div>
              </div>
            )}
            <Text style={{ fontSize: 12, color: adminTheme.subtext }}>
              {t('can_reenable_anytime', 'You can re-enable this module at any time from this switchboard.')}
            </Text>
          </Space>
        )}
      </Modal>

      {/* ---------------------------------------------------------------------- */}
      {/* ENTERPRISE LICENSE UPDATE MODAL */}
      {/* ---------------------------------------------------------------------- */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <SafetyCertificateOutlined style={{ color: '#2563eb' }} />
            <span>{t('update_aura_enterprise_license', 'Update Aura Enterprise License')}</span>
          </Flex>
        }
        open={licenseModalOpen}
        onOk={handleLicenseSubmit}
        onCancel={() => setLicenseModalOpen(false)}
        okText={t('verify_and_activate_license', 'Verify & Activate License')}
        destroyOnClose
      >
        <Form form={licenseForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="user_name"
            label={t('admin_user_name', 'Administrator Username')}
            initialValue="aura_erp"
          >
            <Input prefix={<TeamOutlined />} placeholder="e.g. aura_erp" />
          </Form.Item>

          <Form.Item
            name="license_key"
            label={t('license_activation_key', 'License Activation Key')}
            rules={[{ required: true, message: t('enter_license_key_msg', 'Please enter enterprise license key') }]}
            extra={
              <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>
                {t('master_key_note', 'Accepts AURA_v1 key (hianyan@v1) or AURA-ENT-2026-X892-PRO')}
              </Text>
            }
          >
            <Input prefix={<KeyOutlined />} placeholder="e.g. hianyan@v1 or AURA-ENT-2026-X892-PRO" />
          </Form.Item>

          <Form.Item
            name="license_name"
            label={t('licensed_organization_name', 'Licensed Organization Name')}
            rules={[{ required: true, message: t('enter_org_name_msg', 'Please enter organization name') }]}
          >
            <Input placeholder="e.g. Aura Supply B2B Group" />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message={t('enterprise_license_benefits', 'Enterprise License Benefits')}
            description={t('license_benefits_desc', 'Active license unlocks all 16 business modules, unlimited multi-warehouse instances, real-time audit logs, and priority security patches through 2030.')}
          />
        </Form>
      </Modal>

      {/* ---------------------------------------------------------------------- */}
      {/* MODULE PERMISSIONS DRAWER: PERMISSION MATRIX & CREATION */}
      {/* ---------------------------------------------------------------------- */}
      <Drawer
        title={
          <Flex align="center" justify="space-between" style={{ width: '100%', paddingRight: 24 }}>
            <Flex align="center" gap={10}>
              <SafetyCertificateOutlined style={{ color: adminTheme.primary, fontSize: 20 }} />
              <div>
                <Text strong style={{ fontSize: 16, color: adminTheme.text }}>
                  {t('module_permissions_title', 'Module Permissions')}: {selectedModuleForPerms?.label}
                </Text>
                <Tag style={{ marginLeft: 8, borderRadius: 6, fontWeight: 600 }}>
                  <code>{selectedModuleForPerms?.key}</code>
                </Tag>
              </div>
            </Flex>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                createPermForm.setFieldsValue({
                  module: selectedModuleForPerms?.key,
                  area: 'admin',
                  group_ids: [1, 2] // Default Owner & Admin
                });
                setCreatePermModalOpen(true);
              }}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              {t('create_permission_in_module', 'Create Permission')}
            </Button>
          </Flex>
        }
        open={permissionsDrawerOpen}
        onClose={() => setPermissionsDrawerOpen(false)}
        width={960}
        destroyOnClose
      >
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          {/* Instructions and Toolbar */}
          <Alert
            type="info"
            showIcon
            message={
              <span>
                {t('rbac_module_instructions', 'Granular Role-Based Access Control (RBAC) for')} <strong>{selectedModuleForPerms?.label}</strong>
              </span>
            }
            description={t('rbac_module_desc', 'Create custom permission actions or grant/revoke access across user roles for this module. Root Owner and Admin always have full access.')}
          />

          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={10}>
              <Input
                prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
                placeholder={t('search_permissions', 'Search permission keys or actions...')}
                value={permSearchQuery}
                onChange={(e) => setPermSearchQuery(e.target.value)}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Radio.Group
                value={permAreaFilter}
                onChange={(e) => setPermAreaFilter(e.target.value)}
                buttonStyle="solid"
                size="middle"
              >
                <Radio.Button value="all">{t('all', 'All')}</Radio.Button>
                <Radio.Button value="admin">{t('admin_area', 'Admin Portal')}</Radio.Button>
                <Radio.Button value="website">{t('website_area', 'Website')}</Radio.Button>
              </Radio.Group>
            </Col>
            <Col xs={24} md={6} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveModulePermissions}
                loading={savingPerms}
                style={{ borderRadius: 8, fontWeight: 600, background: '#16a34a', borderColor: '#16a34a' }}
              >
                {t('save_permissions_matrix', 'Save Matrix')}
              </Button>
            </Col>
          </Row>

          {/* Permissions Table & Role Checkboxes */}
          <Table
            dataSource={filteredPermissionKeys}
            rowKey="permission_key"
            loading={loadingPerms}
            pagination={{ pageSize: 12, size: 'small', showTotal: (total) => `${total} permissions` }}
            size="small"
            bordered
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: t('permission_key', 'Permission Key'),
                dataIndex: 'permission_key',
                key: 'permission_key',
                fixed: 'left',
                width: 190,
                render: (val, record) => (
                  <div>
                    <Text strong style={{ fontSize: 12, color: adminTheme.text }}>
                      <code>{val}</code>
                    </Text>
                    {record.label && (
                      <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block' }}>
                        {record.label}
                      </Text>
                    )}
                  </div>
                )
              },
              {
                title: t('area', 'Area'),
                dataIndex: 'area',
                key: 'area',
                width: 100,
                render: (area) => (
                  <Tag color={area === 'admin' ? 'blue' : 'purple'} style={{ borderRadius: 6, fontSize: 11, margin: 0 }}>
                    {area === 'admin' ? 'ADMIN' : 'WEB'}
                  </Tag>
                )
              },
              // Dynamic Columns for each User Group (Role)
              ...(modulePermsData.groups || []).map((grp) => ({
                title: (
                  <Tooltip title={grp.description || grp.name}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {grp.name.toUpperCase()}
                    </span>
                  </Tooltip>
                ),
                key: `grp_${grp.id}`,
                align: 'center',
                width: 90,
                render: (_, record) => {
                  const isOwnerOrAdmin = grp.id === 1 || grp.level <= 2 || grp.name === 'owner' || grp.name === 'admin';
                  const isAllowed = isOwnerOrAdmin || (modulePermsData.matrix?.[record.permission_key]?.[grp.id] === true);

                  return (
                    <Checkbox
                      checked={isAllowed}
                      disabled={isOwnerOrAdmin}
                      onChange={(e) => handleMatrixCellToggle(record.permission_key, grp.id, e.target.checked)}
                    />
                  );
                }
              })),
              {
                title: t('action', 'Action'),
                key: 'ops',
                fixed: 'right',
                width: 70,
                align: 'center',
                render: (_, record) => (
                  <Popconfirm
                    title={t('confirm_delete_permission', 'Delete this permission key?')}
                    onConfirm={() => handleDeletePermission(record.permission_key)}
                    okText={t('yes', 'Yes')}
                    cancelText={t('no', 'No')}
                  >
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
                )
              }
            ]}
          />
        </Space>
      </Drawer>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL: CREATE NEW PERMISSION IN MODULE */}
      {/* ---------------------------------------------------------------------- */}
      <Modal
        title={
          <Flex align="center" gap={8} style={{ color: adminTheme.primary }}>
            <SafetyOutlined />
            <span>
              {t('create_new_permission_in_module', 'Create Permission in')} {selectedModuleForPerms?.label}
            </span>
          </Flex>
        }
        open={createPermModalOpen}
        onOk={handleCreatePermissionSubmit}
        onCancel={() => {
          setCreatePermModalOpen(false);
          createPermForm.resetFields();
        }}
        confirmLoading={creatingPerm}
        okText={t('create_and_register_permission', 'Create & Register Permission')}
        cancelText={t('cancel', 'Cancel')}
        destroyOnClose
      >
        <Form
          form={createPermForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          initialValues={{
            module: selectedModuleForPerms?.key,
            area: 'admin',
            group_ids: [1, 2]
          }}
        >
          <Form.Item label={t('module', 'Module')}>
            <Tag color="blue" style={{ fontSize: 13, padding: '3px 10px', borderRadius: 8, fontWeight: 600 }}>
              {selectedModuleForPerms?.label} (<code>{selectedModuleForPerms?.key}</code>)
            </Tag>
          </Form.Item>

          <Form.Item
            name="action"
            label={t('permission_action_name', 'Action Name (e.g. export, approve, print, price_override)')}
            rules={[{ required: true, message: t('enter_action_name_msg', 'Please enter action name') }]}
          >
            <Input placeholder="e.g. export_excel, discount_override, barcode_print, approve_request" />
          </Form.Item>

          <Form.Item
            name="label"
            label={t('friendly_label', 'Friendly Description / Label')}
            rules={[{ required: true, message: t('enter_label_msg', 'Please enter descriptive label') }]}
          >
            <Input placeholder="e.g. Can Export High Value Sales Reports" />
          </Form.Item>

          <Form.Item
            name="area"
            label={t('target_area', 'Target Operational Area')}
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value="admin">{t('admin_dashboard_area', 'Admin Dashboard (admin)')}</Radio>
              <Radio value="website">{t('customer_website_area', 'Customer Website & Shop (website)')}</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="group_ids"
            label={t('initial_role_grants', 'Grant Access to Roles')}
            rules={[{ required: true, message: t('select_roles_msg', 'Select at least one role') }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[8, 8]}>
                {(modulePermsData.groups || []).map((grp) => (
                  <Col span={12} key={grp.id}>
                    <Checkbox value={grp.id} disabled={grp.id === 1 || grp.level <= 2}>
                      <Text strong={grp.level <= 2} style={{ fontSize: 12 }}>
                        {grp.name} ({grp.description || `Lvl ${grp.level}`})
                      </Text>
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default AdminModulesManager;
