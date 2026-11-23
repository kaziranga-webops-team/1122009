"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { fetchEpisodes, getCachedEpisodes, toDirectImageUrl, type EpisodeRow } from "@/lib/api";

interface Episode {
  number: number;
  title: string;
  hosts: string;
  date: string;
  image: string;
  url: string;
}

function toEpisode(row: EpisodeRow, i: number): Episode {
  return {
    number: Number((row["Episode No."] || "").replace(/\D/g, "")) || i + 1,
    title: row.Title?.trim() || `Episode ${i + 1}`,
    hosts: row.Host?.trim() || "",
    date: row.Date?.trim() || "",
    image: toDirectImageUrl(row.Image_url || ""),
    url: row.Instagram_url?.trim() || "",
  };
}

/**
 * The air date as entered in the portal's date picker (YYYY-MM-DD). Older
 * rows written month/day/year still read the way they always did.
 */
function airDate(d: string): string {
  const fmt = (y: number, m: number, day: number) =>
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(y, m - 1, day));
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (iso) return fmt(+iso[1], +iso[2], +iso[3]);
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d);
  return m ? fmt(+m[3], +m[1], +m[2]) : "";
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Kaziranga Tak is the house's news show, so its page is a television set:
 * the episode plays on a curved tube with a channel bug and a lower third,
 * the knob turns to the channel you pick, static fills the gap between
 * channels, and a breaking-news ticker runs underneath.
 */
export default function TakTV() {
  const [episodes, setEpisodes] = useState<Episode[]>(() => (getCachedEpisodes() || []).map(toEpisode).sort((a, b) => b.number - a.number));
  const [loading, setLoading] = useState(episodes.length === 0);
  const [current, setCurrent] = useState(0);
  const [tuning, setTuning] = useState(false);
  const tuneTimer = useRef<number | undefined>(undefined);
  const tvRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetchEpisodes()
      .then((rows) => alive && setEpisodes(rows.map(toEpisode).sort((a, b) => b.number - a.number)))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
      window.clearTimeout(tuneTimer.current);
    };
  }, []);

  const tune = (i: number, scroll = false) => {
    if (i === current || !episodes[i]) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      setTuning(true);
      window.clearTimeout(tuneTimer.current);
      tuneTimer.current = window.setTimeout(() => setTuning(false), 320);
    }
    setCurrent(i);
    if (scroll) tvRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  };

  const ep = episodes[current];
  // The knob sweeps 270°, one stop per channel, the newest at the far right.
  const stops = Math.max(episodes.length - 1, 1);
  const knobAngle = -135 + ((episodes.length - 1 - current) / stops) * 270;

  const tickerLine = useMemo(
    () => episodes.map((e) => `EP ${pad(e.number)} · ${e.title}${e.hosts ? ` · with ${e.hosts}` : ""}`).join("     ✦     "),
    [episodes],
  );

  if (loading && !ep) {
    return (
      <div className="mx-auto max-w-[90rem] px-5 py-16 sm:px-8 md:px-12">
        <div className="aspect-[4/3] max-w-2xl animate-pulse rounded-[2rem] bg-[#f5e9cf]/10" />
      </div>
    );
  }
  if (!ep) {
    return (
      <p className="mx-auto max-w-[90rem] px-5 py-16 text-[#f5e9cf]/80 sm:px-8 md:px-12">
        No episodes yet. The first one is on its way.
      </p>
    );
  }

  return (
    <>
      <section className="mx-auto max-w-[90rem] px-5 pb-12 pt-10 sm:px-8 md:px-12 md:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
          {/* ─── The set ─── */}
          <div ref={tvRef} className="scroll-mt-24">
            <div className="rounded-[2rem] bg-[#7a4a22] p-3 shadow-[0_40px_60px_-30px_rgba(0,0,0,0.9),inset_0_2px_0_rgba(255,255,255,0.12)] sm:rounded-[2.4rem] sm:p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-[1.5rem] bg-[#5a3418] p-3 sm:gap-4 sm:rounded-[1.9rem] sm:p-4">
                {/* the tube */}
                <div className="kz-crt relative aspect-[4/3] overflow-hidden bg-[#111] [border-radius:14%/18%]" aria-live="polite">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img key={ep.number} src={ep.image} alt={`${ep.title}, with ${ep.hosts}`} className="absolute inset-0 h-full w-full object-cover" />
                  {tuning && <div aria-hidden="true" className="kz-static absolute inset-0 z-20" />}
                  <span className="absolute right-[6%] top-[7%] z-10 rounded-md bg-[#1c130c]/75 px-2 py-1 font-mono text-[0.7rem] font-bold text-[#7CFC8A] sm:text-[0.8rem]">
                    CH {pad(ep.number)}
                  </span>
                  <span className="absolute left-[6%] top-[7%] z-10 grid h-9 w-9 place-items-center rounded-full bg-[#c8102e] text-[0.72rem] font-black text-white sm:h-11 sm:w-11 sm:text-[0.8rem]">
                    KT
                  </span>
                  {/* the lower third */}
                  <div className="absolute inset-x-[5%] bottom-[8%] z-10">
                    <p className="w-fit bg-[#c8102e] px-2.5 py-1 text-[0.7rem] font-bold text-white sm:text-[0.8rem]">Kaziranga Tak</p>
                    <p className="w-fit max-w-full truncate bg-[#f5e9cf] px-2.5 py-1.5 text-[0.85rem] font-bold text-[#1c130c] sm:text-[1.05rem]">
                      {ep.title}
                    </p>
                  </div>
                </div>

                {/* the side panel: speaker and knobs */}
                <div className="flex w-12 flex-col items-center justify-between py-1 sm:w-20">
                  <div
                    aria-hidden="true"
                    className="h-20 w-full rounded-lg sm:h-28"
                    style={{ backgroundImage: "radial-gradient(#2b190b 1.6px, transparent 2px)", backgroundSize: "7px 7px" }}
                  />
                  <button
                    type="button"
                    onClick={() => tune((current + 1) % episodes.length)}
                    aria-label="Next channel"
                    title="Turn to the next channel"
                    className="kz-focus grid h-11 w-11 place-items-center rounded-full bg-[#e9d9b8] shadow-[0_4px_0_#2b190b,inset_0_-3px_0_rgba(0,0,0,0.2)] transition-transform active:translate-y-0.5 sm:h-16 sm:w-16"
                  >
                    <span
                      className="block h-full w-full rounded-full transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.4,0.64,1)]"
                      style={{ transform: `rotate(${knobAngle}deg)` }}
                    >
                      <span className="mx-auto mt-1 block h-3.5 w-1.5 rounded-full bg-[#c8102e] sm:mt-1.5 sm:h-5" />
                    </span>
                  </button>
                  <span aria-hidden="true" className="h-6 w-6 rounded-full bg-[#e9d9b8] shadow-[0_3px_0_#2b190b] sm:h-9 sm:w-9" />
                </div>
              </div>
            </div>
            {/* the legs */}
            <div aria-hidden="true" className="mx-auto flex w-[70%] justify-between">
              <span className="h-5 w-6 bg-[#3a2210] [clip-path:polygon(15%_0,85%_0,100%_100%,0_100%)] sm:h-7" />
              <span className="h-5 w-6 bg-[#3a2210] [clip-path:polygon(15%_0,85%_0,100%_100%,0_100%)] sm:h-7" />
            </div>
          </div>

          {/* ─── What's on ─── */}
          <div>
            <p className="font-semibold text-[#f6b51e]">{current === 0 ? "Latest episode" : `Episode ${ep.number}`}</p>
            <h2 className="kz-display kz-offset mt-2 text-[clamp(2.2rem,4.4vw,3.6rem)] text-[#f5e9cf]" style={{ ["--offset" as string]: "#c8102e" }}>
              {ep.title}
            </h2>
            <p className="kz-lead mt-4 text-[#f5e9cf]/80">
              {ep.hosts ? `Reporting: ${ep.hosts}.` : ""} {airDate(ep.date) && `On air ${airDate(ep.date)}.`}
            </p>
            {ep.url && (
              <a href={ep.url} target="_blank" rel="noopener noreferrer" className="kz-btn kz-focus mt-7 bg-[#f6b51e] text-[#1c130c]">
                <FaInstagram size={17} /> Watch on Instagram
              </a>
            )}

            <div className="mt-9">
              <p className="mb-3 text-[0.95rem] text-[#f5e9cf]/70">Change the channel</p>
              <div role="radiogroup" aria-label="Episodes" className="flex flex-wrap gap-2.5">
                {episodes.map((e, i) => {
                  const on = i === current;
                  return (
                    <button
                      key={e.number}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={`Episode ${e.number}: ${e.title}`}
                      onClick={() => tune(i)}
                      className={`kz-focus h-12 min-w-[3.5rem] rounded-xl px-3 font-mono text-[0.95rem] font-bold transition-[transform,background-color] active:translate-y-0.5 ${
                        on
                          ? "bg-[#f6b51e] text-[#1c130c] shadow-[0_4px_0_#9c5d14]"
                          : "bg-[#f5e9cf]/10 text-[#f5e9cf] shadow-[0_4px_0_rgba(0,0,0,0.5)] hover:bg-[#f5e9cf]/20"
                      }`}
                    >
                      {pad(e.number)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Breaking news ─── */}
      <div className="flex items-stretch overflow-hidden border-y-2 border-[#1c130c] bg-[#c8102e] text-white">
        <span className="z-10 flex shrink-0 items-center bg-[#f6b51e] px-4 text-[0.85rem] font-black text-[#1c130c] sm:px-6 sm:text-[0.95rem]">
          Breaking
        </span>
        <div className="min-w-0 flex-1 overflow-hidden py-3">
          <p className="kz-ticker flex w-max whitespace-nowrap text-[0.95rem] font-semibold" style={{ ["--ticker-s" as string]: `${Math.max(24, episodes.length * 8)}s` }}>
            <span className="pr-12">{tickerLine}</span>
            <span aria-hidden="true" className="pr-12">{tickerLine}</span>
          </p>
        </div>
      </div>

      {/* ─── Every episode ─── */}
      <section className="mx-auto max-w-[90rem] px-5 pb-24 pt-16 sm:px-8 md:px-12 md:pb-32">
        <h2 className="kz-h2 text-[clamp(2rem,3.6vw,3rem)] text-[#f5e9cf]">Every episode</h2>
        <ul className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
          {episodes.map((e, i) => (
            <li key={e.number}>
              <button
                type="button"
                onClick={() => tune(i, true)}
                className="kz-focus group block w-full text-left"
                aria-label={`Put episode ${e.number} on the TV`}
              >
                <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[#f5e9cf]/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute left-2.5 top-2.5 rounded-md bg-[#1c130c]/80 px-2 py-1 font-mono text-[0.75rem] font-bold text-[#7CFC8A]">CH {pad(e.number)}</span>
                  <span className="absolute inset-0 grid place-items-center bg-[#1c130c]/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play size={34} className="text-[#f6b51e]" fill="currentColor" />
                  </span>
                </span>
                <span className="mt-3 block font-semibold text-[#f5e9cf]">{e.title}</span>
                {e.hosts && <span className="block text-[0.88rem] text-[#f5e9cf]/65">{e.hosts}</span>}
              </button>
            </li>
          ))}
        </ul>
        <a
          href="https://www.instagram.com/kaziranga_iitm/"
          target="_blank"
          rel="noopener noreferrer"
          className="kz-focus mt-10 inline-flex items-center gap-1.5 font-semibold text-[#f6b51e] underline-offset-4 hover:underline"
        >
          Follow the house on Instagram for new episodes <ArrowUpRight size={16} />
        </a>
      </section>
    </>
  );
}
