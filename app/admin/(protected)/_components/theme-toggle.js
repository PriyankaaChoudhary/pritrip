'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

export default function ThemeToggle() {
  const { theme, mounted, toggleTheme } = useTheme();

  // Render a stable placeholder during SSR and first client render
  // to prevent hydration mismatch. After mount, render the real icon.
  if (!mounted) {
    return (
      <div
        className="w-9 h-9 rounded-full border border-default opacity-0"
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative w-9 h-9 rounded-full border border-default hover:border-lime hover:text-lime transition flex items-center justify-center overflow-hidden"
    >
      <Sun
        size={14}
        className={`absolute transition-all duration-300 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
        }`}
      />
      <Moon
        size={14}
        className={`absolute transition-all duration-300 ${
          isDark ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
        }`}
      />
    </button>
  );
}