/**
 * Every picture on the site that the super admin can swap from the portal
 * (Website → Site images). Each slot is named by where it appears, so the
 * list in the portal reads like a map of the site. Without an upload, the
 * page keeps its built-in artwork.
 */
export const SITE_IMAGE_SLOTS = [
  "Home · About · A vibrant community",
  "Home · About · Social gatherings",
  "Home · About · Competitions",
  "Home · About · Personal growth",
  "Home · What the house does · Meetups",
  "Home · What the house does · Events",
  "Home · What the house does · Study Zone",
  "Home · What the house does · Kaziranga Tak",
  "Home · Poster wall · Kaziranga",
  "Home · Poster wall · Aarohan",
  "Home · Poster wall · Meetups across India",
  "Home · Join the house",
  "Study zone · Notes",
  "Study zone · Revision sessions",
  "Study zone · YouTube channels",
  "Study zone · GPA calculator",
] as const;

export type SiteImageSlot = (typeof SITE_IMAGE_SLOTS)[number];
