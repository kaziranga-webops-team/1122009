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
  /** Icon-only, for the collapsed sidebar; the label becomes a tooltip. */
  collapsed?: boolean;
}> = ({ href, label, icon: Icon, isActive, badge, onNavigate, collapsed = false }) => (
  <Link
    href={href}
    onClick={onNavigate}
    aria-current={isActive ? 'page' : undefined}
    title={collapsed ? label : undefined}
    className={cn(
      'group relative flex items-center min-h-11 rounded-xl text-[0.9375rem]',
      collapsed ? 'justify-center px-0' : 'gap-3 px-3',
      'transition-all duration-200 ease-editorial',
      isActive
        ? 'bg-surface-sunken text-ink font-bold shadow-xs'
        : 'text-ink-muted font-medium hover:text-ink hover:bg-surface-sunken/60'
    )}
  >
    {isActive && (
      <span
        className="absolute left-0 inset-y-2 w-1 rounded-r-full bg-brand"
        aria-hidden
      />
    )}
    <Icon
      className={cn(
        'w-5 h-5 shrink-0 transition-colors',
        isActive ? 'text-brand' : 'text-ink-muted group-hover:text-ink'
      )}
      strokeWidth={isActive ? 2.2 : 1.8}
      aria-hidden
    />
    <span className={collapsed ? 'sr-only' : 'truncate flex-1'}>{label}</span>
    {collapsed && typeof badge === 'number' && badge > 0 && (
      <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-accent" aria-hidden />
    )}
    {!collapsed && typeof badge === 'number' && badge > 0 && (
      <span
        aria-label={`${badge} unread`}
        className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5
          text-[0.6875rem] font-bold rounded-full tabular-nums bg-accent-soft text-accent border border-accent/20"
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
  collapsed?: boolean;
}> = ({ section, pathname, onNavigate, isFirst = false, collapsed = false }) => {
  const { unreadCount } = useNotifications();

  return (
    <div className={cn('flex flex-col gap-1', !isFirst && (collapsed ? 'pt-3 mt-3 border-t border-hairline' : 'pt-5'))}>
      {!collapsed && (
      <div className="flex items-center justify-between gap-2 px-3 pb-1.5">
        <h4 className="text-[0.6875rem] font-semibold text-ink-faint">
          {section.label}
        </h4>
        {section.action && (
          <Link
            href={section.action.href}
            onClick={onNavigate}
            title={section.action.label}
            aria-label={section.action.label}
            className="p-1 rounded-lg text-ink-faint hover:text-brand hover:bg-surface-sunken transition-colors"
          >
            <section.action.icon className="w-4 h-4" />
          </Link>
        )}
      </div>
      )}
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
          collapsed={collapsed}
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
          <Icon className="w-4 h-4" />
        </a>
      );
    })}
  </div>
);
