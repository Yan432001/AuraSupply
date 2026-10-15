export const publicTheme = {
  pageBackground:
    'radial-gradient(circle at 10% 8%, rgba(47, 111, 237, 0.16), transparent 30%), radial-gradient(circle at 90% 4%, rgba(255, 122, 61, 0.12), transparent 26%), radial-gradient(circle at 85% 60%, rgba(47, 111, 237, 0.10), transparent 30%), linear-gradient(180deg, #eef3ff 0%, #f7f9ff 48%, #eef3ff 100%)',
  heroBackground:
    'radial-gradient(circle at 18% 20%, rgba(47, 111, 237, 0.14), transparent 24%), radial-gradient(circle at 84% 10%, rgba(255, 122, 61, 0.14), transparent 24%), linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,245,255,0.98) 54%, rgba(238,243,255,0.98) 100%)',
  cardBackground: 'rgba(255, 255, 255, 0.88)',
  cardStrong: '#ffffff',
  cardMuted: 'rgba(240, 244, 255, 0.9)',
  primary: '#2f6fed',
  secondary: '#5b8def',
  accent: '#ff7a3d',
  text: '#1c2333',
  subtext: '#6b7590',
  border: 'rgba(47, 111, 237, 0.16)',
  softBorder: 'rgba(47, 111, 237, 0.12)',
  shadow: '0 24px 70px rgba(47, 111, 237, 0.14)',
  lightShadow: '0 14px 38px rgba(47, 111, 237, 0.1)',
  pill: 'linear-gradient(135deg, rgba(47,111,237,0.12), rgba(91,141,239,0.12))',
  ribbon: 'linear-gradient(135deg, #2f6fed 0%, #5b8def 100%)',
  sunset: 'linear-gradient(135deg, #ff7a3d 0%, #ff9a5c 100%)',
  success: '#22c55e',
  warning: '#f0b429',
  danger: '#f5484d',
};


const adminThemeLight = {
  pageBackground:
    'radial-gradient(circle at 8% 6%, rgba(47, 111, 237, 0.07), transparent 30%), radial-gradient(circle at 92% 8%, rgba(255, 122, 61, 0.04), transparent 25%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
  sidebar: '#ffffff',
  sidebarMuted: '#64748b',
  sidebarBorder: 'rgba(226, 232, 240, 0.85)',
  sidebarActiveBg: 'rgba(47, 111, 237, 0.08)',
  sidebarActiveText: '#2f6fed',
  sidebarHoverBg: 'rgba(47, 111, 237, 0.04)',
  sidebarSectionLabel: '#94a3b8',
  topPanel: '#ffffff',
  headerBg: '#ffffff',
  headerColor: '#0f172a',
  headerText: '#0f172a',
  headerSubtext: '#64748b',
  headerBorder: 'rgba(226, 232, 240, 0.85)',
  headerButtonBg: 'rgba(15, 23, 42, 0.03)',
  headerInputBg: 'rgba(15, 23, 42, 0.03)',
  card: '#ffffff',
  cardMuted: '#f8fafc',
  text: '#0f172a',
  subtext: '#64748b',
  border: 'rgba(226, 232, 240, 0.85)',
  primary: '#2f6fed',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  shadow: '0 10px 30px -5px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
  systemTeal: '#0d9488',
  systemTealSoft: 'rgba(13, 148, 136, 0.12)',
  systemOrange: '#ff7a3d',
  systemOrangeSoft: 'rgba(255, 122, 61, 0.12)',
};

const adminThemeDark = {
  pageBackground:
    'radial-gradient(circle at 8% 6%, rgba(47, 111, 237, 0.12), transparent 30%), radial-gradient(circle at 92% 8%, rgba(255, 122, 61, 0.06), transparent 25%), linear-gradient(180deg, #0b0f19 0%, #0f172a 100%)',
  sidebar: '#0f172a',
  sidebarMuted: '#94a3b8',
  sidebarBorder: 'rgba(255, 255, 255, 0.08)',
  sidebarActiveBg: 'rgba(47, 111, 237, 0.18)',
  sidebarActiveText: '#60a5fa',
  sidebarHoverBg: 'rgba(255, 255, 255, 0.05)',
  sidebarSectionLabel: '#64748b',
  topPanel: '#0f172a',
  headerBg: '#0f172a',
  headerColor: '#f8fafc',
  headerText: '#f8fafc',
  headerSubtext: '#94a3b8',
  headerBorder: 'rgba(255, 255, 255, 0.08)',
  headerButtonBg: 'rgba(255, 255, 255, 0.05)',
  headerInputBg: 'rgba(255, 255, 255, 0.05)',
  card: '#1e293b',
  cardMuted: '#182234',
  text: '#f8fafc',
  subtext: '#94a3b8',
  border: 'rgba(255, 255, 255, 0.08)',
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  shadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
  systemTeal: '#14b8a6',
  systemTealSoft: 'rgba(20, 184, 166, 0.16)',
  systemOrange: '#ff9a5c',
  systemOrangeSoft: 'rgba(255, 154, 92, 0.18)',
};

// Static default (light) — for any code path outside a component render.
// Prefer `useAdminTheme()` inside components so colors follow the dark-mode
// toggle and the selected Theme Customizer preset.
export const adminTheme = adminThemeLight;

export const getContrastTextColor = (bgColor) => {
  if (!bgColor) return null;
  if (typeof bgColor === 'string' && bgColor.startsWith('rgba')) {
    const parts = bgColor.match(/[\d.]+/g);
    if (parts && parts.length >= 4 && parseFloat(parts[3]) < 0.45) {
      return null;
    }
  }
  let r = 255;
  let g = 255;
  let b = 255;
  if (typeof bgColor === 'string' && bgColor.startsWith('#')) {
    const clean = bgColor.replace('#', '');
    if (clean.length === 6) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
    } else if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    }
  } else if (typeof bgColor === 'string' && bgColor.startsWith('rgb')) {
    const parts = bgColor.match(/\d+/g);
    if (parts && parts.length >= 3) {
      r = parseInt(parts[0], 10);
      g = parseInt(parts[1], 10);
      b = parseInt(parts[2], 10);
    }
  }
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 148 ? '#0f172a' : '#ffffff';
};

const hexToRgba = (hex, alpha) => {
  const clean = (hex || '').replace('#', '');
  if (clean.length !== 6 && clean.length !== 3) return hex;
  const full = clean.length === 3 ? clean.split('').map((ch) => ch + ch).join('') : clean;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Wallpaper generators for Transparent Background System
export const getWallpaperBackground = (wallpaperKey, isDark) => {
  switch (wallpaperKey) {
    case 'cyber':
      return `radial-gradient(at 15% 15%, rgba(6, 182, 212, ${isDark ? 0.35 : 0.22}) 0px, transparent 55%), radial-gradient(at 85% 85%, rgba(99, 102, 241, ${isDark ? 0.4 : 0.28}) 0px, transparent 55%), radial-gradient(at 50% 50%, rgba(236, 72, 153, ${isDark ? 0.25 : 0.16}) 0px, transparent 65%), linear-gradient(180deg, ${isDark ? '#050811' : '#f0fdff'} 0%, ${isDark ? '#0b1329' : '#e0f2fe'} 100%)`;
    case 'sunset':
      return `radial-gradient(at 15% 20%, rgba(244, 63, 94, ${isDark ? 0.35 : 0.22}) 0px, transparent 50%), radial-gradient(at 85% 25%, rgba(245, 158, 11, ${isDark ? 0.4 : 0.26}) 0px, transparent 55%), radial-gradient(at 50% 90%, rgba(168, 85, 247, ${isDark ? 0.3 : 0.18}) 0px, transparent 55%), linear-gradient(135deg, ${isDark ? '#140711' : '#fff1f2'} 0%, ${isDark ? '#0b0614' : '#ffe4e6'} 100%)`;
    case 'emerald':
      return `radial-gradient(at 10% 10%, rgba(16, 185, 129, ${isDark ? 0.4 : 0.26}) 0px, transparent 50%), radial-gradient(at 90% 20%, rgba(2, 132, 199, ${isDark ? 0.35 : 0.22}) 0px, transparent 50%), radial-gradient(at 80% 90%, rgba(217, 119, 6, ${isDark ? 0.25 : 0.16}) 0px, transparent 50%), linear-gradient(180deg, ${isDark ? '#03140e' : '#ecfdf5'} 0%, ${isDark ? '#021814' : '#d1fae5'} 100%)`;
    case 'cosmic':
      return `radial-gradient(at 30% 30%, rgba(147, 51, 234, 0.45) 0px, transparent 50%), radial-gradient(at 70% 60%, rgba(59, 130, 246, 0.4) 0px, transparent 50%), radial-gradient(at 20% 80%, rgba(236, 72, 153, 0.3) 0px, transparent 50%), linear-gradient(145deg, #020617 0%, #0b0f19 100%)`;
    case 'minimal':
      return `radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.16), transparent 40%), radial-gradient(circle at 90% 90%, rgba(14, 165, 233, 0.16), transparent 40%), linear-gradient(180deg, ${isDark ? '#0a0e17' : '#f8fafc'} 0%, ${isDark ? '#0f172a' : '#f1f5f9'} 100%)`;
    case 'aurora':
    default:
      return `radial-gradient(at 0% 0%, rgba(47, 111, 237, ${isDark ? 0.45 : 0.28}) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(124, 58, 237, ${isDark ? 0.4 : 0.24}) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(16, 185, 129, ${isDark ? 0.3 : 0.18}) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(234, 88, 12, ${isDark ? 0.25 : 0.14}) 0px, transparent 50%), linear-gradient(135deg, ${isDark ? '#080c14' : '#f0f4ff'} 0%, ${isDark ? '#0f172a' : '#e6edfd'} 100%)`;
  }
};

export const isColorLight = (colorStr) => {
  if (!colorStr) return false;
  const s = String(colorStr).trim().toLowerCase();
  if (['white', '#fff', '#ffffff', '#f8fafc', '#f1f5f9', '#fafafa', '#f5f5f5', '#e2e8f0', '#eef3ff'].includes(s)) return true;
  if (['black', '#000', '#000000', '#0f172a', '#0b0f19', '#161f30', '#1e293b', '#080c14', '#141414'].includes(s)) return false;
  if (s.startsWith('rgba') || s.startsWith('rgb')) {
    const parts = s.match(/\d+/g);
    if (parts && parts.length >= 3) {
      const lum = (0.299 * parseInt(parts[0], 10) + 0.587 * parseInt(parts[1], 10) + 0.114 * parseInt(parts[2], 10)) / 255;
      return lum > 0.5;
    }
  }
  if (s.startsWith('#')) {
    const clean = s.replace('#', '');
    let r = 255, g = 255, b = 255;
    if (clean.length === 6) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
    } else if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    }
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.5;
  }
  return false;
};

// Reactive admin theme: merges the light/dark palette with the primary
// color chosen in the Theme Customizer, header theme settings, and transparent background system.
export const useAdminThemeTokens = (themeMode = 'light', presetPrimary, customSettings = {}) => {
  const isDark = themeMode === 'dark';
  const base = isDark ? adminThemeDark : adminThemeLight;
  const primary = presetPrimary || base.primary;

  const transparentConfig = customSettings?.transparentSystem;
  const isTransparent = Boolean(transparentConfig?.enabled);

  // Calculate opacity and transparent tokens
  const opacityFraction = Math.max(0.2, Math.min(1, (transparentConfig?.surfaceOpacity || 78) / 100));

  // Mode-aware defaults: prevents legacy or light defaults from hijacking dark mode and vice versa
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

  const rawHeaderBg = isDark
    ? resolveDarkColor(customSettings?.headerBg, customSettings?.darkHeaderBg, defaultHeaderBg)
    : resolveLightColor(customSettings?.headerBg, customSettings?.lightHeaderBg, defaultHeaderBg);

  const rawHeaderColor = isDark
    ? resolveDarkColor(customSettings?.headerColor, customSettings?.darkHeaderColor, defaultHeaderColor)
    : resolveLightColor(customSettings?.headerColor, customSettings?.lightHeaderColor, defaultHeaderColor);

  const rawSidebarBg = isDark
    ? resolveDarkColor(customSettings?.sidebarBg, customSettings?.darkSidebarBg, defaultSidebarBg)
    : resolveLightColor(customSettings?.sidebarBg, customSettings?.lightSidebarBg, defaultSidebarBg);

  const rawCardBg = isDark
    ? resolveDarkColor(customSettings?.cardBg, customSettings?.darkCardBg, defaultCardBg)
    : resolveLightColor(customSettings?.cardBg, customSettings?.lightCardBg, defaultCardBg);

  // Determine header background
  let headerBg;
  if (isTransparent && transparentConfig?.transparentHeader !== false) {
    headerBg = hexToRgba(rawHeaderBg, opacityFraction);
  } else {
    headerBg = rawHeaderBg;
  }

  // Determine header text & content color
  let headerColor = rawHeaderColor;
  if (!customSettings?.headerColor && customSettings?.headerBg) {
    headerColor = getContrastTextColor(headerBg) || (isDark ? '#f8fafc' : '#0f172a');
  }

  const isHeaderLight = headerColor === '#0f172a' || getContrastTextColor(headerBg) === '#0f172a';
  const headerSubtext = isHeaderLight ? '#64748b' : '#94a3b8';
  const headerBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.85)';
  const headerButtonBg = isHeaderLight ? 'rgba(15, 23, 42, 0.035)' : 'rgba(255, 255, 255, 0.06)';
  const headerInputBg = isHeaderLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.05)';

  if (!isTransparent) {
    return {
      ...base,
      isDark,
      themeMode,
      primary,
      headerBg,
      headerColor,
      headerText: headerColor,
      headerSubtext,
      headerBorder,
      headerButtonBg,
      headerInputBg,
      topPanel: headerBg,
      sidebar: rawSidebarBg,
      card: rawCardBg,
      cardMuted: isDark ? '#141d2e' : '#f8fafc',
      cardBorder: headerBorder,
      sidebarBorder: headerBorder,
      border: headerBorder,
      sidebarActiveText: primary,
      sidebarActiveBg: hexToRgba(primary, isDark ? 0.22 : 0.12),
      isTransparent: false,
    };
  }

  const glow = transparentConfig.glassBorderGlow !== false;
  const wallpaperKey = transparentConfig.wallpaper || 'aurora';
  const pageBg = getWallpaperBackground(wallpaperKey, isDark);

  const cardRgba = hexToRgba(rawCardBg, opacityFraction);

  const cardMutedRgba = isDark
    ? `rgba(15, 23, 42, ${Math.max(0.2, opacityFraction - 0.1)})`
    : `rgba(240, 245, 255, ${Math.max(0.3, opacityFraction - 0.1)})`;

  const sidebarRgba = transparentConfig.transparentSidebar !== false
    ? hexToRgba(rawSidebarBg, Math.min(0.92, opacityFraction + 0.08))
    : rawSidebarBg;

  const glassBorder = isDark
    ? (glow ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.08)')
    : (glow ? 'rgba(255, 255, 255, 0.75)' : 'rgba(226, 232, 240, 0.7)');

  return {
    ...base,
    isDark,
    themeMode,
    pageBackground: pageBg,
    card: cardRgba,
    cardMuted: cardMutedRgba,
    cardBorder: glassBorder,
    sidebar: sidebarRgba,
    topPanel: headerBg,
    headerBg,
    headerColor,
    headerText: headerColor,
    headerSubtext,
    headerBorder: glassBorder,
    headerButtonBg,
    headerInputBg,
    border: glassBorder,
    sidebarBorder: glassBorder,
    primary,
    sidebarActiveText: primary,
    sidebarActiveBg: hexToRgba(primary, isDark ? 0.24 : 0.14),
    isTransparent: true,
    glassBlur: transparentConfig.blurRadius || 20,
    glassSaturation: transparentConfig.saturation || 140,
    glassShadow: isDark
      ? '0 12px 36px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      : '0 12px 36px 0 rgba(47, 111, 237, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  };
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

export const formatCompact = (value) => compactFormatter.format(Number(value || 0));
