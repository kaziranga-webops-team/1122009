"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentProps } from "react";
import { ArrowUpRight, Clock, FileText, Info } from "lucide-react";
import {
  GRADE_SCALE,
  GRADING_DOCUMENTS,
  PROGRAMMES,
  STUDENT_HANDBOOKS,
  withLiveLinks,
  type ToolDocument,
  type ToolLink as ToolLinkItem,
} from "@/lib/study/hub";

export const card = "rounded-[1.5rem] border border-[#1c130c]/10 bg-[#ebd9b2]";
export const inputClass =
  "h-11 w-full rounded-xl border border-[#1c130c]/15 bg-[#f5e9cf] px-3.5 text-[0.9rem] text-[#1c130c] placeholder:text-[#5e4a35]/70 transition-colors focus:border-[#0f5e48] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f5e48]/25";

/** Set when a panel was opened in-app, so closing it can step back instead of stacking history. */
export const PANEL_OPENED_KEY = "kz-hub-panel-opened";

/** A link to ?open=<slug> that keeps the scroll position and marks the open as in-app. */
export function PanelLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      scroll={false}
      onClick={(event) => {
        try {
          sessionStorage.setItem(PANEL_OPENED_KEY, "1");
        } catch {}
        onClick?.(event);
      }}
    />
  );
}

/** A row's single action. An empty URL shows "Link coming soon" instead of a dead link. */
export function ToolLink({ url, label, accessibleName }: { url: string; label: string; accessibleName: string }) {
  if (!url) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1c130c]/6 px-3 py-1.5 text-[0.75rem] font-semibold text-[#5e4a35]">
        <Clock size={13} aria-hidden="true" />
        Link coming soon
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${accessibleName} (opens in a new tab)`}
      className="kz-focus inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[0.82rem] font-bold text-[#0f5e48] transition-colors hover:bg-[#0f5e48]/10"
    >
      {label}
      <ArrowUpRight size={14} aria-hidden="true" />
    </a>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 rounded-2xl bg-[#e3a936]/15 px-4 py-3 text-[0.85rem] font-medium text-[#5e4a35]">
      <Info size={17} className="mt-px shrink-0 text-[#9c5d14]" aria-hidden="true" />
      {children}
    </p>
  );
}

export function DocumentList({ documents, kind }: { documents: ToolDocument[]; kind: string }) {
  if (documents.length === 0) {
    return <p className="rounded-2xl bg-[#ebd9b2] px-4 py-3 text-[0.85rem] text-[#5e4a35]">No documents have been added yet.</p>;
  }
  return (
    <div className="space-y-3">
      {documents.every((d) => !d.url) && <Note>We&apos;re collecting the latest versions. Links appear here as soon as they&apos;re added.</Note>}
      <ul className={`${card} divide-y divide-[#1c130c]/10 overflow-hidden`}>
        {documents.map((doc) => {
          const programme = PROGRAMMES.find((p) => p.id === doc.programme);
          return (
            <li key={`${doc.programme}-${doc.title}`} className="flex items-center gap-3.5 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0f5e48]/10 text-[#0f5e48]">
                <FileText size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.92rem] font-semibold text-[#1c130c]">{programme?.name ?? doc.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[0.75rem] text-[#5e4a35]">
                  <span className="font-bold">{programme?.short}</span>
                  {doc.edition && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{doc.edition}</span>
                    </>
                  )}
                </p>
              </div>
              <ToolLink url={doc.url} label="Open" accessibleName={`Open ${programme?.name ?? ""} ${kind}`} />
            </li>
          );
        })}
      </ul>
      <p className="px-1 text-[0.75rem] text-[#5e4a35]">
        Rules can change between terms. If anything here looks different from the official portal, the portal is correct.
      </p>
    </div>
  );
}

export function ImportantLinksList({ groups }: { groups: { title: string; links: ToolLinkItem[] }[] }) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.title} aria-label={group.title} className="space-y-2">
          <h3 className="kz-label px-1 text-[#5e4a35]">{group.title}</h3>
          <ul className={`${card} divide-y divide-[#1c130c]/10 overflow-hidden`}>
            {group.links.map((link) => (
              <li key={link.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.92rem] font-semibold text-[#1c130c]">{link.title}</p>
                  {link.description && <p className="mt-0.5 text-[0.78rem] text-[#5e4a35]">{link.description}</p>}
                </div>
                <ToolLink url={link.url} label="Open" accessibleName={`Open ${link.title}`} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function GradeScaleTable() {
  return (
    <section aria-labelledby="grade-scale-heading" className="space-y-3">
      <div className="px-1">
        <h3 id="grade-scale-heading" className="kz-serif text-[1.25rem]">
          Letter grades at a glance
        </h3>
        <p className="text-[0.82rem] text-[#5e4a35]">Your final course score maps to a grade and grade points.</p>
      </div>
      <div className={`${card} overflow-hidden`}>
        <table className="w-full text-left text-[0.9rem]">
          <thead className="bg-[#1c130c]/5 text-[0.75rem] uppercase tracking-[0.1em] text-[#5e4a35]">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-bold">Grade</th>
              <th scope="col" className="px-4 py-2.5 font-bold">Final score</th>
              <th scope="col" className="px-4 py-2.5 text-right font-bold">Grade points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c130c]/10">
            {GRADE_SCALE.map((row, i) => {
              const upper = i === 0 ? 100 : GRADE_SCALE[i - 1].minScore - 1;
              return (
                <tr key={row.grade}>
                  <td className="px-4 py-2.5 font-bold text-[#1c130c]">{row.grade}</td>
                  <td className="px-4 py-2.5 tabular-nums text-[#5e4a35]">
                    {row.grade === "U" ? `Below ${GRADE_SCALE[i - 1].minScore}` : `${row.minScore} – ${upper}`}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#5e4a35]">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type StudyLinkRow = { Degree: string; "Student Handbook": string; "Grading Doc": string };
let studyLinks: Promise<StudyLinkRow[]> | null = null;

/** The live handbook and grading links, fetched once per visit. */
export function useStudyLinks(): StudyLinkRow[] {
  const [rows, setRows] = useState<StudyLinkRow[]>([]);
  useEffect(() => {
    studyLinks ??= fetch("/api/study-links")
      .then((r) => (r.ok ? r.json() : []))
      .then((r) => (Array.isArray(r) ? r : []))
      .catch(() => []);
    let alive = true;
    void studyLinks.then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, []);
  return rows;
}

/** Handbooks or grading documents, with the links kept in the database. */
export function LiveDocumentList({ which }: { which: "handbook" | "grading" }) {
  const rows = useStudyLinks();
  const docs =
    which === "handbook"
      ? withLiveLinks(STUDENT_HANDBOOKS, rows, "Student Handbook")
      : withLiveLinks(GRADING_DOCUMENTS, rows, "Grading Doc");
  return <DocumentList documents={docs} kind={which === "handbook" ? "student handbook" : "grading document"} />;
}

