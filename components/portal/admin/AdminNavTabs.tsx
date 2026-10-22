'use client';

import React from 'react';
import { LayoutDashboard, Calendar, ClipboardList, Globe } from 'lucide-react';
import { NavTabs } from '../layout/NavTabs';
import { useAuth } from '@/context/AuthContext';
import { writableResources } from '@/lib/portal/permissions';

/**
 * The admin suite's top-level tabs. "Website" only appears for a role that can
 * actually change something there — an RC sees it (events, their own council
 * row), a plain member never reaches this component at all.
 */
export const AdminNavTabs: React.FC = () => {
  const { user } = useAuth();
  const canEditSite = writableResources(user?.role).length > 0;

  return (
    <NavTabs
      id="admin"
      tabs={[
        { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Events', href: '/admin/events', icon: Calendar },
        { label: 'Registrations', href: '/admin/registrations', icon: ClipboardList },
        ...(canEditSite
          ? [{ label: 'Website', href: '/admin/content/events', icon: Globe }]
          : []),
      ]}
    />
  );
};
