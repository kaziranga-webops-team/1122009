import Papa from "papaparse";

// ─── Google Sheets CSV URLs ──────────────────────────────────────────
const EPISODES_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjXAxRoqAYbkftm1l2yz-Ib5prf2ujnR9kcd4iCwJON4YSw8S8UucAYRu3GQuhYeH4Za1EoB3U7f3L/pub?gid=0&single=true&output=csv";

const EVENTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjXAxRoqAYbkftm1l2yz-Ib5prf2ujnR9kcd4iCwJON4YSw8S8UucAYRu3GQuhYeH4Za1EoB3U7f3L/pub?gid=311257018&single=true&output=csv";

const AROHAN_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjXAxRoqAYbkftm1l2yz-Ib5prf2ujnR9kcd4iCwJON4YSw8S8UucAYRu3GQuhYeH4Za1EoB3U7f3L/pub?gid=842204102&single=true&output=csv";

const GALLERY_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjXAxRoqAYbkftm1l2yz-Ib5prf2ujnR9kcd4iCwJON4YSw8S8UucAYRu3GQuhYeH4Za1EoB3U7f3L/pub?gid=660048919&single=true&output=csv";

// TODO: Replace with your published Google Sheets CSV URL for the council sheet
const COUNCIL_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjXAxRoqAYbkftm1l2yz-Ib5prf2ujnR9kcd4iCwJON4YSw8S8UucAYRu3GQuhYeH4Za1EoB3U7f3L/pub?gid=1429305251&single=true&output=csv";

const MEETUPS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjXAxRoqAYbkftm1l2yz-Ib5prf2ujnR9kcd4iCwJON4YSw8S8UucAYRu3GQuhYeH4Za1EoB3U7f3L/pub?gid=177547042&single=true&output=csv";

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

// ─── Helper: fetch + parse CSV ───────────────────────────────────────
async function fetchCSV<T>(url: string): Promise<T[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch data (HTTP ${response.status})`);
  }
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<T>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err: Error) => reject(err),
    });
  });
}

// ─── Convert Google Drive share links to direct image URLs ───────────
export function toDirectImageUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  // Google Drive share link → direct image URL
  // Matches: https://drive.google.com/file/d/FILE_ID/view...
  const driveMatch = trimmed.match(
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/
  );
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  // Google Drive open link → direct image URL
  // Matches: https://drive.google.com/open?id=FILE_ID
  const driveOpenMatch = trimmed.match(
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/
  );
  if (driveOpenMatch) {
    return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}`;
  }

  // Already a direct URL (GitHub raw, imgur, etc.) — return as-is
  return trimmed;
}

// ─── Global In-Memory Cache for Sheet Fetches ───────────────────────
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

// ─── Public API ──────────────────────────────────────────────────────
export function fetchEpisodes(): Promise<EpisodeRow[]> {
  if (!cachedEpisodesPromise) {
    cachedEpisodesPromise = fetchCSV<EpisodeRow>(EPISODES_CSV_URL)
      .then((data) => {
        cachedEpisodes = data;
        return data;
      })
      .catch((err) => {
        cachedEpisodesPromise = null; // Reset cache on error to allow retries
        cachedEpisodes = null;
        throw err;
      });
  }
  return cachedEpisodesPromise;
}

export function fetchEvents(): Promise<EventRow[]> {
  if (!cachedEventsPromise) {
    cachedEventsPromise = (async () => {
      const [mainEvents, arohanEvents] = await Promise.all([
        fetchCSV<EventRow>(EVENTS_CSV_URL),
        fetchCSV<any>(AROHAN_CSV_URL)
      ]);

      const mappedArohan: EventRow[] = arohanEvents.map((row) => {
        // Combine winners and runner-ups into a formatted description
        const details: string[] = [];
        if (row["Winner "]?.trim()) {
          details.push(`🏆 Winner: ${row["Winner "].trim()}`);
        }
        if (row["First Runner-up"]?.trim()) {
          details.push(`🥈 1st Runner-up: ${row["First Runner-up"].trim()}`);
        }
        if (row["Secong Runner-up"]?.trim()) {
          details.push(`🥉 2nd Runner-up: ${row["Secong Runner-up"].trim()}`);
        }
        if (row["Honourable mentions "]?.trim()) {
          details.push(`🎖️ Honourable Mentions: ${row["Honourable mentions "].trim()}`);
        }
        const description = details.join("\n");

        return {
          Title: row["Name of Event"]?.trim() || "",
          Category: row["Sub-Category"]?.trim() || "",
          status: row["Status"]?.trim() || "",
          Date: "", // Arohan events do not have dates in the sheet
          description: description,
          Speaker: "", // Arohan events do not have speakers in the sheet
          Image_url: row["Images"]?.trim() || "",
          youtube_url: row["YouTube link"]?.trim() || "",
          meet_link: row["Meet-Link"]?.trim() || "",
          winner: row["Winner "]?.trim() || undefined,
          runnerUp1: row["First Runner-up"]?.trim() || undefined,
          runnerUp2: row["Secong Runner-up"]?.trim() || undefined,
          honourableMentions: row["Honourable mentions "]?.trim() || undefined,
        };
      });

      const merged = [...mainEvents, ...mappedArohan];
      cachedEvents = merged;
      return merged;
    })().catch((err) => {
      cachedEventsPromise = null;
      cachedEvents = null;
      throw err;
    });
  }
  return cachedEventsPromise;
}

export function fetchGallery(): Promise<GalleryRow[]> {
  if (!cachedGalleryPromise) {
    cachedGalleryPromise = fetchCSV<GalleryRow>(GALLERY_CSV_URL)
      .then((data) => {
        cachedGallery = data;
        return data;
      })
      .catch((err) => {
        cachedGalleryPromise = null;
        cachedGallery = null;
        throw err;
      });
  }
  return cachedGalleryPromise;
}

export function fetchMeetups(): Promise<MeetupRow[]> {
  if (!cachedMeetupsPromise) {
    cachedMeetupsPromise = fetchCSV<MeetupRow>(MEETUPS_CSV_URL)
      .then((data) => {
        cachedMeetups = data;
        return data;
      })
      .catch((err) => {
        cachedMeetupsPromise = null;
        cachedMeetups = null;
        throw err;
      });
  }
  return cachedMeetupsPromise;
}

export function fetchCouncil(): Promise<CouncilRow[]> {
  if (!cachedCouncilPromise) {
    cachedCouncilPromise = fetchCSV<CouncilRow>(COUNCIL_CSV_URL)
      .then((data) => {
        cachedCouncil = data;
        return data;
      })
      .catch((err) => {
        cachedCouncilPromise = null;
        cachedCouncil = null;
        throw err;
      });
  }
  return cachedCouncilPromise;
}
