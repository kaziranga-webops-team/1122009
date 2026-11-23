import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — Kaziranga Portal',
  description: 'Official event management and registration dashboard for Kaziranga House members.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The portal shell (sidebar, top bar, auth guard, notifications) lives in
  // app/providers.tsx, so it stays mounted while moving between sections.
  return <>{children}</>;
}
