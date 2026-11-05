import React from 'react';
import { cn } from '@/lib/utils';

interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  /** Secondary line under the value — a delta, a deadline, a total. */
  meta?: React.ReactNode;
  tone?: 'default' | 'brand' | 'accent' | 'live';
  className?: string;
}

const toneRing: Record<NonNullable<StatProps['tone']>, string> = {
  default: 'text-ink-muted bg-surface-sunken',
  brand: 'text-brand bg-brand-soft',
  accent: 'text-accent bg-accent-soft',
  live: 'text-signal-live bg-signal-live/10',
};

export const Stat: React.FC<StatProps> = ({
  label,
  value,
  icon,
  meta,
  tone = 'default',
  className,
}) => (
  // Flat on purpose: the house style is solid colour and a hairline, so the
  // blurred tonal wash and the white-to-transparent gradient this used to
  // carry are gone. A figure should read instantly, not sit in a vignette.
  <div
    className={cn(
      'group relative flex items-start gap-4 p-5 rounded-2xl overflow-hidden',
      'bg-surface-raised border border-hairline',
      'transition-[border-color,transform] duration-300 ease-editorial',
      'hover:border-hairline-strong hover:-translate-y-0.5',
      className
    )}
  >
    {icon && (
      <span
        className={cn(
          'relative flex items-center justify-center w-11 h-11 rounded-full shrink-0',
          '[&>svg]:w-5 [&>svg]:h-5',
          toneRing[tone]
        )}
        aria-hidden
      >
        {icon}
      </span>
    )}
    <div className="relative min-w-0 space-y-1">
      <div className="text-display-sm font-display font-semibold text-ink nums leading-none">
        {value}
      </div>
      <div className="text-caption font-semibold text-ink-muted">{label}</div>
      {meta && <div className="text-micro text-ink-faint pt-0.5">{meta}</div>}
    </div>
  </div>
);
