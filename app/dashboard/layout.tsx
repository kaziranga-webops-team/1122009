import React from 'react';
import type { Metadata } from 'next';
import { PortalProviders } from '@/components/portal/layout/PortalProviders';
import { portalFontVars } from '@/lib/portal/fonts';

export const metadata: Metadata = {
  title: 'Dashboard — Kaziranga Portal',
  description: 'Official event management and registration dashboard for Kaziranga House members.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${portalFontVars} contents`}>
      <PortalProviders>{children}</PortalProviders>
    </div>
  );
}
