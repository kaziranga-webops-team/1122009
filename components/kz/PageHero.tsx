"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { WordRise } from "@/components/kz/Scene";
import { vars } from "@/components/kz/util";

export type Sticker = { value: string; label: string; bg: string; ink?: string };

/**
 * The opener for inner pages: deliberately short, so the page's own content
 * (the events, the council) is on screen at once. A breadcrumb to get back,
 * the title with a hand-drawn underline, one line of intro, and a few tilted
 * "stickers" with the numbers that matter on this page.
 */
export default function PageHero({
  crumb,
  label,
  title,
  intro,
  stickers = [],
}: {
  crumb: string;
  label: string;
  title: string[];
  intro?: React.ReactNode;
  stickers?: Sticker[];
}) {
  const reduce = useReducedMotion();
  let n = 0;

  return (
    <section className="kz-font relative overflow-hidden bg-[#f9fbe5] pt-[var(--kz-header-h)] text-[#002820]">
      {/* soft confetti dots — playful, quiet */}
      <span aria-hidden="true" className="kz-float absolute left-[46%] top-[34%] h-3 w-3 rounded-full bg-[#ffd27a]" style={vars({ "--d": "6s" })} />
      <span aria-hidden="true" className="kz-float absolute left-[8%] top-[78%] h-2 w-2 rounded-full bg-[#c6011f]/60" style={vars({ "--d": "7s" })} />
      <span aria-hidden="true" className="kz-float absolute right-[30%] top-[22%] h-2.5 w-2.5 rotate-45 bg-[#96b4a5]" style={vars({ "--d": "8s" })} />

      <div className="relative mx-auto grid max-w-[90rem] gap-8 px-5 pb-8 pt-8 sm:px-8 md:px-12 md:pb-10 md:pt-12 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <nav aria-label="Breadcrumb" className="kz-rise flex items-center gap-1.5 text-[0.82rem] font-semibold text-[#4b6660]" style={vars({ "--i": 0 })}>
            <Link href="/" className="rounded-full px-1 transition-colors hover:text-[#002820]">
              Home
            </Link>
            <ChevronRight size={14} />
            <span className="text-[#002820]">{crumb}</span>
          </nav>
          <p className="kz-label kz-mark kz-rise mt-5 text-[#c6011f]" style={vars({ "--i": 1 })}>
            {label}
          </p>
          <h1 className="kz-display mt-3 text-[clamp(2.4rem,5.4vw,4.8rem)]">
            {title.map((line, i) => {
              const start = n;
              n += line.split(" ").length;
              const last = i === title.length - 1;
              return (
                <span key={i} className="relative block w-fit">
                  <WordRise text={line} start={start} base={0.15} />
                  {last && (
                    <svg aria-hidden="true" viewBox="0 0 300 20" preserveAspectRatio="none" className="absolute -bottom-[0.12em] left-0 h-[0.28em] w-full overflow-visible">
                      <path
                        d="M4 14C60 4 120 4 170 10s90 6 126-4"
                        fill="none"
                        stroke="#ffd27a"
                        strokeWidth="9"
                        strokeLinecap="round"
                        pathLength={1}
                        className="kz-draw"
                        style={vars({ "--delay": "0.7s" })}
                      />
                    </svg>
                  )}
                </span>
              );
            })}
          </h1>
          {intro && (
            <p className="kz-lead kz-rise mt-5 max-w-2xl text-[#4b6660]" style={vars({ "--i": 3 })}>
              {intro}
            </p>
          )}
        </div>

        {stickers.length > 0 && (
          <ul className="flex flex-wrap gap-3 lg:max-w-[26rem] lg:justify-end">
            {stickers.map((s, i) => (
              <motion.li
                key={s.label}
                initial={reduce ? false : { opacity: 0, scale: 0.6, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: i % 2 ? 3 : -3 }}
                whileHover={reduce ? undefined : { rotate: 0, scale: 1.06 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.35 + i * 0.1 }}
                className="rounded-[1.2rem] px-5 py-3.5 shadow-[0_14px_26px_-18px_rgba(0,40,32,0.6)]"
                style={{ background: s.bg, color: s.ink ?? "#002820" }}
              >
                <span className="block text-[1.9rem] font-bold leading-none tracking-[-0.03em]">{s.value}</span>
                <span className="kz-label mt-1.5 block text-[0.62rem] opacity-75">{s.label}</span>
              </motion.li>
            ))}
          </ul>
        )}
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
      className={`inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5 [scrollbar-width:none] ${
        dark ? "bg-white/10" : "border border-[#002820]/10 bg-white shadow-[0_10px_30px_-18px_rgba(0,40,32,0.4)]"
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
            className={`relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[0.88rem] font-semibold transition-colors duration-300 sm:px-5 ${
              active ? (dark ? "text-[#002820]" : "text-[#f9fbe5]") : dark ? "text-white/75 hover:text-white" : "text-[#002820]/70 hover:text-[#002820]"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className={`absolute inset-0 rounded-full ${dark ? "bg-[#f9fbe5]" : "bg-[#002820]"}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              {o.icon}
              {o.label}
              {typeof o.count === "number" && (
                <span
                  className={`grid min-w-[1.4rem] place-items-center rounded-full px-1.5 py-0.5 text-[0.7rem] font-bold leading-none transition-colors ${
                    active ? "bg-[#ffd27a] text-[#002820]" : "bg-[#002820]/8 text-[#002820]/70"
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
