"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Ambient from "@/components/kz/Ambient";
import { JOIN_URL } from "@/components/kz/KzHeader";
import { Butterflies, Clouds, Rhino, SceneBackdrop, WordRise } from "@/components/kz/Scene";
import { vars } from "@/components/kz/util";
import { useContent } from "@/hooks/useData";

const DEFAULT_SUBTITLE =
  "A student house of the IIT Madras BS Degree — 5,000+ members meeting up, learning, and building things together.";

/** Where the rhino stands on the artwork (fractions of the 1672 × 941 painting). */
const RHINO_SPOT = { "--rx": 0.69, "--ry": 0.575, "--rw": 0.255 };

/**
 * The homepage hero: the painted waterfall valley shown whole, with live
 * water, clouds, birds and butterflies, and Kaz the rhino on the rock.
 *
 * The painting itself never moves under the pointer — only the small living
 * details do. On scroll, the scene sinks a little slower than the page so the
 * About section slides up over it, and the copy fades away.
 */
export default function SceneHero() {
  const { data: content } = useContent();
  const subtitle = content?.hero?.subtitle || DEFAULT_SUBTITLE;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const sceneY = useTransform(p, [0, 1], ["0%", reduce ? "0%" : "30%"]);
  const copyY = useTransform(p, [0, 0.55], [0, reduce ? 0 : -110]);
  const copyOpacity = useTransform(p, [0, 0.45], [1, reduce ? 1 : 0]);
  const cueOpacity = useTransform(p, [0, 0.1], [1, 0]);

  return (
    <section ref={ref} id="hero" className="kz-font kz-sky relative h-[100svh] min-h-[560px] overflow-hidden text-[#002820]">
      {/* ── the painted scene ── */}
      <motion.div style={{ y: sceneY }} className="absolute inset-x-0 bottom-0 top-[var(--kz-header-h)]">
        <div className="kz-frame">
          <div className="kz-stage kz-stage--feather">
            <SceneBackdrop priority />
          </div>

          <Clouds count={3} />
          <Ambient birds={3} specks={0} seed={5} sky={[6, 30]} />

          {/* a soft sky glow behind the copy keeps the ink type crisp over the hills */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(52%_62%_at_50%_30%,rgba(236,252,255,0.7),rgba(236,252,255,0)_72%)]"
          />

          <div className="kz-on-stage kz-on-stage--rhino z-10" style={vars(RHINO_SPOT)}>
            <div className="kz-walk-in">
              <Rhino />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-10">
            <Butterflies />
          </div>
        </div>
      </motion.div>

      {/* ── the copy ── */}
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="pointer-events-none absolute inset-x-0 top-[var(--kz-header-h)] z-20 mx-auto flex w-full max-w-4xl flex-col items-center px-5 pt-[clamp(1.25rem,6svh,4.5rem)] text-center sm:px-8"
      >
        {/* sized by width AND height, so short wide screens don't push the copy down onto Kaz */}
        <h1 className="kz-display text-[clamp(2.3rem,min(4.4vw,8.2svh),4.6rem)] text-[#002820] [text-shadow:0_2px_30px_rgba(236,252,255,0.6)]">
          <span className="block">
            <WordRise text="We are" />
          </span>
          <span className="block">
            <WordRise text="Kaziranga House" start={2} />
            <span className="kz-pop inline-block text-[#c10021]" style={vars({ "--delay": "0.95s" })}>
              .
            </span>
          </span>
        </h1>
        <p
          className="kz-rise mt-[clamp(0.7rem,2svh,1.2rem)] max-w-[32rem] text-[clamp(0.9rem,min(1.05vw,2svh),1.02rem)] font-medium leading-relaxed text-[#163a31]"
          style={vars({ "--i": 4 })}
        >
          {subtitle}
        </p>
        <div className="kz-rise pointer-events-auto mt-[clamp(0.9rem,2.6svh,1.6rem)] flex flex-wrap items-center justify-center gap-2.5" style={vars({ "--i": 5 })}>
          <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--sm kz-btn--red kz-btn--shine group">
            Join the house
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <Link href="#start" className="kz-btn kz-btn--sm kz-btn--ink">
            New here? Start here
          </Link>
        </div>
      </motion.div>

      {/* ── scroll cue ── */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: cueOpacity }}
        className="pointer-events-none absolute bottom-[calc(clamp(2rem,4vw,3.5rem)+1.25rem)] left-1/2 z-20 hidden -translate-x-1/2 md:block"
      >
        <span className="flex h-11 w-7 justify-center rounded-full border-2 border-white/90 pt-2 shadow-[0_4px_20px_rgba(0,40,32,0.25)]">
          <span className="kz-scroll-dot block h-2 w-1.5 rounded-full bg-white" />
        </span>
      </motion.div>
    </section>
  );
}
