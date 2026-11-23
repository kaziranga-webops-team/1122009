import type { LucideIcon } from "lucide-react";
import { BookMarked, Calculator, Library, Link2, MonitorPlay, NotebookText, ScrollText, TrendingUp, Youtube } from "lucide-react";

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
  },
  {
    slug: "grading-documents",
    title: "Grading documents",
    summary: "How each course is graded, programme by programme.",
    icon: ScrollText,
    group: "documents",
    opens: "panel",
  },
  {
    slug: "revision-sessions",
    title: "Revision sessions",
    summary: "Live revision before quizzes and end terms, and every recording.",
    icon: MonitorPlay,
    group: "study",
    opens: "page",
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
    summary: "The YouTube channel for each course, by subject.",
    icon: Youtube,
    group: "study",
    opens: "page",
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

/**
 * The current handbooks and grading documents. These are the fallback: the
 * Study zone reads the live ones from the database (Website → Study links in
 * the portal), so update them there.
 */
const DOC_LINKS: Record<Programme["id"], { handbook: string; grading: string }> = {
  ds: { handbook: "https://tinyurl.com/ycjb2xh5", grading: "https://tinyurl.com/bd8khp9u" },
  es: { handbook: "https://tinyurl.com/a94xbwtn", grading: "https://tinyurl.com/3x8nhhp7" },
  mg: { handbook: "https://tinyurl.com/yszrdpty", grading: "https://tinyurl.com/ybcysabk" },
  ae: { handbook: "https://tinyurl.com/9sunhp3h", grading: "https://tinyurl.com/yvjt2vfk" },
};

export const STUDENT_HANDBOOKS: ToolDocument[] = PROGRAMMES.map((p) => ({
  programme: p.id,
  title: `${p.name} handbook`,
  edition: "",
  url: DOC_LINKS[p.id].handbook,
}));

export const GRADING_DOCUMENTS: ToolDocument[] = PROGRAMMES.map((p) => ({
  programme: p.id,
  title: `${p.name} grading document`,
  edition: "Sept 2026 term",
  url: DOC_LINKS[p.id].grading,
}));

/** Rows from /api/study-links, laid over the fallback lists. */
export function withLiveLinks(
  docs: ToolDocument[],
  rows: { Degree: string; "Student Handbook": string; "Grading Doc": string }[],
  field: "Student Handbook" | "Grading Doc"
): ToolDocument[] {
  return docs.map((d) => {
    const row = rows.find((r) => r.Degree.trim().toLowerCase() === d.programme);
    const url = row?.[field]?.trim();
    return url ? { ...d, url } : d;
  });
}

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
    links: [
      { id: "student-portal", title: "Student portal", description: "Dashboard, courses, marks and exam registration", url: "https://study.iitm.ac.in/", quick: true },
      { id: "course-planner", title: "Course planner", description: "The official planner for choosing your courses", url: "https://course-planner-140256174016.asia-south1.run.app/login", quick: true },
    ],
  },
  {
    title: "Rules and guidelines",
    links: [
      { id: "interaction-guidelines", title: "Student interaction guidelines", description: "How students are expected to interact online", url: "https://docs.google.com/document/u/1/d/1eSfJLWW-SChkbMkxMWnmWILx0bUY7PfRChwaAw0KJbE/pub" },
      { id: "academic-guidelines", title: "Academic and non-academic guidelines", description: "The programme's code of conduct", url: "https://docs.google.com/document/d/e/2PACX-1vS2io0kg4RefmBjePUznBvOly1aZFnuiSMPlVevnl6ElWetIbGsR25Haz2-81Y1xnwsibjUxmOGkAbd/pub" },
    ],
  },
  {
    title: "Beyond the course",
    links: [{ id: "paradox", title: "Paradox", description: "The BS degree's annual fest", url: "https://iitmparadox.org/", quick: true }],
  },
  {
    title: "Help",
    links: [{ id: "grievance", title: "Student grievance form", description: "Raise a grievance with the programme", url: "https://forms.gle/jX8zK8XhDoZcA3YB9", quick: true }],
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
  description: "Open to every IIT Madras BS student, whatever your house: study with peers for assignments, course material and exam prep.",
};
