'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const FilterPill: React.FC<FilterPillProps> = ({
  active,
  onClick,
  children,
  count,
  size = 'md',
  disabled = false,
  className,
  icon,
}) => {
  const isSm = size === 'sm';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-full border font-display font-semibold transition-all duration-200',
        'whitespace-nowrap inline-flex items-center justify-center gap-1.5 cursor-pointer select-none',
        'focus:outline-none focus:ring-2 focus:ring-brand/20 dark:focus:ring-accent/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isSm ? 'px-3 h-8 text-micro' : 'px-3.5 h-9 text-caption',
        active
          ? 'bg-brand text-brand-contrast border-brand shadow-sm'
          : 'bg-surface-raised text-ink-muted border-hairline hover:border-hairline-strong hover:text-ink hover:bg-surface-sunken/60',
        className
      )}
    >
      {icon && <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'px-1.5 py-0.2 rounded-full font-mono text-[0.625rem] leading-tight font-bold transition-colors',
            active
              ? 'bg-white/25 text-white'
              : 'bg-surface-sunken text-ink-faint'
          )}
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </button>
  );
};
