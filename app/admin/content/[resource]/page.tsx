'use client';

import React from 'react';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SectionHeading } from '@/components/portal/ui/Section';
import { ContentManager } from '@/components/portal/admin/ContentManager';
import { AdminNavTabs } from '@/components/portal/admin/AdminNavTabs';
import { ContentTabs } from '@/components/portal/admin/ContentTabs';
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
      <AdminNavTabs />

      <div className="space-y-5">
        <SectionHeading title={labels.title} size="lg" as="h1" />
        <ContentTabs />
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
