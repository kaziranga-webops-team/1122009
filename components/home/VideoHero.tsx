"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { JOIN_URL } from "@/components/kz/KzHeader";
import { vars } from "@/components/kz/util";
import { useContent } from "@/hooks/useData";

const DEFAULT_SUBTITLE =
  "A student house of the IIT Madras BS Degree. 5,000+ members meeting up, learning and building things together.";

/** Portrait screens get the tall cut of the loop; everything else the wide one. */
const TALL_QUERY = "(max-aspect-ratio: 4/5)";

/**
 * Hero in the reference site's structure: a static illustrated scene where only
 * small details move (pre-rendered with Remotion in /hero-video), headline in the sky.
 */
export default function VideoHero() {
  const { data: content } = useContent();
  const subtitle = content?.hero?.subtitle || DEFAULT_SUBTITLE;
  const reduce = useReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  const [variant, setVariant] = useState<"wide" | "tall" | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(TALL_QUERY);
    const pick = () => setVariant(mq.matches ? "tall" : "wide");
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, []);

  useEffect(() => {
    setPlaying(false);
    const v = video.current;
    if (!v) return;
    // Chromium can pause a muted background loop on a buffering hiccup during load;
    // there are no controls, so any pause while on screen is resumed. Off screen it rests.
    let onScreen = true;
    const resume = () => {
      if (onScreen) v.play().catch(() => {});
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) resume();
      else v.pause();
    });
    io.observe(v);
    v.addEventListener("pause", resume);
    return () => {
      io.disconnect();
      v.removeEventListener("pause", resume);
    };
  }, [variant]);

  // The headline is the most important text on the site, so its entry is CSS
  // (see .kz-rise) rather than a JS animation that can strand it at opacity 0.
  const rise = (i: number) => ({ style: vars({ "--i": i }) });

  return (
    <section id="hero" className="kz-font relative isolate bg-[#9fdcef] pt-[var(--kz-header-h)] text-[#002820]">
      {/* the frame takes the loop's own proportions, so the whole artwork is always visible */}
      <div className="relative w-full overflow-hidden aspect-[1920/1294] [@media(max-aspect-ratio:4/5)]:aspect-[9/16]">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {/* poster paints instantly; the loop fades in over it once it is playing */}
        <div className="absolute inset-0 bg-[url(/videos/hero-wide.jpg)] bg-cover bg-center [@media(max-aspect-ratio:4/5)]:bg-[url(/videos/hero-tall.jpg)]" />
        {variant && !reduce && (
          <video
            ref={video}
            key={variant}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={`/videos/hero-${variant}.jpg`}
            onPlaying={() => setPlaying(true)}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: playing ? 1 : 0 }}
          >
            <source src={`/videos/hero-${variant}.mp4`} type="video/mp4" />
          </video>
        )}
        {/* a soft sky glow behind the copy keeps navy type readable over foliage */}
        <div className="absolute inset-x-0 top-0 h-[62%] bg-[radial-gradient(60%_70%_at_50%_18%,rgba(232,250,255,0.78),rgba(232,250,255,0)_75%)]" />
      </div>

      <div className="absolute inset-x-0 top-0 z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-5 pt-[4.5%] text-center sm:px-8 [@media(max-aspect-ratio:4/5)]:pt-[12%]">
        <h1 {...rise(0)} className="kz-display kz-rise text-[clamp(2.9rem,7.6vw,7.4rem)]">
          We are
          <br />
          Kaziranga House<span className="text-[#c6011f]">.</span>
        </h1>
        <p {...rise(1)} className="kz-lead kz-rise mt-5 max-w-[34rem] text-[#1d3d35]">
          {subtitle}
        </p>
        <div {...rise(2)} className="kz-rise mt-7 flex flex-wrap items-center justify-center gap-3">
          <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--red">
            Join the house <ArrowRight size={18} />
          </a>
          <Link href="#what-we-do" className="kz-btn kz-btn--ink">
            More about us
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}
