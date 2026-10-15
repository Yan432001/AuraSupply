import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { theme as antdTheme } from 'antd';

import { isColorLight } from '../utils/uiTheme';

const ThemeContext = createContext();

export const DEFAULT_THEME_SETTINGS = {
  fontSize: 13,
  fontFamily: '"Aptos", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  borderRadius: 12,
  lineHeight: 1.5,
  controlHeight: 36,
  padding: 16,
  margin: 16,
  buttonBg: null,
  headerBg: null,
  headerColor: null,
  sidebarBg: null,
  cardBg: null,
  hoverBg: null,
  density: 'comfortable', // 'compact' | 'comfortable' | 'spacious'
  elevation: 'medium', // 'flat' | 'subtle' | 'medium' | 'glow'
  glassmorphism: true,
  contrast: 'standard', // 'subtle' | 'standard' | 'high'
  transparentSystem: {
    enabled: true, // Master switch for transparent background system
    preset: 'frosted', // 'crystal' | 'frosted' | 'acrylic' | 'subtle' | 'custom'
    surfaceOpacity: 80, // 20% to 100%
    blurRadius: 20, // 0px to 40px
    saturation: 140, // 100% to 200%
    wallpaper: 'aurora', // 'aurora' | 'cyber' | 'sunset' | 'emerald' | 'cosmic' | 'minimal'
    customWallpaperUrl: '',
    transparentSidebar: true,
    transparentHeader: true,
    transparentCards: true,
    glassBorderGlow: true,
  },
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('admin-theme') || 'light';
  });

  const [themePreset, setThemePreset] = useState(() => {
    return localStorage.getItem('admin-theme-preset') || 'default';
  });

  const [customSettings, setCustomSettings] = useState(() => {
    const saved = localStorage.getItem('admin-custom-theme-settings');
    if (!saved) return DEFAULT_THEME_SETTINGS;
    try {
      const parsed = JSON.parse(saved);
      // Clean up legacy static defaults that prevent dark mode switching
      const cleaned = { ...DEFAULT_THEME_SETTINGS, ...parsed };
      if (cleaned.cardBg === '#ffffff' && cleaned.headerBg === '#ffffff' && cleaned.sidebarBg === '#ffffff') {
        cleaned.cardBg = null;
        cleaned.headerBg = null;
        cleaned.sidebarBg = null;
        cleaned.headerColor = null;
      }
      return cleaned;
    } catch {
      return DEFAULT_THEME_SETTINGS;
    }
  });

  // Calculate density offsets
  const densityMetrics = useMemo(() => {
    switch (customSettings.density) {
      case 'compact':
        return { controlHeight: 30, fontSize: 13, padding: 12, borderRadius: Math.min(customSettings.borderRadius || 12, 8) };
      case 'spacious':
        return { controlHeight: 42, fontSize: 15, padding: 20, borderRadius: Math.max(customSettings.borderRadius || 12, 14) };
      case 'comfortable':
      default:
        return {
          controlHeight: customSettings.controlHeight || 36,
          fontSize: customSettings.fontSize || 13,
          padding: customSettings.padding || 16,
          borderRadius: customSettings.borderRadius || 12,
        };
    }
  }, [customSettings]);

  // Modern Concept Themes matching Aura concept website
  const themeConfigs = useMemo(() => {
    const isDark = themeMode === 'dark';

    const buildTokens = (primary, success, warning, error, info, accentLight, accentDark) => {
      // Dynamic mode-aware checks: prevents light colors from overriding dark mode and vice versa
      const resolveDarkColor = (customVal, darkCustomVal, defaultVal) => {
        if (darkCustomVal && !isColorLight(darkCustomVal)) return darkCustomVal;
        if (customVal && !isColorLight(customVal)) return customVal;
        return defaultVal;
      };

      const resolveLightColor = (customVal, lightCustomVal, defaultVal) => {
        if (lightCustomVal && isColorLight(lightCustomVal)) return lightCustomVal;
        if (customVal && isColorLight(customVal)) return customVal;
        return defaultVal;
      };

      const defaultHeaderBg = isDark ? '#0f172a' : '#ffffff';
      const defaultHeaderColor = isDark ? '#f8fafc' : '#0f172a';
      const defaultSidebarBg = isDark ? '#0f172a' : '#ffffff';
      const defaultCardBg = isDark ? '#161f30' : '#ffffff';

      const bgBase = isDark ? '#0b0f19' : '#ffffff';
      const cardBg = isDark
        ? resolveDarkColor(customSettings.cardBg, customSettings.darkCardBg, defaultCardBg)
        : resolveLightColor(customSettings.cardBg, customSettings.lightCardBg, defaultCardBg);
      const textBase = isDark ? '#f8fafc' : '#0f172a';
      const border = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.85)';
      const bodyBg = isDark ? '#080c14' : '#f8fafc';
      const siderBg = isDark
        ? resolveDarkColor(customSettings.sidebarBg, customSettings.darkSidebarBg, defaultSidebarBg)
        : resolveLightColor(customSettings.sidebarBg, customSettings.lightSidebarBg, defaultSidebarBg);
      const headerBg = isDark
        ? resolveDarkColor(customSettings.headerBg, customSettings.darkHeaderBg, defaultHeaderBg)
        : resolveLightColor(customSettings.headerBg, customSettings.lightHeaderBg, defaultHeaderBg);
      const headerColor = isDark
        ? resolveDarkColor(customSettings.headerColor, customSettings.darkHeaderColor, defaultHeaderColor)
        : resolveLightColor(customSettings.headerColor, customSettings.lightHeaderColor, defaultHeaderColor);
      const buttonBg = isDark ? 'rgba(255, 255, 255, 0.08)' : (customSettings.buttonBg || '#eef4ff');

      return {
        token: {
          colorPrimary: primary,
          colorSuccess: success,
          colorWarning: warning,
          colorError: error,
          colorInfo: info,
          colorBgBase: bgBase,
          colorTextBase: textBase,
          colorBgContainer: cardBg,
          colorBgLayout: bodyBg,
          colorBorder: border,
          colorBorderSecondary: border,
          colorBgElevated: isDark ? '#1e293b' : '#ffffff',
          colorTextSecondary: isDark ? '#94a3b8' : '#64748b',
          colorTextDescription: isDark ? '#94a3b8' : '#64748b',
          borderRadius: densityMetrics.borderRadius,
          fontSize: densityMetrics.fontSize,
          fontFamily: customSettings.fontFamily,
          lineHeight: customSettings.lineHeight,
          controlHeight: densityMetrics.controlHeight,
          padding: densityMetrics.padding,
          margin: customSettings.margin,
        },
        components: {
          Layout: {
            headerBg,
            headerColor,
            bodyBg,
            siderBg,
          },
          Button: {
            defaultBg: buttonBg,
            defaultBorderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(226,232,240,0.9)',
            defaultColor: isDark ? '#f8fafc' : '#0f172a',
            colorPrimary: primary,
            borderRadius: densityMetrics.borderRadius,
            controlHeight: densityMetrics.controlHeight,
          },
          Card: {
            colorBgContainer: cardBg,
            colorBorderSecondary: border,
            borderRadiusLG: Math.min(densityMetrics.borderRadius + 4, 20),
          },
          Table: {
            colorBgContainer: cardBg,
            headerBg: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
            headerColor: isDark ? '#94a3b8' : '#475569',
            rowHoverBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(47,111,237,0.03)',
            borderColor: border,
          },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: isDark ? 'rgba(47, 111, 237, 0.25)' : 'rgba(47, 111, 237, 0.08)',
            itemSelectedColor: primary,
            itemHoverBg: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(47, 111, 237, 0.04)',
            itemBorderRadius: densityMetrics.borderRadius - 2,
          },
          Modal: {
            contentBg: cardBg,
            headerBg: cardBg,
          },
          Drawer: {
            colorBgElevated: isDark ? '#0f172a' : '#ffffff',
          },
          Select: {
            selectorBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
            optionSelectedBg: isDark ? 'rgba(47, 111, 237, 0.25)' : 'rgba(47, 111, 237, 0.08)',
          },
          Input: {
            colorBgContainer: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
            colorBorder: border,
          },
          Segmented: {
            trackBg: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
            itemSelectedBg: isDark ? '#1e293b' : '#ffffff',
            itemSelectedColor: isDark ? '#f8fafc' : '#0f172a',
          },
          Tabs: {
            cardBg: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
            itemColor: isDark ? '#94a3b8' : '#64748b',
            itemSelectedColor: primary,
          },
          Dropdown: {
            colorBgElevated: isDark ? '#1e293b' : '#ffffff',
          },
          Popover: {
            colorBgElevated: isDark ? '#1e293b' : '#ffffff',
          },
          Descriptions: {
            labelBg: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
            titleColor: textBase,
          },
          Pagination: {
            itemActiveBg: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
          },
          Alert: {
            colorInfoBg: isDark ? 'rgba(37,99,235,0.18)' : '#eff6ff',
            colorInfoBorder: isDark ? 'rgba(37,99,235,0.35)' : '#bfdbfe',
          },
        },
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      };
    };

    return {
      // 1. Default: Aura Concept Blue (Signature Website Concept)
      default: {
        name: 'Aura Concept Blue',
        subtitle: 'Signature electric royal blue with clean slate surfaces',
        tag: 'Official Concept',
        ...buildTokens('#2f6fed', '#10b981', '#f59e0b', '#ef4444', '#2f6fed', '#eef4ff', '#142038'),
      },

      // 2. Emerald Fintech
      emeraldFintech: {
        name: 'Emerald Fintech',
        subtitle: 'Modern banking emerald with teal and gold accents',
        tag: 'Fintech Luxury',
        ...buildTokens('#059669', '#10b981', '#d97706', '#e11d48', '#0284c7', '#ecfdf5', '#06281e'),
      },

      // 3. Violet Prestige
      violetPrestige: {
        name: 'Violet Prestige',
        subtitle: 'Creative Web3 deep violet with high-contrast cyan',
        tag: 'Modern Creative',
        ...buildTokens('#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f5f3ff', '#1f1638'),
      },

      // 4. Amber Elegance
      amberElegance: {
        name: 'Amber Elegance',
        subtitle: 'Warm rich amber gold with espresso slate accents',
        tag: 'Hospitality & POS',
        ...buildTokens('#d97706', '#16a34a', '#f59e0b', '#dc2626', '#ea580c', '#fffbeb', '#2e1c08'),
      },

      // 5. Rose Sunset
      roseSunset: {
        name: 'Rose & Sunset',
        subtitle: 'Vibrant crimson rose with warm sunset coral accents',
        tag: 'Retail & Fashion',
        ...buildTokens('#e11d48', '#10b981', '#f59e0b', '#be123c', '#f43f5e', '#fff1f2', '#301018'),
      },

      // 6. Slate Executive
      slateExecutive: {
        name: 'Slate Executive',
        subtitle: 'Enterprise indigo with crisp cool steel borders',
        tag: 'Corporate Enterprise',
        ...buildTokens('#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#eef2ff', '#151733'),
      },

      // 7. Cyber Cyan
      cyberCyan: {
        name: 'Cyber Cyan',
        subtitle: 'Ultra-modern electric cyan with high-energy accents',
        tag: 'Tech & Logistics',
        ...buildTokens('#0891b2', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ecfeff', '#082530'),
      },

      // 8. Deep Obsidian Dark
      darkModern: {
        name: 'Obsidian Midnight',
        subtitle: 'Deep OLED black with luminescent cobalt glow',
        tag: 'Dark Room Pro',
        ...buildTokens('#3b82f6', '#10b981', '#fbbf24', '#f87171', '#60a5fa', '#1e293b', '#0b1120'),
      },
    };
  }, [themeMode, customSettings, densityMetrics]);

  const toggleThemeMode = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    try {
      localStorage.setItem('admin-theme', newMode);
      localStorage.setItem('admin-theme-mode', newMode);
      localStorage.setItem('theme-mode', newMode);
    } catch (_) {}

    if (typeof document !== 'undefined') {
      const doc = document.documentElement;
      const body = document.body;
      doc.setAttribute('data-mode', newMode);
      doc.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
      doc.classList.add(newMode, `theme-${newMode}`);
      doc.style.colorScheme = newMode;
      if (body) {
        body.setAttribute('data-mode', newMode);
        body.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
        body.classList.add(newMode, `theme-${newMode}`);
        body.style.colorScheme = newMode;
      }
    }

    try {
      window.dispatchEvent(
        new CustomEvent('admin_theme_changed', {
          detail: { themeMode: newMode, themePreset, isDark: newMode === 'dark' },
        })
      );
    } catch (_) {}
  };

  const setThemeModeExplicit = (mode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem('admin-theme', mode);
      localStorage.setItem('admin-theme-mode', mode);
      localStorage.setItem('theme-mode', mode);
    } catch (_) {}

    if (typeof document !== 'undefined') {
      const doc = document.documentElement;
      const body = document.body;
      doc.setAttribute('data-mode', mode);
      doc.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
      doc.classList.add(mode, `theme-${mode}`);
      doc.style.colorScheme = mode;
      if (body) {
        body.setAttribute('data-mode', mode);
        body.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
        body.classList.add(mode, `theme-${mode}`);
        body.style.colorScheme = mode;
      }
    }

    try {
      window.dispatchEvent(
        new CustomEvent('admin_theme_changed', {
          detail: { themeMode: mode, themePreset, isDark: mode === 'dark' },
        })
      );
    } catch (_) {}
  };

  const changePreset = (preset) => {
    if (!themeConfigs[preset]) return;
    setThemePreset(preset);
    try {
      localStorage.setItem('admin-theme-preset', preset);
    } catch (_) {}

    const wallpaperMap = {
      default: 'aurora',
      emeraldFintech: 'emerald',
      violetPrestige: 'cosmic',
      amberElegance: 'sunset',
      roseSunset: 'sunset',
      slateExecutive: 'minimal',
      cyberCyan: 'cyber',
      darkModern: 'minimal',
    };
    const targetWallpaper = wallpaperMap[preset] || 'aurora';

    setCustomSettings((prev) => {
      const updated = {
        ...prev,
        buttonBg: null,
        lightHeaderBg: null,
        darkHeaderBg: null,
        lightHeaderColor: null,
        darkHeaderColor: null,
        lightSidebarBg: null,
        darkSidebarBg: null,
        lightCardBg: null,
        darkCardBg: null,
        headerBg: null,
        headerColor: null,
        sidebarBg: null,
        cardBg: null,
        transparentSystem: {
          ...(prev?.transparentSystem || DEFAULT_THEME_SETTINGS.transparentSystem),
          wallpaper: targetWallpaper,
        },
      };
      try {
        localStorage.setItem('admin-custom-theme-settings', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (typeof document !== 'undefined') {
      const doc = document.documentElement;
      const body = document.body;
      doc.setAttribute('data-theme', preset);
      if (body) body.setAttribute('data-theme', preset);
    }

    try {
      window.dispatchEvent(
        new CustomEvent('admin_theme_changed', {
          detail: { themeMode, themePreset: preset, isDark: themeMode === 'dark' },
        })
      );
    } catch (_) {}
  };

  const updateCustomTheme = (settings) => {
    const merged = { ...customSettings, ...settings };
    setCustomSettings(merged);
    try {
      localStorage.setItem('admin-custom-theme-settings', JSON.stringify(merged));
    } catch (_) {}
  };

  const resetToDefaultTheme = () => {
    setThemeMode('light');
    setThemePreset('default');
    setCustomSettings(DEFAULT_THEME_SETTINGS);
    try {
      localStorage.removeItem('admin-theme');
      localStorage.removeItem('admin-theme-mode');
      localStorage.removeItem('theme-mode');
      localStorage.removeItem('admin-theme-preset');
      localStorage.removeItem('admin-custom-theme-settings');
    } catch (_) {}

    if (typeof document !== 'undefined') {
      const doc = document.documentElement;
      const body = document.body;
      doc.setAttribute('data-mode', 'light');
      doc.setAttribute('data-theme', 'default');
      doc.classList.remove('dark', 'theme-dark');
      doc.classList.add('light', 'theme-light');
      doc.style.colorScheme = 'light';
      if (body) {
        body.setAttribute('data-mode', 'light');
        body.setAttribute('data-theme', 'default');
        body.classList.remove('dark', 'theme-dark');
        body.classList.add('light', 'theme-light');
        body.style.colorScheme = 'light';
      }
    }

    try {
      window.dispatchEvent(
        new CustomEvent('admin_theme_changed', {
          detail: { themeMode: 'light', themePreset: 'default', isDark: false },
        })
      );
    } catch (_) {}
  };

  // Apply custom CSS variables for global styles
  useEffect(() => {
    const isDark = themeMode === 'dark';
    const activeCfg = themeConfigs[themePreset] || themeConfigs.default;
    const primary = activeCfg?.token?.colorPrimary || '#2f6fed';

    const styleId = 'aura-admin-theme-vars';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    const resolveDarkColor = (customVal, darkCustomVal, defaultVal) => {
      if (darkCustomVal && !isColorLight(darkCustomVal)) return darkCustomVal;
      if (customVal && !isColorLight(customVal)) return customVal;
      return defaultVal;
    };

    const resolveLightColor = (customVal, lightCustomVal, defaultVal) => {
      if (lightCustomVal && isColorLight(lightCustomVal)) return lightCustomVal;
      if (customVal && isColorLight(customVal)) return customVal;
      return defaultVal;
    };

    const defaultHeaderBg = isDark ? '#0f172a' : '#ffffff';
    const defaultHeaderColor = isDark ? '#f8fafc' : '#0f172a';
    const defaultSidebarBg = isDark ? '#0f172a' : '#ffffff';
    const defaultCardBg = isDark ? '#161f30' : '#ffffff';

    const headerBgVal = isDark
      ? resolveDarkColor(customSettings.headerBg, customSettings.darkHeaderBg, defaultHeaderBg)
      : resolveLightColor(customSettings.headerBg, customSettings.lightHeaderBg, defaultHeaderBg);

    const headerColorVal = isDark
      ? resolveDarkColor(customSettings.headerColor, customSettings.darkHeaderColor, defaultHeaderColor)
      : resolveLightColor(customSettings.headerColor, customSettings.lightHeaderColor, defaultHeaderColor);

    const cardBgVal = isDark
      ? resolveDarkColor(customSettings.cardBg, customSettings.darkCardBg, defaultCardBg)
      : resolveLightColor(customSettings.cardBg, customSettings.lightCardBg, defaultCardBg);

    const sidebarBgVal = isDark
      ? resolveDarkColor(customSettings.sidebarBg, customSettings.darkSidebarBg, defaultSidebarBg)
      : resolveLightColor(customSettings.sidebarBg, customSettings.lightSidebarBg, defaultSidebarBg);

    const borderVal = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.85)';
    const textVal = isDark ? '#f8fafc' : '#0f172a';
    const subtextVal = isDark ? '#94a3b8' : '#64748b';
    const pageBgVal = isDark ? '#080c14' : '#f8fafc';
    const isGlass = Boolean(customSettings.transparentSystem?.enabled);

    style.textContent = `
      :root, html, body.admin-active, .admin-layout, .ant-layout.admin-layout, [data-admin-theme], [data-theme] {
        --admin-primary: ${primary};
        --admin-font-family: ${customSettings.fontFamily};
        --admin-font-size: ${densityMetrics.fontSize}px;
        --admin-border-radius: ${densityMetrics.borderRadius}px;
        --admin-line-height: ${customSettings.lineHeight};
        --admin-control-height: ${densityMetrics.controlHeight}px;
        --admin-padding: ${densityMetrics.padding}px;
        --admin-margin: ${customSettings.margin}px;
        --admin-button-bg: ${customSettings.buttonBg || (isDark ? 'rgba(255,255,255,0.08)' : '#eef4ff')};
        --admin-header-bg: ${headerBgVal};
        --admin-header-color: ${headerColorVal};
        --admin-header-border: ${borderVal};
        --admin-sidebar-bg: ${sidebarBgVal};
        --admin-sidebar-border: ${borderVal};
        --admin-card-bg: ${cardBgVal};
        --admin-card-border: ${borderVal};
        --admin-hover-bg: ${isDark ? '#1e293b' : '#f8fafc'};
        --admin-text-color: ${textVal};
        --admin-subtext-color: ${subtextVal};
        --admin-border-color: ${borderVal};
        --admin-page-bg: ${pageBgVal};
        font-family: ${customSettings.fontFamily};
        color-scheme: ${isDark ? 'dark' : 'light'};
      }

      /* Admin Panel UI Controls Override - Strictly Scoped to .admin-layout */
      .admin-layout .ant-btn-primary {
        box-shadow: 0 4px 14px -2px ${primary}55 !important;
        font-weight: 600 !important;
        background-color: ${primary} !important;
        border-color: ${primary} !important;
      }

      .admin-layout .ant-btn-default:not(.ant-btn-primary) {
        background: ${isDark ? 'rgba(255, 255, 255, 0.07)' : '#ffffff'} !important;
        color: ${isDark ? '#f8fafc' : '#0f172a'} !important;
        border-color: ${borderVal} !important;
      }

      .admin-layout .ant-btn-default:not(.ant-btn-primary):hover {
        background: ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#f8fafc'} !important;
        color: ${primary} !important;
        border-color: ${primary} !important;
      }
      
      .admin-layout .ant-card {
        border-radius: ${densityMetrics.borderRadius + 4}px !important;
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        background: ${cardBgVal} !important;
        border-color: ${borderVal} !important;
        color: ${textVal} !important;
        ${isGlass ? 'backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);' : ''}
      }

      .admin-layout .ant-card-head {
        border-bottom-color: ${borderVal} !important;
        color: ${textVal} !important;
      }

      .admin-layout .ant-card-head-title {
        color: ${textVal} !important;
        font-weight: 700 !important;
      }

      .admin-layout .ant-table {
        background: ${cardBgVal} !important;
        color: ${textVal} !important;
      }

      .admin-layout .ant-table-thead > tr > th {
        background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc'} !important;
        color: ${isDark ? '#94a3b8' : '#475569'} !important;
        border-bottom: 1px solid ${borderVal} !important;
        font-weight: 600 !important;
      }

      .admin-layout .ant-table-tbody > tr > td {
        border-bottom: 1px solid ${borderVal} !important;
        color: ${textVal} !important;
      }

      .admin-layout .ant-table-tbody > tr:hover > td {
        background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(47, 111, 237, 0.03)'} !important;
      }

      .admin-layout .ant-modal-content, .admin-layout .ant-modal-header {
        background: ${cardBgVal} !important;
        color: ${textVal} !important;
        border-color: ${borderVal} !important;
      }

      .admin-layout .ant-modal-title {
        color: ${textVal} !important;
      }

      .admin-layout .ant-drawer-content {
        background: ${cardBgVal} !important;
        color: ${textVal} !important;
      }

      .admin-layout .ant-drawer-header {
        background: ${cardBgVal} !important;
        border-bottom-color: ${borderVal} !important;
      }

      .admin-layout .ant-drawer-title {
        color: ${textVal} !important;
      }

      .admin-layout .ant-dropdown-menu, .admin-layout .ant-select-dropdown, .admin-layout .ant-popover-inner {
        background: ${isDark ? '#1e293b' : '#ffffff'} !important;
        color: ${textVal} !important;
        border: 1px solid ${borderVal} !important;
        box-shadow: ${isDark ? '0 10px 30px rgba(0,0,0,0.45)' : '0 10px 30px rgba(15,23,42,0.08)'} !important;
      }

      .admin-layout .ant-input, .admin-layout .ant-input-affix-wrapper, .admin-layout .ant-input-number {
        background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'} !important;
        border-color: ${borderVal} !important;
        color: ${textVal} !important;
      }

      .admin-layout .ant-input::placeholder, .admin-layout .ant-input-affix-wrapper input::placeholder {
        color: ${subtextVal} !important;
      }

      .admin-layout .ant-select-selector {
        background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'} !important;
        border-color: ${borderVal} !important;
        color: ${textVal} !important;
      }

      .admin-layout .ant-segmented {
        background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'} !important;
      }

      .admin-layout .ant-segmented-item-selected {
        background: ${isDark ? '#1e293b' : '#ffffff'} !important;
        color: ${textVal} !important;
      }

      .admin-layout .ant-form-item-label > label {
        color: ${textVal} !important;
      }

      .admin-layout .ant-descriptions-bordered .ant-descriptions-view {
        border-color: ${borderVal} !important;
      }

      .admin-layout .ant-descriptions-bordered .ant-descriptions-item-label {
        background: ${isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'} !important;
        color: ${subtextVal} !important;
        border-color: ${borderVal} !important;
      }

      .admin-layout .ant-descriptions-bordered .ant-descriptions-item-content {
        color: ${textVal} !important;
        border-color: ${borderVal} !important;
      }

      .admin-layout .ant-pagination-item {
        background: ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff'} !important;
        border-color: ${borderVal} !important;
      }

      .admin-layout .ant-pagination-item a {
        color: ${textVal} !important;
      }

      .admin-layout .ant-pagination-item-active {
        background: ${primary} !important;
        border-color: ${primary} !important;
      }

      .admin-layout .ant-pagination-item-active a {
        color: #ffffff !important;
      }

      .admin-layout .ant-pagination-prev .ant-pagination-item-link,
      .admin-layout .ant-pagination-next .ant-pagination-item-link {
        background: ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff'} !important;
        border-color: ${borderVal} !important;
        color: ${textVal} !important;
      }

      .admin-layout .ant-divider {
        border-color: ${borderVal} !important;
      }

      .admin-layout .ant-typography {
        color: inherit;
      }

      .admin-layout h1.ant-typography, .admin-layout h2.ant-typography, .admin-layout h3.ant-typography, .admin-layout h4.ant-typography, .admin-layout h5.ant-typography {
        color: ${textVal} !important;
      }

      /* Dynamic Theme Preset Overrides for Ant Controls */
      .admin-layout .ant-tabs-ink-bar {
        background: ${primary} !important;
      }

      .admin-layout .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
        color: ${primary} !important;
        font-weight: 700 !important;
      }

      .admin-layout .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
        color: ${primary} !important;
        border-color: ${primary} !important;
      }

      .admin-layout .ant-tag-blue, .admin-layout .ant-tag-processing {
        color: ${primary} !important;
        background: ${primary}18 !important;
        border-color: ${primary}33 !important;
      }

      .admin-layout .ant-btn-link {
        color: ${primary} !important;
      }

      .admin-layout .ant-badge .ant-badge-count {
        background: ${primary} !important;
      }
    `;

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [themeMode, themePreset, customSettings, densityMetrics, themeConfigs]);

  // Clean up any lingering body classes on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('theme-dark', 'dark', 'admin-dark');
      document.documentElement.classList.remove('theme-dark', 'dark');
    };
  }, []);

  const currentTheme = themeConfigs[themePreset] || themeConfigs.default;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode: setThemeModeExplicit,
        themePreset,
        toggleThemeMode,
        changePreset,
        themeConfigs,
        customSettings,
        updateCustomTheme,
        resetToDefaultTheme,
        currentTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
