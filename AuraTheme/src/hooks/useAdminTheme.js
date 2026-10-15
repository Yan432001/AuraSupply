import { useTheme } from '../contexts/ThemeContext';
import { useAdminThemeTokens } from '../utils/uiTheme';

// Custom-styled admin pages call this instead of importing the static
// `adminTheme` object, so their colors follow both the light/dark toggle
// and the color preset chosen in the Theme Customizer.
export const useAdminTheme = () => {
  const { themeMode, currentTheme, customSettings } = useTheme();
  return useAdminThemeTokens(themeMode, currentTheme?.token?.colorPrimary, customSettings);
};
