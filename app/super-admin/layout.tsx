import React from 'react';
import type { Metadata } from 'next';
import { PortalProviders } from '@/components/portal/layout/PortalProviders';
import { portalFontVars } from '@/lib/portal/fonts';

export const metadata: Metadata = {
  title: 'Super Admin Suite — Kaziranga Portal',
  description: 'Privileged administration suite for Kaziranga House GenSecs and system administrators.',
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${portalFontVars} contents`}>
      <PortalProviders>{children}</PortalProviders>
    </div>
  );
}
