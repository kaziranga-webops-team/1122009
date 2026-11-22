"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gamosa } from "@/components/kz/Motifs";

const GROUNDS = {
  red: { bg: "#c8102e", texture: "kz-cloth", title: "#f6b51e", offset: "#1c130c", ink: "#f5e9cf", dot: "" },
  cobalt: { bg: "#2343b8", texture: "kz-halftone", title: "#f6b51e", offset: "#e2387a", ink: "#f5e9cf", dot: "rgba(10,20,80,0.55)" },
  forest: { bg: "#0a3b2f", texture: "kz-jaali", title: "#f6b51e", offset: "#c8102e", ink: "#f5e9cf", dot: "" },
  marigold: { bg: "#f6b51e", texture: "kz-halftone", title: "#1c130c", offset: "#e2387a", ink: "#1c130c", dot: "rgba(120,60,0,0.25)" },
  rani: { bg: "#e2387a", texture: "kz-halftone", title: "#f6b51e", offset: "#1c130c", ink: "#fff8ec", dot: "rgba(90,0,30,0.3)" },
} as const;

export type Ground = keyof typeof GROUNDS;

/**
 * The opener for inner pages, printed like a poster band: a coloured ground,
 * the title in Yatra One with an off-register shadow, an optional line of
 * intro, and a gamosa edge. Short on purpose, so the page's own content is
 * on screen at once.
 */
export default function PageHero({ title, intro, ground = "red" }: { title: string[]; intro?: React.ReactNode; ground?: Ground }) {
  const reduce = useReducedMotion();
  const g = GROUNDS[ground];

  return (
    <section
      className={`kz-font relative overflow-hidden pt-[var(--kz-header-h)] ${g.texture}`}
      style={{ background: g.bg, color: g.ink, ...(g.dot ? { ["--dot" as string]: g.dot } : {}) }}
    >
      <div className="relative mx-auto max-w-[90rem] px-5 pb-14 pt-12 sm:px-8 md:px-12 md:pb-16 md:pt-16">
        <motion.h1
          className="kz-display kz-offset text-[clamp(2.8rem,6.4vw,5.8rem)]"
          style={{ color: g.title, ["--offset" as string]: g.offset }}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {title.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </motion.h1>
        {intro && <p className="kz-lead mt-6 max-w-2xl opacity-90">{intro}</p>}
      </div>
      <Gamosa />
    </section>
  );
}

/** A segmented control with a pill that slides to the chosen option. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
  dark = false,
}: {
  options: { label: string; value: T; icon?: React.ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  id: string;
  dark?: boolean;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex max-w-full gap-1 overflow-x-auto p-1 [scrollbar-width:none] ${
        dark ? "border-2 border-[#f5e9cf]/40" : "border-2 border-[#1c130c] bg-[#f5e9cf]"
      }`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`kz-sign relative inline-flex shrink-0 items-center gap-2 px-4 pb-2 pt-2.5 text-[0.8rem] uppercase tracking-[0.1em] transition-colors duration-300 sm:px-5 ${
              active ? (dark ? "text-[#1c130c]" : "text-[#f5e9cf]") : dark ? "text-white/75 hover:text-white" : "text-[#1c130c]/70 hover:text-[#1c130c]"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className={`absolute inset-0 ${dark ? "bg-[#f6b51e]" : "bg-[#c8102e]"}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              {o.icon}
              {o.label}
              {typeof o.count === "number" && (
                <span
                  className={`grid min-w-[1.4rem] place-items-center px-1.5 py-0.5 text-[0.72rem] leading-none transition-colors ${
                    active ? "bg-[#f6b51e] text-[#1c130c]" : "bg-[#1c130c]/10 text-[#1c130c]/70"
                  }`}
                >
                  {o.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
