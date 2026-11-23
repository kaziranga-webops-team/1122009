import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Suite — Kaziranga Portal',
  description: 'Event and registration administration suite for Kaziranga House council leads.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // The portal shell (sidebar, top bar, auth guard, notifications) lives in
  // app/providers.tsx, so it stays mounted while moving between sections.
  return <>{children}</>;
}
