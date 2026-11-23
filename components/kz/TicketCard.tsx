"use client";

import type { ReactNode } from "react";

/** Ticket stock: the paper colours single-screen cinemas printed tickets on. */
export const TICKET_STOCK = {
  marigold: "#f6c453",
  pink: "#f4b3c8",
  sky: "#b9e3ee",
  mint: "#bfe3c7",
  cream: "#fbf1d8",
} as const;

export type TicketStock = keyof typeof TICKET_STOCK;

/** "22 AUG 2026", inked on with a rubber stamp. */
export function DateStamp({ date, className = "" }: { date: Date | null; className?: string }) {
  if (!date) return null;
  // Always the house's own calendar day, wherever the visitor is.
  const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...o }).format(date);
  const text = `${part({ day: "numeric" })} ${part({ month: "short" }).toUpperCase()} ${part({ year: "numeric" })}`;
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return (
    <span
      className={`inline-block -rotate-6 rounded-md border-2 border-[#c8102e]/85 px-2 py-0.5 font-[family-name:var(--kz-f-sign)] text-[0.95rem] leading-tight text-[#c8102e]/90 mix-blend-multiply ${className}`}
    >
      <time dateTime={iso}>{text}</time>
    </span>
  );
}

/**
 * A cinema ticket: the poster in a window at the top, a perforated tear line
 * with notches cut from either edge, and the stub below on coloured stock
 * inside a printed frame. The page's paper shows through the notches.
 */
export function TicketCard({
  stock,
  poster,
  children,
  paper = "#f5e9cf",
  className = "",
}: {
  stock: TicketStock;
  poster: ReactNode;
  children: ReactNode;
  /** The colour behind the card, for the notches. */
  paper?: string;
  className?: string;
}) {
  return (
    <div
      className={`group relative flex h-full flex-col rounded-[6px] p-2 shadow-[0_2px_0_rgba(28,19,12,0.15)] transition-[transform,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:rotate-[-0.5deg] hover:shadow-[6px_6px_0_#1c130c] ${className}`}
      style={{ background: TICKET_STOCK[stock] }}
    >
      <div className="relative overflow-hidden rounded-[3px] border-2 border-[#1c130c]">{poster}</div>

      {/* the tear line */}
      <div aria-hidden="true" className="relative my-2 h-3">
        <span className="absolute inset-x-3 top-1/2 border-t-2 border-dashed border-[#1c130c]/45" />
        <span className="absolute -left-4 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full" style={{ background: paper }} />
        <span className="absolute -right-4 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full" style={{ background: paper }} />
      </div>

      {/* the stub, in its printed frame */}
      {/* Not positioned, so a stretched link inside covers the whole ticket. */}
      <div className="flex flex-1 flex-col rounded-[3px] border-[1.5px] border-[#1c130c]/60 px-4 pb-4 pt-3">{children}</div>
    </div>
  );
}
