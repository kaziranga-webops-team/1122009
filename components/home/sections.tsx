"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, HeartHandshake, Crown, MapPin, Mic, PartyPopper, Sprout, Users } from "lucide-react";
import { FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";
import Ambient from "@/components/kz/Ambient";
import { JOIN_URL } from "@/components/kz/KzHeader";
import { Butterflies, Rhino } from "@/components/kz/Scene";
import { vars } from "@/components/kz/util";

const SOFT = [0.22, 1, 0.36, 1] as const;
const INSTAGRAM = "https://www.instagram.com/kaziranga_iitm/";
const YOUTUBE = "http://www.youtube.com/@KazirangaHouse";

/** Rise-in on scroll, staggered by index, with a little blur that clears. */
export function Reveal({ children, i = 0, className = "", y = 36 }: { children: React.ReactNode; i?: number; className?: string; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay: i * 0.08, ease: SOFT }}
    >
      {children}
    </motion.div>
  );
}

/** A heading whose words slide up out of a mask when it scrolls into view. */
export function RevealWords({ lines, className = "", as: Tag = "h2" }: { lines: string[]; className?: string; as?: "h1" | "h2" }) {
  const reduce = useReducedMotion();
  let n = 0;
  return (
    <Tag className={className}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((w, wi, arr) => {
            const i = n++;
            return (
              <span key={wi}>
                <span className="kz-word">
                  <motion.span
                    className="inline-block"
                    initial={reduce ? false : { y: "110%", rotate: 5 }}
                    whileInView={{ y: "0%", rotate: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.95, delay: i * 0.06, ease: SOFT }}
                  >
                    {w}
                  </motion.span>
                </span>
                {wi < arr.length - 1 ? " " : null}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

/** Big heading left, short intro right — the section opener used across the site. */
export function SectionHead({
  label,
  title,
  intro,
  dark = false,
}: {
  label?: string;
  title: string[] | React.ReactNode;
  intro?: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto grid max-w-[90rem] gap-6 px-5 pb-12 pt-20 sm:px-8 md:px-12 md:pb-16 md:pt-28 lg:grid-cols-[1.3fr_1fr] lg:items-end">
      <div>
        {label && (
          <Reveal>
            {/* The hornbill mark reads as grime on a saturated block, so dark heads drop it. */}
            <p className={`kz-label mb-4 ${dark ? "text-white/70" : "kz-mark text-[#c6011f]"}`}>{label}</p>
          </Reveal>
        )}
        {Array.isArray(title) ? (
          <RevealWords lines={title as string[]} className="kz-h2" />
        ) : (
          <Reveal>
            <h2 className="kz-h2">{title}</h2>
          </Reveal>
        )}
      </div>
      {intro && (
        <Reveal i={2}>
          <p className={`kz-lead max-w-xl ${dark ? "text-white/80" : "text-[#4b6660]"}`}>{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

/**
 * A colour block that grows into place: it enters as a rounded card inset
 * from the edges and widens to full bleed as it reaches the top of the
 * screen, so a change of colour feels like a new chapter opening rather
 * than a hard cut.
 */
export function GrowPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.2"] });
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.9, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 56, 0]);
  return (
    <div ref={ref} className={`overflow-x-clip ${className}`}>
      <motion.div style={{ scale, borderRadius: radius }} className="origin-top overflow-hidden will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/* ═══ Start here: the three-step walkthrough for someone new ═══════ */

const STEPS = [
  {
    n: 1,
    title: "Say hi",
    text: "Fill the two-minute form and get added to the house WhatsApp groups.",
    cta: "Join the community",
    href: JOIN_URL,
    external: true,
    Icon: FaWhatsapp,
    bg: "#96b4a5",
    ink: "#002820",
    tilt: -2.5,
    tag: "2 min",
  },
  {
    n: 2,
    title: "Show up",
    text: "Find a meetup in your city — chai, treks and long conversations.",
    cta: "Find a meetup",
    href: "/meetups",
    external: false,
    Icon: MapPin,
    bg: "#ffd27a",
    ink: "#002820",
    tilt: 1.5,
    tag: "This month",
  },
  {
    n: 3,
    title: "Jump in",
    text: "Catch a guest session, enter Aarohan, or help run the next event.",
    cta: "See events",
    href: "/events",
    external: false,
    Icon: PartyPopper,
    bg: "#c6011f",
    ink: "#ffffff",
    tilt: -1.5,
    tag: "Every week",
  },
];

export function StartHere() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "center 0.5"] });
  const draw = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0, 1]);

  return (
    <section ref={ref} id="start" className="kz-font relative scroll-mt-[var(--kz-header-h)] bg-[#f9fbe5] pb-20 pt-6 text-[#002820] md:pb-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <p className="kz-label kz-mark mb-4 text-[#c6011f]">New here?</p>
            </Reveal>
            <RevealWords lines={["Three steps", "into the house"]} className="kz-h2" />
          </div>
          <Reveal i={2}>
            <p className="kz-lead max-w-sm text-[#4b6660]">No applications, no fees. Most members are in a group chat within the hour.</p>
          </Reveal>
        </div>

        <div className="relative mt-12">
          {/* the dotted trail between the steps draws itself as you scroll */}
          <svg aria-hidden="true" viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute inset-x-[8%] top-10 hidden h-28 w-[84%] md:block">
            <motion.path
              d="M10 60C200 -20 360 140 600 60S1000 -20 1190 60"
              fill="none"
              stroke="#002820"
              strokeOpacity="0.35"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="2 12"
              style={{ pathLength: draw }}
            />
          </svg>

          <ol className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => {
              const Wrapper = s.external ? "a" : Link;
              return (
                <li key={s.n}>
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 60, rotate: 0 }}
                    whileInView={{ opacity: 1, y: 0, rotate: s.tilt }}
                    whileHover={reduce ? undefined : { rotate: 0, y: -8, scale: 1.02 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ type: "spring", stiffness: 160, damping: 18, delay: i * 0.12 }}
                  >
                    <Wrapper
                      href={s.href}
                      {...(s.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="group relative flex min-h-[19rem] flex-col justify-between overflow-hidden rounded-[1.9rem] p-7 shadow-[0_24px_40px_-28px_rgba(0,40,32,0.55)] md:p-8"
                      style={{ background: s.bg, color: s.ink }}
                    >
                      <span aria-hidden="true" className="absolute -bottom-10 -right-6 text-[10rem] font-bold leading-none opacity-[0.12]">
                        {s.n}
                      </span>
                      <span className="relative flex items-start justify-between">
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-[#002820] shadow-sm transition-transform duration-500 group-hover:rotate-[-12deg] group-hover:scale-110">
                          <s.Icon size={24} />
                        </span>
                        <span className="kz-label rounded-full border border-current/30 px-3 py-1.5 text-[0.62rem]">{s.tag}</span>
                      </span>
                      <span className="relative">
                        <span className="kz-label opacity-60">Step {s.n}</span>
                        <h3 className="mt-1 text-[2rem] font-semibold leading-none tracking-[-0.03em]">{s.title}</h3>
                        <p className="kz-body mt-3 opacity-85">{s.text}</p>
                        <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold">
                          {s.cta}
                          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                        </span>
                      </span>
                    </Wrapper>
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ═══ About: slides up over the hero on rounded corners ═════════════ */

const VALUES = [
  { Icon: HeartHandshake, label: "Vibrant community", text: "A house that shows up for each other, online and off.", bg: "#dcebd8" },
  { Icon: Users, label: "Social gatherings", text: "Meetups in cities across India, from chai to treks.", bg: "#fde7c8" },
  { Icon: Crown, label: "Competitions", text: "Aarohan culturals, technicals and e-sports — together.", bg: "#ffd9d9" },
  { Icon: Sprout, label: "Personal growth", text: "Study plans, guest sessions and room to lead.", bg: "#d6f3f7" },
];

const STATEMENT =
  "We are a student community drawing inspiration from the resilience, diversity and strength of Kaziranga National Park. Rooted together, rising together.";

/** One word of the statement: dim until the reader's scroll reaches it. */
function FillWord({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return <motion.span style={{ opacity }}>{word} </motion.span>;
}

export function AboutIntro() {
  const ref = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: fill } = useScroll({ target: textRef, offset: ["start 0.85", "end 0.5"] });
  const { scrollYProgress: band } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(band, [0, 1], reduce ? ["0%", "0%"] : ["-12%", "12%"]);
  const words = STATEMENT.split(" ");

  return (
    <section
      ref={ref}
      id="about"
      className="kz-font relative z-10 -mt-[clamp(2rem,4vw,3.5rem)] scroll-mt-[var(--kz-header-h)] rounded-t-[clamp(2rem,4vw,3.5rem)] bg-[#f9fbe5] text-[#002820] shadow-[0_-24px_50px_-30px_rgba(0,40,32,0.45)]"
    >
      <div className="mx-auto max-w-[90rem] px-5 pb-16 pt-10 sm:px-8 md:px-12 md:pb-24 md:pt-14">
        <Reveal>
          <p className="kz-label kz-mark mb-6 text-[#c6011f]">About us</p>
        </Reveal>
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <p ref={textRef} className="text-[clamp(1.6rem,3.4vw,3.1rem)] font-semibold leading-[1.15] tracking-[-0.02em]">
            {reduce
              ? STATEMENT
              : words.map((w, i) => <FillWord key={i} word={w} progress={fill} range={[i / words.length, (i + 1) / words.length]} />)}
          </p>
          <Reveal i={1} className="lg:pb-2">
            <p className="kz-lead max-w-md text-[#4b6660]">
              Kaziranga House is one of the student houses of the IIT Madras BS Degree — 5,000+ members who meet up, study, compete and build things together.
            </p>
            <Link href="/council" className="group mt-6 inline-flex items-center gap-2 font-semibold text-[#006255]">
              Meet the people who run it
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </Reveal>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <li key={v.label}>
              <Reveal i={i} className="h-full">
                <div
                  className="group h-full rounded-[1.6rem] border border-[#002820]/10 p-6 transition-[transform,box-shadow] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-[0_24px_40px_-24px_rgba(0,40,32,0.45)]"
                  style={{ background: v.bg }}
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#006255] transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110">
                    <v.Icon size={22} />
                  </span>
                  <h3 className="kz-h3 mt-5">{v.label}</h3>
                  <p className="kz-body mt-2 text-[#36524b]">{v.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>

      {/* The valley's sky and treeline, drifting on its own parallax */}
      <div aria-hidden="true" className="relative isolate mx-5 h-44 overflow-hidden rounded-[2rem] sm:mx-8 md:mx-12 md:h-64">
        <motion.div style={{ y }} className="absolute -inset-y-[16%] inset-x-0 -z-10">
          <Image src="/images/art/jungle-valley.jpg" alt="" fill sizes="100vw" className="object-cover object-[50%_4%]" />
        </motion.div>
        <Ambient birds={4} specks={10} seed={7} sky={[10, 46]} />
      </div>
    </section>
  );
}

/* ═══ What we do: ruled colour cells ═══════════════════════════════ */

const CELLS = [
  { title: "Meetups", href: "/meetups", bg: "#006255", ink: "#ffffff", Icon: Users, text: "In-person meetups in cities across India, and the photos to remember them by." },
  { title: "Events", href: "/events", bg: "#c6011f", ink: "#ffffff", Icon: CalendarDays, text: "Guest sessions, Community Day, Aarohan and Curiosity Hour — live and recorded." },
  { title: "Study Zone", href: "/study", bg: "#96b4a5", ink: "#002820", Icon: BookOpen, text: "Planners, resources and revision sessions for the IIT Madras BS Degree." },
  { title: "Kaziranga Tak", href: "/tak", bg: "#002820", ink: "#f9fbe5", Icon: Mic, text: "Short videos and stories about what's happening in the house." },
];

export function WhatWeDo() {
  return (
    <section id="what-we-do" className="kz-font bg-[#f9fbe5] text-[#002820]">
      <SectionHead
        label="What we do"
        title={["Everything", "the house does"]}
        intro="From weekend meetups to guest sessions and study plans — here is where the 5,000+ members of Kaziranga House spend their time together."
      />
      <div className="grid grid-cols-1 gap-4 px-5 sm:grid-cols-2 sm:px-8 md:px-12 lg:grid-cols-4">
        {CELLS.map((c, i) => (
          <Reveal key={c.title} i={i} y={60}>
            <Link
              href={c.href}
              className="group relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden rounded-[1.75rem] p-7 transition-[transform,box-shadow] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:shadow-[0_30px_50px_-28px_rgba(0,40,32,0.6)] md:p-8"
              style={{ background: c.bg, color: c.ink }}
            >
              <span aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-[1.35]" />
              <span aria-hidden="true" className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-black/5 transition-transform duration-700 group-hover:translate-x-6" />
              <span className="relative flex items-start justify-between">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/15 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                  <c.Icon size={30} strokeWidth={1.8} />
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-full border border-current/30 opacity-60 transition-all duration-500 group-hover:rotate-45 group-hover:opacity-100">
                  <ArrowUpRight size={18} />
                </span>
              </span>
              <span className="relative">
                <span className="kz-label opacity-60">0{i + 1}</span>
                <h3 className="mt-2 text-[1.7rem] font-semibold leading-tight tracking-[-0.02em]">{c.title}</h3>
                <p className="kz-body mt-2 opacity-85">{c.text}</p>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
      <div className="h-20 md:h-28" />
    </section>
  );
}

/* ═══ Join: crossing ribbons, a green panel with Kaz, and the ways in ═ */

const RIBBON = ["Meetups", "Events", "Study Zone", "Aarohan", "Curiosity Hour", "Kaziranga Tak", "Community Day", "Gallery"];

function Ribbon({ className, rev = false, d = "40s" }: { className: string; rev?: boolean; d?: string }) {
  const row = [...RIBBON, ...RIBBON];
  return (
    <div aria-hidden="true" className={`overflow-hidden py-3.5 ${className}`}>
      <div className={`kz-marquee ${rev ? "kz-marquee--rev" : ""}`} style={vars({ "--d": d })}>
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {row.map((t, i) => (
              <span key={i} className="kz-h3 flex items-center gap-6 px-6 text-[0.95rem]">
                {t}
                <span className="text-[1.1rem]">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const JOIN_CELLS = [
  { title: "WhatsApp community", text: "Fill the short form and get added to the house groups.", href: JOIN_URL, Icon: FaWhatsapp, bg: "#96b4a5", ink: "#002820", cta: "Join the groups" },
  { title: "Instagram", text: "Meetup photos, event posters and Kaziranga Tak reels.", href: INSTAGRAM, Icon: FaInstagram, bg: "#c6011f", ink: "#ffffff", cta: "Follow us" },
  { title: "YouTube", text: "Recorded guest sessions and Curiosity Hour talks.", href: YOUTUBE, Icon: FaYoutube, bg: "#002820", ink: "#f9fbe5", cta: "Watch sessions" },
];

export function JoinFinale() {
  return (
    <section id="join" className="kz-font relative overflow-hidden bg-[#f9fbe5] pb-20 pt-10 text-[#002820] md:pb-28">
      {/* two ribbons crossing — the house's whole calendar in one glance */}
      <div className="relative h-36 md:h-40">
        <Ribbon className="absolute inset-x-[-5%] top-8 -rotate-[3deg] bg-[#002820] text-[#f9fbe5]" d="46s" />
        <Ribbon className="absolute inset-x-[-5%] top-10 rotate-[2deg] bg-[#c6011f] text-white" rev d="38s" />
      </div>

      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
        <Reveal y={60}>
          <div className="relative isolate overflow-hidden rounded-[2.25rem] bg-[#006255] text-white md:rounded-[3rem]">
            <span aria-hidden="true" className="absolute -left-24 -top-24 -z-10 h-80 w-80 rounded-full bg-white/[0.06]" />
            <span aria-hidden="true" className="absolute bottom-[-30%] right-[-10%] -z-10 h-[30rem] w-[30rem] rounded-full bg-[#00473d]" />
            <Ambient birds={2} specks={14} seed={31} sky={[6, 40]} />

            <div className="grid items-center gap-6 p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:p-16">
              <div className="relative z-10">
                <p className="kz-label text-white/65">Join us</p>
                <RevealWords lines={["Be a part of", "Kaziranga House."]} className="kz-h2 mt-4" />
                <Reveal i={2}>
                  <p className="kz-lead mt-6 max-w-lg text-white/80">
                    Every IIT Madras BS student in the house is welcome. Say hello, come to a meetup, or help run the next event — 5,000+ members are already in.
                  </p>
                </Reveal>
                <Reveal i={3}>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--red kz-btn--shine group">
                      Join the house <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                    <Link href="/meetups" className="kz-btn kz-btn--white">
                      Find a meetup
                    </Link>
                  </div>
                </Reveal>
              </div>

              {/* Kaz on a rock in front of a big pale sun */}
              <div className="relative mx-auto w-full max-w-[30rem] pb-6">
                <div className="relative aspect-square">
                  <span aria-hidden="true" className="absolute inset-[8%] rounded-full bg-[#f9fbe5]/12" />
                  <span aria-hidden="true" className="absolute inset-[20%] rounded-full bg-[#ffd27a]/85" />
                  <svg aria-hidden="true" viewBox="0 0 100 100" className="kz-spin absolute inset-0 h-full w-full" style={vars({ "--d": "60s" })}>
                    <circle cx="50" cy="50" r="47" fill="none" stroke="#f9fbe5" strokeOpacity="0.45" strokeWidth="0.4" strokeDasharray="1.2 2.6" />
                    <circle cx="50" cy="3" r="1.8" fill="#ffd27a" />
                  </svg>
                  <Butterflies
                    items={[
                      { left: "14%", top: "22%", color: ["#ffb81c", "#f08a00"], w: 30, d: 12, path: [40, -20, 70, 20, 20, 30] },
                      { left: "78%", top: "18%", color: ["#4cc3ff", "#1a8fe0"], w: 26, d: 15, delay: -4, path: [-40, 20, -10, 40, -60, -10] },
                    ]}
                  />
                  <div className="absolute inset-x-[6%] bottom-[10%]">
                    <Rhino />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          {JOIN_CELLS.map((c, i) => (
            <Reveal key={c.title} i={i} y={50}>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-full flex-col justify-between gap-10 overflow-hidden rounded-[1.75rem] p-7 transition-[transform,box-shadow] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:shadow-[0_28px_44px_-26px_rgba(0,40,32,0.6)] md:p-8"
                style={{ background: c.bg, color: c.ink }}
              >
                <span aria-hidden="true" className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-150" />
                <span className="relative flex items-center justify-between">
                  <c.Icon size={30} className="transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-current/30 transition-transform duration-500 group-hover:rotate-45">
                    <ArrowUpRight size={17} />
                  </span>
                </span>
                <span className="relative">
                  <h3 className="text-[1.45rem] font-semibold tracking-[-0.02em]">{c.title}</h3>
                  <p className="kz-body mt-2 opacity-80">{c.text}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold">
                    {c.cta}
                    <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                  </span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
