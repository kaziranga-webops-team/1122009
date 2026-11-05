"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLenis } from "lenis/react";
import { AlertTriangle, ArrowRight, ArrowUpRight, CalendarDays, Mic, Play, Search, Trophy, X } from "lucide-react";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import { Segmented } from "@/components/kz/PageHero";
import CommunityPatch from "@/components/communities/CommunityPatch";
import { RHINO_SRC } from "@/components/kz/Scene";
import { fetchEvents, getCachedEvents } from "@/lib/api";
import { communityBySlug, type Community } from "@/lib/communities";
import { formatDate, hasResults, isSoon, parseDate, primaryAction, seriesLabel, toEvents, toTime, type EventItem } from "@/lib/events";

type Tab = "guest-sessions" | "curiosity-hour" | "aarohan" | "communities";

const SOFT = [0.22, 1, 0.36, 1] as const;

const inTab = (e: EventItem, t: Tab) =>
  (t === "aarohan" && e.category.startsWith("arohan")) || (t === "communities" && e.category === "community") || e.category === t;

/** Who an event belongs to: a community slug, or the raw organiser name. */
const organiserKey = (e: EventItem) => e.community?.slug ?? e.organiser ?? "";

/* ═══ Coming up: ticket stubs ═════════════════════════════════════ */

function Ticket({ event, onOpen, index }: { event: EventItem; onOpen: (e: EventItem) => void; index: number }) {
  const reduce = useReducedMotion();
  const d = parseDate(event.date);
  const live = event.status === "live-now";
  const action = primaryAction(event);

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 24, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.1 + index * 0.08 }}
      className="group relative flex min-h-[11rem] overflow-hidden rounded-[1.25rem] bg-[#eef1dc] shadow-[0_18px_30px_-24px_rgba(0,40,32,0.6)]"
    >
      {/* the stub: the date, torn off along the dotted line */}
      <div className={`relative flex w-[6.25rem] shrink-0 flex-col items-center justify-center gap-1 px-3 text-center sm:w-[7rem] ${live ? "bg-[#c10021] text-white" : "bg-[#006255] text-[#f9fbe5]"}`}>
        {live ? (
          <>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
            <span className="kz-label mt-1 text-[0.7rem]">Live now</span>
          </>
        ) : d ? (
          <>
            <span className="kz-label text-[0.66rem] text-[#ecd394]">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
            <span className="kz-serif text-[2.8rem] leading-none">{d.getDate()}</span>
            <span className="text-[0.72rem] font-semibold opacity-80">{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
          </>
        ) : (
          <span className="kz-serif text-[1.3rem]">Soon</span>
        )}
      </div>
      <span aria-hidden="true" className="absolute bottom-0 left-[6.25rem] top-0 border-l-2 border-dashed border-[#f9fbe5]/90 sm:left-[7rem]" />
      <span aria-hidden="true" className="absolute -top-3 left-[calc(6.25rem-0.75rem)] h-6 w-6 rounded-full bg-[#f9fbe5] sm:left-[calc(7rem-0.75rem)]" />
      <span aria-hidden="true" className="absolute -bottom-3 left-[calc(6.25rem-0.75rem)] h-6 w-6 rounded-full bg-[#f9fbe5] sm:left-[calc(7rem-0.75rem)]" />

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5 pl-6 sm:p-6 sm:pl-7">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#006255]">{seriesLabel(event)}</p>
          <h3 className="kz-serif mt-1.5 text-[1.35rem] leading-snug">{event.title}</h3>
          {event.speaker && (
            <p className="mt-1.5 flex items-center gap-1.5 truncate text-[0.85rem] font-medium text-[#3f5a52]">
              <Mic size={13} className="shrink-0" /> {event.speaker}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {action && (
            <a href={action.href} target="_blank" rel="noopener noreferrer" className={`kz-btn kz-btn--sm ${action.kind === "live" ? "kz-btn--red" : "kz-btn--forest"}`}>
              {action.label} <ArrowUpRight size={15} />
            </a>
          )}
          <button type="button" onClick={() => onOpen(event)} className="kz-btn kz-btn--sm kz-btn--outline">
            Details
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ═══ Event card ═══════════════════════════════════════════════════ */

function EventCard({ event, index, onOpen }: { event: EventItem; index: number; onOpen: (e: EventItem) => void }) {
  const reduce = useReducedMotion();
  const [broken, setBroken] = useState(false);
  const d = parseDate(event.date);
  const c = event.community;

  return (
    <motion.article
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.5, delay: Math.min(index, 10) * 0.035, ease: SOFT }}
      className="group relative flex h-full flex-col rounded-[1.35rem] border border-[#002820]/10 bg-[#eef1dc] transition-[transform,box-shadow,border-color] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[#006255]/30 hover:shadow-[0_24px_40px_-30px_rgba(0,40,32,0.6)]"
    >
      {/* the poster, set inside a soft frame */}
      <div className="relative m-2 mb-0 aspect-[16/9] overflow-hidden rounded-[1rem]" style={{ background: c?.bg ?? "#dcebd8" }}>
        {event.imageUrl && !broken ? (
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            unoptimized
            onError={() => setBroken(true)}
          />
        ) : c ? (
          <span className="grid h-full w-full place-items-center">
            <CommunityPatch c={c} size={76} />
          </span>
        ) : (
          <span className="grid h-full w-full place-items-center">
            <CalendarDays size={36} className="text-[#006255]/45" />
          </span>
        )}
        {hasResults(event) && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#ecd394] px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-wider text-[#002820] shadow-sm">
            <Trophy size={12} /> Results
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-4">
        {/* a small calendar tile, pinned to the edge of the poster */}
        {d && (
          <span className="absolute -top-7 left-5 flex w-12 flex-col items-center overflow-hidden rounded-xl bg-[#f9fbe5] text-center shadow-[0_8px_16px_-10px_rgba(0,40,32,0.6)] ring-1 ring-[#002820]/10">
            <span className="w-full bg-[#006255] py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-[#f9fbe5]">
              {d.toLocaleDateString("en-IN", { month: "short" })}
            </span>
            <span className="kz-serif pt-0.5 text-[1.3rem] leading-tight text-[#002820]">{d.getDate()}</span>
            <span className="pb-1 text-[0.58rem] font-bold text-[#3f5a52]">{d.getFullYear()}</span>
          </span>
        )}
        <span className={`text-[0.7rem] font-bold uppercase tracking-[0.13em] text-[#006255] ${d ? "pl-16" : ""}`}>
          {seriesLabel(event)}
        </span>
        <h3 className="kz-serif mt-3 line-clamp-2 text-[1.2rem] leading-snug text-[#002820]">
          {/* the whole card opens the details; this is its one real control */}
          <button type="button" onClick={() => onOpen(event)} className="kz-focus text-left after:absolute after:inset-0 after:rounded-[1.35rem]">
            {event.title}
          </button>
        </h3>
        {event.speaker && (
          <p className="mt-1.5 flex items-center gap-1.5 truncate text-[0.84rem] font-medium text-[#3f5a52]">
            <Mic size={13} className="shrink-0" /> <span className="truncate">{event.speaker}</span>
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          {event.youtubeLink ? (
            // YouTube red, so a recording reads as a video at a glance
            <a
              href={event.youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="kz-focus relative z-10 inline-flex items-center gap-2 rounded-full bg-[#ff0000] py-2 pl-2 pr-4 text-[0.82rem] font-bold text-white transition-transform duration-300 hover:scale-[1.03]"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20">
                <Play size={12} fill="currentColor" className="translate-x-px" />
              </span>
              Watch
            </a>
          ) : (
            <span className="text-[0.8rem] font-semibold text-[#3f5a52]/80">{event.status === "past-unrecorded" ? "Not recorded" : "Recording soon"}</span>
          )}
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[#002820]/15 text-[#002820] transition-[background-color,color,border-color,transform] duration-300 group-hover:border-[#006255] group-hover:bg-[#006255] group-hover:text-[#f9fbe5]">
            <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:rotate-45" />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

/* ═══ Detail sheet ═════════════════════════════════════════════════ */

function Results({ event }: { event: EventItem }) {
  const rows = [
    { medal: "🥇", role: "Winner", name: event.winner },
    { medal: "🥈", role: "1st runner-up", name: event.runnerUp1 },
    { medal: "🥉", role: "2nd runner-up", name: event.runnerUp2 },
    { medal: "🎖️", role: "Honourable mentions", name: event.honourableMentions },
  ].filter((r) => r.name);
  if (!rows.length) return null;
  return (
    <div className="mt-6 rounded-[1rem] border border-[#c9a24a]/45 bg-[#eef1dc] p-5">
      <p className="kz-label flex items-center gap-2 text-[#8a6522]">
        <Trophy size={14} /> Results
      </p>
      <ul className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <li key={r.role} className="flex items-start gap-3">
            <span className="text-xl leading-none">{r.medal}</span>
            <span>
              <span className="kz-label block text-[0.6rem] text-[#8a6522]">{r.role}</span>
              <span className="font-semibold text-[#002820]">{r.name}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventModal({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const lenis = useLenis();
  const action = primaryAction(event);
  const c = event.community;

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
      className="kz-font fixed inset-0 z-[70] flex items-end justify-center bg-[#002820]/55 backdrop-blur-sm sm:items-center sm:p-6"
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
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.45, ease: SOFT }}
        onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-[92svh] w-full max-w-5xl overflow-y-auto rounded-t-[1.75rem] bg-[#f9fbe5] text-[#002820] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)] sm:rounded-[1.75rem] md:grid-cols-[1.05fr_1fr] md:overflow-hidden"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="kz-focus absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[#002820] shadow transition-transform duration-300 hover:rotate-90"
        >
          <X size={20} />
        </button>

        <div className="relative min-h-[14rem] md:min-h-full" style={{ background: c?.bg ?? "#dcebd8" }}>
          {event.imageUrl ? (
            <Image src={event.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 520px" className="object-cover" unoptimized />
          ) : c ? (
            <span className="grid h-full min-h-[14rem] w-full place-items-center">
              <CommunityPatch c={c} size={120} />
            </span>
          ) : (
            <span className="grid h-full w-full place-items-center">
              <CalendarDays size={56} className="text-[#006255]/40" />
            </span>
          )}
        </div>

        <div className="p-6 sm:p-8 md:max-h-[86svh] md:overflow-y-auto">
          <p className="pr-12 text-[0.74rem] font-bold uppercase tracking-[0.14em] text-[#006255]">
            {seriesLabel(event)}
            {event.date && <span className="text-[#3f5a52]"> · {formatDate(event.date)}</span>}
          </p>
          <h2 className="kz-serif mt-3 text-[clamp(1.5rem,3vw,2.1rem)]">{event.title}</h2>
          {event.speaker && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#eef1dc] px-3.5 py-2 text-[0.85rem] font-semibold text-[#1d3d35]">
              <Mic size={14} className="text-[#006255]" /> {event.speaker}
            </p>
          )}
          <Results event={event} />
          {event.description && <p className="kz-body mt-5 whitespace-pre-line text-[#36524b]">{event.description}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            {action && (
              <a
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`kz-btn ${action.kind === "join" ? "kz-btn--forest" : "kz-btn--red"}`}
              >
                {action.kind === "watch" && <Play size={15} fill="currentColor" />}
                {action.label}
              </a>
            )}
            {c && (
              <Link href="/communities" className="kz-btn kz-btn--outline">
                More from {c.name} <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══ Page ═════════════════════════════════════════════════════════ */

type Section = { key: string; label: string; items: EventItem[] };

/** Newest first; events without a date go to the end. */
const newestFirst = (a: EventItem, b: EventItem) => (toTime(b.date) || -Infinity) - (toTime(a.date) || -Infinity);

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>(() => toEvents(getCachedEvents() || []));
  const [loading, setLoading] = useState(() => !getCachedEvents());
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("guest-sessions");
  const [onlyCommunity, setOnlyCommunity] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EventItem | null>(null);
  const close = useCallback(() => setSelected(null), []);

  useEffect(() => {
    let alive = true;
    fetchEvents()
      .then((rows) => alive && setEvents(toEvents(rows)))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Couldn't load events. Refresh to try again."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // /events?community=binary-minds opens straight onto that community's events
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("community");
    if (slug && communityBySlug(slug)) {
      setTab("communities");
      setOnlyCommunity(slug);
    }
  }, []);

  const soon = useMemo(
    () => events.filter(isSoon).sort((a, b) => (a.status === "live-now" ? -1 : 0) - (b.status === "live-now" ? -1 : 0) || (toTime(a.date) || Infinity) - (toTime(b.date) || Infinity)),
    [events],
  );

  const counts = useMemo(() => {
    const n = (t: Tab) => events.filter((e) => inTab(e, t)).length;
    return { guest: n("guest-sessions"), curiosity: n("curiosity-hour"), aarohan: n("aarohan"), communities: n("communities") };
  }, [events]);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      // a search looks across every tab, and shows one list of matches
      const hits = events.filter((e) => [e.title, e.speaker, e.description, seriesLabel(e)].some((s) => s?.toLowerCase().includes(q)));
      return hits.length ? [{ key: "search", label: `${hits.length} ${hits.length === 1 ? "match" : "matches"}`, items: hits.sort(newestFirst) }] : [];
    }
    let list = events.filter((e) => !isSoon(e) && inTab(e, tab));
    if (tab === "communities" && onlyCommunity) list = list.filter((e) => organiserKey(e) === onlyCommunity);
    return list.length ? [{ key: tab, label: "", items: list.sort(newestFirst) }] : [];
  }, [events, tab, onlyCommunity, query]);

  const shownCount = sections.reduce((n, s) => n + s.items.length, 0);
  const focused = onlyCommunity ? communityBySlug(onlyCommunity) : undefined;
  let tile = 0;

  return (
    <div className="kz-font kz-paper min-h-screen bg-[#f9fbe5] text-[#002820] selection:bg-[#c10021]/20">
      <KzHeader />
      <main className="pt-[var(--kz-header-h)]">
        {/* ── a one-line title, and the search ── */}
        <section className="mx-auto flex max-w-[90rem] flex-wrap items-end justify-between gap-x-8 gap-y-4 px-5 pb-6 pt-8 sm:px-8 md:px-12 md:pt-12">
          <h1 className="kz-serif flex items-baseline gap-4 text-[clamp(2.4rem,5vw,4rem)] leading-none">
            Events
            {!loading && (
              <span className="-rotate-3 text-[clamp(1.2rem,2vw,1.6rem)] font-normal text-[#8a6522] [font-family:Caveat,cursive]">{events.length} and counting!</span>
            )}
          </h1>
          <label className="relative block w-full sm:w-80">
            <span className="sr-only">Search events</span>
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#3f5a52]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events or speakers"
              className="h-12 w-full rounded-full border border-[#002820]/12 bg-white/70 pl-11 pr-10 text-[0.92rem] font-medium outline-none transition-[box-shadow,border-color] placeholder:text-[#3f5a52]/75 focus:border-[#006255] focus:shadow-[0_0_0_4px_rgba(0,98,85,0.12)]"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#3f5a52] hover:bg-[#002820]/5">
                <X size={15} />
              </button>
            )}
          </label>
        </section>

        {/* ── coming up ── */}
        {soon.length > 0 && !query && (
          <section className="mx-auto max-w-[90rem] px-5 pb-10 sm:px-8 md:px-12">
            <p className="kz-eyebrow mb-4">Coming up</p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {soon.map((e, i) => (
                <Ticket key={e.id} event={e} index={i} onOpen={setSelected} />
              ))}
            </div>
          </section>
        )}

        {/* ── the four kinds of event ── */}
        {!query && (
          <section className="relative mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
            <Segmented
              id="evt-tab"
              value={tab}
              onChange={(v) => {
                setTab(v);
                setOnlyCommunity(null);
              }}
              options={[
                { label: "Guest sessions", value: "guest-sessions", count: loading ? undefined : counts.guest },
                { label: "Curiosity Hour", value: "curiosity-hour", count: loading ? undefined : counts.curiosity },
                { label: "Aarohan", value: "aarohan", count: loading ? undefined : counts.aarohan },
                { label: "Communities", value: "communities", count: loading ? undefined : counts.communities },
              ]}
            />
            {focused && (
              <button
                type="button"
                onClick={() => setOnlyCommunity(null)}
                className="kz-focus ml-2 mt-3 inline-flex items-center gap-2 rounded-full border border-[#006255] bg-[#006255] py-1.5 pl-1.5 pr-3 text-[0.85rem] font-semibold text-[#f9fbe5] lg:mt-0"
              >
                <CommunityPatch c={focused} size={26} /> {focused.name} <X size={14} />
              </button>
            )}
          </section>
        )}

        {/* ── the sections ── */}
        <section className="mx-auto max-w-[90rem] px-5 pb-24 pt-10 sm:px-8 md:px-12 md:pb-32">
          {error && !loading && (
            <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[#c10021]/25 p-5 text-[#8a0016]">
              <AlertTriangle size={20} className="shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="rounded-[1.35rem] border border-[#002820]/10 bg-[#eef1dc] p-2">
                  <div className="aspect-[16/9] animate-pulse rounded-[1rem] bg-[#e2ead6]" />
                  <div className="space-y-2.5 p-4">
                    <div className="h-3 w-16 animate-pulse rounded-full bg-[#e2ead6]" />
                    <div className="h-5 w-4/5 animate-pulse rounded-full bg-[#e2ead6]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-14">
              {sections.map((s) => (
                <div key={`${tab}-${s.key}`}>
                  {s.label && (
                  <div className="mb-8 flex items-center gap-4">
                    <h2 className="kz-serif shrink-0 text-[1.6rem]">{s.label}</h2>
                    <span className="h-px flex-1 bg-[#002820]/12" />
                    <span className="shrink-0 rounded-full bg-[#eef1dc] px-2.5 py-1 text-[0.78rem] font-bold text-[#3f5a52]">{s.items.length}</span>
                  </div>
                  )}
                  <motion.div layout className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {s.items.map((e) => (
                        <EventCard key={e.id} event={e} index={tile++} onOpen={setSelected} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && shownCount === 0 && (
            <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
              <Image src={RHINO_SRC} alt="" width={200} height={140} className="kz-float" />
              <h3 className="kz-serif mt-6 text-[1.4rem]">{query ? `Nothing matches “${query}”` : "Nothing here yet"}</h3>
              <p className="kz-body mt-2 text-[#3f5a52]">{query ? "Try a speaker's name or a shorter word." : "The next one will show up here."}</p>
            </div>
          )}
        </section>
      </main>
      <KzFooter />

      <AnimatePresence>{selected && <EventModal event={selected} onClose={close} />}</AnimatePresence>
    </div>
  );
}
