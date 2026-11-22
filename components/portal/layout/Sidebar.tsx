'use client';

import React, { useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getNavSections } from './navConfig';
import { NavSectionBlock } from './NavList';

/** The house seal in a ringed disc, with "K" standing in if the file fails. */
export const BrandSeal: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => {
  const [failed, setFailed] = useState(false);
  return (
    <span
      aria-hidden
      className={`shrink-0 grid place-items-center rounded-full overflow-hidden bg-surface-sunken text-ink
        font-display font-extrabold text-[1.25rem]
        ring-1 ring-hairline-strong shadow-xs ${className}`}
    >
      {failed ? (
        'K'
      ) : (
        <img
          src="/kaziranga-logo.svg"
          alt=""
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
};

const COLLAPSE_KEY = 'kz-sidebar-collapsed';

/** Wordmark + strapline, shared by the sidebar and the mobile drawer. */
export const BrandLockup: React.FC = () => (
  <span className="flex items-center gap-3 min-w-0">
    <BrandSeal />
    <span className="min-w-0">
      <span className="block font-display font-extrabold text-[1.125rem] leading-[1.1] tracking-[-0.01em] text-ink">
        Kaziranga House
      </span>
      <span className="block mt-[3px] text-[0.75rem] font-semibold text-ink-muted">Member portal</span>
    </span>
  </span>
);

/**
 * A full-height panel of its own. The navigation owns the middle and scrolls
 * when it runs long (an admin's list does), so the website card at the foot
 * can never push items out of reach.
 */
export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Remembered per browser. Read after mount so the server render and the
  // first client render agree.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((was) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, was ? '0' : '1');
      } catch {}
      return !was;
    });
  };

  if (!user) return null;

  const sections = getNavSections(user.role);

  return (
    <aside
      className={`hidden lg:flex shrink-0 sticky top-4 h-[calc(100dvh-2rem)] z-30
        transition-[width] duration-300 ease-editorial
        ${collapsed ? 'w-[64px]' : 'w-[var(--sidebar-width)]'}`}
    >
      <div
        className={`flex flex-col w-full h-full min-h-0 gap-7 rounded-[20px] py-5
          bg-surface-raised border border-hairline shadow-e-1 overflow-hidden
          ${collapsed ? 'px-2.5' : 'px-3.5'}`}
      >
        <Link
          href="/dashboard"
          aria-label="Kaziranga House — dashboard"
          className={`shrink-0 rounded-xl ${collapsed ? 'self-center' : 'px-1.5'}`}
        >
          {collapsed ? <BrandSeal /> : <BrandLockup />}
        </Link>

        <nav
          className="flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1"
          aria-label="Main navigation"
        >
          {sections.map((section, i) => (
            <NavSectionBlock
              key={section.id}
              section={section}
              pathname={pathname}
              isFirst={i === 0}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`shrink-0 flex items-center gap-3 min-h-10 rounded-xl text-[0.875rem] font-medium
            text-ink-muted hover:text-ink hover:bg-surface-sunken/60 transition-colors
            ${collapsed ? 'justify-center' : 'px-3'}`}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5" aria-hidden />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
