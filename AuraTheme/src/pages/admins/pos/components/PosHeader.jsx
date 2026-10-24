import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Space,
  Button,
  Tag,
  Tooltip,
  Dropdown,
  Avatar,
  Badge,
  Select,
} from 'antd';
import {
  ShopOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SoundOutlined,
  ClockCircleOutlined,
  UnorderedListOutlined,
  DollarCircleOutlined,
  BarChartOutlined,
  PlusCircleOutlined,
  LockOutlined,
  LogoutOutlined,
  GiftOutlined,
  TagOutlined,
  InboxOutlined,
  PrinterOutlined,
  QuestionCircleOutlined,
  CalculatorOutlined,
  HistoryOutlined,
  SwapOutlined,
  SettingOutlined,
  DesktopOutlined,
  FireOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import { useAdminTheme } from '../../../../hooks/useAdminTheme';
import { useTheme } from '../../../../contexts/ThemeContext';
import ThemeSettings from '../../../../contexts/ThemeSettings';
import { hexToRgba } from '../../../../utils/uiTheme';

const PosHeader = ({
  user,
  currentRegister,
  currentTime,
  isFullscreen,
  toggleFullscreen,
  soundEnabled,
  setSoundEnabled,
  currentWarehouse,
  setCurrentWarehouse,
  warehouses = [],
  selectedWarehouseId,
  onSelectWarehouse,
  billers = [],
  selectedBillerId,
  onSelectBiller,
  isSuperAdmin = false,
  onOpenShortcuts,
  onOpenCalculator,
  onOpenExpense,
  onOpenTodaySale,
  onOpenTodayProfit,
  onOpenListRegisters,
  onOpenRegisterDetails,
  onOpenSalesHistory,
  onOpenMemberCards,
  onOpenCoupons,
  onOpenCustomerStocks,
  onOpenPrinters,
  onOpenPosSettings,
  onOpenKitchen,
  onInitiateCloseRegister,
  onExit,
  themeMode: propThemeMode,
  adminTheme: propAdminTheme,
  t = (k, fallback) => fallback || k,
}) => {
  const navigate = useNavigate();
  const hookAdminTheme = useAdminTheme();
  const { themeMode: ctxThemeMode } = useTheme();

  const adminTheme = propAdminTheme || hookAdminTheme;
  const themeMode = propThemeMode || ctxThemeMode || adminTheme.themeMode || 'light';
  const isDark = Boolean(adminTheme.isDark || themeMode === 'dark');

  const primaryColor = adminTheme.primary || '#2563eb';
  const headerBg = adminTheme.headerBg || (isDark ? '#0f172a' : '#ffffff');
  const headerTextColor = adminTheme.headerColor || (isDark ? '#f8fafc' : '#0f172a');
  const borderColor = adminTheme.border || (isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0');
  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const handleKitchenClick = onOpenKitchen || (() => navigate('/admins/pos/kitchen'));

  const topBtnStyle = {
    height: 36,
    borderRadius: 8,
    background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc',
    color: headerTextColor,
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '0 10px',
    transition: 'all 0.15s ease',
  };

  // Dropdown menu items for all AURA_v1 POS views
  const moreMenuItems = [
    {
      key: 'register-details',
      icon: <DollarCircleOutlined style={{ color: '#10b981' }} />,
      label: t('register_details', 'Register Details (Audit Current Shift)'),
      onClick: onOpenRegisterDetails,
    },
    {
      key: 'today-sale',
      icon: <BarChartOutlined style={{ color: '#3b82f6' }} />,
      label: t('today_sale', "Today's Sales Breakdown"),
      onClick: onOpenTodaySale,
    },
    {
      key: 'today-profit',
      icon: <DollarCircleOutlined style={{ color: '#059669' }} />,
      label: t('today_profit', "Today's Gross Profit"),
      onClick: onOpenTodayProfit,
    },
    {
      key: 'sales-history',
      icon: <HistoryOutlined style={{ color: '#6366f1' }} />,
      label: t('sales_history', 'Sales Register & Invoices (?tab=sales)'),
      onClick: onOpenSalesHistory,
    },
    {
      key: 'registers-list',
      icon: <UnorderedListOutlined style={{ color: '#8b5cf6' }} />,
      label: t('registers_list', 'Registers Archive & Cash Ledger (?tab=registers)'),
      onClick: onOpenListRegisters,
    },
    { type: 'divider' },
    {
      key: 'add-expense',
      icon: <PlusCircleOutlined style={{ color: '#f59e0b' }} />,
      label: t('add_expense', 'Quick Cash Expense (Drawer Out)'),
      onClick: onOpenExpense,
    },
    {
      key: 'member-cards',
      icon: <GiftOutlined style={{ color: '#ec4899' }} />,
      label: t('member_cards', 'VIP / Member Cards Club'),
      onClick: onOpenMemberCards,
    },
    {
      key: 'coupons',
      icon: <TagOutlined style={{ color: '#14b8a6' }} />,
      label: t('coupons', 'Vouchers & Discount Coupons'),
      onClick: onOpenCoupons,
    },
    {
      key: 'customer-stocks',
      icon: <InboxOutlined style={{ color: '#06b6d4' }} />,
      label: t('customer_stocks', 'Customer Package Stock Claim'),
      onClick: onOpenCustomerStocks,
    },
    {
      key: 'printers',
      icon: <PrinterOutlined style={{ color: '#64748b' }} />,
      label: t('printers', 'Thermal Receipt & Label Printers'),
      onClick: onOpenPrinters,
    },
    { type: 'divider' },
    {
      key: 'close-register',
      icon: <LockOutlined style={{ color: '#ef4444' }} />,
      label: <span style={{ color: '#ef4444', fontWeight: 700 }}>{t('close_register', 'Close Cash Register')}</span>,
      onClick: onInitiateCloseRegister,
    },
  ];

  return (
    <header
      style={{
        height: 60,
        padding: '0 16px',
        background: headerBg,
        borderBottom: `1px solid ${borderColor}`,
        color: headerTextColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: isDark ? '0 2px 10px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* LEFT: Branding + Cashier Status + Warehouse Selector */}
      <Space size={12} align="center">
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 10px ${hexToRgba(primaryColor, 0.35)}`,
              color: '#ffffff',
              fontSize: 18,
            }}
          >
            <ShopOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.3px', color: headerTextColor, lineHeight: 1.1 }}>
              AURA <span style={{ color: primaryColor }}>POS</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: subtextColor, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Terminal Edition
            </div>
          </div>
        </div>

        {/* Biller Selector (Super Admin / Admin) or Store Tag */}
        {isSuperAdmin && billers.length > 0 ? (
          <Select
            size="middle"
            value={selectedBillerId}
            onChange={onSelectBiller}
            style={{ minWidth: 160, maxWidth: 220 }}
            className="pos-header-select"
            popupMatchSelectWidth={false}
            options={billers.map((b) => ({
              label: `🏬 ${b.name || b.company}`,
              value: b.id,
            }))}
          />
        ) : (
          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, padding: '3px 10px', margin: 0, fontSize: 12 }}>
            🏬 {billers.find((b) => b.id === selectedBillerId)?.name || user?.biller_name || 'My Store'}
          </Tag>
        )}

        {/* Warehouse Selector (Super Admin / Admin) or Warehouse Tag */}
        {isSuperAdmin && warehouses.length > 0 ? (
          <Select
            size="middle"
            value={selectedWarehouseId}
            onChange={onSelectWarehouse}
            style={{ minWidth: 140, maxWidth: 190 }}
            className="pos-header-select"
            popupMatchSelectWidth={false}
            options={warehouses.map((w) => ({
              label: `📦 ${w.name || w.code}`,
              value: w.id,
            }))}
          />
        ) : (
          <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700, padding: '3px 10px', margin: 0, fontSize: 12 }}>
            📦 {warehouses.find((w) => w.id === selectedWarehouseId)?.name || currentWarehouse || 'Store Warehouse'}
          </Tag>
        )}

        {/* Register Active Badge */}
        {currentRegister && (
          <Tooltip title={`Shift opened with Cash in Hand: $${parseFloat(currentRegister.cash_in_hand || 0).toFixed(2)}`}>
            <Tag
              color="success"
              style={{
                borderRadius: 20,
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                margin: 0,
                border: '1px solid #86efac',
                background: isDark ? 'rgba(22, 163, 74, 0.15)' : '#f0fdf4',
                color: isDark ? '#4ade80' : '#15803d',
              }}
            >
              <Badge status="processing" color="#16a34a" />
              <span>Shift #{currentRegister.id}</span>
            </Tag>
          </Tooltip>
        )}
      </Space>

      {/* CENTER: Real-Time Live Clock & Cashier Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '4px 14px',
          borderRadius: 20,
          background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
          border: `1px solid ${borderColor}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: headerTextColor }}>
          <ClockCircleOutlined style={{ color: primaryColor }} />
          <span>
            {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: borderColor }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar
            size={22}
            style={{
              backgroundColor: primaryColor,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {user?.username ? user.username.charAt(0).toUpperCase() : 'C'}
          </Avatar>
          <span style={{ fontSize: 12, fontWeight: 700, color: headerTextColor }}>
            {user?.name || user?.username || 'Cashier'}
          </span>
        </div>
      </div>

      {/* RIGHT: Quick Action Utilities, Fullscreen, Audio, Menu, Theme Settings, Close Register, Exit */}
      <Space size={8}>
        {/* Keyboard Shortcuts Trigger */}
        <Tooltip title="Keyboard Shortcuts (F1)">
          <button
            type="button"
            className="pos-press"
            onClick={onOpenShortcuts}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1')}
          >
            <QuestionCircleOutlined />
            <span style={{ fontSize: 11, color: subtextColor }}>F1</span>
          </button>
        </Tooltip>

        {/* Scratchpad Calculator */}
        <Tooltip title="Financial Calculator (F10)">
          <button
            type="button"
            className="pos-press"
            onClick={onOpenCalculator}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1')}
          >
            <CalculatorOutlined />
          </button>
        </Tooltip>

        {/* Audio Feedback Toggle */}
        <Tooltip title={soundEnabled ? 'Audio Beep Enabled' : 'Audio Beep Muted'}>
          <button
            type="button"
            className="pos-press"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              ...topBtnStyle,
              color: soundEnabled ? '#16a34a' : '#94a3b8',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1')}
          >
            <SoundOutlined />
          </button>
        </Tooltip>

        {/* Fullscreen Toggle */}
        <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
          <button
            type="button"
            className="pos-press"
            onClick={toggleFullscreen}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1')}
          >
            {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          </button>
        </Tooltip>

        {/* Customer Pole Display / View Bill Screen */}
        <Tooltip title="Launch Customer Display Screen (Dual Monitor)">
          <button
            type="button"
            className="pos-press"
            onClick={() => window.open('/pos/view-bill', '_blank', 'width=1280,height=800')}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1')}
          >
            <DesktopOutlined style={{ color: '#0284c7' }} />
          </button>
        </Tooltip>

        {/* Kitchen Display System (KDS) */}
        <Tooltip title="Kitchen Display System (KDS)">
          <button
            type="button"
            className="pos-press"
            onClick={handleKitchenClick}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#ea580c')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1')}
          >
            <FireOutlined style={{ color: '#ea580c' }} />
          </button>
        </Tooltip>

        {/* POS Settings & Hardware */}
        <Tooltip title={t('pos_settings', 'POS Settings & Hardware Config (F9)')}>
          <button
            type="button"
            className="pos-press"
            onClick={onOpenPosSettings}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1')}
          >
            <SettingOutlined style={{ color: primaryColor }} />
          </button>
        </Tooltip>

        {/* Integrated Admin Theme Settings */}
        <ThemeSettings buttonStyle={topBtnStyle} />

        {/* More Actions Dropdown (All AURA_v1 POS views) */}
        <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
          <Button
            type="default"
            className="pos-press"
            style={{
              ...topBtnStyle,
              padding: '0 12px',
            }}
          >
            <SwapOutlined />
            <span>POS Actions</span>
          </Button>
        </Dropdown>

        {/* Close Register Shift Button */}
        <Button
          danger
          type="primary"
          icon={<LockOutlined />}
          className="pos-press"
          onClick={onInitiateCloseRegister}
          style={{
            height: 36,
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
          }}
        >
          Close Register
        </Button>

        {/* Exit to Admin Dashboard */}
        <Tooltip title="Exit POS to Admin Dashboard">
          <Button
            type="default"
            icon={<LogoutOutlined />}
            className="pos-press"
            onClick={onExit}
            style={{
              ...topBtnStyle,
              padding: '0 10px',
            }}
          />
        </Tooltip>
      </Space>
    </header>
  );
};

export default PosHeader;
