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
// The live list is in the database (Website → Study
// resources); these show until it has rows, and a link in both appears once.
export const RESOURCES: Resource[] = [
  {id: "res-1",title: "Maths 1 Lecture Notes",url: "https://drive.google.com/drive/folders/12Eh_fmj2fyluHFVvc0jnch-cXZcrf2an?usp=drive_link",level: "Foundation",subject: "Mathematics for Data Science I",tags: ["Notes"]},
  {id: "res-2",title: "Maths 1 Week 1-12 Notes",url: "https://drive.google.com/file/d/1o_5SKqF4jncMt0RMmoN2pr2Ac4k8AAoc/view",level: "Foundation",subject: "Mathematics for Data Science I",kind: "pdf",tags: ["Notes"]},
  {id: "res-3",title: "Stats 1 Week 1-12 Resources by TA (Jan 2025)",url: "https://discourse.onlinedegree.iitm.ac.in/t/resources-by-ta-january-2025/167818?u=ks_030",level: "Foundation",subject: "Statistics for Data Science I",tags: ["Notes"]},
  {id: "res-4",title: "Computational Thinking Notes (Week 1-12)",url: "https://drive.google.com/file/d/1ONSILLrGO2lWVUTt__q3gLkGe-Cf8QJf/view",level: "Foundation",subject: "Computational Thinking",kind: "pdf",tags: ["Notes"]},
  {id: "res-5",title: "Maths 2 Master Resources Folder",url: "https://drive.google.com/drive/folders/1XZgCWEb_nz6xLyQENB7NIXjyghCU8a3_",level: "Foundation",subject: "Mathematics for Data Science II",tags: ["Notes"]},
  {id: "res-6",title: "Maths 2 Lecture Notes",url: "https://drive.google.com/drive/folders/1fJglD_YRDx2HhsQWoRgq3MsV0K9QcHAf",level: "Foundation",subject: "Mathematics for Data Science II",tags: ["Notes"]},
  {id: "res-7",title: "Maths 2 Week-Wise Question Bank (Quizzes & End Term)",url: "https://drive.google.com/drive/folders/16vvboLqwnOxT0vHpSZlGWRG-owv8qjim?usp=sharing",level: "Foundation",subject: "Mathematics for Data Science II",tags: ["Past papers"]},
  {id: "res-8",title: "Python Complete Resources Folder",url: "https://drive.google.com/drive/folders/1O7w1hXO6d0uptWs1U4BCMGVEdfSDxNWo",level: "Foundation",subject: "Programming in Python",tags: ["Notes"]},
  {id: "res-9",title: "Stats 2 Handwritten Notes",url: "https://drive.google.com/file/d/1YVoi1kZ0dn6CQ8r-onzhJY5FGGbHO9yM/view?usp=drivesdk",level: "Foundation",subject: "Statistics for Data Science II",kind: "pdf",tags: ["Notes"]},
  {id: "res-10",title: "Seeing Theory - Visual & Interactive Probability",url: "https://seeing-theory.brown.edu/",level: "Foundation",subject: "Statistics for Data Science II"},
  {id: "res-11",title: "Stats 2 Portal Notes",url: "https://drive.google.com/file/d/1FWfTXjAGpefU-jCmarmpBzXwe17DF7op/view?usp=drivesdk",level: "Foundation",subject: "Statistics for Data Science II",kind: "pdf",tags: ["Notes"]},
  {id: "res-12",title: "Stats 2 Formula Sheet (Exam Reference)",url: "https://drive.google.com/file/d/1SMfcJkxe4gOA6nN_FpytV-Y9ZEO3lbrX/view?usp=drivesdk",level: "Foundation",subject: "Statistics for Data Science II",kind: "pdf",tags: ["Cheat sheet"]},
  {id: "res-13",title: "MLF Short Notes (GitHub)",url: "https://github.com/24f2007032/iitm_notebooks/tree/main/diploma/mlf",level: "Diploma",subject: "Machine Learning Foundations",tags: ["Cheat sheet"]},
  {id: "res-14",title: "MLF Handwritten Notes Folder",url: "https://drive.google.com/drive/folders/1ODZY3E2PcsaFrzIHPo5lUhQZaBszZxxS",level: "Diploma",subject: "Machine Learning Foundations",tags: ["Notes"]},
  {id: "res-15",title: "MLF Handwritten Notes (Complete PDF)",url: "https://drive.google.com/file/d/1xBiUFAqtq8w4ig78EZphwenk0IkiS1x5/view?usp=sharing",level: "Diploma",subject: "Machine Learning Foundations",kind: "pdf",tags: ["Notes"]},
  {id: "res-16",title: "MLF PYQs & Practice Questions Portal",url: "https://23f3004032.github.io/MLF/",level: "Diploma",subject: "Machine Learning Foundations",tags: ["Past papers"]},
  {id: "res-17",title: "System Commands & Linux Study Resources",url: "https://drive.google.com/drive/folders/1PsMUC0fAMCNVB5HVgZ_TZQC3CWhT5K3g",level: "Diploma",subject: "System Commands",tags: ["Notes"]},
  {id: "res-18",title: "MLT Important Live Sessions Index (Karthik Sir)",url: "https://docs.google.com/spreadsheets/d/1XNpRJdf0VnL5ijqvseWZIKvIrOTfl024U7us1_ZdlIo/edit?usp=drive_link",level: "Diploma",subject: "Machine Learning Techniques",kind: "doc",tags: ["Video"]},
  {id: "res-19",title: "MLT Quick Refresher Notes (mlt.pulki.in)",url: "http://mlt.pulki.in/",level: "Diploma",subject: "Machine Learning Techniques",tags: ["Cheat sheet"]},
  {id: "res-20",title: "MLT Master Study Drive ('Everything You Need')",url: "https://drive.google.com/drive/folders/1VainWUo5k_O_0nzgBpURFD2actXJzqbf?usp=drive_link",level: "Diploma",subject: "Machine Learning Techniques",tags: ["Notes"]},
  {id: "res-21",title: "MLT Weekly AQ - PQ Resources (Discourse)",url: "https://discourse.onlinedegree.iitm.ac.in/t/cs2007-machine-learning-techniques-weekly-resources/183405",level: "Diploma",subject: "Machine Learning Techniques",tags: ["Past papers"]},
  {id: "res-22",title: "MLT Supplementary Study Contents",url: "https://drive.google.com/drive/folders/1zF2PLORTQ0lonfLpdKbcw2-mjH9LwNZ-",level: "Diploma",subject: "Machine Learning Techniques",tags: ["Notes"]},
  {id: "res-23",title: "MAD 1 Study Notes (By Himanshu)",url: "https://github.com/23f2001665/mad1-notes-mine",level: "Diploma",subject: "Modern Application Development I",tags: ["Notes"]},
  {id: "res-24",title: "PDSA Official Portal & Resources",url: "https://pdsaiitm.github.io/",level: "Diploma",subject: "Programming, Data Structures and Algorithms using Python",tags: ["Notes"]},
  {id: "res-25",title: "PDSA Notes (By Kshitij Maheshwari)",url: "https://drive.google.com/drive/folders/1VxQrN3l2d1K3KPBDl8ip-7QyqSOD9rrC?usp=sharing",level: "Diploma",subject: "Programming, Data Structures and Algorithms using Python",tags: ["Notes"]},
  {id: "res-26",title: "PDSA Short Notes (GitHub)",url: "https://github.com/24f2007032/iitm_notebooks/tree/main/diploma/pdsa",level: "Diploma",subject: "Programming, Data Structures and Algorithms using Python",tags: ["Cheat sheet"]},
  {id: "res-27",title: "MLP Notes & Syllabus Summary",url: "https://mlp-summary.pages.dev/#syllabus",level: "Diploma",subject: "Machine Learning Practice",tags: ["Notes"]},
  {id: "res-28",title: "Best Resources of MLP (By MLP TA)",url: "https://docs.google.com/spreadsheets/d/1R_CvHn29t4x2TKfp9l7FBn45qBFiAwcakx4jpfNdnsU/edit?usp=sharing",level: "Diploma",subject: "Machine Learning Practice",kind: "doc",tags: ["Notes"]},
  {id: "res-29",title: "Java Weekly Summaries & Notes",url: "https://javaiitmbs.github.io/index.html",level: "Diploma",subject: "Programming Concepts using Java",tags: ["Notes"]},
  {id: "res-30",title: "Java CS2005 Online Textbook",url: "https://bsjavacs2005.github.io/javacs2005notes/index.html#",level: "Diploma",subject: "Programming Concepts using Java",tags: ["Notes"]},
  {id: "res-31",title: "JAVA OPPE - Full Practice Programming Set (HackerRank)",url: "https://www.hackerrank.com/contests/java-practice-programming-questions/challenges",level: "Diploma",subject: "Programming Concepts using Java",kind: "link",tags: ["Past papers"]},
  {id: "res-32",title: "JAVA OPPE-1 (Sept 25) Contest",url: "https://www.hackerrank.com/java-oppe-1-sept-25",level: "Diploma",subject: "Programming Concepts using Java",kind: "link",tags: ["Past papers"]},
  {id: "res-33",title: "JAVA OPPE-1 (Sept 25 Practice) Contest",url: "https://www.hackerrank.com/java-oppe-1-sept-25-1763954428",level: "Diploma",subject: "Programming Concepts using Java",kind: "link",tags: ["Past papers"]},
  {id: "res-34",title: "JAVA OPPE-2 Sept 25 (7 Dec 2025) Contest",url: "https://www.hackerrank.com/java-oppe-2-sept-25",level: "Diploma",subject: "Programming Concepts using Java",kind: "link",tags: ["Past papers"]},
  {id: "res-35",title: "JAVA OPPE-2 Sept 25 (14 Dec 2025) Contest",url: "https://www.hackerrank.com/java-oppe-2-sept-25-14-dec-2025",level: "Diploma",subject: "Programming Concepts using Java",kind: "link",tags: ["Past papers"]},
  {id: "res-36",title: "JAVA OPPE-1 May 25 (19 July) Contest",url: "https://www.hackerrank.com/java-oppe-1-may25-19-july",level: "Diploma",subject: "Programming Concepts using Java",kind: "link",tags: ["Past papers"]},
  {id: "res-37",title: "DBMS Short Notes (GitHub)",url: "https://github.com/24f2007032/iitm_notebooks/tree/main/diploma/dbms",level: "Diploma",subject: "Database Management Systems",tags: ["Cheat sheet"]},
  {id: "res-38",title: "DBMS OPE Practice Portal (dbms.ishan.page)",url: "https://dbms.ishan.page/",level: "Diploma",subject: "Database Management Systems",tags: ["Past papers"]},
  {id: "res-39",title: "Financial Accounting Study Resources Folder",url: "https://drive.google.com/drive/folders/1jC9SM77jVSnQ7ISMaBFiRaxBvSAOPNGn?usp=drive_link",level: "Diploma",subject: "financial accounting",tags: ["Notes"]},
];

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
