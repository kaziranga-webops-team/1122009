"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLenis } from "lenis/react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Lightbulb,
  Mic,
  Search,
  Sparkles,
  Trophy,
  Wrench,
  X,
  Youtube,
  Zap,
} from "lucide-react";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import PageHero, { Segmented } from "@/components/kz/PageHero";
import { RHINO_SRC } from "@/components/kz/Scene";
import { fetchEvents, getCachedEvents, toDirectImageUrl, type EventRow } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────
type Category = "guest-sessions" | "arohan-culturals" | "arohan-technicals" | "arohan-esports" | "curiosity-hour";
type TopTab = "guest-sessions" | "arohan" | "curiosity-hour";
type ArohanSubTab = "arohan-culturals" | "arohan-technicals" | "arohan-esports";
type Status = "upcoming" | "past-recorded" | "past-unrecorded" | "live-now";
type StatusFilter = "all" | "upcoming" | "past";

interface EventItem {
  id: string;
  title: string;
  date: string;
  category: Category;
  status: Status;
  speaker?: string;
  description?: string;
  imageUrl?: string;
  meetLink?: string;
  youtubeLink?: string;
  winner?: string;
  runnerUp1?: string;
  runnerUp2?: string;
  honourableMentions?: string;
}

// ─── Map sheet rows → EventItem ──────────────────────────────────────
const CATEGORY_ALIASES: [Category, (c: string) => boolean][] = [
  ["guest-sessions", (c) => ["live-session", "live-sessions", "live session", "guest-sessions", "guest session", "guest-session"].includes(c)],
  ["arohan-culturals", (c) => ["cultural", "arohan-culturals", "arohan culturals", "aarohan-culturals", "aarohan culturals", "aarohan"].includes(c)],
  ["arohan-technicals", (c) => ["technical", "technicals", "arohan-technicals", "arohan technicals", "aarohan-technicals", "aarohan technicals"].includes(c)],
  [
    "arohan-esports",
    (c) =>
      ["sports", "esports", "e-sports", "arohan-esports", "arohan esports", "arohan e-sports", "aarohan-esports", "aarohan esports", "aarohan e-sports"].includes(c),
  ],
  ["curiosity-hour", (c) => c === "curiosity-hour" || c === "curiosity hour" || c.includes("curiosity") || c.includes("curosity")],
];

function mapRowToEvent(row: EventRow, index: number): EventItem | null {
  const raw = (row.Category || "").trim().toLowerCase();
  const category = CATEGORY_ALIASES.find(([, test]) => test(raw))?.[0];
  if (!category) return null; // unknown category — skip row

  const s = (row.status || "").trim().toLowerCase().replace(/\s+/g, "-");
  const status: Status = s === "live-now" || s === "past-recorded" || s === "past-unrecorded" ? s : "upcoming";

  return {
    id: `evt-${index}`,
    title: row.Title?.trim() || "",
    date: row.Date?.trim() || "",
    category,
    status,
    speaker: row.Speaker?.trim() || undefined,
    description: row.description?.trim() || undefined,
    imageUrl: row.Image_url?.trim() ? toDirectImageUrl(row.Image_url) : undefined,
    meetLink: row.meet_link?.trim() || undefined,
    youtubeLink: row.youtube_url?.trim() || undefined,
    winner: row.winner,
    runnerUp1: row.runnerUp1,
    runnerUp2: row.runnerUp2,
    honourableMentions: row.honourableMentions,
  };
}

const toEvents = (rows: EventRow[]) => rows.map(mapRowToEvent).filter((e): e is EventItem => e !== null && !!e.title);

/** The sheet gives dates in mixed formats; show what parses, else the raw string. */
function formatDate(value: string): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const TOP_TABS: { label: string; value: TopTab; icon: React.ReactNode }[] = [
  { label: "Guest Sessions", value: "guest-sessions", icon: <Zap size={15} /> },
  { label: "Aarohan", value: "arohan", icon: <Sparkles size={15} /> },
  { label: "Curiosity Hour", value: "curiosity-hour", icon: <Lightbulb size={15} /> },
];

const AROHAN_TABS: { label: string; value: ArohanSubTab; icon: React.ReactNode }[] = [
  { label: "Culturals", value: "arohan-culturals", icon: <Sparkles size={14} /> },
  { label: "Technicals", value: "arohan-technicals", icon: <Wrench size={14} /> },
  { label: "E-Sports", value: "arohan-esports", icon: <Trophy size={14} /> },
];

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
];

const BADGE: Record<Status, { label: string; className: string }> = {
  "live-now": { label: "Live now", className: "bg-[#c6011f] text-white" },
  upcoming: { label: "Upcoming", className: "bg-[#002820] text-[#f9fbe5]" },
  "past-recorded": { label: "Recorded", className: "bg-[#dcebd8] text-[#1d3d35]" },
  "past-unrecorded": { label: "Not recorded", className: "bg-[#ecebdc] text-[#4b6660]" },
};

/** Live first, then upcoming, then the recordings; newest first within each. */
const ORDER: Record<Status, number> = { "live-now": 0, upcoming: 1, "past-recorded": 2, "past-unrecorded": 3 };
const toTime = (d: string) => {
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const SOFT = [0.22, 1, 0.36, 1] as const;

function StatusBadge({ status }: { status: Status }) {
  const b = BADGE[status];
  return (
    <span className={`kz-label inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.62rem] ${b.className}`}>
      {status === "live-now" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      {b.label}
    </span>
  );
}

function hasResults(e: EventItem) {
  return Boolean(e.winner || e.runnerUp1 || e.runnerUp2 || e.honourableMentions);
}

function primaryAction(e: EventItem) {
  const live = e.status === "live-now" || e.status === "upcoming";
  if (live && e.meetLink) return { href: e.meetLink, label: e.status === "live-now" ? "Join live" : "Join session", live: true };
  if (!live && e.youtubeLink) return { href: e.youtubeLink, label: "Watch on YouTube", live: false };
  return null;
}

// ─── Card ────────────────────────────────────────────────────────────
function EventCard({ event, index, onOpen }: { event: EventItem; index: number; onOpen: (e: EventItem) => void }) {
  const reduce = useReducedMotion();
  const action = primaryAction(event);
  const [broken, setBroken] = useState(false);

  return (
    <motion.article
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ duration: 0.6, delay: Math.min(index, 8) * 0.05, ease: SOFT }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.6rem] border border-[#002820]/10 bg-white transition-[box-shadow,transform] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-30px_rgba(0,40,32,0.55)]"
      onClick={() => onOpen(event)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(event);
        }
      }}
      tabIndex={0}
      aria-label={`Open details for ${event.title}`}
    >
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-[#dcebd8]">
        {event.imageUrl && !broken ? (
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            unoptimized
            onError={() => setBroken(true)}
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,#dcebd8,#bfe4d4)]">
            <CalendarDays size={40} className="text-[#006255]/50" />
          </span>
        )}
        <span className="absolute left-4 top-4">
          <StatusBadge status={event.status} />
        </span>
        {hasResults(event) && (
          <span className="kz-label absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#ffd27a] px-3 py-1.5 text-[0.62rem] text-[#002820]">
            <Trophy size={12} /> Results
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {event.date && (
          <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#4b6660]">
            <CalendarDays size={14} /> {formatDate(event.date)}
          </span>
        )}
        <h3 className="mt-2.5 text-[1.15rem] font-semibold leading-snug tracking-[-0.01em] text-[#002820]">{event.title}</h3>
        {event.speaker && (
          <p className="mt-3 inline-flex max-w-full items-center gap-2 self-start rounded-full bg-[#f1f5e4] px-3 py-1.5 text-[0.78rem] font-semibold text-[#1d3d35]">
            <Mic size={13} className="shrink-0 text-[#006255]" />
            <span className="truncate">{event.speaker}</span>
          </p>
        )}
        {event.description && <p className="kz-body mt-3 line-clamp-3 text-[#4b6660]">{event.description}</p>}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          {action ? (
            <a
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`kz-btn kz-btn--sm ${action.live ? "kz-btn--red" : "kz-btn--ink"}`}
            >
              {!action.live && <Youtube size={15} />}
              {action.label}
            </a>
          ) : (
            <span className="text-[0.8rem] font-semibold text-[#4b6660]/80">
              {event.status === "past-unrecorded" ? "No recording" : "Link coming soon"}
            </span>
          )}
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#002820]/15 text-[#002820] transition-all duration-500 group-hover:rotate-[-45deg] group-hover:border-transparent group-hover:bg-[#002820] group-hover:text-[#f9fbe5]">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Results list ────────────────────────────────────────────────────
function Results({ event }: { event: EventItem }) {
  const rows = [
    { medal: "🥇", role: "Winner", name: event.winner },
    { medal: "🥈", role: "1st runner-up", name: event.runnerUp1 },
    { medal: "🥉", role: "2nd runner-up", name: event.runnerUp2 },
    { medal: "🎖️", role: "Honourable mentions", name: event.honourableMentions },
  ].filter((r) => r.name);
  if (!rows.length) return null;
  return (
    <div className="mt-6 rounded-[1.25rem] bg-[#fff6dc] p-5">
      <p className="kz-label flex items-center gap-2 text-[#8a5a00]">
        <Trophy size={14} /> Event results
      </p>
      <ul className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <li key={r.role} className="flex items-start gap-3">
            <span className="text-xl leading-none">{r.medal}</span>
            <span>
              <span className="kz-label block text-[0.6rem] text-[#8a5a00]/80">{r.role}</span>
              <span className="font-semibold text-[#002820]">{r.name}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────
function EventModal({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const lenis = useLenis();
  const action = primaryAction(event);

  useEffect(() => {
    lenis?.stop();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lenis, onClose]);

  return (
    <motion.div
      className="kz-font fixed inset-0 z-[70] flex items-end justify-center bg-[#002820]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      data-lenis-prevent
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.5, ease: SOFT }}
        onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-[92svh] w-full max-w-5xl overflow-y-auto rounded-t-[2rem] bg-[#f9fbe5] text-[#002820] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)] sm:rounded-[2rem] md:grid-cols-[1.05fr_1fr] md:overflow-hidden"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[#002820] shadow transition-transform duration-300 hover:rotate-90"
        >
          <X size={20} />
        </button>

        <div className="relative min-h-[14rem] bg-[#dcebd8] md:min-h-full">
          {event.imageUrl ? (
            <Image src={event.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 520px" className="object-cover" unoptimized />
          ) : (
            <span className="grid h-full w-full place-items-center">
              <CalendarDays size={56} className="text-[#006255]/40" />
            </span>
          )}
        </div>

        <div className="p-6 sm:p-8 md:max-h-[86svh] md:overflow-y-auto">
          <div className="flex flex-wrap items-center gap-3 pr-12">
            <StatusBadge status={event.status} />
            {event.date && (
              <span className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-[#4b6660]">
                <CalendarDays size={14} /> {formatDate(event.date)}
              </span>
            )}
          </div>
          <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.1rem)] font-semibold leading-tight tracking-[-0.02em]">{event.title}</h2>
          {event.speaker && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[0.85rem] font-semibold text-[#1d3d35]">
              <Mic size={14} className="text-[#006255]" /> {event.speaker}
            </p>
          )}
          <Results event={event} />
          {event.description && <p className="kz-body mt-5 whitespace-pre-line text-[#36524b]">{event.description}</p>}
          {action && (
            <a href={action.href} target="_blank" rel="noopener noreferrer" className={`kz-btn mt-7 ${action.live ? "kz-btn--red" : "kz-btn--ink"}`}>
              {!action.live && <Youtube size={17} />}
              {action.label}
              <ArrowRight size={17} />
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Next up: the spotlight above the archive ───────────────────────
function NextUp({ event, onOpen }: { event: EventItem; onOpen: (e: EventItem) => void }) {
  const action = primaryAction(event);
  const live = event.status === "live-now";
  return (
    <section className="mx-auto max-w-[90rem] px-5 pb-8 sm:px-8 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: SOFT }}
        className="group relative grid overflow-hidden rounded-[2rem] bg-[#002820] text-[#f9fbe5] md:grid-cols-[1.1fr_1fr]"
      >
        <button type="button" onClick={() => onOpen(event)} className="relative block aspect-[16/9] overflow-hidden bg-[#00392e] text-left md:aspect-auto md:min-h-[17rem]" aria-label={`Open details for ${event.title}`}>
          {event.imageUrl && (
            <Image src={event.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" unoptimized />
          )}
        </button>
        <div className="relative flex flex-col justify-center p-7 sm:p-9">
          <span aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.05]" />
          <span
            className={`kz-label inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-2 text-[0.65rem] ${live ? "bg-[#c6011f] text-white" : "bg-[#ffd27a] text-[#002820]"}`}
          >
            <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-white" : "bg-[#002820]"}`} />
            {live ? "Live right now" : "Next up"}
          </span>
          <h2 className="mt-4 text-[clamp(1.5rem,2.8vw,2.3rem)] font-semibold leading-tight tracking-[-0.02em]">{event.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.88rem] font-semibold text-white/75">
            {event.date && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} /> {formatDate(event.date)}
              </span>
            )}
            {event.speaker && (
              <span className="inline-flex items-center gap-1.5">
                <Mic size={15} /> {event.speaker}
              </span>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {action && (
              <a href={action.href} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--red kz-btn--shine">
                {action.label} <ArrowRight size={17} />
              </a>
            )}
            <button type="button" onClick={() => onOpen(event)} className="kz-btn kz-btn--white">
              Details
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>(() => toEvents(getCachedEvents() || []));
  const [loading, setLoading] = useState(() => !getCachedEvents());
  const [error, setError] = useState<string | null>(null);
  const [top, setTop] = useState<TopTab>("guest-sessions");
  const [sub, setSub] = useState<ArohanSubTab>("arohan-culturals");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EventItem | null>(null);
  const close = useCallback(() => setSelected(null), []);

  useEffect(() => {
    let alive = true;
    fetchEvents()
      .then((rows) => alive && setEvents(toEvents(rows)))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Failed to load events"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const category: Category = top === "arohan" ? sub : (top as Category);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    // A search looks across every tab; otherwise the tab decides.
    let list = q
      ? events.filter((e) => e.title.toLowerCase().includes(q) || e.speaker?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q))
      : events.filter((e) => e.category === category);
    if (status === "upcoming") list = list.filter((e) => e.status === "upcoming" || e.status === "live-now");
    if (status === "past") list = list.filter((e) => e.status === "past-recorded" || e.status === "past-unrecorded");
    return [...list].sort((a, b) => ORDER[a.status] - ORDER[b.status] || toTime(b.date) - toTime(a.date));
  }, [events, category, status, query]);

  const listKey = `${query.trim() ? "search" : category}-${status}`;

  const counts = useMemo(() => {
    const c = (test: (e: EventItem) => boolean) => events.filter(test).length;
    return {
      top: {
        "guest-sessions": c((e) => e.category === "guest-sessions"),
        arohan: c((e) => e.category.startsWith("arohan")),
        "curiosity-hour": c((e) => e.category === "curiosity-hour"),
      } as Record<TopTab, number>,
      soon: c((e) => e.status === "upcoming" || e.status === "live-now"),
      recorded: c((e) => e.status === "past-recorded"),
    };
  }, [events]);

  // The one thing most visitors came for: what is on next.
  const nextUp = useMemo(() => {
    const live = events.find((e) => e.status === "live-now");
    if (live) return live;
    const soon = events.filter((e) => e.status === "upcoming");
    return [...soon].sort((a, b) => (toTime(a.date) || Infinity) - (toTime(b.date) || Infinity))[0] ?? null;
  }, [events]);

  return (
    <div className="kz-font min-h-screen bg-[#f9fbe5] text-[#002820] selection:bg-[#c6011f]/20">
      <KzHeader />
      <main>
        <PageHero
          crumb="Events"
          label="House events"
          title={["What's on in", "the house"]}
          intro="Guest sessions, Aarohan culturals, technicals and e-sports, and Curiosity Hour — join live, or catch the recording."
          stickers={
            loading
              ? []
              : [
                  { value: String(events.length), label: "Events so far", bg: "#dcebd8" },
                  { value: String(counts.soon), label: "Coming up", bg: "#ffd27a" },
                  { value: String(counts.recorded), label: "Recordings", bg: "#c6011f", ink: "#ffffff" },
                ]
          }
        />

        {nextUp && !query && <NextUp event={nextUp} onOpen={setSelected} />}

        {/* ── filters ── */}
        <section className="relative z-30 mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12 lg:sticky lg:top-[calc(var(--kz-header-h)+0.9rem)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:rounded-full lg:bg-[#f9fbe5]/85 lg:py-1 lg:backdrop-blur-md">
            <Segmented id="evt-top" options={TOP_TABS.map((t) => ({ ...t, count: loading ? undefined : counts.top[t.value] }))} value={top} onChange={(v) => setTop(v)} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative block">
                <span className="sr-only">Search events</span>
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#4b6660]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search every event…"
                  className="h-12 w-full rounded-full border border-[#002820]/12 bg-white pl-11 pr-10 text-[0.92rem] font-medium text-[#002820] outline-none transition-[box-shadow,border-color] placeholder:text-[#4b6660]/70 focus:border-[#006255] focus:shadow-[0_0_0_4px_rgba(0,98,85,0.12)] sm:w-72"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#4b6660] hover:bg-[#002820]/5"
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
              <Segmented id="evt-status" options={STATUS_TABS} value={status} onChange={setStatus} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {top === "arohan" && !query && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: SOFT }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-4">
                  {AROHAN_TABS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setSub(t.value)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.85rem] font-semibold transition-all duration-300 ${
                        sub === t.value
                          ? "border-[#c6011f] bg-[#c6011f] text-white shadow-[0_10px_20px_-12px_rgba(198,1,31,0.8)]"
                          : "border-[#002820]/15 bg-white text-[#002820]/75 hover:border-[#002820]/35 hover:text-[#002820]"
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-[0.85rem] font-semibold text-[#4b6660]">
            {loading ? "Loading events…" : `${shown.length} ${shown.length === 1 ? "event" : "events"}${query.trim() ? ` matching “${query.trim()}”` : ""}`}
          </p>
        </section>

        {/* ── grid ── */}
        <section className="mx-auto max-w-[90rem] px-5 pb-24 pt-6 sm:px-8 md:px-12 md:pb-32">
          {error && !loading && (
            <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-[#ffe1e1] p-5 text-[#8a0016]">
              <AlertTriangle size={20} className="shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="overflow-hidden rounded-[1.6rem] border border-[#002820]/10 bg-white">
                  <div className="aspect-[16/9] animate-pulse bg-[#e6eedc]" />
                  <div className="space-y-3 p-6">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-[#e6eedc]" />
                    <div className="h-5 w-4/5 animate-pulse rounded-full bg-[#e6eedc]" />
                    <div className="h-3 w-full animate-pulse rounded-full bg-[#eef3e6]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && (
            <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {shown.map((e, i) => (
                  <EventCard key={`${listKey}-${e.id}`} event={e} index={i} onOpen={setSelected} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && !error && shown.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
              <Image src={RHINO_SRC} alt="" width={220} height={154} className="kz-float opacity-90" />
              <h3 className="mt-6 text-[1.3rem] font-semibold">Nothing here yet</h3>
              <p className="kz-body mt-2 text-[#4b6660]">
                {query ? "No event matches that search — try another word." : "No events in this category right now. Check back soon, or follow us on Instagram for the next poster."}
              </p>
            </motion.div>
          )}
        </section>
      </main>
      <KzFooter />

      <AnimatePresence>{selected && <EventModal event={selected} onClose={close} />}</AnimatePresence>
    </div>
  );
}
