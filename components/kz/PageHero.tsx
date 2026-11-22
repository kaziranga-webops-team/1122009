"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Each page keeps a colour of its own; it marks the title, not a band. */
const ACCENTS = {
  red: "#c8102e",
  cobalt: "#2343b8",
  forest: "#0f5e48",
  marigold: "#e3a936",
  rani: "#e2387a",
} as const;

export type Ground = keyof typeof ACCENTS;

/**
 * The opener for inner pages. It sits on the page's own paper, so the header,
 * title and content read as one sheet: the title in Yatra One with an
 * off-register shadow in the page's colour, a line of intro, and an `aside`
 * slot on the right for what the page is used for (search, filters, a fact
 * or two). A rule with a short stroke of the page colour closes it.
 */
export default function PageHero({
  title,
  intro,
  ground = "red",
  aside,
  tone = "paper",
}: {
  title: string[];
  intro?: React.ReactNode;
  ground?: Ground;
  aside?: React.ReactNode;
  /** `ink` for the dark pages. */
  tone?: "paper" | "ink";
}) {
  const reduce = useReducedMotion();
  const accent = ACCENTS[ground];
  const ink = tone === "ink" ? "#f5e9cf" : "#1c130c";

  return (
    <section className="kz-font relative pt-[var(--kz-header-h)]" style={{ color: ink }}>
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
        <div className="grid items-end gap-6 pb-7 pt-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10 md:pb-9 md:pt-12">
          <div className="min-w-0">
            <motion.h1
              className="kz-display kz-offset text-[clamp(2.6rem,6vw,5.2rem)]"
              style={{ ["--offset" as string]: accent }}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {title.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </motion.h1>
            {intro && <p className="kz-lead mt-4 max-w-2xl opacity-80">{intro}</p>}
          </div>
          {aside && <div className="min-w-0 md:max-w-md md:justify-self-end">{aside}</div>}
        </div>
        <div aria-hidden="true" className="relative h-[3px]" style={{ background: ink, opacity: tone === "ink" ? 0.85 : 1 }}>
          <span className="absolute inset-y-[-2px] left-0 w-24 md:w-40" style={{ background: accent }} />
        </div>
      </div>
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
      className={`inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1 [scrollbar-width:none] ${
        dark ? "bg-[#f5e9cf]/10" : "bg-[#1c130c]/[0.06]"
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
            className={`kz-focus relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[0.95rem] font-semibold transition-colors duration-300 sm:px-5 ${
              active ? (dark ? "text-[#1c130c]" : "text-[#f5e9cf]") : dark ? "text-white/75 hover:text-white" : "text-[#1c130c]/70 hover:text-[#1c130c]"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className={`absolute inset-0 rounded-full ${dark ? "bg-[#f6b51e]" : "bg-[#1c130c]"}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              {o.icon}
              {o.label}
              {typeof o.count === "number" && (
                <span className={`text-[0.82rem] font-medium tabular-nums ${active ? (dark ? "text-[#1c130c]/70" : "text-[#f6b51e]") : "opacity-60"}`}>
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
