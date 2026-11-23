"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Landmark, Users } from "lucide-react";
import PageHero from "@/components/kz/PageHero";
import { useStudyLinks } from "@/components/study/hub/parts";
import { HERITAGE, type Heritage } from "@/lib/heritage";
import { GRADING_DOCUMENTS, PROGRAMMES, STUDENT_HANDBOOKS, STUDY_CIRCLE, getHubHref, getHubItem, withLiveLinks } from "@/lib/study/hub";
import { useIitmLinks } from "@/lib/iitm";
import { useSiteImages } from "@/lib/siteImages";
import { cdnImage } from "@/lib/api";

/** The four things students come to the Study zone for. */
const DOORS: { slot: string; slug: string; title: string; line: string; art: Heritage; ground: string; ink: string; offset: string }[] = [
  { slot: "Study zone · Notes", slug: "notes", title: "Notes", line: "Notes, cheat sheets and past papers by subject.", art: HERITAGE.hoopoe, ground: "#f6b51e", ink: "#1c130c", offset: "#e2387a" },
  { slot: "Study zone · Revision sessions", slug: "revision-sessions", title: "Revision sessions", line: "Live revision before exams, and every recording.", art: HERITAGE.waqwaq, ground: "#0f5e48", ink: "#f6b51e", offset: "#1c130c" },
  { slot: "Study zone · YouTube channels", slug: "youtube-channels", title: "YouTube channels", line: "The YouTube channel for each course.", art: HERITAGE.parrot, ground: "#2343b8", ink: "#f6b51e", offset: "#e2387a" },
  { slot: "Study zone · GPA calculator", slug: "grade-calculator", title: "GPA calculator", line: "Your term GPA and updated CGPA.", art: HERITAGE.elephant, ground: "#c8102e", ink: "#f5e9cf", offset: "#1c130c" },
];

function Door({ d }: { d: (typeof DOORS)[number] }) {
  const pic = useSiteImages()[d.slot];
  return (
    <Link
      href={getHubHref(getHubItem(d.slug))}
      className="kz-focus group relative flex min-h-[13rem] flex-col justify-end overflow-hidden rounded-[1.5rem] p-5 shadow-[0_26px_40px_-30px_rgba(28,19,12,0.8)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 md:min-h-[15rem]"
    >
      <span aria-hidden="true" className="absolute inset-0" style={{ background: d.ground }} />
      <figure className="kz-cutout absolute right-4 top-4 w-[34%] rotate-[4deg] transition-transform duration-500 group-hover:rotate-[-2deg] group-hover:scale-105">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pic ? cdnImage(pic.url, 500) : d.art.src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
      </figure>
      <span className="relative" style={{ color: d.ink }}>
        <span className="kz-display kz-offset block text-[clamp(1.7rem,2.4vw,2.2rem)] leading-[0.95]" style={{ ["--offset" as string]: d.offset }}>
          {d.title}
        </span>
        <span className="mt-2 flex items-end justify-between gap-3">
          <span className="text-[0.92rem] leading-snug opacity-90">{d.line}</span>
          <ArrowUpRight size={20} className="shrink-0 transition-transform duration-500 group-hover:rotate-45" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

/** Each programme's handbook and current grading document, one tap each. */
function Handbooks() {
  const rows = useStudyLinks();
  const handbooks = withLiveLinks(STUDENT_HANDBOOKS, rows, "Student Handbook");
  const grading = withLiveLinks(GRADING_DOCUMENTS, rows, "Grading Doc");
  const btn = "kz-focus inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[0.88rem] font-semibold transition-colors";
  return (
    <section aria-labelledby="handbooks" className="space-y-4">
      <div>
        <h2 id="handbooks" className="kz-serif text-[1.6rem]">
          Handbooks and grading
        </h2>
        <p className="mt-0.5 text-[0.95rem] text-[#5e4a35]">The rules for your programme and how each course is graded this term.</p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PROGRAMMES.map((p) => {
          const h = handbooks.find((d) => d.programme === p.id)?.url;
          const g = grading.find((d) => d.programme === p.id)?.url;
          return (
            <li key={p.id} className="rounded-2xl border border-[#1c130c]/10 bg-[#fffaf0] p-4">
              <p className="flex items-baseline gap-2">
                <span className="kz-sign rounded-md bg-[#1c130c] px-1.5 py-0.5 text-[0.75rem] text-[#f6b51e]">{p.short}</span>
                <span className="min-w-0 font-semibold leading-tight text-[#1c130c]">{p.name}</span>
              </p>
              <div className="mt-3 flex gap-2">
                {h && (
                  <a href={h} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#0f5e48] text-[#f5e9cf] hover:bg-[#0a3b2f]`}>
                    Handbook <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                )}
                {g && (
                  <a href={g} target="_blank" rel="noopener noreferrer" className={`${btn} border-2 border-[#1c130c] text-[#1c130c] hover:bg-[#1c130c] hover:text-[#f5e9cf]`}>
                    Grading <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The programme's key links, with the way into the IITM corner. */
function IitmCard() {
  const key = useIitmLinks().filter((l) => l.key && l.url).slice(0, 4);
  return (
    <section aria-labelledby="iitm-card" className="rounded-[1.5rem] border border-[#1c130c]/10 bg-[#fffaf0] p-5">
      <h2 id="iitm-card" className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#2343b8] text-[#f6b51e]">
          <Landmark size={17} aria-hidden="true" />
        </span>
        <span className="kz-serif text-[1.4rem]">IITM corner</span>
      </h2>
      <p className="mt-1.5 text-[0.9rem] text-[#5e4a35]">The programme&rsquo;s official portals, exams, rules and help.</p>
      <ul className="mt-3 space-y-1">
        {key.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target={l.url.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="kz-focus group flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-[0.92rem] font-semibold hover:bg-[#1c130c]/5"
            >
              {l.title}
              <ArrowUpRight size={15} className="shrink-0 text-[#5e4a35] group-hover:text-[#2343b8]" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <Link href="/iitm" className="kz-focus mt-3 inline-flex items-center gap-1.5 text-[0.92rem] font-bold text-[#2343b8] hover:underline">
        Every official link <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </section>
  );
}

/**
 * The Study zone: four doors for what students come for, the programme's
 * handbooks, and, beside them, the study circle and the way to the IITM
 * corner (official links live there, not here).
 */
export default function HubOverview() {
  return (
    <>
      <PageHero ground="forest" title={["Study zone"]} intro="Notes, revision sessions, course channels and grade tools for the IIT Madras BS degree." />

      <div className="mx-auto max-w-[90rem] space-y-14 px-5 pb-24 pt-4 sm:px-8 md:px-12 md:pb-32">
        <ul className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 xl:grid-cols-4" aria-label="Study zone">
          {DOORS.map((d) => (
            <li key={d.slug}>
              <Door d={d} />
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <Handbooks />

          <aside className="space-y-5">
            <a
              href={STUDY_CIRCLE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="kz-focus kz-halftone group block rounded-[1.5rem] bg-[#e2387a] p-6 text-[#fff8ec] transition-transform duration-500 hover:-translate-y-1"
              style={{ ["--dot" as string]: "rgba(90,0,30,0.3)" }}
            >
              <Users size={24} className="text-[#f6b51e]" aria-hidden="true" />
              <span className="kz-h2 kz-offset mt-3 block text-[1.7rem] text-[#f6b51e]" style={{ ["--offset" as string]: "#1c130c" }}>
                {STUDY_CIRCLE.label}
              </span>
              <span className="mt-3 inline-block rounded-full bg-[#1c130c] px-3 py-1 text-[0.78rem] font-semibold text-[#f6b51e]">Open to all BS students</span>
              <span className="mt-2 block text-[0.95rem] opacity-95">{STUDY_CIRCLE.description}</span>
              <span className="mt-4 inline-flex items-center gap-2 font-semibold">
                Sign up <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </a>
            <IitmCard />
          </aside>
        </div>
      </div>
    </>
  );
}
