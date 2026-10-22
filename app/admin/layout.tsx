import React from 'react';
import type { Metadata } from 'next';
import { PortalProviders } from '@/components/portal/layout/PortalProviders';
import { portalFontVars } from '@/lib/portal/fonts';

export const metadata: Metadata = {
  title: 'Admin Suite — Kaziranga Portal',
  description: 'Event and registration administration suite for Kaziranga House council leads.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${portalFontVars} contents`}>
      <PortalProviders>{children}</PortalProviders>
    </div>
  );
}
