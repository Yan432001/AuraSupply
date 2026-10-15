// src/hooks/useThemePersist.js
import { useEffect } from 'react';
import { theme } from 'antd';

export const useThemePersist = (currentTheme) => {
  useEffect(() => {
    // Save theme to document for CSS variables
    const root = document.documentElement;
    const themeTokens = theme.getDesignToken();
    
    Object.entries(themeTokens).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--ant-${key}`, value);
      }
    });

    // Save theme preference
    localStorage.setItem('admin-theme', currentTheme);
    
    // Add theme class to body
    document.body.className = `theme-${currentTheme}`;
    
    // Dispatch custom event for theme change
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { theme: currentTheme } 
    }));
  }, [currentTheme]);
};