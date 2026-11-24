"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import KzHeader, { JOIN_URL } from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import Ambient from "@/components/kz/Ambient";
import IndiaMeetupMap, { landFill, type Spotlight } from "@/components/meetups/IndiaMeetupMap";
import { fetchMeetups, getCachedMeetups, toDirectImageUrl, type MeetupRow } from "@/lib/api";
import {
  byCity,
  byState,
  formatMeetupDate,
  isUpcoming,
  newestFirst,
  placeKey,
  stateKey,
  toMeetupPins,
  unplaced,
  type MeetupPin,
} from "@/lib/meetups";

const SOFT = [0.22, 1, 0.36, 1] as const;

/** "Uttar Pradesh" -> "uttar-pradesh", for ?state= links people can read. */
const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");

type States = ReturnType<typeof byState>;

/**
 * The meetups page is one open sea with India on it. The first screen is the
 * map and its caption — nothing to scroll past to reach it — and the caption
 * turns into the chosen state when a state is picked. Below the shoreline,
 * the posters: the most colourful thing the house makes.
 */
export default function MeetupsPage() {
  const [rows, setRows] = useState<MeetupRow[]>(() => getCachedMeetups() || []);
  const [loading, setLoading] = useState(rows.length === 0);
  const [focus, setFocus] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [spotlight, setSpotlight] = useState<Spotlight>(null);
  const seaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let alive = true;
    fetchMeetups()
      .then((r) => alive && setRows(r))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const pins = useMemo(() => toMeetupPins(rows).sort(newestFirst), [rows]);
  const missing = useMemo(() => unplaced(rows).length, [rows]);
  const states = useMemo(() => byState(pins), [pins]);
  const cityCount = useMemo(() => new Set(pins.map((p) => `${stateKey(p.state)}|${placeKey(p.city)}`)).size, [pins]);

  // ?state=odisha opens the page on Odisha, so a state can be linked to from
  // an Instagram post. Written back with replaceState: zooming is not a page
  // change, and the back button should leave the page, not unzoom it.
  useEffect(() => {
    if (!states.length || focus) return;
    const want = new URLSearchParams(window.location.search).get("state");
    const hit = want && states.find((s) => slug(s.name) === want);
    if (hit) setFocus(hit.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states.length]);

  const changeFocus = useCallback(
    (key: string | null) => {
      setFocus(key);
      const url = new URL(window.location.href);
      const name = key ? states.find((s) => s.key === key)?.name : null;
      if (name) url.searchParams.set("state", slug(name));
      else url.searchParams.delete("state");
      window.history.replaceState(window.history.state, "", url);
    },
    [states],
  );

  const show = useCallback((key: string) => setSpotlight({ key, nonce: Date.now() }), []);

  /** From the poster strip: back up to the map, then open the meetup on it. */
  const showOnMap = useCallback(
    (key: string) => {
      seaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      show(key);
    },
    [show],
  );

  const focusName = focus ? states.find((s) => s.key === focus)?.name ?? null : null;
  const focusPins = useMemo(() => (focus ? pins.filter((p) => stateKey(p.state) === focus) : []), [focus, pins]);

  const below = focus ? (
    <CityList pins={focusPins} name={focusName} onHover={setHighlight} onShow={show} />
  ) : (
    <StateChips states={states} loading={loading} onPick={changeFocus} />
  );

  return (
    <div className="kz-font min-h-screen bg-[#f5e9cf] text-[#1c130c] selection:bg-[#c8102e]/20">
      <KzHeader ground="color" />
      <main>
        {/* ═══ The sea ═══ */}
        <section
          ref={seaRef}
          className="kz-halftone relative isolate overflow-hidden bg-[#2343b8] pt-[var(--kz-header-h)] text-[#f5e9cf]"
          style={{ ["--dot" as string]: "rgba(10,20,80,0.5)" }}
        >
          <Ambient birds={3} specks={0} seed={11} sky={[4, 28]} />

          {/* grid-cols-1 is not decoration: an implicit column sizes to its
              widest child, and the sideways chip row is very wide. */}
          <div className="mx-auto grid max-w-[90rem] grid-cols-1 px-4 sm:px-8 md:px-12 lg:min-h-[calc(100svh-var(--kz-header-h))] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
            <div className="flex min-w-0 flex-col pt-10 lg:py-14">
              <AnimatePresence mode="wait" initial={false}>
                {focus ? (
                  <StateHead
                    key={focus}
                    name={focusName}
                    count={focusPins.length}
                    cities={byCity(focusPins).length}
                    onBack={() => changeFocus(null)}
                  />
                ) : (
                  <IndiaHead
                    key="india"
                    meetups={pins.length}
                    cities={cityCount}
                    states={states.length}
                    loading={loading}
                  />
                )}
              </AnimatePresence>

              <div className="mt-8 hidden min-h-0 flex-1 lg:block">{below}</div>
              <Credits className="mt-8 hidden lg:block" missing={missing} />
            </div>

            <div className="-mx-4 flex min-w-0 items-center justify-center py-4 sm:mx-0 lg:py-8">
              <IndiaMeetupMap
                pins={pins}
                focus={focus}
                onFocus={changeFocus}
                highlight={highlight}
                spotlight={spotlight}
                // As large as the screen allows: full width on a phone, and on
                // a laptop no taller than the viewport, so the whole of India
                // is in view with the caption beside it.
                className="w-full lg:w-[min(100%,calc((100svh-var(--kz-header-h)-4rem)*0.893))]"
              />
            </div>

            <div className="pb-6 lg:hidden">
              {below}
              <Credits className="mt-8" missing={missing} />
            </div>
          </div>

          {/* The shoreline: the sea ends in a wave, not a ruled edge. */}
          <svg aria-hidden="true" viewBox="0 0 1440 40" preserveAspectRatio="none" className="relative block h-6 w-full sm:h-10">
            <path d="M0 40V24c120-16 240-16 360 0s240 16 360 0 240-16 360 0 240 16 360 0V40z" fill="#f5e9cf" />
          </svg>
        </section>

        <PosterStrip pins={pins.slice(0, 11)} onShow={showOnMap} />
        <HostBand />
      </main>
      <KzFooter />
    </div>
  );
}

/* ═══ Captions ════════════════════════════════════════════════════════ */

const swap = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: SOFT },
};

/** The headline carries the numbers: a sentence, not a row of counters. */
function IndiaHead({
  meetups,
  cities,
  states,
  loading,
}: {
  meetups: number;
  cities: number;
  states: number;
  loading: boolean;
}) {
  const ready = !loading || meetups > 0;
  return (
    <motion.div {...swap}>
      <h1 className="kz-display kz-offset text-[clamp(2.6rem,5.4vw,5.2rem)] text-[#f6b51e]" style={{ ["--offset" as string]: "#e2387a" }}>
        {ready && cities ? (
          <>
            We&rsquo;ve met up in <span className="whitespace-nowrap">{cities} cities</span>
          </>
        ) : (
          "We meet up all over India"
        )}
        <span className="text-[#f5e9cf]">.</span>
      </h1>
      <p className="kz-lead mt-5 max-w-md text-[#f5e9cf]/90">
        {ready && meetups ? `${meetups} meetups across ${states} states so far, ` : "Meetups across India, "}
        each one started by a member who asked who else lived nearby. Tap a pin to see one, or pick a state.
      </p>
    </motion.div>
  );
}

function StateHead({
  name,
  count,
  cities,
  onBack,
}: {
  name: string | null;
  count: number;
  cities: number;
  onBack: () => void;
}) {
  return (
    <motion.div {...swap}>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 font-semibold text-[#f6b51e] transition-colors hover:text-[#f5e9cf]"
      >
        <ArrowLeft size={14} /> All of India
      </button>
      <h1 className="kz-display kz-offset mt-4 text-[clamp(2.6rem,5.4vw,5.2rem)] text-[#f6b51e]" style={{ ["--offset" as string]: "#e2387a" }}>
        {name ?? "This state"}
        <span className="text-[#f5e9cf]">.</span>
      </h1>
      <p className="kz-lead mt-5 max-w-md text-[#f5e9cf]/90">
        {count
          ? `${count} meetup${count === 1 ? "" : "s"} in ${cities} cit${cities === 1 ? "y" : "ies"}. Tap a pin, or a meetup below, to see it.`
          : "No meetups here yet. If you live here, yours could be the first pin."}
      </p>
    </motion.div>
  );
}

/* ═══ Under the caption ═══════════════════════════════════════════════ */

/** Chips, tinted with the state's own colour on the map, so the list doubles
 *  as the map's key. A sideways row on a phone, wrapped on a laptop. */
function StateChips({ states, loading, onPick }: { states: States; loading: boolean; onPick: (key: string) => void }) {
  return (
    <div>
      <p className="text-[0.95rem] text-[#f5e9cf]/80">Pick a state</p>
      <ul className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {loading && states.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="h-9 w-28 shrink-0 animate-pulse bg-[#f5e9cf]/20" />
            ))
          : states.map((s) => (
              <li key={s.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onPick(s.key)}
                  className="group inline-flex items-center gap-2 border-2 border-[#1c130c] bg-[#f5e9cf] py-1.5 pl-2 pr-3 text-[0.82rem] font-semibold text-[#1c130c] transition-colors hover:bg-[#f6b51e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6b51e]"
                >
                  <span className="h-3.5 w-3.5 ring-1 ring-[#1c130c]/40" style={{ background: landFill(s.items.length) }} />
                  {s.name}
                  <span className="tabular-nums text-[#5e4a35]">{s.items.length}</span>
                </button>
              </li>
            ))}
      </ul>
    </div>
  );
}

function CityList({
  pins,
  name,
  onHover,
  onShow,
}: {
  pins: MeetupPin[];
  name: string | null;
  onHover: (key: string | null) => void;
  onShow: (key: string) => void;
}) {
  if (!pins.length) {
    return (
      <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--sm bg-[#f6b51e] text-[#1c130c]">
        Join the house <ArrowRight size={15} />
      </a>
    );
  }
  const cities = byCity(pins);
  return (
    <div
      aria-label={`Meetups in ${name ?? "this state"}`}
      // On a laptop the list scrolls inside the first screen, so the map
      // never moves while it is being read.
      className="border-2 border-[#1c130c] bg-[#f5e9cf] p-2 text-[#1c130c] lg:max-h-[min(40vh,26rem)] lg:overflow-y-auto"
    >
      {cities.map((c) => (
        <section key={c.key} className="px-2 py-2">
          <h2 className="flex items-center gap-2 pb-1">
            <MapPin size={13} className="text-[#c8102e]" />
            <span className="kz-h3 text-[0.74rem]">{c.name}</span>
            <span className="ml-auto text-[0.74rem] font-bold tabular-nums text-[#5e4a35]">{c.items.length}</span>
          </h2>
          <ul>
            {[...c.items].sort(newestFirst).map((m) => (
              <li key={m.key}>
                <button
                  type="button"
                  onPointerEnter={() => onHover(m.key)}
                  onPointerLeave={() => onHover(null)}
                  onFocus={() => onHover(m.key)}
                  onBlur={() => onHover(null)}
                  onClick={() => onShow(m.key)}
                  className="group flex w-full items-baseline gap-3 px-2 py-1.5 text-left transition-colors hover:bg-[#f6b51e]/40"
                >
                  <span className="kz-sign w-[5.4rem] shrink-0 text-[0.72rem] tabular-nums text-[#c8102e]">
                    {formatMeetupDate(m.date)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.88rem] font-semibold">{m.venue}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Credits({ className = "", missing }: { className?: string; missing: number }) {
  const link = "underline decoration-[#f5e9cf]/40 underline-offset-2 hover:decoration-[#f5e9cf]";
  return (
    <p className={`max-w-md text-[0.7rem] leading-relaxed text-[#f5e9cf]/70 ${className}`}>
      {missing > 0 && (
        <>
          {missing} meetup{missing === 1 ? " has" : "s have"} no location yet and {missing === 1 ? "is" : "are"} not shown.{" "}
        </>
      )}
      Boundaries:{" "}
      <a href="https://github.com/datameet/maps" target="_blank" rel="noopener noreferrer" className={link}>
        DataMeet India
      </a>{" "}
      (CC BY 4.0, CC BY 2.5 IN), as per the Survey of India. Locations ©{" "}
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className={link}>
        OpenStreetMap contributors
      </a>
      .
    </p>
  );
}

/* ═══ Posters ═════════════════════════════════════════════════════════ */

/**
 * The newest meetup gets the room: its poster large, beside what happened and
 * where. The ten before it follow as a poster grid.
 */
function PosterStrip({ pins, onShow }: { pins: MeetupPin[]; onShow: (key: string) => void }) {
  if (!pins.length) return null;
  const [latest, ...rest] = pins;
  return (
    <section className="bg-[#f5e9cf]">
      <div className="mx-auto max-w-[90rem] px-5 pt-16 sm:px-8 md:px-12 md:pt-24">
        <LatestMeetup m={latest} onShow={onShow} />
      </div>

      {rest.length > 0 && (
        <>
          <div className="mx-auto flex max-w-[90rem] flex-wrap items-end justify-between gap-4 px-5 pb-6 pt-16 sm:px-8 md:px-12">
            <h2 className="kz-h2 text-[clamp(2rem,3.6vw,3rem)]">Before that</h2>
            <Link href="/gallery?tab=meetups" className="kz-focus inline-flex items-center gap-1.5 font-semibold text-[#c8102e] underline-offset-4 hover:underline">
              Every poster, by region <ArrowRight size={16} />
            </Link>
          </div>
          <ul className="mx-auto flex max-w-[90rem] snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-20 [scrollbar-width:none] sm:px-8 md:px-12 md:pb-28 lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible">
            {rest.map((m) => (
              <li key={m.key} className="w-[62%] shrink-0 snap-start sm:w-[38%] lg:w-auto">
                <PosterCard m={m} onShow={onShow} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Sheet entries are typed by hand; start each line with a capital. */
const cap = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

function LatestMeetup({ m, onShow }: { m: MeetupPin; onShow: (key: string) => void }) {
  const [failed, setFailed] = useState(false);
  const src = m.poster ? toDirectImageUrl(m.poster) : "";
  const place = [m.city, m.state].filter(Boolean).join(", ");
  return (
    <article className="grid items-center gap-8 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:gap-14">
      <div className="relative mx-auto w-full max-w-[22rem] rotate-[-2deg]">
        <span className="relative block aspect-[4/5] overflow-hidden border-2 border-[#1c130c] bg-[#ebd9b2] shadow-[10px_10px_0_#c8102e]">
          {src && !failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={`Poster for the meetup in ${m.city}`} onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="kz-cloth absolute inset-0 grid place-items-center bg-[#c8102e] p-6 text-center">
              <span className="kz-h3 text-white/85">{m.city}</span>
            </span>
          )}
        </span>
      </div>
      <div>
        <p className="font-semibold text-[#c8102e]">
          {isUpcoming(m) ? "Coming up · " : "Latest meetup · "}
          {formatMeetupDate(m.date) || "Date to come"}
        </p>
        <h2 className="kz-display kz-offset mt-3 text-[clamp(2.6rem,5.4vw,4.8rem)]" style={{ ["--offset" as string]: "#f6b51e" }}>
          {m.city || m.venue}
        </h2>
        <p className="kz-lead mt-4 max-w-xl text-[#5e4a35]">
          {cap(m.venue && m.venue !== m.city ? `${m.venue}, ${m.state}` : place)}. Members from the {cap(m.region || "local")} zone met up here.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={() => onShow(m.key)} className="kz-btn kz-focus bg-[#1c130c] text-[#f6b51e]">
            <MapPin size={16} /> Show on the map
          </button>
          {m.instagram && (
            <a href={m.instagram} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--outline kz-focus text-[#1c130c]">
              See the post <ArrowRight size={16} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function PosterCard({ m, onShow }: { m: MeetupPin; onShow: (key: string) => void }) {
  const [failed, setFailed] = useState(false);
  const src = m.poster ? toDirectImageUrl(m.poster) : "";
  return (
    <button
      type="button"
      onClick={() => onShow(m.key)}
      aria-label={`${m.venue}, ${formatMeetupDate(m.date)} — show on the map`}
      className="group block w-full text-left outline-none"
    >
      <span className="relative block aspect-[4/5] overflow-hidden border-2 border-[#1c130c] bg-[#ebd9b2] transition-[transform,box-shadow] duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0_#c8102e] group-focus-visible:shadow-[6px_6px_0_#c8102e]">
        {src && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="kz-cloth absolute inset-0 grid place-items-center bg-[#c8102e] p-6 text-center">
            <span className="kz-h3 text-white/85">{m.city}</span>
          </span>
        )}
        <span className="kz-sign kz-signboard absolute bottom-3 left-0 inline-flex items-center gap-1.5 bg-[#f6b51e] py-1.5 pl-3 pr-6 text-[0.8rem] font-semibold text-[#1c130c] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <MapPin size={12} /> Show on map
        </span>
      </span>
      <span className="mt-4 flex items-center gap-2">
        {isUpcoming(m) && (
          <span className="rounded-full bg-[#c8102e] px-2 py-0.5 text-[0.75rem] font-semibold text-white">Upcoming</span>
        )}
        <span className="text-[0.85rem] font-semibold text-[#c8102e]">{formatMeetupDate(m.date)}</span>
      </span>
      <span className="kz-serif mt-1.5 line-clamp-2 block text-[1.1rem] leading-snug">{m.venue}</span>
      <span className="mt-1 block text-[0.78rem] font-medium text-[#5e4a35]">{[m.city, m.state].filter(Boolean).join(", ")}</span>
    </button>
  );
}

/* ═══ Closing band ════════════════════════════════════════════════════ */

function HostBand() {
  return (
    <section className="kz-cloth bg-[#c8102e] text-[#f5e9cf]">
      <div className="mx-auto flex max-w-[90rem] flex-col items-start gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-end md:justify-between md:px-12 md:py-20">
        <div>
          <h2 className="kz-h2 kz-offset max-w-[14ch] text-[#f6b51e]" style={{ ["--offset" as string]: "#1c130c" }}>Put your city on the map</h2>
          <p className="kz-lead mt-5 max-w-xl text-[#f5e9cf]/90">
            Every pin above started with one member asking who else lived nearby. Join the house and start the next one.
          </p>
        </div>
        <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="kz-btn kz-focus shrink-0 bg-[#f6b51e] text-[#1c130c]">
          Join the house <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}
