"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { preload } from "react-dom";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { JOIN_URL } from "@/components/kz/KzHeader";
import { Burst, ChapterTitle, Gamosa, MuseumLabel, Postmark, Signboards, Stamp } from "@/components/kz/Motifs";
import { HERITAGE, type Heritage } from "@/lib/heritage";
import { POSTERS } from "@/lib/posters";
import { useContent } from "@/hooks/useData";
import { useSiteImages } from "@/lib/siteImages";
import { cdnImage } from "@/lib/api";

const SOFT = [0.22, 1, 0.36, 1] as const;
const INSTAGRAM = "https://www.instagram.com/kaziranga_iitm/";
const YOUTUBE = "http://www.youtube.com/@KazirangaHouse";
const DEFAULT_SUBTITLE =
  "A student house of the IIT Madras BS degree — 5,000+ members meeting up, learning and building things together, from every corner of India.";

/** One piece of the collage, pasted down with a little drop and spin. */
/**
 * A cut-out pasted onto the hero poster. CSS, not JavaScript: it is in the
 * server-rendered page and plays from the first paint, instead of staying
 * invisible until the page's scripts load.
 */
function Paste({ children, delay, rotate, className = "" }: { children: React.ReactNode; delay: number; rotate: number; className?: string }) {
  return (
    <div className={`kz-paste ${className}`} style={{ ["--rot" as string]: `${rotate}deg`, ["--delay" as string]: `${delay}s` }}>
      {children}
    </div>
  );
}

/* ═══ I. Arrival — the poster ═══════════════════════════════════════ */

export function PosterHero() {
  preload("/images/hero/kaziranga-day-1200.webp", { as: "image", fetchPriority: "high" });
  const { data: content } = useContent();
  const subtitle = content?.hero?.subtitle || DEFAULT_SUBTITLE;
  const reduce = useReducedMotion();

  return (
    <section id="top" className="kz-font kz-cloth relative overflow-hidden bg-[#c8102e] pt-[var(--kz-header-h)] text-[#f5e9cf]">
      <div className="relative mx-auto grid max-w-[90rem] gap-10 px-5 pb-16 pt-10 sm:px-8 md:px-12 lg:grid-cols-[1.02fr_1fr] lg:items-center lg:pb-24 lg:pt-14">
        {/* ── the words ── */}
        <div className="relative z-10">
          <h1 className="kz-display leading-[0.86]">
            <span className="kz-enter kz-offset block text-[clamp(4rem,10vw,9.5rem)] text-[#f6b51e]" style={{ ["--offset" as string]: "#1c130c" }}>
              Kaziranga
            </span>
            <span className="kz-enter block text-[clamp(3rem,7.4vw,6.8rem)] text-[#f5e9cf]" style={{ ["--delay" as string]: "0.08s" }}>
              House
            </span>
          </h1>
          <Greeting />
          <p className="kz-lead mt-7 max-w-[34rem] text-[#f5e9cf]/90">{subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="kz-btn kz-focus group bg-[#f6b51e] text-[#1c130c] hover:brightness-105">
              Join the house <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <Link href="#land" className="kz-btn kz-btn--outline kz-focus text-[#f5e9cf]">
              Our story
            </Link>
          </div>
        </div>

        {/* ── the collage ── */}
        <div className="relative mx-auto aspect-[1/1] w-full max-w-[38rem] lg:max-w-none">
          <div className="absolute inset-[-6%]">
            <div className={`h-full w-full ${reduce ? "" : "kz-spin"}`} style={{ ["--d" as string]: "120s" }}>
              <Burst className="h-full w-full opacity-95" />
            </div>
          </div>

          <Paste delay={0.05} rotate={-4} className="absolute left-[9%] top-[14%] w-[76%]">
            <Stamp value="₹ 5" bg="#f5e9cf">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero/kaziranga-day-1200.webp"
                alt="A painting of Kaziranga's grassland: one-horned rhinos grazing by a pool under a big tree, hills beyond"
                className="aspect-[4/3] w-full object-cover"
                fetchPriority="high"
              />
            </Stamp>
          </Paste>

          <Paste delay={0.15} rotate={-12} className="absolute left-[2%] top-[4%] w-[30%]">
            <Postmark
              className="w-full text-[clamp(0.9rem,1.6vw,1.25rem)]"
              color="#1c130c"
              center={
                <>
                  26°34′N
                  <br />
                  93°10′E
                </>
              }
            />
          </Paste>

          <Paste delay={0.22} rotate={7} className="absolute bottom-[2%] right-[0%] w-[44%]">
            <figure className="kz-cutout">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HERITAGE.elephant.src} alt={HERITAGE.elephant.alt} className="aspect-[3/2] w-full object-cover" />
            </figure>
          </Paste>

          <Paste delay={0.3} rotate={-8} className="absolute right-[3%] top-[0%] w-[22%]">
            <figure className="kz-cutout rounded-full p-[5px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HERITAGE.hoopoe.src} alt={HERITAGE.hoopoe.alt} className="aspect-square w-full rounded-full object-cover object-[50%_40%]" />
            </figure>
          </Paste>

          <Paste delay={0.36} rotate={0} className="absolute bottom-[6%] left-[-2%] z-10">
            <Signboards
              items={[
                { label: "Meetups", href: "/meetups", bg: "#2343b8", ink: "#f5e9cf", tilt: -3 },
                { label: "Events", href: "/events", bg: "#f6b51e", ink: "#1c130c", tilt: 2 },
                { label: "Study zone", href: "/study", bg: "#0f5e48", ink: "#f5e9cf", tilt: -1.5 },
              ]}
            />
          </Paste>
        </div>
      </div>
      <Gamosa />
    </section>
  );
}

/* ═══ II. The land ══════════════════════════════════════════════════ */

const STATEMENT =
  "We are a student community drawing inspiration from the resilience, diversity and strength of Kaziranga National Park. Rooted together, rising together.";

function FillWord({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return <motion.span style={{ opacity }}>{word} </motion.span>;
}

const VALUES: { slot: string; art: Heritage; title: string; text: string; tilt: number; offset: string; ground: string }[] = [
  { slot: "Home · About · A vibrant community", art: HERITAGE.kantha, title: "A vibrant community", text: "Students from every corner of India, in one house, looking out for each other online and off.", tilt: -2, offset: "lg:mt-0", ground: "#c8102e" },
  { slot: "Home · About · Social gatherings", art: HERITAGE.kamarupa, title: "Social gatherings", text: "Meetups in cities across India, so the people from your group chats become people you have met.", tilt: 1.5, offset: "lg:mt-24", ground: "#2343b8" },
  { slot: "Home · About · Competitions", art: HERITAGE.elephant, title: "Competitions", text: "Aarohan's cultural, technical and e-sports events, where the house competes as one team.", tilt: -1, offset: "lg:mt-8", ground: "#f6b51e" },
  { slot: "Home · About · Personal growth", art: HERITAGE.hoopoe, title: "Personal growth", text: "Guest sessions, revision sessions and the chance to lead a team or run an event.", tilt: 2, offset: "lg:mt-32", ground: "#0f5e48" },
];

export function TheLand() {
  const images = useSiteImages();
  const textRef = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: fill } = useScroll({ target: textRef, offset: ["start 0.85", "end 0.5"] });
  const words = STATEMENT.split(" ");

  return (
    <section id="land" className="kz-font relative scroll-mt-[var(--kz-header-h)] overflow-hidden bg-[#f5e9cf] pb-24 pt-20 text-[#1c130c] md:pb-32 md:pt-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
        <ChapterTitle>Named for a floodplain</ChapterTitle>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <p className="kz-lead max-w-xl text-[#4a3a29]">
            Kaziranga National Park lies on the south bank of the Brahmaputra in Assam. It has been a UNESCO World Heritage Site since 1985, and it is home to
            about two-thirds of the world&apos;s greater one-horned rhinos. The river floods it every monsoon, and every year it comes back greener.
          </p>
          <p ref={textRef} className="kz-serif text-[clamp(1.8rem,3.4vw,3rem)] leading-[1.12]">
            {reduce
              ? STATEMENT
              : words.map((w, i) => <FillWord key={i} word={w} progress={fill} range={[i / words.length, (i + 1) / words.length]} />)}
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-x-8 gap-y-8 sm:mt-20 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <motion.li
              key={v.title}
              // Phones: a small picture beside the words, so all four fit in a few swipes.
              // Every other row puts the picture on the right, so the column zigzags.
              className={`flex items-start gap-4 sm:block ${i % 2 ? "flex-row-reverse" : ""} ${v.offset}`}
              initial={reduce ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: SOFT }}
            >
              <figure className="w-24 shrink-0 sm:w-auto" style={{ rotate: `${v.tilt}deg` }}>
                <div className="kz-folio overflow-hidden bg-[#f5e9cf]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[v.slot] ? cdnImage(images[v.slot].url, 700) : v.art.src}
                    alt={images[v.slot] ? images[v.slot].alt : v.art.alt}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover object-top"
                  />
                </div>
              </figure>
              <div className="min-w-0">
                <h3 className="kz-serif text-[1.45rem] leading-tight sm:mt-8 sm:text-[1.9rem]">
                  <span className="kz-offset" style={{ ["--offset" as string]: `${v.ground}55` }}>
                    {v.title}
                  </span>
                </h3>
                <p className="kz-body mt-1.5 text-[#4a3a29] sm:mt-2">{v.text}</p>
                {/* The credit belongs to the original artwork, not to an uploaded picture. */}
                {!images[v.slot] && <MuseumLabel art={v.art} className="mt-3 hidden sm:block" />}
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ═══ III. Three steps in — postage stamps ══════════════════════════ */

const STEPS = [
  { n: "1", title: "Say hi", text: "Fill the two-minute form and get added to the house WhatsApp groups.", cta: "Join the community", href: JOIN_URL, external: true, bg: "#e2387a", ink: "#fff", tilt: -3 },
  { n: "2", title: "Show up", text: "Find a meetup in your city — chai, treks and long conversations.", cta: "Find a meetup", href: "/meetups", external: false, bg: "#f6b51e", ink: "#1c130c", tilt: 2 },
  { n: "3", title: "Jump in", text: "Catch a guest session, enter Aarohan, or help run the next event.", cta: "See events", href: "/events", external: false, bg: "#0f5e48", ink: "#f5e9cf", tilt: -1.5 },
];

export function ThreeSteps() {
  const reduce = useReducedMotion();
  return (
    <section id="steps" className="kz-font kz-halftone relative overflow-x-clip scroll-mt-[var(--kz-header-h)] bg-[#2343b8] pb-24 pt-20 text-[#f5e9cf] md:pb-32 md:pt-28" style={{ ["--dot" as string]: "rgba(10,20,80,0.55)" }}>
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
        <ChapterTitle className="text-[#f6b51e]" offset="#e2387a">
          Three steps into the house
        </ChapterTitle>
        <p className="kz-lead mt-6 max-w-xl text-[#f5e9cf]/85">No application and no fee. One short form and you are in the house's WhatsApp groups.</p>

        <ol className="mt-10 grid grid-cols-1 gap-7 md:mt-14 md:grid-cols-3 md:gap-8">
          {STEPS.map((s, i) => {
            const Wrapper = s.external ? "a" : Link;
            return (
              <motion.li
                key={s.n}
                initial={reduce ? false : { opacity: 0, y: -50, rotate: s.tilt - 10 }}
                whileInView={{ opacity: 1, y: 0, rotate: s.tilt }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ type: "spring", stiffness: 120, damping: 13, delay: i * 0.15 }}
              >
                <Wrapper
                  href={s.href}
                  {...(s.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="kz-focus group flex items-center gap-5 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.4,0.64,1)] hover:-translate-y-2 md:block"
                >
                  {/* Phones: a small stamp with the step number, its words beside it. */}
                  <Stamp bg="#f5e9cf" className="w-[6.5rem] shrink-0 md:w-auto">
                    <div className="relative flex aspect-square flex-col justify-between overflow-hidden p-3 md:aspect-[4/3] md:p-6" style={{ background: s.bg, color: s.ink }}>
                      <span aria-hidden="true" className="kz-display absolute -bottom-3 right-1 text-[5.5rem] leading-none opacity-40 md:-right-2 md:-top-8 md:bottom-auto md:text-[10rem] md:opacity-25">
                        {s.n}
                      </span>
                      <span className="kz-sign relative mt-4 hidden text-[0.8rem] uppercase tracking-[0.16em] md:block">Step {s.n}</span>
                      <h3 className="kz-serif relative hidden text-[2.3rem] md:block">{s.title}</h3>
                    </div>
                  </Stamp>
                  <div className="min-w-0">
                    <p className="kz-serif text-[1.6rem] leading-tight md:hidden">{s.title}</p>
                    <p className="kz-body mt-1 text-[#f5e9cf]/90 md:mt-5">{s.text}</p>
                    <span className="kz-sign mt-2 inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.12em] text-[#f6b51e] md:mt-3 md:text-[0.82rem]">
                      {s.cta}
                      <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Wrapper>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ═══ IV. What the house does — film hoardings ══════════════════════ */

const DOORS: { slot: string; title: string; line: string; href: string; art?: Heritage; ground: string; ink: string; offset: string; texture: string }[] = [
  { slot: "Home · What the house does · Meetups", title: "Meetups", line: "In-person meetups in cities across India, and the photos to remember them by.", href: "/meetups", art: HERITAGE.rubberTree, ground: "#c8102e", ink: "#f5e9cf", offset: "#1c130c", texture: "kz-cloth" },
  { slot: "Home · What the house does · Events", title: "Events", line: "Guest sessions, Community Day, Aarohan and Curiosity Hour — live and recorded.", href: "/events", art: HERITAGE.waqwaq, ground: "#2343b8", ink: "#f6b51e", offset: "#e2387a", texture: "kz-halftone" },
  { slot: "Home · What the house does · Study Zone", title: "Study Zone", line: "Notes, revision sessions, course channels and a GPA calculator for the IIT Madras BS degree.", href: "/study", art: HERITAGE.parrot, ground: "#f6b51e", ink: "#1c130c", offset: "#e2387a", texture: "kz-halftone" },
  { slot: "Home · What the house does · Kaziranga Tak", title: "Kaziranga Tak", line: "Short videos and stories about what's happening in the house.", href: "/tak", art: HERITAGE.shawl, ground: "#0f5e48", ink: "#f5e9cf", offset: "#c8102e", texture: "kz-cloth" },
];

export function Gatherings() {
  const reduce = useReducedMotion();
  const images = useSiteImages();
  const art = (d: (typeof DOORS)[number]) => (images[d.slot] ? cdnImage(images[d.slot].url, 600) : d.art?.src);
  return (
    <section id="doors" className="kz-font relative scroll-mt-[var(--kz-header-h)] bg-[#ebd9b2] pb-24 pt-20 text-[#1c130c] md:pb-32 md:pt-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
        <ChapterTitle>What the house does</ChapterTitle>

        <ul className="mt-10 grid grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {DOORS.map((d, i) => (
            <motion.li
              key={d.title}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: SOFT }}
            >
              {/* Phones: a row with a small picture. Wider screens: the full hoarding. */}
              <Link
                href={d.href}
                className={`kz-focus relative flex items-center gap-4 overflow-hidden p-3 pr-4 shadow-[0_18px_30px_-24px_rgba(28,19,12,0.8)] sm:hidden ${d.texture}`}
                style={{ background: d.ground, color: d.ink, ["--dot" as string]: "rgba(0,0,0,0.18)" }}
              >
                {d.art && (
                  <span className="kz-cutout w-[4.5rem] shrink-0 rotate-[3deg] p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art(d)} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="kz-display kz-offset block text-[1.7rem] leading-none" style={{ ["--offset" as string]: d.offset }}>
                    {d.title}
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-[0.85rem] leading-snug opacity-90">{d.line}</span>
                </span>
                <ArrowUpRight size={20} className="shrink-0" aria-hidden="true" />
              </Link>
              <Link
                href={d.href}
                className={`kz-focus group relative hidden aspect-[3/4.2] flex-col justify-between overflow-hidden p-6 shadow-[0_26px_40px_-28px_rgba(28,19,12,0.8)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:rotate-[-1deg] sm:flex ${d.texture}`}
                style={{ background: d.ground, color: d.ink, ["--dot" as string]: "rgba(0,0,0,0.18)" }}
              >
                {d.art && (
                  <figure className="kz-cutout absolute left-1/2 top-[30%] w-[66%] -translate-x-1/2 -translate-y-1/2 rotate-[4deg] transition-transform duration-500 group-hover:rotate-[-2deg] group-hover:scale-105">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art(d)} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  </figure>
                )}
                <span className="relative self-end">
                  <ArrowUpRight size={22} className="transition-transform duration-500 group-hover:rotate-45" />
                </span>
                <span className="relative">
                  <h3 className="kz-display kz-offset text-[clamp(2.6rem,3.6vw,3.4rem)] leading-[0.9]" style={{ ["--offset" as string]: d.offset }}>
                    {d.title}
                  </h3>
                  <p className="mt-3 text-[0.95rem] leading-snug opacity-90">{d.line}</p>
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ═══ VIII. Come home ═══════════════════════════════════════════════ */

const WAYS = [
  { label: "WhatsApp groups", href: JOIN_URL, Icon: FaWhatsapp, bg: "#0f5e48", ink: "#f5e9cf" },
  { label: "Instagram", href: INSTAGRAM, Icon: FaInstagram, bg: "#e2387a", ink: "#fff" },
  { label: "YouTube", href: YOUTUBE, Icon: FaYoutube, bg: "#c8102e", ink: "#fff" },
];

export function ComeHome() {
  const pic = useSiteImages()["Home · Join the house"];
  return (
    <section id="join" className="kz-font relative scroll-mt-[var(--kz-header-h)] overflow-hidden bg-[#1c130c] text-[#f5e9cf]">
      <Gamosa dark />
      <div className="mx-auto grid max-w-[90rem] items-center gap-14 px-5 py-20 sm:px-8 md:px-12 md:py-28 lg:grid-cols-[1fr_1.1fr]">
        <figure>
          <div className="kz-folio--dark kz-folio overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pic ? cdnImage(pic.url, 1200) : HERITAGE.kantha.src}
              alt={pic ? pic.alt : HERITAGE.kantha.alt}
              loading="lazy"
              className="aspect-[1.55] w-full object-cover"
            />
          </div>
          {!pic && <MuseumLabel art={HERITAGE.kantha} dark className="mt-5" />}
        </figure>

        <div>
          <ChapterTitle className="text-[#f6b51e]" offset="#c8102e">
            Come home
          </ChapterTitle>
          <p className="kz-lead mt-6 max-w-lg text-[#f5e9cf]/85">
            Every IIT Madras BS student in Kaziranga is welcome. Say hello in the groups, come to a meetup near you, or help run the next event.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--red kz-focus group">
              Join the house <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <Link href="/meetups" className="kz-btn kz-btn--outline kz-focus">
              Find a meetup
            </Link>
          </div>
          <ul className="mt-12 flex flex-wrap gap-3">
            {WAYS.map((w) => (
              <li key={w.label}>
                <a
                  href={w.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kz-focus kz-signboard inline-flex items-center gap-2.5 py-2.5 pl-4 pr-9 font-[family-name:var(--kz-f-sign)] text-[0.78rem] uppercase tracking-[0.12em] transition-transform duration-300 hover:translate-x-1"
                  style={{ background: w.bg, color: w.ink }}
                >
                  <w.Icon size={15} /> {w.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ═══ Chapter rail — in-page navigation for the long homepage ═══════ */

export const CHAPTERS = [
  { id: "top", label: "Arrival" },
  { id: "land", label: "The land" },
  { id: "steps", label: "Steps in" },
  { id: "doors", label: "The house" },
  { id: "posters", label: "Poster wall" },
  { id: "communities", label: "Communities" },
  { id: "events", label: "Events" },
  { id: "council", label: "Council" },
  { id: "join", label: "Come home" },
];

export function ChapterRail() {
  const [active, setActive] = useState("top");

  useEffect(() => {
    const els = CHAPTERS.map((c) => document.getElementById(c.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav aria-label="Chapters on this page" className="kz-font fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 2xl:block">
      <ol className="flex flex-col gap-1.5 rounded-[2px] bg-[#1c130c]/85 px-2.5 py-3 backdrop-blur-sm">
        {CHAPTERS.map((c, i) => {
          const on = active === c.id;
          return (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                aria-current={on ? "true" : undefined}
                className={`kz-focus group flex items-center gap-2.5 px-1.5 py-1 font-[family-name:var(--kz-f-sign)] text-[0.68rem] uppercase tracking-[0.12em] transition-colors ${
                  on ? "text-[#f6b51e]" : "text-[#f5e9cf]/55 hover:text-[#f5e9cf]"
                }`}
              >
                <span className={`block h-[2px] transition-all duration-300 ${on ? "w-6 bg-[#f6b51e]" : "w-3 bg-current"}`} />
                <span className="sr-only">Chapter {i + 1}: </span>
                {c.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ═══ The greeting — one line, every language of the house ══════════ */

const GREETINGS: { text: string; lang: string; code: string; dir?: "rtl" }[] = [
  { text: "Welcome", lang: "English", code: "en" },
  { text: "स्वागत है", lang: "Hindi", code: "hi" },
  { text: "வணக்கம்", lang: "Tamil", code: "ta" },
  { text: "স্বাগতম", lang: "Bengali", code: "bn" },
  { text: "స్వాగతం", lang: "Telugu", code: "te" },
  { text: "स्वागत आहे", lang: "Marathi", code: "mr" },
  { text: "સ્વાગત છે", lang: "Gujarati", code: "gu" },
  { text: "ಸ್ವಾಗತ", lang: "Kannada", code: "kn" },
  { text: "സ്വാഗതം", lang: "Malayalam", code: "ml" },
  { text: "ਜੀ ਆਇਆਂ ਨੂੰ", lang: "Punjabi", code: "pa" },
  { text: "ସ୍ୱାଗତ", lang: "Odia", code: "or" },
  { text: "স্বাগতম", lang: "Assamese", code: "as" },
  { text: "خوش آمدید", lang: "Urdu", code: "ur", dir: "rtl" },
];

/**
 * The house is from everywhere, so its welcome is too: one line that turns
 * through the languages of its members, each named in English beside it.
 */
function Greeting() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % GREETINGS.length), 2200);
    return () => window.clearInterval(t);
  }, [reduce]);

  const g = GREETINGS[i];
  return (
    <p className="mt-5 flex h-[2.6rem] items-baseline gap-3 overflow-hidden sm:h-[3rem]">
      <span className="sr-only">Welcome, in every language of the house.</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={i}
          aria-hidden="true"
          className="flex items-baseline gap-3"
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: 0.45, ease: SOFT }}
        >
          <span lang={g.code} dir={g.dir} className="text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-none text-[#f5e9cf]">
            {g.text}
          </span>
          <span className="kz-sign text-[0.74rem] uppercase tracking-[0.14em] text-[#f6b51e]">in {g.lang}</span>
        </motion.span>
      </AnimatePresence>
    </p>
  );
}

/* ═══ The poster wall — frames kept for the house's own artists ═════ */

export function PosterWall() {
  const images = useSiteImages();
  return (
    <section id="posters" className="kz-font relative scroll-mt-[var(--kz-header-h)] bg-[#f5e9cf] pb-24 pt-20 text-[#1c130c] md:pb-32 md:pt-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 md:px-12">
        <ChapterTitle>The poster wall</ChapterTitle>
        <p className="kz-lead mt-6 max-w-xl text-[#4a3a29]">
          Posters made by members of the house. Made one? Send it to us on{" "}
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="kz-focus font-semibold text-[#c8102e] underline underline-offset-4">
            Instagram
          </a>
          .
        </p>

        {/* Phones: a strip to swipe through. Wider screens: three frames. */}
        <ul className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:mt-14 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:px-0 sm:pb-0">
          {POSTERS.map((poster, i) => {
            // A poster uploaded in the portal fills its frame.
            const up = images[`Home · Poster wall · ${poster.title}`];
            const p = up ? { ...poster, src: cdnImage(up.url, 900), alt: up.alt || poster.title } : poster;
            return (
            <li key={p.title} className={`w-[68%] shrink-0 snap-start sm:w-auto ${i === 1 ? "sm:mt-16" : ""}`}>
              <figure>
                <div className="kz-folio relative aspect-[3/4] overflow-hidden bg-[#ebd9b2]">
                  {p.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.src} alt={p.alt ?? p.title} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="kz-halftone absolute inset-4 grid place-items-center border-2 border-dashed border-[#9c5d14]/40" style={{ ["--dot" as string]: "rgba(156,93,20,0.14)" }}>
                      <span className="kz-sign px-6 text-center text-[0.78rem] uppercase leading-relaxed tracking-[0.16em] text-[#9c5d14]">Reserved for a house poster</span>
                    </div>
                  )}
                </div>
                <figcaption className="mt-4 sm:mt-6">
                  <span className="kz-serif block text-[1.25rem] sm:text-[1.5rem]">{p.title}</span>
                  <span className="kz-sign mt-1 block text-[0.72rem] uppercase tracking-[0.12em] text-[#5e4a35]">
                    {p.artist ? `By ${p.artist}` : p.src ? "Made by the house" : "Coming soon"}
                  </span>
                </figcaption>
              </figure>
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
