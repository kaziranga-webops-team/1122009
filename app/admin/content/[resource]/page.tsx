'use client';

import React from 'react';
import { notFound, useParams } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { HouseHeader } from '@/components/portal/branding/HouseHeader';
import { ContentManager } from '@/components/portal/admin/ContentManager';
import { AdminNavTabs } from '@/components/portal/admin/AdminNavTabs';
import { ContentTabs } from '@/components/portal/admin/ContentTabs';
import { Badge } from '@/components/portal/ui/Badge';
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
    <div className="space-y-8">
      <HouseHeader
        badge="Website content"
        title={labels.title}
        subtitle={
          user?.role === 'RC'
            ? 'Events are yours to run. On the council list you can edit your own entry.'
            : 'Everything here is live on the public website the moment you save it.'
        }
        actions={
          <Badge tone="brand" size="md">
            <Globe className="w-3.5 h-3.5" /> Public content
          </Badge>
        }
      />

      <AdminNavTabs />

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
  );
}
