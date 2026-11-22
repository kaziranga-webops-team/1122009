"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useLenis } from "lenis/react";
import { ChevronDown, LogIn, LayoutDashboard } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

/** The house's WhatsApp sign-up form — the one CTA that repeats across the site. */
export const JOIN_URL = "https://forms.gle/Ac5Zxwn21cRMeEcy8";

type NavLink = { label: string; href: string; line?: string };
type NavItem = { label: string; href: string } | { label: string; id: string; links: NavLink[] };

/** Five things in the bar: three pages, and two families of pages that open a short list. */
const NAV: NavItem[] = [
  { label: "Communities", href: "/communities" },
  { label: "Council", href: "/council" },
  { label: "Gallery", href: "/gallery" },
  {
    label: "Gatherings",
    id: "gatherings",
    links: [
      { label: "Meetups", href: "/meetups", line: "Meet the house in your city" },
      { label: "Events", href: "/events", line: "Guest sessions, Aarohan, Curiosity Hour" },
      { label: "Kaziranga Tak", href: "/tak", line: "The house podcast" },
    ],
  },
  { label: "Study", href: "/study" },
];

const SOCIALS = [
  { Icon: FaInstagram, href: "https://www.instagram.com/kaziranga_iitm/", label: "Instagram" },
  { Icon: FaWhatsapp, href: JOIN_URL, label: "WhatsApp" },
  { Icon: FaYoutube, href: "http://www.youtube.com/@KazirangaHouse", label: "YouTube" },
  { Icon: FaLinkedinIn, href: "https://www.linkedin.com/company/kaziranga-iitm", label: "LinkedIn" },
];

const SOFT = [0.22, 1, 0.36, 1] as const;
const CURTAIN = [0.76, 0, 0.24, 1] as const;

/**
 * Site header. At the top of a page it has no ground of its own, so it reads
 * as part of the page; once you scroll it becomes a solid bar. `ground` says
 * what it sits on at the top: the ivory paper of most pages, a coloured hero
 * (home) or the dark pages (Tak), so its text stays readable. On laptops and
 * up it shows five things — Communities, Council, Gallery, and the
 * Gatherings and Study families, which open a short list. Smaller screens
 * open a full-screen menu with everything, small and centred. The bar tucks
 * away while scrolling down and returns on scroll up.
 */
export default function KzHeader({ ground = "paper" }: { ground?: "paper" | "color" | "ink" }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const lenis = useLenis();
  const { user } = useAuth();
  const [sheet, setSheet] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const burger = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => setMounted(true), []);

  // The bar's ground follows the real scroll position: on load (a reload can
  // restore and then reset it) and on every native scroll.
  useEffect(() => {
    const sync = () => setScrolled(window.scrollY > 12);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [pathname]);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 12);
    if (sheet || openId) return;
    if (y > 420 && y > prev + 4) setHidden(true);
    else if (y < prev - 4 || y < 420) setHidden(false);
  });

  // The full-screen menu belongs to small screens; widening the window closes it.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const close = () => {
      setSheet(false);
      setOpenId(null);
    };
    wide.addEventListener("change", close);
    return () => wide.removeEventListener("change", close);
  }, []);

  // The menu covers the page, so the page behind it must not scroll.
  useEffect(() => {
    if (sheet) lenis?.stop();
    else lenis?.start();
    document.body.style.overflow = sheet ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheet, lenis]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (sheet) burger.current?.focus();
      setSheet(false);
      setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  // A click anywhere outside the bar closes an open list.
  useEffect(() => {
    if (!openId) return;
    const onDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenId(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openId]);

  useEffect(() => {
    setSheet(false);
    setOpenId(null);
  }, [pathname]);

  const portal = user ? { href: "/dashboard", label: "My portal", Icon: LayoutDashboard } : { href: "/login", label: "Log in", Icon: LogIn };
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const allLinks: NavLink[] = NAV.flatMap((item) => ("links" in item ? item.links : [item]));

  // Light text while the bar sits over the dark page or a coloured hero.
  const lightText = !sheet && (ground === "ink" || (ground === "color" && !scrolled));
  const bar = sheet
    ? "bg-transparent text-[#f5e9cf]"
    : scrolled
      ? `${ground === "ink" ? "bg-[#1c130c] text-[#f5e9cf]" : "bg-[#f5e9cf] text-[#1c130c]"} shadow-[0_10px_30px_-22px_rgba(28,19,12,0.55)]`
      : `bg-transparent ${lightText ? "text-[#f5e9cf]" : "text-[#1c130c]"}`;

  const topLink = (active: boolean) =>
    `kz-focus relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[0.98rem] font-medium transition-colors ${
      active
        ? lightText
          ? "text-[#f6b51e]"
          : "text-[#c8102e]"
        : lightText
          ? "text-[#f5e9cf]/85 hover:text-[#f5e9cf]"
          : "text-[#1c130c]/80 hover:text-[#1c130c]"
    }`;

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden && !sheet && !openId ? "-140%" : "0%" }}
        transition={{ duration: reduce ? 0 : 0.5, ease: SOFT }}
        className="kz-font fixed inset-x-0 top-0 z-50"
      >
        <div className={`transition-[background-color,color,box-shadow] duration-500 ${bar}`}>
          <div className="mx-auto flex h-[var(--kz-header-h)] max-w-[90rem] items-center justify-between gap-6 px-5 sm:px-8 md:px-12">
            <Link href="/" className="kz-focus flex shrink-0 items-center gap-3" onClick={() => setSheet(false)}>
              <Image src="/logo.png" alt="" width={44} height={44} priority className="h-10 w-10 rounded-full sm:h-11 sm:w-11" />
              <span className="kz-wordmark text-[1.45rem] sm:text-[1.65rem]">Kaziranga House</span>
            </Link>

            {/* ── five things, laptop and up ── */}
            <nav ref={navRef} aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {NAV.map((item) => {
                  if (!("links" in item)) {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link href={item.href} aria-current={active ? "page" : undefined} className={topLink(active)}>
                          {item.label}
                          {active && <span aria-hidden="true" className="absolute inset-x-3 bottom-1 h-[2px] bg-[#c8102e]" />}
                        </Link>
                      </li>
                    );
                  }
                  const open = openId === item.id;
                  const active = item.links.some((l) => isActive(l.href));
                  return (
                    <li key={item.id} className="relative">
                      <button type="button" aria-expanded={open} aria-controls={`nav-${item.id}`} onClick={() => setOpenId(open ? null : item.id)} className={topLink(active || open)}>
                        {item.label}
                        <ChevronDown size={15} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                        {active && <span aria-hidden="true" className="absolute inset-x-3 bottom-1 h-[2px] bg-[#c8102e]" />}
                      </button>
                      <AnimatePresence>
                        {open && (
                          <motion.div
                            id={`nav-${item.id}`}
                            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                            transition={{ duration: 0.26, ease: SOFT }}
                            className="absolute right-0 top-[calc(100%+1.4rem)] w-[18rem]"
                          >
                            <ul className="kz-folio bg-[#f5e9cf] p-2 text-[#1c130c]">
                              {item.links.map((l) => {
                                const here = isActive(l.href);
                                return (
                                  <li key={l.href}>
                                    <Link
                                      href={l.href}
                                      onClick={() => setOpenId(null)}
                                      aria-current={here ? "page" : undefined}
                                      className={`kz-focus block px-3.5 py-3 transition-colors ${here ? "bg-[#c8102e] text-[#f5e9cf]" : "hover:bg-[#ebd9b2]"}`}
                                    >
                                      <span className="block text-[0.98rem] font-semibold leading-tight">{l.label}</span>
                                      {l.line && <span className={`mt-0.5 block text-[0.8rem] leading-snug ${here ? "text-[#f5e9cf]/80" : "text-[#5e4a35]"}`}>{l.line}</span>}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              {!sheet && (
                <Link
                  href={portal.href}
                  className={`kz-focus hidden items-center gap-2 px-2 py-2.5 text-[0.95rem] font-medium transition-colors lg:inline-flex ${lightText ? "text-[#f5e9cf]/85 hover:text-[#f5e9cf]" : "text-[#1c130c]/75 hover:text-[#1c130c]"}`}
                >
                  <portal.Icon size={15} />
                  {portal.label}
                </Link>
              )}

              {/* ── burger below laptop width ── */}
              <button
                ref={burger}
                type="button"
                aria-label={sheet ? "Close menu" : "Open menu"}
                aria-expanded={sheet}
                aria-controls="kz-menu"
                onClick={() => setSheet((v) => !v)}
                className={`kz-focus relative grid h-11 w-11 place-items-center rounded-full transition-colors duration-300 lg:hidden ${
                  sheet ? "bg-[#f5e9cf] text-[#1c130c]" : "bg-[#c8102e] text-[#f5e9cf]"
                }`}
              >
                <span className="relative block h-3 w-5">
                  <span
                    className={`absolute left-0 block h-[2px] w-full rounded-full bg-current transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                      sheet ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                    }`}
                  />
                  <span
                    className={`absolute left-0 block h-[2px] w-full rounded-full bg-current transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                      sheet ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Rendered into <body>: inside the page it would sit under the
          page-enter transform, and a fixed layer under a transformed
          ancestor is pinned to the page instead of the screen. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {sheet && (
              <motion.div
                id="kz-menu"
                key="menu"
                role="dialog"
                aria-modal="true"
                aria-label="Site menu"
                initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
                animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
                exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
                transition={{ duration: reduce ? 0.2 : 0.55, ease: CURTAIN }}
                className="kz-font kz-cloth fixed inset-0 z-40 overflow-y-auto bg-[#c8102e] text-[#f5e9cf]"
                data-lenis-prevent
              >
                <div className="flex min-h-full flex-col items-center justify-center px-8 pb-14 pt-[calc(var(--kz-header-h)+2rem)] text-center">
                  <nav aria-label="Main">
                    <ul className="flex flex-col items-center gap-3">
                      {allLinks.map((l, i) => {
                        const active = isActive(l.href);
                        return (
                          <motion.li
                            key={l.href}
                            initial={reduce ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.1 } }}
                            transition={{ duration: 0.45, delay: 0.16 + i * 0.035, ease: SOFT }}
                          >
                            <Link
                              href={l.href}
                              onClick={() => setSheet(false)}
                              aria-current={active ? "page" : undefined}
                              className={`inline-block py-0.5 text-[1rem] font-semibold outline-none transition-colors focus-visible:underline ${
                                active ? "text-[#f6b51e] underline decoration-2 underline-offset-4" : "text-[#f5e9cf] hover:text-[#f6b51e]"
                              }`}
                            >
                              {l.label}
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </nav>

                  <motion.div
                    className="mt-12 flex flex-col items-center gap-6"
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.45, delay: 0.5, ease: SOFT }}
                  >
                    <Link href={portal.href} onClick={() => setSheet(false)} className="kz-btn kz-btn--sm kz-btn--outline kz-focus">
                      <portal.Icon size={14} /> {portal.label}
                    </Link>
                    <ul className="flex gap-2">
                      {SOCIALS.map(({ Icon, href, label }) => (
                        <li key={label}>
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={label}
                            data-brand={label.toLowerCase()}
                            className="kz-social kz-focus grid h-9 w-9 place-items-center rounded-full border border-white/30"
                          >
                            <Icon size={14} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
