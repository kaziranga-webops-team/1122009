"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, HeartHandshake, Crown, MapPin, Mic, PartyPopper, Sprout, Users } from "lucide-react";
import { FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";
import Ambient from "@/components/kz/Ambient";
import { JOIN_URL } from "@/components/kz/KzHeader";
import { Rhino } from "@/components/kz/Scene";
import { vars } from "@/components/kz/util";

const SOFT = [0.22, 1, 0.36, 1] as const;
const INSTAGRAM = "https://www.instagram.com/kaziranga_iitm/";
const YOUTUBE = "http://www.youtube.com/@KazirangaHouse";

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
                    initial={reduce ? false : { y: "105%" }}
                    whileInView={{ y: "0%" }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.9, delay: i * 0.05, ease: SOFT }}
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

/** Heading left, short intro right — the section opener used across the site. */
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
    <div className="mx-auto grid max-w-[90rem] gap-6 px-5 pb-10 pt-20 sm:px-8 md:px-12 md:pb-14 md:pt-28 lg:grid-cols-[1.3fr_1fr] lg:items-end">
      <div>
        {label && (
          <Reveal>
            <p className={`kz-eyebrow mb-5 ${dark ? "kz-eyebrow--light" : ""}`}>{label}</p>
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
          <p className={`kz-lead max-w-xl ${dark ? "text-[#c9d8c9]" : "text-[#3f5a52]"}`}>{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

/**
 * A colour block that grows into place: it enters as a rounded card inset
 * from the edges and widens to full bleed as it reaches the top of the
 * screen, so a change of colour feels like a new chapter opening.
 */
export function GrowPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.25"] });
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.94, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 40, 0]);
  return (
    <div ref={ref} className={`overflow-x-clip ${className}`}>
      <motion.div style={{ scale, borderRadius: radius }} className="origin-top overflow-hidden will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/** Gamosa border strip — the chapter mark between sections. */
export function Gamosa({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return <div aria-hidden="true" className={`kz-gamosa ${dark ? "kz-gamosa--dark" : ""} ${className}`} />;
}

/* ═══ About: deep green, slides up over the hero on rounded corners ═ */

// fresh light greens — leaf, mint and sage — rather than faded beiges
const VALUES = [
  { Icon: HeartHandshake, label: "Vibrant community", text: "A house that shows up for each other, online and off.", bg: "#dcebd8" },
  { Icon: Users, label: "Social gatherings", text: "Meetups in cities across India, from chai to treks.", bg: "#c6e3cf" },
  { Icon: Crown, label: "Competitions", text: "Aarohan culturals, technicals and e-sports, together.", bg: "#d4ebbe" },
  { Icon: Sprout, label: "Personal growth", text: "Study plans, guest sessions and room to lead.", bg: "#b9dcc8" },
];

const STATEMENT =
  "We are a student community drawing inspiration from the resilience, diversity and strength of Kaziranga National Park. Rooted together, rising together.";

/** One word of the statement: dim until the reader's scroll reaches it. */
function FillWord({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.22, 1]);
  return <motion.span style={{ opacity }}>{word} </motion.span>;
}

/** Deterministic 0..1 sequence, so server and client draw the same shapes. */
function seq(seed: number) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

/** A row of rounded tree canopies hanging down from the top edge. */
function canopy(seed: number, base: number, minW: number, maxW: number, minH: number, maxH: number) {
  const r = seq(seed);
  let d = `M0 0H1440V${base}`;
  let x = 1440;
  while (x > 0) {
    const w = minW + r() * (maxW - minW);
    const h = minH + r() * (maxH - minH);
    d += `Q${(x - w / 2).toFixed(1)} ${(base + h).toFixed(1)} ${Math.max(0, x - w).toFixed(1)} ${base}`;
    x -= w;
  }
  return d + "V0z";
}

/** Rolling hills topped with a fringe of small trees, rising from the bottom. */
function hills(seed: number, base: number, amp: number, tree: number) {
  const r = seq(seed);
  const pts: [number, number][] = [];
  const a = r() * 6;
  const b = r() * 6;
  for (let x = 0; x <= 1440; x += 24) {
    pts.push([x, base - amp * (0.55 * Math.sin(x / 210 + a) + 0.45 * Math.sin(x / 97 + b))]);
  }
  let d = `M0 200V${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    const [px, py] = pts[i - 1];
    // a little rounded tree bump on each step of the ridge
    const t = tree * (0.5 + r());
    d += `Q${((x + px) / 2).toFixed(1)} ${(Math.min(y, py) - t).toFixed(1)} ${x} ${y.toFixed(1)}`;
  }
  return d + "V200z";
}

const CANOPY_NEAR = canopy(11, 64, 46, 110, 40, 70);
const CANOPY_FAR = canopy(23, 92, 30, 70, 22, 44);
const HILLS_FAR = hills(5, 120, 22, 9);
const HILLS_MID = hills(17, 150, 16, 12);

/**
 * The hand-off from the deep green About section to the cream page below,
 * as a walk down into a misty valley: the forest canopy overhead, a warm
 * glow through the haze, and two ridges of distant trees rising out of the
 * fog. Every layer moves at its own scroll speed, so the depth is felt,
 * and the fog banks drift on their own. It all settles into plain cream.
 */
function FogTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const m = (a: string, b: string) => (reduce ? ["0%", "0%"] : [a, b]);
  const canopyNear = useTransform(p, [0, 1], m("-14%", "18%"));
  const canopyFar = useTransform(p, [0, 1], m("-6%", "10%"));
  const ridgeFar = useTransform(p, [0, 1], m("10%", "-4%"));
  const ridgeMid = useTransform(p, [0, 1], m("9%", "-5%"));
  const glow = useTransform(p, [0.15, 0.6], [0.2, reduce ? 0.6 : 0.85]);
  const fogA = useTransform(p, [0, 1], m("-7%", "7%"));
  const fogB = useTransform(p, [0, 1], m("9%", "-9%"));

  return (
    <div ref={ref} aria-hidden="true" className="relative z-[1] -mb-[2px] -mt-px h-[clamp(19rem,34vw,30rem)] overflow-hidden">
      {/* the air: deep forest at the top, misty sage, then cream */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#00332a_0%,#164a3e_18%,#4f7d6f_38%,#9dbcad_56%,#d9e6d2_72%,#f9fbe5_86%)]" />

      {/* warm morning light through the haze */}
      <motion.div
        style={{ opacity: glow }}
        className="absolute inset-0 bg-[radial-gradient(38%_42%_at_68%_58%,rgba(255,231,176,0.75),rgba(255,231,176,0)_70%)]"
      />

      {/* the valley — ridges and the fog between them — fades into cream before the edge */}
      <div className="absolute inset-0 [mask-image:linear-gradient(180deg,#000_62%,transparent_95%)]">
      {/* far ridge — pale, half lost in the mist */}
      <motion.svg style={{ y: ridgeFar }} viewBox="0 0 1440 200" preserveAspectRatio="none" className="absolute inset-x-0 top-[-11%] h-[126%] w-full">
        <path d={HILLS_FAR} fill="#7fa596" opacity="0.55" />
      </motion.svg>

      {/* a fog bank between the ridges */}
      <motion.div style={{ x: fogA }} className="absolute inset-x-[-30%] top-[44%] h-[40%]">
        <span className="kz-fog" style={vars({ "--d": "44s", "--o": 0.7 })} />
      </motion.div>

      {/* nearer ridge */}
      <motion.svg style={{ y: ridgeMid }} viewBox="0 0 1440 200" preserveAspectRatio="none" className="absolute inset-x-0 top-[-52%] h-[170%] w-full">
        <path d={HILLS_MID} fill="#a9c6b6" opacity="0.6" />
      </motion.svg>
      </div>

      {/* the forest overhead, two depths of canopy */}
      <motion.svg style={{ y: canopyFar }} viewBox="0 0 1440 170" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[44%] w-full">
        <path d={CANOPY_FAR} fill="#1d5446" />
      </motion.svg>
      <motion.svg style={{ y: canopyNear }} viewBox="0 0 1440 170" preserveAspectRatio="none" className="absolute inset-x-0 -top-[4%] h-[40%] w-full">
        <path d={CANOPY_NEAR} fill="#00332a" />
      </motion.svg>

      <Ambient birds={4} specks={0} seed={19} sky={[42, 62]} />

      {/* low fog, densest at the bottom; masked so it fades before the edge */}
      <div className="absolute inset-0 [mask-image:linear-gradient(180deg,#000_72%,transparent_97%)]">
        <motion.div style={{ x: fogB }} className="absolute inset-x-[-30%] top-[56%] h-[44%]">
          <span className="kz-fog" style={vars({ "--d": "34s", "--o": 0.85, "--delay": "-12s" })} />
        </motion.div>
        <motion.div style={{ x: fogA }} className="absolute inset-x-[-30%] top-[68%] h-[40%]">
          <span className="kz-fog" style={vars({ "--d": "52s", "--o": 1, "--delay": "-25s" })} />
        </motion.div>
      </div>

      {/* a last cream fade over everything, so the edge into the next section is invisible */}
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-[linear-gradient(180deg,rgba(249,251,229,0),#f9fbe5_85%)]" />
    </div>
  );
}

export function AboutIntro() {
  const textRef = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: fill } = useScroll({ target: textRef, offset: ["start 0.85", "end 0.5"] });
  const words = STATEMENT.split(" ");

  return (
    <section
      id="about"
      className="kz-font relative z-10 -mt-[clamp(2rem,4vw,3.5rem)] scroll-mt-[var(--kz-header-h)] rounded-t-[clamp(2rem,4vw,3.5rem)] bg-[#00332a] text-[#f9fbe5] shadow-[0_-24px_50px_-26px_rgba(0,20,15,0.55)]"
    >
      <div className="kz-jaali rounded-t-[inherit]">
        <div className="mx-auto max-w-[90rem] px-5 pb-12 pt-14 sm:px-8 md:px-12 md:pb-16 md:pt-20">
          <Reveal>
            <p className="kz-eyebrow kz-eyebrow--light mb-7">About us</p>
          </Reveal>
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <p ref={textRef} className="kz-serif text-[clamp(1.55rem,3vw,2.7rem)] font-medium leading-[1.25]">
              {reduce
                ? STATEMENT
                : words.map((w, i) => <FillWord key={i} word={w} progress={fill} range={[i / words.length, (i + 1) / words.length]} />)}
            </p>
            <Reveal i={1} className="lg:pb-2">
              <p className="kz-lead max-w-md text-[#c9d8c9]">
                Kaziranga House is one of the student houses of the IIT Madras BS Degree — 5,000+ members who meet up, study, compete and build things together.
              </p>
              <Link href="/council" className="group mt-6 inline-flex items-center gap-2 font-semibold text-[#ecd394]">
                Meet the people who run it
                <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <li key={v.label}>
                <Reveal i={i} className="h-full">
                  <div
                    className="group relative h-full overflow-hidden rounded-[1.5rem] p-6 text-[#002820] transition-[transform,box-shadow] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(0,0,0,0.55)]"
                    style={{ background: v.bg }}
                  >
                    <span aria-hidden="true" className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/40 transition-transform duration-700 group-hover:scale-125" />
                    <span className="relative grid h-12 w-12 place-items-center rounded-full bg-[#006255] text-[#f9fbe5]">
                      <v.Icon size={21} strokeWidth={1.7} />
                    </span>
                    <h3 className="kz-serif relative mt-5 text-[1.25rem]">{v.label}</h3>
                    <p className="kz-body relative mt-2 text-[#2f4a43]">{v.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <FogTransition />
    </section>
  );
}

/* ═══ Start here: three cards pegged to a rope ═════════════════════ */

const STEPS = [
  { n: "01", title: "Say hi", text: "Fill the two-minute form and get added to the house WhatsApp groups.", cta: "Join the community", href: JOIN_URL, external: true, Icon: FaWhatsapp, tag: "only 2 minutes!", bg: "#dcebd8", dark: false, tilt: -2.4, delay: "0s" },
  { n: "02", title: "Show up", text: "Find a meetup in your city — chai, treks and long conversations.", cta: "Find a meetup", href: "/meetups", external: false, Icon: MapPin, tag: "bring a friend :)", bg: "#c6e3cf", dark: false, tilt: 1.8, delay: "-1.9s" },
  { n: "03", title: "Jump in", text: "Catch a guest session, enter Aarohan, or help run the next event.", cta: "See events", href: "/events", external: false, Icon: PartyPopper, tag: "pick anything!", bg: "#006255", dark: true, tilt: -1.4, delay: "-3.3s" },
];

/** A little wooden clothes peg that clips each card to the rope. */
function Peg() {
  return (
    <svg aria-hidden="true" viewBox="0 0 22 48" className="absolute left-1/2 top-[-34px] z-20 h-12 w-[22px] -translate-x-1/2 drop-shadow-[0_3px_2px_rgba(0,40,32,0.25)]">
      <rect x="2.5" y="1" width="17" height="46" rx="3.5" fill="#d7b46a" />
      <rect x="2.5" y="1" width="8.5" height="46" rx="3.5" fill="#e6c98a" />
      <rect x="10.3" y="1" width="1.4" height="46" fill="#8a6522" />
      <circle cx="11" cy="17" r="3.4" fill="none" stroke="#6b4e17" strokeWidth="1.6" />
    </svg>
  );
}

export function StartHere() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.35"] });
  const draw = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0, 1]);

  return (
    <section ref={ref} id="start" className="kz-font relative scroll-mt-[var(--kz-header-h)] bg-[#f9fbe5] pb-20 pt-4 text-[#002820] md:pb-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <p className="kz-eyebrow mb-5">New here?</p>
            </Reveal>
            <RevealWords lines={["Three steps", "into the house"]} className="kz-h2" />
          </div>
          <Reveal i={2}>
            <p className="kz-lead max-w-sm text-[#3f5a52]">No applications, no fees. Most members are in a group chat within the hour.</p>
          </Reveal>
        </div>

        <div className="relative mt-14">
          {/* the rope: it sags between the pegs and draws itself in as you arrive */}
          <svg aria-hidden="true" viewBox="0 0 1200 64" preserveAspectRatio="none" className="absolute inset-x-0 -top-1 hidden h-16 w-full overflow-visible md:block">
            <motion.path
              d="M-30 4Q90 40 200 24Q400 58 600 24Q800 58 1000 24Q1110 40 1230 4"
              fill="none"
              stroke="#8a6522"
              strokeWidth="2.6"
              strokeLinecap="round"
              style={{ pathLength: draw }}
            />
            <motion.path
              d="M-30 4Q90 40 200 24Q400 58 600 24Q800 58 1000 24Q1110 40 1230 4"
              fill="none"
              stroke="#e6c98a"
              strokeWidth="1"
              strokeDasharray="3 5"
              strokeLinecap="round"
              style={{ pathLength: draw }}
            />
          </svg>

          <ol className="relative grid grid-cols-1 gap-12 pt-12 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => {
              const Wrapper = s.external ? "a" : Link;
              return (
                <li key={s.n}>
                  {/* each card drops onto the rope with a little bounce, then sways */}
                  <motion.div
                    className="h-full"
                    initial={reduce ? false : { opacity: 0, y: -60, rotate: -8 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ type: "spring", stiffness: 120, damping: 11, delay: 0.25 + i * 0.18 }}
                  >
                    <div className="kz-swing relative h-full" style={vars({ "--tilt": `${s.tilt}deg`, "--delay": s.delay })}>
                      <Peg />
                      <Wrapper
                        href={s.href}
                        {...(s.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="group relative flex h-full min-h-[17.5rem] flex-col justify-between overflow-hidden rounded-[1.5rem] p-7 shadow-[0_22px_36px_-26px_rgba(0,40,32,0.6)] transition-[transform,box-shadow] duration-500 [transition-timing-function:cubic-bezier(0.34,1.4,0.64,1)] hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_30px_46px_-26px_rgba(0,40,32,0.6)] md:p-8"
                        style={{ background: s.bg, color: s.dark ? "#f9fbe5" : "#002820" }}
                      >
                        <span
                          aria-hidden="true"
                          className={`absolute -bottom-16 -right-12 h-44 w-44 rounded-full transition-transform duration-700 group-hover:scale-125 ${s.dark ? "bg-white/[0.07]" : "bg-white/40"}`}
                        />
                        <span className="relative flex items-center justify-between">
                          <span className={`kz-serif text-[2.6rem] leading-none ${s.dark ? "text-[#ecd394]" : "text-[#8a6522]"}`}>{s.n}</span>
                          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f9fbe5] text-[#006255] transition-transform duration-500 group-hover:rotate-[-12deg] group-hover:scale-110">
                            <s.Icon size={20} />
                          </span>
                        </span>
                        <span className="relative">
                          <h3 className="kz-serif text-[1.7rem]">{s.title}</h3>
                          <p className={`kz-body mt-2 ${s.dark ? "text-[#d5e3d9]" : "text-[#2f4a43]"}`}>{s.text}</p>
                          <span className="mt-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                            <span className={`inline-flex items-center gap-2 whitespace-nowrap text-sm font-bold ${s.dark ? "text-[#f9fbe5]" : "text-[#006255]"}`}>
                              {s.cta}
                              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </span>
                            {/* a handwritten note, like one scribbled on the card */}
                            <span
                              className={`inline-block -rotate-[5deg] whitespace-nowrap text-[1.3rem] leading-none [font-family:Caveat,cursive] ${s.dark ? "text-[#ecd394]" : "text-[#6b4e17]"}`}
                            >
                              {s.tag}
                            </span>
                          </span>
                        </span>
                      </Wrapper>
                    </div>
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

/* ═══ What we do: four quiet doors into the site ═══════════════════ */

// The site's four doors, in the logo's greens with the original circle design.
// Dark cards carry cream text and a brass number; the light one, ink.
const CELLS = [
  { title: "Meetups", href: "/meetups", Icon: Users, bg: "#006255", dark: true, text: "In-person meetups in cities across India, and the photos to remember them by." },
  { title: "Events", href: "/events", Icon: CalendarDays, bg: "#00332a", dark: true, text: "Guest sessions, Community Day, Aarohan and Curiosity Hour — live and recorded." },
  { title: "Study Zone", href: "/study", Icon: BookOpen, bg: "#96b4a5", dark: false, text: "Planners, resources and revision sessions for the IIT Madras BS Degree." },
  { title: "Kaziranga Tak", href: "/tak", Icon: Mic, bg: "#1f4d43", dark: true, text: "Short videos and stories about what's happening in the house." },
];

export function WhatWeDo() {
  return (
    <section id="what-we-do" className="kz-font bg-[#f9fbe5] text-[#002820]">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
        <div className="kz-rule">
          <span className="text-[0.7rem]">◆</span>
        </div>
      </div>
      <SectionHead
        label="What we do"
        title={["Everything", "the house does"]}
        intro="From weekend meetups to guest sessions and study plans — here is where the 5,000+ members of Kaziranga House spend their time together."
      />
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-5 px-5 sm:grid-cols-2 sm:px-8 md:px-12 lg:grid-cols-4">
        {CELLS.map((c, i) => (
          <Reveal key={c.title} i={i}>
            <Link
              href={c.href}
              className="kz-jaali group relative flex h-full min-h-[19rem] flex-col justify-between overflow-hidden rounded-[1.6rem] p-7 transition-[transform,box-shadow] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-[0_28px_46px_-28px_rgba(0,40,32,0.6)] md:p-8"
              style={{ backgroundColor: c.bg, color: c.dark ? "#f9fbe5" : "#002820" }}
            >
              <span aria-hidden="true" className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-[1.3]" />
              <span aria-hidden="true" className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-black/[0.06] transition-transform duration-700 group-hover:translate-x-5" />
              <span className="relative flex items-start justify-between">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 transition-transform duration-500 group-hover:scale-105">
                  <c.Icon size={25} strokeWidth={1.7} />
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full border border-current/25 transition-transform duration-500 group-hover:rotate-45">
                  <ArrowUpRight size={17} />
                </span>
              </span>
              <span className="relative">
                <span className={`text-[0.72rem] font-bold tracking-[0.2em] ${c.dark ? "text-[#ecd394]" : "text-[#3d2c0c]"}`}>0{i + 1}</span>
                <h3 className="kz-serif mt-2 text-[1.65rem]">{c.title}</h3>
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

/* ═══ Join: a calm closing panel with Kaz, and the ways in ═════════ */

const JOIN_CELLS = [
  { title: "WhatsApp community", text: "Fill the short form and get added to the house groups.", href: JOIN_URL, Icon: FaWhatsapp, cta: "Join the groups", bg: "#006255", dark: true, red: false },
  { title: "Instagram", text: "Meetup photos, event posters and Kaziranga Tak reels.", href: INSTAGRAM, Icon: FaInstagram, cta: "Follow us", bg: "#dcebd8", dark: false, red: false },
  { title: "YouTube", text: "Recorded guest sessions and Curiosity Hour talks.", href: YOUTUBE, Icon: FaYoutube, cta: "Watch sessions", bg: "#00332a", dark: true, red: true },
];

export function JoinFinale() {
  return (
    <section id="join" className="kz-font relative overflow-hidden bg-[#f9fbe5] pb-20 pt-20 text-[#002820] md:pb-28 md:pt-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
        <Reveal>
          <div className="kz-corners relative isolate overflow-hidden rounded-[2rem] border border-[#002820]/10 bg-[#eef1dc] md:rounded-[2.5rem]">
            <div className="grid items-center gap-4 p-8 sm:p-12 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:p-16">
              <div className="relative z-10">
                <p className="kz-eyebrow">Join us</p>
                <RevealWords lines={["Be a part of", "Kaziranga House."]} className="kz-h2 mt-5" />
                <Reveal i={2}>
                  <p className="kz-lead mt-6 max-w-lg text-[#3f5a52]">
                    Every IIT Madras BS student in the house is welcome. Say hello, come to a meetup, or help run the next event — 5,000+ members are already in.
                  </p>
                </Reveal>
                <Reveal i={3}>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--red group">
                      Join the house <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                    <Link href="/meetups" className="kz-btn kz-btn--outline">
                      Find a meetup
                    </Link>
                  </div>
                </Reveal>
              </div>

              {/* Kaz on his rock, in front of a pale sun ringed in brass */}
              <div className="relative mx-auto w-full max-w-[26rem]">
                <div className="relative aspect-square">
                  <span aria-hidden="true" className="absolute inset-[14%] rounded-full bg-[#f9fbe5]" />
                  <svg aria-hidden="true" viewBox="0 0 100 100" className="kz-spin absolute inset-[4%] h-[92%] w-[92%]" style={vars({ "--d": "90s" })}>
                    <circle cx="50" cy="50" r="48" fill="none" stroke="#c9a24a" strokeWidth="0.35" strokeDasharray="0.8 2.4" />
                  </svg>
                  <div className="absolute inset-x-[8%] bottom-[12%]">
                    <Rhino />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          {JOIN_CELLS.map((c, i) => (
            <Reveal key={c.title} i={i}>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-full flex-col justify-between gap-8 overflow-hidden rounded-[1.5rem] p-6 transition-[transform,box-shadow] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_24px_40px_-28px_rgba(0,40,32,0.55)] md:p-7"
                style={{ background: c.bg, color: c.dark ? "#f9fbe5" : "#002820" }}
              >
                <span aria-hidden="true" className={`absolute -right-10 -top-10 h-36 w-36 rounded-full transition-transform duration-700 group-hover:scale-125 ${c.dark ? "bg-white/[0.07]" : "bg-white/40"}`} />
                <span className="relative flex items-center justify-between">
                  {/* YouTube keeps its red: it tells people at a glance this is where the videos are */}
                  <span className={`grid h-12 w-12 place-items-center rounded-full ${c.red ? "bg-[#c10021] text-white" : "bg-[#f9fbe5] text-[#006255]"}`}>
                    <c.Icon size={20} />
                  </span>
                  <ArrowUpRight size={18} className="opacity-70 transition-transform duration-500 group-hover:rotate-45" />
                </span>
                <span className="relative">
                  <h3 className="kz-serif text-[1.35rem]">{c.title}</h3>
                  <p className={`kz-body mt-1.5 ${c.dark ? "text-[#d5e3d9]" : "text-[#2f4a43]"}`}>{c.text}</p>
                  {c.red ? (
                    <span className="kz-btn kz-btn--sm kz-btn--red mt-5">
                      <FaYoutube size={15} /> {c.cta}
                    </span>
                  ) : (
                    <span className={`mt-5 inline-flex items-center gap-2 text-sm font-bold ${c.dark ? "text-[#f9fbe5]" : "text-[#006255]"}`}>
                      {c.cta}
                      <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  )}
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
