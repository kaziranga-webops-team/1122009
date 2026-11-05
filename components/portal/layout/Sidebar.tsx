'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getNavSections } from './navConfig';
import { NavSectionBlock } from './NavList';

const SITE_HOST = 'kaziranga-house.vercel.app';

/** The house seal in a ringed disc, with "K" standing in if the file fails. */
export const BrandSeal: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => {
  const [failed, setFailed] = useState(false);
  return (
    <span
      aria-hidden
      className={`shrink-0 grid place-items-center rounded-full overflow-hidden bg-brand text-brand-contrast
        font-display font-extrabold text-[1.25rem]
        shadow-[0_0_0_3px_rgb(var(--surface-raised)),0_0_0_5px_rgb(var(--ed-accent))] ${className}`}
    >
      {failed ? (
        'K'
      ) : (
        <img
          src="/kaziranga-logo.svg"
          alt=""
          className="w-full h-full object-cover bg-white"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
};

/** Wordmark + strapline, shared by the sidebar and the mobile drawer. */
export const BrandLockup: React.FC = () => (
  <span className="flex items-center gap-3 min-w-0">
    <BrandSeal />
    <span className="min-w-0">
      <span className="block font-display font-extrabold text-[1.125rem] leading-[1.1] tracking-[-0.01em] text-ink">
        Kaziranga <span className="text-accent">House</span>
      </span>
      <span className="block mt-[5px] text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
        Rhinos · Event Arena
      </span>
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

  if (!user) return null;

  const sections = getNavSections(user.role);

  return (
    <aside
      className="hidden lg:flex shrink-0 w-[var(--sidebar-width)]
        sticky top-4 h-[calc(100dvh-2rem)] z-30"
    >
      <div
        className="flex flex-col w-full h-full min-h-0 gap-7 rounded-[20px] px-3.5 py-5
          bg-surface-raised border border-hairline shadow-e-1"
      >
        <Link
          href="/dashboard"
          aria-label="Kaziranga House — dashboard"
          className="shrink-0 px-1.5 rounded-xl"
        >
          <BrandLockup />
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
            />
          ))}
        </nav>

        <a
          href="/"
          className="shrink-0 flex items-center justify-between gap-2.5 min-h-[52px] px-3.5 rounded-[14px]
            border border-hairline bg-surface text-ink
            hover:border-hairline-strong transition-colors"
        >
          <span className="flex flex-col leading-[1.25] min-w-0">
            <span className="text-[0.875rem] font-bold">Visit the website</span>
            <span className="text-[0.75rem] font-semibold text-ink-muted truncate">{SITE_HOST}</span>
          </span>
          <ArrowUpRight className="w-[18px] h-[18px] shrink-0" aria-hidden />
        </a>
      </div>
    </aside>
  );
};
