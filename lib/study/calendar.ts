"use client";

import { useFeed } from "@/lib/feeds";

/** One date on the IIT Madras BS academic calendar (Website → Academic calendar in the portal). */
export type AcademicDate = {
  title: string;
  kind: string;
  /** YYYY-MM-DD */
  starts_on: string;
  /** YYYY-MM-DD, or '' for a single day. */
  ends_on: string;
  audience: string;
  term: string;
  note: string;
  url: string;
};

/** The dates worth studying for: highlighted on the calendar, with a countdown in the Study zone. */
export const EXAM_KINDS = ["Quiz", "OPPE", "End term", "Exam"];

export const OFFICIAL_CALENDAR = "https://study.iitm.ac.in/ds/academic_calendar.html";

/** Colours per kind, from the site's own palette. */
export const KIND_COLOURS: Record<string, { bg: string; ink: string }> = {
  Quiz: { bg: "#c8102e", ink: "#fff" },
  OPPE: { bg: "#2343b8", ink: "#fff" },
  "End term": { bg: "#1c130c", ink: "#f6b51e" },
  Exam: { bg: "#e2387a", ink: "#fff" },
  Results: { bg: "#0f5e48", ink: "#f5e9cf" },
  Registration: { bg: "#f6b51e", ink: "#1c130c" },
  Term: { bg: "#9c5d14", ink: "#fff" },
};
export const kindColour = (kind: string) => KIND_COLOURS[kind] ?? { bg: "#ebd9b2", ink: "#1c130c" };

/** Today in India, as YYYY-MM-DD. */
export function todayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Whole days from one YYYY-MM-DD to another (negative when it has passed). */
export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

/** "Today", "Tomorrow", "in 5 days", "in 3 weeks". */
export function countdown(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `in ${days} days`;
  const weeks = Math.floor(days / 7);
  return `in ${weeks} week${weeks === 1 ? "" : "s"}`;
}

/** "Sun 15 Nov" or, with the year, "Sun 15 Nov 2026". */
export function showDay(day: string, withYear = false): string {
  const d = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)));
  return d.toLocaleDateString("en-IN", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });
}

/** Does a date concern this audience? "Everyone" dates concern all. */
export const forAudience = (d: AcademicDate, audience: string) =>
  audience === "All" || d.audience === audience || d.audience === "Everyone";

/**
 * The exams coming up for term students (quizzes, OPPEs, end terms), soonest
 * first: the Study zone's countdown. A window that has begun but not ended
 * still counts.
 */
export function upcomingExams(dates: AcademicDate[], within = 21, audience = "Term students"): (AcademicDate & { days: number })[] {
  const today = todayInIndia();
  return dates
    .filter((d) => EXAM_KINDS.includes(d.kind) && forAudience(d, audience))
    .map((d) => ({ ...d, days: daysBetween(today, d.starts_on), last: d.ends_on || d.starts_on }))
    .filter((d) => d.days <= within && daysBetween(today, d.last) >= 0)
    .sort((a, b) => a.days - b.days);
}

/** The calendar, shared across pages for the visit. */
export function useAcademicDates(): AcademicDate[] | undefined {
  const rows = useFeed<AcademicDate[]>("/api/academic-dates");
  return Array.isArray(rows) ? rows : undefined;
}
