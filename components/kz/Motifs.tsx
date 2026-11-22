import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { HERITAGE_CREDIT, type Heritage } from "@/lib/heritage";

/** Gamosa weave band — opens a chapter. */
export function Gamosa({ thin = false, dark = false, className = "" }: { thin?: boolean; dark?: boolean; className?: string }) {
  return <div aria-hidden="true" className={`kz-gamosa ${thin ? "kz-gamosa--thin" : ""} ${dark ? "kz-gamosa--dark" : ""} ${className}`} />;
}

const BURST_RAYS = ["#e2387a", "#f6b51e", "#2343b8", "#c8102e", "#f6b51e", "#0f5e48"];

/** A sale-sticker sunburst of coloured rays, from the poster shop. */
export function Burst({ className = "", rays = 24, colors = BURST_RAYS }: { className?: string; rays?: number; colors?: string[] }) {
  const paths = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * Math.PI * 2;
    const b = ((i + 0.5) / rays) * Math.PI * 2;
    const c = ((i + 1) / rays) * Math.PI * 2;
    const r = i % 2 ? 50 : 41;
    const inner = 13;
    const p = (ang: number, rad: number) => `${(50 + Math.cos(ang) * rad).toFixed(2)} ${(50 + Math.sin(ang) * rad).toFixed(2)}`;
    return { d: `M${p(a, inner)}L${p(b, r)}L${p(c, inner)}Z`, fill: colors[i % colors.length] };
  });
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className={className}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill} />
      ))}
    </svg>
  );
}

/** A post-office cancellation mark, its words running round the ring. */
export function Postmark({
  top = "KAZIRANGA HOUSE",
  bottom = "ASSAM · INDIA",
  center,
  color = "#c8102e",
  className = "",
  style,
}: {
  top?: string;
  bottom?: string;
  center: ReactNode;
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span aria-hidden="true" className={`relative inline-grid aspect-square place-items-center ${className}`} style={{ color, ...style }}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
        <defs>
          <path id="pm-top" d="M18 60a42 42 0 0 1 84 0" />
          <path id="pm-bot" d="M14 60a46 46 0 0 0 92 0" />
        </defs>
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="60" cy="60" r="31" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <text fill="currentColor" style={{ font: "11px var(--kz-f-sign)", letterSpacing: "0.12em" }}>
          <textPath href="#pm-top" startOffset="50%" textAnchor="middle">
            {top}
          </textPath>
        </text>
        <text fill="currentColor" style={{ font: "11px var(--kz-f-sign)", letterSpacing: "0.12em" }}>
          <textPath href="#pm-bot" startOffset="50%" textAnchor="middle">
            {bottom}
          </textPath>
        </text>
      </svg>
      <span className="relative text-center font-[family-name:var(--kz-f-sign)] text-[0.62em] leading-tight">{center}</span>
    </span>
  );
}

/** A postage stamp: perforated frame, country line and a face value. */
export function Stamp({
  children,
  value,
  country = "INDIA",
  bg = "#f5e9cf",
  className = "",
  style,
}: {
  children: ReactNode;
  value?: string;
  country?: string;
  bg?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`kz-stamp ${className}`} style={{ ["--stamp-bg" as string]: bg, ...style }}>
      <div className="relative overflow-hidden">
        {children}
        <span className="pointer-events-none absolute left-2 top-1.5 font-[family-name:var(--kz-f-sign)] text-[0.7rem] tracking-[0.12em] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
          {country}
        </span>
        {value && (
          <span className="pointer-events-none absolute bottom-1.5 right-2 font-[family-name:var(--kz-f-sign)] text-[1.1rem] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

/** A chapter title in Yatra One, printed slightly off-register in a second colour. */
export function ChapterTitle({
  children,
  as: Tag = "h2",
  className = "",
  offset = "rgba(200,16,46,0.28)",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  offset?: string;
}) {
  return (
    <Tag className={`kz-h2 kz-offset max-w-4xl ${className}`} style={{ ["--offset" as string]: offset }}>
      {children}
    </Tag>
  );
}

/** Painted arrow planks — each one a real link, like a hill-town signpost. */
export function Signboards({
  items,
  className = "",
}: {
  items: { label: string; href: string; bg: string; ink: string; tilt?: number; external?: boolean }[];
  className?: string;
}) {
  return (
    <ul className={`flex flex-col items-start gap-2.5 ${className}`}>
      {items.map((s, i) => {
        const body = (
          <span
            className={`kz-signboard group flex items-center gap-3 py-2.5 pl-4 pr-9 font-[family-name:var(--kz-f-sign)] text-[0.82rem] uppercase tracking-[0.12em] shadow-[0_8px_16px_-10px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:translate-x-1.5 ${
              i % 2 ? "kz-signboard--left pl-9 pr-4" : ""
            }`}
            style={{ background: s.bg, color: s.ink, rotate: `${s.tilt ?? 0}deg` }}
          >
            {s.label}
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        );
        return (
          <li key={s.label}>
            {s.external ? (
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="kz-focus block">
                {body}
              </a>
            ) : (
              <Link href={s.href} className="kz-focus block">
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** A small museum label under a historical picture: what it is, and where it's from. */
export function MuseumLabel({ art, dark = false, className = "" }: { art: Heritage; dark?: boolean; className?: string }) {
  return (
    <p className={`font-[family-name:var(--kz-f-sign)] text-[0.68rem] uppercase leading-snug tracking-[0.08em] ${dark ? "text-[#f5e9cf]/70" : "text-[#5e4a35]"} ${className}`}>
      <a href={art.source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
        {art.title}
      </a>
      <span aria-hidden="true"> · </span>
      {art.where}, {art.made}
      <span className="sr-only"> ({HERITAGE_CREDIT})</span>
    </p>
  );
}
