import React from 'react';
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
  MoonOutlined,
  SunOutlined,
  ClockCircleOutlined,
  UnorderedListOutlined,
  DollarCircleOutlined,
  BarChartOutlined,
  PlusCircleOutlined,
  SettingOutlined,
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
} from '@ant-design/icons';

const PosHeader = ({
  user,
  currentRegister,
  currentTime,
  isFullscreen,
  toggleFullscreen,
  soundEnabled,
  setSoundEnabled,
  themeMode,
  toggleThemeMode,
  adminTheme,
  currentWarehouse,
  setCurrentWarehouse,
  warehouses = ['HQ Warehouse', 'Branch 1', 'Main Store'],
  onOpenShortcuts,
  onOpenCalculator,
  onOpenExpense,
  onOpenTodaySale,
  onOpenTodayProfit,
  onOpenListRegisters,
  onOpenRegisterDetails,
  onOpenSalesHistory,
  onOpenSettings,
  onOpenMemberCards,
  onOpenCoupons,
  onOpenCustomerStocks,
  onOpenPrinters,
  onInitiateCloseRegister,
  onExit,
  t,
}) => {
  const topBtnStyle = {
    height: 36,
    borderRadius: 10,
    background: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
    color: adminTheme?.text || (themeMode === 'dark' ? '#f8fafc' : '#1e293b'),
    border: `1px solid ${themeMode === 'dark' ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
    backdropFilter: 'blur(12px)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
  };

  const moreMenuItems = [
    {
      key: 'register-details',
      icon: <DollarCircleOutlined style={{ color: '#10b981' }} />,
      label: t('register_details', 'Register Shift Details'),
      onClick: onOpenRegisterDetails,
    },
    {
      key: 'list-registers',
      icon: <UnorderedListOutlined style={{ color: '#3b82f6' }} />,
      label: t('registers_list', 'Registers Shift History'),
      onClick: onOpenListRegisters,
    },
    {
      key: 'today-sale',
      icon: <BarChartOutlined style={{ color: '#06b6d4' }} />,
      label: t('today_sale', "Today's Sales Summary"),
      onClick: onOpenTodaySale,
    },
    {
      key: 'today-profit',
      icon: <BarChartOutlined style={{ color: '#8b5cf6' }} />,
      label: t('today_profit', "Today's Gross Profit"),
      onClick: onOpenTodayProfit,
    },
    { type: 'divider' },
    {
      key: 'customer-stocks',
      icon: <InboxOutlined style={{ color: '#f59e0b' }} />,
      label: t('customer_stocks', 'Customer Stocks / Held Items'),
      onClick: onOpenCustomerStocks,
    },
    {
      key: 'member-cards',
      icon: <GiftOutlined style={{ color: '#ec4899' }} />,
      label: t('member_cards', 'Member & VIP Loyalty Cards'),
      onClick: onOpenMemberCards,
    },
    {
      key: 'coupons',
      icon: <TagOutlined style={{ color: '#14b8a6' }} />,
      label: t('coupons_vouchers', 'Coupons & Vouchers'),
      onClick: onOpenCoupons,
    },
    {
      key: 'printers',
      icon: <PrinterOutlined style={{ color: '#6366f1' }} />,
      label: t('printers_config', 'Receipt & Kitchen Printers'),
      onClick: onOpenPrinters,
    },
    { type: 'divider' },
    {
      key: 'sales-history',
      icon: <HistoryOutlined style={{ color: '#3b82f6' }} />,
      label: t('sales_history', 'POS Invoices Archive'),
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
    {
      key: 'settings',
      icon: <SettingOutlined style={{ color: '#64748b' }} />,
      label: t('pos_settings', 'POS Hardware & General Settings'),
      onClick: onOpenSettings,
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
        background: themeMode === 'dark' ? '#0f172a' : '#ffffff',
        borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
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
              borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              color: '#ffffff',
              fontSize: 18,
            }}
          >
            <ShopOutlined />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', color: themeMode === 'dark' ? '#f8fafc' : '#0f172a', lineHeight: 1.1 }}>
              AURA <span style={{ color: '#2563eb' }}>POS</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Creative Edition
            </div>
          </div>
        </div>

        {/* Warehouse Selector */}
        <Select
          size="middle"
          value={currentWarehouse}
          onChange={setCurrentWarehouse}
          style={{ width: 140 }}
          bordered={false}
          className="pos-header-select"
          popupMatchSelectWidth={false}
          options={warehouses.map((w) => ({ label: `🏬 ${w}`, value: w }))}
        />

        {/* Register Active Badge */}
        {currentRegister && (
          <Tooltip title={`Shift opened at ${new Date(currentRegister.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} with Cash in Hand: $${parseFloat(currentRegister.cash_in_hand || 0).toFixed(2)}`}>
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
                border: 'none',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
              }}
            >
              <Badge status="processing" color="#10b981" />
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
          background: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
          border: `1px solid ${themeMode === 'dark' ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: themeMode === 'dark' ? '#cbd5e1' : '#475569' }}>
          <ClockCircleOutlined style={{ color: '#2563eb' }} />
          <span>
            {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: themeMode === 'dark' ? '#334155' : '#cbd5e1' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar
            size={22}
            style={{
              backgroundColor: '#2563eb',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {user?.username ? user.username.charAt(0).toUpperCase() : 'C'}
          </Avatar>
          <span style={{ fontSize: 12, fontWeight: 700, color: themeMode === 'dark' ? '#f1f5f9' : '#1e293b' }}>
            {user?.name || user?.username || 'Cashier'}
          </span>
        </div>
      </div>

      {/* RIGHT: Quick Action Utilities, Fullscreen, Audio, Theme, Menu, Close Register, Exit */}
      <Space size={8}>
        {/* Keyboard Shortcuts Trigger */}
        <Tooltip title="Keyboard Shortcuts (F1)">
          <button
            type="button"
            onClick={onOpenShortcuts}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = themeMode === 'dark' ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)')}
          >
            <QuestionCircleOutlined />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>F1</span>
          </button>
        </Tooltip>

        {/* Scratchpad Calculator */}
        <Tooltip title="Financial Calculator">
          <button
            type="button"
            onClick={onOpenCalculator}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = themeMode === 'dark' ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)')}
          >
            <CalculatorOutlined />
          </button>
        </Tooltip>

        {/* Audio Feedback Toggle */}
        <Tooltip title={soundEnabled ? 'Audio Beep Enabled' : 'Audio Beep Muted'}>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              ...topBtnStyle,
              color: soundEnabled ? '#10b981' : '#94a3b8',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = themeMode === 'dark' ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)')}
          >
            <SoundOutlined />
          </button>
        </Tooltip>

        {/* Dark/Light Mode Switcher */}
        <Tooltip title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <button
            type="button"
            onClick={toggleThemeMode}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = themeMode === 'dark' ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)')}
          >
            {themeMode === 'dark' ? <SunOutlined style={{ color: '#f59e0b' }} /> : <MoonOutlined style={{ color: '#6366f1' }} />}
          </button>
        </Tooltip>

        {/* Fullscreen Toggle */}
        <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
          <button
            type="button"
            onClick={toggleFullscreen}
            style={topBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = themeMode === 'dark' ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)')}
          >
            {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          </button>
        </Tooltip>

        {/* More Actions Dropdown (All AURA_v1 POS views in 1 click) */}
        <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
          <Button
            type="default"
            style={{
              ...topBtnStyle,
              padding: '0 12px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            <UnorderedListOutlined />
            <span>{t('pos_menu', 'POS Functions')}</span>
          </Button>
        </Dropdown>

        {/* Quick Close Register Shift */}
        <Tooltip title="Close Current Cash Register Shift">
          <Button
            danger
            type="dashed"
            onClick={onInitiateCloseRegister}
            style={{
              height: 36,
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <LockOutlined />
            <span>{t('close_shift', 'Close Shift')}</span>
          </Button>
        </Tooltip>

        {/* Exit to Admin Dashboard */}
        <Tooltip title="Exit POS to Admin Dashboard">
          <Button
            type="text"
            onClick={onExit}
            icon={<LogoutOutlined />}
            style={{
              height: 36,
              borderRadius: 10,
              color: '#94a3b8',
            }}
          />
        </Tooltip>
      </Space>
    </header>
  );
};

export default PosHeader;
