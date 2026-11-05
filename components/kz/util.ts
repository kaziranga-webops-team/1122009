import type { CSSProperties } from "react";

/**
 * Style object that also carries CSS custom properties.
 * React's CSSProperties does not admit `--x` keys, so the cast lives here once
 * instead of at every call site.
 */
export function vars(style: Record<string, string | number>): CSSProperties {
  return style as CSSProperties;
}

/**
 * Deterministic 0..1 generator (mulberry32).
 *
 * The ambient art — dust, birds, specks — is scattered with this rather than
 * Math.random so the server and the first client render agree. Math.random
 * would place every mote twice and hydration would tear.
 */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
