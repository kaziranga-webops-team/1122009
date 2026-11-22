'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Calendar,
  ArrowRight,
  ArrowUpRight,
  CalendarX2,
  Trophy,
  Ticket,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  MapPin,
  Clock,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { EventCard } from '@/components/portal/events/EventCard';
import { ResultCard } from '@/components/portal/events/ResultCard';
import { RegistrationModal } from '@/components/portal/events/RegistrationModal';
import { EventCardSkeleton } from '@/components/portal/ui/Skeleton';
import { Card } from '@/components/portal/ui/Card';
import { Badge } from '@/components/portal/ui/Badge';
import { Button } from '@/components/portal/ui/Button';
import { EmptyState } from '@/components/portal/ui/EmptyState';
import { SectionHeading } from '@/components/portal/ui/Section';
import { Stagger, StaggerItem, Reveal } from '@/components/portal/ui/Motion';
import { AnimatedNumber } from '@/components/portal/ui/AnimatedNumber';
import { EventItem, Registration, MainEvent } from '@/types/portal';
import { isMockMode, db } from '@/lib/firebase';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import {
  getAllRegistrationsGroupRef,
  getMainEventsCollectionRef,
  DEFAULT_TENURE_ID,
} from '@/lib/portal/firebase/paths';
import { toEvents, hasResults } from '@/lib/events';
import { type EventRow } from '@/lib/api';

export default function UserDashboard() {
  const { user } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [sheetResults, setSheetResults] = useState<EventItem[]>([]);
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventToRegister, setEventToRegister] = useState<EventItem | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch public events with results from API (Aarohan / House tournaments)
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const rows: EventRow[] = await res.json();
          const publicEvts = toEvents(rows);
          const withResults = publicEvts.filter(hasResults).map(
            (p): EventItem => ({
              id: p.id,
              name: p.title,
              description: p.description || '',
              category: p.category,
              startDateTime: p.date,
              endDateTime: p.date,
              registrationDeadline: p.date,
              venue: p.meetLink ? 'Online Live Stream' : 'IIT Madras & Online',
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
          setSheetResults(withResults);
        }
      } catch (err) {
        // Silent catch for optional public sheet results
      }

      // 2. Fetch portal events & user registrations
      if (isMockMode) {
        setEvents(mockStore.getEvents());
        setMainEvents([
          {
            id: 'communityDayAug26',
            name: 'Community Day',
            tenureId: '2026-2027',
            description: '',
            status: 'PUBLISHED',
            createdAt: '',
            updatedAt: '',
          },
        ]);
        setMyRegistrations(mockStore.getRegistrationsForUser(user.uid));
        setLoading(false);
        return;
      }

      // Real Firebase Mode
      const mainSnap = await getDocs(getMainEventsCollectionRef(DEFAULT_TENURE_ID));
      const mainList: MainEvent[] = [];
      mainSnap.forEach((d) => mainList.push({ id: d.id, ...d.data() } as MainEvent));

      const evList: EventItem[] = [];
      const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

      for (const mainEvent of mainList) {
        const eventsRef = collection(
          db,
          `tenures/${DEFAULT_TENURE_ID}/mainEvents/${mainEvent.id}/events`
        );
        const eventsQuery = isPrivileged
          ? query(eventsRef)
          : query(eventsRef, where('status', 'in', ['PUBLISHED', 'CLOSED', 'COMPLETED']));

        const eventsSnap = await getDocs(eventsQuery);
        eventsSnap.forEach((d) => evList.push({ id: d.id, ...d.data() } as EventItem));
      }

      const regsSnap = await getDocs(
        query(getAllRegistrationsGroupRef(), where('userId', '==', user.uid))
      );
      const regList: Registration[] = [];
      regsSnap.forEach((d) => {
        if (!d.ref.path.includes('tenures/')) return;
        const data = d.data();
        regList.push({
          id: d.id,
          ...data,
          nameSnapshot: data.nameSnapshot || data.name || '',
          emailSnapshot: data.emailSnapshot || data.email || '',
          phoneSnapshot: data.phoneSnapshot || data.phone || '',
          regionSnapshot: data.regionSnapshot || data.region || '',
          levelSnapshot: data.levelSnapshot || data.level || '',
          programmeSnapshot: data.programmeSnapshot || data.programme || '',
        } as Registration);
      });

      evList.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setEvents(evList);
      setMainEvents(mainList);
      setMyRegistrations(regList);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (!user) return null;

  const firstName = user.name.split(' ')[0];
  const registeredEventIds = new Set(
    myRegistrations.filter((r) => r.status === 'CONFIRMED').map((r) => r.eventId)
  );

  // Filter 1: Active events open for registration
  const now = new Date();
  const activeEvents = events.filter((e) => {
    if (e.status !== 'PUBLISHED') return false;
    if (e.registrationDeadline && new Date(e.registrationDeadline) < now) return false;
    return true;
  });

  // Limit to two rows (3 columns x 2 rows = 6 items on desktop)
  const displayedActiveEvents = activeEvents.slice(0, 6);
  const remainingActiveCount = Math.max(0, activeEvents.length - 6);

  // Filter 2: Events conducted recently that have concluded / have results
  const completedPortalEvents = events.filter((e) => {
    const isEnded = e.endDateTime && new Date(e.endDateTime) < now;
    return (
      e.status === 'COMPLETED' ||
      (e.status === 'CLOSED' && isEnded) ||
      Boolean(e.winner || e.runnerUp1)
    );
  });

  // Merge portal completed events with any public tournament results
  const recentResults = useMemo(() => {
    const combined = [...completedPortalEvents];
    const existingTitles = new Set(combined.map((e) => e.name.toLowerCase().trim()));

    sheetResults.forEach((s) => {
      if (!existingTitles.has(s.name.toLowerCase().trim())) {
        combined.push(s);
      }
    });

    return combined;
  }, [completedPortalEvents, sheetResults]);

  return (
    <div className="space-y-10 pb-12">
      {/* ─── Clean Dashboard Top Header (Replaces the big scenic image) ─── */}
      <Card elevation={1} className="p-6 sm:p-7 border border-hairline overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand ring-4 ring-brand/15" />
              <span className="text-micro font-bold uppercase tracking-wider text-brand">
                Kaziranga House • Event Arena
              </span>
            </div>
            <h1 className="font-display font-extrabold text-title-lg text-ink tracking-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-caption text-ink-muted max-w-2xl">
              Register for active house competitions, manage your team participations, and explore recent tournament outcomes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/dashboard/events">
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
              >
                Browse All Events
              </Button>
            </Link>

            <Link href="/dashboard/my-registrations">
              <Button
                variant="outline"
                size="md"
                leftIcon={<Ticket className="w-4 h-4" />}
              >
                My Registrations ({registeredEventIds.size})
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── Compact Stat Bar ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-hairline">
          <div className="p-3 rounded-xl bg-surface-sunken border border-hairline">
            <span className="text-micro uppercase font-bold text-ink-faint block">
              Open to Register
            </span>
            <span className="text-title font-display font-extrabold text-ink block mt-0.5">
              <AnimatedNumber value={activeEvents.length} />
            </span>
            <span className="text-micro text-ink-muted">Accepting entries now</span>
          </div>

          <Link
            href="/dashboard/my-registrations"
            className="p-3 rounded-xl bg-surface-sunken border border-hairline hover:border-hairline-strong transition-colors block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-micro uppercase font-bold text-ink-faint">
                Your Registrations
              </span>
              <ArrowRight className="w-3 h-3 text-ink-faint group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
            </div>
            <span className="text-title font-display font-extrabold text-ink block mt-0.5">
              <AnimatedNumber value={registeredEventIds.size} />
            </span>
            <span className="text-micro text-ink-muted">Confirmed event seats</span>
          </Link>

          <div className="p-3 rounded-xl bg-surface-sunken border border-hairline">
            <span className="text-micro uppercase font-bold text-ink-faint block">
              Results Declared
            </span>
            <span className="text-title font-display font-extrabold text-ink block mt-0.5">
              <AnimatedNumber value={recentResults.length} />
            </span>
            <span className="text-micro text-ink-muted">Podium standings out</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-sunken border border-hairline">
            <span className="text-micro uppercase font-bold text-ink-faint block">
              House Tenure
            </span>
            <span className="text-title font-display font-extrabold text-ink block mt-0.5">
              2026–2027
            </span>
            <span className="text-micro text-ink-muted">IIT Madras BS Rhinos</span>
          </div>
        </div>
      </Card>

      {/* ─── Active Registration Banner (If user has joined events) ─── */}
      {registeredEventIds.size > 0 && (
        <Reveal y={6}>
          <div className="p-4 rounded-xl bg-surface-raised border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 grid place-items-center text-brand shrink-0">
                <Ticket className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-caption font-semibold text-ink truncate">
                  You are registered for {registeredEventIds.size}{' '}
                  {registeredEventIds.size === 1 ? 'competition' : 'competitions'}
                </p>
                <p className="text-micro text-ink-muted">
                  Keep your WhatsApp contact updated so coordinators can add you to event groups.
                </p>
              </div>
            </div>

            <Link href="/dashboard/my-registrations" className="shrink-0">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View My Tickets
              </Button>
            </Link>
          </div>
        </Reveal>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 1: Active Events to Register (Two-Row Grid)       */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span className="text-micro font-bold uppercase tracking-wider text-brand">
                Open Competitions
              </span>
            </div>
            <h2 className="font-display font-extrabold text-title text-ink mt-0.5">
              Active Events to Register
            </h2>
            <p className="text-caption text-ink-muted">
              Explore upcoming hackathons, sports clashes, and cultural showcases open for registration.
            </p>
          </div>

          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-1.5 text-caption font-display font-bold text-brand hover:underline underline-offset-4 shrink-0"
          >
            <span>View all events ({activeEvents.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : activeEvents.length === 0 ? (
          <EmptyState
            icon={<CalendarX2 className="w-8 h-8 text-ink-faint" />}
            title="No events open for registration right now"
            description="All current competition registration windows are closed. New events and festivals will appear here once announced."
            action={
              <Link href="/dashboard/events">
                <Button variant="secondary" size="md">
                  View All Events
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Exactly two rows of cards on desktop (3 columns x 2 rows = 6 items) */}
            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedActiveEvents.map((evt) => (
                <StaggerItem key={evt.id} className="h-full">
                  <EventCard
                    event={evt}
                    isRegistered={registeredEventIds.has(evt.id)}
                    onRegisterClick={setEventToRegister}
                  />
                </StaggerItem>
              ))}
            </Stagger>

            {/* "View More" option if there are additional active events beyond two rows */}
            {remainingActiveCount > 0 && (
              <div className="p-4 rounded-xl bg-surface-raised border border-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="space-y-0.5">
                  <span className="text-caption font-semibold text-ink block">
                    Showing 6 of {activeEvents.length} open competitions
                  </span>
                  <span className="text-micro text-ink-muted block">
                    {remainingActiveCount} more active events are accepting registrations.
                  </span>
                </div>

                <Link href="/dashboard/events">
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    View All {activeEvents.length} Events
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION 2: Recently Conducted Events & Results            */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-signal-warn" />
              <span className="text-micro font-bold uppercase tracking-wider text-signal-warn">
                Tournament Hall of Fame
              </span>
            </div>
            <h2 className="font-display font-extrabold text-title text-ink mt-0.5">
              Recently Conducted &amp; Results Declared
            </h2>
            <p className="text-caption text-ink-muted">
              Concluded tournaments, verified winner podiums, and official standings across Kaziranga House.
            </p>
          </div>

          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-1.5 text-caption font-display font-bold text-ink-muted hover:text-ink transition-colors shrink-0"
          >
            <span>View past archive</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : recentResults.length === 0 ? (
          <Card elevation={1} className="p-8 text-center space-y-3 border border-hairline">
            <Trophy className="w-8 h-8 text-ink-faint mx-auto" />
            <h3 className="font-display font-bold text-body text-ink">
              No recent results declared yet
            </h3>
            <p className="text-caption text-ink-muted max-w-md mx-auto">
              Results and official winner announcements will be posted here as soon as current tournaments and matches conclude.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentResults.slice(0, 6).map((evt) => (
              <ResultCard key={evt.id} event={evt} />
            ))}
          </div>
        )}
      </section>

      {/* Registration Modal for 1-click event entry */}
      <RegistrationModal
        event={eventToRegister}
        isOpen={!!eventToRegister}
        onClose={() => setEventToRegister(null)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
