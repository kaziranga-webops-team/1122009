"use client";

import { useFeed } from "@/lib/feeds";
import data from "@/lib/iitm-data.json";

/** An official IIT Madras BS link, as listed in the IITM corner. */
export interface IitmLink {
  group: string;
  title: string;
  description: string;
  url: string;
  key?: boolean;
}

/** A course's YouTube channel. */
export interface CourseChannel {
  level: string;
  subject: string;
  title: string;
  url: string;
  note?: string;
}

/** The order groups appear in. */
export const IITM_GROUPS = ["Your account", "Exams", "Rules and guidelines", "Help", "Student life", "Careers"];

/** Built-in copies, used until the database tables have rows. */
export const IITM_LINKS: IitmLink[] = data.links;
/** Added in the portal (Website → YouTube channels); none built in. */
export const COURSE_CHANNELS: CourseChannel[] = [];

/**
 * A list kept in the database (edited under Website in the portal), with the
 * built-in copy standing in while the table is empty or unreachable.
 */
function useLive<T>(path: string, fallback: T[]): T[] {
  const rows = useFeed<T[]>(path);
  return Array.isArray(rows) && rows.length > 0 ? rows : fallback;
}

export const useIitmLinks = () => useLive<IitmLink>("/api/iitm-links", IITM_LINKS);
export const useCourseChannels = () => useLive<CourseChannel>("/api/course-channels", COURSE_CHANNELS);

/** Links grouped in display order; an unknown group goes last. */
export function groupLinks(links: IitmLink[]): { title: string; links: IitmLink[] }[] {
  const names = [...IITM_GROUPS, ...Array.from(new Set(links.map((l) => l.group))).filter((g) => !IITM_GROUPS.includes(g))];
  return names.map((title) => ({ title, links: links.filter((l) => l.group === title && l.url) })).filter((g) => g.links.length);
}
