'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CalendarX2 } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { EventCard } from '@/components/portal/events/EventCard';
import { ResultCard } from '@/components/portal/events/ResultCard';
import { RegistrationModal } from '@/components/portal/events/RegistrationModal';
import { EventCardSkeleton } from '@/components/portal/ui/Skeleton';
import { MemberCard } from '@/components/portal/home/MemberCard';
import { YourRC } from '@/components/portal/home/YourRC';
import { favouriteCategories, isForYou, rankForYou } from '@/lib/portal/forYou';
import { useAnnouncements } from '@/components/portal/home/useAnnouncements';
import { canAnnounce, isForMember } from '@/lib/portal/announcements';
import {
  Announcements,
  BlockHeader,
  Meetups,
  NextUp,
  OrganiserPanel,
  Shortcuts,
  WhereThingsAre,
  organiserStats,
  parseSheetDate,
  shortcutsFor,
  type MeetupCardData,
} from '@/components/portal/home/HomeBlocks';
import { EventItem, Registration, MainEvent } from '@/types/portal';
import { isMockMode, db } from '@/lib/firebase';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import {
  getAllRegistrationsGroupRef,
  getMainEventsCollectionRef,
  DEFAULT_TENURE_ID,
} from '@/lib/portal/firebase/paths';
import { organiserEventsQuery } from '@/lib/portal/organiser';
import { canOrganiseEvents, canUsePortalAdmin } from '@/lib/portal/permissions';
import { toRegion } from '@/lib/portal/regions';
import { communityBySlug } from '@/lib/communities';
import { toEvents, hasResults } from '@/lib/events';
import { toDirectImageUrl, type EventRow, type MeetupRow } from '@/lib/api';

/** Public results from the house sheet, shaped like portal events. */
function sheetResultsToEvents(rows: EventRow[]): EventItem[] {
  return toEvents(rows)
    .filter(hasResults)
    .map(
      (p): EventItem => ({
        id: p.id,
        name: p.title,
        description: p.description || '',
        category: p.category,
        startDateTime: p.date,
        endDateTime: p.date,
        registrationDeadline: p.date,
        venue: p.meetLink ? 'Online' : 'IIT Madras & Online',
        registrationType: 'INDIVIDUAL',
        maximumParticipants: null,
        maximumTeamSize: null,
        rulebookUrl: null,
        coverImageUrl: p.imageUrl || null,
        status: 'COMPLETED',
        createdBy: 'house_sheets',
        createdAt: p.date,
        updatedAt: p.date,
        winner: p.winner,
        runnerUp1: p.runnerUp1,
        runnerUp2: p.runnerUp2,
        honourableMentions: p.honourableMentions,
      })
    );
}

export default function HomePage() {
  const { user } = useAuth();
  const { items: allAnnouncements } = useAnnouncements(20);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [managed, setManaged] = useState<EventItem[]>([]);
  const [sheetResults, setSheetResults] = useState<EventItem[]>([]);
  const [meetupRows, setMeetupRows] = useState<MeetupRow[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventToRegister, setEventToRegister] = useState<EventItem | null>(null);

  const role = user?.role;
  const organiser = canOrganiseEvents(role);

  // Public data: results from the house sheet and the meetup list. Neither
  // blocks the page; each section simply stays hidden until it has rows.
  useEffect(() => {
    let live = true;
    fetch('/api/events')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: EventRow[]) => live && setSheetResults(sheetResultsToEvents(rows)))
      .catch(() => {});
    fetch('/api/meetups')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: MeetupRow[]) => live && setMeetupRows(Array.isArray(rows) ? rows : []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const fetchPortalData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isMockMode) {
        const all = mockStore.getEvents();
        setEvents(all);
        setManaged(organiser ? all : []);
        setMyRegistrations(mockStore.getRegistrationsForUser(user.uid));
        return;
      }

      const mainSnap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
      const mainList: MainEvent[] = [];
      mainSnap.forEach((d) => mainList.push({ id: d.id, ...d.data() } as MainEvent));

      // Members see what is published; the house's event managers see drafts too.
      const seesDrafts = canUsePortalAdmin(user.role);
      const evList: EventItem[] = [];
      await Promise.all(
        mainList.map(async (m) => {
          const ref = collection(db, `tenures/${DEFAULT_TENURE_ID}/mainEvents/${m.id}/events`);
          const q = seesDrafts ? query(ref) : query(ref, where('status', 'in', ['PUBLISHED', 'CLOSED', 'COMPLETED']));
          const snap = await getDocs(q);
          snap.forEach((d) => evList.push({ id: d.id, ...d.data() } as EventItem));
        })
      );
      evList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEvents(evList);

      // A community head's own events, drafts included, for their summary.
      if (organiser && !seesDrafts) {
        const q = organiserEventsQuery(user);
        const snap = q ? await getDocs(q) : null;
        const mine: EventItem[] = [];
        snap?.forEach((d) => mine.push({ id: d.id, ...d.data() } as EventItem));
        setManaged(mine);
      } else {
        setManaged(organiser ? evList : []);
      }

      const regsSnap = await getDocs(query(getAllRegistrationsGroupRef(), where('userId', '==', user.uid)));
      const regs: Registration[] = [];
      regsSnap.forEach((d) => {
        if (d.ref.path.includes('tenures/')) regs.push({ id: d.id, ...d.data() } as Registration);
      });
      setMyRegistrations(regs);
    } catch (err) {
      console.error('Home: could not load events', err);
    } finally {
      setLoading(false);
    }
  }, [user, organiser]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  const now = Date.now();

  const openEvents = useMemo(
    () =>
      events.filter(
        (e) => e.status === 'PUBLISHED' && (!e.registrationDeadline || new Date(e.registrationDeadline).getTime() > now)
      ),
    // `now` moves every render; the list only needs to follow the events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events]
  );

  // What this member has signed up for before decides what comes first.
  const favourites = useMemo(() => favouriteCategories(myRegistrations, events), [myRegistrations, events]);
  const forYou = useMemo(() => rankForYou(openEvents, favourites), [openEvents, favourites]);

  const registeredIds = useMemo(
    () => new Set(myRegistrations.filter((r) => r.status === 'CONFIRMED' || r.status === 'WAITLISTED').map((r) => r.eventId)),
    [myRegistrations]
  );

  const nextUp = useMemo(() => {
    const upcoming = events
      .filter((e) => registeredIds.has(e.id) && new Date(e.endDateTime || e.startDateTime).getTime() > Date.now())
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    return upcoming[0] ?? null;
  }, [events, registeredIds]);

  const results = useMemo(() => {
    const done = events.filter((e) => e.status === 'COMPLETED' || Boolean(e.winner || e.runnerUp1));
    const seen = new Set(done.map((e) => e.name.toLowerCase().trim()));
    return [...done, ...sheetResults.filter((s) => !seen.has(s.name.toLowerCase().trim()))].slice(0, 3);
  }, [events, sheetResults]);

  // Pinned first (the hook sorts them), then the newest; region posts only
  // for members of that region.
  const announcements = useMemo(
    () => allAnnouncements.filter((a) => isForMember(a, user?.region)).slice(0, 4),
    [allAnnouncements, user?.region]
  );

  const region = toRegion(user?.region);

  const meetups = useMemo(() => {
    const cards: (MeetupCardData & { region: string })[] = [];
    meetupRows.forEach((r, i) => {
      const time = parseSheetDate(r.Date);
      if (time === null || !r.Venue?.trim()) return;
      cards.push({
        key: `${r.Date}-${r.Venue}-${i}`,
        venue: r.Venue.trim(),
        date: r.Date,
        time,
        region: toRegion(r.Region),
        poster: r.Poster ? toDirectImageUrl(r.Poster) : undefined,
        instagram: r['Instagram Post']?.trim() || undefined,
      });
    });
    cards.sort((a, b) => b.time - a.time);
    const local = region && region !== 'Other' ? cards.filter((c) => c.region === region) : [];
    return local.length
      ? { title: `Meetups in ${region}`, items: local.slice(0, 3) }
      : { title: 'Recent meetups', items: cards.slice(0, 3) };
  }, [meetupRows, region]);

  if (!user) return null;

  const firstName = user.name?.trim().split(/\s+/)[0] || 'there';
  const scopeLabel =
    user.role === 'COMMUNITY_HEAD'
      ? `${(user.communitySlugs ?? []).map((s) => communityBySlug(s)?.name).filter(Boolean).join(', ') || 'Your community'} events`
      : 'House events';

  return (
    <div className="space-y-9 pb-12">
      <h1 className="font-display font-extrabold text-title-lg text-ink">Welcome back, {firstName}</h1>

      {/* ─── Who you are, and what's next ─── */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-stretch">
        <MemberCard user={user} role={user.role} />
        <NextUp next={nextUp} openCount={openEvents.length} loading={loading} />
      </div>

      <Shortcuts items={shortcutsFor(user.role)} />
      <YourRC region={user.region} />

      {/* ─── Open for registration ─── */}
      <section aria-label="Open for registration">
        <BlockHeader
          title={favourites.length ? 'Picked for you' : 'Open for registration'}
          href="/dashboard/events"
          linkLabel={openEvents.length > 3 ? `All ${openEvents.length}` : 'All events'}
        />
        {favourites.length > 0 && openEvents.length > 0 && (
          <p className="-mt-2 mb-4 text-[0.875rem] text-ink-muted">
            {forYou.some((e) => isForYou(e, favourites))
              ? `${favourites.slice(0, 2).join(' and ')} events first, since that is what you sign up for.`
              : `Nothing in ${favourites.slice(0, 2).join(' or ')} is open right now. Here is everything else.`}
          </p>
        )}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : openEvents.length === 0 ? (
          <div className="flex items-center gap-3 rounded-[18px] border border-dashed border-hairline-strong p-5 text-[0.875rem] text-ink-muted">
            <CalendarX2 className="w-5 h-5 shrink-0" aria-hidden />
            No events are open for registration right now.
          </div>
        ) : (
          <ul className="flex lg:grid lg:grid-cols-3 gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-1 px-1 pb-1">
            {forYou.slice(0, 6).map((evt) => (
              <li key={evt.id} className="snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-auto">
                <EventCard event={evt} isRegistered={registeredIds.has(evt.id)} onRegisterClick={setEventToRegister} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {organiser && <OrganiserPanel stats={organiserStats(managed)} scopeLabel={scopeLabel} loading={loading} />}

      {announcements.length > 0 && (
        <Announcements items={announcements} manageHref={canAnnounce(user) ? '/admin/announcements' : undefined} />
      )}

      {meetups.items.length > 0 && <Meetups title={meetups.title} items={meetups.items} />}

      {results.length > 0 && (
        <section aria-label="Latest results">
          <BlockHeader title="Latest results" href="/events" />
          <ul className="flex lg:grid lg:grid-cols-3 gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-1 px-1 pb-1">
            {results.map((evt) => (
              <li key={evt.id} className="snap-start shrink-0 w-[85%] sm:w-[48%] lg:w-auto">
                <ResultCard event={evt} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <WhereThingsAre role={user.role} />

      <RegistrationModal
        event={eventToRegister}
        isOpen={!!eventToRegister}
        onClose={() => setEventToRegister(null)}
        onSuccess={fetchPortalData}
      />
    </div>
  );
}
