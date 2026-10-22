// ─────────────────────────────────────────────────────────────────────────────
// Server-only data layer. Runs inside Next.js route handlers (app/api/*).
//
// Holds the Google Sheets published-CSV URLs and parses them with PapaParse.
// URLs can be overridden with env vars (see .env.example); the published-CSV
// defaults below keep the site working out of the box.
// ─────────────────────────────────────────────────────────────────────────────
import Papa from "papaparse";
import type {
  EpisodeRow,
  EventRow,
  GalleryRow,
  MeetupRow,
  CouncilRow,
} from "@/lib/api";

const SHEET_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjXAxRoqAYbkftm1l2yz-Ib5prf2ujnR9kcd4iCwJON4YSw8S8UucAYRu3GQuhYeH4Za1EoB3U7f3L/pub";

const SHEET_URLS = {
  episodes: process.env.SHEET_EPISODES_URL || `${SHEET_BASE}?gid=0&single=true&output=csv`,
  events: process.env.SHEET_EVENTS_URL || `${SHEET_BASE}?gid=311257018&single=true&output=csv`,
  arohan: process.env.SHEET_AROHAN_URL || `${SHEET_BASE}?gid=842204102&single=true&output=csv`,
  gallery: process.env.SHEET_GALLERY_URL || `${SHEET_BASE}?gid=660048919&single=true&output=csv`,
  council: process.env.SHEET_COUNCIL_URL || `${SHEET_BASE}?gid=1429305251&single=true&output=csv`,
  meetups: process.env.SHEET_MEETUPS_URL || `${SHEET_BASE}?gid=177547042&single=true&output=csv`,
};

// Cache each sheet on the server for 5 minutes (ISR-style).
const REVALIDATE_SECONDS = 300;

async function fetchCSV<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet (HTTP ${res.status})`);
  }
  const csvText = await res.text();
  const parsed = Papa.parse<T>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

export function getEpisodes(): Promise<EpisodeRow[]> {
  return fetchCSV<EpisodeRow>(SHEET_URLS.episodes);
}

export function getGallery(): Promise<GalleryRow[]> {
  return fetchCSV<GalleryRow>(SHEET_URLS.gallery);
}

export function getMeetups(): Promise<MeetupRow[]> {
  return fetchCSV<MeetupRow>(SHEET_URLS.meetups);
}

export function getCouncil(): Promise<CouncilRow[]> {
  return fetchCSV<CouncilRow>(SHEET_URLS.council);
}

// Events = main events sheet + the "Arohan" sheet mapped into EventRow shape.
export async function getEvents(): Promise<EventRow[]> {
  const [mainEvents, arohanEvents] = await Promise.all([
    fetchCSV<EventRow>(SHEET_URLS.events),
    fetchCSV<any>(SHEET_URLS.arohan),
  ]);

  const mappedArohan: EventRow[] = arohanEvents.map((row) => {
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

    return {
      Title: row["Name of Event"]?.trim() || "",
      Category: row["Sub-Category"]?.trim() || "",
      status: row["Status"]?.trim() || "",
      Date: "",
      description: details.join("\n"),
      Speaker: "",
      Image_url: row["Images"]?.trim() || "",
      youtube_url: row["YouTube link"]?.trim() || "",
      meet_link: row["Meet-Link"]?.trim() || "",
      winner: row["Winner "]?.trim() || undefined,
      runnerUp1: row["First Runner-up"]?.trim() || undefined,
      runnerUp2: row["Secong Runner-up"]?.trim() || undefined,
      honourableMentions: row["Honourable mentions "]?.trim() || undefined,
    };
  });

  return [...mainEvents, ...mappedArohan];
}
