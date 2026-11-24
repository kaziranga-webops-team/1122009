"use client";

import { useState } from "react";
import Image from "next/image";

/** Kaz, the house rhino, standing on a rock ledge. */
export const RHINO_SRC = "/images/hero/rhino.webp";

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
              className="h-auto w-full select-none drop-shadow-[0_18px_18px_rgba(28,19,12,0.18)]"
            />
          </span>
        </span>
      </button>
      {say !== null && (
        <span
          key={say}
          role="status"
          className="kz-pop absolute -top-[14%] left-[4%] z-30 sm:left-[38%] origin-bottom-left whitespace-nowrap rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-[clamp(0.75rem,1vw,0.95rem)] font-bold text-[#1c130c] shadow-[0_12px_30px_-10px_rgba(28,19,12,0.45)]"
        >
          {GREETINGS[say]}
        </span>
      )}
    </div>
  );
}
