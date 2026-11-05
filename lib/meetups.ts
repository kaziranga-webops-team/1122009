// ─────────────────────────────────────────────────────────────────────────────
// Meetup rows -> things a map can draw.
//
// MeetupRow carries strings for every field, because the spreadsheet fallback
// can only hand back strings (see lib/sheets.ts). The map needs numbers, a
// state to group by, and the certainty that every pin it is given is real —
// a half-parsed coordinate is worse than a missing one, since it silently
// puts a meetup in the wrong state. All of that parsing lives here, once.
//
// Safe in a client component: it imports nothing but the row type.
// ─────────────────────────────────────────────────────────────────────────────
import type { MeetupRow } from "@/lib/api";

/**
 * Mainland + islands. Anything outside is a bad row rather than a meetup
 * abroad, and the usual cause is a swapped pair — (78, 27) is Saudi Arabia.
 * Mirrors the check in supabase/migrations/0003_meetup_geography.sql.
 */
export const INDIA_BBOX = { minLat: 6.0, maxLat: 37.6, minLon: 68.0, maxLon: 97.5 } as const;

export interface MeetupPin {
  /** Stable within a render: date + venue is what the geocoder keys on too. */
  key: string;
  /** As written in the sheet, day/month/year. */
  date: string;
  /** `date` parsed, as a UTC timestamp, for sorting. Null when it does not parse. */
  time: number | null;
  venue: string;
  /** The IITM BS zone the meetup was organised under — not a place. */
  region: string;
  city: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  instagram: string;
  poster: string;
}

const tidy = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** A number only if the string really is one. "" , "N/A" and "0,0" are not. */
function coord(raw: string | undefined, min: number, max: number): number | null {
  const s = tidy(raw);
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n === 0) return null;
  return n >= min && n <= max ? n : null;
}

/**
 * Every meetup that can actually be placed on the map, in the order given.
 * Rows without usable coordinates are dropped rather than guessed at — ask
 * `unplaced` for those so a page can still say how many it is not showing.
 */
export function toMeetupPins(rows: MeetupRow[]): MeetupPin[] {
  const pins: MeetupPin[] = [];
  for (const r of rows) {
    const lat = coord(r.Lat, INDIA_BBOX.minLat, INDIA_BBOX.maxLat);
    const lon = coord(r.Lon, INDIA_BBOX.minLon, INDIA_BBOX.maxLon);
    if (lat == null || lon == null) continue;
    pins.push({
      key: `${tidy(r.Date)}|${tidy(r.Venue)}`,
      date: tidy(r.Date),
      time: parseMeetupDate(r.Date)?.getTime() ?? null,
      venue: tidy(r.Venue),
      region: tidy(r.Region),
      city: tidy(r.City),
      district: tidy(r.District),
      state: tidy(r.State),
      lat,
      lon,
      instagram: tidy(r["Instagram Post"]),
      poster: tidy(r.Poster),
      // Host's ID is deliberately absent: it holds email addresses, and a map
      // card has no use for them.
    });
  }
  return pins;
}

/**
 * The sheet writes dates day/month/year — "1/9/2025", "30/11/2025" — and now
 * and then with a two-digit year ("24/05/26"). `new Date()` would read the
 * first as 9 January, so it never sees these strings.
 */
export function parseMeetupDate(raw: string | undefined): Date | null {
  const m = tidy(raw).match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  // Rejects 31/02 and friends, which Date would quietly roll into March.
  return d.getUTCMonth() === month - 1 && d.getUTCDate() === day ? d : null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "1 Sep 2025", or the sheet's own text when it is not a date we can read. */
export function formatMeetupDate(raw: string): string {
  const d = parseMeetupDate(raw);
  if (!d) return tidy(raw);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Still to happen: dated after today. The sheet lists meetups being planned
 * alongside past ones, and "newest" would otherwise present next month's as
 * something that already took place.
 */
export function isUpcoming(m: MeetupPin, now = Date.now()): boolean {
  // The whole meetup day counts as upcoming, not just its UTC midnight.
  return m.time != null && m.time + 24 * 60 * 60 * 1000 > now;
}

/** Newest first; undated meetups sink to the end rather than vanish. */
export const newestFirst = (a: MeetupPin, b: MeetupPin) => {
  if (a.time == null || b.time == null) return a.time == null ? (b.time == null ? 0 : 1) : -1;
  return b.time - a.time;
};

/** The rows the map cannot show, for an honest count under it. */
export function unplaced(rows: MeetupRow[]): MeetupRow[] {
  const placed = new Set(toMeetupPins(rows).map((p) => p.key));
  return rows.filter((r) => !placed.has(`${tidy(r.Date)}|${tidy(r.Venue)}`));
}

/**
 * Comparable form of a state or city name: lowercase, no punctuation, no
 * spaces. Boundary files spell places their own way ("NCT of Delhi",
 * "Jammu & Kashmir"), so joining a pin to a shape goes through this.
 */
export const placeKey = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/**
 * State names that differ between the sheet and the usual boundary files,
 * keyed by placeKey. Only the ones this data actually hits.
 */
const STATE_ALIASES: Record<string, string> = {
  delhi: "delhi",
  nctofdelhi: "delhi",
  nationalcapitalterritoryofdelhi: "delhi",
  jammukashmir: "jammuandkashmir",
  jk: "jammuandkashmir",
  odisha: "odisha",
  orissa: "odisha",
  uttarakhand: "uttarakhand",
  uttaranchal: "uttarakhand",
  pondicherry: "puducherry",
  puducherry: "puducherry",
};

/** The key two spellings of the same state agree on. */
export function stateKey(name: string): string {
  const k = placeKey(name);
  return STATE_ALIASES[k] ?? k;
}

export interface PlaceGroup<T> {
  /** The name as the data spells it, for display. */
  name: string;
  key: string;
  items: T[];
}

function group<T>(items: T[], name: (t: T) => string, key: (s: string) => string): PlaceGroup<T>[] {
  const out = new Map<string, PlaceGroup<T>>();
  for (const item of items) {
    const label = name(item);
    if (!label) continue;
    const k = key(label);
    const existing = out.get(k);
    if (existing) existing.items.push(item);
    else out.set(k, { name: label, key: k, items: [item] });
  }
  // Busiest first: that is the order a legend or a list wants.
  return [...out.values()].sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
}

/** Pins per state, busiest state first. */
export const byState = (pins: MeetupPin[]) => group(pins, (p) => p.state, stateKey);

/** Pins per city, busiest city first. Several meetups share a city often. */
export const byCity = (pins: MeetupPin[]) => group(pins, (p) => p.city, placeKey);

/** Mean position of a set of pins — where a state's cluster marker sits. */
export function centroid(pins: MeetupPin[]): { lat: number; lon: number } | null {
  if (!pins.length) return null;
  const lat = pins.reduce((s, p) => s + p.lat, 0) / pins.length;
  const lon = pins.reduce((s, p) => s + p.lon, 0) / pins.length;
  return { lat, lon };
}
