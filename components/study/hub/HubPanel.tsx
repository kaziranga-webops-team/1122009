"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLenis } from "lenis/react";
import { AppWindow, PanelRight, X } from "lucide-react";
import { GradeScaleTable, ImportantLinksList, LiveDocumentList, PANEL_OPENED_KEY } from "@/components/study/hub/parts";
import { IMPORTANT_LINK_GROUPS, PANEL_SLUGS, getHubItem } from "@/lib/study/hub";

type PanelMode = "side" | "center";
const MODE_KEY = "kz-hub-panel-mode";
const SOFT = [0.22, 1, 0.36, 1] as const;

const PANELS: Record<string, { description: string; body: ReactNode }> = {
  "student-handbook": {
    description: "The official rules for your programme: eligibility, exams, grading and policies.",
    body: <LiveDocumentList which="handbook" />,
  },
  "grading-documents": {
    description: "The formula each course uses for its final score, published per programme.",
    body: (
      <div className="space-y-6">
        <LiveDocumentList which="grading" />
        <GradeScaleTable />
      </div>
    ),
  },
  "important-links": {
    description: "Official portals you'll need through the term, in one place.",
    body: <ImportantLinksList groups={IMPORTANT_LINK_GROUPS} />,
  },
};

const iconButton =
  "kz-focus grid h-11 w-11 place-items-center rounded-full text-[#5e4a35] transition-colors hover:bg-[#1c130c]/6 hover:text-[#1c130c] sm:h-9 sm:w-9";

/**
 * Peek for short reference content: slides in from the side, or opens as a
 * centred popup. Esc closes; focus stays inside and returns to the opener.
 */
function ResourcePanel({
  open,
  mode,
  onModeChange,
  onClose,
  slug,
}: {
  open: boolean;
  mode: PanelMode;
  onModeChange: (m: PanelMode) => void;
  onClose: () => void;
  slug: string;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const lenis = useLenis();

  const item = slug ? getHubItem(slug) : null;
  const panel = PANELS[slug];
  const Icon = item?.icon;

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      document.body.style.overflow = prev;
      lenis?.start();
      returnFocus.current?.focus?.();
    };
  }, [open, lenis]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open, mode]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const isSide = mode === "side";
  const motionProps = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : isSide
      ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" }, transition: { duration: 0.45, ease: SOFT } }
      : {
          initial: { opacity: 0, scale: 0.96, y: 12 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.97, y: 6 },
          transition: { duration: 0.3, ease: SOFT },
        };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[70] bg-[#1c130c]/35 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {open && item && panel && Icon && (
        <div key={`frame-${mode}`} className={`kz-font pointer-events-none fixed inset-0 z-[71] flex ${isSide ? "justify-end" : "items-center justify-center p-3 sm:p-6"}`}>
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            {...motionProps}
            className={`pointer-events-auto flex flex-col bg-[#f5e9cf] text-[#1c130c] shadow-[0_30px_80px_-30px_rgba(28,19,12,0.6)] outline-none ${
              isSide ? "h-full w-full border-l border-[#1c130c]/10 sm:w-[min(38rem,92vw)]" : "max-h-[88vh] w-full max-w-2xl rounded-[1.75rem] border border-[#1c130c]/10"
            }`}
          >
            <header className="flex items-start gap-3.5 border-b border-[#1c130c]/10 px-5 py-5 sm:px-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0f5e48] text-[#f5e9cf]">
                <Icon size={21} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="kz-serif text-[1.5rem] leading-tight">
                  {item.title}
                </h2>
                <p className="mt-1 text-[0.85rem] text-[#5e4a35]">{panel.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onModeChange(isSide ? "center" : "side")}
                  className={`${iconButton} hidden sm:grid`}
                  aria-label={isSide ? "Open as popup" : "Open in side panel"}
                  title={isSide ? "Open as popup" : "Open in side panel"}
                >
                  {isSide ? <AppWindow size={16} aria-hidden="true" /> : <PanelRight size={16} aria-hidden="true" />}
                </button>
                <button type="button" onClick={onClose} className={iconButton} aria-label="Close" title="Close (Esc)">
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
            </header>
            <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6">
              {panel.body}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Shows the panel named in ?open=<slug>. The URL is the source of truth, so Back closes it. */
export default function HubPanelHost() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [mode, setMode] = useState<PanelMode>("side");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === "side" || saved === "center") setMode(saved);
    } catch {}
  }, []);

  const slug = params.get("open") ?? "";
  const open = PANEL_SLUGS.includes(slug) && slug in PANELS;

  // Keep the last panel's content while its exit animation plays.
  const [shownSlug, setShownSlug] = useState(open ? slug : "");
  if (open && slug !== shownSlug) setShownSlug(slug);

  const changeMode = (next: PanelMode) => {
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {}
  };

  const close = () => {
    let openedHere = false;
    try {
      openedHere = sessionStorage.getItem(PANEL_OPENED_KEY) === "1";
      sessionStorage.removeItem(PANEL_OPENED_KEY);
    } catch {}
    if (openedHere) router.back();
    else router.replace(pathname, { scroll: false });
  };

  if (!mounted) return null;
  // Into <body>: under the page-enter transform a fixed layer is pinned to the page, not the screen.
  return createPortal(<ResourcePanel open={open} mode={mode} onModeChange={changeMode} onClose={close} slug={shownSlug} />, document.body);
}
