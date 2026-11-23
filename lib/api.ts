// ─────────────────────────────────────────────────────────────────────────────
// Client-side data layer.
//
// Every function here fetches from the app's OWN Next.js API routes (/api/*),
// which proxy Google Sheets server-side. The Google Sheet URLs never reach the
// browser. Swap the data source by editing the server routes (app/api/*), not
// this file.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────
export interface EpisodeRow {
  "Episode No.": string;
  Title: string;
  Date: string;
  Host: string;
  Image_url: string;
  Instagram_url: string;
}

export interface EventRow {
  Title: string;
  Category: string;
  status: string;
  /** As typed in the sheet. The format varies between tabs, so never parse it: use Starts_at. */
  Date: string;
  /** The event's real date (ISO), from the editor's "Date (for sorting)" field. */
  Starts_at?: string;
  description: string;
  Speaker: string;
  Image_url: string;
  youtube_url: string;
  meet_link: string;
  winner?: string;
  runnerUp1?: string;
  runnerUp2?: string;
  honourableMentions?: string;
}

export interface GalleryRow {
  Student: string;
  Category: string;
  Image_url: string;
  Timestamp: string;
  Approved: string;
}

export interface MeetupRow {
  Date: string;
  Venue: string;
  Region: string;
  "Instagram Post": string;
  "Host's ID": string;
  Poster: string;
  // ─── Geography, for the map ───
  // `Region` is an IITM BS zone (Lucknow, Patna, Kolkata), not a place, and
  // `Venue` is free text, so these five are what the map actually reads.
  // Filled by scripts/geocode-meetups.ts. Strings, like every other field
  // here, because the spreadsheet fallback can only ever hand back strings —
  // lib/meetups.ts is what parses them into numbers.
  City: string;
  District: string;
  State: string;
  Lat: string;
  Lon: string;
}

export interface CouncilRow {
  Name: string;
  Role: string;
  "Council Type": string;
  Tagline: string;
  Phone: string;
  Email: string;
  "Image URL": string;
  [key: string]: any;
}

export interface HeroPhoto {
  url: string;
  /** Deterministic fallback used if the primary image fails to load. */
  fallback: string;
}

// ─── Image delivery ───────────────────────────────────────────────────

const CLOUDINARY = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Serves a remote image through Cloudinary: resized to `width` (never
 * upscaled), converted to WebP/AVIF where the browser takes it, compressed,
 * and cached on Cloudinary's CDN. A 1.2 MB PNG poster from GitHub comes back
 * as about 80 KB. Local files and anything that is not https are left alone,
 * and without a cloud name configured every URL passes through unchanged.
 */
export function cdnImage(url: string, width = 1200): string {
  if (!CLOUDINARY || !/^https:\/\//i.test(url)) return url;
  const t = `f_auto,q_auto,c_limit,w_${width}`;
  // Already on Cloudinary: add the transformation unless one is there.
  if (/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) {
    return /\/image\/upload\/(?:[a-z]{1,3}_[^/]*\/)/.test(url) ? url : url.replace("/image/upload/", `/image/upload/${t}/`);
  }
  if (url.includes("res.cloudinary.com")) return url;
  return `https://res.cloudinary.com/${CLOUDINARY}/image/fetch/${t}/${encodeURIComponent(url)}`;
}

// ─── Convert Google Drive share links to direct image URLs ───────────
/** A direct, CDN-served URL for an image link from the content sheets. */
export function toDirectImageUrl(url: string, width = 1200): string {
  if (!url) return "";
  const trimmed = url.trim();

  const driveMatch = trimmed.match(
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/
  );
  if (driveMatch) {
    return cdnImage(`https://lh3.googleusercontent.com/d/${driveMatch[1]}`, width);
  }

  const driveOpenMatch = trimmed.match(
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/
  );
  if (driveOpenMatch) {
    return cdnImage(`https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}`, width);
  }

  return cdnImage(trimmed, width);
}

// ─── Helper: fetch JSON from one of our own API routes ───────────────
async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

// ─── Global In-Memory Cache ──────────────────────────────────────────
let cachedEpisodesPromise: Promise<EpisodeRow[]> | null = null;
let cachedEventsPromise: Promise<EventRow[]> | null = null;
let cachedGalleryPromise: Promise<GalleryRow[]> | null = null;
let cachedMeetupsPromise: Promise<MeetupRow[]> | null = null;
let cachedCouncilPromise: Promise<CouncilRow[]> | null = null;

let cachedEpisodes: EpisodeRow[] | null = null;
let cachedEvents: EventRow[] | null = null;
let cachedGallery: GalleryRow[] | null = null;
let cachedMeetups: MeetupRow[] | null = null;
let cachedCouncil: CouncilRow[] | null = null;

export function getCachedEpisodes(): EpisodeRow[] | null {
  return cachedEpisodes;
}
export function getCachedEvents(): EventRow[] | null {
  return cachedEvents;
}
export function getCachedGallery(): GalleryRow[] | null {
  return cachedGallery;
}
export function getCachedMeetups(): MeetupRow[] | null {
  return cachedMeetups;
}
export function getCachedCouncil(): CouncilRow[] | null {
  return cachedCouncil;
}

// Small helper to wire up "fetch once, cache promise + value, reset on error".
function makeFetcher<T>(
  path: string,
  getPromise: () => Promise<T[]> | null,
  setPromise: (p: Promise<T[]> | null) => void,
  setValue: (v: T[] | null) => void
): () => Promise<T[]> {
  return () => {
    let promise = getPromise();
    if (!promise) {
      promise = fetchJSON<T[]>(path)
        .then((data) => {
          setValue(data);
          return data;
        })
        .catch((err) => {
          setPromise(null);
          setValue(null);
          throw err;
        });
      setPromise(promise);
    }
    return promise;
  };
}

// ─── Public API ──────────────────────────────────────────────────────
export const fetchEpisodes = makeFetcher<EpisodeRow>(
  "/api/episodes",
  () => cachedEpisodesPromise,
  (p) => (cachedEpisodesPromise = p),
  (v) => (cachedEpisodes = v)
);

export const fetchEvents = makeFetcher<EventRow>(
  "/api/events",
  () => cachedEventsPromise,
  (p) => (cachedEventsPromise = p),
  (v) => (cachedEvents = v)
);

export const fetchGallery = makeFetcher<GalleryRow>(
  "/api/gallery",
  () => cachedGalleryPromise,
  (p) => (cachedGalleryPromise = p),
  (v) => (cachedGallery = v)
);

export const fetchMeetups = makeFetcher<MeetupRow>(
  "/api/meetups",
  () => cachedMeetupsPromise,
  (p) => (cachedMeetupsPromise = p),
  (v) => (cachedMeetups = v)
);

export const fetchCouncil = makeFetcher<CouncilRow>(
  "/api/council",
  () => cachedCouncilPromise,
  (p) => (cachedCouncilPromise = p),
  (v) => (cachedCouncil = v)
);

// ─── Hero showcase photos (served fresh/shuffled each load) ──────────
export async function fetchHeroPhotos(): Promise<HeroPhoto[]> {
  return fetchJSON<HeroPhoto[]>("/api/hero-photos");
}
