'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  mounted: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = 'pritrip-theme-admin';

function readCurrentTheme() {
  if (typeof document === 'undefined') return 'dark';
  if (document.documentElement.classList.contains('light')) return 'light';
  return 'dark';
}

export function ThemeProvider({ children }) {
  // Always start with 'dark' on both server and client first render
  // to guarantee no hydration mismatch. We'll sync to real value after mount.
  const [theme, setThemeState] = useState('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(readCurrentTheme());
    setMounted(true);
  }, []);

  function applyTheme(next) {
    if (next !== 'light' && next !== 'dark') return;

    const html = document.documentElement;
    html.classList.add('theme-transition');
    html.classList.remove('light', 'dark');
    html.classList.add(next);
    html.setAttribute('data-theme', next);
    window.setTimeout(() => html.classList.remove('theme-transition'), 220);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}

    setThemeState(next);
  }

  function toggleTheme() {
    const current = readCurrentTheme();
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, mounted, setTheme: applyTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}