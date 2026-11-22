"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import KzHeader from "@/components/kz/KzHeader";
import KzFooter from "@/components/kz/KzFooter";
import PageHero, { Segmented } from "@/components/kz/PageHero";
import CommunityPatch from "@/components/communities/CommunityPatch";
import { fetchEvents, getCachedEvents } from "@/lib/api";
import { COMMUNITIES, GROUPS, type Community, type CommunityGroup } from "@/lib/communities";
import { toEvents } from "@/lib/events";
import { withPage, type CommunityPage } from "@/lib/portal/communityPages";

const SOFT = [0.22, 1, 0.36, 1] as const;

type ShownCommunity = Community & { joinUrl?: string; instagramUrl?: string };

function CommunityCard({ c, events, index }: { c: ShownCommunity; events: number; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.5, delay: Math.min(index, 12) * 0.04, ease: SOFT }}
      // a matchbox label: the community's own colour, a printed frame inset from the edge
      className="kz-halftone group relative flex flex-col items-center overflow-hidden p-8 text-center outline-2 -outline-offset-[10px] outline-current transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:rotate-[-1deg] hover:shadow-[6px_6px_0_#1c130c] md:p-9"
      style={{ background: c.bg, color: c.ink, outlineStyle: "solid", ["--dot" as string]: "rgba(0,0,0,0.14)" }}
    >
      <span className="relative inline-block transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.6,0.64,1)] group-hover:-rotate-[10deg] group-hover:scale-105">
        <CommunityPatch c={c} size={84} />
      </span>
      <span className="kz-sign relative mt-6 text-[0.72rem] uppercase tracking-[0.16em] opacity-85">{c.focus}</span>
      <h3 className="kz-serif relative mt-1.5 text-[1.7rem] leading-tight">{c.name}</h3>
      <p className="kz-body relative mt-2 flex-1 opacity-90">{c.line}</p>
      {events > 0 ? (
        <Link
          href={`/events?community=${c.slug}`}
          className="kz-focus kz-sign relative mt-6 inline-flex items-center gap-2 text-[0.8rem] uppercase tracking-[0.12em] underline-offset-4 after:absolute after:inset-0 hover:underline"
        >
          {events === 1 ? "See its event" : `See its ${events} events`}
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      ) : (
        <span className="kz-sign relative mt-6 text-[0.74rem] uppercase tracking-[0.12em] opacity-70">First event coming soon</span>
      )}
      {(c.joinUrl || c.instagramUrl) && (
        // Above the card-wide event link, so these stay clickable on their own.
        <span className="relative z-[1] mt-3 flex items-center justify-center gap-4 text-[0.8rem] font-semibold">
          {c.joinUrl && (
            <a href={c.joinUrl} target="_blank" rel="noopener noreferrer" className="kz-focus underline underline-offset-4">
              Join
            </a>
          )}
          {c.instagramUrl && (
            <a href={c.instagramUrl} target="_blank" rel="noopener noreferrer" className="kz-focus underline underline-offset-4">
              Instagram
            </a>
          )}
        </span>
      )}
    </motion.li>
  );
}

export default function CommunitiesPage() {
  const [group, setGroup] = useState<"all" | CommunityGroup>("all");
  const [rows, setRows] = useState(() => getCachedEvents() || []);
  // What each community's heads have written, laid over the built-in text.
  const [pages, setPages] = useState<Record<string, CommunityPage>>({});

  useEffect(() => {
    let alive = true;
    fetchEvents()
      .then((r) => alive && setRows(r))
      .catch(() => {});
    fetch("/api/communities")
      .then((r) => (r.ok ? r.json() : {}))
      .then((p) => alive && setPages(p || {}))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const eventCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of toEvents(rows)) if (e.community) m.set(e.community.slug, (m.get(e.community.slug) ?? 0) + 1);
    return m;
  }, [rows]);

  const shown = (group === "all" ? COMMUNITIES : COMMUNITIES.filter((c) => c.group === group)).map((c) =>
    withPage(c, pages[c.slug])
  );

  return (
    <div className="kz-font kz-paper min-h-screen bg-[#f5e9cf] text-[#1c130c] selection:bg-[#c8102e]/20">
      <KzHeader />
      <main>
        <PageHero
          ground="rani"
          title={["Find your", "people"]}
          intro="The clubs inside the house — science and code, music and art, games, ideas and more."
        />

        <section className="relative mx-auto max-w-[90rem] px-5 pt-10 sm:px-8 md:px-12">
          <Segmented
            id="community-group"
            value={group}
            onChange={setGroup}
            options={[
              { label: "All", value: "all", count: COMMUNITIES.length },
              ...GROUPS.map((g) => ({ label: g.label, value: g.value, count: COMMUNITIES.filter((c) => c.group === g.value).length })),
            ]}
          />
        </section>

        <section className="mx-auto max-w-[90rem] px-5 pb-24 pt-8 sm:px-8 md:px-12 md:pb-32">
          <motion.ul layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {shown.map((c, i) => (
                <CommunityCard key={c.slug} c={c} events={eventCounts.get(c.slug) ?? 0} index={i} />
              ))}
            </AnimatePresence>
          </motion.ul>
        </section>
      </main>
      <KzFooter />
    </div>
  );
}
