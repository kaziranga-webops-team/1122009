// ─────────────────────────────────────────────────────────────────────────────
// Who the Regional Coordinators are, by region, read from the council list.
// The council sheet names RCs by role ("RC Mumbai", "RC Banglore"), so the
// city is taken from the role and matched to the house's regions, allowing
// for the spellings people actually type.
// ─────────────────────────────────────────────────────────────────────────────
import type { CouncilRow } from "@/lib/api";
import { REGIONS, type Region } from "@/lib/portal/regions";

const ALIASES: Record<string, Region> = {
  bangalore: "Bengaluru",
  banglore: "Bengaluru",
  bengaluru: "Bengaluru",
  bombay: "Mumbai",
  calcutta: "Kolkata",
  madras: "Chennai",
  "new delhi": "Delhi",
};

/** Region → the names of its RCs (a region can have more than one). */
export function rcsByRegion(rows: CouncilRow[]): Partial<Record<Region, string[]>> {
  const out: Partial<Record<Region, string[]>> = {};
  for (const row of rows) {
    const m = /^RC\s+(.+)$/i.exec((row.Role || "").trim());
    const name = (row.Name || "").trim();
    if (!m || !name) continue;
    const city = m[1].trim().toLowerCase();
    const region = REGIONS.find((r) => r.toLowerCase() === city) ?? ALIASES[city];
    if (!region) continue;
    (out[region] ??= []).push(name);
  }
  return out;
}

/** "Ranjana & Yashik", "A, B & C". */
export function joinNames(names: string[] = []): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}
