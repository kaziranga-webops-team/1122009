'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { writableResources, type ContentResource } from '@/lib/portal/permissions';
import { RESOURCE_LABELS } from '@/lib/portal/contentSchema';

/** The website's parts, grouped the way the site itself is. */
const GROUPS: { label: string; items: ContentResource[] }[] = [
  { label: 'House', items: ['council_members', 'events', 'meetups', 'gallery_items', 'episodes'] },
  { label: 'Study', items: ['academic_dates', 'revision_sessions', 'study_resources', 'course_channels', 'study_links', 'iitm_links'] },
  { label: 'Site', items: ['site_images', 'site_sections'] },
];

/**
 * Which part of the website to edit: one dropdown instead of a row of a dozen
 * tabs. Only what this role may edit is listed.
 */
export const ContentSectionPicker: React.FC = () => {
  const params = useParams<{ resource: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const allowed = writableResources(user?.role);
  const current = params?.resource ?? '';

  if (allowed.length < 2) return null;

  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-caption font-semibold text-ink-muted">Editing</span>
      <select
        value={current}
        onChange={(e) => router.push(`/admin/content/${e.target.value}`)}
        className="ed-select h-10 min-w-[13rem] rounded-xl border border-hairline bg-surface-raised pl-3.5 text-[0.9375rem] font-semibold text-ink"
      >
        {GROUPS.map((g) => {
          const items = g.items.filter((r) => allowed.includes(r));
          if (!items.length) return null;
          return (
            <optgroup key={g.label} label={g.label}>
              {items.map((r) => (
                <option key={r} value={r}>
                  {RESOURCE_LABELS[r].title}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </label>
  );
};
