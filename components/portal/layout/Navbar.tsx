'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Crown, Shield, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/portal/permissions';
import { BrandSeal } from './Sidebar';
import { NotificationBell } from '@/components/portal/notifications/NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from '@/components/portal/ui/Badge';
import { cn } from '@/lib/utils';
import { ViewAsSwitcher } from './ViewAsSwitcher';

export const roleBadge = (role?: string) => {
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
    case 'RC':
    case 'COMMUNITY_HEAD':
      return (
        <Badge tone="brand" size="sm">
          {ROLE_LABELS[role]}
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

export const Avatar: React.FC<{ src?: string; name: string; className?: string }> = ({
  src,
  name,
  className,
}) =>
  src ? (
    <img
      src={src}
      alt=""
      // Google profile photos can refuse requests that carry the page address.
      referrerPolicy="no-referrer"
      className={cn(
        'rounded-full object-cover ring-1 ring-hairline-strong',
        className
      )}
    />
  ) : (
    <span
      className={cn(
        'grid place-items-center rounded-full bg-surface-sunken text-ink border border-hairline-strong font-extrabold',
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

  const openSearch = () => window.dispatchEvent(new CustomEvent('open-command-palette'));

  if (pathname === '/login' || pathname === '/access-denied' || !user) return null;

  const firstName = user.name?.trim().split(/\s+/)[0] || 'Member';

  return (
    <header
      className="navbar-sticky flex items-center gap-3 rounded-[20px] border border-hairline shadow-e-1
        py-2.5 pl-3 pr-2.5 sm:pl-3.5 sm:pr-3 transition-shadow"
    >
      {/* Phones and tablets: the house seal, home. Navigation and the
          profile live in the bar at the bottom of the screen. */}
      <Link href="/dashboard" aria-label="Home" className="lg:hidden shrink-0 rounded-full">
        <BrandSeal className="w-10 h-10" />
      </Link>

      {/* The brand lives in the sidebar, so the bar opens on the one thing
          people reach for most. */}
      <button
        type="button"
        onClick={openSearch}
        title="Search"
        aria-label="Search"
        className="sm:hidden grid place-items-center w-11 h-11 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors"
      >
        <Search className="w-5 h-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={openSearch}
        title="Search or jump to (⌘K)"
        aria-label="Search or jump to"
        className="hidden sm:flex flex-1 min-w-0 max-w-[420px] items-center gap-2.5 h-11 pl-3 pr-2
          rounded-xl bg-surface border border-hairline text-ink-muted
          hover:border-hairline-strong transition-colors text-left"
      >
        <Search className="w-4 h-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-[0.875rem]">Search events, people, pages…</span>
        <kbd className="hidden sm:inline-flex items-center px-[7px] py-[3px] rounded-[7px] text-[0.75rem] font-bold
          font-[inherit] bg-surface-raised border border-hairline">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1 ml-auto">
        <ViewAsSwitcher />
        <span className="hidden lg:contents">
          <ThemeToggle />
        </span>
        <NotificationBell />

        <span className="hidden lg:block w-px h-7 mx-2 bg-hairline" aria-hidden />

        <Link
          href="/dashboard/profile"
          className="hidden lg:flex items-center gap-2.5 min-h-11 p-1 pr-3 rounded-full hover:bg-surface-sunken transition-colors"
        >
          <Avatar src={user.avatarUrl} name={user.name} className="w-9 h-9 text-[0.9375rem]" />
          <span className="flex flex-col leading-[1.2] text-left min-w-0">
            <span className="text-[0.875rem] font-extrabold text-ink truncate max-w-[160px]">{firstName}</span>
            <span className="text-[0.75rem] font-semibold text-ink-muted truncate max-w-[160px]">
              {ROLE_LABELS[user.role] ?? 'Member'}
            </span>
          </span>
        </Link>

        <button
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
          className="hidden lg:grid place-items-center w-11 h-11 rounded-xl text-ink-muted hover:text-signal-danger hover:bg-signal-danger/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
