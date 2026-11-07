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
  money_change: MoneyCollectOutlined,
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
  money_change: 'Finance & Banking',
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

// Classic BPAS / AURA_v1 Modules (Exact match to c:\wamp64\www\school_new_version\themes\default\admin\views\settings\modules.php)
export const CLASSIC_MODULES = [
  // Row 1
  { key: 'module_inventory', label: 'Inventory', canonical: 'inventory' },
  { key: 'module_asset', label: 'Asset', canonical: 'asset' },
  { key: 'module_purchase', label: 'Purchase', canonical: 'procurement' },
  { key: 'module_sale', label: 'Sales', canonical: 'sales' },
  { key: 'pos', label: 'POS', canonical: 'pos' },
  { key: 'project', label: 'Project', canonical: 'project' },

  // Row 2
  { key: 'module_manufacturing', label: 'Manufacturing', canonical: 'manufaturing' },
  { key: 'module_account', label: 'Accounting', canonical: 'accounting' },
  { key: 'module_hr', label: 'Core HR', canonical: 'hr' },
  { key: 'payroll', label: 'Payroll', canonical: 'payroll' },
  { key: 'attendance', label: 'Attendance', canonical: 'attendance' },
  { key: 'module_crm', label: 'CRM', canonical: 'crm' },

  // Row 3
  { key: 'module_property', label: 'Property', canonical: 'property' },
  { key: 'module_clinic', label: 'Clinic', canonical: 'clinic' },
  { key: 'module_tax', label: 'Tax', canonical: 'tax' },
  { key: 'module_school', label: 'School', canonical: 'school' },
  { key: 'module_hotel_apartment', label: 'Hotel', canonical: 'hotel_apartment' },
  { key: 'shop', label: 'Ecommerce', canonical: 'ecommerce', altKey: 'ecommerce' },

  // Row 4
  { key: 'module_email', label: 'Email Marketing', canonical: 'email_marketing' },
  { key: 'module_express', label: 'Express', canonical: 'express' },
  { key: 'module_loan', label: 'Loan', canonical: 'loan' },
  { key: 'module_pawn', label: 'Pawns', canonical: 'pawn' },
  { key: 'module_save', label: 'Savings', canonical: 'saving' },
  { key: 'module_installment', label: 'Installmentings', canonical: 'installment' },

  // Row 5
  { key: 'module_gym', label: 'Gyms', canonical: 'gym' },
  { key: 'module_repair', label: 'Repair', canonical: 'repair' },
  { key: 'module_rental', label: 'Rental', canonical: 'rental' },
  { key: 'module_concrete', label: 'Concrete', canonical: 'concrete' },
  { key: 'module_truckings', label: 'Truckings', canonical: 'truckings' },
  { key: 'module_clearance', label: 'Clearance', canonical: 'clearance' },

  // Row 6
  { key: 'reward_exchange', label: 'Reward Exchange', canonical: 'reward_exchange' },
  { key: 'module_exchange', label: 'Money Exchange', canonical: 'money_change' },
  { key: 'module_fuel', label: 'Module fuel', canonical: 'fuel' },
  { key: 'module_e_ticket', label: 'E ticket', canonical: 'e_ticket', altKey: 'e_ticket' },
  { key: 'module_expense', label: 'Module expense', canonical: 'expense' },
];

// Classic BPAS / AURA_v1 Sub-Modules (Exact match to c:\wamp64\www\school_new_version\themes\default\admin\views\settings\modules.php)
export const CLASSIC_SUBMODULES = [
  // Row 1
  {
    key: 'multi_level',
    label: 'Multi level',
    options: [
      { value: 1, label: 'Yes' },
      { value: 0, label: 'No' },
    ],
  },
  {
    key: 'multi_biller',
    label: 'Multi biller',
    options: [
      { value: 1, label: 'Yes' },
      { value: 0, label: 'No' },
    ],
  },
  {
    key: 'multi_warehouse',
    label: 'Multi Warehouse',
    options: [
      { value: 1, label: 'Yes' },
      { value: 0, label: 'No' },
    ],
  },
  {
    key: 'stock_using',
    label: 'Stock using',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },

  // Row 2
  {
    key: 'sale_consignment',
    label: 'Sale Consignment',
    options: [
      { value: 1, label: 'Yes' },
      { value: 0, label: 'No' },
    ],
  },
  {
    key: 'quotation',
    label: 'Quotation',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },
  {
    key: 'sale_order',
    label: 'Sale Order',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },
  {
    key: 'monthly_auto_invoice',
    label: 'Monthly auto invoice',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },

  // Row 3
  {
    key: 'purchase_request',
    label: 'Purchase Request',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },
  {
    key: 'purchase_order',
    label: 'Purchase Order',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
  },
  {
    key: 'sale_man',
    label: 'Sale Man or Agency',
    options: [
      { value: 1, label: 'Yes' },
      { value: 0, label: 'No' },
    ],
  },
  {
    key: 'commission',
    label: 'Commission',
    options: [
      { value: 1, label: 'Yes' },
      { value: 0, label: 'No' },
    ],
  },

  // Row 4
  {
    key: 'maintenance',
    label: 'Maintenance',
    options: [
      { value: 1, label: 'Yes' },
      { value: 0, label: 'No' },
    ],
  },
  {
    key: 'delivery',
    label: 'Delivery',
    options: [
      { value: 1, label: 'Yes' },
      { value: 0, label: 'No' },
    ],
  },
  {
    key: 'driver',
    label: 'Driver',
    options: [
      { value: 1, label: 'Yes' },
      { value: 0, label: 'No' },
    ],
  },
  {
    key: 'school_level',
    label: 'school level',
    options: [
      { value: 'all', label: 'All' },
      { value: '0', label: 'University' },
      { value: '1', label: 'School K12' },
    ],
  },
];

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

  // Active View Mode: 'classic' (BPAS / AURA_v1 System Control) | 'advanced' (Cards & Permissions Matrix)
  const [activeViewMode, setActiveViewMode] = useState('classic');

  // Classic System Control state (34 modules + 16 sub-modules)
  const [classicModulesState, setClassicModulesState] = useState(() => {
    const init = {};
    CLASSIC_MODULES.forEach((m) => {
      init[m.key] = 1;
    });
    return init;
  });

  const [classicSubmodulesState, setClassicSubmodulesState] = useState(() => {
    const init = {};
    CLASSIC_SUBMODULES.forEach((sub) => {
      init[sub.key] = sub.key === 'school_level' ? 'all' : (sub.options?.[0]?.value ?? 1);
    });
    return init;
  });

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
  const [licenseUserName, setLicenseUserName] = useState(
    () => sessionStorage.getItem('aura_license_user') || 'sbcsolution'
  );
  const [licenseKeyInput, setLicenseKeyInput] = useState(
    () => sessionStorage.getItem('aura_license_key') || 'Sbc@key4578'
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
        const settingsObj = modRes.value.data.data?.settings || {};
        setDbModules(fetched);

        // Populate classic view states from aura_settings
        const cMods = {};
        CLASSIC_MODULES.forEach((m) => {
          const val = settingsObj[m.key] !== undefined
            ? settingsObj[m.key]
            : (m.altKey && settingsObj[m.altKey] !== undefined ? settingsObj[m.altKey] : 1);
          cMods[m.key] = Number(val) === 1 ? 1 : 0;
        });
        setClassicModulesState(cMods);

        const cSubs = {};
        CLASSIC_SUBMODULES.forEach((sub) => {
          if (sub.key === 'school_level') {
            cSubs[sub.key] = settingsObj[sub.key] !== undefined ? String(settingsObj[sub.key]) : 'all';
          } else {
            const val = settingsObj[sub.key] !== undefined ? settingsObj[sub.key] : (sub.options?.[0]?.value ?? 1);
            cSubs[sub.key] = Number(val) === 1 ? 1 : 0;
          }
        });
        setClassicSubmodulesState(cSubs);

        if (settingsObj.license_key) {
          setLicenseKeyInput(settingsObj.license_key);
        }

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

  // Submit Classic System Settings (Modules & Sub-Modules)
  const handleSubmitClassicSettings = async () => {
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
          modules: classicModulesState,
          submodules: classicSubmodulesState,
          active_template: selectedWebsiteTemplate
        },
        {
          headers: {
            ...getAuthHeader(),
            'x-license-key': licenseKeyInput.trim()
          }
        }
      );

      if (res.data?.success) {
        message.success(t('setting_updated', 'Setting updated successfully!'));
        const verifiedKey = licenseKeyInput.trim();
        setIsLicenseVerified(true);
        setVerifiedLicenseKey(verifiedKey);
        sessionStorage.setItem('aura_license_verified', 'true');
        sessionStorage.setItem('aura_license_key', verifiedKey);
        sessionStorage.setItem('aura_license_user', licenseUserName.trim());

        // Sync with AdminModulesContext so application navigation reacts immediately
        const contextMap = {};
        CLASSIC_MODULES.forEach((m) => {
          const val = classicModulesState[m.key];
          contextMap[m.key] = val === 1 || val === true;
          if (m.canonical) contextMap[m.canonical] = val === 1 || val === true;
          if (m.altKey) contextMap[m.altKey] = val === 1 || val === true;
        });
        CLASSIC_SUBMODULES.forEach((sub) => {
          const val = classicSubmodulesState[sub.key];
          contextMap[sub.key] = val === 1 || val === '1' || val === true;
        });
        if (typeof setAllModuleStates === 'function') {
          setAllModuleStates(contextMap);
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
      {/* Embedded Classic CSS matching AURA_v1 modules.php */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .scheduler-border {
              border: 1px solid #dcdfe6 !important;
              padding: 0 1.25rem 1.25rem 1.25rem !important;
              margin: 0 0 1.5rem 0 !important;
              border-radius: 6px;
            }
            .scheduler-border legend {
              font-size: 0.95rem !important;
              font-weight: 600 !important;
              text-align: left !important;
              width: auto !important;
              padding: 0 8px !important;
              border-bottom: none !important;
              margin-bottom: 12px !important;
              background: transparent !important;
            }
            .classic-switch {
              position: relative;
              display: inline-block;
              width: 52px;
              height: 28px;
              margin-top: 4px;
            }
            .classic-switch input {
              opacity: 0;
              width: 0;
              height: 0;
            }
            .classic-slider {
              position: absolute;
              cursor: pointer;
              top: 0; left: 0; right: 0; bottom: 0;
              background-color: #cbd5e1;
              transition: .3s;
              border-radius: 28px;
            }
            .classic-slider:before {
              position: absolute;
              content: "";
              height: 22px; width: 22px;
              left: 3px; bottom: 3px;
              background-color: white;
              transition: .3s;
              border-radius: 50%;
              box-shadow: 0 1px 3px rgba(0,0,0,0.25);
            }
            .classic-switch input:checked + .classic-slider {
              background-color: #2196F3;
            }
            .classic-switch input:checked + .classic-slider:before {
              transform: translateX(24px);
            }
            .classic-select {
              width: 100%;
              height: 38px;
              padding: 6px 12px;
              font-size: 13px;
              line-height: 1.42857143;
              color: #334155;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              box-shadow: inset 0 1px 1px rgba(0,0,0,.075);
              transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;
            }
            .classic-select:focus {
              border-color: #66afe9;
              outline: 0;
              box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
            }
            .classic-input {
              width: 100%;
              height: 38px;
              padding: 6px 12px;
              font-size: 13px;
              color: #334155;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              box-shadow: inset 0 1px 1px rgba(0,0,0,.075);
              transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;
            }
            .classic-input:focus {
              border-color: #66afe9;
              outline: 0;
              box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
            }
            @media (max-width: 991px) {
              .modules-classic-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              }
              .submodules-classic-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
            }
            @media (max-width: 640px) {
              .modules-classic-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
              .submodules-classic-grid {
                grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
              }
              .license-classic-grid {
                grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
              }
            }
          `,
        }}
      />

      {/* Global Top Header & Mode Switcher */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingBottom: 14,
          borderBottom: `1px solid ${adminTheme.isDark ? '#334155' : '#e2e8f0'}`,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, color: '#2563eb' }}>
              <SettingOutlined />
            </span>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#2563eb',
                margin: 0,
              }}
            >
              {t('modules', 'Modules')}
            </h2>
          </div>
          <p
            style={{
              fontSize: 13,
              color: adminTheme.isDark ? '#94a3b8' : '#64748b',
              margin: '4px 0 0 0',
            }}
          >
            {t(
              'update_info',
              'Please update the information below. The field labels marked with * are required input fields.'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Radio.Group
            value={activeViewMode}
            onChange={(e) => setActiveViewMode(e.target.value)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="classic">
              <AppstoreOutlined /> {t('system_control', 'System Control (Classic)')}
            </Radio.Button>
            <Radio.Button value="advanced">
              <SlidersOutlined /> {t('cards_and_permissions', 'Cards & Permissions')}
            </Radio.Button>
          </Radio.Group>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              resetModules();
              fetchModuleData();
            }}
            loading={loading}
          >
            {t('refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* CLASSIC BPAS SYSTEM CONTROL (MODULES & SUB-MODULES)                     */}
      {/* Exact match to media_1793440784750_25fd2fb6.png and AURA_v1 modules.php */}
      {/* ---------------------------------------------------------------------- */}
      {activeViewMode === 'classic' && (
        <div
          style={{
            background: adminTheme.isDark ? '#1e293b' : '#ffffff',
            borderRadius: 8,
            padding: '24px 28px',
            border: `1px solid ${adminTheme.isDark ? '#334155' : '#e2e8f0'}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* Section 1: Modules (6 columns) */}
          <fieldset
            className="scheduler-border"
            style={{
              borderColor: adminTheme.isDark ? '#334155' : '#e2e8f0',
              background: adminTheme.isDark ? '#1e293b' : '#ffffff',
            }}
          >
            <legend
              className="scheduler-border"
              style={{
                color: adminTheme.isDark ? '#f1f5f9' : '#1e293b',
              }}
            >
              {t('modules', 'Modules')}
            </legend>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                gap: '24px 16px',
                padding: '8px 0 16px 0',
              }}
              className="modules-classic-grid"
            >
              {CLASSIC_MODULES.map((m) => {
                const isChecked = classicModulesState[m.key] === 1;
                return (
                  <div
                    key={m.key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: adminTheme.isDark ? '#e2e8f0' : '#334155',
                        marginBottom: 6,
                        userSelect: 'none',
                      }}
                    >
                      {t(m.canonical || m.key, m.label)}
                    </label>
                    <div className="controls">
                      <label className="classic-switch">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setClassicModulesState((prev) => ({
                              ...prev,
                              [m.key]: checked ? 1 : 0,
                            }));
                          }}
                        />
                        <span className="classic-slider"></span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* Section 2: sub_modules (4 columns) */}
          <fieldset
            className="scheduler-border"
            style={{
              borderColor: adminTheme.isDark ? '#334155' : '#e2e8f0',
              background: adminTheme.isDark ? '#1e293b' : '#ffffff',
              marginTop: 20,
            }}
          >
            <legend
              className="scheduler-border"
              style={{
                color: adminTheme.isDark ? '#f1f5f9' : '#1e293b',
              }}
            >
              {t('sub_modules', 'sub_modules')}
            </legend>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '20px 24px',
                padding: '8px 0 16px 0',
              }}
              className="submodules-classic-grid"
            >
              {CLASSIC_SUBMODULES.map((sub) => {
                const currentVal =
                  classicSubmodulesState[sub.key] !== undefined
                    ? classicSubmodulesState[sub.key]
                    : (sub.key === 'school_level' ? 'all' : 1);
                return (
                  <div key={sub.key}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 600,
                        color: adminTheme.isDark ? '#e2e8f0' : '#334155',
                        marginBottom: 6,
                      }}
                    >
                      {t(sub.key, sub.label)}
                    </label>
                    <select
                      className="classic-select"
                      style={{
                        backgroundColor: adminTheme.isDark ? '#0f172a' : '#ffffff',
                        borderColor: adminTheme.isDark ? '#334155' : '#cbd5e1',
                        color: adminTheme.isDark ? '#f8fafc' : '#334155',
                      }}
                      value={currentVal}
                      onChange={(e) => {
                        const val =
                          sub.key === 'school_level'
                            ? e.target.value
                            : Number(e.target.value);
                        setClassicSubmodulesState((prev) => ({
                          ...prev,
                          [sub.key]: val,
                        }));
                      }}
                    >
                      {sub.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(String(opt.label).toLowerCase(), opt.label)}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* Section 3: License Key (2 columns) */}
          <fieldset
            className="scheduler-border"
            style={{
              borderColor: adminTheme.isDark ? '#334155' : '#e2e8f0',
              background: adminTheme.isDark ? '#1e293b' : '#ffffff',
              marginTop: 20,
            }}
          >
            <legend
              className="scheduler-border"
              style={{
                color: adminTheme.isDark ? '#f1f5f9' : '#1e293b',
              }}
            >
              {t('license_key', 'License Key')}
            </legend>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '20px 24px',
                padding: '8px 0 16px 0',
              }}
              className="license-classic-grid"
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: adminTheme.isDark ? '#e2e8f0' : '#334155',
                    marginBottom: 6,
                  }}
                >
                  {t('user_name', 'User Name')} *
                </label>
                <input
                  type="text"
                  className="classic-input"
                  style={{
                    backgroundColor: adminTheme.isDark ? '#0f172a' : '#ffffff',
                    borderColor: adminTheme.isDark ? '#334155' : '#cbd5e1',
                    color: adminTheme.isDark ? '#f8fafc' : '#334155',
                  }}
                  value={licenseUserName}
                  placeholder="e.g. sbcsolution or aura_erp"
                  onChange={(e) => setLicenseUserName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: adminTheme.isDark ? '#e2e8f0' : '#334155',
                    marginBottom: 6,
                  }}
                >
                  {t('license_key', 'License Key')} *
                </label>
                <input
                  type="password"
                  className="classic-input"
                  style={{
                    backgroundColor: adminTheme.isDark ? '#0f172a' : '#ffffff',
                    borderColor: adminTheme.isDark ? '#334155' : '#cbd5e1',
                    color: adminTheme.isDark ? '#f8fafc' : '#334155',
                  }}
                  value={licenseKeyInput}
                  placeholder="e.g. Sbc@key4578"
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  required
                />
              </div>
            </div>
          </fieldset>

          {/* Action Button: Update Settings */}
          <div style={{ marginTop: 24 }}>
            <Button
              type="primary"
              size="large"
              loading={submittingModules}
              onClick={handleSubmitClassicSettings}
              style={{
                backgroundColor: '#337ab7',
                borderColor: '#2e6da4',
                borderRadius: 4,
                fontWeight: 600,
                fontSize: 14,
                minWidth: 160,
                height: 42,
              }}
            >
              {t('update_settings', 'Update Settings')}
            </Button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* ADVANCED VIEW: MODULE CARDS & PERMISSIONS MATRIX                       */}
      {/* ---------------------------------------------------------------------- */}
      {activeViewMode === 'advanced' && (
        <>
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
        <Col xs={24} sm={12} xl={6}>
          <Card style={cardStyle} styles={{ body: { padding: 18 } }}>
            <Text style={{ color: adminTheme.subtext, fontSize: 12 }}>{t('total_erp_modules', 'Total ERP Modules')}</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: adminTheme.text }}>
              {currentTotalCount}
            </Title>
            <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>{t('available_business_modules', 'Available business modules')}</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
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

        <Col xs={24} sm={12} xl={6}>
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

        <Col xs={24} sm={12} xl={6}>
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
                  <Col xs={24} sm={12} lg={8} xl={8} xxl={6} key={m.key}>
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
                              width: 48,
                              height: 48,
                              borderRadius: 14,
                              background: isOpen ? `${m.accent || primary}18` : adminTheme.cardMuted,
                              color: isOpen ? (m.accent || primary) : adminTheme.subtext,
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 24,
                              transition: 'all 0.2s ease',
                              flexShrink: 0
                            }}
                          >
                            <IconComponent style={{ fontSize: 24 }} />
                          </div>

                          <div>
                            <Title level={5} style={{ margin: 0, color: adminTheme.text, fontWeight: 700 }}>
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

                      {/* Clean Module Route & Capability Badges */}
                      <Flex align="center" gap={6} wrap="wrap" style={{ marginBottom: 10 }}>
                        <Tag color="blue" style={{ borderRadius: 6, fontSize: 11, margin: 0, fontWeight: 500 }}>
                          /{m.controller || m.key}
                        </Tag>
                        {m.submodules && m.submodules.length > 0 && (
                          <Tag style={{ borderRadius: 6, fontSize: 11, margin: 0, background: adminTheme.cardMuted, color: adminTheme.subtext, fontWeight: 500 }}>
                            {m.submodules.length} {t('capabilities', 'Capabilities')}
                          </Tag>
                        )}
                        <Tag color="purple" style={{ borderRadius: 6, fontSize: 11, margin: 0, fontWeight: 500 }}>
                          <SafetyCertificateOutlined style={{ marginRight: 4 }} /> RBAC
                        </Tag>
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
      </>
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
          <Flex align="center" justify="space-between" wrap="wrap" gap={12} style={{ width: '100%', paddingRight: 16 }}>
            <Flex align="center" gap={10}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${adminTheme.primary}18`,
                  color: adminTheme.primary,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 18,
                }}
              >
                <SafetyCertificateOutlined />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong style={{ fontSize: 16, color: adminTheme.text }}>
                    {t('module_permissions_title', 'Module Permissions')}: {selectedModuleForPerms?.label}
                  </Text>
                  <Tag color="processing" style={{ borderRadius: 6, fontWeight: 600 }}>
                    <code>{selectedModuleForPerms?.key}</code>
                  </Tag>
                </div>
                <Text style={{ fontSize: 12, color: adminTheme.subtext }}>
                  {filteredPermissionKeys.length} {t('permissions_configured', 'action permissions configured across')} {(modulePermsData.groups || []).length} {t('user_roles', 'user roles')}
                </Text>
              </div>
            </Flex>
            <Space size={8}>
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
            </Space>
          </Flex>
        }
        open={permissionsDrawerOpen}
        onClose={() => setPermissionsDrawerOpen(false)}
        width={1060}
        destroyOnHidden
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          {/* Instructions and Summary Banner */}
          <Alert
            type="info"
            showIcon
            style={{ borderRadius: 12 }}
            message={
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                {t('rbac_module_instructions', 'Role-Based Access Control (RBAC) Matrix for')} {selectedModuleForPerms?.label}
              </span>
            }
            description={
              <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.5 }}>
                {t(
                  'rbac_module_desc',
                  'Configure granular access permissions for each role. Checkboxes indicate granted access for specific module actions. Root Owner and Administrator roles maintain permanent full access.'
                )}
              </div>
            }
          />

          {/* Search, Filter, and Action Bar */}
          <Card
            styles={{ body: { padding: '12px 16px' } }}
            style={{ borderRadius: 12, border: `1px solid ${adminTheme.border}` }}
          >
            <Row gutter={[12, 12]} align="middle" justify="space-between">
              <Col xs={24} sm={12} md={9}>
                <Input
                  prefix={<SearchOutlined style={{ color: adminTheme.subtext }} />}
                  placeholder={t('search_permissions', 'Search permission keys or actions...')}
                  value={permSearchQuery}
                  onChange={(e) => setPermSearchQuery(e.target.value)}
                  allowClear
                  style={{ borderRadius: 8 }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Radio.Group
                  value={permAreaFilter}
                  onChange={(e) => setPermAreaFilter(e.target.value)}
                  buttonStyle="solid"
                  size="middle"
                >
                  <Radio.Button value="all">
                    {t('all', 'All')} ({modulePermsData.keys?.length || 0})
                  </Radio.Button>
                  <Radio.Button value="admin">
                    {t('admin_area', 'Admin Portal')} ({(modulePermsData.keys || []).filter(k => k.area === 'admin').length})
                  </Radio.Button>
                  <Radio.Button value="website">
                    {t('website_area', 'Website')} ({(modulePermsData.keys || []).filter(k => k.area === 'website').length})
                  </Radio.Button>
                </Radio.Group>
              </Col>
              <Col xs={24} sm={24} md={7} style={{ textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveModulePermissions}
                  loading={savingPerms}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    background: '#16a34a',
                    borderColor: '#16a34a',
                    height: 36,
                    padding: '0 18px',
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                  }}
                >
                  {t('save_permissions_matrix', 'Save Permissions Matrix')}
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Permissions Table & Role Checkboxes */}
          <Table
            dataSource={filteredPermissionKeys}
            rowKey="permission_key"
            loading={loadingPerms}
            pagination={{
              pageSize: 15,
              size: 'small',
              showSizeChanger: true,
              pageSizeOptions: ['15', '30', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} permissions`
            }}
            size="middle"
            bordered
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: t('permission_action', 'Permission Action & Key'),
                dataIndex: 'permission_key',
                key: 'permission_key',
                fixed: 'left',
                width: 260,
                render: (val, record) => {
                  const act = (record.action || '').toLowerCase();
                  let actTagColor = 'default';
                  if (act.includes('add') || act.includes('create')) actTagColor = 'success';
                  else if (act.includes('edit') || act.includes('update')) actTagColor = 'processing';
                  else if (act.includes('delete') || act.includes('remove')) actTagColor = 'error';
                  else if (act.includes('export') || act.includes('pdf') || act.includes('email')) actTagColor = 'purple';
                  else if (act.includes('approve')) actTagColor = 'warning';

                  return (
                    <div>
                      <Flex align="center" gap={6}>
                        {record.action && (
                          <Tag color={actTagColor} style={{ borderRadius: 4, fontSize: 10, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>
                            {record.action}
                          </Tag>
                        )}
                        <Text strong style={{ fontSize: 12.5, color: adminTheme.text }}>
                          <code>{val}</code>
                        </Text>
                      </Flex>
                      {record.label && (
                        <Text style={{ fontSize: 11, color: adminTheme.subtext, display: 'block', marginTop: 2 }}>
                          {record.label}
                        </Text>
                      )}
                    </div>
                  );
                }
              },
              {
                title: t('module_and_area', 'Module / Area'),
                dataIndex: 'module',
                key: 'module',
                width: 140,
                render: (mod, record) => (
                  <Flex vertical gap={3}>
                    <Tag style={{ borderRadius: 6, fontSize: 11, margin: 0, fontWeight: 600 }}>
                      {mod}
                    </Tag>
                    <Tag color={record.area === 'admin' ? 'blue' : 'purple'} style={{ borderRadius: 6, fontSize: 10, margin: 0, width: 'fit-content' }}>
                      {record.area === 'admin' ? 'ADMIN' : 'WEB'}
                    </Tag>
                  </Flex>
                )
              },
              // Dynamic Columns for each User Group (Role)
              ...(modulePermsData.groups || []).map((grp) => {
                const isOwnerOrAdmin = grp.id === 1 || grp.level <= 2 || grp.name === 'owner' || grp.name === 'admin';
                return {
                  title: (
                    <Tooltip title={grp.description || grp.name}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: isOwnerOrAdmin ? '#2563eb' : adminTheme.text }}>
                          {grp.name.toUpperCase()}
                        </span>
                        <div style={{ fontSize: 10, color: adminTheme.subtext, fontWeight: 500 }}>
                          Lvl {grp.level}
                        </div>
                      </div>
                    </Tooltip>
                  ),
                  key: `grp_${grp.id}`,
                  align: 'center',
                  width: 95,
                  render: (_, record) => {
                    const isAllowed = isOwnerOrAdmin || (modulePermsData.matrix?.[record.permission_key]?.[grp.id] === true);

                    if (isOwnerOrAdmin) {
                      return (
                        <Tooltip title={t('root_permanent_access', 'Root administrator has permanent full access')}>
                          <Checkbox checked disabled style={{ cursor: 'not-allowed' }} />
                        </Tooltip>
                      );
                    }

                    return (
                      <Checkbox
                        checked={isAllowed}
                        onChange={(e) => handleMatrixCellToggle(record.permission_key, grp.id, e.target.checked)}
                      />
                    );
                  }
                };
              }),
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
                    <Tooltip title={t('delete_permission_key', 'Delete custom permission key')}>
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                )
              }
            ]}
          />
        </div>
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
