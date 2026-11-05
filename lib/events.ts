import { toDirectImageUrl, type EventRow } from "@/lib/api";
import { findCommunity, type Community } from "@/lib/communities";

export type Category = "guest-sessions" | "arohan-culturals" | "arohan-technicals" | "arohan-esports" | "curiosity-hour" | "community";
export type Status = "upcoming" | "past-recorded" | "past-unrecorded" | "live-now";

export interface EventItem {
  id: string;
  title: string;
  date: string;
  category: Category;
  status: Status;
  /** for community events: who ran it, as the sheet names them */
  organiser?: string;
  community?: Community;
  speaker?: string;
  description?: string;
  imageUrl?: string;
  meetLink?: string;
  youtubeLink?: string;
  winner?: string;
  runnerUp1?: string;
  runnerUp2?: string;
  honourableMentions?: string;
}

const ALIASES: [Category, (c: string) => boolean][] = [
  ["guest-sessions", (c) => ["live-session", "live-sessions", "live session", "guest-sessions", "guest session", "guest-session"].includes(c)],
  ["arohan-culturals", (c) => ["cultural", "culturals", "arohan-culturals", "arohan culturals", "aarohan-culturals", "aarohan culturals", "aarohan"].includes(c)],
  ["arohan-technicals", (c) => ["technical", "technicals", "arohan-technicals", "arohan technicals", "aarohan-technicals", "aarohan technicals"].includes(c)],
  ["arohan-esports", (c) => ["sports", "esports", "e-sports", "arohan-esports", "arohan esports", "arohan e-sports", "aarohan-esports", "aarohan esports", "aarohan e-sports"].includes(c)],
  ["curiosity-hour", (c) => c.includes("curiosity") || c.includes("curosity")],
];

/**
 * One sheet row → one event. Any category that is not a house-wide series
 * is a community's own event: it is kept (it used to be dropped) and linked
 * to the community when the name matches.
 */
export function mapRowToEvent(row: EventRow, index: number): EventItem | null {
  const rawCat = (row.Category || "").trim();
  const title = row.Title?.trim() || "";
  if (!title || !rawCat) return null;
  const known = ALIASES.find(([, test]) => test(rawCat.toLowerCase()))?.[0];

  const s = (row.status || "").trim().toLowerCase().replace(/\s+/g, "-");
  const status: Status = s === "live-now" || s === "past-recorded" || s === "past-unrecorded" ? s : "upcoming";

  return {
    id: `evt-${index}`,
    title,
    date: row.Date?.trim() || "",
    category: known ?? "community",
    organiser: known ? undefined : rawCat,
    community: known ? undefined : findCommunity(rawCat),
    status,
    speaker: row.Speaker?.trim() || undefined,
    description: row.description?.trim() || undefined,
    imageUrl: row.Image_url?.trim() ? toDirectImageUrl(row.Image_url) : undefined,
    meetLink: row.meet_link?.trim() || undefined,
    youtubeLink: row.youtube_url?.trim() || undefined,
    winner: row.winner,
    runnerUp1: row.runnerUp1,
    runnerUp2: row.runnerUp2,
    honourableMentions: row.honourableMentions,
  };
}

export const toEvents = (rows: EventRow[]) => rows.map(mapRowToEvent).filter((e): e is EventItem => e !== null);

/** The sheet writes dates as month/day/year; anything unparseable is treated as undated. */
export function parseDate(value: string): Date | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string): string {
  const d = parseDate(value);
  if (!d) return (value || "").trim();
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const toTime = (d: string) => parseDate(d)?.getTime() ?? 0;

export const isSoon = (e: EventItem) => e.status === "upcoming" || e.status === "live-now";

export function hasResults(e: EventItem) {
  return Boolean(e.winner || e.runnerUp1 || e.runnerUp2 || e.honourableMentions);
}

export function primaryAction(e: EventItem) {
  if (isSoon(e) && e.meetLink) return { href: e.meetLink, label: e.status === "live-now" ? "Join live" : "Join session", kind: e.status === "live-now" ? "live" : "join" } as const;
  if (!isSoon(e) && e.youtubeLink) return { href: e.youtubeLink, label: "Watch on YouTube", kind: "watch" } as const;
  return null;
}

/** What to call the event's series on a card. */
export function seriesLabel(e: EventItem): string {
  switch (e.category) {
    case "guest-sessions":
      return "Guest session";
    case "curiosity-hour":
      return "Curiosity Hour";
    case "arohan-culturals":
      return "Aarohan · Culturals";
    case "arohan-technicals":
      return "Aarohan · Technicals";
    case "arohan-esports":
      return "Aarohan · E-sports";
    default:
      return e.community?.name ?? e.organiser ?? "Community";
  }
}
