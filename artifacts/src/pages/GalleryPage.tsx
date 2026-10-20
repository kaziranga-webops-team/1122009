import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Image as ImageIcon, ArrowLeft, ArrowRight, Loader2, AlertTriangle, RefreshCw, Heart, Search, X, ChevronDown, Folder, Zap, Calendar, Mail } from "lucide-react";
import { FaInstagram, FaWhatsapp, FaYoutube, FaLinkedin } from "react-icons/fa";
import { SiLinktree } from "react-icons/si";
import { fetchGallery, fetchMeetups, getCachedGallery, getCachedMeetups, toDirectImageUrl, type GalleryRow, type MeetupRow } from "../api";
import { useLikes, useAllLikes } from "../hooks/useLikes";
import { generateImageId } from "../lib/firebase";
import { useSEO } from "@/hooks/useSEO";
import FolderComponent from "../components/Folder";


const CATEGORIES = ["All", "Meetups", "Meme", "Sticker", "Photograph", "Screenshot", "Creativity"];

// ─── Accent colours cycling on cards ─────────────────────────────────────────
const CARD_COLORS = [
  "bg-[#6fcf97]",
  "bg-[#ff90e8]",
  "bg-[#ffc900]",
  "bg-[#00e5ff]",
  "bg-white",
  "bg-[#ff5757]",
  "bg-[#9b51e0] text-white",
];

const getCategoryBadgeColor = (category: string) => {
  const cat = category?.trim().toLowerCase();
  if (cat === "meetups" || cat === "meetup") return "bg-[#ffc900]";
  if (cat === "meme") return "bg-[#6fcf97]";
  if (cat === "sticker") return "bg-[#00e5ff]";
  if (cat === "photograph") return "bg-[#ff90e8]";
  if (cat === "screenshot") return "bg-white";
  return "bg-[#ff5757]"; // Creativity
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
interface ScrapbookNavbarProps {
  selectedRegion: string | null;
  onBackToRegions: () => void;
  meetupCount?: number;
  isMeetupsActive: boolean;
  onMeetupsClick: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setSelectedRegion: (region: string | null) => void;
  creativeDropdownOpen: boolean;
  setCreativeDropdownOpen: (open: boolean) => void;
  setLocation: (path: string) => void;
}

function ScrapbookNavbar({
  selectedRegion,
  onBackToRegions,
  meetupCount = 0,
  isMeetupsActive,
  onMeetupsClick,
  activeTab,
  setActiveTab,
  setSelectedRegion,
  creativeDropdownOpen,
  setCreativeDropdownOpen,
  setLocation,
}: ScrapbookNavbarProps) {
  if (selectedRegion) {
    return (
      <nav className="w-full sticky top-0 z-50 py-4 px-4 bg-[#f4f0e6]/90 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between border border-black/10 bg-[#fdfbf7] py-3 px-4 md:px-6 shadow-[2px_4px_12px_rgba(0,0,0,0.08)] rounded-md w-full relative">
            <div className="absolute -top-2 left-6 w-16 h-5 bg-[#00e5ff]/50 mix-blend-multiply transform -rotate-2 z-20">
              <div className="w-full h-full border-x-2 border-dotted border-white/30"></div>
            </div>
            
            <button
              onClick={onBackToRegions}
              className="flex items-center gap-1.5 h-10 px-4 border border-black/10 bg-[#fdfbf7] text-black font-bold uppercase text-xs tracking-wide shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer rounded-sm shrink-0"
            >
              <ArrowLeft size={14} />
              <span>All Regions</span>
            </button>
            
            <h2 className="font-bold text-lg md:text-2xl lg:text-3xl text-black text-center flex-grow mx-4 truncate leading-none">
              {selectedRegion}
            </h2>
            
            <div className="flex items-center gap-1.5 h-10 px-4 bg-[#ffc900]/90 border border-black/10 font-bold text-xs uppercase tracking-wide shadow-sm rounded-sm shrink-0 transform rotate-1">
              <span>{meetupCount} {meetupCount === 1 ? "Meetup" : "Meetups"}</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full bg-[#f4f0e6] border-b border-black/10 sticky top-0 z-50 py-3 px-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-4 relative">
        {/* Navigation Buttons wrapper */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-4">
          <Link href="/" className="group flex items-center gap-2 h-10 px-4 border border-black/10 bg-[#fdfbf7] text-black font-bold uppercase tracking-wide shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer rounded-sm transform -rotate-1">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm md:text-base">Home</span>
          </Link>
          
          {/* Mobile Meetups Button */}
          <button
            onClick={onMeetupsClick}
            className={`lg:hidden flex items-center gap-1.5 h-10 px-4 border border-black/10 font-bold uppercase text-xs tracking-wide shadow-sm active:translate-y-0.5 hover:shadow-md transition-all cursor-pointer rounded-sm transform rotate-1
              ${isMeetupsActive 
                ? "bg-[#ffc900]/90 text-black shadow-inner" 
                : "bg-white text-black"
              }`}
          >
            <Folder size={14} className={isMeetupsActive ? "fill-black" : ""} />
            <span>Meetups</span>
          </button>
        </div>

        {/* Category Navbar in place of GALLERY title */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 border border-black/10 bg-white p-1.5 shadow-sm rounded-md w-full sm:w-auto max-w-full relative">
          <div className="absolute -top-2 right-12 w-12 h-4 bg-[#ff90e8]/50 mix-blend-multiply transform rotate-3 z-20">
             <div className="w-full h-full border-x-2 border-dotted border-white/30"></div>
          </div>
          {/* All Button */}
          <button
            onClick={() => {
              setLocation("/gallery?tab=images");
              setActiveTab("All");
              setSelectedRegion(null);
            }}
            className={`h-8 md:h-10 px-2.5 md:px-4 font-bold text-[10px] md:text-xs tracking-wide transition-all cursor-pointer rounded-sm border-b-2
              ${activeTab === "All" 
                ? "border-[#6fcf97] text-black bg-[#f4f0e6]/50" 
                : "border-transparent text-black/60 hover:bg-[#f4f0e6]/50 hover:text-black"
              }`}
          >
            All
          </button>

          {/* Photographs Button */}
          <button
            onClick={() => {
              setLocation("/gallery?tab=images");
              setActiveTab("Photograph");
              setSelectedRegion(null);
            }}
            className={`h-8 md:h-10 px-2.5 md:px-4 font-bold text-[10px] md:text-xs tracking-wide transition-all cursor-pointer rounded-sm border-b-2
              ${activeTab === "Photograph" 
                ? "border-[#ff90e8] text-black bg-[#f4f0e6]/50" 
                : "border-transparent text-black/60 hover:bg-[#f4f0e6]/50 hover:text-black"
              }`}
          >
            Photographs
          </button>

          {/* Creativity Button */}
          <button
            onClick={() => {
              setLocation("/gallery?tab=images");
              setActiveTab("Creativity");
              setSelectedRegion(null);
            }}
            className={`h-8 md:h-10 px-2.5 md:px-4 font-bold text-[10px] md:text-xs tracking-wide transition-all cursor-pointer rounded-sm border-b-2
              ${activeTab === "Creativity" 
                ? "border-[#00e5ff] text-black bg-[#f4f0e6]/50" 
                : "border-transparent text-black/60 hover:bg-[#f4f0e6]/50 hover:text-black"
              }`}
          >
            Creativity
          </button>

          {/* Dropdown for Fun Categories */}
          <div className="relative creative-dropdown-container">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCreativeDropdownOpen(!creativeDropdownOpen);
              }}
              className={`h-8 md:h-10 px-2.5 md:px-4 font-bold text-[10px] md:text-xs tracking-wide transition-all cursor-pointer rounded-sm border-b-2 flex items-center gap-1
                ${["Meme", "Screenshot", "Sticker"].includes(activeTab)
                  ? "border-[#ff5757] text-black bg-[#f4f0e6]/50"
                  : "border-transparent text-black/60 hover:bg-[#f4f0e6]/50 hover:text-black"
                }`}
            >
              <span>
                {["Meme", "Screenshot", "Sticker"].includes(activeTab) 
                  ? activeTab === "Meme" 
                    ? "Memes" 
                    : activeTab === "Screenshot" 
                      ? "Screenshots" 
                      : "Stickers"
                  : "Fun"}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${creativeDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {creativeDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-50 right-0 mt-2 bg-white border border-black/10 shadow-lg overflow-hidden p-1 flex flex-col gap-1 w-44 rounded-sm"
                >
                  <button
                    onClick={() => {
                      setLocation("/gallery?tab=images");
                      setActiveTab("Meme");
                      setSelectedRegion(null);
                      setCreativeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 font-bold text-xs tracking-wide rounded-sm transition-colors
                      ${activeTab === "Meme" 
                        ? "bg-[#6fcf97]/20 text-black border-l-2 border-[#6fcf97]" 
                        : "text-black/70 hover:bg-[#f4f0e6]"
                      }`}
                  >
                    Memes
                  </button>

                  <button
                    onClick={() => {
                      setLocation("/gallery?tab=images");
                      setActiveTab("Screenshot");
                      setSelectedRegion(null);
                      setCreativeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 font-bold text-xs tracking-wide rounded-sm transition-colors
                      ${activeTab === "Screenshot" 
                        ? "bg-[#00e5ff]/20 text-black border-l-2 border-[#00e5ff]" 
                        : "text-black/70 hover:bg-[#f4f0e6]"
                      }`}
                  >
                    Screenshots
                  </button>

                  <button
                    onClick={() => {
                      setLocation("/gallery?tab=images");
                      setActiveTab("Sticker");
                      setSelectedRegion(null);
                      setCreativeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 font-bold text-xs tracking-wide rounded-sm transition-colors
                      ${activeTab === "Sticker" 
                        ? "bg-[#ff90e8]/20 text-black border-l-2 border-[#ff90e8]" 
                        : "text-black/70 hover:bg-[#f4f0e6]"
                      }`}
                  >
                    Stickers
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Meetups Button */}
        <button
          onClick={onMeetupsClick}
          className={`hidden lg:flex items-center gap-1.5 h-10 px-4 border border-black/10 font-bold uppercase text-xs tracking-wide shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer rounded-sm transform rotate-1
            ${isMeetupsActive 
              ? "bg-[#ffc900]/90 text-black shadow-inner" 
              : "bg-white text-black"
            }`}
        >
          <Folder size={14} className={isMeetupsActive ? "fill-black" : ""} />
          <span>Meetups</span>
        </button>
      </div>
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function ScrapbookFooter() {
  const socialLinks = [
    { icon: <FaInstagram size={18} />, url: "https://www.instagram.com/kaziranga_iitm/", color: "bg-[#ff90e8]" },
    { icon: <FaWhatsapp size={18} />, url: "https://forms.gle/Ac5Zxwn21cRMeEcy8", color: "bg-[#6fcf97]" },
    { icon: <FaYoutube size={18} />, url: "http://www.youtube.com/@KazirangaHouse", color: "bg-[#ff5757]" },
    { icon: <FaLinkedin size={18} />, url: "https://www.linkedin.com/company/kaziranga-iitm", color: "bg-[#00e5ff]" },
    { icon: <SiLinktree size={18} />, url: "https://linktr.ee/KazirangaHouseBS", color: "bg-[#43E55E]" },
  ];

  return (
    <footer className="w-full bg-[#f8f5eb] border-t border-black/10 py-12 text-black overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] opacity-60 mix-blend-multiply" />
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
        <h2 className="font-bold text-2xl md:text-3xl tracking-tight mb-2 transform -rotate-1 relative inline-block">
          <span className="absolute inset-0 bg-[#00e5ff]/30 transform rotate-2 -z-10 rounded-sm"></span>
          Stay Wild.
        </h2>
        <div className="w-12 h-1 bg-black/20 rounded-full mb-6"></div>
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {socialLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-12 h-12 flex items-center justify-center text-black/80 bg-white border border-black/10 rounded-full shadow-sm hover:-translate-y-1 hover:shadow-md transition-all ${
                i % 2 === 0 ? "transform rotate-3" : "transform -rotate-2"
              }`}
            >
              <div className={`absolute inset-0 rounded-full opacity-20 ${link.color}`}></div>
              {link.icon}
            </a>
          ))}
        </div>
        <div className="font-medium text-xs md:text-sm text-black/50 tracking-wider">
          © {new Date().getFullYear()} Kaziranga House
        </div>
      </div>
    </footer>
  );
}

// ─── Region Colors and Helpers ──────────────────────────────────────────────
const REGION_COLORS: Record<string, string> = {
  bengaluru: "bg-[#6fcf97]",
  chandigarh: "bg-[#ff90e8]",
  chennai: "bg-[#ffc900]",
  delhi: "bg-[#00e5ff]",
  hyderabad: "bg-[#ff5757]",
  kolkata: "bg-[#9b51e0] text-black",
  mumbai: "bg-white",
  patna: "bg-[#6fcf97]",
  lucknow: "bg-[#ff90e8]"
};

function getRegionColor(region: string): string {
  const norm = region.toLowerCase().trim();
  return REGION_COLORS[norm] || "bg-[#ffc900]";
}

const REGION_HEX_COLORS: Record<string, string> = {
  bengaluru: "#6fcf97",
  chandigarh: "#ff90e8",
  chennai: "#ffc900",
  delhi: "#00e5ff",
  hyderabad: "#ff5757",
  kolkata: "#9b51e0",
  mumbai: "#d1d5db",
  patna: "#6fcf97",
  lucknow: "#ff90e8"
};

function getRegionHexColor(region: string): string {
  const norm = region.toLowerCase().trim();
  return REGION_HEX_COLORS[norm] || "#ffc900";
}

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
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#fdfbf7]">
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
        className="w-full h-full object-contain bg-[#f4f0e6]"
      />
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#fdfbf7] gap-4">
      <span className="font-bold text-sm uppercase text-black/55 tracking-wide">Poster Link Available</span>
      <a
        href={url.trim()}
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 border border-black/10 bg-[#ffc900]/90 font-bold text-sm uppercase shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer rounded-sm text-black"
      >
        View Poster ↗
      </a>
    </div>
  );
}

// ─── Folder Card Component ───────────────────────────────────────────────────
interface FolderCardProps {
  region: string;
  count: number;
  meetups: MeetupRow[];
  onClick: () => void;
  index: number;
}

function FolderCard({ region, count, meetups, onClick, index }: FolderCardProps) {
  const hexColor = getRegionHexColor(region);
  
  const papers = meetups.slice(0, 3).map((meetup, idx) => {
    const posterUrl = meetup.Poster ? toDirectImageUrl(meetup.Poster) : "";
    const hasImage = posterUrl && (
      posterUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || 
      posterUrl.includes("lh3.googleusercontent.com")
    );

    return (
      <div key={idx} className="w-full h-full p-1 flex flex-col relative rounded-[10px] overflow-hidden group">
        {hasImage ? (
          <img src={posterUrl} alt="" className="w-full h-full object-cover rounded-md pointer-events-none" />
        ) : (
          <div className="w-full h-full bg-black/5 rounded-md flex items-center justify-center">
            <span className="font-bold text-[8px] text-black/40 uppercase tracking-wider block text-center">Meetup</span>
          </div>
        )}
      </div>
    );
  });

  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center justify-between p-5 bg-[#fdfbf7] border border-black/10 rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group/card cursor-pointer"
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]" />
      
      <div className="h-[190px] w-full flex items-center justify-center relative mt-2 mb-2 z-10">
        <FolderComponent 
          size={1.8} 
          color={hexColor} 
          items={papers} 
          label={region}
          subLabel={`${count} ${count === 1 ? 'Meetup' : 'Meetups'}`}
          className="absolute" 
        />
      </div>
      
      <div className="w-full z-10 mt-2">
        <button 
          onClick={onClick}
          className="w-full py-3.5 bg-white border border-black/10 text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-black hover:text-white hover:border-black shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
        >
          View Region
        </button>
      </div>
    </div>
  );
}

// ─── Meetup Card Component ───────────────────────────────────────────────────
interface MeetupCardProps {
  meetup: MeetupRow;
  index: number;
  onClick: () => void;
}

function MeetupCard({ meetup, index, onClick }: MeetupCardProps) {
  const { embedUrl, loading } = useCanvaEmbed(meetup.Poster);
  
  const cleanHosts = useMemo(() => {
    if (!meetup["Host's ID"]) return "";
    return meetup["Host's ID"]
      .split(",")
      .map(h => h.trim())
      .join(", ");
  }, [meetup]);

  const { day, monthYear } = useMemo(() => parseMeetupDate(meetup.Date), [meetup.Date]);
  const hasPoster = meetup.Poster && meetup.Poster.trim() !== "";
  
  return (
    <div 
      onClick={onClick}
      className="relative group flex flex-col p-4 bg-white border border-black/10 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ease-out cursor-pointer z-10"
    >
      {/* Poster Image / Embed */}
      <div className="relative w-full aspect-[3/4] bg-gray-50 border border-black/5 rounded-xl overflow-hidden mb-4">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-black/30" size={24} strokeWidth={2} />
            <span className="font-medium text-xs text-black/40 uppercase tracking-wider">Loading...</span>
          </div>
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-none pointer-events-none transition-transform duration-500"
            allowFullScreen
            loading="lazy"
            title="Canva Poster"
          />
        ) : hasPoster && meetup.Poster.trim().match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
          <img
            src={meetup.Poster.trim()}
            alt="Meetup Poster"
            className="w-full h-full object-cover transition-transform duration-500"
            loading="lazy"
          />
        ) : hasPoster ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-3">
            <span className="font-medium text-sm text-black/50">Attached Photo</span>
            <button
              onClick={(e) => { e.stopPropagation(); window.open(meetup.Poster.trim(), "_blank"); }}
              className="px-4 py-1.5 border border-black/10 bg-white font-medium text-xs shadow-sm hover:bg-gray-50 transition-colors text-black/70 rounded-md"
            >
              View original
            </button>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ImageIcon className="text-black/10 mb-2" size={32} />
            <span className="font-medium text-xs text-black/40">No Photo</span>
          </div>
        )}

        {/* Floating Date Badge */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-black/10 px-2.5 py-1.5 rounded-lg shadow-sm flex flex-col items-center justify-center group-hover:scale-105 transition-transform">
          <span className="font-black text-sm text-black leading-none">{day}</span>
          <span className="font-bold text-[9px] text-black/60 uppercase tracking-widest mt-1 leading-none">{monthYear?.split(' ')[0]}</span>
        </div>
      </div>

      {/* Details Section */}
      <div className="flex flex-col flex-1 px-1">
        {/* Meetup Title (Venue) */}
        <h4 className="font-bold text-lg text-black leading-tight line-clamp-2" title={meetup.Venue}>
          {meetup.Venue}
        </h4>

        {/* Host Info */}
        {(() => {
          const nonEmailHosts = meetup["Host's ID"]
            ? meetup["Host's ID"]
                .split(",")
                .map(h => h.trim())
                .filter(host => host !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(host))
            : [];
          
          if (nonEmailHosts.length === 0) return null;

          return (
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className="font-medium text-black/40 text-xs">Organized by</span>
              {nonEmailHosts.map((host, hi) => {
                const username = host.replace("@", "");
                return (
                  <span 
                    key={hi} 
                    className="font-semibold text-black/70 text-xs bg-gray-100 px-2 py-0.5 rounded-md"
                    title={host}
                  >
                    {username}
                  </span>
                );
              })}
            </div>
          );
        })()}

        {/* Links / Annotations */}
        {meetup["Instagram Post"] && meetup["Instagram Post"].trim() !== "" ? (
          <div className="mt-4 pt-3 border-t border-black/5 shrink-0 flex items-center">
            <a
              href={meetup["Instagram Post"].trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-100 rounded-lg hover:bg-pink-100 transition-colors text-pink-600"
            >
              <FaInstagram size={14} />
              <span className="font-bold text-xs uppercase tracking-wider">View Memories</span>
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────
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
      className="break-inside-avoid border border-black/10 bg-[#fdfbf7] shadow-[2px_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[4px_12px_24px_rgba(0,0,0,0.15)] transition-shadow duration-200 cursor-pointer flex flex-col relative group overflow-hidden rounded-sm mb-4 sm:mb-6 md:mb-8 w-full"
    >
      {/* Window chrome: traffic lights (left) + category badge (right) */}
      <div className="w-full h-8 border-b border-black/10 bg-[#f4f0e6] flex items-center justify-between px-3 shrink-0">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full border border-black/20 bg-[#ff5757]/80"></div>
          <div className="w-2.5 h-2.5 rounded-full border border-black/20 bg-[#ffc900]/80"></div>
          <div className="w-2.5 h-2.5 rounded-full border border-black/20 bg-[#6fcf97]/80"></div>
        </div>
        <span className={`inline-block px-2 py-0.5 border border-black/10 text-black/70 text-[9px] font-bold uppercase shadow-sm rounded-sm ${getCategoryBadgeColor(row.Category)}`}>
          {row.Category}
        </span>
      </div>

      {/* Image Container */}
      <div className="relative w-full bg-[#f4f0e6] overflow-hidden border-b border-black/10">
        {/* Top Pick Badge (on the image) */}
        {isTopPick && (
          <div className="absolute top-2 right-2 z-20 bg-[#ffc900]/90 border border-black/10 px-2 py-1 shadow-sm transform rotate-2 flex items-center gap-1 font-bold text-[10px] uppercase rounded-sm backdrop-blur-sm">
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
            src={row.Image_url.trim()}
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
          className={`shrink-0 flex items-center gap-1.5 h-8 px-2.5 rounded-sm border border-black/10 font-bold text-xs shadow-sm active:translate-y-0.5 active:shadow-none transition-all cursor-pointer ${hasLiked ? "bg-[#ff5757]/90 text-white" : "bg-white text-black hover:bg-[#f4f0e6]"}`}
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
  const [location, setLocation] = useLocation();

  const seoJsonLd = useMemo(() => ({
    "@type": "CollectionPage",
    "name": "Meetups & Gallery — Kaziranga House",
    "description": "Browse photos, memes, and memories from Kaziranga House meetups across India. A scrapbook of student life at IIT Madras BS Degree.",
    "isPartOf": { "@type": "WebSite", "name": "Kaziranga House", "url": "https://kaziranga-house.vercel.app" },
  }), []);

  useSEO({
    title: "Meetups & Gallery — Photos, Memes & Memories",
    description: "Explore the Kaziranga House gallery — meetup photos, memes, stickers, and creative content from IIT Madras BS Degree students across India.",
    path: "/gallery",
    jsonLd: seoJsonLd,
  });

  const [rows, setRows] = useState<GalleryRow[]>(() => {
    if (initialGallery) {
      return initialGallery.filter((r) => String(r.Approved).trim().toUpperCase() === "TRUE");
    }
    return [];
  });
  const [meetups, setMeetups] = useState<MeetupRow[]>(initialMeetups || []);
  const [loading, setLoading] = useState(!initialGallery || !initialMeetups);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
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
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) {
      if (tabParam.toLowerCase() === "meetups") {
        setActiveTab("Meetups");
      } else if (tabParam.toLowerCase() === "images") {
        setActiveTab("All");
      }
    }
  }, [location]);

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
    <div className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-white bg-[#f8f5eb] relative">
      <ScrapbookNavbar 
        selectedRegion={selectedRegion} 
        onBackToRegions={() => setSelectedRegion(null)} 
        meetupCount={filteredMeetupsForRegion.length}
        isMeetupsActive={activeTab === "Meetups"}
        onMeetupsClick={() => {
          setLocation("/gallery?tab=meetups");
          setActiveTab("Meetups");
          setSelectedRegion(null);
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSelectedRegion={setSelectedRegion}
        creativeDropdownOpen={creativeDropdownOpen}
        setCreativeDropdownOpen={setCreativeDropdownOpen}
        setLocation={setLocation}
      />

      {/* Scrapbook Textures Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] opacity-60 mix-blend-multiply" />
      <div
        className="fixed inset-0 pointer-events-none z-0 mix-blend-multiply"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.035,
        }}
      />

      <main className="flex-grow pt-6 pb-24 relative z-10">
        <div className="container mx-auto px-4 md:px-6">

          {/* Meetups Stats Header */}
          {!loading && !error && activeTab === "Meetups" && !selectedRegion && (
            <div className="max-w-4xl mx-auto mb-8 flex justify-center gap-4">
              {/* Regions Badge */}
              <div className="flex items-center gap-2 px-5 py-2.5 bg-[#fdfbf7] border border-black/10 font-bold uppercase tracking-wide shadow-sm text-sm md:text-base rounded-sm transform -rotate-1">
                <Folder size={18} className="text-black/80" />
                <span>{uniqueRegions.length} Regions</span>
              </div>
              
              {/* Archives Badge */}
              <div className="flex items-center gap-2 px-5 py-2.5 bg-[#ffc900]/90 border border-black/10 font-bold uppercase tracking-wide shadow-sm text-sm md:text-base rounded-sm transform rotate-1">
                <Zap size={18} className="text-black/80 fill-black/80" />
                <span>{meetups.length} Archives</span>
              </div>
            </div>
          )}

          {/* Add Post Button (Top Right, below Navbar) */}
          {!loading && !error && activeTab !== "Meetups" && (
            <div className="flex justify-end mb-6">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSd-_J0oyeosBlrEkVFYDyUPvKOIhighKdzm_ngR2j4kFuAZyw/viewform?usp=header"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-10 px-4 border border-black/10 bg-[#ffc900]/90 text-black font-bold uppercase text-xs tracking-wide shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer rounded-sm shrink-0"
              >
                <span>Add Post ↗</span>
              </a>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col gap-8 pt-4">
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 border-[3px] border-black/10 border-t-[#ffc900] rounded-full animate-spin"></div>
                  <div className="absolute w-8 h-8 border-[3px] border-transparent border-t-[#6fcf97] rounded-full animate-spin [animation-direction:reverse]"></div>
                </div>
                <p className="font-bold uppercase text-xs tracking-wider text-black/50 animate-pulse mt-2">
                  Curating the gallery…
                </p>
              </div>
              <LoadingSkeleton />
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="border border-black/10 bg-[#ff5757]/10 shadow-md p-8 md:p-12 max-w-lg w-full text-center flex flex-col items-center gap-4 rounded-sm">
                <AlertTriangle size={52} strokeWidth={2} className="text-[#ff5757]" />
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                        className="text-center py-20 border border-black/10 bg-[#fdfbf7] shadow-md max-w-xl mx-auto mt-12 rounded-sm"
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                        {filteredRegions.map((region, index) => {
                          const regionMeetups = meetupsByRegion[region] || [];
                          return (
                            <FolderCard
                              key={region}
                              region={region}
                              count={regionMeetups.length}
                              meetups={regionMeetups}
                              onClick={() => setSelectedRegion(region)}
                              index={index}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20 border border-black/10 bg-[#fdfbf7] shadow-md max-w-xl mx-auto mt-12 rounded-sm"
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
                    className="text-center py-20 border border-black/10 bg-[#fdfbf7] shadow-md max-w-xl mx-auto mt-12 rounded-sm"
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
                  <div className="relative h-full lg:h-auto lg:w-full aspect-[3/4] max-w-[280px] lg:max-w-none rounded-xl overflow-hidden shadow-lg bg-white border border-black/5">
                    <CanvaModalEmbed url={selectedMeetup.Poster} />
                  </div>
                </div>

                {/* Info side */}
                <div className="flex-1 p-6 lg:p-10 flex flex-col overflow-y-auto relative bg-white">
                  
                  {/* Region Label */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase tracking-widest rounded-md">
                      {selectedMeetup.Region} Region
                    </span>
                  </div>

                  {/* Venue */}
                  <div className="mb-6 lg:mb-8 pr-6">
                    <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-black leading-tight">
                      {selectedMeetup.Venue}
                    </h2>
                  </div>

                  {/* Date & Time */}
                  <div className="mb-8 flex items-start gap-4 p-4 lg:p-5 bg-gray-50 rounded-xl border border-black/5">
                    <div className="flex flex-col items-center justify-center bg-white border border-black/10 rounded-lg px-4 py-2 shadow-sm shrink-0">
                      <span className="font-black text-2xl leading-none text-black">{day}</span>
                      <span className="font-bold text-[10px] uppercase tracking-widest mt-1 text-black/60">{monthYear?.split(' ')[0]}</span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="font-semibold text-black/50 text-xs uppercase tracking-wider">Date & Time</span>
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
                          <span className="font-semibold text-black/50 text-xs uppercase tracking-wider block mb-2">Hosted by</span>
                          <div className="flex flex-wrap gap-2">
                            {nonEmailHosts.map((host, hi) => {
                              const username = host.replace("@", "");
                              return (
                                <a
                                  key={hi}
                                  href={`https://instagram.com/${username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-black rounded-lg transition-colors"
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
                         className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-sm tracking-widest uppercase shadow-md hover:shadow-lg transition-all rounded-xl"
                      >
                        <FaInstagram size={16} />
                        <span>View Memories on Instagram</span>
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <ScrapbookFooter />
    </div>
  );
}
