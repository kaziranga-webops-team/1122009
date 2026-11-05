'use client';

import React from 'react';
import { TenureProvider } from '@/context/TenureContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { RouteGuard } from '@/components/portal/layout/RouteGuard';
import { AppShell } from '@/components/portal/layout/AppShell';

export function PortalProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TenureProvider>
        <NotificationProvider>
          <RouteGuard>
            <AppShell>
              {children}
            </AppShell>
          </RouteGuard>
        </NotificationProvider>
      </TenureProvider>
    </>
  );
}
