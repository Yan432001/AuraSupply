import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Button, Tooltip, Typography, Space, Badge } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  ReconciliationOutlined,
  CreditCardOutlined,
  BankOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  GlobalOutlined,
  MedicineBoxOutlined,
  BuildOutlined,
  MoneyCollectOutlined,
  HomeOutlined,
  UsergroupAddOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  CheckCircleFilled,
  LockOutlined,
  ControlOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { erpModules, buildModulePath } from '../../../data/erpModules';
import { useAdminModules } from '../../../hooks/useAdminModules';
import { useAdminTheme } from '../../../hooks/useAdminTheme';
import { useAuth } from '../../../contexts/AuthContext';

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
  cms: GlobalOutlined,
  'front-end': GlobalOutlined,
  'access-control': SafetyCertificateOutlined,
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
  'access-control': ['system_settings', 'users-index', 'group_permissions-index'],
};

export default function AdminModuleScrollSlidebar() {
  const adminTheme = useAdminTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isModuleOpen } = useAdminModules();
  const { user } = useAuth();
  const scrollContainerRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Parse active module from URL
  const searchParams = new URLSearchParams(location.search);
  const activeModuleParam = searchParams.get('module');
  const path = location.pathname;

  let activeKey = 'dashboard';
  if (path === '/admins' || path === '/admins/' || path === '/admins/dashboard') {
    activeKey = activeModuleParam || 'dashboard';
  } else if (path.startsWith('/admins/products')) {
    activeKey = 'inventory';
  } else if (path.startsWith('/admins/users')) {
    activeKey = 'hr';
  } else if (path.startsWith('/admins/orders')) {
    activeKey = 'sales';
  } else if (path.startsWith('/admins/access-control') || path.startsWith('/admins/settings/access') || path.startsWith('/admins/settings/roles') || path.startsWith('/admins/settings/permissions')) {
    activeKey = 'access-control';
  } else if (path.startsWith('/admins/reports')) {
    activeKey = 'reports';
  } else if (path.startsWith('/admins/settings')) {
    activeKey = 'settings';
  } else if (path.startsWith('/admins/modules')) {
    activeKey = 'settings';
  } else if (path.startsWith('/admins/branches') || path.startsWith('/admins/billers')) {
    activeKey = 'settings';
  } else if (path.startsWith('/admins/qrcode') || path.startsWith('/admins/cms')) {
    activeKey = 'cms';
  } else if (path.startsWith('/admins/frontend')) {
    activeKey = 'front-end';
  } else if (activeModuleParam) {
    activeKey = activeModuleParam;
  }

  // Permission check
  const hasPermission = (modKey) => {
    if (!user) return true;
    if (user.level === 1 || user.group?.level === 1 || user.group_id === 1 || user.role === 'owner') return true;
    if (!Array.isArray(user.permissions) || user.permissions.length === 0) return true;
    const expected = moduleIndexPermissionMap[modKey] || [`${modKey}-index`, modKey];
    return expected.some(k => user.permissions.includes(k));
  };

  // Compile module list for the slidebar
  const slidebarItems = useMemo(() => {
    const list = [
      {
        key: 'dashboard',
        label: 'Dashboard',
        iconKey: 'dashboard',
        accent: '#f97316',
        badge: 'Hub',
        route: '/admins',
        enabled: true
      },
      ...erpModules.map(m => ({
        key: m.key,
        label: m.label,
        iconKey: m.iconKey,
        accent: m.accent || '#3b82f6',
        badge: m.kpiValue || null,
        route: buildModulePath(m.key),
        enabled: isModuleOpen(m.key)
      })),
      {
        key: 'access-control',
        label: 'Access Control',
        iconKey: 'access-control',
        accent: '#7c3aed',
        badge: '777 Keys',
        route: '/admins/access-control',
        enabled: true
      }
    ];

    return list.filter(item => {
      if (item.key === 'dashboard' || item.key === 'access-control') return true;
      if (!isModuleOpen(item.key)) return false;
      if (!hasPermission(item.key)) return false;
      if (user?.role === 'buyer' && !['sales', 'inventory', 'reports'].includes(item.key)) return false;
      if (user?.role === 'supplier' && !['purchases', 'inventory', 'reports'].includes(item.key)) return false;
      return true;
    });
  }, [isModuleOpen, user]);

  // Check scroll boundary state
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [slidebarItems]);

  // Center active element on load or route change
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-slidebar-key="${activeKey}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    checkScroll();
  }, [activeKey]);

  // Slide left / right handlers
  const handleSlide = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 280;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(checkScroll, 320);
  };

  // Wheel horizontal scroll handler
  const handleWheel = (e) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (e.deltaY !== 0) {
      el.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '6px 14px',
        background: adminTheme.isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${adminTheme.border || 'rgba(0, 0, 0, 0.06)'}`,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        zIndex: 900,
        gap: 6
      }}
    >
      {/* Left Slide Arrow */}
      {canScrollLeft && (
        <Button
          type="text"
          size="small"
          icon={<LeftOutlined style={{ fontSize: 11 }} />}
          onClick={() => handleSlide('left')}
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: adminTheme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            border: `1px solid ${adminTheme.border}`,
            color: adminTheme.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            flexShrink: 0
          }}
          title="Slide modules left"
        />
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        onWheel={handleWheel}
        className="erp-horizontal-slidebar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '2px 4px',
          flex: 1,
          scrollBehavior: 'smooth',
          whiteSpace: 'nowrap'
        }}
      >
        {slidebarItems.map((item) => {
          const isActive = activeKey === item.key;
          const IconComponent = moduleIconMap[item.iconKey] || AppstoreOutlined;

          return (
            <button
              key={item.key}
              data-slidebar-key={item.key}
              type="button"
              onClick={() => navigate(item.route)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 11px',
                borderRadius: 8,
                border: isActive
                  ? `1px solid ${item.accent || '#3b82f6'}`
                  : `1px solid ${adminTheme.sidebarBorder || 'rgba(0, 0, 0, 0.06)'}`,
                background: isActive
                  ? (adminTheme.isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                  : (adminTheme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
                color: isActive
                  ? (adminTheme.isDark ? '#93c5fd' : '#1d4ed8')
                  : adminTheme.text,
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                outline: 'none',
                boxShadow: isActive ? `0 2px 8px rgba(59, 130, 246, 0.2)` : 'none',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = adminTheme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = adminTheme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              {/* Icon Container */}
              <span
                style={{
                  fontSize: 13,
                  color: isActive ? item.accent : (adminTheme.subtext || '#64748b'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconComponent />
              </span>

              {/* Title */}
              <span>{item.label}</span>

              {/* Active Indicator or KPI Pill */}
              {isActive ? (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: item.accent || '#3b82f6',
                    boxShadow: `0 0 6px ${item.accent || '#3b82f6'}`
                  }}
                />
              ) : item.badge && !item.badge.includes(' ') && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: '0.5px 5px',
                    borderRadius: 999,
                    background: adminTheme.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    color: adminTheme.subtext
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Slide Arrow */}
      {canScrollRight && (
        <Button
          type="text"
          size="small"
          icon={<RightOutlined style={{ fontSize: 11 }} />}
          onClick={() => handleSlide('right')}
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: adminTheme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            border: `1px solid ${adminTheme.border}`,
            color: adminTheme.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            flexShrink: 0
          }}
          title="Slide modules right"
        />
      )}
    </div>
  );
}
