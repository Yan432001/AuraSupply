import React, { useEffect, useMemo, useState } from 'react';
import { Tooltip, Typography } from 'antd';
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
} from '@ant-design/icons';
import { erpModules, getMenuLineage } from '../../../data/erpModules';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useAdminModules } from '../../../hooks/useAdminModules';

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
};

const getIconNode = (iconKey) => {
  const IconComponent = moduleIconMap[iconKey] || AppstoreOutlined;
  return <IconComponent />;
};

const sectionGroups = [
  { label: 'Core Workspace', keys: ['clinic', 'inventory', 'asset', 'procurement', 'sales', 'pos', 'loans', 'property', 'accounting', 'hr', 'payroll'] },
  { label: 'Platform & System', keys: ['reports', 'settings', 'front-end'] },
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
              background: isActive ? (adminTheme.sidebarActiveBg || 'rgba(59, 130, 246, 0.14)') : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              textAlign: 'left',
              color: isActive ? (adminTheme.sidebarActiveText || '#60a5fa') : adminTheme.subtext,
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
                background: isActive ? (adminTheme.primary || '#3b82f6') : 'currentColor',
                boxShadow: isActive ? '0 0 6px rgba(59, 130, 246, 0.8)' : 'none',
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
  const activeLineage = useMemo(() => getMenuLineage(activeModuleKey, activeMenuKey), [activeMenuKey, activeModuleKey]);

  // Sidebar state is always derived from the current URL: whenever the active
  // module/menu changes (i.e. the user navigated), collapse whatever was
  // previously open and expand only the group/menu/sub-menu for the new page.
  const [openModuleKey, setOpenModuleKey] = useState(activeModuleKey);
  const [openGroups, setOpenGroups] = useState(() => new Set(activeLineage));

  useEffect(() => {
    setOpenModuleKey(activeModuleKey);
    setOpenGroups(new Set(activeLineage));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModuleKey, activeMenuKey]);

  const toggleModule = (moduleKey) => {
    setOpenModuleKey((previous) => (previous === moduleKey ? null : moduleKey));
  };

  // Opening a group closes any sibling group/sub-menu that was open, and
  // keeps only the clicked item's ancestor path expanded (accordion-style).
  const toggleGroup = (groupPath) => {
    const groupKey = groupPath[groupPath.length - 1];
    setOpenGroups((previous) => {
      if (previous.has(groupKey)) {
        return new Set(groupPath.slice(0, -1));
      }
      return new Set(groupPath);
    });
  };

  const modulesByKey = useMemo(() => Object.fromEntries(erpModules.map((module) => [module.key, module])), []);

  // Filter out any closed/disabled modules
  const visibleModules = useMemo(() => {
    return erpModules.filter((module) => isModuleOpen(module.key));
  }, [isModuleOpen]);

  const visibleSectionGroups = useMemo(() => {
    return sectionGroups
      .map((section) => ({
        ...section,
        keys: section.keys.filter((moduleKey) => isModuleOpen(moduleKey)),
      }))
      .filter((section) => section.keys.length > 0);
  }, [isModuleOpen]);

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
                    ? '1px solid rgba(59, 130, 246, 0.4)'
                    : '1px solid transparent',
                  background: isActive
                    ? (adminTheme.sidebarActiveBg || 'rgba(59, 130, 246, 0.16)')
                    : 'transparent',
                  color: isActive
                    ? (adminTheme.sidebarActiveText || '#60a5fa')
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
                      background: adminTheme.primary || '#3b82f6',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                        ? `1px solid rgba(59, 130, 246, 0.3)`
                        : '1px solid transparent',
                      background: isActive && !activeMenuKey
                        ? (adminTheme.sidebarActiveBg || 'rgba(59, 130, 246, 0.14)')
                        : 'transparent',
                      color: isActive ? (adminTheme.sidebarActiveText || '#60a5fa') : adminTheme.text,
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
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: isActive
                          ? (adminTheme.sidebarActiveText || '#60a5fa')
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
