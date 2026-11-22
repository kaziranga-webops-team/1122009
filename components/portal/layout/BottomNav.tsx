'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, CalendarCheck, ClipboardList, Crown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { canOrganiseEvents, canUsePortalAdmin } from '@/lib/portal/permissions';

interface TabItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Extra path prefixes that should also light this tab. */
  match?: string[];
}

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const items: TabItem[] = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/dashboard/events', icon: Calendar, match: ['/dashboard/events'] },
    { label: 'My activity', href: '/dashboard/my-registrations', icon: CalendarCheck },
  ];

  if (canOrganiseEvents(user.role))
    items.push({
      label: 'Organise',
      href: canUsePortalAdmin(user.role) ? '/admin/dashboard' : '/admin/events',
      icon: ClipboardList,
      match: ['/admin'],
    });
  if (isSuperAdmin)
    items.push({ label: 'House', href: '/super-admin/dashboard', icon: Crown, match: ['/super-admin'] });

  const isTabActive = (item: TabItem) =>
    pathname === item.href || (item.match ?? []).some((p) => pathname.startsWith(p));

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-raised/90 backdrop-blur-xl
        border-t border-hairline
        shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:shadow-none
        pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch justify-around px-1 pt-1.5 pb-1">
        {items.map((item) => {
          const active = isTabActive(item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1 min-w-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors',
                  active
                    ? 'text-brand'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <span
                  className={cn(
                    'absolute -top-1.5 h-[2px] rounded-full bg-brand transition-all duration-300 ease-editorial',
                    active ? 'w-7 opacity-100' : 'w-0 opacity-0'
                  )}
                  aria-hidden
                />
                <Icon className={cn('w-5 h-5', active ? 'stroke-[2.4]' : 'stroke-[1.8]')} />
                <span
                  className={cn(
                    'text-[0.625rem] leading-none tracking-tight truncate max-w-full',
                    active ? 'font-bold' : 'font-medium'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
