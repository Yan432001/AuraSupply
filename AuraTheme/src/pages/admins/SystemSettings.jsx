import React, { useState } from 'react';
import { Card, Col, Flex, Row, Space, Switch, Typography, Button, Tag, Segmented } from 'antd';
import {
  BgColorsOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  CheckOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTheme } from '../../contexts/ThemeContext';
import { getMenuByKey, getModuleByKey } from '../../data/erpModules';
import ThemeSettings from '../../contexts/ThemeSettings';

const { Text, Title, Paragraph } = Typography;

const settingsGroups = [
  {
    title: 'Platform Defaults',
    items: [
      { key: 'maintenance', label: 'Maintenance Mode', desc: 'Temporarily disable storefront checkout', default: false },
      { key: 'multiCurrency', label: 'Multi-Currency Engine', desc: 'Allow prices and settlement in USD & KHR', default: true },
      { key: 'guestCheckout', label: 'Guest Checkout', desc: 'Allow quick digital purchases without credentials', default: true },
    ],
  },
  {
    title: 'Notifications & Dispatch',
    items: [
      { key: 'emailAlerts', label: 'Email Order Dispatch', desc: 'Send fulfillment alerts to warehouse operators', default: true },
      { key: 'smsAlerts', label: 'Telegram & SMS Broadcast', desc: 'Instant dispatch notifications to Telegram channels', default: true },
      { key: 'weeklyDigest', label: 'Executive Weekly Digest', desc: 'Summarize financial and inventory velocity Mondays', default: true },
    ],
  },
  {
    title: 'Security & Operators',
    items: [
      { key: 'twoFactor', label: 'Require 2FA Authentication', desc: 'Enforce hardware or authenticator 2FA for operators', default: true },
      { key: 'sessionTimeout', label: 'Auto Session Inactivity Lock', desc: 'Sign out idle operator terminals after 30 minutes', default: true },
    ],
  },
];

const presetQuickList = [
  { key: 'default', name: 'Aura Concept Blue', color: '#2F6FED', icon: '💎' },
  { key: 'emeraldFintech', name: 'Emerald Fintech', color: '#059669', icon: '🌿' },
  { key: 'violetPrestige', name: 'Violet Prestige', color: '#7c3aed', icon: '👑' },
  { key: 'amberElegance', name: 'Amber Elegance', color: '#d97706', icon: '☕' },
  { key: 'roseSunset', name: 'Rose Sunset', color: '#e11d48', icon: '🌹' },
  { key: 'slateExecutive', name: 'Slate Executive', color: '#4f46e5', icon: '🏛️' },
  { key: 'cyberCyan', name: 'Cyber Cyan', color: '#0891b2', icon: '⚡' },
  { key: 'darkModern', name: 'Obsidian Midnight', color: '#3b82f6', icon: '🌙' },
];

const SystemSettings = () => {
  const adminTheme = useAdminTheme();
  const { themeMode, setThemeMode, themePreset, changePreset, customSettings } = useTheme();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const moduleKey = searchParams.get('module') || 'settings';
  const menuKey = searchParams.get('menu') || 'system-settings';

  const module = getModuleByKey(moduleKey);
  const menu = getMenuByKey(moduleKey, menuKey);

  const [state, setState] = useState(() =>
    Object.fromEntries(settingsGroups.flatMap((g) => g.items.map((item) => [item.key, item.default])))
  );

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
            {module?.label || 'Settings'}
            {menu?.groupPath?.length ? ` / ${menu.groupPath.join(' / ')}` : ''}
          </Text>
          <Title level={4} style={{ margin: '2px 0 0', color: adminTheme.text }}>
            System Settings & Platform Appearance
          </Title>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeSettings />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. HERO THEME & VISUAL EXPERIENCE CONTROL PANEL           */}
      {/* ======================================================== */}
      <Card
        style={{
          borderRadius: 20,
          border: `1px solid ${adminTheme.border}`,
          background: adminTheme.card,
          boxShadow: adminTheme.shadow,
          overflow: 'hidden',
        }}
        styles={{ body: { padding: '22px 24px' } }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #2F6FED 0%, #ff7a3d 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 18,
                  boxShadow: '0 6px 16px rgba(47, 111, 237, 0.3)',
                  flexShrink: 0,
                }}
              >
                <BgColorsOutlined />
              </div>
              <div>
                <Title level={5} style={{ margin: 0, color: adminTheme.text, fontWeight: 800 }}>
                  Aura Theme & Visual Style
                </Title>
                <Text style={{ fontSize: 12, color: adminTheme.subtext }}>
                  Concept website colors, card curvature & typography
                </Text>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Segmented
                value={themeMode}
                onChange={(val) => setThemeMode(val)}
                options={[
                  { label: 'Light Mode', value: 'light', icon: <SunOutlined /> },
                  { label: 'Dark Mode', value: 'dark', icon: <MoonOutlined /> },
                ]}
                style={{
                  borderRadius: 10,
                  fontWeight: 600,
                  background: themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                }}
              />

              <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
                {customSettings.density?.toUpperCase() || 'COMFORTABLE'}
              </Tag>
            </div>
          </Col>

          {/* Quick Palette Selector */}
          <Col xs={24} lg={16}>
            <div style={{ fontSize: 12, fontWeight: 700, color: adminTheme.subtext, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
              Active Brand Color Concept
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {presetQuickList.map((preset) => {
                const isSelected = themePreset === preset.key;
                return (
                  <div
                    key={preset.key}
                    onClick={() => changePreset(preset.key)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 12,
                      border: isSelected ? `2px solid ${preset.color}` : `1px solid ${adminTheme.border}`,
                      background: isSelected ? `${preset.color}10` : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 4px 12px ${preset.color}25` : 'none',
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: preset.color,
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${preset.color}`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: isSelected ? 800 : 500,
                        color: isSelected ? adminTheme.text : adminTheme.subtext,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {preset.name}
                    </span>
                    {isSelected && <CheckOutlined style={{ fontSize: 10, color: preset.color, marginLeft: 'auto' }} />}
                  </div>
                );
              })}
            </div>
          </Col>
        </Row>
      </Card>

      {/* ======================================================== */}
      {/* 2. CORE PLATFORM POLICIES & CONTROLS                     */}
      {/* ======================================================== */}
      <Row gutter={[16, 16]}>
        {settingsGroups.map((group) => (
          <Col xs={24} lg={8} key={group.title}>
            <Card
              style={{
                borderRadius: 18,
                border: `1px solid ${adminTheme.border}`,
                background: adminTheme.card,
                height: '100%',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              }}
              styles={{ body: { padding: 20 } }}
            >
              <Title level={5} style={{ margin: '0 0 14px', color: adminTheme.text, fontWeight: 800 }}>
                {group.title}
              </Title>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {group.items.map((item) => (
                  <Flex key={item.key} justify="space-between" align="center">
                    <div style={{ maxWidth: '80%' }}>
                      <Text strong style={{ display: 'block', color: adminTheme.text, fontSize: 13 }}>
                        {item.label}
                      </Text>
                      <Text style={{ color: adminTheme.subtext, fontSize: 11.5 }}>
                        {item.desc}
                      </Text>
                    </div>
                    <Switch
                      checked={state[item.key]}
                      onChange={(checked) => setState((prev) => ({ ...prev, [item.key]: checked }))}
                      style={{ background: state[item.key] ? adminTheme.primary : undefined }}
                    />
                  </Flex>
                ))}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
};

export default SystemSettings;
