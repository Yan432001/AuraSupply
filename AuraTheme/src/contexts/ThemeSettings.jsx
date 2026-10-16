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
import { WALLPAPER_PRESETS } from '../utils/uiTheme';

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
    updateTransparentSystem,
    toggleTransparentSystem,
  } = useTheme();

  const adminTheme = useAdminTheme();

  // Glass Quick Presets
  const glassPresets = [
    {
      key: 'frosted',
      name: 'Frosted Glass',
      icon: '❄️',
      desc: 'Balanced blur with medium frost transparency',
      config: { enabled: true, preset: 'frosted', surfaceOpacity: 78, blurRadius: 20, saturation: 140 },
    },
    {
      key: 'crystal',
      name: 'Crystal Clear',
      icon: '💎',
      desc: 'High transparency with deep refraction blur',
      config: { enabled: true, preset: 'crystal', surfaceOpacity: 55, blurRadius: 24, saturation: 150 },
    },
    {
      key: 'acrylic',
      name: 'Acrylic Glow',
      icon: '🔮',
      desc: 'Luminescent vibrant acrylic with soft glow',
      config: { enabled: true, preset: 'acrylic', surfaceOpacity: 85, blurRadius: 16, saturation: 120 },
    },
    {
      key: 'solid',
      name: 'Solid Opaque',
      icon: '🏢',
      desc: 'Classic clean solid non-transparent surfaces',
      config: { enabled: false, preset: 'solid', surfaceOpacity: 100, blurRadius: 0, saturation: 100 },
    },
  ];

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
        zIndex={1200}
        styles={{
          wrapper: {
            zIndex: 1201,
            pointerEvents: 'auto',
          },
          mask: {
            zIndex: 1200,
          },
          content: {
            pointerEvents: 'auto',
          },
          body: {
            padding: '16px 20px 32px',
            background: themeMode === 'dark' ? '#0b0f19' : '#f8fafc',
            pointerEvents: 'auto',
          },
          header: {
            borderBottom: `1px solid ${adminTheme.border}`,
            padding: '14px 20px',
            background: adminTheme.card,
            pointerEvents: 'auto',
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              changePreset(preset.key);
                              try {
                                message.destroy();
                                message.success(`Switched to ${preset.name} Theme Concept!`);
                              } catch (_) {}
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '12px 14px',
                              borderRadius: 14,
                              background: isSelected
                                ? (themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#ffffff')
                                : (themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : adminTheme.card),
                              border: isSelected
                                ? `2px solid ${preset.primary}`
                                : `1px solid ${adminTheme.border}`,
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: isSelected
                                ? `0 8px 24px -4px ${preset.primary}55, 0 0 0 2px ${preset.primary}25`
                                : '0 2px 6px rgba(0,0,0,0.02)',
                              transform: isSelected ? 'scale(1.02)' : 'none',
                              outline: 'none',
                              userSelect: 'none',
                              WebkitTapHighlightColor: 'transparent',
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
                                  boxShadow: `0 2px 8px ${preset.primary}88`,
                                  zIndex: 2,
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
                          </button>
                        </Col>
                      );
                    })}
                  </Row>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginTop: 4 }}>
                    <Text style={{ fontSize: 11.5, color: adminTheme.subtext }}>
                      Active: <strong style={{ color: adminTheme.primary }}>{customSettings?.customPrimary ? `Custom (${adminTheme.primary})` : currentPresetInfo.name}</strong>
                    </Text>
                    <Button
                      size="small"
                      type="link"
                      icon={<UndoOutlined style={{ fontSize: 11 }} />}
                      onClick={() => {
                        changePreset('default');
                        message.success('Restored Aura Concept Blue default!');
                      }}
                      style={{ fontSize: 11, padding: 0, height: 'auto' }}
                    >
                      Reset to Official Blue
                    </Button>
                  </div>

                  <Divider style={{ margin: '14px 0 8px' }} />

                  {/* Quick Custom Primary Color */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 12.5, color: adminTheme.text }}>
                        Custom Primary Accent
                      </Text>
                      {customSettings?.customPrimary && (
                        <Button
                          size="small"
                          type="text"
                          onClick={() => {
                            updateCustomTheme({ customPrimary: null });
                            message.info('Reverted to preset primary color');
                          }}
                          style={{ fontSize: 11, padding: '0 4px', height: 'auto', color: adminTheme.subtext }}
                        >
                          Clear Custom
                        </Button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      {quickColors.map((item) => {
                        const isCurrentActive = adminTheme.primary?.toLowerCase() === item.hex.toLowerCase();
                        return (
                          <button
                            key={item.hex}
                            type="button"
                            onClick={() => {
                              updateCustomTheme({ customPrimary: item.hex });
                              message.success(`Applied ${item.label} primary accent!`);
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: item.hex,
                              cursor: 'pointer',
                              border: isCurrentActive ? '2px solid #ffffff' : '2px solid transparent',
                              boxShadow: isCurrentActive
                                ? `0 0 0 2px ${item.hex}, 0 4px 10px rgba(0,0,0,0.25)`
                                : '0 2px 6px rgba(0,0,0,0.15)',
                              transform: isCurrentActive ? 'scale(1.12)' : 'none',
                              transition: 'all 0.18s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              outline: 'none',
                            }}
                            title={item.label}
                          >
                            {isCurrentActive && <CheckOutlined style={{ fontSize: 12, color: '#ffffff' }} />}
                          </button>
                        );
                      })}
                      <div style={{ marginLeft: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ColorPicker
                          value={adminTheme.primary}
                          onChange={(color) => {
                            const hex = color.toHexString();
                            updateCustomTheme({ customPrimary: hex });
                          }}
                          size="small"
                          showText
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'transparency',
              label: (
                <span>
                  Transparent &amp; Glass
                  {customSettings?.transparentSystem?.enabled && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#10b981',
                        marginLeft: 6,
                        verticalAlign: 'middle',
                      }}
                    />
                  )}
                </span>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Master Switch Card */}
                  <Card
                    size="small"
                    style={{
                      borderRadius: 14,
                      border: customSettings?.transparentSystem?.enabled
                        ? `2px solid ${adminTheme.primary}`
                        : `1px solid ${adminTheme.border}`,
                      background: adminTheme.card,
                      boxShadow: customSettings?.transparentSystem?.enabled
                        ? `0 6px 20px -4px ${adminTheme.primary}33`
                        : '0 2px 6px rgba(0,0,0,0.02)',
                    }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: adminTheme.text }}>
                            Frosted Glass &amp; Wallpaper
                          </span>
                          <Tag
                            color={customSettings?.transparentSystem?.enabled ? 'success' : 'default'}
                            style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10 }}
                          >
                            {customSettings?.transparentSystem?.enabled ? 'ACTIVE' : 'OFF'}
                          </Tag>
                        </div>
                        <div style={{ fontSize: 11, color: adminTheme.subtext, marginTop: 2 }}>
                          Renders dynamic ambient wallpapers, frosted acrylic cards &amp; backdrop blur
                        </div>
                      </div>
                      <Switch
                        checked={Boolean(customSettings?.transparentSystem?.enabled)}
                        onChange={(val) => {
                          updateTransparentSystem({ enabled: val });
                          message.success(val ? 'Transparent Glass Background Enabled!' : 'Reverted to Solid Opaque');
                        }}
                      />
                    </div>
                  </Card>

                  {/* Glass Presets */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text, marginBottom: 8 }}>
                      Glass Presets
                    </div>
                    <Row gutter={[8, 8]}>
                      {glassPresets.map((gp) => {
                        const isMatch =
                          (gp.key === 'solid' && !customSettings?.transparentSystem?.enabled) ||
                          (customSettings?.transparentSystem?.enabled && customSettings?.transparentSystem?.preset === gp.key);
                        return (
                          <Col span={12} key={gp.key}>
                            <div
                              onClick={() => {
                                updateTransparentSystem(gp.config);
                                message.success(`Applied ${gp.name} preset!`);
                              }}
                              style={{
                                padding: '10px 12px',
                                borderRadius: 12,
                                border: isMatch ? `2px solid ${adminTheme.primary}` : `1px solid ${adminTheme.border}`,
                                background: isMatch
                                  ? (themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(47, 111, 237, 0.08)')
                                  : adminTheme.card,
                                cursor: 'pointer',
                                transition: 'all 0.18s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <span style={{ fontSize: 18 }}>{gp.icon}</span>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: 11.5, fontWeight: isMatch ? 800 : 600, color: adminTheme.text }}>
                                  {gp.name}
                                </div>
                                <div style={{ fontSize: 10, color: adminTheme.subtext }} className="truncate">
                                  {gp.desc}
                                </div>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>

                  {/* Ambient Wallpaper Selection */}
                  <Card
                    size="small"
                    style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: adminTheme.text }}>
                        Dynamic Background Wallpaper
                      </span>
                      <span style={{ fontSize: 10.5, color: adminTheme.subtext }}>
                        Active: {customSettings?.transparentSystem?.wallpaper || 'aurora'}
                      </span>
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
                                transform: isSelected ? 'scale(1.03)' : 'none',
                                boxShadow: isSelected ? `0 4px 12px ${adminTheme.primary}40` : 'none',
                              }}
                            >
                              <div
                                style={{
                                  height: 48,
                                  background: wp.preview,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: 18,
                                }}
                              >
                                {wp.icon}
                              </div>
                              <div
                                style={{
                                  padding: '5px 6px',
                                  fontSize: 10,
                                  fontWeight: isSelected ? 800 : 600,
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

                    {/* Custom Wallpaper Image URL */}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: adminTheme.subtext, marginBottom: 4 }}>
                        Custom Image Wallpaper (URL):
                      </div>
                      <Input
                        size="small"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={customSettings?.transparentSystem?.customWallpaperUrl || ''}
                        onChange={(e) => updateTransparentSystem({ customWallpaperUrl: e.target.value })}
                        allowClear
                        style={{ borderRadius: 8, fontSize: 11 }}
                      />
                    </div>
                  </Card>

                  {/* Surface Opacity & Blur Sliders */}
                  <Card
                    size="small"
                    style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text }}>
                        Surface Opacity ({customSettings?.transparentSystem?.surfaceOpacity ?? 78}%)
                      </span>
                      <span style={{ fontSize: 10.5, color: adminTheme.subtext }}>
                        {(customSettings?.transparentSystem?.surfaceOpacity ?? 78) < 60
                          ? 'Ultra Sheer'
                          : (customSettings?.transparentSystem?.surfaceOpacity ?? 78) < 85
                          ? 'Frosted Glass'
                          : 'Dense Acrylic'}
                      </span>
                    </div>
                    <Slider
                      min={20}
                      max={100}
                      step={5}
                      value={customSettings?.transparentSystem?.surfaceOpacity ?? 78}
                      onChange={(val) => updateTransparentSystem({ surfaceOpacity: val, preset: 'custom' })}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: adminTheme.subtext, marginBottom: 12 }}>
                      <span>20% (Max Glass)</span>
                      <span>78% (Balanced)</span>
                      <span>100% (Solid)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text }}>
                        Backdrop Blur ({customSettings?.transparentSystem?.blurRadius ?? 20}px)
                      </span>
                      <span style={{ fontSize: 10.5, color: adminTheme.subtext }}>
                        {(customSettings?.transparentSystem?.blurRadius ?? 20) === 0 ? 'Sharp Clear' : 'Frosted Diffusion'}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={40}
                      step={2}
                      value={customSettings?.transparentSystem?.blurRadius ?? 20}
                      onChange={(val) => updateTransparentSystem({ blurRadius: val, preset: 'custom' })}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: adminTheme.subtext, marginBottom: 12 }}>
                      <span>0px (No Blur)</span>
                      <span>20px (Crisp Glass)</span>
                      <span>40px (Deep Blur)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: adminTheme.text }}>
                        Color Saturation Boost ({customSettings?.transparentSystem?.saturation ?? 140}%)
                      </span>
                    </div>
                    <Slider
                      min={100}
                      max={200}
                      step={10}
                      value={customSettings?.transparentSystem?.saturation ?? 140}
                      onChange={(val) => updateTransparentSystem({ saturation: val, preset: 'custom' })}
                    />
                  </Card>

                  {/* Component Toggles */}
                  <Card
                    size="small"
                    style={{ borderRadius: 14, border: `1px solid ${adminTheme.border}`, background: adminTheme.card }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: adminTheme.text, marginBottom: 10 }}>
                      Component Glass Surfaces
                    </div>
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: adminTheme.text }}>Frosted Admin Sidebar</div>
                          <div style={{ fontSize: 10.5, color: adminTheme.subtext }}>Apply glass acrylic to navigation drawer</div>
                        </div>
                        <Switch
                          size="small"
                          checked={customSettings?.transparentSystem?.transparentSidebar ?? true}
                          onChange={(val) => updateTransparentSystem({ transparentSidebar: val })}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: adminTheme.text }}>Frosted Header Bar</div>
                          <div style={{ fontSize: 10.5, color: adminTheme.subtext }}>Apply translucent frosted blur to top navigation</div>
                        </div>
                        <Switch
                          size="small"
                          checked={customSettings?.transparentSystem?.transparentHeader ?? true}
                          onChange={(val) => updateTransparentSystem({ transparentHeader: val })}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: adminTheme.text }}>Frosted Dashboard Cards &amp; Tables</div>
                          <div style={{ fontSize: 10.5, color: adminTheme.subtext }}>Render translucent content surfaces &amp; data grids</div>
                        </div>
                        <Switch
                          size="small"
                          checked={customSettings?.transparentSystem?.transparentCards ?? true}
                          onChange={(val) => updateTransparentSystem({ transparentCards: val })}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: adminTheme.text }}>Luminous Glass Borders</div>
                          <div style={{ fontSize: 10.5, color: adminTheme.subtext }}>Polished subtle refraction highlight along borders</div>
                        </div>
                        <Switch
                          size="small"
                          checked={customSettings?.transparentSystem?.glassBorderGlow ?? true}
                          onChange={(val) => updateTransparentSystem({ glassBorderGlow: val })}
                        />
                      </div>
                    </Space>
                  </Card>
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
