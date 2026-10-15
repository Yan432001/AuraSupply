import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Custom hook that listens for theme changes in ThemeContext and
 * synchronizes document.documentElement class list and data-mode attribute globally
 * to ensure complete consistency across all admin pages and components.
 */
export function useAdminThemeListener() {
  const themeContext = useTheme();
  const { themeMode, themePreset, toggleThemeMode, setThemeMode } = themeContext;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const doc = document.documentElement;
    const body = document.body;
    const mode = themeMode === 'dark' ? 'dark' : 'light';
    const preset = themePreset || 'default';

    // Only apply admin theme classes to document and body if currently on an /admins route
    const isAdmin = window.location.pathname.startsWith('/admins');
    if (!isAdmin) return;

    // 1. Update document.documentElement class list
    doc.classList.add('admin-active');
    doc.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
    doc.classList.add(mode, `theme-${mode}`);

    // 2. Update data-mode & data-theme attributes on document.documentElement
    doc.setAttribute('data-mode', mode);
    doc.setAttribute('data-theme', preset);
    doc.style.colorScheme = mode;

    // 3. Keep document.body in sync
    if (body) {
      body.classList.add('admin-active');
      body.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
      body.classList.add(mode, `theme-${mode}`);
      body.setAttribute('data-mode', mode);
      body.setAttribute('data-theme', preset);
    }

    // 4. Synchronize localStorage keys for cross-tab and persistent reload consistency
    try {
      localStorage.setItem('admin-theme', mode);
      localStorage.setItem('admin-theme-mode', mode);
      localStorage.setItem('theme-mode', mode);
      localStorage.setItem('admin-theme-preset', preset);
    } catch {
      // Ignore storage access errors in sandboxed iframes
    }

    // 5. Emit custom event for non-React or cross-module subscribers
    try {
      window.dispatchEvent(
        new CustomEvent('admin_theme_changed', {
          detail: { themeMode: mode, themePreset: preset, isDark: mode === 'dark' },
        })
      );
    } catch {
      // Ignore event dispatch errors
    }
  }, [themeMode, themePreset]);

  return {
    ...themeContext,
    isDark: themeMode === 'dark',
    isLight: themeMode === 'light',
  };
}

export default useAdminThemeListener;
