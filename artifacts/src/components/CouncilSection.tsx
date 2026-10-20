import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Users,
  Loader2,
  AlertTriangle,
  X,
  Phone,
  Mail,
  ArrowRight,
  User,
  Award,
} from "lucide-react";
import { fetchCouncil, getCachedCouncil, type CouncilRow } from "../api";


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

// ─── Flippable 3D Card ──────────────────────────────────────────────
function CouncilCard({
  member,
}: {
  member: CouncilMember;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Touch-tap detection — distinguishes tap from swipe so the carousel
  // drag handler doesn't swallow the click on mobile.
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);

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

  const openPopup = useCallback(() => {
    setIsFlipped(false);
    setShowPopup(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = Math.abs(t.clientX - touchStart.current.x);
    const dy = Math.abs(t.clientY - touchStart.current.y);
    const dt = Date.now() - touchStart.current.t;
    touchStart.current = null;
    // Only fire as a tap if movement < 8px and duration < 250ms
    if (dx < 8 && dy < 8 && dt < 250) {
      e.preventDefault();
      openPopup();
    }
  }, [openPopup]);

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
      {/* CARD IN GRID / CAROUSEL */}
      <div className="council-card-wrapper perspective-1000">
        <div
          ref={cardRef}
          className="w-full h-full cursor-pointer relative aspect-[4/5] group rounded-2xl overflow-hidden flex flex-col justify-end council-card council-card--cream border-3 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] transition-all"
          style={{
            "--card-glow-color": glowColor,
          } as React.CSSProperties}
          onClick={openPopup}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") openPopup();
          }}
          aria-label={`View details for ${member.name}`}
        >
          {/* Card image */}
          <div className="council-card-image w-full h-full">
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
                className="w-full h-full object-cover"
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
      </div>

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
                        <Award size={11} />
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

// ─── Skeleton ────────────────────────────────────────────────────────
function SkeletonCards() {
  return (
    <div className="flex gap-6 overflow-hidden w-full max-w-5xl mx-auto justify-center">
      {[0, 1, 2].map((i) => (
        <div key={i} className="council-skeleton council-skeleton--cream basis-full sm:basis-1/2 lg:basis-1/3 flex-shrink-0">
          <div className="council-skeleton-image council-skeleton-image--cream" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Section ────────────────────────────────────────────────────
export default function CouncilSection() {
  const initialCouncil = getCachedCouncil();
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

  useEffect(() => {
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

  // Show the top Executive Council (Upper) members
  const previewMembers = members.filter(m => {
    const t = m.type.toLowerCase().trim();
    return t === "upper" || t === "executive" || t.includes("upper") || t.includes("executive");
  }).slice(0, 3);

  return (
    <>
      <section 
        id="council" 
        className="evt-section council-section !bg-transparent"
      >
        <div className="container mx-auto px-4 md:px-6 relative z-10 animate-fade-in">
          
          {/* Centered Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto mb-16"
          >
            <div className="council-badge council-badge--cream mb-0">
              <Users size={16} />
              Student Council
            </div>
            
            <h2 className="council-title council-title--cream m-0 leading-tight">
              The Team Behind Kaziranga House
            </h2>
            
            <p className="council-subtitle council-subtitle--cream m-0 leading-relaxed">
              The students leading innovation, culture, events, and community within the house.
            </p>
          </motion.div>
          
          {/* Full-Width Carousel Slider */}
          <div className="w-full relative max-w-5xl mx-auto">
            {/* Loading */}
            {loading && <SkeletonCards />}

            {/* Error */}
            {error && !loading && (
              <div className="section-error mb-8">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Cards Layout: Static Row (Desktop/Tablet) & Carousel (Mobile) */}
            {!loading && !error && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="w-full relative"
              >
                {previewMembers.length > 0 ? (
                  <>
                    {/* Desktop & Tablet: Static Centered Row */}
                    <div className="hidden sm:flex sm:flex-wrap sm:justify-center gap-8 w-full max-w-5xl mx-auto">
                      {previewMembers.map((member) => (
                        <CouncilCard
                          key={member.id}
                          member={member}
                        />
                      ))}
                    </div>

                    {/* Mobile: Native horizontal-scroll snap (no Embla so taps reach cards) */}
                    <div className="block sm:hidden w-full">
                      <div
                        className="flex gap-5 overflow-x-auto pb-4 px-4 snap-x snap-mandatory scroll-smooth"
                        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
                      >
                        {previewMembers.map((member) => (
                          <div
                            key={member.id}
                            className="snap-center flex-shrink-0 w-[75vw] max-w-[280px]"
                          >
                            <CouncilCard member={member} />
                          </div>
                        ))}
                      </div>
                      {/* Scroll hint dots */}
                      <div className="flex justify-center gap-2 mt-3">
                        {previewMembers.map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#1e5631]/30" />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="evt-empty col-span-full py-12">
                    <span className="evt-empty-emoji">🦏</span>
                    <p>Council information coming soon.</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Centered CTA Button */}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center mt-14"
            >
              <Link href="/council" className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#1e5631] text-white font-bold rounded-full border border-[#6fcf97]/30 hover:bg-[#174726] hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(111,207,151,0.25)] transition-all duration-300 shadow-xl cursor-pointer">
                <span>Meet Council</span>
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          )}
          
        </div>
      </section>
    </>
  );
}
