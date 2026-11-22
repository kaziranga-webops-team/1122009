'use client';

// The home page's building blocks. Each one answers a single question for the
// person looking at it: what's next for me, where can I go, what needs my
// attention, what's happening in the house.

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  ClipboardList,
  Crown,
  FileText,
  Globe,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Ticket,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { canManageRoles, canOrganiseEvents, canUsePortalAdmin, writableResources } from '@/lib/portal/permissions';
import { DEFAULT_MAIN_EVENT_ID } from '@/lib/portal/firebase/paths';
import type { EventItem, UserRole } from '@/types/portal';
import type { Announcement } from '@/lib/portal/announcements';
import { isSafeLink } from '@/lib/portal/announcements';
import { communityBySlug } from '@/lib/communities';

export const eventHref = (e: Pick<EventItem, 'id' | 'slug' | 'mainEventId'>) =>
  `/dashboard/events/${e.mainEventId || DEFAULT_MAIN_EVENT_ID}/subevents/${e.slug || e.id}`;

const dayFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });

/** "Today", "Tomorrow", "In 5 days" — or the date once it is more than a week out. */
export function whenLabel(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const days = Math.floor((new Date(iso).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1 && days <= 7) return `In ${days} days`;
  return dayFmt.format(new Date(t));
}

/** A section's heading row: a title and, optionally, one link on the right. */
export const BlockHeader: React.FC<{ title: string; href?: string; linkLabel?: string }> = ({
  title,
  href,
  linkLabel = 'See all',
}) => (
  <div className="flex items-center justify-between gap-3 mb-3">
    <h2 className="font-display font-bold text-[1.0625rem] text-ink">{title}</h2>
    {href && (
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-brand hover:underline underline-offset-4"
      >
        {linkLabel}
        <ArrowRight className="w-3.5 h-3.5" aria-hidden />
      </Link>
    )}
  </div>
);

// ─── Next up ────────────────────────────────────────────────────────────────

export const NextUp: React.FC<{
  next: EventItem | null;
  openCount: number;
  loading: boolean;
}> = ({ next, openCount, loading }) => (
  <section
    aria-label="Next up"
    className="h-full rounded-[18px] bg-surface-raised border border-hairline shadow-e-1 p-5 flex flex-col"
  >
    <p className="text-[0.8125rem] font-semibold text-ink-muted flex items-center gap-1.5">
      <CalendarClock className="w-4 h-4" aria-hidden /> Next up
    </p>

    {loading ? (
      <div className="mt-4 space-y-2.5" aria-hidden>
        <div className="h-5 w-3/4 rounded bg-surface-sunken animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-surface-sunken animate-pulse" />
      </div>
    ) : next ? (
      <>
        <p className="mt-3 font-display font-extrabold text-[1.375rem] leading-tight text-ink clamp-2">{next.name}</p>
        <p className="mt-1.5 text-[0.875rem] text-ink-muted">
          <span className="font-semibold text-ink">{whenLabel(next.startDateTime)}</span>
          {' · '}
          {timeFmt.format(new Date(next.startDateTime))}
        </p>
        {next.venue && (
          <p className="mt-1 text-[0.8125rem] text-ink-muted truncate flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
            {/^https?:\/\//.test(next.venue) ? 'Online' : next.venue}
          </p>
        )}
        <Link
          href={eventHref(next)}
          className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-brand hover:underline underline-offset-4"
        >
          Event details <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </>
    ) : (
      <>
        <p className="mt-3 font-display font-bold text-[1.125rem] text-ink">Nothing booked yet</p>
        <p className="mt-1 text-[0.875rem] text-ink-muted">
          {openCount > 0
            ? `${openCount} ${openCount === 1 ? 'event is' : 'events are'} open for registration.`
            : 'No events are open right now.'}
        </p>
        <Link
          href="/dashboard/events"
          className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-brand hover:underline underline-offset-4"
        >
          Browse events <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </>
    )}
  </section>
);

// ─── Shortcuts ──────────────────────────────────────────────────────────────

interface Shortcut {
  label: string;
  href: string;
  icon: LucideIcon;
  tone: string;
}

const TONES = {
  green: 'bg-[#0f5e48] text-[#f5e9cf]',
  red: 'bg-[#c8102e] text-[#f5e9cf]',
  blue: 'bg-[#2343b8] text-[#f5e9cf]',
  gold: 'bg-[#f6b51e] text-[#1c130c]',
  pink: 'bg-[#e2387a] text-[#f5e9cf]',
  orange: 'bg-[#f08a24] text-[#1c130c]',
  ink: 'bg-[#1c130c] text-[#f6b51e]',
  brass: 'bg-[#9c5d14] text-[#f5e9cf]',
};

/**
 * Where this person is likely to go next, most specific to their role first.
 * Eight at most: two rows of four on a phone, one row on a wide screen.
 */
export function shortcutsFor(role: UserRole | undefined): Shortcut[] {
  const list: Shortcut[] = [];
  if (canUsePortalAdmin(role)) list.push({ label: 'Insights', href: '/admin/dashboard', icon: LayoutDashboard, tone: TONES.ink });
  if (canOrganiseEvents(role)) {
    list.push(
      { label: 'New event', href: '/admin/events/new', icon: CalendarPlus, tone: TONES.red },
      { label: 'Manage events', href: '/admin/events', icon: ClipboardList, tone: TONES.blue },
      { label: 'Sign-ups', href: '/admin/registrations', icon: Users, tone: TONES.brass },
    );
  }
  if (canManageRoles(role)) list.push({ label: 'House', href: '/super-admin/dashboard', icon: Crown, tone: TONES.gold });

  const member: Shortcut[] = [
    { label: 'Events', href: '/dashboard/events', icon: Ticket, tone: TONES.green },
    { label: 'My registrations', href: '/dashboard/my-registrations', icon: CalendarCheck, tone: TONES.pink },
    { label: 'Meetups', href: '/meetups', icon: MapPin, tone: TONES.orange },
    { label: 'Study', href: '/study', icon: BookOpen, tone: TONES.blue },
    { label: 'Notes', href: '/study/notes', icon: FileText, tone: TONES.brass },
    { label: 'Communities', href: '/communities', icon: Users, tone: TONES.red },
    { label: 'Profile', href: '/dashboard/profile', icon: UserRound, tone: TONES.gold },
  ];
  for (const m of member) {
    if (list.length >= 8) break;
    list.push(m);
  }
  return list;
}

export const Shortcuts: React.FC<{ items: Shortcut[] }> = ({ items }) => (
  <nav aria-label="Shortcuts">
    <ul className="grid grid-cols-4 lg:grid-cols-8 gap-x-2 gap-y-4">
      {items.map((s) => (
        <li key={s.href}>
          <Link href={s.href} className="group flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                'grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl transition-transform duration-200 group-hover:-translate-y-0.5',
                s.tone
              )}
            >
              <s.icon className="w-6 h-6" strokeWidth={1.9} aria-hidden />
            </span>
            <span className="text-[0.75rem] sm:text-[0.8125rem] font-semibold text-ink leading-tight">{s.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

// ─── Organiser summary ──────────────────────────────────────────────────────

export interface OrganiserStats {
  drafts: number;
  open: number;
  closingSoon: number;
  signUps: number;
}

export function organiserStats(events: EventItem[], now = Date.now()): OrganiserStats {
  const soon = now + 3 * 86400000;
  let drafts = 0;
  let open = 0;
  let closingSoon = 0;
  let signUps = 0;
  for (const e of events) {
    if (e.status === 'DRAFT') drafts++;
    const deadline = new Date(e.registrationDeadline || e.startDateTime).getTime();
    if (e.status === 'PUBLISHED' && deadline > now) {
      open++;
      if (deadline <= soon) closingSoon++;
      signUps += Number(e.currentRegistrationCount) || 0;
    }
  }
  return { drafts, open, closingSoon, signUps };
}

export const OrganiserPanel: React.FC<{ stats: OrganiserStats; scopeLabel: string; loading: boolean }> = ({
  stats,
  scopeLabel,
  loading,
}) => {
  const items = [
    { label: 'Open now', value: stats.open },
    { label: 'Closing in 3 days', value: stats.closingSoon, warn: stats.closingSoon > 0 },
    { label: 'Drafts', value: stats.drafts },
    { label: 'Sign-ups on open events', value: stats.signUps },
  ];
  return (
    <section aria-label="Your events">
      <BlockHeader title={scopeLabel} href="/admin/events" linkLabel="Manage" />
      <dl className="grid grid-cols-2 lg:grid-cols-4 rounded-[18px] bg-surface-raised border border-hairline shadow-e-1 divide-x divide-y lg:divide-y-0 divide-hairline overflow-hidden">
        {items.map((it) => (
          <div key={it.label} className="p-4">
            <dt className="text-[0.8125rem] text-ink-muted">{it.label}</dt>
            <dd className={cn('mt-1 font-display font-extrabold text-[1.5rem] nums', it.warn ? 'text-signal-warn' : 'text-ink')}>
              {loading ? '–' : it.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

// ─── Announcements ──────────────────────────────────────────────────────────

const audienceOf = (a: Announcement) =>
  a.audience === 'COMMUNITY'
    ? communityBySlug(a.communitySlug || '')?.name
    : a.audience === 'REGION'
      ? a.region
      : null;

export const Announcements: React.FC<{ items: Announcement[]; manageHref?: string }> = ({ items, manageHref }) => (
  <section aria-label="Announcements" id="announcements">
    <BlockHeader title="Announcements" href={manageHref} linkLabel="Post" />
    <ul className="rounded-[18px] bg-surface-raised border border-hairline shadow-e-1 divide-y divide-hairline">
      {items.map((n) => {
        const body = (
          <div className="flex items-start gap-3 p-4">
            <span className="mt-0.5 grid place-items-center w-8 h-8 rounded-lg bg-brand/10 text-brand shrink-0">
              <Megaphone className="w-4 h-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.875rem] font-semibold text-ink">
                {n.title}
                {audienceOf(n) && <span className="ml-2 text-[0.75rem] font-medium text-ink-faint">{audienceOf(n)}</span>}
              </p>
              <p className="text-[0.8125rem] text-ink-muted clamp-3 whitespace-pre-line">{n.body}</p>
            </div>
            <time className="text-[0.75rem] text-ink-faint shrink-0 nums" dateTime={n.createdAt}>
              {whenAgo(n.createdAt)}
            </time>
          </div>
        );
        return (
          <li key={n.id}>
            {n.linkUrl && isSafeLink(n.linkUrl) ? (
              <Link href={n.linkUrl} className="block hover:bg-surface-sunken/50 transition-colors">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  </section>
);

function whenAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(mins)) return '';
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

// ─── Meetups ────────────────────────────────────────────────────────────────

export interface MeetupCardData {
  key: string;
  venue: string;
  date: string;
  time: number;
  poster?: string;
  instagram?: string;
}

/** "1/9/2025" (day/month/year, as the sheet writes it) to a timestamp. */
export function parseSheetDate(s: string): number | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((s || '').trim());
  if (!m) return null;
  const t = Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isFinite(t) ? t : null;
}

export const Meetups: React.FC<{ title: string; items: MeetupCardData[] }> = ({ title, items }) => (
  <section aria-label={title}>
    <BlockHeader title={title} href="/meetups" />
    <ul className="flex lg:grid lg:grid-cols-3 gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-1 px-1 pb-1">
      {items.map((m) => (
        <li key={m.key} className="snap-start shrink-0 w-[78%] sm:w-[46%] lg:w-auto">
          <a
            href={m.instagram || '/meetups'}
            target={m.instagram ? '_blank' : undefined}
            rel={m.instagram ? 'noopener noreferrer' : undefined}
            className="flex items-center gap-3 p-3 rounded-[16px] bg-surface-raised border border-hairline shadow-e-1 hover:border-hairline-strong transition-colors"
          >
            {m.poster ? (
              <img src={m.poster} alt="" loading="lazy" className="w-14 h-14 rounded-xl object-cover shrink-0 bg-surface-sunken" />
            ) : (
              <span className="grid place-items-center w-14 h-14 rounded-xl bg-surface-sunken text-ink-muted shrink-0">
                <MapPin className="w-5 h-5" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[0.9375rem] font-semibold text-ink truncate">{m.venue}</p>
              <p className="text-[0.8125rem] text-ink-muted">{dayFmt.format(new Date(m.time))}</p>
            </div>
          </a>
        </li>
      ))}
    </ul>
  </section>
);
