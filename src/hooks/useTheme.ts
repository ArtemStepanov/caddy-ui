import { useEffect } from 'react';
import type { ThemeMode } from '@/types';

/**
 * Hook to manage theme application and system theme detection
 */
export const useTheme = (theme: ThemeMode) => {
  useEffect(() => {
    const root = document.documentElement;
    
    // Function to apply theme to DOM
    const applyTheme = (mode: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      root.classList.add(mode);
    };

    // Function to detect system theme
    const getSystemTheme = (): 'light' | 'dark' => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // Apply theme based on setting
    if (theme === 'auto') {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
      };

      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      // Apply explicit theme
      applyTheme(theme);
    }
  }, [theme]);
};

