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
  Date: string;
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

// ─── Convert Google Drive share links to direct image URLs ───────────
export function toDirectImageUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  const driveMatch = trimmed.match(
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/
  );
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  const driveOpenMatch = trimmed.match(
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/
  );
  if (driveOpenMatch) {
    return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}`;
  }

  return trimmed;
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
