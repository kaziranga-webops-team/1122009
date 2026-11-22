import type { LucideIcon } from "lucide-react";
import { FileText, FileType2, HardDrive, Link2, NotebookText, PlayCircle } from "lucide-react";
import type { Level } from "@/lib/study/subjects";

export type ResourceKindId = "pdf" | "video" | "drive" | "doc" | "link" | "notes";

export type Resource = {
  id: string;
  title: string;
  /** Where "Open" goes: a PDF, Drive folder, YouTube video, Google Doc or any page. */
  url: string;
  level: Level;
  /** Must match a subject name in SUBJECTS (lib/study/subjects.ts). */
  subject: string;
  /** Leave out to guess from the URL. */
  kind?: ResourceKindId;
  /** Who shared it. */
  author?: string;
  tags?: string[];
};

/**
 * Notes and study material shown on /study/notes. Add entries here, e.g.
 *
 *   {
 *     id: "stats1-week1-notes",
 *     title: "Week 1 notes: describing data",
 *     url: "https://drive.google.com/...",
 *     level: "Foundation",
 *     subject: "Statistics for Data Science I",
 *     author: "Kaziranga House",
 *     tags: ["week 1", "summary"],
 *   },
 */
export const RESOURCES: Resource[] = [];

export type ResourceKind = { label: string; icon: LucideIcon; tone: string };

const KINDS: Record<ResourceKindId, ResourceKind> = {
  pdf: { label: "PDF", icon: FileText, tone: "bg-[#c8102e]/10 text-[#c8102e]" },
  video: { label: "Video", icon: PlayCircle, tone: "bg-[#c8102e]/10 text-[#c8102e]" },
  drive: { label: "Drive", icon: HardDrive, tone: "bg-[#e3a936]/20 text-[#9c5d14]" },
  doc: { label: "Doc", icon: FileType2, tone: "bg-[#0f5e48]/10 text-[#0f5e48]" },
  link: { label: "Link", icon: Link2, tone: "bg-[#1c130c]/8 text-[#5e4a35]" },
  notes: { label: "Notes", icon: NotebookText, tone: "bg-[#0f5e48]/10 text-[#0f5e48]" },
};

export function getResourceKind(resource: Resource): ResourceKind {
  if (resource.kind) return KINDS[resource.kind];
  const url = resource.url.toLowerCase();
  if (/youtu\.?be/.test(url)) return KINDS.video;
  if (url.endsWith(".pdf")) return KINDS.pdf;
  if (url.includes("docs.google.com")) return KINDS.doc;
  if (url.includes("drive.google.com")) return KINDS.drive;
  if (url.startsWith("http")) return KINDS.link;
  return KINDS.notes;
}
