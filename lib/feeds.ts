"use client";

import { useEffect, useState } from "react";
import { fetchCouncil, fetchEpisodes, fetchEvents, fetchGallery, fetchMeetups } from "@/lib/api";

/**
 * The site's public data feeds (/api/…), fetched once per visit and shared by
 * every page that asks. Going back to a page shows its content at once
 * instead of fetching it again, and a page can render what is already here on
 * its very first frame.
 */
const promises = new Map<string, Promise<unknown>>();
const values = new Map<string, unknown>();

/** The feed's data, from this visit's copy when there is one; null if it could not be had. */
export function loadFeed<T>(path: string): Promise<T | null> {
  let p = promises.get(path) as Promise<T | null> | undefined;
  if (!p) {
    p = fetch(path)
      .then((r) => (r.ok ? (r.json() as Promise<T>) : null))
      .then((v) => {
        if (v === null) promises.delete(path);
        else values.set(path, v);
        return v;
      })
      .catch(() => {
        promises.delete(path);
        return null;
      });
    promises.set(path, p);
  }
  return p;
}

/** What is already loaded for a feed, without asking for it. */
export function peekFeed<T>(path: string): T | undefined {
  return values.get(path) as T | undefined;
}

/** A feed as component state: what is already here first, then the loaded copy. */
export function useFeed<T>(path: string): T | undefined {
  const [value, setValue] = useState<T | undefined>(() => peekFeed<T>(path));
  useEffect(() => {
    let alive = true;
    void loadFeed<T>(path).then((v) => {
      if (alive && v !== null) setValue(v);
    });
    return () => {
      alive = false;
    };
  }, [path]);
  return value;
}

const FEEDS = [
  "/api/academic-dates",
  "/api/house-events",
  "/api/revision-sessions",
  "/api/study-resources",
  "/api/study-links",
  "/api/iitm-links",
  "/api/course-channels",
  "/api/communities",
];

let warmed = false;

/**
 * Once the page in front of you has settled, quietly fetches what the other
 * pages show (all small JSON from the CDN), so the next page opens with its
 * content already in place rather than filling in a moment later.
 */
export function warmPublicData(): void {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  // Not on a slow or data-saving connection.
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || "")) return;
  const run = () => {
    for (const f of [fetchEvents, fetchMeetups, fetchCouncil, fetchEpisodes, fetchGallery]) void f().catch(() => {});
    for (const path of FEEDS) void loadFeed(path);
  };
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  window.setTimeout(() => (idle ? idle(run, { timeout: 4000 }) : run()), 1500);
}
