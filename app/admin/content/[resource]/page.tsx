'use client';

import React from 'react';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SectionHeading } from '@/components/portal/ui/Section';
import { ContentManager } from '@/components/portal/admin/ContentManager';
import { ContentTabs } from '@/components/portal/admin/ContentTabs';
import Link from 'next/link';
import { EmptyState } from '@/components/portal/ui/EmptyState';
import { CONTENT_RESOURCES, writableResources, type ContentResource } from '@/lib/portal/permissions';
import { RESOURCE_LABELS } from '@/lib/portal/contentSchema';

export default function ContentResourcePage() {
  const params = useParams<{ resource: string }>();
  const { user } = useAuth();

  const resource = params?.resource as ContentResource | undefined;
  if (!resource || !(CONTENT_RESOURCES as readonly string[]).includes(resource)) notFound();

  const allowed = writableResources(user?.role);
  const labels = RESOURCE_LABELS[resource];
  const canOpen = allowed.includes(resource);

  return (
    <div>
      <div className="space-y-5">
        <SectionHeading
          title="Website"
          description="What the public site shows. Pick a section, then add, edit or reorder its entries."
          size="lg"
          as="h1"
        />
        <ContentTabs />
        <h2 className="sr-only">{labels.title}</h2>
        {resource === 'events' && (
          <p className="rounded-xl border border-hairline bg-surface-sunken px-4 py-3 text-[0.875rem] text-ink-muted">
            Guest sessions, Curiosity Hour and past results shown on the website. Events members sign up for (like
            Ideathon or Bull Run) are in{' '}
            <Link href="/admin/events" className="font-semibold text-ink underline underline-offset-4">
              Organise → Events
            </Link>
            .
          </p>
        )}
      {canOpen ? (
        <ContentManager resource={resource} />
      ) : (
        <EmptyState
          title="Not available to your role"
          description={`${labels.title} is managed by the house admins. If you need a change here, ask one of them.`}
        />
      )}
      </div>
    </div>
  );
}
