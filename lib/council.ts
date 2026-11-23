// ─────────────────────────────────────────────────────────────────────────────
// The house council: which year a member served, and where they sit.
//
// Rows carry a tenure ("2026-27"); rows from before tenures existed belong to
// 2025-26. The newest tenure is "the current council" everywhere on the site.
// Where someone sits is read from their council type and role, which are typed
// by hand, so the matching is forgiving.
// ─────────────────────────────────────────────────────────────────────────────
import type { CouncilRow } from "@/lib/api";
import { COMMUNITIES, type Community } from "@/lib/communities";
import { REGIONS, type Region } from "@/lib/portal/regions";

export const FIRST_TENURE = "2025-26";

export const tenureOf = (row: CouncilRow): string => String(row.Tenure || "").trim() || FIRST_TENURE;

/** Every tenure present, newest first. */
export function tenures(rows: CouncilRow[]): string[] {
  return Array.from(new Set(rows.map(tenureOf))).sort().reverse();
}

/** The current council: the newest tenure's rows. */
export function currentCouncil(rows: CouncilRow[]): CouncilRow[] {
  const latest = tenures(rows)[0];
  return latest ? rows.filter((r) => tenureOf(r) === latest) : [];
}

/** "2026-27" → "2026–27", for display. */
export const tenureLabel = (t: string) => t.replace("-", "–");

const REGION_ALIASES: Record<string, Region> = {
  bangalore: "Bengaluru",
  banglore: "Bengaluru",
  bombay: "Mumbai",
  calcutta: "Kolkata",
  madras: "Chennai",
  "new delhi": "Delhi",
};

/** "RC Mumbai" / "Regional Coordinator, Banglore" → the region. */
export function regionFromRole(role: string): Region | null {
  const m = /^(?:rc|regional coordinator)[\s,:-]+(.+)$/i.exec(role.trim());
  if (!m) return null;
  const city = m[1].trim().toLowerCase();
  return REGIONS.find((r) => r.toLowerCase() === city) ?? REGION_ALIASES[city] ?? null;
}

/** "Head, Codest" / "Codest head" → the community. */
export function communityFromRole(role: string, type = ""): Community | null {
  const text = `${role} ${type}`.toLowerCase();
  return (
    COMMUNITIES.find(
      (c) => text.includes(c.name.toLowerCase()) || text.includes(c.slug.replace(/-/g, " ")) || c.aliases?.some((a) => text.includes(a.toLowerCase()))
    ) ?? null
  );
}

export type Tier = "leadership" | "rc" | "heads" | "teams";

export const TIERS: { id: Tier; title: string; line: string }[] = [
  { id: "leadership", title: "House leadership", line: "They lead the house and speak for it." },
  { id: "rc", title: "Regional coordinators", line: "One for each region: meetups, members and everything local." },
  { id: "heads", title: "Community heads", line: "They run the house's communities and their events." },
  { id: "teams", title: "The teams", line: "The people behind every poster, post, video, event and web page." },
];

export function tierOf(row: Pick<CouncilRow, "Role" | "Council Type">): Tier {
  const type = String(row["Council Type"] || "").toLowerCase();
  const role = String(row.Role || "");
  if (type.includes("upper") || type.includes("executive") || type.includes("leadership")) return "leadership";
  if (type.includes("lower") || type.includes("regional") || regionFromRole(role)) return "rc";
  if (type.includes("communit") || (/\bhead\b/i.test(role) && communityFromRole(role, type))) return "heads";
  return "teams";
}

/** Free-text team names folded into the house's teams. */
export function teamOf(rawType: string): string {
  const t = rawType.toLowerCase().trim();
  if (t.includes("web")) return "Web";
  if (t.includes("graphic") || t.includes("design")) return "Design";
  if (t.includes("pr") || t.includes("outreach") || t.includes("public relations")) return "PR & outreach";
  if (t.includes("content")) return "Content";
  if (t.includes("video") || t.includes("edit") || t.includes("film") || t.includes("media")) return "Video";
  if (t.includes("event") || t.includes("manage") || t.includes("plan")) return "Events";
  return rawType.trim() ? rawType.trim().replace(/\b\w/g, (c) => c.toUpperCase()) : "Other";
}

export const TEAM_ORDER = ["Events", "Design", "Content", "PR & outreach", "Video", "Web"];
