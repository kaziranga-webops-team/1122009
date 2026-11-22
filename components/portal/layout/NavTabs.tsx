'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavTab {
  label: string;
  href: string;
  /** Kept for callers; the row no longer draws icons. */
  icon?: LucideIcon;
  /** Optional count rendered as a trailing pill. */
  count?: number;
}

interface NavTabsProps {
  tabs: NavTab[];
  /** Gold treatment for the super-admin suite. */
  accent?: boolean;
  /** Distinguishes the shared `layoutId` when two tab bars coexist. */
  id?: string;
}

/**
 * A plain underline tab row for the management screens. It scrolls with the
 * page (it used to stick under the top bar and sat over menus and filters),
 * and it carries words only: the icons and the sliding pill were decoration.
 */
export const NavTabs: React.FC<NavTabsProps> = ({ tabs, accent = false }) => {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the active tab in view when the row overflows on narrow screens.
  useEffect(() => {
    const active = listRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [pathname]);

  return (
    <nav aria-label="Section" className="mb-6 border-b border-hairline">
      <div ref={listRef} className="flex items-center gap-5 overflow-x-auto no-scrollbar -mb-px">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            // Site content has one URL per resource; any of them is that tab.
            (tab.href.startsWith('/admin/content') && pathname.startsWith('/admin/content'));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'shrink-0 inline-flex items-center gap-1.5 h-9 border-b-2 text-[0.8125rem] whitespace-nowrap transition-colors',
                isActive
                  ? cn('font-semibold text-ink', accent ? 'border-accent' : 'border-brand')
                  : 'font-medium text-ink-muted border-transparent hover:text-ink'
              )}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className="text-[0.6875rem] text-ink-faint nums">{tab.count}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
