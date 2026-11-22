'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getDocs, query, updateDoc, where } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isMockMode } from '@/lib/firebase';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import { getEventRef, DEFAULT_TENURE_ID, DEFAULT_MAIN_EVENT_ID } from '@/lib/portal/firebase/paths';
import { organiserEventsQuery } from '@/lib/portal/organiser';
import { canOrganiseEvents } from '@/lib/portal/permissions';
import { sendNotice } from '@/lib/portal/portalApi';
import { Card } from '@/components/portal/ui/Card';
import { Button } from '@/components/portal/ui/Button';
import { useToast } from '@/components/portal/ui/Toast';
import type { EventItem } from '@/types/portal';

const MAX = 120;

/**
 * Publish an event's results: the podium, honourable mentions and, by default,
 * marking the event completed. The first publish tells the house.
 */
export default function EventResultsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [winner, setWinner] = useState('');
  const [runnerUp1, setRunnerUp1] = useState('');
  const [runnerUp2, setRunnerUp2] = useState('');
  const [mentions, setMentions] = useState('');
  const [complete, setComplete] = useState(true);

  useEffect(() => {
    if (!user || !canOrganiseEvents(user.role)) return;
    const load = async () => {
      setLoading(true);
      try {
        let found: EventItem | null = null;
        if (isMockMode) {
          found = mockStore.getEventById(eventId) || null;
        } else {
          const scoped = organiserEventsQuery(user);
          if (scoped) {
            const q = user.role === 'COMMUNITY_HEAD' ? scoped : query(scoped, where('id', '==', eventId));
            const snap = await getDocs(q);
            const match = snap.docs.find((d) => d.id === eventId || d.data().id === eventId);
            if (match) found = { id: match.id, ...match.data() } as EventItem;
          }
        }
        setEvent(found);
        if (found) {
          setWinner(found.winner || '');
          setRunnerUp1(found.runnerUp1 || '');
          setRunnerUp2(found.runnerUp2 || '');
          setMentions(found.honourableMentions || '');
          setComplete(found.status !== 'DRAFT');
        }
      } catch (err) {
        console.error('Results: could not load event', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId, user]);

  if (!user || !canOrganiseEvents(user.role)) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (!winner.trim()) {
      toast.error('Add a winner', 'Results need at least a winner.');
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const firstPublish = !event.resultsPublishedAt;
    const update: Partial<EventItem> = {
      winner: winner.trim(),
      runnerUp1: runnerUp1.trim(),
      runnerUp2: runnerUp2.trim(),
      honourableMentions: mentions.trim(),
      resultsPublishedAt: event.resultsPublishedAt || now,
      updatedAt: now,
      ...(complete ? { status: 'COMPLETED' as const } : {}),
    };
    try {
      if (isMockMode) {
        mockStore.updateEvent(event.id, update, user);
      } else {
        const path = {
          tenureId: event.tenureId || DEFAULT_TENURE_ID,
          mainEventId: event.mainEventId || DEFAULT_MAIN_EVENT_ID,
          eventId: event.id,
        };
        await updateDoc(getEventRef(path.tenureId, path.mainEventId, path.eventId), update);
        if (firstPublish) await sendNotice({ kind: 'RESULTS_PUBLISHED', event: path });
      }
      toast.success(firstPublish ? 'Results published' : 'Results updated', event.name);
      router.push('/admin/events');
    } catch (err) {
      console.error('Results: save failed', err);
      toast.error('Not saved', 'The results were not saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const input = (id: string, label: string, value: string, set: (v: string) => void, required = false) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[0.8125rem] font-medium text-ink">
        {label}
        {!required && <span className="font-normal text-ink-faint"> (optional)</span>}
      </label>
      <input id={id} value={value} onChange={(e) => set(e.target.value)} maxLength={MAX} required={required} className="ed-field" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/events" aria-label="Back to events" className="p-2 rounded-xl hover:bg-surface-sunken">
          <ArrowLeft className="w-5 h-5 text-ink-muted" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[1.375rem] font-extrabold text-ink">Results</h1>
          {event && <p className="text-[0.875rem] text-ink-muted truncate">{event.name}</p>}
        </div>
      </div>

      {loading ? (
        <p className="text-[0.875rem] text-ink-faint">Loading…</p>
      ) : !event ? (
        <p className="text-[0.875rem] text-ink-muted">This event was not found, or it is not one you organise.</p>
      ) : (
        <Card elevation={1} className="p-5 sm:p-6">
          <form onSubmit={save} className="space-y-4">
            {input('res-winner', 'Winner', winner, setWinner, true)}
            <div className="grid gap-4 sm:grid-cols-2">
              {input('res-ru1', 'First runner-up', runnerUp1, setRunnerUp1)}
              {input('res-ru2', 'Second runner-up', runnerUp2, setRunnerUp2)}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="res-hm" className="block text-[0.8125rem] font-medium text-ink">
                Honourable mentions <span className="font-normal text-ink-faint">(optional, comma-separated)</span>
              </label>
              <textarea id="res-hm" rows={3} maxLength={600} value={mentions} onChange={(e) => setMentions(e.target.value)} className="ed-field" />
            </div>
            <label className="flex items-center gap-2 text-[0.8125rem] text-ink">
              <input type="checkbox" checked={complete} onChange={(e) => setComplete(e.target.checked)} />
              Mark the event as completed
            </label>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" variant="primary" isLoading={saving}>
                {event.resultsPublishedAt ? 'Update results' : 'Publish results'}
              </Button>
              {!event.resultsPublishedAt && (
                <span className="text-[0.8125rem] text-ink-muted">Publishing tells everyone in the house.</span>
              )}
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
