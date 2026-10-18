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
  Popconfirm,
  Select
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
  UsergroupAddOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { erpModules } from '../../data/erpModules';
import { WEBSITE_TEMPLATES, getWebsiteTemplate } from '../../data/websiteTemplates';
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
  inventory: 'Core Operations',
  procurement: 'Core Operations',
  asset: 'Core Operations',
  sales: 'Commerce & Orders',
  pos: 'Commerce & Orders',
  crm: 'Commerce & Orders',
  ecommerce: 'Commerce & Orders',
  'front-end': 'Commerce & Orders',
  accounting: 'Finance & Banking',
  loan: 'Finance & Banking',
  loans: 'Finance & Banking',
  installment: 'Finance & Banking',
  pawn: 'Finance & Banking',
  saving: 'Finance & Banking',
  tax: 'Finance & Banking',
  project: 'Projects & Operations',
  manufaturing: 'Manufacturing & Engineering',
  hr: 'Human Resources',
  payroll: 'Human Resources',
  attendance: 'Human Resources',
  property: 'Real Estate & Property',
  rental: 'Real Estate & Property',
  clinic: 'Healthcare & Clinical',
  school: 'Education & Schools',
  hotel_apartment: 'Hospitality & Real Estate',
  email_marketing: 'Digital Content',
  cms: 'Digital Content',
  express: 'Logistics & Dispatch',
  dashboard: 'System Administration',
  reports: 'Analytics & Audits',
  users: 'System Administration',
  settings: 'System Administration'
};

const categoryOrder = [
  'Core Operations',
  'Commerce & Orders',
  'Finance & Banking',
  'Projects & Operations',
  'Manufacturing & Engineering',
  'Healthcare & Clinical',
  'Education & Schools',
  'Human Resources',
  'Real Estate & Property',
  'Hospitality & Real Estate',
  'Logistics & Dispatch',
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
    activeWebsiteTemplate,
    setWebsiteTemplate,
    currentTemplate,
    toggleModule: contextToggleModule,
    setAllModuleStates,
    enableAllModules,
    disableAllModules,
    resetModules,
    activeModulesCount,
    totalModulesCount
  } = useAdminModules();

  // Active Website Template State
  const [selectedWebsiteTemplate, setSelectedWebsiteTemplate] = useState(
    () => activeWebsiteTemplate || 'default'
  );

  useEffect(() => {
    if (activeWebsiteTemplate) {
      setSelectedWebsiteTemplate(activeWebsiteTemplate);
    }
  }, [activeWebsiteTemplate]);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'open' | 'closed'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Backend Live Modules & License State
  const [dbModules, setDbModules] = useState([]);
  const [submoduleStates, setSubmoduleStates] = useState({});
  const [licenseData, setLicenseData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Local Module Switch States (allow clicking ON/OFF freely before submit, matching AURA_v1)
  const [localModuleStates, setLocalModuleStates] = useState({});
  const [initialModuleStates, setInitialModuleStates] = useState({});

  // Local Submodule Switch States
  const [localSubmoduleStates, setLocalSubmoduleStates] = useState({});
  const [initialSubmoduleStates, setInitialSubmoduleStates] = useState({});

  // Enterprise License Submission Form States (matching AURA_v1 modules.php)
  const [licenseUserName, setLicenseUserName] = useState('aura_erp');
  const [licenseKeyInput, setLicenseKeyInput] = useState(
    () => sessionStorage.getItem('aura_license_key') || 'hianyan@v1'
  );
  const [submittingModules, setSubmittingModules] = useState(false);

  // License Verification Status
  const [isLicenseVerified, setIsLicenseVerified] = useState(
    () => sessionStorage.getItem('aura_license_verified') === 'true'
  );
  const [verifiedLicenseKey, setVerifiedLicenseKey] = useState(
    () => sessionStorage.getItem('aura_license_key') || ''
  );

  // Standalone Enterprise License Update Modal
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [licenseForm] = Form.useForm();

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
    if (verifiedLicenseKey || licenseKeyInput) {
      headers['x-license-key'] = verifiedLicenseKey || licenseKeyInput;
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

        const modMap = {};
        fetched.forEach((m) => {
          const k = m.name || m.key;
          modMap[k] = Boolean(m.enabled);
        });
        setLocalModuleStates(modMap);
        setInitialModuleStates(modMap);

        const subMap = {};
        fetched.forEach((m) => {
          if (m.submodules) {
            m.submodules.forEach((s) => {
              subMap[s.key] = s.enabled !== false;
            });
          }
        });
        setSubmoduleStates(subMap);
        setLocalSubmoduleStates(subMap);
        setInitialSubmoduleStates(subMap);
      }

      if (licRes.status === 'fulfilled' && licRes.value.data?.success) {
        const lic = licRes.value.data.data;
        setLicenseData(lic);
        if (lic?.license_key) {
          if (!licenseKeyInput || licenseKeyInput === 'hianyan@v1') {
            setLicenseKeyInput(lic.license_key);
          }
        }
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

  // Merge local registry with dbModules (sourced from aura_modules + aura_module_settings)
  const mergedModules = useMemo(() => {
    if (dbModules && dbModules.length > 0) {
      return dbModules.map((dbMod) => {
        const modKey = dbMod.name || dbMod.key;
        const localMod = erpModules.find((m) => m.key === modKey) || {};
        const isCurrentOpen = localModuleStates[modKey] !== undefined
          ? Boolean(localModuleStates[modKey])
          : (dbMod.enabled !== undefined ? Boolean(dbMod.enabled) : isModuleOpen(modKey));
        const isInitialOpen = initialModuleStates[modKey] !== undefined
          ? Boolean(initialModuleStates[modKey])
          : Boolean(dbMod.enabled);

        return {
          ...localMod,
          ...dbMod,
          name: modKey,
          key: modKey,
          label: dbMod.title || dbMod.label || localMod.label || modKey,
          title: dbMod.title || dbMod.label || localMod.label || modKey,
          category: dbMod.category || moduleCategories[modKey] || 'Core Operations',
          enabled: isCurrentOpen,
          isDirty: isCurrentOpen !== isInitialOpen,
          submodules: dbMod.submodules || localMod.submodules || [],
          image: dbMod.image,
          favicon: dbMod.favicon,
          style: dbMod.style,
          controller: dbMod.controller,
          module: dbMod.module,
          description: dbMod.description || localMod.description || `Enterprise ${modKey} management module`
        };
      });
    }
    return erpModules.map((m) => {
      const isCurrentOpen = localModuleStates[m.key] !== undefined
        ? Boolean(localModuleStates[m.key])
        : isModuleOpen(m.key);
      const isInitialOpen = initialModuleStates[m.key] !== undefined
        ? Boolean(initialModuleStates[m.key])
        : isModuleOpen(m.key);

      return {
        ...m,
        name: m.key,
        category: moduleCategories[m.key] || 'Core Operations',
        enabled: isCurrentOpen,
        isDirty: isCurrentOpen !== isInitialOpen,
        submodules: m.submodules || []
      };
    });
  }, [dbModules, localModuleStates, initialModuleStates, isModuleOpen]);

  // Statistics
  const currentTotalCount = mergedModules.length;
  const currentActiveCount = useMemo(() => {
    return mergedModules.filter((m) => m.enabled).length;
  }, [mergedModules]);
  const isTemplateDirty = selectedWebsiteTemplate !== (activeWebsiteTemplate || 'default');
  const unsavedCount = useMemo(() => {
    return mergedModules.filter((m) => m.isDirty).length + (isTemplateDirty ? 1 : 0);
  }, [mergedModules, isTemplateDirty]);
  const hasUnsavedChanges = unsavedCount > 0;

  // Filter modules
  const filteredModules = useMemo(() => {
    return mergedModules.filter((m) => {
      const isOpen = m.enabled;
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
  }, [mergedModules, selectedFilter, selectedCategory, searchQuery]);

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
  // CLICK ON AND OFF FREELY (BEFORE SUBMISSION)
  // Aligned with c:\wamp64\www\AURA_v1\themes\default\admin\views\settings\modules.php:
  // Admin toggles switches on/off in local state without blocking prompts on each click!
  // --------------------------------------------------------------------------
  const handleModuleSwitch = (moduleKey, checked) => {
    if (moduleKey === 'settings' && !checked) {
      message.error(t('security_cannot_disable_settings', 'Security Rule: Core System Administration cannot be disabled.'));
      return;
    }

    setLocalModuleStates((prev) => ({
      ...prev,
      [moduleKey]: checked
    }));
  };

  const handleSubmoduleSwitch = (subKey, checked) => {
    setLocalSubmoduleStates((prev) => ({
      ...prev,
      [subKey]: checked
    }));
  };

  const handleEnableAllLocal = () => {
    const next = {};
    mergedModules.forEach((m) => {
      next[m.key] = true;
    });
    setLocalModuleStates(next);
    message.info(t('all_modules_selected_on', 'All modules toggled ON. Enter License Key and submit to commit.'));
  };

  const handleDisableNonCoreLocal = () => {
    const next = {};
    mergedModules.forEach((m) => {
      next[m.key] = m.key === 'settings';
    });
    setLocalModuleStates(next);
    message.info(t('non_core_marked_off', 'Non-core modules toggled OFF. Enter License Key and submit to commit.'));
  };

  const handleResetChanges = () => {
    setLocalModuleStates({ ...initialModuleStates });
    setLocalSubmoduleStates({ ...initialSubmoduleStates });
    message.info(t('changes_discarded', 'Unsaved changes discarded.'));
  };

  // --------------------------------------------------------------------------
  // SUBMIT UPDATE MODULES & ENTERPRISE LICENSE
  // Aligned with AURA_v1 System_settings.php::modules():
  // Verifies user_name and license_key against validateLicenseKey;
  // If true, commits changes across aura_modules, aura_settings, and aura_module_settings.
  // --------------------------------------------------------------------------
  const handleSubmitAllModuleSettings = async () => {
    if (!licenseKeyInput || !licenseKeyInput.trim()) {
      message.error(t('enter_license_key_msg', 'Please enter your License Activation Key to authorize module updates.'));
      return;
    }

    setSubmittingModules(true);
    try {
      const res = await axios.post(
        '/api/admin/modules/bulk-update',
        {
          user_name: licenseUserName.trim(),
          license_key: licenseKeyInput.trim(),
          modules: localModuleStates,
          submodules: localSubmoduleStates,
          active_template: selectedWebsiteTemplate
        },
        {
          headers: {
            ...getAuthHeader(),
            'x-license-key': licenseKeyInput.trim()
          }
        }
      );

      if (res.data?.success && res.data.data?.is_valid) {
        message.success(
          t('modules_saved_successfully', 'Enterprise License verified! Module settings successfully saved and synchronized.')
        );
        const verifiedKey = licenseKeyInput.trim();
        setIsLicenseVerified(true);
        setVerifiedLicenseKey(verifiedKey);
        sessionStorage.setItem('aura_license_verified', 'true');
        sessionStorage.setItem('aura_license_key', verifiedKey);

        setInitialModuleStates({ ...localModuleStates });
        setInitialSubmoduleStates({ ...localSubmoduleStates });
        if (typeof setAllModuleStates === 'function') {
          setAllModuleStates(localModuleStates);
        }
        if (typeof setWebsiteTemplate === 'function') {
          setWebsiteTemplate(selectedWebsiteTemplate);
        }
        fetchModuleData();
      } else {
        message.error(res.data?.message || t('invalid_license_key', 'Invalid License Activation Key. Module update denied.'));
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || t('license_verification_failed', 'Invalid License Activation Key. Module update denied.');
      message.error(errMsg);
    } finally {
      setSubmittingModules(false);
    }
  };

  // Standalone License update submission (from top banner modal)
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
        setLicenseKeyInput(values.license_key);
        if (values.user_name) setLicenseUserName(values.user_name);
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
            onClick={handleEnableAllLocal}
            style={{ borderRadius: 10, fontWeight: 600, background: '#16a34a', borderColor: '#16a34a' }}
          >
            {t('enable_all_modules', 'Enable All Modules')}
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleDisableNonCoreLocal}
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
                  {t('license_key', 'License Key')}: <code>{verifiedLicenseKey || licenseKeyInput || licenseData?.license_key || 'hianyan@v1'}</code> &bull; {t('unlimited_users_warehouses', 'Unlimited Users & Unlimited Multi-warehouses')}
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
                    license_key: verifiedLicenseKey || licenseKeyInput || licenseData?.license_key || 'hianyan@v1',
                    license_name: licenseData?.license_name || 'Aura Enterprise Supply B2B',
                    user_name: licenseUserName || 'aura_erp'
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
              {currentTotalCount}
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
              {currentActiveCount}
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
            <Title level={2} style={{ margin: '4px 0 0', color: currentTotalCount - currentActiveCount > 0 ? '#ea580c' : adminTheme.subtext }}>
              {currentTotalCount - currentActiveCount}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>{t('excluded_from_sidebar', 'Excluded from sidebar')}</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Flex justify="space-between" align="center">
              <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>{t('active_system_footprint', 'Active System Footprint')}</Text>
              {hasUnsavedChanges && (
                <Tag color="warning" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
                  {unsavedCount} {t('unsaved', 'unsaved')}
                </Tag>
              )}
            </Flex>
            <Title level={2} style={{ margin: '4px 0 0', color: '#2563eb' }}>
              {currentTotalCount > 0 ? Math.round((currentActiveCount / currentTotalCount) * 100) : 0}%
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>{t('operating_capacity', 'Operating capacity')}</Text>
          </Card>
        </Col>
      </Row>

      {/* 4. Search and Filter Toolbar (Clean Single-Row Layout without the cluttered category pills) */}
      <Card style={cardStyle} styles={{ body: { padding: '14px 20px' } }}>
        <Row gutter={[16, 12]} align="middle">
          {/* Search Input */}
          <Col xs={24} sm={10} md={9}>
            <Input
              prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
              placeholder={t('search_modules_placeholder', 'Search modules (e.g. Sales, Inventory, POS, Clinic)...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: 10 }}
            />
          </Col>

          {/* Quick Status Filters */}
          <Col xs={24} sm={8} md={8}>
            <Space size={6} wrap>
              <Button
                type={selectedFilter === 'all' ? 'primary' : 'default'}
                onClick={() => setSelectedFilter('all')}
                style={{ borderRadius: 8, fontSize: 12.5 }}
              >
                {t('all', 'All')} ({currentTotalCount})
              </Button>
              <Button
                type={selectedFilter === 'open' ? 'primary' : 'default'}
                onClick={() => setSelectedFilter('open')}
                style={{
                  borderRadius: 8,
                  fontSize: 12.5,
                  ...(selectedFilter === 'open' ? { background: '#16a34a', borderColor: '#16a34a', color: '#fff' } : {})
                }}
              >
                {t('active', 'Active')} ({currentActiveCount})
              </Button>
              <Button
                type={selectedFilter === 'closed' ? 'primary' : 'default'}
                onClick={() => setSelectedFilter('closed')}
                style={{
                  borderRadius: 8,
                  fontSize: 12.5,
                  ...(selectedFilter === 'closed' ? { background: '#ea580c', borderColor: '#ea580c', color: '#fff' } : {})
                }}
              >
                {t('disabled', 'Disabled')} ({currentTotalCount - currentActiveCount})
              </Button>
            </Space>
          </Col>

          {/* Category Dropdown (Clean, modern dropdown replacing the messy 15 wrapping tags!) */}
          <Col xs={24} sm={6} md={7} style={{ textAlign: 'right' }}>
            <Flex justify="flex-end" align="center" gap={10} wrap="wrap">
              {hasUnsavedChanges && (
                <Tag color="warning" icon={<ExclamationCircleOutlined />} style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
                  {unsavedCount} {t('unsaved_changes', 'modified')}
                </Tag>
              )}
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 190 }}
                placeholder={t('filter_by_category', 'Filter Category')}
                options={[
                  { value: 'all', label: `📂 ${t('all_categories', 'All Categories')}` },
                  ...categoryOrder.map((cat) => ({
                    value: cat,
                    label: t(cat, cat)
                  }))
                ]}
              />
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
                const isOpen = Boolean(m.enabled);
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
                      <Flex justify="space-between" align="flex-start" style={{ marginBottom: 10 }}>
                        <Flex align="center" gap={12}>
                          <div
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: 12,
                              background: isOpen ? `${m.accent || primary}18` : adminTheme.cardMuted,
                              color: isOpen ? (m.accent || primary) : adminTheme.subtext,
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 22,
                              transition: 'all 0.2s ease',
                              flexShrink: 0
                            }}
                          >
                            {m.favicon ? (
                              <i className={m.favicon} style={{ fontSize: 22 }} />
                            ) : (
                              <IconComponent />
                            )}
                          </div>

                          <div>
                            <Title level={5} style={{ margin: 0, color: adminTheme.text }}>
                              {t(m.label, m.label)}
                            </Title>
                            <Flex align="center" gap={6} wrap="wrap" style={{ marginTop: 4 }}>
                              <Tag
                                color={isOpen ? 'green' : 'default'}
                                style={{
                                  borderRadius: 6,
                                  fontSize: 10.5,
                                  padding: '1px 7px',
                                  fontWeight: 600,
                                  margin: 0
                                }}
                              >
                                {isOpen ? t('active_open', 'ACTIVE / OPEN') : t('disabled_hidden', 'DISABLED / CLOSED')}
                              </Tag>
                              {m.isDirty && (
                                <Tag color="orange" style={{ borderRadius: 6, fontSize: 10, margin: 0, fontWeight: 700 }}>
                                  {t('pending_save', 'PENDING SAVE')}
                                </Tag>
                              )}
                              {m.style && (
                                <Tag style={{ borderRadius: 6, fontSize: 10, margin: 0, background: `${m.accent || primary}15`, color: m.accent || primary, borderColor: `${m.accent || primary}33`, fontWeight: 600 }}>
                                  {m.style}
                                </Tag>
                              )}
                            </Flex>
                          </div>
                        </Flex>

                        <Flex vertical align="flex-end" gap={4}>
                          <Tooltip title={m.isDirty ? t('pending_save_tooltip', 'Pending submission with License Key') : t('toggle_module_state', 'Click to turn module ON or OFF')}>
                            <Switch
                              checked={isOpen}
                              onChange={(checked) => handleModuleSwitch(m.key, checked)}
                              checkedChildren="ON"
                              unCheckedChildren="OFF"
                              style={{
                                background: isOpen ? '#16a34a' : '#94a3b8'
                              }}
                            />
                          </Tooltip>
                        </Flex>
                      </Flex>

                      {/* Technical Module Metadata Badges */}
                      <Flex align="center" gap={6} wrap="wrap" style={{ marginBottom: 10 }}>
                        {m.module && (
                          <Tooltip title={t('settings_column_tooltip', 'Settings flag in aura_settings')}>
                            <Tag style={{ borderRadius: 6, fontSize: 11, background: adminTheme.cardMuted, margin: 0 }}>
                              <code>Settings-&gt;{m.module}</code>
                            </Tag>
                          </Tooltip>
                        )}
                        {m.controller && (
                          <Tooltip title={t('controller_tooltip', 'Controller / Route handler')}>
                            <Tag icon={<GlobalOutlined />} style={{ borderRadius: 6, fontSize: 11, margin: 0 }}>
                              {m.controller}
                            </Tag>
                          </Tooltip>
                        )}
                        {m.image && (
                          <Tag style={{ borderRadius: 6, fontSize: 10.5, margin: 0, color: adminTheme.subtext }}>
                            {m.image}
                          </Tag>
                        )}
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
                                  <Badge count={m.submodules.filter((s) => (localSubmoduleStates[s.key] !== undefined ? localSubmoduleStates[s.key] : submoduleStates[s.key] !== false)).length} style={{ backgroundColor: primary }} />
                                </Flex>
                              ),
                              children: (
                                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                  {m.submodules.map((sub) => {
                                    const subActive = localSubmoduleStates[sub.key] !== undefined
                                      ? localSubmoduleStates[sub.key]
                                      : submoduleStates[sub.key] !== false;
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
                                          onChange={(checked) => handleSubmoduleSwitch(sub.key, checked)}
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

                      {/* Website Template Sub-module Selector for E-commerce (Multi-Service Architecture) */}
                      {m.key === 'ecommerce' && (
                        <div
                          style={{
                            marginBottom: 14,
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}`
                          }}
                        >
                          <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                            <Flex align="center" gap={6}>
                              <GlobalOutlined style={{ color: primary, fontSize: 14 }} />
                              <Text strong style={{ fontSize: 12, color: adminTheme.text }}>
                                {t('active_website_template', 'Active Website Template (Multi-Service)')}
                              </Text>
                            </Flex>
                            <Tag color={isOpen ? 'success' : 'default'} style={{ margin: 0, borderRadius: 6, fontSize: 10.5 }}>
                              {isOpen ? t('storefront_online', 'ONLINE') : t('storefront_offline', 'OFFLINE')}
                            </Tag>
                          </Flex>

                          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 10 }}>
                            {t('select_website_template_desc', 'Select active storefront service template (Default E-commerce, Education, Company Profile, Booking):')}
                          </Text>

                          <Radio.Group
                            value={selectedWebsiteTemplate}
                            onChange={(e) => {
                              setSelectedWebsiteTemplate(e.target.value);
                              handleSubmoduleSwitch(`ecommerce-${e.target.value}`, true);
                            }}
                            style={{ width: '100%' }}
                            disabled={!isOpen}
                          >
                            <Space direction="vertical" size={6} style={{ width: '100%' }}>
                              {Object.values(WEBSITE_TEMPLATES).map((tmpl) => {
                                const isSelected = selectedWebsiteTemplate === tmpl.id;
                                return (
                                  <div
                                    key={tmpl.id}
                                    onClick={() => {
                                      if (isOpen) {
                                        setSelectedWebsiteTemplate(tmpl.id);
                                        handleSubmoduleSwitch(`ecommerce-${tmpl.id}`, true);
                                      }
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '7px 10px',
                                      borderRadius: 8,
                                      cursor: isOpen ? 'pointer' : 'not-allowed',
                                      background: isSelected ? `${primary}14` : (isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'),
                                      border: `1px solid ${isSelected ? `${primary}66` : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0')}`,
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <Flex align="center" gap={8}>
                                      <Radio value={tmpl.id} style={{ margin: 0 }} />
                                      <div>
                                        <Text style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: adminTheme.text, display: 'block' }}>
                                          {tmpl.name}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 10.5, lineHeight: 1.2, display: 'block' }}>
                                          {tmpl.description}
                                        </Text>
                                      </div>
                                    </Flex>
                                    {isSelected && (
                                      <Tag color="cyan" style={{ margin: 0, fontSize: 10, borderRadius: 4, fontWeight: 700 }}>
                                        ACTIVE
                                      </Tag>
                                    )}
                                  </div>
                                );
                              })}
                            </Space>
                          </Radio.Group>

                          <Flex justify="space-between" align="center" style={{ marginTop: 10 }}>
                            <Button
                              size="small"
                              type="link"
                              icon={<ExportOutlined />}
                              onClick={() => window.open('/', '_blank')}
                              style={{ padding: 0, fontSize: 11, color: primary }}
                            >
                              {t('preview_live_website', 'Preview Storefront ↗')}
                            </Button>
                            {selectedWebsiteTemplate !== activeWebsiteTemplate && (
                              <Tag color="gold" style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                                {t('template_pending_save', 'Template change pending save')}
                              </Tag>
                            )}
                          </Flex>
                        </div>
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
                          <Flex align="center" gap={8}>
                            {m.key === 'ecommerce' && (
                              <Button
                                type="default"
                                size="small"
                                icon={<ExportOutlined />}
                                onClick={() => window.open('/', '_blank')}
                                style={{ borderRadius: 6, fontSize: 11.5 }}
                              >
                                {t('live_store', 'Live Store')}
                              </Button>
                            )}
                            <Button
                              type="link"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => navigate(`/admins?module=${m.controller || m.key}`)}
                              style={{ padding: 0, fontWeight: 600, color: primary }}
                            >
                              {t('explore_module', 'Explore Module')}
                            </Button>
                          </Flex>
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
      {/* 6. AURA ENTERPRISE LICENSE & MODULE SAVE SECTION (Replication of AURA_v1 modules.php) */}
      {/* ---------------------------------------------------------------------- */}
      <Card
        style={{
          ...cardStyle,
          border: `2px solid ${adminTheme.primary}44`,
          boxShadow: `0 8px 24px ${adminTheme.primary}15`,
          marginTop: 12
        }}
        styles={{ body: { padding: '24px 28px' } }}
      >
        <Flex align="center" gap={14} style={{ marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: adminTheme.primary,
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 24,
              boxShadow: `0 6px 16px ${adminTheme.primary}33`
            }}
          >
            <SafetyCertificateOutlined />
          </div>
          <div>
            <Flex align="center" gap={8} wrap="wrap">
              <Title level={4} style={{ margin: 0, color: adminTheme.text, fontWeight: 700 }}>
                {t('aura_enterprise_license_and_settings', 'Aura Enterprise License & Module Update Credentials')}
              </Title>
              {hasUnsavedChanges && (
                <Tag color="warning" icon={<ExclamationCircleOutlined />} style={{ borderRadius: 6, fontWeight: 700 }}>
                  {unsavedCount} {t('unsaved_changes', 'modules modified')}
                </Tag>
              )}
            </Flex>
            <Text style={{ color: adminTheme.subtext, fontSize: 13, display: 'block', marginTop: 3 }}>
              {t('aura_license_note', 'Aligned with AURA_v1: enter your Administrator credentials and License Activation Key (e.g. hianyan@v1) to authenticate and synchronize all module changes to the database.')}
            </Text>
          </div>
        </Flex>

        <Row gutter={[20, 16]} align="bottom">
          <Col xs={24} sm={12} md={7}>
            <Text strong style={{ fontSize: 13, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
              {t('admin_username', 'Administrator Username')}
            </Text>
            <Input
              prefix={<TeamOutlined style={{ color: adminTheme.subtext }} />}
              value={licenseUserName}
              onChange={(e) => setLicenseUserName(e.target.value)}
              placeholder="aura_erp"
              style={{ borderRadius: 10, height: 42 }}
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Text strong style={{ fontSize: 13, color: adminTheme.text, display: 'block', marginBottom: 6 }}>
              {t('license_activation_key', 'License Activation Key')}
            </Text>
            <Input.Password
              prefix={<KeyOutlined style={{ color: adminTheme.subtext }} />}
              value={licenseKeyInput}
              onChange={(e) => setLicenseKeyInput(e.target.value)}
              placeholder="e.g. hianyan@v1 or AURA-ENT-2026-X892-PRO"
              style={{ borderRadius: 10, height: 42 }}
            />
          </Col>

          <Col xs={24} md={9}>
            <Flex gap={10} wrap="wrap">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={submittingModules}
                onClick={handleSubmitAllModuleSettings}
                style={{
                  height: 42,
                  borderRadius: 10,
                  fontWeight: 700,
                  background: '#16a34a',
                  borderColor: '#16a34a',
                  flex: 1
                }}
              >
                {t('submit_update_modules', 'Update Aura Enterprise License & Save')}
              </Button>
              {hasUnsavedChanges && (
                <Button
                  onClick={handleResetChanges}
                  style={{ height: 42, borderRadius: 10, fontWeight: 600 }}
                >
                  {t('discard_changes', 'Discard')}
                </Button>
              )}
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* ---------------------------------------------------------------------- */}
      {/* STICKY / FLOATING BOTTOM ACTION BAR FOR QUICK SUBMIT */}
      {/* ---------------------------------------------------------------------- */}
      {hasUnsavedChanges && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            background: adminTheme.isDark ? '#1e293b' : '#ffffff',
            border: `2px solid ${adminTheme.primary}`,
            borderRadius: 16,
            padding: '12px 24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            maxWidth: '92vw'
          }}
        >
          <Badge count={unsavedCount} overflowCount={99} style={{ backgroundColor: '#f59e0b' }}>
            <SafetyCertificateOutlined style={{ fontSize: 24, color: adminTheme.primary }} />
          </Badge>
          <div>
            <Text strong style={{ color: adminTheme.text, fontSize: 13.5, display: 'block' }}>
              {unsavedCount} {t('unsaved_module_changes', 'modules modified')}
            </Text>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>
              {t('click_to_commit_changes', 'Submit with License Activation Key to commit changes across database')}
            </Text>
          </div>
          <Space size={10}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={submittingModules}
              onClick={handleSubmitAllModuleSettings}
              style={{
                borderRadius: 10,
                fontWeight: 700,
                background: '#16a34a',
                borderColor: '#16a34a'
              }}
            >
              {t('submit_and_save', 'Submit & Save')}
            </Button>
            <Button
              onClick={handleResetChanges}
              style={{ borderRadius: 10 }}
            >
              {t('discard', 'Discard')}
            </Button>
          </Space>
        </div>
      )}

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
        destroyOnHidden
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
        destroyOnHidden
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
        destroyOnHidden
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
