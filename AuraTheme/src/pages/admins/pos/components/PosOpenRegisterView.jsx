import React from 'react';
import {
  Card,
  Input,
  Button,
  Avatar,
  Space,
  Tag,
  Divider,
} from 'antd';
import {
  LockOutlined,
  UnlockOutlined,
  DollarCircleOutlined,
  LogoutOutlined,
  UserOutlined,
  CalendarOutlined,
  ShopOutlined,
} from '@ant-design/icons';

const PosOpenRegisterView = ({
  user,
  openRegisterCashInHand,
  setOpenRegisterCashInHand,
  openRegisterNote,
  setOpenRegisterNote,
  handleOpenRegisterSubmit,
  khrExchangeRate = 4200,
  themeMode,
  adminTheme,
  billerName,
  warehouseName,
  onExit,
  t,
}) => {
  const isDark = themeMode === 'dark';
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)'
          : 'radial-gradient(circle at 18% 20%, rgba(47, 111, 237, 0.12), transparent 28%), radial-gradient(circle at 84% 10%, rgba(255, 122, 61, 0.10), transparent 26%), linear-gradient(145deg, #ffffff 0%, #f8faff 54%, #f1f5fb 100%)',
        padding: 20,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 24,
          background: isDark ? 'rgba(30, 41, 59, 0.85)' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)'}`,
          backdropFilter: 'blur(20px)',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            : '0 24px 70px rgba(47, 111, 237, 0.12)',
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
              background: 'linear-gradient(135deg, #2F6FED 0%, #5B8DEF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 32,
              color: '#ffffff',
              boxShadow: '0 10px 25px rgba(47, 111, 237, 0.3)',
            }}
          >
            <LockOutlined />
          </div>

          <div style={{ fontSize: 22, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
            Open Cash Register
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Please count the starting cash in drawer to unlock POS Terminal
          </div>
        </div>

        {/* Cashier Info Card */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 14,
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
            border: `1px solid ${isDark ? '#334155' : 'rgba(226, 232, 240, 0.85)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar size={36} style={{ backgroundColor: '#2F6FED' }}>
              {user?.username ? user.username.charAt(0).toUpperCase() : 'C'}
            </Avatar>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                {user?.name || user?.username || 'Cashier'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Role: {user?.role || 'Staff / Cashier'}</span>
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

          <Tag color="blue" style={{ borderRadius: 12, margin: 0, fontWeight: 600 }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </Tag>
        </div>

        {/* Starting Cash In Hand Form */}
        <form onSubmit={handleOpenRegisterSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: isDark ? '#e2e8f0' : '#334155', marginBottom: 6 }}>
              Cash In Hand (Starting Drawer Amount in USD)
            </label>
            <Input
              size="large"
              prefix={<span style={{ fontWeight: 800, color: '#2F6FED', fontSize: 18 }}>$</span>}
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
                background: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? '#334155' : 'rgba(226, 232, 240, 0.9)',
              }}
            />
            {cashNum > 0 && (
              <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981', marginTop: 4 }}>
                ≈ ៛{cashKHR.toLocaleString()} KHR (at ៛{khrExchangeRate}/$)
              </div>
            )}
          </div>

          {/* Quick Amount Suggestion Chips */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
              Quick Presets:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {quickPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setOpenRegisterCashInHand(p.usd)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    background: isDark ? 'rgba(15, 23, 42, 0.4)' : '#ffffff',
                    color: isDark ? '#cbd5e1' : '#475569',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2F6FED')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0')}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opening Note */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
              Shift Note (Optional)
            </label>
            <Input.TextArea
              rows={2}
              placeholder="e.g. Morning Shift, Drawer verified"
              value={openRegisterNote}
              onChange={(e) => setOpenRegisterNote(e.target.value)}
              style={{ borderRadius: 10, background: isDark ? '#1e293b' : '#ffffff' }}
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
              background: 'linear-gradient(135deg, #2F6FED 0%, #1D4ED8 100%)',
              fontWeight: 800,
              fontSize: 16,
              boxShadow: '0 8px 24px rgba(47, 111, 237, 0.35)',
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
            style={{ color: '#94a3b8', fontSize: 13 }}
          >
            Exit to Administrative Portal
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default PosOpenRegisterView;
