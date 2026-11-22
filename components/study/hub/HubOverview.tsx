"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { AppWindow, ArrowRight, ArrowUpRight, Search, Users } from "lucide-react";
import PageHero from "@/components/kz/PageHero";
import { PanelLink } from "@/components/study/hub/parts";
import { HERITAGE, type Heritage } from "@/lib/heritage";
import {
  HUB_GROUPS,
  HUB_ITEMS,
  QUICK_LINKS,
  STUDY_CIRCLE,
  getHubHref,
  getHubItem,
  type HubItem,
} from "@/lib/study/hub";

/** Panel links keep the Study zone underneath; everything else is a normal link. */
function HubLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  return href.includes("?open=") ? (
    <PanelLink href={href} className={className}>
      {children}
    </PanelLink>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/**
 * The three things students come here for most, as the big doors. Everything
 * else is in the directory below, one search away.
 */
const DOORS: { slug: string; title: string; line: string; art: Heritage; ground: string; ink: string; offset: string }[] = [
  { slug: "notes", title: "Notes", line: "Notes, cheat sheets and links for your subject.", art: HERITAGE.hoopoe, ground: "#f6b51e", ink: "#1c130c", offset: "#e2387a" },
  { slug: "grade-calculator", title: "GPA calculator", line: "Your term GPA and updated CGPA.", art: HERITAGE.elephant, ground: "#c8102e", ink: "#f5e9cf", offset: "#1c130c" },
  { slug: "important-links", title: "Official links", line: "Student portal, forums, calendar and exams.", art: HERITAGE.parrot, ground: "#2343b8", ink: "#f6b51e", offset: "#e2387a" },
];

const ACTION: Record<HubItem["opens"], string> = { panel: "View", page: "Open", link: "Open" };

function Door({ d }: { d: (typeof DOORS)[number] }) {
  const item = getHubItem(d.slug);
  return (
    <HubLink
      href={getHubHref(item)}
      className="kz-focus group relative flex min-h-[15rem] flex-col justify-end overflow-hidden rounded-[1.75rem] p-6 shadow-[0_26px_40px_-30px_rgba(28,19,12,0.8)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 md:min-h-[18rem]"
    >
      <span aria-hidden="true" className="absolute inset-0" style={{ background: d.ground }} />
      <figure className="kz-cutout absolute right-5 top-5 w-[38%] rotate-[4deg] transition-transform duration-500 group-hover:rotate-[-2deg] group-hover:scale-105">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.art.src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
      </figure>
      <span className="relative" style={{ color: d.ink }}>
        <span className="kz-display kz-offset block text-[clamp(2rem,3vw,2.6rem)] leading-[0.95]" style={{ ["--offset" as string]: d.offset }}>
          {d.title}
        </span>
        <span className="mt-2 flex items-end justify-between gap-4">
          <span className="text-[0.95rem] leading-snug opacity-90">{d.line}</span>
          <ArrowUpRight size={22} className="shrink-0 transition-transform duration-500 group-hover:rotate-45" aria-hidden="true" />
        </span>
      </span>
    </HubLink>
  );
}

function Row({ item }: { item: HubItem }) {
  const Icon = item.icon;
  return (
    <HubLink
      href={getHubHref(item)}
      className="kz-focus group flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-[#ebd9b2]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#0f5e48] text-[#f5e9cf]">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[1.02rem] font-semibold text-[#1c130c]">{item.title}</span>
          {item.comingSoon && (
            <span className="rounded-full bg-[#e3a936]/25 px-2 py-0.5 text-[0.72rem] font-semibold text-[#9c5d14]">Coming soon</span>
          )}
        </span>
        <span className="block truncate text-[0.9rem] text-[#5e4a35]">{item.summary}</span>
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 text-[0.85rem] font-semibold text-[#0f5e48] sm:inline-flex">
        {ACTION[item.opens]}
        {item.opens === "panel" ? <AppWindow size={15} aria-hidden="true" /> : <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
      </span>
    </HubLink>
  );
}

export default function HubOverview() {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const match = (...fields: string[]) => !needle || fields.some((f) => f.toLowerCase().includes(needle));

  const items = useMemo(() => HUB_ITEMS.filter((i) => match(i.title, i.summary)), [needle]); // eslint-disable-line react-hooks/exhaustive-deps
  const links = useMemo(() => QUICK_LINKS.filter((l) => match(l.title, l.description)), [needle]); // eslint-disable-line react-hooks/exhaustive-deps
  const nothing = needle && items.length === 0 && links.length === 0;

  return (
    <>
      <PageHero
        ground="forest"
        title={["Study zone"]}
        intro="Notes, grade tools and the official links for the IIT Madras BS degree, in one place."
        aside={
          <label className="flex h-12 w-full items-center gap-3 rounded-full border-2 border-[#1c130c] bg-[#fffaf0] px-4 md:w-[22rem]">
            <Search size={18} className="shrink-0 text-[#5e4a35]" aria-hidden="true" />
            <span className="sr-only">Search the Study zone</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notes, tools, links"
              className="min-w-0 flex-1 bg-transparent text-[1rem] text-[#1c130c] outline-none placeholder:text-[#5e4a35]/70"
            />
          </label>
        }
      />

      <div className="mx-auto max-w-[90rem] space-y-14 px-5 pb-24 pt-10 sm:px-8 md:px-12 md:pb-32">
        {!needle && (
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-3" aria-label="Most used">
            {DOORS.map((d) => (
              <li key={d.slug}>
                <Door d={d} />
              </li>
            ))}
          </ul>
        )}

        {nothing ? (
          <p className="text-[1.05rem] text-[#5e4a35]">
            Nothing matches “{q.trim()}”. Try a subject name in <Link href="/study/notes" className="font-semibold text-[#0f5e48] underline underline-offset-4">Notes</Link>.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <div className="space-y-10">
              {HUB_GROUPS.map((group) => {
                const rows = items.filter((i) => i.group === group.id);
                if (!rows.length) return null;
                return (
                  <section key={group.id} aria-labelledby={`group-${group.id}`}>
                    <h2 id={`group-${group.id}`} className="kz-serif text-[1.6rem]">
                      {group.title}
                    </h2>
                    <p className="mt-0.5 text-[0.95rem] text-[#5e4a35]">{group.description}</p>
                    <ul className="mt-3 divide-y divide-[#1c130c]/10 border-y border-[#1c130c]/10">
                      {rows.map((item) => (
                        <li key={item.slug}>
                          <Row item={item} />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>

            <aside className="space-y-6">
              {links.length > 0 && (
                <section aria-labelledby="official-links">
                  <h2 id="official-links" className="kz-serif text-[1.6rem]">
                    Official sites
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {links.map((link) => (
                      <li key={link.id}>
                        {link.url ? (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="kz-focus group flex items-center justify-between gap-3 rounded-2xl border border-[#1c130c]/12 bg-[#fffaf0] px-4 py-3 hover:border-[#0f5e48]/50"
                          >
                            <span className="min-w-0">
                              <span className="block font-semibold text-[#1c130c]">{link.title}</span>
                              <span className="block truncate text-[0.85rem] text-[#5e4a35]">{link.description}</span>
                            </span>
                            <ArrowUpRight size={16} className="shrink-0 text-[#5e4a35] group-hover:text-[#0f5e48]" aria-hidden="true" />
                            <span className="sr-only">(opens in a new tab)</span>
                          </a>
                        ) : (
                          <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[#1c130c]/20 px-4 py-3">
                            <span className="min-w-0">
                              <span className="block font-semibold text-[#1c130c]/70">{link.title}</span>
                              <span className="block truncate text-[0.85rem] text-[#5e4a35]">{link.description}</span>
                            </span>
                            <span className="shrink-0 text-[0.78rem] font-semibold text-[#9c5d14]">Link soon</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <a
                href={STUDY_CIRCLE.url}
                target="_blank"
                rel="noopener noreferrer"
                className="kz-focus kz-halftone group block rounded-[1.75rem] bg-[#e2387a] p-6 text-[#fff8ec] transition-transform duration-500 hover:-translate-y-1"
                style={{ ["--dot" as string]: "rgba(90,0,30,0.3)" }}
              >
                <Users size={26} className="text-[#f6b51e]" aria-hidden="true" />
                <span className="kz-h2 kz-offset mt-3 block text-[1.8rem] text-[#f6b51e]" style={{ ["--offset" as string]: "#1c130c" }}>
                  {STUDY_CIRCLE.label}
                </span>
                <span className="mt-2 block text-[0.95rem] opacity-95">{STUDY_CIRCLE.description}</span>
                <span className="mt-4 inline-flex items-center gap-2 font-semibold">
                  Sign up <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </a>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
