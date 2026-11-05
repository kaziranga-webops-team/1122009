'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { writableResources } from '@/lib/portal/permissions';
import { RESOURCE_LABELS } from '@/lib/portal/contentSchema';

/**
 * The content area's own switcher.
 *
 * These were seven sidebar links; as tabs they stay one click away without
 * crowding the navigation, and only what this role may edit is listed.
 */
export const ContentTabs: React.FC = () => {
  const params = useParams<{ resource: string }>();
  const { user } = useAuth();
  const resources = writableResources(user?.role);

  if (resources.length < 2) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {resources.map((r) => {
        const active = params?.resource === r;
        return (
          <Link
            key={r}
            href={`/admin/content/${r}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-caption font-display font-bold transition-colors',
              active
                ? 'bg-brand text-brand-contrast'
                : 'bg-surface-raised border border-hairline text-ink-muted hover:text-ink hover:border-hairline-strong'
            )}
          >
            {RESOURCE_LABELS[r].title}
          </Link>
        );
      })}
    </div>
  );
};
