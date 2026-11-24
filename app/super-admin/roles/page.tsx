'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/types/portal';
import { isMockMode, db } from '@/lib/firebase';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { RoleManager } from '@/components/portal/super-admin/RoleManager';
import { SuperAdminNavTabs } from '@/components/portal/super-admin/SuperAdminNavTabs';
import { SectionHeading } from '@/components/portal/ui/Section';

export default function ClassicSuperAdminRolesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }

    setLoading(true);

    const updateActiveUsers = () => {
      if (isMockMode) {
        const allUsers = mockStore.getUsers();
        const allowedEmails = new Set(
          mockStore.getAllowedUsers().map((u) => u.email.trim().toLowerCase()),
        );
        const filtered = allUsers.filter((u) => allowedEmails.has(u.email.trim().toLowerCase()));
        setActiveUsers(filtered);
        setLoading(false);
      }
    };

    if (isMockMode) {
      updateActiveUsers();
      const unsubscribeMock = mockStore.subscribe(() => {
        updateActiveUsers();
      });
      return () => unsubscribeMock();
    } else {
      const unsubscribeUsers = onSnapshot(
        collection(db, 'users'),
        async (userSnap) => {
          try {
            const allowedSnap = await getDocs(collection(db, 'allowedUsers'));
            const allowedEmails = new Set<string>();
            allowedSnap.forEach((d) => allowedEmails.add(d.id.toLowerCase()));

            const list: UserProfile[] = [];
            userSnap.forEach((d) => {
              const u = { uid: d.id, ...d.data() } as UserProfile;
              if (allowedEmails.has(u.email.toLowerCase())) {
                list.push(u);
              }
            });
            setActiveUsers(list);
          } catch (err) {
            console.error('[SuperAdminRolesPage] Error filtering active users:', err);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error('[SuperAdminRolesPage] Firestore users snapshot error:', err);
          setLoading(false);
        },
      );
      return () => unsubscribeUsers();
    }
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="space-y-6">
      <SuperAdminNavTabs />
      <SectionHeading title="Members & roles" size="lg" as="h1" description="Everyone on the access list who has signed in. Change a role from their row." />

      {loading ? (
        <div className="p-8 text-center text-caption text-ink-faint">
          Loading members…
        </div>
      ) : (
        <RoleManager users={activeUsers} />
      )}
    </div>
  );
}
