"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BookOpenText, FileText, Library, Search, X, Youtube } from "lucide-react";
import { Segmented } from "@/components/kz/PageHero";
import { ToolLink, card } from "@/components/study/hub/parts";
import { RECOMMENDED_BOOKS } from "@/lib/study/hub";
import { useCourseChannels } from "@/lib/iitm";
import { LEVELS, SUBJECTS, formatSubjectTitle, getSubjectShortName, type Level } from "@/lib/study/subjects";

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

/**
 * Level switch and subject search, then one list grouped by subject. Subjects
 * with nothing added stay out of the way unless asked for (or searched).
 */
function SubjectBrowser({
  noun,
  icon: Icon,
  countFor,
  renderItems,
}: {
  noun: string;
  icon: LucideIcon;
  countFor: (subject: string) => number;
  renderItems: (subject: string) => ReactNode;
}) {
  const [level, setLevel] = useState<Level>("Foundation");
  const [query, setQuery] = useState("");
  const [showEmpty, setShowEmpty] = useState(false);

  const sorted = [...SUBJECTS[level]].sort((a, b) => a.localeCompare(b));
  const total = sorted.reduce((sum, s) => sum + countFor(s), 0);
  const withItems = sorted.filter((s) => countFor(s) > 0).length;
  const q = query.trim().toLowerCase();
  const shown = sorted.filter((s) => (q ? s.toLowerCase().includes(q) || getSubjectShortName(s).toLowerCase().includes(q) : showEmpty || countFor(s) > 0));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented
          id={`${noun}-level`}
          value={level}
          onChange={(l) => {
            setLevel(l);
            setQuery("");
          }}
          options={LEVELS.map((l) => ({ label: l, value: l }))}
        />
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[#1c130c]/15 bg-[#f5e9cf] px-4 transition-colors focus-within:border-[#0f5e48]">
          <Search size={16} className="shrink-0 text-[#5e4a35]" aria-hidden="true" />
          <span className="sr-only">Search subjects</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, e.g. Stats 1"
            className="h-full w-full min-w-0 bg-transparent text-[0.9rem] text-[#1c130c] outline-none placeholder:text-[#5e4a35]/70"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[0.82rem] text-[#5e4a35]">
        <p aria-live="polite">
          {sorted.length} {level.toLowerCase()} subjects · {plural(total, noun)}
        </p>
        {!q && withItems > 0 && withItems < sorted.length && (
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 font-medium">
            <input type="checkbox" checked={showEmpty} onChange={(e) => setShowEmpty(e.target.checked)} className="h-4 w-4 accent-[#0f5e48]" />
            Show subjects without {noun}s
          </label>
        )}
      </div>

      {total === 0 && !q ? (
        <div className="flex flex-col items-center rounded-[1.5rem] border border-dashed border-[#1c130c]/20 px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#ebd9b2] text-[#5e4a35]">
            <Icon size={26} aria-hidden="true" />
          </span>
          <h2 className="kz-serif mt-4 text-[1.5rem]">
            No {noun}s added for {level} subjects yet
          </h2>
          <p className="kz-body mt-1.5 max-w-sm text-[#5e4a35]">They&apos;re being collected and will appear here, grouped by subject.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className={`${card} px-6 py-10 text-center`}>
          <p className="font-semibold text-[#1c130c]">
            No {level.toLowerCase()} subject matches &ldquo;{query}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="kz-focus mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[0.85rem] font-semibold text-[#5e4a35] hover:bg-[#1c130c]/6 hover:text-[#1c130c]"
          >
            <X size={13} aria-hidden="true" /> Clear search
          </button>
        </div>
      ) : (
        <ul className={`${card} divide-y divide-[#1c130c]/10 overflow-hidden`}>
          {shown.map((s) => {
            const count = countFor(s);
            const full = formatSubjectTitle(s);
            const short = getSubjectShortName(s) || full;
            return (
              <li key={s} className="px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="min-w-0 truncate text-[0.98rem] font-bold text-[#1c130c]">
                    {short}
                    {short !== full && <span className="ml-2 text-[0.82rem] font-medium text-[#5e4a35]">{full}</span>}
                  </h2>
                  <span className="shrink-0 text-[0.75rem] font-semibold text-[#5e4a35]">{count > 0 ? plural(count, noun) : `No ${noun}s yet`}</span>
                </div>
                {count > 0 && <div className="mt-3">{renderItems(s)}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const itemRow = "flex items-center gap-3 rounded-2xl bg-[#f5e9cf] px-3.5 py-3";

/** Each course's YouTube channel, kept under Website → YouTube channels. */
export function YouTubeChannelsBrowser() {
  const channels = useCourseChannels();
  const forSubject = (s: string) => channels.filter((p) => p.subject.toLowerCase() === s.toLowerCase());
  return (
    <SubjectBrowser
      noun="channel"
      icon={Youtube}
      countFor={(s) => forSubject(s).length}
      renderItems={(s) => (
        <ul className="space-y-1.5">
          {forSubject(s).map((c) => (
            <li key={c.url} className={itemRow}>
              <Youtube size={20} className="shrink-0 text-[#c8102e]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9rem] font-semibold text-[#1c130c]">{c.title || "YouTube channel"}</p>
                {c.note && <p className="truncate text-[0.75rem] text-[#5e4a35]">{c.note}</p>}
              </div>
              <ToolLink url={c.url} label="Watch" accessibleName={`Watch ${s} ${c.title} on YouTube`} />
            </li>
          ))}
        </ul>
      )}
    />
  );
}

export function BooksBrowser() {
  return (
    <SubjectBrowser
      noun="book"
      icon={Library}
      countFor={(s) => RECOMMENDED_BOOKS[s]?.length ?? 0}
      renderItems={(s) => (
        <ul className="space-y-1.5">
          {(RECOMMENDED_BOOKS[s] ?? []).map((b) => {
            const Icon = b.kind === "pdf" ? FileText : BookOpenText;
            return (
              <li key={b.title} className={itemRow}>
                <Icon size={20} className="shrink-0 text-[#0f5e48]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9rem] font-semibold text-[#1c130c]">{b.title}</p>
                  {b.author && <p className="truncate text-[0.75rem] text-[#5e4a35]">{b.author}</p>}
                </div>
                <ToolLink url={b.url} label={b.kind === "pdf" ? "Open PDF" : "View"} accessibleName={`Open ${b.title}`} />
              </li>
            );
          })}
        </ul>
      )}
    />
  );
}
