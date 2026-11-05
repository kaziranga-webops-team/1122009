"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, CalendarDays, Mic, Youtube } from "lucide-react";
import { fetchEvents, getCachedEvents, toDirectImageUrl, type EventRow } from "@/lib/api";
import { SectionHead } from "@/components/home/sections";

type Status = "upcoming" | "live-now" | "past-recorded" | "past-unrecorded";

type Card = {
  id: string;
  title: string;
  status: Status;
  date: string;
  speaker: string;
  description: string;
  image: string;
  youtube: string;
  meet: string;
};

const BADGE: Record<Status, { label: string; className: string }> = {
  "live-now": { label: "Live now", className: "bg-[#c10021] text-white" },
  upcoming: { label: "Upcoming", className: "bg-[#002820] text-[#f9fbe5]" },
  "past-recorded": { label: "Recorded", className: "bg-[#dcebd8] text-[#1d3d35]" },
  "past-unrecorded": { label: "Not recorded", className: "bg-[#e7e7d8] text-[#3f5a52]" },
};

function toStatus(raw: string): Status {
  const s = (raw || "").trim().toLowerCase().replace(/\s+/g, "-");
  if (s === "live-now" || s === "past-recorded" || s === "past-unrecorded") return s;
  return "upcoming";
}

/** The sheet gives dates in mixed formats; show what parses, else the raw string. */
function formatDate(value: string): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function toCard(row: EventRow, i: number): Card {
  return {
    id: `${row.Title}-${i}`,
    title: (row.Title || "").trim(),
    status: toStatus(row.status),
    date: formatDate(row.Date),
    speaker: (row.Speaker || "").trim(),
    description: (row.description || "").trim(),
    image: toDirectImageUrl(row.Image_url || ""),
    youtube: (row.youtube_url || "").trim(),
    meet: (row.meet_link || "").trim(),
  };
}

/** Live and upcoming first, then the recordings. */
const ORDER: Record<Status, number> = { "live-now": 0, upcoming: 1, "past-recorded": 2, "past-unrecorded": 3 };

function EventCard({ event }: { event: Card }) {
  const badge = BADGE[event.status];
  const isLive = event.status === "live-now" || event.status === "upcoming";
  const href = isLive ? event.meet : event.youtube;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-[#002820]/10 bg-[#eef1dc]">
      <div className="relative aspect-[16/9] shrink-0 bg-[#dcebd8]">
        {event.image && <Image src={event.image} alt="" fill sizes="420px" className="object-cover" unoptimized />}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className={`kz-label rounded-full px-3 py-1.5 text-[0.65rem] ${badge.className}`}>{badge.label}</span>
          {event.date && (
            <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#3f5a52]">
              <CalendarDays size={14} />
              {event.date}
            </span>
          )}
        </div>

        <h3 className="kz-h3 mt-4 text-[1.05rem] normal-case tracking-normal">{event.title}</h3>

        {event.speaker && (
          <p className="mt-3 inline-flex max-w-full items-center gap-2 self-start rounded-full bg-[#f9fbe5] px-3 py-1.5 text-[0.78rem] font-semibold text-[#1d3d35]">
            <Mic size={13} className="shrink-0 text-[#006255]" />
            <span className="truncate">{event.speaker}</span>
          </p>
        )}

        {event.description && <p className="kz-body mt-3 line-clamp-3 text-[#3f5a52]">{event.description}</p>}

        {href && (
          // mt-auto on the wrapper, not the button: it pins the CTA to the
          // card's floor so a short description and a long one still line up.
          <div className="mt-auto pt-5">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`kz-btn kz-btn--sm ${isLive ? "kz-btn--forest" : "kz-btn--red"}`}
            >
              {isLive ? "Join session" : <><Youtube size={15} /> Watch on YouTube</>}
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

export default function KzEvents() {
  const [events, setEvents] = useState<Card[]>(() => (getCachedEvents() || []).map(toCard));
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [snaps, setSnaps] = useState<number[]>([]);
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchEvents()
      .then((rows) => {
        if (alive) setEvents(rows.map(toCard));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const sync = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    setSnaps(embla.scrollSnapList());
    sync();
    embla.on("select", sync).on("reInit", () => {
      setSnaps(embla.scrollSnapList());
      sync();
    });
  }, [embla, sync]);

  // Cards arrive after the first paint, so the carousel has to re-measure.
  useEffect(() => {
    embla?.reInit();
  }, [embla, events.length]);

  const shown = [...events]
    .filter((e) => e.title)
    .sort((a, b) => ORDER[a.status] - ORDER[b.status])
    .slice(0, 9);

  return (
    <section id="events" className="kz-font bg-[#f9fbe5] text-[#002820]">
      <SectionHead
        label="House events"
        title={["Events &", "sessions"]}
        intro="Catch up on the latest guest sessions, Community Day, Aarohan and Curiosity Hour."
      />

      {shown.length > 0 && (
        <>
          <div className="overflow-hidden px-5 sm:px-8 md:px-12" ref={emblaRef}>
            <div className="flex gap-5">
              {shown.map((e) => (
                <div
                  key={e.id}
                  className="min-w-0 shrink-0 grow-0 basis-[86%] sm:basis-[48%] lg:basis-[32%] xl:basis-[24%]"
                >
                  <EventCard event={e} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-9 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous events"
              disabled={!canPrev}
              onClick={() => embla?.scrollPrev()}
              className="grid h-12 w-12 place-items-center rounded-full border border-[#002820]/25 transition-colors enabled:hover:bg-[#002820] enabled:hover:text-[#f9fbe5] disabled:opacity-30"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
              {snaps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => embla?.scrollTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === selected ? "w-7 bg-[#006255]" : "w-2 bg-[#002820]/25 hover:bg-[#002820]/45"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="More events"
              disabled={!canNext}
              onClick={() => embla?.scrollNext()}
              className="grid h-12 w-12 place-items-center rounded-full border border-[#002820]/25 transition-colors enabled:hover:bg-[#002820] enabled:hover:text-[#f9fbe5] disabled:opacity-30"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}

      <div className="flex justify-center px-5 pb-20 pt-10 md:pb-28">
        <Link href="/events" className="kz-btn kz-btn--forest">
          See every event <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
