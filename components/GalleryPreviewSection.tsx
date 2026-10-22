"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { motion, useAnimate } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Image as ImageIcon, Camera, Folder } from "lucide-react";
import { fetchGallery } from "@/lib/api";
import { useAllLikes } from "../hooks/useLikes";
import { generateImageId } from "../lib/firebase";

// Fallback images if Firebase/Google Sheets fails or takes too long to load
const FALLBACK_TRAIL_IMAGES = [
  "https://images.unsplash.com/photo-1542868727-4666d6a2f60d?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531256456869-ce942c665e5e?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1596526131083-e8c638c9c6c3?q=80&w=400&auto=format&fit=crop",
];

const MouseImageTrail = ({
  children,
  images,
  renderImageBuffer,
  rotationRange,
}: {
  children: React.ReactNode;
  images: string[];
  renderImageBuffer: number;
  rotationRange: number;
}) => {
  const [scope, animate] = useAnimate();

  const lastRenderPosition = useRef({ x: 0, y: 0 });
  const imageRenderCount = useRef(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const distance = calculateDistance(
      x,
      y,
      lastRenderPosition.current.x,
      lastRenderPosition.current.y
    );

    if (distance >= renderImageBuffer) {
      lastRenderPosition.current.x = x;
      lastRenderPosition.current.y = y;

      renderNextImage();
    }
  };

  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  const renderNextImage = () => {
    const imageIndex = imageRenderCount.current % images.length;
    const selector = `[data-mouse-move-index="${imageIndex}"]`;

    const el = document.querySelector(selector) as HTMLElement;
    if (!el) return;

    el.style.top = `${lastRenderPosition.current.y}px`;
    el.style.left = `${lastRenderPosition.current.x}px`;
    el.style.zIndex = imageRenderCount.current.toString();

    const rotation = Math.random() * rotationRange;

    animate(
      selector,
      {
        opacity: [0, 1],
        transform: [
          `translate(-50%, -25%) scale(0.5) ${
            imageIndex % 2 ? `rotate(${rotation}deg)` : `rotate(-${rotation}deg)`
          }`,
          `translate(-50%, -50%) scale(1) ${
            imageIndex % 2 ? `rotate(-${rotation}deg)` : `rotate(${rotation}deg)`
          }`,
        ],
      },
      { type: "spring", damping: 15, stiffness: 200 }
    );

    animate(
      selector,
      {
        opacity: [1, 0],
      },
      { ease: "linear", duration: 0.5, delay: 2 }
    );

    imageRenderCount.current = imageRenderCount.current + 1;
  };

  return (
    <div
      ref={scope}
      className="relative overflow-hidden w-full bg-[#f5f0e1]"
      onMouseMove={handleMouseMove}
    >
      {/* Subtle grid pattern — matching the screenshot */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(30,86,49,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,86,49,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Subtle organic light glow to match site identity */}
      <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-[#1e5631]/5 blur-[120px] pointer-events-none" />

      <div className="relative z-[10]">
        {children}
      </div>

      <div className="absolute inset-0 z-[1] pointer-events-none">
        {images.map((img, index) => (
          <img
            className="pointer-events-none absolute left-0 top-0 h-36 md:h-48 w-auto rounded-2xl border border-[#6fcf97]/25 bg-[#0d2818] object-cover opacity-0 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35),0_0_30px_-8px_rgba(111,207,151,0.15)]"
            src={img}
            alt={`Mouse trail image ${index}`}
            key={index}
            data-mouse-move-index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default function GalleryPreviewSection() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [galleryRows, setGalleryRows] = useState<{ Image_url: string; Student: string; Timestamp: string }[]>([]);
  const allLikes = useAllLikes(); // Fetches live like counts

  useEffect(() => {
    fetchGallery().then((data) => {
      // Keep only approved rows
      setGalleryRows(data.filter((r) => String(r.Approved).trim().toUpperCase() === "TRUE"));
    }).catch(console.error);
  }, []);

  const trailImages = useMemo(() => {
    if (galleryRows.length === 0) return FALLBACK_TRAIL_IMAGES;

    // Sort by likes descending to get the top picks
    const sorted = [...galleryRows].sort((a, b) => {
      const idA = generateImageId(a.Student, a.Timestamp);
      const idB = generateImageId(b.Student, b.Timestamp);
      const likesA = allLikes[idA] || 0;
      const likesB = allLikes[idB] || 0;
      return likesB - likesA;
    });

    // Take the top 15 most liked images for the trail effect
    const topPicks = sorted.slice(0, 15).map(r => r.Image_url.trim());
    return topPicks.length > 0 ? topPicks : FALLBACK_TRAIL_IMAGES;
  }, [galleryRows, allLikes]);

  const handleExploreClick = (tab: "meetups" | "images") => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    setTimeout(() => {
      router.push(`/gallery?tab=${tab}`);
      setTimeout(() => setIsNavigating(false), 800);
    }, 600);
  };

  return (
    <section className="relative select-none font-sans overflow-hidden">
      <MouseImageTrail
        renderImageBuffer={60}
        rotationRange={25}
        images={trailImages}
      >
        <motion.div 
          animate={isNavigating ? { backgroundPosition: "100% 100%" } : { backgroundPosition: "0% 0%" }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="py-32 md:py-48 flex flex-col items-center justify-center text-center relative min-h-[550px] cursor-crosshair"
        >
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            animate={isNavigating ? { scale: 1.15, filter: "blur(10px)", y: -50, opacity: 0 } : { scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl px-4 pointer-events-none relative z-20 flex flex-col items-center"
          >
            {/* Scrapbook Tilted Top Badge */}
            <div className="relative inline-flex items-center gap-2 px-5 py-2 bg-[#ffc900]/80 text-black font-bold uppercase text-xs tracking-wider rotate-[-3deg] mb-8 select-none shadow-sm rounded-sm">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/40 border-x border-dashed border-black/10 mix-blend-overlay"></div>
              <Camera size={14} />
              <span>Hover Around</span>
            </div>
            
            {/* Scrapbook Title */}
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-black tracking-tight mb-8 leading-none select-none relative z-10">
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-[#6fcf97]/30 transform rotate-1 -z-10 rounded-sm"></span>
                The Kaziranga
              </span>
              <br />
              <span className="relative inline-block mt-2">
                <span className="absolute inset-0 bg-[#ff90e8]/30 transform -rotate-1 -z-10 rounded-sm"></span>
                Gallery
              </span>
            </h2>
            
            {/* Scrapbook Note Box */}
            <div className="relative bg-[#fdfbf7] text-black px-6 py-5 max-w-xl mx-auto mb-10 shadow-[2px_4px_12px_rgba(0,0,0,0.08)] select-none transform rotate-1 rounded-sm border border-black/5">
              <div className="absolute -top-3 left-6 w-16 h-6 bg-[#00e5ff]/50 mix-blend-multiply transform -rotate-3 z-20">
                <div className="w-full h-full border-x-2 border-dotted border-white/30"></div>
              </div>
              <p className="font-medium text-sm md:text-base leading-relaxed text-black/80">
                Relive legendary meetups, beautiful moments, and the finest memes of IITM BS.
              </p>
            </div>
          </motion.div>

          {/* Cinematic transition effect */}
          {isNavigating && (
            <>
              <motion.h2
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: [0, 0.6, 0], scale: 1.2, filter: "blur(8px)" }}
                transition={{ duration: 0.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl md:text-8xl font-serif font-bold text-[#6fcf97]/30 tracking-tight z-10 pointer-events-none"
              >
                Gallery
              </motion.h2>
            </>
          )}

          {/* Scrapbook Action Buttons */}
          <motion.div
            animate={isNavigating ? { scale: 0.8, opacity: 0, y: 50 } : { scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-auto relative z-[9999] flex flex-col sm:flex-row gap-6 px-4 justify-center w-full mt-4"
          >
            <button 
              onClick={handleExploreClick("meetups")} 
              className="relative inline-flex items-center justify-center gap-3 px-8 py-3 bg-[#fdfbf7] text-black font-bold tracking-wide text-base border border-black/10 shadow-[2px_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:shadow-[4px_8px_16px_rgba(0,0,0,0.12)] active:translate-y-0 active:shadow-sm transition-all duration-300 cursor-pointer group w-full sm:w-auto min-w-[200px] transform -rotate-1 rounded-sm"
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-5 bg-[#ffc900]/60 mix-blend-multiply transform rotate-2 z-20">
                <div className="w-full h-full border-x-2 border-dotted border-white/40"></div>
              </div>
              <Folder size={18} className="text-black/70" />
              <span>See Meetups</span>
              <ArrowRight size={18} className="text-black/70 group-hover:translate-x-1.5 transition-transform" />
            </button>

            <button 
              onClick={handleExploreClick("images")} 
              className="relative inline-flex items-center justify-center gap-3 px-8 py-3 bg-[#fdfbf7] text-black font-bold tracking-wide text-base border border-black/10 shadow-[2px_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:shadow-[4px_8px_16px_rgba(0,0,0,0.12)] active:translate-y-0 active:shadow-sm transition-all duration-300 cursor-pointer group w-full sm:w-auto min-w-[200px] transform rotate-1 rounded-sm"
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-5 bg-[#6fcf97]/60 mix-blend-multiply transform -rotate-1 z-20">
                <div className="w-full h-full border-x-2 border-dotted border-white/40"></div>
              </div>
              <ImageIcon size={18} className="text-black/70" />
              <span>Explore Gallery</span>
              <ArrowRight size={18} className="text-black/70 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </MouseImageTrail>
    </section>
  );
}
