"use client";

import { ArrowUpRight, Briefcase, GraduationCap, LifeBuoy, PenLine, ScrollText, Sparkles, type LucideIcon } from "lucide-react";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import PageHero from "@/components/kz/PageHero";
import { groupLinks, useIitmLinks } from "@/lib/iitm";

const ICONS: Record<string, LucideIcon> = {
  "Your account": GraduationCap,
  Exams: PenLine,
  "Rules and guidelines": ScrollText,
  Help: LifeBuoy,
  "Student life": Sparkles,
  Careers: Briefcase,
};

/**
 * IITM corner: every official IIT Madras BS link a student needs, grouped by
 * what it's for. Study material lives in the Study zone; this is the programme.
 */
export default function IitmCorner() {
  const links = useIitmLinks();
  const groups = groupLinks(links);
  const key = links.filter((l) => l.key && l.url);

  return (
    <div className="kz-font kz-paper min-h-screen bg-[#f5e9cf] text-[#1c130c] selection:bg-[#c8102e]/20">
      <KzHeader />
      <main>
        <PageHero
          ground="cobalt"
          title={["IITM corner"]}
          intro="The official IIT Madras BS links in one place: your portal, exams, rules, help and student life."
        />

        <div className="mx-auto max-w-[90rem] space-y-12 px-5 pb-24 sm:px-8 md:px-12 md:pb-32">
          {key.length > 0 && (
            <section aria-labelledby="most-used">
              <h2 id="most-used" className="sr-only">
                Most used
              </h2>
              <ul className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4">
                {key.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target={l.url.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="kz-focus group flex h-full flex-col justify-between gap-6 rounded-[1.25rem] bg-[#2343b8] p-5 text-[#f5e9cf] transition-transform hover:-translate-y-1"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="kz-serif text-[1.35rem] leading-tight text-[#f6b51e]">{l.title}</span>
                        <ArrowUpRight size={20} className="shrink-0 transition-transform group-hover:rotate-45" aria-hidden="true" />
                      </span>
                      <span className="text-[0.9rem] opacity-85">{l.description}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => {
              const Icon = ICONS[g.title] ?? ScrollText;
              return (
                <section key={g.title} aria-labelledby={`g-${g.title}`}>
                  <h2 id={`g-${g.title}`} className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c130c] text-[#f6b51e]">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <span className="kz-serif text-[1.45rem]">{g.title}</span>
                  </h2>
                  <ul className="mt-3 divide-y divide-[#1c130c]/10 overflow-hidden rounded-2xl border border-[#1c130c]/10 bg-[#fffaf0]">
                    {g.links.map((l) => (
                      <li key={l.url}>
                        <a
                          href={l.url}
                          target={l.url.startsWith("mailto:") ? undefined : "_blank"}
                          rel="noopener noreferrer"
                          className="kz-focus group flex items-center gap-3 px-4 py-3 hover:bg-[#1c130c]/[0.03]"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold leading-tight">{l.title}</span>
                            <span className="block text-[0.85rem] text-[#5e4a35]">{l.description}</span>
                          </span>
                          <ArrowUpRight size={16} className="shrink-0 text-[#5e4a35] group-hover:text-[#2343b8]" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <p className="text-[0.85rem] text-[#5e4a35]">
            Links change between terms. If one looks out of date, the official portal at study.iitm.ac.in is always right.
          </p>
        </div>
      </main>
      <KzFooter />
    </div>
  );
}
