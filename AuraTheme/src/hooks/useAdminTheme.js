import { useTheme } from '../contexts/ThemeContext';
import { useAdminThemeTokens, adminTheme } from '../utils/uiTheme';

// Custom-styled admin pages call this instead of importing the static
// `adminTheme` object, so their colors follow both the light/dark toggle
// and the color preset chosen in the Theme Customizer.
export const useAdminTheme = () => {
  try {
    const themeContext = useTheme();
    if (!themeContext) return adminTheme;
    const { themeMode, currentTheme, customSettings } = themeContext;
    return useAdminThemeTokens(themeMode, currentTheme?.token?.colorPrimary, customSettings) || adminTheme;
  } catch (_) {
    return adminTheme;
  }
};
