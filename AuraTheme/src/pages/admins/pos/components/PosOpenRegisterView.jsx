import React from 'react';
import {
  Card,
  Input,
  Button,
  Avatar,
  Space,
  Tag,
  Divider,
  Tooltip,
} from 'antd';
import {
  LockOutlined,
  UnlockOutlined,
  LogoutOutlined,
  UserOutlined,
  CalendarOutlined,
  ShopOutlined,
  HistoryOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons';
import { useAdminTheme } from '../../../../hooks/useAdminTheme';
import { useTheme } from '../../../../contexts/ThemeContext';
import ThemeSettings from '../../../../contexts/ThemeSettings';
import { hexToRgba } from '../../../../utils/uiTheme';

const PosOpenRegisterView = ({
  user,
  openRegisterCashInHand,
  setOpenRegisterCashInHand,
  openRegisterNote,
  setOpenRegisterNote,
  handleOpenRegisterSubmit,
  khrExchangeRate = 4200,
  themeMode: propThemeMode,
  adminTheme: propAdminTheme,
  billerName,
  warehouseName,
  onExit,
  onViewSales,
  onViewRegisters,
  t = (k, fallback) => fallback || k,
}) => {
  const hookAdminTheme = useAdminTheme();
  const { themeMode: ctxThemeMode } = useTheme();

  const adminTheme = propAdminTheme || hookAdminTheme;
  const themeMode = propThemeMode || ctxThemeMode || adminTheme.themeMode || 'light';
  const isDark = Boolean(adminTheme.isDark || themeMode === 'dark');

  const cashNum = parseFloat(openRegisterCashInHand || 0);
  const cashKHR = Math.round(cashNum * khrExchangeRate);

  const quickPresets = [
    { label: '$0.00', usd: '0' },
    { label: '$50.00', usd: '50' },
    { label: '$100.00', usd: '100' },
    { label: '$200.00', usd: '200' },
    { label: '៛200,000 (~$47.60)', usd: (200000 / khrExchangeRate).toFixed(2) },
    { label: '៛400,000 (~$95.20)', usd: (400000 / khrExchangeRate).toFixed(2) },
  ];

  const primaryColor = adminTheme.primary || '#2563eb';
  const textColor = adminTheme.text || (isDark ? '#f8fafc' : '#0f172a');
  const subtextColor = adminTheme.subtext || (isDark ? '#94a3b8' : '#64748b');
  const cardBg = adminTheme.card || (isDark ? '#161f30' : '#ffffff');
  const cardBorder = adminTheme.border || (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.85)');
  const inputBg = isDark ? '#0f172a' : '#ffffff';
  const inputBorder = isDark ? 'rgba(51, 65, 85, 0.8)' : '#cbd5e1';

  const navBtnStyle = {
    height: 36,
    borderRadius: 8,
    background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
    color: textColor,
    border: `1px solid ${adminTheme.border || (isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1')}`,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '0 12px',
    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.05)',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: adminTheme.pageBackground || (isDark
          ? 'radial-gradient(ellipse at top, #1e293b 0%, #0b0f19 100%)'
          : 'radial-gradient(ellipse at top, #f8fafc 0%, #e2e8f0 100%)'),
        color: textColor,
        padding: '16px 24px',
        transition: 'background 0.25s ease, color 0.25s ease',
      }}
    >
      {/* 1. TOP GATEKEEPER BAR: Brand + Navigation + Theme Settings */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* Brand / Title */}
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
              boxShadow: `0 4px 12px ${hexToRgba(primaryColor, 0.35)}`,
              color: '#ffffff',
              fontSize: 18,
            }}
          >
            <ShopOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: textColor, lineHeight: 1.1 }}>
              AURA <span style={{ color: primaryColor }}>POS</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: subtextColor, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Cash Register Lockout
            </div>
          </div>
        </div>

        {/* Quick Tools & Theme Settings */}
        <Space size={10} wrap>
          {onViewSales && (
            <Tooltip title="Browse past POS sales transactions (?tab=sales)">
              <button
                type="button"
                style={navBtnStyle}
                onClick={onViewSales}
              >
                <HistoryOutlined style={{ color: primaryColor }} />
                <span>{t('sales_history', 'Sales History')}</span>
              </button>
            </Tooltip>
          )}

          {onViewRegisters && (
            <Tooltip title="View previous shift registers archive">
              <button
                type="button"
                style={navBtnStyle}
                onClick={onViewRegisters}
              >
                <UnorderedListOutlined style={{ color: '#059669' }} />
                <span>{t('registers_archive', 'Shift Registers')}</span>
              </button>
            </Tooltip>
          )}

          {/* Theme Settings Trigger directly from /admins */}
          <ThemeSettings buttonStyle={navBtnStyle} />

          {/* Exit link */}
          <button
            type="button"
            style={navBtnStyle}
            onClick={onExit}
          >
            <LogoutOutlined style={{ color: '#ef4444' }} />
            <span>{t('exit_to_admin', 'Exit to Admin')}</span>
          </button>
        </Space>
      </div>

      {/* 2. CENTER CARD: Open Cash Register Form */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 0',
        }}
      >
        <Card
          style={{
            width: '100%',
            maxWidth: 480,
            borderRadius: 24,
            background: cardBg,
            borderColor: cardBorder,
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
              : '0 20px 40px -15px rgba(37, 99, 235, 0.12)',
            transition: 'all 0.25s ease',
          }}
          styles={{ body: { padding: '36px 32px' } }}
        >
          {/* Header Icon + Title */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${primaryColor} 0%, #06b6d4 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 32,
                color: '#ffffff',
                boxShadow: `0 10px 25px ${hexToRgba(primaryColor, 0.35)}`,
              }}
            >
              <LockOutlined />
            </div>

            <div style={{ fontSize: 22, fontWeight: 900, color: textColor, letterSpacing: '-0.3px' }}>
              Open Cash Register
            </div>
            <div style={{ fontSize: 13, color: subtextColor, marginTop: 4 }}>
              Please count the starting cash in drawer to unlock POS Terminal
            </div>
          </div>

          {/* Cashier Info Card */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 14,
              background: isDark ? 'rgba(15, 23, 42, 0.6)' : (adminTheme.cardMuted || '#f8fafc'),
              border: `1px solid ${cardBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar size={36} style={{ backgroundColor: primaryColor }}>
                {user?.username ? user.username.charAt(0).toUpperCase() : 'C'}
              </Avatar>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>
                  {user?.name || user?.username || 'System Administrator'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: subtextColor }}>
                    Role: {user?.role || 'Staff / Cashier'}
                  </span>
                  {billerName && (
                    <Tag color="cyan" style={{ borderRadius: 6, margin: 0, fontSize: 10, lineHeight: '18px' }}>
                      <ShopOutlined style={{ marginRight: 3 }} /> {billerName}
                    </Tag>
                  )}
                  {warehouseName && (
                    <Tag color="geekblue" style={{ borderRadius: 6, margin: 0, fontSize: 10, lineHeight: '18px' }}>
                      {warehouseName}
                    </Tag>
                  )}
                </div>
              </div>
            </div>

            <Tag color="blue" style={{ borderRadius: 12, margin: 0, fontWeight: 700 }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </Tag>
          </div>

          {/* Starting Cash In Hand Form */}
          <form onSubmit={handleOpenRegisterSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 700,
                  color: textColor,
                  marginBottom: 6,
                }}
              >
                Cash In Hand (Starting Drawer Amount in USD)
              </label>
              <Input
                size="large"
                prefix={<span style={{ fontWeight: 900, color: primaryColor, fontSize: 18 }}>$</span>}
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={openRegisterCashInHand}
                onChange={(e) => setOpenRegisterCashInHand(e.target.value)}
                autoFocus
                style={{
                  borderRadius: 12,
                  fontSize: 20,
                  fontWeight: 800,
                  height: 52,
                  background: inputBg,
                  color: textColor,
                  borderColor: inputBorder,
                }}
              />
              {cashNum > 0 && (
                <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
                  ≈ ៛{cashKHR.toLocaleString()} KHR (at ៛{khrExchangeRate}/$)
                </div>
              )}
            </div>

            {/* Quick Amount Suggestion Chips */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: subtextColor, textTransform: 'uppercase', marginBottom: 6 }}>
                Quick Presets:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {quickPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setOpenRegisterCashInHand(p.usd)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: `1px solid ${cardBorder}`,
                      background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                      color: textColor,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = primaryColor;
                      e.currentTarget.style.color = primaryColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = cardBorder;
                      e.currentTarget.style.color = textColor;
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opening Note */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: subtextColor, marginBottom: 4 }}>
                Shift Note (Optional)
              </label>
              <Input.TextArea
                rows={2}
                placeholder="e.g. Morning Shift, Drawer verified"
                value={openRegisterNote}
                onChange={(e) => setOpenRegisterNote(e.target.value)}
                style={{
                  borderRadius: 10,
                  background: inputBg,
                  color: textColor,
                  borderColor: inputBorder,
                }}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              icon={<UnlockOutlined />}
              style={{
                height: 52,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${primaryColor} 0%, #2563eb 60%, #06b6d4 100%)`,
                fontWeight: 800,
                fontSize: 16,
                boxShadow: `0 8px 24px ${hexToRgba(primaryColor, 0.4)}`,
                border: 'none',
                marginBottom: 10,
              }}
            >
              OPEN CASH REGISTER
            </Button>

            {/* Cancel / Exit */}
            <Button
              type="text"
              block
              onClick={onExit}
              icon={<LogoutOutlined />}
              style={{ color: subtextColor, fontSize: 13 }}
            >
              Exit to Administrative Portal
            </Button>
          </form>
        </Card>
      </div>

      {/* 3. FOOTER INFO */}
      <div style={{ textAlign: 'center', fontSize: 12, color: subtextColor }}>
        Aura Point of Sale System &bull; Powered by AURA Engine &bull; Theme: {themeMode.toUpperCase()}
      </div>
    </div>
  );
};

export default PosOpenRegisterView;
