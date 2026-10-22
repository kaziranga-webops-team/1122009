'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Linkedin, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SOCIAL_LINKS, type NavSection } from './navConfig';
import { useNotifications } from '@/context/NotificationContext';

const SOCIAL_ICONS = { Instagram, LinkedIn: Linkedin, YouTube: Youtube } as const;

export const NavLink: React.FC<{
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  accent?: boolean;
  badge?: number;
  onNavigate?: () => void;
}> = ({ href, label, icon: Icon, isActive, accent = false, badge, onNavigate }) => (
  <Link
    href={href}
    onClick={onNavigate}
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      'group flex items-center gap-3 min-h-11 px-3 rounded-xl text-[0.9375rem]',
      'transition-[background-color,color] duration-200 ease-editorial',
      isActive
        ? accent
          ? 'bg-accent-soft text-accent font-extrabold'
          : 'bg-brand-soft text-brand font-extrabold'
        : 'text-ink font-semibold hover:bg-surface-sunken'
    )}
  >
    <Icon className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden />
    <span className="truncate flex-1">{label}</span>
    {typeof badge === 'number' && badge > 0 && (
      <span
        aria-label={`${badge} unread`}
        className="ml-auto inline-flex items-center justify-center min-w-[1.5rem] px-[9px] py-0.5
          text-[0.75rem] font-extrabold rounded-full tabular-nums bg-accent-soft text-accent"
      >
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </Link>
);

export const NavSectionBlock: React.FC<{
  section: NavSection;
  pathname: string;
  onNavigate?: () => void;
  isFirst?: boolean;
}> = ({ section, pathname, onNavigate, isFirst = false }) => {
  const { unreadCount } = useNotifications();

  return (
    <div className={cn('flex flex-col gap-1', !isFirst && 'pt-[22px]')}>
      <div className="flex items-center justify-between gap-2 px-3 pb-1.5">
        <h4
          className={cn(
            'text-[0.6875rem] font-extrabold uppercase tracking-[0.14em]',
            section.accent ? 'text-accent' : 'text-ink-muted'
          )}
        >
          {section.label}
        </h4>
        {section.action && (
          <Link
            href={section.action.href}
            onClick={onNavigate}
            title={section.action.label}
            aria-label={section.action.label}
            className="p-1 rounded-lg text-ink-faint hover:text-brand hover:bg-surface-sunken dark:text-white/40 dark:hover:text-[rgb(var(--accent-vivid))] dark:hover:bg-white/10 transition-colors"
          >
            <section.action.icon className="w-4 h-4" />
          </Link>
        )}
      </div>
      {section.items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          isActive={pathname === item.href}
          accent={section.accent}
          badge={item.href.endsWith('/notifications') && unreadCount > 0 ? unreadCount : undefined}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
};

export const SocialRow: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center gap-1.5', className)}>
    {SOCIAL_LINKS.map((social) => {
      const Icon = SOCIAL_ICONS[social.label as keyof typeof SOCIAL_ICONS];
      return (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Kaziranga House on ${social.label}`}
          className={cn(
            'p-2 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-sunken dark:text-white/40 dark:hover:text-white dark:hover:bg-white/10 transition-colors',
            social.hover
          )}
        >
          <Icon className="w-[17px] h-[17px]" />
        </a>
      );
    })}
  </div>
);
