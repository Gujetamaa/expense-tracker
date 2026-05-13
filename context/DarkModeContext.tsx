'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme } from '@/lib/darkMode';

interface DarkModeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme_preference') as Theme | null;
  return stored || 'light';
}

function applyThemeToDOM(theme: Theme) {
  if (typeof window === 'undefined') return;
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyThemeToDOM(initialTheme);
    setMounted(true);
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    if (!mounted) return;
    applyThemeToDOM(theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme_preference', newTheme);
      applyThemeToDOM(newTheme);
    }
  };

  if (!mounted) {
    return children;
  }

  return (
    <DarkModeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    return {
      theme: 'light' as Theme,
      toggleTheme: () => {},
      isDark: false,
    };
  }
  return context;
}
