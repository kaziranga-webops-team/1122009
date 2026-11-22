"use client";

import { useState } from "react";
import { Check, ChevronDown, Hourglass, TrendingUp } from "lucide-react";
import { Segmented } from "@/components/kz/PageHero";
import { card, inputClass } from "@/components/study/hub/parts";
import { GRADE_SCALE, PROGRAMMES, type Programme } from "@/lib/study/hub";
import { LEVELS, SUBJECTS, formatSubjectTitle, getSubjectShortName, type Level } from "@/lib/study/subjects";

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2.5">
        <span
          className={`grid h-6 w-6 place-items-center rounded-full text-[0.72rem] font-bold transition-colors ${
            done ? "bg-[#0f5e48] text-[#f5e9cf]" : "bg-[#1c130c]/8 text-[#5e4a35]"
          }`}
        >
          {done ? <Check size={13} aria-hidden="true" /> : n}
        </span>
        <h2 className="kz-label text-[0.7rem] text-[#1c130c]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function GradePredictor() {
  const [programme, setProgramme] = useState<Programme["id"] | "">("");
  const [level, setLevel] = useState<Level | "">("");
  const [subject, setSubject] = useState("");

  const subjects = level ? [...SUBJECTS[level]].sort((a, b) => a.localeCompare(b)) : [];
  const ready = Boolean(programme && level && subject);
  const nextStep = !programme ? "a programme" : !level ? "a level" : "a subject";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className={`${card} space-y-6 p-5`}>
        <Step n={1} title="Programme" done={Boolean(programme)}>
          <div role="radiogroup" aria-label="Programme" className="grid grid-cols-2 gap-2">
            {PROGRAMMES.map((p) => {
              const selected = programme === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  title={p.name}
                  onClick={() => setProgramme(p.id)}
                  className={`kz-focus rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                    selected ? "border-[#0f5e48] bg-[#0f5e48]/10" : "border-[#1c130c]/12 bg-[#f5e9cf] hover:border-[#1c130c]/30"
                  }`}
                >
                  <span className={`block text-[0.88rem] font-bold ${selected ? "text-[#0f5e48]" : "text-[#1c130c]"}`}>{p.short}</span>
                  <span className="block truncate text-[0.72rem] text-[#5e4a35]">{p.name}</span>
                </button>
              );
            })}
          </div>
        </Step>

        <Step n={2} title="Level" done={Boolean(level)}>
          <Segmented
            id="predictor-level"
            value={level as Level}
            onChange={(l) => {
              setLevel(l);
              setSubject("");
            }}
            options={LEVELS.map((l) => ({ label: l, value: l }))}
          />
        </Step>

        <Step n={3} title="Subject" done={Boolean(subject)}>
          <label className="relative block">
            <span className="sr-only">Subject</span>
            <select
              value={subject}
              disabled={!level}
              onChange={(e) => setSubject(e.target.value)}
              className={`${inputClass} appearance-none pr-9 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="">{level ? "Choose a subject" : "Choose a level first"}</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {getSubjectShortName(s)} — {formatSubjectTitle(s)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5e4a35]" aria-hidden="true" />
          </label>
        </Step>
      </div>

      <section aria-live="polite" className={`${card} p-6`}>
        {!ready ? (
          <div className="flex h-full min-h-60 flex-col items-center justify-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f5e9cf] text-[#5e4a35]">
              <TrendingUp size={24} aria-hidden="true" />
            </span>
            <h2 className="kz-serif mt-4 text-[1.5rem]">Choose {nextStep}</h2>
            <p className="kz-body mt-1.5 max-w-xs text-[#5e4a35]">
              Once you&apos;ve picked your programme, level and subject, you&apos;ll see the end-term score you need for each grade.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="kz-serif text-[1.8rem]">{getSubjectShortName(subject) || formatSubjectTitle(subject)}</h2>
              <p className="mt-1 text-[0.85rem] text-[#5e4a35]">
                {PROGRAMMES.find((p) => p.id === programme)?.name} · {level}
              </p>
            </div>
            <p className="flex items-start gap-2.5 rounded-2xl bg-[#e3a936]/15 px-4 py-3 text-[0.85rem] font-medium text-[#5e4a35]">
              <Hourglass size={17} className="mt-px shrink-0 text-[#9c5d14]" aria-hidden="true" />
              We&apos;re adding this course&apos;s grading formula. Soon you&apos;ll enter your quiz and assignment scores here.
            </p>
            <div>
              <h3 className="kz-label mb-2.5 text-[0.66rem] text-[#5e4a35]">End-term score needed</h3>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {GRADE_SCALE.filter((g) => g.grade !== "U").map((g) => (
                  <li key={g.grade} className="flex items-center justify-between rounded-2xl bg-[#f5e9cf] px-4 py-3">
                    <span className="kz-serif text-[1.3rem]">{g.grade}</span>
                    <span className="text-[0.85rem] tabular-nums text-[#5e4a35]" aria-label={`Score for ${g.grade} not available yet`}>
                      —
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
