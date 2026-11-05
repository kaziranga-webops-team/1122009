'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { THEME_STORAGE_KEY, resolveDarkTheme } from '@/lib/theme';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialDark = resolveDarkTheme();
    setIsDark(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);

    // The command palette flips the theme too; follow the class so the icon
    // never shows the wrong mode.
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    if (typeof document === 'undefined') return;

    const next = !isDark;
    const applyTheme = () => {
      setIsDark(next);
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    };

    const doc = document as any;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (typeof doc.startViewTransition === 'function' && !reduceMotion) {
      doc.startViewTransition(applyTheme);
    } else {
      document.documentElement.classList.add('theme-transitioning');
      applyTheme();
      window.setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 350);
    }
  };

  if (!mounted) {
    return <div className={cn('w-11 h-11 rounded-xl', className)} />;
  }

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative w-11 h-11 grid place-items-center rounded-xl overflow-hidden',
        'text-ink hover:bg-surface-sunken transition-colors',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
          transition={{ duration: 0.22 }}
          className="absolute inset-0 grid place-items-center"
        >
          {isDark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};
