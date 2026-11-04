import { useTheme } from '../contexts/ThemeContext';
import { useAdminThemeTokens, adminTheme } from '../utils/uiTheme';

// Custom-styled admin pages call this instead of importing the static
// `adminTheme` object, so their colors follow both the light/dark toggle
// and the color preset chosen in the Theme Customizer.
// Also provides themeTokens directly and as a nested property for components
// that destructure `{ themeTokens } = useAdminTheme()`.
export const useAdminTheme = () => {
  try {
    const themeContext = useTheme();
    const { themeMode, currentTheme, customSettings } = themeContext || {};
    const baseTheme = (themeContext && useAdminThemeTokens(themeMode, currentTheme?.token?.colorPrimary, customSettings)) || adminTheme;
    const isDark = themeMode === 'dark';

    const tokens = {
      ...baseTheme,
      isDark,
      themeMode: themeMode || 'light',
      colorPrimary: baseTheme?.primary || '#2563eb',
      colorBgLayout: baseTheme?.pageBackground || baseTheme?.cardMuted || (isDark ? '#0b1120' : '#f8fafc'),
      colorTextHeading: baseTheme?.text || (isDark ? '#f8fafc' : '#0f172a'),
      colorText: baseTheme?.text || (isDark ? '#f1f5f9' : '#0f172a'),
      colorTextSecondary: baseTheme?.subtext || (isDark ? '#94a3b8' : '#64748b'),
      colorBorder: baseTheme?.border || (isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'),
      colorBgContainer: baseTheme?.cardBg || baseTheme?.card || (isDark ? '#1e293b' : '#ffffff'),
    };
    tokens.themeTokens = tokens;
    return tokens;
  } catch (_) {
    const tokens = {
      ...adminTheme,
      isDark: false,
      themeMode: 'light',
      colorPrimary: adminTheme?.primary || '#2563eb',
      colorBgLayout: adminTheme?.pageBackground || adminTheme?.cardMuted || '#f8fafc',
      colorTextHeading: adminTheme?.text || '#0f172a',
      colorText: adminTheme?.text || '#0f172a',
      colorTextSecondary: adminTheme?.subtext || '#64748b',
      colorBorder: adminTheme?.border || '#e2e8f0',
      colorBgContainer: adminTheme?.cardBg || adminTheme?.card || '#ffffff',
    };
    tokens.themeTokens = tokens;
    return tokens;
  }
};

