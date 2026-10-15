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
} from '@ant-design/icons';
import { erpModules, getMenuLineage } from '../../../data/erpModules';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useAdminModules } from '../../../hooks/useAdminModules';
import { useAuth } from '../../../contexts/AuthContext';

const { Text } = Typography;

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
  crm: UsergroupAddOutlined,
  hr: TeamOutlined,
  payroll: FileTextOutlined,
  reports: FileTextOutlined,
  settings: SettingOutlined,
  frontEnd: GlobalOutlined,
  'front-end': GlobalOutlined,
  cms: GlobalOutlined,
};

const getIconNode = (iconKey) => {
  const IconComponent = moduleIconMap[iconKey] || AppstoreOutlined;
  return <IconComponent />;
};

const sectionGroups = [
  { label: 'Operations', keys: ['inventory', 'procurement', 'sales', 'pos', 'asset'] },
  { label: 'People', keys: ['crm', 'hr', 'payroll', 'clinic'] },
  { label: 'Finance', keys: ['accounting', 'loans', 'property'] },
  { label: 'System', keys: ['cms', 'reports', 'settings', 'front-end'] },
];

const FlatMenuTree = ({ items, moduleKey, activeMenuKey, activeLineage, openGroups, onToggleGroup, onNavigate, depth = 1, parentPath = [] }) => {
  const adminTheme = useAdminTheme();

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
                onClick={() => onToggleGroup(itemPath)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: isInActivePath ? adminTheme.sidebarActiveText : adminTheme.subtext,
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
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: isInActivePath ? 'currentColor' : adminTheme.subtext,
                    opacity: isInActivePath ? 1 : 0.5,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }} className="truncate">{item.label}</span>
                <DownOutlined rotate={isOpen ? 0 : -90} style={{ fontSize: 8.5, opacity: 0.55 }} />
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
            onClick={() => onNavigate(moduleKey, item.key)}
            style={{
              width: '100%',
              border: isActive ? `1px solid ${adminTheme.sidebarActiveBg}` : '1px solid transparent',
              background: isActive ? adminTheme.sidebarActiveBg : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              textAlign: 'left',
              color: isActive ? adminTheme.sidebarActiveText : adminTheme.subtext,
              fontSize: 12.5,
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = adminTheme.text;
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
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
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: isActive ? adminTheme.primary : 'currentColor',
                boxShadow: isActive ? `0 0 6px ${adminTheme.primary}` : 'none',
                flexShrink: 0,
              }}
            />
            <span className="truncate">{item.label}</span>
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
    setOpenModuleKey(activeModuleKey);
    setOpenGroups(new Set(activeLineage));
  }, [activeModuleKey, activeMenuKey]);

  const toggleModule = (moduleKey) => {
    setOpenModuleKey((previous) => (previous === moduleKey ? null : moduleKey));
  };

  const toggleGroup = (groupPath) => {
    const groupKey = groupPath[groupPath.length - 1];
    setOpenGroups((previous) => {
      if (previous.has(groupKey)) {
        return new Set(groupPath.slice(0, -1));
      }
      return new Set(groupPath);
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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
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
                onClick={() => onNavigate(module.key, null)}
                style={{
                  width: 44,
                  height: 42,
                  borderRadius: 11,
                  position: 'relative',
                  border: isActive
                    ? `1px solid ${adminTheme.primary}66`
                    : '1px solid transparent',
                  background: isActive
                    ? adminTheme.sidebarActiveBg
                    : 'transparent',
                  color: isActive
                    ? adminTheme.sidebarActiveText
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
          placeholder="Search modules..."
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

      {/* 2. Pinned Favorites Quick Links */}
      {!searchTerm && favorites.length > 0 && (
        <div style={{ padding: '0 6px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 9.5, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              ★ Pinned Favorites
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
                  {favMod.label}
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
              {section.label}
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
                    onClick={() => {
                      toggleModule(module.key);
                      onNavigate(module.key, null);
                    }}
                    style={{
                      width: '100%',
                      border: isActive && !activeMenuKey
                        ? `1px solid ${adminTheme.primary}55`
                        : '1px solid transparent',
                      background: isActive && !activeMenuKey
                        ? adminTheme.sidebarActiveBg
                        : 'transparent',
                      color: isActive ? adminTheme.sidebarActiveText : adminTheme.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 10px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: 13,
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
                    <span style={{ flex: 1 }} className="truncate">{module.label}</span>
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
