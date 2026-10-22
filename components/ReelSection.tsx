"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SiInstagram } from "react-icons/si";
import { Play, Loader2, AlertTriangle, Calendar, User, Mic } from "lucide-react";
import { fetchEpisodes, getCachedEpisodes, toDirectImageUrl, type EpisodeRow } from "@/lib/api";

// ─── Mapped episode type ─────────────────────────────────────────────
interface Episode {
  id: string;
  number: string;
  title: string;
  date: string;
  author: string;
  imageUrl: string;
  instagramUrl: string;
}

function mapRowToEpisode(row: EpisodeRow, index: number): Episode {
  return {
    id: `ep-${index + 1}`,
    number: (row["Episode No."] || "").replace(/\D/g, "") || String(index + 1),
    title: row.Title || `Episode ${index + 1}`,
    date: row.Date || "",
    author: row.Host || "",
    imageUrl: toDirectImageUrl(row.Image_url || ""),
    instagramUrl: row.Instagram_url?.trim() || "#",
  };
}

// ─── Featured Episode (Media Player Style) ───────────────────────────
function FeaturedEpisodeCard({ episode }: { episode: Episode }) {
  return (
    <motion.a
      href={episode.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative block w-full rounded-[2rem] group mb-12 shadow-2xl max-w-4xl mx-auto p-[2px] overflow-hidden"
    >
      {/* Animated spinning Instagram gradient border (very slow and smooth, short moving line) */}
      <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_65%,#f09433_75%,#dc2743_85%,#bc1888_92%,transparent_100%)] animate-[spin_12s_linear_infinite] z-0" />

      <div className="relative z-10 w-full h-full bg-[#0a0a0a] rounded-[1.9rem] overflow-hidden hover:bg-[#0f0f0f] transition-colors duration-500">
        {/* Background blurred image */}
        <div className="absolute inset-0 z-0 rounded-[1.9rem] overflow-hidden">
          {episode.imageUrl && (
            <img src={episode.imageUrl} className="w-full h-full object-cover blur-[60px] opacity-20 transform scale-125 saturate-200" alt="" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-14 p-8 md:p-10">
          {/* Cover Art & Vinyl Animation */}
          <div className="relative w-44 h-44 md:w-56 md:h-56 flex-shrink-0 group/cover cursor-pointer">
             {/* Vinyl Record (sliding out) */}
             <div className="absolute inset-0 bg-[#050505] rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center border border-[#1a1a1a] group-hover/cover:translate-x-12 md:group-hover/cover:translate-x-20 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] z-0">
                {/* Vinyl grooves */}
                <div className="absolute inset-2 rounded-full border border-white/[0.03]"></div>
                <div className="absolute inset-4 rounded-full border border-white/[0.02]"></div>
                <div className="absolute inset-6 rounded-full border border-white/[0.04]"></div>
                <div className="absolute inset-8 rounded-full border border-white/[0.02]"></div>
                <div className="absolute inset-10 rounded-full border border-white/[0.05]"></div>
                {/* Center label */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 border-[#111] animate-[spin_4s_linear_infinite]">
                   {episode.imageUrl ? (
                     <img src={episode.imageUrl} className="w-full h-full object-cover saturate-150" alt="Vinyl Label" />
                   ) : (
                     <div className="w-full h-full bg-[#ff5757]"></div>
                   )}
                   <div className="absolute w-3 h-3 bg-black rounded-full border border-white/10"></div>
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none mix-blend-overlay"></div>
             </div>

             {/* Actual Cover - static image on hover */}
             <div className="absolute inset-0 rounded-2xl overflow-hidden bg-[#111] shadow-2xl border border-white/10 z-10 group-hover/cover:-translate-y-2 group-hover/cover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all duration-500 ease-out">
               {episode.imageUrl ? (
                 <img src={episode.imageUrl} className="w-full h-full object-cover" alt={episode.title} />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <Mic size={32} className="text-white/20" />
                 </div>
               )}
               <div className="absolute inset-0 bg-black/10 group-hover/cover:bg-transparent transition-colors" />
             </div>

             {/* Play Button Overlay (centered on cover) */}
             <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover/cover:-translate-y-2">
               <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 scale-90 group-hover/cover:scale-100 transition-transform">
                 <Play size={24} fill="white" className="text-white ml-1.5 drop-shadow-md" />
               </div>
             </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 flex-grow text-center md:text-left w-full relative z-10">
             <div className="inline-flex items-center gap-2.5 justify-center md:justify-start mb-2">
               <span className="flex gap-0.5 items-end h-3.5">
                 <motion.span animate={{ height: ["40%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-[#6fcf97] rounded-sm"></motion.span>
                 <motion.span animate={{ height: ["100%", "30%", "100%"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.1 }} className="w-1 bg-[#6fcf97] rounded-sm"></motion.span>
                 <motion.span animate={{ height: ["60%", "100%", "60%"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-[#6fcf97] rounded-sm"></motion.span>
               </span>
               <span className="text-[#6fcf97] font-bold tracking-widest text-[10px] md:text-xs uppercase bg-[#6fcf97]/10 px-2 py-0.5 rounded border border-[#6fcf97]/20">Now Playing</span>
             </div>
             
             <h3 className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-[1.1] drop-shadow-lg line-clamp-2 my-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#f09433] group-hover:to-[#bc1888] transition-all duration-300">
               {episode.title}
             </h3>

             <p className="text-[13px] text-white/40 leading-relaxed line-clamp-2 font-medium my-2">
               Unfiltered conversations, hot takes, and behind-the-scenes chaos from our house reps. Watch it now!
             </p>
             
             <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-1 text-white/70 text-sm font-medium">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-sm"><User size={14} className="text-[#6fcf97]"/> {episode.author || "House Reps"}</span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-sm"><Calendar size={14} className="text-[#ff90e8]"/> {episode.date || "Recent"}</span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/50">Ep {episode.number}</span>
             </div>

             {/* Action */}
             <div className="mt-6 flex justify-center md:justify-start">
                <div className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white font-bold hover:scale-105 hover:shadow-[0_0_24px_rgba(225,48,108,0.5)] transition-all duration-300 shadow-lg border border-white/20 relative overflow-hidden group/btn">
                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                   <SiInstagram size={20} className="relative z-10" />
                   <span className="relative z-10">Watch on Instagram</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </motion.a>
  );
}


// ─── Episode Grid Card ────────────────────────────────────────────────
function EpisodeGridCard({ episode, index }: { episode: Episode; index: number }) {
  return (
    <motion.a
      href={episode.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
      className="relative block w-full rounded-[1.5rem] group p-[2px] overflow-hidden bg-white/[0.03] border border-white/[0.08] hover:border-transparent transition-colors duration-300 shadow-lg"
    >
      {/* Animated spinning Instagram gradient border on hover */}
      <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_65%,#f09433_75%,#dc2743_85%,#bc1888_92%,transparent_100%)] animate-[spin_12s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />

      <div className="relative z-10 w-full h-full bg-[#0a0a0a] rounded-[1.4rem] overflow-hidden flex flex-col">
        {/* Cover Art - static hover */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#111] border-b border-white/5">
          {episode.imageUrl ? (
            <img 
              src={episode.imageUrl} 
              className="w-full h-full object-cover" 
              alt={episode.title} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <Mic size={24} className="text-white/20" />
            </div>
          )}
          
          {/* Frosted Play button overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play size={18} fill="white" className="text-white ml-0.5 drop-shadow-md" />
            </div>
          </div>
          
          {/* Episode Badge in corner */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs font-semibold text-white/90">
            Ep {episode.number}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-2 flex-grow">
          <h4 className="text-white font-bold text-base line-clamp-2 leading-snug group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#f09433] group-hover:to-[#bc1888] transition-all duration-300">
            {episode.title}
          </h4>
          
          <div className="mt-auto flex flex-col gap-1.5 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <User size={12} className="text-[#6fcf97]" />
              <span className="truncate">{episode.author || "House Reps"}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-white/40">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-[#ff90e8]" />
                <span>{episode.date || "Recent"}</span>
              </div>
              <SiInstagram size={14} className="text-white/30 group-hover:text-[#bc1888] transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

// ─── Main Section ────────────────────────────────────────────────────
export default function ReelSection() {
  const initialEpisodes = getCachedEpisodes();
  const [episodes, setEpisodes] = useState<Episode[]>(() => {
    if (initialEpisodes) {
      const mapped = initialEpisodes.map(mapRowToEpisode);
      return mapped.sort((a, b) => {
        const numA = parseInt(a.number, 10) || 0;
        const numB = parseInt(b.number, 10) || 0;
        return numB - numA;
      });
    }
    return [];
  });
  const [loading, setLoading] = useState(!initialEpisodes);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!initialEpisodes) {
      setLoading(true);
    }
    setError(null);

    fetchEpisodes()
      .then((rows) => {
        if (!cancelled) {
          const mapped = rows.map(mapRowToEpisode);
          // Sort by episode number descending so the biggest number is first
          const sorted = mapped.sort((a, b) => {
            const numA = parseInt(a.number, 10) || 0;
            const numB = parseInt(b.number, 10) || 0;
            return numB - numA;
          });
          setEpisodes(sorted);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load episodes");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="tak" className="relative overflow-hidden bg-[#050505] pt-24 pb-16 md:pt-32 md:pb-24 font-sans">
      {/* Redesigned Premium Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ 
            backgroundImage: "url('/house-stories-bg.png')",
            backgroundPosition: "top center",
            backgroundSize: "100% auto",
            backgroundRepeat: "repeat-y"
          }}
        />
        <div className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-[#1e5631]/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[10%] left-[-10%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full bg-[#1e5631]/10 blur-[100px] mix-blend-screen" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 relative"
        >
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-md section-title">
            Kaziranga Tak
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Two members, a recorder, and endless group chat chaos. Catch every
            episode of our official house podcast.
          </p>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={40} className="animate-spin text-[#6fcf97]" />
            <span className="text-white/60 font-medium tracking-widest uppercase text-sm">Loading Episodes</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-red-950/20 border border-red-900/30 rounded-3xl max-w-2xl mx-auto">
            <AlertTriangle size={32} className="text-red-500" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        {/* Redesigned Playlist Layout */}
        {!loading && !error && episodes.length > 0 && (
          <div className="max-w-6xl mx-auto">
            {/* Massive Featured Episode Card */}
            <FeaturedEpisodeCard episode={episodes[0]} />
            
            {/* Grid of Past Episodes */}
            {episodes.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mt-16"
              >
                <div className="flex items-center gap-4 mb-8 px-1">
                  <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">All Episodes</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/60 text-xs font-bold">{episodes.length}</span>
                  <div className="h-[1px] bg-gradient-to-r from-white/10 to-transparent flex-grow"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                  {(showAll ? episodes : episodes.slice(0, 8)).map((ep, i) => (
                    <EpisodeGridCard key={ep.id} episode={ep} index={i} />
                  ))}
                </div>

                {episodes.length > 8 && (
                  <div className="flex justify-center mt-12">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="px-8 py-3.5 rounded-full border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shadow-lg flex items-center gap-2"
                    >
                      <span>{showAll ? "View Less" : "View More"}</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
