'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { DemoRoleSwitcher } from './DemoRoleSwitcher';
import { CommandPalette } from './CommandPalette';
import { PageTransition } from '@/components/portal/ui/Motion';

const AUTH_PAGES = ['/login', '/access-denied'];

/**
 * Two floating panels on the page ground: the sidebar runs the full height on
 * the left, and the top bar sits beside it over the content — it does not
 * span the window, so the sidebar's brand block is never cut by it.
 */
export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    const handleOpenEvent = () => setIsCommandPaletteOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenEvent);
    };
  }, []);

  if (AUTH_PAGES.includes(pathname) || !user) {
    return <div className="ed-app relative z-[1] min-h-screen flex flex-col bg-surface">{children}</div>;
  }

  return (
    <div className="ed-app relative z-[1] min-h-screen flex flex-col bg-surface">
      <DemoRoleSwitcher />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      <div className="flex-1 w-full max-w-[1680px] mx-auto flex items-start gap-4 p-3 sm:p-4">
        <Sidebar />

        <div className="flex-1 min-w-0 flex flex-col">
          <Navbar />

          {/* `--gutter` is 0: the panels already carry the page margin, so
              nothing inside main bleeds past the top bar's edges. */}
          <main id="main" className="flex-1 min-w-0 [--gutter:0px] pt-5 pb-28 lg:pb-12">
            {/* Keyed on pathname so each route entrance replays. */}
            <PageTransition key={pathname} className="w-full">
              {children}
            </PageTransition>
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
