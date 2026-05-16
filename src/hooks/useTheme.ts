import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'studynx_theme';

/**
 * Returns the user's preferred theme, checking localStorage first,
 * then falling back to the OS prefers-color-scheme media query.
 */
const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

/**
 * Applies the theme to the document root element so CSS variables take effect.
 * @param theme - 'dark' | 'light'
 */
const applyTheme = (theme: Theme) => {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
};

/**
 * Custom hook for managing the dark/light theme.
 * - Reads OS preference as default
 * - Persists choice in localStorage
 * - Returns current theme and a toggle function
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = getInitialTheme();
    applyTheme(t);
    return t;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
};
