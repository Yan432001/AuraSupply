import React, { useState } from 'react';
import { Card, Col, Flex, Row, Space, Switch, Typography, Button, Tag, Segmented, Slider, message } from 'antd';
import {
  BgColorsOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage, useTranslation, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext';
import { getMenuByKey, getModuleByKey } from '../../data/erpModules';
import ThemeSettings from '../../contexts/ThemeSettings';
import { WALLPAPER_PRESETS } from '../../utils/uiTheme';

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
  const { themeMode, setThemeMode, themePreset, changePreset, customSettings, updateTransparentSystem } = useTheme();
  const { currentLanguage, setLanguage, activeLanguage, supportedLanguages: ctxLangs, languages: ctxLangs2, fetchTranslations, isLoadingTranslations } = useLanguage();
  const supportedLanguages = Array.isArray(ctxLangs) && ctxLangs.length ? ctxLangs : (Array.isArray(ctxLangs2) && ctxLangs2.length ? ctxLangs2 : SUPPORTED_LANGUAGES);
  const { t } = useTranslation();
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
      {/* 2. TRANSPARENT BACKGROUND & GLASS EXPERIENCE CONTROLLER  */}
      {/* ======================================================== */}
      <Card
        style={{
          borderRadius: 20,
          border: customSettings?.transparentSystem?.enabled
            ? `2px solid ${adminTheme.primary}`
            : `1px solid ${adminTheme.border}`,
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
                  background: 'linear-gradient(135deg, #06b6d4 0%, #ec4899 50%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 18,
                  boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)',
                  flexShrink: 0,
                }}
              >
                💎
              </div>
              <div>
                <Title level={5} style={{ margin: 0, color: adminTheme.text, fontWeight: 800 }}>
                  Transparent Background &amp; Glass Engine
                </Title>
                <Text style={{ fontSize: 12, color: adminTheme.subtext }}>
                  Dynamic ambient wallpapers, acrylic cards &amp; frosted blur
                </Text>
              </div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Switch
                checked={Boolean(customSettings?.transparentSystem?.enabled)}
                onChange={(val) => {
                  updateTransparentSystem({ enabled: val });
                  message.success(val ? 'Transparent Glass Background Enabled!' : 'Reverted to Solid Background');
                }}
              />
              <Tag
                color={customSettings?.transparentSystem?.enabled ? 'success' : 'default'}
                style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}
              >
                {customSettings?.transparentSystem?.enabled ? 'ACTIVE GLASS' : 'SOLID OPAQUE'}
              </Tag>
            </div>

            {/* Quick Presets */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: adminTheme.subtext, textTransform: 'uppercase', marginBottom: 6 }}>
                Glass Presets
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { key: 'frosted', label: '❄️ Frosted', config: { enabled: true, preset: 'frosted', surfaceOpacity: 78, blurRadius: 20 } },
                  { key: 'crystal', label: '💎 Crystal', config: { enabled: true, preset: 'crystal', surfaceOpacity: 55, blurRadius: 24 } },
                  { key: 'acrylic', label: '🔮 Acrylic', config: { enabled: true, preset: 'acrylic', surfaceOpacity: 85, blurRadius: 16 } },
                  { key: 'solid', label: '🏢 Solid', config: { enabled: false, preset: 'solid', surfaceOpacity: 100, blurRadius: 0 } },
                ].map((p) => {
                  const isActive =
                    (p.key === 'solid' && !customSettings?.transparentSystem?.enabled) ||
                    (customSettings?.transparentSystem?.enabled && customSettings?.transparentSystem?.preset === p.key);
                  return (
                    <Button
                      key={p.key}
                      size="small"
                      onClick={() => updateTransparentSystem(p.config)}
                      style={{
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: isActive ? 700 : 500,
                        border: isActive ? `1.5px solid ${adminTheme.primary}` : `1px solid ${adminTheme.border}`,
                        background: isActive ? (themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(47, 111, 237, 0.08)') : undefined,
                        color: isActive ? adminTheme.primary : adminTheme.text,
                      }}
                    >
                      {p.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Col>

          {/* Wallpaper Grid */}
          <Col xs={24} lg={10}>
            <div style={{ fontSize: 12, fontWeight: 700, color: adminTheme.subtext, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
              Dynamic Ambient Wallpapers
            </div>

            <Row gutter={[8, 8]}>
              {WALLPAPER_PRESETS.map((wp) => {
                const isSelected = (customSettings?.transparentSystem?.wallpaper || 'aurora') === wp.key;
                return (
                  <Col span={8} key={wp.key}>
                    <div
                      onClick={() => {
                        updateTransparentSystem({ wallpaper: wp.key, enabled: true });
                        message.success(`Applied ${wp.name} wallpaper!`);
                      }}
                      style={{
                        borderRadius: 10,
                        border: isSelected ? `2px solid ${adminTheme.primary}` : `1px solid ${adminTheme.border}`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        boxShadow: isSelected ? `0 4px 12px ${adminTheme.primary}33` : 'none',
                        transform: isSelected ? 'scale(1.03)' : 'none',
                      }}
                    >
                      <div
                        style={{
                          height: 38,
                          background: wp.preview,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 15,
                        }}
                      >
                        {wp.icon}
                      </div>
                      <div
                        style={{
                          padding: '4px 6px',
                          fontSize: 10,
                          fontWeight: isSelected ? 800 : 500,
                          textAlign: 'center',
                          color: isSelected ? adminTheme.primary : adminTheme.text,
                          background: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {wp.name.split(' ')[0]}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Col>

          {/* Sliders */}
          <Col xs={24} lg={6}>
            <div style={{ padding: '0 4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: adminTheme.text }}>
                <span>Surface Opacity</span>
                <span>{customSettings?.transparentSystem?.surfaceOpacity ?? 78}%</span>
              </div>
              <Slider
                min={20}
                max={100}
                step={5}
                value={customSettings?.transparentSystem?.surfaceOpacity ?? 78}
                onChange={(val) => updateTransparentSystem({ surfaceOpacity: val, preset: 'custom' })}
                style={{ margin: '8px 0 14px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: adminTheme.text }}>
                <span>Backdrop Blur</span>
                <span>{customSettings?.transparentSystem?.blurRadius ?? 20}px</span>
              </div>
              <Slider
                min={0}
                max={40}
                step={2}
                value={customSettings?.transparentSystem?.blurRadius ?? 20}
                onChange={(val) => updateTransparentSystem({ blurRadius: val, preset: 'custom' })}
                style={{ margin: '8px 0 0' }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* ======================================================== */}
      {/* 2. REGIONAL LOCALIZATION & LANGUAGE ENGINE (AURA_v1)    */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: `${adminTheme.primary}18`,
                color: adminTheme.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              <GlobalOutlined />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Title level={5} style={{ margin: 0, color: adminTheme.text, fontWeight: 800 }}>
                  {t('language', 'Language & Regional Localization')}
                </Title>
                <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                  AURA_v1 Multi-Lingual Core
                </Tag>
              </div>
              <Text style={{ color: adminTheme.subtext, fontSize: 12.5 }}>
                Configure active system dialect, POS strings, and synchronized MySQL translation database.
              </Text>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag color="green" style={{ borderRadius: 999, padding: '2px 10px', fontSize: 11.5, fontWeight: 600 }}>
              5,112 Clean Unicode Keys Active
            </Tag>
            <Button
              size="small"
              icon={<SyncOutlined spin={isLoadingTranslations} />}
              onClick={() => {
                fetchTranslations(currentLanguage);
                message.success('Translations re-synchronized from database table aura_language');
              }}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 11.5,
              }}
            >
              Sync DB
            </Button>
          </div>
        </div>

        <Row gutter={[12, 12]}>
          {supportedLanguages.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <Col xs={12} sm={8} md={6} lg={4.8} key={lang.code} style={{ flex: '1 0 18%', minWidth: 140 }}>
                <div
                  onClick={() => {
                    setLanguage(lang.code);
                    message.success(`Language switched to ${lang.native} (${lang.name})`);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: isSelected ? `2px solid ${adminTheme.primary}` : `1px solid ${adminTheme.border}`,
                    background: isSelected
                      ? (adminTheme.isDark ? `${adminTheme.primary}22` : `${adminTheme.primary}0d`)
                      : (adminTheme.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'),
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    position: 'relative',
                    boxShadow: isSelected ? `0 4px 14px ${adminTheme.primary}33` : 'none',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: adminTheme.primary,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                      }}
                    >
                      <CheckOutlined />
                    </div>
                  )}
                  <div style={{ fontSize: 24, lineHeight: 1 }}>{lang.flag}</div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: isSelected ? adminTheme.primary : adminTheme.text, marginTop: 4 }}>
                    {lang.native}
                  </div>
                  <div style={{ fontSize: 11, color: adminTheme.subtext, fontWeight: 500 }}>
                    {lang.name} &bull; <span style={{ textTransform: 'uppercase' }}>{lang.iso}</span>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* ======================================================== */}
      {/* 3. CORE PLATFORM POLICIES & CONTROLS                     */}
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
