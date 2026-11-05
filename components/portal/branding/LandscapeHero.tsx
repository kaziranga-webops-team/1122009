'use client';

import React, { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { applyStoredTheme } from '@/lib/theme';

export interface HeroAction {
  href: string;
  label: string;
  /** The filled button. Everything else renders as the outlined one. */
  primary?: boolean;
}

interface LandscapeHeroProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  /** Plain links styled for the glass, so there is no button inside an anchor. */
  actions?: HeroAction[];
}

/*
 * Positions in IMAGE space — percentages of the 1672×941 artwork — because the
 * overlays live inside a box sized exactly like the rendered image (.dn-art).
 * That keeps the moon glow on the moon at every viewport, including phones
 * where `cover` crops the sides. Stars sit in the clear sky right of the canopy.
 */
const MOON = { x: 80.7, y: 13.6 };

const STARS: [x: number, y: number, delay: number][] = [
  [66.4, 4.3, 0], [69.4, 14.9, 0.8], [73.6, 2.1, 1.6], [75.4, 17.5, 0.4],
  [74.2, 10.1, 2.1], [84.3, 2.1, 2.6], [88, 2, 0.6], [78.1, 1.6, 1.2],
];

const FIREFLIES: [x: number, y: number, delay: number, duration: number][] = [
  [9, 62, 0, 7], [16, 74, 1.4, 8.5], [24, 58, 2.8, 6.5], [31, 80, 0.7, 9],
  [38, 67, 3.5, 7.5], [5, 84, 2.1, 8], [46, 76, 4.2, 6.8], [20, 50, 5, 9.5],
];

/**
 * The dashboard's masthead over a day/night Kaziranga landscape.
 *
 * There is no theme state in here. Day and night are pure CSS keyed on the
 * existing `.dark` class (see the dn-* rules in portal.css), so the hero follows
 * whichever control flips it — the navbar toggle or the command palette.
 *
 * Transitions stay off until after the first paint: otherwise a dark-mode user
 * arriving on the page would watch a 1.6s fade to night on every load, which
 * reads as something happening rather than a remembered preference.
 */
export const LandscapeHero: React.FC<LandscapeHeroProps> = ({ title, subtitle, badge, actions }) => {
  const [ready, setReady] = useState(false);

  // Before paint: apply the stored theme, so a client-side arrival (e.g. from
  // /login, outside the portal shell) never shows a frame of the wrong scene.
  useLayoutEffect(() => {
    applyStoredTheme();
  }, []);

  // Open the gate on a task rather than an animation frame. It runs after every
  // mount-time effect (the navbar's ThemeToggle re-applies the same theme), and
  // unlike requestAnimationFrame it still fires in a backgrounded tab. Opening
  // it never animates anything by itself: it adds a transition, not a change.
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section
      data-dn-ready={ready || undefined}
      className="dn-hero relative overflow-hidden rounded-3xl min-h-[520px] sm:min-h-[560px] p-5 sm:p-7"
    >
      <div className="dn-scene" aria-hidden>
        <div className="dn-art">
          <img
            className="dn-img"
            src="/images/hero/kaziranga-day.webp"
            alt=""
            width={1672}
            height={941}
            decoding="async"
          />
          <img
            className="dn-img dn-night"
            src="/images/hero/kaziranga-night.webp"
            alt=""
            width={1672}
            height={941}
            decoding="async"
          />
          <div className="dn-night-fx">
            <span className="dn-moon-glow" style={{ left: `${MOON.x}%`, top: `${MOON.y}%` }} />
            {STARS.map(([x, y, delay]) => (
              <span
                key={`s${x}-${y}`}
                className="dn-star"
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }}
              />
            ))}
            {FIREFLIES.map(([x, y, delay, duration]) => (
              <span
                key={`f${x}-${y}`}
                className="dn-fly"
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
              />
            ))}
          </div>
        </div>
        <div className="dn-day-fx" />
      </div>

      <div className="dn-panel relative max-w-[500px] min-w-0 rounded-[20px] border px-6 py-6 sm:px-7 sm:py-[26px]">
        {badge && (
          <p className="dn-eyebrow flex items-center gap-2 text-[0.75rem] font-extrabold uppercase tracking-[0.18em]">
            <span aria-hidden className="w-2 h-2 rounded-full bg-current" />
            {badge}
          </p>
        )}
        <h1 className="dn-title mt-3.5 font-display font-extrabold leading-[1.02] tracking-[-0.035em] text-[clamp(2rem,4vw,3rem)]">
          {title}
        </h1>
        {subtitle && <p className="dn-sub mt-4 text-base leading-[1.6]">{subtitle}</p>}
        {actions && actions.length > 0 && (
          <div className="mt-[26px] flex flex-wrap gap-2.5">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`${a.primary ? 'dn-btn dn-btn-primary' : 'dn-btn dn-btn-ghost'}
                  inline-flex items-center gap-2 min-h-[46px] px-5 rounded-xl text-[0.9375rem]`}
              >
                {a.label}
                {a.primary && <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2.2} aria-hidden />}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
