"use client";

import { useContent } from "@/hooks/useData";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { fetchHeroPhotos, type HeroPhoto } from "@/lib/api";

const JOIN_URL = "https://forms.gle/Ac5Zxwn21cRMeEcy8";
const ROTATE_MS = 5000;
const DEFAULT_SUBTITLE =
  "A student house of the IIT Madras BS Degree — 5,000+ members meeting up, learning, and building things together.";

// Mobile clip path for the photo (objectBoundingBox units, 0–1): full-width
// image with a gentle wave at the bottom. On desktop the frame is a true circle
// (see `.hero-media` in globals.css), so it shares a center with the orbits.
function HeroClipPaths() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="hero-clip-mobile" clipPathUnits="objectBoundingBox">
          <path d="M0,0 L1,0 L1,0.84 C0.78,0.98 0.42,0.88 0,0.97 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

// Two semicircles concentric with the photo's circular edge (desktop only).
// Geometry comes from the --cx/--cy/--R/--g variables on `.hero-geo`.
function Orbits() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
      <div className="hero-orbit hero-orbit--inner" />
      <div className="hero-orbit hero-orbit--outer" />
      <span className="hero-orbit-dot" />
    </div>
  );
}

// Rotating student photos, fetched from /api/hero-photos (shuffled per load).
function HeroMedia() {
  const [photos, setPhotos] = useState<HeroPhoto[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchHeroPhotos()
      .then((p) => {
        if (alive) setPhotos(p);
      })
      .catch(() => {
        /* frame stays as a tinted placeholder if the endpoint fails */
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (photos.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((i) => (i + 1) % photos.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [photos.length]);

  const onError = (e: React.SyntheticEvent<HTMLImageElement>, fallback: string) => {
    const img = e.currentTarget;
    if (img.src !== fallback) img.src = fallback;
  };

  return (
    <div className="hero-media relative h-full w-full bg-[#dde8df]">
      {photos.map((p, i) => (
        <img
          key={p.url}
          src={p.url}
          onError={(e) => onError(e, p.fallback)}
          alt={i === active ? "Students enjoying time together" : ""}
          aria-hidden={i !== active}
          loading={i === 0 ? "eager" : "lazy"}
          className="hero-media-img absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: i === active ? 1 : 0,
            transform: i === active ? "scale(1)" : "scale(1.06)",
          }}
        />
      ))}
      {/* Light wash on the left so the frame edge melts into the page */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f8f9f4]/25 via-transparent to-transparent" />
      {/* Top fade: the photo dissolves upward behind the navbar instead of being cut */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32%] bg-gradient-to-b from-[#f8f9f4] via-[#f8f9f4]/65 to-transparent lg:h-[22%]" />
    </div>
  );
}

export default function HeroSection() {
  const { data: content, isError, error } = useContent();
  const houseName = content?.hero?.title || "Kaziranga House";
  const subtitle = content?.hero?.subtitle || DEFAULT_SUBTITLE;

  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const orbitsRef = useRef<HTMLDivElement>(null);

  // Entrance: copy rises in, photo frame settles, orbits fade in last.
  useEffect(() => {
    const copy = [
      eyebrowRef.current,
      titleRef.current,
      subtitleRef.current,
      linkRef.current,
    ];

    // Reduced motion: skip the entrance and show everything immediately.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([...copy, mediaRef.current, orbitsRef.current], {
        opacity: 1,
        y: 0,
        scale: 1,
      });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      mediaRef.current,
      { opacity: 0, scale: 1.04 },
      { opacity: 1, scale: 1, duration: 1.4 }
    )
      .fromTo(
        copy,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 },
        "-=1.15"
      )
      .fromTo(orbitsRef.current, { opacity: 0 }, { opacity: 1, duration: 1.2 }, "-=0.6");

    return () => {
      tl.kill();
    };
  }, []);

  if (isError) {
    return (
      <section id="hero" className="min-h-screen flex items-center justify-center bg-background scroll-mt-20">
        <div className="max-w-lg mx-auto p-10 bg-red-50 rounded-3xl text-center border-2 border-red-200 shadow-xl">
          <div className="text-5xl mb-4">🦏</div>
          <h2 className="text-2xl font-bold text-red-800 mb-3">Oops — content.json has a problem</h2>
          <p className="text-red-600 text-sm font-mono bg-red-100 rounded-lg p-3 mb-3">
            {(error as Error)?.message}
          </p>
          <p className="text-red-500 text-sm">
            Open <code className="bg-red-100 px-1 rounded">public/data/content.json</code>, fix the JSON syntax, and save.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="hero"
      className="hero-canvas hero-geo sticky top-0 z-0 flex w-full min-h-[100svh] flex-col overflow-hidden scroll-mt-20 lg:min-h-screen lg:justify-center"
    >
      <HeroClipPaths />

      {/* Full-size wrapper so the rings always position against the whole hero */}
      <div ref={orbitsRef} className="pointer-events-none absolute inset-0 opacity-0">
        <Orbits />
      </div>

      {/* Photo frame: bleeds to the top edge (under the transparent navbar) so there is
          no hard cut; in flow above the copy on small screens, pinned right on desktop */}
      <div
        ref={mediaRef}
        className="hero-media-frame relative z-10 h-[56svh] w-full opacity-0"
      >
        <HeroMedia />
      </div>

      {/* Copy — left-aligned with the navbar logo so it never drifts into the orbits */}
      <div className="relative z-20 w-full px-6 pb-24 pt-8 md:px-12 lg:py-28">
        <div className="max-w-xl lg:max-w-[36vw]">
          <p ref={eyebrowRef} className="hero-eyebrow flex items-center gap-4 opacity-0">
            <span className="h-px w-8 bg-current opacity-60" />
            IITM BS · {houseName}
          </p>

          <h1 ref={titleRef} className="hero-display mt-5 opacity-0 lg:mt-6">
            <span className="sr-only">{houseName}: </span>
            Together,
            <br />
            Beyond <em>Limits</em>
            <span className="hero-dot">.</span>
          </h1>

          <p
            ref={subtitleRef}
            className="mt-5 max-w-[24rem] text-[0.95rem] leading-relaxed text-[#4a5d51] opacity-0 md:text-base"
          >
            {subtitle}
          </p>

          <a
            ref={linkRef}
            href={JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex items-center gap-2.5 border-b border-[#11241a]/60 pb-1 font-['Playfair_Display',Georgia,serif] text-[1.15rem] italic text-[#11241a] opacity-0 transition-colors hover:border-[#1e5631] hover:text-[#1e5631] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1e5631]"
          >
            Join the House
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>

    </section>
  );
}
