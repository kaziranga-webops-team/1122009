'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuditLog } from '@/types/portal';
import { isMockMode, db } from '@/lib/firebase';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { AuditLogTable } from '@/components/portal/super-admin/AuditLogTable';
import { SuperAdminNavTabs } from '@/components/portal/super-admin/SuperAdminNavTabs';
import { SectionHeading } from '@/components/portal/ui/Section';
import { History } from 'lucide-react';

export default function ClassicSuperAdminAuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    if (isMockMode) {
      setLogs(mockStore.getAuditLogs());
      setLoading(false);
    } else {
      try {
        const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const list: AuditLog[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AuditLog));
        setLogs(list);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }
    fetchLogs();
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <SuperAdminNavTabs />
      <SectionHeading title="Activity log" size="lg" as="h1" description="Every change made by admins, newest first. Entries cannot be edited." />

      {loading ? (
        <div className="p-8 text-center text-caption text-ink-faint">Loading activity…</div>
      ) : (
        <AuditLogTable logs={logs} />
      )}
    </div>
  );
}
