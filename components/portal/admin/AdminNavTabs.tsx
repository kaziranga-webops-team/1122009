'use client';

import React from 'react';
import { NavTabs } from '../layout/NavTabs';
import { useAuth } from '@/context/AuthContext';
import { organiseItems } from '../layout/navConfig';

/** The Organise screens, as tabs: the same list, in the same order, as the sidebar. */
export const AdminNavTabs: React.FC = () => {
  const { user } = useAuth();
  return <NavTabs id="organise" tabs={organiseItems(user?.role)} />;
};
