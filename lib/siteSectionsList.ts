/**
 * The parts of the site the super admin can switch off from the portal
 * (Website → Sections). Home sections are hidden on the home page; a page
 * that is off leaves the menus and shows a short note instead.
 */
export const HOME_SECTIONS = [
  "Home · Named for a floodplain",
  "Home · Three steps into the house",
  "Home · What the house does",
  "Home · Poster wall",
  "Home · Communities",
  "Home · Lately in the house",
  "Home · Council",
  "Home · Join the house",
] as const;

export const SITE_PAGES: { name: string; path: string }[] = [
  { name: "Page · Communities", path: "/communities" },
  { name: "Page · Council", path: "/council" },
  { name: "Page · Gallery", path: "/gallery" },
  { name: "Page · Meetups", path: "/meetups" },
  { name: "Page · Events", path: "/events" },
  { name: "Page · Kaziranga Tak", path: "/tak" },
];

export const SITE_SECTIONS = [...HOME_SECTIONS, ...SITE_PAGES.map((p) => p.name)];
