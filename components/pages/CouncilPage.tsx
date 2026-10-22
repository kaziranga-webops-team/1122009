"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  X,
  Phone,
  Mail,
  User,
  Award,
  Crown,
  Globe,
  Palette,
  PenTool,
  Megaphone,
  Video,
  Calendar,
  Code,
  Camera,
  Flag,
} from "lucide-react";
import { fetchCouncil, getCachedCouncil, type CouncilRow } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────
interface CouncilMember {
  id: string;
  name: string;
  stage: string;
  type: string;
  tagline: string;
  phone: string;
  email: string;
  imageUrl: string;
  color?: string;
}

function mapRow(row: CouncilRow, index: number): CouncilMember | null {
  const name = row.Name?.trim();
  if (!name) return null;

  let color = (row.Color || row.color || row.Colour || row.colour || "")?.trim();
  if (color.toLowerCase() === "blue") {
    color = "#3359ff"; // Electric blue
  }

  return {
    id: `council-${index}`,
    name,
    stage: row.Role?.trim() || "",
    type: row["Council Type"]?.trim() || "",
    tagline: row.Tagline?.trim() || "",
    phone: (row.Phone || row[" Phone"] || row["Phone "] || "")?.trim(),
    email: (row.Email || row[" Email"] || row["Email "] || "")?.trim(),
    imageUrl: row["Image URL"]?.trim() || "",
    color: color || undefined,
  };
}

// ─── Get Role Icon Helper ────────────────────────────────────────────
function getRoleIcon(role: string, type: string) {
  const normRole = role.toLowerCase().trim();
  const normType = type.toLowerCase().trim();

  // Web / WebOps / Tech
  if (normRole.includes("web") || normRole.includes("dev") || normRole.includes("tech") || normRole.includes("code") || normType.includes("web")) {
    return <Code size={11} />;
  }
  // Graphics / Design / Creative
  if (normRole.includes("graphic") || normRole.includes("design") || normRole.includes("art") || normRole.includes("creative") || normType.includes("graphic") || normType.includes("design")) {
    return <Palette size={11} />;
  }
  // Content / Writing / Editorial
  if (normRole.includes("content") || normRole.includes("writ") || normRole.includes("edit") || normType.includes("content")) {
    return <PenTool size={11} />;
  }
  // PR / Outreach / Public Relations / Marketing
  if (normRole.includes("pr") || normRole.includes("outreach") || normRole.includes("public relation") || normRole.includes("market") || normType.includes("pr") || normType.includes("outreach")) {
    return <Megaphone size={11} />;
  }
  // Multimedia / Video / Photo
  if (normRole.includes("video") || normRole.includes("film") || normRole.includes("photo") || normRole.includes("media") || normType.includes("multimedia") || normType.includes("media")) {
    if (normRole.includes("photo") || normRole.includes("cam")) {
      return <Camera size={11} />;
    }
    return <Video size={11} />;
  }
  // Event / Management / Coordinator
  if (normRole.includes("event") || normRole.includes("manage") || normRole.includes("coord") || normRole.includes("plan") || normType.includes("event")) {
    return <Calendar size={11} />;
  }
  // Executive / Captain / Leadership
  if (normRole.includes("captain") || normRole.includes("head") || normRole.includes("president") || normRole.includes("secretary") || normRole.includes("treasurer") || normRole.includes("lead") || normRole.includes("chief") || normRole.includes("crown") || normType.includes("upper") || normType.includes("executive")) {
    if (normRole.includes("captain") || normRole.includes("vice")) {
      return <Flag size={11} />;
    }
    return <Crown size={11} />;
  }

  // Fallback
  return <Award size={11} />;
}

// ─── Pop-up Flippable Card ───────────────────────────────────────────
function CouncilCard({
  member,
  index,
  isExecutive,
}: {
  member: CouncilMember;
  index: number;
  isExecutive: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const glowColor = useMemo(() => {
    const type = member.type.toLowerCase().trim();
    const isUHC = type === "upper" || type === "executive" || type.includes("upper") || type.includes("executive");
    const isLHC = type === "lower" || type === "house" || type.includes("lower");
    return (isUHC || isLHC) ? (member.color || "#d4a853") : "#ffffff";
  }, [member.type, member.color]);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsFlipped(false);
      return;
    }
  }, [showPopup]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 12;
    const rotateY = (x - 0.5) * 12;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (el) {
      el.style.transform = "";
    }
  }, []);

  const handleModalMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlipped) return;
    const el = modalRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 12;
    const rotateY = (x - 0.5) * 12;
    el.style.transform = `perspective(800px) rotateY(0deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }, [isFlipped]);

  const handleModalMouseLeave = useCallback(() => {
    const el = modalRef.current;
    if (el) {
      el.style.transform = isFlipped ? "rotateY(180deg)" : "rotateY(0deg)";
    }
  }, [isFlipped]);

  return (
    <>
      {/* CARD IN GRID */}
      <motion.div
        className="council-card-wrapper perspective-1000"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: (index % 10) * 0.1 }}
      >
        <div
          ref={cardRef}
          className="w-full h-full cursor-pointer relative aspect-[4/5] group rounded-2xl overflow-hidden flex flex-col justify-end council-card council-card--cream border-3 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] transition-all"
          style={{
            "--card-glow-color": glowColor,
          } as React.CSSProperties}
          onClick={() => {
            setIsFlipped(false);
            setShowPopup(true);
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsFlipped(false);
              setShowPopup(true);
            }
          }}
          aria-label={`View details for ${member.name}`}
        >
          {/* Card image */}
          <div className="council-card-image">
            {!imgLoaded && !imgError && (
              <div className="council-card-image-skeleton council-card-image-skeleton--cream">
                <User size={40} />
              </div>
            )}
            {imgError ? (
              <div className="council-card-image-skeleton council-card-image-skeleton--cream">
                <User size={40} />
              </div>
            ) : (
              <img
                src={member.imageUrl}
                alt={member.name}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{ opacity: imgLoaded ? 1 : 0 }}
              />
            )}
          </div>

          {/* Hover overlay text */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h4 className="font-serif font-black text-white text-base leading-tight">{member.name}</h4>
            <p className="text-[10px] uppercase font-bold tracking-wider mt-0.5" style={{ color: glowColor }}>
              {member.stage}
            </p>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-white text-[9px] uppercase font-black tracking-widest px-2.5 py-1 border border-white/20 rounded-md bg-black/60 backdrop-blur-sm">
              View Info ↗
            </span>
          </div>
        </div>
      </motion.div>

      {/* POPUP MODAL WITH FLIP */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-default"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-[320px] aspect-[4/5] perspective-1000"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button on modal card container */}
              <button
                onClick={() => setShowPopup(false)}
                className="absolute -top-3.5 -right-3.5 z-[1010] w-8 h-8 rounded-full border-2 border-black bg-[#ff5757] flex items-center justify-center text-black font-black text-xs shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-[#ff4444] transition-all cursor-pointer"
              >
                ✕
              </button>

              {/* Flipping card element */}
              <div
                ref={modalRef}
                className="w-full h-full preserve-3d cursor-pointer relative"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
                  "--card-glow-color": glowColor,
                } as React.CSSProperties}
                onClick={() => setIsFlipped(!isFlipped)}
                onMouseMove={handleModalMouseMove}
                onMouseLeave={handleModalMouseLeave}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setIsFlipped(!isFlipped)}
                aria-label={`View details for ${member.name}`}
              >
                {/* FRONT FACE */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col justify-end council-card council-card--cream border-4 border-black shadow-[8px_8px_0_0_#000]"
                  style={{
                    transform: "rotateY(0deg)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    margin: 0,
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <div className="council-card-image w-full h-full">
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* BACK FACE */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col justify-between p-6"
                  style={{
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    background: "rgba(10, 22, 14, 0.75)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: `1.5px solid color-mix(in srgb, ${glowColor} 40%, rgba(255, 255, 255, 0.15))`,
                    boxShadow: `0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 0 15px color-mix(in srgb, ${glowColor} 15%, transparent)`,
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {/* Blurred background image */}
                  <div className="absolute inset-0 z-0">
                    {!imgError && (
                      <img
                        src={member.imageUrl}
                        alt=""
                        className="w-full h-full object-cover filter blur-[15px] brightness-[0.25] scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-[#0a140c]/50" />
                  </div>

                  {/* Back contents */}
                  <div className="relative z-10 flex flex-col h-full justify-center items-center text-center w-full gap-6">
                    {/* Header */}
                    <div className="flex flex-col items-center w-full">
                      <h3 className="font-serif font-bold text-white text-xl tracking-tight leading-tight m-0 mb-1">{member.name}</h3>
                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border"
                        style={{
                          color: glowColor,
                          borderColor: `color-mix(in srgb, ${glowColor} 30%, transparent)`,
                          background: `color-mix(in srgb, ${glowColor} 10%, transparent)`,
                        }}
                      >
                        {getRoleIcon(member.stage, member.type)}
                        {member.stage}
                      </div>

                      {member.tagline && (
                        <p className="font-sans text-white/80 text-xs leading-relaxed max-w-[220px] mt-3 mb-0 italic font-medium">
                          "{member.tagline}"
                        </p>
                      )}
                    </div>

                    {/* Contact & Footer */}
                    <div className="flex flex-col gap-2.5 w-full">
                      {member.phone && (
                        <a
                          href={`tel:${member.phone}`}
                          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-medium text-white/90"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={13} style={{ color: glowColor }} />
                          <span className="truncate">{member.phone}</span>
                        </a>
                      )}
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-medium text-white/90 text-left"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail size={13} style={{ color: glowColor }} className="shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </a>
                      )}

                      <span className="text-white/40 text-[9px] tracking-wider mt-1.5 font-medium">
                        Click card to flip front
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Tabs Configuration ──────────────────────────────────────────────
const SUB_TABS = [
  { label: "PR & Outreach", value: "PR and Outreach Team", icon: <Megaphone size={12} /> },
  { label: "Graphics", value: "Graphic Team", icon: <Palette size={12} /> },
  { label: "Event Management", value: "Event Management Team", icon: <Calendar size={12} /> },
  { label: "Content", value: "Content Team", icon: <PenTool size={12} /> },
  { label: "Multimedia", value: "Multimedia Team", icon: <Video size={12} /> },
  { label: "WebOps", value: "WebOps Team", icon: <Globe size={12} /> },
];

// ─── Navbar ──────────────────────────────────────────────────────────
interface CouncilNavbarProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  setActiveSubTeam: (sub: string) => void;
}

function CouncilNavbar({
  activeCategory,
  setActiveCategory,
  setActiveSubTeam,
}: CouncilNavbarProps) {
  const categories = [
    { label: "All", value: "All", icon: <Award size={12} /> },
    { label: "UHC", value: "UHC", icon: <Crown size={12} /> },
    { label: "RCs", value: "RC", icon: <Users size={12} /> },
    { label: "Teams", value: "Teams", icon: <Globe size={12} /> },
  ];

  return (
    <div className="w-full fixed top-4 left-0 right-0 z-50 px-4 flex flex-col items-center">
      {/* Floating Main Navbar Capsule */}
      <nav className="w-full max-w-5xl bg-[#092212]/80 backdrop-blur-xl border border-white/10 rounded-full py-2 px-3 sm:px-6 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Back Button */}
        <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-2.5 sm:px-4 sm:py-2 cursor-pointer text-xs font-bold uppercase tracking-wider shadow-sm group">
          <ArrowLeft size={14} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        
        {/* Center: Top-level Category Tabs */}
        <div className="flex bg-black/40 p-1 rounded-full border border-white/5 gap-0.5 min-w-0 max-w-[340px] sm:max-w-lg flex-grow justify-center">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => {
                  setActiveCategory(cat.value);
                  setActiveSubTeam("All");
                }}
                className={`relative flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 sm:px-5 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-300 cursor-pointer snap-align-center select-none ${
                  isActive
                    ? "bg-gradient-to-r from-[#6fcf97] to-[#2ecc71] text-[#051a0d] shadow-[0_4px_12px_rgba(111,207,151,0.25)] font-black scale-105"
                    : "bg-transparent text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="shrink-0 hidden md:inline">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Brand Logo Badge */}
        <div className="flex items-center gap-2 text-white bg-white/5 border border-white/10 rounded-full p-1.5 sm:px-3 sm:py-1.5 select-none shrink-0 shadow-sm">
          <img src="/logo.png" alt="Logo" className="w-6 h-6 object-cover rounded-full border border-white/15" />
          <span className="hidden md:inline font-serif font-black text-[10px] tracking-widest uppercase">Kaziranga</span>
        </div>
      </nav>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────
function SkeletonCards({ count = 3, isExecutive = false }: { count?: number; isExecutive?: boolean }) {
  return (
    <div className={`council-grid ${isExecutive ? 'council-grid--executive' : 'council-grid--house'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="council-skeleton council-skeleton--cream">
          <div className="council-skeleton-image council-skeleton-image--cream" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function CouncilPage() {
  const initialCouncil = getCachedCouncil();

  const seoJsonLd = useMemo(() => ({
    "@type": "Organization",
    "name": "Kaziranga House Council",
    "description": "Meet the elected student council of Kaziranga House at IIT Madras BS Degree — the Mantri, Senapati, Sachiv, and team leads who drive house activities.",
    "parentOrganization": { "@type": "Organization", "name": "IIT Madras BS Degree" },
  }), []);


  const [members, setMembers] = useState<CouncilMember[]>(() => {
    if (initialCouncil) {
      return initialCouncil
        .map(mapRow)
        .filter((m): m is CouncilMember => m !== null);
    }
    return [];
  });
  const [loading, setLoading] = useState(!initialCouncil);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeSubTeam, setActiveSubTeam] = useState<string>("All");

  useEffect(() => {
    window.scrollTo(0, 0);

    let cancelled = false;
    if (!initialCouncil) {
      setLoading(true);
    }
    setError(null);

    fetchCouncil()
      .then((rows) => {
        if (!cancelled) {
          const mapped = rows
            .map(mapRow)
            .filter((m): m is CouncilMember => m !== null);
          setMembers(mapped);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load council");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Group members dynamically
  const groupedTeams = useMemo(() => {
    const groups: Record<string, CouncilMember[]> = {};
    
    members.forEach((m) => {
      const type = m.type.toLowerCase().trim();
      let teamName = "Other Team";
      
      if (type === "upper" || type === "executive" || type.includes("upper") || type.includes("executive")) {
        teamName = "Upper House Council";
      } else if (type === "lower" || type === "house" || type.includes("lower")) {
        teamName = "Lower House Council";
      } else if (type.includes("web") || type.includes("webops") || type.includes("web-ops")) {
        teamName = "WebOps Team";
      } else if (type.includes("graphic") || type.includes("design")) {
        teamName = "Graphic Team";
      } else if (type.includes("pr") || type.includes("outreach") || type.includes("public relations")) {
        teamName = "PR and Outreach Team";
      } else if (type.includes("content")) {
        teamName = "Content Team";
      } else if (type.includes("video") || type.includes("edit") || type.includes("film") || type.includes("media") || type.includes("multimedia")) {
        teamName = "Multimedia Team";
      } else if (type.includes("event") || type.includes("manage") || type.includes("plan")) {
        teamName = "Event Management Team";
      } else if (m.type) {
        teamName = m.type.trim().replace(/\b\w/g, (c) => c.toUpperCase());
      }
      
      if (!groups[teamName]) {
        groups[teamName] = [];
      }
      groups[teamName].push(m);
    });
    
    return groups;
  }, [members]);

  const teamOrder = [
    "Upper House Council",
    "Lower House Council",
    "PR and Outreach Team",
    "Graphic Team",
    "Event Management Team",
    "Content Team",
    "Multimedia Team",
    "WebOps Team"
  ];

  const sortedTeamNames = useMemo(() => {
    const names = Object.keys(groupedTeams);
    return names.sort((a, b) => {
      const idxA = teamOrder.indexOf(a);
      const idxB = teamOrder.indexOf(b);
      
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [groupedTeams]);

  const displayedTeamNames = useMemo(() => {
    if (activeCategory === "UHC") {
      return sortedTeamNames.filter((name) => name === "Upper House Council");
    }
    if (activeCategory === "RC") {
      return sortedTeamNames.filter((name) => name === "Lower House Council");
    }
    if (activeCategory === "Teams") {
      const otherTeams = sortedTeamNames.filter(
        (name) => name !== "Upper House Council" && name !== "Lower House Council"
      );
      if (activeSubTeam === "All") {
        return otherTeams;
      }
      return otherTeams.filter((name) => name === activeSubTeam);
    }
    return sortedTeamNames;
  }, [sortedTeamNames, activeCategory, activeSubTeam]);

  // Helper to get themed icon for each team
  // Helper to get themed icon for each team
  const getTeamIcon = (teamName: string) => {
    const norm = teamName.toLowerCase();
    if (norm.includes("upper")) return <Crown className="text-[#ffc900]" size={28} />;
    if (norm.includes("lower")) return <Users className="text-[#6fcf97]" size={26} />;
    if (norm.includes("web")) return <Globe className="text-[#00e5ff]" size={26} />;
    if (norm.includes("graphic") || norm.includes("design")) return <Palette className="text-[#ff90e8]" size={26} />;
    if (norm.includes("content")) return <PenTool className="text-[#ffc900]" size={26} />;
    if (norm.includes("pr") || norm.includes("outreach")) return <Megaphone className="text-[#ff5757]" size={26} />;
    if (norm.includes("video") || norm.includes("edit") || norm.includes("film") || norm.includes("media") || norm.includes("multimedia")) return <Video className="text-[#9b51e0]" size={26} />;
    if (norm.includes("event") || norm.includes("manage") || norm.includes("plan")) return <Calendar className="text-[#ff9f1c]" size={26} />;
    return <Award className="text-[#6fcf97]" size={26} />;
  };

  // Helper to determine grid class
  const getGridClass = (teamName: string) => {
    return teamName === "Upper House Council" ? "council-grid--executive" : "council-grid--house";
  };

  return (
    <div 
      className="min-h-screen flex flex-col font-sans selection:bg-[#6fcf97] selection:text-black text-white"
      style={{ background: "radial-gradient(circle at 0% 0%, #031007, #072111)" }}
    >
      <CouncilNavbar
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        setActiveSubTeam={setActiveSubTeam}
      />

      <main className="flex-grow">
        <section 
          className="evt-section council-section min-h-[calc(100vh-64px)] relative transition-all duration-300 !pt-28 md:!pt-36"
          style={{ background: "radial-gradient(circle at 0% 0%, #031007, #072111)" }}
        >
          {/* Premium Background (Kaziranga Tak Style) */}
          <div 
            className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
            style={{ background: "radial-gradient(circle at 0% 0%, #031007, #072111)" }}
          >
            <div 
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ 
                backgroundImage: "url('/house-stories-bg.png')",
                backgroundPosition: "top center",
                backgroundSize: "100% auto",
                backgroundRepeat: "repeat-y"
              }}
            />
            <div className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-[#1e5631]/20 blur-[120px] mix-blend-screen" />
            <div className="absolute bottom-[10%] left-[-10%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full bg-[#1e5631]/10 blur-[100px] mix-blend-screen" />
            {/* Subtle grid pattern at the top (fades out very early) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_15%_at_50%_0%,#000_0%,transparent_100%)]" />
            {/* Subtle grid pattern at the bottom (fades out very early going up) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_15%_at_50%_100%,#000_0%,transparent_100%)]" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            {/* Header shifted up */}
            {activeCategory === "All" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="council-header !mb-8 md:!mb-12"
              >
                <div className="council-badge council-badge--dark">
                  <Users size={16} />
                  Student Council 2025-26
                </div>
                <h1 className="council-title council-title--dark">
                  The Team Behind Kaziranga House
                </h1>
              </motion.div>
            )}

            {/* Inline Sub-Navbar for Teams (appears below the main navbar in normal page content flow) */}
            <AnimatePresence>
              {activeCategory === "Teams" && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -10 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="w-max max-w-full mx-auto bg-[#092212]/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-lg mb-8"
                >
                  <div className="px-3 py-2 flex items-center justify-start md:justify-center gap-1 overflow-x-auto no-scrollbar scroll-smooth snap-x">
                    {SUB_TABS.map((sub) => {
                      const isActive = activeSubTeam === sub.value;
                      return (
                        <button
                          key={sub.value}
                          onClick={() => {
                            if (activeSubTeam === sub.value) {
                              setActiveSubTeam("All");
                            } else {
                              setActiveSubTeam(sub.value);
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold transition-all duration-300 border cursor-pointer shrink-0 snap-align-start select-none ${
                            isActive
                              ? "bg-[#6fcf97] text-[#051a0d] border-[#6fcf97] shadow-sm font-bold scale-105"
                              : "bg-transparent text-white/60 border-white/10 hover:text-white hover:bg-white/5 hover:border-white/15"
                          }`}
                        >
                          <span className="shrink-0">{sub.icon}</span>
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && (
              <div className="space-y-16">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#f5f0e1] mb-8 text-center">Upper House Council</h2>
                  <SkeletonCards count={3} isExecutive={true} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#f5f0e1] mb-8 text-center">Lower House Council</h2>
                  <SkeletonCards count={4} />
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="section-error mt-8 mx-auto max-w-md">
                <AlertTriangle size={24} />
                <div className="text-center">
                  <h3 className="font-bold mb-1 text-white">Failed to Load</h3>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && members.length > 0 && (
              <div className="space-y-20">
                {displayedTeamNames.map((teamName: string, teamIdx: number) => {
                  const teamMembers = groupedTeams[teamName] || [];
                  if (teamMembers.length === 0) return null;
                  const isExecutive = teamName === "Upper House Council";
                  
                  return (
                    <div key={teamName}>
                      {teamIdx > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          className="w-full h-px bg-gradient-to-r from-transparent via-[#6fcf97]/30 to-transparent mb-16"
                        />
                      )}
                      
                      <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl md:text-3xl font-serif font-bold text-[#f5f0e1] mb-10 text-center flex items-center justify-center gap-3"
                      >
                        {getTeamIcon(teamName)}
                        {teamName}
                      </motion.h2>
                      
                      <div className={`council-grid ${getGridClass(teamName)}`}>
                        {teamMembers.map((member: CouncilMember, i: number) => (
                          <CouncilCard
                            key={member.id}
                            member={member}
                            index={i}
                            isExecutive={isExecutive}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && !error && members.length === 0 && (
              <div className="evt-empty max-w-2xl mx-auto py-16 text-white/80">
                <span className="evt-empty-emoji">🦏</span>
                <p>Council information is being updated.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
