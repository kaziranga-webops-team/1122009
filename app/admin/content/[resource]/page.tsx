'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ContentManager } from '@/components/portal/admin/ContentManager';
import { ContentSectionPicker } from '@/components/portal/admin/ContentTabs';
import { EmptyState } from '@/components/portal/ui/EmptyState';
import { CONTENT_RESOURCES, writableResources, type ContentResource } from '@/lib/portal/permissions';
import { RESOURCE_LABELS } from '@/lib/portal/contentSchema';

export default function ContentResourcePage() {
  const params = useParams<{ resource: string }>();
  const { user } = useAuth();

  const resource = params?.resource as ContentResource | undefined;
  if (!resource || !(CONTENT_RESOURCES as readonly string[]).includes(resource)) notFound();

  const labels = RESOURCE_LABELS[resource];
  const canOpen = writableResources(user?.role).includes(resource);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <h1 className="font-display text-display-sm font-semibold tracking-tight text-ink">Website</h1>
        <ContentSectionPicker />
        {resource === 'events' && (
          <Link href="/admin/events" className="text-caption font-medium text-ink-muted underline underline-offset-4 hover:text-ink">
            Sign-up events are in Organise → Events
          </Link>
        )}
      </div>
      <h2 className="sr-only">{labels.title}</h2>
      {canOpen ? (
        <ContentManager resource={resource} />
      ) : (
        <EmptyState
          title="Not available to your role"
          description={`${labels.title} is managed by the house admins. If you need a change here, ask one of them.`}
        />
      )}
    </div>
  );
}
