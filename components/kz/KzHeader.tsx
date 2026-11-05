"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useLenis } from "lenis/react";
import { ArrowUpRight, LogIn, LayoutDashboard } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

/** The house's WhatsApp sign-up form — the one CTA that repeats across the site. */
export const JOIN_URL = "https://forms.gle/Ac5Zxwn21cRMeEcy8";

const NAV = [
  { label: "Meetups", href: "/meetups" },
  { label: "Events", href: "/events" },
  { label: "Communities", href: "/communities" },
  { label: "Study Zone", href: "/study" },
  { label: "Kaziranga Tak", href: "/tak" },
  { label: "Council", href: "/council" },
  { label: "Gallery", href: "/gallery" },
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
 * Site header and menu.
 *
 * One idea runs through both: the underline. In the bar, a thin forest line
 * draws under a link on hover and stays under the page you are on. In the
 * full-screen menu every link sits on its own hairline, and hovering draws a
 * cream line across it. Nothing else decorates either surface.
 *
 * The bar is a full-width cream strip at the top of a page; once the page
 * moves it lifts into a floating capsule, tucks away while scrolling down,
 * and returns on scroll up. Wide screens show the links inline; narrower
 * ones open the menu.
 */
export default function KzHeader({ overlay: _overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const lenis = useLenis();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btn.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

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
          className={`mx-auto flex h-[var(--kz-header-h)] items-center justify-between gap-6 transition-[max-width,border-radius,background-color,box-shadow,padding,border-color,color] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
            open
              ? "max-w-full rounded-none border-b border-transparent bg-transparent px-5 text-[#f9fbe5] sm:px-8 md:px-12"
              : capsule
                ? "max-w-[80rem] rounded-full border border-[#002820]/10 bg-[#f9fbe5]/90 pl-3 pr-2 text-[#002820] shadow-[0_18px_40px_-24px_rgba(0,40,32,0.45)] backdrop-blur-md sm:pl-4"
                : "max-w-full rounded-none border-b border-[#002820]/10 bg-[#f9fbe5] px-5 text-[#002820] sm:px-8 md:px-12"
          }`}
        >
          <Link href="/" className="kz-focus flex shrink-0 items-center gap-3 rounded-full" onClick={() => setOpen(false)}>
            <Image src="/logo.png" alt="" width={40} height={40} priority className="h-9 w-9 rounded-full sm:h-10 sm:w-10" />
            <span className="kz-wordmark">kaziranga house</span>
          </Link>

          {/* ── inline links on wide screens ── */}
          <nav aria-label="Main" className="hidden items-center gap-0.5 min-[1360px]:flex">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`kz-focus group relative whitespace-nowrap px-3 py-2 text-[0.92rem] font-semibold transition-colors duration-300 ${
                    active ? "text-[#002820]" : "text-[#002820]/70 hover:text-[#002820]"
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-3 bottom-0.5 h-[1.5px] origin-left bg-[#006255] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {!open && (
              <>
                <Link
                  href={portal.href}
                  className="kz-focus hidden items-center gap-2 rounded-full px-4 py-2.5 text-[0.92rem] font-semibold text-[#002820]/80 transition-colors hover:text-[#002820] md:inline-flex"
                >
                  <portal.Icon size={16} />
                  {portal.label}
                </Link>
                <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--sm kz-btn--forest kz-focus hidden sm:inline-flex">
                  Join the house
                </a>
              </>
            )}
            <button
              ref={btn}
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="kz-menu"
              onClick={() => setOpen((v) => !v)}
              className={`kz-focus relative grid h-12 w-12 place-items-center rounded-full transition-colors duration-300 min-[1360px]:hidden ${
                open ? "bg-[#f9fbe5] text-[#00332a]" : "bg-[#002820] text-[#f9fbe5] hover:bg-[#006255]"
              }`}
            >
              <span className="relative block h-3 w-5">
                <span
                  className={`absolute left-0 block h-[2px] w-full rounded-full bg-current transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                    open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-[2px] w-full rounded-full bg-current transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                    open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Rendered into <body>: inside the page it would sit under the
          page-enter transform, and a fixed layer under a transformed
          ancestor is pinned to the page instead of the screen. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                id="kz-menu"
                key="menu"
                role="dialog"
                aria-modal="true"
                aria-label="Site menu"
                initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
                animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
                exit={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
                transition={{ duration: reduce ? 0.2 : 0.65, ease: CURTAIN }}
                className="kz-font fixed inset-0 z-40 overflow-y-auto bg-[#00332a] text-[#f9fbe5]"
                data-lenis-prevent
              >
                <div className="mx-auto flex min-h-full max-w-[72rem] flex-col px-6 pb-12 pt-[calc(var(--kz-header-h)+2.5rem)] sm:px-10 md:pt-[calc(var(--kz-header-h)+3.5rem)]">
                  <nav aria-label="Main">
                    <ul>
                      {NAV.map((item, i) => {
                        const active = isActive(item.href);
                        return (
                          <motion.li
                            key={item.href}
                            className="relative"
                            initial={reduce ? false : { opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.12 } }}
                            transition={{ duration: 0.55, delay: 0.22 + i * 0.05, ease: SOFT }}
                          >
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              aria-current={active ? "page" : undefined}
                              className="group flex items-center justify-between gap-6 pb-5 pt-6 outline-none sm:pb-6 sm:pt-7"
                            >
                              <span
                                className={`kz-serif text-[clamp(2.1rem,6.4vw,3.4rem)] font-medium leading-[1.05] transition-[color,transform] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2 group-focus-visible:translate-x-2 ${
                                  active ? "text-[#ecd394]" : "text-[#f9fbe5]"
                                }`}
                              >
                                {item.label}
                              </span>
                              <span
                                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color] duration-300 group-hover:border-[#f9fbe5] group-hover:bg-[#f9fbe5] group-hover:text-[#00332a] group-focus-visible:border-[#f9fbe5] group-focus-visible:bg-[#f9fbe5] group-focus-visible:text-[#00332a] sm:h-12 sm:w-12 ${
                                  active ? "border-[#ecd394]/60 text-[#ecd394]" : "border-white/25"
                                }`}
                              >
                                <ArrowUpRight size={20} className="transition-transform duration-300 group-hover:rotate-45 group-focus-visible:rotate-45" />
                              </span>
                              {/* the hairline each link sits on, and the line that draws across it */}
                              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-white/15" />
                              <span
                                aria-hidden="true"
                                className={`absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                                  active
                                    ? "scale-x-100 bg-[#ecd394]"
                                    : "scale-x-0 bg-[#f9fbe5] group-hover:scale-x-100 group-focus-visible:scale-x-100"
                                }`}
                              />
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </nav>

                  <motion.div
                    className="mt-12 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between"
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.55, delay: 0.55, ease: SOFT }}
                  >
                    <div className="flex flex-wrap gap-3">
                      <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="kz-btn kz-btn--red kz-focus">
                        Join the house <ArrowUpRight size={17} />
                      </a>
                      <Link href={portal.href} onClick={() => setOpen(false)} className="kz-btn kz-btn--outline kz-focus">
                        <portal.Icon size={16} /> {portal.label}
                      </Link>
                    </div>
                    <ul className="flex gap-2.5">
                      {SOCIALS.map(({ Icon, href, label }) => (
                        <li key={label}>
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={label}
                            data-brand={label.toLowerCase()}
                            className="kz-social kz-focus grid h-11 w-11 place-items-center rounded-full border border-white/25"
                          >
                            <Icon size={17} />
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
