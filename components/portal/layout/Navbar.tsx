'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Crown, Shield, Menu, X, User as UserIcon, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/portal/permissions';
import { BrandLockup } from './Sidebar';
import { NotificationBell } from '@/components/portal/notifications/NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from '@/components/portal/ui/Badge';
import { cn } from '@/lib/utils';
import { getNavSections } from './navConfig';
import { NavSectionBlock, SocialRow } from './NavList';
import { EASE_EDITORIAL } from '@/components/portal/ui/Motion';

const roleBadge = (role?: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return (
        <Badge tone="accent" size="sm">
          <Crown className="w-3 h-3" aria-hidden />
          Super Admin
        </Badge>
      );
    case 'ADMIN':
      return (
        <Badge tone="info" size="sm">
          <Shield className="w-3 h-3" aria-hidden />
          Admin
        </Badge>
      );
    default:
      return (
        <Badge tone="neutral" size="sm" className="dark:bg-white/10 dark:text-white/70 dark:border-white/15">
          Member
        </Badge>
      );
  }
};

const Avatar: React.FC<{ src?: string; name: string; className?: string }> = ({
  src,
  name,
  className,
}) =>
  src ? (
    <img
      src={src}
      alt=""
      className={cn(
        'rounded-full object-cover ring-1 ring-[rgb(var(--accent-vivid))]/40',
        className
      )}
    />
  ) : (
    <span
      className={cn(
        'grid place-items-center rounded-full bg-[rgb(var(--accent-vivid))] text-accent-contrast font-extrabold',
        className
      )}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openSearch = () => window.dispatchEvent(new CustomEvent('open-command-palette'));

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  if (pathname === '/login' || pathname === '/access-denied' || !user) return null;

  const sections = getNavSections(user.role);
  const firstName = user.name?.trim().split(/\s+/)[0] || 'Member';

  return (
    <>
      <header
        className="flex items-center gap-3 rounded-[20px] bg-surface-raised border border-hairline shadow-e-1
          py-2.5 pl-3 pr-2.5 sm:pl-3.5 sm:pr-3"
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden grid place-items-center w-11 h-11 -mr-1 rounded-xl text-ink hover:bg-surface-sunken transition-colors"
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* The brand lives in the sidebar, so the bar opens on the one thing
            people reach for most. */}
        <button
          type="button"
          onClick={openSearch}
          title="Search or jump to (⌘K)"
          aria-label="Search or jump to"
          className="flex flex-1 min-w-0 max-w-[460px] items-center gap-2.5 h-11 pl-3 pr-2
            rounded-xl bg-surface border border-hairline text-ink-muted
            hover:border-hairline-strong transition-colors text-left"
        >
          <Search className="w-[18px] h-[18px] shrink-0" aria-hidden />
          <span className="flex-1 truncate text-[0.875rem]">Search events, people, pages…</span>
          <kbd className="hidden sm:inline-flex items-center px-[7px] py-[3px] rounded-[7px] text-[0.75rem] font-bold
            font-[inherit] bg-surface-raised border border-hairline">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <ThemeToggle />
          <NotificationBell />

          <span className="hidden sm:block w-px h-7 mx-2 bg-hairline" aria-hidden />

          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2.5 min-h-11 p-1 md:pr-3 rounded-full hover:bg-surface-sunken transition-colors"
          >
            <Avatar src={user.avatarUrl} name={user.name} className="w-9 h-9 text-[0.9375rem]" />
            <span className="hidden md:flex flex-col leading-[1.2] text-left min-w-0">
              <span className="text-[0.875rem] font-extrabold text-ink truncate max-w-[160px]">
                {firstName}
              </span>
              <span className="text-[0.75rem] font-semibold text-ink-muted truncate max-w-[160px]">
                {ROLE_LABELS[user.role] ?? 'Member'}
              </span>
            </span>
          </Link>

          <button
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="hidden sm:grid place-items-center w-11 h-11 rounded-xl text-ink-muted hover:text-signal-danger hover:bg-signal-danger/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-ink/40 dark:bg-stage/75 backdrop-blur-md"
              aria-hidden
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.34, ease: EASE_EDITORIAL }}
              className="relative w-[86%] max-w-[320px] h-full bg-surface-raised dark:ed-stage
                border-r border-hairline dark:border-white/10 flex flex-col shadow-e-4"
            >
              <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-4 border-b border-hairline">
                <BrandLockup />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-sunken dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-hairline dark:border-white/[0.07]">
                <Avatar src={user.avatarUrl} name={user.name} className="w-10 h-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-caption font-semibold text-ink dark:text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-[0.625rem] text-ink-faint dark:text-white/40 truncate">{user.email}</div>
                </div>
                {roleBadge(user.role)}
              </div>

              <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4" aria-label="Main navigation">
                {sections.map((section, i) => (
                  <NavSectionBlock
                    key={section.id}
                    section={section}
                    pathname={pathname}
                    isFirst={i === 0}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                ))}
              </nav>

              <div className="shrink-0 px-4 py-4 border-t border-hairline dark:border-white/[0.07] space-y-3">
                <SocialRow className="justify-center" />
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl
                    text-caption font-semibold font-display
                    text-signal-danger bg-signal-danger/10 hover:bg-signal-danger/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
