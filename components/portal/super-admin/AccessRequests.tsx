'use client';

import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { Check, X } from 'lucide-react';
import { db, isMockMode } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/portal/ui/Toast';
import { Card } from '@/components/portal/ui/Card';
import { Button } from '@/components/portal/ui/Button';
import { Badge } from '@/components/portal/ui/Badge';

interface Request {
  id: string;
  email: string;
  note?: string;
  attempts?: number;
  studyEmail?: boolean;
  createdAt?: string;
  lastAttemptAt?: string;
}

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

/**
 * Everyone turned away at sign-in, live: approve puts them on the access list
 * (they can sign in at once); reject tells them, the next time they try, that
 * the house did not approve them.
 */
export function AccessRequests({ onApproved }: { onApproved?: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<Request[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (isMockMode) return;
    return onSnapshot(
      query(collection(db, 'accessRequests'), where('status', '==', 'PENDING')),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Request, 'id'>) }));
        list.sort((a, b) => String(b.lastAttemptAt || b.createdAt || '').localeCompare(String(a.lastAttemptAt || a.createdAt || '')));
        setRows(list);
      },
      () => setRows([])
    );
  }, []);

  async function answer(r: Request, approve: boolean) {
    if (!user) return;
    setBusy(r.id);
    const now = new Date().toISOString();
    try {
      if (approve) {
        await setDoc(doc(db, 'allowedUsers', r.email), { email: r.email, importBatchId: 'request', importedAt: now, addedBy: user.uid });
      }
      await updateDoc(doc(db, 'accessRequests', r.id), {
        status: approve ? 'APPROVED' : 'REJECTED',
        read: true,
        answeredAt: now,
        answeredBy: user.email,
      });
      const log = doc(db, 'auditLogs', `log_${Date.now()}`);
      await setDoc(log, {
        id: log.id,
        actorUserId: user.uid,
        actorEmail: user.email,
        action: approve ? 'ACCESS_APPROVED' : 'ACCESS_REJECTED',
        target: r.email,
        timestamp: now,
        metadata: {},
      });
      toast.success(approve ? 'Approved' : 'Rejected', approve ? `${r.email} can sign in now.` : `${r.email} will be told they were not approved.`);
      if (approve) onApproved?.();
    } catch (e) {
      toast.error('Not saved', (e as Error).message || 'Try again.');
    } finally {
      setBusy(null);
    }
  }

  if (!rows.length) return null;

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-[1rem] font-semibold text-ink">
        Waiting for access <span className="text-ink-faint">· {rows.length}</span>
      </h2>
      <p className="mt-0.5 text-[0.8125rem] text-ink-muted">People who tried to sign in and are not on the access list. Newest first.</p>
      <ul className="mt-4 divide-y divide-hairline">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[0.9rem] font-semibold text-ink">
                <span className="break-all">{r.email}</span>
                {r.studyEmail === false && <Badge tone="warn" size="sm">Personal email</Badge>}
              </p>
              <p className="text-[0.8125rem] text-ink-muted">
                {when(r.lastAttemptAt || r.createdAt)}
                {Number(r.attempts) > 1 ? ` · tried ${r.attempts} times` : ''}
                {r.note ? ` · "${r.note}"` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" leftIcon={<Check className="h-4 w-4" />} isLoading={busy === r.id} onClick={() => void answer(r, true)}>
                Approve
              </Button>
              <Button size="sm" variant="outline" leftIcon={<X className="h-4 w-4" />} disabled={busy === r.id} onClick={() => void answer(r, false)}>
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
