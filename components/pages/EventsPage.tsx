"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Video,
  ExternalLink,
  Radio,
  Sparkles,
  Wrench,
  Zap,
  Loader2,
  AlertTriangle,
  Trophy,
  Lightbulb,
  ArrowLeft,
  Mic2,
  Search,
  Filter,
  ChevronDown,
  SlidersHorizontal,
  X
} from "lucide-react";
import { fetchEvents, getCachedEvents, toDirectImageUrl, type EventRow } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────
type Category = "guest-sessions" | "arohan-culturals" | "arohan-technicals" | "arohan-esports" | "curiosity-hour";
type TopTab = "guest-sessions" | "arohan" | "curiosity-hour";
type ArohanSubTab = "arohan-culturals" | "arohan-technicals" | "arohan-esports";
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
  if (rawCategory === "live-session" || rawCategory === "live-sessions" || rawCategory === "live session" || rawCategory === "guest-sessions" || rawCategory === "guest session" || rawCategory === "guest-session") {
    category = "guest-sessions";
  } else if (rawCategory === "cultural" || rawCategory === "arohan-culturals" || rawCategory === "arohan culturals" || rawCategory === "aarohan-culturals" || rawCategory === "aarohan culturals" || rawCategory === "aarohan") {
    category = "arohan-culturals";
  } else if (rawCategory === "technical" || rawCategory === "technicals" || rawCategory === "arohan-technicals" || rawCategory === "arohan technicals" || rawCategory === "aarohan-technicals" || rawCategory === "aarohan technicals") {
    category = "arohan-technicals";
  } else if (rawCategory === "sports" || rawCategory === "esports" || rawCategory === "e-sports" || rawCategory === "arohan-esports" || rawCategory === "arohan esports" || rawCategory === "arohan e-sports" || rawCategory === "aarohan-esports" || rawCategory === "aarohan esports" || rawCategory === "aarohan e-sports") {
    category = "arohan-esports";
  } else if (rawCategory === "curiosity-hour" || rawCategory === "curiosity hour" || rawCategory.includes("curiosity") || rawCategory.includes("curosity")) {
    category = "curiosity-hour";
  } else {
    // Unknown category — skip row
    return null;
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

const TOP_TABS: { label: string; value: TopTab; icon: React.ReactNode }[] = [
  { label: "Guest Sessions", value: "guest-sessions", icon: <Zap size={16} /> },
  { label: "Aarohan", value: "arohan", icon: <Sparkles size={16} /> },
  { label: "Curiosity Hour", value: "curiosity-hour", icon: <Lightbulb size={16} /> },
];

const AROHAN_SUB_TABS: { label: string; value: ArohanSubTab; icon: React.ReactNode; activeClasses: string; inactiveClasses: string }[] = [
  { label: "Culturals", value: "arohan-culturals", icon: <Sparkles size={14} />, activeClasses: "bg-[#9b2c5a] text-white border-[#9b2c5a] shadow-[0_4px_16px_rgba(155,44,90,0.3)]", inactiveClasses: "hover:bg-[#9b2c5a]/10 hover:text-[#9b2c5a] hover:border-[#9b2c5a]/30" },
  { label: "Technicals", value: "arohan-technicals", icon: <Wrench size={14} />, activeClasses: "bg-[#1d5fa0] text-white border-[#1d5fa0] shadow-[0_4px_16px_rgba(29,95,160,0.3)]", inactiveClasses: "hover:bg-[#1d5fa0]/10 hover:text-[#1d5fa0] hover:border-[#1d5fa0]/30" },
  { label: "E-Sports", value: "arohan-esports", icon: <Trophy size={14} />, activeClasses: "bg-[#b8860b] text-white border-[#b8860b] shadow-[0_4px_16px_rgba(184,134,11,0.3)]", inactiveClasses: "hover:bg-[#b8860b]/10 hover:text-[#b8860b] hover:border-[#b8860b]/30" },
];

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
  const isRecorded = event.status === "past-recorded";
  const isUnrecorded = event.status === "past-unrecorded";

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
          <p className="evt-card-desc line-clamp-3">{event.description}</p>
        ) : null
      ) : (
        event.description && (
          <p className="evt-card-desc line-clamp-3">{event.description}</p>
        )
      )}

      {/* Action button */}
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

        {isRecorded && event.youtubeLink && (
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
            Watch on YouTube
            <ExternalLink size={12} />
          </a>
        )}

        {isUnrecorded && (
          <span className="evt-card-no-recording">
            Recording not available
          </span>
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

// ─── Navbar for Events Page ───────────────────────────────────────────
function EventsNavbar() {
  return (
    <nav className="w-full bg-[#1e5631]/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-sm py-3">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold uppercase text-white hover:text-[#6fcf97] transition-colors cursor-pointer group">
          <ArrowLeft size={20} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
          <span className="tracking-wide">Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 text-white">
          <Calendar size={18} />
          <span className="font-bold tracking-tight">EVENTS</span>
        </div>
      </div>
    </nav>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function EventsPage() {
  const initialEvents = getCachedEvents();

  const seoJsonLd = useMemo(() => ({
    "@type": "WebPage",
    "name": "Events — Kaziranga House",
    "description": "Guest sessions, Aarohan culturals, technicals, e-sports, and curiosity hour events from Kaziranga House at IIT Madras BS Degree.",
    "isPartOf": { "@type": "WebSite", "name": "Kaziranga House", "url": "https://kaziranga-house.vercel.app" },
  }), []);


  const [activeTopTab, setActiveTopTab] = useState<TopTab>("guest-sessions");
  const [arohanSubTab, setArohanSubTab] = useState<ArohanSubTab>("arohan-culturals");
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "past">("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".custom-dropdown-container")) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [dropdownOpen]);

  useEffect(() => {
    window.scrollTo(0, 0);
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

  // Determine which category to filter by
  const activeCategory: Category = activeTopTab === "arohan" ? arohanSubTab : activeTopTab as Category;
  let filtered = events;

  // Filter by search query (global search across all tabs)
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(e => 
      e.title.toLowerCase().includes(q) || 
      (e.speaker && e.speaker.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q))
    );
  } else {
    // If no search query, filter by the active tab category
    filtered = filtered.filter((e) => e.category === activeCategory);
  }

  // Filter by status
  if (statusFilter !== "all") {
    filtered = filtered.filter(e => {
      if (statusFilter === "upcoming") return e.status === "upcoming" || e.status === "live-now";
      if (statusFilter === "past") return e.status === "past-recorded" || e.status === "past-unrecorded";
      return true;
    });
  }

  // Sort: live-now first, then upcoming, then past, and within same status sort by date descending (most recent first)
  const statusOrder: Record<Status, number> = {
    "live-now": 0,
    upcoming: 1,
    "past-recorded": 2,
    "past-unrecorded": 3,
  };
  const toTime = (d: string) => {
    const t = new Date(d).getTime();
    return isNaN(t) ? 0 : t;
  };
  const sorted = [...filtered].sort((a, b) => {
    const diff = statusOrder[a.status] - statusOrder[b.status];
    if (diff !== 0) return diff;
    return toTime(b.date) - toTime(a.date);
  });

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#6fcf97] selection:text-black">
      <EventsNavbar />

      <main className="flex-grow pb-24 evt-section min-h-screen relative" style={{ paddingTop: "2rem" }}>
        {/* Background */}
        <div className="evt-bg" />
        <div className="evt-blob evt-blob--top" />
        <div className="evt-blob evt-blob--bottom" />

        <div className="container mx-auto px-4 md:px-6 pt-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="evt-header"
          >
            <h2 className="evt-section-title">Events Archive</h2>
          </motion.div>

          {/* Top-level Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="evt-tabs-wrapper"
          >
            {TOP_TABS.map((tab) => (
              <button
                key={tab.value}
                data-testid={`button-tab-${tab.value}`}
                onClick={() => setActiveTopTab(tab.value)}
                className={`evt-tab ${activeTopTab === tab.value ? "evt-tab--active" : ""}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Arohan Sub-tabs */}
          <AnimatePresence>
            {activeTopTab === "arohan" && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center mb-8 mt-1"
              >
                <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#1a3a1a]/[0.07] border border-[#1a3a1a]/10">
                  {AROHAN_SUB_TABS.map((sub) => (
                    <button
                      key={sub.value}
                      data-testid={`button-subtab-${sub.value}`}
                      onClick={() => setArohanSubTab(sub.value)}
                      className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${arohanSubTab === sub.value
                        ? sub.activeClasses
                        : `bg-transparent text-[#4a6741] border-transparent ${sub.inactiveClasses}`
                        }`}
                    >
                      {sub.icon}
                      {sub.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search & Filter Controls */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-4 mb-8 max-w-3xl mx-auto items-stretch justify-center mt-4"
          >
            {/* Search Input */}
            <div className="relative w-full sm:w-2/3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1e5631] z-10" size={18} />
              <input
                type="text"
                placeholder="Search events by title, speaker, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md border border-[#1e5631]/20 rounded-full text-[#1e5631] placeholder-[#1e5631]/50 focus:outline-none focus:border-[#1e5631] focus:ring-1 focus:ring-[#1e5631] transition-all shadow-[0_4px_16px_-4px_rgba(30,86,49,0.08)] font-medium"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative w-full sm:w-1/3 custom-dropdown-container">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1e5631] pointer-events-none z-10" size={18} />
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full pl-11 pr-10 py-3 bg-white/70 backdrop-blur-md border border-[#1e5631]/20 rounded-full text-[#1e5631] flex items-center justify-between text-left font-semibold shadow-[0_4px_16px_-4px_rgba(30,86,49,0.08)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1e5631] transition-all hover:bg-white/80"
              >
                <span>
                  {statusFilter === "all" && "All Status"}
                  {statusFilter === "upcoming" && "Upcoming & Live"}
                  {statusFilter === "past" && "Past Events"}
                </span>
              </button>
              <ChevronDown 
                className={`absolute right-4 top-1/2 -translate-y-1/2 text-[#1e5631] pointer-events-none transition-transform duration-200 z-10 ${dropdownOpen ? 'rotate-180' : ''}`} 
                size={16} 
              />
              
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-[#1e5631]/20 rounded-[20px] shadow-[0_10px_25px_-5px_rgba(30,86,49,0.15)] overflow-hidden p-1.5 flex flex-col gap-1"
                  >
                    {[
                      { value: "all", label: "All Status" },
                      { value: "upcoming", label: "Upcoming & Live" },
                      { value: "past", label: "Past Events" }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt.value as any);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 rounded-[14px] flex items-center justify-between ${
                          statusFilter === opt.value
                            ? "bg-[#1e5631] text-white font-semibold"
                            : "text-[#1a3a1a] hover:bg-[#1e5631]/10 hover:text-[#1e5631]"
                        }`}
                      >
                        {opt.label}
                        {statusFilter === opt.value && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Loading state */}
          {loading && (
            <div className="section-loading">
              <Loader2 size={32} className="spin-icon text-white" />
              <span className="text-white/70">Loading events…</span>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="section-error">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Cards grid */}
          {!loading && !error && (
            <div className="evt-grid">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="evt-grid-inner"
                >
                  {sorted.length > 0 ? (
                    sorted.map((event, i) => (
                      <EventCard key={event.id} event={event} index={i} onCardClick={setSelectedEvent} />
                    ))
                  ) : (
                    <div className="evt-empty text-white/70">
                      <span className="evt-empty-emoji">🦏</span>
                      <p>No events in this category right now.</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
      <AnimatePresence>
        {selectedEvent && (
          <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
