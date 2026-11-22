import type { LucideIcon } from "lucide-react";
import { BookMarked, Calculator, Library, Link2, NotebookText, ScrollText, TrendingUp, Youtube } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Hub items                                                          */
/* ------------------------------------------------------------------ */

/**
 * `opens` decides how an item is shown:
 * - "panel": short reference content, opened over the page via ?open=<slug>
 * - "page":  interactive tools that need room, at /hub/<slug>
 * - "link":  lives elsewhere on the site
 */
export type HubGroupId = "grades" | "documents" | "study";
export type HubOpens = "panel" | "page" | "link";

export type HubItem = {
  slug: string;
  title: string;
  summary: string;
  icon: LucideIcon;
  group: HubGroupId;
  opens: HubOpens;
  linkHref?: string;
  /** Shows a "Coming soon" tag on the hub card. */
  comingSoon?: boolean;
};

export const HUB_PATH = "/study";

export const HUB_GROUPS: { id: HubGroupId; title: string; description: string }[] = [
  { id: "grades", title: "Grades", description: "Work out where you stand and what you need." },
  { id: "documents", title: "Rules and documents", description: "Official handbooks, grading rules and portals." },
  { id: "study", title: "Study help", description: "Notes, videos and books for every subject." },
];

export const HUB_ITEMS: HubItem[] = [
  {
    slug: "grade-predictor",
    title: "Grade predictor",
    summary: "See the end-term score you need for each grade.",
    icon: TrendingUp,
    group: "grades",
    opens: "page",
    comingSoon: true,
  },
  {
    slug: "grade-calculator",
    title: "GPA and CGPA calculator",
    summary: "Turn your grades into a term GPA and overall CGPA.",
    icon: Calculator,
    group: "grades",
    opens: "page",
  },
  {
    slug: "student-handbook",
    title: "Student handbook",
    summary: "Rules, grading and policies for your programme.",
    icon: BookMarked,
    group: "documents",
    opens: "panel",
    comingSoon: true,
  },
  {
    slug: "grading-documents",
    title: "Grading documents",
    summary: "How each course is graded, programme by programme.",
    icon: ScrollText,
    group: "documents",
    opens: "panel",
    comingSoon: true,
  },
  {
    slug: "important-links",
    title: "Important links",
    summary: "Student portal, course forums and other official sites.",
    icon: Link2,
    group: "documents",
    opens: "panel",
    comingSoon: true,
  },
  {
    slug: "notes",
    title: "Notes and study material",
    summary: "Notes, cheat sheets and links shared by students, by subject.",
    icon: NotebookText,
    group: "study",
    opens: "page",
  },
  {
    slug: "youtube-channels",
    title: "YouTube channels",
    summary: "Channels that explain each subject well.",
    icon: Youtube,
    group: "study",
    opens: "page",
    comingSoon: true,
  },
  {
    slug: "recommended-books",
    title: "Recommended books",
    summary: "Books and PDFs suggested for each subject.",
    icon: Library,
    group: "study",
    opens: "page",
    comingSoon: true,
  },
];

export function getHubItem(slug: string): HubItem {
  const item = HUB_ITEMS.find((t) => t.slug === slug);
  if (!item) throw new Error(`Unknown hub item: ${slug}`);
  return item;
}

export function getHubHref(item: HubItem): string {
  if (item.opens === "panel") return `${HUB_PATH}?open=${item.slug}`;
  if (item.opens === "link") return item.linkHref ?? HUB_PATH;
  return `${HUB_PATH}/${item.slug}`;
}

export const PANEL_SLUGS = HUB_ITEMS.filter((i) => i.opens === "panel").map((i) => i.slug);

/* ------------------------------------------------------------------ */
/*  Programmes and documents                                           */
/* ------------------------------------------------------------------ */

export type Programme = { id: "ds" | "es" | "ae" | "mg"; short: string; name: string };

export const PROGRAMMES: Programme[] = [
  { id: "ds", short: "DS", name: "Data Science and Applications" },
  { id: "es", short: "ES", name: "Electronic Systems" },
  { id: "ae", short: "AE", name: "Aeronautics and Space Technology" },
  { id: "mg", short: "MG", name: "Management and Data Science" },
];

export type ToolDocument = {
  programme: Programme["id"];
  title: string;
  /** e.g. "January 2027 term". */
  edition: string;
  /** Empty shows "Link coming soon". */
  url: string;
};

export const STUDENT_HANDBOOKS: ToolDocument[] = PROGRAMMES.map((p) => ({
  programme: p.id,
  title: `${p.name} handbook`,
  edition: "",
  url: "",
}));

export const GRADING_DOCUMENTS: ToolDocument[] = PROGRAMMES.map((p) => ({
  programme: p.id,
  title: `${p.name} grading document`,
  edition: "",
  url: "",
}));

/* ------------------------------------------------------------------ */
/*  Links                                                              */
/* ------------------------------------------------------------------ */

export type ToolLink = {
  id: string;
  title: string;
  description: string;
  /** Empty shows "Link coming soon". */
  url: string;
  /** Also show it in the hub's Quick links row. */
  quick?: boolean;
};

export const IMPORTANT_LINK_GROUPS: { title: string; links: ToolLink[] }[] = [
  {
    title: "Your account",
    links: [{ id: "student-portal", title: "Student portal", description: "Dashboard, marks and exam registration", url: "", quick: true }],
  },
  {
    title: "Courses",
    links: [
      { id: "course-portal", title: "Course portal", description: "Lectures, assignments and weekly content", url: "" },
      { id: "discourse", title: "Discourse", description: "Course forums and announcements", url: "", quick: true },
    ],
  },
  {
    title: "Calendar and exams",
    links: [
      { id: "academic-calendar", title: "Academic calendar", description: "Term dates, quiz and end-term schedule", url: "" },
      { id: "exam-information", title: "Exam information", description: "Hall tickets, centres and exam rules", url: "" },
    ],
  },
  {
    title: "Help",
    links: [{ id: "support", title: "Student support", description: "Raise a query with the programme team", url: "" }],
  },
];

export const QUICK_LINKS = IMPORTANT_LINK_GROUPS.flatMap((g) => g.links).filter((l) => l.quick);

export const INTERNAL_QUICK_LINKS: { title: string; description: string; href: string }[] = [
  { title: "Grade calculator", description: "Term GPA and CGPA", href: "/study/grade-calculator" },
  { title: "Grading documents", description: "Grading by programme", href: "/study?open=grading-documents" },
  { title: "Student handbook", description: "Rules and policies", href: "/study?open=student-handbook" },
];

/* ------------------------------------------------------------------ */
/*  Grades                                                             */
/* ------------------------------------------------------------------ */

/** Check against the current grading document. */
export const GRADE_SCALE = [
  { grade: "S", points: 10, minScore: 90 },
  { grade: "A", points: 9, minScore: 80 },
  { grade: "B", points: 8, minScore: 70 },
  { grade: "C", points: 7, minScore: 60 },
  { grade: "D", points: 6, minScore: 50 },
  { grade: "E", points: 4, minScore: 40 },
  { grade: "U", points: 0, minScore: 0 },
] as const;

export type LetterGrade = (typeof GRADE_SCALE)[number]["grade"];

/* ------------------------------------------------------------------ */
/*  Per-subject study lists                                            */
/* ------------------------------------------------------------------ */

export type YouTubeChannel = { name: string; note: string; url: string };
export type Book = { title: string; author: string; kind: "pdf" | "link"; url: string };

/**
 * Keyed by the subject name exactly as in SUBJECTS (lib/study/subjects.ts), e.g.
 *   "Statistics for Data Science I": [{ name: "...", note: "...", url: "https://youtube.com/@..." }],
 */
export const YOUTUBE_CHANNELS: Record<string, YouTubeChannel[]> = {};

/** Same keys as YOUTUBE_CHANNELS. */
export const RECOMMENDED_BOOKS: Record<string, Book[]> = {};

/** The house study circle: peers to study with across houses. */
export const STUDY_CIRCLE = {
  label: "Join the study circle",
  url: "https://forms.gle/kKBmVCAu8UwtpcpN8",
  description: "Study with peers across houses: assignments, course material and exam prep, together.",
};
