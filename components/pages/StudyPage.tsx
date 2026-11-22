"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import PageHero from "@/components/kz/PageHero";
import StudySection, { COMMUNITY } from "@/components/StudySection";
import { HERITAGE, type Heritage } from "@/lib/heritage";

const DOORS: { title: string; line: string; href: string; art: Heritage; ground: string; ink: string; offset: string; texture: string }[] = [
  { title: "Resource hub", line: "Handbooks, grading rules, important links and grade tools.", href: "/hub", art: HERITAGE.parrot, ground: "#2343b8", ink: "#f6b51e", offset: "#e2387a", texture: "kz-halftone" },
  { title: "Notes", line: "Notes, cheat sheets and links shared by students, by subject.", href: "/resources", art: HERITAGE.hoopoe, ground: "#f6b51e", ink: "#1c130c", offset: "#e2387a", texture: "kz-halftone" },
  { title: "GPA calculator", line: "Turn your grades into a term GPA and an updated CGPA.", href: "/hub/grade-calculator", art: HERITAGE.elephant, ground: "#c8102e", ink: "#f5e9cf", offset: "#1c130c", texture: "kz-cloth" },
];

export default function StudyPage() {
  return (
    <div className="kz-font kz-paper min-h-screen bg-[#f5e9cf] text-[#1c130c] selection:bg-[#e2387a]/30">
      <KzHeader />
      <main>
        <PageHero ground="forest" title={["Study Zone"]} intro="Notes, planners and tools for the IIT Madras BS degree, and people to study with." />

        <section className="mx-auto max-w-[90rem] px-5 pb-16 pt-14 sm:px-8 md:px-12">
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {DOORS.map((d) => (
              <li key={d.title}>
                <Link
                  href={d.href}
                  className={`kz-focus group relative flex aspect-[3/4] flex-col justify-between overflow-hidden p-6 shadow-[0_26px_40px_-28px_rgba(28,19,12,0.8)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:rotate-[-1deg] ${d.texture}`}
                  style={{ background: d.ground, color: d.ink, ["--dot" as string]: "rgba(0,0,0,0.18)" }}
                >
                  <figure className="kz-cutout absolute left-1/2 top-[32%] w-[62%] -translate-x-1/2 -translate-y-1/2 rotate-[3deg] transition-transform duration-500 group-hover:rotate-[-2deg] group-hover:scale-105">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.art.src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  </figure>
                  <span className="relative self-end">
                    <ArrowUpRight size={22} className="transition-transform duration-500 group-hover:rotate-45" />
                  </span>
                  <span className="relative">
                    <h2 className="kz-display kz-offset text-[clamp(2.2rem,3.4vw,3rem)] leading-[0.95]" style={{ ["--offset" as string]: d.offset }}>
                      {d.title}
                    </h2>
                    <p className="mt-3 text-[0.95rem] leading-snug opacity-90">{d.line}</p>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <a
            href={COMMUNITY.url}
            target="_blank"
            rel="noopener noreferrer"
            className="kz-focus kz-halftone group mt-8 flex flex-col items-start justify-between gap-6 bg-[#e2387a] p-8 text-[#fff8ec] transition-transform duration-500 hover:-translate-y-1 md:flex-row md:items-center md:p-10"
            style={{ ["--dot" as string]: "rgba(90,0,30,0.3)" }}
          >
            <span>
              <span className="kz-h2 kz-offset block text-[clamp(1.9rem,3.2vw,2.8rem)] text-[#f6b51e]" style={{ ["--offset" as string]: "#1c130c" }}>
                {COMMUNITY.label}
              </span>
              <span className="kz-lead mt-3 block max-w-2xl opacity-95">{COMMUNITY.description}</span>
            </span>
            <span className="kz-btn shrink-0 bg-[#f6b51e] text-[#1c130c]">
              Join the circle <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </a>
        </section>

        <StudySection bare />
      </main>
      <KzFooter />
    </div>
  );
}
