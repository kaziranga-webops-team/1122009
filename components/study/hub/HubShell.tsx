"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLenis } from "lenis/react";
import { ArrowLeft, ArrowUpRight, Compass, Landmark, Menu, X } from "lucide-react";
import { PanelLink } from "@/components/study/hub/parts";
import { HUB_GROUPS, HUB_ITEMS, HUB_PATH, getHubItem, type HubItem } from "@/lib/study/hub";

const SOFT = [0.22, 1, 0.36, 1] as const;
const row = "kz-focus group flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-[0.85rem] transition-colors";

/** Every hub item, grouped like the hub. Pages navigate, panels open over the page, Notes leaves the hub. */
function HubNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const itemLink = (item: HubItem) => {
    const Icon = item.icon;
    const current = item.opens === "page" && pathname === `${HUB_PATH}/${item.slug}`;
    const className = `${row} ${current ? "bg-[#0f5e48] font-semibold text-[#f5e9cf]" : "font-medium text-[#1c130c]/75 hover:bg-[#1c130c]/6 hover:text-[#1c130c]"}`;
    const body = (
      <>
        <Icon size={16} className={`shrink-0 ${current ? "" : "text-[#5e4a35] group-hover:text-[#1c130c]"}`} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{item.title}</span>
        {item.opens === "panel" && <span className="sr-only">(opens a panel)</span>}
        {item.opens === "link" && (
          <>
            <ArrowUpRight size={14} className="shrink-0 opacity-50" aria-hidden="true" />
            <span className="sr-only">(leaves the Study zone)</span>
          </>
        )}
      </>
    );
    if (item.opens === "panel") {
      return (
        <PanelLink href={`${pathname}?open=${item.slug}`} onClick={onNavigate} className={className}>
          {body}
        </PanelLink>
      );
    }
    return (
      <Link
        href={item.opens === "link" ? item.linkHref ?? HUB_PATH : `${HUB_PATH}/${item.slug}`}
        onClick={onNavigate}
        aria-current={current ? "page" : undefined}
        className={className}
      >
        {body}
      </Link>
    );
  };

  // Tools still being built are left out, as on the Study zone page.
  const ready = HUB_ITEMS.filter((i) => !i.comingSoon);

  return (
    <nav aria-label="Study zone" className="space-y-4">
      <Link href={HUB_PATH} onClick={onNavigate} className={`${row} font-bold text-[#1c130c] hover:bg-[#1c130c]/6`}>
        <Compass size={16} className="shrink-0 text-[#0f5e48]" aria-hidden="true" />
        <span className="truncate">Study zone</span>
      </Link>
      {HUB_GROUPS.map((group) => {
        const items = ready.filter((i) => i.group === group.id);
        if (!items.length) return null;
        return (
          <div key={group.id}>
            <h2 className="kz-label mb-1 px-2.5 text-[0.62rem] text-[#5e4a35]/80">{group.title}</h2>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.slug}>{itemLink(item)}</li>
              ))}
            </ul>
          </div>
        );
      })}
      {/* Official links live in the IITM corner. */}
      <Link href="/iitm" onClick={onNavigate} className={`${row} font-semibold text-[#2343b8] hover:bg-[#2343b8]/8`}>
        <Landmark size={16} className="shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">IITM corner</span>
        <ArrowUpRight size={14} className="shrink-0 opacity-60" aria-hidden="true" />
      </Link>
    </nav>
  );
}

/**
 * Frame for hub tool pages: the hub's navigation beside the page on wide
 * screens, a drawer on small ones. The overview at /hub is itself the
 * navigation, so it renders as-is.
 */
export default function HubShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const lenis = useLenis();
  const [drawer, setDrawer] = useState(false);
  const [mounted, setMounted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => setDrawer(false), [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    closeBtn.current?.focus();
    const t = trigger.current;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      lenis?.start();
      window.removeEventListener("keydown", onKey);
      t?.focus();
    };
  }, [drawer, lenis]);

  if (pathname === HUB_PATH) return <>{children}</>;

  return (
    <div className="flex w-full items-start gap-8 px-5 pt-[var(--kz-header-h)] sm:px-8 md:px-12 lg:pl-0 xl:gap-12">
      {/* Attached to the left edge of the window, only as tall as its links,
          and in view while the page scrolls. */}
      <aside
        aria-label="Study zone navigation"
        className="sticky top-[calc(var(--kz-header-h)+1.5rem)] mt-8 hidden max-h-[calc(100dvh-var(--kz-header-h)-3rem)] w-60 shrink-0 overflow-y-auto rounded-r-2xl border border-l-0 border-[#1c130c]/10 bg-[#fffaf0] py-2 pl-4 pr-2 shadow-[0_14px_30px_-26px_rgba(28,19,12,0.6)] lg:block"
        data-lenis-prevent
      >
        <HubNav />
      </aside>

      <div className="mx-auto min-w-0 max-w-[80rem] flex-1">
        <div className="flex items-center justify-between gap-3 pt-6 lg:hidden">
          <Link href={HUB_PATH} className="kz-focus inline-flex min-h-10 items-center gap-1.5 rounded-full text-[0.85rem] font-bold text-[#0f5e48] hover:text-[#1c130c]">
            <ArrowLeft size={15} aria-hidden="true" />
            Study zone
          </Link>
          <button
            ref={trigger}
            type="button"
            onClick={() => setDrawer(true)}
            aria-haspopup="dialog"
            aria-expanded={drawer}
            className="kz-focus inline-flex h-11 items-center gap-2 rounded-full border border-[#1c130c]/15 bg-[#ebd9b2] px-4 text-[0.85rem] font-semibold text-[#1c130c]/80 hover:border-[#0f5e48] hover:text-[#1c130c]"
          >
            <Menu size={16} aria-hidden="true" />
            All tools
          </button>
        </div>
        {children}
      </div>

      {/* Into <body>, like the site menu: under the page-enter transform a fixed layer is pinned to the page. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {drawer && (
              <div key="drawer" className="kz-font fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Study zone tools">
                <motion.div
                  className="absolute inset-0 bg-[#1c130c]/35"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDrawer(false)}
                  aria-hidden="true"
                />
                <motion.div
                  initial={reduce ? { opacity: 0 } : { x: "-100%" }}
                  animate={reduce ? { opacity: 1 } : { x: 0 }}
                  exit={reduce ? { opacity: 0 } : { x: "-100%" }}
                  transition={{ duration: 0.4, ease: SOFT }}
                  className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[86vw] flex-col bg-[#f5e9cf] shadow-[20px_0_60px_-30px_rgba(28,19,12,0.6)]"
                >
                  <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#1c130c]/10 pl-5 pr-2">
                    <span className="kz-serif text-[1.2rem]">All tools</span>
                    <button
                      ref={closeBtn}
                      type="button"
                      onClick={() => setDrawer(false)}
                      aria-label="Close"
                      className="kz-focus grid h-11 w-11 place-items-center rounded-full text-[#5e4a35] hover:bg-[#1c130c]/6 hover:text-[#1c130c]"
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5">
                    <HubNav onNavigate={() => setDrawer(false)} />
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

/** Title block for a hub tool page. */
export function ToolPageShell({ slug, description, children }: { slug: string; description?: string; children: ReactNode }) {
  const tool = getHubItem(slug);
  // Every Study page opens the same way: the title, one line, then the tool.
  return (
    <div className="space-y-6 pb-24 pt-6 lg:pt-8">
      <header>
        <h1 className="kz-serif text-[clamp(2rem,4vw,3rem)] leading-none">{tool.title}</h1>
        <p className="kz-body mt-2 max-w-2xl text-[#5e4a35]">{description ?? tool.summary}</p>
      </header>
      {children}
    </div>
  );
}
