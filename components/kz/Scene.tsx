"use client";

import { useState } from "react";
import Image from "next/image";
import { vars } from "@/components/kz/util";

/**
 * The illustrated waterfall scene, split into layers so each can move on its
 * own: the painted backdrop (with live water on top of it), drifting clouds,
 * butterflies, and the rhino on its rock.
 *
 * Positions on the backdrop are fractions of the artwork (1672 × 941), so the
 * water effects stay glued to the painted falls at every screen size. The
 * stage itself is sized by .kz-frame / .kz-stage in kz-scene.css.
 */

export const SCENE_SRC = "/images/hero/falls-scene.webp";
export const RHINO_SRC = "/images/hero/rhino.webp";

const pct = (n: number) => `${n}%`;

/** The two painted falls: [left, top, width, height] in % of the artwork. */
const FALLS: [number, number, number, number][] = [
  [7.9, 41.5, 8.2, 40.5],
  [19.6, 45.5, 10.1, 36.5],
];

const FOAM = [
  { x: 11, y: 89.5, s: 70, d: 2.4, delay: 0 },
  { x: 18, y: 91, s: 90, d: 2.9, delay: -0.8 },
  { x: 25, y: 89, s: 76, d: 2.6, delay: -1.6 },
  { x: 31, y: 90.5, s: 64, d: 3.1, delay: -0.4 },
  { x: 21, y: 94, s: 110, d: 3.4, delay: -2.1 },
  { x: 36, y: 93, s: 58, d: 2.7, delay: -1.2 },
];

const MIST = [
  { x: 12, y: 85, s: 120, d: 6, delay: 0, dx: -20 },
  { x: 20, y: 86, s: 150, d: 7, delay: -2.5, dx: 15 },
  { x: 28, y: 85, s: 130, d: 6.5, delay: -4, dx: 30 },
  { x: 16, y: 88, s: 100, d: 5.5, delay: -1.2, dx: -10 },
];

const GLINTS = [
  { x: 46, y: 90.5, w: 50, d: 5, delay: 0, dx: 26 },
  { x: 58, y: 94.5, w: 70, d: 6.2, delay: -1.5, dx: -30 },
  { x: 70, y: 91.5, w: 40, d: 4.6, delay: -3, dx: 22 },
  { x: 84, y: 96.5, w: 64, d: 5.6, delay: -2.2, dx: -24 },
  { x: 38, y: 97, w: 56, d: 6.8, delay: -4.1, dx: 30 },
  { x: 64, y: 98.5, w: 80, d: 7.2, delay: -0.6, dx: -20 },
];

/** The painted backdrop plus the live water. Goes inside a `.kz-stage`. */
export function SceneBackdrop({ priority = false }: { priority?: boolean }) {
  return (
    <>
      <Image
        src={SCENE_SRC}
        alt=""
        fill
        priority={priority}
        sizes="(max-aspect-ratio: 1/1) 250vh, 120vw"
        className="select-none object-cover"
        draggable={false}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {FALLS.map(([l, t, w, h], i) => (
          <span key={i} className="kz-falls" style={{ left: pct(l), top: pct(t), width: pct(w), height: pct(h) }} />
        ))}
        {MIST.map((m, i) => (
          <span
            key={`m${i}`}
            className="kz-mist"
            style={vars({ left: pct(m.x), top: pct(m.y), "--s": `${m.s}px`, "--d": `${m.d}s`, "--delay": `${m.delay}s`, "--dx": `${m.dx}px` })}
          />
        ))}
        {FOAM.map((f, i) => (
          <span
            key={`f${i}`}
            className="kz-foam"
            style={vars({ left: pct(f.x), top: pct(f.y), "--s": `${f.s}px`, "--d": `${f.d}s`, "--delay": `${f.delay}s` })}
          />
        ))}
        {GLINTS.map((g, i) => (
          <span
            key={`g${i}`}
            className="kz-glint"
            style={vars({ left: pct(g.x), top: pct(g.y), "--w": `${g.w}px`, "--d": `${g.d}s`, "--delay": `${g.delay}s`, "--dx": `${g.dx}px` })}
          />
        ))}
      </div>
    </>
  );
}

/** Flat clouds in the art's own style, drifting slowly across the sky. */
export function Clouds({ count = 3 }: { count?: number }) {
  const all = [
    { top: 4, w: 150, d: 140, delay: -30, o: 0.95 },
    { top: 13, w: 110, d: 110, delay: -80, o: 0.85 },
    { top: 21, w: 170, d: 170, delay: -120, o: 0.9 },
    { top: 12, w: 90, d: 95, delay: -10, o: 0.75 },
  ].slice(0, count);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {all.map((c, i) => (
        <svg
          key={i}
          viewBox="0 0 200 60"
          className="kz-cloud"
          style={vars({ top: pct(c.top), width: `${c.w}px`, "--d": `${c.d}s`, "--delay": `${c.delay}s`, opacity: c.o })}
        >
          <path
            d="M8 56h184c6 0 8-6 4-9-6-4-14-4-20-2 2-12-8-22-21-20-4-14-20-22-35-16-8-12-26-14-37-4-12-4-26 4-27 18-14-2-26 6-26 18-12 0-26 6-22 15z"
            fill="currentColor"
          />
          <path d="M14 56h176" stroke="#d7f6fb" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}

/** Two flat butterflies, as in the reference scene: one yellow, one blue. */
export function Butterflies({ items }: { items?: { left: string; top: string; color: [string, string]; w?: number; d?: number; delay?: number; path?: number[] }[] }) {
  const list = items ?? [
    { left: "43%", top: "66%", color: ["#ffb81c", "#f08a00"] as [string, string], w: 34, d: 16, delay: 0, path: [50, -40, 110, -10, 40, 30] },
    { left: "87%", top: "58%", color: ["#4cc3ff", "#1a8fe0"] as [string, string], w: 30, d: 13, delay: -5, path: [-60, -30, -20, 20, -80, 10] },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {list.map((b, i) => {
        const [x1, y1, x2, y2, x3, y3] = b.path ?? [40, -30, 90, 10, 30, 40];
        return (
          <svg
            key={i}
            viewBox="0 0 40 32"
            className="kz-butterfly"
            style={vars({
              left: b.left,
              top: b.top,
              "--w": `${b.w ?? 32}px`,
              "--d": `${b.d ?? 14}s`,
              "--delay": `${b.delay ?? 0}s`,
              "--x1": `${x1}px`,
              "--y1": `${y1}px`,
              "--x2": `${x2}px`,
              "--y2": `${y2}px`,
              "--x3": `${x3}px`,
              "--y3": `${y3}px`,
            })}
          >
            <g className="kz-wing-l">
              <path d="M19 15C14 4 4 0 2 5c-2 5 4 10 17 10z" fill={b.color[0]} />
              <path d="M19 17C10 17 4 22 6 27c2 4 9 2 13-10z" fill={b.color[1]} />
            </g>
            <g className="kz-wing-r">
              <path d="M21 15C26 4 36 0 38 5c2 5-4 10-17 10z" fill={b.color[0]} />
              <path d="M21 17c9 0 15 5 13 10-2 4-9 2-13-10z" fill={b.color[1]} />
            </g>
            <rect x="19" y="10" width="2" height="14" rx="1" fill="#2b2238" />
          </svg>
        );
      })}
    </div>
  );
}

/** A flat rock ledge in the painting's browns, for the rhino to stand on. */
function Ledge() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 90" className="absolute left-[3%] top-[90.5%] w-[102%]">
      <ellipse cx="200" cy="80" rx="205" ry="9" fill="#ffffff" opacity="0.45" />
      <path d="M12 42C30 20 92 9 172 10s160 5 210 21c16 7 20 26 8 38l-370 4C4 69 0 54 12 42z" fill="#945e4e" />
      <path d="M30 31c52-17 132-19 212-16 58 2 108 8 132 18-70-7-168-9-246-4-40 3-72 6-98 2z" fill="#a8664f" />
      <path d="M20 73l370-4c-8 12-50 18-190 18C92 87 32 84 20 73z" fill="#663f31" />
      <path d="M250 40c30 2 62 6 92 12" stroke="#7d4b3b" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M70 50c26-4 52-5 80-4" stroke="#7d4b3b" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

const GREETINGS = ["Hey, I'm Kaz! 👋", "Welcome to the house!", "Come to a meetup? 🦏", "5,000+ friends here!"];

/**
 * The rhino on its rock. Breathes while idle; a tap makes it hop and say
 * something. The image is decorative — the headline carries the meaning.
 */
export function Rhino({ greet = true, className = "" }: { greet?: boolean; className?: string }) {
  const [say, setSay] = useState<number | null>(null);
  const [hop, setHop] = useState(0);

  const poke = () => {
    if (!greet) return;
    setHop((h) => h + 1);
    setSay((s) => (s === null ? 0 : (s + 1) % GREETINGS.length));
  };

  return (
    <div className={`relative ${className}`}>
      <Ledge />
      <button
        type="button"
        onClick={poke}
        tabIndex={greet ? 0 : -1}
        aria-label={greet ? "Say hi to Kaz the rhino" : undefined}
        aria-hidden={!greet}
        className={`relative block w-full ${greet ? "cursor-pointer" : "pointer-events-none"} focus-visible:outline-none`}
      >
        <span key={hop} className={`block ${hop ? "kz-hop" : ""}`}>
          <span className="kz-breathe block">
            <Image
              src={RHINO_SRC}
              alt=""
              width={1339}
              height={936}
              priority
              draggable={false}
              className="h-auto w-full select-none drop-shadow-[0_18px_18px_rgba(0,40,32,0.18)]"
            />
          </span>
        </span>
      </button>
      {say !== null && (
        <span
          key={say}
          role="status"
          className="kz-pop absolute -top-[14%] left-[4%] z-30 sm:left-[38%] origin-bottom-left whitespace-nowrap rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-[clamp(0.75rem,1vw,0.95rem)] font-bold text-[#002820] shadow-[0_12px_30px_-10px_rgba(0,40,32,0.45)]"
        >
          {GREETINGS[say]}
        </span>
      )}
    </div>
  );
}

/**
 * Splits a line of text into words that each rise out of a mask.
 * `start` offsets the stagger index so several lines can run as one sequence.
 */
export function WordRise({ text, start = 0, base = 0.15 }: { text: string; start?: number; base?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          <span className="kz-word">
            <span className="kz-rise-word" style={vars({ "--i": start + i, "--base": `${base}s` })}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}
