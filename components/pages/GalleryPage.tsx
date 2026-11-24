"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Image as ImageIcon, ArrowLeft, ArrowRight, Loader2, AlertTriangle, RefreshCw, Heart, Search, X, Folder } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { fetchCouncil, getCachedCouncil, fetchGallery, fetchMeetups, getCachedGallery, getCachedMeetups, toDirectImageUrl, type GalleryRow, type MeetupRow } from "@/lib/api";
import { useLikes, useAllLikes } from "@/hooks/useLikes";
import { generateImageId } from "@/lib/firebase";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import PageHero, { Segmented } from "@/components/kz/PageHero";
import { Postmark } from "@/components/kz/Motifs";
import { DateStamp, TicketCard, type TicketStock } from "@/components/kz/TicketCard";
import { REGION_THEMES, regionImage } from "@/components/portal/home/RegionArt";
import { toRegion } from "@/lib/portal/regions";
import { joinNames, rcsByRegion } from "@/lib/rcs";

const getCategoryBadgeColor = (category: string) => {
  const cat = category?.trim().toLowerCase();
  if (cat === "meetups" || cat === "meetup") return "bg-[#f6b51e]";
  if (cat === "meme") return "bg-[#e3a936]";
  if (cat === "sticker") return "bg-[#f08a24]";
  if (cat === "photograph") return "bg-[#e2387a]";
  if (cat === "screenshot") return "bg-white";
  return "bg-[#c8102e]"; // Creativity
};

// ─── Parse Meetup Date ───────────────────────────────────────────────────────
function parseMeetupDate(dateStr: string) {
  if (!dateStr) return { day: "TBA", monthYear: "" };
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return { day: dateStr, monthYear: "" };
  
  const day = parts[0].padStart(2, '0');
  const monthInt = parseInt(parts[1], 10);
  const year = parts[2];
  
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const month = months[monthInt - 1] || "MON";
  
  return { day, monthYear: `${month} ${year}` };
}

// ─── Canva Embed Hook ────────────────────────────────────────────────────────
function useCanvaEmbed(url: string) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) {
      setEmbedUrl(null);
      return;
    }

    const trimmed = url.trim();

    // Check direct Canva design URL
    const directMatch = trimmed.match(/canva\.com\/design\/([a-zA-Z0-9_-]+)/);
    if (directMatch) {
      setEmbedUrl(`https://www.canva.com/design/${directMatch[1]}/view?embed`);
      return;
    }

    // Check if it's a canva.link short URL
    if (trimmed.includes("canva.link/")) {
      setLoading(true);
      fetch(`https://www.redirectcheck.org/api/check?url=${encodeURIComponent(trimmed)}`)
        .then(res => res.json())
        .then(data => {
          const finalUrl = data?.final_result?.final_url || data?.redirects?.[0]?.to;
          if (finalUrl) {
            const finalMatch = finalUrl.match(/canva\.com\/design\/([a-zA-Z0-9_-]+)/);
            if (finalMatch) {
              setEmbedUrl(`https://www.canva.com/design/${finalMatch[1]}/view?embed`);
            }
          }
        })
        .catch(err => {
          console.error("Error resolving Canva link:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setEmbedUrl(null);
    }
  }, [url]);

  return { embedUrl, loading };
}

// ─── Canva Modal Embed Component ─────────────────────────────────────────────
function CanvaModalEmbed({ url }: { url: string }) {
  const { embedUrl, loading } = useCanvaEmbed(url);

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#fbf3df]">
        <Loader2 className="animate-spin text-black/40" size={28} strokeWidth={2} />
        <span className="font-bold text-xs uppercase text-black/55 tracking-wide">Resolving Poster...</span>
      </div>
    );
  }

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        className="w-full h-full border-none"
        allowFullScreen
        title="Canva Poster"
      />
    );
  }

  if (url.trim().match(/\.(jpeg|jpg|gif|png|webp)/i)) {
    return (
      <img
        src={url.trim()}
        alt="Meetup Poster"
        className="w-full h-full object-contain bg-[#f5e9cf]"
      />
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#fbf3df] gap-4">
      <span className="font-bold text-sm uppercase text-black/55 tracking-wide">Poster Link Available</span>
      <a
        href={url.trim()}
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 border border-black/10 bg-[#f6b51e]/90 font-bold text-sm uppercase shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer rounded-sm text-black"
      >
        View Poster ↗
      </a>
    </div>
  );
}

// ─── Folder Card Component ───────────────────────────────────────────────────
/** "d/m/yyyy" as the meetup sheet writes it, to a sortable number. */
function sheetTime(d?: string): number {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((d || "").trim());
  return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : 0;
}

/**
 * A region as an old railway-station travel poster: the region's poster art
 * (the same set the member cards use), its name painted across the sky, its
 * RC underneath, and an India Post-style postmark with the meetup count.
 */
function RegionPoster({ region, meetups, rcs, onClick }: { region: string; meetups: MeetupRow[]; rcs: string[]; onClick: () => void }) {
  const r = toRegion(region) || "Other";
  const theme = REGION_THEMES[r];
  const count = meetups.length;
  const name = r === "Other" ? region : r;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-label={`${region}: ${count} ${count === 1 ? "meetup" : "meetups"}`}
        className="kz-focus group block w-full text-left"
      >
        <span className="relative block border-[3px] border-[#1c130c] bg-[#fffaf0] p-2 shadow-[6px_6px_0_#1c130c] transition-[transform,box-shadow] duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-1 group-hover:shadow-[9px_9px_0_#c8102e]">
          <span className="relative block aspect-[4/3] overflow-hidden" style={{ background: theme.sky }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={regionImage(r, 640)}
              srcSet={`${regionImage(r, 640)} 640w, ${regionImage(r, 1200)} 1200w`}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
              alt={`${theme.landmark}, ${region}`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              style={{ objectPosition: theme.focus }}
            />
            <span
              className="kz-display absolute left-3 top-2 text-[clamp(1.8rem,3vw,2.4rem)] leading-none sm:left-4 sm:top-3"
              style={{ color: theme.label, textShadow: `2px 2px 0 ${theme.accent}` }}
            >
              {r === "Other" ? region : r}
            </span>
          </span>
          <span className="flex items-center justify-between gap-3 px-2 pb-1 pt-3">
            <span className="min-w-0">
              <span className="block truncate text-[1.05rem] font-semibold text-[#1c130c]">{name} region</span>
              {rcs.length > 0 && (
                <span className="block truncate text-[0.9rem] text-[#5e4a35]">
                  {rcs.length > 1 ? "RCs" : "RC"}: {joinNames(rcs)}
                </span>
              )}
            </span>
            <Postmark
              className="w-[4.75rem] shrink-0 -rotate-12 text-[1.55rem] sm:w-[5.25rem]"
              color="#c8102e"
              top="KAZIRANGA HOUSE"
              bottom="MEETUPS"
              center={<span className="font-bold">{count}</span>}
            />
          </span>
        </span>
      </button>
    </li>
  );
}

// ─── Meetup Card Component ───────────────────────────────────────────────────
interface MeetupCardProps {
  meetup: MeetupRow;
  index: number;
  onClick: () => void;
}

const MEETUP_STOCKS: TicketStock[] = ["marigold", "pink", "sky", "mint"];

function MeetupCard({ meetup, index, onClick }: MeetupCardProps) {
  const [failed, setFailed] = useState(false);
  const src = meetup.Poster?.trim() ? toDirectImageUrl(meetup.Poster.trim()) : "";
  const t = sheetTime(meetup.Date);
  const hosts = (meetup["Host's ID"] || "")
    .split(",")
    .map((h) => h.trim())
    .filter((h) => h && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h))
    .map((h) => h.replace("@", ""));

  return (
    <TicketCard
      stock={MEETUP_STOCKS[index % MEETUP_STOCKS.length]}
      poster={
        <div className="relative aspect-[4/5] bg-[#ebd9b2]">
          {src && !failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={`Poster for the meetup at ${meetup.Venue}`} loading="lazy" decoding="async" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          ) : (
            <span className="absolute inset-0 grid place-items-center p-6 text-center">
              <span className="kz-display text-[1.8rem] text-[#1c130c]/70">{meetup.Venue}</span>
            </span>
          )}
        </div>
      }
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="kz-serif line-clamp-2 text-[1.2rem] leading-snug text-[#1c130c]">
          <button type="button" onClick={onClick} className="kz-focus text-left after:absolute after:inset-0">
            {meetup.Venue}
          </button>
        </h3>
        <DateStamp date={t ? new Date(t) : null} className="shrink-0" />
      </div>
      {hosts.length > 0 && <p className="mt-1.5 truncate text-[0.9rem] text-[#1c130c]/75">Hosted by {hosts.join(", ")}</p>}
      {meetup["Instagram Post"]?.trim() && (
        <a
          href={meetup["Instagram Post"].trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="kz-focus relative z-10 mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#1c130c] px-4 py-2 text-[0.9rem] font-semibold text-[#f6b51e] transition-transform hover:-translate-y-0.5"
        >
          <FaInstagram size={15} /> Photos
        </a>
      )}
    </TicketCard>
  );
}

function GalleryCard({ row, index, isTopPick }: { row: GalleryRow; index: number; isTopPick: boolean }) {
  const [imgError, setImgError] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  
  const imageId = generateImageId(row.Student, row.Timestamp);
  const { likeCount, hasLiked, toggleLike } = useLikes(imageId);

  // Alternate tilt direction based on index for organic feel
  const tiltDir = index % 2 === 0 ? -8 : 8;

  // Format the timestamp into a readable date
  const formattedDate = useMemo(() => {
    if (!row.Timestamp) return "";
    try {
      const d = new Date(row.Timestamp);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
    } catch {
      return "";
    }
  }, [row.Timestamp]);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 60, rotate: tiltDir, scale: 0.88 }}
      animate={isInView ? { opacity: 1, y: 0, rotate: 0, scale: 1 } : {}}
      exit={{ opacity: 0, scale: 0.5, rotate: tiltDir }}
      transition={{
        duration: 0.55,
        delay: Math.min((index % 6) * 0.07, 0.35),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.025, rotate: index % 2 === 0 ? -0.8 : 0.8, y: -6,
        transition: { duration: 0.25, ease: "easeOut" } }}
      className="break-inside-avoid border border-black/10 bg-[#fbf3df] shadow-[2px_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[4px_12px_24px_rgba(0,0,0,0.15)] transition-shadow duration-200 cursor-pointer flex flex-col relative group overflow-hidden rounded-sm mb-4 sm:mb-6 md:mb-8 w-full"
    >
      {/* Window chrome: traffic lights (left) + category badge (right) */}
      <div className="w-full h-8 border-b border-black/10 bg-[#f5e9cf] flex items-center justify-between px-3 shrink-0">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full border border-black/20 bg-[#c8102e]/80"></div>
          <div className="w-2.5 h-2.5 rounded-full border border-black/20 bg-[#f6b51e]/80"></div>
          <div className="w-2.5 h-2.5 rounded-full border border-black/20 bg-[#e3a936]/80"></div>
        </div>
        <span className={`inline-block px-2 py-0.5 border border-black/10 text-black/70 text-[9px] font-bold uppercase shadow-sm rounded-sm ${getCategoryBadgeColor(row.Category)}`}>
          {row.Category}
        </span>
      </div>

      {/* Image Container */}
      <div className="relative w-full bg-[#f5e9cf] overflow-hidden border-b border-black/10">
        {/* Top Pick Badge (on the image) */}
        {isTopPick && (
          <div className="absolute top-2 right-2 z-20 bg-[#f6b51e]/90 border border-black/10 px-2 py-1 shadow-sm transform rotate-2 flex items-center gap-1 font-bold text-[10px] uppercase rounded-sm backdrop-blur-sm">
            🔥 Top Pick
          </div>
        )}

        {imgError ? (
          <div className="w-full aspect-square flex flex-col items-center justify-center gap-2 text-black/40">
            <ImageIcon size={40} strokeWidth={1.5} />
            <span className="text-xs font-bold uppercase">Image unavailable</span>
          </div>
        ) : (
          <img
            src={toDirectImageUrl(row.Image_url, 900)}
            alt={`${row.Student} — ${row.Category}`}
            className="w-full h-auto block transition-all duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Footer: Name + Date (left) | Heart count pill (right) */}
      <div className="p-3 sm:p-4 bg-white flex items-center justify-between shrink-0">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="font-bold text-sm sm:text-base text-black uppercase leading-tight truncate pr-2">
            {row.Student}
          </h3>
          {formattedDate && (
            <span className="text-[10px] sm:text-xs font-bold text-black/40 uppercase tracking-wide">
              {formattedDate}
            </span>
          )}
        </div>
        
        <motion.button 
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(); }}
          className={`shrink-0 flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-black/10 font-bold text-xs shadow-sm active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${hasLiked ? "bg-[#c8102e]/90 text-white" : "bg-white text-black hover:bg-[#f5e9cf]"}`}
        >
          <Heart size={13} className={hasLiked ? "fill-white text-white" : "text-black"} strokeWidth={hasLiked ? 0 : 2} />
          <span>{likeCount}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}


// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  const aspects = [
    "aspect-[4/3]",
    "aspect-square",
    "aspect-[3/4]",
    "aspect-[4/5]",
    "aspect-square",
    "aspect-[3/5]"
  ];

  return (
    <div className="columns-2 lg:columns-3 gap-4 sm:gap-6 md:gap-8">
      {Array.from({ length: 6 }).map((_, i) => {
        const aspect = aspects[i % aspects.length];
        return (
          <div
            key={i}
            className="border border-black/5 bg-white/60 mb-4 sm:mb-6 md:mb-8 break-inside-avoid overflow-hidden flex flex-col rounded-sm shadow-sm"
          >
            {/* Window chrome skeleton */}
            <div className="w-full h-8 border-b border-black/5 bg-black/[0.02] flex items-center justify-between px-3 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-black/10 animate-pulse"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-black/10 animate-pulse"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-black/10 animate-pulse"></div>
              </div>
              <div className="w-8 h-3.5 bg-black/[0.05] rounded animate-pulse" />
            </div>

            {/* Pulsing image area with varied aspect ratio */}
            <div className={`w-full ${aspect} bg-black/[0.03] animate-pulse`} />

            {/* Details Section skeleton */}
            <div className="p-2 sm:p-3 flex items-center justify-between shrink-0 border-t border-black/5">
              <div className="flex flex-col gap-1.5 w-2/3">
                <div className="h-3 w-10 bg-black/[0.05] animate-pulse rounded-sm" />
                <div className="h-3.5 w-full bg-black/[0.05] animate-pulse rounded-sm" />
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/[0.05] animate-pulse" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GalleryPage() {
  const initialGallery = getCachedGallery();
  const initialMeetups = getCachedMeetups();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setLocation = (path: string) => router.push(path);

  const [rows, setRows] = useState<GalleryRow[]>(() => {
    if (initialGallery) {
      return initialGallery.filter((r) => String(r.Approved).trim().toUpperCase() === "TRUE");
    }
    return [];
  });
  const [meetups, setMeetups] = useState<MeetupRow[]>(initialMeetups || []);
  // The RCs, from the council list, to name on each region's poster.
  const [rcs, setRcs] = useState(() => rcsByRegion(getCachedCouncil() || []));
  useEffect(() => {
    fetchCouncil()
      .then((rows) => setRcs(rcsByRegion(rows)))
      .catch(() => {});
  }, []);
  const [loading, setLoading] = useState(!initialGallery || !initialMeetups);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      if (tabParam.toLowerCase() === "meetups") return "Meetups";
      if (tabParam.toLowerCase() === "images") return "All";
    }
    return "Meetups";
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [creativeDropdownOpen, setCreativeDropdownOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedMeetup, setSelectedMeetup] = useState<MeetupRow | null>(null);
  
  const allLikes = useAllLikes(); // Map of { imageId: likeCount }

  // Synchronize activeTab if query parameters change on navigation
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      if (tabParam.toLowerCase() === "meetups") {
        setActiveTab("Meetups");
      } else if (tabParam.toLowerCase() === "images") {
        setActiveTab("All");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (creativeDropdownOpen && !(e.target as Element).closest(".creative-dropdown-container")) {
        setCreativeDropdownOpen(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [creativeDropdownOpen]);

  useEffect(() => {
    setSelectedRegion(null);
  }, [activeTab]);

  const load = () => {
    if (!initialGallery || !initialMeetups) {
      setLoading(true);
    }
    setError(null);
    Promise.all([
      fetchGallery(),
      fetchMeetups()
    ])
      .then(([galleryData, meetupsData]) => {
        setRows(galleryData.filter((r) => String(r.Approved).trim().toUpperCase() === "TRUE"));
        setMeetups(meetupsData);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message ?? "Unknown error");
        setLoading(false);
      });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, []);

  // Group meetups by normalized region name
  const meetupsByRegion = useMemo(() => {
    const groups: Record<string, MeetupRow[]> = {};
    meetups.forEach((m) => {
      if (!m.Region) return;
      const reg = m.Region.trim();
      if (!reg) return;
      
      const capitalized = reg
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      
      if (!groups[capitalized]) {
        groups[capitalized] = [];
      }
      groups[capitalized].push(m);
    });
    return groups;
  }, [meetups]);

  const uniqueRegions = useMemo(() => {
    return Object.keys(meetupsByRegion).sort();
  }, [meetupsByRegion]);

  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return uniqueRegions;
    const query = searchQuery.toLowerCase().trim();
    return uniqueRegions.filter((r) => r.toLowerCase().includes(query));
  }, [uniqueRegions, searchQuery]);

  const filteredMeetupsForRegion = useMemo(() => {
    if (!selectedRegion) return [];
    const regionMeetups = meetupsByRegion[selectedRegion] || [];
    
    let filtered = regionMeetups;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = regionMeetups.filter(
        (m) =>
          m.Venue?.toLowerCase().includes(query) ||
          m.Date?.toLowerCase().includes(query) ||
          m["Host's ID"]?.toLowerCase().includes(query)
      );
    }
    
    // Sort: meetups with posters first
    return [...filtered].sort((a, b) => {
      const hasA = a.Poster && a.Poster.trim() !== "";
      const hasB = b.Poster && b.Poster.trim() !== "";
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;
      return 0;
    });
  }, [meetupsByRegion, selectedRegion, searchQuery]);

  // Globally sort all rows by likes to identify top 3 for the badges
  const top3ImageIds = useMemo(() => {
    return [...rows]
      .sort((a, b) => {
        const idA = generateImageId(a.Student, a.Timestamp);
        const idB = generateImageId(b.Student, b.Timestamp);
        const likesA = allLikes[idA] || 0;
        const likesB = allLikes[idB] || 0;
        return likesB - likesA; // Descending
      })
      .slice(0, 3)
      .map(r => generateImageId(r.Student, r.Timestamp));
  }, [rows, allLikes]);

  const filteredRows = useMemo(() => {
    let result = rows;

    // 1. Filter by category
    if (activeTab !== "All") {
      result = result.filter(
        (r) => r.Category?.trim().toLowerCase() === activeTab.toLowerCase()
      );
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.Student?.toLowerCase().includes(query) ||
          r.Category?.toLowerCase().includes(query)
      );
    }

    // 3. Sort
    return [...result].sort((a, b) => {
      // If showing "All", put Meetups category at the very top
      if (activeTab === "All") {
        const aIsMeetup = a.Category?.trim().toLowerCase() === "meetups" || a.Category?.trim().toLowerCase() === "meetup";
        const bIsMeetup = b.Category?.trim().toLowerCase() === "meetups" || b.Category?.trim().toLowerCase() === "meetup";
        if (aIsMeetup && !bIsMeetup) return -1;
        if (!aIsMeetup && bIsMeetup) return 1;
      }

      const idA = generateImageId(a.Student, a.Timestamp);
      const idB = generateImageId(b.Student, b.Timestamp);
      const likesA = allLikes[idA] || 0;
      const likesB = allLikes[idB] || 0;

      if (likesB !== likesA) return likesB - likesA;
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    });
  }, [rows, activeTab, searchQuery, allLikes]);

  return (
    <div className="kz-font min-h-screen flex flex-col selection:bg-[#e2387a]/30 bg-[#f5e9cf] relative">
      <KzHeader />
      <PageHero
        ground="marigold"
        title={["Gallery"]}
        intro={
          loading
            ? "Meetup posters, and the photos, memes and art members share."
            : `${meetups.length} meetup posters from ${uniqueRegions.length} regions, and ${rows.length} photos, memes and drawings from members.`
        }
        aside={
          <label className="relative block w-full md:w-[22rem]">
            <span className="sr-only">{activeTab === "Meetups" ? "Search regions and meetups" : "Search by member"}</span>
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5e4a35]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "Meetups" ? (selectedRegion ? "Search venues and hosts" : "Search regions") : "Search by member"}
              className="h-12 w-full rounded-full border-2 border-[#1c130c] bg-[#fffaf0] pl-11 pr-11 text-[1rem] outline-none transition-shadow placeholder:text-[#5e4a35]/75 focus:shadow-[3px_3px_0_#e3a936]"
            />
            {searchQuery && (
              <button type="button" aria-label="Clear search" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#5e4a35] hover:bg-[#1c130c]/5">
                <X size={15} />
              </button>
            )}
          </label>
        }
      />

      <main className="flex-grow pt-8 pb-24 relative z-10">
        <div className="mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            {selectedRegion ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedRegion(null)}
                  className="kz-focus inline-flex h-10 items-center gap-2 rounded-full bg-[#1c130c]/[0.06] px-4 font-semibold text-[#1c130c] hover:bg-[#1c130c]/10"
                >
                  <ArrowLeft size={16} /> All regions
                </button>
                <h2 className="kz-h2 text-[clamp(1.8rem,3vw,2.4rem)]">{selectedRegion}</h2>
                <span className="text-[#5e4a35]">
                  {filteredMeetupsForRegion.length} {filteredMeetupsForRegion.length === 1 ? "meetup" : "meetups"}
                </span>
              </div>
            ) : (
              <Segmented
                id="gallery-tab"
                value={activeTab}
                onChange={(v) => {
                  setActiveTab(v);
                  setSearchQuery("");
                  if (v === "Meetups") setLocation("/gallery?tab=meetups");
                }}
                options={[
                  { label: "Meetups", value: "Meetups" },
                  { label: "Everything", value: "All" },
                  { label: "Photographs", value: "Photograph" },
                  { label: "Creativity", value: "Creativity" },
                  { label: "Memes", value: "Meme" },
                  { label: "Stickers", value: "Sticker" },
                  { label: "Screenshots", value: "Screenshot" },
                ]}
              />
            )}
            {activeTab !== "Meetups" && (
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSd-_J0oyeosBlrEkVFYDyUPvKOIhighKdzm_ngR2j4kFuAZyw/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="kz-btn kz-focus bg-[#f6b51e] text-[#1c130c]"
              >
                Add your photo <ArrowRight size={16} />
              </a>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col gap-8 pt-4">
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 border-[3px] border-black/10 border-t-[#f6b51e] rounded-full animate-spin"></div>
                  <div className="absolute w-8 h-8 border-[3px] border-transparent border-t-[#e3a936] rounded-full animate-spin [animation-direction:reverse]"></div>
                </div>
                <p className="mt-2 animate-pulse text-[0.95rem] text-[#5e4a35]">Loading the gallery…</p>
              </div>
              <LoadingSkeleton />
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="border border-black/10 bg-[#c8102e]/10 shadow-md p-8 md:p-12 max-w-lg w-full text-center flex flex-col items-center gap-4 rounded-sm">
                <AlertTriangle size={52} strokeWidth={2} className="text-[#c8102e]" />
                <h2 className="font-bold text-3xl tracking-wide text-black">Oops!</h2>
                <p className="font-medium text-black/80 text-sm">{error}</p>
                <button
                  onClick={load}
                  className="flex items-center gap-2 px-6 py-3 border border-black/10 bg-white font-bold uppercase text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all rounded-sm text-black/80"
                >
                  <RefreshCw size={16} strokeWidth={2} />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Gallery grid */}
          {!loading && !error && (
            <div className="max-w-7xl mx-auto">
              {activeTab === "Meetups" ? (
                selectedRegion ? (
                  // Drill-down Meetups List View
                  <div className="flex flex-col gap-8">
                    {filteredMeetupsForRegion.length > 0 ? (
                      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence mode="popLayout">
                          {filteredMeetupsForRegion.map((meetup, idx) => (
                            <motion.div
                              key={`${meetup.Region}-${meetup.Date}-${idx}`}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3 }}
                            >
                              <MeetupCard meetup={meetup} index={idx} onClick={() => setSelectedMeetup(meetup)} />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20 border border-black/10 bg-[#fbf3df] shadow-md max-w-xl mx-auto mt-12 rounded-sm"
                      >
                        <ImageIcon size={64} className="mx-auto mb-6 text-black/20" strokeWidth={1} />
                        <h2 className="text-2xl font-bold text-black/80 tracking-wide">No Meetups Found</h2>
                        <p className="font-medium mt-2 text-black/50">No meetups match the search query in this region.</p>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  // Folders Grid View
                  <div className="flex flex-col gap-6">
                    {filteredRegions.length > 0 ? (
                      <ul className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredRegions.map((region) => (
                          <RegionPoster
                            key={region}
                            region={region}
                            meetups={meetupsByRegion[region] || []}
                            rcs={rcs[toRegion(region) || "Other"] ?? []}
                            onClick={() => {
                              setSelectedRegion(region);
                              setSearchQuery("");
                            }}
                          />
                        ))}
                      </ul>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20 border border-black/10 bg-[#fbf3df] shadow-md max-w-xl mx-auto mt-12 rounded-sm"
                      >
                        <Folder size={64} className="mx-auto mb-6 text-black/20" strokeWidth={1} />
                        <h2 className="text-2xl font-bold text-black/80 tracking-wide">No Regions Match</h2>
                        <p className="font-medium mt-2 text-black/50">Try searching for another region name.</p>
                      </motion.div>
                    )}
                  </div>
                )
              ) : (
                // Normal Gallery View
                filteredRows.length > 0 ? (
                  <div className="columns-2 lg:columns-3 gap-4 sm:gap-6 md:gap-8">
                    <AnimatePresence mode="popLayout">
                      {filteredRows.map((row, index) => {
                        const imageId = generateImageId(row.Student, row.Timestamp);
                        const isTopPick = top3ImageIds.includes(imageId) && (allLikes[imageId] || 0) > 0;
                        return (
                          <GalleryCard key={imageId} row={row} index={index} isTopPick={isTopPick} />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 border border-black/10 bg-[#fbf3df] shadow-md max-w-xl mx-auto mt-12 rounded-sm"
                  >
                    <ImageIcon size={64} className="mx-auto mb-6 text-black/20" strokeWidth={1} />
                    <h2 className="text-2xl font-bold text-black/80 tracking-wide">No Matching Items</h2>
                    <p className="font-medium mt-2 text-black/50">Try adjusting your search query or filters.</p>
                  </motion.div>
                )
              )}
            </div>
          )}

        </div>
      </main>

      {/* Meetup Details Popup Modal */}
      <AnimatePresence>
        {selectedMeetup && (() => {
          const { day, monthYear } = parseMeetupDate(selectedMeetup.Date);
          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md"
              onClick={() => setSelectedMeetup(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 10, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="relative w-full max-w-md lg:max-w-4xl max-h-[90vh] bg-white shadow-2xl rounded-[24px] flex flex-col lg:flex-row overflow-hidden border border-black/5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button 
                  onClick={() => setSelectedMeetup(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/5 hover:bg-black/10 text-black flex items-center justify-center rounded-full transition-colors z-30"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>

                {/* Poster side */}
                <div className="w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-10 bg-gray-50 border-b lg:border-b-0 lg:border-r border-black/5 shrink-0 max-h-[40vh] lg:max-h-none">
                  <div className="relative h-full lg:h-auto lg:w-full aspect-[3/4] max-w-[280px] lg:max-w-none overflow-hidden shadow-lg bg-white border border-black/5">
                    <CanvaModalEmbed url={selectedMeetup.Poster} />
                  </div>
                </div>

                {/* Info side */}
                <div className="flex-1 p-6 lg:p-10 flex flex-col overflow-y-auto relative bg-white">
                  
                  {/* Region Label */}
                  <div className="mb-4">
                    <span className="inline-block rounded-full bg-[#0f5e48]/10 px-3 py-1 text-[0.85rem] font-semibold text-[#0f5e48]">
                      {selectedMeetup.Region} region
                    </span>
                  </div>

                  {/* Venue */}
                  <div className="mb-6 lg:mb-8 pr-6">
                    <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-black leading-tight">
                      {selectedMeetup.Venue}
                    </h2>
                  </div>

                  {/* Date & Time */}
                  <div className="mb-8 flex items-start gap-4 p-4 lg:p-5 bg-gray-50 border border-black/5">
                    <div className="flex flex-col items-center justify-center bg-white border border-black/10 px-4 py-2 shadow-sm shrink-0">
                      <span className="font-black text-2xl leading-none text-black">{day}</span>
                      <span className="font-bold text-[10px] uppercase tracking-widest mt-1 text-black/60">{monthYear?.split(' ')[0]}</span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[0.85rem] text-black/55">Date</span>
                      <span className="font-bold text-base lg:text-lg text-black mt-0.5">{selectedMeetup.Date}</span>
                    </div>
                  </div>

                  {/* Hosts */}
                  {(() => {
                    const nonEmailHosts = selectedMeetup["Host's ID"]
                      ? selectedMeetup["Host's ID"]
                          .split(",")
                          .map(h => h.trim())
                          .filter(host => host !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(host))
                      : [];

                    if (nonEmailHosts.length > 0) {
                      return (
                        <div className="mb-8">
                          <span className="mb-2 block text-[0.85rem] text-black/55">Hosted by</span>
                          <div className="flex flex-wrap gap-2">
                            {nonEmailHosts.map((host, hi) => {
                              const username = host.replace("@", "");
                              return (
                                <a
                                  key={hi}
                                  href={`https://instagram.com/${username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-black transition-colors"
                                >
                                  <FaInstagram size={14} className="text-pink-600" />
                                  <span>@{username}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Footer Social Actions */}
                  {selectedMeetup["Instagram Post"] && selectedMeetup["Instagram Post"].trim() !== "" && (
                    <div className="mt-auto pt-6 border-t border-black/5">
                      <a
                         href={selectedMeetup["Instagram Post"].trim()}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="kz-focus flex w-full items-center justify-center gap-2 rounded-full bg-[#1c130c] py-3.5 text-[0.95rem] font-semibold text-[#f6b51e] transition-transform hover:-translate-y-0.5"
                      >
                        <FaInstagram size={16} />
                        <span>See the photos on Instagram</span>
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <KzFooter />
    </div>
  );
}
