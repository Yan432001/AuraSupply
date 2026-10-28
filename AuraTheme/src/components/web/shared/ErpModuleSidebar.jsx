import React, { useEffect, useMemo, useState } from 'react';
import { Tooltip, Typography, Input, Badge } from 'antd';
import {
  AppstoreOutlined,
  BankOutlined,
  BuildOutlined,
  CreditCardOutlined,
  DownOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  MoneyCollectOutlined,
  ReconciliationOutlined,
  RightOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  CarOutlined,
  WalletOutlined,
  CalendarOutlined,
  RocketOutlined,
  ShopOutlined,
  ThunderboltOutlined,
  ReadOutlined,
  ProjectOutlined,
  ToolOutlined,
  SwapOutlined,
  FieldTimeOutlined,
  PercentageOutlined,
  ApartmentOutlined,
  DollarOutlined,
  PayCircleOutlined,
  GoldOutlined,
  RestOutlined,
  AuditOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { erpModules, getMenuLineage } from '../../../data/erpModules';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useAdminModules } from '../../../hooks/useAdminModules';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from '../../../contexts/LanguageContext';

const { Text } = Typography;

const moduleIconMap = {
  dashboard: DashboardOutlined,
  clinic: MedicineBoxOutlined,
  inventory: AppstoreOutlined,
  asset: BuildOutlined,
  procurement: ReconciliationOutlined,
  sales: ShoppingCartOutlined,
  pos: CreditCardOutlined,
  loans: MoneyCollectOutlined,
  property: HomeOutlined,
  accounting: BankOutlined,
  crm: UsergroupAddOutlined,
  hr: TeamOutlined,
  payroll: FileTextOutlined,
  reports: FileTextOutlined,
  settings: SettingOutlined,
  frontEnd: GlobalOutlined,
  'front-end': GlobalOutlined,
  cms: GlobalOutlined,
  leasing: CarOutlined,
  commission: PercentageOutlined,
  pawns: GoldOutlined,
  savings: WalletOutlined,
  installments: CalendarOutlined,
  rooms: RestOutlined,
  tickets: RocketOutlined,
  concretes: BuildOutlined,
  truckings: CarOutlined,
  clearances: AuditOutlined,
  store_sales: ShopOutlined,
  gym: ThunderboltOutlined,
  schools: ReadOutlined,
  projects: ProjectOutlined,
  workorder: ToolOutlined,
  money_change: SwapOutlined,
  tax: PercentageOutlined,
  attendance: FieldTimeOutlined,
  repairs: ToolOutlined,
  expenses: PayCircleOutlined,
  calendar: CalendarOutlined,
  people: TeamOutlined,
  companies: ApartmentOutlined,
};

const getIconNode = (iconKey) => {
  const IconComponent = moduleIconMap[iconKey] || AppstoreOutlined;
  return <IconComponent />;
};

const sectionGroups = [
  { label: 'Operations', keys: ['inventory', 'procurement', 'sales', 'pos', 'asset', 'leasing', 'store_sales', 'repairs'] },
  { label: 'Logistics & Projects', keys: ['concretes', 'truckings', 'clearances', 'projects', 'workorder'] },
  { label: 'Specialty & Industry', keys: ['clinic', 'schools', 'rooms', 'tickets', 'gym'] },
  { label: 'People & HR', keys: ['crm', 'people', 'hr', 'attendance', 'payroll'] },
  { label: 'Finance & Banking', keys: ['accounting', 'loans', 'pawns', 'savings', 'installments', 'property', 'commission', 'money_change', 'tax', 'expenses'] },
  { label: 'Administration & Web', keys: ['companies', 'calendar', 'reports', 'settings', 'front-end', 'cms'] },
];

const FlatMenuTree = ({ items, moduleKey, activeMenuKey, activeLineage, openGroups, onToggleGroup, onNavigate, depth = 1, parentPath = [] }) => {
  const adminTheme = useAdminTheme();
  const { t } = useTranslation();

  return (
    <div
      style={{
        borderLeft: `1px solid ${adminTheme.sidebarBorder || 'rgba(255, 255, 255, 0.08)'}`,
        marginLeft: 18,
        paddingLeft: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        marginTop: 3,
        marginBottom: 4,
      }}
    >
      {items.map((item) => {
        const isGroup = Boolean(item.children?.length);
        const isInActivePath = activeLineage.includes(item.key);
        const isOpen = isGroup && openGroups.has(item.key);
        const itemPath = [...parentPath, item.key];

        if (isGroup) {
          return (
            <div key={item.key}>
              <button
                type="button"
                data-group-key={item.key}
                onClick={() => onToggleGroup(itemPath)}
                style={{
                  width: '100%',
                  border: isInActivePath
                    ? `1px solid ${adminTheme.primary}44`
                    : '1px solid transparent',
                  background: isInActivePath
                    ? (adminTheme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(37, 99, 235, 0.05)')
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: isInActivePath ? (adminTheme.sidebarActiveText || adminTheme.primary) : adminTheme.subtext,
                  fontSize: 12.5,
                  fontWeight: isInActivePath ? 600 : 500,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isInActivePath) e.currentTarget.style.color = adminTheme.text;
                }}
                onMouseLeave={(e) => {
                  if (!isInActivePath) e.currentTarget.style.color = adminTheme.subtext;
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: isInActivePath ? adminTheme.primary : adminTheme.subtext,
                    boxShadow: isInActivePath ? `0 0 6px ${adminTheme.primary}` : 'none',
                    opacity: isInActivePath ? 1 : 0.5,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }} className="truncate">{t(item.key, item.label)}</span>
                <DownOutlined rotate={isOpen ? 0 : -90} style={{ fontSize: 8.5, opacity: isInActivePath ? 0.9 : 0.55 }} />
              </button>
              {isOpen && (
                <FlatMenuTree
                  items={item.children}
                  moduleKey={moduleKey}
                  activeMenuKey={activeMenuKey}
                  activeLineage={activeLineage}
                  openGroups={openGroups}
                  onToggleGroup={onToggleGroup}
                  onNavigate={onNavigate}
                  depth={depth + 1}
                  parentPath={itemPath}
                />
              )}
            </div>
          );
        }

        const isActive = activeMenuKey === item.key;

        return (
          <button
            key={item.key}
            type="button"
            data-menu-key={item.key}
            data-module-key={moduleKey}
            onClick={() => onNavigate(moduleKey, item.key)}
            style={{
              width: '100%',
              border: isActive ? `1px solid ${adminTheme.primary}` : '1px solid transparent',
              background: isActive
                ? (adminTheme.sidebarActiveBg || (adminTheme.isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)'))
                : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              textAlign: 'left',
              color: isActive ? (adminTheme.sidebarActiveText || adminTheme.primary) : adminTheme.subtext,
              fontSize: 12.5,
              fontWeight: isActive ? 600 : 500,
              boxShadow: isActive ? `0 1px 6px ${adminTheme.primary}22` : 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = adminTheme.text;
                e.currentTarget.style.background = adminTheme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = adminTheme.subtext;
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isActive ? adminTheme.primary : 'currentColor',
                boxShadow: isActive ? `0 0 8px ${adminTheme.primary}` : 'none',
                flexShrink: 0,
                transition: 'all 0.18s ease',
              }}
            />
            <span className="truncate" style={{ flex: 1 }}>{t(item.key, item.label)}</span>
            {isActive && (
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: adminTheme.primary,
                  opacity: 0.8,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

const ErpModuleSidebar = ({ collapsed, activeModuleKey, activeMenuKey, onNavigate }) => {
  const adminTheme = useAdminTheme();
  const { isModuleOpen } = useAdminModules();
  const { user } = useAuth();
  const { t } = useTranslation();
  const activeLineage = useMemo(() => getMenuLineage(activeModuleKey, activeMenuKey), [activeMenuKey, activeModuleKey]);

  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_erp_favorites');
      return saved ? JSON.parse(saved) : ['inventory', 'sales', 'reports', 'settings'];
    } catch (_) {
      return ['inventory', 'sales', 'reports', 'settings'];
    }
  });

  const toggleFavorite = (modKey, e) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(modKey) ? prev.filter(k => k !== modKey) : [...prev, modKey];
      localStorage.setItem('aura_erp_favorites', JSON.stringify(next));
      return next;
    });
  };

  const [openModuleKey, setOpenModuleKey] = useState(activeModuleKey);
  const [openGroups, setOpenGroups] = useState(() => new Set(activeLineage));

  useEffect(() => {
    if (activeModuleKey && activeModuleKey !== 'dashboard') {
      setOpenModuleKey(activeModuleKey);
    }
    if (activeLineage?.length) {
      setOpenGroups((prev) => new Set([...prev, ...activeLineage]));
    }
  }, [activeModuleKey, activeMenuKey, activeLineage]);

  // Smooth auto-scroll active route into view inside sidebar container
  useEffect(() => {
    if (!activeMenuKey && !activeModuleKey) return;
    const timer = setTimeout(() => {
      const targetSelector = activeMenuKey && activeMenuKey !== 'dashboard'
        ? `[data-menu-key="${activeMenuKey}"]`
        : `[data-module-key="${activeModuleKey}"]`;
      const activeEl = document.querySelector(targetSelector);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [activeMenuKey, activeModuleKey]);

  const toggleModule = (moduleKey) => {
    setOpenModuleKey((previous) => (previous === moduleKey ? null : moduleKey));
  };

  const toggleGroup = (groupPath) => {
    const groupKey = groupPath[groupPath.length - 1];
    setOpenGroups((previous) => {
      const next = new Set(previous);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

const moduleIndexPermissionMap = {
  inventory: ['products-index', 'products'],
  procurement: ['purchases-index', 'purchases'],
  sales: ['sales-index', 'sales'],
  pos: ['pos-index', 'pos'],
  asset: ['assets-index', 'assets'],
  crm: ['customers-index', 'leads-index', 'crm'],
  hr: ['hr-index', 'attendances-index', 'hr'],
  payroll: ['payrolls-index', 'payroll-index', 'payroll'],
  clinic: ['clinic', 'clinic-index', 'patients-index'],
  accounting: ['accounts-index', 'account-index', 'accounts'],
  loans: ['loans-index', 'loan-index', 'loans'],
  property: ['property-index', 'property'],
  reports: ['reports-index', 'reports', 'account_report-index'],
  settings: ['settings-index', 'system_settings-index', 'system_settings', 'users-index', 'group_permissions-index'],
  cms: ['settings-index', 'cms', 'cms-index'],
  'front-end': ['settings-index', 'front-end', 'products-index'],
};

const hasUserPermission = (user, moduleKey) => {
  if (!user) return true;
  // Owner (level 1) bypasses all permission checks
  if (user.level === 1 || user.group?.level === 1 || user.group_id === 1 || user.role === 'owner') {
    return true;
  }
  if (!Array.isArray(user.permissions) || user.permissions.length === 0) {
    return true;
  }
  const expectedKeys = moduleIndexPermissionMap[moduleKey] || [`${moduleKey}-index`, moduleKey];
  return expectedKeys.some((k) => user.permissions.includes(k));
};

  const modulesByKey = useMemo(() => Object.fromEntries(erpModules.map((module) => [module.key, module])), []);

  // Filter out any closed/disabled modules and apply role & -index permission visibility
  const visibleModules = useMemo(() => {
    return erpModules.filter((module) => {
      if (!isModuleOpen(module.key)) return false;
      if (!hasUserPermission(user, module.key)) return false;
      // If role is buyer, restrict to buyer-relevant modules
      if (user?.role === 'buyer' && !['sales', 'inventory', 'reports'].includes(module.key)) return false;
      if (user?.role === 'supplier' && !['purchases', 'inventory', 'reports'].includes(module.key)) return false;
      return true;
    });
  }, [isModuleOpen, user]);

  const visibleSectionGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sectionGroups
      .map((section) => ({
        ...section,
        keys: section.keys.filter((moduleKey) => {
          if (!isModuleOpen(moduleKey)) return false;
          if (!hasUserPermission(user, moduleKey)) return false;
          if (user?.role === 'buyer' && !['sales', 'inventory', 'reports'].includes(moduleKey)) return false;
          if (user?.role === 'supplier' && !['purchases', 'inventory', 'reports'].includes(moduleKey)) return false;
          if (!term) return true;
          const mod = modulesByKey[moduleKey];
          return mod?.label?.toLowerCase().includes(term) || moduleKey.toLowerCase().includes(term);
        }),
      }))
      .filter((section) => section.keys.length > 0);
  }, [isModuleOpen, user, searchTerm, modulesByKey]);

  if (collapsed) {
    const isDashboardActive = activeModuleKey === 'dashboard';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
        {/* Top Dashboard Hub (Collapsed) */}
        <Tooltip
          title={
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{t('dashboard', 'Dashboard')}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>{t('command_hub', 'ERP Command Hub')}</div>
            </div>
          }
          placement="right"
        >
          <button
            type="button"
            data-module-key="dashboard"
            onClick={() => onNavigate('dashboard', 'dashboard')}
            style={{
              width: 44,
              height: 42,
              borderRadius: 11,
              position: 'relative',
              border: isDashboardActive
                ? `1px solid ${adminTheme.primary}`
                : '1px solid transparent',
              background: isDashboardActive
                ? adminTheme.sidebarActiveBg
                : 'transparent',
              color: isDashboardActive
                ? (adminTheme.sidebarActiveText || adminTheme.primary)
                : adminTheme.subtext,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              padding: 0,
            }}
            onMouseEnter={(e) => {
              if (!isDashboardActive) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = adminTheme.text;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDashboardActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = adminTheme.subtext;
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            {isDashboardActive && (
              <span
                style={{
                  position: 'absolute',
                  left: -6,
                  top: 10,
                  bottom: 10,
                  width: 3.5,
                  borderRadius: '0 4px 4px 0',
                  background: adminTheme.primary,
                  boxShadow: `0 0 10px ${adminTheme.primary}aa`,
                }}
              />
            )}
            <DashboardOutlined style={{ color: isDashboardActive ? adminTheme.primary : '#f97316' }} />
          </button>
        </Tooltip>

        <div style={{ width: 28, height: 1, background: adminTheme.sidebarBorder || 'rgba(255, 255, 255, 0.08)', margin: '2px 0 4px', opacity: 0.6 }} />

        {visibleModules.map((module) => {
          const isActive = activeModuleKey === module.key;
          return (
            <Tooltip
              key={module.key}
              title={
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{module.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{module.desc || 'ERP System Module'}</div>
                </div>
              }
              placement="right"
            >
              <button
                type="button"
                data-module-key={module.key}
                onClick={() => onNavigate(module.key, null)}
                style={{
                  width: 44,
                  height: 42,
                  borderRadius: 11,
                  position: 'relative',
                  border: isActive
                    ? `1px solid ${adminTheme.primary}`
                    : '1px solid transparent',
                  background: isActive
                    ? adminTheme.sidebarActiveBg
                    : 'transparent',
                  color: isActive
                    ? (adminTheme.sidebarActiveText || adminTheme.primary)
                    : adminTheme.subtext,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = adminTheme.text;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = adminTheme.subtext;
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                {/* Active Accent Bar on Left Edge */}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      left: -6,
                      top: 10,
                      bottom: 10,
                      width: 3.5,
                      borderRadius: '0 4px 4px 0',
                      background: adminTheme.primary,
                      boxShadow: `0 0 10px ${adminTheme.primary}aa`,
                    }}
                  />
                )}
                {getIconNode(module.iconKey)}
              </button>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Quick Search Filter */}
      <div style={{ padding: '0 4px 4px' }}>
        <Input
          size="small"
          placeholder={t('search_modules', 'Search modules...')}
          prefix={<SearchOutlined style={{ color: adminTheme.subtext, fontSize: 12 }} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          style={{
            borderRadius: 8,
            background: adminTheme.isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
            borderColor: adminTheme.sidebarBorder,
            fontSize: 12,
          }}
        />
      </div>

      {/* 2. Command Hub / Dashboard Navigation Item */}
      {(() => {
        const isDashboardActive = activeModuleKey === 'dashboard';
        return (
          <div style={{ padding: '0 4px' }}>
            <button
              type="button"
              data-module-key="dashboard"
              data-menu-key="dashboard"
              onClick={() => onNavigate('dashboard', 'dashboard')}
              style={{
                width: '100%',
                position: 'relative',
                border: isDashboardActive
                  ? `1px solid ${adminTheme.primary}`
                  : `1px solid ${adminTheme.sidebarBorder || 'transparent'}`,
                background: isDashboardActive
                  ? (adminTheme.sidebarActiveBg || (adminTheme.isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)'))
                  : (adminTheme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
                color: isDashboardActive ? (adminTheme.sidebarActiveText || adminTheme.primary) : adminTheme.text,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 10px',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: isDashboardActive ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.18s ease',
                boxShadow: isDashboardActive ? `0 2px 8px ${adminTheme.primary}22` : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isDashboardActive) {
                  e.currentTarget.style.background = adminTheme.sidebarHoverBg || (adminTheme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(37, 99, 235, 0.05)');
                }
              }}
              onMouseLeave={(e) => {
                if (!isDashboardActive) {
                  e.currentTarget.style.background = adminTheme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
                }
              }}
            >
              {isDashboardActive && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 6,
                    bottom: 6,
                    width: 3.5,
                    borderRadius: '0 4px 4px 0',
                    background: adminTheme.primary,
                    boxShadow: `0 0 10px ${adminTheme.primary}`,
                  }}
                />
              )}
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  background: isDashboardActive
                    ? adminTheme.sidebarActiveBg
                    : 'rgba(249, 115, 22, 0.14)',
                  color: isDashboardActive
                    ? (adminTheme.sidebarActiveText || adminTheme.primary)
                    : '#f97316',
                  flexShrink: 0,
                }}
              >
                <DashboardOutlined />
              </span>
              <span style={{ flex: 1, letterSpacing: '-0.01em' }} className="truncate">
                {t('dashboard', 'Dashboard')}
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: isDashboardActive ? adminTheme.primary : adminTheme.subtext,
                  background: isDashboardActive ? `${adminTheme.primary}18` : (adminTheme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'),
                  border: isDashboardActive ? `1px solid ${adminTheme.primary}33` : '1px solid transparent',
                  padding: '1px 6px',
                  borderRadius: 6,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {t('hub', 'Hub')}
              </span>
            </button>
          </div>
        );
      })()}

      {/* 3. Pinned Favorites Quick Links */}
      {!searchTerm && favorites.length > 0 && (
        <div style={{ padding: '0 6px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 9.5, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              ★ {t('pinned_favorites', 'Pinned Favorites')}
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {favorites.map(favKey => {
              const favMod = modulesByKey[favKey];
              if (!favMod || !isModuleOpen(favKey) || !hasUserPermission(user, favKey)) return null;
              const isFavActive = activeModuleKey === favKey;
              return (
                <button
                  key={favKey}
                  type="button"
                  onClick={() => onNavigate(favKey, null)}
                  style={{
                    border: isFavActive ? `1px solid ${adminTheme.primary}` : `1px solid ${adminTheme.sidebarBorder}`,
                    background: isFavActive ? adminTheme.sidebarActiveBg : (adminTheme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'),
                    color: isFavActive ? adminTheme.sidebarActiveText : adminTheme.subtext,
                    borderRadius: 6,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t(favMod.key, favMod.label)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Grouped Sections */}
      {visibleSectionGroups.map((section, idx) => (
        <div key={section.label}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 6px 6px',
              borderBottom: idx > 0 ? `1px solid ${adminTheme.sidebarBorder || 'rgba(255, 255, 255, 0.06)'}` : 'none',
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                color: adminTheme.sidebarSectionLabel || '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 1.4,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {t(section.label.toLowerCase().replace(/[\s&]+/g, '_'), section.label)}
            </Text>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: adminTheme.subtext,
                background: adminTheme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)',
                padding: '1px 6px',
                borderRadius: 999,
              }}
            >
              {section.keys.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {section.keys.map((moduleKey) => {
              const module = modulesByKey[moduleKey];
              if (!module) return null;
              const isActive = activeModuleKey === module.key;
              const isOpen = openModuleKey === module.key;

              return (
                <div key={module.key}>
                  <button
                    type="button"
                    data-module-key={module.key}
                    onClick={() => {
                      toggleModule(module.key);
                      onNavigate(module.key, null);
                    }}
                    style={{
                      width: '100%',
                      position: 'relative',
                      border: isActive
                        ? `1px solid ${adminTheme.primary}`
                        : '1px solid transparent',
                      background: isActive
                        ? adminTheme.sidebarActiveBg
                        : 'transparent',
                      color: isActive ? (adminTheme.sidebarActiveText || adminTheme.primary) : adminTheme.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 10px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: 13,
                      boxShadow: isActive ? `0 2px 8px ${adminTheme.primary}22` : 'none',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = adminTheme.sidebarHoverBg || (adminTheme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(47, 111, 237, 0.04)');
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {/* Active Accent Bar on Left Edge */}
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 6,
                          bottom: 6,
                          width: 3.5,
                          borderRadius: '0 4px 4px 0',
                          background: adminTheme.primary,
                          boxShadow: `0 0 10px ${adminTheme.primary}`,
                        }}
                      />
                    )}
                    {/* Icon container */}
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 7,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        background: isActive
                          ? adminTheme.sidebarActiveBg
                          : (adminTheme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.03)'),
                        color: isActive
                          ? adminTheme.sidebarActiveText
                          : (module.accent || adminTheme.subtext),
                        flexShrink: 0,
                      }}
                    >
                      {getIconNode(module.iconKey)}
                    </span>
                    <span style={{ flex: 1 }} className="truncate">{t(module.key, module.label)}</span>
                    {module.menus?.length > 0 && (
                      <RightOutlined
                        rotate={isOpen ? 90 : 0}
                        style={{ fontSize: 9.5, opacity: 0.5, transition: 'transform 0.2s ease' }}
                      />
                    )}
                  </button>

                  {isOpen && module.menus?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2, marginBottom: 4 }}>
                      <FlatMenuTree
                        items={module.menus}
                        moduleKey={module.key}
                        activeMenuKey={isActive ? activeMenuKey : null}
                        activeLineage={isActive ? activeLineage : []}
                        openGroups={openGroups}
                        onToggleGroup={toggleGroup}
                        onNavigate={onNavigate}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ErpModuleSidebar;
