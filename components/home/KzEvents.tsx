"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Mic, Trophy, X } from "lucide-react";
import {
  fetchEvents,
  getCachedEvents,
  toDirectImageUrl,
  type EventRow,
} from "@/lib/api";
import { SectionHead } from "@/components/home/sections";
import { mapRowToEvent, seriesLabel } from "@/lib/events";
import { DateStamp, TicketCard, type TicketStock } from "@/components/kz/TicketCard";
import EventDial from "@/components/home/EventDial";

/** A portal event, as /api/house-events serves it. */
interface PortalEvent {
  id: string;
  name: string;
  status: string;
  startDateTime: string | null;
  registrationDeadline: string | null;
  coverImageUrl: string | null;
  description: string;
  winner: string | null;
  runnerUp1: string | null;
  runnerUp2: string | null;
  href: string;
}

type Kind = "open" | "event" | "session" | "meetup" | "tak" | "results";

/** One thing that happened (or is about to) in the house. */
interface Item {
  key: string;
  kind: Kind;
  title: string;
  /** When it happens or happened; NaN when the sheet has no usable date. */
  time: number;
  place?: string;
  image: string;
  description?: string;
  href?: string;
  cta?: string;
  internal?: boolean;
  podium?: { place: string; who: string }[];
  mentions?: string;
  /** What series it belongs to: Guest session, Curiosity Hour, Aarohan, or a community. */
  series?: string;
}

const KIND: Record<Exclude<Kind, "results">, { label: string; stock: TicketStock }> = {
  open: { label: "Sign-ups open", stock: "pink" },
  event: { label: "House event", stock: "cream" },
  session: { label: "Session", stock: "sky" },
  meetup: { label: "Meetup", stock: "mint" },
  tak: { label: "Kaziranga Tak", stock: "marigold" },
};

/**
 * The sheets write dates as day/month/year, and sometimes month/day/year:
 * take whichever reading is possible, preferring the Indian order.
 */
function parseDate(raw: string | null | undefined): number {
  const s = (raw || "").trim();
  if (!s) return NaN;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    const [a, b, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const [d, mo] = b > 12 ? [b, a] : [a, b];
    return Date.UTC(y, mo - 1, d);
  }
  return new Date(s).getTime();
}

const asDate = (t: number) => (Number.isFinite(t) ? new Date(t) : null);

const podiumOf = (w?: string | null, r1?: string | null, r2?: string | null) =>
  [
    { place: "Winner", who: (w || "").trim() },
    { place: "Runner-up", who: (r1 || "").trim() },
    { place: "Second runner-up", who: (r2 || "").trim() },
  ].filter((p) => p.who);

function fromPortal(rows: PortalEvent[], now: number): Item[] {
  return rows.map((e) => {
    const podium = podiumOf(e.winner, e.runnerUp1, e.runnerUp2);
    const open = e.status === "PUBLISHED" && parseDate(e.registrationDeadline) > now;
    return {
      key: `p-${e.id}`,
      kind: podium.length ? "results" : open ? "open" : "event",
      title: e.name,
      time: parseDate(e.startDateTime),
      image: e.coverImageUrl ? toDirectImageUrl(e.coverImageUrl, 800) : "",
      description: e.description || undefined,
      href: e.href,
      cta: open ? "Sign up" : "Open in the portal",
      internal: true,
      podium,
    };
  });
}

function fromSessions(rows: EventRow[]): Item[] {
  return rows
    .filter((r) => r.Title?.trim())
    .map((r, i) => {
      const podium = podiumOf(r.winner, r.runnerUp1, r.runnerUp2);
      const live = /live|upcoming/i.test(r.status || "");
      const href = (live ? r.meet_link : r.youtube_url)?.trim() || undefined;
      const mapped = mapRowToEvent(r, i);
      return {
        series: mapped ? seriesLabel(mapped) : undefined,
        key: `s-${i}`,
        kind: podium.length ? ("results" as const) : ("session" as const),
        title: r.Title.trim(),
        // The real date: the typed Date mixes day/month and month/day.
        time: parseDate(r.Starts_at || r.Date),
        place: r.Speaker?.trim() || undefined,
        image: toDirectImageUrl(r.Image_url || "", 800),
        // A results row's description only repeats the placings.
        description: podium.length ? undefined : r.description?.trim() || undefined,
        href,
        cta: href ? (live ? "Join the session" : "Watch on YouTube") : undefined,
        podium,
        mentions: r.honourableMentions?.trim() || undefined,
      };
    });
}

/**
 * Everything by date, newest first: an event coming up is the newest thing
 * of all, and anything without a date goes last. One card per title, keeping
 * the copy that has a date when an event appears in both the portal and the
 * website sheet.
 */
function feed(all: Item[]): Item[] {
  const dated = (i: Item) => Number.isFinite(i.time);
  const byTitle = new Map<string, Item>();
  for (const item of all) {
    const key = item.title.trim().toLowerCase();
    const seen = byTitle.get(key);
    if (!seen || (!dated(seen) && dated(item))) byTitle.set(key, item);
  }
  return Array.from(byTitle.values())
    .sort((a, b) => (dated(b) ? b.time : -Infinity) - (dated(a) ? a.time : -Infinity))
    .slice(0, 14);
}

/* ─── Cards ─────────────────────────────────────────────────────────── */

function Poster({ item }: { item: Item }) {
  return item.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.image} alt="" loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover" />
  ) : (
    <span
      className="kz-halftone grid aspect-[16/10] w-full place-items-center bg-[#2343b8] px-6 text-center font-[family-name:var(--kz-f-display)] text-[1.5rem] leading-tight text-[#f6b51e]"
      style={{ ["--dot" as string]: "rgba(10,20,80,0.55)" }}
    >
      {item.title}
    </span>
  );
}

function Action({ item, className = "" }: { item: Item; className?: string }) {
  if (!item.href || !item.cta) return null;
  const cls = `kz-btn kz-btn--sm ${item.kind === "open" ? "kz-btn--red" : "kz-btn--ink"} ${className}`;
  return item.internal ? (
    <Link href={item.href} className={cls} onClick={(e) => e.stopPropagation()}>
      {item.cta} <ArrowRight size={14} />
    </Link>
  ) : (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls} onClick={(e) => e.stopPropagation()}>
      {item.cta} <ArrowRight size={14} />
    </a>
  );
}

/** An event, session, meetup or episode, as a cinema ticket. */
function FeedTicket({ item, onOpen }: { item: Item; onOpen: (i: Item) => void }) {
  const kind = KIND[item.kind as Exclude<Kind, "results">];
  const more = Boolean(item.description);
  return (
    <TicketCard stock={kind.stock} poster={<Poster item={item} />}>
      <div className="flex items-start justify-between gap-3">
        <span className="kz-label text-[#1c130c]/75">{item.series ?? kind.label}</span>
        <DateStamp date={asDate(item.time)} className="shrink-0 text-[0.78rem]" />
      </div>
      <h3 className="kz-serif mt-2 text-[1.3rem] leading-tight text-[#1c130c]">
        {more ? (
          <button type="button" onClick={() => onOpen(item)} className="kz-focus text-left after:absolute after:inset-0 after:content-['']">
            {item.title}
          </button>
        ) : (
          item.title
        )}
      </h3>
      {item.place && (
        <p className="mt-1.5 inline-flex min-w-0 items-center gap-1.5 text-[0.82rem] font-semibold text-[#5e4a35]">
          {item.kind === "meetup" ? <MapPin size={13} /> : <Mic size={13} />}
          <span className="truncate">{item.place}</span>
        </p>
      )}
      {item.description && <p className="mt-2 line-clamp-3 text-[0.9rem] leading-snug text-[#1c130c]/80">{item.description}</p>}
      <div className="relative z-[1] mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
        <Action item={item} />
        {more && (
          <button type="button" onClick={() => onOpen(item)} className="kz-focus text-[0.85rem] font-semibold underline underline-offset-4">
            Read more
          </button>
        )}
      </div>
    </TicketCard>
  );
}

const MEDALS = ["#f6b51e", "#cfd4dc", "#d08a4a"];

/** A finished event with its winners: a results board, not a ticket. */
function ResultsBoard({ item }: { item: Item }) {
  const podium = item.podium ?? [];
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[6px] bg-[#1c130c] p-2 text-[#f5e9cf] shadow-[0_2px_0_rgba(28,19,12,0.15)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_#c8102e]">
      <div className="relative overflow-hidden rounded-[3px]">
        <Poster item={item} />
        <span className="kz-label absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-[#f6b51e] px-2.5 py-1 text-[0.62rem] text-[#1c130c]">
          <Trophy size={12} aria-hidden="true" /> Results
        </span>
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="kz-serif text-[1.3rem] leading-tight text-[#f6b51e]">{item.title}</h3>
          <DateStamp date={asDate(item.time)} className="shrink-0 border-[#f6b51e]/80 text-[0.78rem] text-[#f6b51e] mix-blend-normal" />
        </div>
        {item.series && <p className="kz-label mt-1 text-[#f5e9cf]/60">{item.series}</p>}
        <ol className="mt-3 space-y-2">
          {podium.map((p, i) => (
            <li key={p.place} className="flex items-center gap-3">
              <span
                className="kz-sign grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.8rem] text-[#1c130c]"
                style={{ background: MEDALS[i] }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="sr-only">{p.place}: </span>
                <span className="block truncate font-semibold">{p.who}</span>
              </span>
            </li>
          ))}
        </ol>
        {item.mentions && <p className="mt-3 line-clamp-2 text-[0.8rem] text-[#f5e9cf]/65">Honourable mentions: {item.mentions}</p>}
        {item.href && item.cta && (
          <div className="mt-auto pt-4">
            <Action item={{ ...item, kind: "event" }} className="!bg-[#f5e9cf] !text-[#1c130c]" />
          </div>
        )}
      </div>
    </article>
  );
}

/** The whole description of a session or event, with its link. */
function Details({ item, onClose }: { item: Item; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const kind = KIND[item.kind as Exclude<Kind, "results">];
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={item.title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#1c130c]/70" />
      <div className="kz-font relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[1.5rem] bg-[#f5e9cf] text-[#1c130c] shadow-2xl sm:rounded-[1.5rem]">
        <div className="relative shrink-0">
          <Poster item={item} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            autoFocus
            className="kz-focus absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-[#1c130c] text-[#f5e9cf]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          <div className="flex items-center justify-between gap-3">
            {kind && <span className="kz-label text-[#c8102e]">{kind.label}</span>}
            <DateStamp date={asDate(item.time)} className="text-[0.85rem]" />
          </div>
          <h3 className="kz-serif mt-2 text-[1.7rem] leading-tight">{item.title}</h3>
          {item.place && <p className="mt-1 text-[0.95rem] font-semibold text-[#5e4a35]">{item.place}</p>}
          <p className="mt-4 whitespace-pre-line text-[1rem] leading-relaxed text-[#1c130c]/85">{item.description}</p>
          {item.href && item.cta && (
            <div className="mt-6">
              <Action item={item} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KzEvents() {
  const [portal, setPortal] = useState<PortalEvent[]>([]);
  const [sessions, setSessions] = useState<EventRow[]>(() => getCachedEvents() || []);
  const [open, setOpen] = useState<Item | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/house-events")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => alive && Array.isArray(rows) && setPortal(rows))
      .catch(() => {});
    fetchEvents().then((r) => alive && setSessions(r)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const now = Date.now();
  const shown = feed([...fromPortal(portal, now), ...fromSessions(sessions)]);

  const close = useCallback(() => setOpen(null), []);

  return (
    <section id="events" className="kz-font bg-[#f5e9cf] text-[#1c130c]">
      <SectionHead
        title={["Lately in", "the house"]}
        intro="Events, sessions and results from across the house, newest first."
      />

      {shown.length > 0 && (
        <div className="px-5 sm:px-8 md:px-12">
          <EventDial
            label="Lately in the house"
            items={shown.map((item) => ({
              key: item.key,
              node: item.kind === "results" ? <ResultsBoard item={item} /> : <FeedTicket item={item} onOpen={setOpen} />,
            }))}
          />
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3 px-5 pb-20 pt-10 md:pb-28">
        <Link href="/dashboard/events" className="kz-btn kz-btn--red">
          Sign up for events <ArrowRight size={18} />
        </Link>
        <Link href="/events" className="kz-btn kz-btn--outline">
          Past events
        </Link>
      </div>

      {open && <Details item={open} onClose={close} />}
    </section>
  );
}
