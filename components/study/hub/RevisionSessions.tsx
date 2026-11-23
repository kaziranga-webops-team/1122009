"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Play, Video } from "lucide-react";

interface Session {
  Subject: string;
  Held_at: string;
  Degree: string;
  Level: string;
  Exam_type: string;
  URL: string;
}

/** The YouTube video id in a watch, live, share or embed link. */
function youtubeId(url: string): string | null {
  const m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/))([\w-]{11})/.exec(url);
  return m ? m[1] : null;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/**
 * The house's revision sessions: upcoming ones first (with the link to join),
 * then the recordings, filterable by degree, level and exam.
 */
/** `bare` leaves out the heading, for the page that has its own. */
export default function RevisionSessions({ bare = false }: { bare?: boolean }) {
  const [rows, setRows] = useState<Session[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [degree, setDegree] = useState("All");
  const [exam, setExam] = useState("All");
  const [shown, setShown] = useState(bare ? 12 : 8);

  useEffect(() => {
    let alive = true;
    fetch("/api/revision-sessions")
      .then((r) => (r.ok ? r.json() : []))
      .then((r) => alive && Array.isArray(r) && setRows(r))
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const degrees = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.Degree).filter(Boolean)))], [rows]);
  const exams = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.Exam_type).filter(Boolean)))], [rows]);

  const { upcoming, recordings } = useMemo(() => {
    const now = Date.now();
    const list = rows.filter((r) => (degree === "All" || r.Degree === degree) && (exam === "All" || r.Exam_type === exam) && r.URL);
    const t = (r: Session) => (r.Held_at ? new Date(r.Held_at).getTime() : NaN);
    return {
      upcoming: list.filter((r) => t(r) > now).sort((a, b) => t(a) - t(b)),
      recordings: list.filter((r) => !(t(r) > now)).sort((a, b) => (t(b) || 0) - (t(a) || 0)),
    };
  }, [rows, degree, exam]);

  if (loaded && !rows.length) return null;

  const chip = (value: string, current: string, set: (v: string) => void) => (
    <button
      key={value}
      type="button"
      onClick={() => {
        set(value);
        setShown(8);
      }}
      aria-pressed={current === value}
      className={`kz-focus h-9 shrink-0 rounded-full px-3.5 text-[0.85rem] font-semibold transition-colors ${
        current === value ? "bg-[#1c130c] text-[#f5e9cf]" : "bg-[#ebd9b2] text-[#5e4a35] hover:text-[#1c130c]"
      }`}
    >
      {value}
    </button>
  );

  const title = (r: Session) => r.Subject || [r.Exam_type, "revision"].filter(Boolean).join(" ");
  const tags = (r: Session) => [r.Degree, r.Level, r.Subject ? r.Exam_type : ""].filter(Boolean).join(" · ");

  return (
    <section aria-labelledby="revision" className="space-y-5">
      {!bare && (
        <div>
          <h2 id="revision" className="kz-serif text-[1.6rem]">
            Revision sessions
          </h2>
          <p className="mt-0.5 text-[0.95rem] text-[#5e4a35]">Live revision before quizzes and end terms, and the recordings after.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-2">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="group" aria-label="Degree">
            {degrees.map((d) => chip(d, degree, setDegree))}
          </div>
          {exams.length > 2 && (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="group" aria-label="Exam">
              {exams.map((e) => chip(e, exam, setExam))}
            </div>
          )}
        </div>
      )}

      {!loaded && <div className="h-40 animate-pulse rounded-2xl bg-[#ebd9b2]" />}

      {upcoming.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {upcoming.map((r, i) => (
            <li key={`u-${i}`}>
              <a
                href={r.URL}
                target="_blank"
                rel="noopener noreferrer"
                className="kz-focus flex h-full items-center gap-4 rounded-2xl bg-[#0f5e48] p-4 text-[#f5e9cf] transition-transform hover:-translate-y-0.5"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f6b51e] text-[#1c130c]">
                  <Video size={20} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="kz-label block text-[#f6b51e]">Upcoming · {when(r.Held_at)}</span>
                  <span className="mt-1 block truncate text-[1.05rem] font-semibold">{title(r)}</span>
                  <span className="block truncate text-[0.85rem] opacity-80">{tags(r)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {recordings.length > 0 && (
        <>
          <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {recordings.slice(0, shown).map((r, i) => {
              const id = youtubeId(r.URL);
              return (
                <li key={`r-${i}`}>
                  <a
                    href={r.URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kz-focus group block overflow-hidden rounded-2xl border border-[#1c130c]/10 bg-[#fffaf0] transition-transform hover:-translate-y-0.5"
                  >
                    <span className="relative block aspect-video bg-[#1c130c]">
                      {id && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-90" />
                      )}
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#c8102e] text-white shadow-lg transition-transform group-hover:scale-110">
                          <Play size={18} fill="currentColor" aria-hidden="true" />
                        </span>
                      </span>
                    </span>
                    <span className="block p-3.5">
                      <span className="block truncate font-semibold text-[#1c130c]">{title(r)}</span>
                      <span className="mt-0.5 flex items-center justify-between gap-2 text-[0.82rem] text-[#5e4a35]">
                        <span className="truncate">{tags(r)}</span>
                        {r.Held_at && (
                          <span className="inline-flex shrink-0 items-center gap-1">
                            <CalendarDays size={12} aria-hidden="true" />
                            {new Date(r.Held_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          {recordings.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + 8)}
              className="kz-focus h-10 rounded-full border-2 border-[#1c130c] px-5 text-[0.9rem] font-semibold hover:bg-[#1c130c] hover:text-[#f5e9cf]"
            >
              Show more recordings ({recordings.length - shown})
            </button>
          )}
        </>
      )}

      {loaded && rows.length > 0 && !upcoming.length && !recordings.length && (
        <p className="text-[0.95rem] text-[#5e4a35]">No sessions for that choice yet.</p>
      )}
    </section>
  );
}
