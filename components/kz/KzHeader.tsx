"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useLenis } from "lenis/react";
import { ArrowRight, ArrowUpRight, LogIn, LayoutDashboard } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

/** The house's WhatsApp sign-up form — the one CTA that repeats across the site. */
export const JOIN_URL = "https://forms.gle/Ac5Zxwn21cRMeEcy8";

const NAV = [
  { label: "Meetups", href: "/meetups", img: "/images/hero/kazi-4.jpg", blurb: "Meetups in cities across India" },
  { label: "Events", href: "/events", img: "/images/art/sunset-wide.jpg", blurb: "Guest sessions, Aarohan, Curiosity Hour" },
  { label: "Study Zone", href: "/study", img: "/images/art/sky-hills.jpg", blurb: "Planners and revision sessions" },
  { label: "Kaziranga Tak", href: "/tak", img: "/images/art/canopy-top.jpg", blurb: "Stories from around the house" },
  { label: "Council", href: "/council", img: "/images/hero/kazi-6.jpg", blurb: "The people who run the house" },
  { label: "Gallery", href: "/gallery", img: "/images/hero/kazi-5.jpg", blurb: "Photos, memes and creativity" },
];

const SOCIALS = [
  { Icon: FaInstagram, href: "https://www.instagram.com/kaziranga_iitm/", label: "Instagram" },
  { Icon: FaWhatsapp, href: JOIN_URL, label: "WhatsApp" },
  { Icon: FaYoutube, href: "http://www.youtube.com/@KazirangaHouse", label: "YouTube" },
  { Icon: FaLinkedinIn, href: "https://www.linkedin.com/company/kaziranga-iitm", label: "LinkedIn" },
];

const SOFT = [0.22, 1, 0.36, 1] as const;

/**
 * Site header.
 *
 * At the top of a page it is a full-width cream bar. Once the page moves it
 * lifts into a floating capsule, tucks away while the reader scrolls down and
 * comes back the moment they scroll up. Wide screens get the links inline
 * with a pill that slides between them; narrower screens get a full-screen
 * menu that opens as a circle growing out of the menu button.
 */
export default function KzHeader({ overlay: _overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const lenis = useLenis();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0, r: 2000 });
  const btn = useRef<HTMLButtonElement>(null);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    if (open) return;
    if (y > 420 && y > prev + 4) setHidden(true);
    else if (y < prev - 4 || y < 420) setHidden(false);
  });

  // The menu covers the page, so the page behind it must not scroll.
  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, lenis]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const toggle = () => {
    if (!open && btn.current) {
      const b = btn.current.getBoundingClientRect();
      const x = b.left + b.width / 2;
      const y = b.top + b.height / 2;
      setOrigin({ x, y, r: Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 40 });
    }
    setOpen((v) => !v);
  };

  const portal = user ? { href: "/dashboard", label: "My portal", Icon: LayoutDashboard } : { href: "/login", label: "Log in", Icon: LogIn };
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const capsule = scrolled && !open;

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden && !open ? "-140%" : "0%" }}
        transition={{ duration: reduce ? 0 : 0.5, ease: SOFT }}
        className={`kz-font fixed inset-x-0 top-0 z-50 transition-[padding] duration-500 ${capsule ? "px-3 pt-2.5 sm:px-5 sm:pt-3" : "px-0 pt-0"}`}
      >
        <div
          className={`mx-auto flex h-[var(--kz-header-h)] items-center justify-between transition-[max-width,border-radius,background-color,box-shadow,padding,border-color] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
            open
              ? "max-w-full rounded-none border-b border-transparent bg-transparent px-5 text-[#f9fbe5] sm:px-8 md:px-10"
              : capsule
                ? "max-w-[80rem] rounded-full border border-[#002820]/10 bg-[#f9fbe5]/85 pl-3 pr-2 text-[#002820] shadow-[0_18px_40px_-22px_rgba(0,40,32,0.5)] backdrop-blur-md sm:pl-4"
                : "max-w-full rounded-none border-b border-[#002820]/10 bg-[#f9fbe5] px-5 text-[#002820] sm:px-8 md:px-10"
          }`}
        >
          <Link href="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="h-9 w-9 rounded-full transition-transform duration-700 group-hover:rotate-[360deg] sm:h-10 sm:w-10"
            />
            <span className="kz-wordmark">kaziranga house</span>
          </Link>

          {/* ── inline links (wide screens) ── */}
          <nav aria-label="Main" className="hidden items-center xl:flex" onMouseLeave={() => setHover(null)}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setHover(item.href)}
                onFocus={() => setHover(item.href)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="relative rounded-full px-4 py-2.5 text-[0.9rem] font-semibold"
              >
                {hover === item.href && (
                  <motion.span
                    layoutId="kz-nav-pill"
                    className="absolute inset-0 rounded-full bg-[#002820]/[0.08]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{item.label}</span>
                {isActive(item.href) && (
                  <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#c6011f]" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={portal.href}
              className={`hidden items-center gap-2 rounded-full px-4 py-2.5 text-[0.9rem] font-semibold transition-colors md:inline-flex ${
                open ? "hover:bg-white/10" : "hover:bg-[#002820]/[0.07]"
              }`}
            >
              <portal.Icon size={16} />
              {portal.label}
            </Link>
            <a
              href={JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`kz-btn kz-btn--sm hidden sm:inline-flex ${open ? "kz-btn--red" : "kz-btn--ink"}`}
            >
              Join the house
            </a>
            <button
              ref={btn}
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="kz-menu"
              onClick={toggle}
              className={`relative grid h-12 w-12 place-items-center rounded-full transition-colors xl:hidden ${
                open ? "bg-[#f9fbe5] text-[#002820]" : "bg-[#002820] text-[#f9fbe5] hover:bg-[#006255]"
              }`}
            >
              <span className="relative block h-3.5 w-5">
                <span
                  className={`absolute left-0 block h-[2px] w-full rounded-full bg-current transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                    open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-[2px] rounded-full bg-current transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                    open ? "top-1/2 w-full -translate-y-1/2 -rotate-45" : "bottom-0 top-auto w-3/5"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="kz-menu"
            key="menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={reduce ? { opacity: 0 } : { clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }}
            animate={reduce ? { opacity: 1 } : { clipPath: `circle(${origin.r}px at ${origin.x}px ${origin.y}px)` }}
            exit={reduce ? { opacity: 0 } : { clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }}
            transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
            className="kz-font fixed inset-0 z-40 overflow-y-auto bg-[#002820] text-[#f9fbe5]"
            data-lenis-prevent
          >
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-[#006255]/40" />
            <span aria-hidden="true" className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#c6011f]/15" />

            <div className="relative mx-auto grid min-h-full max-w-[90rem] grid-rows-[1fr_auto] px-5 pb-8 pt-[calc(var(--kz-header-h)+2rem)] sm:px-8 md:px-12">
              <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
                <nav aria-label="Main" onMouseLeave={() => setHover(null)}>
                  <ul>
                    {NAV.map((item, i) => (
                      <li key={item.href} className="border-b border-white/10">
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          onMouseEnter={() => setHover(item.href)}
                          onFocus={() => setHover(item.href)}
                          className="group flex items-center gap-5 py-3.5 sm:py-4"
                        >
                          <span className="kz-label w-7 text-white/40 transition-colors group-hover:text-[#ffd27a]">0{i + 1}</span>
                          <span className="block overflow-hidden">
                            <motion.span
                              className="block text-[clamp(2rem,6.5vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.03em] transition-[transform,color] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3 group-hover:text-[#96b4a5]"
                              initial={{ y: "110%" }}
                              animate={{ y: "0%" }}
                              exit={{ y: "110%", transition: { duration: 0.3 } }}
                              transition={{ duration: 0.8, delay: 0.25 + i * 0.055, ease: SOFT }}
                            >
                              {item.label}
                              {isActive(item.href) && <span className="text-[#c6011f]">.</span>}
                            </motion.span>
                          </span>
                          <ArrowRight
                            size={28}
                            className="ml-auto shrink-0 -translate-x-3 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* preview of the hovered destination */}
                <motion.div
                  className="relative hidden aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#00392e] md:block"
                  initial={{ opacity: 0, scale: 0.92, rotate: 3 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, delay: 0.35, ease: SOFT }}
                >
                  <AnimatePresence initial={false}>
                    {(() => {
                      const item = NAV.find((n) => n.href === hover) ?? NAV[0];
                      return (
                        <motion.div
                          key={item.href}
                          className="absolute inset-0"
                          initial={{ opacity: 0, scale: 1.08 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.6, ease: SOFT }}
                        >
                          <Image src={item.img} alt="" fill sizes="40vw" className="object-cover" />
                          <span className="absolute inset-0 bg-gradient-to-t from-[#002820]/85 via-[#002820]/10 to-transparent" />
                          <span className="absolute inset-x-0 bottom-0 p-7">
                            <span className="kz-label text-white/60">{item.label}</span>
                            <span className="mt-2 block text-[1.4rem] font-semibold leading-snug">{item.blurb}</span>
                          </span>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </motion.div>
              </div>

              <motion.div
                className="mt-10 flex flex-col gap-6 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.6, ease: SOFT }}
              >
                <ul className="flex gap-3">
                  {SOCIALS.map(({ Icon, href, label }) => (
                    <li key={label}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="grid h-11 w-11 place-items-center rounded-full border border-white/20 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:bg-[#c6011f]"
                      >
                        <Icon size={17} />
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Link href={portal.href} onClick={() => setOpen(false)} className="kz-btn kz-btn--white">
                    <portal.Icon size={17} /> {portal.label}
                  </Link>
                  <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--red">
                    Join the house <ArrowUpRight size={18} />
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
