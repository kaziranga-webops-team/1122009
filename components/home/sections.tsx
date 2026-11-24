"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChapterTitle } from "@/components/kz/Motifs";

const SOFT = [0.22, 1, 0.36, 1] as const;

/** A quiet rise-in on scroll, staggered by index. */
export function Reveal({ children, i = 0, className = "", y = 18 }: { children: React.ReactNode; i?: number; className?: string; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: i * 0.07, ease: SOFT }}
    >
      {children}
    </motion.div>
  );
}

/** The chapter opener used across the site: a hanging title, then a short intro. */
export function SectionHead({
  title,
  intro,
  dark = false,
}: {
  title: string[] | React.ReactNode;
  intro?: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-[90rem] px-5 pb-10 pt-20 sm:px-8 md:px-12 md:pb-14 md:pt-28">
      <Reveal>
        <ChapterTitle className={dark ? "text-[#f6b51e]" : ""} offset={dark ? "#c8102e" : undefined}>
          {Array.isArray(title) ? (title as string[]).join(" ") : title}
        </ChapterTitle>
      </Reveal>
      {intro && (
        <Reveal i={2} className="mt-6">
          <p className={`kz-lead max-w-xl ${dark ? "text-[#e9dcc0]" : "text-[#5e4a35]"}`}>{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

/** Gamosa border strip — the chapter mark between sections. */
export function Gamosa({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return <div aria-hidden="true" className={`kz-gamosa ${dark ? "kz-gamosa--dark" : ""} ${className}`} />;
}
