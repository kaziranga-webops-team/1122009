"use client";

import { useEffect, useState } from "react";

export { SITE_IMAGE_SLOTS, type SiteImageSlot } from "@/lib/siteImageSlots";

type SiteImage = { url: string; alt: string };

let loaded: Promise<Record<string, SiteImage>> | null = null;

function load(): Promise<Record<string, SiteImage>> {
  loaded ??= fetch("/api/site-images")
    .then((r) => (r.ok ? r.json() : []))
    .then((rows: { slot: string; url: string; alt: string }[]) =>
      Object.fromEntries((Array.isArray(rows) ? rows : []).filter((r) => r.url).map((r) => [r.slot, { url: r.url, alt: r.alt }]))
    )
    .catch(() => ({}));
  return loaded;
}

/** The uploaded pictures, by slot; empty until they arrive (and if there are none). */
export function useSiteImages(): Record<string, SiteImage> {
  const [map, setMap] = useState<Record<string, SiteImage>>({});
  useEffect(() => {
    let alive = true;
    void load().then((m) => alive && setMap(m));
    return () => {
      alive = false;
    };
  }, []);
  return map;
}
