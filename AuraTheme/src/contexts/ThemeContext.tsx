import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  themePreset: string;
  changePreset: (preset: string) => void;
  currentTheme?: any;
  customSettings?: any;
  updateCustomTheme?: (settings: any) => void;
  resetToDefaultTheme?: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('admin-theme') as ThemeMode) ||
      (localStorage.getItem('admin-theme-mode') as ThemeMode) ||
      (localStorage.getItem('theme-mode') as ThemeMode) ||
      'light';
  });

  const [themePreset, setThemePreset] = useState<string>(() => {
    if (typeof window === 'undefined') return 'default';
    return localStorage.getItem('admin-theme-preset') || 'default';
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('admin-theme', mode);
      localStorage.setItem('admin-theme-mode', mode);
      localStorage.setItem('theme-mode', mode);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleThemeMode = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const changePreset = (preset: string) => {
    setThemePreset(preset);
    try {
      localStorage.setItem('admin-theme-preset', preset);
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isAdmin = window.location.pathname.startsWith('/admins');
    if (!isAdmin) return;

    const doc = document.documentElement;
    const body = document.body;
    const mode = themeMode === 'dark' ? 'dark' : 'light';

    doc.classList.add('admin-active');
    doc.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
    doc.classList.add(mode, `theme-${mode}`);
    doc.setAttribute('data-mode', mode);
    doc.setAttribute('data-theme', themePreset);
    doc.style.colorScheme = mode;

    if (body) {
      body.classList.add('admin-active');
      body.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
      body.classList.add(mode, `theme-${mode}`);
      body.setAttribute('data-mode', mode);
      body.setAttribute('data-theme', themePreset);
    }
  }, [themeMode, themePreset]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        toggleThemeMode,
        themePreset,
        changePreset,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeContext;
