"use client";

import { rng, vars } from "@/components/kz/util";

type Props = {
  /** Birds crossing the band. */
  birds?: number;
  /** Slow floating motes. */
  specks?: number;
  /** Seed — same number, same sky, every render. */
  seed?: number;
  /** The vertical band they live in, as [top%, bottom%] of the parent. */
  sky?: [number, number];
};

/**
 * The small movement over a still illustration: a few birds crossing and some
 * motes drifting. Purely decorative, so it is hidden from assistive tech and
 * stops entirely under prefers-reduced-motion (see kz.css).
 */
export default function Ambient({ birds = 3, specks = 10, seed = 1, sky = [10, 50] }: Props) {
  const r = rng(seed);
  const [top, bottom] = sky;
  const span = bottom - top;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: birds }, (_, i) => {
        const scale = 0.7 + r() * 0.8;
        return (
          <svg
            key={`b${i}`}
            viewBox="0 0 24 10"
            className="kz-bird"
            style={vars({
              top: `${top + r() * span}%`,
              "--d": `${26 + r() * 22}s`,
              "--delay": `${-r() * 40}s`,
              "--w": `${20 * scale}px`,
              "--rise": `${-10 - r() * 26}px`,
              "--flap": `${0.5 + r() * 0.45}s`,
            })}
          >
            <path
              d="M1 7C4.5 7 6 1.6 9.2 1.6c2.2 0 2.6 3.1 2.8 3.1s.6-3.1 2.8-3.1C18 1.6 19.5 7 23 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        );
      })}

      {Array.from({ length: specks }, (_, i) => (
        <span
          key={`s${i}`}
          className="kz-speck"
          style={vars({
            left: `${r() * 100}%`,
            top: `${top + r() * span}%`,
            "--s": `${2 + r() * 3}px`,
            "--d": `${14 + r() * 16}s`,
            "--delay": `${-r() * 24}s`,
            "--dx": `${(r() - 0.4) * 90}px`,
            "--dy": `${-24 - r() * 70}px`,
          })}
        />
      ))}
    </div>
  );
}
