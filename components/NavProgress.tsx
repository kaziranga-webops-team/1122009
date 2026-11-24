"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * A thin line across the top of the window that starts the moment a link is
 * clicked and finishes when the next page is in place, so every click answers
 * at once. Switches quicker than a blink never show it.
 */
export default function NavProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "run" | "done">("idle");
  const [visible, setVisible] = useState(false);
  const from = useRef(pathname);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (a hash, or the page you are on): nothing to wait for.
      if (url.pathname === window.location.pathname) return;
      clear();
      from.current = window.location.pathname;
      setPhase("run");
      setVisible(false);
      timers.current.push(window.setTimeout(() => setVisible(true), 120));
      // Never left hanging if the page does not change after all.
      timers.current.push(window.setTimeout(() => setPhase("idle"), 10000));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (pathname === from.current) return;
    from.current = pathname;
    clear();
    setPhase((p) => (p === "run" ? "done" : p));
    timers.current.push(window.setTimeout(() => {
      setPhase("idle");
      setVisible(false);
    }, 380));
  }, [pathname]);

  useEffect(() => clear, []);

  if (phase === "idle") return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[300] h-[3px]">
      <div
        className="kz-nav-progress h-full"
        data-phase={phase}
        style={{ opacity: visible ? 1 : 0 }}
      />
    </div>
  );
}
