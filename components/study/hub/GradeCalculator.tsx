"use client";

import { useId, useMemo, useState, type ChangeEvent } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Segmented } from "@/components/kz/PageHero";
import { card, inputClass } from "@/components/study/hub/parts";
import { GRADE_SCALE, type LetterGrade } from "@/lib/study/hub";

type Mode = "gpa" | "cgpa";
type CourseRow = { id: number; name: string; credits: string; grade: LetterGrade };

const POINTS = Object.fromEntries(GRADE_SCALE.map((g) => [g.grade, g.points])) as Record<LetterGrade, number>;

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function ResultCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div aria-live="polite" className="rounded-[1.5rem] bg-[#0f5e48] p-6 text-center text-[#f5e9cf] lg:sticky lg:top-[calc(var(--kz-header-h)+1.5rem)]">
      <p className="kz-label text-[#f5e9cf]/75">{label}</p>
      <p className="kz-serif mt-3 text-[3.4rem] leading-none tabular-nums">{value}</p>
      <p className="mt-3 text-[0.8rem] text-[#f5e9cf]/75">{detail}</p>
    </div>
  );
}

function TermGpa() {
  const baseId = useId();
  const [nextId, setNextId] = useState(3);
  const [rows, setRows] = useState<CourseRow[]>([
    { id: 1, name: "", credits: "4", grade: "A" },
    { id: 2, name: "", credits: "4", grade: "B" },
  ]);

  const update = (id: number, patch: Partial<CourseRow>) => setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const result = useMemo(() => {
    let credits = 0;
    let weighted = 0;
    let counted = 0;
    for (const row of rows) {
      const c = toNumber(row.credits);
      if (c === null) continue;
      credits += c;
      weighted += c * POINTS[row.grade];
      counted += 1;
    }
    return { credits, counted, gpa: credits > 0 ? weighted / credits : null };
  }, [rows]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <div className="space-y-3">
        <div className="kz-label hidden grid-cols-[1fr_6.5rem_7rem_2.75rem] gap-2 px-1 text-[0.66rem] text-[#5e4a35] sm:grid">
          <span>Course</span>
          <span>Credits</span>
          <span>Grade</span>
          <span className="sr-only">Remove</span>
        </div>
        <ul className="space-y-2">
          {rows.map((row, index) => {
            const invalid = row.credits.trim() !== "" && toNumber(row.credits) === null;
            const label = row.name.trim() || `Course ${index + 1}`;
            return (
              <li key={row.id} className="rounded-2xl border border-[#1c130c]/10 bg-[#f5e9cf] p-2.5 sm:border-0 sm:bg-transparent sm:p-0">
                <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_6.5rem_7rem_2.75rem]">
                  <input
                    aria-label={`Course ${index + 1} name`}
                    value={row.name}
                    onChange={(e) => update(row.id, { name: e.target.value })}
                    placeholder={`Course ${index + 1} (optional)`}
                    className={`${inputClass} col-span-2 sm:col-span-1`}
                  />
                  <input
                    aria-label={`${label} credits`}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? `${baseId}-c-${row.id}` : undefined}
                    inputMode="decimal"
                    value={row.credits}
                    onChange={(e) => update(row.id, { credits: e.target.value })}
                    placeholder="Credits"
                    className={`${inputClass} ${invalid ? "border-[#c8102e]" : ""}`}
                  />
                  <label className="relative">
                    <span className="sr-only">{label} grade</span>
                    <select value={row.grade} onChange={(e) => update(row.id, { grade: e.target.value as LetterGrade })} className={`${inputClass} appearance-none pr-8`}>
                      {GRADE_SCALE.map((g) => (
                        <option key={g.grade} value={g.grade}>
                          {g.grade} ({g.points})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5e4a35]" aria-hidden="true" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setRows((cur) => cur.filter((r) => r.id !== row.id))}
                    disabled={rows.length === 1}
                    aria-label={`Remove ${label}`}
                    className="kz-focus grid h-11 w-11 place-items-center rounded-full text-[#5e4a35] transition-colors hover:bg-[#c8102e]/10 hover:text-[#c8102e] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#5e4a35]"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                {invalid && (
                  <p id={`${baseId}-c-${row.id}`} className="mt-1 px-1 text-[0.75rem] font-medium text-[#c8102e]">
                    Enter credits as a number, like 4.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => {
            setRows((cur) => [...cur, { id: nextId, name: "", credits: "4", grade: "A" }]);
            setNextId((n) => n + 1);
          }}
          className="kz-focus inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[0.85rem] font-bold text-[#0f5e48] transition-colors hover:bg-[#0f5e48]/10"
        >
          <Plus size={15} aria-hidden="true" />
          Add course
        </button>
      </div>
      <ResultCard
        label="Term GPA"
        value={result.gpa === null ? "—" : result.gpa.toFixed(2)}
        detail={result.gpa === null ? "Add credits to see your GPA" : `${result.credits} credits across ${result.counted} course${result.counted === 1 ? "" : "s"}`}
      />
    </div>
  );
}

function UpdateCgpa() {
  const id = useId();
  const [values, setValues] = useState({ cgpa: "", credits: "", termGpa: "", termCredits: "" });
  const set = (key: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const fields: { key: keyof typeof values; label: string; hint: string; max?: number }[] = [
    { key: "cgpa", label: "Current CGPA", hint: "Out of 10", max: 10 },
    { key: "credits", label: "Credits completed so far", hint: "Before this term" },
    { key: "termGpa", label: "This term's GPA", hint: "Use the Term GPA tab if you don't know it", max: 10 },
    { key: "termCredits", label: "Credits this term", hint: "Total for this term's courses" },
  ];

  const errors = Object.fromEntries(
    fields.map((f) => {
      const raw = values[f.key];
      const n = toNumber(raw);
      if (raw.trim() === "") return [f.key, ""];
      if (n === null) return [f.key, "Enter a number."];
      if (f.max !== undefined && n > f.max) return [f.key, `Must be ${f.max} or less.`];
      return [f.key, ""];
    }),
  ) as Record<keyof typeof values, string>;

  const nums = {
    cgpa: toNumber(values.cgpa),
    credits: toNumber(values.credits),
    termGpa: toNumber(values.termGpa),
    termCredits: toNumber(values.termCredits),
  };
  const complete = Object.values(nums).every((n) => n !== null) && Object.values(errors).every((e) => !e);
  const totalCredits = complete ? nums.credits! + nums.termCredits! : 0;
  const newCgpa = complete && totalCredits > 0 ? (nums.cgpa! * nums.credits! + nums.termGpa! * nums.termCredits!) / totalCredits : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label htmlFor={`${id}-${f.key}`} className="text-[0.85rem] font-semibold text-[#1c130c]">
              {f.label}
            </label>
            <input
              id={`${id}-${f.key}`}
              inputMode="decimal"
              value={values[f.key]}
              onChange={set(f.key)}
              aria-invalid={Boolean(errors[f.key])}
              aria-describedby={`${id}-${f.key}-hint`}
              className={`${inputClass} mt-1.5 ${errors[f.key] ? "border-[#c8102e]" : ""}`}
            />
            <p id={`${id}-${f.key}-hint`} className={`mt-1 text-[0.75rem] ${errors[f.key] ? "font-medium text-[#c8102e]" : "text-[#5e4a35]"}`}>
              {errors[f.key] || f.hint}
            </p>
          </div>
        ))}
      </div>
      <ResultCard
        label="New CGPA"
        value={newCgpa === null ? "—" : newCgpa.toFixed(2)}
        detail={newCgpa !== null ? `Across ${totalCredits} credits` : Object.values(errors).some(Boolean) ? "Fix the highlighted box" : "Fill in all four boxes"}
      />
    </div>
  );
}

export default function GradeCalculator() {
  const [mode, setMode] = useState<Mode>("gpa");
  return (
    <div className="space-y-5">
      <Segmented
        id="calculator-mode"
        value={mode}
        onChange={setMode}
        options={[
          { label: "Term GPA", value: "gpa" },
          { label: "Update CGPA", value: "cgpa" },
        ]}
      />
      <div className={`${card} p-4 sm:p-6`}>{mode === "gpa" ? <TermGpa /> : <UpdateCgpa />}</div>
      <p className="px-1 text-[0.78rem] text-[#5e4a35]">
        GPA is the credit-weighted average of grade points: S = 10, A = 9, B = 8, C = 7, D = 6, E = 4, U = 0. Your official CGPA on the student portal is final.
      </p>
    </div>
  );
}
