"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Video,
  ExternalLink,
  Radio,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Mic2,
  X
} from "lucide-react";
import { fetchEvents, getCachedEvents, toDirectImageUrl, type EventRow } from "@/lib/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// ─── Types ───────────────────────────────────────────────────────────
type Category = "guest-sessions" | "arohan-culturals" | "arohan-technicals" | "arohan-esports" | "curiosity-hour";
type Status = "upcoming" | "past-recorded" | "past-unrecorded" | "live-now";

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
function mapRowToEvent(row: EventRow, index: number): EventItem | null {
  const rawCategory = (row.Category || "").trim().toLowerCase();
  let category: Category;
  if (rawCategory.includes("guest") || rawCategory.includes("live")) {
    category = "guest-sessions";
  } else if (rawCategory.includes("cultural") || rawCategory.includes("cultur") || rawCategory === "aarohan" || rawCategory === "arohan") {
    category = "arohan-culturals";
  } else if (rawCategory.includes("technical") || rawCategory.includes("technic") || rawCategory.includes("tech")) {
    category = "arohan-technicals";
  } else if (rawCategory.includes("sports") || rawCategory.includes("sport") || rawCategory.includes("game")) {
    category = "arohan-esports";
  } else if (rawCategory.includes("curiosity") || rawCategory.includes("curosity")) {
    category = "curiosity-hour";
  } else {
    // If it contains aarohan/arohan but no specific category, fallback to cultural so it doesn't break/skip
    if (rawCategory.includes("aarohan") || rawCategory.includes("arohan")) {
      category = "arohan-culturals";
    } else {
      return null; // Unknown category — skip row
    }
  }

  const rawStatus = (row.status || "").trim().toLowerCase().replace(/\s+/g, "-");
  let status: Status;
  if (rawStatus === "upcoming") {
    status = "upcoming";
  } else if (rawStatus === "live-now") {
    status = "live-now";
  } else if (rawStatus === "past-recorded") {
    status = "past-recorded";
  } else if (rawStatus === "past-unrecorded") {
    status = "past-unrecorded";
  } else {
    status = "upcoming"; // default
  }

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

// ─── Status-based Card Rendering ─────────────────────────────────────

function LiveNowBadge() {
  return (
    <span className="evt-badge evt-badge--live">
      <span className="evt-live-dot" />
      🔴 Live Now
    </span>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "live-now") return <LiveNowBadge />;
  if (status === "upcoming")
    return <span className="evt-badge evt-badge--upcoming">Upcoming</span>;
  if (status === "past-recorded")
    return <span className="evt-badge evt-badge--recorded">Recorded</span>;
  if (status === "past-unrecorded")
    return <span className="evt-badge evt-badge--past">Unrecorded</span>;
  return <span className="evt-badge evt-badge--past">Past</span>;
}

function EventCard({
  event,
  index,
  onCardClick,
}: {
  event: EventItem;
  index: number;
  onCardClick: (event: EventItem) => void;
}) {
  const isLive = event.status === "live-now";
  const isUpcoming = event.status === "upcoming";

  const cardThemeClass =
    event.category === "arohan-culturals"
      ? "evt-card--arohan-culturals"
      : event.category === "arohan-technicals"
      ? "evt-card--arohan-technicals"
      : event.category === "arohan-esports"
      ? "evt-card--arohan-esports"
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className={`evt-card cursor-pointer ${isLive ? "evt-card--live" : ""} ${cardThemeClass}`}
      onClick={() => onCardClick(event)}
      data-testid={`card-event-${event.id}`}
    >
      {/* Event image */}
      {event.imageUrl && (
        <div className="evt-card-image">
          <img src={event.imageUrl} alt={event.title} loading="lazy" />
        </div>
      )}

      {/* Header */}
      <div className="evt-card-header">
        <StatusBadge status={event.status} />
        {event.date && (
          <div className="evt-card-date">
            <Calendar size={13} />
            {event.date}
          </div>
        )}
      </div>

      {/* Title */}
      {event.title && <h3 className="evt-card-title">{event.title}</h3>}

      {/* Speaker */}
      {event.speaker && (
        <div className="evt-card-speaker">
          <Mic2 size={13} />
          {event.speaker}
        </div>
      )}

      {/* Description or Compact Winners Preview */}
      {event.category.startsWith("arohan-") ? (
        (event.winner || event.runnerUp1 || event.runnerUp2 || event.honourableMentions) ? (
          <div className="arohan-preview-results">
            {event.winner && (
              <div className="arohan-preview-row">
                <span className="arohan-preview-medal">🏆</span>
                <span className="arohan-preview-name arohan-preview-name--winner">{event.winner}</span>
              </div>
            )}
            {event.runnerUp1 && (
              <div className="arohan-preview-row">
                <span className="arohan-preview-medal">🥈</span>
                <span className="arohan-preview-name">{event.runnerUp1}</span>
              </div>
            )}
            {event.runnerUp2 && (
              <div className="arohan-preview-row">
                <span className="arohan-preview-medal">🥉</span>
                <span className="arohan-preview-name">{event.runnerUp2}</span>
              </div>
            )}
            {event.honourableMentions && (
              <div className="arohan-preview-row">
                <span className="arohan-preview-medal">☆</span>
                <span className="arohan-preview-name"><strong>Honourable:</strong> {event.honourableMentions}</span>
              </div>
            )}
          </div>
        ) : event.description ? (
          <p className="evt-card-desc">{event.description}</p>
        ) : null
      ) : (
        event.description && (
          <p className="evt-card-desc">{event.description}</p>
        )
      )}

      {/* Action buttons */}
      <div className="evt-card-actions">
        {(isLive || isUpcoming) && event.meetLink && (
          <a
            href={event.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`evt-btn ${isLive ? "evt-btn--live" : "evt-btn--join"}`}
          >
            {isLive ? <Radio size={15} /> : <Video size={15} />}
            {isLive ? "Join Live" : "Join Session"}
            <ExternalLink size={12} />
          </a>
        )}

        {event.status === "past-recorded" && event.youtubeLink && (
          <a
            href={event.youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="evt-btn evt-btn--youtube"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Watch Recording
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ─── Event Modal Component ───────────────────────────────────────────
function EventModal({
  event,
  onClose,
}: {
  event: EventItem;
  onClose: () => void;
}) {
  const isLive = event.status === "live-now";
  const isUpcoming = event.status === "upcoming";
  const isRecorded = event.status === "past-recorded";

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      className="evt-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="evt-modal-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.4 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
      >
        <button className="evt-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="evt-modal-content">
          {event.imageUrl ? (
            <div className="evt-modal-grid">
              <div className="evt-modal-image-container">
                <img src={event.imageUrl} alt={event.title} />
              </div>

              <div className="evt-modal-info-col">
                <div className="evt-modal-header">
                  <div className="evt-modal-meta">
                    <StatusBadge status={event.status} />
                    {event.date && (
                      <div className="evt-card-date">
                        <Calendar size={13} />
                        {event.date}
                      </div>
                    )}
                  </div>

                  <h2 className="evt-modal-title">{event.title}</h2>

                  {event.speaker && (
                    <div className="evt-modal-speaker">
                      <Mic2 size={13} />
                      {event.speaker}
                    </div>
                  )}
                </div>

                {/* Description or Winners Board */}
                {event.category.startsWith("arohan-") ? (
                  (event.winner || event.runnerUp1 || event.runnerUp2 || event.honourableMentions) ? (
                    <div className="arohan-results-container">
                      <div className="arohan-results-title">🏆 Event Results</div>
                      <div className="arohan-results-list">
                        {event.winner && (
                          <div className="arohan-result-item">
                            <span className="arohan-result-medal">🥇</span>
                            <div className="arohan-result-details">
                              <span className="arohan-result-role">Winner</span>
                              <span className="arohan-result-name">{event.winner}</span>
                            </div>
                          </div>
                        )}
                        {event.runnerUp1 && (
                          <div className="arohan-result-item">
                            <span className="arohan-result-medal">🥈</span>
                            <div className="arohan-result-details">
                              <span className="arohan-result-role">1st Runner-up</span>
                              <span className="arohan-result-name">{event.runnerUp1}</span>
                            </div>
                          </div>
                        )}
                        {event.runnerUp2 && (
                          <div className="arohan-result-item">
                            <span className="arohan-result-medal">🥉</span>
                            <div className="arohan-result-details">
                              <span className="arohan-result-role">2nd Runner-up</span>
                              <span className="arohan-result-name">{event.runnerUp2}</span>
                            </div>
                          </div>
                        )}
                        {event.honourableMentions && (
                          <div className="arohan-result-item">
                            <span className="arohan-result-medal">🎖️</span>
                            <div className="arohan-result-details">
                              <span className="arohan-result-role">Honourable Mentions</span>
                              <span className="arohan-result-name">{event.honourableMentions}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : event.description ? (
                    <div className="evt-modal-desc">{event.description}</div>
                  ) : null
                ) : (
                  event.description && (
                    <div className="evt-modal-desc">{event.description}</div>
                  )
                )}

                <div className="evt-modal-actions">
                  {(isLive || isUpcoming) && event.meetLink && (
                    <a
                      href={event.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`evt-btn ${isLive ? "evt-btn--live" : "evt-btn--join"}`}
                    >
                      {isLive ? <Radio size={15} /> : <Video size={15} />}
                      {isLive ? "Join Live" : "Join Session"}
                      <ExternalLink size={12} />
                    </a>
                  )}

                  {isRecorded && event.youtubeLink && (
                    <a
                      href={event.youtubeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="evt-btn evt-btn--youtube"
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" className="mr-1">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      Watch on YouTube
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="evt-modal-info-col">
              <div className="evt-modal-header">
                <div className="evt-modal-meta">
                  <StatusBadge status={event.status} />
                  {event.date && (
                    <div className="evt-card-date">
                      <Calendar size={13} />
                      {event.date}
                    </div>
                  )}
                </div>

                <h2 className="evt-modal-title">{event.title}</h2>

                {event.speaker && (
                  <div className="evt-modal-speaker">
                    <Mic2 size={13} />
                    {event.speaker}
                  </div>
                )}
              </div>

              {/* Description or Winners Board */}
              {event.category.startsWith("arohan-") ? (
                (event.winner || event.runnerUp1 || event.runnerUp2 || event.honourableMentions) ? (
                  <div className="arohan-results-container">
                    <div className="arohan-results-title">🏆 Event Results</div>
                    <div className="arohan-results-list">
                      {event.winner && (
                        <div className="arohan-result-item">
                          <span className="arohan-result-medal">🥇</span>
                          <div className="arohan-result-details">
                            <span className="arohan-result-role">Winner</span>
                            <span className="arohan-result-name">{event.winner}</span>
                          </div>
                        </div>
                      )}
                      {event.runnerUp1 && (
                        <div className="arohan-result-item">
                          <span className="arohan-result-medal">🥈</span>
                          <div className="arohan-result-details">
                            <span className="arohan-result-role">1st Runner-up</span>
                            <span className="arohan-result-name">{event.runnerUp1}</span>
                          </div>
                        </div>
                      )}
                      {event.runnerUp2 && (
                        <div className="arohan-result-item">
                          <span className="arohan-result-medal">🥉</span>
                          <div className="arohan-result-details">
                            <span className="arohan-result-role">2nd Runner-up</span>
                            <span className="arohan-result-name">{event.runnerUp2}</span>
                          </div>
                        </div>
                      )}
                      {event.honourableMentions && (
                        <div className="arohan-result-item">
                          <span className="arohan-result-medal">🎖️</span>
                          <div className="arohan-result-details">
                            <span className="arohan-result-role">Honourable Mentions</span>
                            <span className="arohan-result-name">{event.honourableMentions}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : event.description ? (
                  <div className="evt-modal-desc">{event.description}</div>
                ) : null
              ) : (
                event.description && (
                  <div className="evt-modal-desc">{event.description}</div>
                )
              )}

              <div className="evt-modal-actions">
                {(isLive || isUpcoming) && event.meetLink && (
                  <a
                    href={event.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`evt-btn ${isLive ? "evt-btn--live" : "evt-btn--join"}`}
                  >
                    {isLive ? <Radio size={15} /> : <Video size={15} />}
                    {isLive ? "Join Live" : "Join Session"}
                    <ExternalLink size={12} />
                  </a>
                )}

                {isRecorded && event.youtubeLink && (
                  <a
                    href={event.youtubeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="evt-btn evt-btn--youtube"
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" className="mr-1">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    Watch on YouTube
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Section ────────────────────────────────────────────────────
export default function EventsSection() {
  const initialEvents = getCachedEvents();
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (initialEvents) {
      return initialEvents
        .map(mapRowToEvent)
        .filter((e): e is EventItem => e !== null && !!e.title);
    }
    return [];
  });
  const [loading, setLoading] = useState(!initialEvents);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!initialEvents) {
      setLoading(true);
    }
    setError(null);

    fetchEvents()
      .then((rows) => {
        if (!cancelled) {
          const mapped = rows
            .map(mapRowToEvent)
            .filter((e): e is EventItem => e !== null && !!e.title);
          setEvents(mapped);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load events");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Smart 3-event selection ──────────────────────────────────────────
  // Default order: Guest Session → Aarohan → Curiosity Hour
  // Upcoming/live events get priority and can replace default category slots.
  const recentEvents = (() => {
    type DisplayCategory = "guest-sessions" | "aarohan" | "curiosity-hour";

    const getDisplayCategory = (cat: Category): DisplayCategory => {
      if (cat === "guest-sessions") return "guest-sessions";
      if (cat === "curiosity-hour") return "curiosity-hour";
      return "aarohan";
    };

    const toTime = (d: string) => {
      const t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    };

    const statusScore = (s: Status) =>
      s === "live-now" ? 4 : s === "upcoming" ? 3 : s === "past-recorded" ? 2 : 1;

    const sortBest = (arr: EventItem[]) =>
      [...arr].sort((a, b) => {
        const diff = statusScore(b.status) - statusScore(a.status);
        return diff !== 0 ? diff : toTime(b.date) - toTime(a.date);
      });

    // Best event from each default category
    const bestGuest = sortBest(events.filter(e => getDisplayCategory(e.category) === "guest-sessions"))[0] || null;
    const bestAarohan = sortBest(events.filter(e => getDisplayCategory(e.category) === "aarohan"))[0] || null;
    const bestCuriosity = sortBest(events.filter(e => getDisplayCategory(e.category) === "curiosity-hour"))[0] || null;

    // All upcoming/live events, sorted by priority
    const upcomingAll = sortBest(
      events.filter(e => e.status === "upcoming" || e.status === "live-now")
    );

    if (upcomingAll.length === 0) {
      // No upcoming — use default order
      return [bestGuest, bestAarohan, bestCuriosity].filter((e): e is EventItem => e !== null);
    }

    if (upcomingAll.length === 1) {
      // One upcoming — place it in its category slot, keep others
      const up = upcomingAll[0];
      const upCat = getDisplayCategory(up.category);
      const slots: (EventItem | null)[] = [
        upCat === "guest-sessions" ? up : bestGuest,
        upCat === "aarohan" ? up : bestAarohan,
        upCat === "curiosity-hour" ? up : bestCuriosity,
      ];
      return slots.filter((e): e is EventItem => e !== null);
    }

    // 2+ upcoming — they get priority, fill remaining with defaults
    const result: EventItem[] = [];
    const usedIds = new Set<string>();
    for (const evt of upcomingAll.slice(0, 6)) {
      result.push(evt);
      usedIds.add(evt.id);
    }
    // Fill remaining slots from defaults
    const defaults = [bestGuest, bestAarohan, bestCuriosity];
    for (const d of defaults) {
      if (result.length >= 6) break;
      if (d && !usedIds.has(d.id)) {
        result.push(d);
        usedIds.add(d.id);
      }
    }
    // If still less than 6, fill with other recent events
    const sortedAll = sortBest([...events]);
    for (const evt of sortedAll) {
      if (result.length >= 6) break;
      if (!usedIds.has(evt.id)) {
        result.push(evt);
        usedIds.add(evt.id);
      }
    }
    return result.slice(0, 6);
  })();

  return (
    <section id="events" className="evt-section !pt-0 !bg-transparent">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="evt-header"
        >
          <div className="evt-section-badge">
            <Calendar size={16} />
            House Events
          </div>
          <h2 className="evt-section-title">Events & sessions</h2>
          <p className="evt-section-subtitle">
            Catch up on the latest guest sessions, Aarohan & curiosity hour.
          </p>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="section-loading mt-12">
            <Loader2 size={32} className="spin-icon text-white" />
            <span className="text-white/70">Loading recent events…</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="section-error mt-12">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Cards layout: Unified Carousel for all screens */}
        {!loading && !error && (
          <div className="w-full mt-12">
            {recentEvents.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key="recent-layout"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-full">
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                        watchDrag: true,
                        dragFree: false,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-2 md:-ml-4">
                        {recentEvents.map((event, i) => (
                          <CarouselItem key={event.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3 flex justify-center">
                            <div className="w-full">
                              <EventCard event={event} index={i} onCardClick={setSelectedEvent} />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {/* Navigation Arrows */}
                      <div className="flex justify-center items-center gap-6 mt-8">
                        <CarouselPrevious className="static translate-y-0 left-auto right-auto top-auto h-12 w-12 border-white/20 bg-white/5 hover:bg-[#1e5631] text-white hover:text-white flex items-center justify-center transition-all duration-300 rounded-full cursor-pointer hover:scale-105 active:scale-95" />
                        <CarouselNext className="static translate-y-0 left-auto right-auto top-auto h-12 w-12 border-white/20 bg-white/5 hover:bg-[#1e5631] text-white hover:text-white flex items-center justify-center transition-all duration-300 rounded-full cursor-pointer hover:scale-105 active:scale-95" />
                      </div>
                    </Carousel>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="evt-empty text-white/70 py-12">
                <span className="evt-empty-emoji">🦏</span>
                <p>No recent events found.</p>
              </div>
            )}
          </div>
        )}

        {/* View All Events Button */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 flex justify-center"
          >
            <Link href="/events" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1e5631] text-white hover:bg-[#174726] border border-white/20 font-bold uppercase tracking-wider rounded-full shadow-xl hover:shadow-[#1e5631]/40 transition-all hover:scale-105 active:scale-95 group">
              View All Events
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {selectedEvent && (
          <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

