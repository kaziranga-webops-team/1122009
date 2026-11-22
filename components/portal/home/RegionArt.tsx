// ─────────────────────────────────────────────────────────────────────────────
// Regional poster art: one screen-print style illustration per region, in
// public/images/regions/<slug>-<width>.webp (640 for cards, 1200 for larger
// use). The city name and the printed dot screen are laid on in code, so they
// stay sharp at any size and the artwork itself carries no text.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { Region } from '@/lib/portal/regions';

export interface RegionTheme {
  /** Shown while the image loads; matches the artwork's sky. */
  sky: string;
  /** Colour for the city name set over that sky. */
  label: string;
  /** The poster's sun, used as the name's offset shadow. */
  accent: string;
  landmark: string;
  /** Where the landmark sits, for tight square crops on phones. */
  focus: string;
}

const CREAM = '#f3e6cb';
const INK = '#1c130c';

export const REGION_THEMES: Record<Region, RegionTheme> = {
  Bengaluru: { sky: CREAM, label: INK, accent: '#f6b51e', landmark: 'Vidhana Soudha', focus: '50% 55%' },
  Chandigarh: { sky: '#bdeff8', label: INK, accent: '#f6b51e', landmark: 'Open Hand', focus: '50% 50%' },
  Chennai: { sky: CREAM, label: INK, accent: '#c8102e', landmark: 'Temple gopuram', focus: '50% 50%' },
  Delhi: { sky: CREAM, label: INK, accent: '#c8102e', landmark: 'Qutub Minar', focus: '50% 60%' },
  Hyderabad: { sky: CREAM, label: INK, accent: '#e2387a', landmark: 'Charminar', focus: '50% 50%' },
  Kolkata: { sky: CREAM, label: INK, accent: '#e2387a', landmark: 'Howrah Bridge', focus: '45% 60%' },
  Lucknow: { sky: CREAM, label: INK, accent: '#e3a936', landmark: 'Rumi Darwaza', focus: '50% 50%' },
  Mumbai: { sky: '#2343b8', label: '#f5e9cf', accent: '#c8102e', landmark: 'Gateway of India', focus: '50% 60%' },
  Patna: { sky: CREAM, label: INK, accent: '#f6b51e', landmark: 'Golghar', focus: '50% 50%' },
  Other: { sky: CREAM, label: INK, accent: '#c8102e', landmark: 'Kaziranga', focus: '40% 60%' },
};

export const regionImage = (region: Region, width: 640 | 1200 = 640) =>
  `/images/regions/${region.toLowerCase()}-${width}.webp`;

/**
 * The region's artwork, filling its box (cropped, never stretched), with a
 * faint printed dot screen over it. The caller sizes and positions the box.
 */
export const RegionArt: React.FC<{ region: Region; className?: string; sizes?: string }> = ({
  region,
  className,
  sizes = '(min-width: 640px) 320px, 96px',
}) => {
  const theme = REGION_THEMES[region];
  return (
    <span className={`block overflow-hidden ${className ?? ''}`} style={{ background: theme.sky }}>
      <img
        src={regionImage(region, 640)}
        srcSet={`${regionImage(region, 640)} 640w, ${regionImage(region, 1200)} 1200w`}
        sizes={sizes}
        alt={`${theme.landmark}, ${region}`}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
        style={{ objectPosition: theme.focus }}
      />
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(rgba(28,19,12,0.14) 0.8px, transparent 1.2px)',
          backgroundSize: '5px 5px',
        }}
      />
    </span>
  );
};
