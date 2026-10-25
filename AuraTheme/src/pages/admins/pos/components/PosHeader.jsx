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
  CoffeeOutlined,
} from '@ant-design/icons';

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
  onOpenTablePlan,
  posType = 'pos',
  currentTable = 'Takeaway / Walk-in',
  currentTableId = null,
  onInitiateCloseRegister,
  onExit,
  t,
}) => {
  const navigate = useNavigate();
  const handleKitchenClick = onOpenKitchen || (() => navigate('/admins/pos/kitchen'));

  const topBtnStyle = {
    height: 36,
    borderRadius: 8,
    background: '#ffffff',
    color: '#0f172a',
    border: '1px solid rgba(226, 232, 240, 0.9)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '0 10px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
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
      icon: <BarChartOutlined style={{ color: '#0ea5e9' }} />,
      label: t('today_sale', "Today's Sales Performance"),
      onClick: onOpenTodaySale,
    },
    {
      key: 'registers-list',
      icon: <UnorderedListOutlined style={{ color: '#8b5cf6' }} />,
      label: t('registers', 'Registers History & Archive'),
      onClick: onOpenListRegisters,
    },
    { type: 'divider' },
    {
      key: 'member-cards',
      icon: <GiftOutlined style={{ color: '#f59e0b' }} />,
      label: t('member_cards', 'Member & VIP Cards (Loyalty)'),
      onClick: onOpenMemberCards,
    },
    {
      key: 'coupons',
      icon: <TagOutlined style={{ color: '#ec4899' }} />,
      label: t('coupons', 'Promotional Coupons & Vouchers'),
      onClick: onOpenCoupons,
    },
    {
      key: 'customer-stocks',
      icon: <InboxOutlined style={{ color: '#14b8a6' }} />,
      label: t('customer_stocks', 'Customer Held Goods & Deposits'),
      onClick: onOpenCustomerStocks,
    },
    {
      key: 'table-plan',
      icon: <CoffeeOutlined style={{ color: '#f59e0b' }} />,
      label: t('restaurant_table_plan', 'Restaurant Floor & Table Plan (ផែនការតុ)'),
      onClick: onOpenTablePlan,
    },
    {
      key: 'printers',
      icon: <PrinterOutlined style={{ color: '#6366f1' }} />,
      label: t('printers_config', 'Receipt & Kitchen Printers'),
      onClick: onOpenPrinters,
    },
    {
      key: 'pos-settings',
      icon: <SettingOutlined style={{ color: '#2F6FED' }} />,
      label: t('pos_settings', 'POS Settings & Hardware Config'),
      onClick: onOpenPosSettings,
    },
    { type: 'divider' },
    {
      key: 'view-bill',
      icon: <DesktopOutlined style={{ color: '#0284c7' }} />,
      label: 'Customer Display / View Bill (Pole Screen)',
      onClick: () => window.open('/pos/view-bill', '_blank', 'width=1280,height=800'),
    },
    {
      key: 'kitchen-display',
      icon: <FireOutlined style={{ color: '#ea580c' }} />,
      label: 'Kitchen Display System (KDS)',
      onClick: handleKitchenClick,
    },
    { type: 'divider' },
    {
      key: 'sales-history',
      icon: <HistoryOutlined style={{ color: '#3b82f6' }} />,
      label: t('sales_history', 'POS Invoices Archive & Reprint'),
      onClick: onOpenSalesHistory,
    },
    {
      key: 'add-expense',
      icon: <PlusCircleOutlined style={{ color: '#ef4444' }} />,
      label: t('add_expense', 'Quick Cash Expense (Drawer Out)'),
      onClick: onOpenExpense,
    },
    {
      key: 'calculator',
      icon: <CalculatorOutlined style={{ color: '#f59e0b' }} />,
      label: t('calculator', 'Financial Scratchpad Calculator'),
      onClick: onOpenCalculator,
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
        background: '#ffffff',
        borderBottom: '1px solid rgba(226, 232, 240, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
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
              background: 'linear-gradient(135deg, #2F6FED 0%, #5B8DEF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(47, 111, 237, 0.28)',
              color: '#ffffff',
              fontSize: 18,
            }}
          >
            <ShopOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.3px', color: '#0f172a', lineHeight: 1.1 }}>
              AURA <span style={{ color: '#2F6FED' }}>POS</span><span style={{ color: '#FF7A3D' }}>.</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
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
          <Tag
            style={{
              borderRadius: 6,
              fontWeight: 700,
              padding: '3px 10px',
              margin: 0,
              fontSize: 12,
              border: '1px solid rgba(47, 111, 237, 0.25)',
              background: 'rgba(47, 111, 237, 0.08)',
              color: '#2F6FED',
            }}
          >
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
          <Tag
            style={{
              borderRadius: 6,
              fontWeight: 700,
              padding: '3px 10px',
              margin: 0,
              fontSize: 12,
              border: '1px solid rgba(255, 122, 61, 0.25)',
              background: 'rgba(255, 122, 61, 0.08)',
              color: '#EA580C',
            }}
          >
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
                background: '#f0fdf4',
                color: '#15803d',
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
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#334155' }}>
          <ClockCircleOutlined style={{ color: '#2F6FED' }} />
          <span>
            {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: '#cbd5e1' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar
            size={22}
            style={{
              backgroundColor: '#2F6FED',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {user?.username ? user.username.charAt(0).toUpperCase() : 'C'}
          </Avatar>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
            {user?.name || user?.username || 'Cashier'}
          </span>
        </div>
      </div>

      {/* RIGHT: Quick Action Utilities, Fullscreen, Audio, Menu, Close Register, Exit (NO Dark/Light, NO Theme Setting) */}
      <Space size={8}>
        {/* Restaurant Tables & Floor Plan Trigger (AURA_v1 Concept) */}
        <Tooltip title={t('table_floor_plan', 'Restaurant Floor Plan & Table Selection (F3 / ផែនការតុ)')}>
          <button
            type="button"
            className="pos-press"
            onClick={onOpenTablePlan}
            style={{
              ...topBtnStyle,
              background: posType === 'table' ? '#fffaf5' : '#ffffff',
              borderColor: posType === 'table' ? '#f59e0b' : 'rgba(226, 232, 240, 0.9)',
              color: posType === 'table' ? '#b45309' : '#0f172a',
              fontWeight: 700,
              padding: '0 12px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#f59e0b')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = posType === 'table' ? '#f59e0b' : 'rgba(226, 232, 240, 0.9)')
            }
          >
            <CoffeeOutlined style={{ color: '#f59e0b', fontSize: 15 }} />
            <span>
              {currentTable && currentTable !== 'Takeaway / Walk-in'
                ? `🍽️ ${currentTable}`
                : posType === 'table'
                ? t('select_table', '🍽️ Select Table')
                : t('tables', '📍 Tables')}
            </span>
          </button>
        </Tooltip>

        {/* Keyboard Shortcuts Trigger */}
        <Tooltip title="Keyboard Shortcuts (F1)">
          <button
            type="button"
            className="pos-press"
            onClick={onOpenShortcuts}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2F6FED')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)')}
          >
            <QuestionCircleOutlined />
            <span style={{ fontSize: 11, color: '#64748b' }}>F1</span>
          </button>
        </Tooltip>

        {/* Scratchpad Calculator */}
        <Tooltip title="Financial Calculator (F10)">
          <button
            type="button"
            className="pos-press"
            onClick={onOpenCalculator}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2F6FED')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)')}
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
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2F6FED')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)')}
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
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2F6FED')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)')}
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
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2F6FED')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)')}
          >
            <DesktopOutlined style={{ color: '#2F6FED' }} />
          </button>
        </Tooltip>

        {/* Kitchen Display System (KDS) */}
        <Tooltip title="Kitchen Display System (KDS)">
          <button
            type="button"
            className="pos-press"
            onClick={handleKitchenClick}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FF7A3D')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)')}
          >
            <FireOutlined style={{ color: '#FF7A3D' }} />
          </button>
        </Tooltip>

        {/* POS Settings & Hardware */}
        <Tooltip title={t('pos_settings', 'POS Settings & Hardware Config (F9)')}>
          <button
            type="button"
            className="pos-press"
            onClick={onOpenPosSettings}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2F6FED')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)')}
          >
            <SettingOutlined style={{ color: '#2F6FED' }} />
          </button>
        </Tooltip>

        {/* More Actions Dropdown (All AURA_v1 POS views) */}
        <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
          <Button
            type="default"
            className="pos-press"
            style={{
              ...topBtnStyle,
              padding: '0 12px',
              border: '1px solid rgba(226, 232, 240, 0.9)',
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
