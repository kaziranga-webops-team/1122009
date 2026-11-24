'use client';
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import type { EventItem, Registration } from '@/types/portal';
import { isMockMode } from '@/lib/firebase';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import { getAllEventsGroupRef, getAllRegistrationsGroupRef } from '@/lib/portal/firebase/paths';
import { canUsePortalAdmin } from '@/lib/portal/permissions';
import { CATEGORIES, categoriesOf, favouriteCategories, isForYou, rankForYou, type Category } from '@/lib/portal/forYou';
import { EventCard } from '@/components/portal/events/EventCard';
import { RegistrationModal } from '@/components/portal/events/RegistrationModal';
import { EventCardSkeleton } from '@/components/portal/ui/Skeleton';
import { SearchInput } from '@/components/portal/ui/SearchInput';
import { EmptyState } from '@/components/portal/ui/EmptyState';

const time = (iso?: string | null) => (iso ? new Date(iso).getTime() : NaN);

/**
 * Every event in one list, in three groups: open for sign-ups (what the
 * member usually joins first), coming up, and past. One tap opens an event.
 */
export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [search, setSearch] = useState('');
  const [pastShown, setPastShown] = useState(6);
  const [toRegister, setToRegister] = useState<EventItem | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isMockMode) {
        setEvents(mockStore.getEvents());
        setRegs(mockStore.getRegistrationsForUser(user.uid));
        return;
      }
      const [evSnap, regSnap] = await Promise.all([
        getDocs(getAllEventsGroupRef()),
        getDocs(query(getAllRegistrationsGroupRef(), where('userId', '==', user.uid))),
      ]);
      const seesDrafts = canUsePortalAdmin(user.role);
      setEvents(
        evSnap.docs
          .filter((d) => d.ref.path.startsWith('tenures/'))
          .map((d) => ({ id: d.id, ...d.data() }) as EventItem)
          .filter((e) => seesDrafts || ['PUBLISHED', 'CLOSED', 'COMPLETED'].includes(e.status))
      );
      setRegs(regSnap.docs.filter((d) => d.ref.path.includes('tenures/')).map((d) => ({ id: d.id, ...d.data() }) as Registration));
    } catch (err) {
      console.error('Events: could not load', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const favourites = useMemo(() => favouriteCategories(regs, events), [regs, events]);
  const registered = useMemo(
    () => new Set(regs.filter((r) => r.status === 'CONFIRMED' || r.status === 'WAITLISTED').map((r) => r.eventId)),
    [regs]
  );

  const groups = useMemo(() => {
    const now = Date.now();
    const q = search.trim().toLowerCase();
    const shown = events.filter(
      (e) =>
        (category === 'All' || categoriesOf(e).includes(category)) &&
        (!q || e.name.toLowerCase().includes(q) || (e.venue || '').toLowerCase().includes(q))
    );
    const ends = (e: EventItem) => time(e.endDateTime) || time(e.startDateTime);
    const open = shown.filter((e) => e.status === 'PUBLISHED' && !(time(e.registrationDeadline) <= now));
    const openIds = new Set(open.map((e) => e.id));
    // Completed events count as past even when they carry no dates.
    const isPast = (e: EventItem) => e.status === 'COMPLETED' || ends(e) < now;
    const upcoming = shown
      .filter((e) => !openIds.has(e.id) && !isPast(e))
      .sort((a, b) => time(a.startDateTime) - time(b.startDateTime));
    const past = shown.filter((e) => !openIds.has(e.id) && isPast(e)).sort((a, b) => (ends(b) || 0) - (ends(a) || 0));
    return { open: rankForYou(open, favourites), upcoming, past };
  }, [events, category, search, favourites]);

  const card = (e: EventItem) => (
    <li key={e.id} className="relative">
      {isForYou(e, favourites) && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-ink px-2.5 py-1 text-[0.6875rem] font-semibold text-surface">For you</span>
      )}
      <EventCard event={e} isRegistered={registered.has(e.id)} onRegisterClick={setToRegister} className="h-full" />
    </li>
  );

  const grid = 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3';
  const nothing = !loading && !groups.open.length && !groups.upcoming.length && !groups.past.length;

  return (
    <div className="space-y-8 pb-12">
      <header className="space-y-1">
        <h1 className="font-display text-title-lg font-extrabold text-ink">Events</h1>
        <p className="text-[0.9375rem] text-ink-muted">
          {favourites.length
            ? `${favourites.slice(0, 2).join(' and ')} events come first, since that is what you sign up for.`
            : 'Everything the house is running. Open events come first.'}
        </p>
      </header>

      {/* ─── Filters: one row of categories and a search ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 no-scrollbar" role="group" aria-label="Category">
          {(['All', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`h-9 shrink-0 rounded-full px-3.5 text-[0.8125rem] font-semibold transition-colors ${
                category === c ? 'bg-ink text-surface' : 'bg-surface-sunken text-ink-muted hover:text-ink'
              }`}
            >
              {c}
              {c !== 'All' && favourites.includes(c) ? ' ★' : ''}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search events…" containerClassName="w-full sm:ml-auto sm:w-64" aria-label="Search events" />
      </div>

      {loading ? (
        <ul className={grid}>
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i}>
              <EventCardSkeleton />
            </li>
          ))}
        </ul>
      ) : nothing ? (
        <EmptyState
          title={search || category !== 'All' ? 'No events match' : 'No events yet'}
          description={search || category !== 'All' ? 'Try another category or word.' : 'New events appear here as soon as they are published.'}
        />
      ) : (
        <>
          {groups.open.length > 0 && (
            <section aria-labelledby="ev-open" className="space-y-4">
              <h2 id="ev-open" className="font-display text-title font-bold text-ink">
                Open for sign-ups <span className="text-ink-faint">· {groups.open.length}</span>
              </h2>
              <ul className={grid}>{groups.open.map(card)}</ul>
            </section>
          )}

          {groups.upcoming.length > 0 && (
            <section aria-labelledby="ev-soon" className="space-y-4">
              <h2 id="ev-soon" className="font-display text-title font-bold text-ink">
                Coming up <span className="text-ink-faint">· {groups.upcoming.length}</span>
              </h2>
              <ul className={grid}>{groups.upcoming.map(card)}</ul>
            </section>
          )}

          {groups.past.length > 0 && (
            <section aria-labelledby="ev-past" className="space-y-4">
              <h2 id="ev-past" className="font-display text-title font-bold text-ink">
                Past events <span className="text-ink-faint">· {groups.past.length}</span>
              </h2>
              <ul className={grid}>{groups.past.slice(0, pastShown).map(card)}</ul>
              {groups.past.length > pastShown && (
                <button
                  type="button"
                  onClick={() => setPastShown((n) => n + 9)}
                  className="h-10 rounded-xl border border-hairline px-4 text-[0.875rem] font-semibold text-ink-muted hover:text-ink"
                >
                  Show more past events
                </button>
              )}
            </section>
          )}
        </>
      )}

      <RegistrationModal event={toRegister} isOpen={!!toRegister} onClose={() => setToRegister(null)} onSuccess={load} />
    </div>
  );
}
