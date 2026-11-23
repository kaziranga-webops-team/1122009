"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * A dial of cards on a shallow arc that loops: the card in the middle stands
 * upright, its neighbours lean away along the curve on both sides, and
 * turning past the last card comes back round to the first. Drag or swipe to
 * turn it, scroll sideways on a trackpad, use the arrow keys or the buttons,
 * or tap a side card to bring it to the middle.
 */
export default function EventDial({ items, label }: { items: { key: string; node: ReactNode }[]; label: string }) {
  const reduce = useReducedMotion();
  const count = items.length;
  const [pos, setPos] = useState(0); // turns of the dial; fractional while dragging
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(1200);
  const drag = useRef<{ x: number; start: number; moved: number } | null>(null);
  const wheelIdle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => setWidth(root.current?.clientWidth ?? window.innerWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const phone = width < 640;
  const cardW = Math.min(300, width * 0.72);
  const step = cardW * (phone ? 1.04 : 1.08); // a small gap between neighbours
  // The cards sit on the rim of a very large circle: a gentle bend, not a bowl.
  const radius = phone ? 1800 : 3200;
  const theta = step / radius;
  const reach = phone ? 1.4 : width < 1024 ? 1.6 : 2.6; // how many cards show on each side

  const go = useCallback((p: number) => setPos(Math.round(p)), []);
  const snap = () => setPos((p) => Math.round(p));
  /** Signed distance from the middle, the short way round the loop. */
  const offset = (i: number) => {
    if (count < 2) return 0;
    const raw = (((i - pos) % count) + count) % count;
    return raw > count / 2 ? raw - count : raw;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, start: pos, moved: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    // Only a real drag takes the pointer: a tap must still reach the card's links.
    if (drag.current.moved < 6) return;
    if (!dragging) {
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    setPos(drag.current.start - dx / step);
  };
  const end = () => {
    if (!drag.current) return;
    setDragging(false);
    snap();
    // Keep `moved` until the click that follows, so a drag never opens a link.
    setTimeout(() => (drag.current = null), 0);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical scrolling is the page's
    setDragging(true);
    setPos((p) => p + e.deltaX / step);
    if (wheelIdle.current) clearTimeout(wheelIdle.current);
    wheelIdle.current = setTimeout(() => {
      setDragging(false);
      snap();
    }, 140);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(pos + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(pos - 1);
    }
  };

  const active = ((Math.round(pos) % count) + count) % count;
  const height = Math.round(cardW * 1.72 + radius * (1 - Math.cos(Math.min(reach, 2) * theta)));

  return (
    <div className="relative">
      <div
        ref={root}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
        onWheel={onWheel}
        // `isolate` keeps the cards' stacking inside the dial, so they never draw over the header.
        className="kz-dial kz-focus relative isolate w-full cursor-grab touch-pan-y select-none overflow-x-clip active:cursor-grabbing"
        style={{ height }}
      >
        {items.map((item, i) => {
          const d = offset(i);
          const a = Math.abs(d);
          if (a > reach + 0.7) return null;
          const x = radius * Math.sin(d * theta);
          const y = radius * (1 - Math.cos(d * theta));
          const rotate = (d * theta * 180) / Math.PI;
          const isActive = i === active;
          return (
            <div
              key={item.key}
              aria-hidden={!isActive}
              inert={!isActive}
              onClickCapture={(e) => {
                // A drag is not a click; and a side card comes to the middle first.
                const moved = drag.current?.moved ?? 0;
                if (moved > 6 || !isActive) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isActive && moved <= 6) go(pos + d);
                }
              }}
              className={`absolute top-2 ${isActive ? "" : "cursor-pointer"}`}
              style={{
                width: cardW,
                left: width / 2 - cardW / 2,
                transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${1 - Math.min(a, 2) * 0.05})`,
                zIndex: 100 - Math.round(a * 10),
                opacity: a > reach ? Math.max(0, 1 - (a - reach) * 1.5) : 1,
                transition: dragging || reduce ? "none" : "transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.3s",
              }}
            >
              {item.node}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(pos - 1)}
            className="kz-focus grid h-12 w-12 place-items-center rounded-full border border-[#1c130c]/25 transition-colors hover:bg-[#1c130c] hover:text-[#f5e9cf]"
          >
            <ArrowLeft size={18} />
          </button>
          <p className="kz-sign min-w-[4.5rem] text-center text-[0.85rem] tabular-nums tracking-[0.12em]" aria-live="polite">
            {active + 1} / {count}
          </p>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(pos + 1)}
            className="kz-focus grid h-12 w-12 place-items-center rounded-full border border-[#1c130c]/25 transition-colors hover:bg-[#1c130c] hover:text-[#f5e9cf]"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
