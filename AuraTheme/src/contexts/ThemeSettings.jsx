import React, { useState } from 'react';
import {
  Drawer,
  Button,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Card,
  Switch,
  Slider,
  Select,
  Tooltip,
  Badge,
  ColorPicker,
  Radio,
  Segmented,
  Tag,
  Input,
  message,
  Tabs,
} from 'antd';
import {
  SettingOutlined,
  BgColorsOutlined,
  BulbOutlined,
  CheckOutlined,
  UndoOutlined,
  SunOutlined,
  MoonOutlined,
  FontSizeOutlined,
  BorderOutlined,
  AppstoreOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleFilled,
  FireFilled,
  StarFilled,
} from '@ant-design/icons';
import { useTheme } from './ThemeContext';
import { useAdminTheme } from '../hooks/useAdminTheme';

const { Title, Text, Paragraph } = Typography;

const ThemeSettings = ({ buttonStyle }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('presets');
  const [copiedJson, setCopiedJson] = useState(false);

  const {
    themeMode,
    setThemeMode,
    themePreset,
    toggleThemeMode,
    changePreset,
    themeConfigs,
    customSettings,
    updateCustomTheme,
    resetToDefaultTheme,
  } = useTheme();

  const adminTheme = useAdminTheme();

  // Curated Preset Palette Info
  const presetsList = [
    {
      key: 'default',
      name: 'Aura Concept Blue',
      desc: 'Official concept: Electric royal blue & clean slate',
      primary: '#2F6FED',
      palette: ['#2F6FED', '#10b981', '#f59e0b', '#ef4444'],
      icon: '💎',
      badge: 'CONCEPT',
    },
    {
      key: 'emeraldFintech',
      name: 'Emerald Fintech',
      desc: 'High-trust banking emerald with teal & gold',
      primary: '#059669',
      palette: ['#059669', '#10b981', '#d97706', '#0284c7'],
      icon: '🌿',
      badge: 'FINTECH',
    },
    {
      key: 'violetPrestige',
      name: 'Violet Prestige',
      desc: 'Modern Web3 deep violet with vivid cyan',
      primary: '#7c3aed',
      palette: ['#7c3aed', '#10b981', '#f59e0b', '#06b6d4'],
      icon: '👑',
      badge: 'WEB3',
    },
    {
      key: 'amberElegance',
      name: 'Amber Elegance',
      desc: 'Warm hospitality gold with espresso accents',
      primary: '#d97706',
      palette: ['#d97706', '#16a34a', '#f59e0b', '#dc2626'],
      icon: '☕',
      badge: 'POS & DINE',
    },
    {
      key: 'roseSunset',
      name: 'Rose Sunset',
      desc: 'Luxury retail crimson with warm coral spark',
      primary: '#e11d48',
      palette: ['#e11d48', '#10b981', '#f59e0b', '#f43f5e'],
      icon: '🌹',
      badge: 'RETAIL',
    },
    {
      key: 'slateExecutive',
      name: 'Slate Executive',
      desc: 'Corporate deep indigo with cool steel accents',
      primary: '#4f46e5',
      palette: ['#4f46e5', '#10b981', '#3b82f6', '#0f172a'],
      icon: '🏛️',
      badge: 'ENTERPRISE',
    },
    {
      key: 'cyberCyan',
      name: 'Cyber Cyan',
      desc: 'Futuristic electric cyan & high-contrast neon',
      primary: '#0891b2',
      palette: ['#0891b2', '#10b981', '#6366f1', '#ef4444'],
      icon: '⚡',
      badge: 'LOGISTICS',
    },
    {
      key: 'darkModern',
      name: 'Obsidian Midnight',
      desc: 'Deep OLED black with luminescent cobalt glow',
      primary: '#3b82f6',
      palette: ['#3b82f6', '#10b981', '#fbbf24', '#f87171'],
      icon: '🌙',
      badge: 'PRO DARK',
    },
  ];

  // Font family options
  const fontFamilies = [
    { value: '"Aptos", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', label: 'Aptos / Modern Crisp (Website Default)' },
    { value: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', label: 'Inter (Clean SaaS Standard)' },
    { value: '"Plus Jakarta Sans", "Inter", sans-serif', label: 'Plus Jakarta Sans (Modern Geometric)' },
    { value: '"Poppins", "Inter", sans-serif', label: 'Poppins (Friendly & Rounded)' },
    { value: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif', label: 'SF Pro (Apple Native)' },
    { value: '"Roboto", "Helvetica Neue", Arial, sans-serif', label: 'Roboto (Google Material)' },
  ];

  // Brand Color quick swatches
  const quickColors = [
    { hex: '#2F6FED', label: 'Aura Royal Blue' },
    { hex: '#059669', label: 'Emerald Green' },
    { hex: '#7c3aed', label: 'Electric Violet' },
    { hex: '#d97706', label: 'Amber Gold' },
    { hex: '#e11d48', label: 'Rose Crimson' },
    { hex: '#4f46e5', label: 'Executive Indigo' },
    { hex: '#0891b2', label: 'Cyber Cyan' },
    { hex: '#ff7a3d', label: 'Sunset Orange' },
  ];

  const handleExportJson = () => {
    const config = {
      themeMode,
      themePreset,
      customSettings,
      exportedAt: new Date().toISOString(),
      platform: 'Aura ERP Global',
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopiedJson(true);
    message.success('Theme JSON copied to clipboard!');
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleReset = () => {
    resetToDefaultTheme();
    message.success('Reset to Aura Concept Blue default theme!');
  };

  const currentPresetInfo = presetsList.find((p) => p.key === themePreset) || presetsList[0];

  return (
    <>
      <Tooltip title="Theme & Visual Appearance">
        <Badge dot={themePreset !== 'default' || themeMode !== 'light'}>
          <Button
            type="text"
            icon={<SettingOutlined style={{ fontSize: 16 }} />}
            onClick={() => setOpen(true)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: themeMode === 'dark' ? '#94a3b8' : '#64748b',
              background: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)',
              border: `1px solid ${adminTheme.border || 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.18s ease',
              ...buttonStyle,
            }}
          />
        </Badge>
      </Tooltip>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 8 }}>
            <Space align="center" size={10}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2F6FED 0%, #ff7a3d 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: 14,
                  boxShadow: '0 4px 12px rgba(47, 111, 237, 0.3)',
                }}
              >
                <BgColorsOutlined />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: adminTheme.text, lineHeight: 1.2 }}>
                  Theme & Style Studio
                </div>
                <div style={{ fontSize: 11, color: adminTheme.subtext }}>
                  Concept website colors & interactive controls
                </div>
              </div>
            </Space>

            <Button
              size="small"
              icon={<UndoOutlined />}
              onClick={handleReset}
              style={{
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              Reset
            </Button>
          </div>
        }
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={460}
        styles={{
          body: {
            padding: '16px 20px 32px',
            background: themeMode === 'dark' ? '#0b0f19' : '#f8fafc',
          },
          header: {
            borderBottom: `1px solid ${adminTheme.border}`,
            padding: '14px 20px',
            background: adminTheme.card,
          },
        }}
      >
        {/* ======================================================== */}
        {/* 1. TOP LIVE THEME MODE CONTROLLER                        */}
        {/* ======================================================== */}
        <Card
          size="small"
          style={{
            marginBottom: 16,
            borderRadius: 16,
            border: `1px solid ${adminTheme.border}`,
            background: adminTheme.card,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
          styles={{ body: { padding: '14px 16px' } }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <Text strong style={{ fontSize: 13, color: adminTheme.text }}>
                Appearance Mode
              </Text>
              <div style={{ fontSize: 11.5, color: adminTheme.subtext }}>
                {themeMode === 'dark' ? 'High-contrast dark mode for low light' : 'Crisp daylight concept website mode'}
              </div>
            </div>

            <Segmented
              value={themeMode}
              onChange={(val) => setThemeMode(val)}
              options={[
                { label: 'Light', value: 'light', icon: <SunOutlined /> },
                { label: 'Dark', value: 'dark', icon: <MoonOutlined /> },
              ]}
              style={{
                borderRadius: 10,
                background: themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                fontWeight: 600,
              }}
            />
          </div>
        </Card>

        {/* ======================================================== */}
        {/* 2. LIVE INTERACTIVE PREVIEW WIDGET                       */}
        {/* ======================================================== */}
        <Card
          size="small"
          style={{
            marginBottom: 18,
            borderRadius: 16,
            border: `1px solid ${adminTheme.border}`,
            background: adminTheme.card,
            boxShadow: adminTheme.shadow,
            overflow: 'hidden',
          }}
          styles={{ body: { padding: '14px 16px' } }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: adminTheme.primary }}>
              LIVE PREVIEW • {currentPresetInfo.name}
            </span>
            <Tag color={themeMode === 'dark' ? 'blue' : 'processing'} style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10 }}>
              {currentPresetInfo.badge}
            </Tag>
          </div>

          {/* Mini Mock Dashboard Widget */}
          <div
            style={{
              padding: 12,
              borderRadius: customSettings.borderRadius,
              background: themeMode === 'dark' ? '#141d2e' : '#f8fafc',
              border: `1px solid ${adminTheme.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: adminTheme.subtext, fontWeight: 600 }}>Active Catalog Revenue</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: adminTheme.text }}>$148,920.00</div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  fontWeight: 800,
                  fontSize: 11,
                }}
              >
                +24.6% ↑
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button type="primary" size="small" style={{ borderRadius: customSettings.borderRadius, fontWeight: 700 }}>
                Primary Action
              </Button>
              <Button size="small" style={{ borderRadius: customSettings.borderRadius }}>
                Secondary
              </Button>
              <Switch checked size="small" style={{ marginLeft: 'auto' }} />
            </div>
          </div>
        </Card>

        {/* ======================================================== */}
        {/* 3. SETTINGS TABS: PRESETS, STYLING, TYPOGRAPHY, EXPORT   */}
        {/* ======================================================== */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'presets',
              label: 'Color Themes',
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 12, color: adminTheme.subtext }}>
                    Choose from modern color systems matched to the concept storefront:
                  </div>

                  <Row gutter={[10, 10]}>
                    {presetsList.map((preset) => {
                      const isSelected = themePreset === preset.key;
                      return (
                        <Col span={12} key={preset.key}>
                          <div
                            onClick={() => changePreset(preset.key)}
                            style={{
                              padding: '12px 14px',
                              borderRadius: 14,
                              background: adminTheme.card,
                              border: isSelected
                                ? `2px solid ${preset.primary}`
                                : `1px solid ${adminTheme.border}`,
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: isSelected
                                ? `0 8px 24px -4px ${preset.primary}33`
                                : '0 2px 6px rgba(0,0,0,0.02)',
                              transform: isSelected ? 'scale(1.02)' : 'none',
                            }}
                          >
                            {isSelected && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: -6,
                                  right: -6,
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  background: preset.primary,
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                }}
                              >
                                <CheckOutlined style={{ fontSize: 11 }} />
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 14 }}>{preset.icon}</span>
                              <span style={{ fontWeight: 800, fontSize: 12.5, color: adminTheme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {preset.name}
                              </span>
                            </div>

                            <div style={{ fontSize: 10, color: adminTheme.subtext, marginBottom: 8, height: 26, overflow: 'hidden', lineHeight: 1.3 }}>
                              {preset.desc}
                            </div>

                            {/* Color Palette Swatch Strip */}
                            <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
                              {preset.palette.map((color, idx) => (
                                <div key={idx} style={{ flex: 1, background: color }} />
                              ))}
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>

                  <Divider style={{ margin: '14px 0 8px' }} />

                  {/* Quick Custom Primary Color */}
                  <div>
                    <Text strong style={{ fontSize: 12.5, color: adminTheme.text, display: 'block', marginBottom: 8 }}>
                      Custom Primary Accent
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      {quickColors.map((item) => (
                        <div
                          key={item.hex}
                          onClick={() => {
                            updateCustomTheme({ buttonBg: item.hex + '18' });
                          }}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: item.hex,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            transition: 'transform 0.15s ease',
                          }}
                          className="hover:scale-110 active:scale-95"
                          title={item.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'layout',
              label: 'Style & Density',
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* UI Density Selector */}
                  <Card
                    size="small"
                    style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: adminTheme.text, marginBottom: 4 }}>
                      Interface Density
                    </div>
                    <div style={{ fontSize: 11, color: adminTheme.subtext, marginBottom: 10 }}>
                      Adjust padding and component heights for data density vs spacious reading:
                    </div>
                    <Radio.Group
                      value={customSettings.density || 'comfortable'}
                      onChange={(e) => updateCustomTheme({ density: e.target.value })}
                      style={{ width: '100%', display: 'flex' }}
                    >
                      <Radio.Button value="compact" style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>
                        Compact
                      </Radio.Button>
                      <Radio.Button value="comfortable" style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>
                        Comfortable
                      </Radio.Button>
                      <Radio.Button value="spacious" style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>
                        Spacious
                      </Radio.Button>
                    </Radio.Group>
                  </Card>

                  {/* Corner Curvature / Border Radius */}
                  <Card
                    size="small"
                    style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: adminTheme.text }}>
                        Corner Curvature ({customSettings.borderRadius || 12}px)
                      </span>
                      <Tag style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10.5 }}>
                        {customSettings.borderRadius <= 6 ? 'Sharp' : customSettings.borderRadius <= 12 ? 'Modern' : 'Organic'}
                      </Tag>
                    </div>
                    <Slider
                      min={4}
                      max={22}
                      step={2}
                      value={customSettings.borderRadius || 12}
                      onChange={(val) => updateCustomTheme({ borderRadius: val })}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: adminTheme.subtext }}>
                      <span>Square (4px)</span>
                      <span>Concept (12px)</span>
                      <span>Pill (22px)</span>
                    </div>
                  </Card>

                  {/* Surface Customization */}
                  <Card
                    size="small"
                    style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: adminTheme.text, marginBottom: 12 }}>
                      Surface & Header Colors
                    </div>

                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: adminTheme.text }}>Header Background</div>
                          <div style={{ fontSize: 10.5, color: adminTheme.subtext }}>Top navigation background in /admins</div>
                        </div>
                        <ColorPicker
                          value={themeMode === 'dark' ? (customSettings.darkHeaderBg || '#0f172a') : (customSettings.lightHeaderBg || '#ffffff')}
                          onChange={(color) => {
                            const hex = color.toHexString();
                            updateCustomTheme({
                              [themeMode === 'dark' ? 'darkHeaderBg' : 'lightHeaderBg']: hex,
                            });
                          }}
                          size="small"
                          showText
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: adminTheme.text }}>Header Color (Text & Icons)</div>
                          <div style={{ fontSize: 10.5, color: adminTheme.subtext }}>Title, greeting, icons & buttons</div>
                        </div>
                        <ColorPicker
                          value={themeMode === 'dark' ? (customSettings.darkHeaderColor || '#f8fafc') : (customSettings.lightHeaderColor || '#0f172a')}
                          onChange={(color) => {
                            const hex = color.toHexString();
                            updateCustomTheme({
                              [themeMode === 'dark' ? 'darkHeaderColor' : 'lightHeaderColor']: hex,
                            });
                          }}
                          size="small"
                          showText
                        />
                      </div>

                      {/* Quick Header Themes */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: adminTheme.subtext, marginBottom: 6 }}>
                          Quick Header Color Presets:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {[
                            { name: 'Clean White', bg: '#ffffff', color: '#0f172a' },
                            { name: 'Dark Slate', bg: '#0f172a', color: '#f8fafc' },
                            { name: 'Concept Royal', bg: '#2f6fed', color: '#ffffff' },
                            { name: 'Executive Navy', bg: '#1e293b', color: '#ffffff' },
                            { name: 'Emerald', bg: '#064e3b', color: '#ecfdf5' },
                            { name: 'Obsidian', bg: '#050811', color: '#e2e8f0' },
                          ].map((hp) => (
                            <Button
                              key={hp.name}
                              size="small"
                              onClick={() => {
                                updateCustomTheme({
                                  [themeMode === 'dark' ? 'darkHeaderBg' : 'lightHeaderBg']: hp.bg,
                                  [themeMode === 'dark' ? 'darkHeaderColor' : 'lightHeaderColor']: hp.color,
                                });
                              }}
                              style={{
                                fontSize: 11,
                                height: 26,
                                padding: '0 8px',
                                borderRadius: 6,
                                background: hp.bg,
                                color: hp.color,
                                border: `1px solid ${adminTheme.border || 'rgba(0,0,0,0.1)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontWeight: 600,
                              }}
                            >
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: hp.color, display: 'inline-block' }} />
                              {hp.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Divider style={{ margin: '4px 0' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: adminTheme.text }}>Sidebar Background</span>
                        <ColorPicker
                          value={themeMode === 'dark' ? (customSettings.darkSidebarBg || '#0f172a') : (customSettings.lightSidebarBg || '#ffffff')}
                          onChange={(color) => {
                            const hex = color.toHexString();
                            updateCustomTheme({
                              [themeMode === 'dark' ? 'darkSidebarBg' : 'lightSidebarBg']: hex,
                            });
                          }}
                          size="small"
                          showText
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: adminTheme.text }}>Card Canvas Background</span>
                        <ColorPicker
                          value={themeMode === 'dark' ? (customSettings.darkCardBg || '#161f30') : (customSettings.lightCardBg || '#ffffff')}
                          onChange={(color) => {
                            const hex = color.toHexString();
                            updateCustomTheme({
                              [themeMode === 'dark' ? 'darkCardBg' : 'lightCardBg']: hex,
                            });
                          }}
                          size="small"
                          showText
                        />
                      </div>
                    </Space>
                  </Card>
                </div>
              ),
            },
            {
              key: 'typography',
              label: 'Typography',
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Card
                    size="small"
                    style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: adminTheme.text, marginBottom: 6 }}>
                      Primary Typeface
                    </div>
                    <Select
                      style={{ width: '100%', marginBottom: 12 }}
                      value={customSettings.fontFamily}
                      onChange={(font) => updateCustomTheme({ fontFamily: font })}
                      options={fontFamilies}
                    />

                    <div style={{ fontSize: 12.5, fontWeight: 700, color: adminTheme.text, marginBottom: 4 }}>
                      Base Font Size ({customSettings.fontSize || 14}px)
                    </div>
                    <Slider
                      min={12}
                      max={18}
                      step={1}
                      value={customSettings.fontSize || 14}
                      onChange={(val) => updateCustomTheme({ fontSize: val })}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: adminTheme.subtext }}>
                      <span>12px (Dense)</span>
                      <span>14px (Standard)</span>
                      <span>18px (Large)</span>
                    </div>
                  </Card>
                </div>
              ),
            },
            {
              key: 'export',
              label: 'Backup & JSON',
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Card
                    size="small"
                    style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: adminTheme.text, marginBottom: 4 }}>
                      Export Theme Profile
                    </div>
                    <div style={{ fontSize: 11, color: adminTheme.subtext, marginBottom: 12 }}>
                      Copy your active theme configuration to share across instances or backup:
                    </div>

                    <Button
                      block
                      type="primary"
                      icon={copiedJson ? <CheckOutlined /> : <ExportOutlined />}
                      onClick={handleExportJson}
                      style={{ borderRadius: 10, fontWeight: 700 }}
                    >
                      {copiedJson ? 'Copied to Clipboard! ✓' : 'Copy Theme JSON'}
                    </Button>
                  </Card>

                  <Card
                    size="small"
                    style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: adminTheme.text, marginBottom: 4 }}>
                      Reset All Customizations
                    </div>
                    <div style={{ fontSize: 11, color: adminTheme.subtext, marginBottom: 12 }}>
                      Revert all typography, colors, and layout metrics back to the default concept website theme:
                    </div>

                    <Button
                      block
                      danger
                      icon={<UndoOutlined />}
                      onClick={handleReset}
                      style={{ borderRadius: 10, fontWeight: 700 }}
                    >
                      Reset to Official Aura Concept
                    </Button>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Drawer>
    </>
  );
};

export default ThemeSettings;
