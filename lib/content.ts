// ─────────────────────────────────────────────────────────────────────────────
// Server-only content layer. Runs inside Next.js route handlers (app/api/*).
//
// Reads the public content from Supabase Postgres and returns it in exactly the
// shapes `lib/sheets.ts` used to return, so every /api route and every page
// component downstream is untouched. That one seam is what makes the cutover
// safe — and reversible: with Supabase unconfigured, or CONTENT_SOURCE=sheets,
// this falls straight back to the published spreadsheet.
//
// Reads go over PostgREST with plain fetch rather than @supabase/supabase-js:
// nothing here needs realtime, storage or auth, and fetch gets Next's own
// revalidate cache for free.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  EpisodeRow,
  EventRow,
  GalleryRow,
  MeetupRow,
  CouncilRow,
} from "@/lib/api";
import * as sheets from "@/lib/sheets";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** Mirrors the route handlers' own `export const revalidate = 300`. */
const REVALIDATE_SECONDS = 300;

/**
 * Which store the site is actually reading. `sheets` wins when explicitly
 * asked for, or when Supabase credentials are missing — a half-configured
 * deploy serves the spreadsheet rather than an empty site.
 */
export const contentSource: "supabase" | "sheets" =
  process.env.CONTENT_SOURCE === "sheets" || !SUPABASE_URL || !SERVICE_KEY
    ? "sheets"
    : "supabase";

const usingSupabase = contentSource === "supabase";

async function pg<T>(table: string, query = ""): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    // Tagged per table so an admin edit can drop just that table's cache
    // (see revalidateTag in the content API) instead of waiting out the
    // five minutes or clearing everything.
    next: { revalidate: REVALIDATE_SECONDS, tags: [`content:${table}`] },
  });
  if (!res.ok) {
    throw new Error(`Supabase read failed for ${table} (HTTP ${res.status}): ${await res.text()}`);
  }
  return res.json() as Promise<T[]>;
}

const str = (v: unknown) => (v == null ? "" : String(v));

// ─── Row shapes as stored in Postgres ────────────────────────────────

interface DbEvent {
  id: string;
  source: string;
  title: string;
  category: string;
  status: string;
  date_text: string;
  starts_at: string | null;
  description: string;
  speaker: string;
  image_url: string;
  youtube_url: string;
  meet_link: string;
  winner: string;
  runner_up_1: string;
  runner_up_2: string;
  honourable_mentions: string;
  sort_order: number;
}

// ─── Public API — same signatures as lib/sheets.ts ───────────────────

export async function getEpisodes(): Promise<EpisodeRow[]> {
  if (!usingSupabase) return sheets.getEpisodes();
  const rows = await pg<Record<string, unknown>>("episodes", "select=*&order=sort_order.asc");
  return rows.map((r) => ({
    "Episode No.": str(r.episode_no),
    Title: str(r.title),
    Date: str(r.date_text),
    Host: str(r.host),
    Image_url: str(r.image_url),
    Instagram_url: str(r.instagram_url),
  }));
}

export async function getGallery(): Promise<GalleryRow[]> {
  if (!usingSupabase) return sheets.getGallery();
  const rows = await pg<Record<string, unknown>>("gallery_items", "select=*&order=sort_order.asc");
  return rows.map((r) => ({
    Student: str(r.student),
    Category: str(r.category),
    Image_url: str(r.image_url),
    // The consumers compare String(Approved).toUpperCase() === "TRUE".
    Timestamp: str(r.timestamp_raw),
    Approved: r.approved ? "TRUE" : "FALSE",
  }));
}

export async function getMeetups(): Promise<MeetupRow[]> {
  if (!usingSupabase) return sheets.getMeetups();
  const rows = await pg<Record<string, unknown>>("meetups", "select=*&order=sort_order.asc");
  return rows.map((r) => ({
    Date: str(r.date_text),
    Venue: str(r.venue),
    Region: str(r.region),
    "Instagram Post": str(r.instagram_post),
    "Host's ID": str(r.host_id),
    Poster: str(r.poster),
    City: str(r.city),
    District: str(r.district),
    State: str(r.state),
    // Null coordinates stay empty rather than becoming "0": lib/meetups.ts
    // drops a meetup with no usable pair, and 0,0 is a point in the Atlantic.
    Lat: r.lat == null ? "" : str(r.lat),
    Lon: r.lon == null ? "" : str(r.lon),
  }));
}

export async function getCouncil(): Promise<CouncilRow[]> {
  if (!usingSupabase) return sheets.getCouncil();
  const rows = await pg<Record<string, unknown>>("council_members", "select=*&order=sort_order.asc");
  return rows.map((r) => ({
    Name: str(r.name),
    Role: str(r.role),
    "Council Type": str(r.council_type),
    Tagline: str(r.tagline),
    Phone: str(r.phone),
    Email: str(r.email),
    "Image URL": str(r.image_url),
    Color: str(r.color),
  }));
}

/**
 * Events from all three source tabs.
 *
 * The Aarohan tab is a results table with no description of its own, so the
 * sheet layer used to synthesise one from the placings. That is kept here
 * verbatim — the events page renders exactly what it rendered before.
 */
export async function getEvents(): Promise<EventRow[]> {
  if (!usingSupabase) return sheets.getEvents();
  const rows = await pg<DbEvent>("events", "select=*&order=source.asc,sort_order.asc");

  return rows.map((r): EventRow => {
    let description = str(r.description);

    if (r.source === "aarohan" && !description) {
      const placings: string[] = [];
      if (r.winner?.trim()) placings.push(`🏆 Winner: ${r.winner.trim()}`);
      if (r.runner_up_1?.trim()) placings.push(`🥈 1st Runner-up: ${r.runner_up_1.trim()}`);
      if (r.runner_up_2?.trim()) placings.push(`🥉 2nd Runner-up: ${r.runner_up_2.trim()}`);
      if (r.honourable_mentions?.trim()) {
        placings.push(`🎖️ Honourable Mentions: ${r.honourable_mentions.trim()}`);
      }
      description = placings.join("\n");
    }

    return {
      Title: str(r.title),
      Category: str(r.category),
      status: str(r.status),
      Date: str(r.date_text),
      description,
      Speaker: str(r.speaker),
      Image_url: str(r.image_url),
      youtube_url: str(r.youtube_url),
      meet_link: str(r.meet_link),
      winner: r.winner?.trim() || undefined,
      runnerUp1: r.runner_up_1?.trim() || undefined,
      runnerUp2: r.runner_up_2?.trim() || undefined,
      honourableMentions: r.honourable_mentions?.trim() || undefined,
    };
  });
}

// ─── New content, which never lived in lib/sheets.ts ─────────────────

export interface StudyLinkRow {
  Degree: string;
  "Student Handbook": string;
  "Grading Doc": string;
}

export interface RevisionSessionRow {
  Degree: string;
  Level: string;
  Exam_type: string;
  URL: string;
}

export async function getStudyLinks(): Promise<StudyLinkRow[]> {
  if (!usingSupabase) return [];
  const rows = await pg<Record<string, unknown>>("study_links", "select=*&order=sort_order.asc");
  return rows.map((r) => ({
    Degree: str(r.degree),
    "Student Handbook": str(r.handbook_url),
    "Grading Doc": str(r.grading_url),
  }));
}

export async function getRevisionSessions(): Promise<RevisionSessionRow[]> {
  if (!usingSupabase) return [];
  const rows = await pg<Record<string, unknown>>("revision_sessions", "select=*&order=sort_order.asc");
  return rows.map((r) => ({
    Degree: str(r.degree),
    Level: str(r.level),
    Exam_type: str(r.exam_type),
    URL: str(r.url),
  }));
}
