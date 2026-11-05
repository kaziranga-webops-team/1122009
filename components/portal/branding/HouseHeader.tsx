'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE_EDITORIAL } from '@/components/portal/ui/Motion';

interface HouseHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Small tracked-out label above the title, carrying the hornbill mark. */
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  /** Statistics or meta rendered below the rule. */
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * The block that opens a portal page.
 *
 * It is deliberately flat — no card, no gradient, no baseline glow. The page
 * title sits straight on the cream the way the public site's section heads do,
 * which is what makes the portal and the website read as one product. (The
 * version this replaces asked for `ed-mesh`, `ed-grain` and `ed-hero-masthead`;
 * none of those classes exist anywhere in the project, so the aurora and film
 * grain its comment described were never rendering.)
 */
export const HouseHeader: React.FC<HouseHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  footer,
  size = 'md',
  className,
}) => {
  const reduce = useReducedMotion();

  return (
    <motion.header
      initial={reduce ? undefined : { opacity: 0, y: 16 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_EDITORIAL }}
      className={cn('relative', className)}
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-10">
        <div className="min-w-0 max-w-3xl">
          {badge && <p className="kz-label kz-mark text-accent">{badge}</p>}

          <h1
            className={cn(
              'font-display font-semibold tracking-tight text-ink',
              badge && 'mt-4',
              size === 'lg' ? 'text-display-lg' : 'text-display-md'
            )}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="text-body text-ink-muted leading-relaxed max-w-xl mt-4">{subtitle}</p>
          )}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
      </div>

      {footer && <div className="mt-8">{footer}</div>}
    </motion.header>
  );
};

export interface HeaderStatItem {
  label: string;
  value: React.ReactNode;
  /** The quiet line under the figure — a trend, a deadline, a qualifier. */
  meta?: React.ReactNode;
  /** Turns the corner button into a link through to the detail.  */
  href?: string;
}

/**
 * The figures under a masthead.
 *
 * The first cell is filled and the rest are plain: one emphasised card among
 * quiet ones is found instantly, four competing ones are not. Each carries a
 * corner affordance through to its detail, so a number is a way in rather than
 * just a readout.
 */
export const HeaderStats: React.FC<{ items: HeaderStatItem[] }> = ({ items }) => (
  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
    {items.map((item, i) => {
      const lead = i === 0;
      const cornerClass = cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors',
        lead
          ? 'border-white/35 text-brand-contrast hover:bg-white/15'
          : 'border-hairline-strong text-ink-muted hover:bg-surface-sunken hover:text-ink'
      );
      const corner = item.href ? (
        <Link href={item.href} aria-label={`Open ${item.label}`} className={cornerClass}>
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className={cornerClass} aria-hidden>
          <ArrowUpRight className="h-4 w-4" />
        </span>
      );

      return (
        <div
          key={item.label}
          className={cn(
            'group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 min-h-[8.5rem]',
            'transition-[transform,border-color] duration-300 ease-editorial hover:-translate-y-0.5',
            lead
              ? 'bg-brand text-brand-contrast'
              : 'bg-surface-raised border border-hairline text-ink hover:border-hairline-strong'
          )}
        >
          {lead && (
            <span
              aria-hidden
              className="absolute -right-12 -bottom-16 h-44 w-44 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-110"
            />
          )}

          <div className="relative flex items-start justify-between gap-3">
            <dt
              className={cn(
                'text-caption font-display font-bold',
                lead ? 'text-brand-contrast/85' : 'text-ink-muted'
              )}
            >
              {item.label}
            </dt>
            {corner}
          </div>

          <div className="relative">
            <dd
              className={cn(
                'font-display font-semibold leading-none nums text-display-md',
                lead ? 'text-brand-contrast' : 'text-ink'
              )}
            >
              {item.value}
            </dd>
            {item.meta && (
              <p
                className={cn(
                  'mt-2.5 text-micro font-medium',
                  lead ? 'text-brand-contrast/80' : 'text-ink-faint'
                )}
              >
                {item.meta}
              </p>
            )}
          </div>
        </div>
      );
    })}
  </dl>
);
