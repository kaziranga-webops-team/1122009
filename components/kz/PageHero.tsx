"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { WordRise } from "@/components/kz/Scene";
import { vars } from "@/components/kz/util";

export type Sticker = { value: string; label: string; bg?: string; ink?: string };

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
      <div className="relative mx-auto grid max-w-[90rem] gap-8 px-5 pb-8 pt-8 sm:px-8 md:px-12 md:pb-10 md:pt-12 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <nav aria-label="Breadcrumb" className="kz-rise flex items-center gap-1.5 text-[0.82rem] font-semibold text-[#3f5a52]" style={vars({ "--i": 0 })}>
            <Link href="/" className="rounded-full px-1 transition-colors hover:text-[#002820]">
              Home
            </Link>
            <ChevronRight size={14} />
            <span className="text-[#002820]">{crumb}</span>
          </nav>
          <p className="kz-eyebrow kz-rise mt-6" style={vars({ "--i": 1 })}>
            {label}
          </p>
          <h1 className="kz-serif mt-4 text-[clamp(2.3rem,4.8vw,4.2rem)]">
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
                        stroke="#c9a24a"
                        strokeWidth="3"
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
            <p className="kz-lead kz-rise mt-5 max-w-2xl text-[#3f5a52]" style={vars({ "--i": 3 })}>
              {intro}
            </p>
          )}
        </div>

        {stickers.length > 0 && (
          // the numbers that matter here, set quietly between brass hairlines
          <ul className="flex divide-x divide-[#c9a24a]/50 border-y border-[#c9a24a]/50 py-4">
            {stickers.map((s, i) => (
              <motion.li
                key={s.label}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="px-6 first:pl-0 last:pr-0 lg:px-8"
              >
                <span className="kz-serif block text-[2rem] leading-none text-[#002820]">{s.value}</span>
                <span className="mt-2 block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#3f5a52]">{s.label}</span>
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
        dark ? "bg-white/10" : "border border-[#002820]/10 bg-[#eef1dc]"
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
                className={`absolute inset-0 rounded-full ${dark ? "bg-[#f9fbe5]" : "bg-[#006255]"}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              {o.icon}
              {o.label}
              {typeof o.count === "number" && (
                <span
                  className={`grid min-w-[1.4rem] place-items-center rounded-full px-1.5 py-0.5 text-[0.7rem] font-bold leading-none transition-colors ${
                    active ? "bg-[#c9a24a] text-[#002820]" : "bg-[#002820]/8 text-[#002820]/70"
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
