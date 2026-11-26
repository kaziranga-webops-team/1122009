import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Every public page, for search engines. The portal is left out: it needs a sign-in. */
const PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/events", priority: 0.9, changeFrequency: "weekly" },
  { path: "/study", priority: 0.9, changeFrequency: "weekly" },
  { path: "/study/notes", priority: 0.8, changeFrequency: "weekly" },
  { path: "/study/revision-sessions", priority: 0.8, changeFrequency: "weekly" },
  { path: "/study/youtube-channels", priority: 0.6, changeFrequency: "monthly" },
  { path: "/study/grade-calculator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/iitm", priority: 0.6, changeFrequency: "monthly" },
  { path: "/meetups", priority: 0.8, changeFrequency: "weekly" },
  { path: "/council", priority: 0.7, changeFrequency: "monthly" },
  { path: "/communities", priority: 0.7, changeFrequency: "monthly" },
  { path: "/gallery", priority: 0.6, changeFrequency: "weekly" },
  { path: "/tak", priority: 0.6, changeFrequency: "weekly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PAGES.map((p) => ({ url: `${SITE_URL}${p.path === "/" ? "" : p.path}`, lastModified: now, changeFrequency: p.changeFrequency, priority: p.priority }));
}
