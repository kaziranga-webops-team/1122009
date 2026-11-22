'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { query, where, getDocs } from 'firebase/firestore';
import { ArrowRight, Check, LogOut, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/portal/ui/Toast';
import { userProfileSchema } from '@/lib/portal/validation/schemas';
import type { EventItem, Registration } from '@/types/portal';
import { isMockMode } from '@/lib/firebase';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import { getAllEventsGroupRef, getAllRegistrationsGroupRef, DEFAULT_MAIN_EVENT_ID } from '@/lib/portal/firebase/paths';
import { Button } from '@/components/portal/ui/Button';
import { ConfirmModal } from '@/components/portal/ui/ConfirmModal';
import { RegionArt, REGION_THEMES } from '@/components/portal/home/RegionArt';
import { rollNumberOf } from '@/components/portal/home/MemberCard';
import { REGIONS, toRegion } from '@/lib/portal/regions';
import { ROLE_LABELS } from '@/lib/portal/permissions';
import { communityBySlug } from '@/lib/communities';

const LEVELS = ['Foundation', 'Diploma', 'Degree'];
const PROGRAMMES = [
  'Data Science & Applications',
  'Diploma in Programming',
  'Diploma in Data Science',
  'Electronic Systems',
  'Management and Data Science',
  'Aeronautics and Space Technology',
];

/** The saved value first, if it is not one of the usual options. */
const withCurrent = (list: string[], ...current: string[]) =>
  Array.from(new Set([...list, ...current.filter(Boolean)]));

const STATUS: Record<Registration['status'], { label: string; tone: string }> = {
  CONFIRMED: { label: 'Confirmed', tone: 'bg-signal-live/12 text-signal-live' },
  WAITLISTED: { label: 'Waitlisted', tone: 'bg-signal-warn/15 text-signal-warn' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-ink/[0.06] text-ink-muted' },
};

const dayFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const when = (iso?: string) => {
  const t = iso ? new Date(iso) : null;
  return t && Number.isFinite(t.getTime()) ? dayFmt.format(t) : '';
};

/**
 * Your profile: your region's poster as the cover, who you are on it, the
 * four details that fill in event sign-ups for you, the events you joined,
 * and your account. Nothing else.
 */
export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const toast = useToast();

  const [phone, setPhone] = useState(user?.phone || '');
  const [region, setRegion] = useState(user?.region || '');
  const [level, setLevel] = useState(user?.level || '');
  const [programme, setProgramme] = useState(user?.programme || '');
  const [saving, setSaving] = useState(false);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Record<string, EventItem>>({});
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Follow the saved profile when it changes elsewhere.
  useEffect(() => {
    if (!user) return;
    setPhone(user.phone || '');
    setRegion(user.region || '');
    setLevel(user.level || '');
    setProgramme(user.programme || '');
  }, [user?.phone, user?.region, user?.level, user?.programme]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.uid) return;
    let alive = true;
    (async () => {
      setLoadingRegs(true);
      try {
        if (isMockMode) {
          const map: Record<string, EventItem> = {};
          mockStore.getEvents().forEach((e) => (map[e.id] = e));
          if (alive) {
            setRegistrations(mockStore.getRegistrationsForUser(user.uid));
            setEvents(map);
          }
          return;
        }
        // Members may read published events only, so ask for just those.
        const [regSnap, evSnap] = await Promise.all([
          getDocs(query(getAllRegistrationsGroupRef(), where('userId', '==', user.uid))),
          getDocs(query(getAllEventsGroupRef(), where('status', 'in', ['PUBLISHED', 'CLOSED', 'COMPLETED']))),
        ]);
        const regs: Registration[] = [];
        regSnap.forEach((d) => {
          if (d.ref.path.includes('tenures/')) regs.push({ id: d.id, ...d.data() } as Registration);
        });
        regs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        const map: Record<string, EventItem> = {};
        evSnap.forEach((d) => (map[d.id] = { id: d.id, ...d.data() } as EventItem));
        if (alive) {
          setRegistrations(regs);
          setEvents(map);
        }
      } catch (err) {
        console.error('Profile: could not load your events', err);
      } finally {
        if (alive) setLoadingRegs(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.uid]);

  const filled = useMemo(
    () => [phone.trim().length >= 10, Boolean(region), Boolean(level), Boolean(programme)].filter(Boolean).length,
    [phone, region, level, programme]
  );

  if (!user) return null;

  const changed =
    phone !== (user.phone || '') ||
    region !== (user.region || '') ||
    level !== (user.level || '') ||
    programme !== (user.programme || '');

  const art = toRegion(user.region) || 'Other';
  const regionName = toRegion(user.region);
  const roll = rollNumberOf(user.email);
  const communities = (user.communitySlugs ?? []).map((s) => communityBySlug(s)?.name).filter(Boolean).join(', ');
  const firstName = user.name?.trim().split(/\s+/)[0] || 'there';

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(userProfileSchema.parse({ phone, region, level, programme }));
      toast.success('Details saved', 'Event sign-ups will use them.');
    } catch (err: any) {
      toast.error('Not saved', err?.errors?.[0]?.message || err?.message || 'Check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  const undo = () => {
    setPhone(user.phone || '');
    setRegion(user.region || '');
    setLevel(user.level || '');
    setProgramme(user.programme || '');
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
      setConfirmSignOut(false);
    }
  };

  const active = registrations.filter((r) => r.status !== 'CANCELLED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── The cover: your region's poster ─── */}
      <section aria-label="Your profile" className="overflow-hidden rounded-[22px] border border-hairline bg-surface-raised shadow-e-1">
        <div className="relative h-40 sm:h-52 lg:h-60">
          <RegionArt region={art} sizes="(min-width: 1024px) 1100px, 100vw" className="absolute inset-0 h-full w-full" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
          <span
            className="absolute right-4 top-3 rounded-full bg-black/35 px-3 py-1 text-[0.8125rem] font-semibold text-white backdrop-blur-sm sm:right-5 sm:top-4"
          >
            {regionName ? `${regionName} region` : 'Add your city below'}
          </span>
        </div>

        <div className="relative px-5 pb-5 sm:px-7 sm:pb-6">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-24 w-24 shrink-0 rounded-2xl border-4 border-surface-raised object-cover shadow-e-2 sm:h-28 sm:w-28"
                />
              ) : (
                <span
                  className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border-4 border-surface-raised font-display text-[2.5rem] font-extrabold text-white shadow-e-2 sm:h-28 sm:w-28"
                  style={{ background: REGION_THEMES[art].accent }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 pb-1">
                <h1 className="clamp-2 break-words font-display text-[1.5rem] font-extrabold leading-tight text-ink sm:truncate sm:text-[1.9rem]">{user.name}</h1>
                <p className="truncate text-[0.9375rem] text-ink-muted">
                  {ROLE_LABELS[user.role] ?? 'Member'}
                  {communities ? ` · ${communities}` : ''}
                </p>
              </div>
            </div>
            {roll && (
              <p className="shrink-0 text-[0.875rem] text-ink-muted sm:pb-1.5">
                Roll no. <span className="font-mono font-semibold text-ink">{roll}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* ─── Your details ─── */}
        <section aria-labelledby="details" className="rounded-[22px] border border-hairline bg-surface-raised p-5 shadow-e-1 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="details" className="text-[1.0625rem] font-semibold text-ink">
              Your details
            </h2>
            <span className={`text-[0.875rem] ${filled === 4 ? 'text-signal-live' : 'text-ink-muted'}`}>
              {filled === 4 ? (
                <span className="inline-flex items-center gap-1">
                  <Check className="h-4 w-4" aria-hidden /> All set
                </span>
              ) : (
                `${filled} of 4 filled`
              )}
            </span>
          </div>
          <p className="mt-1 text-[0.875rem] text-ink-muted">Event sign-up forms fill these in for you, {firstName}.</p>
          {filled < 4 && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden>
              <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${(filled / 4) * 100}%` }} />
            </div>
          )}

          <form onSubmit={save} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="pf-phone" className="block text-[0.875rem] font-medium text-ink">
                WhatsApp number
              </label>
              <input
                id="pf-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="ed-field"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pf-region" className="block text-[0.875rem] font-medium text-ink">
                Region
              </label>
              <select id="pf-region" value={region} onChange={(e) => setRegion(e.target.value)} className="ed-field ed-select">
                <option value="">Choose your city</option>
                {withCurrent([...REGIONS], user.region || '', region).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pf-level" className="block text-[0.875rem] font-medium text-ink">
                Level
              </label>
              <select id="pf-level" value={level} onChange={(e) => setLevel(e.target.value)} className="ed-field ed-select">
                <option value="">Choose your level</option>
                {withCurrent(LEVELS, user.level || '', level).map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pf-programme" className="block text-[0.875rem] font-medium text-ink">
                Programme
              </label>
              <select id="pf-programme" value={programme} onChange={(e) => setProgramme(e.target.value)} className="ed-field ed-select">
                <option value="">Choose your programme</option>
                {withCurrent(PROGRAMMES, user.programme || '', programme).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 sm:col-span-2">
              <Button type="submit" variant="primary" isLoading={saving} disabled={!changed}>
                Save details
              </Button>
              {changed && (
                <Button type="button" variant="ghost" onClick={undo}>
                  Undo changes
                </Button>
              )}
            </div>
          </form>
        </section>

        <div className="space-y-6">
          {/* ─── Your events ─── */}
          <section aria-labelledby="your-events" className="rounded-[22px] border border-hairline bg-surface-raised p-5 shadow-e-1 sm:p-6">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="your-events" className="text-[1.0625rem] font-semibold text-ink">
                Your events
              </h2>
              {!loadingRegs && <span className="text-[0.875rem] text-ink-muted">{active} active</span>}
            </div>

            {loadingRegs ? (
              <div className="mt-4 space-y-2" aria-hidden>
                <div className="h-12 animate-pulse rounded-xl bg-surface-sunken" />
                <div className="h-12 animate-pulse rounded-xl bg-surface-sunken" />
              </div>
            ) : registrations.length === 0 ? (
              <div className="mt-3">
                <p className="text-[0.9375rem] text-ink-muted">You haven't signed up for anything yet.</p>
                <Link href="/dashboard/events" className="mt-3 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-brand hover:underline">
                  Browse events <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            ) : (
              <>
                <ul className="mt-3 divide-y divide-hairline">
                  {registrations.slice(0, 5).map((r) => {
                    const ev = events[r.eventId];
                    const href = `/dashboard/events/${r.mainEventId || ev?.mainEventId || DEFAULT_MAIN_EVENT_ID}/subevents/${ev?.slug || r.eventId}`;
                    return (
                      <li key={r.id}>
                        <Link href={href} className="flex items-center gap-3 py-3 hover:opacity-80">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[0.9375rem] font-medium text-ink">{ev?.name || r.eventTitle || 'Event'}</span>
                            <span className="block truncate text-[0.8125rem] text-ink-muted">
                              {when(ev?.startDateTime) || `Signed up ${when(r.createdAt)}`}
                              {r.teamName ? ` · Team ${r.teamName}` : ''}
                            </span>
                          </span>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ${STATUS[r.status]?.tone ?? ''}`}>
                            {STATUS[r.status]?.label ?? r.status}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href="/dashboard/my-registrations"
                  className="mt-2 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-brand hover:underline"
                >
                  All your registrations <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </>
            )}
          </section>

          {/* ─── Account ─── */}
          <section aria-labelledby="account" className="rounded-[22px] border border-hairline bg-surface-raised p-5 shadow-e-1 sm:p-6">
            <h2 id="account" className="text-[1.0625rem] font-semibold text-ink">
              Account
            </h2>
            <dl className="mt-3 space-y-3 text-[0.9375rem]">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                <dd className="min-w-0 flex-1 truncate text-ink">{user.email}</dd>
              </div>
              {user.createdAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Member since</dt>
                  <dd className="text-ink">{when(user.createdAt)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Signed in with</dt>
                <dd className="text-ink">Google</dd>
              </div>
            </dl>
            <Button
              variant="secondary"
              fullWidth
              className="mt-5 text-signal-danger"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={() => setConfirmSignOut(true)}
            >
              Sign out
            </Button>
          </section>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        onConfirm={signOut}
        title="Sign out?"
        message="You'll need your IIT Madras Google account to sign back in."
        confirmText="Sign out"
        cancelText="Stay signed in"
        variant="warning"
        isLoading={signingOut}
      />
    </div>
  );
}
