'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { ArrowRight, Globe, Megaphone, UserCog, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isMockMode, db } from '@/lib/firebase';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import type { AuditLog, UserProfile } from '@/types/portal';
import { Card } from '@/components/portal/ui/Card';
import { SectionHeading } from '@/components/portal/ui/Section';
import { RowSkeleton } from '@/components/portal/ui/Skeleton';
import { SuperAdminNavTabs } from '@/components/portal/super-admin/SuperAdminNavTabs';
import { TenureManager } from '@/components/portal/super-admin/TenureManager';

interface AccessRequest {
  id: string;
  email: string;
  note?: string;
  createdAt?: string;
}

const ACTIONS = [
  { label: 'Add someone to the access list', href: '/super-admin/allowed-users', icon: UserPlus },
  { label: "Change someone's role", href: '/super-admin/roles', icon: UserCog },
  { label: 'Edit the website', href: '/admin/content/meetups', icon: Globe },
  { label: 'Post an announcement', href: '/admin/announcements', icon: Megaphone },
];

const ago = (iso?: string) => {
  const t = iso ? new Date(iso).getTime() : NaN;
  if (!Number.isFinite(t)) return '';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 60) return `${Math.max(m, 1)} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(t));
};

/** "ROLE_CHANGED" → "Role changed". */
const readable = (action: string) => {
  const s = action.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * The super admin's start page: what is waiting for them first, the things
 * they do most one tap away, then the house in numbers and the latest changes.
 */
export default function HouseOverviewPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [allowedCount, setAllowedCount] = useState(0);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        if (isMockMode) {
          setMembers(mockStore.getUsers());
          setAllowedCount(mockStore.getAllowedUsers().length);
          setLogs(mockStore.getAuditLogs().slice(0, 6));
          return;
        }
        const [reqSnap, userSnap, allowedSnap, logSnap] = await Promise.all([
          getDocs(query(collection(db, 'accessRequests'), where('status', '==', 'PENDING'))),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'allowedUsers')),
          getDocs(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(6))),
        ]);
        setRequests(
          reqSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<AccessRequest, 'id'>) }))
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        );
        setMembers(userSnap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile));
        setAllowedCount(allowedSnap.size);
        setLogs(logSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog));
      } catch (err) {
        console.error('House overview: could not load', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const count = (role: UserProfile['role']) => members.filter((m) => m.role === role && !m.isAccessRevoked).length;
  const numbers = [
    { label: 'On the access list', value: allowedCount, href: '/super-admin/allowed-users' },
    { label: 'Members signed up', value: members.filter((m) => !m.isAccessRevoked).length, href: '/super-admin/roles' },
    { label: 'RCs', value: count('RC'), href: '/super-admin/roles' },
    { label: 'Community heads', value: count('COMMUNITY_HEAD'), href: '/super-admin/roles' },
    { label: 'Admins', value: count('ADMIN') + count('SUPER_ADMIN'), href: '/super-admin/roles' },
  ];

  return (
    <div>
      <SuperAdminNavTabs />

      <div className="space-y-8">
        <SectionHeading title="House overview" size="lg" as="h1" />

        {/* ─── Needs you ─── */}
        <section aria-labelledby="needs-you">
          <h2 id="needs-you" className="mb-3 text-[1.0625rem] font-semibold text-ink">
            Needs you
            {requests.length > 0 && (
              <span className="ml-2 rounded-full bg-signal-warn/15 px-2 py-0.5 text-[0.8125rem] font-semibold text-signal-warn">
                {requests.length}
              </span>
            )}
          </h2>
          <Card elevation={1}>
            {loading ? (
              <div className="p-4">
                <RowSkeleton />
              </div>
            ) : requests.length === 0 ? (
              <p className="px-5 py-4 text-[0.9375rem] text-ink-muted">Nothing waiting. No one has asked for access.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {requests.map((r) => (
                  <li key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[0.9rem] text-ink">{r.email}</p>
                      <p className="text-[0.8125rem] text-ink-muted">
                        Asked for access {ago(r.createdAt)}
                        {r.note ? ` · “${r.note}”` : ''}
                      </p>
                    </div>
                    <Link
                      href={`/super-admin/allowed-users?email=${encodeURIComponent(r.email)}`}
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-[0.875rem] font-semibold text-brand-contrast"
                    >
                      <UserPlus className="h-4 w-4" aria-hidden /> Add to access list
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* ─── Quick actions ─── */}
        <section aria-label="Quick actions">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ACTIONS.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="group flex min-h-14 items-center gap-3 rounded-2xl border border-hairline bg-surface-raised px-4 py-3 shadow-e-1 transition-colors hover:border-hairline-strong"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-sunken text-ink">
                    <a.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="flex-1 text-[0.9375rem] font-semibold text-ink">{a.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ─── The house in numbers ─── */}
        <section aria-labelledby="numbers">
          <h2 id="numbers" className="mb-3 text-[1.0625rem] font-semibold text-ink">
            The house in numbers
          </h2>
          <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-hairline bg-surface-raised shadow-e-1 sm:grid-cols-3 lg:grid-cols-5">
            {numbers.map((n) => (
              <Link key={n.label} href={n.href} className="border-b border-r border-hairline p-4 transition-colors hover:bg-surface-sunken/60">
                <dt className="text-[0.8125rem] text-ink-muted">{n.label}</dt>
                <dd className="mt-1 font-display text-[1.5rem] font-extrabold text-ink nums">{loading ? '–' : n.value}</dd>
              </Link>
            ))}
          </dl>
        </section>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* ─── Latest changes ─── */}
          <section aria-labelledby="latest">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="latest" className="text-[1.0625rem] font-semibold text-ink">
                Latest changes
              </h2>
              <Link href="/super-admin/audit-logs" className="text-[0.875rem] font-semibold text-brand hover:underline">
                Activity log
              </Link>
            </div>
            <Card elevation={1}>
              {loading ? (
                <div className="p-4">
                  <RowSkeleton />
                </div>
              ) : logs.length === 0 ? (
                <p className="px-5 py-4 text-[0.9375rem] text-ink-muted">No changes recorded yet.</p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {logs.map((log) => (
                    <li key={log.id} className="flex items-start justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-[0.9375rem] font-medium text-ink">{readable(log.action)}</p>
                        <p className="truncate text-[0.8125rem] text-ink-muted">
                          {log.target ? `${log.target} · ` : ''}
                          {log.actorEmail}
                        </p>
                      </div>
                      <time className="shrink-0 text-[0.8125rem] text-ink-faint nums">{ago(log.timestamp)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          {/* ─── Tenure ─── */}
          <section aria-label="Tenure">
            <TenureManager />
          </section>
        </div>
      </div>
    </div>
  );
}
