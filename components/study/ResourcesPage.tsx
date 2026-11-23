"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, FolderOpen, LayoutGrid, Library, List, Search, X } from "lucide-react";
import { Segmented } from "@/components/kz/PageHero";
import { RESOURCES, getResourceKind, type Resource, type ResourceKindId } from "@/lib/study/resources";

const KIND_IDS: ResourceKindId[] = ["pdf", "video", "drive", "doc", "link", "notes"];

/** The resources kept in the database (Website → Study resources), plus any in code. */
function useResources(): Resource[] {
  const [rows, setRows] = useState<Resource[]>(RESOURCES);
  useEffect(() => {
    let alive = true;
    fetch("/api/study-resources")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { title: string; url: string; level: string; subject: string; kind: string; author: string; tags: string }[]) => {
        if (!alive || !Array.isArray(data)) return;
        const live: Resource[] = data
          .filter((r) => r.title && r.url && r.subject)
          .map((r, i) => ({
            id: `db-${i}`,
            title: r.title,
            url: r.url,
            level: r.level as Resource["level"],
            subject: r.subject,
            kind: KIND_IDS.includes(r.kind as ResourceKindId) ? (r.kind as ResourceKindId) : undefined,
            author: r.author || undefined,
            tags: r.tags ? r.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
          }));
        // The database copy wins; a link in both is listed once.
        const links = new Set(live.map((r) => r.url));
        setRows([...live, ...RESOURCES.filter((r) => !links.has(r.url))]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return rows;
}
import { LEVELS, SUBJECTS, findSubjectLevel, formatSubjectTitle, getSubjectShortName, isLevel, type Level } from "@/lib/study/subjects";

const SOFT = [0.22, 1, 0.36, 1] as const;
type ViewMode = "grid" | "list";

function SubjectDropdown({
  subjects,
  counts,
  total,
  value,
  onChange,
}: {
  subjects: string[];
  counts: Record<string, number>;
  total: number;
  value: string;
  onChange: (subject: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      setQuery("");
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const shown = q
    ? subjects.filter((s) => s.toLowerCase().includes(q) || getSubjectShortName(s).toLowerCase().includes(q))
    : subjects;
  const isAll = value === "All";

  const choose = (s: string) => {
    onChange(s);
    setOpen(false);
    setQuery("");
  };

  const row = (selected: boolean, muted = false) =>
    `flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[0.86rem] transition-colors ${
      selected
        ? "bg-[#0f5e48]/10 font-semibold text-[#0f5e48]"
        : muted
          ? "text-[#5e4a35]/70 hover:bg-[#1c130c]/5"
          : "text-[#1c130c]/80 hover:bg-[#1c130c]/5 hover:text-[#1c130c]"
    }`;

  return (
    <div ref={ref} className="relative w-full shrink-0 sm:w-60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`kz-focus flex h-10 w-full items-center gap-2.5 rounded-full border bg-[#fffaf0] px-4 text-left text-[0.88rem] transition-colors ${
          open ? "border-[#0f5e48]" : "border-[#1c130c]/15 hover:border-[#1c130c]/35"
        }`}
      >
        <Library size={17} className={`shrink-0 ${isAll ? "text-[#5e4a35]" : "text-[#0f5e48]"}`} />
        <span className={`flex-1 truncate ${isAll ? "font-medium text-[#5e4a35]" : "font-semibold text-[#1c130c]"}`}>
          {isAll ? "All subjects" : formatSubjectTitle(value)}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-[#5e4a35] transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: SOFT }}
            className="absolute left-0 top-full z-30 mt-2 w-full min-w-[19rem] origin-top rounded-[1.25rem] border border-[#1c130c]/10 bg-[#f5e9cf] p-2 shadow-[0_24px_48px_-24px_rgba(28,19,12,0.45)]"
          >
            <label className="mb-1.5 flex items-center gap-2 rounded-xl bg-[#ebd9b2] px-3">
              <Search size={14} className="shrink-0 text-[#5e4a35]" />
              <span className="sr-only">Search subjects</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or code, e.g. MLT"
                className="h-10 w-full bg-transparent text-[0.86rem] text-[#1c130c] outline-none placeholder:text-[#5e4a35]/70"
              />
            </label>
            <div role="listbox" aria-label="Subjects" data-lenis-prevent className="max-h-72 space-y-0.5 overflow-y-auto overscroll-contain">
              <button type="button" role="option" aria-selected={isAll} onClick={() => choose("All")} className={row(isAll)}>
                <span className="flex-1">All subjects</span>
                <span className="tabular-nums text-[#5e4a35]">{total}</span>
              </button>
              {shown.map((s) => {
                const selected = value.toLowerCase() === s.toLowerCase();
                const count = counts[s] ?? 0;
                const full = formatSubjectTitle(s);
                const short = getSubjectShortName(s);
                return (
                  <button key={s} type="button" role="option" aria-selected={selected} onClick={() => choose(s)} className={row(selected, count === 0)}>
                    <span className="flex-1 truncate">{full}</span>
                    {short && short !== full && (
                      <span className="shrink-0 rounded-md bg-[#1c130c]/8 px-1.5 py-0.5 text-[0.68rem] font-bold text-[#5e4a35]">{short}</span>
                    )}
                    <span className="w-5 shrink-0 text-right tabular-nums text-[#5e4a35]">{count}</span>
                    {selected && <Check size={13} className="shrink-0" />}
                  </button>
                );
              })}
              {shown.length === 0 && <p className="py-6 text-center text-[0.86rem] text-[#5e4a35]">No subject matches &ldquo;{query}&rdquo;</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResourceCard({ resource, view, showSubject }: { resource: Resource; view: ViewMode; showSubject: boolean }) {
  const kind = getResourceKind(resource);
  const Icon = kind.icon;
  const subjectShort = getSubjectShortName(resource.subject) || formatSubjectTitle(resource.subject);
  const author = resource.author || "Kaziranga House";
  const tags = resource.tags ?? [];
  const label = `${resource.title}, ${kind.label}, ${formatSubjectTitle(resource.subject)} (opens in a new tab)`;

  if (view === "list") {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="kz-focus group flex items-center gap-4 rounded-[1.1rem] border border-[#1c130c]/10 bg-[#ebd9b2] p-3.5 transition-[border-color,box-shadow] duration-300 hover:border-[#0f5e48]/35 hover:shadow-[0_18px_34px_-28px_rgba(28,19,12,0.6)]"
      >
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${kind.tone}`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[0.95rem] font-semibold text-[#1c130c]">{resource.title}</h3>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[0.78rem] text-[#5e4a35]">
            {showSubject && (
              <>
                <span className="font-semibold text-[#1c130c]/80">{subjectShort}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{kind.label}</span>
            {resource.author && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">Shared by {author}</span>
              </>
            )}
          </p>
        </div>
        {tags.length > 0 && (
          <div className="hidden shrink-0 items-center gap-1 lg:flex">
            {tags.slice(0, 2).map((t) => (
              <span key={t} className="rounded-full bg-[#f5e9cf] px-2 py-0.5 text-[0.7rem] font-semibold text-[#5e4a35]">
                #{t}
              </span>
            ))}
          </div>
        )}
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[0.82rem] font-bold text-[#0f5e48] transition-colors group-hover:bg-[#0f5e48]/10">
          Open <ArrowUpRight size={14} />
        </span>
      </a>
    );
  }

  // A quiet card: what it is and which subject, the title, and one tag that
  // says what kind of help it is (notes, past papers, a cheat sheet).
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="kz-focus group flex h-full flex-col rounded-[1.25rem] border border-[#1c130c]/10 bg-[#fffaf0] p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#0f5e48]/40 hover:shadow-[0_22px_40px_-30px_rgba(28,19,12,0.6)]"
    >
      <div className="flex items-center justify-between gap-3 text-[0.75rem] font-semibold">
        <span className="inline-flex items-center gap-1.5 text-[#5e4a35]">
          <Icon size={15} aria-hidden="true" />
          {kind.label}
        </span>
        {showSubject && <span className="truncate rounded-full bg-[#1c130c] px-2.5 py-0.5 text-[#f5e9cf]">{subjectShort}</span>}
      </div>
      <h3 className="mt-3 line-clamp-3 text-[1.05rem] font-semibold leading-snug text-[#1c130c]">{resource.title}</h3>
      <div className="min-h-4 flex-1" aria-hidden="true" />
      <div className="flex items-center justify-between gap-2 pt-4 text-[0.8rem]">
        {tags[0] ? <span className="rounded-full bg-[#0f5e48]/10 px-2.5 py-0.5 font-semibold text-[#0f5e48]">{tags[0]}</span> : <span />}
        <span className="inline-flex shrink-0 items-center gap-1 font-bold text-[#0f5e48]">
          Open
          <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
}

function EmptyState({ title, body, onReset }: { title: string; body: string; onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#1c130c]/20 px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#ebd9b2] text-[#5e4a35]">
        <FolderOpen size={26} />
      </span>
      <h3 className="kz-serif mt-4 text-[1.5rem]">{title}</h3>
      <p className="kz-body mt-1.5 max-w-sm text-[#5e4a35]">{body}</p>
      {onReset && (
        <button type="button" onClick={onReset} className="kz-btn kz-btn--sm kz-btn--forest kz-focus mt-6">
          Show all subjects
        </button>
      )}
    </div>
  );
}

function ResourcesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const reduce = useReducedMotion();

  const paramSubject = params.get("subject");
  const paramLevel = params.get("level");
  const initialLevel: Level = isLevel(paramLevel) ? paramLevel : (paramSubject && findSubjectLevel(paramSubject)) || "Foundation";

  const [level, setLevel] = useState<Level>(initialLevel);
  const [subject, setSubject] = useState(paramSubject || "All");
  const [query, setQuery] = useState(params.get("search") || "");
  const [view, setView] = useState<ViewMode>("grid");

  const syncUrl = (lvl: Level, subj: string, search = query) => {
    const next = new URLSearchParams();
    if (lvl !== "Foundation") next.set("level", lvl);
    if (subj !== "All") next.set("subject", subj);
    if (search.trim()) next.set("search", search.trim());
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const resources = useResources();
  const levelResources = useMemo(() => resources.filter((r) => r.level === level), [resources, level]);

  const subjects = useMemo(() => {
    const names = new Set(SUBJECTS[level]);
    levelResources.forEach((r) => names.add(r.subject));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [level, levelResources]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    levelResources.forEach((r) => (m[r.subject] = (m[r.subject] ?? 0) + 1));
    return m;
  }, [levelResources]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return levelResources.filter((r) => {
      if (subject !== "All" && r.subject.toLowerCase() !== subject.toLowerCase()) return false;
      if (!q) return true;
      return [r.title, r.author ?? "", r.subject, getSubjectShortName(r.subject), ...(r.tags ?? [])].some((s) => s.toLowerCase().includes(q));
    });
  }, [levelResources, subject, query]);

  const pickLevel = (lvl: Level) => {
    setLevel(lvl);
    setSubject("All");
    syncUrl(lvl, "All");
  };
  const pickSubject = (subj: string) => {
    setSubject(subj);
    syncUrl(level, subj);
  };
  const reset = () => {
    setQuery("");
    setSubject("All");
    syncUrl(level, "All", "");
  };

  const subjectLabel = subject !== "All" ? getSubjectShortName(subject) || formatSubjectTitle(subject) : "";
  const viewButton = (mode: ViewMode, label: string, Icon: typeof List) => (
    <button
      type="button"
      onClick={() => setView(mode)}
      aria-pressed={view === mode}
      aria-label={label}
      title={label}
      className={`kz-focus grid h-9 w-9 place-items-center rounded-full transition-colors ${
        view === mode ? "bg-[#0f5e48] text-[#f5e9cf]" : "text-[#5e4a35] hover:text-[#1c130c]"
      }`}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <>
      <section className="space-y-6 pb-24 pt-6 lg:pt-8 md:pb-32">
        <header>
          <h1 className="kz-serif text-[clamp(2rem,4vw,3rem)] leading-none">Notes</h1>
          <p className="kz-body mt-2 max-w-2xl text-[#5e4a35]">Notes, past papers and cheat sheets for every subject. Pick your level, then your subject.</p>
        </header>

        {/* One slim row: level, subject, search, then the count and the view. */}
        <div className="flex flex-col gap-3 border-b border-[#1c130c]/10 pb-4 lg:flex-row lg:flex-wrap lg:items-center">
          <Segmented
            id="resources-level"
            value={level}
            onChange={pickLevel}
            options={LEVELS.map((l) => ({ label: l, value: l, count: resources.filter((r) => r.level === l).length }))}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SubjectDropdown subjects={subjects} counts={counts} total={levelResources.length} value={subject} onChange={pickSubject} />

          <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[#1c130c]/15 bg-[#fffaf0] px-4 transition-colors focus-within:border-[#0f5e48] sm:max-w-[18rem]">
            <Search size={16} className="shrink-0 text-[#5e4a35]" />
            <span className="sr-only">Search resources</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => syncUrl(level, subject)}
              placeholder="Search by title, topic or tag"
              className="h-full w-full min-w-0 bg-transparent text-[0.9rem] text-[#1c130c] outline-none placeholder:text-[#5e4a35]/70"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  syncUrl(level, subject, "");
                }}
                aria-label="Clear search"
                className="kz-focus grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#5e4a35] hover:bg-[#1c130c]/5 hover:text-[#1c130c]"
              >
                <X size={14} />
              </button>
            )}
          </label>

          <div className="flex shrink-0 items-center justify-between gap-3 sm:ml-auto sm:justify-end">
            <span aria-live="polite" className="whitespace-nowrap text-[0.85rem] font-semibold tabular-nums text-[#5e4a35]">
              {filtered.length} {filtered.length === 1 ? "resource" : "resources"}
            </span>
            <div className="flex items-center gap-0.5 rounded-full border border-[#1c130c]/10 bg-[#fffaf0] p-1">
              {viewButton("grid", "Grid view", LayoutGrid)}
              {viewButton("list", "List view", List)}
            </div>
          </div>
          </div>
        </div>

        {subject !== "All" && (
          <div className="flex flex-wrap items-end justify-between gap-2 px-1 pt-2">
            <div className="min-w-0">
              <h2 className="kz-serif text-[1.6rem]">{subjectLabel} notes</h2>
              <p className="truncate text-[0.85rem] text-[#5e4a35]">
                {formatSubjectTitle(subject)} · {level}
              </p>
            </div>
            <button
              type="button"
              onClick={() => pickSubject("All")}
              className="kz-focus inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.85rem] font-semibold text-[#5e4a35] transition-colors hover:bg-[#1c130c]/5 hover:text-[#1c130c]"
            >
              <X size={13} /> Show all subjects
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            title={query ? `Nothing matches “${query}”` : subjectLabel ? `No ${subjectLabel} notes yet` : `No ${level.toLowerCase()} notes yet`}
            body={
              levelResources.length === 0
                ? "Notes and study material for this level are being collected and will appear here."
                : query
                  ? "Try a shorter word, or search across all subjects."
                  : "Other subjects at this level have material you can browse."
            }
            onReset={query || subject !== "All" ? reset : undefined}
          />
        ) : (
          <motion.ul
            layout={!reduce}
            className={view === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid grid-cols-1 gap-2.5"}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((r, i) => (
                <motion.li
                  key={r.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.45, delay: Math.min(i, 12) * 0.03, ease: SOFT }}
                >
                  <ResourceCard resource={r} view={view} showSubject={subject === "All"} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </section>
    </>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ResourcesContent />
    </Suspense>
  );
}
