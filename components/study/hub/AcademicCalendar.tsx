"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import {
  EXAM_KINDS,
  OFFICIAL_CALENDAR,
  countdown,
  daysBetween,
  forAudience,
  kindColour,
  showDay,
  todayInIndia,
  upcomingExams,
  useAcademicDates,
  type AcademicDate,
} from "@/lib/study/calendar";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const monthName = (y: number, m: number) =>
  new Date(Date.UTC(y, m, 1)).toLocaleDateString("en-IN", { timeZone: "UTC", month: "long", year: "numeric" });
const isExam = (d: AcademicDate) => EXAM_KINDS.includes(d.kind);

/** "15 Nov" or, for a window, "19 – 20 Nov". */
function span(d: AcademicDate): string {
  const one = (s: string) =>
    new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10))).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short" });
  return d.ends_on && d.ends_on !== d.starts_on ? `${one(d.starts_on)} – ${one(d.ends_on)}` : one(d.starts_on);
}

/**
 * A small academic calendar for term students. Exams (quizzes, OPPEs, end
 * terms) are filled in their colour; with "All dates" on, results and
 * registration windows show as a quiet dot. Under the month, its dates as a
 * short list; tapping a day shows just that day.
 */
export default function AcademicCalendar() {
  const dates = useAcademicDates();
  const today = todayInIndia();
  const [all, setAll] = useState(false);
  const [month, setMonth] = useState(() => ({ y: +today.slice(0, 4), m: +today.slice(5, 7) - 1 }));
  const [picked, setPicked] = useState<string | null>(null);

  // The next exam, up to a term ahead: the reminder beside the month.
  const next = useMemo(() => upcomingExams(dates ?? [], 130)[0], [dates]);

  const shown = useMemo(
    () => (dates ?? []).filter((d) => forAudience(d, "Term students") && (all || isExam(d))),
    [dates, all]
  );

  // What each day shows: an exam fills the day; anything else is a dot.
  const byDay = useMemo(() => {
    const map = new Map<string, AcademicDate[]>();
    for (const d of shown) map.set(d.starts_on, [...(map.get(d.starts_on) ?? []), d]);
    return map;
  }, [shown]);

  const first = dayKey(month.y, month.m, 1);
  const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const last = dayKey(month.y, month.m, daysInMonth);
  const lead = (new Date(Date.UTC(month.y, month.m, 1)).getUTCDay() + 6) % 7; // weeks start on Monday
  const cells = Array.from({ length: Math.ceil((lead + daysInMonth) / 7) * 7 }, (_, i) => i - lead + 1);

  const list = shown.filter((d) => {
    const end = d.ends_on || d.starts_on;
    return picked ? d.starts_on <= picked && end >= picked : d.starts_on <= last && end >= first;
  });

  const move = (by: number) => {
    setPicked(null);
    setMonth(({ y, m }) => {
      const t = new Date(Date.UTC(y, m + by, 1));
      return { y: t.getUTCFullYear(), m: t.getUTCMonth() };
    });
  };

  const empty = Boolean(dates && !dates.length);

  return (
    <div
      id="calendar"
      aria-label="Academic calendar"
      role="region"
      className="grid scroll-mt-[calc(var(--kz-header-h)+1rem)] gap-5 rounded-[1.5rem] border border-[#1c130c]/10 bg-[#fffaf0] p-4 sm:p-5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
    >
      <div className="min-w-0">
      {/* Month, and exams only or every date */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => move(-1)} aria-label="Previous month" className="kz-focus grid h-8 w-8 place-items-center rounded-full text-[#1c130c] hover:bg-[#ebd9b2]">
          <ChevronLeft size={17} />
        </button>
        <span className="min-w-[7.75rem] text-center text-[1rem] font-semibold text-[#1c130c]" aria-live="polite">
          {monthName(month.y, month.m)}
        </span>
        <button type="button" onClick={() => move(1)} aria-label="Next month" className="kz-focus grid h-8 w-8 place-items-center rounded-full text-[#1c130c] hover:bg-[#ebd9b2]">
          <ChevronRight size={17} />
        </button>
        <div className="ml-auto flex shrink-0 rounded-full bg-[#ebd9b2] p-0.5 text-[0.78rem] font-semibold" role="group" aria-label="Which dates">
          {[
            { v: false, label: "Exams" },
            { v: true, label: "All dates" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={all === o.v}
              onClick={() => {
                setAll(o.v);
                setPicked(null);
              }}
              className={`kz-focus h-7 whitespace-nowrap rounded-full px-2.5 transition-colors ${all === o.v ? "bg-[#1c130c] text-[#f5e9cf]" : "text-[#5e4a35]"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* The month */}
      {!dates ? (
        <div className="mt-3 h-56 animate-pulse rounded-xl bg-[#ebd9b2]" />
      ) : (
        <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAYS.map((w, i) => (
            <span key={i} className="pb-1 text-[0.72rem] font-bold text-[#5e4a35]/70">
              {w}
            </span>
          ))}
          {cells.map((n, i) => {
            if (n < 1 || n > daysInMonth) return <span key={i} />;
            const key = dayKey(month.y, month.m, n);
            const items = byDay.get(key) ?? [];
            const exam = items.find(isExam);
            const fill = exam ? kindColour(exam.kind) : null;
            const selected = picked === key;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setPicked(selected ? null : key)}
                aria-pressed={selected}
                aria-label={`${showDay(key, true)}${items.length ? `: ${items.map((x) => x.title).join(", ")}` : ""}`}
                className={`kz-focus relative mx-auto grid h-9 w-9 place-items-center rounded-full text-[0.85rem] transition-colors ${
                  fill ? "font-bold" : key < today ? "text-[#1c130c]/40" : "text-[#1c130c]"
                } ${selected ? "ring-2 ring-[#f6b51e] ring-offset-1 ring-offset-[#fffaf0]" : key === today && !fill ? "ring-2 ring-[#c8102e]" : ""} ${
                  !fill ? "hover:bg-[#ebd9b2]" : ""
                } ${fill && key < today ? "opacity-50" : ""}`}
                style={fill ? { background: fill.bg, color: fill.ink } : undefined}
              >
                {n}
                {!exam && items.length > 0 && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#0f5e48]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}

      {/* What the colours mean */}
      <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1 text-[0.75rem] font-semibold text-[#5e4a35]">
        {["Quiz", "OPPE", "End term"].map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: kindColour(k).bg }} aria-hidden="true" />
            {k}
          </span>
        ))}
        {all && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0f5e48]" aria-hidden="true" />
            Other dates
          </span>
        )}
      </div>
      </div>

      <div className="flex min-w-0 flex-col">
      {/* The reminder: how long until the next exam */}
      {next && (
        <div className="flex items-center gap-4 rounded-2xl p-4 text-[#f5e9cf]" style={{ background: next.days <= 3 ? "#c8102e" : "#1c130c" }}>
          <span className="shrink-0 text-center leading-none">
            <span className="block text-[2.6rem] font-extrabold tabular-nums">{Math.max(next.days, 0)}</span>
            <span className="mt-1 block text-[0.72rem] font-bold uppercase tracking-wide text-[#f6b51e]">{next.days === 1 ? "day" : "days"}</span>
          </span>
          <span className="min-w-0">
            <span className="block text-[0.8rem] font-semibold text-[#f6b51e]">{next.days <= 0 ? "Today" : "Until"}</span>
            <span className="block truncate text-[1.1rem] font-bold">{next.title}</span>
            <span className="block text-[0.85rem] opacity-80">{showDay(next.starts_on, true)}</span>
          </span>
        </div>
      )}

      {empty && (
        <p className="rounded-2xl bg-[#ebd9b2]/60 p-4 text-[0.9rem] text-[#5e4a35]">
          Quiz, OPPE and end-term dates will appear on the calendar here, with a countdown to the next one.
        </p>
      )}

      {/* The month's dates (or one day's) */}
      {dates && !empty && (
        <ul className={`space-y-1.5 ${next ? "mt-4" : ""}`}>
          <li className="pb-1 text-[0.78rem] font-bold text-[#5e4a35]">{picked ? showDay(picked, true) : `In ${monthName(month.y, month.m).split(" ")[0]}`}</li>
          {list.length ? (
            list.map((d) => {
              const exam = isExam(d);
              const left = daysBetween(today, d.starts_on);
              const done = daysBetween(today, d.ends_on || d.starts_on) < 0;
              return (
                <li key={`${d.term}-${d.title}`} className={`flex items-center gap-2.5 text-[0.88rem] ${done ? "opacity-50" : ""}`}>
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: exam ? kindColour(d.kind).bg : "#0f5e48", opacity: exam ? 1 : 0.5 }}
                    aria-hidden="true"
                  />
                  <span className="w-[5.6rem] shrink-0 tabular-nums text-[#5e4a35]">{span(d)}</span>
                  <span className={`min-w-0 flex-1 truncate ${exam ? "font-semibold text-[#1c130c]" : "text-[#5e4a35]"}`}>{d.title}</span>
                  {exam && !done && left >= 0 && <span className="shrink-0 text-[0.78rem] font-bold text-[#c8102e]">{countdown(left)}</span>}
                </li>
              );
            })
          ) : (
            <li className="text-[0.88rem] text-[#5e4a35]">{picked ? "Nothing on this day." : all ? "No dates this month." : "No exams this month."}</li>
          )}
        </ul>
      )}

      <a
        href={OFFICIAL_CALENDAR}
        target="_blank"
        rel="noopener noreferrer"
        className="kz-focus mt-auto inline-flex items-center gap-1 pt-3 text-[0.8rem] font-semibold text-[#0f5e48] hover:underline"
      >
        Official academic calendar <ExternalLink size={13} />
      </a>
      </div>
    </div>
  );
}
